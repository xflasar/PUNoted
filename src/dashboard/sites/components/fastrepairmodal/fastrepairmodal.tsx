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
import { copyToClipboard } from "../../../production/components/sitedrawer/utils";
import { generateXit, XitAction } from "../../../../utils/xitgenerator";
import { CX_EXCHANGES, MATERIAL_COLORS } from "./utils";
import { useFastRepair } from "./usefastrepair";
import type { FastRepairModalProps } from "./types";

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

	// XIT Command Payload Mode ("TRANSFER" | "BUY_TRANSFER")
	const [xitMode, setXitMode] = useState<"TRANSFER" | "BUY_TRANSFER">(
		"TRANSFER",
	);

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

	// Color helper
	const getCondColor = (cond: number) => {
		if (cond >= 0.85) return theme.palette.success.main;
		if (cond >= 0.6) return theme.palette.warning.main;
		return theme.palette.error.main;
	};

	const condColor = getCondColor(avgConditionPct);

	const handleCopyRepairXit = () => {
		if (Object.keys(repairMaterials).length === 0) {
			if (onShowSnackbar)
				onShowSnackbar("No repair materials needed for selected buildings!");
			return;
		}

		let actions: XitAction[] = [];
		if (xitMode === "TRANSFER") {
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
				`Copied XIT Repair payload (${xitMode === "TRANSFER" ? "Just Transfer" : "Buy & Transfer"}) for ${siteName} to clipboard!`,
			);
	};

	const materialKeys = useMemo(
		() => Object.keys(repairMaterials).sort(),
		[repairMaterials],
	);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullScreen={isMobile}
			maxWidth="md"
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
					py: 1.25,
					px: { xs: 1.5, sm: 2.5 },
					borderBottom: "1px solid rgba(255,255,255,0.08)",
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
					py: 2,
					display: "flex",
					flexDirection: "column",
					gap: 2.5,
					maxHeight: "82vh",
					overflowY: "auto",
				}}
			>
				{/* --- CONDITION STATUS & TIMELINE CONTROLS CARD --- */}
				<Box
					sx={{
						p: 2,
						borderRadius: "10px",
						bgcolor: "rgba(0, 0, 0, 0.4)",
						border: `1px solid ${condColor}44`,
						display: "flex",
						flexDirection: "column",
						gap: 1.5,
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
								${totalRepairCost.toLocaleString()}{" "}
								<span
									style={{
										color: "rgba(255,255,255,0.5)",
										fontWeight: 500,
										fontSize: "0.75rem",
									}}
								>
									(${totalCorpCost.toLocaleString()} CORP)
								</span>
							</Typography>
						</Box>
					</Box>

					{/* Time Offset Scrubber Slider bounded to maxTimeOffset */}
					<Box sx={{ px: 1 }}>
						<Box
							sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
						>
							<Typography
								variant="caption"
								sx={{
									fontSize: "0.7rem",
									color: "rgba(255,255,255,0.6)",
									display: "flex",
									alignItems: "center",
									gap: 0.5,
								}}
							>
								<Calendar size={12} /> Time Offset (Days into the future)
							</Typography>
							<Typography
								variant="caption"
								sx={{ fontSize: "0.72rem", fontWeight: 700, color: condColor }}
							>
								+{Math.round(timeOffset)} Days (Target Avg Age:{" "}
								{Math.min(180, avgAge + timeOffset).toFixed(1)}d / 180d)
							</Typography>
						</Box>

						<Slider
							value={timeOffset}
							min={0}
							max={maxTimeOffset}
							step={1}
							onChange={(_, v) => setTimeOffset(v as number)}
							sx={{
								color: condColor,
								height: 6,
								"& .MuiSlider-thumb": { width: 14, height: 14 },
								"& .MuiSlider-track": { bgcolor: condColor },
								"& .MuiSlider-rail": { bgcolor: "rgba(255,255,255,0.15)" },
							}}
						/>
					</Box>
				</Box>

				{/* --- SECTION 1: RECHARTS GRAPH ANALYTICS --- */}
				<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography
							variant="subtitle2"
							sx={{
								fontWeight: 800,
								fontSize: "0.8rem",
								color: theme.palette.primary.main,
							}}
						>
							DEGRADATION ANALYTICS & PROJECTION
						</Typography>

						<ToggleButtonGroup
							size="small"
							value={chartTab}
							exclusive
							onChange={(_, v) => v && setChartTab(v)}
							sx={{
								height: 24,
								bgcolor: "rgba(0,0,0,0.5)",
								border: "1px solid rgba(123, 104, 238, 0.2)",
								borderRadius: "6px",
								"& .MuiToggleButton-root": {
									py: 0,
									px: 1,
									fontSize: "0.68rem",
									fontWeight: 700,
									color: "rgba(255,255,255,0.6)",
									border: "none",
									"&.Mui-selected": { color: "white", bgcolor: "#7B68EE" },
								},
							}}
						>
							<ToggleButton value="cost">
								<DollarSign size={12} style={{ marginRight: 3 }} /> Repair &
								Profit
							</ToggleButton>
							<ToggleButton value="items">
								<Package size={12} style={{ marginRight: 3 }} /> Material Items
								(u)
							</ToggleButton>
						</ToggleButtonGroup>
					</Box>

					<Box
						sx={{
							width: "100%",
							height: 210,
							bgcolor: "rgba(0,0,0,0.3)",
							p: 1,
							borderRadius: "8px",
							border: "1px solid rgba(255,255,255,0.06)",
						}}
					>
						<ResponsiveContainer width="100%" height="100%">
							{chartTab === "cost" ? (
								<AreaChart
									data={timelineGraphData}
									margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
								>
									<defs>
										<linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#ffd700" stopOpacity={0.4} />
											<stop
												offset="95%"
												stopColor="#ffd700"
												stopOpacity={0.0}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="rgba(255,255,255,0.08)"
									/>
									<XAxis
										dataKey="day"
										type="number"
										domain={[0, 180]}
										stroke="rgba(255,255,255,0.5)"
										fontSize={11}
										tickFormatter={(v) => `${v}d`}
									/>
									<YAxis
										stroke={theme.palette.warning.main}
										fontSize={11}
										tickFormatter={(v) => `$${v.toLocaleString()}`}
									/>
									<YAxis
										yAxisId="right"
										orientation="right"
										domain={[0, 100]}
										stroke="#69f0ae"
										fontSize={11}
										tickFormatter={(v) => `${v}%`}
									/>
									<RechartsTooltip
										wrapperStyle={{ zIndex: 99999 }}
										contentStyle={{
											bgcolor: "rgba(16,16,32,0.95)",
											borderColor: theme.palette.warning.main,
											borderRadius: 8,
											fontSize: "0.75rem",
											zIndex: 99999,
										}}
										formatter={(val: any, name: any) =>
											name.includes("Condition")
												? [`${val}%`, name]
												: [`$${Number(val).toLocaleString()}`, name]
										}
									/>
									<Legend
										wrapperStyle={{ fontSize: "0.72rem", paddingTop: 4 }}
									/>
									<Area
										type="monotone"
										dataKey="totalCost"
										name="Total Repair Cost ($)"
										stroke="#ffd700"
										strokeWidth={2.5}
										fillOpacity={1}
										fill="url(#costGrad)"
									/>
									<Line
										type="monotone"
										dataKey="dailyProfit"
										name="Projected Daily Profit (Est)"
										stroke="rgba(255,255,255,0.25)"
										strokeDasharray="4 4"
										strokeWidth={2}
										dot={{ r: 2 }}
									/>
									<Line
										yAxisId="right"
										type="monotone"
										dataKey="conditionPct"
										name="Condition (%)"
										stroke="#69f0ae"
										strokeWidth={2.5}
										dot={{ r: 2 }}
									/>
									<ReferenceLine
										x={Math.round(avgAge + timeOffset)}
										stroke="#7B68EE"
										strokeDasharray="3 3"
										label={{
											value: "Target",
											fill: "#7B68EE",
											fontSize: 10,
											position: "top",
										}}
									/>
								</AreaChart>
							) : (
								<LineChart
									data={timelineGraphData}
									margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="rgba(255,255,255,0.08)"
									/>
									<XAxis
										dataKey="day"
										type="number"
										domain={[0, 180]}
										stroke="rgba(255,255,255,0.5)"
										fontSize={11}
										tickFormatter={(v) => `${v}d`}
									/>
									<YAxis
										stroke="#00e5ff"
										fontSize={11}
										tickFormatter={(v) => `${v} u`}
									/>
									<RechartsTooltip
										wrapperStyle={{ zIndex: 99999 }}
										contentStyle={{
											bgcolor: "rgba(16,16,32,0.95)",
											borderColor: theme.palette.primary.main,
											borderRadius: 8,
											fontSize: "0.75rem",
											zIndex: 99999,
										}}
										formatter={(val: any, name: any) => [`${val} u`, name]}
									/>
									<Legend
										wrapperStyle={{ fontSize: "0.72rem", paddingTop: 4 }}
									/>
									<ReferenceLine
										x={Math.round(avgAge + timeOffset)}
										stroke="#7B68EE"
										strokeDasharray="3 3"
										label={{
											value: "Target",
											fill: "#7B68EE",
											fontSize: 10,
											position: "top",
										}}
									/>
									{materialKeys.map((mat) => (
										<Line
											key={mat}
											type="monotone"
											dataKey={mat}
											name={mat}
											stroke={MATERIAL_COLORS[mat] || "#00e5ff"}
											strokeWidth={2}
											dot={{ r: 2 }}
										/>
									))}
								</LineChart>
							)}
						</ResponsiveContainer>
					</Box>
				</Box>

				{/* --- SECTION 2: PRODUCTION BUILDINGS --- */}
				<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography
							variant="subtitle2"
							sx={{
								fontWeight: 800,
								fontSize: "0.8rem",
								color: theme.palette.primary.main,
							}}
						>
							PRODUCTION BUILDINGS ({platformBreakdown.length})
						</Typography>
					</Box>

					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 0.75,
							maxHeight: 150,
							overflowY: "auto",
							pr: 0.5,
						}}
					>
						{groupedBuildings.map((g) => {
							const bColor = getCondColor(g.avgCondition);

							return (
								<Box
									key={g.ticker}
									sx={{
										p: 0.75,
										bgcolor: "rgba(0, 0, 0, 0.4)",
										borderRadius: "8px",
										border: `1px solid ${bColor}44`,
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										gap: 1.5,
									}}
								>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<Typography
											variant="body2"
											sx={{
												fontWeight: 900,
												color: "#00e5ff",
												fontFamily: "monospace",
												minWidth: 40,
											}}
										>
											{g.ticker}
										</Typography>
										<Chip
											label={`${g.count} unit${g.count > 1 ? "s" : ""}`}
											size="small"
											sx={{
												height: 18,
												fontSize: "0.65rem",
												fontWeight: 800,
												bgcolor: "rgba(255,255,255,0.08)",
												color: "rgba(255,255,255,0.8)",
												border: "1px solid rgba(255,255,255,0.15)",
											}}
										/>
									</Box>

									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 2,
											flex: 1,
											justifyContent: "flex-end",
											pr: 2,
										}}
									>
										<Typography
											variant="caption"
											sx={{
												fontWeight: 700,
												color: bColor,
												fontSize: "0.72rem",
											}}
										>
											Avg Cond: {(g.avgCondition * 100).toFixed(0)}%
											&nbsp;|&nbsp; Age:{" "}
											{g.minAge === g.maxAge
												? `${g.minAge.toFixed(0)}d`
												: `${g.minAge.toFixed(0)}–${g.maxAge.toFixed(0)}d`}
										</Typography>
										<Typography
											variant="caption"
											sx={{
												fontWeight: 800,
												color: theme.palette.warning.main,
												fontFamily: "monospace",
												fontSize: "0.78rem",
											}}
										>
											${g.totalCost.toLocaleString()}
										</Typography>
									</Box>

									{/* Mini Material Badges */}
									<Box
										sx={{
											display: "flex",
											flexWrap: "wrap",
											gap: 0.25,
											justifyContent: "flex-end",
											maxWidth: 120,
										}}
									>
										{Object.entries(g.materials).map(([m, q]) => (
											<MuiTooltip key={m} title={`${m}: ${q} u`}>
												<Box sx={{ fontSize: "0.6em" }}>
													<MaterialBadge ticker={m} />
												</Box>
											</MuiTooltip>
										))}
									</Box>
								</Box>
							);
						})}
					</Box>
				</Box>

				{/* --- SECTION 3: SHOPPING CART REPAIR MATERIALS REQUIRED TABLE --- */}
				<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography
							variant="subtitle2"
							sx={{
								fontWeight: 800,
								fontSize: "0.8rem",
								color: theme.palette.primary.main,
								display: "flex",
								alignItems: "center",
								gap: 0.5,
							}}
						>
							<ShoppingCart size={15} /> SHOPPING CART (REPAIR MATERIALS
							REQUIRED)
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.6)",
								fontSize: "0.7rem",
								fontFamily: "monospace",
							}}
						>
							Payload: {totalVolume.toFixed(1)} m³ &nbsp;|&nbsp;{" "}
							{totalWeight.toFixed(1)} t
						</Typography>
					</Box>

					<Table
						size="small"
						sx={{
							bgcolor: "rgba(0,0,0,0.3)",
							borderRadius: "8px",
							overflow: "hidden",
						}}
					>
						<TableHead sx={{ bgcolor: `${theme.palette.primary.main}15` }}>
							<TableRow>
								<TableCell
									sx={{
										color: theme.palette.primary.main,
										fontWeight: 800,
										py: 0.5,
									}}
								>
									Material
								</TableCell>
								<TableCell
									align="right"
									sx={{
										color: theme.palette.primary.main,
										fontWeight: 800,
										py: 0.5,
									}}
								>
									Required Qty
								</TableCell>
								<TableCell
									align="right"
									sx={{
										color: theme.palette.primary.main,
										fontWeight: 800,
										py: 0.5,
									}}
								>
									Price ({selectedExchange})
								</TableCell>
								<TableCell
									align="right"
									sx={{
										color: theme.palette.primary.main,
										fontWeight: 800,
										py: 0.5,
									}}
								>
									Total Cost
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{materialKeys.length > 0 ? (
								materialKeys.map((mat) => {
									const qty = repairMaterials[mat] || 0;
									const unitPrice = getMatPrice(mat);
									const matCost = qty * unitPrice;
									const info = getMatMarketInfo(mat);

									return (
										<TableRow
											key={mat}
											sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}
										>
											<TableCell sx={{ py: 0.4 }}>
												<MaterialBadge ticker={mat} />
											</TableCell>
											<TableCell
												align="right"
												sx={{
													py: 0.4,
													fontFamily: "monospace",
													fontSize: "0.78rem",
													fontWeight: 700,
													color: "white",
												}}
											>
												{qty.toLocaleString()} u
											</TableCell>
											<TableCell
												align="right"
												sx={{
													py: 0.4,
													fontFamily: "monospace",
													fontSize: "0.75rem",
													color: "rgba(255,255,255,0.6)",
													lineHeight: 1.2,
												}}
											>
												<div>
													${unitPrice.toLocaleString()}{" "}
													<span
														style={{
															color: "rgba(255,255,255,0.45)",
															fontSize: "0.68rem",
														}}
													>
														(${info.corpPrice.toLocaleString()} CORP)
													</span>
												</div>
												<div
													style={{
														fontSize: "0.65rem",
														color: theme.palette.primary.main,
													}}
												>
													CX Avail: {info.cxAvail.toLocaleString()} u
												</div>
											</TableCell>
											<TableCell
												align="right"
												sx={{
													py: 0.4,
													fontFamily: "monospace",
													fontSize: "0.78rem",
													fontWeight: 700,
													color: theme.palette.warning.main,
												}}
											>
												<div>${matCost.toLocaleString()}</div>
												<div
													style={{
														color: "rgba(255,255,255,0.45)",
														fontSize: "0.68rem",
														fontWeight: 500,
													}}
												>
													(${(qty * info.corpPrice).toLocaleString()} CORP)
												</div>
											</TableCell>
										</TableRow>
									);
								})
							) : (
								<TableRow>
									<TableCell
										colSpan={4}
										align="center"
										sx={{
											py: 2,
											color: "rgba(255,255,255,0.5)",
											fontStyle: "italic",
											fontSize: "0.75rem",
										}}
									>
										No repair materials needed for selected buildings!
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</Box>
			</DialogContent>

			{/* Actions Footer */}
			<DialogActions
				sx={{
					px: { xs: 1.5, sm: 2.5 },
					py: 1.5,
					borderTop: "1px solid rgba(255,255,255,0.08)",
					justifyContent: "space-between",
				}}
			>
				<Typography
					variant="caption"
					sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}
				>
					Generates <strong style={{ color: condColor }}>XIT REPAIR</strong>{" "}
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
						onClick={handleCopyRepairXit}
						variant="contained"
						size="small"
						startIcon={<Copy size={14} />}
						sx={{
							bgcolor: condColor,
							color: "#fff",
							fontWeight: 800,
							fontSize: "0.75rem",
							textTransform: "none",
							"&:hover": { opacity: 0.9 },
						}}
					>
						Copy XIT Repair
					</Button>
				</Box>
			</DialogActions>
		</Dialog>
	);
};
