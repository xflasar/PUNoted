import React from "react";
import {
	Box,
	Typography,
	Card,
	CardContent,
	IconButton,
	Chip,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	alpha,
	FormControl,
	Select,
	MenuItem,
	useTheme,
	Switch,
	FormControlLabel,
	Tabs,
	Tab,
	TextField,
} from "@mui/material";
import {
	Add as AddIcon,
	Remove as RemoveIcon,
	RequestQuote as PriceIcon,
} from "@mui/icons-material";
import { formatCurrency } from "./helpers";
import { WORKER_NEEDS, EXPERT_CATEGORIES } from "./constants";

/**
 * Properties for the TopMetricsGrid component.
 */
export interface TopMetricsGridProps {
	/** The active base data including platforms and infrastructure */
	activeData: any;
	/** The total amount of area currently utilized by the base */
	usedArea: number;
	/** The maximum amount of area allowed by the current permit level */
	permitArea: number;
	/** The total capital expenditure required to build the base */
	totalCapEx: number;
	/** The maximum weight capacity of the base's storage */
	storageMaxWeight: number;
	/** The maximum volume capacity of the base's storage */
	storageMaxVolume: number;
	/** Data regarding workforce demand, supply, and efficiency */
	workforce: Record<string, any>;
	/** Map of currently satisfied worker luxuries */
	activeNeeds: Record<string, Record<string, boolean>>;
	/** Handler to toggle the status of a specific luxury need for a worker tier */
	setActiveNeeds: React.Dispatch<
		React.SetStateAction<Record<string, Record<string, boolean>>>
	>;
	/** Handler to increase or decrease the current HQ permit level */
	handleAdjustPermit: (change: number) => void;
	/** Currently active COGC (Chamber of Global Commerce) program */
	activeCogc: string | null;
	/** Handler to change the active COGC program */
	setActiveCogc: (cogc: string | null) => void;
	/** The base planet resource factor multiplier (e.g., 100 = 100%) */
	planetFactor: number;
	/** Handler to update the planet's resource factor */
	setPlanetFactor: (factor: number) => void;
	/** Calculated material input/output rates and deltas over 24h */
	materialIO: Record<string, any>;
	/** Determines if the I/O table displays profit or pure import/export actions */
	ioDisplayMode: "profit" | "importExport";
	/** Handler to toggle the I/O display mode */
	setIoDisplayMode: (mode: "profit" | "importExport") => void;
	/** The estimated daily profit calculated from material deltas and pricing */
	totalDailyProfit: number;
	/** Total daily volume import across all materials */
	totalVolumeImport?: number;
	/** Total daily volume export across all materials */
	totalVolumeExport?: number;
	/** Function to fetch the active price for a given material ticker */
	getPrice: (ticker: string) => number;
}

/**
 * TopMetricsGrid Component
 *
 * Displays the high-level dashboard metrics for the base planner. It is split into three main columns:
 * 1. Site Data & Storage: Area usage, CapEx, planet factors, and storage capacities.
 * 2. Workforce Luxuries: Worker supply/demand, efficiency, and toggles for active luxury provisions.
 * 3. Material I/O: The 24h summary of consumed and produced materials, including daily profit estimates.
 */
export const TopMetricsGrid: React.FC<TopMetricsGridProps> = ({
	activeData,
	usedArea,
	permitArea,
	totalCapEx,
	storageMaxWeight,
	storageMaxVolume,
	workforce,
	activeNeeds,
	setActiveNeeds,
	handleAdjustPermit,
	activeCogc,
	setActiveCogc,
	planetFactor,
	setPlanetFactor,
	materialIO,
	ioDisplayMode,
	setIoDisplayMode,
	totalDailyProfit,
	totalVolumeImport = 0,
	totalVolumeExport = 0,
	getPrice,
}) => {
	const theme = useTheme();
	const [ioTab, setIoTab] = React.useState<"io" | "supply">("io");
	const [supplyDays, setSupplyDays] = React.useState<number>(7);
	const dailyCost = React.useMemo(() => {
		let sum = 0;
		Object.entries(materialIO || {}).forEach(([ticker, v]: any) => {
			const cons = Number(v?.cons || 0);
			if (cons > 0) sum += cons * getPrice(ticker);
		});
		return sum;
	}, [materialIO, getPrice]);
	const dailyRevenue = React.useMemo(() => {
		let sum = 0;
		Object.entries(materialIO || {}).forEach(([ticker, v]: any) => {
			const prod = Number(v?.prod || 0);
			if (prod > 0) sum += prod * getPrice(ticker);
		});
		return sum;
	}, [materialIO, getPrice]);
	const profitPerArea = usedArea > 0 ? totalDailyProfit / usedArea : 0;
	const rio = dailyCost > 0 ? dailyRevenue / dailyCost : null;
	// TODO: Replace with real PU base degradation calculation when provided.
	const degradation = React.useMemo(() => {
		const utilization = permitArea > 0 ? usedArea / permitArea : 0;
		return Math.min(1, Math.max(0, utilization)) * 0.02; // mock: up to 2%/day at full utilization
	}, [usedArea, permitArea]);
	// Consolidate materials from actual storage and planned IO to display in the storage view
	const storageMaterials = Array.from(
		new Set([
			...(activeData.storage || []).map((s: any) => s.ticker),
			...Object.keys(materialIO || {}),
		]),
	).sort();
	const allWorkers = [
		"Pioneer",
		"Settler",
		"Technician",
		"Engineer",
		"Scientist",
	];

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: { xs: "column", lg: "row" },
				gap: 2,
				height: "100%",
				minHeight: 0,
				width: "100%",
			}}
		>
			{/* COLUMN 1: Site Data & Storage */}
			<Box
				sx={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					gap: 2,
					minHeight: 0,
				}}
			>
				{/* Site Metrics Card */}
				<Card
					variant="outlined"
					sx={{
						display: "flex",
						flexDirection: "column",
						flexShrink: 0,
						bgcolor: "background.default",
					}}
				>
					<Box
						sx={{
							p: 1,
							px: 1.5,
							borderBottom: "1px solid",
							borderColor: "divider",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
							Site Data
						</Typography>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								bgcolor: "action.hover",
								borderRadius: 1,
								px: 0.5,
							}}
						>
							<IconButton
								size="small"
								onClick={() => handleAdjustPermit(-1)}
								disabled={activeData.permitLevel <= 1}
								sx={{ p: 0.15 }}
							>
								<RemoveIcon fontSize="small" />
							</IconButton>
							<Typography variant="body2" sx={{ px: 0.5, fontWeight: "bold" }}>
								Permit {activeData.permitLevel}
							</Typography>
							<IconButton
								size="small"
								onClick={() => handleAdjustPermit(1)}
								disabled={activeData.permitLevel >= 3}
								sx={{ p: 0.15 }}
							>
								<AddIcon fontSize="small" />
							</IconButton>
						</Box>
					</Box>
					<CardContent sx={{ p: 1.5, py: 1 }}>
						<Box
							sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
						>
							<Typography variant="body2" color="text.secondary">
								Area Usage
							</Typography>
							<Typography
								variant="body2"
								color={usedArea > permitArea ? "error.main" : "text.secondary"}
								sx={{ fontWeight: "bold" }}
							>
								{usedArea}/{permitArea}
							</Typography>
						</Box>
						{/* Area Usage Progress Bar */}
						<Box
							sx={{
								height: 6,
								bgcolor: "action.hover",
								borderRadius: 1,
								mb: 1,
								overflow: "hidden",
							}}
						>
							<Box
								sx={{
									width: `${Math.min(100, (usedArea / permitArea) * 100)}%`,
									height: "100%",
									bgcolor:
										usedArea > permitArea ? "error.main" : "success.main",
								}}
							/>
						</Box>
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{ display: "flex", alignItems: "center", mb: 1 }}
						>
							<PriceIcon sx={{ fontSize: "1.2rem", mr: 0.5 }} /> CapEx:{" "}
							<span
								style={{
									color: theme.palette.info.main,
									fontWeight: "bold",
									marginLeft: 4,
								}}
							>
								${formatCurrency(totalCapEx)}
							</span>
						</Typography>

						{/* Global Efficiency Modifiers */}
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								pt: 1,
								borderTop: "1px solid",
								borderColor: "divider",
							}}
						>
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ fontWeight: "bold" }}
							>
								COGM Active:
							</Typography>
							<FormControl size="small" sx={{ minWidth: 120 }}>
								<Select
									value={activeCogc || ""}
									displayEmpty
									sx={{ height: 26, fontSize: "0.8rem" }}
									onChange={(e) => setActiveCogc(e.target.value || null)}
									MenuProps={{
										slotProps: {
											paper: {
												sx: {
													bgcolor: "background.default",
													backgroundImage: "none",
												},
											},
										},
									}}
								>
									<MenuItem value="" sx={{ fontSize: "0.8rem" }}>
										<em>None</em>
									</MenuItem>
									{EXPERT_CATEGORIES.map((c) => (
										<MenuItem key={c} value={c} sx={{ fontSize: "0.8rem" }}>
											{c}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Box>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								pt: 1,
								mt: 1,
								borderTop: "1px solid",
								borderColor: "divider",
							}}
						>
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ fontWeight: "bold" }}
							>
								Planet Fertility / Res %:
							</Typography>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									border: "1px solid",
									borderColor: "divider",
									borderRadius: 1,
									px: 1,
									height: 26,
									bgcolor: "background.paper",
								}}
							>
								<input
									type="text"
									value={planetFactor}
									onChange={(e) =>
										setPlanetFactor(parseFloat(e.target.value) || 0)
									}
									style={{
										width: 50,
										background: "transparent",
										border: "none",
										color: "inherit",
										outline: "none",
										textAlign: "center",
										fontWeight: "bold",
									}}
								/>
							</Box>
						</Box>
					</CardContent>
				</Card>

				{/* Storage Overview Card */}
				<Card
					variant="outlined"
					sx={{
						flexGrow: 1,
						display: "flex",
						flexDirection: "column",
						minHeight: 0,
						bgcolor: "background.default",
					}}
				>
					<Box
						sx={{
							p: 1,
							px: 1.5,
							borderBottom: "1px solid",
							borderColor: "divider",
						}}
					>
						<Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
							Storage & Inventory
						</Typography>
					</Box>
					<CardContent
						sx={{
							p: 1,
							px: 1.5,
							overflowY: "auto",
							display: "flex",
							flexDirection: "column",
						}}
					>
						<Box
							sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
						>
							<Typography variant="body2" sx={{ fontWeight: "bold" }}>
								Capacity (Vol / Wgt)
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{storageMaxVolume} m³ / {storageMaxWeight} t
							</Typography>
						</Box>
						<Box sx={{ mb: 1 }}>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography variant="caption" color="text.secondary">
									Daily freight (m³)
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Imp {formatCurrency(totalVolumeImport)} / Exp{" "}
									{formatCurrency(totalVolumeExport)}
								</Typography>
							</Box>
							<Box
								sx={{
									height: 6,
									bgcolor: "action.hover",
									borderRadius: 1,
									overflow: "hidden",
									mt: 0.5,
									display: "flex",
								}}
							>
								<Box
									sx={{
										width: `${Math.min(100, (totalVolumeImport / Math.max(1, totalVolumeImport + totalVolumeExport)) * 100)}%`,
										bgcolor: "warning.main",
									}}
								/>
								<Box
									sx={{
										width: `${Math.min(100, (totalVolumeExport / Math.max(1, totalVolumeImport + totalVolumeExport)) * 100)}%`,
										bgcolor: "success.main",
									}}
								/>
							</Box>
						</Box>
						{storageMaterials.length > 0 ? (
							<Box
								sx={{
									display: "grid",
									gridTemplateColumns: "repeat(auto-fill, minmax(65px, 1fr))",
									gap: 0.5,
								}}
							>
								{storageMaterials.map((ticker) => {
									const actualAmt =
										activeData.storage?.find((s: any) => s.ticker === ticker)
											?.amount || 0;
									const plannedDelta = materialIO[ticker]?.delta || 0;
									if (actualAmt === 0 && plannedDelta === 0) return null;

									return (
										<Box
											key={ticker}
											sx={{
												border: "1px solid",
												borderColor: "divider",
												borderRadius: 1,
												p: 0.5,
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												bgcolor:
													plannedDelta > 0
														? alpha(theme.palette.warning.light, 0.1)
														: "background.paper",
											}}
										>
											<Typography
												variant="body2"
												sx={{ fontWeight: "bold", lineHeight: 1.2 }}
											>
												{ticker}
											</Typography>
											<Typography
												variant="caption"
												color="text.secondary"
												sx={{ lineHeight: 1.2 }}
											>
												{actualAmt}
											</Typography>
											{plannedDelta !== 0 && (
												<Typography
													variant="caption"
													color={
														plannedDelta > 0 ? "warning.main" : "error.main"
													}
													sx={{ fontWeight: "bold", lineHeight: 1.2 }}
												>
													{plannedDelta > 0 ? "+" : ""}
													{plannedDelta.toFixed(1)}/d
												</Typography>
											)}
										</Box>
									);
								})}
							</Box>
						) : (
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ fontStyle: "italic" }}
							>
								No materials.
							</Typography>
						)}
					</CardContent>
				</Card>
			</Box>

			{/* COLUMN 2: Workforce */}
			<Card
				variant="outlined"
				sx={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					minHeight: 0,
					bgcolor: "background.default",
				}}
			>
				<Box
					sx={{
						p: 1,
						px: 1.5,
						borderBottom: "1px solid",
						borderColor: "divider",
					}}
				>
					<Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
						Workforce
					</Typography>
				</Box>
				<Box
					sx={{
						px: 1.5,
						py: 1,
						borderBottom: "1px solid",
						borderColor: "divider",
					}}
				>
					<Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
						<Box>
							<Typography variant="caption" color="text.secondary">
								Daily Cost
							</Typography>
							<Typography
								variant="body2"
								sx={{ fontWeight: "bold" }}
								color="error.main"
							>
								-${formatCurrency(dailyCost)}/d
							</Typography>
						</Box>
						<Box>
							<Typography variant="caption" color="text.secondary">
								Daily Profit
							</Typography>
							<Typography
								variant="body2"
								sx={{ fontWeight: "bold" }}
								color={totalDailyProfit >= 0 ? "success.main" : "error.main"}
							>
								{totalDailyProfit >= 0 ? "+" : ""}$
								{formatCurrency(totalDailyProfit)}/d
							</Typography>
						</Box>
						<Box>
							<Typography variant="caption" color="text.secondary">
								Plan Cost
							</Typography>
							<Typography
								variant="body2"
								sx={{ fontWeight: "bold" }}
								color="info.main"
							>
								${formatCurrency(totalCapEx)}
							</Typography>
						</Box>
						<Box>
							<Typography variant="caption" color="text.secondary">
								Profit / Area
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: "bold" }}>
								${formatCurrency(profitPerArea)}/a
							</Typography>
						</Box>
						<Box>
							<Typography variant="caption" color="text.secondary">
								RIO
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: "bold" }}>
								{rio ? rio.toFixed(2) : "—"}
							</Typography>
						</Box>
						<Box>
							<Typography variant="caption" color="text.secondary">
								Degradation
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: "bold" }}>
								{(degradation * 100).toFixed(2)}%/d
							</Typography>
						</Box>
					</Box>
				</Box>
				<Box sx={{ overflowY: "auto", flexGrow: 1 }}>
					<Table size="small" padding="none" stickyHeader>
						<TableHead>
							<TableRow
								sx={{
									"& th": {
										px: 1,
										py: 0.5,
										bgcolor: "background.default",
										fontSize: "0.8rem",
									},
								}}
							>
								<TableCell>Type</TableCell>
								<TableCell align="center">Eff.</TableCell>
								<TableCell align="center">D/S</TableCell>
								<TableCell>Needs</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{allWorkers.map((name: string) => {
								const data = workforce[name] || {
									demand: 0,
									supply: 0,
									efficiency: 100,
								};
								const n = WORKER_NEEDS[name] || { luxuries: [] };
								return (
									<TableRow
										key={name}
										sx={{
											"& td": {
												px: 1,
												py: 1.5,
												borderBottom: "1px solid",
												borderColor: "divider",
											},
										}}
									>
										<TableCell>
											<Typography variant="body2" sx={{ fontWeight: "bold" }}>
												{name.substring(0, 3)}
											</Typography>
										</TableCell>
										<TableCell align="center">
											<Typography
												variant="body2"
												color={
													data.efficiency < 100
														? "warning.main"
														: "success.main"
												}
												sx={{ fontWeight: "bold" }}
											>
												{data.efficiency.toFixed(0)}%
											</Typography>
										</TableCell>
										<TableCell align="center">
											<Typography
												variant="body2"
												color={
													data.supply < data.demand
														? "error.main"
														: "text.secondary"
												}
											>
												{data.demand}/{data.supply}
											</Typography>
										</TableCell>
										<TableCell>
											<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
												{n.luxuries.length === 0 ? (
													<Typography variant="caption" color="text.secondary">
														None
													</Typography>
												) : (
													n.luxuries.map((need: string) => {
														const active = activeNeeds[name]?.[need];
														return (
															<Chip
																key={need}
																label={need}
																size="small"
																variant={active ? "filled" : "outlined"}
																color={active ? "secondary" : "default"}
																onClick={() =>
																	setActiveNeeds((p: any) => ({
																		...p,
																		[name]: {
																			...p[name],
																			[need]: !p[name]?.[need],
																		},
																	}))
																}
																sx={{
																	height: 22,
																	fontSize: "0.7rem",
																	cursor: "pointer",
																}}
															/>
														);
													})
												)}
											</Box>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</Box>
			</Card>

			{/* COLUMN 3: Material I/O & Profitability */}
			<Card
				variant="outlined"
				sx={{
					flex: 1.3,
					display: "flex",
					flexDirection: "column",
					minHeight: 0,
					bgcolor: "background.default",
				}}
			>
				<Box
					sx={{
						p: 1,
						px: 1.5,
						borderBottom: "1px solid",
						borderColor: "divider",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						bgcolor: alpha(theme.palette.success.main, 0.05),
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
							Material
						</Typography>
						<Tabs
							value={ioTab}
							onChange={(_, v) => setIoTab(v)}
							sx={{
								minHeight: 26,
								"& .MuiTab-root": { minHeight: 26, fontSize: "0.75rem", px: 1 },
							}}
						>
							<Tab value="io" label="I/O (24h)" />
							<Tab value="supply" label="Supply" />
						</Tabs>
					</Box>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						{ioTab === "io" ? (
							<FormControlLabel
								control={
									<Switch
										size="small"
										checked={ioDisplayMode === "importExport"}
										onChange={(e) =>
											setIoDisplayMode(
												e.target.checked ? "importExport" : "profit",
											)
										}
									/>
								}
								label={
									<Typography variant="body2" sx={{ fontWeight: "bold" }}>
										{ioDisplayMode === "profit" ? "Profit/Day" : "Actions"}
									</Typography>
								}
								sx={{ m: 0 }}
							/>
						) : (
							<TextField
								label="Days"
								size="small"
								type="number"
								value={supplyDays}
								onChange={(e) =>
									setSupplyDays(
										Math.max(1, Math.min(365, Number(e.target.value) || 1)),
									)
								}
								slotProps={{ htmlInput: { style: { textAlign: "center" } } }}
								sx={{ width: 90 }}
							/>
						)}
						<Typography
							variant="subtitle2"
							color={totalDailyProfit >= 0 ? "success.main" : "error.main"}
							sx={{ fontWeight: "bold" }}
						>
							{ioTab === "io" ? (
								<>
									{totalDailyProfit >= 0 ? "+" : ""}$
									{formatCurrency(totalDailyProfit)}/d
								</>
							) : (
								<>
									-
									{formatCurrency(
										Object.entries(materialIO || {}).reduce(
											(acc, [ticker, d]: any) => {
												const cons = Number(d?.cons || 0);
												if (cons <= 0) return acc;
												return acc + cons * getPrice(ticker) * supplyDays;
											},
											0,
										),
									)}
								</>
							)}
						</Typography>
					</Box>
				</Box>
				<Box sx={{ overflowY: "auto", flexGrow: 1 }}>
					{ioTab === "supply" ? (
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow
									sx={{
										"& th": {
											bgcolor: "background.default",
											fontSize: "0.8rem",
											borderBottom: "1px solid",
											borderColor: "divider",
											py: 0.5,
										},
									}}
								>
									<TableCell>Ticker</TableCell>
									<TableCell align="right">/day</TableCell>
									<TableCell align="right">for {supplyDays}d</TableCell>
									<TableCell align="right">Cost</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{Object.entries(materialIO || {})
									.filter(([, d]: any) => Number(d?.cons || 0) > 0)
									.map(([ticker, d]: any) => ({
										ticker,
										perDay: Number(d.cons || 0),
										total: Number(d.cons || 0) * supplyDays,
										cost: Number(d.cons || 0) * supplyDays * getPrice(ticker),
									}))
									.sort((a, b) => b.cost - a.cost)
									.map((row) => (
										<TableRow key={row.ticker}>
											<TableCell>
												<Typography variant="body2" sx={{ fontWeight: "bold" }}>
													{row.ticker}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2" color="error.main">
													-{row.perDay.toFixed(2)}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2" sx={{ fontWeight: "bold" }}>
													{row.total.toFixed(2)}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography
													variant="body2"
													sx={{ fontWeight: "bold" }}
													color="info.main"
												>
													${formatCurrency(row.cost)}
												</Typography>
											</TableCell>
										</TableRow>
									))}
								{Object.entries(materialIO || {}).filter(
									([, d]: any) => Number(d?.cons || 0) > 0,
								).length === 0 && (
									<TableRow>
										<TableCell colSpan={4} align="center">
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ py: 2 }}
											>
												No consumption detected.
											</Typography>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					) : (
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow
									sx={{
										"& th": {
											bgcolor: "background.default",
											fontSize: "0.8rem",
											borderBottom: "1px solid",
											borderColor: "divider",
											py: 0.5,
										},
									}}
								>
									<TableCell>Ticker</TableCell>
									<TableCell align="right">P/C</TableCell>
									<TableCell align="right">Delta</TableCell>
									<TableCell align="right">
										{ioDisplayMode === "profit" ? "Price/u & Profit" : "Action"}
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{Object.keys(materialIO || {}).length === 0 ? (
									<TableRow>
										<TableCell colSpan={4} align="center">
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ py: 2 }}
											>
												No active production.
											</Typography>
										</TableCell>
									</TableRow>
								) : (
									Object.entries(materialIO).map(([ticker, data]: any) => (
										<TableRow
											key={ticker}
											sx={{
												"& td": {
													borderBottom: "1px solid",
													borderColor: "divider",
													whiteSpace: "nowrap",
													py: 1,
												},
											}}
										>
											<TableCell>
												<Typography variant="body2" sx={{ fontWeight: "bold" }}>
													{ticker}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography
													variant="caption"
													color="success.main"
													sx={{ display: "block", lineHeight: 1.2 }}
												>
													+{data.prod.toFixed(2)}
												</Typography>
												<Typography
													variant="caption"
													color="error.main"
													sx={{ display: "block", lineHeight: 1.2 }}
												>
													-{data.cons.toFixed(2)}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography
													variant="body2"
													color={
														data.delta > 0
															? "success.main"
															: data.delta < 0
																? "error.main"
																: "inherit"
													}
													sx={{ fontWeight: "bold" }}
												>
													{data.delta > 0 ? "+" : ""}
													{data.delta.toFixed(2)}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Box
													sx={{
														display: "flex",
														justifyContent: "flex-end",
														alignItems: "center",
														gap: 1,
													}}
												>
													<Typography
														variant="caption"
														color="text.secondary"
														sx={{ minWidth: 30 }}
													>
														${formatCurrency(getPrice(ticker))}
													</Typography>
													{ioDisplayMode === "profit" ? (
														<Typography
															variant="body2"
															sx={{ minWidth: 40, fontWeight: "bold" }}
														>
															${formatCurrency(data.delta * getPrice(ticker))}
														</Typography>
													) : (
														<Chip
															size="small"
															label={
																data.delta > 0
																	? `Exp`
																	: data.delta < 0
																		? `Imp`
																		: "Bal"
															}
															color={
																data.delta > 0
																	? "success"
																	: data.delta < 0
																		? "error"
																		: "default"
															}
															variant={data.delta === 0 ? "outlined" : "filled"}
															sx={{
																height: 20,
																fontSize: "0.7rem",
																fontWeight: "bold",
																minWidth: 35,
															}}
														/>
													)}
												</Box>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					)}
				</Box>
			</Card>
		</Box>
	);
};
