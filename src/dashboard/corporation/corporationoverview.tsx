import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
	Box,
	Paper,
	Typography,
	Tabs,
	Tab,
	Grid,
	FormControl,
	Select,
	MenuItem,
	ToggleButtonGroup,
	ToggleButton,
	Stack,
	Tooltip,
	type SelectChangeEvent,
	alpha,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import GroupsIcon from "@mui/icons-material/Groups";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import { fetchClient } from "../../utils/apiclient";
import { useGlobalData } from "../../context/globaldatacontext";
import { CorpProductionView } from "./corpproductionview";
import { CorpFullSummaryView } from "./corpfullsummaryview";
import CorpMembersTable from "./corpmemberstable";
import { extractRecipeMaterials } from "./utils";

const glassyStyle = {
	bgcolor: "#06060e",
	backdropFilter: "blur(16px)",
	WebkitBackdropFilter: "blur(16px)",
	border: "1px solid rgba(123, 104, 238, 0.2)",
	boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6)",
};

const EXCHANGE_CURRENCY_CODE_MAP: Record<string, string> = {
	IC1: "ICA",
	NC1: "NCC",
	AI1: "AIC",
	CI1: "CIS",
	CI2: "CIS",
	CORP: "CORP",
};

import { useTheme, useMediaQuery } from "@mui/material";

interface FuelConsumer {
	player_name: string;
	total_stl: number;
	total_ftl: number;
	daily_stl: number;
	daily_ftl: number;
	flights_count: number;
}

interface FuelConsumptionData {
	days: number;
	total_flights: number;
	total_stl: number;
	total_ftl: number;
	daily_average: {
		stl: number;
		ftl: number;
		flights: number;
	};
	prices: {
		corp: { SF: number; FF: number };
		cx_ic1: { SF: number; FF: number };
	};
	corp_pricing: {
		stl_cost: number;
		ftl_cost: number;
		total_cost: number;
	};
	cx_pricing: {
		stl_cost: number;
		ftl_cost: number;
		total_cost: number;
	};
	savings_vs_cx: number;
	consumers?: FuelConsumer[];
}

const formatFuel = (val: number): string => {
	if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
	if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
	return val.toLocaleString();
};

export const CorporationOverview: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const {
		marketData = {},
		corpPrices = {},
		corpData = [],
		fetchCorporationData,
	} = useGlobalData();
	const [selectedCorpFilter, setSelectedCorpFilter] = useState<string>("ALL");
	const [tabValue, setTabValue] = useState<number>(0);

	const [fuelData, setFuelData] = useState<FuelConsumptionData | null>(null);
	const [isFuelLoading, setIsFuelLoading] = useState<boolean>(false);

	useEffect(() => {
		let isMounted = true;
		const fetchFuel = async () => {
			setIsFuelLoading(true);
			try {
				const res = await fetchClient(
					"/internal/corporation/fuel-consumption?days=7",
				);
				if (res?.ok) {
					const data = await res.json();
					if (isMounted) setFuelData(data);
				}
			} catch (err) {
				console.error("Failed to fetch fuel consumption:", err);
			} finally {
				if (isMounted) setIsFuelLoading(false);
			}
		};
		fetchFuel();
		return () => {
			isMounted = false;
		};
	}, []);

	const [pricingMode, setPricingMode] = useState<"CX" | "CORP">("CX");
	const [selectedExchange, setSelectedExchange] = useState<string>(() => {
		return localStorage.getItem("corp_selected_exchange") || "IC1";
	});

	const [hideZeroFlow, setHideZeroFlow] = useState<boolean>(() => {
		const saved = localStorage.getItem("corp_hide_zero_flow");
		return saved !== null ? saved === "true" : true;
	});

	const [recipeOverrides, setRecipeOverrides] = useState<
		Record<string, number>
	>(() => {
		try {
			const saved = localStorage.getItem("corp_recipe_overrides");
			return saved ? JSON.parse(saved) : {};
		} catch {
			return {};
		}
	});

	const handleExchangeChange = useCallback((ex: string) => {
		setSelectedExchange(ex);
		localStorage.setItem("corp_selected_exchange", ex);
	}, []);

	const handleHideZeroFlowChange = useCallback((val: boolean) => {
		setHideZeroFlow(val);
		localStorage.setItem("corp_hide_zero_flow", String(val));
	}, []);

	const handleRecipeOverrideChange = useCallback(
		(ticker: string, idx: number) => {
			setRecipeOverrides((prev) => {
				const updated = { ...prev, [ticker]: idx };
				localStorage.setItem("corp_recipe_overrides", JSON.stringify(updated));
				return updated;
			});
		},
		[],
	);

	const corpList = useMemo(() => {
		return corpData.map((c) => ({ code: c.code, name: c.name }));
	}, [corpData]);

	const activeViewData = useMemo(() => {
		if (corpData.length === 0) return null;
		let baseCorp: any = null;
		if (selectedCorpFilter === "ALL") {
			const aggregatedSummaryMap = new Map<string, any>();
			const allMembers: any[] = [];
			const aggregatedBalancesMap = new Map<string, number>();

			corpData.forEach((corp) => {
				corp.members?.forEach((m) => allMembers.push(m));
				corp.balances?.forEach((b) => {
					const curr = b.currency || "ICA";
					aggregatedBalancesMap.set(
						curr,
						(aggregatedBalancesMap.get(curr) || 0) + (b.amount || 0),
					);
				});
				corp.productionSummary?.forEach((item) => {
					const existing = aggregatedSummaryMap.get(item.ticker);
					if (existing) {
						existing.productionTotal += item.productionTotal || 0;
						existing.consumptionTotal += item.consumptionTotal || 0;
						existing.net += item.net || 0;
						existing.storageQty += item.storageQty || 0;
						existing.producers = [
							...(existing.producers || []),
							...(item.producers || []),
						];
						existing.consumers = [
							...(existing.consumers || []),
							...(item.consumers || []),
						];

						if (
							Array.isArray(item.userRecipesUsed) &&
							item.userRecipesUsed.length > 0
						) {
							if (!existing.userRecipesUsed) {
								existing.userRecipesUsed = [];
							}
							item.userRecipesUsed.forEach((newRec: any) => {
								let recMatch = existing.userRecipesUsed.find(
									(r: any) => r.recipeKey === newRec.recipeKey,
								);
								if (!recMatch) {
									const { inputMaterials } = extractRecipeMaterials(
										newRec.inputs,
										newRec.outputTicker,
										newRec.outputAmount,
									);
									recMatch = {
										recipeKey: newRec.recipeKey,
										building: newRec.building,
										dailyOutput: 0,
										dailyCycles: 0,
										outputAmount: newRec.outputAmount,
										inputs: newRec.inputs || {},
										inputMaterials: inputMaterials,
										users: [],
									};
									existing.userRecipesUsed.push(recMatch);
								}
								if (Array.isArray(newRec.users)) {
									newRec.users.forEach((u: any) => {
										if (
											!recMatch.users.some(
												(exU: any) =>
													exU.player === u.player && exU.loc === u.loc,
											)
										) {
											recMatch.users.push(u);
										}
									});
								}
								recMatch.dailyOutput = recMatch.users.reduce(
									(sum: number, u: any) => sum + (u.dailyOutput || 0),
									0,
								);
								recMatch.dailyCycles = recMatch.users.reduce(
									(sum: number, u: any) => sum + (u.dailyCycles || 0),
									0,
								);
							});
						}
					} else {
						const newItem = JSON.parse(JSON.stringify(item));
						aggregatedSummaryMap.set(item.ticker, newItem);
					}
				});
			});

			const aggregatedBalances = Array.from(
				aggregatedBalancesMap.entries(),
			).map(([currency, amount]) => ({
				currency,
				amount,
			}));

			baseCorp = {
				code: "ALL",
				name: "All Corporations Aggregated",
				members: allMembers,
				productionSummary: Array.from(aggregatedSummaryMap.values()),
				balances: aggregatedBalances,
			};
		} else {
			baseCorp =
				corpData.find((c) => c.code === selectedCorpFilter) || corpData[0];
		}

		if (!baseCorp) return null;

		// Inject rolling daily fuel consumption (SF & FF) into productionSummary
		if (fuelData && fuelData.consumers && fuelData.consumers.length > 0) {
			const prodSummaryCopy = baseCorp.productionSummary
				? baseCorp.productionSummary.map((item) => ({ ...item }))
				: [];

			const fuelConfigs: Array<{
				ticker: "SF" | "FF";
				name: string;
				dailyTotal: number;
				getMemberDaily: (c: FuelConsumer) => number;
				getMemberTotal: (c: FuelConsumer) => number;
			}> = [
				{
					ticker: "SF",
					name: "Standard Fuel",
					dailyTotal: fuelData.daily_average?.stl || 0,
					getMemberDaily: (c) => c.daily_stl || 0,
					getMemberTotal: (c) => c.total_stl || 0,
				},
				{
					ticker: "FF",
					name: "FTL Fuel",
					dailyTotal: fuelData.daily_average?.ftl || 0,
					getMemberDaily: (c) => c.daily_ftl || 0,
					getMemberTotal: (c) => c.total_ftl || 0,
				},
			];

			fuelConfigs.forEach((cfg) => {
				const activeFuelConsumers: ProducerConsumerItem[] = fuelData
					.consumers!.filter((c) => cfg.getMemberTotal(c) > 0)
					.map((c) => ({
						player: c.player_name,
						loc: "Fleet",
						amount: cfg.getMemberDaily(c),
						isAccurate: true,
					}));

				if (activeFuelConsumers.length === 0 && cfg.dailyTotal === 0) return;

				let item = prodSummaryCopy.find((p) => p.ticker === cfg.ticker);
				if (!item) {
					item = {
						ticker: cfg.ticker,
						name: cfg.name,
						production: 0,
						productionTotal: 0,
						productionAccurate: 0,
						productionEstimated: 0,
						consumption: 0,
						consumptionTotal: 0,
						consumptionAccurate: 0,
						consumptionEstimated: 0,
						net: 0,
						storageQty: 0,
						price: 0,
						marketSharePct: 0,
						producers: [],
						consumers: [],
					};
					prodSummaryCopy.push(item);
				}

				// Merge fuel consumers without duplicating if re-computed
				const existingNonFleetConsumers = (item.consumers || []).filter(
					(c) => c.loc !== "Fleet",
				);
				item.consumers = [...existingNonFleetConsumers, ...activeFuelConsumers];

				// Recalculate consumptionTotal and net
				const nonFleetCons = existingNonFleetConsumers.reduce(
					(sum, c) => sum + (c.amount || 0),
					0,
				);
				const fleetCons = activeFuelConsumers.reduce(
					(sum, c) => sum + (c.amount || 0),
					0,
				);
				item.consumptionTotal = nonFleetCons + fleetCons;
				item.consumptionAccurate = (item.consumptionAccurate || 0) + fleetCons;
				item.consumption = item.consumptionTotal;
				item.net = (item.productionTotal || 0) - item.consumptionTotal;
			});

			return {
				...baseCorp,
				productionSummary: prodSummaryCopy,
			};
		}

		return baseCorp;
	}, [corpData, selectedCorpFilter, fuelData]);

	const activeCurrencyCode =
		pricingMode === "CORP"
			? "CORP"
			: EXCHANGE_CURRENCY_CODE_MAP[selectedExchange] || selectedExchange;

	const financialTotals = useMemo(() => {
		if (!activeViewData || !activeViewData.productionSummary) {
			return {
				totalEstRevenue: 0,
				totalEstExpense: 0,
				totalNetValue: 0,
				totalStockQty: 0,
			};
		}

		let totalEstRevenue = 0;
		let totalEstExpense = 0;
		let totalStockQty = 0;

		const effMode = pricingMode === "CORP" ? "CORP" : selectedExchange;

		activeViewData.productionSummary.forEach((item) => {
			const ticker = item.ticker;
			const prod = item.productionTotal || 0;
			const cons = item.consumptionTotal || 0;
			const storageQty = item.storageQty || 0;

			let price = item.price || 0;
			if (effMode === "CORP") {
				price =
					corpPrices[ticker] ||
					(marketData[ticker] && marketData[ticker].corp_price) ||
					price;
			} else {
				let mObj: any =
					marketData[ticker] || marketData[`${ticker}.${effMode}`];
				if (mObj && typeof mObj === "object") {
					const p =
						mObj[`${effMode}-Average`] ||
						mObj[`${effMode}-AskPrice`] ||
						mObj[`${effMode}-BidPrice`] ||
						mObj.Average ||
						mObj.average ||
						mObj.AskPrice ||
						mObj.askPrice ||
						mObj.price ||
						0;
					if (p > 0) price = p;
				}
			}

			const estRevenue = prod * price;
			const estExpense = cons * price;

			totalEstRevenue += estRevenue;
			totalEstExpense += estExpense;
			totalStockQty += storageQty;
		});

		return {
			totalEstRevenue,
			totalEstExpense,
			totalNetValue: totalEstRevenue - totalEstExpense,
			totalStockQty,
		};
	}, [activeViewData, pricingMode, selectedExchange, marketData, corpPrices]);

	const memberCounts = useMemo(() => {
		const members = activeViewData?.members || [];
		const total = members.length;
		const now = Date.now();
		const active7d = members.filter((m) => {
			if (!m.lastActive) return false;
			const diff = now - new Date(m.lastActive).getTime();
			const days = diff / (1000 * 60 * 60 * 24);
			return days < 7;
		}).length;

		return {
			active7d,
			total,
		};
	}, [activeViewData]);

	const displayName = activeViewData
		? selectedCorpFilter === "ALL"
			? "Combined"
			: `${activeViewData.code} - ${activeViewData.name}`
		: "Corporation Dashboard";

	const widgets = [
		{
			title: "EST. REVENUE / D",
			value: `${financialTotals.totalEstRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${activeCurrencyCode}`,
			icon: <TrendingUpIcon sx={{ color: theme.palette.success.main }} />,
			color: theme.palette.success.main,
		},
		{
			title: "EST. EXPENSE / D",
			value: `${financialTotals.totalEstExpense.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${activeCurrencyCode}`,
			icon: <ShoppingCartIcon sx={{ color: theme.palette.error.main }} />,
			color: theme.palette.error.main,
		},
		{
			title: "EST. NET VALUE / D",
			value: `${financialTotals.totalNetValue >= 0 ? "+" : ""}${financialTotals.totalNetValue.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${activeCurrencyCode}`,
			icon: (
				<AccountBalanceIcon
					sx={{
						color:
							financialTotals.totalNetValue >= 0
								? theme.palette.success.main
								: theme.palette.error.main,
					}}
				/>
			),
			color:
				financialTotals.totalNetValue >= 0
					? theme.palette.success.main
					: theme.palette.error.main,
		},
		{
			title: "CORP MEMBERS",
			value: `${memberCounts.active7d} Active · ${memberCounts.total} Total`,
			icon: <GroupsIcon sx={{ color: theme.palette.primary.light }} />,
			color: theme.palette.primary.light,
			tooltip: (
				<Box sx={{ p: 0.5, maxWidth: 220 }}>
					<Typography
						variant="subtitle2"
						sx={{
							fontWeight: 800,
							mb: 0.5,
							color: theme.palette.primary.light,
							fontSize: "0.8rem",
						}}
					>
						Corporation Members
					</Typography>
					<Typography variant="body2" sx={{ fontSize: "0.75rem", mb: 0.25 }}>
						Active (&lt; 7 days): <strong>{memberCounts.active7d}</strong>
					</Typography>
					<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
						Total Shareholders: <strong>{memberCounts.total}</strong>
					</Typography>
				</Box>
			),
		},
		{
			title: "7D FUEL USAGE",
			value: isFuelLoading
				? "Loading..."
				: fuelData
					? `${formatFuel(fuelData.total_stl)} SF · ${formatFuel(fuelData.total_ftl)} FF`
					: "—",
			icon: <LocalGasStationIcon sx={{ color: theme.palette.warning.main }} />,
			color: theme.palette.warning.main,
			tooltip: fuelData ? (
				<Box sx={{ p: 0.5, maxWidth: 280 }}>
					<Typography
						variant="subtitle2"
						sx={{
							fontWeight: 800,
							mb: 0.75,
							color: theme.palette.warning.light,
							fontSize: "0.8rem",
						}}
					>
						Rolling 7-Day Fuel Usage
					</Typography>
					<Typography variant="body2" sx={{ fontSize: "0.75rem", mb: 0.25 }}>
						Total Flights:{" "}
						<strong>{fuelData.total_flights.toLocaleString()}</strong>
					</Typography>
					<Typography variant="body2" sx={{ fontSize: "0.75rem", mb: 0.25 }}>
						STL Fuel: <strong>{fuelData.total_stl.toLocaleString()} SF</strong>{" "}
						(~{Math.round(fuelData.daily_average.stl).toLocaleString()} / d)
					</Typography>
					<Typography variant="body2" sx={{ fontSize: "0.75rem", mb: 0.75 }}>
						FTL Fuel: <strong>{fuelData.total_ftl.toLocaleString()} FF</strong>{" "}
						(~{Math.round(fuelData.daily_average.ftl).toLocaleString()} / d)
					</Typography>
					<Box
						sx={{
							borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
							pt: 0.75,
							display: "flex",
							flexDirection: "column",
							gap: 0.25,
						}}
					>
						<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
							Corp Cost:{" "}
							<strong>
								{Math.round(fuelData.corp_pricing.total_cost).toLocaleString()}{" "}
								ICA
							</strong>
						</Typography>
						<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
							CX IC1 Cost:{" "}
							<strong>
								{Math.round(fuelData.cx_pricing.total_cost).toLocaleString()}{" "}
								ICA
							</strong>
						</Typography>
					</Box>
				</Box>
			) : undefined,
		},
	];

	return (
		<Box
			sx={{
				height: "100%",
				minHeight: 0,
				width: "100%",
				display: "flex",
				flexDirection: "column",
				bgcolor: theme.palette.background.default,
				p: 0,
				gap: 1,
				overflow: "hidden",
			}}
		>
			{/* Top Header Card */}
			<Paper
				elevation={0}
				sx={{
					bgcolor: alpha(theme.palette.background.paper, 0.4),
					backdropFilter: "blur(16px)",
					border: "none",
					p: { xs: 1.25, sm: 1.5 },
					borderRadius: { xs: 2, sm: 2.5 },
					flexShrink: 0,
					display: "flex",
					flexDirection: "column",
					gap: 1.25,
				}}
			>
				{/* Top Controls Bar */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 1,
						flexWrap: "wrap",
						width: "100%",
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							flex: 1,
							minWidth: { xs: "100%", sm: "auto" },
						}}
					>
						<Typography
							variant="h6"
							sx={{
								fontWeight: 800,
								color: theme.palette.text.primary,
								letterSpacing: "-0.01em",
								fontSize: { xs: "1rem", sm: "1.25rem" },
							}}
						>
							{displayName}
						</Typography>
					</Box>

					{/* Selector Dropdowns Stack */}
					<Stack
						direction="row"
						spacing={1}
						alignItems="center"
						sx={{
							width: { xs: "100%", sm: "auto" },
							gap: { xs: 1, sm: 0 },
							flexWrap: "wrap",
						}}
					>
						{corpList.length > 0 && (
							<FormControl
								size="small"
								sx={{
									minWidth: { xs: 120, sm: 140 },
									flex: { xs: 1, sm: "none" },
								}}
							>
								<Select
									value={selectedCorpFilter}
									onChange={(e: SelectChangeEvent) =>
										setSelectedCorpFilter(e.target.value)
									}
									displayEmpty
									variant="outlined"
									sx={{
										height: 32,
										fontSize: "0.75rem",
										fontWeight: 700,
										color: theme.palette.primary.light,
										bgcolor: alpha(theme.palette.action.hover, 0.05),
										borderRadius: 1.5,
										"& .MuiOutlinedInput-notchedOutline": {
											borderColor: alpha(theme.palette.divider, 0.3),
										},
									}}
								>
									<MenuItem
										value="ALL"
										sx={{ fontSize: "0.75rem", fontWeight: 700 }}
									>
										Combined
									</MenuItem>
									{corpList.map((corp) => (
										<MenuItem
											key={corp.code}
											value={corp.code}
											sx={{ fontSize: "0.75rem" }}
										>
											{corp.code} - {corp.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}

						{pricingMode === "CX" && (
							<FormControl
								size="small"
								sx={{
									minWidth: { xs: 110, sm: 130 },
									flex: { xs: 1, sm: "none" },
								}}
							>
								<Select
									value={selectedExchange}
									onChange={(e: SelectChangeEvent) =>
										handleExchangeChange(e.target.value)
									}
									variant="outlined"
									sx={{
										height: 32,
										fontSize: "0.75rem",
										fontWeight: 800,
										color: theme.palette.success.light,
										bgcolor: alpha(theme.palette.action.hover, 0.05),
										borderRadius: 1.5,
										"& .MuiOutlinedInput-notchedOutline": {
											borderColor: alpha(theme.palette.success.main, 0.3),
										},
									}}
								>
									<MenuItem
										value="IC1"
										sx={{ fontSize: "0.75rem", fontWeight: 700 }}
									>
										CX: IC1 (Default)
									</MenuItem>
									<MenuItem
										value="NC1"
										sx={{ fontSize: "0.75rem", fontWeight: 700 }}
									>
										CX: NC1
									</MenuItem>
									<MenuItem
										value="AI1"
										sx={{ fontSize: "0.75rem", fontWeight: 700 }}
									>
										CX: AI1
									</MenuItem>
									<MenuItem
										value="CI1"
										sx={{ fontSize: "0.75rem", fontWeight: 700 }}
									>
										CX: CI1
									</MenuItem>
									<MenuItem
										value="CI2"
										sx={{ fontSize: "0.75rem", fontWeight: 700 }}
									>
										CX: CI2
									</MenuItem>
								</Select>
							</FormControl>
						)}

						<ToggleButtonGroup
							size="small"
							value={pricingMode}
							exclusive
							onChange={(_, v) => v && setPricingMode(v)}
							sx={{
								bgcolor: alpha(theme.palette.action.hover, 0.05),
								border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
								borderRadius: 1.5,
								height: 32,
								width: { xs: "100%", sm: "auto" },
								"& .MuiToggleButton-root": {
									flex: { xs: 1, sm: "none" },
									color: theme.palette.text.secondary,
									fontSize: "0.75rem",
									fontWeight: 800,
									px: 1.25,
									border: 0,
									"&.Mui-selected": {
										color: theme.palette.success.light,
										bgcolor: alpha(theme.palette.success.main, 0.15),
									},
								},
							}}
						>
							<ToggleButton value="CX">CX PRICE</ToggleButton>
							<ToggleButton value="CORP">CORP PRICE</ToggleButton>
						</ToggleButtonGroup>
					</Stack>
				</Box>

				{/* KPI Cards Grid */}
				<Grid
					container
					spacing={1.25}
					sx={{ width: "100%", justifyContent: "center" }}
				>
					{widgets.map((w, i) => {
						const cardContent = (
							<Box
								sx={{
									py: 1,
									px: 1.5,
									borderRadius: 2,
									cursor: w.tooltip ? "help" : "default",
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
									alignItems: "center",
									bgcolor: alpha(theme.palette.action.hover, 0.04),
									border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
									height: "100%",
									transition: "all 0.2s ease",
									"&:hover": {
										borderColor: alpha(w.color, 0.4),
										bgcolor: alpha(w.color, 0.06),
									},
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 0.75,
										mb: 0.25,
									}}
								>
									{React.cloneElement(w.icon, {
										sx: { fontSize: 15, color: w.color },
									})}
									<Typography
										variant="caption"
										sx={{
											color: theme.palette.text.secondary,
											fontWeight: 700,
											fontSize: "0.65rem",
											textTransform: "uppercase",
											letterSpacing: "0.04em",
											whiteSpace: "nowrap",
										}}
									>
										{w.title}
									</Typography>
								</Box>
								<Typography
									variant="body2"
									component="div"
									sx={{
										color: theme.palette.text.primary,
										fontWeight: 800,
										fontSize: { xs: "0.8rem", sm: "0.9rem" },
										whiteSpace: "nowrap",
									}}
								>
									{w.value}
								</Typography>
							</Box>
						);

						return (
							<Grid item xs={6} sm={4} md={2.4} key={i}>
								{w.tooltip ? (
									<Tooltip title={w.tooltip} arrow placement="bottom">
										{cardContent}
									</Tooltip>
								) : (
									cardContent
								)}
							</Grid>
						);
					})}
				</Grid>
			</Paper>

			{/* Main Content View Container */}
			<Paper
				elevation={0}
				sx={{
					bgcolor: alpha(theme.palette.background.paper, 0.4),
					backdropFilter: "blur(16px)",
					border: "none",
					p: 0,
					borderRadius: { xs: 2, sm: 2.5 },
					flex: 1,
					minHeight: 0,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				}}
			>
				<Tabs
					value={tabValue}
					onChange={(_, v) => setTabValue(v)}
					centered
					variant={isMobile ? "scrollable" : "standard"}
					scrollButtons="auto"
					allowScrollButtonsMobile
					sx={{
						borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						bgcolor: alpha(theme.palette.background.paper, 0.6),
						flexShrink: 0,
						borderRadius: "10px 10px 0 0",
						"& .MuiTab-root": {
							px: { xs: 2, sm: 4 },
							py: 1,
							fontWeight: 800,
							fontSize: { xs: "0.75rem", sm: "0.85rem" },
							minHeight: 40,
							color: theme.palette.text.secondary,
							"&.Mui-selected": {
								color: theme.palette.primary.light,
							},
						},
						"& .MuiTabs-indicator": {
							bgcolor: theme.palette.primary.light,
							height: 3,
							borderRadius: "3px 3px 0 0",
						},
					}}
				>
					<Tab label="PRODUCTION SUMMARY" />
					<Tab label="CORP MEMBERS" />
					<Tab label="FULL SUMMARY" />
				</Tabs>

				<Box
					sx={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						overflow: "hidden",
						minHeight: 0,
					}}
				>
					{tabValue === 0 && (
						<CorpProductionView
							productionSummary={activeViewData?.productionSummary || []}
							members={activeViewData?.members || []}
							pricingMode={pricingMode}
							onPricingModeChange={setPricingMode}
							selectedExchange={selectedExchange}
							onSelectedExchangeChange={handleExchangeChange}
							hideZeroFlow={hideZeroFlow}
							onHideZeroFlowChange={handleHideZeroFlowChange}
							recipeOverrides={recipeOverrides}
							onRecipeOverrideChange={handleRecipeOverrideChange}
						/>
					)}
					{tabValue === 1 && (
						<CorpMembersTable
							members={activeViewData?.members || []}
							corpCode={activeViewData?.code}
						/>
					)}
					{tabValue === 2 && (
						<CorpFullSummaryView
							productionSummary={activeViewData?.productionSummary || []}
							balances={activeViewData?.balances || []}
							members={activeViewData?.members || []}
							pricingMode={pricingMode}
							onPricingModeChange={setPricingMode}
							selectedExchange={selectedExchange}
							onSelectedExchangeChange={handleExchangeChange}
							hideZeroFlow={hideZeroFlow}
							onHideZeroFlowChange={handleHideZeroFlowChange}
							recipeOverrides={recipeOverrides}
							onRecipeOverrideChange={handleRecipeOverrideChange}
						/>
					)}
				</Box>
			</Paper>
		</Box>
	);
};
