import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { DeckGLRef } from "@deck.gl/react";
import {
	OrthographicView,
	OrthographicViewport,
	LinearInterpolator,
} from "@deck.gl/core";
import type {
	AnimatedShipData,
	FlightSegment,
	MapPoint,
	PlanetPosition,
	ShipData,
} from "../types/maptypes";
import type { ShipmentContract } from "../../../../dashboard/shipping/types";
import type { LocationFocusTarget } from "../../../../dashboard/shipping/components/shipmentdetailwidget";
import { INITIAL_VIEW_STATE, SYSTEMS_VISIBLE_ZOOM } from "../constants/map";
import {
	controllerForPlanetMode,
	CartesianInterpolator,
} from "../utils/deckgl";
import { useGlobalData } from "../../../../context/globaldatacontext";
import { useFilter } from "../components/filter/filtercontext";
import { useMapData } from "./usemapdata";
import {
	useSystemViewSetup,
	calculateMovingPlanetPosition,
	calculateMovingStationPosition,
} from "./usesystemviewsetup";
import { useViewNavigation } from "./useviewnavigation";
import { useMapLayers, checkSystemMatch } from "./usemaplayers";
import { useShipDataProcessor } from "./useshipdataprocessor";
import { useShortestPath } from "./useshortestpath";
import { useMapSearchOptions } from "./usemapsearchoptions";
import {
	calculateShipPositionGalaxy,
	calculateShipPositionInSystem,
	getShipFlightStatus,
	cleanId,
	matchesSystem,
} from "../utils/shipposition";
import { parseFlightTimestamp } from "../utils/timestamputils";

const shallowViewEqual = (a: any, b: any) => {
	if (!a || !b) return false;
	if ((a.zoom ?? 0) !== (b.zoom ?? 0)) return false;
	const at = a.target || [0, 0];
	const bt = b.target || [0, 0];
	return at[0] === bt[0] && at[1] === bt[1];
};

interface UseBaseStarMapDataProps {
	mode: "public" | "dashboard" | "shipping";
	overrideShips?: Record<string, any>;
	focusTarget?: LocationFocusTarget | null;
	contracts?: ShipmentContract[];
}

export function useBaseStarMapData({
	mode,
	overrideShips: rawOverrideShips,
	focusTarget,
	contracts: rawContracts,
}: UseBaseStarMapDataProps) {
	const overrideShipsKey = useMemo(
		() => JSON.stringify(rawOverrideShips || {}),
		[rawOverrideShips],
	);
	const overrideShips = useMemo(() => rawOverrideShips, [overrideShipsKey]);

	const contractsKey = useMemo(
		() => JSON.stringify(rawContracts || []),
		[rawContracts],
	);
	const contracts = useMemo(() => rawContracts, [contractsKey]);
	const { filter } = useFilter();
	const [searchQuery, setSearchQuery] = useState("");
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
		setActiveFlightPlans,
		mapData,
		isMapLoading: isGlobalMapLoading,
		storageState,
		productionData,
		shipmentState,
	} = useGlobalData();

	const isLoggedIn = useMemo(() => {
		if (typeof window === "undefined") return false;
		return !!localStorage.getItem("authToken");
	}, []);

	const effectiveOwnerShips = useMemo(() => {
		if (mode === "public") {
			return [];
		}
		if (mode === "shipping") {
			if (!overrideShips || Object.keys(overrideShips).length === 0) {
				return [];
			}
			const allowedIds = new Set(Object.keys(overrideShips));
			if (isLoggedIn && ownerShips && ownerShips.length > 0) {
				const filtered = ownerShips.filter((s) =>
					allowedIds.has(s.id || (s as any).shipid),
				);
				if (filtered.length > 0) return filtered;
			}
			return Object.values(overrideShips).map((s: any) => ({
				id: s.id,
				shipid: s.id,
				name: s.name || s.registration || "Ship",
				registration: s.registration || s.name || "",
				type: s.type || "LCB",
				position: [0, 0] as [number, number],
				progress: 0,
				bearing: 0,
				visible: true,
				is_owner: true,
				is_owner_ship: true,
				isOwn: true,
				plan: s.flight || s.plan || null,
				addresssystemid: s.addresssystemid || null,
				addressplanetid: s.addressplanetid || null,
				addressstationid: s.addressstationid || null,
			}));
		}

		if (overrideShips && Object.keys(overrideShips).length > 0) {
			const allowedIds = new Set(Object.keys(overrideShips));
			if (isLoggedIn && ownerShips && ownerShips.length > 0) {
				const filtered = ownerShips.filter((s) =>
					allowedIds.has(s.id || (s as any).shipid),
				);
				if (filtered.length > 0) return filtered;
			}
			// When not logged in (public tracking) or ship not in ownerShips, synthesize from overrideShips
			return Object.values(overrideShips).map((s: any) => ({
				id: s.id,
				shipid: s.id,
				name: s.name || s.registration || "Ship",
				registration: s.registration || s.name || "",
				type: s.type || "LCB",
				position: [0, 0] as [number, number],
				progress: 0,
				bearing: 0,
				visible: true,
				is_owner: true,
				is_owner_ship: true,
				isOwn: true,
				plan: s.flight || s.plan || null,
				addresssystemid: s.addresssystemid || null,
				addressplanetid: s.addressplanetid || null,
				addressstationid: s.addressstationid || null,
			}));
		}
		if (!isLoggedIn) return [];
		return ownerShips;
	}, [isLoggedIn, ownerShips, overrideShips, mode]);

	const effectiveOtherShips = useMemo(() => {
		if (mode === "public" || mode === "shipping") {
			return [];
		}
		if (overrideShips && Object.keys(overrideShips).length > 0) {
			// All override ships are already treated as owner/tracked ships above
			return [];
		}
		if (!isLoggedIn) return [];
		return otherShips;
	}, [isLoggedIn, otherShips, overrideShips, mode]);

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
				new URL("../workers/orbitworker.ts", import.meta.url),
				{ type: "module" },
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
			try {
				if (deckRef.current?.deck) {
					deckRef.current.deck.finalize();
				}
			} catch {
				/* ignore */
			}
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

	const {
		isLoading,
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

	useEffect(() => {
		if (!centeredSystem) {
			setIsSystemPanelOpen(false);
			setSelectedPlanetId(null);
			setSelectedPlanetState(null);
			setSelectedStationId(null);
		}
	}, [centeredSystem]);

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

	const shortestPathDistances = useShortestPath({
		originSystemId: filter?.originSystemId,
		rawConnections,
		systemsPoints,
	});

	const searchOptions = useMapSearchOptions({
		systemsPoints,
		allPlanetsData,
	});

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
				transitionInterpolator: new CartesianInterpolator(),
			}));
		},
		[setCenteredSystem, setCurrentViewMode, setGalaxyViewState],
	);

	const handleExitSystemView = useCallback(() => {
		ignoreOnViewStateChangeRef.current = true;
		setCenteredSystem(null);
		setIsSystemPanelOpen(false);
		setCurrentViewMode("galaxy");
		setGalaxyViewState((v: any) => ({
			...v,
			zoom: 1.5,
			transitionDuration: 300,
			transitionInterpolator: new CartesianInterpolator(),
		}));
		setTimeout(() => {
			ignoreOnViewStateChangeRef.current = false;
		}, 350);
	}, [
		setCenteredSystem,
		setIsSystemPanelOpen,
		setCurrentViewMode,
		setGalaxyViewState,
	]);

	const handleSelectPlanet = useCallback(
		(planetId: string, sys: MapPoint) => {
			suppressSystemCenterRef.current = true;
			isTransitioningRef.current = true;
			ignoreOnViewStateChangeRef.current = true;
			setCenteredSystem(sys);
			setCurrentViewMode("system");
			setSelectedPlanetId(planetId);
			setSelectedStationId(null);
			const planets = allPlanetsData[sys.originalSystemId || sys.id] || [];
			const planet = planets.find((p) => p.planetid === planetId);
			let targetX = sys.x;
			let targetY = sys.y;
			if (planet) {
				const computed =
					typeof (planet as any).x === "number" &&
					typeof (planet as any).y === "number"
						? planet
						: calculateMovingPlanetPosition(sys, planet, Date.now());
				targetX = computed.x;
				targetY = computed.y;
			}

			setSystemViewState((prev: any) => ({
				...prev,
				target: [targetX, targetY],
				zoom: 4,
				transitionDuration: 500,
				transitionInterpolator: new CartesianInterpolator(),
			}));
			setTimeout(() => {
				ignoreOnViewStateChangeRef.current = false;
				isTransitioningRef.current = false;
			}, 550);
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
			suppressSystemCenterRef.current = true;
			isTransitioningRef.current = true;
			ignoreOnViewStateChangeRef.current = true;
			setCenteredSystem(sys);
			setCurrentViewMode("system");
			setSelectedStationId(stationId);
			setSelectedPlanetId(null);
			setSelectedPlanet(null);
			const stations = allStationsData[sys.originalSystemId || sys.id] || [];
			const station = stations.find((s) => s.stationid === stationId);
			let targetX = sys.x;
			let targetY = sys.y;
			if (station) {
				const computed =
					typeof (station as any).x === "number" &&
					typeof (station as any).y === "number"
						? station
						: calculateMovingStationPosition(sys, station, Date.now());
				targetX = computed.x;
				targetY = computed.y;
			}

			setSystemViewState((prev: any) => ({
				...prev,
				target: [targetX, targetY],
				zoom: 4,
				transitionDuration: 500,
				transitionInterpolator: new CartesianInterpolator(),
			}));
			setTimeout(() => {
				ignoreOnViewStateChangeRef.current = false;
				isTransitioningRef.current = false;
			}, 550);
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
		(station: any) => {
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
	const suppressSystemCenterRef = useRef(false);
	const pendingLocateShipIdRef = useRef<string | null>(null);
	const pendingLocateTimerRef = useRef<NodeJS.Timeout | null>(null);
	const handleShipSelectRef = useRef<
		| ((
				shipid: string,
				locate?: boolean,
				targetViewMode?: "galaxy" | "system",
		  ) => void)
		| null
	>(null);

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
		effectiveOwnerShips,
		effectiveOtherShips,
		visibleCorpGroups,
		ownShipsVisible,
		visiblePathShipIds,
	);

	const handleTogglePath = useCallback((shipId: string) => {
		setVisiblePathShipIds((prev) => {
			const next = new Set(prev);
			if (next.has(shipId)) next.delete(shipId);
			else next.add(shipId);
			return next;
		});
	}, []);

	const handleToggleAllPaths = useCallback(
		(ids: string[], visible: boolean) => {
			setVisiblePathShipIds((prev) => {
				const next = new Set(prev);
				ids.forEach((id) => {
					if (visible) next.add(id);
					else next.delete(id);
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
		if (mode === "shipping") {
			const targetIds = new Set(ownShips.map((s) => s.id));
			setVisiblePathShipIds((prev) => {
				if (
					prev.size === targetIds.size &&
					[...targetIds].every((id) => prev.has(id))
				) {
					return prev;
				}
				return targetIds;
			});
			return;
		}

		if (mode === "public") {
			setVisiblePathShipIds(new Set());
			return;
		}

		if (ownShips.length > 0) {
			const targetIds = new Set(ownShips.map((s) => s.id));
			if (!hasInitializedPaths.current) {
				setVisiblePathShipIds(targetIds);
				hasInitializedPaths.current = true;
			}
		}
	}, [ownShips, mode]);

	const effectiveSetFlightPlans =
		mode === "shipping" || mode === "public" ? () => {} : setActiveFlightPlans;

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
		isTransitioningRef,
		suppressSystemCenterRef,
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
				setIsSystemPanelOpen(true);
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
				setHoveredInfo((prev: any) => {
					const prevId = prev?.object?.originalSystemId || prev?.object?.id;
					const nextId = info.object.originalSystemId || info.object.id;
					const roundedX = Math.round(info.x);
					const roundedY = Math.round(info.y);
					if (
						prevId === nextId &&
						prev?.x === roundedX &&
						prev?.y === roundedY
					) {
						return prev;
					}
					return { object: info.object, x: roundedX, y: roundedY };
				});
				return;
			}

			const isPlanetObj = !!info.object.planetid;
			if (isPlanetObj) {
				if (t) t.style.display = "none";
				setActiveShipTooltip(null);
				setHoveredInfo((prev: any) => {
					const roundedX = Math.round(info.x);
					const roundedY = Math.round(info.y);
					if (
						prev?.object?.planetid === info.object.planetid &&
						prev?.x === roundedX &&
						prev?.y === roundedY
					) {
						return prev;
					}
					return {
						object: { ...info.object, type: "planet" },
						x: roundedX,
						y: roundedY,
					};
				});
				return;
			}

			const isStationObj = !!info.object.stationid;
			if (isStationObj) {
				if (t) t.style.display = "none";
				setActiveShipTooltip(null);
				setHoveredInfo((prev: any) => {
					const roundedX = Math.round(info.x);
					const roundedY = Math.round(info.y);
					if (
						prev?.object?.stationid === info.object.stationid &&
						prev?.x === roundedX &&
						prev?.y === roundedY
					) {
						return prev;
					}
					return {
						object: { ...info.object, type: "station" },
						x: roundedX,
						y: roundedY,
					};
				});
				return;
			}

			const isShipObj =
				info.object.ships ||
				info.object.registration ||
				info.object.shipid ||
				info.object.id;
			if (isShipObj) {
				setHoveredInfo(null);
				setActiveShipTooltip((prev: any) => {
					const prevId =
						prev?.object?.shipid ||
						prev?.object?.id ||
						prev?.object?.registration;
					const nextId =
						info.object.shipid || info.object.id || info.object.registration;
					const roundedX = Math.round(info.x);
					const roundedY = Math.round(info.y);
					if (
						prevId === nextId &&
						prev?.x === roundedX &&
						prev?.y === roundedY
					) {
						return prev;
					}
					return {
						object: info.object,
						x: roundedX,
						y: roundedY,
						isLocked: false,
					};
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
			t.style.left = `${Math.round(info.x)}px`;
			t.style.top = `${Math.round(info.y)}px`;
			t.textContent = content;
		} else {
			setHoveredInfo(null);
			setActiveShipTooltip(null);
			if (t) t.style.display = "none";
		}
	}, []);

	const justClickedShipRef = useRef(false);
	const handleDeckClick = useCallback(() => {
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
			const shipId = obj.shipid || obj.id;
			const currentShip = updatedShipsRef.current.find(
				(s) => s.id === shipId || s.shipid === shipId,
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
			const { pointInPolygon } = require("../utils/geometry");
			for (const system of systemsPoints) {
				if (!system.originalSystemId) continue;
				const point: [number, number] = [system.x, system.y];
				const found = sectors.find((sector: any) =>
					pointInPolygon(point, sector.vertices),
				);
				if (found) map.set(system.originalSystemId, found.id);
			}
		} catch {
			/* fallback */
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

	const effectiveShipmentState = useMemo(() => {
		if (mode === "public") {
			return undefined;
		}
		if (contracts) {
			return {
				contracts,
				ships: overrideShips || shipmentState?.ships || {},
			};
		}
		return shipmentState;
	}, [contracts, overrideShips, shipmentState, mode]);

	const layersOptions = useMemo(
		() => ({
			systemToSectorMap,
			visibilityVersion: 0,
			galaxyViewState,
			SYSTEMS_VISIBLE_ZOOM,
			sectors,
			empireLegend,
			viewportInstance,
			systemsPoints,
			maxSystemPopulation,
			ZOOM_SENSITIVITY: 0.03,
			MAX_ALLOWED_RADIUS: 12,
			onSystemClick: handleSystemClickWrapped,
			onSystemDoubleClick: handleSystemDoubleClick,
			isPlanetModeActive,
			isGalaxyView: currentViewMode === "galaxy",
			setTooltip: noop,
			popFilterSetting: "Off",
			systemConnections,
			gatewayConnections,
			throttleKey: 0,
			systemBoundingBox,
			orbitLines: [],
			orbitLinesStatic: [],
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
			productionData: mode === "public" ? null : productionData,
			shipmentState: effectiveShipmentState,
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
			systemConnections,
			gatewayConnections,
			systemBoundingBox,
			allPlanetsData,
			allStationsData,
			allGatewaysData,
			mode,
			centeredSystem,
			sectors,
			empireLegend,
			systemToSectorMap,
			visibleAnimatedShipData,
			effectiveFlightPlans,
			isInteracting,
			handleSystemClickWrapped,
			handleSystemDoubleClick,
			productionData,
			effectiveShipmentState,
			filter,
			searchQuery,
			rawConnections,
		],
	);

	const { layers, updatedShips, isLayersReady } = useMapLayers(layersOptions);

	const [isDeckGlRendered, setIsDeckGlRendered] = useState(false);
	const isDeckGlRenderedRef = useRef(false);
	useEffect(() => {
		isDeckGlRenderedRef.current = false;
		setIsDeckGlRendered(false);
	}, [centeredSystem?.originalSystemId, currentViewMode]);

	const handleDeckAfterRender = useCallback(() => {
		if (isLayersReady && !isDeckGlRenderedRef.current) {
			isDeckGlRenderedRef.current = true;
			setIsDeckGlRendered(true);
			console.log(
				"[StarMap Debug][useBaseStarMapData] handleDeckAfterRender called and isLayersReady=true -> setting isDeckGlRendered = true",
			);
		}
	}, [isLayersReady]);

	// Debug effect to log the exact state keeping the overlay visible
	useEffect(() => {
		const effectiveIsLayersReady = isLayersReady && isDeckGlRendered;
		const isOverlayVisible = isLoading || !effectiveIsLayersReady;
		console.log("[StarMap Debug][useBaseStarMapData] Overlay status:", {
			isOverlayVisible,
			isLoadingMapData: isLoading,
			isLayersReady,
			isDeckGlRendered,
			effectiveIsLayersReady,
			reasonsKeepingOverlayVisible: [
				isLoading && "isLoading is true (fetching/processing data)",
				!isLayersReady &&
					"isLayersReady is false (waiting for viewport, atlases, or ship updates)",
				isLayersReady &&
					!isDeckGlRendered &&
					"isDeckGlRendered is false (waiting for onAfterRender from DeckGL)",
			].filter(Boolean),
		});
	}, [isLoading, isLayersReady, isDeckGlRendered]);

	const updatedShipsRef = useRef<any[]>([]);
	useEffect(() => {
		updatedShipsRef.current = updatedShips || [];
	}, [updatedShips]);

	const handleShipSelect = useCallback(
		(shipid: string, locate = true, targetViewMode?: "galaxy" | "system") => {
			setSelectedShipId(shipid);
			setVisiblePathShipIds((prev) => {
				const next = new Set(prev);
				next.add(shipid);
				return next;
			});

			if (locate) {
				const normShipId = String(shipid).toLowerCase();
				const animatedShip = updatedShipsRef.current.find(
					(s: AnimatedShipData) =>
						String(s.id).toLowerCase() === normShipId ||
						String(s.shipid || "").toLowerCase() === normShipId,
				);
				const apiShip =
					(visibleAnimatedShipData?.find(
						(s: any) =>
							String(s?.id).toLowerCase() === normShipId ||
							String(s?.shipid || "").toLowerCase() === normShipId,
					) as unknown as ShipData) ||
					(allShips instanceof Map
						? allShips.get(shipid) ||
							allShips.get(normShipId) ||
							Array.from(allShips.values()).find(
								(s: any) =>
									String(s?.id).toLowerCase() === normShipId ||
									String(s?.shipid || "").toLowerCase() === normShipId,
							)
						: null) ||
					(overrideShips &&
						(overrideShips[shipid] ||
							Object.values(overrideShips).find(
								(s: any) =>
									String(s?.id).toLowerCase() === normShipId ||
									String(s?.shipid || "").toLowerCase() === normShipId,
							)));

				const targetShip: ShipData | null = apiShip
					? {
							...apiShip,
							...(animatedShip?.position
								? { position: animatedShip.position }
								: {}),
							...(animatedShip?.bearing !== undefined
								? { bearing: animatedShip.bearing }
								: {}),
							...(animatedShip?.progress !== undefined
								? { progress: animatedShip.progress }
								: {}),
						}
					: (animatedShip as unknown as ShipData) || null;

				const plan =
					targetShip?.plan ||
					effectiveFlightPlans?.find(
						(p: any) => p.shipid === shipid || p.id === targetShip?.flightid,
					);
				const now = Date.now();
				const flightStatus = getShipFlightStatus(targetShip, plan, now);

				const segments: FlightSegment[] = Array.isArray(plan?.segments)
					? plan.segments
					: [];
				const activeSeg = segments.find((s: FlightSegment) => {
					const dep = parseFlightTimestamp(s.departure);
					const arr = parseFlightTimestamp(s.arrival);
					return dep > 0 && arr > 0 && now >= dep && now < arr;
				});

				const firstSeg = segments[0];
				const lastSeg = segments[segments.length - 1];
				const overallStart = firstSeg
					? parseFlightTimestamp(firstSeg.departure)
					: 0;
				const overallEnd = lastSeg ? parseFlightTimestamp(lastSeg.arrival) : 0;
				const isInFlight =
					overallStart > 0 &&
					overallEnd > 0 &&
					now >= overallStart &&
					now < overallEnd;

				let isCurrentlyInJump = false;
				if (isInFlight) {
					const segToInspect =
						activeSeg ||
						segments.find(
							(s: FlightSegment) => parseFlightTimestamp(s.departure) > now,
						) ||
						firstSeg;
					if (segToInspect) {
						const segType = String(
							segToInspect.segment_type || "",
						).toUpperCase();
						const origSys = String(segToInspect.origin_system_id || "");
						const destSys = String(segToInspect.destination_system_id || "");
						const isInterSystemLeg =
							!!origSys && !!destSys && cleanId(origSys) !== cleanId(destSys);
						isCurrentlyInJump =
							segType === "JUMP" || segType === "CHARGE" || isInterSystemLeg;
					}
				}

				// "if in flight it will see if its in JUMP if yes it defaults to galaxy view as its not in any system otherwise it will be always in system"
				const positionMode: "galaxy" | "system" =
					targetViewMode ||
					(isInFlight && isCurrentlyInJump ? "galaxy" : "system");

				let resolvedShipSysId: string | null = null;
				if (positionMode === "system") {
					if (isInFlight && activeSeg) {
						resolvedShipSysId = activeSeg.origin_system_id || null;
					} else if (isInFlight) {
						const upcoming = segments.find(
							(s: FlightSegment) => parseFlightTimestamp(s.departure) > now,
						);
						resolvedShipSysId =
							upcoming?.origin_system_id || firstSeg?.origin_system_id || null;
					} else if (overallEnd > 0 && now >= overallEnd) {
						resolvedShipSysId = lastSeg?.destination_system_id || null;
					}

					if (!resolvedShipSysId) {
						resolvedShipSysId =
							flightStatus.systemId ||
							targetShip?.addresssystemid ||
							(targetShip as any)?.systemid ||
							(targetShip as any)?.system_id ||
							(targetShip as any)?.system ||
							(animatedShip as any)?.systemId ||
							(animatedShip as any)?.system ||
							null;
					}

					if (!resolvedShipSysId && targetShip) {
						const planetId =
							targetShip.addressplanetid ||
							activeSeg?.origin_location_id ||
							activeSeg?.destination_location_id;
						const stationId =
							targetShip.addressstationid ||
							activeSeg?.origin_location_id ||
							activeSeg?.destination_location_id;
						if (planetId) {
							for (const [sId, planets] of Object.entries(
								allPlanetsData || {},
							)) {
								if (
									planets?.some(
										(p: any) =>
											p.planetid === planetId ||
											p.id === planetId ||
											(p as any).planet_id === planetId,
									)
								) {
									resolvedShipSysId = sId;
									break;
								}
							}
						}
						if (!resolvedShipSysId && stationId) {
							for (const [sId, stations] of Object.entries(
								allStationsData || {},
							)) {
								if (
									stations?.some(
										(st: any) =>
											st.stationid === stationId ||
											st.id === stationId ||
											(st as any).station_id === stationId,
									)
								) {
									resolvedShipSysId = sId;
									break;
								}
							}
						}
					}

					if (!resolvedShipSysId && plan) {
						resolvedShipSysId =
							plan.destinationsystemid ||
							plan.originsystemid ||
							firstSeg?.origin_system_id ||
							lastSeg?.destination_system_id ||
							null;
					}
				}

				let targetSys: any = null;
				if (resolvedShipSysId) {
					targetSys =
						systemsPoints?.find((p: any) =>
							matchesSystem(p, resolvedShipSysId),
						) || null;
				}

				// If target is in a star system and we are NOT in that star system yet:
				if (positionMode === "system" && targetSys) {
					const curSysKey = cleanId(
						centeredSystem?.originalSystemId || centeredSystem?.id || "",
					);
					const targetSysKey = cleanId(
						targetSys.originalSystemId || targetSys.id || "",
					);
					const needsViewOrSystemChange =
						currentViewMode !== "system" ||
						!curSysKey ||
						curSysKey !== targetSysKey;

					if (needsViewOrSystemChange) {
						// 1. Enter the system the same way we enter through the map
						setCenteredSystem(targetSys);
						setCurrentViewMode("system");
						pendingLocateShipIdRef.current = shipid;

						if (pendingLocateTimerRef.current) {
							clearTimeout(pendingLocateTimerRef.current);
						}
						pendingLocateTimerRef.current = setTimeout(() => {
							pendingLocateTimerRef.current = null;
							if (pendingLocateShipIdRef.current === shipid) {
								pendingLocateShipIdRef.current = null;
								handleShipSelectRef.current?.(shipid, true);
							}
						}, 400);
						return;
					}
				} else if (positionMode === "galaxy" && currentViewMode !== "galaxy") {
					// 1. Enter galaxy view first
					ignoreOnViewStateChangeRef.current = true;
					isTransitioningRef.current = true;
					setCenteredSystem(null);
					setIsSystemPanelOpen(false);
					setCurrentViewMode("galaxy");
					pendingLocateShipIdRef.current = shipid;

					setGalaxyViewState((prev: any) => ({
						...prev,
						...(centeredSystem
							? { target: [centeredSystem.x, centeredSystem.y] }
							: {}),
						zoom: 1.5,
						transitionDuration: 300,
						transitionInterpolator: new CartesianInterpolator(),
					}));

					if (pendingLocateTimerRef.current) {
						clearTimeout(pendingLocateTimerRef.current);
					}
					pendingLocateTimerRef.current = setTimeout(() => {
						ignoreOnViewStateChangeRef.current = false;
						isTransitioningRef.current = false;
						pendingLocateTimerRef.current = null;
						if (pendingLocateShipIdRef.current === shipid) {
							pendingLocateShipIdRef.current = null;
							handleShipSelectRef.current?.(shipid, true);
						}
					}, 400);
					return;
				}

				let pos: [number, number] | null = null;
				const curSysKey = cleanId(
					centeredSystem?.originalSystemId || centeredSystem?.id || "",
				);
				const newSysKey = cleanId(
					targetSys?.originalSystemId ||
						targetSys?.id ||
						resolvedShipSysId ||
						"",
				);
				const isSameSystem =
					!!curSysKey && !!newSysKey && curSysKey === newSysKey;

				// Check if we can directly reuse live animated position
				if (
					animatedShip &&
					animatedShip.position &&
					(animatedShip.position[0] !== 0 || animatedShip.position[1] !== 0)
				) {
					const isMatchingSystem = positionMode === "system" && isSameSystem;
					const isMatchingGalaxy = positionMode === "galaxy";
					if (isMatchingSystem || isMatchingGalaxy) {
						pos = [animatedShip.position[0], animatedShip.position[1]];
					}
				}

				// Otherwise compute mathematically from plan/objects
				if (!pos && targetShip) {
					if (positionMode === "galaxy") {
						const res = calculateShipPositionGalaxy(
							targetShip,
							plan,
							now,
							systemsPoints,
						);
						if (res) pos = [res[0], res[1]];
					} else {
						const sysForCalc = targetSys || centeredSystem;
						const targetSysId =
							sysForCalc?.originalSystemId ||
							sysForCalc?.id ||
							resolvedShipSysId;
						const cleanSysKey = String(targetSysId || "")
							.toLowerCase()
							.replace(/^sys-/, "");
						let rawPlanets =
							allPlanetsData[cleanSysKey] ||
							allPlanetsData[targetSysId] ||
							allPlanetsData[String(targetSysId)] ||
							[];
						if (rawPlanets.length === 0 && cleanSysKey) {
							for (const [k, v] of Object.entries(allPlanetsData || {})) {
								if (k.toLowerCase().replace(/^sys-/, "") === cleanSysKey) {
									rawPlanets = v;
									break;
								}
							}
						}
						let rawStations =
							allStationsData[cleanSysKey] ||
							allStationsData[targetSysId] ||
							allStationsData[String(targetSysId)] ||
							[];
						if (rawStations.length === 0 && cleanSysKey) {
							for (const [k, v] of Object.entries(allStationsData || {})) {
								if (k.toLowerCase().replace(/^sys-/, "") === cleanSysKey) {
									rawStations = v;
									break;
								}
							}
						}
						const computedPlanets = rawPlanets.map((p: any) =>
							typeof p.x === "number" && typeof p.y === "number"
								? p
								: calculateMovingPlanetPosition(sysForCalc, p, now),
						);
						const computedStations = rawStations.map((s: any) =>
							typeof s.x === "number" && typeof s.y === "number"
								? s
								: calculateMovingStationPosition(sysForCalc, s, now),
						);
						const targetObjects = [...computedPlanets, ...computedStations];
						const res = calculateShipPositionInSystem(
							targetShip,
							plan,
							now,
							targetObjects,
							sysForCalc,
						);
						if (res) {
							pos = [res[0], res[1]];
						} else if (sysForCalc) {
							pos = [sysForCalc.x, sysForCalc.y];
						}
					}
				}

				if (!pos && targetSys) {
					pos = [targetSys.x, targetSys.y];
				}

				if (!pos && positionMode === "galaxy") {
					const fallbackSysId =
						plan?.originsystemid ||
						plan?.destinationsystemid ||
						targetShip?.addresssystemid ||
						(targetShip as any)?.systemid;
					if (fallbackSysId) {
						const sys = systemsPoints?.find((p: any) =>
							matchesSystem(p, fallbackSysId),
						);
						if (sys) pos = [sys.x, sys.y];
					}
				}

				if (!pos) return;

				suppressSystemCenterRef.current = true;
				isTransitioningRef.current = true;
				ignoreOnViewStateChangeRef.current = true;

				if (positionMode === "system") {
					if (targetSys) {
						setCenteredSystem(targetSys);
					}
					if (currentViewMode !== "system") {
						setCurrentViewMode("system");
					}

					setSystemViewState((prev: any) => ({
						...prev,
						target: [pos![0], pos![1]],
						zoom: 4,
						transitionDuration: 500,
						transitionInterpolator: new CartesianInterpolator(),
					}));

					setTimeout(() => {
						ignoreOnViewStateChangeRef.current = false;
						isTransitioningRef.current = false;
					}, 550);
				} else {
					// Galaxy view
					if (currentViewMode !== "galaxy") {
						setCenteredSystem(null);
						setIsSystemPanelOpen(false);
						setCurrentViewMode("galaxy");
					}

					const targetZoom = Math.max(SYSTEMS_VISIBLE_ZOOM + 1.5, 0.5);
					setGalaxyViewState((prev: any) => ({
						...prev,
						target: [pos![0], pos![1]],
						zoom: targetZoom,
						transitionDuration: 500,
						transitionInterpolator: new CartesianInterpolator(),
					}));

					setTimeout(() => {
						ignoreOnViewStateChangeRef.current = false;
						isTransitioningRef.current = false;
					}, 550);
				}
			}
		},
		[
			currentViewMode,
			overrideShips,
			allShips,
			systemsPoints,
			centeredSystem,
			allPlanetsData,
			allStationsData,
			effectiveFlightPlans,
			visibleAnimatedShipData,
			SYSTEMS_VISIBLE_ZOOM,
		],
	);

	handleShipSelectRef.current = handleShipSelect;

	useEffect(() => {
		return () => {
			if (pendingLocateTimerRef.current) {
				clearTimeout(pendingLocateTimerRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!focusTarget) return;
		try {
			if (focusTarget.type === "SYSTEM") {
				const sys = systemsPoints?.find(
					(s: any) =>
						s.originalSystemId === focusTarget.id || s.id === focusTarget.id,
				);
				if (sys && centeredSystem?.originalSystemId !== sys.originalSystemId) {
					onSystemClick(sys);
				}
			} else if (focusTarget.type === "SHIP") {
				handleShipSelect(focusTarget.id, true);
			} else if (focusTarget.type === "PLANET") {
				const sysId = focusTarget.systemId;
				const sys = sysId
					? systemsPoints?.find(
							(s: any) => s.originalSystemId === sysId || s.id === sysId,
						)
					: centeredSystem;
				if (sys) {
					handleSelectPlanet(focusTarget.id, sys);
				}
			} else if (focusTarget.type === "STATION") {
				const sysId = focusTarget.systemId;
				const sys = sysId
					? systemsPoints?.find(
							(s: any) => s.originalSystemId === sysId || s.id === sysId,
						)
					: centeredSystem;
				if (sys) {
					handleSelectStation(focusTarget.id, sys);
				}
			}
		} catch {
			/* swallow focus errors */
		}
	}, [
		focusTarget,
		systemsPoints,
		allShips,
		centeredSystem,
		onSystemClick,
		handleShipSelect,
		handleSelectPlanet,
		handleSelectStation,
	]);

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

	return {
		mapRef,
		deckRef,
		tooltipRef,
		DECK_DEVICE_PROPS,
		activeViewState,
		controller,
		layers,
		isLoading,
		isLayersReady: isLayersReady && isDeckGlRendered,
		handleDeckAfterRender,
		mapData,
		isGlobalMapLoading,
		searchOptions,
		handleSearchSelect,
		setSearchQuery,
		handleViewStateChange,
		handleDeckHover,
		handleDeckClick,
		ownShips,
		corpShipsGrouped,
		otherShipsGrouped,
		handleShipSelect,
		visibleCorpGroups,
		selectedShipId,
		handleGroupVisibilityChange,
		expandedCorpGroups,
		handleToggleCorpGroup,
		visiblePathShipIds,
		handleTogglePath,
		handleToggleAllPaths,
		handleToggleAllCorpVisibility,
		ownShipsVisible,
		handleToogleOwnShipsVisibility,
		hoveredInfo,
		effectiveOwnerShips,
		effectiveOtherShips,
		allPlanetsData,
		allStationsData,
		activeShipTooltip,
		projectedTooltipCoords,
		setActiveShipTooltip,
		currentViewMode,
		isSystemPanelOpen,
		centeredSystem,
		setIsSystemPanelOpen,
		setCenteredSystem,
		setCurrentViewMode,
		setGalaxyViewState,
		selectedPlanetId,
		setSelectedPlanetId,
		selectedStationId,
		setSelectedStationId,
		handleSelectPlanet,
		effectiveFlightPlans,
		storageState,
		productionData,
		isSearchResultsOpen,
		setIsSearchResultsOpen,
		searchQuery,
		isFilterActive,
		matchedSystems,
		handleSelectSystem,
		handleExitSystemView,
		sliderMin,
		sliderMax,
		sliderMarks,
		handleSliderChange,
		filter,
	};
}
