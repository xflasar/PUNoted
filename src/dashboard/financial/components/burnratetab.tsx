import React, { useState, useMemo, useRef, useEffect } from "react";
import {
	Box,
	Typography,
	Chip,
	TextField,
	InputAdornment,
	ButtonGroup,
	Button,
	FormControlLabel,
	Checkbox,
	Collapse,
	IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BusinessIcon from "@mui/icons-material/Business";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { FlexCard } from "./sharedui";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";
import MaterialBadge from "../../../cosm/components/materialbadge";
import { useGlobalData } from "../../../context/globaldatacontext";
import { LocationValuation } from "../hooks/usefinancialcalculations";

interface BurnRateTabProps {
	workforceBurnRate: {
		dailyCost: number;
		items: Array<{ ticker: string; dailyAmount: number; dailyCost: number }>;
	};
	locationValuations: LocationValuation[];
	currency: string;
}

export const BurnRateTab: React.FC<BurnRateTabProps> = ({
	locationValuations,
	currency,
}) => {
	const {
		productionData,
		workforceData,
		marketData,
		corpPrices,
		customPrices,
	} = useGlobalData();
	const [searchQuery, setSearchQuery] = useState("");
	const [pricingSource, setPricingSource] = useState<
		"market" | "corp" | "custom"
	>("market");
	const [showLoanedOut, setShowLoanedOut] = useState<boolean>(true);
	const [showLeasedToUs, setShowLeasedToUs] = useState<boolean>(true);
	const [collapsedSiteIds, setCollapsedSiteIds] = useState<Set<string>>(
		new Set(),
	);
	const [projectionDays, setProjectionDays] = useState<number>(0);

	// Container width detection for mobile card view
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState<number>(0);

	useEffect(() => {
		const updateWidth = () => {
			if (containerRef.current) {
				const w =
					containerRef.current.getBoundingClientRect().width ||
					containerRef.current.clientWidth;
				if (w > 0) setContainerWidth(w);
			}
		};

		updateWidth();
		const interval = setInterval(updateWidth, 150);
		window.addEventListener("resize", updateWidth);

		return () => {
			clearInterval(interval);
			window.removeEventListener("resize", updateWidth);
		};
	}, []);

	const isCompactView =
		containerWidth > 0 && containerWidth < (projectionDays > 0 ? 970 : 840);

	const toggleSiteCollapse = (siteId: string) => {
		setCollapsedSiteIds((prev) => {
			const next = new Set(prev);
			if (next.has(siteId)) next.delete(siteId);
			else next.add(siteId);
			return next;
		});
	};

	// Map site-specific storage (site storage + site warehouse) per siteId and ticker
	const siteStorageTotalsMap = useMemo(() => {
		const map = new Map<string, number>();
		locationValuations.forEach((loc) => {
			loc.sites.forEach((site) => {
				site.items.forEach((item) => {
					const key = `${site.siteId}_${item.ticker}`;
					map.set(key, (map.get(key) || 0) + item.amount);
				});
			});
		});
		return map;
	}, [locationValuations]);

	const [showWorkforce, setShowWorkforce] = useState<boolean>(true);
	const [showProdInputs, setShowProdInputs] = useState<boolean>(true);
	const [showProdOutputs, setShowProdOutputs] = useState<boolean>(true);

	// Process all production sites with workforce & production line consumables/outputs
	const siteBurnBreakdown = useMemo(() => {
		const sitesMap: Record<
			string,
			{
				siteId: string;
				planetName: string;
				ownerName: string;
				isLoanedOut: boolean;
				isLeasedToUs: boolean;
				items: Array<{
					ticker: string;
					category: "WORKFORCE" | "PROD_INPUT" | "PROD_OUTPUT";
					dailyAmount: number;
					unitPrice: number;
					dailyValue: number; // positive for output, negative for expense
					storedUnits: number;
					daysRemaining: number;
				}>;
				totalDailyExpense: number;
				totalDailyIncome: number;
				netDailyFlow: number;
				minDaysRemaining: number;
			}
		> = {};

		// Flatten all site entries from productionData (owned, leased, loaned, lent)
		const allProductionSites: any[] = [];
		if (productionData && typeof productionData === "object") {
			if (Array.isArray(productionData)) {
				allProductionSites.push(...productionData);
			} else {
				if (Array.isArray(productionData.owned))
					allProductionSites.push(
						...productionData.owned.map((s: any) => ({ ...s, isOwned: true })),
					);
				if (Array.isArray(productionData.leased))
					allProductionSites.push(
						...productionData.leased.map((s: any) => ({
							...s,
							isLeasedToUs: true,
						})),
					);
				if (Array.isArray(productionData.loaned))
					allProductionSites.push(
						...productionData.loaned.map((s: any) => ({
							...s,
							isLoanedOut: true,
						})),
					);
				if (Array.isArray(productionData.lent))
					allProductionSites.push(
						...productionData.lent.map((s: any) => ({
							...s,
							isLoanedOut: true,
						})),
					);

				Object.entries(productionData).forEach(([k, v]) => {
					if (
						!["owned", "leased", "loaned", "lent"].includes(k) &&
						v &&
						typeof v === "object"
					) {
						if (Array.isArray(v)) {
							allProductionSites.push(
								...v.map((s: any) => ({ ...s, categoryKey: k })),
							);
						} else {
							allProductionSites.push({ ...v, siteid: (v as any).siteid || k });
						}
					}
				});
			}
		}

		allProductionSites.forEach((siteSummary: any) => {
			const siteId =
				siteSummary.siteid ||
				siteSummary.site_id ||
				siteSummary.planetid ||
				`SITE_${Math.random()}`;
			const planetName =
				siteSummary.planet_name_alt ||
				siteSummary.planet_name ||
				siteSummary.planetName ||
				siteSummary.name ||
				siteId;
			const tenantCode =
				siteSummary.tenant || siteSummary.tenant_code || siteSummary.borrower;
			const ownerCode =
				siteSummary.owner || siteSummary.owner_code || siteSummary.lessor;

			const isLoanedOut = siteSummary.type === "Outbound" ? true : false;
			const isLeasedToUs = siteSummary.type === "Inbound" ? true : false;

			let ownerLabel = "OWN";
			if (isLoanedOut) {
				ownerLabel = `LENT TO (${tenantCode})`;
			} else if (isLeasedToUs) {
				ownerLabel = `LEASED FROM (${tenantCode})`;
			}

			const itemsList: Array<{
				ticker: string;
				category: "WORKFORCE" | "PROD_INPUT" | "PROD_OUTPUT";
				dailyAmount: number;
				unitPrice: number;
				dailyValue: number;
				storedUnits: number;
				daysRemaining: number;
			}> = [];

			let siteExpense = 0;
			let siteIncome = 0;
			let minDays = 999;

			const addItem = (
				ticker: string,
				dailyAmount: number,
				category: "WORKFORCE" | "PROD_INPUT" | "PROD_OUTPUT",
			) => {
				if (!ticker || dailyAmount <= 0) return;

				let unitPrice = 0;
				if (pricingSource === "corp" && corpPrices[ticker]) {
					unitPrice = corpPrices[ticker];
				} else if (pricingSource === "custom" && customPrices[ticker]) {
					unitPrice = customPrices[ticker];
				} else if (marketData[ticker]?.askPrice) {
					unitPrice = marketData[ticker].askPrice;
				} else if (marketData[ticker]?.price) {
					unitPrice = marketData[ticker].price;
				} else {
					unitPrice = corpPrices[ticker] || customPrices[ticker] || 10;
				}

				const totalVal = dailyAmount * unitPrice;
				const isIncome = category === "PROD_OUTPUT";
				const dailyValue = isIncome ? totalVal : -totalVal;

				const storedUnits =
					siteStorageTotalsMap.get(`${siteId}_${ticker}`) ||
					siteStorageTotalsMap.get(`${planetName}_${ticker}`) ||
					0;
				const daysRemaining =
					!isIncome && dailyAmount > 0 ? storedUnits / dailyAmount : 999;

				if (!isIncome && daysRemaining < minDays) minDays = daysRemaining;
				if (isIncome) siteIncome += totalVal;
				else siteExpense += totalVal;

				const existing = itemsList.find(
					(i) => i.ticker === ticker && i.category === category,
				);
				if (existing) {
					existing.dailyAmount += dailyAmount;
					existing.dailyValue += dailyValue;
				} else {
					itemsList.push({
						ticker,
						category,
						dailyAmount,
						unitPrice,
						dailyValue,
						storedUnits,
						daysRemaining,
					});
				}
			};

			// 1. Workforce Consumption
			const wfObj =
				siteSummary.workforce ||
				siteSummary.workforceData ||
				siteSummary.Workforce ||
				workforceData?.[siteId] ||
				workforceData?.[planetName];
			if (wfObj) {
				const levels = Array.isArray(wfObj)
					? wfObj
					: typeof wfObj === "object"
						? Object.values(wfObj)
						: [];
				levels.forEach((levelObj: any) => {
					const needs =
						levelObj?.needs || levelObj?.consumables || levelObj?.Needs || [];
					const needsList = Array.isArray(needs)
						? needs
						: Object.entries(needs).map(([k, v]: [string, any]) => ({
								ticker: k,
								...v,
							}));
					needsList.forEach((need: any) => {
						const ticker =
							need.ticker || need.materialid || need.Ticker || need.MaterialId;
						const dailyAmount = Number(
							need.dailyAmount ||
								need.dailyRate ||
								need.unitsperinterval ||
								need.Amount ||
								0,
						);
						addItem(ticker, dailyAmount, "WORKFORCE");
					});
				});
			}

			// 2. Production Input Consumption & Output Generation
			if (siteSummary.site_daily_flow) {
				Object.entries(siteSummary.site_daily_flow).forEach(
					([ticker, flowObj]: [string, any]) => {
						const val =
							typeof flowObj === "number" ? flowObj : flowObj?.flow || 0;
						if (val < 0) {
							addItem(ticker, Math.abs(val), "PROD_INPUT");
						} else if (val > 0) {
							addItem(ticker, val, "PROD_OUTPUT");
						}
					},
				);
			} else if (Array.isArray(siteSummary.production_lines)) {
				siteSummary.production_lines.forEach((line: any) => {
					if (line.line_daily_flow) {
						Object.entries(line.line_daily_flow).forEach(
							([ticker, flowVal]: [string, any]) => {
								const val = Number(flowVal || 0);
								if (val < 0) {
									addItem(ticker, Math.abs(val), "PROD_INPUT");
								} else if (val > 0) {
									addItem(ticker, val, "PROD_OUTPUT");
								}
							},
						);
					}
				});
			}

			if (
				itemsList.length > 0 ||
				siteSummary.site_building_tickers?.length > 0
			) {
				sitesMap[siteId] = {
					siteId,
					planetName,
					ownerName: ownerLabel,
					isLoanedOut,
					isLeasedToUs,
					items: itemsList,
					totalDailyExpense: siteExpense,
					totalDailyIncome: siteIncome,
					netDailyFlow: siteIncome - siteExpense,
					minDaysRemaining: minDays,
				};
			}
		});

		return Object.values(sitesMap);
	}, [
		productionData,
		workforceData,
		marketData,
		corpPrices,
		pricingSource,
		siteStorageTotalsMap,
	]);

	// Filtered site breakdown based on toggle checkboxes, category mixing, & search query
	const filteredSites = useMemo(() => {
		return siteBurnBreakdown
			.filter((site) => {
				if (!showLoanedOut && site.isLoanedOut) return false;
				if (!showLeasedToUs && site.isLeasedToUs && !site.isLoanedOut)
					return false;

				if (!searchQuery.trim()) return true;

				const commaTerms = searchQuery
					.split(",")
					.map((t) => t.trim().toLowerCase())
					.filter(Boolean);

				return commaTerms.some((term) => {
					const tokens = term.split(/\s+/).filter(Boolean);

					return tokens.every((tok) => {
						return (
							site.siteId.toLowerCase().includes(tok) ||
							site.planetName.toLowerCase().includes(tok) ||
							site.ownerName.toLowerCase().includes(tok) ||
							site.items.some((it) => it.ticker.toLowerCase().includes(tok))
						);
					});
				});
			})
			.map((site) => {
				const filteredItems = site.items.filter((item) => {
					if (!showWorkforce && item.category === "WORKFORCE") return false;
					if (!showProdInputs && item.category === "PROD_INPUT") return false;
					if (!showProdOutputs && item.category === "PROD_OUTPUT") return false;
					return true;
				});

				const totalExpense = filteredItems
					.filter((i) => i.dailyValue < 0)
					.reduce((sum, i) => sum + Math.abs(i.dailyValue), 0);
				const totalIncome = filteredItems
					.filter((i) => i.dailyValue > 0)
					.reduce((sum, i) => sum + i.dailyValue, 0);

				return {
					...site,
					items: filteredItems,
					totalDailyExpense: totalExpense,
					totalDailyIncome: totalIncome,
					netDailyFlow: totalIncome - totalExpense,
				};
			});
	}, [
		siteBurnBreakdown,
		showLoanedOut,
		showLeasedToUs,
		showWorkforce,
		showProdInputs,
		showProdOutputs,
		searchQuery,
	]);

	// Global Net, Expense, and Income totals
	const globalTotals = useMemo(() => {
		let totalIncome = 0;
		let totalExpense = 0;
		filteredSites.forEach((site) => {
			totalIncome += site.totalDailyIncome;
			totalExpense += site.totalDailyExpense;
		});
		return {
			income: totalIncome,
			expense: totalExpense,
			net: totalIncome - totalExpense,
		};
	}, [filteredSites]);

	const renderBufferStatusChip = (days: number) => {
		return (
			<Chip
				label={`${days.toFixed(1)} Days`}
				size="small"
				sx={{
					height: 18,
					fontSize: "0.58rem",
					fontWeight: 800,
					bgcolor:
						days >= 7
							? "rgba(74, 222, 128, 0.12)"
							: days >= 3
								? "rgba(251, 191, 36, 0.12)"
								: "rgba(248, 113, 113, 0.15)",
					color: days >= 7 ? "#4ade80" : days >= 3 ? "#fbbf24" : "#f87171",
					border:
						days >= 7
							? "1px solid rgba(74, 222, 128, 0.3)"
							: days >= 3
								? "1px solid rgba(251, 191, 36, 0.3)"
								: "1px solid rgba(248, 113, 113, 0.4)",
				}}
			/>
		);
	};

	return (
		<Box
			ref={containerRef}
			sx={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				gap: 1.5,
				minHeight: 0,
			}}
		>
			{/* Top Header Controls Card */}
			<FlexCard
				sx={{
					p: 1.5,
					display: "flex",
					flexDirection: "column",
					gap: 1.25,
					flexShrink: 0,
				}}
			>
				{/* Top Bar: Responsive row layout - stacks stats when width < 1080px (or < 1215px with future simulation) */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 1,
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: {
								xs: "column",
								lg:
									containerWidth < (projectionDays > 0 ? 985 : 850)
										? "column"
										: "row",
							},
							justifyContent: "space-between",
							alignItems:
								containerWidth < (projectionDays > 0 ? 985 : 850)
									? "flex-start"
									: "center",
							gap: 1.25,
						}}
					>
						{/* Left Group: Ownership & Category Mixing Filters */}
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								flexWrap: "wrap",
							}}
						>
							{/* Site Ownership Toggles */}
							<FormControlLabel
								control={
									<Checkbox
										checked={showLoanedOut}
										onChange={(e) => setShowLoanedOut(e.target.checked)}
										size="small"
										sx={{
											color: "#7b68ee",
											"&.Mui-checked": { color: "#7b68ee" },
											p: 0.25,
										}}
									/>
								}
								label={
									<Typography
										sx={{
											fontSize: "0.7rem",
											fontWeight: 700,
											color: "rgba(255,255,255,0.75)",
										}}
									>
										Loaned
									</Typography>
								}
								sx={{ m: 0 }}
							/>

							<FormControlLabel
								control={
									<Checkbox
										checked={showLeasedToUs}
										onChange={(e) => setShowLeasedToUs(e.target.checked)}
										size="small"
										sx={{
											color: "#60a5fa",
											"&.Mui-checked": { color: "#60a5fa" },
											p: 0.25,
										}}
									/>
								}
								label={
									<Typography
										sx={{
											fontSize: "0.7rem",
											fontWeight: 700,
											color: "rgba(255,255,255,0.75)",
										}}
									>
										Leased
									</Typography>
								}
								sx={{ m: 0 }}
							/>

							<Box
								sx={{
									width: "1px",
									height: 16,
									bgcolor: "rgba(255,255,255,0.12)",
									mx: 0.25,
								}}
							/>

							{/* Category Mixing Toggles */}
							<FormControlLabel
								control={
									<Checkbox
										checked={showWorkforce}
										onChange={(e) => setShowWorkforce(e.target.checked)}
										size="small"
										sx={{
											color: "#fbbf24",
											"&.Mui-checked": { color: "#fbbf24" },
											p: 0.25,
										}}
									/>
								}
								label={
									<Typography
										sx={{
											fontSize: "0.7rem",
											fontWeight: 700,
											color: "#fbbf24",
										}}
									>
										Workforce
									</Typography>
								}
								sx={{ m: 0 }}
							/>

							<FormControlLabel
								control={
									<Checkbox
										checked={showProdInputs}
										onChange={(e) => setShowProdInputs(e.target.checked)}
										size="small"
										sx={{
											color: SEMANTIC_COLORS.neonRed,
											"&.Mui-checked": { color: SEMANTIC_COLORS.neonRed },
											p: 0.25,
										}}
									/>
								}
								label={
									<Typography
										sx={{
											fontSize: "0.7rem",
											fontWeight: 700,
											color: SEMANTIC_COLORS.neonRed,
										}}
									>
										Prod Inputs
									</Typography>
								}
								sx={{ m: 0 }}
							/>

							<FormControlLabel
								control={
									<Checkbox
										checked={showProdOutputs}
										onChange={(e) => setShowProdOutputs(e.target.checked)}
										size="small"
										sx={{
											color: SEMANTIC_COLORS.neonGreen,
											"&.Mui-checked": { color: SEMANTIC_COLORS.neonGreen },
											p: 0.25,
										}}
									/>
								}
								label={
									<Typography
										sx={{
											fontSize: "0.7rem",
											fontWeight: 700,
											color: SEMANTIC_COLORS.neonGreen,
										}}
									>
										Prod Output
									</Typography>
								}
								sx={{ m: 0 }}
							/>

							{/* Pricing Source Selector */}
							<ButtonGroup
								size="small"
								variant="outlined"
								sx={{ borderColor: "rgba(123, 104, 238, 0.3)", ml: 0.5 }}
							>
								<Button
									onClick={() => setPricingSource("market")}
									startIcon={<StorefrontIcon sx={{ fontSize: 13 }} />}
									sx={{
										fontSize: "0.64rem",
										fontWeight: 800,
										py: 0.2,
										bgcolor:
											pricingSource === "market" ? "#7b68ee" : "transparent",
										color:
											pricingSource === "market"
												? "white"
												: "rgba(255,255,255,0.6)",
									}}
								>
									CX Market
								</Button>
								<Button
									onClick={() => setPricingSource("corp")}
									startIcon={<BusinessIcon sx={{ fontSize: 13 }} />}
									sx={{
										fontSize: "0.64rem",
										fontWeight: 800,
										py: 0.2,
										bgcolor:
											pricingSource === "corp" ? "#7b68ee" : "transparent",
										color:
											pricingSource === "corp"
												? "white"
												: "rgba(255,255,255,0.6)",
									}}
								>
									CORP Pricing
								</Button>
							</ButtonGroup>
						</Box>

						{/* Right Group: Global Income, Expense & Net Stats */}
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								flexWrap: "wrap",
							}}
						>
							<Box
								sx={{
									py: 0.4,
									px: 0.8,
									borderRadius: "5px",
									bgcolor: "rgba(0,0,0,0.35)",
									border: "1px solid rgba(74, 222, 128, 0.25)",
									display: "flex",
									alignItems: "center",
									gap: 0.75,
								}}
							>
								<Typography
									variant="caption"
									sx={{
										color: "rgba(255,255,255,0.45)",
										fontSize: "0.58rem",
										fontWeight: 700,
									}}
								>
									INCOME:
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontFamily: "monospace",
										fontWeight: 800,
										color: SEMANTIC_COLORS.neonGreen,
										fontSize: "0.78rem",
									}}
								>
									+{formatCurrency(globalTotals.income)} {currency}/day
								</Typography>
							</Box>

							<Box
								sx={{
									py: 0.4,
									px: 0.8,
									borderRadius: "5px",
									bgcolor: "rgba(0,0,0,0.35)",
									border: "1px solid rgba(248, 113, 113, 0.25)",
									display: "flex",
									alignItems: "center",
									gap: 0.75,
								}}
							>
								<Typography
									variant="caption"
									sx={{
										color: "rgba(255,255,255,0.45)",
										fontSize: "0.58rem",
										fontWeight: 700,
									}}
								>
									EXPENSE:
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontFamily: "monospace",
										fontWeight: 800,
										color: SEMANTIC_COLORS.neonRed,
										fontSize: "0.78rem",
									}}
								>
									-{formatCurrency(globalTotals.expense)} {currency}/day
								</Typography>
							</Box>

							<Box
								sx={{
									py: 0.4,
									px: 0.8,
									borderRadius: "5px",
									bgcolor:
										globalTotals.net >= 0
											? "rgba(74, 222, 128, 0.12)"
											: "rgba(248, 113, 113, 0.12)",
									border: `1px solid ${globalTotals.net >= 0 ? "rgba(74, 222, 128, 0.35)" : "rgba(248, 113, 113, 0.35)"}`,
									display: "flex",
									alignItems: "center",
									gap: 0.75,
								}}
							>
								<Typography
									variant="caption"
									sx={{
										color:
											globalTotals.net >= 0
												? SEMANTIC_COLORS.neonGreen
												: SEMANTIC_COLORS.neonRed,
										fontSize: "0.58rem",
										fontWeight: 800,
									}}
								>
									NET FLOW:
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontFamily: "monospace",
										fontWeight: 800,
										color:
											globalTotals.net >= 0
												? SEMANTIC_COLORS.neonGreen
												: SEMANTIC_COLORS.neonRed,
										fontSize: "0.82rem",
									}}
								>
									{globalTotals.net >= 0 ? "+" : ""}
									{formatCurrency(globalTotals.net)} {currency}/day
								</Typography>
							</Box>

							{/* Multi-Day Projected Net Flow (Shown only if projectionDays >= 1) */}
							{projectionDays >= 1 && (
								<Box
									sx={{
										py: 0.4,
										px: 0.8,
										borderRadius: "5px",
										bgcolor: "rgba(168, 85, 247, 0.12)",
										border: "1px solid rgba(168, 85, 247, 0.35)",
										display: "flex",
										alignItems: "center",
										gap: 0.75,
									}}
								>
									<Typography
										variant="caption"
										sx={{
											color: "#c084fc",
											fontSize: "0.58rem",
											fontWeight: 800,
										}}
									>
										{projectionDays}D NET:
									</Typography>
									<Typography
										variant="body2"
										sx={{
											fontFamily: "monospace",
											fontWeight: 800,
											color: "#c084fc",
											fontSize: "0.82rem",
										}}
									>
										{globalTotals.net * projectionDays >= 0 ? "+" : ""}
										{formatCurrency(globalTotals.net * projectionDays)}{" "}
										{currency}
									</Typography>
								</Box>
							)}
						</Box>
					</Box>

					{/* Bottom Bar: Search Filter & Future Projection Days Input */}
					<Box
						sx={{
							display: "flex",
							flexDirection: { xs: "column", sm: "row" },
							justifyContent: "space-between",
							alignItems: "center",
							gap: 1.25,
							pt: 0.5,
						}}
					>
						<TextField
							fullWidth
							size="small"
							placeholder="Filter by site ID, planet name, owner, or consumable/output ticker..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							sx={{
								flex: 1,
								"& .MuiOutlinedInput-root": {
									bgcolor: "rgba(0, 0, 0, 0.4)",
									borderRadius: "6px",
									color: "white",
									fontSize: "0.76rem",
									py: 0,
									"& fieldset": { borderColor: "rgba(123, 104, 238, 0.25)" },
									"&:hover fieldset": {
										borderColor: "rgba(123, 104, 238, 0.6)",
									},
								},
								"& .MuiInputBase-input": { py: 0.35, px: 1 },
							}}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start">
											<SearchIcon
												sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}
											/>
										</InputAdornment>
									),
								},
							}}
						/>

						{/* Future Projection Days Direct Input */}
						<Box
							sx={{
								px: 1,
								py: 0.35,
								borderRadius: "6px",
								bgcolor: "rgba(0,0,0,0.3)",
								display: "flex",
								alignItems: "center",
								gap: 1,
								flexShrink: 0,
							}}
						>
							<Typography
								sx={{
									fontSize: "0.7rem",
									fontWeight: 800,
									color:
										projectionDays > 0 ? "#c084fc" : "rgba(255,255,255,0.6)",
									whiteSpace: "nowrap",
								}}
							>
								Future Simulation:
							</Typography>
							<TextField
								type="number"
								size="small"
								value={projectionDays === 0 ? "" : projectionDays}
								onChange={(e) => {
									const val = Math.max(0, parseInt(e.target.value || "0", 10));
									setProjectionDays(isNaN(val) ? 0 : val);
								}}
								placeholder="0"
								slotProps={{
									input: {
										endAdornment: (
											<InputAdornment position="end">
												<span
													style={{
														color: "rgba(255,255,255,0.5)",
														fontSize: "0.65rem",
													}}
												>
													days
												</span>
											</InputAdornment>
										),
									},
								}}
								sx={{
									width: 90,
									"& .MuiOutlinedInput-root": {
										bgcolor: "rgba(0, 0, 0, 0.5)",
										borderRadius: "4px",
										color: "#c084fc",
										fontWeight: 800,
										fontSize: "0.74rem",
										py: 0,
										"& fieldset": { borderColor: "rgba(168, 85, 247, 0.4)" },
										"&:hover fieldset": {
											borderColor: "rgba(168, 85, 247, 0.8)",
										},
									},
									"& .MuiInputBase-input": {
										py: 0.25,
										px: 0.75,
										textAlign: "center",
									},
								}}
							/>
						</Box>
					</Box>
				</Box>
			</FlexCard>

			{/* Main Site Breakdown Section */}
			<FlexCard
				sx={{
					flex: 1,
					minHeight: 0,
					p: 1.5,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Box
					sx={{
						flex: 1,
						overflowY: "auto",
						pr: 0.5,
						"&::-webkit-scrollbar": { width: "4px" },
						"&::-webkit-scrollbar-thumb": {
							backgroundColor: "rgba(255,255,255,0.1)",
							borderRadius: "4px",
						},
					}}
				>
					{filteredSites.length > 0 ? (
						<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
							{filteredSites.map((site) => {
								const isCollapsed = collapsedSiteIds.has(site.siteId);

								return (
									<Box
										key={site.siteId}
										sx={{
											p: 1.25,
											borderRadius: "8px",
											bgcolor: "rgba(0,0,0,0.3)",
											border: "1px solid rgba(255,255,255,0.06)",
										}}
									>
										{/* Aggregated Site Summary Header (Clickable to Expand/Collapse) */}
										<Box
											onClick={() => toggleSiteCollapse(site.siteId)}
											sx={{
												pb: isCollapsed ? 0 : 0.75,
												mb: isCollapsed ? 0 : 1,
												borderBottom: isCollapsed
													? "none"
													: "1px solid rgba(255,255,255,0.05)",
												display: "flex",
												flexWrap: "wrap",
												justifyContent: "space-between",
												alignItems: "center",
												gap: 1,
												cursor: "pointer",
												userSelect: "none",
											}}
										>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 1,
													flex: 1,
												}}
											>
												<IconButton
													size="small"
													sx={{ p: 0.2, color: "rgba(255,255,255,0.5)" }}
												>
													{isCollapsed ? (
														<KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
													) : (
														<KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
													)}
												</IconButton>
												<Typography
													sx={{
														fontSize: "0.92rem",
														fontWeight: 800,
														color: "white",
													}}
												>
													{site.planetName}
												</Typography>
												<Chip
													label={site.ownerName}
													size="small"
													sx={{
														height: 20,
														fontSize: "0.6rem",
														fontWeight: 800,
														bgcolor: site.isLoanedOut
															? "rgba(168, 85, 247, 0.15)"
															: site.isLeasedToUs
																? "rgba(96, 165, 250, 0.15)"
																: "rgba(74, 222, 128, 0.15)",
														color: site.isLoanedOut
															? "#c084fc"
															: site.isLeasedToUs
																? "#60a5fa"
																: "#4ade80",
													}}
												/>
											</Box>

											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 1.25,
													flexWrap: "wrap",
												}}
											>
												<Typography
													sx={{
														fontSize: "0.76rem",
														color: "rgba(255,255,255,0.7)",
													}}
												>
													{site.items.length} Materials
												</Typography>
												<Typography
													sx={{
														fontSize: "0.82rem",
														fontFamily: "monospace",
														fontWeight: 800,
														color:
															site.netDailyFlow >= 0
																? SEMANTIC_COLORS.neonGreen
																: SEMANTIC_COLORS.neonRed,
													}}
												>
													Net: {site.netDailyFlow >= 0 ? "+" : ""}
													{formatCurrency(site.netDailyFlow)} {currency}/day
												</Typography>

												{/* Projected Spend/Net for this site over the simulation window */}
												{projectionDays >= 1 && (
													<Typography
														sx={{
															fontSize: "0.82rem",
															fontFamily: "monospace",
															fontWeight: 800,
															color: "#c084fc",
															bgcolor: "rgba(168, 85, 247, 0.12)",
															px: 0.75,
															py: 0.2,
															borderRadius: "4px",
															border: "1px solid rgba(168, 85, 247, 0.3)",
														}}
													>
														{site.netDailyFlow * projectionDays >= 0 ? "+" : ""}
														{formatCurrency(
															site.netDailyFlow * projectionDays,
														)}{" "}
														{currency} ({projectionDays}d)
													</Typography>
												)}

												{renderBufferStatusChip(
													Math.max(0, site.minDaysRemaining - projectionDays),
												)}
											</Box>
										</Box>

										{/* Expandable Consumables/Output Table / Custom Row Cards */}
										<Collapse in={!isCollapsed} timeout="auto" unmountOnExit>
											{isCompactView ? (
												/* Custom Row Card List for Narrow Viewports / Overflow (< 970px with simulation / < 840px without) */
												<Box
													sx={{
														display: "flex",
														flexDirection: "column",
														gap: 1,
														mt: 0.5,
													}}
												>
													{site.items.map((item) => {
														const isIncome = item.category === "PROD_OUTPUT";
														const projectedStock = Math.max(
															0,
															Math.round(
																item.storedUnits -
																	item.dailyAmount * projectionDays,
															),
														);

														return (
															<Box
																key={`${item.ticker}_${item.category}`}
																sx={{
																	p: 1.25,
																	borderRadius: "6px",
																	bgcolor: "rgba(0,0,0,0.3)",
																	border: `1px solid ${isIncome ? "rgba(74, 222, 128, 0.25)" : "rgba(255,255,255,0.07)"}`,
																	display: "flex",
																	flexDirection: "column",
																	gap: 0.75,
																}}
															>
																<Box
																	sx={{
																		display: "flex",
																		alignItems: "center",
																		justifyContent: "space-between",
																		flexWrap: "wrap",
																		gap: 1,
																	}}
																>
																	<Box
																		sx={{
																			display: "flex",
																			alignItems: "center",
																			gap: 1,
																		}}
																	>
																		<Box sx={{ fontSize: "0.85em" }}>
																			<MaterialBadge ticker={item.ticker} />
																		</Box>
																		<Typography
																			sx={{
																				fontSize: "0.82rem",
																				fontWeight: 800,
																				color: "white",
																			}}
																		>
																			{item.ticker}
																		</Typography>
																		<Chip
																			label={
																				item.category === "WORKFORCE"
																					? "WORKFORCE"
																					: item.category === "PROD_INPUT"
																						? "INPUT"
																						: "PROD OUTPUT"
																			}
																			size="small"
																			sx={{
																				height: 18,
																				fontSize: "0.54rem",
																				fontWeight: 800,
																				bgcolor:
																					item.category === "WORKFORCE"
																						? "rgba(251, 191, 36, 0.15)"
																						: item.category === "PROD_INPUT"
																							? "rgba(248, 113, 113, 0.15)"
																							: "rgba(74, 222, 128, 0.15)",
																				color:
																					item.category === "WORKFORCE"
																						? "#fbbf24"
																						: item.category === "PROD_INPUT"
																							? SEMANTIC_COLORS.neonRed
																							: SEMANTIC_COLORS.neonGreen,
																			}}
																		/>
																	</Box>
																	{!isIncome && (
																		<Box sx={{ flexShrink: 0 }}>
																			{renderBufferStatusChip(
																				Math.max(
																					0,
																					item.daysRemaining - projectionDays,
																				),
																			)}
																		</Box>
																	)}
																</Box>

																<Box
																	sx={{
																		display: "flex",
																		alignItems: "center",
																		justifyContent: "space-between",
																		flexWrap: "wrap",
																		gap: 1.5,
																		pt: 0.5,
																		borderTop:
																			"1px dashed rgba(255,255,255,0.06)",
																	}}
																>
																	<Typography
																		sx={{
																			fontSize: "0.74rem",
																			color: "rgba(255,255,255,0.6)",
																		}}
																	>
																		Flow:{" "}
																		<span
																			style={{
																				color: isIncome
																					? SEMANTIC_COLORS.neonGreen
																					: "white",
																				fontFamily: "monospace",
																				fontWeight: 700,
																			}}
																		>
																			{isIncome ? "+" : "-"}
																			{item.dailyAmount.toFixed(1)} u/day
																		</span>
																	</Typography>

																	<Typography
																		sx={{
																			fontSize: "0.74rem",
																			color: "rgba(255,255,255,0.6)",
																		}}
																	>
																		Unit Price:{" "}
																		<span
																			style={{
																				color: "rgba(255,255,255,0.85)",
																				fontFamily: "monospace",
																				fontWeight: 700,
																			}}
																		>
																			{formatCurrency(item.unitPrice)}{" "}
																			{currency}
																		</span>
																	</Typography>

																	<Typography
																		sx={{
																			fontSize: "0.76rem",
																			fontFamily: "monospace",
																			fontWeight: 800,
																			color: isIncome
																				? SEMANTIC_COLORS.neonGreen
																				: SEMANTIC_COLORS.neonRed,
																		}}
																	>
																		Daily: {isIncome ? "+" : ""}
																		{formatCurrency(item.dailyValue)} {currency}
																		/day
																	</Typography>

																	{projectionDays >= 1 && (
																		<Typography
																			sx={{
																				fontSize: "0.76rem",
																				fontFamily: "monospace",
																				fontWeight: 800,
																				color: "#c084fc",
																				bgcolor: "rgba(168, 85, 247, 0.12)",
																				px: 0.75,
																				py: 0.15,
																				borderRadius: "4px",
																				border:
																					"1px solid rgba(168, 85, 247, 0.25)",
																			}}
																		>
																			{projectionDays}D Net:{" "}
																			{isIncome ? "+" : ""}
																			{formatCurrency(
																				item.dailyValue * projectionDays,
																			)}{" "}
																			{currency}
																		</Typography>
																	)}

																	{!isIncome && (
																		<Typography
																			sx={{
																				fontSize: "0.74rem",
																				color: "rgba(255,255,255,0.7)",
																				whiteSpace: "nowrap",
																				flexShrink: 0,
																			}}
																		>
																			{projectionDays > 0
																				? `Stock in +${projectionDays}D:`
																				: "Stock Held:"}{" "}
																			<span
																				style={{
																					color:
																						projectionDays > 0 &&
																						projectedStock === 0
																							? SEMANTIC_COLORS.neonRed
																							: "#60a5fa",
																					fontFamily: "monospace",
																					fontWeight: 800,
																				}}
																			>
																				{projectedStock.toLocaleString()} u
																			</span>
																		</Typography>
																	)}
																</Box>
															</Box>
														);
													})}
												</Box>
											) : (
												/* Standard Desktop/Tablet Table View */
												<Box
													sx={{
														width: "100%",
														overflowX: "auto",
														minWidth: 0,
														"&::-webkit-scrollbar": { height: "4px" },
														"&::-webkit-scrollbar-thumb": {
															backgroundColor: "rgba(123, 104, 238, 0.4)",
															borderRadius: "4px",
														},
													}}
												>
													<table
														style={{
															width: "100%",
															minWidth: "700px",
															borderCollapse: "collapse",
															textAlign: "left",
															tableLayout: "fixed",
														}}
													>
														<thead>
															<tr
																style={{
																	color: "rgba(255,255,255,0.4)",
																	fontSize: "0.62rem",
																	textTransform: "uppercase",
																	borderBottom:
																		"1px solid rgba(255,255,255,0.06)",
																}}
															>
																<th
																	style={{ padding: "6px 8px", width: "120px" }}
																>
																	Material / Type
																</th>
																<th
																	style={{
																		padding: "6px 8px",
																		textAlign: "right",
																		width: "130px",
																	}}
																>
																	Daily Flow
																</th>
																<th
																	style={{
																		padding: "6px 8px",
																		textAlign: "right",
																		width: "130px",
																	}}
																>
																	Unit Price
																</th>
																<th
																	style={{
																		padding: "6px 8px",
																		textAlign: "right",
																		width: "150px",
																	}}
																>
																	Daily Value
																</th>
																{projectionDays >= 1 && (
																	<th
																		style={{
																			padding: "6px 8px",
																			textAlign: "right",
																			width: "130px",
																			color: "#c084fc",
																		}}
																	>
																		{projectionDays}D Net Value
																	</th>
																)}
																<th
																	style={{
																		padding: "6px 8px",
																		textAlign: "right",
																		width: "120px",
																	}}
																>
																	{projectionDays > 0
																		? `Stock in +${projectionDays}D`
																		: "Stock Held"}
																</th>
																<th
																	style={{
																		padding: "6px 8px",
																		textAlign: "right",
																	}}
																>
																	Stock Lasting
																</th>
															</tr>
														</thead>
														<tbody>
															{site.items.map((item) => {
																const isIncome =
																	item.category === "PROD_OUTPUT";
																const projectedStock = Math.max(
																	0,
																	Math.round(
																		item.storedUnits -
																			item.dailyAmount * projectionDays,
																	),
																);
																const projectedDaysLeft = Math.max(
																	0,
																	item.daysRemaining - projectionDays,
																);

																return (
																	<tr
																		key={`${item.ticker}_${item.category}`}
																		style={{
																			borderBottom:
																				"1px solid rgba(255,255,255,0.03)",
																		}}
																	>
																		<td style={{ padding: "6px 8px" }}>
																			<Box
																				sx={{
																					display: "flex",
																					alignItems: "center",
																					gap: 0.75,
																				}}
																			>
																				<Box sx={{ fontSize: "0.8em" }}>
																					<MaterialBadge ticker={item.ticker} />
																				</Box>
																				<Chip
																					label={
																						item.category === "WORKFORCE"
																							? "WORKFORCE"
																							: item.category === "PROD_INPUT"
																								? "INPUT"
																								: "PROD"
																					}
																					size="small"
																					sx={{
																						height: 16,
																						fontSize: "0.52rem",
																						fontWeight: 800,
																						bgcolor:
																							item.category === "WORKFORCE"
																								? "rgba(251, 191, 36, 0.15)"
																								: item.category === "PROD_INPUT"
																									? "rgba(248, 113, 113, 0.15)"
																									: "rgba(74, 222, 128, 0.15)",
																						color:
																							item.category === "WORKFORCE"
																								? "#fbbf24"
																								: item.category === "PROD_INPUT"
																									? SEMANTIC_COLORS.neonRed
																									: SEMANTIC_COLORS.neonGreen,
																					}}
																				/>
																			</Box>
																		</td>
																		<td
																			style={{
																				padding: "6px 8px",
																				textAlign: "right",
																				fontFamily: "monospace",
																				fontSize: "0.76rem",
																				color: isIncome
																					? SEMANTIC_COLORS.neonGreen
																					: "rgba(255,255,255,0.85)",
																			}}
																		>
																			{isIncome ? "+" : "-"}
																			{item.dailyAmount.toFixed(1)} u/day
																		</td>
																		<td
																			style={{
																				padding: "6px 8px",
																				textAlign: "right",
																				fontFamily: "monospace",
																				fontSize: "0.76rem",
																				color: "rgba(255,255,255,0.6)",
																			}}
																		>
																			{formatCurrency(item.unitPrice)}{" "}
																			{currency}
																		</td>
																		<td
																			style={{
																				padding: "6px 8px",
																				textAlign: "right",
																				fontFamily: "monospace",
																				fontSize: "0.78rem",
																				fontWeight: 800,
																				color: isIncome
																					? SEMANTIC_COLORS.neonGreen
																					: SEMANTIC_COLORS.neonRed,
																			}}
																		>
																			{isIncome ? "+" : ""}
																			{formatCurrency(item.dailyValue)}{" "}
																			{currency}
																		</td>
																		{projectionDays >= 1 && (
																			<td
																				style={{
																					padding: "6px 8px",
																					textAlign: "right",
																					fontFamily: "monospace",
																					fontSize: "0.78rem",
																					fontWeight: 800,
																					color: "#c084fc",
																				}}
																			>
																				{isIncome ? "+" : ""}
																				{formatCurrency(
																					item.dailyValue * projectionDays,
																				)}{" "}
																				{currency}
																			</td>
																		)}
																		<td
																			style={{
																				padding: "6px 8px",
																				textAlign: "right",
																				fontFamily: "monospace",
																				fontSize: "0.76rem",
																				color:
																					!isIncome && projectedStock === 0
																						? SEMANTIC_COLORS.neonRed
																						: "rgba(255,255,255,0.85)",
																			}}
																		>
																			{isIncome
																				? "N/A"
																				: `${projectedStock.toLocaleString()} u`}
																		</td>
																		<td
																			style={{
																				padding: "6px 8px",
																				textAlign: "right",
																			}}
																		>
																			{isIncome
																				? "-"
																				: renderBufferStatusChip(
																						projectedDaysLeft,
																					)}
																		</td>
																	</tr>
																);
															})}
														</tbody>
													</table>
												</Box>
											)}
										</Collapse>
									</Box>
								);
							})}
						</Box>
					) : (
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								height: "100%",
								color: "rgba(255,255,255,0.4)",
								fontSize: "0.82rem",
							}}
						>
							No active production or workforce consumable data detected
							matching your filters
						</Box>
					)}
				</Box>
			</FlexCard>
		</Box>
	);
};
