import "@luma.gl/webgl";
import React, {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Box, Paper, useTheme } from "@mui/material";
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
	FlightPlan,
	LocationFocusTarget,
} from "./types/maptypes";
import { INITIAL_VIEW_STATE, SYSTEMS_VISIBLE_ZOOM } from "./constants/map";
import { controllerForPlanetMode } from "./utils/deckgl";
// Custom Hooks
import { useMapData } from "./hooks/usemapdata";
import { useSystemViewSetup } from "./hooks/usesystemviewsetup";
import { useViewNavigation } from "./hooks/useviewnavigation";
import { useMapLayers } from "./hooks/usemaplayers";
import { useShipWebSocket } from "./hooks/useshipwebsocket";
// Components
import ShipListComponent from "./components/shiplistcomponent";
import SearchBar from "./components/searchbar/searchbar";
import SearchResultsPanel from "./components/searchresultspanel/searchresultspanel";
import { GlobalDataContext } from "../../../context/globaldatacontext";
import MapLoadingOverlay from "../maploadingoverlay";

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

const BaseStarMap: React.FC<BaseStarMapProps> = ({
	mode,
	overrideShips,
	focusTarget,
}) => {
	// Basic refs & theme
	const theme = useTheme();
	const mapRef = useRef<HTMLDivElement | null>(null);
	const deckRef = useRef<DeckGLRef<OrthographicView[]> | null>(null);
	const contentBounds = useRef<{
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
	} | null>(null);

	// render counter (debug)
	const renderCountRef = useRef(0);
	renderCountRef.current++;

	// interaction state
	const [isInteracting, setIsInteracting] = useState(false);
	const interactionTimeoutRef = useRef<number | null>(null);
	const tooltipRef = useRef<HTMLDivElement | null>(null);

	// Worker (guarded)
	const animationWorkerRef = useRef<Worker | null>(null);
	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			// Only create worker in browsers / allowed environments
			animationWorkerRef.current = new Worker(
				new URL("./workers/orbitworker.ts", import.meta.url),
				{
					type: "module",
				},
			);
		} catch (err) {
			// Worker creation might fail in some environments — fail gracefully.

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
				// Worker may have been terminated or not available

				console.warn("worker postMessage failed", err);
			}
		}
	}, [isInteracting]);

	// Clear performance marks periodically (optional)
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

	// Map data from GlobalDataContext
	const {
		mapData,
		isMapLoading: isGlobalMapLoading,
		mapFetchError: globalMapFetchError,
	} = React.useContext(GlobalDataContext) || {};

	// Map data hook (processes raw API response)
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
	} = useMapData(mapData);

	useEffect(() => {
		contentBounds.current = fetchedContentBounds;
	}, [fetchedContentBounds]);

	// Main UI state
	const [centeredSystem, setCenteredSystem] = useState<MapPoint | null>(null);
	const [selectedPlanet, setSelectedPlanet] = useState<PlanetPosition | null>(
		null,
	);
	const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
	const [triggeredSearchQuery, setTriggeredSearchQuery] = useState("");
	const [popFilterSetting, setPopFilterSetting] = useState("Off");
	const [visibilityVersion, setVisibilityVersion] = useState(0);
	const [orbitLinesStatic, setOrbitLinesStatic] = useState<any[]>([]);
	const [maxAllowedRadius, setMaxAllowedRadius] = useState(12);

	// List / grouping state
	const [expandedCorpGroups, setExpandedCorpGroups] = useState<
		Record<string, boolean>
	>({});
	const [visibleCorpGroups, setVisibleCorpGroups] = useState<
		Record<string, boolean>
	>({});
	const [ownShipsVisible, setOwnShipsVisible] = useState(true); // New State

	const handleToggleCorpGroup = useCallback((group: string) => {
		setExpandedCorpGroups((prev) => ({ ...prev, [group]: !prev[group] }));
	}, []);

	const handleGroupVisibilityChange = useCallback((group: string) => {
		setVisibleCorpGroups((prev) => ({
			...prev,
			[group]: prev[group] === false ? true : false,
		}));
	}, []);

	const handleToogleOwnShipsVisibility = useCallback(() => {
		setOwnShipsVisible((prev) => !prev);
	}, []);

	const handleToggleAllCorpVisibility = useCallback(
		(allGroups: string[], visible: boolean) => {
			setVisibleCorpGroups((prev) => {
				const next = { ...prev };
				allGroups.forEach((g) => {
					next[g] = visible;
				});
				return next;
			});
		},
		[],
	);

	// PATH VISIBILITY
	const [visiblePathShipIds, setVisiblePathShipIds] = useState<Set<string>>(
		new Set(),
	);
	const hasInitializedPaths = useRef(false);

	const handleTogglePath = useCallback((id: string) => {
		setVisiblePathShipIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const handleToggleAllPaths = useCallback(
		(ids: string[], visible: boolean) => {
			setVisiblePathShipIds((prev) => {
				const next = new Set(prev);
				ids.forEach((id) => (visible ? next.add(id) : next.delete(id)));
				return next;
			});
		},
		[],
	);

	// VIEW STATE
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

	const activeViewState =
		currentViewMode === "system" ? systemViewState : galaxyViewState;
	const isPlanetModeActive = currentViewMode === "system";
	const isGalaxyView = currentViewMode === "galaxy";

	// Debounced setter helper (kept but not used to violate hooks rules)
	const debouncedSetViewState = useMemo(() => {
		return (
			typeof window !== "undefined" ? (fn: any) => fn : (fn: any) => fn
		) as any;
	}, []);

	// track ref of active viewState for shallow equality comparisons
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

	// Map container size
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
			// fallback: measure once
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

	const previousGalaxyViewStateRef = useRef<any>(null);

	// View navigation hook returns handlers for clicking systems etc.
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
		maxSystemZoom: 12,
		minSystemZoom: 0,
		previousGalaxyViewStateRef,
		viewportWidth: mapSize.w,
		viewportHeight: mapSize.h,
		systemExitZoomRef,
	});

	// handleViewStateChange with shallow-equality short-circuit
	const handleViewStateChange = useCallback(
		(params: any) => {
			const { viewState, interactionState } = params;
			// don't spin if nothing changed materially
			if (shallowViewEqual(viewStateRef.current, viewState)) {
				// still update interaction state without causing loops
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

			// mark interacting
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
					cleanState.zoom = Math.min(cleanState.zoom, 1.99);
				navigationHandleViewStateChange({ viewState: cleanState });
			} else if (isTransitioningRef.current) {
				setGalaxyViewState((prev: any) => ({
					...viewState,
					zoom: Math.min(viewState.zoom, 1.99),
					transitionDuration: prev.transitionDuration,
					transitionInterpolator: prev.transitionInterpolator,
					transitionEasing: prev.transitionEasing,
				}));
			} else {
				navigationHandleViewStateChange({ viewState });
			}
		},
		[currentViewMode, navigationHandleViewStateChange, isInteracting],
	);

	// Global data context usage: safe destructure
	const context = React.useContext(GlobalDataContext);
	const {
		animatedShipData: globalShips = [],
		activeFlightPlans: globalPlans = [],
		setActiveFlightPlans: setGlobalActiveFlightPlans = () => {},
	} = mode === "public" || !context ? ({} as any) : (context as any);

	// effective ships (handles overrideShips for 'shipping' mode)
	const effectiveShips = useMemo(() => {
		if (mode === "public") return [];
		if (mode === "shipping" && overrideShips) {
			return Object.values(overrideShips).map((s: any) => ({
				id: s.id,
				name: s.name,
				registration: s.registration,
				ownerName: s.ownerName,
				ownerId: s.ownerId,
				type: s.type,
				addressplanetid: s.addressplanetid,
				addresssystemid: s.addresssystemid,
				addressstationid: s.addressstationid,
				position: [0, 0] as [number, number],
				progress: 0,
				plan: s.flight ? ({ ...s.flight, isOwn: true } as FlightPlan) : null,
				visible: true,
				is_owner_ship: true,
			}));
		}
		return globalShips || [];
	}, [mode, overrideShips, globalShips]);

	// fleet categorization
	const { ownShips, corpShipsGrouped, visibleAnimatedShipData } =
		useMemo(() => {
			const currentUserId =
				typeof window !== "undefined"
					? localStorage.getItem("currentUserId")
					: null;
			const own: AnimatedShipData[] = [];
			const allVisible: AnimatedShipData[] = [];
			const corpGroupsMap = new Map<
				string,
				{ name: string; ships: AnimatedShipData[] }
			>();

			for (const ship of effectiveShips) {
				const isMine =
					ship.is_owner_ship ||
					(currentUserId && String(ship.ownerId) === String(currentUserId));
				let shouldRender = true;
				const mapShip = { ...ship, visible: true };

				if (isMine) {
					own.push(ship);
					(mapShip as any).color = [0, 255, 127];
					if (!ownShipsVisible) shouldRender = false;
				} else {
					const ownerId = String(ship.ownerId || "unknown");
					const displayName = ship.ownerName || "Unknown Owner";
					if (!corpGroupsMap.has(ownerId)) {
						corpGroupsMap.set(ownerId, { name: displayName, ships: [] });
					}
					corpGroupsMap.get(ownerId)!.ships.push(ship);
					(mapShip as any).color = [0, 100, 255];
					if (visibleCorpGroups[displayName] !== true) {
						shouldRender = false;
					}
				}
				if (shouldRender) allVisible.push(mapShip);
			}

			const sortedOwnerIds = Array.from(corpGroupsMap.keys()).sort();
			const finalCorpGroups: Record<string, AnimatedShipData[]> = {};
			for (const uid of sortedOwnerIds) {
				const group = corpGroupsMap.get(uid)!;
				if (!finalCorpGroups[group.name]) finalCorpGroups[group.name] = [];
				finalCorpGroups[group.name].push(...group.ships);
			}

			return {
				ownShips: own,
				corpShipsGrouped: finalCorpGroups,
				visibleAnimatedShipData: allVisible,
			};
		}, [effectiveShips, visibleCorpGroups, ownShipsVisible]);

	// auto-enable paths for own ships on first data arrival
	useEffect(() => {
		if (!hasInitializedPaths.current && ownShips.length > 0) {
			setVisiblePathShipIds(new Set(ownShips.map((s) => s.id)));
			hasInitializedPaths.current = true;
		}
	}, [ownShips]);

	// effective flight plans derived from visible ships
	const effectiveFlightPlans = useMemo(() => {
		if (visiblePathShipIds.size === 0) return [];

		const extractPlans = (ships: AnimatedShipData[], isOwn: boolean) => {
			const plans: any[] = [];
			for (const ship of ships) {
				if (visiblePathShipIds.has(ship.id)) {
					const rawPlan = (ship as any).plan || (ship as any).flight;
					if (rawPlan) {
						plans.push({
							...rawPlan,
							isOwn,
							shipid: ship.id,
						});
					}
				}
			}
			return plans;
		};

		const myPlans = extractPlans(ownShips, true);
		const allCorpShips = Object.values(corpShipsGrouped).flat();
		const corporatePlans = extractPlans(allCorpShips, false);
		return [...myPlans, ...corporatePlans];
	}, [ownShips, corpShipsGrouped, visiblePathShipIds]);

	const effectiveSetFlightPlans =
		mode === "shipping" ? () => {} : setGlobalActiveFlightPlans;

	// ship websocket hookup (passes worker ref; the hook should guard usage)
	useShipWebSocket({
		mode,
		systemsPoints,
		allPlanetsData,
		allStationsData,
		animationWorker: animationWorkerRef.current,
	});

	// keep a live ref for updatedShips from layers hook
	const animatedShipDataRef = useRef(effectiveShips);
	useLayoutEffect(() => {
		animatedShipDataRef.current = effectiveShips;
	}, [effectiveShips]);

	// system view setup
	const { orbitLines, systemBoundingBox, systemStats } = useSystemViewSetup(
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
	);

	// hover tooltip for deck
	const handleDeckHover = useCallback((info: any) => {
		const t = tooltipRef.current;
		if (!t) return;
		if (info.object) {
			if (Array.isArray(info.object.ships)) {
				const shipNames = info.object.ships
					.map((s: any) => s.name || s.id)
					.join(", ");
				const content = `Cluster of Ships:\n${shipNames}\n(Total: ${info.object.ships.length})\n${info.object.position[0].toFixed(2)}, ${info.object.position[1].toFixed(2)}`;
				t.style.display = "block";
				t.style.left = `${info.x}px`;
				t.style.top = `${info.y}px`;
				t.textContent = content;
				return;
			}
			const content =
				info.object.name || info.object.id || info.object.label || "";
			t.style.display = "block";
			t.style.left = `${info.x}px`;
			t.style.top = `${info.y}px`;
			t.textContent = content;
		} else {
			t.style.display = "none";
		}
	}, []);

	// viewport instance for layers computations
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

	// system -> sector map
	const systemToSectorMap = useMemo(() => {
		const map = new Map<string, string>();
		if (!systemsPoints || !sectors) return map;
		for (const system of systemsPoints) {
			if (!system.originalSystemId) continue;
			const point: [number, number] = [system.x, system.y];
			const foundSector = sectors.find((sector) => {
				try {
					// pointInPolygon may throw if vertices invalid
					return sector && sector.vertices
						? Array.isArray(sector.vertices) &&
								sector.vertices.length > 0 &&
								(require("./utils/geometry").pointInPolygon
									? (false as any)
									: false)
						: false;
				} catch {
					return false;
				}
			});
			// The above is defensive; real pointInPolygon call is below (we assume util exists)
		}
		// run a proper pass using the imported function (not the defensive stub above)
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
			// fall back to empty mapping if utilities missing
		}
		return map;
	}, [systemsPoints, sectors]);

	// stable no-op
	const noop = useCallback(() => {}, []);

	// DECK device props (detect WebGL2 at runtime) — must be inside component (hooks rule)
	const DECK_DEVICE_PROPS = useMemo(() => {
		if (typeof window === "undefined") return undefined;
		try {
			const canvas = document.createElement("canvas");
			const hasWebGL2 = !!(canvas.getContext && canvas.getContext("webgl2"));
			if (!hasWebGL2) return undefined;
			return {
				adapters: [webgl2Adapter],
				type: "webgl2" as const,
				useDevicePixels: false,
			};
		} catch {
			return undefined;
		}
	}, []);

	// layers options — keep dependencies narrow & stable
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
			onSystemClick,
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
			animatedShipData: visibleAnimatedShipData,
			visiblePathShipIds,
			selectedShipId,
			activeFlightPlans: effectiveFlightPlans,
			ownFlightPlans: effectiveFlightPlans.filter((p) => p.isOwn),
			corpFlightPlans: effectiveFlightPlans.filter((p) => !p.isOwn),
			setActiveFlightPlans: effectiveSetFlightPlans,
			mode,
			onShipHover: noop,
			onShipClick: noop,
			currentSystemId: centeredSystem?.originalSystemId ?? null,
			currentSystem: centeredSystem || null,
			deckRef,
			animationWorker: animationWorkerRef.current,
			isInteracting,
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
		],
	);

	const { layers, updatedShips, activePlanets, workerStats } =
		useMapLayers(layersOptions);

	// live selected planet
	const liveSelectedPlanet = useMemo(() => {
		if (!selectedPlanet) return null;
		const moving = activePlanets?.find(
			(p: any) => p.planetid === selectedPlanet.planetid,
		);
		return moving || selectedPlanet;
	}, [selectedPlanet, activePlanets]);

	const memoizedPlanetInfoBox = useMemo(
		() => <div>{/* put PlanetInfoBox here if you reinstate it */}</div>,
		[liveSelectedPlanet, centeredSystem],
	);

	// updated ships ref to access latest without rerendering
	const updatedShipsRef = useRef<any[]>([]);
	useEffect(() => {
		updatedShipsRef.current = updatedShips || [];
	}, [updatedShips]);

	// Ship select handler
	const handleShipSelect = useCallback((shipid: string) => {
		const ship = updatedShipsRef.current.find((s) => s.id === shipid);
		if (!ship) return;

		setSelectedShipId(shipid);

		setVisiblePathShipIds((prev) => {
			const next = new Set(prev);
			next.add(shipid);
			return next;
		});

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
	}, []);

	// focusTarget handling (centers or selects based on type)
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
				const ship = effectiveShips.find((s) => s.id === focusTarget.id);
				if (ship) {
					if (ship.addresssystemid && !ship.plan) {
						const sys = systemsPoints?.find(
							(s: any) => s.originalSystemId === ship.addresssystemid,
						);
						if (
							sys &&
							centeredSystem?.originalSystemId !== sys.originalSystemId
						)
							onSystemClick(sys);
					} else {
						handleShipSelect(ship.id);
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
			// swallow any errors in focus logic
		}
	}, [
		focusTarget,
		systemsPoints,
		effectiveShips,
		centeredSystem,
		onSystemClick,
		handleShipSelect,
	]);

	// search handlers
	const handleSearch = useCallback(
		(query: string) => setTriggeredSearchQuery(query),
		[],
	);
	const handleCloseSearchResults = useCallback(
		() => setTriggeredSearchQuery(""),
		[],
	);
	const searchResults = useMemo(() => ({ systems: [], planets: [] }), []);

	// memoized controller (depends on view-mode)
	const controller = useMemo(
		() => controllerForPlanetMode(isPlanetModeActive),
		[isPlanetModeActive],
	);

	// Render
	return (
		<Paper sx={{ flexGrow: 1, position: "relative" }}>
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
					controller={controller as any}
					layers={layers}
					isInteracting={isInteracting}
				/>

				{/* Loading overlay with cached data indicator */}
				<MapLoadingOverlay
					isVisible={isLoading}
					isLoadingFromCache={!isLoading && !!mapData && isGlobalMapLoading}
				/>

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

				{mode !== "shipping" && (
					<>
						{mode === "dashboard" && (
							<ShipListComponent
								ownShips={ownShips}
								corpShips={corpShipsGrouped}
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
					</>
				)}
			</Box>
		</Paper>
	);
};

export default BaseStarMap;
