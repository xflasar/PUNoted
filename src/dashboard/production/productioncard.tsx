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
			<Box
				sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}
			>
				{/* Import/day, Export/day & Financial Summary */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 0.35,
						px: 1.25,
						py: 0.6,
						bgcolor: "rgba(0, 0, 0, 0.4)",
						borderRadius: "8px",
						border: "1px solid rgba(123, 104, 238, 0.15)",
						mb: 0.5,
					}}
				>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255, 255, 255, 0.6)",
								fontWeight: 700,
								fontSize: "0.78rem",
								whiteSpace: "nowrap",
							}}
						>
							Import/day:
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: "text.primary",
								fontWeight: 600,
								fontSize: "0.78rem",
								fontFamily: "monospace",
								whiteSpace: "nowrap",
							}}
						>
							{dailyImportVolume.toLocaleString(undefined, {
								maximumFractionDigits: 1,
							})}{" "}
							m³ /{" "}
							{dailyImportMass.toLocaleString(undefined, {
								maximumFractionDigits: 1,
							})}{" "}
							t
						</Typography>
					</Box>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255, 255, 255, 0.6)",
								fontWeight: 700,
								fontSize: "0.78rem",
								whiteSpace: "nowrap",
							}}
						>
							Export/day:
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: "text.primary",
								fontWeight: 600,
								fontSize: "0.78rem",
								fontFamily: "monospace",
								whiteSpace: "nowrap",
							}}
						>
							{dailyExportVolume.toLocaleString(undefined, {
								maximumFractionDigits: 1,
							})}{" "}
							m³ /{" "}
							{dailyExportMass.toLocaleString(undefined, {
								maximumFractionDigits: 1,
							})}{" "}
							t
						</Typography>
					</Box>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							pt: 0.4,
							borderTop: "1px solid rgba(255,255,255,0.06)",
						}}
					>
						<Tooltip title="Daily Revenue from production sales">
							<Typography
								variant="caption"
								sx={{
									color: "#69f0ae",
									fontSize: "0.8rem",
									fontFamily: "monospace",
									fontVariantNumeric: "tabular-nums",
									fontWeight: 600,
								}}
							>
								+${(dailyRevenue / 1000).toFixed(1)}k
							</Typography>
						</Tooltip>
						<Typography
							variant="caption"
							sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}
						>
							|
						</Typography>
						<Tooltip title="Daily Expenses for inputs & workforce">
							<Typography
								variant="caption"
								sx={{
									color: "#ff5252",
									fontSize: "0.8rem",
									fontFamily: "monospace",
									fontVariantNumeric: "tabular-nums",
									fontWeight: 600,
								}}
							>
								-${(dailyExpenses / 1000).toFixed(1)}k
							</Typography>
						</Tooltip>
						<Typography
							variant="caption"
							sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}
						>
							|
						</Typography>
						<Tooltip title="Net Daily Profit / Loss">
							<Typography
								variant="caption"
								sx={{
									color: dailyProfit >= 0 ? "#69f0ae" : "#ff5252",
									fontSize: "0.8rem",
									fontFamily: "monospace",
									fontVariantNumeric: "tabular-nums",
									fontWeight: 700,
								}}
							>
								{dailyProfit >= 0 ? "+" : ""}${(dailyProfit / 1000).toFixed(1)}
								k/d
							</Typography>
						</Tooltip>
					</Box>
				</Box>

				{/* PROD Header */}
				{productionList.length > 0 && (
					<Box>
						<Typography
							variant="subtitle2"
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								mb: 0.25,
								height: 18,
								color: "#69f0ae",
								fontWeight: 800,
								fontSize: "0.78rem",
							}}
						>
							<ArrowUpCircle size={13} color="#69f0ae" /> PROD
						</Typography>
						<Box sx={{ display: "grid", gap: 0.25 }}>
							{productionList.map((p) => (
								<Box
									key={p.ticker}
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										gap: 1,
										py: 0.15,
									}}
								>
									<Box
										sx={{
											fontSize: "0.85em",
											display: "flex",
											alignItems: "center",
										}}
									>
										<MaterialBadge ticker={p.ticker} />
									</Box>
									<Typography
										variant="caption"
										sx={{
											fontWeight: 700,
											color: "#69f0ae",
											textAlign: "right",
											fontSize: "0.8rem",
											fontFamily: "monospace",
											fontVariantNumeric: "tabular-nums",
										}}
									>
										{smartFormat(p.flow, true).text}/d
									</Typography>
								</Box>
							))}
						</Box>
					</Box>
				)}

				{consumptionList.length > 0 && (
					<Box sx={{ mt: productionList.length ? 0.5 : 0 }}>
						<Typography
							variant="subtitle2"
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								mb: 0.25,
								color: "#ff5252",
								fontWeight: 800,
								fontSize: "0.78rem",
							}}
						>
							<ArrowDownCircle size={13} /> CONS
						</Typography>
						<Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
							{consumptionList.map((c) => {
								const dailyCons = Math.abs(c.flow);
								const siteStock = c.siteAmount || 0;
								const whStock = c.warehouseAmount || 0;

								const siteDays = dailyCons > 0 ? siteStock / dailyCons : 999;
								const whDays = dailyCons > 0 ? whStock / dailyCons : 0;

								const targetQty = targetDays * dailyCons;
								const siteMissing = Math.max(0, targetQty - siteStock);
								const totalMissing = Math.max(
									0,
									targetQty - (siteStock + whStock),
								);

								const isCritical = siteDays < targetDays / 5;
								const isWarning = siteDays < targetDays;
								const daysColor = isCritical
									? "#ff5252"
									: isWarning
										? "#ffd700"
										: "rgba(255, 255, 255, 0.85)";

								const { text: siteMissingText } = smartFormat(siteMissing);

								return (
									<Box
										key={c.ticker}
										sx={{
											display: "flex",
											flexWrap: "wrap",
											alignItems: "center",
											justifyContent: "space-between",
											rowGap: 0.3,
											columnGap: 0.75,
											py: 0.2,
											px: 0.5,
											borderRadius: "6px",
											bgcolor: "rgba(0, 0, 0, 0.2)",
											"&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
										}}
									>
										{/* Left: Material Badge + Daily Flow */}
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 0.6,
												flexShrink: 0,
											}}
										>
											<Box
												sx={{
													transform: "scale(0.85)",
													transformOrigin: "left center",
													display: "inline-flex",
													width: 28,
													height: 18,
													alignItems: "center",
												}}
											>
												<MaterialBadge ticker={c.ticker} />
											</Box>
											<Typography
												variant="caption"
												sx={{
													color: "#ff5252",
													fontSize: "0.75rem",
													fontFamily: "monospace",
													fontVariantNumeric: "tabular-nums",
													fontWeight: 700,
													whiteSpace: "nowrap",
												}}
											>
												-{dailyCons.toFixed(1)}/d
											</Typography>
										</Box>

										{/* Right / Wrapped: Supply Days & Need / Stored Amount */}
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 0.75,
												flexWrap: "wrap",
												ml: "auto",
											}}
										>
											{/* Supply Days Status Chip */}
											<Tooltip
												title={`Site Inventory: ${siteDays > 999 ? "∞" : `${siteDays.toFixed(1)}d`} (${siteStock.toLocaleString()} u)${whDays > 0 ? ` | Warehouse Backup: ${whDays.toFixed(1)}d (${whStock.toLocaleString()} u)` : ""}`}
											>
												<Box
													sx={{
														px: 0.65,
														py: 0.1,
														borderRadius: "4px",
														bgcolor: `${daysColor}15`,
														border: `1px solid ${daysColor}35`,
														display: "flex",
														alignItems: "center",
														gap: 0.35,
														whiteSpace: "nowrap",
													}}
												>
													<Typography
														variant="caption"
														sx={{
															fontSize: "0.72rem",
															fontWeight: 800,
															color: daysColor,
															fontFamily: "monospace",
														}}
													>
														{siteDays > 999 ? "∞" : `${siteDays.toFixed(1)}d`}
													</Typography>
													{whDays > 0 && (
														<Typography
															variant="caption"
															sx={{
																fontSize: "0.68rem",
																fontWeight: 600,
																color: "rgba(255,255,255,0.55)",
																fontFamily: "monospace",
															}}
														>
															(+{whDays.toFixed(1)}d)
														</Typography>
													)}
												</Box>
											</Tooltip>

											{/* Stored / Need Amount */}
											<Tooltip
												title={`Site Stock: ${siteStock.toLocaleString()} u | Need for ${targetDays}d: ${siteMissing > 0 ? siteMissingText : "Covered"}`}
											>
												<Typography
													variant="caption"
													sx={{
														color:
															siteMissing > 0
																? "#ffd700"
																: "rgba(255,255,255,0.75)",
														fontSize: "0.75rem",
														fontFamily: "monospace",
														fontVariantNumeric: "tabular-nums",
														fontWeight: 600,
														textAlign: "right",
														whiteSpace: "nowrap",
													}}
												>
													{siteStock.toLocaleString()} u
												</Typography>
											</Tooltip>
										</Box>
									</Box>
								);
							})}
						</Box>
					</Box>
				)}

				{!productionList.length && !consumptionList.length && (
					<Typography
						variant="caption"
						color="text.disabled"
						fontStyle="italic"
						textAlign="center"
						sx={{ py: 1, fontSize: "0.7rem" }}
					>
						No active flow
					</Typography>
				)}
			</Box>
		);

		const renderStorage = () => {
			const siteStorage = storageList.filter(
				(s) => !s.type || s.type === "site",
			);
			const warehouseStorage = storageList.filter(
				(s) => s.type && s.type.includes("warehouse"),
			);

			const siteUnits = siteStorage.reduce(
				(sum, item) => sum + (item.amount || 0),
				0,
			);
			const warehouseUnits = warehouseStorage.reduce(
				(sum, item) => sum + (item.amount || 0),
				0,
			);

			let siteVol = 0;
			let siteMass = 0;
			siteStorage.forEach((item) => {
				const p = globalGetMatProps(item.ticker);
				siteVol += (item.amount || 0) * p.volume;
				siteMass += (item.amount || 0) * p.weight;
			});

			let whVol = 0;
			let whMass = 0;
			warehouseStorage.forEach((item) => {
				const p = globalGetMatProps(item.ticker);
				whVol += (item.amount || 0) * p.volume;
				whMass += (item.amount || 0) * p.weight;
			});

			const matchingSiteUnit = Object.values(
				globalData?.storageState?.units || {},
			).find(
				(u: any) =>
					u.addressableid === site.siteid ||
					(u.storageplanetid === site.planetid && u.type === "SITE"),
			);
			const matchingWhUnits = Object.values(
				globalData?.storageState?.units || {},
			).filter(
				(u: any) =>
					u.storageplanetid === site.planetid &&
					(u.type === "WAREHOUSE" || u.type === "WAREHOUSE_STORE") &&
					(!u.owner || !site.owner || u.owner === site.owner),
			);

			const whVolCapFromUnits = matchingWhUnits.reduce(
				(acc: number, u: any) => acc + (u.volumecapacity || 0),
				0,
			);
			const whWeightCapFromUnits = matchingWhUnits.reduce(
				(acc: number, u: any) => acc + (u.weightcapacity || 0),
				0,
			);

			const siteBaseVolCap =
				site.storage_capacity ||
				(site as any).volumecapacity ||
				(site as any).capacity ||
				matchingSiteUnit?.volumecapacity ||
				(siteVol > 0 ? siteVol : 500);
			const siteBaseMassCap =
				(site as any).weight_capacity ||
				(site as any).weightcapacity ||
				matchingSiteUnit?.weightcapacity ||
				siteBaseVolCap;

			const siteMaxVolCap = Math.max(siteVol, siteBaseVolCap);
			const siteMaxMassCap = Math.max(siteMass, siteBaseMassCap);

			const siteVolPct = Math.min(
				100,
				Math.round((siteVol / siteMaxVolCap) * 100),
			);
			const siteMassPct = Math.min(
				100,
				Math.round((siteMass / siteMaxMassCap) * 100),
			);

			const warehouseBaseVolCap =
				(site as any).warehouse_capacity ||
				whVolCapFromUnits ||
				(whVol > 0 ? whVol : 3500);
			const warehouseBaseMassCap =
				(site as any).warehouse_weight_capacity ||
				whWeightCapFromUnits ||
				warehouseBaseVolCap;

			const warehouseMaxVolCap = Math.max(whVol, warehouseBaseVolCap);
			const warehouseMaxMassCap = Math.max(whMass, warehouseBaseMassCap);

			const warehouseVolPct =
				warehouseMaxVolCap > 0
					? Math.min(100, Math.round((whVol / warehouseMaxVolCap) * 100))
					: 0;
			const warehouseMassPct =
				warehouseMaxMassCap > 0
					? Math.min(100, Math.round((whMass / warehouseMaxMassCap) * 100))
					: 0;

			return (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 0.75,
						minWidth: 0,
					}}
				>
					{/* SITE STORAGE GROUP */}
					<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
						<Typography
							variant="subtitle2"
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								height: 18,
								color: theme.palette.info.main,
								fontWeight: 700,
								fontSize: "0.76rem",
							}}
						>
							<Layers size={13} /> SITE ({siteStorage.length})
						</Typography>

						{/* Site Storage Progress Bars: Separate Mass (t) and Volume (m³) */}
						<Box
							sx={{
								px: 1,
								py: 0.5,
								bgcolor: "rgba(0,0,0,0.4)",
								borderRadius: "8px",
								border: "1px solid rgba(123, 104, 238, 0.15)",
							}}
						>
							{/* Mass Progress Bar */}
							<Box sx={{ mb: 0.5 }}>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										mb: 0.2,
									}}
								>
									<Typography
										variant="caption"
										color="text.primary"
										sx={{ fontWeight: 600, fontSize: "0.7rem" }}
									>
										Mass:{" "}
										{siteMass.toLocaleString(undefined, {
											maximumFractionDigits: 0,
										})}{" "}
										/{" "}
										{siteMaxMassCap.toLocaleString(undefined, {
											maximumFractionDigits: 0,
										})}{" "}
										t
									</Typography>
									<Typography
										variant="caption"
										sx={{
											color:
												siteMassPct > 85
													? "#ff5252"
													: siteMassPct > 60
														? "#ffd700"
														: "text.secondary",
											fontWeight: 700,
											fontSize: "0.7rem",
										}}
									>
										{siteMassPct}%
									</Typography>
								</Box>
								<LinearProgress
									variant="determinate"
									value={siteMassPct}
									sx={{
										height: 4,
										borderRadius: 2,
										bgcolor: "rgba(255,255,255,0.08)",
										"& .MuiLinearProgress-bar": {
											bgcolor:
												siteMassPct > 85
													? "#ff5252"
													: siteMassPct > 60
														? "#ffd700"
														: "#ffd700",
										},
									}}
								/>
							</Box>

							{/* Volume Progress Bar */}
							<Box sx={{ mb: 0.3 }}>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										mb: 0.2,
									}}
								>
									<Typography
										variant="caption"
										color="text.primary"
										sx={{ fontWeight: 600, fontSize: "0.7rem" }}
									>
										Volume:{" "}
										{siteVol.toLocaleString(undefined, {
											maximumFractionDigits: 0,
										})}{" "}
										/{" "}
										{siteMaxVolCap.toLocaleString(undefined, {
											maximumFractionDigits: 0,
										})}{" "}
										m³
									</Typography>
									<Typography
										variant="caption"
										sx={{
											color:
												siteVolPct > 85
													? "#ff5252"
													: siteVolPct > 60
														? "#ffd700"
														: "text.secondary",
											fontWeight: 700,
											fontSize: "0.7rem",
										}}
									>
										{siteVolPct}%
									</Typography>
								</Box>
								<LinearProgress
									variant="determinate"
									value={siteVolPct}
									sx={{
										height: 4,
										borderRadius: 2,
										bgcolor: "rgba(255,255,255,0.08)",
										"& .MuiLinearProgress-bar": {
											bgcolor:
												siteVolPct > 85
													? "#ff5252"
													: siteVolPct > 60
														? "#ffd700"
														: "#00e5ff",
										},
									}}
								/>
							</Box>

							{daysUntilStorageFull !== null && (
								<Typography
									variant="caption"
									sx={{
										color: "#ffd54f",
										fontWeight: 600,
										fontSize: "0.68rem",
										display: "block",
										textAlign: "right",
										mt: 0.3,
									}}
								>
									Full in {daysUntilStorageFull.toFixed(1)}d (Net Prod)
								</Typography>
							)}
						</Box>

						{/* Site Items List */}
						{siteStorage.length > 0 ? (
							<Box sx={{ display: "grid", gap: 0.25 }}>
								{siteStorage.map((s) => {
									const props = globalGetMatProps(s.ticker);
									const itemMass = (s.amount || 0) * props.weight;
									const itemVol = (s.amount || 0) * props.volume;
									const itemPctRaw =
										siteUnits > 0 ? ((s.amount || 0) / siteUnits) * 100 : 0;
									const displayPct =
										itemPctRaw > 0 && itemPctRaw < 1
											? "<1%"
											: itemPctRaw >= 1
												? `${Math.round(itemPctRaw)}%`
												: "";

									return (
										<Tooltip
											key={s.ticker}
											title={`Mass: ${itemMass.toLocaleString(undefined, { maximumFractionDigits: 1 })} t (${props.weight} t/u) | Volume: ${itemVol.toLocaleString(undefined, { maximumFractionDigits: 1 })} m³ (${props.volume} m³/u)`}
										>
											<Box
												sx={{
													display: "grid",
													gridTemplateColumns: "48px 45px 1fr",
													alignItems: "center",
													gap: 0.5,
													py: 0.15,
												}}
											>
												<Box
													sx={{
														fontSize: "0.75em",
														display: "flex",
														alignItems: "center",
													}}
												>
													<MaterialBadge ticker={s.ticker} />
												</Box>
												<Typography
													variant="caption"
													sx={{
														color: "rgba(255, 255, 255, 0.4)",
														fontSize: "0.68rem",
														fontWeight: 400,
														fontFamily: "monospace",
													}}
												>
													{displayPct ? `(${displayPct})` : ""}
												</Typography>
												<Typography
													variant="caption"
													sx={{
														fontWeight: 500,
														color: "text.primary",
														textAlign: "right",
														fontSize: "0.7rem",
														fontFamily: "monospace",
														fontVariantNumeric: "tabular-nums",
													}}
												>
													{s.amount.toLocaleString()}
												</Typography>
											</Box>
										</Tooltip>
									);
								})}
							</Box>
						) : (
							<Typography
								variant="caption"
								color="text.disabled"
								fontStyle="italic"
								textAlign="center"
								sx={{ py: 0.5, fontSize: "0.68rem" }}
							>
								Empty site storage
							</Typography>
						)}
					</Box>

					{/* WAREHOUSE STORAGE GROUP */}
					{warehouseBaseVolCap > 0 && (
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 0.5,
								mt: 0.5,
							}}
						>
							<Typography
								variant="subtitle2"
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 0.5,
									height: 18,
									color: theme.palette.warning.main,
									fontWeight: 700,
									fontSize: "0.76rem",
								}}
							>
								<Warehouse size={13} /> WAREHOUSE ({warehouseStorage.length})
							</Typography>

							{/* Warehouse Storage Progress Bars */}
							<Box
								sx={{
									px: 1,
									py: 0.5,
									bgcolor: "rgba(0,0,0,0.4)",
									borderRadius: "8px",
									border: "1px solid rgba(255, 152, 0, 0.2)",
								}}
							>
								{/* Mass Progress Bar */}
								<Box sx={{ mb: 0.5 }}>
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											mb: 0.2,
										}}
									>
										<Typography
											variant="caption"
											color="text.primary"
											sx={{ fontWeight: 600, fontSize: "0.7rem" }}
										>
											Mass:{" "}
											{whMass.toLocaleString(undefined, {
												maximumFractionDigits: 0,
											})}{" "}
											/{" "}
											{warehouseBaseMassCap.toLocaleString(undefined, {
												maximumFractionDigits: 0,
											})}{" "}
											t
										</Typography>
										<Typography
											variant="caption"
											sx={{
												color:
													warehouseMassPct > 85
														? "#ff5252"
														: warehouseMassPct > 60
															? "#ffd700"
															: "text.secondary",
												fontWeight: 700,
												fontSize: "0.7rem",
											}}
										>
											{warehouseMassPct}%
										</Typography>
									</Box>
									<LinearProgress
										variant="determinate"
										value={warehouseMassPct}
										sx={{
											height: 4,
											borderRadius: 2,
											bgcolor: "rgba(255,255,255,0.08)",
											"& .MuiLinearProgress-bar": {
												bgcolor:
													warehouseMassPct > 85
														? "#ff5252"
														: warehouseMassPct > 60
															? "#ffd700"
															: "#ffd700",
											},
										}}
									/>
								</Box>

								{/* Volume Progress Bar */}
								<Box sx={{ mb: 0.3 }}>
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											mb: 0.2,
										}}
									>
										<Typography
											variant="caption"
											color="text.primary"
											sx={{ fontWeight: 600, fontSize: "0.7rem" }}
										>
											Volume:{" "}
											{whVol.toLocaleString(undefined, {
												maximumFractionDigits: 0,
											})}{" "}
											/{" "}
											{warehouseBaseVolCap.toLocaleString(undefined, {
												maximumFractionDigits: 0,
											})}{" "}
											m³
										</Typography>
										<Typography
											variant="caption"
											sx={{
												color:
													warehouseVolPct > 85
														? "#ff5252"
														: warehouseVolPct > 60
															? "#ffd700"
															: "text.secondary",
												fontWeight: 700,
												fontSize: "0.7rem",
											}}
										>
											{warehouseVolPct}%
										</Typography>
									</Box>
									<LinearProgress
										variant="determinate"
										value={warehouseVolPct}
										sx={{
											height: 4,
											borderRadius: 2,
											bgcolor: "rgba(255,255,255,0.08)",
											"& .MuiLinearProgress-bar": {
												bgcolor:
													warehouseVolPct > 85
														? "#ff5252"
														: warehouseVolPct > 60
															? "#ffd700"
															: "#00e5ff",
											},
										}}
									/>
								</Box>
							</Box>

							{/* Warehouse Items List */}
							{warehouseStorage.length > 0 ? (
								<Box sx={{ display: "grid", gap: 0.25 }}>
									{warehouseStorage.map((s) => {
										const props = globalGetMatProps(s.ticker);
										const whItemVol = (s.amount || 0) * props.volume;
										const whItemMass = (s.amount || 0) * props.weight;
										const whItemPctRaw =
											warehouseBaseVolCap > 0
												? (whItemVol / warehouseBaseVolCap) * 100
												: 0;
										const whDisplayPct =
											whItemPctRaw > 0 && whItemPctRaw < 1
												? "<1%"
												: whItemPctRaw >= 1
													? `${Math.round(whItemPctRaw)}%`
													: "";

										return (
											<Tooltip
												key={s.ticker}
												title={`Mass: ${whItemMass.toLocaleString(undefined, { maximumFractionDigits: 1 })} t (${props.weight} t/u) | Volume: ${whItemVol.toLocaleString(undefined, { maximumFractionDigits: 1 })} m³ (${props.volume} m³/u)`}
											>
												<Box
													sx={{
														display: "grid",
														gridTemplateColumns: "48px 45px 1fr",
														alignItems: "center",
														gap: 0.5,
														py: 0.15,
													}}
												>
													<Box
														sx={{
															fontSize: "0.75em",
															display: "flex",
															alignItems: "center",
														}}
													>
														<MaterialBadge ticker={s.ticker} />
													</Box>
													<Typography
														variant="caption"
														sx={{
															color: "rgba(255, 255, 255, 0.4)",
															fontSize: "0.68rem",
															fontWeight: 400,
															fontFamily: "monospace",
														}}
													>
														{whDisplayPct ? `(${whDisplayPct})` : ""}
													</Typography>
													<Typography
														variant="caption"
														sx={{
															fontWeight: 500,
															color: "text.primary",
															textAlign: "right",
															fontSize: "0.7rem",
															fontFamily: "monospace",
															fontVariantNumeric: "tabular-nums",
														}}
													>
														{s.amount.toLocaleString()}
													</Typography>
												</Box>
											</Tooltip>
										);
									})}
								</Box>
							) : (
								<Typography
									variant="caption"
									sx={{
										color: "text.disabled",
										fontStyle: "italic",
										textAlign: "center",
										py: 0.5,
										fontSize: "0.68rem",
									}}
								>
									Empty warehouse storage
								</Typography>
							)}
						</Box>
					)}
				</Box>
			);
		};

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
						bgcolor: "rgba(22, 22, 42, 0.85)",
						backdropFilter: "blur(20px)",
						boxShadow: "0 6px 24px 0 rgba(0, 0, 0, 0.4)",
						transition: "all 0.15s ease",
						cursor: "pointer",
						width: "100%",
						"&:hover": {
							boxShadow: `0 8px 24px -2px ${alpha(statusColor, 0.4)}`,
							borderColor: statusColor,
							bgcolor: "rgba(28, 28, 52, 0.9)",
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
								alignItems: "center",
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
									fontSize: "0.65rem",
									fontWeight: 800,
									bgcolor: "rgba(123, 104, 238, 0.35)",
									color: "#B4A6FF",
									border: "1px solid rgba(180, 166, 255, 0.5)",
								}}
							/>

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
										fontSize: "0.6rem",
										fontWeight: 800,
										bgcolor:
											site.type === "Inbound"
												? "rgba(0, 229, 255, 0.15)"
												: "rgba(255, 152, 0, 0.15)",
										color: site.type === "Inbound" ? "#00e5ff" : "#ffb74d",
										border: `1px dashed ${site.type === "Inbound" ? "rgba(0, 229, 255, 0.4)" : "rgba(255, 152, 0, 0.4)"}`,
									}}
								/>
							)}
						</Box>

						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.75,
								flexShrink: 0,
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
									height: 24,
									fontSize: "0.72rem",
									fontWeight: 700,
									bgcolor: "rgba(123, 104, 238, 0.2)",
									color: "#7B68EE",
									border: "1px solid rgba(123, 104, 238, 0.4)",
									textTransform: "none",
									whiteSpace: "nowrap",
									px: 1.25,
									py: 0,
									lineHeight: 1,
									minWidth: "auto",
									"&:hover": { bgcolor: "rgba(123, 104, 238, 0.35)" },
								}}
							>
								Logistics Planner
							</Button>

							<Tooltip title="Click to open Site Repair & Condition Planner">
								<Chip
									icon={
										<Wrench
											size={11}
											color={conditionColor}
											style={{ marginLeft: 6 }}
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
										fontSize: "0.68rem",
										fontWeight: 700,
										bgcolor: alpha(conditionColor, 0.12),
										color: conditionColor,
										border: `1px solid ${alpha(conditionColor, 0.3)}`,
										cursor: "pointer",
										transition: "all 0.15s ease",
										"&:hover": {
											bgcolor: alpha(conditionColor, 0.25),
											transform: "scale(1.03)",
										},
									}}
								/>
							</Tooltip>
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
										sx={{ flex: "1 1 54%", minWidth: 0, overflowX: "hidden" }}
									>
										{renderProductionFlows()}
									</Box>
									<Box
										sx={{ flex: "1 1 46%", minWidth: 0, overflowX: "hidden" }}
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
