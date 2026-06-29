import React, { useState, useMemo, useCallback } from "react";
import {
	Box,
	Typography,
	IconButton,
	Paper,
	useMediaQuery,
	Select,
	MenuItem,
	FormControl,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SortIcon from "@mui/icons-material/Sort";
import type { MapPoint, PlanetData } from "../../types/maptypes";
import { useTheme } from "@mui/material/styles";
import { Virtuoso } from "react-virtuoso";
import { SystemRow } from "./components/systemrow";

interface SearchResultsPanelProps {
	systems: MapPoint[];
	allPlanetsData: Record<string, PlanetData[]>;
	filter: any;
	searchQuery: string;
	onSelectSystem: (sys: MapPoint) => void;
	onSelectPlanet: (planetId: string, sys: MapPoint) => void;
	onClose: () => void;
}

// Updated Sort Options
type SortOption =
	| "name"
	| "population"
	| "resources_total"
	| "resources_balanced"
	| "resources_sequential";

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

	const [expandedSystems, setExpandedSystems] = useState<
		Record<string, boolean>
	>({});

	const toggleSystem = useCallback((id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setExpandedSystems((prev) => ({ ...prev, [id]: !prev[id] }));
	}, []);

	// 1. Convert unstable filter object to a stable primitive string key.
	const filterKey = useMemo(() => {
		if (!filter) return "";
		const res = filter.resources
			? Array.from(filter.resources).join(",") // Preserve insertion order!
			: "";
		return `${filter.planetType}-${filter.fertileOnly}-${filter.gravity}-${filter.temperature}-${filter.pressure}-${filter.resourceMatchMode}-${res}`;
	}, [filter]);

	// Derive an array of uppercase resource strings for quick matching inside the render loop
	const filterResourcesArray = useMemo(() => {
		return filter?.resources
			? Array.from(filter.resources).map((r: any) => r.toUpperCase())
			: [];
	}, [filterKey]);

	// Read match mode centrally from context
	const resourceMatchMode = filter?.resourceMatchMode || "all";

	// 2. Process and match planets for each system (Bound ONLY to the stable filterKey)
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

				// Resource filter match with Match ALL vs Match ANY logic
				if (filterResourcesArray.length > 0) {
					const planetResNames = new Set(
						(p.resources || []).map((r) =>
							(r.name || (r as any).material || "").toUpperCase(),
						),
					);

					if (resourceMatchMode === "all") {
						// MUST have ALL selected resources
						for (const res of filterResourcesArray) {
							if (!planetResNames.has(res)) return false;
						}
					} else {
						// MUST have ANY of the selected resources
						let hasAny = false;
						for (const res of filterResourcesArray) {
							if (planetResNames.has(res)) {
								hasAny = true;
								break;
							}
						}
						if (!hasAny) return false;
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
	}, [systems, allPlanetsData, filterKey, searchQuery, resourceMatchMode]);

	// Calculate advanced scores per system based on their matched planets
	const getSystemResourceScores = useCallback(
		(sysId: string) => {
			const planets = systemPlanetMatches[sysId] || [];
			let total = 0;
			let balanced = 0;
			let seqScores = new Array(filterResourcesArray.length).fill(0);

			planets.forEach((p) => {
				let pTotal = 0;
				let pFactors: number[] = [];

				filterResourcesArray.forEach((res, idx) => {
					const rObj = (p.resources || []).find(
						(r: any) => (r.material || r.name || "").toUpperCase() === res,
					);
					const factor = rObj
						? rObj.factor !== undefined
							? rObj.factor
							: rObj.value
						: 0;

					pTotal += factor;
					pFactors.push(factor);
					seqScores[idx] += factor; // accumulate specific resource factors across planets
				});

				total += pTotal;
				// Balance is dictated by the lowest factor of requested resources (The bottleneck principle)
				if (pFactors.length > 0) {
					balanced += Math.min(...pFactors);
				}
			});

			return { total, balanced, seqScores };
		},
		[systemPlanetMatches, filterResourcesArray],
	);

	// 3. Sort systems and filter out empty ones
	const sortedSystems = useMemo(() => {
		const query = searchQuery?.trim().toLowerCase() || "";
		const hasPlanetFilters =
			filterResourcesArray.length > 0 ||
			(filter?.planetType && filter.planetType !== "all") ||
			filter?.fertileOnly ||
			(filter?.gravity && filter.gravity !== "all") ||
			(filter?.temperature && filter.temperature !== "all") ||
			(filter?.pressure && filter.pressure !== "all");

		// Filter out systems that have 0 matching planets if a filter is active
		const sysList = systems.filter((sys) => {
			const sysId = sys.originalSystemId || sys.id;
			const matchedPlanets = systemPlanetMatches[sysId] || [];

			if (matchedPlanets.length > 0) return true;
			if (hasPlanetFilters) return false;
			if (query) {
				const sysName = (sys.label || sys.name || "").toLowerCase();
				return sysName.includes(query);
			}
			return true;
		});

		if (sortBy.startsWith("resources")) {
			// PRE-CALCULATE SCORES: Prevents massive lag during O(N log N) sorting
			const scoreMap = new Map<string, any>();
			sysList.forEach((sys) => {
				const sysId = sys.originalSystemId || sys.id;
				scoreMap.set(sysId, getSystemResourceScores(sysId));
			});

			sysList.sort((a, b) => {
				const sA = scoreMap.get(a.originalSystemId || a.id);
				const sB = scoreMap.get(b.originalSystemId || b.id);

				if (sortBy === "resources_total") return sB.total - sA.total;
				if (sortBy === "resources_balanced") return sB.balanced - sA.balanced;

				if (sortBy === "resources_sequential") {
					for (let i = 0; i < filterResourcesArray.length; i++) {
						if (sB.seqScores[i] !== sA.seqScores[i]) {
							return sB.seqScores[i] - sA.seqScores[i];
						}
					}
					// Fallback to highest total if absolutely identical on all fronts
					return sB.total - sA.total;
				}
				return 0;
			});
		} else {
			sysList.sort((a, b) => {
				if (sortBy === "name") {
					return (a.label || a.name || "").localeCompare(
						b.label || b.name || "",
					);
				} else if (sortBy === "population") {
					const popA = a.population || 0;
					const popB = b.population || 0;
					return popB - popA; // Descending
				}
				return 0;
			});
		}

		return sysList;
	}, [
		systems,
		sortBy,
		systemPlanetMatches,
		filterKey,
		searchQuery,
		getSystemResourceScores,
		filterResourcesArray.length,
	]);

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
				background:
					"linear-gradient(135deg, rgba(15, 18, 28, 0.85) 0%, rgba(8, 10, 15, 0.95) 100%)",
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
						Results ({sortedSystems.length} systems)
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

			{/* Sorting & Match Mode Summary */}
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
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}
					>
						SORT
					</Typography>
					<FormControl size="small" variant="standard" sx={{ minWidth: 100 }}>
						<Select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value as SortOption)}
							disableUnderline
							sx={{
								color: "#00e5ff",
								fontSize: "0.75rem",
								fontWeight: 700,
								textAlign: "left",
								"& .MuiSelect-select": { pr: "24px !important" },
							}}
						>
							<MenuItem value="name">Alphabetical</MenuItem>
							<MenuItem value="population">Population</MenuItem>
							<MenuItem value="resources_total">
								Resources (Highest Total)
							</MenuItem>
							<MenuItem value="resources_balanced">
								Resources (Most Balanced)
							</MenuItem>
							<MenuItem value="resources_sequential">
								Resources (Selection Order)
							</MenuItem>
						</Select>
					</FormControl>
				</Box>
			</Box>

			{/* Results List */}
			<Box sx={{ flexGrow: 1, p: 1 }}>
				{sortedSystems.length === 0 ? (
					<Box
						sx={{ py: 8, textAlign: "center", color: "rgba(255,255,255,0.3)" }}
					>
						<Typography variant="body2">No matching systems found</Typography>
						<Typography variant="caption">
							Try adjusting your filters or search query
						</Typography>
					</Box>
				) : (
					<Virtuoso
						style={{ height: "100%" }}
						data={sortedSystems}
						itemContent={(_index, sys) => {
							const sysId = sys.originalSystemId || sys.id;
							const isExpanded = !!expandedSystems[sysId];
							const planets = systemPlanetMatches[sysId] || [];

							return (
								<SystemRow
									sys={sys}
									planets={planets}
									isExpanded={isExpanded}
									filterResourcesArray={filterResourcesArray}
									onToggle={toggleSystem}
									onSelectSystem={onSelectSystem}
									onSelectPlanet={onSelectPlanet}
								/>
							);
						}}
					/>
				)}
			</Box>
		</Paper>
	);
};

export default React.memo(SearchResultsPanel);
