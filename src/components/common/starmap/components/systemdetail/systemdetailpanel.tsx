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
	ListItemButton,
	Button,
	LinearProgress,
} from "@mui/material";
import { getBulkPrices } from "../../../../../dashboard/cx/api";
import {
	Close,
	LocationCity,
	Business,
	Sailing,
	Inventory2,
	PrecisionManufacturing,
	Hub,
	ArrowBack,
	People,
	Visibility,
	ChevronRight,
	AccountBalance,
	Gavel,
	HowToVote,
	EmojiEvents,
} from "@mui/icons-material";
import { getSemimajorAxisAU } from "../../hooks/usemaplayers/constants";
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

	const isLoggedIn = useMemo(() => {
		if (typeof window === "undefined") return false;
		return !!localStorage.getItem("authToken");
	}, []);

	// All our production sites in the current system (only if logged in)
	const systemSites = useMemo(() => {
		if (!isLoggedIn) return [];
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
	}, [isLoggedIn, productionData, planets]);

	// All our production sites on the selected planet (only if logged in)
	const planetSites = useMemo(() => {
		if (!isLoggedIn || !selectedPlanetId) return [];
		return Object.values(productionData || {}).filter(
			(s) => s.planetid === selectedPlanetId,
		);
	}, [isLoggedIn, productionData, selectedPlanetId]);

	const toggleStation = (id: string) => {
		setExpandedStations((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	// Calculate total system population
	const totalSystemPopulation = useMemo(() => {
		if (system.totalSystemPopulation) return system.totalSystemPopulation;
		return planets.reduce((acc, p) => acc + (p.planetPopulation || 0), 0);
	}, [planets, system]);

	// Combine all ships present in the system (only if logged in)
	const systemShips = useMemo(() => {
		if (!isLoggedIn) return { own: [], others: [] };
		const ownList = Array.isArray(ownerShips) ? ownerShips : [];
		const othersList = Array.isArray(otherShips) ? otherShips : [];
		const own = ownList.filter(
			(s) => s.address_system_id === systemId || s.addresssystemid === systemId,
		);
		const others = othersList.filter(
			(s) => s.address_system_id === systemId || s.addresssystemid === systemId,
		);
		return { own, others };
	}, [isLoggedIn, ownerShips, otherShips, systemId]);

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
									{getSemimajorAxisAU(activePlanetData.semimajoraxis)?.toFixed(
										3,
									) || "N/A"}{" "}
									AU
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

						{/* Planetary Government & Parliament */}
						{(() => {
							const govTerms = activePlanetData.Government || [];
							if (!govTerms || govTerms.length === 0) return null;

							// Active in-office term (the term with elected winners holding office right now)
							const activeInOfficeTerm =
								govTerms.find((t: any) => {
									const cands: any[] = t.Candidates || t.candidates || [];
									return cands.some((c: any) =>
										Boolean(c.IsWinner ?? c.is_winner ?? c.isWinner),
									);
								}) ||
								govTerms.find((t: any) => t.TermStart || t.term_start) ||
								govTerms[0];

							const activeTermIndex = govTerms.indexOf(activeInOfficeTerm);
							const activeTermNum =
								activeTermIndex !== -1
									? govTerms.length - activeTermIndex
									: activeInOfficeTerm?.TermId ||
										activeInOfficeTerm?.termid ||
										1;

							// Ongoing election term (if an election is in progress for the upcoming term)
							const electionTerm = govTerms.find((t: any) =>
								Boolean(t.ElectionOngoing ?? t.election_ongoing),
							);

							// Past terms excluding the currently active term and any ongoing election term
							const pastTerms = govTerms.filter(
								(t: any) => t !== activeInOfficeTerm && t !== electionTerm,
							);

							const officeCands: any[] =
								activeInOfficeTerm?.Candidates ||
								activeInOfficeTerm?.candidates ||
								[];
							const officeWinners = officeCands.filter((c: any) =>
								Boolean(c.IsWinner ?? c.is_winner ?? c.isWinner),
							);

							const electionCands: any[] =
								electionTerm?.Candidates || electionTerm?.candidates || [];

							return (
								<Box
									sx={{
										p: 1,
										borderRadius: "6px",
										bgcolor: "rgba(123, 104, 238, 0.05)",
										border: "1px solid rgba(123, 104, 238, 0.2)",
										display: "flex",
										flexDirection: "column",
										gap: 0.75,
									}}
								>
									{/* Top Header Row */}
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
												color: "#7B68EE",
												fontWeight: 800,
												fontSize: "0.7rem",
												letterSpacing: "0.04em",
												display: "flex",
												alignItems: "center",
												gap: 0.4,
											}}
										>
											<AccountBalance sx={{ fontSize: 14 }} /> PLANETARY
											GOVERNMENT
										</Typography>

										<Box
											sx={{ display: "flex", alignItems: "center", gap: 0.4 }}
										>
											{electionTerm && (
												<Box
													sx={{
														px: 0.6,
														py: 0.1,
														borderRadius: "8px",
														bgcolor: "rgba(123, 104, 238, 0.15)",
														border: "1px solid #7B68EE",
														color: "#7B68EE",
														fontSize: "0.52rem",
														fontWeight: 800,
													}}
												>
													ELECTION ACTIVE
												</Box>
											)}
											<Box
												sx={{
													px: 0.5,
													py: 0.1,
													borderRadius: "3px",
													bgcolor: "rgba(123, 104, 238, 0.15)",
													border: "1px solid #7B68EE",
													color: "#7B68EE",
													fontSize: "0.52rem",
													fontWeight: 800,
												}}
											>
												TERM #{activeTermNum}
											</Box>
										</Box>
									</Box>

									{/* Compact Term Stats Info */}
									<Box
										sx={{
											p: 0.5,
											px: 0.75,
											borderRadius: "4px",
											bgcolor: "rgba(0, 0, 0, 0.25)",
											border: "1px solid rgba(255, 255, 255, 0.04)",
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											fontSize: "0.6rem",
											color: "rgba(255,255,255,0.7)",
										}}
									>
										<span>
											Term:{" "}
											<strong style={{ color: "#fff" }}>
												{activeInOfficeTerm?.TermStart ||
												activeInOfficeTerm?.term_start
													? new Date(
															activeInOfficeTerm.TermStart ||
																activeInOfficeTerm.term_start,
														).toLocaleDateString()
													: "Active"}
												{" - "}
												{activeInOfficeTerm?.TermEnd ||
												activeInOfficeTerm?.term_end
													? new Date(
															activeInOfficeTerm.TermEnd ||
																activeInOfficeTerm.term_end,
														).toLocaleDateString()
													: "Ongoing"}
											</strong>
										</span>
										<span>
											Seats:{" "}
											<strong style={{ color: "#7B68EE" }}>
												{activeInOfficeTerm?.ParliamentSize ||
													activeInOfficeTerm?.parliament_size ||
													officeWinners.length}
											</strong>
										</span>
										{electionTerm &&
											(electionTerm.ElectionEnd ||
												electionTerm.election_end) && (
												<span>
													Vote Ends:{" "}
													<strong style={{ color: "#7B68EE" }}>
														{new Date(
															electionTerm.ElectionEnd ||
																electionTerm.election_end,
														).toLocaleDateString()}
													</strong>
												</span>
											)}
									</Box>

									{/* Members Currently in Office (Ultra Compact) */}
									<Box
										sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}
									>
										<Typography
											variant="caption"
											sx={{
												fontSize: "0.58rem",
												fontWeight: 700,
												color: "rgba(255,255,255,0.45)",
												textTransform: "uppercase",
											}}
										>
											Active Officers in Office
										</Typography>
										{(officeWinners.length > 0
											? officeWinners
											: officeCands
										).map((cand: any, idx: number) => {
											const isWin = Boolean(
												cand.IsWinner ?? cand.is_winner ?? cand.isWinner,
											);
											const winIndex = officeWinners.indexOf(cand);
											const isGovernor = isWin && winIndex === 0;
											const isMP = isWin && winIndex > 0;
											const pct =
												Math.round(
													(cand.VotesPercentage ?? cand.votes_percentage ?? 0) *
														100,
												) / 100;
											const username =
												cand.Username ||
												cand.username ||
												cand.UserId ||
												cand.userid ||
												"Anonymous";
											const corpCode =
												cand.CorporationCode || cand.corporation_code || null;

											return (
												<Box
													key={cand.CandidateId || cand.id || idx}
													sx={{
														p: 0.4,
														px: 0.75,
														borderRadius: "4px",
														bgcolor: isGovernor
															? "rgba(123, 104, 238, 0.1)"
															: "rgba(0,0,0,0.2)",
														border: isGovernor
															? "1px solid rgba(123, 104, 238, 0.3)"
															: "1px solid rgba(255,255,255,0.05)",
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
													}}
												>
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 0.4,
														}}
													>
														{isGovernor ? (
															<EmojiEvents
																sx={{ fontSize: 12, color: "#7B68EE" }}
															/>
														) : isMP ? (
															<People sx={{ fontSize: 12, color: "#7B68EE" }} />
														) : null}
														<Typography
															variant="caption"
															sx={{
																fontWeight: 700,
																fontSize: "0.65rem",
																color: isGovernor ? "#9988ff" : "#fff",
															}}
														>
															{username}
														</Typography>
														{corpCode && (
															<Typography
																variant="caption"
																sx={{
																	fontSize: "0.55rem",
																	color: "rgba(255,255,255,0.45)",
																}}
															>
																[{corpCode}]
															</Typography>
														)}
													</Box>

													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 0.4,
														}}
													>
														{isGovernor ? (
															<Box
																sx={{
																	px: 0.4,
																	py: 0.05,
																	borderRadius: "3px",
																	bgcolor: "rgba(123, 104, 238, 0.2)",
																	border: "1px solid #7B68EE",
																	color: "#7B68EE",
																	fontSize: "0.5rem",
																	fontWeight: 800,
																}}
															>
																GOVERNOR
															</Box>
														) : isMP ? (
															<Box
																sx={{
																	px: 0.4,
																	py: 0.05,
																	borderRadius: "3px",
																	bgcolor: "rgba(123, 104, 238, 0.15)",
																	border: "1px solid rgba(123, 104, 238, 0.5)",
																	color: "#7B68EE",
																	fontSize: "0.5rem",
																	fontWeight: 800,
																}}
															>
																MP
															</Box>
														) : null}
														<Typography
															variant="caption"
															sx={{
																fontWeight: 700,
																fontSize: "0.6rem",
																color: "rgba(255,255,255,0.7)",
															}}
														>
															{cand.Votes ?? cand.votes ?? 0} ({pct}%)
														</Typography>
													</Box>
												</Box>
											);
										})}
									</Box>

									{/* Upcoming Election Candidates Section (Compact Scrollable) */}
									{electionTerm && electionCands.length > 0 && (
										<Box
											sx={{
												borderTop: "1px dashed rgba(123, 104, 238, 0.2)",
												pt: 0.5,
											}}
										>
											<Typography
												variant="caption"
												sx={{
													fontSize: "0.58rem",
													fontWeight: 800,
													color: "#7B68EE",
													textTransform: "uppercase",
													letterSpacing: "0.04em",
													display: "block",
													mb: 0.35,
												}}
											>
												Election Candidates Running for Next Term (
												{electionCands.length})
											</Typography>

											<Box
												sx={{
													maxHeight: 100,
													overflowY: "auto",
													display: "flex",
													flexDirection: "column",
													gap: 0.3,
													pr: 0.5,
													"&::-webkit-scrollbar": { width: 3 },
													"&::-webkit-scrollbar-thumb": {
														bgcolor: "rgba(123, 104, 238, 0.3)",
														borderRadius: 2,
													},
												}}
											>
												{electionCands.map((cand: any, cIdx: number) => {
													const username =
														cand.Username ||
														cand.username ||
														cand.UserId ||
														cand.userid ||
														"Anonymous";
													const corpCode =
														cand.CorporationCode ||
														cand.corporation_code ||
														null;

													return (
														<Box
															key={cand.CandidateId || cand.id || cIdx}
															sx={{
																p: 0.35,
																px: 0.65,
																borderRadius: "4px",
																bgcolor: "rgba(0,0,0,0.2)",
																border: "1px solid rgba(255,255,255,0.04)",
																display: "flex",
																justifyContent: "space-between",
																alignItems: "center",
																fontSize: "0.6rem",
															}}
														>
															<Box
																sx={{
																	display: "flex",
																	alignItems: "center",
																	gap: 0.4,
																}}
															>
																<span
																	style={{ color: "#fff", fontWeight: 600 }}
																>
																	{username}
																</span>
																{corpCode && (
																	<span
																		style={{ color: "rgba(255,255,255,0.4)" }}
																	>
																		[{corpCode}]
																	</span>
																)}
															</Box>
															<span
																style={{
																	color: "rgba(255,255,255,0.5)",
																	fontWeight: 700,
																	fontSize: "0.55rem",
																	letterSpacing: "0.04em",
																}}
															>
																REDACTED
															</span>
														</Box>
													);
												})}
											</Box>
										</Box>
									)}

									{/* Past Terms List (Ultra Compact Scrollable) */}
									{pastTerms.length > 0 && (
										<Box
											sx={{
												borderTop: "1px dashed rgba(255,255,255,0.08)",
												pt: 0.5,
											}}
										>
											<Typography
												variant="caption"
												sx={{
													fontSize: "0.58rem",
													fontWeight: 800,
													color: "rgba(255,255,255,0.45)",
													textTransform: "uppercase",
													letterSpacing: "0.04em",
													display: "block",
													mb: 0.35,
												}}
											>
												Past Terms ({pastTerms.length})
											</Typography>

											<Box
												sx={{
													maxHeight: 180,
													overflowY: "auto",
													overflowX: "hidden",
													display: "flex",
													flexDirection: "column",
													gap: 0.5,
													pr: 0.5,
													"&::-webkit-scrollbar": { width: 3 },
													"&::-webkit-scrollbar-thumb": {
														bgcolor: "rgba(123, 104, 238, 0.3)",
														borderRadius: 2,
													},
												}}
											>
												{pastTerms.map((t: any, pIdx: number) => {
													const termIndex = govTerms.indexOf(t);
													const termNum =
														termIndex !== -1
															? govTerms.length - termIndex
															: pastTerms.length - pIdx;

													const termCands: any[] =
														t.Candidates || t.candidates || [];
													const termWinners = termCands.filter((c: any) =>
														Boolean(c.IsWinner ?? c.is_winner ?? c.isWinner),
													);
													const governor = termWinners[0];
													const mps = termWinners.slice(1);

													return (
														<Box
															key={t.TermId || t.termid || pIdx}
															sx={{
																p: 0.5,
																px: 0.75,
																borderRadius: "4px",
																bgcolor: "rgba(0, 0, 0, 0.25)",
																border: "1px solid rgba(255, 255, 255, 0.05)",
																display: "flex",
																flexDirection: "column",
																gap: 0.35,
																fontSize: "0.6rem",
															}}
														>
															{/* Top Header of Term Card */}
															<Box
																sx={{
																	display: "flex",
																	justifyContent: "space-between",
																	alignItems: "center",
																}}
															>
																<span
																	style={{ color: "#7B68EE", fontWeight: 800 }}
																>
																	Term #{termNum}
																</span>
																<span
																	style={{
																		color: "rgba(255,255,255,0.4)",
																		fontSize: "0.55rem",
																	}}
																>
																	{t.TermStart || t.term_start
																		? new Date(
																				t.TermStart || t.term_start,
																			).toLocaleDateString()
																		: ""}
																	{t.TermEnd || t.term_end
																		? ` - ${new Date(t.TermEnd || t.term_end).toLocaleDateString()}`
																		: ""}
																</span>
															</Box>

															{/* Governor Row */}
															{governor && (
																<Box
																	sx={{
																		display: "flex",
																		justifyContent: "space-between",
																		alignItems: "center",
																		pl: 0.5,
																	}}
																>
																	<Box
																		sx={{
																			display: "flex",
																			alignItems: "center",
																			gap: 0.4,
																		}}
																	>
																		<EmojiEvents
																			sx={{ fontSize: 11, color: "#7B68EE" }}
																		/>
																		<span
																			style={{
																				color: "rgba(255,255,255,0.5)",
																				fontWeight: 600,
																			}}
																		>
																			Gov:
																		</span>
																		<strong style={{ color: "#9988ff" }}>
																			{governor.Username ||
																				governor.username ||
																				governor.UserId}
																		</strong>
																		{(governor.CorporationCode ||
																			governor.corporation_code) && (
																			<span
																				style={{
																					color: "rgba(255,255,255,0.4)",
																				}}
																			>
																				[
																				{governor.CorporationCode ||
																					governor.corporation_code}
																				]
																			</span>
																		)}
																	</Box>
																	<span
																		style={{
																			color: "rgba(255,255,255,0.7)",
																			fontWeight: 600,
																			fontSize: "0.58rem",
																		}}
																	>
																		{governor.Votes ?? governor.votes ?? 0}{" "}
																		Votes (
																		{Math.round(
																			(governor.VotesPercentage ??
																				governor.votes_percentage ??
																				0) * 100,
																		) / 100}
																		%)
																	</span>
																</Box>
															)}

															{/* MPs Rows */}
															{mps.length > 0 && (
																<Box
																	sx={{
																		display: "flex",
																		flexDirection: "column",
																		gap: 0.25,
																		pl: 0.5,
																	}}
																>
																	{mps.map((mp: any, mIdx: number) => {
																		const pct =
																			Math.round(
																				(mp.VotesPercentage ??
																					mp.votes_percentage ??
																					0) * 100,
																			) / 100;
																		return (
																			<Box
																				key={mp.CandidateId || mIdx}
																				sx={{
																					display: "flex",
																					justifyContent: "space-between",
																					alignItems: "center",
																				}}
																			>
																				<Box
																					sx={{
																						display: "flex",
																						alignItems: "center",
																						gap: 0.4,
																					}}
																				>
																					<People
																						sx={{
																							fontSize: 11,
																							color: "#7B68EE",
																						}}
																					/>
																					<span
																						style={{
																							color: "rgba(255,255,255,0.5)",
																							fontWeight: 600,
																						}}
																					>
																						MP:
																					</span>
																					<strong style={{ color: "#fff" }}>
																						{mp.Username ||
																							mp.username ||
																							mp.UserId}
																					</strong>
																					{(mp.CorporationCode ||
																						mp.corporation_code) && (
																						<span
																							style={{
																								color: "rgba(255,255,255,0.4)",
																							}}
																						>
																							[
																							{mp.CorporationCode ||
																								mp.corporation_code}
																							]
																						</span>
																					)}
																				</Box>
																				<span
																					style={{
																						color: "rgba(255,255,255,0.6)",
																						fontWeight: 500,
																						fontSize: "0.58rem",
																					}}
																				>
																					{mp.Votes ?? mp.votes ?? 0} Votes (
																					{pct}%)
																				</span>
																			</Box>
																		);
																	})}
																</Box>
															)}
														</Box>
													);
												})}
											</Box>
										</Box>
									)}
								</Box>
							);
						})()}

						{/* Planetary Motions */}
						{(() => {
							const motions = activePlanetData.Motions || [];
							if (!motions || motions.length === 0) return null;

							return (
								<Box
									sx={{
										p: 1,
										borderRadius: "6px",
										bgcolor: "rgba(123, 104, 238, 0.05)",
										border: "1px solid rgba(123, 104, 238, 0.2)",
										display: "flex",
										flexDirection: "column",
										gap: 0.75,
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
												color: "#7B68EE",
												fontWeight: 800,
												fontSize: "0.7rem",
												letterSpacing: "0.04em",
												display: "flex",
												alignItems: "center",
												gap: 0.4,
											}}
										>
											<Gavel sx={{ fontSize: 14 }} /> PLANETARY MOTIONS (
											{motions.length})
										</Typography>
									</Box>

									{/* Scrollable Motions Container */}
									<Box
										sx={{
											maxHeight: 180,
											overflowY: "auto",
											overflowX: "hidden",
											display: "flex",
											flexDirection: "column",
											gap: 0.5,
											pr: 0.5,
											"&::-webkit-scrollbar": { width: 3 },
											"&::-webkit-scrollbar-thumb": {
												bgcolor: "rgba(123, 104, 238, 0.3)",
												borderRadius: 2,
											},
										}}
									>
										{motions.map((m: any, idx: number) => {
											const status = (m.Status || "PENDING").toUpperCase();

											const components = m.Components || [];
											const votes = m.Votes || [];

											return (
												<Box
													key={m.MotionId || idx}
													sx={{
														p: 0.5,
														px: 0.75,
														borderRadius: "4px",
														bgcolor: "rgba(0,0,0,0.25)",
														border: "1px solid rgba(255,255,255,0.05)",
														display: "flex",
														flexDirection: "column",
														gap: 0.3,
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
															variant="subtitle2"
															sx={{
																fontWeight: 700,
																fontSize: "0.65rem",
																color: "#fff",
															}}
														>
															{m.MotionName || `Motion #${m.MotionId}`}
														</Typography>
														<Box
															sx={{
																px: 0.4,
																py: 0.05,
																borderRadius: "3px",
																bgcolor: "rgba(123, 104, 238, 0.15)",
																border: "1px solid rgba(123, 104, 238, 0.4)",
																color: "#7B68EE",
																fontSize: "0.5rem",
																fontWeight: 800,
															}}
														>
															{status}
														</Box>
													</Box>

													{m.CreatorUsername && (
														<Typography
															variant="caption"
															sx={{
																fontSize: "0.58rem",
																color: "rgba(255,255,255,0.45)",
															}}
														>
															Proposed by <strong>{m.CreatorUsername}</strong>
															{m.CreatedAt &&
																` • ${new Date(m.CreatedAt).toLocaleDateString()}`}
														</Typography>
													)}

													{/* Motion Components (Compact Inline) */}
													{components.length > 0 && (
														<Box
															sx={{
																display: "flex",
																flexWrap: "wrap",
																gap: 0.4,
																mt: 0.25,
															}}
														>
															{components.map((comp: any, cIdx: number) => (
																<Box
																	key={comp.ComponentId || cIdx}
																	sx={{
																		px: 0.6,
																		py: 0.2,
																		borderRadius: "3px",
																		bgcolor: "rgba(255,255,255,0.03)",
																		border: "1px solid rgba(255,255,255,0.05)",
																		fontSize: "0.58rem",
																		display: "inline-flex",
																		gap: 0.5,
																	}}
																>
																	<span
																		style={{
																			color: "#7B68EE",
																			fontWeight: 600,
																		}}
																	>
																		{comp.Type}
																	</span>
																	{comp.Amount !== undefined && (
																		<span
																			style={{ color: "#fff", fontWeight: 700 }}
																		>
																			{comp.Amount?.toLocaleString()}{" "}
																			{comp.Currency || ""}
																		</span>
																	)}
																</Box>
															))}
														</Box>
													)}

													{/* Motion Votes Detailed Breakdown */}
													{votes.length > 0 && (
														<Box
															sx={{
																display: "flex",
																flexDirection: "column",
																gap: 0.25,
																mt: 0.25,
																pt: 0.25,
																borderTop: "1px dashed rgba(255,255,255,0.06)",
															}}
														>
															<Box
																sx={{
																	display: "flex",
																	alignItems: "center",
																	gap: 0.4,
																}}
															>
																<HowToVote
																	sx={{
																		fontSize: 11,
																		color: "rgba(255,255,255,0.4)",
																	}}
																/>
																<Typography
																	variant="caption"
																	sx={{
																		fontSize: "0.58rem",
																		fontWeight: 700,
																		color: "rgba(255,255,255,0.5)",
																	}}
																>
																	VOTES RECORDED ({votes.length})
																</Typography>
															</Box>
															<Box
																sx={{
																	display: "flex",
																	flexDirection: "column",
																	gap: 0.2,
																	pl: 0.25,
																}}
															>
																{votes.map((v: any, vIdx: number) => {
																	const voterName =
																		v.Username ||
																		v.username ||
																		v.VoterUsername ||
																		v.voter_username ||
																		v.UserId ||
																		v.userid ||
																		"Voter";
																	const voteChoice = String(
																		v.Vote ||
																			v.vote ||
																			v.Option ||
																			v.option ||
																			"FOR",
																	).toUpperCase();

																	return (
																		<Box
																			key={v.VoteId || vIdx}
																			sx={{
																				display: "flex",
																				justifyContent: "space-between",
																				alignItems: "center",
																				fontSize: "0.58rem",
																				bgcolor: "rgba(0,0,0,0.15)",
																				p: 0.25,
																				px: 0.5,
																				borderRadius: "3px",
																			}}
																		>
																			<span
																				style={{
																					color: "#fff",
																					fontWeight: 600,
																				}}
																			>
																				{voterName}
																			</span>
																			<span
																				style={{
																					color:
																						voteChoice === "FOR"
																							? "#7B68EE"
																							: "rgba(255,255,255,0.5)",
																					fontWeight: 700,
																					fontSize: "0.55rem",
																				}}
																			>
																				{voteChoice}
																			</span>
																		</Box>
																	);
																})}
															</Box>
														</Box>
													)}
												</Box>
											);
										})}
									</Box>
								</Box>
							);
						})()}

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
														{planet.semimajoraxis
															? `• ${getSemimajorAxisAU(planet.semimajoraxis).toFixed(2)} AU `
															: ""}
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
