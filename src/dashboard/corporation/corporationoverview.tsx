import React, { useState, useMemo, useCallback } from "react";
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
	type SelectChangeEvent,
	alpha,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import GroupsIcon from "@mui/icons-material/Groups";
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

			return {
				code: "ALL",
				name: "All Corporations Aggregated",
				members: allMembers,
				productionSummary: Array.from(aggregatedSummaryMap.values()),
				balances: aggregatedBalances,
			};
		}
		return corpData.find((c) => c.code === selectedCorpFilter) || corpData[0];
	}, [corpData, selectedCorpFilter]);

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
						mObj[`${effMode}-AskPrice`] ||
						mObj[`${effMode}-Average`] ||
						mObj[`${effMode}-BidPrice`] ||
						mObj.AskPrice ||
						mObj.askPrice ||
						mObj.Average ||
						mObj.average ||
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
			value: activeViewData?.members?.length
				? `${activeViewData.members.length} Active`
				: "0 Active",
			icon: <GroupsIcon sx={{ color: theme.palette.primary.light }} />,
			color: theme.palette.primary.light,
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

				{/* KPI Cards Grid (Responsive 2x2 on Mobile, 1x4 on Desktop) */}
				<Grid
					container
					spacing={1.25}
					sx={{ width: "100%", justifyContent: "center" }}
				>
					{widgets.map((w, i) => (
						<Grid item xs={6} md={3} key={i}>
							<Box
								sx={{
									py: 1,
									px: 1.5,
									borderRadius: 2,
									cursor: "default",
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
						</Grid>
					))}
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
