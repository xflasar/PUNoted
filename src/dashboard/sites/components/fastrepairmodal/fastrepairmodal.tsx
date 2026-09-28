import React, { useMemo, useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Box,
	Typography,
	Button,
	Slider,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	IconButton,
	Chip,
	useTheme,
	ToggleButtonGroup,
	ToggleButton,
	Select,
	MenuItem,
	Menu,
	Tooltip as MuiTooltip,
	useMediaQuery,
} from "@mui/material";
import {
	Wrench,
	Copy,
	X,
	Calendar,
	AlertTriangle,
	ShieldCheck,
	DollarSign,
	Activity,
	Package,
	ShoppingCart,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import {
	ResponsiveContainer,
	LineChart,
	Line,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip as RechartsTooltip,
	Legend,
	CartesianGrid,
	ReferenceLine,
} from "recharts";
import MaterialBadge from "../../../../cosm/components/materialbadge";
import { copyToClipboard } from "../../../production/utils/materialprops";
import { generateXit, XitAction } from "../../../../utils/xitgenerator";
import { CX_EXCHANGES, MATERIAL_COLORS, calcBuildingCondition } from "./utils";
import { useFastRepair } from "./usefastrepair";
import type { FastRepairModalProps } from "./types";
import { DegradationChart } from "./degradationchart";
import { BuildingsList } from "./buildingslist";
import { ShoppingCartTable } from "./shoppingcarttable";

export const FastRepairModal: React.FC<FastRepairModalProps> = ({
	open,
	onClose,
	siteName,
	currentCondition = 1.0,
	productionLines = [],
	sitePlatformConditions = [],
	platformRepairList = [],
	onShowSnackbar,
	planetProps,
	richFlows,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	// Chart Sub-Tab ("cost" | "condition" | "items")
	const [chartTab, setChartTab] = useState<"cost" | "condition" | "items">(
		"cost",
	);

	// CX Exchange Selection ("IC1" | "NC1" | "AI1" | "CI1" | "CORP")
	const [selectedExchange, setSelectedExchange] = useState<string>("IC1");

	// Time Offset Slider (0 to maxOffset Days)
	const [timeOffset, setTimeOffset] = useState<number>(0);

	// XIT Copy Menu Anchor Element
	const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

	const {
		minAge,
		maxAge,
		avgAge,
		avgConditionPct,
		maxTimeOffset,
		platformBreakdown,
		repairMaterials,
		totalRepairCost,
		totalVolume,
		totalWeight,
		timelineGraphData,
		getMatPrice,
		getMatMarketInfo,
		projectedDays,
	} = useFastRepair({
		currentCondition,
		sitePlatformConditions,
		selectedExchange,
		timeOffset,
		planetProps,
		richFlows,
	});

	const totalCorpCost = useMemo(() => {
		let total = 0;
		Object.entries(repairMaterials).forEach(([mat, qty]) => {
			const info = getMatMarketInfo(mat);
			total += qty * info.corpPrice;
		});
		return total;
	}, [repairMaterials, getMatMarketInfo]);

	const optimalAge = useMemo(() => {
		let bestAge = 90;
		let bestScore = -Infinity;
		const dailyProfitBase = 35000;
		for (let age = 50; age <= 120; age += 1) {
			const cond = calcBuildingCondition(age);
			const profitLossRate = dailyProfitBase * (1 - cond);
			const costRate = totalRepairCost / age;
			const score = -(profitLossRate + costRate);
			if (score > bestScore) {
				bestScore = score;
				bestAge = age;
			}
		}
		return Math.max(60, Math.min(105, bestAge));
	}, [totalRepairCost]);

	const buildingSummaryList = useMemo(() => {
		const counts: Record<string, number> = {};
		platformBreakdown.forEach((pb) => {
			counts[pb.ticker] = (counts[pb.ticker] || 0) + 1;
		});
		return Object.entries(counts).map(
			([ticker, count]) => `${count} ${ticker}`,
		);
	}, [platformBreakdown]);

	const groupedBuildings = useMemo(() => {
		const groups: Record<
			string,
			{
				ticker: string;
				count: number;
				totalCost: number;
				minAge: number;
				maxAge: number;
				avgCondition: number;
				materials: Record<string, number>;
			}
		> = {};

		platformBreakdown.forEach((pb) => {
			if (!groups[pb.ticker]) {
				groups[pb.ticker] = {
					ticker: pb.ticker,
					count: 0,
					totalCost: 0,
					minAge: pb.ageDays,
					maxAge: pb.ageDays,
					avgCondition: 0,
					materials: {},
				};
			}

			const g = groups[pb.ticker];
			g.count += 1;
			g.totalCost += pb.repairCost;
			g.minAge = Math.min(g.minAge, pb.ageDays);
			g.maxAge = Math.max(g.maxAge, pb.ageDays);
			g.avgCondition += pb.condition;

			Object.entries(pb.materials).forEach(([m, q]) => {
				g.materials[m] = (g.materials[m] || 0) + q;
			});
		});

		return Object.values(groups).map((g) => ({
			...g,
			avgCondition: g.avgCondition / g.count,
		}));
	}, [platformBreakdown]);

	// Currency helper
	const getCurrencyLabel = (ex: string) => {
		if (ex.startsWith("IC")) return "ICA";
		if (ex.startsWith("NC")) return "NCC";
		if (ex.startsWith("AI")) return "AIC";
		if (ex.startsWith("CI")) return "CIS";
		return "ICA";
	};

	// Color helper
	const getCondColor = (cond: number) => {
		if (cond >= 0.85) return theme.palette.success.main;
		if (cond >= 0.6) return theme.palette.warning.main;
		return theme.palette.error.main;
	};

	const condColor = getCondColor(avgConditionPct);

	const handleCopyRepairXit = (mode: "TRANSFER" | "BUY_TRANSFER") => {
		if (Object.keys(repairMaterials).length === 0) {
			if (onShowSnackbar)
				onShowSnackbar("No repair materials needed for selected buildings!");
			return;
		}

		let actions: XitAction[] = [];
		if (mode === "TRANSFER") {
			actions = [
				{
					type: "MTRA",
					name: "Repair Materials Transport",
					group: "R1",
					origin: "Warehouse/Storage",
					dest: `${siteName} Base`,
				},
			];
		} else {
			actions = [
				{
					type: "CX Buy",
					name: "Repair Materials Buy",
					group: "R1",
					origin: "Configure on Execution",
					exchange: selectedExchange === "CORP" ? "IC1" : selectedExchange,
					priceLimits: {},
					buyPartial: false,
					useCXInv: true,
				},
				{
					type: "MTRA",
					name: "Repair Materials Transport",
					group: "R1",
					origin: "Configure on Execution",
					dest: `${siteName} Base`,
				},
			];
		}

		const xit = generateXit(`${siteName} Repair`, actions, [
			{ type: "Manual", name: "R1", materials: repairMaterials },
		]);

		copyToClipboard(xit);
		if (onShowSnackbar)
			onShowSnackbar(
				`Copied XIT Repair payload (${mode === "TRANSFER" ? "Just Transfer" : "Buy & Transfer"}) for ${siteName} to clipboard!`,
			);
	};

	const materialKeys = useMemo(
		() => Object.keys(repairMaterials).sort(),
		[repairMaterials],
	);

	const formatDateInput = (offset: number) => {
		const d = new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
		return d.toISOString().split("T")[0];
	};

	const handleDateSelect = (dateStr: string) => {
		if (!dateStr) return;
		const selected = new Date(dateStr + "T00:00:00");
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		selected.setHours(0, 0, 0, 0);
		const diffMs = selected.getTime() - today.getTime();
		const diffDays = Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000)));
		setTimeOffset(Math.min(maxTimeOffset, diffDays));
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullScreen={isMobile}
			maxWidth="lg"
			fullWidth
			slotProps={{
				paper: {
					sx: {
						bgcolor: "rgba(16, 16, 32, 0.97)",
						backdropFilter: "blur(20px)",
						border: `1px solid ${condColor}`,
						borderRadius: isMobile ? 0 : "14px",
						boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
						color: "white",
					},
				},
			}}
		>
			{/* Header */}
			<DialogTitle
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					py: 1,
					px: { xs: 1.5, sm: 2.5 },
					bgcolor: "rgba(0, 0, 0, 0.4)",
					borderBottom: `1px solid ${condColor}44`,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					<Wrench size={18} color={condColor} />
					<Typography
						variant="h6"
						sx={{
							fontWeight: 800,
							fontSize: { xs: "0.95rem", sm: "1.05rem" },
							color: "white",
						}}
					>
						Site Repair & Condition Planner &nbsp;•&nbsp; {siteName}
					</Typography>
				</Box>

				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					{/* CX Exchange Selector */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.6)",
								fontSize: "0.68rem",
								fontWeight: 700,
							}}
						>
							CX:
						</Typography>
						<Select
							size="small"
							value={selectedExchange}
							onChange={(e) => setSelectedExchange(e.target.value)}
							sx={{
								height: 26,
								bgcolor: "rgba(0,0,0,0.4)",
								color: theme.palette.warning.main,
								fontWeight: 800,
								fontSize: "0.7rem",
								borderRadius: "6px",
								"& .MuiSelect-select": { py: 0, px: 1 },
							}}
						>
							{CX_EXCHANGES.map((ex) => (
								<MenuItem
									key={ex}
									value={ex}
									sx={{ fontSize: "0.75rem", fontWeight: 700 }}
								>
									{ex}
								</MenuItem>
							))}
						</Select>
					</Box>

					<IconButton
						size="small"
						onClick={onClose}
						sx={{ color: "rgba(255,255,255,0.6)" }}
					>
						<X size={18} />
					</IconButton>
				</Box>
			</DialogTitle>

			<DialogContent
				sx={{
					px: { xs: 1.5, sm: 2.5 },
					py: 1,
					display: "flex",
					flexDirection: "column",
					gap: 1.5,
					maxHeight: "82vh",
					overflowY: "auto",
				}}
			>
				{/* --- CONDITION STATUS & TIMELINE CONTROLS CARD --- */}
				<Box
					sx={{
						p: 0,
						bgcolor: "transparent",
						border: "none",
						display: "flex",
						flexDirection: "column",
						gap: 1,
					}}
				>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							flexWrap: "wrap",
							gap: 1,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
							<Chip
								icon={
									avgConditionPct >= 0.85 ? (
										<ShieldCheck size={14} />
									) : (
										<AlertTriangle size={14} />
									)
								}
								label={`Avg Condition: ${(avgConditionPct * 100).toFixed(1)}%`}
								size="small"
								sx={{
									height: 24,
									fontWeight: 800,
									fontSize: "0.75rem",
									bgcolor: `${condColor}22`,
									color: condColor,
									border: `1px solid ${condColor}55`,
								}}
							/>
							<Typography
								variant="caption"
								sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.75rem" }}
							>
								Building Age:{" "}
								<strong>
									{minAge === maxAge
										? `${avgAge.toFixed(1)}d`
										: `${minAge.toFixed(1)}d – ${maxAge.toFixed(1)}d (Avg: ${avgAge.toFixed(1)}d)`}
								</strong>{" "}
								/ 180d
								{Math.round(timeOffset) > 0 && ` (+${Math.round(timeOffset)}d)`}
							</Typography>
						</Box>

						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Typography
								variant="caption"
								sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.72rem" }}
							>
								Total Repair Cost ({selectedExchange}):
							</Typography>
							<Typography
								variant="caption"
								sx={{
									color: theme.palette.warning.main,
									fontWeight: 800,
									fontSize: "0.85rem",
									fontFamily: "monospace",
								}}
							>
								{totalRepairCost.toLocaleString()}{" "}
								{getCurrencyLabel(selectedExchange)}{" "}
								<span
									style={{
										color: "rgba(255,255,255,0.5)",
										fontWeight: 500,
										fontSize: "0.75rem",
									}}
								>
									({totalCorpCost.toLocaleString()} ICA)
								</span>
							</Typography>
						</Box>
					</Box>

					{/* Custom Date/Timeline Scrubber & Calendar Picker */}
					<Box sx={{ px: 1, display: "flex", flexDirection: "column", gap: 1 }}>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								flexWrap: "wrap",
								gap: 1,
							}}
						>
							<Box sx={{ display: "flex", flexDirection: "column" }}>
								<Typography
									variant="caption"
									sx={{
										fontSize: "0.7rem",
										color: "rgba(255,255,255,0.6)",
										display: "flex",
										alignItems: "center",
										gap: 0.5,
										fontWeight: 800,
									}}
								>
									<Calendar size={12} /> TARGET REPAIR DATE PLANNER
								</Typography>
								<Typography
									variant="caption"
									sx={{
										fontSize: "0.65rem",
										color: "rgba(255,255,255,0.45)",
										mt: 0.25,
									}}
								>
									Standard thresholds: 60d (conservative), 90d (normal).
									Calculated Optimal:{" "}
									<strong style={{ color: theme.palette.primary.main }}>
										{optimalAge}d
									</strong>{" "}
									(in{" "}
									<strong style={{ color: theme.palette.primary.main }}>
										+{Math.max(0, optimalAge - Math.round(avgAge))}d
									</strong>
									).
								</Typography>
							</Box>

							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Typography
									variant="caption"
									sx={{
										fontSize: "0.72rem",
										fontWeight: 700,
										color: condColor,
									}}
								>
									Avg Age: {Math.min(180, avgAge + timeOffset).toFixed(1)}d /
									180d
								</Typography>

								{/* Themed Number Offset Input */}
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 0.25,
										ml: 1,
									}}
								>
									<Typography
										variant="caption"
										sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}
									>
										Offset:
									</Typography>
									<input
										type="number"
										min={0}
										max={Math.floor(maxTimeOffset)}
										value={Math.round(timeOffset)}
										onChange={(e) => {
											const val = parseInt(e.target.value);
											if (!isNaN(val)) {
												setTimeOffset(
													Math.min(maxTimeOffset, Math.max(0, val)),
												);
											}
										}}
										style={{
											width: "50px",
											background: "rgba(0,0,0,0.5)",
											border: `1px solid ${theme.palette.primary.main}55`,
											borderRadius: "6px",
											color: "white",
											fontSize: "0.7rem",
											padding: "2px 4px",
											textAlign: "center",
											outline: "none",
											fontFamily: "monospace",
											fontWeight: 700,
										}}
									/>
									<Typography
										variant="caption"
										sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}
									>
										days
									</Typography>
								</Box>

								{/* Themed Date Picker */}
								<input
									type="date"
									min={formatDateInput(0)}
									max={formatDateInput(maxTimeOffset)}
									value={formatDateInput(timeOffset)}
									onChange={(e) => handleDateSelect(e.target.value)}
									style={{
										background: "rgba(0,0,0,0.5)",
										border: `1px solid ${theme.palette.primary.main}55`,
										borderRadius: "6px",
										color: "white",
										fontSize: "0.7rem",
										padding: "2px 6px",
										cursor: "pointer",
										outline: "none",
										fontFamily: "monospace",
										marginLeft: "4px",
										fontWeight: 700,
									}}
								/>
							</Box>
						</Box>

						{/* Horizontal Date Scrubber Track */}
						<Box
							sx={{
								display: "flex",
								gap: 0.75,
								overflowX: "auto",
								py: 0.5,
								"&::-webkit-scrollbar": { height: 6 },
								"&::-webkit-scrollbar-thumb": {
									bgcolor: "rgba(255,255,255,0.12)",
									borderRadius: 3,
								},
							}}
						>
							{projectedDays.map((day) => {
								const date = new Date(
									Date.now() + day.offset * 24 * 60 * 60 * 1000,
								);
								const dateLabel =
									day.offset === 0
										? "Today (+0d)"
										: `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} (+${day.offset}d)`;
								const isSelected = Math.round(timeOffset) === day.offset;
								const cellColor = getCondColor(day.conditionPct / 100);

								return (
									<Box
										key={day.offset}
										onClick={() => setTimeOffset(day.offset)}
										sx={{
											minWidth: 120,
											p: 0.75,
											borderRadius: "6px",
											bgcolor: isSelected
												? "rgba(123, 104, 238, 0.25)"
												: "rgba(255,255,255,0.02)",
											border: isSelected
												? "1px solid #7B68EE"
												: "1px solid rgba(255,255,255,0.06)",
											cursor: "pointer",
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											gap: 0.2,
											transition: "all 0.15s ease",
											"&:hover": {
												bgcolor: isSelected
													? "rgba(123, 104, 238, 0.3)"
													: "rgba(255,255,255,0.05)",
												borderColor: isSelected
													? "#7B68EE"
													: "rgba(255,255,255,0.15)",
											},
										}}
									>
										<Typography
											variant="caption"
											sx={{
												fontWeight: 800,
												fontSize: "0.74rem",
												color: "rgba(255,255,255,0.85)",
											}}
										>
											{dateLabel}
										</Typography>
										<Typography
											variant="caption"
											sx={{
												fontWeight: 700,
												fontSize: "0.7rem",
												color: cellColor,
											}}
										>
											{day.conditionPct}%
										</Typography>
										<Typography
											variant="caption"
											sx={{
												fontWeight: 800,
												fontSize: "0.72rem",
												color: theme.palette.warning.main,
												fontFamily: "monospace",
											}}
										>
											{day.totalCost.toLocaleString()}{" "}
											{getCurrencyLabel(selectedExchange)}
										</Typography>

										{Math.round(avgAge + day.offset) === 60 && (
											<Box
												sx={{
													fontSize: "0.55rem",
													bgcolor: "#4caf50",
													color: "white",
													px: 0.5,
													py: 0.1,
													borderRadius: "3px",
													mt: 0.4,
													fontWeight: 900,
													textTransform: "uppercase",
												}}
											>
												60d Mark
											</Box>
										)}
										{Math.round(avgAge + day.offset) === 90 && (
											<Box
												sx={{
													fontSize: "0.55rem",
													bgcolor: "#ff9800",
													color: "white",
													px: 0.5,
													py: 0.1,
													borderRadius: "3px",
													mt: 0.4,
													fontWeight: 900,
													textTransform: "uppercase",
												}}
											>
												90d Mark
											</Box>
										)}
										{Math.round(avgAge + day.offset) === optimalAge && (
											<Box
												sx={{
													fontSize: "0.55rem",
													bgcolor: theme.palette.primary.main,
													color: "white",
													px: 0.5,
													py: 0.1,
													borderRadius: "3px",
													mt: 0.4,
													fontWeight: 900,
													textTransform: "uppercase",
												}}
											>
												Optimal
											</Box>
										)}
									</Box>
								);
							})}
						</Box>
					</Box>
				</Box>

				{/* Side-by-Side Flex Layout on Desktop (md+), Stacked on Mobile (xs) */}
				<Box
					sx={{
						display: "flex",
						flexDirection: { xs: "column", md: "row" },
						gap: 2.5,
					}}
				>
					{/* LEFT COLUMN: Graph */}
					<Box
						sx={{
							flex: 1.2,
							display: "flex",
							flexDirection: "column",
							gap: 1,
							minWidth: 0,
						}}
					>
						<DegradationChart
							timelineGraphData={timelineGraphData}
							chartTab={chartTab}
							setChartTab={setChartTab}
							avgAge={avgAge}
							timeOffset={timeOffset}
							optimalAge={optimalAge}
							selectedExchange={selectedExchange}
							getCurrencyLabel={getCurrencyLabel}
							materialKeys={materialKeys}
							getMatPrice={getMatPrice}
						/>
					</Box>

					{/* RIGHT COLUMN: Buildings */}
					<Box
						sx={{
							flex: 0.8,
							display: "flex",
							flexDirection: "column",
							gap: 1,
							minWidth: 0,
						}}
					>
						<BuildingsList
							platformBreakdown={platformBreakdown}
							timeOffset={timeOffset}
							selectedExchange={selectedExchange}
							getCurrencyLabel={getCurrencyLabel}
							getCondColor={getCondColor}
						/>
					</Box>
				</Box>

				{/* --- SECTION 3: SHOPPING CART REPAIR MATERIALS REQUIRED TABLE --- */}
				<ShoppingCartTable
					materialKeys={materialKeys}
					repairMaterials={repairMaterials}
					getMatPrice={getMatPrice}
					getMatMarketInfo={getMatMarketInfo}
					selectedExchange={selectedExchange}
					getCurrencyLabel={getCurrencyLabel}
					totalVolume={totalVolume}
					totalWeight={totalWeight}
				/>
			</DialogContent>

			{/* Actions Footer */}
			<DialogActions
				sx={{
					px: { xs: 1.5, sm: 2.5 },
					py: 1,
					borderTop: "1px solid rgba(255,255,255,0.08)",
					justifyContent: "space-between",
					gap: 1,
				}}
			>
				<Typography
					variant="caption"
					sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}
				>
					Generates{" "}
					<strong style={{ color: theme.palette.primary.main }}>
						XIT REPAIR
					</strong>{" "}
					command payload
				</Typography>

				<Box sx={{ display: "flex", gap: 1 }}>
					<Button
						onClick={onClose}
						variant="outlined"
						color="inherit"
						size="small"
						sx={{ textTransform: "none", fontSize: "0.75rem" }}
					>
						Close
					</Button>
					<Button
						onClick={(e) => setMenuAnchorEl(e.currentTarget)}
						variant="contained"
						size="small"
						startIcon={<Copy size={14} />}
						sx={{
							bgcolor: theme.palette.primary.main,
							color: "#fff",
							fontWeight: 800,
							fontSize: "0.75rem",
							textTransform: "none",
							"&:hover": { opacity: 0.9 },
						}}
					>
						Copy XIT Repair
					</Button>

					{/* Copy Submenu */}
					<Menu
						anchorEl={menuAnchorEl}
						open={Boolean(menuAnchorEl)}
						onClose={() => setMenuAnchorEl(null)}
						slotProps={{
							paper: {
								sx: {
									bgcolor: "rgba(20, 20, 38, 0.97)",
									border: "1px solid rgba(255,255,255,0.1)",
									color: "white",
								},
							},
						}}
					>
						<MenuItem
							onClick={() => {
								handleCopyRepairXit("TRANSFER");
								setMenuAnchorEl(null);
							}}
							sx={{
								fontSize: "0.75rem",
								fontWeight: 700,
								"&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
							}}
						>
							Just Transfer XIT
						</MenuItem>
						<MenuItem
							onClick={() => {
								handleCopyRepairXit("BUY_TRANSFER");
								setMenuAnchorEl(null);
							}}
							sx={{
								fontSize: "0.75rem",
								fontWeight: 700,
								"&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
							}}
						>
							Buy & Transfer XIT
						</MenuItem>
					</Menu>
				</Box>
			</DialogActions>
		</Dialog>
	);
};
