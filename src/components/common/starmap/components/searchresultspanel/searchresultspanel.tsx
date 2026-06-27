import React, { useState, useMemo } from "react";
import {
	Box,
	List,
	Typography,
	IconButton,
	Paper,
	Collapse,
	useMediaQuery,
	Select,
	MenuItem,
	FormControl,
	Chip,
	ListItemButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CloseIcon from "@mui/icons-material/Close";
import SortIcon from "@mui/icons-material/Sort";
import type {
	MapPoint,
	PlanetData,
} from "../../types/maptypes";
import { useTheme } from "@mui/material/styles";
import MaterialBadge from "../../../../../cosm/components/materialbadge";

interface SearchResultsPanelProps {
	systems: MapPoint[];
	allPlanetsData: Record<string, PlanetData[]>;
	filter: any;
	searchQuery: string;
	onSelectSystem: (sys: MapPoint) => void;
	onSelectPlanet: (planetId: string, sys: MapPoint) => void;
	onClose: () => void;
}

type SortOption = "name" | "population" | "resources";

const SearchResultsPanel: React.FC<SearchResultsPanelProps> = ({
	systems,
	allPlanetsData,
	filter,
	searchQuery,
	onSelectSystem,
	onSelectPlanet,
	onClose,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const [sortBy, setSortBy] = useState<SortOption>("name");
	const [expandedSystems, setExpandedSystems] = useState<Record<string, boolean>>({});

	const toggleSystem = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setExpandedSystems((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	// 1. Process and match planets for each system based on filters/search
	const systemPlanetMatches = useMemo(() => {
		const result: Record<string, PlanetData[]> = {};
		
		systems.forEach((sys) => {
			const sysId = sys.originalSystemId || sys.id;
			if (!sysId) return;
			const planets = allPlanetsData[sysId] || [];

			// Filter planets matching query and resources
			const filteredPlanets = planets.filter((p) => {
				// Search query match
				const query = searchQuery?.trim().toLowerCase() || "";
				if (query) {
					const pName = (p.planetname || p.planetid || "").toLowerCase();
					if (!pName.includes(query)) return false;
				}

				// Resource filter match (must have all selected resources if any are checked)
				if (filter?.resources && filter.resources.size > 0) {
					const planetResNames = new Set((p.resources || []).map((r) => (r.name || (r as any).material || "").toUpperCase()));
					for (const res of filter.resources) {
						if (!planetResNames.has(res.toUpperCase())) {
							return false;
						}
					}
				}

				// Planet type filter
				if (filter?.planetType && filter.planetType !== "all") {
					const pType = (p.type || "").toUpperCase();
					const isRocky = pType.includes("EARTH") || pType.includes("ROCKY");
					const isGas = pType.includes("GAS");
					if (filter.planetType === "rocky" && !isRocky) return false;
					if (filter.planetType === "gaseous" && !isGas) return false;
				}

				// Fertility filter
				if (filter?.fertileOnly && (!p.fertility || p.fertility <= 0)) {
					return false;
				}

				// Gravity filter
				if (filter?.gravity && filter.gravity !== "all") {
					const grav = p.gravity || 0;
					if (filter.gravity === "low" && grav > 1.0) return false;
					if (filter.gravity === "high" && grav <= 1.0) return false;
				}

				// Temperature filter
				if (filter?.temperature && filter.temperature !== "all") {
					const temp = p.temperature || 0;
					if (filter.temperature === "low" && temp > 0) return false;
					if (filter.temperature === "high" && temp <= 0) return false;
				}

				// Pressure filter
				if (filter?.pressure && filter.pressure !== "all") {
					const press = p.pressure || 0;
					if (filter.pressure === "low" && press > 1.0) return false;
					if (filter.pressure === "high" && press <= 1.0) return false;
				}

				return true;
			});

			result[sysId] = filteredPlanets;
		});

		return result;
	}, [systems, allPlanetsData, filter, searchQuery]);

	// 2. Sort systems based on sort criteria
	const sortedSystems = useMemo(() => {
		const sysList = [...systems];

		sysList.sort((a, b) => {
			if (sortBy === "name") {
				return (a.label || a.name || "").localeCompare(b.label || b.name || "");
			} else if (sortBy === "population") {
				const popA = a.population || 0;
				const popB = b.population || 0;
				return popB - popA; // Descending
			} else if (sortBy === "resources") {
				// Sort by total concentration of filtered/selected resources or any resources if none
				const getResourceScore = (sys: MapPoint) => {
					const sysId = sys.originalSystemId || sys.id;
					const planets = systemPlanetMatches[sysId] || [];
					let score = 0;
					planets.forEach((p) => {
						(p.resources || []).forEach((r) => {
							const resFactor = (r as any).factor !== undefined ? (r as any).factor : r.value;
							if (filter?.resources && filter.resources.size > 0) {
								if (filter.resources.has(r.name?.toUpperCase())) {
									score += resFactor;
								}
							} else {
								score += resFactor;
							}
						});
					});
					return score;
				};
				return getResourceScore(b) - getResourceScore(a); // Descending
			}
			return 0;
		});

		return sysList;
	}, [systems, sortBy, systemPlanetMatches, filter]);

	const panelStyle = isMobile
		? {
				bottom: 0,
				left: 0,
				right: 0,
				width: "100%",
				maxHeight: "45vh",
				borderTopLeftRadius: "16px",
				borderTopRightRadius: "16px",
		  }
		: {
				top: 90,
				right: 20,
				width: 360,
				height: "calc(80vh - 70px)",
				borderRadius: "12px",
				boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
		  };

	return (
		<Paper
			elevation={8}
			sx={{
				...panelStyle,
				position: "absolute",
				display: "flex",
				flexDirection: "column",
				background: "linear-gradient(135deg, rgba(15, 18, 28, 0.85) 0%, rgba(8, 10, 15, 0.95) 100%)",
				backdropFilter: "blur(24px)",
				border: "1px solid rgba(255, 255, 255, 0.08)",
				color: "white",
				zIndex: 10,
				overflow: "hidden",
				transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
			}}
		>
			{/* Header */}
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
				<Box>
					<Typography
						variant="subtitle2"
						sx={{
							fontWeight: 800,
							color: "#00e5ff",
							letterSpacing: "0.1em",
							textTransform: "uppercase",
							fontSize: "0.65rem",
						}}
					>
						Search & Filters
					</Typography>
					<Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 700 }}>
						Results ({systems.length} systems)
					</Typography>
				</Box>
				<IconButton
					size="small"
					onClick={onClose}
					sx={{
						color: "rgba(255, 255, 255, 0.5)",
						"&:hover": { color: "#ff1744", bgcolor: "rgba(255, 23, 68, 0.08)" },
					}}
				>
					<CloseIcon fontSize="small" />
				</IconButton>
			</Box>

			{/* Sorting & Filter Summary */}
			<Box
				sx={{
					p: 1.5,
					borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
					bgcolor: "rgba(0, 0, 0, 0.08)",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: 1,
					flexShrink: 0,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<SortIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }} />
					<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>SORT BY</Typography>
				</Box>
				<FormControl size="small" variant="standard" sx={{ minWidth: 140 }}>
					<Select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as SortOption)}
						disableUnderline
						sx={{
							color: "#00e5ff",
							fontSize: "0.75rem",
							fontWeight: 700,
							textAlign: "right",
							"& .MuiSelect-select": { pr: "24px !important" },
						}}
					>
						<MenuItem value="name">Alphabetical</MenuItem>
						<MenuItem value="population">Population</MenuItem>
						<MenuItem value="resources">Resource Amount</MenuItem>
					</Select>
				</FormControl>
			</Box>

			{/* Results List */}
			<Box sx={{ flexGrow: 1, overflowY: "auto", p: 1 }}>
				{sortedSystems.length === 0 ? (
					<Box sx={{ py: 8, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
						<Typography variant="body2">No matching systems found</Typography>
						<Typography variant="caption">Try adjusting your filters or search query</Typography>
					</Box>
				) : (
					<List disablePadding>
						{sortedSystems.map((sys) => {
							const sysId = sys.originalSystemId || sys.id;
							const isExpanded = !!expandedSystems[sysId];
							const planets = systemPlanetMatches[sysId] || [];

							return (
								<Box
									key={sys.id}
									sx={{
										mb: 1,
										borderRadius: "8px",
										border: "1px solid rgba(255, 255, 255, 0.04)",
										bgcolor: "rgba(255, 255, 255, 0.01)",
										overflow: "hidden",
									}}
								>
									{/* System Item */}
									<ListItemButton
										onClick={() => onSelectSystem(sys)}
										sx={{
											p: 1.5,
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											"&:hover": {
												bgcolor: "rgba(0, 229, 255, 0.06)",
												borderLeft: "2px solid #00e5ff",
												pl: "10px",
											},
										}}
									>
										<Box sx={{ flexGrow: 1 }}>
											<Typography variant="subtitle2" sx={{ fontWeight: 700, color: "white" }}>
												{sys.label || sys.name}
											</Typography>
											<Box sx={{ display: "flex", gap: 1, mt: 0.25 }}>
												<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
													Pop: {sys.population ? sys.population.toLocaleString() : "0"}
												</Typography>
												<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
													Type: {sys.systemtype || "K"}
												</Typography>
											</Box>
										</Box>
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											{planets.length > 0 && (
												<Chip
													label={`${planets.length} matching`}
													size="small"
													sx={{
														height: 18,
														fontSize: "0.6rem",
														bgcolor: "rgba(0, 229, 255, 0.1)",
														color: "#00e5ff",
														border: "1px solid rgba(0, 229, 255, 0.2)",
													}}
												/>
											)}
											<IconButton
												size="small"
												onClick={(e) => toggleSystem(sysId, e)}
												sx={{ color: "rgba(255,255,255,0.4)", p: 0.25 }}
											>
												{isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
											</IconButton>
										</Box>
									</ListItemButton>

									{/* Planets Collapsible Area */}
									<Collapse in={isExpanded} timeout="auto">
										<Box sx={{ pl: 2, pr: 1, pb: 1, borderTop: "1px solid rgba(255,255,255,0.03)" }}>
											{planets.length === 0 ? (
												<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", display: "block", py: 1, pl: 1 }}>
													No matching planets
												</Typography>
											) : (
												planets.map((planet) => (
													<ListItemButton
														key={planet.planetid}
														onClick={() => onSelectPlanet(planet.planetid, sys)}
														sx={{
															mt: 0.5,
															p: 1,
															borderRadius: "4px",
															display: "flex",
															flexDirection: "column",
															alignItems: "flex-start",
															bgcolor: "rgba(0, 0, 0, 0.2)",
															border: "1px solid rgba(255, 255, 255, 0.03)",
															"&:hover": {
																bgcolor: "rgba(255, 120, 0, 0.08)",
																borderLeft: "2px solid #ff7800",
																pl: "6px",
															},
														}}
													>
														<Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
															<Typography variant="caption" sx={{ fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
																{planet.planetname}
															</Typography>
															<Typography variant="caption" sx={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)" }}>
																{planet.type}
															</Typography>
														</Box>
														
														{/* Resources List on Planet Item */}
														{planet.resources && planet.resources.length > 0 && (
															<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75, width: "100%" }}>
																{planet.resources.map((r, rIdx) => {
																	const ticker = (r as any).material || r.name;
																	const factor = (r as any).factor !== undefined ? (r as any).factor : r.value;
																	const isFiltered = filter?.resources && filter.resources.has(ticker?.toUpperCase());
																	return (
																		<Box
																			key={rIdx}
																			sx={{
																				display: "inline-flex",
																				alignItems: "center",
																				bgcolor: isFiltered ? "rgba(0, 229, 255, 0.15)" : "rgba(0, 0, 0, 0.3)",
																				border: isFiltered ? "1px solid rgba(0, 229, 255, 0.3)" : "1px solid rgba(255,255,255,0.04)",
																				borderRadius: "3px",
																				px: 0.4,
																				py: 0.1,
																				gap: 0.25,
																			}}
																		>
																			<Box sx={{ fontSize: "0.5rem", display: "inline-flex" }}>
																				<MaterialBadge ticker={ticker} />
																			</Box>
																			<Typography
																				variant="caption"
																				sx={{
																					fontSize: "0.55rem",
																					fontWeight: 700,
																					color: isFiltered ? "#00e5ff" : "rgba(255,255,255,0.7)",
																				}}
																			>
																				{Math.round(factor * 100)}%
																			</Typography>
																		</Box>
																	);
																})}
															</Box>
														)}
													</ListItemButton>
												))
											)}
										</Box>
									</Collapse>
								</Box>
							);
						})}
					</List>
				)}
			</Box>
		</Paper>
	);
};

export default React.memo(SearchResultsPanel);
