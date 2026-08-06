import React, { useMemo, useState } from "react";
import {
	Box,
	Typography,
	Paper,
	LinearProgress,
	Tooltip,
	Chip,
	useTheme,
	alpha,
	TextField,
	InputAdornment,
	Tabs,
	Tab,
	Button,
	Divider,
} from "@mui/material";
import {
	ArrowUpCircle,
	ArrowDownCircle,
	Layers,
	Warehouse,
	ChevronRight,
	Rocket,
	Wrench,
} from "lucide-react";
import MaterialBadge from "../../cosm/components/materialbadge";
import type { SiteSummary, FlowData } from "./types";
import { MATERIAL_PROPS, getMatProps } from "./components/sitedrawer/utils";
import { FastLogisticsModal } from "../sites/components/fastlogisticsmodal";
import { FastRepairModal } from "../sites/components/fastrepairmodal";
import { useGlobalData } from "../../context/globaldatacontext";
import { ProductionFlowsList } from "./components/productionflowslist";
import { StorageItemsList } from "./components/storageitemslist";

const formatFlow = (val: number) => {
	const sign = val > 0 ? "+" : "";
	return `${sign}${val.toLocaleString("en-US", { maximumFractionDigits: 1 })}`;
};

const smartFormat = (val: number, isFlow: boolean = false) => {
	const absVal = Math.abs(val);
	const sign = isFlow && val > 0 ? "+" : "";
	const fullStr = isFlow
		? formatFlow(val)
		: val.toLocaleString("en-US", { maximumFractionDigits: 0 });

	if (absVal >= 1000000) {
		return {
			text: `${sign}${(val / 1000000).toFixed(1)}M`,
			full: fullStr,
			isAbbreviated: true,
		};
	}

	const formatted = isFlow
		? formatFlow(val)
		: val.toLocaleString("en-US", { maximumFractionDigits: 0 });
	return {
		text: formatted,
		full: fullStr,
		isAbbreviated: false,
	};
};

interface ProductionCardProps {
	site: SiteSummary;
	richFlows: Record<string, FlowData>;
	siteId: string;
	targetDays: number;
	onTargetDaysChange: (val: string) => void;
	onSelect: (siteId: string) => void;
}

export const ProductionCard = React.memo(
	({
		site,
		richFlows,
		siteId,
		targetDays,
		onTargetDaysChange,
		onSelect,
	}: ProductionCardProps) => {
		const theme = useTheme();
		const globalData = useGlobalData();
		const globalGetMatProps = globalData?.getMatProps || getMatProps;

		const [tab, setTab] = useState<"production" | "storage" | "both">("both");
		const [quickResupplyOpen, setQuickResupplyOpen] = useState(false);
		const [quickExportOpen, setQuickExportOpen] = useState(false);
		const [repairPlannerOpen, setRepairPlannerOpen] = useState(false);

		const {
			productionList,
			consumptionList,
			statusColor,
			storageList,
			dailyImportVolume,
			dailyImportMass,
			dailyExportVolume,
			dailyExportMass,
			totalStoredUnits,
			siteStoredVol,
			siteStoredMass,
			siteMaxVolCap,
			siteMaxMassCap,
			daysUntilStorageFull,
		} = useMemo(() => {
			const prod: FlowData[] = [];
			const cons: FlowData[] = [];
			let minDays = 999;

			let impVol = 0;
			let impMass = 0;
			let expVol = 0;
			let expMass = 0;

			Object.values(richFlows)
				.sort((a, b) => a.ticker.localeCompare(b.ticker))
				.forEach((f) => {
					const props = globalGetMatProps(f.ticker);
					if (f.flow > 0) {
						prod.push(f);
						const v = f.flow * props.volume;
						const m = f.flow * props.weight;
						expVol += v;
						expMass += m;
					} else if (f.flow < 0) {
						const dailyBurn = Math.abs(f.flow);
						const v = dailyBurn * props.volume;
						const m = dailyBurn * props.weight;
						impVol += v;
						impMass += m;

						const siteAvailable =
							f.siteAmount !== undefined ? f.siteAmount : f.currentAmount;
						const daysLeft = siteAvailable / dailyBurn;
						const targetAmount = dailyBurn * targetDays;
						const missing = Math.max(0, targetAmount - siteAvailable);
						if (daysLeft < minDays) minDays = daysLeft;
						cons.push({ ...f, daysRemaining: daysLeft, missing });
					}
				});

			let color = theme.palette.success.main;
			if (minDays < targetDays / 5) color = theme.palette.error.main;
			else if (minDays < targetDays) color = theme.palette.warning.main;

			const storage = [...(site.storage_items || [])].sort((a, b) =>
				a.ticker.localeCompare(b.ticker),
			);

			const siteItems = storage.filter((s) => !s.type || s.type === "site");
			const totalUnits = siteItems.reduce(
				(sum, item) => sum + (item.amount || 0),
				0,
			);

			let sVol = 0;
			let sMass = 0;
			siteItems.forEach((item) => {
				const props = globalGetMatProps(item.ticker);
				sVol += (item.amount || 0) * props.volume;
				sMass += (item.amount || 0) * props.weight;
			});

			const matchingSiteUnit = Object.values(
				globalData?.storageState?.units || {},
			).find(
				(u: any) =>
					u.addressableid === site.siteid ||
					(u.storageplanetid === site.planetid && u.type === "SITE"),
			);

			const baseVolCap =
				site.storage_capacity ||
				(site as any).volumecapacity ||
				(site as any).capacity ||
				matchingSiteUnit?.volumecapacity ||
				(sVol > 0 ? sVol : 500);
			const baseMassCap =
				(site as any).weight_capacity ||
				(site as any).weightcapacity ||
				matchingSiteUnit?.weightcapacity ||
				baseVolCap;

			const maxVolCap = Math.max(sVol, baseVolCap);
			const maxMassCap = Math.max(sMass, baseMassCap);

			const netVolDelta = expVol - impVol;
			const netMassDelta = expMass - impMass;

			const remVolCap = Math.max(0, maxVolCap - sVol);
			const remMassCap = Math.max(0, maxMassCap - sMass);

			const daysVol =
				netVolDelta > 0 && remVolCap > 0 ? remVolCap / netVolDelta : Infinity;
			const daysMass =
				netMassDelta > 0 && remMassCap > 0
					? remMassCap / netMassDelta
					: Infinity;
			const minFull = Math.min(daysVol, daysMass);

			const daysUntilFull = minFull < Infinity ? minFull : null;

			return {
				productionList: prod,
				consumptionList: cons,
				statusColor: color,
				storageList: storage,
				dailyImportVolume: impVol,
				dailyImportMass: impMass,
				dailyExportVolume: expVol,
				dailyExportMass: expMass,
				totalStoredUnits: totalUnits,
				siteStoredVol: sVol,
				siteStoredMass: sMass,
				siteMaxVolCap: maxVolCap,
				siteMaxMassCap: maxMassCap,
				daysUntilStorageFull: daysUntilFull,
			};
		}, [
			richFlows,
			site.storage_items,
			site.storage_capacity,
			targetDays,
			theme,
			globalGetMatProps,
		]);

		const siteOverallCondition =
			site.production_lines
				.map((line) => line.condition || 0)
				.reduce((a, b) => a + b, 0) / (site.production_lines.length || 1);

		const conditionColor =
			siteOverallCondition > 0.99
				? theme.palette.success.main
				: siteOverallCondition > 0.8
					? theme.palette.warning.main
					: theme.palette.error.main;

		const borderStyle =
			site.isLeased && site.type === "Inbound" ? "dashed" : "solid";
		const borderWidth =
			site.isLeased && site.type === "Inbound" ? "2px" : "1px";

		const permitsUsed =
			site.invested_permits ??
			(site as any).building_count ??
			site.production_lines?.length ??
			0;
		const permitsMax =
			site.maximum_permits ?? (site as any).plots ?? site.area ?? 0;
		const permitsLabel =
			permitsMax > 0
				? `Permits ${permitsUsed}/${permitsMax}`
				: `Lines ${permitsUsed}`;

		const { dailyRevenue, dailyExpenses, dailyProfit } = useMemo(() => {
			let rev = 0;
			let exp = 0;
			const priceMap: Record<string, number> = {};
			const market = globalData?.marketData;
			if (Array.isArray(market)) {
				market.forEach((d: any) => {
					priceMap[d.Ticker] =
						(d["IC1-AskPrice"] || 0) > 0
							? d["IC1-AskPrice"]
							: d["IC1-Average"] || 0;
				});
			}
			Object.values(richFlows).forEach((f) => {
				const price = priceMap[f.ticker] || 0;
				if (f.flow > 0) rev += f.flow * price;
				else if (f.flow < 0) exp += Math.abs(f.flow * price);
			});
			return { dailyRevenue: rev, dailyExpenses: exp, dailyProfit: rev - exp };
		}, [richFlows, globalData?.marketData]);

		// Incoming ships calculation for this site
		const incomingFlights = useMemo(() => {
			if (!globalData?.activeFlightPlans) return [];
			const sitePlanet = (
				site.planet_name ||
				site.planet_name_alt ||
				""
			).toLowerCase();

			return (globalData.activeFlightPlans || [])
				.filter((fp: any) => {
					const dest = (
						fp.destination ||
						fp.destinationplanetid ||
						fp.destinationid ||
						""
					).toLowerCase();
					return (
						dest && (dest.includes(sitePlanet) || sitePlanet.includes(dest))
					);
				})
				.map((fp: any) => {
					const ship = globalData.ownerShips?.find(
						(s: any) => s.id === fp.shipid || s.registration === fp.shipid,
					);
					const shipName =
						ship?.name || ship?.registration || fp.shipid || "Ship";
					const msLeft = fp.end ? Math.max(0, fp.end - Date.now()) : 0;
					const hoursLeft = (msLeft / (1000 * 60 * 60)).toFixed(1);
					const items: any[] = ship?.items || ship?.shipStorage?.items || [];
					return { shipName, hoursLeft, items };
				});
		}, [globalData?.activeFlightPlans, globalData?.ownerShips, site]);

		const handleClick = (e: React.MouseEvent) => {
			const selection = window.getSelection();
			if (selection && selection.toString().length > 0) {
				return;
			}
			onSelect(siteId);
		};

		const renderProductionFlows = () => (
			<ProductionFlowsList
				productionList={productionList}
				consumptionList={consumptionList}
				targetDays={targetDays}
				dailyImportVolume={dailyImportVolume}
				dailyImportMass={dailyImportMass}
				dailyExportVolume={dailyExportVolume}
				dailyExportMass={dailyExportMass}
				dailyRevenue={dailyRevenue}
				dailyExpenses={dailyExpenses}
				dailyProfit={dailyProfit}
			/>
		);

		const renderStorage = () => (
			<StorageItemsList
				storageList={storageList}
				daysUntilStorageFull={daysUntilStorageFull}
				site={site}
				globalGetMatProps={globalGetMatProps}
				globalData={globalData}
			/>
		);

		return (
			<>
				<Paper
					onClick={handleClick}
					elevation={2}
					sx={{
						display: "flex",
						flexDirection: "column",
						borderRadius: "12px",
						overflow: "hidden",
						border: `${borderWidth} ${borderStyle} ${alpha(statusColor, site.isLeased ? 0.6 : 0.35)}`,
						bgcolor: "rgba(20, 20, 20, 0.65)",
						backdropFilter: "blur(20px)",
						boxShadow: "0 6px 24px 0 rgba(0, 0, 0, 0.4)",
						transition: "all 0.15s ease",
						cursor: "pointer",
						width: "100%",
						"&:hover": {
							boxShadow: `0 8px 24px -2px ${alpha(statusColor, 0.4)}`,
							borderColor: statusColor,
							bgcolor: "rgba(28, 28, 28, 0.75)",
						},
					}}
				>
					{/* --- HEADER --- */}
					<Box
						sx={{
							px: 1.25,
							py: 0.6,
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							bgcolor: alpha(statusColor, 0.1),
							borderBottom: `1px solid ${alpha(statusColor, 0.15)}`,
						}}
					>
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								alignItems: "flex-start",
								gap: 0.75,
								overflow: "hidden",
								flexWrap: "wrap",
							}}
						>
							<Typography
								noWrap
								sx={{
									fontSize: "1.05rem",
									color: theme.palette.primary.main,
									fontWeight: 800,
								}}
							>
								{site.planet_name_alt === site.planet_name
									? site.planet_name
									: `${site.planet_name_alt} (${site.planet_name})`}
							</Typography>

							<Chip
								label={permitsLabel}
								size="small"
								sx={{
									height: 18,
									fontSize: "0.7rem",
									fontWeight: 800,
									bgcolor: "rgba(123, 104, 238, 0.35)",
									color: "#B4A6FF",
									border: "1px solid rgba(180, 166, 255, 0.5)",
								}}
							/>
						</Box>

						{site.isLeased && (
							<Chip
								label={
									site.type === "Inbound"
										? `LEASED FROM: ${(site.partner || site.leased_from || "PARTNER").toUpperCase()}`
										: `LOANED TO: ${(site.partner || site.leased_to || site.tenant || "PARTNER").toUpperCase()}`
								}
								size="small"
								sx={{
									height: 18,
									fontSize: "0.75rem",
									fontWeight: 600,
									bgcolor:
										site.type === "Inbound"
											? "rgba(0, 229, 255, 0.15)"
											: "rgba(255, 152, 0, 0.15)",
									color: site.type === "Inbound" ? "#00e5ff" : "#ffb74d",
									border: `1px dashed ${site.type === "Inbound" ? "rgba(0, 229, 255, 0.4)" : "rgba(255, 152, 0, 0.4)"}`,
								}}
							/>
						)}

						<Box
							sx={{
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "flex-end",
								gap: 0.5,
								flexShrink: 0,
							}}
						>
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									gap: 0.5,
								}}
							>
								<Button
									size="small"
									variant="contained"
									onClick={(e) => {
										e.stopPropagation();
										setQuickResupplyOpen(true);
									}}
									sx={{
										height: 20,
										fontSize: "0.68rem",
										fontWeight: 800,
										bgcolor: "rgba(123, 104, 238, 0.2)",
										color: "#B4A6FF",
										border: "1px solid rgba(123, 104, 238, 0.45)",
										textTransform: "none",
										whiteSpace: "nowrap",
										px: 1,
										py: 0,
										lineHeight: 1,
										minWidth: "auto",
										"&:hover": { bgcolor: "rgba(123, 104, 238, 0.35)" },
									}}
								>
									Supply/Export
								</Button>

								<Tooltip title="Click to open Site Repair & Condition Planner">
									<Chip
										icon={
											<Wrench
												size={10}
												color={conditionColor}
												style={{ marginLeft: 4 }}
											/>
										}
										label={`Repair (${(siteOverallCondition * 100).toFixed(0)}%)`}
										size="small"
										onClick={(e) => {
											e.stopPropagation();
											setRepairPlannerOpen(true);
										}}
										sx={{
											height: 20,
											fontSize: "0.7rem",
											fontWeight: 700,
											bgcolor: alpha(conditionColor, 0.12),
											color: conditionColor,
											border: `1px solid ${alpha(conditionColor, 0.3)}`,
											cursor: "pointer",
											transition: "all 0.15s ease",
											"& .MuiChip-label": { px: 0.75 },
											"&:hover": {
												bgcolor: alpha(conditionColor, 0.25),
											},
										}}
									/>
								</Tooltip>
							</Box>
							<ChevronRight
								size={14}
								color={theme.palette.text.secondary}
								style={{ opacity: 0.5 }}
							/>
						</Box>
					</Box>

					{/* --- BODY --- */}
					<Box
						sx={{
							p: 1,
							flex: 1,
							display: "flex",
							flexDirection: "column",
							gap: 0.75,
						}}
					>
						{/* Incoming Ships Badges Section */}
						{incomingFlights.length > 0 && (
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									px: 1,
									py: 0.4,
									bgcolor: "rgba(123, 104, 238, 0.1)",
									borderRadius: "6px",
									border: "1px solid rgba(123, 104, 238, 0.25)",
									flexWrap: "wrap",
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
									<Rocket size={13} color={theme.palette.primary.main} />
									<Typography
										variant="caption"
										sx={{
											fontSize: "0.68rem",
											fontWeight: 800,
											color: theme.palette.primary.main,
										}}
									>
										Incoming Ships ({incomingFlights.length}):
									</Typography>
								</Box>
								{incomingFlights.map((flight, idx) => (
									<Box
										key={idx}
										sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
									>
										<Typography
											variant="caption"
											sx={{
												fontSize: "0.68rem",
												fontWeight: 700,
												color: "white",
											}}
										>
											{flight.shipName} ({flight.hoursLeft}h)
										</Typography>
										{flight.items.slice(0, 3).map((item: any, i: number) => (
											<MaterialBadge
												key={i}
												ticker={item.materialTicker || item.ticker || item.name}
											/>
										))}
									</Box>
								))}
							</Box>
						)}

						{/* Sub-Header: Tabs with Full Naming + Enlarged Target Days Input */}
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								gap: 1,
								flexWrap: "wrap",
							}}
						>
							<Tabs
								value={tab}
								onChange={(_, newValue) => setTab(newValue)}
								onClick={(e) => e.stopPropagation()}
								sx={{
									minHeight: 26,
									height: 26,
									bgcolor: "rgba(0,0,0,0.4)",
									borderRadius: "6px",
									p: 0.25,
									"& .MuiTab-root": {
										minHeight: 22,
										height: 22,
										py: 0,
										px: 1.25,
										fontSize: "0.68rem",
										fontWeight: 700,
										color: "rgba(255,255,255,0.6)",
										"&.Mui-selected": {
											color: "white",
											bgcolor: "#7B68EE",
											borderRadius: "4px",
										},
									},
									"& .MuiTabs-indicator": { display: "none" },
								}}
							>
								<Tab label="BOTH" value="both" />
								<Tab label="PRODUCTION" value="production" />
								<Tab label="STORAGE" value="storage" />
							</Tabs>

							<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
								<Typography
									variant="caption"
									sx={{
										color: "text.primary",
										fontWeight: 700,
										fontSize: "0.75rem",
									}}
								>
									Target:
								</Typography>
								<TextField
									size="small"
									value={targetDays}
									onChange={(e) => onTargetDaysChange(e.target.value)}
									onClick={(e) => e.stopPropagation()}
									sx={{
										width: 68,
										"& .MuiInputBase-input": {
											py: 0.3,
											px: 0.5,
											fontSize: "0.75rem",
											textAlign: "right",
											fontWeight: 800,
										},
									}}
									slotProps={{
										input: {
											endAdornment: (
												<InputAdornment position="end" sx={{ mr: 0 }}>
													<Typography
														variant="caption"
														fontSize="0.7rem"
														color="text.secondary"
														fontWeight={700}
													>
														d
													</Typography>
												</InputAdornment>
											),
										},
									}}
								/>
							</Box>
						</Box>

						{/* Tab Content with Flexible Dynamic Column Widths & Perfect Horizontal Alignment */}
						<Box sx={{ mt: 0.5 }}>
							{tab === "both" && (
								<Box
									sx={{
										display: "flex",
										flexDirection: { xs: "column", md: "row" },
										gap: 1.5,
										width: "100%",
									}}
								>
									<Box
										sx={{ flex: "1 1 66%", minWidth: 0, overflowX: "hidden" }}
									>
										{renderProductionFlows()}
									</Box>
									<Box
										sx={{ flex: "1 1 34%", minWidth: 0, overflowX: "hidden" }}
									>
										{renderStorage()}
									</Box>
								</Box>
							)}
							{tab === "production" && renderProductionFlows()}
							{tab === "storage" && renderStorage()}
						</Box>
					</Box>
				</Paper>

				{/* Logistics & Export Planner Modal */}
				{(quickResupplyOpen || quickExportOpen) && (
					<FastLogisticsModal
						open={quickResupplyOpen || quickExportOpen}
						onClose={() => {
							setQuickResupplyOpen(false);
							setQuickExportOpen(false);
						}}
						initialTab={quickExportOpen ? "export" : "resupply"}
						siteName={site.planet_name_alt || site.planet_name}
						consumptionList={consumptionList}
						productionList={productionList}
						storageList={storageList}
						targetDays={targetDays}
						siteStorageCapacity={siteMaxVolCap}
						warehouseStorageCapacity={(site as any).warehouse_capacity || 5000}
						siteStoredVol={siteStoredVol}
						siteStoredMass={siteStoredMass}
						daysUntilFull={daysUntilStorageFull}
					/>
				)}

				{/* Site Repair & Building Condition Planner Modal */}
				{repairPlannerOpen && (
					<FastRepairModal
						open={repairPlannerOpen}
						onClose={() => setRepairPlannerOpen(false)}
						siteName={site.planet_name_alt || site.planet_name}
						currentCondition={siteOverallCondition}
						productionLines={site.production_lines}
						sitePlatformConditions={
							(site as any).site_platform_conditions || []
						}
						platformRepairList={(site as any).platform_repair_list || []}
						planetProps={(site as any).planet_props}
						richFlows={richFlows}
					/>
				)}
			</>
		);
	},
);

ProductionCard.displayName = "ProductionCard";
