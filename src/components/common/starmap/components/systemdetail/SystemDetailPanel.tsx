import React, { useState, useMemo, useEffect } from "react";
import {
	Box,
	Paper,
	Typography,
	IconButton,
	Tooltip,
	useTheme,
	alpha,
	useMediaQuery,
	Collapse,
	ListItemButton,
	Button,
	LinearProgress,
	CircularProgress,
} from "@mui/material";
import { fetchClient } from "../../../../../utils/apiClient";
import { getBulkPrices } from "../../../../../dashboard/cx/api";
import {
	Close,
	LocationCity,
	Business,
	Sailing,
	Inventory2,
	ExpandLess,
	ExpandMore,
	PrecisionManufacturing,
	Hub,
	ArrowBack,
	People,
	Visibility,
	ChevronRight,
} from "@mui/icons-material";
import type {
	MapPoint,
	PlanetData,
	StationData,
	ShipData,
	FlightPlan,
} from "../../types/maptypes";
import type { StorageState } from "../../../../../dashboard/storage/types";
import type { SiteSummary } from "../../../../../dashboard/production/types";
import MaterialBadge from "../../../../../cosm/components/materialbadge";

interface SystemDetailPanelProps {
	system: MapPoint | null;
	onClose: () => void;
	onEnterSystemView?: () => void;
	onEnterPlanetView?: (planetId: string, system: MapPoint) => void;
	isGalaxyView?: boolean;
	selectedPlanetId: string | null;
	onSelectPlanet: (id: string | null) => void;
	selectedStationId?: string | null;
	onSelectStation?: (id: string | null) => void;
	onSelectShip?: (shipId: string) => void;
	allPlanetsData: Record<string, PlanetData[]>;
	allStationsData: Record<string, StationData[]>;
	ownerShips: ShipData[];
	otherShips: ShipData[];
	activeFlightPlans: FlightPlan[];
	storageState?: StorageState | null;
	productionData: Record<string, SiteSummary>;
}

const SystemDetailPanel: React.FC<SystemDetailPanelProps> = ({
	system,
	onClose,
	onEnterSystemView,
	onEnterPlanetView,
	isGalaxyView = true,
	selectedPlanetId,
	onSelectPlanet,
	selectedStationId = null,
	onSelectStation = () => {},
	onSelectShip,
	allPlanetsData,
	allStationsData,
	ownerShips,
	otherShips,
	activeFlightPlans,
	storageState,
	productionData,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	// Expanded sections state for stations (since planets now have their own sub-view)
	const [expandedStations, setExpandedStations] = useState<
		Record<string, boolean>
	>({});

	// Detailed site view state
	const [selectedSite, setSelectedSite] = useState<any | null>(null);

	// Synchronize resetting of selectedSite on planet changes
	useEffect(() => {
		setSelectedSite(null);
	}, [selectedPlanetId]);

	if (!system) return null;

	const systemId = system.originalSystemId || system.id || system.systemId;
	if (!systemId) return null;

	const planets = allPlanetsData[systemId] || [];
	const stations = allStationsData[systemId] || [];

	// All our production sites in the current system
	const systemSites = useMemo(() => {
		const planetIds = new Set(planets.map((p) => p.planetid));
		const sites = Object.values(productionData || {}).filter((s) =>
			planetIds.has(s.planetid),
		);
		// Sort: direct own sites (not leased/no tenant) on top, leased/tenant sites below
		return sites.sort((a, b) => {
			const aIsLeased = a.isLeased || !!a.tenant;
			const bIsLeased = b.isLeased || !!b.tenant;
			if (aIsLeased && !bIsLeased) return 1;
			if (!aIsLeased && bIsLeased) return -1;
			return 0;
		});
	}, [productionData, planets]);

	// All our production sites on the selected planet
	const planetSites = useMemo(() => {
		if (!selectedPlanetId) return [];
		return Object.values(productionData || {}).filter(
			(s) => s.planetid === selectedPlanetId,
		);
	}, [productionData, selectedPlanetId]);

	const toggleStation = (id: string) => {
		setExpandedStations((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	// Calculate total system population
	const totalSystemPopulation = useMemo(() => {
		if (system.totalSystemPopulation) return system.totalSystemPopulation;
		return planets.reduce((acc, p) => acc + (p.planetPopulation || 0), 0);
	}, [planets, system]);

	// Combine all ships present in the system
	const systemShips = useMemo(() => {
		const own = ownerShips.filter(
			(s) => s.address_system_id === systemId || s.addresssystemid === systemId,
		);
		const others = otherShips.filter(
			(s) => s.address_system_id === systemId || s.addresssystemid === systemId,
		);
		return { own, others };
	}, [ownerShips, otherShips, systemId]);

	// Find active selected planet data
	const activePlanetData = useMemo(() => {
		if (!selectedPlanetId) return null;
		return planets.find((p) => p.planetid === selectedPlanetId) || null;
	}, [planets, selectedPlanetId]);

	// Find active selected station data
	const activeStationData = useMemo(() => {
		if (!selectedStationId) return null;
		return stations.find((s) => s.stationid === selectedStationId) || null;
	}, [stations, selectedStationId]);

	// CX Marketplace State
	const [cxPrices, setCxPrices] = useState<any[]>([]);
	const [cxLoading, setCxLoading] = useState(false);
	const [cxSearchTicker, setCxSearchTicker] = useState("");
	const [marketTickers, setMarketTickers] = useState<string[]>([
		"FE",
		"H2O",
		"C",
		"O",
		"LST",
		"RAT",
		"DW",
		"ED",
		"AL",
	]);

	useEffect(() => {
		if (!activeStationData?.comexid) return;
		let active = true;
		const fetchPrices = async () => {
			setCxLoading(true);
			try {
				const prices = await getBulkPrices(
					marketTickers,
					activeStationData.comexid,
				);
				if (active) {
					setCxPrices(prices);
				}
			} catch (err) {
				console.error(err);
			} finally {
				if (active) setCxLoading(false);
			}
		};
		fetchPrices();
		return () => {
			active = false;
		};
	}, [activeStationData, marketTickers]);

	const handleAddTicker = () => {
		const ticker = cxSearchTicker.trim().toUpperCase();
		if (ticker && !marketTickers.includes(ticker)) {
			setMarketTickers((prev) => [...prev, ticker]);
			setCxSearchTicker("");
		}
	};

	const panelStyle = isMobile
		? {
				position: "absolute" as const,
				bottom: 0,
				left: 0,
				right: 0,
				maxHeight: "65vh",
				borderRadius: "20px 20px 0 0",
				boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.5)",
			}
		: {
				position: "absolute" as const,
				top: "10vh",
				right: 20,
				width: 360,
				height: "80vh",
				borderRadius: "12px",
				boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
			};

	return (
		<Paper
			elevation={8}
			sx={{
				...panelStyle,
				display: "flex",
				flexDirection: "column",
				background:
					"linear-gradient(135deg, rgba(15, 18, 28, 0.85) 0%, rgba(8, 10, 15, 0.95) 100%)",
				backdropFilter: "blur(24px)",
				border: "1px solid rgba(255, 255, 255, 0.08)",
				borderTopColor: isMobile
					? "rgba(0, 229, 255, 0.15)"
					: "rgba(255, 255, 255, 0.08)",
				color: theme.palette.text.primary,
				zIndex: 10,
				overflow: "hidden",
				transition: "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
			}}
		>
			{isMobile && (
				<Box
					sx={{
						width: 36,
						height: 4,
						bgcolor: "rgba(255, 255, 255, 0.25)",
						borderRadius: 2,
						mx: "auto",
						mt: 1.5,
						mb: 0.5,
						cursor: "pointer",
					}}
					onClick={onClose}
				/>
			)}

			{/* HEADER */}
			<Box
				sx={{
					p: 2,
					pb: 1.5,
					borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
					bgcolor: "rgba(0, 0, 0, 0.15)",
					flexShrink: 0,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				{selectedSite ? (
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<IconButton
							size="small"
							onClick={() => setSelectedSite(null)}
							sx={{ color: "rgba(255,255,255,0.7)" }}
						>
							<ArrowBack fontSize="small" />
						</IconButton>
						<Box>
							<Typography
								variant="subtitle2"
								sx={{
									fontWeight: 800,
									color: theme.palette.primary.main,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									fontSize: "0.6rem",
								}}
							>
								{system.label || system.name || systemId} &gt;{" "}
								{activePlanetData?.planetname || selectedPlanetId}
							</Typography>
							<Typography
								variant="h6"
								sx={{ fontSize: "0.95rem", fontWeight: 700 }}
							>
								Site: {selectedSite.owner}'s{" "}
								{selectedSite.production_lines?.[0]?.Type || "Site"}
							</Typography>
						</Box>
					</Box>
				) : activePlanetData ? (
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<IconButton
							size="small"
							onClick={() => onSelectPlanet(null)}
							sx={{ color: "rgba(255,255,255,0.7)" }}
						>
							<ArrowBack fontSize="small" />
						</IconButton>
						<Box>
							<Typography
								variant="subtitle2"
								sx={{
									fontWeight: 800,
									color: theme.palette.primary.main,
									letterSpacing: "0.1em",
									textTransform: "uppercase",
									fontSize: "0.65rem",
								}}
							>
								{system.label || system.name || systemId} Planet
							</Typography>
							<Typography
								variant="h6"
								sx={{ fontSize: "1rem", fontWeight: 700 }}
							>
								{activePlanetData.planetname || selectedPlanetId}
							</Typography>
						</Box>
					</Box>
				) : activeStationData ? (
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<IconButton
							size="small"
							onClick={() => onSelectStation(null)}
							sx={{ color: "rgba(255,255,255,0.7)" }}
						>
							<ArrowBack fontSize="small" />
						</IconButton>
						<Box>
							<Typography
								variant="subtitle2"
								sx={{
									fontWeight: 800,
									color: "#00ff00",
									letterSpacing: "0.1em",
									textTransform: "uppercase",
									fontSize: "0.65rem",
								}}
							>
								{system.label || system.name || systemId} Station
							</Typography>
							<Typography
								variant="h6"
								sx={{ fontSize: "1rem", fontWeight: 700 }}
							>
								{activeStationData.name || selectedStationId}
							</Typography>
						</Box>
					</Box>
				) : (
					<Box>
						<Typography
							variant="subtitle2"
							sx={{
								fontWeight: 800,
								color: "#00e5ff",
								letterSpacing: "0.15em",
								textTransform: "uppercase",
								fontSize: "0.75rem",
							}}
						>
							System Details
						</Typography>
						<Typography
							variant="h6"
							sx={{ fontSize: "1.05rem", fontWeight: 700, mt: 0.25 }}
						>
							{system.label || system.name || systemId}
						</Typography>
					</Box>
				)}

				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					{!activePlanetData && isGalaxyView && onEnterSystemView && (
						<ListItemButton
							onClick={onEnterSystemView}
							sx={{
								py: 0.5,
								px: 1,
								borderRadius: "4px",
								bgcolor: alpha(theme.palette.primary.main, 0.1),
								border: `1.5px solid ${theme.palette.primary.main}`,
								color: theme.palette.primary.main,
								fontSize: "0.675rem",
								fontWeight: 700,
								"&:hover": {
									bgcolor: theme.palette.primary.main,
									color: theme.palette.common.black,
								},
							}}
						>
							<Hub sx={{ fontSize: 13, mr: 0.5 }} />
							ENTER
						</ListItemButton>
					)}
					<IconButton
						size="small"
						onClick={onClose}
						sx={{
							color: "rgba(255, 255, 255, 0.5)",
							"&:hover": {
								color: "#ff1744",
								bgcolor: "rgba(255, 23, 68, 0.08)",
							},
						}}
					>
						<Close fontSize="small" />
					</IconButton>
				</Box>
			</Box>

			{/* SCROLLABLE BODY */}
			<Box
				sx={{
					flex: 1,
					overflowY: "auto",
					p: 2,
					display: "flex",
					flexDirection: "column",
					gap: 2,
				}}
			>
				{selectedSite ? (
					/* ---------------- SITE DETAILS VIEW ---------------- */
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
						{/* Site Overview stats */}
						<Box
							sx={{
								p: 1.5,
								borderRadius: "8px",
								bgcolor: "rgba(255,255,255,0.02)",
								border: "1px solid rgba(255,255,255,0.05)",
							}}
						>
							<Box
								sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
							>
								<Typography
									variant="caption"
									sx={{ color: theme.palette.text.secondary }}
								>
									Owner
								</Typography>
								<Typography
									variant="caption"
									sx={{ fontWeight: 700, color: "#00e5ff" }}
								>
									{selectedSite.owner === "You" ? "You" : selectedSite.owner}
								</Typography>
							</Box>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography
									variant="caption"
									sx={{ color: theme.palette.text.secondary }}
								>
									Platform Condition
								</Typography>
								<Typography variant="caption" sx={{ fontWeight: 600 }}>
									{Math.round(selectedSite.overall_platform_condition * 100)}%
								</Typography>
							</Box>
						</Box>

						{/* Production Stats (Daily Flow) */}
						{selectedSite.site_daily_flow &&
							Object.keys(selectedSite.site_daily_flow).length > 0 && (
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.4)",
											display: "block",
											fontSize: "0.6rem",
											fontWeight: 700,
											textTransform: "uppercase",
											letterSpacing: "0.05em",
											mb: 1,
										}}
									>
										Production Stats (Daily Flow)
									</Typography>
									<Box
										sx={{
											display: "flex",
											flexDirection: "column",
											gap: 0.5,
											p: 1.25,
											bgcolor: "rgba(255,255,255,0.02)",
											borderRadius: "6px",
											border: "1px solid rgba(255,255,255,0.05)",
										}}
									>
										{Object.entries(selectedSite.site_daily_flow).map(
											([ticker, val]: [string, any]) => {
												const flowVal = val.flow;
												const isProd = flowVal > 0;
												return (
													<Box
														key={ticker}
														sx={{
															display: "flex",
															justifyContent: "space-between",
															alignItems: "center",
															py: 0.25,
															borderBottom: "1px dashed rgba(255,255,255,0.05)",
															"&:last-child": { borderBottom: "none" },
														}}
													>
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																gap: 0.5,
															}}
														>
															<MaterialBadge ticker={ticker} />
															<Typography
																variant="caption"
																sx={{ fontSize: "0.7rem", fontWeight: 600 }}
															>
																{ticker}
															</Typography>
														</Box>
														<Typography
															variant="caption"
															sx={{
																fontSize: "0.7rem",
																fontWeight: 700,
																color: isProd ? "success.main" : "warning.main",
																fontFamily: "monospace",
															}}
														>
															{isProd ? "+" : ""}
															{flowVal.toLocaleString("en-US", {
																maximumFractionDigits: 1,
															})}
															/d
														</Typography>
													</Box>
												);
											},
										)}
									</Box>
								</Box>
							)}

						{/* Production Lines */}
						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.4)",
									display: "block",
									fontSize: "0.6rem",
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: "0.05em",
									mb: 1,
								}}
							>
								Production Lines ({(selectedSite.production_lines || []).length}
								)
							</Typography>
							<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
								{(selectedSite.production_lines || []).map(
									(line: any, lIdx: number) => {
										const lineType = line.type || line.Type;
										const lineEfficiency =
											line.efficiency !== undefined
												? line.efficiency
												: line.Efficiency;
										const lineCapacity =
											line.capacity !== undefined
												? line.capacity
												: line.Capacity;
										const orders =
											line.production_orders || line.queue || line.Orders || [];

										return (
											<Box
												key={lIdx}
												sx={{
													p: 1.5,
													bgcolor: "rgba(255,255,255,0.01)",
													border: "1px solid rgba(255,255,255,0.04)",
													borderRadius: "6px",
												}}
											>
												<Box
													sx={{
														display: "flex",
														justifyContent: "space-between",
														borderBottom: "1px solid rgba(255,255,255,0.04)",
														pb: 0.5,
														mb: 1,
													}}
												>
													<Typography
														variant="caption"
														sx={{
															fontWeight: 700,
															color: theme.palette.primary.main,
															textTransform: "uppercase",
														}}
													>
														{lineType}
													</Typography>
													<Typography
														variant="caption"
														sx={{
															color: theme.palette.text.secondary,
															fontSize: "0.65rem",
														}}
													>
														Eff: {Math.round(lineEfficiency * 100)}% • Cap:{" "}
														{lineCapacity}
													</Typography>
												</Box>

												{/* Queue / Active Orders */}
												{orders && orders.length > 0 ? (
													<Box
														sx={{
															display: "flex",
															flexDirection: "column",
															gap: 1,
														}}
													>
														{orders.map((order: any, oIdx: number) => {
															const recipe = order.production_recipe || {};
															const orderName =
																recipe.name || order.Name || "Recipe";
															const isRunning =
																order.started !== null &&
																order.started !== undefined;

															let completedPct: number | null = null;
															if (
																isRunning &&
																order.started &&
																order.duration
															) {
																const elapsed =
																	Date.now() -
																	new Date(order.started).getTime();
																completedPct = Math.min(
																	100,
																	Math.max(
																		0,
																		Math.round(
																			(elapsed / order.duration) * 100,
																		),
																	),
																);
															} else if (
																order.CompletedPercentage !== undefined
															) {
																completedPct = order.CompletedPercentage;
															}

															const inputs =
																recipe.inputs || order.Inputs || [];
															const outputs =
																recipe.outputs || order.Outputs || [];

															return (
																<Box
																	key={oIdx}
																	sx={{
																		p: 1,
																		bgcolor: "rgba(0,0,0,0.15)",
																		borderRadius: "4px",
																	}}
																>
																	<Box
																		sx={{
																			display: "flex",
																			justifyContent: "space-between",
																			mb: 0.5,
																		}}
																	>
																		<Typography
																			variant="caption"
																			sx={{
																				fontWeight: 600,
																				fontSize: "0.65rem",
																			}}
																		>
																			{orderName}
																		</Typography>
																		<Typography
																			variant="caption"
																			sx={{
																				fontSize: "0.65rem",
																				color: theme.palette.text.secondary,
																			}}
																		>
																			{completedPct !== null
																				? `${completedPct}%`
																				: "Pending"}
																		</Typography>
																	</Box>

																	{completedPct !== null && (
																		<LinearProgress
																			variant="determinate"
																			value={completedPct}
																			sx={{
																				height: 3,
																				borderRadius: 1,
																				mb: 1,
																				background: "rgba(255,255,255,0.05)",
																				"& .MuiLinearProgress-bar": {
																					background:
																						theme.palette.primary.main,
																				},
																			}}
																		/>
																	)}

																	{/* Inputs & Outputs */}
																	<Box
																		sx={{
																			display: "flex",
																			flexDirection: "column",
																			gap: 0.5,
																			mt: 0.75,
																		}}
																	>
																		{inputs && inputs.length > 0 && (
																			<Box
																				sx={{
																					display: "flex",
																					alignItems: "center",
																					gap: 0.5,
																					flexWrap: "wrap",
																				}}
																			>
																				<Typography
																					variant="caption"
																					sx={{
																						fontSize: "0.55rem",
																						color: "rgba(255,255,255,0.4)",
																					}}
																				>
																					IN:
																				</Typography>
																				{inputs.map((inp: any, idx: number) => {
																					const ticker =
																						inp.ticker || inp.MaterialTicker;
																					const amount =
																						inp.factor !== undefined
																							? Math.abs(inp.factor)
																							: inp.MaterialAmount;
																					return (
																						<Box
																							key={idx}
																							sx={{
																								display: "inline-flex",
																								alignItems: "center",
																								bgcolor: "rgba(255,0,0,0.05)",
																								border:
																									"1px solid rgba(255,0,0,0.1)",
																								borderRadius: "3px",
																								px: 0.3,
																								py: 0.05,
																								gap: 0.2,
																							}}
																						>
																							<MaterialBadge ticker={ticker} />
																							<Typography
																								variant="caption"
																								sx={{
																									fontSize: "0.55rem",
																									fontWeight: 700,
																								}}
																							>
																								{amount}
																							</Typography>
																						</Box>
																					);
																				})}
																			</Box>
																		)}
																		{outputs && outputs.length > 0 && (
																			<Box
																				sx={{
																					display: "flex",
																					alignItems: "center",
																					gap: 0.5,
																					flexWrap: "wrap",
																				}}
																			>
																				<Typography
																					variant="caption"
																					sx={{
																						fontSize: "0.55rem",
																						color: "rgba(255,255,255,0.4)",
																					}}
																				>
																					OUT:
																				</Typography>
																				{outputs.map(
																					(out: any, idx: number) => {
																						const ticker =
																							out.ticker || out.MaterialTicker;
																						const amount =
																							out.factor !== undefined
																								? out.factor
																								: out.MaterialAmount;
																						return (
																							<Box
																								key={idx}
																								sx={{
																									display: "inline-flex",
																									alignItems: "center",
																									bgcolor: "rgba(0,255,0,0.05)",
																									border:
																										"1px solid rgba(0,255,0,0.1)",
																									borderRadius: "3px",
																									px: 0.3,
																									py: 0.05,
																									gap: 0.2,
																								}}
																							>
																								<MaterialBadge
																									ticker={ticker}
																								/>
																								<Typography
																									variant="caption"
																									sx={{
																										fontSize: "0.55rem",
																										fontWeight: 700,
																									}}
																								>
																									{amount}
																								</Typography>
																							</Box>
																						);
																					},
																				)}
																			</Box>
																		)}
																	</Box>
																</Box>
															);
														})}
													</Box>
												) : (
													<Typography
														variant="caption"
														sx={{
															color: theme.palette.text.secondary,
															fontStyle: "italic",
															fontSize: "0.65rem",
														}}
													>
														No active orders
													</Typography>
												)}
											</Box>
										);
									},
								)}
							</Box>
						</Box>

						{/* Site Storage Facilities from global context */}
						{(() => {
							const matchingStorages = storageState?.units
								? Object.values(storageState.units).filter(
										(u) =>
											u.addressableid === selectedSite.siteid ||
											u.storageid === selectedSite.siteid,
									)
								: [];
							if (matchingStorages.length === 0) {
								if (
									selectedSite.storage_items &&
									selectedSite.storage_items.length > 0
								) {
									return (
										<Box>
											<Typography
												variant="caption"
												sx={{
													color: "rgba(255,255,255,0.4)",
													display: "block",
													fontSize: "0.6rem",
													fontWeight: 700,
													textTransform: "uppercase",
													letterSpacing: "0.05em",
													mb: 1,
												}}
											>
												Site Storage
											</Typography>
											<Box
												sx={{
													display: "flex",
													flexWrap: "wrap",
													gap: 0.5,
													p: 1.5,
													bgcolor: "rgba(255,255,255,0.02)",
													borderRadius: "6px",
													border: "1px solid rgba(255,255,255,0.05)",
												}}
											>
												{selectedSite.storage_items.map(
													(item: any, idx: number) => (
														<Box
															key={idx}
															sx={{
																display: "inline-flex",
																alignItems: "center",
																bgcolor: "rgba(0, 0, 0, 0.2)",
																border: "1px solid rgba(255,255,255,0.06)",
																borderRadius: "4px",
																px: 0.4,
																py: 0.15,
																gap: 0.3,
																fontSize: "0.6rem",
															}}
														>
															<MaterialBadge
																ticker={item.ticker || item.name}
															/>
															<Typography
																variant="caption"
																sx={{ fontSize: "0.6rem", fontWeight: 700 }}
															>
																{item.amount || item.quantity}
															</Typography>
														</Box>
													),
												)}
											</Box>
										</Box>
									);
								}
								return null;
							}
							return (
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.4)",
											display: "block",
											fontSize: "0.6rem",
											fontWeight: 700,
											textTransform: "uppercase",
											letterSpacing: "0.05em",
											mb: 1,
										}}
									>
										Site Storage Facilities
									</Typography>
									{matchingStorages.map((storage) => {
										const volPct = Math.min(
											100,
											Math.max(
												0,
												(storage.volumeload / storage.volumecapacity) * 100,
											),
										);
										const wtPct = Math.min(
											100,
											Math.max(
												0,
												(storage.weightload / storage.weightcapacity) * 100,
											),
										);
										return (
											<Box
												key={storage.storageid}
												sx={{
													mb: 1.5,
													p: 1.5,
													bgcolor: "rgba(255,255,255,0.02)",
													borderRadius: "6px",
													border: "1px solid rgba(255,255,255,0.05)",
												}}
											>
												<Typography
													variant="caption"
													sx={{
														fontWeight: 650,
														display: "block",
														fontSize: "0.7rem",
													}}
												>
													{storage.name} ({storage.type})
												</Typography>
												<Box
													sx={{
														mt: 1,
														mb: 1,
														display: "flex",
														flexDirection: "column",
														gap: 1,
													}}
												>
													<Box>
														<Box
															sx={{
																display: "flex",
																justifyContent: "space-between",
																mb: 0.25,
															}}
														>
															<Typography
																variant="caption"
																sx={{
																	color: theme.palette.text.secondary,
																	fontSize: "0.6rem",
																}}
															>
																Volume: {storage.volumeload.toFixed(1)} /{" "}
																{storage.volumecapacity} m³
															</Typography>
															<Typography
																variant="caption"
																sx={{ fontSize: "0.6rem", fontWeight: 600 }}
															>
																{volPct.toFixed(0)}%
															</Typography>
														</Box>
														<LinearProgress
															variant="determinate"
															value={volPct}
															sx={{
																height: 4,
																borderRadius: 2,
																background: "rgba(255,255,255,0.05)",
																"& .MuiLinearProgress-bar": {
																	background: `linear-gradient(90deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.light} 100%)`,
																},
															}}
														/>
													</Box>
													<Box>
														<Box
															sx={{
																display: "flex",
																justifyContent: "space-between",
																mb: 0.25,
															}}
														>
															<Typography
																variant="caption"
																sx={{
																	color: theme.palette.text.secondary,
																	fontSize: "0.6rem",
																}}
															>
																Weight: {storage.weightload.toFixed(1)} /{" "}
																{storage.weightcapacity} t
															</Typography>
															<Typography
																variant="caption"
																sx={{ fontSize: "0.6rem", fontWeight: 600 }}
															>
																{wtPct.toFixed(0)}%
															</Typography>
														</Box>
														<LinearProgress
															variant="determinate"
															value={wtPct}
															sx={{
																height: 4,
																borderRadius: 2,
																background: "rgba(255,255,255,0.05)",
																"& .MuiLinearProgress-bar": {
																	background: `linear-gradient(90deg, #ff9100 0%, #ffc400 100%)`,
																},
															}}
														/>
													</Box>
												</Box>
												{storage.items && storage.items.length > 0 && (
													<Box
														sx={{
															display: "flex",
															flexWrap: "wrap",
															gap: 0.5,
															mt: 1,
														}}
													>
														{storage.items.map((item, idx) => (
															<Box
																key={idx}
																sx={{
																	display: "inline-flex",
																	alignItems: "center",
																	bgcolor: "rgba(0, 0, 0, 0.2)",
																	border: "1px solid rgba(255,255,255,0.06)",
																	borderRadius: "4px",
																	px: 0.4,
																	py: 0.15,
																	gap: 0.3,
																	fontSize: "0.6rem",
																}}
															>
																<MaterialBadge ticker={item.name} />
																<Typography
																	variant="caption"
																	sx={{ fontSize: "0.6rem", fontWeight: 700 }}
																>
																	{item.quantity}
																</Typography>
															</Box>
														))}
													</Box>
												)}
											</Box>
										);
									})}
								</Box>
							);
						})()}
					</Box>
				) : activePlanetData ? (
					/* ---------------- PLANET DETAILS PAGE ---------------- */
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
						{/* Enters system and focuses on this planet */}
						{onEnterPlanetView && (
							<Button
								variant="outlined"
								fullWidth
								onClick={() => onEnterPlanetView(selectedPlanetId!, system!)}
								sx={{
									py: 0.75,
									borderRadius: "6px",
									bgcolor: "rgba(255, 120, 0, 0.08)",
									border: "1.5px solid #ff7800",
									color: "#ff7800",
									fontWeight: 700,
									fontSize: "0.7rem",
									letterSpacing: "0.05em",
									"&:hover": {
										bgcolor: "#ff7800",
										color: "black",
										border: "1.5px solid #ff7800",
									},
								}}
								startIcon={<Visibility sx={{ fontSize: 14 }} />}
							>
								ENTER SYSTEM & FOCUS PLANET
							</Button>
						)}

						{/* Planet stats */}
						<Box
							sx={{
								p: 1.5,
								borderRadius: "8px",
								bgcolor: "rgba(255,255,255,0.02)",
								border: "1px solid rgba(255,255,255,0.05)",
								display: "flex",
								flexDirection: "column",
								gap: 1,
							}}
						>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography
									variant="caption"
									sx={{ color: theme.palette.text.secondary }}
								>
									Type
								</Typography>
								<Typography variant="caption" sx={{ fontWeight: 600 }}>
									{activePlanetData.type || "Unknown"}
								</Typography>
							</Box>
							{activePlanetData.planetPopulation !== undefined && (
								<Box sx={{ display: "flex", justifyContent: "space-between" }}>
									<Typography
										variant="caption"
										sx={{ color: theme.palette.text.secondary }}
									>
										Population
									</Typography>
									<Typography variant="caption" sx={{ fontWeight: 600 }}>
										{activePlanetData.planetPopulation.toLocaleString()}
									</Typography>
								</Box>
							)}
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography
									variant="caption"
									sx={{ color: theme.palette.text.secondary }}
								>
									Fertility
								</Typography>
								<Typography variant="caption" sx={{ fontWeight: 600 }}>
									{activePlanetData.fertility !== undefined
										? `${Math.round(activePlanetData.fertility * 100)}%`
										: "N/A"}
								</Typography>
							</Box>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography
									variant="caption"
									sx={{ color: theme.palette.text.secondary }}
								>
									Gravity
								</Typography>
								<Typography variant="caption" sx={{ fontWeight: 600 }}>
									{activePlanetData.gravity !== undefined
										? `${activePlanetData.gravity.toFixed(2)} g`
										: "N/A"}
								</Typography>
							</Box>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography
									variant="caption"
									sx={{ color: theme.palette.text.secondary }}
								>
									Temperature
								</Typography>
								<Typography variant="caption" sx={{ fontWeight: 600 }}>
									{activePlanetData.temperature !== undefined
										? `${activePlanetData.temperature.toFixed(1)} °C`
										: "N/A"}
								</Typography>
							</Box>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography
									variant="caption"
									sx={{ color: theme.palette.text.secondary }}
								>
									Pressure
								</Typography>
								<Typography variant="caption" sx={{ fontWeight: 600 }}>
									{activePlanetData.pressure !== undefined
										? `${activePlanetData.pressure.toFixed(2)} atm`
										: "N/A"}
								</Typography>
							</Box>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography
									variant="caption"
									sx={{ color: theme.palette.text.secondary }}
								>
									Orbit Index
								</Typography>
								<Typography variant="caption" sx={{ fontWeight: 600 }}>
									{activePlanetData.orbitindex}
								</Typography>
							</Box>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography
									variant="caption"
									sx={{ color: theme.palette.text.secondary }}
								>
									Semi-major Axis
								</Typography>
								<Typography variant="caption" sx={{ fontWeight: 600 }}>
									{activePlanetData.semimajoraxis?.toFixed(3) || "N/A"} AU
								</Typography>
							</Box>
						</Box>

						{/* Planet Resources */}
						{activePlanetData.resources &&
							activePlanetData.resources.length > 0 && (
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.4)",
											display: "block",
											fontSize: "0.6rem",
											fontWeight: 700,
											textTransform: "uppercase",
											letterSpacing: "0.05em",
											mb: 0.75,
										}}
									>
										Natural Resources
									</Typography>
									<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
										{activePlanetData.resources.map((r, idx) => {
											const ticker = (r as any).material || r.name;
											const factorVal =
												(r as any).factor !== undefined
													? (r as any).factor
													: r.value;
											return (
												<Box
													key={idx}
													sx={{
														display: "inline-flex",
														alignItems: "center",
														bgcolor: "rgba(0, 0, 0, 0.2)",
														border: "1px solid rgba(255,255,255,0.06)",
														borderRadius: "4px",
														px: 0.5,
														py: 0.25,
														gap: 0.5,
														fontSize: "0.65rem",
													}}
												>
													<MaterialBadge ticker={ticker} />
													<Typography
														variant="caption"
														sx={{ fontSize: "0.65rem", fontWeight: 700 }}
													>
														{Math.round(factorVal * 100)}%
													</Typography>
												</Box>
											);
										})}
									</Box>
								</Box>
							)}

						{/* Sites details */}
						{(() => {
							if (planetSites.length === 0) return null;

							return (
								<Box
									sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
								>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.4)",
											display: "block",
											fontSize: "0.6rem",
											fontWeight: 700,
											textTransform: "uppercase",
											letterSpacing: "0.05em",
											mb: 0.5,
										}}
									>
										Sites
									</Typography>
									{planetSites.map((site) => {
										const isMine = !site.isLeased && !site.tenant;

										// Matching storage units for this site
										const siteStorages = storageState?.units
											? Object.values(storageState.units).filter(
													(u) =>
														u.addressableid === site.siteid ||
														u.storageid === site.siteid,
												)
											: [];

										const handleClickSite = () => {
											setSelectedSite({
												siteid: site.siteid,
												owner: isMine ? "You" : site.tenant || "Leased",
												production_lines: site.production_lines,
												overall_platform_condition:
													site.overall_platform_condition,
												storage_items: site.storage_items || [],
												site_daily_flow: site.site_daily_flow || {},
											});
										};

										return (
											<Box
												key={site.siteid}
												sx={{
													p: 1.5,
													bgcolor: "rgba(255,255,255,0.02)",
													borderRadius: "8px",
													border: `1px solid ${isMine ? alpha(theme.palette.primary.main, 0.15) : "rgba(255,255,255,0.05)"}`,
													transition: "all 0.2s",
													"&:hover": {
														bgcolor: "rgba(255,255,255,0.04)",
														borderColor: isMine
															? theme.palette.primary.main
															: "rgba(255,255,255,0.15)",
													},
												}}
											>
												{/* Header click region to see full site details */}
												<Box
													onClick={handleClickSite}
													sx={{
														cursor: "pointer",
														mb: 1,
														pb: 1,
														borderBottom: "1px solid rgba(255,255,255,0.04)",
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
													}}
												>
													<Box>
														<Typography
															variant="caption"
															sx={{
																fontWeight: 700,
																fontSize: "0.725rem",
																color: isMine
																	? theme.palette.primary.main
																	: "#00e5ff",
															}}
														>
															{isMine
																? "Your Site"
																: `${site.tenant || "Leased"}'s Site`}
														</Typography>
														<Typography
															variant="caption"
															sx={{
																display: "block",
																fontSize: "0.6rem",
																color: theme.palette.text.secondary,
															}}
														>
															Condition:{" "}
															{Math.round(
																site.overall_platform_condition * 100,
															)}
															%
														</Typography>
													</Box>
													<Box sx={{ display: "flex", gap: 0.5 }}>
														{site.production_lines.map(
															(l: any, lIdx: number) => (
																<Box
																	key={lIdx}
																	sx={{
																		px: 0.3,
																		py: 0.05,
																		bgcolor: "rgba(0,0,0,0.2)",
																		border: "1px solid rgba(255,255,255,0.04)",
																		borderRadius: "3px",
																		fontSize: "0.55rem",
																	}}
																>
																	{l.type || l.Type}
																</Box>
															),
														)}
													</Box>
												</Box>

												{/* Integrated Storage Units with progress bars */}
												{siteStorages.length > 0 && (
													<Box
														sx={{
															display: "flex",
															flexDirection: "column",
															gap: 1,
															mt: 0.5,
														}}
													>
														{siteStorages.map((storage) => {
															const volPct = Math.min(
																100,
																Math.max(
																	0,
																	(storage.volumeload /
																		storage.volumecapacity) *
																		100,
																),
															);
															const wtPct = Math.min(
																100,
																Math.max(
																	0,
																	(storage.weightload /
																		storage.weightcapacity) *
																		100,
																),
															);
															return (
																<Box
																	key={storage.storageid}
																	sx={{
																		p: 1,
																		bgcolor: "rgba(0,0,0,0.15)",
																		borderRadius: "4px",
																	}}
																>
																	<Typography
																		variant="caption"
																		sx={{
																			fontWeight: 600,
																			display: "block",
																			fontSize: "0.65rem",
																			color: "rgba(255,255,255,0.8)",
																		}}
																	>
																		{storage.type === "WAREHOUSE_STORE"
																			? "Warehouse"
																			: "Site Storage"}
																	</Typography>
																	<Box
																		sx={{
																			mt: 0.5,
																			display: "flex",
																			flexDirection: "column",
																			gap: 0.5,
																		}}
																	>
																		<Box>
																			<Box
																				sx={{
																					display: "flex",
																					justifyContent: "space-between",
																					mb: 0.15,
																				}}
																			>
																				<Typography
																					variant="caption"
																					sx={{
																						color: theme.palette.text.secondary,
																						fontSize: "0.55rem",
																					}}
																				>
																					Vol: {storage.volumeload.toFixed(1)}/
																					{storage.volumecapacity} m³
																				</Typography>
																				<Typography
																					variant="caption"
																					sx={{
																						fontSize: "0.55rem",
																						fontWeight: 600,
																					}}
																				>
																					{volPct.toFixed(0)}%
																				</Typography>
																			</Box>
																			<LinearProgress
																				variant="determinate"
																				value={volPct}
																				sx={{
																					height: 3,
																					borderRadius: 1,
																					background: "rgba(255,255,255,0.05)",
																					"& .MuiLinearProgress-bar": {
																						background: `linear-gradient(90deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.light} 100%)`,
																					},
																				}}
																			/>
																		</Box>
																		<Box>
																			<Box
																				sx={{
																					display: "flex",
																					justifyContent: "space-between",
																					mb: 0.15,
																				}}
																			>
																				<Typography
																					variant="caption"
																					sx={{
																						color: theme.palette.text.secondary,
																						fontSize: "0.55rem",
																					}}
																				>
																					Wt: {storage.weightload.toFixed(1)}/
																					{storage.weightcapacity} t
																				</Typography>
																				<Typography
																					variant="caption"
																					sx={{
																						fontSize: "0.55rem",
																						fontWeight: 600,
																					}}
																				>
																					{wtPct.toFixed(0)}%
																				</Typography>
																			</Box>
																			<LinearProgress
																				variant="determinate"
																				value={wtPct}
																				sx={{
																					height: 3,
																					borderRadius: 1,
																					background: "rgba(255,255,255,0.05)",
																					"& .MuiLinearProgress-bar": {
																						background: `linear-gradient(90deg, #ff9100 0%, #ffc400 100%)`,
																					},
																				}}
																			/>
																		</Box>
																	</Box>
																</Box>
															);
														})}
													</Box>
												)}
											</Box>
										);
									})}
								</Box>
							);
						})()}

						{/* Planetary Storages details */}
						{(() => {
							const siteIds = new Set(planetSites.map((s) => s.siteid));
							const planetaryStorages = storageState?.units
								? Object.values(storageState.units).filter(
										(u) =>
											(u.storageplanetid === selectedPlanetId ||
												u.addressableid === selectedPlanetId) &&
											!siteIds.has(u.addressableid),
									)
								: [];
							if (planetaryStorages.length === 0) return null;
							return (
								<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.4)",
											display: "block",
											fontSize: "0.6rem",
											fontWeight: 700,
											textTransform: "uppercase",
											letterSpacing: "0.05em",
											mb: 0.5,
										}}
									>
										Planetary Warehouses
									</Typography>
									{planetaryStorages.map((storage) => {
										const volPct = Math.min(
											100,
											Math.max(
												0,
												(storage.volumeload / storage.volumecapacity) * 100,
											),
										);
										const wtPct = Math.min(
											100,
											Math.max(
												0,
												(storage.weightload / storage.weightcapacity) * 100,
											),
										);
										return (
											<Box
												key={storage.storageid}
												sx={{
													p: 1.5,
													bgcolor: "rgba(255,255,255,0.02)",
													borderRadius: "6px",
													border: "1px solid rgba(255,255,255,0.05)",
												}}
											>
												<Typography
													variant="caption"
													sx={{
														fontWeight: 650,
														display: "block",
														fontSize: "0.7rem",
													}}
												>
													{storage.owner === "You" || !storage.owner
														? "Your"
														: `${storage.owner}'s`}{" "}
													Warehouse ({storage.type})
												</Typography>
												<Box
													sx={{
														mt: 1,
														mb: 1,
														display: "flex",
														flexDirection: "column",
														gap: 1,
													}}
												>
													<Box>
														<Box
															sx={{
																display: "flex",
																justifyContent: "space-between",
																mb: 0.25,
															}}
														>
															<Typography
																variant="caption"
																sx={{
																	color: theme.palette.text.secondary,
																	fontSize: "0.6rem",
																}}
															>
																Volume: {storage.volumeload.toFixed(1)} /{" "}
																{storage.volumecapacity} m³
															</Typography>
															<Typography
																variant="caption"
																sx={{ fontSize: "0.6rem", fontWeight: 600 }}
															>
																{volPct.toFixed(0)}%
															</Typography>
														</Box>
														<LinearProgress
															variant="determinate"
															value={volPct}
															sx={{
																height: 4,
																borderRadius: 2,
																background: "rgba(255,255,255,0.05)",
																"& .MuiLinearProgress-bar": {
																	background: `linear-gradient(90deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.light} 100%)`,
																},
															}}
														/>
													</Box>
													<Box>
														<Box
															sx={{
																display: "flex",
																justifyContent: "space-between",
																mb: 0.25,
															}}
														>
															<Typography
																variant="caption"
																sx={{
																	color: theme.palette.text.secondary,
																	fontSize: "0.6rem",
																}}
															>
																Weight: {storage.weightload.toFixed(1)} /{" "}
																{storage.weightcapacity} t
															</Typography>
															<Typography
																variant="caption"
																sx={{ fontSize: "0.6rem", fontWeight: 600 }}
															>
																{wtPct.toFixed(0)}%
															</Typography>
														</Box>
														<LinearProgress
															variant="determinate"
															value={wtPct}
															sx={{
																height: 4,
																borderRadius: 2,
																background: "rgba(255,255,255,0.05)",
																"& .MuiLinearProgress-bar": {
																	background: `linear-gradient(90deg, #ff9100 0%, #ffc400 100%)`,
																},
															}}
														/>
													</Box>
												</Box>
												{storage.items && storage.items.length > 0 && (
													<Box
														sx={{
															display: "flex",
															flexWrap: "wrap",
															gap: 0.5,
															mt: 1,
														}}
													>
														{storage.items.map((item, idx) => (
															<Box
																key={idx}
																sx={{
																	display: "inline-flex",
																	alignItems: "center",
																	bgcolor: "rgba(0, 0, 0, 0.2)",
																	border: "1px solid rgba(255,255,255,0.06)",
																	borderRadius: "4px",
																	px: 0.4,
																	py: 0.15,
																	gap: 0.3,
																	fontSize: "0.6rem",
																}}
															>
																<MaterialBadge ticker={item.name} />
																<Typography
																	variant="caption"
																	sx={{ fontSize: "0.6rem", fontWeight: 700 }}
																>
																	{item.quantity}
																</Typography>
															</Box>
														))}
													</Box>
												)}
											</Box>
										);
									})}
								</Box>
							);
						})()}

						{/* Ships docked details */}
						{(() => {
							const dockedShips = [
								...systemShips.own.filter(
									(s) =>
										s.address_planet_id === selectedPlanetId ||
										s.addressplanetid === selectedPlanetId,
								),
								...systemShips.others.filter(
									(s) =>
										s.address_planet_id === selectedPlanetId ||
										s.addressplanetid === selectedPlanetId,
								),
							];
							if (dockedShips.length === 0) return null;
							return (
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.4)",
											display: "block",
											fontSize: "0.6rem",
											fontWeight: 700,
											textTransform: "uppercase",
											letterSpacing: "0.05em",
											mb: 0.75,
										}}
									>
										Docked Ships
									</Typography>
									<Box
										sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
									>
										{dockedShips.map((ship) => (
											<Box
												key={ship.id || ship.ship_id}
												onClick={() =>
													onSelectShip && onSelectShip(ship.id || ship.ship_id)
												}
												sx={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													p: 1,
													bgcolor: "rgba(255,255,255,0.02)",
													borderRadius: "4px",
													cursor: onSelectShip ? "pointer" : "default",
													transition: "background-color 0.2s",
													"&:hover": onSelectShip
														? {
																bgcolor: "rgba(255,255,255,0.06)",
															}
														: {},
												}}
											>
												<Box>
													<Typography
														variant="caption"
														sx={{
															fontWeight: 650,
															display: "block",
															fontSize: "0.7rem",
															color: ship.is_owner
																? theme.palette.primary.main
																: theme.palette.secondary.main,
														}}
													>
														{ship.name || ship.registration} (
														{ship.type || "Ship"})
													</Typography>
													{!ship.is_owner && (
														<Typography
															variant="caption"
															sx={{
																display: "block",
																fontSize: "0.6rem",
																color: theme.palette.text.secondary,
															}}
														>
															Owner: {ship.display_name}
														</Typography>
													)}
												</Box>
											</Box>
										))}
									</Box>
								</Box>
							);
						})()}
					</Box>
				) : activeStationData ? (
					/* ---------------- STATION DETAILS PAGE ---------------- */
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 2,
							p: 2,
							height: "100%",
							overflowY: "auto",
						}}
					>
						{/* Station stats */}
						<Box
							sx={{
								p: 1.5,
								borderRadius: "8px",
								bgcolor: "rgba(255,255,255,0.02)",
								border: "1px solid rgba(255,255,255,0.05)",
								display: "flex",
								flexDirection: "column",
								gap: 1,
							}}
						>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography
									variant="caption"
									sx={{ color: theme.palette.text.secondary }}
								>
									Comex Code
								</Typography>
								<Typography
									variant="caption"
									sx={{ fontWeight: 600, color: "#00e5ff" }}
								>
									{activeStationData.comexid || "N/A"}
								</Typography>
							</Box>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<Typography
									variant="caption"
									sx={{ color: theme.palette.text.secondary }}
								>
									Station ID
								</Typography>
								<Typography variant="caption" sx={{ fontWeight: 600 }}>
									{selectedStationId}
								</Typography>
							</Box>
						</Box>

						{/* Storages at this station */}
						{(() => {
							const matchingStorages = storageState?.units
								? Object.values(storageState.units).filter(
										(u: any) => u.addressableid === selectedStationId,
									)
								: [];
							if (matchingStorages.length === 0) return null;
							return (
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.4)",
											display: "block",
											fontSize: "0.6rem",
											fontWeight: 700,
											textTransform: "uppercase",
											letterSpacing: "0.05em",
											mb: 1,
										}}
									>
										Station Storage Facilities
									</Typography>
									{matchingStorages.map((storage) => {
										const volPct = Math.min(
											100,
											Math.max(
												0,
												(storage.volumeload / storage.volumecapacity) * 100,
											),
										);
										const wtPct = Math.min(
											100,
											Math.max(
												0,
												(storage.weightload / storage.weightcapacity) * 100,
											),
										);
										return (
											<Box
												key={storage.storageid}
												sx={{
													mb: 1.5,
													p: 1.5,
													bgcolor: "rgba(255,255,255,0.02)",
													borderRadius: "6px",
													border: "1px solid rgba(255,255,255,0.05)",
												}}
											>
												<Typography
													variant="caption"
													sx={{
														fontWeight: 650,
														display: "block",
														fontSize: "0.7rem",
													}}
												>
													{storage.name} ({storage.type})
												</Typography>
												<Box
													sx={{
														mt: 1,
														mb: 1,
														display: "flex",
														flexDirection: "column",
														gap: 1,
													}}
												>
													<Box>
														<Box
															sx={{
																display: "flex",
																justifyContent: "space-between",
																mb: 0.25,
															}}
														>
															<Typography
																variant="caption"
																sx={{
																	color: theme.palette.text.secondary,
																	fontSize: "0.6rem",
																}}
															>
																Volume: {storage.volumeload.toFixed(1)} /{" "}
																{storage.volumecapacity} m³
															</Typography>
															<Typography
																variant="caption"
																sx={{ fontSize: "0.6rem", fontWeight: 600 }}
															>
																{volPct.toFixed(0)}%
															</Typography>
														</Box>
														<LinearProgress
															variant="determinate"
															value={volPct}
															sx={{
																height: 4,
																borderRadius: 2,
																background: "rgba(255,255,255,0.05)",
																"& .MuiLinearProgress-bar": {
																	background: `linear-gradient(90deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.light} 100%)`,
																},
															}}
														/>
													</Box>
													<Box>
														<Box
															sx={{
																display: "flex",
																justifyContent: "space-between",
																mb: 0.25,
															}}
														>
															<Typography
																variant="caption"
																sx={{
																	color: theme.palette.text.secondary,
																	fontSize: "0.6rem",
																}}
															>
																Weight: {storage.weightload.toFixed(1)} /{" "}
																{storage.weightcapacity} t
															</Typography>
															<Typography
																variant="caption"
																sx={{ fontSize: "0.6rem", fontWeight: 600 }}
															>
																{wtPct.toFixed(0)}%
															</Typography>
														</Box>
														<LinearProgress
															variant="determinate"
															value={wtPct}
															sx={{
																height: 4,
																borderRadius: 2,
																background: "rgba(255,255,255,0.05)",
																"& .MuiLinearProgress-bar": {
																	background: `linear-gradient(90deg, #ff9100 0%, #ffc400 100%)`,
																},
															}}
														/>
													</Box>
												</Box>
												{storage.items && storage.items.length > 0 && (
													<Box
														sx={{
															display: "flex",
															flexWrap: "wrap",
															gap: 0.5,
															mt: 1,
														}}
													>
														{storage.items.map((item, idx) => (
															<Box
																key={idx}
																sx={{
																	display: "inline-flex",
																	alignItems: "center",
																	bgcolor: "rgba(0, 0, 0, 0.2)",
																	border: "1px solid rgba(255,255,255,0.06)",
																	borderRadius: "4px",
																	px: 0.4,
																	py: 0.15,
																	gap: 0.3,
																	fontSize: "0.6rem",
																}}
															>
																<MaterialBadge ticker={item.name} />
																<Typography
																	variant="caption"
																	sx={{ fontSize: "0.6rem", fontWeight: 700 }}
																>
																	{item.quantity}
																</Typography>
															</Box>
														))}
													</Box>
												)}
											</Box>
										);
									})}
								</Box>
							);
						})()}

						{/* Ships docked details */}
						{(() => {
							const dockedShips = [
								...systemShips.own.filter(
									(s) =>
										s.address_station_id === selectedStationId ||
										s.addressstationid === selectedStationId,
								),
								...systemShips.others.filter(
									(s) =>
										s.address_station_id === selectedStationId ||
										s.addressstationid === selectedStationId,
								),
							];
							if (dockedShips.length === 0) return null;
							return (
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.4)",
											display: "block",
											fontSize: "0.6rem",
											fontWeight: 700,
											textTransform: "uppercase",
											letterSpacing: "0.05em",
											mb: 0.75,
										}}
									>
										Docked Ships
									</Typography>
									<Box
										sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
									>
										{dockedShips.map((ship) => (
											<Box
												key={ship.id || ship.ship_id}
												onClick={() =>
													onSelectShip && onSelectShip(ship.id || ship.ship_id)
												}
												sx={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													p: 1,
													bgcolor: "rgba(255,255,255,0.02)",
													borderRadius: "4px",
													cursor: onSelectShip ? "pointer" : "default",
													transition: "background-color 0.2s",
													"&:hover": onSelectShip
														? {
																bgcolor: "rgba(255,255,255,0.06)",
															}
														: {},
												}}
											>
												<Box>
													<Typography
														variant="caption"
														sx={{
															fontWeight: 650,
															display: "block",
															fontSize: "0.7rem",
															color: ship.is_owner
																? theme.palette.primary.main
																: theme.palette.secondary.main,
														}}
													>
														{ship.name || ship.registration} (
														{ship.type || "Ship"})
													</Typography>
													{!ship.is_owner && (
														<Typography
															variant="caption"
															sx={{
																display: "block",
																fontSize: "0.6rem",
																color: theme.palette.text.secondary,
															}}
														>
															Owner: {ship.display_name}
														</Typography>
													)}
												</Box>
											</Box>
										))}
									</Box>
								</Box>
							);
						})()}
					</Box>
				) : (
					/* ---------------- SYSTEM OVERVIEW PAGE ---------------- */
					<>
						{/* System stats card */}
						<Box
							sx={{
								p: 1.5,
								borderRadius: "8px",
								bgcolor: "rgba(255,255,255,0.02)",
								border: "1px solid rgba(255,255,255,0.05)",
							}}
						>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.4)",
									display: "block",
									fontSize: "0.6rem",
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: "0.05em",
									mb: 0.75,
								}}
							>
								System Summary
							</Typography>
							<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
								<Box sx={{ display: "flex", justifyContent: "space-between" }}>
									<Typography
										variant="caption"
										sx={{ color: theme.palette.text.secondary }}
									>
										Star Class
									</Typography>
									<Typography variant="caption" sx={{ fontWeight: 600 }}>
										Class {system.systemtype || "Unknown"}
									</Typography>
								</Box>
								{totalSystemPopulation > 0 && (
									<Box
										sx={{ display: "flex", justifyContent: "space-between" }}
									>
										<Typography
											variant="caption"
											sx={{ color: theme.palette.text.secondary }}
										>
											Total Population
										</Typography>
										<Typography
											variant="caption"
											sx={{ fontWeight: 600, color: "#00e5ff" }}
										>
											<People
												sx={{ fontSize: 12, verticalAlign: "middle", mr: 0.5 }}
											/>
											{totalSystemPopulation.toLocaleString()}
										</Typography>
									</Box>
								)}
								<Box sx={{ display: "flex", justifyContent: "space-between" }}>
									<Typography
										variant="caption"
										sx={{ color: theme.palette.text.secondary }}
									>
										Star Mass
									</Typography>
									<Typography variant="caption" sx={{ fontWeight: 600 }}>
										{system.masssol
											? `${system.masssol.toFixed(2)} Sol`
											: "Unknown"}
									</Typography>
								</Box>
							</Box>
						</Box>

						{/* PLANETS LIST */}
						{planets.length > 0 && (
							<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
								<Typography
									variant="subtitle2"
									sx={{
										color: theme.palette.primary.main,
										fontWeight: 700,
										fontSize: "0.725rem",
										letterSpacing: "0.05em",
										display: "flex",
										alignItems: "center",
										gap: 0.5,
									}}
								>
									<LocationCity sx={{ fontSize: 14 }} />
									PLANETS ({planets.length})
								</Typography>

								{planets.map((planet) => {
									const planetId = planet.planetid;

									// Local sites
									const planetSites = Object.values(productionData).filter(
										(s) => s.planetid === planetId,
									);

									// Local storages
									const planetStorages = storageState?.units
										? Object.values(storageState.units).filter(
												(u) =>
													u.storageplanetid === planetId ||
													u.addressableid === planetId,
											)
										: [];

									// Present docked ships
									const dockedShips = [
										...systemShips.own.filter(
											(s) =>
												s.address_planet_id === planetId ||
												s.addressplanetid === planetId,
										),
										...systemShips.others.filter(
											(s) =>
												s.address_planet_id === planetId ||
												s.addressplanetid === planetId,
										),
									];

									return (
										<Box
											key={planetId}
											sx={{
												borderRadius: "8px",
												border: "1px solid rgba(255,255,255,0.06)",
												bgcolor: "rgba(255,255,255,0.01)",
												overflow: "hidden",
											}}
										>
											<ListItemButton
												onClick={() => onSelectPlanet(planetId)}
												sx={{
													py: 1,
													px: 1.5,
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													"&:hover": {
														bgcolor: "rgba(255,255,255,0.03)",
													},
												}}
											>
												<Box
													sx={{
														display: "flex",
														flexDirection: "column",
														gap: 0.5,
														flexGrow: 1,
													}}
												>
													<Typography
														variant="body2"
														sx={{ fontWeight: 650, fontSize: "0.775rem" }}
													>
														{planet.planetname || planetId}
													</Typography>
													<Typography
														variant="caption"
														sx={{
															color: theme.palette.text.secondary,
															fontSize: "0.65rem",
														}}
													>
														Type: {planet.type || "Unknown"}{" "}
														{planet.planetPopulation
															? `• Pop: ${planet.planetPopulation.toLocaleString()}`
															: ""}
													</Typography>

													{/* Resource badges with percentages */}
													{planet.resources && planet.resources.length > 0 && (
														<Box
															sx={{
																display: "flex",
																flexWrap: "wrap",
																gap: 0.5,
																mt: 0.5,
															}}
														>
															{planet.resources.map((r, rIdx) => {
																const ticker = (r as any).material || r.name;
																const factor =
																	(r as any).factor !== undefined
																		? (r as any).factor
																		: r.value;
																return (
																	<Box
																		key={rIdx}
																		sx={{
																			display: "inline-flex",
																			alignItems: "center",
																			bgcolor: "rgba(0, 0, 0, 0.25)",
																			border:
																				"1px solid rgba(255, 255, 255, 0.05)",
																			borderRadius: "3px",
																			px: 0.4,
																			py: 0.1,
																			gap: 0.25,
																		}}
																	>
																		<Box
																			sx={{
																				fontSize: "0.5rem",
																				display: "inline-flex",
																			}}
																		>
																			<MaterialBadge ticker={ticker} />
																		</Box>
																		<Typography
																			variant="caption"
																			sx={{
																				fontSize: "0.55rem",
																				fontWeight: 700,
																				color: "rgba(255, 255, 255, 0.7)",
																			}}
																		>
																			{Math.round(factor * 100)}%
																		</Typography>
																	</Box>
																);
															})}
														</Box>
													)}
												</Box>
												<Box
													sx={{ display: "flex", alignItems: "center", gap: 1 }}
												>
													{planetSites.length > 0 && (
														<Tooltip title="Your Production Sites">
															<PrecisionManufacturing
																sx={{
																	fontSize: 13,
																	color: theme.palette.primary.main,
																}}
															/>
														</Tooltip>
													)}
													{planetStorages.length > 0 && (
														<Tooltip title="Your Storage Units">
															<Inventory2
																sx={{
																	fontSize: 13,
																	color: theme.palette.secondary.main,
																}}
															/>
														</Tooltip>
													)}
													{dockedShips.length > 0 && (
														<Tooltip title="Ships Docked/Present">
															<Sailing
																sx={{ fontSize: 13, color: "#00e5ff" }}
															/>
														</Tooltip>
													)}
													<ChevronRight
														sx={{ fontSize: 16, color: "#00e5ff" }}
													/>
												</Box>
											</ListItemButton>
										</Box>
									);
								})}
							</Box>
						)}

						{/* SITES / BASES LIST */}
						{systemSites.length > 0 && (
							<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
								<Typography
									variant="subtitle2"
									sx={{
										color: theme.palette.primary.main,
										fontWeight: 700,
										fontSize: "0.725rem",
										letterSpacing: "0.05em",
										display: "flex",
										alignItems: "center",
										gap: 0.5,
									}}
								>
									<PrecisionManufacturing sx={{ fontSize: 14 }} />
									SITES / BASES ({systemSites.length})
								</Typography>

								{systemSites.map((site) => {
									const isMine = !site.isLeased && !site.tenant;
									const pName =
										planets.find((p) => p.planetid === site.planetid)
											?.planetname || "Unknown Planet";

									const handleClickSite = () => {
										onSelectPlanet(site.planetid);
										setSelectedSite({
											siteid: site.siteid,
											owner: isMine ? "You" : site.tenant || "Leased",
											production_lines: site.production_lines,
											overall_platform_condition:
												site.overall_platform_condition,
											storage_items: site.storage_items || [],
											site_daily_flow: site.site_daily_flow || {},
										});
									};

									return (
										<Box
											key={site.siteid}
											sx={{
												borderRadius: "8px",
												border: `1px solid ${isMine ? alpha(theme.palette.primary.main, 0.15) : "rgba(255,255,255,0.06)"}`,
												bgcolor: "rgba(255,255,255,0.01)",
												overflow: "hidden",
											}}
										>
											<ListItemButton
												onClick={handleClickSite}
												sx={{
													py: 1,
													px: 1.5,
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													"&:hover": {
														bgcolor: "rgba(255,255,255,0.03)",
													},
												}}
											>
												<Box>
													<Typography
														variant="body2"
														sx={{
															fontWeight: 650,
															fontSize: "0.775rem",
															color: isMine
																? theme.palette.primary.main
																: "#00e5ff",
														}}
													>
														{isMine
															? "Your Site"
															: `${site.tenant || "Leased"}'s Site`}
													</Typography>
													<Typography
														variant="caption"
														sx={{
															color: theme.palette.text.secondary,
															fontSize: "0.65rem",
														}}
													>
														Planet: {pName} • Platform Cond:{" "}
														{Math.round(site.overall_platform_condition * 100)}%
													</Typography>
												</Box>
												<Box sx={{ display: "flex", gap: 0.5 }}>
													{site.production_lines?.map(
														(l: any, lIdx: number) => (
															<Box
																key={lIdx}
																sx={{
																	px: 0.3,
																	py: 0.05,
																	bgcolor: "rgba(0,0,0,0.2)",
																	border: "1px solid rgba(255,255,255,0.04)",
																	borderRadius: "3px",
																	fontSize: "0.55rem",
																}}
															>
																{l.type || l.Type}
															</Box>
														),
													)}
												</Box>
											</ListItemButton>
										</Box>
									);
								})}
							</Box>
						)}

						{/* STATIONS LIST */}
						{stations.length > 0 && (
							<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
								<Typography
									variant="subtitle2"
									sx={{
										color: theme.palette.secondary.main,
										fontWeight: 700,
										fontSize: "0.725rem",
										letterSpacing: "0.05em",
										display: "flex",
										alignItems: "center",
										gap: 0.5,
									}}
								>
									<Business sx={{ fontSize: 14 }} />
									STATIONS ({stations.length})
								</Typography>

								{stations.map((station) => {
									const stationId = station.stationid;
									const isExpanded = !!expandedStations[stationId];

									// Local storages
									const stationStorages = storageState?.units
										? Object.values(storageState.units).filter(
												(u) => u.addressableid === stationId,
											)
										: [];

									// Present docked ships
									const dockedShips = [
										...systemShips.own.filter(
											(s) =>
												s.address_station_id === stationId ||
												s.addressstationid === stationId,
										),
										...systemShips.others.filter(
											(s) =>
												s.address_station_id === stationId ||
												s.addressstationid === stationId,
										),
									];

									return (
										<Box
											key={stationId}
											sx={{
												borderRadius: "8px",
												border: "1px solid rgba(255,255,255,0.06)",
												bgcolor: "rgba(255,255,255,0.01)",
												overflow: "hidden",
											}}
										>
											<ListItemButton
												onClick={() => onSelectStation(stationId)}
												sx={{
													py: 1,
													px: 1.5,
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													bgcolor: "transparent",
												}}
											>
												<Box>
													<Typography
														variant="body2"
														sx={{ fontWeight: 650, fontSize: "0.775rem" }}
													>
														{station.name || stationId}
													</Typography>
													<Typography
														variant="caption"
														sx={{
															color: theme.palette.text.secondary,
															fontSize: "0.65rem",
														}}
													>
														Comex: {station.comexid || "N/A"} • ID: {stationId}
													</Typography>
												</Box>
												<Box
													sx={{ display: "flex", alignItems: "center", gap: 1 }}
												>
													{stationStorages.length > 0 && (
														<Tooltip title="Your Storage Units">
															<Inventory2
																sx={{
																	fontSize: 13,
																	color: theme.palette.secondary.main,
																}}
															/>
														</Tooltip>
													)}
													{dockedShips.length > 0 && (
														<Tooltip title="Ships Docked/Present">
															<Sailing
																sx={{ fontSize: 13, color: "#00e5ff" }}
															/>
														</Tooltip>
													)}
													<ChevronRight
														sx={{
															fontSize: 16,
															color: "rgba(255,255,255,0.5)",
														}}
													/>
												</Box>
											</ListItemButton>
										</Box>
									);
								})}
							</Box>
						)}
					</>
				)}
			</Box>
		</Paper>
	);
};

export default React.memo(SystemDetailPanel);
