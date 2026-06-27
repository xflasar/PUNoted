import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ScatterplotLayer,
	PolygonLayer,
	PathLayer,
	TextLayer,
	IconLayer,
} from "@deck.gl/layers";
import type { OrthographicViewport } from "@deck.gl/core";
import type {
	MapPoint,
	Sector,
	PlanetPosition,
	AnimatedShipData,
	StationPosition,
	ShipData,
	GatewayData,
	PlanetData,
	StationData,
} from "../types/maptypes";
import { hexToRgba } from "../utils/colors";
import { SYSTEM_BASE_RADIUS } from "../constants/map";
import { FilterState } from "../components/filter/FilterContext";

export function checkSystemMatch(
	sys: MapPoint,
	filter: FilterState | undefined,
	searchQuery: string | undefined,
	allPlanetsData: Record<string, PlanetData[]>,
	systemsPoints: MapPoint[],
	shortestPathDistances?: Record<string, number>
): boolean {
	const query = searchQuery?.trim().toLowerCase() || "";
	if (query) {
		const systemName = (sys.label || sys.name || "").toLowerCase();
		let matchesQuery = systemName.includes(query);
		
		if (!matchesQuery && allPlanetsData) {
			const planets = allPlanetsData[sys.originalSystemId || sys.id] || [];
			matchesQuery = planets.some((p) => (p.planetname || p.planetid || "").toLowerCase().includes(query));
		}
		
		if (!matchesQuery) {
			return false;
		}
	}

	if (!filter) return true;

	const hasResources = filter.resources && filter.resources.size > 0;
	const hasRadius = filter.filterRadius > 0 && filter.originSystemId != null;
	const hasPlanetType = filter.planetType !== 'all';
	const hasFertile = filter.fertileOnly;
	const hasGravity = filter.gravity !== 'all';
	const hasTemperature = filter.temperature !== 'all';
	const hasPressure = filter.pressure !== 'all';
	const hasCogc = filter.cogcEnabled;

	const isFilterActive = hasResources || hasRadius || hasPlanetType || hasFertile || hasGravity || hasTemperature || hasPressure || hasCogc;

	if (!isFilterActive) {
		return true;
	}

	const sysPop = sys.population || 0;
	if (sysPop < filter.populationRange[0] || sysPop > filter.populationRange[1]) {
		return false;
	}

	// Radius filter: uses shortest path distance (parsec connections) if available, otherwise fallback to Euclidean
	if (hasRadius && filter.originSystemId) {
		const systemId = sys.originalSystemId || sys.id;
		if (shortestPathDistances && shortestPathDistances[systemId] !== undefined) {
			if (shortestPathDistances[systemId] > filter.filterRadius) {
				return false;
			}
		} else {
			// Fallback to Euclidean (3D parsecs)
			const originSys = systemsPoints.find((s) => s.originalSystemId === filter.originSystemId || s.id === filter.originSystemId);
			if (originSys) {
				const dx = sys.x - originSys.x;
				const dy = sys.y - originSys.y;
				const dz = (sys.z ?? 0) - (originSys.z ?? 0);
				const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / 36;
				if (dist > filter.filterRadius) {
					return false;
				}
			}
		}
	}

	// Planet-specific filters: Rocky/Gaseous, Fertile, Gravity, Temperature, Pressure, COGC, Resources.
	// A system matches if AT LEAST ONE planet in the system satisfies ALL of these active planet filters.
	const planets = allPlanetsData[sys.originalSystemId || sys.id] || [];
	
	const matchingPlanet = planets.some((p) => {
		// 1. Planet Type
		if (hasPlanetType) {
			const typeStr = (p.type || '').toUpperCase();
			const isRocky = typeStr.includes('EARTH') || typeStr.includes('ROCKY');
			const isGas = typeStr.includes('GAS');
			if (filter.planetType === 'rocky' && !isRocky) return false;
			if (filter.planetType === 'gaseous' && !isGas) return false;
		}

		// 2. Fertility
		if (hasFertile) {
			if (!p.fertility || p.fertility <= 0) return false;
		}

		// 3. Gravity
		if (hasGravity) {
			const grav = p.gravity || 0;
			if (filter.gravity === 'low' && grav > 1.0) return false;
			if (filter.gravity === 'high' && grav <= 1.0) return false;
		}

		// 4. Temperature
		if (hasTemperature) {
			const temp = p.temperature || 0;
			if (filter.temperature === 'low' && temp >= 273.15) return false;
			if (filter.temperature === 'high' && temp < 273.15) return false;
		}

		// 5. Pressure
		if (hasPressure) {
			const press = p.pressure || 0;
			if (filter.pressure === 'low' && press > 1.0) return false;
			if (filter.pressure === 'high' && press <= 1.0) return false;
		}

		// 6. COGC Program
		if (hasCogc) {
			const prog = (p.cogc || '').toUpperCase();
			const selectedProg = filter.cogcProgram.toUpperCase();
			const hasActiveProgram = prog && prog !== 'NONE';
			if (selectedProg === 'ALL') {
				if (!hasActiveProgram) return false;
			} else if (selectedProg === 'NONE') {
				if (hasActiveProgram) return false;
			} else {
				if (!prog.includes(selectedProg)) return false;
			}
		}

		// 7. Resources (Chips act as OR selector: matches if planet has any of the selected resources)
		if (hasResources) {
			const hasMatch = p.resources?.some((r: any) => {
				const ticker = (r.material || r.name || '').toUpperCase();
				return ticker && filter.resources.has(ticker);
			});
			if (!hasMatch) return false;
		}

		return true;
	});

	// If we are filtering by planet attributes or resources, we must have at least one matching planet in the system
	const hasPlanetFilter = hasPlanetType || hasFertile || hasGravity || hasTemperature || hasPressure || hasCogc || hasResources;
	if (hasPlanetFilter && !matchingPlanet) {
		return false;
	}

	return true;
}

import ShipIconAtlas from "../../../../assets/ship_icons.png";
import starO from "../../../../assets/stars/O_star.png";
import starB from "../../../../assets/stars/B_star.png";
import starA from "../../../../assets/stars/A_star.png";
import starF from "../../../../assets/stars/F_star.png";
import starG from "../../../../assets/stars/G_star.png";
import starK from "../../../../assets/stars/K_star.png";
import starM from "../../../../assets/stars/M_star.png";
import stationIC from "../../../../assets/stations/IC_station.png";
import earth from "../../../../assets/planets/earth_like/earth.png";
import vartu from "../../../../assets/planets/earth_like/Vartu.png";
import niceq from "../../../../assets/planets/earth_like/NICEQ.png";
import arden from "../../../../assets/planets/gas_like/ARDEN.png";
import berst from "../../../../assets/planets/gas_like/BERST.png";
import aerst from "../../../../assets/planets/gas_like/AERST.png";
import bluey from "../../../../assets/planets/gas_like/BLUEY.png";
import ert from "../../../../assets/planets/rocky_like/ERT.png";
import bar from "../../../../assets/planets/rocky_like/BAR.png";
import ters from "../../../../assets/planets/rocky_like/TERS.png";
import lcb from "../../../../assets/ships/LCB.png";
import wcb from "../../../../assets/ships/WCB.png";
import vcb from "../../../../assets/ships/VCB.png";
import hcb from "../../../../assets/ships/HCB.png";
import { buildStarAtlas } from "../utils/buildstaratlas";
import { useAnimation } from "./useanimation";


// --- CONSTANTS ---
const STAR_ICONS = [
	{ type: "O", url: starO, size: 512 },
	{ type: "B", url: starB, size: 512 },
	{ type: "A", url: starA, size: 512 },
	{ type: "F", url: starF, size: 512 },
	{ type: "G", url: starG, size: 512 },
	{ type: "K", url: starK, size: 512 },
	{ type: "M", url: starM, size: 512 },
];
const STATION_ICONS = [{ type: "IC", url: stationIC, size: 512 }];
const SHIP_ICONS = [
	{ type: "LCB", url: lcb, size: 512 },
	{ type: "WCB", url: wcb, size: 512 },
	{ type: "VCB", url: vcb, size: 512 },
	{ type: "HCB", url: hcb, size: 512 },
	{ type: "cluster", url: ShipIconAtlas, size: 512 },
];
const PLANET_ICONS = [
	{ type: "EARTH", url: earth, size: 256 },
	{ type: "VARTU", url: vartu, size: 256 },
	{ type: "NICEQ", url: niceq, size: 256 },
	{ type: "ARDEN", url: arden, size: 256 },
	{ type: "BERST", url: berst, size: 256 },
	{ type: "AERST", url: aerst, size: 256 },
	{ type: "BLUEY", url: bluey, size: 256 },
	{ type: "ERT", url: ert, size: 256 },
	{ type: "BAR", url: bar, size: 256 },
	{ type: "TERS", url: ters, size: 256 },
];

interface UseMapLayersProps {
	systemToSectorMap: Map<string, string>;
	visibilityVersion: number;
	galaxyViewState: any;
	SYSTEMS_VISIBLE_ZOOM: number;
	sectors: Sector[];
	empireLegend: Record<string, string>;
	viewportInstance: OrthographicViewport | null;
	systemsPoints: MapPoint[];
	maxSystemPopulation: number;
	ZOOM_SENSITIVITY: number;
	MAX_ALLOWED_RADIUS: number;
	onSystemClick: (sys: MapPoint | null) => void;
	onSystemDoubleClick?: (sys: MapPoint | null) => void;
	isPlanetModeActive: boolean;
	setTooltip: (
		tooltip: { x: number; y: number; content: string } | null,
	) => void;
	isGalaxyView: boolean;
	popFilterSetting: string;
	systemConnections: { sourcePosition: number[]; targetPosition: number[] }[];
	gatewayConnections: {
		sourcePosition: number[];
		targetPosition: number[];
		type: string;
	}[];
	throttleKey: number;
	systemBoundingBox: any[];
	orbitLines: any[];
	orbitLinesStatic: any[];
	allPlanetsData: Record<string, PlanetData[]>;
	allStationsData: Record<string, StationData[]>;
	allGatewaysData: Record<string, GatewayData[]>;
	setSelectedPlanet: (planet: PlanetPosition | null) => void;
	setSelectedStation?: (station: StationPosition | null) => void;
	animatedShipData: ShipData[];
	activeFlightPlans: any[];
	ownFlightPlans: any[];
	corpFlightPlans: any[];
	setActiveFlightPlans: React.Dispatch<React.SetStateAction<any[]>>;
	mode: "public" | "dashboard" | "shipping";
	onShipHover: (info: { object: any; x: number; y: number } | null) => void;
	onShipClick: (ship: AnimatedShipData) => void;
	currentSystemId: string | null;
	currentSystem: MapPoint | null;
	deckRef: React.RefObject<any>;
	animationWorker: Worker | null;
	isInteracting: boolean;
	visiblePathShipIds: Set<string>;
	selectedShipId: string | null;
	productionData?: Record<string, any>;
	filter?: FilterState;
	searchQuery?: string;
	rawConnections?: any[];
	microAsteroids?: any[];
}

// --- STATIC ACCESSORS (Performance Optimization) ---
// Defined outside the component to guarantee referential stability across renders.
const getPlanetPosition = (d: any) => [d.x, d.y];
const getStationPosition = (d: any) => [d.x, d.y];
const getShipPosition = (d: any) => d.position;
const getShipIconType = (d: any) => {
  if (d.isCluster) return "cluster";
  return d.ship_type || d.type || "LCB"; // Fallback to LCB if missing
};
const getShipSize = (d: any) => (d.isCluster ? 40 : 33);
const getPlanetIcon = () => "EARTH";
const getStationIcon = () => "IC";
const getGatewayPosition = (d: any) => [d.x, d.y];
const getGatewayColor = [180, 0, 255];
const getClusterBadgeText = (d: any) => `${d.count}`;
const getClusterBadgePos = (d: any) => d.position;
const getClusterBadgeColor = [250, 250, 0, 255];
const getClusterBadgeBg = [15, 15, 15, 200];
const getShipLabelText = (d: any) => d.name || d.display_name;
const getShipLabelPos = (d: any) => d.position;
const getShipLabelColor = [255, 100, 255, 255];
const getShipLabelBg = [0, 0, 0, 180];
const getSystemIcon = (d: any) => d.systemtype;
const getSystemPos = (d: any) => [d.x, d.y];
const getLabelPos = (d: any) => [d.x, d.y];
const getLabelText = (d: any) => d.label;
const getLabelColor = [255, 255, 255, 255];
const getLabelBgColor = [0, 0, 0, 160];
const getPathData = (d: any) => d.path;
const getPathColor = (d: any) => d.color ?? [0, 229, 255, d.alpha ?? 60];
const getConnectionColor = [255, 255, 255, 10];
const getGatewayConnectionColor = [180, 0, 255, 100];
const getGatewayConnectionPath = (d: any) => [
	d.sourcePosition,
	d.targetPosition,
];

// --- Helper: Debounced Zoom Hook ---
function useDebouncedZoom(zoom: number, delay: number = 200) {
	const [debouncedZoom, setDebouncedZoom] = useState(zoom);
	const timeoutRef = useRef<any>(null);
	useEffect(() => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => {
			setDebouncedZoom(zoom);
		}, delay);
		return () => clearTimeout(timeoutRef.current);
	}, [zoom, delay]);
	return debouncedZoom;
}

// --- CLUSTERING HELPER ---
function clusterShipsByRadius(ships: any[], zoom: number, isGalaxyView: boolean, systemId: string | null): any[] {
  if (!ships || ships.length === 0) return [];

  const screenPixelRadius = !isGalaxyView && systemId ? 2 : 40;
  const scale = Math.pow(2, zoom);
  const worldDist = screenPixelRadius / scale;
  const worldDistSq = worldDist * worldDist;
  const cellSize = worldDist;

  const grid = new Map<string, any[]>();
  for (const ship of ships) {
    if (!ship.position) continue;
    const [x, y] = ship.position;
    const key = `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(ship);
  }

  const clusters: any[] = [];
  const processedShips = new Set<string>();

  for (const ship of ships) {
    // 🚀 FIX: Support normalized ship_id
    const shipId = ship.ship_id || ship.id; 
    if (processedShips.has(shipId) || !ship.position) continue;

    const cluster = {
      id: `c-${shipId}`,
      position: [...ship.position],
      count: 1,
      ships: [ship],
      ship_type: ship.ship_type || ship.type, // Maintain correct type
      name: ship.name || ship.display_name || shipId,
      bearing: ship.bearing,
      color: ship.color,
      isCluster: false,
    };
    processedShips.add(shipId);

    const [x, y] = ship.position;
    const gx = Math.floor(x / cellSize), gy = Math.floor(y / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cellShips = grid.get(`${gx + dx},${gy + dy}`);
        if (cellShips) {
          for (const neighbor of cellShips) {
            const neighborId = neighbor.ship_id || neighbor.id;
            if (processedShips.has(neighborId)) continue;
            
            const d2 = (neighbor.position[0] - x) ** 2 + (neighbor.position[1] - y) ** 2;
            if (d2 <= worldDistSq) {
              cluster.ships.push(neighbor);
              cluster.count++;
              cluster.isCluster = true;
              cluster.color = [255, 255, 0];
              cluster.name = `${cluster.count} Ships`;
              processedShips.add(neighborId);
            }
          }
        }
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

export const useMapLayers = (props: UseMapLayersProps) => {
	const {
		sectors,
		empireLegend,
		systemsPoints,
		maxSystemPopulation,
		onSystemClick,
		onSystemDoubleClick,
		isPlanetModeActive,
		setTooltip,
		isGalaxyView,
		systemConnections,
		gatewayConnections,
		allGatewaysData,
		ownFlightPlans,
		corpFlightPlans,
		visiblePathShipIds,
		mode,
		onShipHover,
		onShipClick,
		currentSystem,
		setSelectedPlanet,
		galaxyViewState,
		SYSTEMS_VISIBLE_ZOOM,
		systemBoundingBox,
		selectedShipId,
		productionData,
		allPlanetsData,
		filter,
		searchQuery,
		rawConnections,
	} = props;

	// --- REFS FOR STABLE CALLBACKS ---
	const callbacksRef = useRef({
		onShipClick,
		onShipHover,
		onSystemClick,
		onSystemDoubleClick,
		setTooltip,
		setSelectedPlanet,
	});

	useEffect(() => {
		callbacksRef.current = {
			onShipClick,
			onShipHover,
			onSystemClick,
			onSystemDoubleClick,
			setTooltip,
			setSelectedPlanet,
		};
	}, [onShipClick, onShipHover, onSystemClick, onSystemDoubleClick, setTooltip, setSelectedPlanet]);

	// --- STABLE HANDLERS ---
	const handleShipClick = useCallback((info: any) => {
		if (info.object) callbacksRef.current.onShipClick(info.object);
	}, []);
	const handlePlanetClick = useCallback((info: any) => {
		if (info.object) callbacksRef.current.setSelectedPlanet(info.object);
	}, []);
	const handleHoverTooltip = useCallback((info: any) => {
		if (info.object)
			callbacksRef.current.setTooltip({
				x: info.x,
				y: info.y,
				content: info.object.name || info.object.label,
			});
		else callbacksRef.current.setTooltip(null);
	}, []);
	const handleGatewayHover = useCallback((info: any) => {
		if (info.object)
			callbacksRef.current.setTooltip({
				x: info.x,
				y: info.y,
				content: `Gateway: ${info.object.name}`,
			});
		else callbacksRef.current.setTooltip(null);
	}, []);
	const handleSystemClick = useCallback(
		(info: any) => {
			if (mode !== "shipping" && info.object)
				callbacksRef.current.onSystemClick(info.object);
		},
		[mode],
	);
	const handleSystemDoubleClick = useCallback(
		(info: any) => {
			if (mode !== "shipping" && info.object && callbacksRef.current.onSystemDoubleClick)
				callbacksRef.current.onSystemDoubleClick(info.object);
		},
		[mode],
	);
	const handleSystemHover = useCallback(
		(info: any) => {
			if (mode !== "shipping" && info.object)
				callbacksRef.current.setTooltip({
					x: info.x,
					y: info.y,
					content: info.object.label,
				});
			else callbacksRef.current.setTooltip(null);
		},
		[mode],
	);

	const safeGetColor = useCallback(
		(empireCode: string | undefined, alpha: number) => {
			if (!empireCode || !empireLegend || !empireLegend[empireCode])
				return [55, 55, 80, alpha];
			try {
				return hexToRgba(empireLegend[empireCode], alpha);
			} catch {
				return [100, 100, 150, alpha];
			}
		},
		[empireLegend],
	);

	const findLocationPosition = useCallback(
		(systemId: any) => {
			if (!systemId) return null;
			const p = systemsPoints.find((p: any) => p.originalSystemId === systemId);
			if (p) return [p.x, p.y] as [number, number];
			return null;
		},
		[systemsPoints],
	);

	// --- ANIMATION HOOK ---
	const {
    activePlanets,
    activeStations,
    updatedShips,
    orbitTrails,
    workerDebugStats,
  } = useAnimation(
    props.currentSystem,
    props.isPlanetModeActive,
    props.allPlanetsData,
    props.allStationsData,
    props.allGatewaysData,
    props.animatedShipData,
    props.activeFlightPlans,
    props.setActiveFlightPlans,
    props.systemsPoints,
    props.isGalaxyView,
    props.deckRef,
    props.animationWorker,
    props.isInteracting,
    props.mode
  );

	// --- ATLAS LOADING ---
	const [starAtlas, setStarAtlas] = useState<ImageBitmap | null>(null);
	const [starMapping, setStarMapping] = useState<any>(null);
	const [stationsAtlas, setStationsAtlas] = useState<ImageBitmap | null>(null);
	const [stationsMapping, setStationsMapping] = useState<any>(null);
	const [shipAtlas, setShipAtlas] = useState<ImageBitmap | null>(null);
	const [shipMapping, setShipMapping] = useState<any>(null);
	const [planetAtlas, setPlanetAtlas] = useState<ImageBitmap | null>(null);
	const [planetMapping, setPlanetMapping] = useState<any>(null);

	useEffect(() => {
		let cancelled = false;
		buildStarAtlas(STAR_ICONS)
			.then((d) => {
				if (cancelled) {
					// free resources if produced after unmount
					try {
						(d.atlas as any)?.close?.();
					} catch { /* ignore */ }
					return;
				}
				setStarAtlas(d.atlas);
				setStarMapping(d.mapping);
			})
			.catch(() => { /* ignore */ });
		return () => {
			cancelled = true;
			setStarAtlas((prev) => {
				try {
					(prev as any)?.close?.();
				} catch { /* ignore */ }
				return null;
			});
			setStarMapping(null);
		};
	}, []);

	useEffect(() => {
		let cancelled = false;
		buildStarAtlas(STATION_ICONS)
			.then((d) => {
				if (cancelled) {
					try {
						(d.atlas as any)?.close?.();
					} catch { /* ignore */ }
					return;
				}
				setStationsAtlas(d.atlas);
				setStationsMapping(d.mapping);
			})
			.catch(() => { /* ignore */ });
		return () => {
			cancelled = true;
			setStationsAtlas((prev) => {
				try {
					(prev as any)?.close?.();
				} catch { /* ignore */ }
				return null;
			});
			setStationsMapping(null);
		};
	}, []);

	useEffect(() => {
		let cancelled = false;
		buildStarAtlas(SHIP_ICONS)
			.then((d) => {
				if (cancelled) {
					try {
						(d.atlas as any)?.close?.();
					} catch { /* ignore */ }
					return;
				}
				setShipAtlas(d.atlas);
				setShipMapping(d.mapping);
			})
			.catch(() => { /* ignore */ });
		return () => {
			cancelled = true;
			setShipAtlas((prev) => {
				try {
					(prev as any)?.close?.();
				} catch { /* ignore */ }
				return null;
			});
			setShipMapping(null);
		};
	}, []);

	useEffect(() => {
		let cancelled = false;
		buildStarAtlas(PLANET_ICONS)
			.then((d) => {
				if (cancelled) {
					try {
						(d.atlas as any)?.close?.();
					} catch { /* ignore */ }
					return;
				}
				setPlanetAtlas(d.atlas);
				setPlanetMapping(d.mapping);
			})
			.catch(() => { /* ignore */ });
		return () => {
			cancelled = true;
			setPlanetAtlas((prev) => {
				try {
					(prev as any)?.close?.();
				} catch { /* ignore */ }
				return null;
			});
			setPlanetMapping(null);
		};
	}, []);

	// --- STATIC PREP ---
	const currentZoom = galaxyViewState?.zoom ?? 1;
	const debouncedZoom = useDebouncedZoom(currentZoom, 200);
	const showLabels = currentZoom >= SYSTEMS_VISIBLE_ZOOM;

	// Dijkstra Shortest Path calculation from Origin system
	const shortestPathData = useMemo(() => {
		if (!filter?.originSystemId || !rawConnections || rawConnections.length === 0 || !systemsPoints) {
			return { distances: {} as Record<string, number>, pathEdges: new Set<string>(), pathSystemIds: new Set<string>() };
		}

		const adj = new Map<string, string[]>();
		rawConnections.forEach((conn: any) => {
			const u = String(conn.systemidorigin || conn.systemIdOrigin || conn.origin || '');
			const v = String(conn.systemiddestination || conn.systemIdDestination || conn.destination || '');
			if (u && v) {
				if (!adj.has(u)) adj.set(u, []);
				if (!adj.has(v)) adj.set(v, []);
				adj.get(u)!.push(v);
				adj.get(v)!.push(u);
			}
		});

		const sysMap = new Map<string, MapPoint>();
		systemsPoints.forEach((s) => {
			const id = s.originalSystemId || s.id;
			if (id) sysMap.set(String(id), s);
		});

		const originId = String(filter.originSystemId);
		const distances: Record<string, number> = {};
		const predecessors: Record<string, string> = {};
		const unvisited = new Set<string>();

		sysMap.forEach((_, id) => {
			distances[id] = Infinity;
			unvisited.add(id);
		});
		distances[originId] = 0;

		while (unvisited.size > 0) {
			let u: string | null = null;
			let minDist = Infinity;
			unvisited.forEach((id) => {
				if (distances[id] < minDist) {
					minDist = distances[id];
					u = id;
				}
			});

			if (u === null || minDist === Infinity) break;
			unvisited.delete(u);

			const neighbors = adj.get(u) || [];
			neighbors.forEach((v) => {
				if (!unvisited.has(v)) return;
				const nodeU = sysMap.get(u!);
				const nodeV = sysMap.get(v);
				if (nodeU && nodeV) {
					const dx = nodeU.x - nodeV.x;
					const dy = nodeU.y - nodeV.y;
					const dz = (nodeU.z ?? 0) - (nodeV.z ?? 0);
					const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / 36;
					const alt = distances[u!] + dist;
					if (alt < distances[v]) {
						distances[v] = alt;
						predecessors[v] = u!;
					}
				}
			});
		}

		const pathEdges = new Set<string>();
		const pathSystemIds = new Set<string>();
		if (filter.destinationSystemId) {
			let curr = String(filter.destinationSystemId);
			pathSystemIds.add(curr);
			while (predecessors[curr]) {
				const pred = predecessors[curr];
				const edgeKey = [curr, pred].sort().join('-');
				pathEdges.add(edgeKey);
				pathSystemIds.add(pred);
				curr = pred;
			}
		}

		return { distances, pathEdges, pathSystemIds };
	}, [filter?.originSystemId, filter?.destinationSystemId, rawConnections, systemsPoints]);

	// Coordinates lookup map to find system ID for connections highlight
	const coordToSystemId = useMemo(() => {
		const m = new Map<string, string>();
		if (!systemsPoints) return m;
		systemsPoints.forEach((s) => {
			m.set(`${s.x.toFixed(1)},${s.y.toFixed(1)}`, s.originalSystemId || s.id);
		});
		return m;
	}, [systemsPoints]);

	// --- 1. CLUSTERING ---
	const [clusteredData, setClusteredData] = useState<any[]>([]);

	useEffect(() => {
    if (props.isInteracting) return; 

    const ships = updatedShips || [];
    let visibleShips = ships.filter((s: any) => s.visible !== false);
    if (!props.isGalaxyView && props.currentSystem?.originalSystemId) {
      visibleShips = visibleShips.filter((s: any) => {
        const sysId = s.addresssystemid || s.address_system_id || (s.plan?.segments && s.plan.segments[s.plan.segments.length - 1]?.destination_system_id);
        if (sysId !== props.currentSystem?.originalSystemId) return false;
        
        // Hide stationary/docked ships
        const isMoving = s.plan && s.plan.segments && s.plan.segments.length > 0 && (() => {
          const segments = s.plan.segments;
          const arrival = segments[segments.length - 1].arrival;
          const departure = segments[0].departure;
          const now = Date.now();
          return now >= departure && now <= arrival;
        })();
        return isMoving;
      });
    }
    
    const newClusters = clusterShipsByRadius(
      visibleShips,
      debouncedZoom,
      props.isGalaxyView,
      props.currentSystem?.originalSystemId || null,
    );

    setClusteredData(newClusters);
  }, [updatedShips, debouncedZoom, props.isGalaxyView, props.currentSystem, props.isInteracting]);

	// --- MEMOIZED FLIGHT DATA (NO ZOOM DEPENDENCY) ---
	const memoizedFlightPaths = useMemo(() => {
		const corpPlans =
			mode === "dashboard" || mode === "shipping" ? corpFlightPlans || [] : [];
		const validOwnPlans = Array.isArray(ownFlightPlans) ? ownFlightPlans : [];
		const validCorpPlans = Array.isArray(corpPlans) ? corpPlans : [];

		const allFlightPlans = [
			...validOwnPlans.map((p: any) => ({
				...p,
				color: [0, 255, 255, 200],
				isOwn: true,
			})),
			...validCorpPlans.map((p: any) => ({ ...p, isOwn: false })),
		];

		const paths: {
			path: [number, number][];
			id: string;
			shipId: string;
			color: number[];
			isOwn: boolean;
		}[] = [];

		for (let i = 0; i < allFlightPlans.length; i++) {
			const plan = allFlightPlans[i];
			const shipId = plan.shipid || plan.id;
			if (!visiblePathShipIds || !visiblePathShipIds.has(shipId)) continue;
			if (!plan || !plan.segments) continue;

			for (let j = 0; j < plan.segments.length; j++) {
				const seg = plan.segments[j];
				const start = findLocationPosition(seg.origin_system_id);
				const end = findLocationPosition(seg.destination_system_id);
				if (start && end) {
					paths.push({
						path: [start, end],
						id: `${plan.id}-${seg.segment_index ?? j}`,
						shipId: shipId,
						color: plan.color || [255, 255, 0, 150],
						isOwn: plan.isOwn,
					});
				}
			}
		}
		return paths;
	}, [
		ownFlightPlans,
		corpFlightPlans,
		visiblePathShipIds,
		findLocationPosition,
		mode,
	]);

	// --- MEMOIZED FLIGHT LAYERS (ZOOM DEPENDENT STYLE) ---
	const flightPathLayers = useMemo(() => {
		let corpWidth = 1.5,
			ownWidth = 2.5;
		const zoomBucket = Math.floor((galaxyViewState?.zoom || 1) / 2) * 2;
		if (zoomBucket < -8) {
			corpWidth = 4;
			ownWidth = 5;
		} else if (zoomBucket < -6) {
			corpWidth = 3;
			ownWidth = 4;
		} else if (zoomBucket < -4) {
			corpWidth = 2;
			ownWidth = 3;
		}

		const selectedPaths = memoizedFlightPaths.filter(
			(p) => p.shipId === selectedShipId,
		);
		const regularPaths = memoizedFlightPaths.filter(
			(p) => p.shipId !== selectedShipId,
		);

		return [
			new PathLayer({
				id: "flight-paths-standard",
				data: regularPaths,
				getPath: getPathData,
				getColor: getPathColor,
				getWidth: (d: any) => (d.isOwn ? ownWidth : corpWidth),
				widthUnits: "pixels",
				widthMinPixels: 1,
				visible: true,
				pickable: false,
				updateTriggers: { getWidth: [ownWidth, corpWidth] },
			}),
			new PathLayer({
				id: "flight-paths-selected",
				data: selectedPaths,
				getPath: getPathData,
				getColor: [255, 180, 0, 255],
				getWidth: ownWidth * 2.5,
				widthUnits: "pixels",
				widthMinPixels: 3,
				visible: true,
				pickable: false,
				parameters: { depthTest: false },
			}),
		];
	}, [memoizedFlightPaths, galaxyViewState?.zoom, selectedShipId]);

	// Map planet IDs to system IDs
	const planetToSystemMap = useMemo(() => {
		const m = new Map<string, string>();
		for (const [sysId, plist] of Object.entries(props.allPlanetsData || {})) {
			for (const p of plist) {
				if (p.planetid) m.set(p.planetid, sysId);
			}
		}
		return m;
	}, [props.allPlanetsData]);

	// Identify systems with owned sites
	const ownedSystemsData = useMemo(() => {
		if (!isGalaxyView || !productionData) return [];
		const systemIds = new Set<string>();
		for (const site of Object.values(productionData)) {
			const isMine = !site.isLeased && !site.tenant;
			if (isMine && site.planetid) {
				const sysId = planetToSystemMap.get(site.planetid);
				if (sysId) systemIds.add(sysId);
			}
		}
		return systemsPoints.filter((p) => p.originalSystemId && systemIds.has(p.originalSystemId));
	}, [productionData, planetToSystemMap, systemsPoints, isGalaxyView]);

	// --- STATIC GALAXY LAYERS ---
	const staticGalaxyLayers = useMemo(() => {
		if (!isGalaxyView) return [];
		const layers: any[] = [];

		if (systemConnections && systemConnections.length > 0) {
			const connectionData = systemConnections.map((c: any) => {
				const keyA = `${c.sourcePosition[0].toFixed(1)},${c.sourcePosition[1].toFixed(1)}`;
				const keyB = `${c.targetPosition[0].toFixed(1)},${c.targetPosition[1].toFixed(1)}`;
				const idA = coordToSystemId.get(keyA);
				const idB = coordToSystemId.get(keyB);
				const isHighlighted = idA && idB && shortestPathData.pathEdges.has([idA, idB].sort().join('-'));
				return {
					path: [c.sourcePosition, c.targetPosition],
					isHighlighted,
				};
			});

			const regularConnections = connectionData.filter((c) => !c.isHighlighted);
			const highlightedConnections = connectionData.filter((c) => c.isHighlighted);

			layers.push(
				new PathLayer({
					id: "static-connections",
					data: regularConnections,
					getPath: getPathData,
					getColor: getConnectionColor,
					getWidth: 0.8,
					widthUnits: "pixels",
					pickable: false,
				}),
			);

			if (highlightedConnections.length > 0) {
				layers.push(
					new PathLayer({
						id: "highlighted-connections",
						data: highlightedConnections,
						getPath: getPathData,
						getColor: [255, 120, 0, 255],
						getWidth: 3.5,
						widthUnits: "pixels",
						pickable: false,
						parameters: { depthTest: false },
					}),
				);
			}
		}

		if (gatewayConnections && gatewayConnections.length > 0) {
			layers.push(
				new PathLayer({
					id: "static-gateway-connections",
					data: gatewayConnections,
					getPath: getGatewayConnectionPath,
					getColor: getGatewayConnectionColor,
					getWidth: 3,
					widthUnits: "meters",
					pickable: false,
				}),
			);
		}

		// Draw semi-transparent orange radius circle around origin system
		if (filter?.originSystemId && filter.filterRadius > 0) {
			const originSys = systemsPoints.find((s) => s.originalSystemId === filter.originSystemId || s.id === filter.originSystemId);
			if (originSys) {
				layers.push(
					new ScatterplotLayer({
						id: "filter-radius-circle",
						data: [originSys],
						getPosition: (d: any) => [d.x, d.y],
						getRadius: () => filter.filterRadius * 36, // 1 parsec = 36 units - check this
						radiusUnits: "meters",
						getLineColor: [255, 120, 0, 180],
						getFillColor: [255, 120, 0, 15],
						lineWidthMinPixels: 2.0,
						stroked: true,
						filled: true,
						pickable: false,
					})
				);
			}
		}

		// Highlight matching systems on galaxy view when filters/search is active
		const isFilterActive = 
			(filter?.resources && filter.resources.size > 0) || 
			(filter?.filterRadius && filter.filterRadius > 0) ||
			(filter?.planetType && filter.planetType !== 'all') ||
			(filter?.fertileOnly) ||
			(filter?.gravity && filter.gravity !== 'all') ||
			(filter?.temperature && filter.temperature !== 'all') ||
			(filter?.pressure && filter.pressure !== 'all') ||
			(filter?.cogcEnabled);
		const hasSearch = !!searchQuery;

		if (isGalaxyView && (isFilterActive || hasSearch)) {
			const matchedSystems = systemsPoints.filter((s) => checkSystemMatch(s, filter, searchQuery, allPlanetsData, systemsPoints, shortestPathData.distances));
			if (matchedSystems.length > 0) {
				layers.push(
					new ScatterplotLayer({
						id: "systems-filtered-highlight",
						data: matchedSystems,
						getPosition: (d: any) => [d.x, d.y],
						getRadius: (d: any) => {
							const popRatio =
								maxSystemPopulation > 1
									? Math.log1p(d.population ?? 0) /
										Math.log1p(maxSystemPopulation)
									: 0;
							return 30 * (1 + popRatio * 2);
						},
						radiusUnits: "meters",
						getLineColor: [255, 120, 0, 240], // Bright orange outline
						getFillColor: [255, 120, 0, 25],   // Semi-transparent orange fill
						lineWidthMinPixels: 3.0,
						stroked: true,
						filled: true,
						pickable: false,
					})
				);
			}
		}

		if (isGalaxyView && ownedSystemsData.length > 0) {
			layers.push(
				new ScatterplotLayer({
					id: "systems-owned-sites-highlight",
					data: ownedSystemsData,
					getPosition: (d: any) => [d.x, d.y],
					getRadius: (d: any) => {
						const popRatio =
							maxSystemPopulation > 1
								? Math.log1p(d.population ?? 0) /
									Math.log1p(maxSystemPopulation)
								: 0;
						return 22 * (1 + popRatio * 2) * 0.75;
					},
					radiusUnits: "meters",
					getLineColor: [0, 229, 255, 220],
					getFillColor: [0, 229, 255, 45],
					lineWidthMinPixels: 2.5,
					stroked: true,
					filled: true,
					pickable: false,
				})
			);
		}

		if (isGalaxyView && starAtlas) {
			// Check ref error here
			layers.push(
				new IconLayer({
					id: "systems-icons",
					data: systemsPoints,
					iconAtlas: starAtlas,
					iconMapping: starMapping,
					getIcon: getSystemIcon,
					getPosition: getSystemPos,
					sizeUnits: "meters",
					sizeScale: 1,
					sizeMinPixels: 8,
					sizeMaxPixels: 225,
					pickable: true,
					getSize: (d: any) => {
						const popRatio =
							maxSystemPopulation > 1
								? Math.log1p(d.population ?? 0) /
									Math.log1p(maxSystemPopulation)
								: 0;
						return 22 * (1 + popRatio * 2);
					},
					onClick: handleSystemClick,
					onDoubleClick: handleSystemDoubleClick,
					onHover: handleSystemHover,
					getColor: (d: any) => {
						const isFilterActive = 
							(filter?.resources && filter.resources.size > 0) || 
							(filter?.filterRadius && filter.filterRadius > 0) ||
							(filter?.planetType && filter.planetType !== 'all') ||
							(filter?.fertileOnly) ||
							(filter?.gravity && filter.gravity !== 'all') ||
							(filter?.temperature && filter.temperature !== 'all') ||
							(filter?.pressure && filter.pressure !== 'all') ||
							(filter?.cogcEnabled);
						const hasSearch = !!searchQuery;
						if (!isFilterActive && !hasSearch) {
							return [255, 255, 255, 255];
						}
						const isMatch = checkSystemMatch(d, filter, searchQuery, allPlanetsData, systemsPoints, shortestPathData.distances);
						return isMatch ? [255, 120, 0, 255] : [255, 255, 255, 45];
					},
					updateTriggers: {
						getColor: [filter, searchQuery, shortestPathData],
					},
				}),
			);
		}

		if (systemsPoints && systemsPoints.length > 0) {
			const labelData = showLabels
				? [...systemsPoints].sort(
						(a: any, b: any) => (a.population || 0) - (b.population || 0),
					)
				: [];
			layers.push(
				new TextLayer({
					id: "static-system-labels",
					data: labelData,
					getPosition: getLabelPos,
					getText: getLabelText,
					getSize: 12,
					getColor: (d: any) => {
						const isFilterActive = 
							(filter?.resources && filter.resources.size > 0) || 
							(filter?.filterRadius && filter.filterRadius > 0) ||
							(filter?.planetType && filter.planetType !== 'all') ||
							(filter?.fertileOnly) ||
							(filter?.gravity && filter.gravity !== 'all') ||
							(filter?.temperature && filter.temperature !== 'all') ||
							(filter?.pressure && filter.pressure !== 'all') ||
							(filter?.cogcEnabled);
						const hasSearch = !!searchQuery;
						if (!isFilterActive && !hasSearch) {
							return [255, 255, 255, 255];
						}
						const isMatch = checkSystemMatch(d, filter, searchQuery, allPlanetsData, systemsPoints, shortestPathData.distances);
						return isMatch ? [255, 160, 0, 255] : [255, 255, 255, 45];
					},
					billboard: true,
					background: true,
					getBackgroundColor: (d: any) => {
						const isFilterActive = 
							(filter?.resources && filter.resources.size > 0) || 
							(filter?.filterRadius && filter.filterRadius > 0) ||
							(filter?.planetType && filter.planetType !== 'all') ||
							(filter?.fertileOnly) ||
							(filter?.gravity && filter.gravity !== 'all') ||
							(filter?.temperature && filter.temperature !== 'all') ||
							(filter?.pressure && filter.pressure !== 'all') ||
							(filter?.cogcEnabled);
						const hasSearch = !!searchQuery;
						if (!isFilterActive && !hasSearch) {
							return [0, 0, 0, 160];
						}
						const isMatch = checkSystemMatch(d, filter, searchQuery, allPlanetsData, systemsPoints, shortestPathData.distances);
						return isMatch ? [40, 20, 0, 180] : [0, 0, 0, 30];
					},
					backgroundPadding: [4, 2],
					getPixelOffset: [0, 22],
					sizeUnits: "pixels",
					pickable: false,
					updateTriggers: {
						data: [showLabels],
						getColor: [filter, searchQuery, shortestPathData],
						getBackgroundColor: [filter, searchQuery, shortestPathData],
					},
				}),
			);
		}
		return layers;
	}, [
		isGalaxyView,
		systemConnections,
		gatewayConnections,
		systemsPoints,
		showLabels,
		starAtlas,
		starMapping,
		maxSystemPopulation,
		handleSystemClick,
		handleSystemDoubleClick,
		handleSystemHover,
		ownedSystemsData,
		filter,
		searchQuery,
		allPlanetsData,
		shortestPathData,
		coordToSystemId,
	]);

	// --- DYNAMIC LAYERS ---
	const dynamicLayers = useMemo(() => {
		if (!starAtlas || !shipAtlas) return [];
		const dLayers: any[] = [];

		// System Mode
		if (isPlanetModeActive && planetAtlas && stationsAtlas) {
			// Calculate docked ships map
			const dockedShipsMap = new Map<string, any[]>();
			const allSystemShips = props.animatedShipData || [];
			allSystemShips.forEach((s: any) => {
				const isMoving = s.plan && s.plan.segments && s.plan.segments.length > 0 && (() => {
					const segments = s.plan.segments;
					const arrival = segments[segments.length - 1].arrival;
					const departure = segments[0].departure;
					const now = Date.now();
					return now >= departure && now <= arrival;
				})();
				if (!isMoving) {
					const locId = s.addressplanetid || s.addressstationid;
					if (locId) {
						if (!dockedShipsMap.has(locId)) dockedShipsMap.set(locId, []);
						dockedShipsMap.get(locId)!.push(s);
					}
				}
			});
			// Gateways
			const activeGateways =
				allGatewaysData[currentSystem?.originalSystemId ?? ""] || [];
			const gatewayData = activeGateways.map((g: any) => ({
				...g,
				x: (currentSystem?.x ?? 0) + (g.semimajoraxis || 1000),
				y: currentSystem?.y ?? 0,
			}));
			if (gatewayData.length) {
				dLayers.push(
					new ScatterplotLayer({
						id: "gateways-dynamic",
						data: gatewayData,
						getPosition: getGatewayPosition,
						getFillColor: getGatewayColor,
						getRadius: SYSTEM_BASE_RADIUS * 0.06 * 0.3,
						radiusUnits: "meters",
						radiusMinPixels: 8,
						pickable: true,
						onHover: handleGatewayHover,
					}),
				);
			}
			// Trails
			if (orbitTrails && orbitTrails.length > 0) {
				dLayers.push(
					new PathLayer({
						id: "orbit-trails",
						data: orbitTrails,
						getPath: getPathData,
						getColor: getPathColor,
						getWidth: 2,
						widthUnits: "pixels",
						parameters: { blend: true, depthTest: false },
					}),
				);
			}

			// Micro Asteroids
			if (props.microAsteroids && props.microAsteroids.length > 0) {
				dLayers.push(
					new ScatterplotLayer({
						id: "micro-asteroids",
						data: props.microAsteroids,
						getPosition: (d: any) => d.position,
						getRadius: (d: any) => d.size,
						radiusUnits: "pixels",
						getFillColor: (d: any) => d.color,
						pickable: false,
					})
				);
			}
			// Flight Paths
			if (flightPathLayers.length > 0) dLayers.push(...flightPathLayers);

			// Planets
			// check ref error here
			dLayers.push(
				new IconLayer<PlanetPosition>({
					id: `planets-dynamic-${currentSystem?.originalSystemId || 'none'}`,
					data: activePlanets,
					iconAtlas: planetAtlas,
					iconMapping: planetMapping,
					getIcon: getPlanetIcon,
					getPosition: getPlanetPosition,
					getSize: (d: any) => (d.scaledPlanetRadius ?? 1.0) * 2.0,
					sizeUnits: "meters",
					sizeMinPixels: 35,
					sizeMaxPixels: 400,
					pickable: true,
					onClick: handlePlanetClick,
					onHover: handleHoverTooltip,
					getColor: (d: any) => {
						const isFilterActive = 
							(filter?.resources && filter.resources.size > 0) || 
							(filter?.filterRadius && filter.filterRadius > 0) ||
							(filter?.planetType && filter.planetType !== 'all') ||
							(filter?.fertileOnly) ||
							(filter?.gravity && filter.gravity !== 'all') ||
							(filter?.temperature && filter.temperature !== 'all') ||
							(filter?.pressure && filter.pressure !== 'all') ||
							(filter?.cogcEnabled);
						const hasSearch = !!searchQuery;
						if (!isFilterActive && !hasSearch) {
							return [255, 255, 255, 255];
						}
						
						let matches = true;
						const query = searchQuery?.trim().toLowerCase() || "";
						if (query) {
							const planetName = (d.name || d.planetname || "").toLowerCase();
							matches = planetName.includes(query);
						}
						
						if (matches && filter) {
							const pop = d.planetPopulation || 0;
							matches = pop >= filter.populationRange[0] && pop <= filter.populationRange[1];
						}

						// Radius filter check
						if (matches && filter?.filterRadius && filter.filterRadius > 0 && filter.originSystemId) {
							const systemId = d.parentSystemId;
							if (systemId) {
								if (shortestPathData.distances[systemId] !== undefined) {
									matches = shortestPathData.distances[systemId] <= filter.filterRadius;
								} else {
									const originSys = systemsPoints.find((s) => s.originalSystemId === filter.originSystemId || s.id === filter.originSystemId);
									if (originSys) {
										const dx = d.x - originSys.x;
										const dy = d.y - originSys.y;
										const dist = Math.sqrt(dx * dx + dy * dy) / 3;
										matches = dist <= filter.filterRadius;
									}
								}
							}
						}

						// Planet Type filter check
						if (matches && filter?.planetType && filter.planetType !== 'all') {
							const typeStr = (d.type || '').toUpperCase();
							const isRocky = typeStr.includes('EARTH') || typeStr.includes('ROCKY');
							const isGas = typeStr.includes('GAS');
							if (filter.planetType === 'rocky' && !isRocky) matches = false;
							if (filter.planetType === 'gaseous' && !isGas) matches = false;
						}

						// Fertility filter check
						if (matches && filter?.fertileOnly) {
							if (!d.fertility || d.fertility <= 0) matches = false;
						}

						// Gravity filter check
						if (matches && filter?.gravity && filter.gravity !== 'all') {
							const grav = d.gravity || 0;
							if (filter.gravity === 'low' && grav > 1.0) matches = false;
							if (filter.gravity === 'high' && grav <= 1.0) matches = false;
						}

						// Temperature filter check
						if (matches && filter?.temperature && filter.temperature !== 'all') {
							const temp = d.temperature || 0;
							if (filter.temperature === 'low' && temp >= 273.15) matches = false;
							if (filter.temperature === 'high' && temp < 273.15) matches = false;
						}

						// Pressure filter check
						if (matches && filter?.pressure && filter.pressure !== 'all') {
							const press = d.pressure || 0;
							if (filter.pressure === 'low' && press > 1.0) matches = false;
							if (filter.pressure === 'high' && press <= 1.0) matches = false;
						}

						// COGC Program filter check
						if (matches && filter?.cogcEnabled) {
							const prog = (d.cogc || '').toUpperCase();
							const selectedProg = filter.cogcProgram.toUpperCase();
							const hasActiveProgram = prog && prog !== 'NONE';
							if (selectedProg === 'ALL') {
								if (!hasActiveProgram) matches = false;
							} else if (selectedProg === 'NONE') {
								if (hasActiveProgram) matches = false;
							} else {
								if (!prog.includes(selectedProg)) matches = false;
							}
						}

						// Resources filter check
						if (matches && filter?.resources && filter.resources.size > 0) {
							const hasMatch = d.resources?.some((r: any) => {
								const ticker = (r.material || r.name || '').toUpperCase();
								return ticker && filter.resources.has(ticker);
							});
							if (!hasMatch) matches = false;
						}
						
						return matches ? [255, 120, 0, 255] : [255, 255, 255, 45];
					},
					updateTriggers: {
						getColor: [filter, searchQuery, shortestPathData],
					},
				}),
			);

			// Central Star Corona Glow
			if (currentSystem) {
				dLayers.push(
					new ScatterplotLayer({
						id: `star-corona-${currentSystem.originalSystemId || 'none'}`,
						data: [currentSystem],
						getPosition: (d: any) => [d.x, d.y],
						getRadius: SYSTEM_BASE_RADIUS * 0.08,
						radiusUnits: "meters",
						getFillColor: [255, 190, 40, 50], // Soft golden corona glow
						pickable: false,
					})
				);
			}

			// Highlight planets with owner's sites
			const planetsWithOwnerSites = activePlanets.filter((p: any) => {
				const sites = Object.values(productionData || {}).filter((s: any) => s.planetid === p.planetid);
				return sites.some((s) => !s.isLeased && !s.tenant);
			});

			if (planetsWithOwnerSites.length > 0) {
				dLayers.push(
					new ScatterplotLayer({
						id: `planets-owned-sites-highlight-${currentSystem?.originalSystemId || 'none'}`,
						data: planetsWithOwnerSites,
						getPosition: (d: any) => [d.x, d.y],
						getRadius: (d: any) => (d.scaledPlanetRadius ?? 1.0) * 1.15,
						radiusUnits: "meters",
						radiusMinPixels: 21,
						radiusMaxPixels: 230,
						getLineColor: [0, 229, 255, 220],
						getFillColor: [0, 0, 0, 0],
						lineWidthUnits: "pixels",
						getLineWidth: 2,
						stroked: true,
						filled: false,
						pickable: false,
					})
				);
			}

			// Stations
			// check ref error here
			dLayers.push(
				new IconLayer<StationPosition>({
					id: `stations-dynamic-${currentSystem?.originalSystemId || 'none'}`,
					data: activeStations,
					iconAtlas: stationsAtlas,
					iconMapping: stationsMapping,
					getIcon: getStationIcon,
					getPosition: getStationPosition,
					getSize: 1.2,
					sizeUnits: "meters",
					sizeMinPixels: 40,
					sizeMaxPixels: 100,
					pickable: true,
					onClick: (info: any) => {
						if (info.object && props.setSelectedStation && currentSystem) {
							props.setSelectedStation(info.object);
						}
					},
					onHover: handleHoverTooltip,
				}),
			);

			// Planet & Station Labels Layer
			const labelItems: any[] = [];
			activePlanets.forEach((p: any) => {
				const docked = dockedShipsMap.get(p.planetid) || [];
				labelItems.push({
					position: [p.x, p.y],
					text: `${p.planetname || p.name || p.planetid}${docked.length > 0 ? ` 🛰️ [${docked.length}]` : ""}`,
					pixelOffset: [0, 26],
					color: [255, 255, 255, 220],
				});
			});
			activeStations.forEach((st: any) => {
				const docked = dockedShipsMap.get(st.stationid) || [];
				labelItems.push({
					position: [st.x, st.y],
					text: `${st.stationname || st.name || st.stationid}${docked.length > 0 ? ` 🛰️ [${docked.length}]` : ""}`,
					pixelOffset: [0, 26],
					color: [0, 229, 255, 220],
				});
			});

			if (labelItems.length > 0) {
				dLayers.push(
					new TextLayer({
						id: `planet-station-labels-${currentSystem?.originalSystemId || 'none'}`,
						data: labelItems,
						getPosition: (d: any) => d.position,
						getText: (d: any) => d.text,
						getPixelOffset: (d: any) => d.pixelOffset,
						getColor: (d: any) => d.color,
						getSize: 12,
						sizeUnits: "pixels",
						background: true,
						getBackgroundColor: [15, 15, 15, 180],
						billboard: true,
						pickable: false,
					})
				);
			}

			// BBox
			if (systemBoundingBox) {
				dLayers.push(
					new PolygonLayer({
						id: "system-bbox",
						data: systemBoundingBox,
						getPolygon: (d: any) => d.polygon,
						getFillColor: [0, 0, 0, 0],
						getLineColor: (d: any) => d.color,
						getLineWidth: 2,
						visible: isPlanetModeActive,
					}),
				);
			}
		} else {
			// Galaxy Mode Flight Paths
			if (flightPathLayers.length > 0) dLayers.push(...flightPathLayers);
		}

		// Ships (Clustered)
		// check ref error here
		if (clusteredData.length > 0) {
      dLayers.push(
        new IconLayer({
          id: "ships-icons",
          data: clusteredData,
          iconAtlas: shipAtlas,
          iconMapping: shipMapping,
          getIcon: getShipIconType, // Safe fallback
          getPosition: getShipPosition,
          getSize: props.isGalaxyView 
            ? (d: any) => d.isCluster ? 40 : 33
            : (d: any) => d.isCluster ? SYSTEM_BASE_RADIUS * 0.016 : SYSTEM_BASE_RADIUS * 0.01,
          getAngle: (d: any) => d.isCluster ? 0 : -(d.bearing ?? 0),
          sizeUnits: props.isGalaxyView ? "pixels" : "meters",
          sizeMinPixels: props.isGalaxyView ? 14 : 10,
          sizeMaxPixels: props.isGalaxyView ? 105 : 24,
          pickable: true,
          onClick: handleShipClick,
        })
			);
    

			if (showLabels || !isGalaxyView) {
				dLayers.push(
					new TextLayer({
						id: "ship-labels",
						data: clusteredData.filter((d: any) => !d.isCluster),
						getPosition: getShipLabelPos,
						getText: getShipLabelText,
						getPixelOffset: [0, -30],
						getColor: getShipLabelColor,
						background: true,
						getBackgroundColor: getShipLabelBg,
						getSize: 12,
						sizeUnits: "pixels",
					}),
				);
			}

			dLayers.push(
				new TextLayer({
					id: "cluster-badges",
					data: clusteredData.filter((d: any) => d.isCluster),
					getPosition: getClusterBadgePos,
					getText: getClusterBadgeText,
					getPixelOffset: [12, -12],
					getColor: getClusterBadgeColor,
					background: true,
					getBackgroundColor: getClusterBadgeBg,
					getSize: 14,
					sizeUnits: "pixels",
				}),
			);
		}

		return dLayers;
	}, [
		isGalaxyView,
		isPlanetModeActive,
		starAtlas,
		shipAtlas,
		planetAtlas,
		stationsAtlas,
		activePlanets,
		activeStations,
		clusteredData,
		orbitTrails,
		systemsPoints,
		showLabels,
		currentSystem,
		systemBoundingBox,
		flightPathLayers,
		handleGatewayHover,
		handlePlanetClick,
		handleHoverTooltip,
		handleShipClick,
		allGatewaysData,
		planetMapping,
		shipMapping,
		stationsMapping,
		props.isGalaxyView,
		productionData,
		filter,
		searchQuery,
		props.microAsteroids,
	]);

	// --- SECTOR LAYER (Keep existing) ---
	const sectorLayer = useMemo(() => {
		if (!isGalaxyView || !sectors || sectors.length === 0) return [];
		const sectorLayers: any[] = [];
		const sectorLabels = sectors.map((s) => ({
			text: s.name || s.id,
			position: s.centroid,
		}));

		sectorLayers.push(
			new PolygonLayer<Sector>({
				id: "sector-polygons",
				data: sectors,
				getPolygon: (d: Sector) => {
					const cx = d.centroid[0],
						cy = d.centroid[1];
					const gap = 0.995;
					return d.vertices.map((v: any) => [
						cx + (v[0] - cx) * gap,
						cy + (v[1] - cy) * gap,
					]);
				},
				getFillColor: (d: Sector) => safeGetColor(d.empireCode, 60),
				getLineColor: (d: Sector) => safeGetColor(d.empireCode, 180),
				getLineWidth: 2,
				stroked: true,
				pickable: false,
			}),
		);
		sectorLayers.push(
			new TextLayer({
				id: "sector-labels",
				data: sectorLabels,
				getPosition: (d: any) => d.position,
				getText: (d: any) => d.text,
				getSize: 18,
				sizeUnits: "pixels",
				getColor: [255, 255, 255, 255],
				billboard: true,
				pickable: false,
			}),
		);
		return sectorLayers;
	}, [isGalaxyView, sectors, safeGetColor]);

	

	const layers = useMemo(() => {
    if (!props.viewportInstance) return [];
    return [...sectorLayer, ...staticGalaxyLayers, ...dynamicLayers];
    
  }, [staticGalaxyLayers, sectorLayer, dynamicLayers, props.viewportInstance]);

	return {
		layers,
		updatedShips,
		activePlanets,
		activeStations,
		workerStats: workerDebugStats,
	};
};
