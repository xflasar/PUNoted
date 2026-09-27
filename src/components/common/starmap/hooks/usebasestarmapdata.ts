import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { DeckGLRef } from "@deck.gl/react";
import { OrthographicView, OrthographicViewport, LinearInterpolator } from "@deck.gl/core";
import type { MapPoint, PlanetPosition } from "../types/maptypes";
import type { LocationFocusTarget } from "../../../../dashboard/shipping/components/shipmentdetailwidget";
import { INITIAL_VIEW_STATE, SYSTEMS_VISIBLE_ZOOM } from "../constants/map";
import { controllerForPlanetMode } from "../utils/deckgl";
import { useGlobalData } from "../../../../context/globaldatacontext";
import { useFilter } from "../components/filter/filtercontext";
import { useMapData } from "./usemapdata";
import { useSystemViewSetup } from "./usesystemviewsetup";
import { useViewNavigation } from "./useviewnavigation";
import { useMapLayers, checkSystemMatch } from "./usemaplayers";
import { useShipDataProcessor } from "./useshipdataprocessor";
import { useShortestPath } from "./useshortestpath";
import { useMapSearchOptions } from "./usemapsearchoptions";

const shallowViewEqual = (a: any, b: any) => {
	if (!a || !b) return false;
	if ((a.zoom ?? 0) !== (b.zoom ?? 0)) return false;
	const at = a.target || [0, 0];
	const bt = b.target || [0, 0];
	return at[0] === bt[0] && at[1] === bt[1];
};

interface UseBaseStarMapDataProps {
	mode: "public" | "dashboard" | "shipping";
	focusTarget?: LocationFocusTarget | null;
}

export function useBaseStarMapData({ mode, focusTarget }: UseBaseStarMapDataProps) {
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
		mapData,
		isMapLoading: isGlobalMapLoading,
		storageState,
		productionData,
	} = useGlobalData();

	const isLoggedIn = useMemo(() => {
		if (typeof window === "undefined") return false;
		return !!localStorage.getItem("authToken");
	}, []);

	const effectiveOwnerShips = useMemo(() => {
		return isLoggedIn ? ownerShips : [];
	}, [isLoggedIn, ownerShips]);

	const effectiveOtherShips = useMemo(() => {
		return isLoggedIn ? otherShips : [];
	}, [isLoggedIn, otherShips]);

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
	const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

	const [selectedPlanet, setSelectedPlanetState] = useState<PlanetPosition | null>(null);
	const setSelectedPlanet = useCallback((planet: PlanetPosition | null) => {
		setSelectedPlanetState(planet);
		setSelectedPlanetId(
			planet
				? planet.planetid || (planet as any).id || (planet as any).planetId || null
				: null,
		);
	}, []);

	useEffect(() => {
		if (centeredSystem) {
			setIsSystemPanelOpen(true);
		} else {
			setIsSystemPanelOpen(false);
			setSelectedPlanetId(null);
			setSelectedPlanetState(null);
			setSelectedStationId(null);
		}
	}, [centeredSystem]);

	const [visiblePathShipIds, setVisiblePathShipIds] = useState<Set<string>>(new Set());
	const hasInitializedPaths = useRef(false);
	const [visibleCorpGroups, setVisibleCorpGroups] = useState<Record<string, boolean>>({});
	const [ownShipsVisible, setOwnShipsVisible] = useState(true);

	const [galaxyViewState, setGalaxyViewState] = useState(INITIAL_VIEW_STATE as any);
	const [systemViewState, setSystemViewState] = useState(INITIAL_VIEW_STATE as any);
	const [currentViewMode, setCurrentViewMode] = useState<"galaxy" | "system">("galaxy");
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

	const activeViewState = currentViewMode === "system" ? systemViewState : galaxyViewState;
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
	}, [systemsPoints, filter, searchQuery, allPlanetsData, shortestPathDistances]);

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
			const targetX = planet && (planet as any).x !== undefined ? (planet as any).x : sys.x;
			const targetY = planet && (planet as any).y !== undefined ? (planet as any).y : sys.y;

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
		[allPlanetsData, setCenteredSystem, setCurrentViewMode, setSelectedPlanetId, setSelectedStationId, setSystemViewState],
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
			const targetX = station && (station as any).x !== undefined ? (station as any).x : sys.x;
			const targetY = station && (station as any).y !== undefined ? (station as any).y : sys.y;

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
		[allStationsData, setCenteredSystem, setCurrentViewMode, setSelectedStationId, setSelectedPlanetId, setSelectedPlanet, setSystemViewState],
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

	const [mapSize, setMapSize] = useState<{ w: number; h: number }>({
		w: 800,
		h: 600,
	});
	useEffect(() => {
		const el = mapRef.current;
		if (!el || typeof window === "undefined") return;

		const observerAvailable = typeof (window as any).ResizeObserver !== "undefined";
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

	const [expandedCorpGroups, setExpandedCorpGroups] = useState<Record<string, boolean>>({});

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

	const handleToggleAllPaths = useCallback((ids: string[], visible: boolean) => {
		setVisiblePathShipIds((prev) => {
			const next = new Set(prev);
			ids.forEach((id) => {
				if (visible) next.add(id);
				else next.delete(id);
			});
			return next;
		});
	}, []);

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

	const handleToggleAllCorpVisibility = useCallback((groups: string[], visible: boolean) => {
		setVisibleCorpGroups((prev) => {
			const next = { ...prev };
			groups.forEach((g) => {
				next[g] = visible;
			});
			return next;
		});
	}, []);

	const handleToogleOwnShipsVisibility = useCallback(() => {
		setOwnShipsVisible((prev) => !prev);
	}, []);

	useEffect(() => {
		if (!hasInitializedPaths.current && ownShips.length > 0) {
			setVisiblePathShipIds(new Set(ownShips.map((s) => s.id)));
			hasInitializedPaths.current = true;
		}
	}, [ownShips]);

	const effectiveSetFlightPlans = mode === "shipping" ? () => {} : activeFlightPlans;

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
				setHoveredInfo((prev: any) => {
					const prevId = prev?.object?.originalSystemId || prev?.object?.id;
					const nextId = info.object.originalSystemId || info.object.id;
					const roundedX = Math.round(info.x);
					const roundedY = Math.round(info.y);
					if (prevId === nextId && prev?.x === roundedX && prev?.y === roundedY) {
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
				info.object.ships || info.object.registration || info.object.ship_id || info.object.shipid;
			if (isShipObj) {
				setHoveredInfo(null);
				setActiveShipTooltip((prev: any) => {
					const prevId = prev?.object?.ship_id || prev?.object?.shipid || prev?.object?.registration;
					const nextId = info.object.ship_id || info.object.shipid || info.object.registration;
					const roundedX = Math.round(info.x);
					const roundedY = Math.round(info.y);
					if (prevId === nextId && prev?.x === roundedX && prev?.y === roundedY) {
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
			const content = info.object.name || info.object.id || info.object.label || "";
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
			const shipId = obj.ship_id || obj.shipid || obj.id;
			const currentShip = updatedShipsRef.current.find(
				(s) => s.id === shipId || s.ship_id === shipId || s.shipid === shipId,
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
			filter,
			searchQuery,
			rawConnections,
		],
	);

	const { layers, updatedShips, isLayersReady } = useMapLayers(layersOptions);

	const [isDeckGlRendered, setIsDeckGlRendered] = useState(false);

	useEffect(() => {
		setIsDeckGlRendered(false);
	}, [centeredSystem?.originalSystemId, currentViewMode]);

	const handleDeckAfterRender = useCallback(() => {
		if (isLayersReady) {
			setIsDeckGlRendered(true);
		}
	}, [isLayersReady]);

	const updatedShipsRef = useRef<any[]>([]);
	useEffect(() => {
		updatedShipsRef.current = updatedShips || [];
	}, [updatedShips]);

	const handleShipSelect = useCallback((shipid: string, locate = true) => {
		const ship = updatedShipsRef.current.find(
			(s) => s.id === shipid || s.ship_id === shipid || s.shipid === shipid,
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
					(s: any) => s.id === focusTarget.id || s.ship_id === focusTarget.id || s.shipid === focusTarget.id,
				);
				if (ship) {
					const sysId = ship.addresssystemid || ship.address_system_id;
					if (sysId && !ship.plan) {
						const sys = systemsPoints?.find(
							(s: any) => s.originalSystemId === sysId,
						);
						if (sys && centeredSystem?.originalSystemId !== sys.originalSystemId)
							onSystemClick(sys);
					} else {
						handleShipSelect(ship.id || ship.ship_id || ship.shipid);
					}
				}
			} else if (focusTarget.type === "PLANET" || focusTarget.type === "STATION") {
				if (focusTarget.systemId) {
					const sys = systemsPoints?.find(
						(s: any) => s.originalSystemId === focusTarget.systemId,
					);
					if (sys && centeredSystem?.originalSystemId !== sys.originalSystemId)
						onSystemClick(sys);
				}
			}
		} catch {
			/* swallow focus errors */
		}
	}, [focusTarget, systemsPoints, allShips, centeredSystem, onSystemClick, handleShipSelect]);

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
		sliderMin,
		sliderMax,
		sliderMarks,
		handleSliderChange,
		filter,
	};
}
