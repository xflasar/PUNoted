import React, {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Box,
	Paper,
	useTheme,
	useMediaQuery,
	Typography,
	Slider,
} from "@mui/material";
import DeckGL, { type DeckGLRef } from "@deck.gl/react";
import {
	OrthographicView,
	OrthographicViewport,
	LinearInterpolator,
} from "@deck.gl/core";
import type {
	MapPoint,
	PlanetPosition,
	AnimatedShipData,
	LocationFocusTarget,
} from "./types/maptypes";
import { INITIAL_VIEW_STATE, SYSTEMS_VISIBLE_ZOOM } from "./constants/map";
import { controllerForPlanetMode } from "./utils/deckgl";
// Custom Hooks
import { useMapData } from "./hooks/usemapdata";
import { useSystemViewSetup } from "./hooks/usesystemviewsetup";
import { useViewNavigation } from "./hooks/useviewnavigation";
import { useMapLayers, checkSystemMatch } from "./hooks/usemaplayers";
// Components
import FilterPanel from "./components/filter/filterpanel";
import { FilterProvider, useFilter } from "./components/filter/filtercontext";
import SearchBar from "./components/searchbar/searchbar";
import SearchResultsPanel from "./components/searchresultspanel/searchresultspanel";
import ShipListComponent from "./components/shiplistcomponent";
import MapLoadingOverlay from "../maploadingoverlay";
import { useGlobalData } from "../../../context/globaldatacontext";
import { useShipDataProcessor } from "./hooks/useshipdataprocessor";
import SystemHoverTooltip from "./components/systemdetail/systemhovertooltip";
import SystemDetailPanel from "./components/systemdetail/systemdetailpanel";
import PlanetHoverTooltip from "./components/systemdetail/planethovertooltip";

function deepCompareLayers(prevLayers: any[] = [], nextLayers: any[] = []) {
	if (prevLayers.length !== nextLayers.length) return false;
	for (let i = 0; i < nextLayers.length; i++) {
		const prevLayer = prevLayers[i];
		const nextLayer = nextLayers[i];
		if (prevLayer === nextLayer) continue;
		if (!prevLayer || !nextLayer || prevLayer.id !== nextLayer.id) return false;
		const prevProps = prevLayer.props || {};
		const nextProps = nextLayer.props || {};
		const keys = Object.keys(nextProps);
		for (const key of keys) {
			if (prevProps[key] !== nextProps[key]) return false;
		}
	}
	return true;
}

/* Memoized DeckGL wrapper to avoid unnecessary re-renders */
const MemoizedDeckGL = React.memo(
	(props: any) => {
		return (
			<DeckGL
				deviceProps={props.deviceProps}
				ref={props.deckRef}
				views={props.views}
				viewState={props.viewState}
				onViewStateChange={props.onViewStateChange}
				onHover={props.onHover}
				onDoubleClick={props.onDoubleClick}
				controller={props.controller}
				layers={props.layers}
				pickingRadius={5}
				_animate={false}
			/>
		);
	},
	(prevProps, nextProps) =>
		prevProps.viewState === nextProps.viewState &&
		deepCompareLayers(prevProps.layers, nextProps.layers),
);

const DECK_VIEWS = [new OrthographicView({ id: "main-map-view" })];

const shallowViewEqual = (a: any, b: any) => {
	if (!a || !b) return false;
	if ((a.zoom ?? 0) !== (b.zoom ?? 0)) return false;
	const at = a.target || [0, 0];
	const bt = b.target || [0, 0];
	return at[0] === bt[0] && at[1] === bt[1];
};

interface BaseStarMapProps {
	mode: "public" | "dashboard" | "shipping";
	shipments?: AnimatedShipData[];
	overrideShips?: Record<string, any>;
	focusTarget?: LocationFocusTarget | null;
}

const BaseStarMapInner: React.FC<BaseStarMapProps> = ({
	mode,
	overrideShips,
	focusTarget,
}) => {
	const theme = useTheme();
	const { filter } = useFilter();
	const [searchQuery, setSearchQuery] = useState("");
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const mapRef = useRef<HTMLDivElement | null>(null);
	const deckRef = useRef<DeckGLRef<OrthographicView[]> | null>(null);
	const contentBounds = useRef<{
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
	} | null>(null);

	const {
		allShips,
		ownerShips,
		otherShips,
		activeFlightPlans,
		mapData,
		isMapLoading: isGlobalMapLoading,
		storageState,
		productionData,
	} = useGlobalData();

	const renderCountRef = useRef(0);
	renderCountRef.current++;

	const [isInteracting, setIsInteracting] = useState(false);
	const interactionTimeoutRef = useRef<number | null>(null);
	const tooltipRef = useRef<HTMLDivElement | null>(null);
	const [hoveredInfo, setHoveredInfo] = useState<{
		object: any;
		x: number;
		y: number;
	} | null>(null);
	const [isSystemPanelOpen, setIsSystemPanelOpen] = useState(false);

	const animationWorkerRef = useRef<Worker | null>(null);
	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			animationWorkerRef.current = new Worker(
				new URL("./workers/orbitworker.ts", import.meta.url),
				{
					type: "module",
				},
			);
		} catch (err) {
			console.warn("Could not create animation worker:", err);
			animationWorkerRef.current = null;
		}
		return () => {
			try {
				animationWorkerRef.current?.terminate();
			} catch {
				/* ignore */
			}
			animationWorkerRef.current = null;
		};
	}, []);

	useEffect(() => {
		if (!animationWorkerRef.current) return;
		if (!isInteracting) {
			try {
				animationWorkerRef.current.postMessage({
					type: "resume-orbit-interval",
				});
			} catch (err) {
				console.warn("worker postMessage failed", err);
			}
		}
	}, [isInteracting]);

	useEffect(() => {
		const id = window.setInterval(() => {
			try {
				performance.clearMarks();
				performance.clearMeasures();
			} catch {
				// ignore if performance API not available
			}
		}, 60_000);
		return () => clearInterval(id);
	}, []);

	const {
		isLoading,
		fetchError,
		systemsPoints,
		sectors,
		empireLegend,
		systemConnections,
		gatewayConnections,
		allPlanetsData,
		allStationsData,
		allGatewaysData,
		maxSystemPopulation,
		contentBounds: fetchedContentBounds,
		rawConnections,
	} = useMapData(mapData);

	useEffect(() => {
		contentBounds.current = fetchedContentBounds;
	}, [fetchedContentBounds]);

	const [centeredSystem, setCenteredSystem] = useState<MapPoint | null>(null);
	const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
	const [selectedStationId, setSelectedStationId] = useState<string | null>(
		null,
	);

	useEffect(() => {
		if (centeredSystem) {
			setIsSystemPanelOpen(true);
		} else {
			setIsSystemPanelOpen(false);
			setSelectedPlanetId(null);
			setSelectedPlanet(null);
			setSelectedStationId(null);
		}
	}, [centeredSystem]);

	const [selectedPlanet, setSelectedPlanetState] =
		useState<PlanetPosition | null>(null);
	const setSelectedPlanet = useCallback((planet: PlanetPosition | null) => {
		setSelectedPlanetState(planet);
		setSelectedPlanetId(
			planet
				? planet.planetid ||
						(planet as any).id ||
						(planet as any).planetId ||
						null
				: null,
		);
	}, []);

	const [triggeredSearchQuery, setTriggeredSearchQuery] = useState("");
	const [popFilterSetting, setPopFilterSetting] = useState("Off");
	const [visibilityVersion, setVisibilityVersion] = useState(0);
	const [orbitLinesStatic, setOrbitLinesStatic] = useState<any[]>([]);
	const [maxAllowedRadius, setMaxAllowedRadius] = useState(12);

	const [visiblePathShipIds, setVisiblePathShipIds] = useState<Set<string>>(
		new Set(),
	);
	const hasInitializedPaths = useRef(false);

	const [visibleCorpGroups, setVisibleCorpGroups] = useState<
		Record<string, boolean>
	>({});
	const [ownShipsVisible, setOwnShipsVisible] = useState(true);

	const [galaxyViewState, setGalaxyViewState] = useState(
		INITIAL_VIEW_STATE as any,
	);
	const [systemViewState, setSystemViewState] = useState(
		INITIAL_VIEW_STATE as any,
	);
	const [currentViewMode, setCurrentViewMode] = useState<"galaxy" | "system">(
		"galaxy",
	);
	const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
	const [activeShipTooltip, setActiveShipTooltip] = useState<{
		object: any;
		x: number;
		y: number;
		isLocked: boolean;
	} | null>(null);
	const activeShipTooltipRef = useRef<any>(null);
	useEffect(() => {
		activeShipTooltipRef.current = activeShipTooltip;
	}, [activeShipTooltip]);

	const activeViewState =
		currentViewMode === "system" ? systemViewState : galaxyViewState;
	const isPlanetModeActive = currentViewMode === "system";
	const isGalaxyView = currentViewMode === "galaxy";

	const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(true);

	const shortestPathDistances = useMemo(() => {
		if (
			!filter?.originSystemId ||
			!rawConnections ||
			rawConnections.length === 0 ||
			!systemsPoints
		) {
			return {} as Record<string, number>;
		}

		const adj = new Map<string, string[]>();
		rawConnections.forEach((conn: any) => {
			const u = String(
				conn.systemidorigin || conn.systemIdOrigin || conn.origin || "",
			);
			const v = String(
				conn.systemiddestination ||
					conn.systemIdDestination ||
					conn.destination ||
					"",
			);
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

		return distances;
	}, [filter?.originSystemId, rawConnections, systemsPoints]);

	const isFilterActive = useMemo(() => {
		if (!filter) return false;
		return (
			(filter.resources && filter.resources.size > 0) ||
			(filter.filterRadius && filter.filterRadius > 0) ||
			(filter.planetType && filter.planetType !== "all") ||
			filter.fertileOnly ||
			(filter.gravity && filter.gravity !== "all") ||
			(filter.temperature && filter.temperature !== "all") ||
			(filter.pressure && filter.pressure !== "all") ||
			filter.cogcEnabled
		);
	}, [filter]);

	const matchedSystems = useMemo(() => {
		if (!systemsPoints) return [];
		return systemsPoints.filter((s) =>
			checkSystemMatch(
				s,
				filter,
				searchQuery,
				allPlanetsData,
				systemsPoints,
				shortestPathDistances,
			),
		);
	}, [
		systemsPoints,
		filter,
		searchQuery,
		allPlanetsData,
		shortestPathDistances,
	]);

	useEffect(() => {
		if (searchQuery || isFilterActive) {
			setIsSearchResultsOpen(true);
		}
	}, [searchQuery, isFilterActive]);

	const handleSelectSystem = useCallback(
		(sys: MapPoint) => {
			setCenteredSystem(sys);
			setCurrentViewMode("galaxy");
			setGalaxyViewState((prev: any) => ({
				...prev,
				target: [sys.x, sys.y],
				zoom: 1.5,
				transitionDuration: 500,
				transitionInterpolator: new LinearInterpolator({
					transitionProps: ["target", "zoom"],
				}),
			}));
		},
		[setCenteredSystem, setCurrentViewMode, setGalaxyViewState],
	);

	const handleSelectPlanet = useCallback(
		(planetId: string, sys: MapPoint) => {
			setCenteredSystem(sys);
			setCurrentViewMode("system");
			setSelectedPlanetId(planetId);
			setSelectedStationId(null);
			const planets = allPlanetsData[sys.originalSystemId || sys.id] || [];
			const planet = planets.find((p) => p.planetid === planetId);
			const targetX =
				planet && (planet as any).x !== undefined ? (planet as any).x : sys.x;
			const targetY =
				planet && (planet as any).y !== undefined ? (planet as any).y : sys.y;

			setSystemViewState((prev: any) => ({
				...prev,
				target: [targetX, targetY],
				zoom: 4,
				transitionDuration: 500,
				transitionInterpolator: new LinearInterpolator({
					transitionProps: ["target", "zoom"],
				}),
			}));
		},
		[
			allPlanetsData,
			setCenteredSystem,
			setCurrentViewMode,
			setSelectedPlanetId,
			setSelectedStationId,
			setSystemViewState,
		],
	);

	const handleSelectStation = useCallback(
		(stationId: string, sys: MapPoint) => {
			setCenteredSystem(sys);
			setCurrentViewMode("system");
			setSelectedStationId(stationId);
			setSelectedPlanetId(null);
			setSelectedPlanet(null);
			const stations = allStationsData[sys.originalSystemId || sys.id] || [];
			const station = stations.find((s) => s.stationid === stationId);
			const targetX =
				station && (station as any).x !== undefined
					? (station as any).x
					: sys.x;
			const targetY =
				station && (station as any).y !== undefined
					? (station as any).y
					: sys.y;

			setSystemViewState((prev: any) => ({
				...prev,
				target: [targetX, targetY],
				zoom: 4,
				transitionDuration: 500,
				transitionInterpolator: new LinearInterpolator({
					transitionProps: ["target", "zoom"],
				}),
			}));
		},
		[
			allStationsData,
			setCenteredSystem,
			setCurrentViewMode,
			setSelectedStationId,
			setSelectedPlanetId,
			setSelectedPlanet,
			setSystemViewState,
		],
	);

	const handleMapStationSelect = useCallback(
		(station: StationPosition | null) => {
			if (station && centeredSystem) {
				handleSelectStation(station.stationid, centeredSystem);
			}
		},
		[centeredSystem, handleSelectStation],
	);

	const handleSliderChange = useCallback(
		(event: Event, newValue: number | number[]) => {
			const newZoom = newValue as number;
			if (currentViewMode === "system") {
				setSystemViewState((prev: any) => ({
					...prev,
					zoom: newZoom,
					transitionDuration: 100,
					transitionInterpolator: new LinearInterpolator({
						transitionProps: ["zoom"],
					}),
				}));
			} else {
				setGalaxyViewState((prev: any) => ({
					...prev,
					zoom: newZoom,
					transitionDuration: 100,
					transitionInterpolator: new LinearInterpolator({
						transitionProps: ["zoom"],
					}),
				}));
			}
		},
		[currentViewMode, setSystemViewState, setGalaxyViewState],
	);

	const viewStateRef = useRef(activeViewState);
	useEffect(() => {
		viewStateRef.current = activeViewState;
	}, [activeViewState]);

	const initialPlanetZoomRef = useRef<number | null>(null);
	const systemExitZoomRef = useRef<number | null>(null);
	const ignoreOnViewStateChangeRef = useRef(false);
	const systemBoundsRef = useRef<{
		minX: number;
		maxX: number;
		minY: number;
		maxY: number;
	} | null>(null);
	const isTransitioningRef = useRef(false);

	const [mapSize, setMapSize] = useState<{ w: number; h: number }>({
		w: 800,
		h: 600,
	});
	useEffect(() => {
		const el = mapRef.current;
		if (!el || typeof window === "undefined") return;

		const observerAvailable =
			typeof (window as any).ResizeObserver !== "undefined";
		if (!observerAvailable) {
			const rect = el.getBoundingClientRect();
			setMapSize({
				w: Math.max(1, Math.round(rect.width)),
				h: Math.max(1, Math.round(rect.height)),
			});
			return;
		}

		const obs = new (window as any).ResizeObserver((entries: any[]) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				setMapSize((prev) => {
					if (Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1)
						return prev;
					return {
						w: Math.max(1, Math.round(width)),
						h: Math.max(1, Math.round(height)),
					};
				});
			}
		});

		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	const handleSystemDoubleClick = useCallback(
		(sys: MapPoint | null) => {
			if (!sys) return;
			setCenteredSystem(sys);
			setCurrentViewMode("system");
		},
		[setCenteredSystem, setCurrentViewMode],
	);

	const previousGalaxyViewStateRef = useRef<any>(null);

	const {
		onSystemClick,
		handleViewStateChange: navigationHandleViewStateChange,
	} = useViewNavigation({
		systemsPoints,
		isGalaxyView,
		galaxyViewState,
		setGalaxyViewState,
		setSystemViewState,
		centeredSystem,
		setCenteredSystem,
		currentViewMode,
		setCurrentViewMode,
		ignoreOnViewStateChangeRef,
		systemBoundsRef,
		initialPlanetZoomRef,
		viewStateRef,
		mode,
		maxSystemZoom: 8,
		minSystemZoom: -3,
		previousGalaxyViewStateRef,
		viewportWidth: mapSize.w,
		viewportHeight: mapSize.h,
		systemExitZoomRef,
		onSystemDoubleClick: handleSystemDoubleClick,
	});

	const handleViewStateChange = useCallback(
		(params: any) => {
			const { viewState, interactionState } = params;
			if (shallowViewEqual(viewStateRef.current, viewState)) {
				const isUserInteracting =
					interactionState?.isDragging ||
					interactionState?.isZooming ||
					interactionState?.isPanning;
				if (isUserInteracting) {
					if (!isInteracting) setIsInteracting(true);
					if (interactionTimeoutRef.current)
						window.clearTimeout(interactionTimeoutRef.current);
					interactionTimeoutRef.current = window.setTimeout(
						() => setIsInteracting(false),
						200,
					);
				}
				return;
			}

			if (!isInteracting) setIsInteracting(true);
			if (interactionTimeoutRef.current)
				window.clearTimeout(interactionTimeoutRef.current);
			interactionTimeoutRef.current = window.setTimeout(
				() => setIsInteracting(false),
				200,
			);

			const isUserInteracting =
				interactionState?.isDragging ||
				interactionState?.isZooming ||
				interactionState?.isPanning;
			if (isUserInteracting) {
				isTransitioningRef.current = false;
				ignoreOnViewStateChangeRef.current = false;
				const cleanState = {
					...viewState,
					transitionDuration: 0,
					transitionInterpolator: null,
					transitionEasing: null,
				};
				if (currentViewMode === "galaxy")
					cleanState.zoom = Math.min(cleanState.zoom, 2.0);
				navigationHandleViewStateChange({
					viewState: cleanState,
					isUserInteracting: true,
				});
			} else if (isTransitioningRef.current) {
				setGalaxyViewState((prev: any) => ({
					...viewState,
					zoom: Math.min(viewState.zoom, 2.0),
					transitionDuration: prev.transitionDuration,
					transitionInterpolator: prev.transitionInterpolator,
					transitionEasing: prev.transitionEasing,
				}));
			} else {
				navigationHandleViewStateChange({
					viewState,
					isUserInteracting: false,
				});
			}
		},
		[currentViewMode, navigationHandleViewStateChange, isInteracting],
	);

	const [expandedCorpGroups, setExpandedCorpGroups] = useState<
		Record<string, boolean>
	>({});

	const {
		ownShips,
		corpShipsGrouped,
		otherShipsGrouped,
		visibleAnimatedShipData,
		effectiveFlightPlans,
	} = useShipDataProcessor(
		ownerShips,
		otherShips,
		visibleCorpGroups,
		ownShipsVisible,
		visiblePathShipIds,
	);

	const handleTogglePath = useCallback((shipId: string) => {
		setVisiblePathShipIds((prev) => {
			const next = new Set(prev);
			if (next.has(shipId)) {
				next.delete(shipId);
			} else {
				next.add(shipId);
			}
			return next;
		});
	}, []);

	const handleToggleAllPaths = useCallback(
		(ids: string[], visible: boolean) => {
			setVisiblePathShipIds((prev) => {
				const next = new Set(prev);
				ids.forEach((id) => {
					if (visible) {
						next.add(id);
					} else {
						next.delete(id);
					}
				});
				return next;
			});
		},
		[],
	);

	const handleGroupVisibilityChange = useCallback((group: string) => {
		setVisibleCorpGroups((prev) => ({
			...prev,
			[group]: !prev[group],
		}));
	}, []);

	const handleToggleCorpGroup = useCallback((group: string) => {
		setExpandedCorpGroups((prev) => ({
			...prev,
			[group]: !prev[group],
		}));
	}, []);

	const handleToggleAllCorpVisibility = useCallback(
		(groups: string[], visible: boolean) => {
			setVisibleCorpGroups((prev) => {
				const next = { ...prev };
				groups.forEach((g) => {
					next[g] = visible;
				});
				return next;
			});
		},
		[],
	);

	const handleToogleOwnShipsVisibility = useCallback(() => {
		setOwnShipsVisible((prev) => !prev);
	}, []);

	useEffect(() => {
		if (!hasInitializedPaths.current && ownShips.length > 0) {
			setVisiblePathShipIds(new Set(ownShips.map((s) => s.id)));
			hasInitializedPaths.current = true;
		}
	}, [ownShips]);

	const effectiveSetFlightPlans =
		mode === "shipping" ? () => {} : activeFlightPlans;

	const animatedShipDataRef = useRef(allShips);
	useLayoutEffect(() => {
		animatedShipDataRef.current = allShips;
	}, [allShips]);

	const { orbitLines, systemBoundingBox, microAsteroids } = useSystemViewSetup(
		centeredSystem,
		allPlanetsData,
		setSystemViewState,
		setCurrentViewMode,
		initialPlanetZoomRef,
		ignoreOnViewStateChangeRef,
		systemBoundsRef,
		mapSize.w,
		mapSize.h,
		allStationsData,
		systemExitZoomRef,
		currentViewMode,
	);

	const lastSystemClickTimeRef = useRef<number>(0);
	const lastClickedSystemIdRef = useRef<string | null>(null);
	const handleSystemClickWrapped = useCallback(
		(sys: MapPoint | null) => {
			if (!sys) return;
			const now = Date.now();
			const sysId = sys.originalSystemId || sys.id;
			const isDoubleClick =
				lastClickedSystemIdRef.current === sysId &&
				now - lastSystemClickTimeRef.current < 300;

			lastSystemClickTimeRef.current = now;
			lastClickedSystemIdRef.current = sysId;

			if (isDoubleClick) {
				handleSystemDoubleClick(sys);
			} else {
				onSystemClick(sys);
			}
		},
		[onSystemClick, handleSystemDoubleClick],
	);

	const handleDeckHover = useCallback((info: any) => {
		const t = tooltipRef.current;
		if (activeShipTooltipRef.current?.isLocked) {
			if (t) t.style.display = "none";
			return;
		}

		if (info.object) {
			const isSystemObj =
				info.object.type === "system" ||
				(!info.object.type && info.object.originalSystemId);
			if (isSystemObj) {
				if (t) t.style.display = "none";
				setActiveShipTooltip(null);
				setHoveredInfo({ object: info.object, x: info.x, y: info.y });
				return;
			}

			const isPlanetObj = !!info.object.planetid;
			if (isPlanetObj) {
				if (t) t.style.display = "none";
				setActiveShipTooltip(null);
				setHoveredInfo({
					object: { ...info.object, type: "planet" },
					x: info.x,
					y: info.y,
				});
				return;
			}

			const isStationObj = !!info.object.stationid;
			if (isStationObj) {
				if (t) t.style.display = "none";
				setActiveShipTooltip(null);
				setHoveredInfo({
					object: { ...info.object, type: "station" },
					x: info.x,
					y: info.y,
				});
				return;
			}

			const isShipObj =
				info.object.ships || info.object.registration || info.object.ship_id;
			if (isShipObj) {
				setHoveredInfo(null);
				setActiveShipTooltip({
					object: info.object,
					x: info.x,
					y: info.y,
					isLocked: false,
				});
				if (t) t.style.display = "none";
				return;
			}

			setHoveredInfo(null);
			setActiveShipTooltip(null);
			if (!t) return;
			const content =
				info.object.name || info.object.id || info.object.label || "";
			t.style.display = "block";
			t.style.left = `${info.x}px`;
			t.style.top = `${info.y}px`;
			t.textContent = content;
		} else {
			setHoveredInfo(null);
			setActiveShipTooltip(null);
			if (t) t.style.display = "none";
		}
	}, []);

	const justClickedShipRef = useRef(false);
	const handleDeckClick = useCallback((info: any) => {
		if (justClickedShipRef.current) return;
		setActiveShipTooltip(null);
	}, []);

	const handleShipClick = useCallback((info: any) => {
		if (info && info.object) {
			justClickedShipRef.current = true;
			setActiveShipTooltip({
				object: info.object,
				x: info.x,
				y: info.y,
				isLocked: true,
			});
			setTimeout(() => {
				justClickedShipRef.current = false;
			}, 100);
		}
	}, []);

	const viewportInstance = useMemo(() => {
		if (!mapRef.current) return null;
		const { w, h } = mapSize;
		return new OrthographicViewport({
			x: 0,
			y: 0,
			width: Math.max(1, w),
			height: Math.max(1, h),
			target: [
				activeViewState.target?.[0] ?? 0,
				activeViewState.target?.[1] ?? 0,
				0,
			],
			zoom: activeViewState.zoom ?? 0,
		});
	}, [mapSize, activeViewState]);

	const projectedTooltipCoords = useMemo(() => {
		if (!activeShipTooltip || !viewportInstance) return null;
		const obj = activeShipTooltip.object;
		let worldPos = obj.position;
		if (!worldPos) {
			const shipId = obj.ship_id || obj.id;
			const currentShip = updatedShipsRef.current.find(
				(s) => s.id === shipId || s.ship_id === shipId,
			);
			if (currentShip) worldPos = currentShip.position;
		}
		if (worldPos) {
			const screenPos = viewportInstance.project([worldPos[0], worldPos[1], 0]);
			return { x: screenPos[0], y: screenPos[1] };
		}
		return { x: activeShipTooltip.x, y: activeShipTooltip.y };
	}, [activeShipTooltip, viewportInstance]);

	const systemToSectorMap = useMemo(() => {
		const map = new Map<string, string>();
		if (!systemsPoints || !sectors) return map;
		try {
			const { pointInPolygon } = require("./utils/geometry");
			for (const system of systemsPoints) {
				if (!system.originalSystemId) continue;
				const point: [number, number] = [system.x, system.y];
				const found = sectors.find((sector: any) =>
					pointInPolygon(point, sector.vertices),
				);
				if (found) map.set(system.originalSystemId, found.id);
			}
		} catch {
			// fallback if geometry utilities fail
		}
		return map;
	}, [systemsPoints, sectors]);

	const noop = useCallback(() => {}, []);

	const DECK_DEVICE_PROPS = useMemo(() => {
		if (typeof window === "undefined") return undefined;
		try {
			const canvas = document.createElement("canvas");
			const hasWebGL2 = !!(canvas.getContext && canvas.getContext("webgl2"));
			if (!hasWebGL2) return undefined;
			return {
				glOptions: { webgl2: true },
				useDevicePixels: false,
			};
		} catch {
			return undefined;
		}
	}, []);

	const layersOptions = useMemo(
		() => ({
			systemToSectorMap,
			visibilityVersion,
			galaxyViewState,
			SYSTEMS_VISIBLE_ZOOM,
			sectors,
			empireLegend,
			viewportInstance,
			systemsPoints,
			maxSystemPopulation,
			ZOOM_SENSITIVITY: 0.03,
			MAX_ALLOWED_RADIUS: maxAllowedRadius,
			onSystemClick: handleSystemClickWrapped,
			onSystemDoubleClick: handleSystemDoubleClick,
			isPlanetModeActive,
			isGalaxyView: currentViewMode === "galaxy",
			setTooltip: noop,
			popFilterSetting,
			systemConnections,
			gatewayConnections,
			throttleKey: 0,
			systemBoundingBox,
			orbitLines,
			orbitLinesStatic,
			allPlanetsData,
			allStationsData,
			allGatewaysData,
			setSelectedPlanet,
			setSelectedStation: handleMapStationSelect,
			animatedShipData: visibleAnimatedShipData,
			visiblePathShipIds,
			selectedShipId,
			activeFlightPlans: effectiveFlightPlans,
			ownFlightPlans: effectiveFlightPlans.filter((p) => p.isOwn),
			corpFlightPlans: effectiveFlightPlans.filter((p) => !p.isOwn),
			setActiveFlightPlans: effectiveSetFlightPlans,
			mode,
			onShipHover: noop,
			onShipClick: handleShipClick,
			microAsteroids,
			currentSystemId: centeredSystem?.originalSystemId ?? null,
			currentSystem: centeredSystem || null,
			deckRef,
			animationWorker: animationWorkerRef.current,
			isInteracting,
			productionData,
			filter,
			searchQuery,
			rawConnections,
		}),
		[
			galaxyViewState,
			viewportInstance,
			systemsPoints,
			maxSystemPopulation,
			isPlanetModeActive,
			popFilterSetting,
			systemConnections,
			gatewayConnections,
			systemBoundingBox,
			orbitLines,
			orbitLinesStatic,
			allPlanetsData,
			allStationsData,
			allGatewaysData,
			mode,
			centeredSystem,
			sectors,
			empireLegend,
			visibilityVersion,
			systemToSectorMap,
			visibleAnimatedShipData,
			effectiveFlightPlans,
			maxAllowedRadius,
			isInteracting,
			handleSystemClickWrapped,
			handleSystemDoubleClick,
			productionData,
			filter,
			searchQuery,
			rawConnections,
		],
	);

	const { layers, updatedShips, activePlanets, workerStats } =
		useMapLayers(layersOptions);

	const updatedShipsRef = useRef<any[]>([]);
	useEffect(() => {
		updatedShipsRef.current = updatedShips || [];
	}, [updatedShips]);

	const handleShipSelect = useCallback((shipid: string, locate = true) => {
		const ship = updatedShipsRef.current.find(
			(s) => s.id === shipid || s.ship_id === shipid,
		);
		if (!ship) return;

		setSelectedShipId(shipid);
		setVisiblePathShipIds((prev) => {
			const next = new Set(prev);
			next.add(shipid);
			return next;
		});

		if (locate) {
			isTransitioningRef.current = true;
			ignoreOnViewStateChangeRef.current = true;
			setGalaxyViewState((prev: any) => ({
				...prev,
				target: [ship.position[0], ship.position[1], 0],
				zoom: Math.max(prev.zoom, SYSTEMS_VISIBLE_ZOOM + 2),
				transitionDuration: 1500,
				transitionInterpolator: new LinearInterpolator({
					transitionProps: ["target", "zoom"],
				}),
				transitionEasing: (t: number) => -1 * t * (t - 2),
			}));
			setCurrentViewMode("galaxy");
		}
	}, []);

	useEffect(() => {
		if (!focusTarget) return;
		try {
			if (focusTarget.type === "SYSTEM") {
				const sys = systemsPoints?.find(
					(s: any) => s.originalSystemId === focusTarget.id,
				);
				if (sys && centeredSystem?.originalSystemId !== sys.originalSystemId)
					onSystemClick(sys);
			} else if (focusTarget.type === "SHIP") {
				const ship: any = allShips.find(
					(s: any) => s.id === focusTarget.id || s.ship_id === focusTarget.id,
				);
				if (ship) {
					const sysId = ship.addresssystemid || ship.address_system_id;
					if (sysId && !ship.plan) {
						const sys = systemsPoints?.find(
							(s: any) => s.originalSystemId === sysId,
						);
						if (
							sys &&
							centeredSystem?.originalSystemId !== sys.originalSystemId
						)
							onSystemClick(sys);
					} else {
						handleShipSelect(ship.id || ship.ship_id);
					}
				}
			} else if (
				focusTarget.type === "PLANET" ||
				focusTarget.type === "STATION"
			) {
				if (focusTarget.systemId) {
					const sys = systemsPoints?.find(
						(s: any) => s.originalSystemId === focusTarget.systemId,
					);
					if (sys && centeredSystem?.originalSystemId !== sys.originalSystemId)
						onSystemClick(sys);
				}
			}
		} catch {
			// swallow focus errors
		}
	}, [
		focusTarget,
		systemsPoints,
		allShips,
		centeredSystem,
		onSystemClick,
		handleShipSelect,
	]);

	// Prepare options for autocomplete search
	const searchOptions = useMemo(() => {
		const options: Array<{
			label: string;
			id: string;
			type: "system" | "planet";
			systemId?: string;
			x?: number;
			y?: number;
			naturalId?: string;
		}> = [];

		if (systemsPoints) {
			systemsPoints.forEach((sys: any) => {
				const name = sys.name || sys.systemName || sys.label;
				if (name) {
					options.push({
						label: name,
						id: sys.originalSystemId || sys.id,
						type: "system",
						x: sys.x,
						y: sys.y,
						naturalId: sys.naturalid || sys.naturalId || sys.id,
					});
				}
			});
		}

		if (allPlanetsData) {
			Object.entries(allPlanetsData).forEach(([sysId, planets]) => {
				planets.forEach((p: any) => {
					const name = p.name || p.planetName;
					if (name) {
						options.push({
							label: name,
							id: p.planetid || p.id,
							type: "planet",
							systemId: sysId,
							naturalId: p.planetid || p.id,
						});
					}
				});
			});
		}

		// Deduplicate option labels
		const seen = new Set<string>();
		return options.filter((opt) => {
			const key = `${opt.type}-${opt.label}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}, [systemsPoints, allPlanetsData]);

	const handleSearchSelect = useCallback(
		(option: any) => {
			if (!option) return;
			if (option.type === "system") {
				const sys = systemsPoints?.find(
					(s: any) =>
						(s.originalSystemId && s.originalSystemId === option.id) ||
						s.id === option.id,
				);
				if (sys) {
					setCenteredSystem(sys);
					setCurrentViewMode("galaxy");
				}
			} else if (option.type === "planet") {
				const parentSysId = option.systemId;
				if (parentSysId) {
					const sys = systemsPoints?.find(
						(s: any) =>
							(s.originalSystemId && s.originalSystemId === parentSysId) ||
							s.id === parentSysId,
					);
					if (sys) {
						setCenteredSystem(sys);
						setCurrentViewMode("system");
						setSelectedPlanetId(option.id);
					}
				}
			}
		},
		[systemsPoints, setCenteredSystem, setCurrentViewMode, setSelectedPlanetId],
	);

	const isSystemMode = currentViewMode === "system";
	const sliderMin = isSystemMode ? (systemExitZoomRef.current ?? 2.0) : -3;
	const sliderMax = isSystemMode ? 8 : 2;
	const sliderMarks = isSystemMode
		? [
				{ value: systemExitZoomRef.current ?? 2.0, label: "Far (Exit)" },
				{ value: 8, label: "Close" },
			]
		: [
				{ value: -3, label: "Far" },
				{ value: 2, label: "Close (Enter)" },
			];

	const controller = useMemo(
		() => controllerForPlanetMode(isPlanetModeActive),
		[isPlanetModeActive],
	);

	return (
		<Paper
			sx={{ flexGrow: 1, position: "relative", width: "100%", height: "100%" }}
		>
			<SearchBar
				options={searchOptions}
				onSelect={handleSearchSelect}
				onSearchQueryChange={setSearchQuery}
			/>

			<Box
				ref={mapRef}
				sx={{
					display: "flex",
					position: "absolute",
					inset: 0,
					background: "#02040ae3",
					backgroundSize: "cover",
					zIndex: 1,
					width: "100%",
					height: "100%",
				}}
			>
				<MemoizedDeckGL
					deviceProps={DECK_DEVICE_PROPS}
					ref={deckRef}
					views={DECK_VIEWS}
					viewState={activeViewState}
					onViewStateChange={handleViewStateChange}
					onHover={handleDeckHover}
					onClick={handleDeckClick}
					controller={controller as any}
					layers={layers}
					pickingRadius={5}
					_animate={false}
				/>

				<MapLoadingOverlay
					isVisible={isLoading}
					isLoadingFromCache={!isLoading && !!mapData && isGlobalMapLoading}
				/>

				{mode !== "shipping" && mode === "dashboard" && (
					<ShipListComponent
						ownShips={ownShips}
						corpShips={corpShipsGrouped}
						otherShips={otherShipsGrouped}
						onSelectPosition={handleShipSelect}
						visibleCorpGroups={visibleCorpGroups}
						selectedShipId={selectedShipId}
						onGroupVisibilityChange={handleGroupVisibilityChange}
						expandedCorpGroups={expandedCorpGroups}
						onToggleCorpGroup={handleToggleCorpGroup}
						searchResultsVisible={false}
						visiblePathShipIds={visiblePathShipIds}
						onTogglePath={handleTogglePath}
						onToggleAllPaths={handleToggleAllPaths}
						onToggleAllCorpVisibility={handleToggleAllCorpVisibility}
						ownShipsVisible={ownShipsVisible}
						onToggleOwnVisibility={handleToogleOwnShipsVisibility}
					/>
				)}

				<div
					ref={tooltipRef as any}
					style={{
						position: "absolute",
						display: "none",
						pointerEvents: "none",
						zIndex: 9999,
						backgroundColor: "rgba(0,0,0,0.85)",
						color: "white",
						padding: "4px 8px",
						borderRadius: "4px",
						transform: "translate(-50%, -120%)",
						fontSize: "12px",
						whiteSpace: "pre",
						border: "1px solid rgba(255,255,255,0.2)",
					}}
				/>

				{hoveredInfo && hoveredInfo.object.type === "planet" ? (
					<PlanetHoverTooltip
						object={hoveredInfo.object}
						x={hoveredInfo.x}
						y={hoveredInfo.y}
						allPlanetsData={allPlanetsData}
						ownerShips={ownerShips}
						otherShips={otherShips}
					/>
				) : hoveredInfo ? (
					<SystemHoverTooltip
						object={hoveredInfo.object}
						x={hoveredInfo.x}
						y={hoveredInfo.y}
						allPlanetsData={allPlanetsData}
						allStationsData={allStationsData}
						ownerShips={ownerShips}
						otherShips={otherShips}
					/>
				) : null}

				{activeShipTooltip && projectedTooltipCoords && (
					<ShipTooltip
						tooltip={{
							...activeShipTooltip,
							x: projectedTooltipCoords.x,
							y: projectedTooltipCoords.y,
						}}
						onClose={() => setActiveShipTooltip(null)}
						onSelectShip={handleShipSelect}
					/>
				)}

				{/* Floating Legend */}
				<Box
					sx={{
						position: "absolute",
						bottom: currentViewMode === "system" ? 110 : 20,
						right: isSystemPanelOpen && !isMobile ? 400 : 20,
						zIndex: 1000,
						bgcolor: "rgba(10, 15, 30, 0.85)",
						backdropFilter: "blur(8px)",
						border: "1px solid rgba(255, 255, 255, 0.1)",
						borderRadius: "8px",
						p: 1.5,
						display:
							isMobile && isSystemPanelOpen && centeredSystem ? "none" : "flex",
						flexDirection: "column",
						gap: 1,
						color: "white",
						pointerEvents: "none",
						transition: "right 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
					}}
				>
					<Typography
						sx={{
							fontSize: "0.65rem",
							fontWeight: 800,
							textTransform: "uppercase",
							letterSpacing: "0.1em",
							color: "#00e5ff",
							mb: 0.5,
						}}
					>
						Map Legend ({currentViewMode === "galaxy" ? "Galaxy" : "System"})
					</Typography>
					{currentViewMode === "galaxy" ? (
						<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Box
									sx={{
										width: 8,
										height: 8,
										borderRadius: "50%",
										bgcolor: "#ffffff",
									}}
								/>
								<Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
									Star Systems (O-M Class)
								</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Box
									sx={{
										width: 12,
										height: 12,
										borderRadius: "50%",
										border: "2px solid #00e5ff",
										bgcolor: "rgba(0, 229, 255, 0.2)",
									}}
								/>
								<Typography
									variant="caption"
									sx={{ fontSize: "0.6rem", color: "#00e5ff" }}
								>
									Your Sites / Bases
								</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Box
									sx={{
										width: 14,
										height: 2,
										bgcolor: "rgba(180, 0, 255, 0.6)",
									}}
								/>
								<Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
									Jump Lanes / Gateways
								</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Box
									sx={{
										width: 14,
										height: 2,
										bgcolor: "rgba(255, 255, 255, 0.15)",
									}}
								/>
								<Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
									Sector Boundaries
								</Typography>
							</Box>
						</Box>
					) : (
						<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Box
									sx={{
										width: 10,
										height: 10,
										borderRadius: "50%",
										bgcolor: "#00e5ff",
									}}
								/>
								<Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
									Planets
								</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Box
									sx={{
										width: 14,
										height: 14,
										borderRadius: "50%",
										border: "2px solid #00e5ff",
									}}
								/>
								<Typography
									variant="caption"
									sx={{ fontSize: "0.6rem", color: "#00e5ff" }}
								>
									Planets with Your Sites
								</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Box sx={{ width: 8, height: 8, bgcolor: "#00ff00" }} />
								<Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
									Space Stations
								</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Box
									sx={{
										width: 12,
										height: 12,
										border: "2px solid rgba(255, 255, 255, 0.3)",
										borderRadius: "50%",
									}}
								/>
								<Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
									Orbits & Trails
								</Typography>
							</Box>
						</Box>
					)}
				</Box>

				{isSystemPanelOpen && centeredSystem && (
					<SystemDetailPanel
						system={centeredSystem}
						onClose={() => {
							setIsSystemPanelOpen(false);
							setCenteredSystem(null);
							setCurrentViewMode("galaxy");
							setGalaxyViewState((prev: any) => ({
								...prev,
								transitionDuration: 500,
								transitionInterpolator: new LinearInterpolator({
									transitionProps: ["target", "zoom"],
								}),
							}));
						}}
						onEnterSystemView={() => setCurrentViewMode("system")}
						isGalaxyView={currentViewMode === "galaxy"}
						selectedPlanetId={selectedPlanetId}
						onSelectPlanet={setSelectedPlanetId}
						selectedStationId={selectedStationId}
						onSelectStation={setSelectedStationId}
						onEnterPlanetView={handleSelectPlanet}
						allPlanetsData={allPlanetsData}
						allStationsData={allStationsData}
						ownerShips={ownerShips}
						otherShips={otherShips}
						activeFlightPlans={effectiveFlightPlans}
						storageState={storageState}
						productionData={productionData}
						onSelectShip={(id) => handleShipSelect(id, false)}
					/>
				)}

				{!centeredSystem &&
					isSearchResultsOpen &&
					(searchQuery || isFilterActive) && (
						<SearchResultsPanel
							systems={matchedSystems}
							allPlanetsData={allPlanetsData}
							filter={filter}
							searchQuery={searchQuery}
							onSelectSystem={handleSelectSystem}
							onSelectPlanet={handleSelectPlanet}
							onClose={() => setIsSearchResultsOpen(false)}
						/>
					)}

				<Box
					sx={{
						position: "absolute",
						bottom: 24,
						left: "50%",
						transform: "translateX(-50%)",
						width: 320,
						zIndex: 1000,
						bgcolor: "rgba(10, 15, 30, 0.85)",
						backdropFilter: "blur(8px)",
						border: "1px solid rgba(255, 255, 255, 0.1)",
						borderRadius: "8px",
						p: "10px 20px",
						display: "flex",
						flexDirection: "column",
						gap: 0.5,
						boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
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
								fontSize: "0.6rem",
								fontWeight: 700,
								color: "rgba(255,255,255,0.6)",
							}}
						>
							ZOOM LEVEL
						</Typography>
						<Typography
							variant="caption"
							sx={{ fontSize: "0.65rem", fontWeight: 800, color: "#00e5ff" }}
						>
							{currentViewMode === "galaxy" ? "GALAXY MODE" : "SYSTEM MODE"} (
							{activeViewState.zoom?.toFixed(1)})
						</Typography>
					</Box>
					<Slider
						value={activeViewState.zoom ?? -3}
						min={sliderMin}
						max={sliderMax}
						step={0.1}
						onChange={handleSliderChange as any}
						sx={{
							color: "#00e5ff",
							py: 1,
							"& .MuiSlider-thumb": {
								width: 12,
								height: 12,
								backgroundColor: "#ffffff",
								border: "2px solid #00e5ff",
								"&:hover, &.Mui-focusVisible, &.Mui-active": {
									boxShadow: "0 0 10px #00e5ff",
								},
							},
							"& .MuiSlider-rail": {
								bgcolor: "rgba(255,255,255,0.2)",
							},
							"& .MuiSlider-track": {
								bgcolor: "#00e5ff",
							},
							"& .MuiSlider-mark": {
								bgcolor: "rgba(255,255,255,0.4)",
								height: 6,
								width: 2,
							},
							"& .MuiSlider-markLabel": {
								color: "rgba(255,255,255,0.4)",
								fontSize: "0.55rem",
								fontWeight: 600,
							},
						}}
						marks={sliderMarks}
					/>
				</Box>
			</Box>
		</Paper>
	);
};

const ShipTooltip: React.FC<{
	tooltip: {
		object: any;
		x: number;
		y: number;
		isLocked: boolean;
	};
	onClose: () => void;
	onSelectShip: (shipId: string) => void;
}> = ({ tooltip, onClose, onSelectShip }) => {
	const { object, x, y, isLocked } = tooltip;
	const isCluster = Array.isArray(object.ships);

	return (
		<Box
			sx={{
				position: "absolute",
				left: x,
				top: y - 10,
				transform: "translate(-50%, -100%)",
				bgcolor: "rgba(10, 15, 30, 0.92)",
				backdropFilter: "blur(10px)",
				border: isLocked
					? "1px solid #00e5ff"
					: "1px solid rgba(255,255,255,0.15)",
				boxShadow: isLocked
					? "0 0 15px rgba(0,229,255,0.3)"
					: "0 4px 20px rgba(0,0,0,0.5)",
				borderRadius: "8px",
				p: 1.5,
				zIndex: 9999,
				pointerEvents: isLocked ? "auto" : "none",
				color: "white",
				minWidth: 260,
				maxWidth: 320,
			}}
		>
			{isLocked && (
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 1,
						borderBottom: "1px solid rgba(255,255,255,0.1)",
						pb: 0.5,
					}}
				>
					<Typography
						variant="caption"
						sx={{ color: "#00e5ff", fontWeight: 700, letterSpacing: "0.05em" }}
					>
						{isCluster ? "FLEET CLUSTER (LOCKED)" : "SHIP RADAR (LOCKED)"}
					</Typography>
					<Box
						onClick={(e) => {
							e.stopPropagation();
							onClose();
						}}
						sx={{
							cursor: "pointer",
							color: "rgba(255,255,255,0.5)",
							"&:hover": { color: "#ff1744" },
							fontSize: "0.8rem",
							fontWeight: 800,
							px: 0.5,
						}}
					>
						✕
					</Box>
				</Box>
			)}

			{isCluster ? (
				<Box>
					<Typography
						variant="subtitle2"
						sx={{ fontWeight: 800, color: "#fff" }}
					>
						Cluster of {object.ships.length} Ships
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.6)", display: "block", mb: 1 }}
					>
						Coords: {object.position[0].toFixed(1)},{" "}
						{object.position[1].toFixed(1)}
					</Typography>

					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 0.5,
							maxHeight: 180,
							overflowY: "auto",
							pr: 0.5,
						}}
					>
						{object.ships.map((s: any) => {
							const reg = s.registration || s.ship_id || s.id || "Unknown";
							const type = s.ship_type || s.type || "LCB";
							const owner = s.isOwn ? "You" : s.display_name || "Unknown";
							const status = s.plan ? "In Transit" : "Stationary";
							return (
								<Box
									key={s.id || s.ship_id}
									onClick={(e) => {
										if (isLocked) {
											e.stopPropagation();
											onSelectShip(s.id || s.ship_id);
										}
									}}
									sx={{
										p: 0.5,
										borderRadius: "4px",
										cursor: isLocked ? "pointer" : "default",
										border: "1px solid rgba(255,255,255,0.05)",
										bgcolor: "rgba(255,255,255,0.02)",
										"&:hover": isLocked
											? {
													bgcolor: "rgba(0, 229, 255, 0.1)",
													borderColor: "rgba(0, 229, 255, 0.3)",
												}
											: {},
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
												color: "#00e5ff",
												display: "block",
											}}
										>
											[{type}] {reg}
										</Typography>
										<Typography
											sx={{
												fontSize: "0.6rem",
												color: "rgba(255,255,255,0.5)",
											}}
										>
											Owner: {owner}
										</Typography>
									</Box>
									<Typography
										sx={{
											fontSize: "0.6rem",
											color: s.plan ? "#ffb300" : "#00e676",
											fontWeight: 600,
										}}
									>
										{status}
									</Typography>
								</Box>
							);
						})}
					</Box>
				</Box>
			) : (
				<Box>
					<Typography
						variant="subtitle2"
						sx={{ fontWeight: 800, color: "#fff" }}
					>
						{object.registration || "Ship"}
					</Typography>
					{object.name && (
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.7)",
								display: "block",
								mt: -0.5,
								mb: 0.5,
							}}
						>
							{object.name}
						</Typography>
					)}
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 0.25,
							fontSize: "0.7rem",
							color: "rgba(255,255,255,0.7)",
						}}
					>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<span>Type:</span>{" "}
							<strong style={{ color: "#00e5ff" }}>
								{object.ship_type || object.type || "LCB"}
							</strong>
						</Box>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<span>Owner:</span>{" "}
							<strong>
								{object.isOwn ? "You" : object.display_name || "Unknown"}
							</strong>
						</Box>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<span>Status:</span>{" "}
							<strong style={{ color: object.plan ? "#ffb300" : "#00e676" }}>
								{object.plan ? "In Transit" : "Stationary"}
							</strong>
						</Box>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<span>Coords:</span>{" "}
							<strong>
								{object.position[0].toFixed(1)}, {object.position[1].toFixed(1)}
							</strong>
						</Box>
					</Box>
					{isLocked && (
						<Box
							onClick={(e) => {
								e.stopPropagation();
								onSelectShip(object.id || object.ship_id);
							}}
							sx={{
								mt: 1,
								p: "4px 8px",
								bgcolor: "rgba(0, 229, 255, 0.2)",
								border: "1px solid rgba(0, 229, 255, 0.4)",
								borderRadius: "4px",
								cursor: "pointer",
								textAlign: "center",
								fontSize: "0.7rem",
								fontWeight: 700,
								color: "#00e5ff",
								"&:hover": {
									bgcolor: "rgba(0, 229, 255, 0.3)",
								},
							}}
						>
							SELECT IN FLEET RADAR
						</Box>
					)}
				</Box>
			)}
		</Box>
	);
};

const BaseStarMap: React.FC<BaseStarMapProps> = (props) => {
	return (
		<FilterProvider>
			<BaseStarMapInner {...props} />
		</FilterProvider>
	);
};

export default BaseStarMap;
