import { PathLayer } from "@deck.gl/layers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
	MapPoint,
	Sector,
	PlanetPosition,
	AnimatedShipData,
} from "../../types/maptypes";
import { hexToRgba } from "../../utils/colors";
import { buildStarAtlas } from "../../utils/buildstaratlas";
import { useAnimation } from "../useanimation";
import type { UseMapLayersProps } from "./types";
import {
	STAR_ICONS,
	STATION_ICONS,
	SHIP_ICONS,
	PLANET_ICONS,
	getSemimajorAxisAU,
} from "./constants";
import {
	checkSystemMatch,
	useDebouncedZoom,
	clusterShipsByRadius,
} from "./utils";
import { buildSectorLayers } from "./layers/sectorlayer";
import { buildStaticGalaxyLayers } from "./layers/staticgalaxylayers";
import { buildDynamicLayers } from "./layers/dynamiclayers";

/**
 * Custom React hook that orchestrates star atlas image textures, DeckGL layer generation,
 * ship clustering, and layer readiness flags for BaseStarMap.
 */
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
	}, [
		onShipClick,
		onShipHover,
		onSystemClick,
		onSystemDoubleClick,
		setTooltip,
		setSelectedPlanet,
	]);

	// --- STABLE HANDLERS ---
	const handleShipClick = useCallback((info: any) => {
		if (info.object) callbacksRef.current.onShipClick(info.object);
	}, []);
	const handlePlanetClick = useCallback((info: any) => {
		if (info.object) callbacksRef.current.setSelectedPlanet(info.object);
	}, []);
	const handleHoverTooltip = useCallback((info: any) => {
		if (info.object) {
			const obj = info.object;
			const name = obj.name || obj.planetname || obj.label || "Object";
			const auVal = getSemimajorAxisAU(obj.semimajoraxis);
			const auStr = auVal > 0 ? ` (${auVal.toFixed(2)} AU)` : "";
			callbacksRef.current.setTooltip({
				x: info.x,
				y: info.y,
				content: `${name}${auStr}`,
			});
		} else callbacksRef.current.setTooltip(null);
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
			if (
				mode !== "shipping" &&
				info.object &&
				callbacksRef.current.onSystemDoubleClick
			)
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
				return [55, 55, 80, alpha] as [number, number, number, number];
			try {
				return hexToRgba(empireLegend[empireCode], alpha);
			} catch {
				return [100, 100, 150, alpha] as [number, number, number, number];
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
		props.mode,
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
					try {
						(d.atlas as any)?.close?.();
					} catch {
						/* ignore */
					}
					return;
				}
				setStarAtlas(d.atlas);
				setStarMapping(d.mapping);
			})
			.catch(() => {
				/* ignore */
			});
		return () => {
			cancelled = true;
			setStarAtlas((prev) => {
				try {
					(prev as any)?.close?.();
				} catch {
					/* ignore */
				}
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
					} catch {
						/* ignore */
					}
					return;
				}
				setStationsAtlas(d.atlas);
				setStationsMapping(d.mapping);
			})
			.catch(() => {
				/* ignore */
			});
		return () => {
			cancelled = true;
			setStationsAtlas((prev) => {
				try {
					(prev as any)?.close?.();
				} catch {
					/* ignore */
				}
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
					} catch {
						/* ignore */
					}
					return;
				}
				setShipAtlas(d.atlas);
				setShipMapping(d.mapping);
			})
			.catch(() => {
				/* ignore */
			});
		return () => {
			cancelled = true;
			setShipAtlas((prev) => {
				try {
					(prev as any)?.close?.();
				} catch {
					/* ignore */
				}
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
					} catch {
						/* ignore */
					}
					return;
				}
				setPlanetAtlas(d.atlas);
				setPlanetMapping(d.mapping);
			})
			.catch(() => {
				/* ignore */
			});
		return () => {
			cancelled = true;
			setPlanetAtlas((prev) => {
				try {
					(prev as any)?.close?.();
				} catch {
					/* ignore */
				}
				return null;
			});
			setPlanetMapping(null);
		};
	}, []);

	const showLabels = galaxyViewState.zoom > (props.SYSTEMS_VISIBLE_ZOOM ?? 2);

	const shortestPathData = useMemo(() => {
		const distances: Record<string, number> = {};
		const pathEdges = new Set<string>();

		if (filter?.originSystemId && filter.filterRadius > 0 && rawConnections) {
			const adjList = new Map<string, { target: string; weight: number }[]>();
			rawConnections.forEach((conn: any) => {
				const src = conn.origin_system_id || conn.source;
				const tgt = conn.destination_system_id || conn.target;
				const weight = conn.distance_parsecs || conn.weight || 1;
				if (src && tgt) {
					if (!adjList.has(src)) adjList.set(src, []);
					if (!adjList.has(tgt)) adjList.set(tgt, []);
					adjList.get(src)!.push({ target: tgt, weight });
					adjList.get(tgt)!.push({ target: src, weight });
				}
			});

			const startId = filter.originSystemId;
			distances[startId] = 0;
			const unvisited = new Set<string>();
			adjList.forEach((_, key) => unvisited.add(key));

			while (unvisited.size > 0) {
				let current: string | null = null;
				let shortest = Infinity;
				unvisited.forEach((node) => {
					if ((distances[node] ?? Infinity) < shortest) {
						shortest = distances[node];
						current = node;
					}
				});

				if (!current || shortest > filter.filterRadius) break;
				unvisited.delete(current);

				const neighbors = adjList.get(current) || [];
				for (const edge of neighbors) {
					if (unvisited.has(edge.target)) {
						const newDist = (distances[current] ?? Infinity) + edge.weight;
						if (newDist < (distances[edge.target] ?? Infinity)) {
							distances[edge.target] = newDist;
						}
					}
				}
			}
		}

		return { distances, pathEdges };
	}, [filter?.originSystemId, filter?.filterRadius, rawConnections]);

	const coordToSystemId = useMemo(() => {
		const map = new Map<string, string>();
		if (systemsPoints) {
			systemsPoints.forEach((s) => {
				if (
					s.originalSystemId &&
					typeof s.x === "number" &&
					typeof s.y === "number"
				) {
					map.set(`${s.x.toFixed(1)},${s.y.toFixed(1)}`, s.originalSystemId);
				}
			});
		}
		return map;
	}, [systemsPoints]);

	const planetToSystemMap = useMemo(() => {
		const m = new Map<string, string>();
		if (props.allPlanetsData) {
			for (const [sysId, planets] of Object.entries(props.allPlanetsData)) {
				for (const p of planets) {
					if (p.planetid) m.set(p.planetid, sysId);
				}
			}
		}
		return m;
	}, [props.allPlanetsData]);

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
		return systemsPoints.filter(
			(p) => p.originalSystemId && systemIds.has(p.originalSystemId),
		);
	}, [productionData, planetToSystemMap, systemsPoints, isGalaxyView]);

	const debouncedZoom = useDebouncedZoom(galaxyViewState.zoom, 150);

	const visibleShipsForClustering = useMemo(() => {
		if (!isGalaxyView && props.currentSystemId) {
			return updatedShips.filter((s: any) => {
				if (s.visible === false) return false;
				const sysId =
					s.addresssystemid ||
					s.address_system_id ||
					s.currentSystemId ||
					s.system_id ||
					s.systemId;
				const origSysId =
					s.origin_system_id || s.originSystemId || s.plan?.origin_system_id;
				const destSysId =
					s.destination_system_id ||
					s.destinationSystemId ||
					s.plan?.destination_system_id;

				if (sysId && sysId === props.currentSystemId) return true;
				if (
					origSysId === props.currentSystemId ||
					destSysId === props.currentSystemId
				)
					return true;
				if (!sysId && !origSysId && !destSysId && s.visible !== false)
					return true;
				return false;
			});
		}
		return updatedShips.filter((s: any) => s.visible !== false);
	}, [updatedShips, isGalaxyView, props.currentSystemId]);

	const clusteredData = useMemo(() => {
		return clusterShipsByRadius(
			visibleShipsForClustering,
			debouncedZoom,
			isGalaxyView,
			props.currentSystemId,
		);
	}, [
		visibleShipsForClustering,
		debouncedZoom,
		isGalaxyView,
		props.currentSystemId,
	]);

	const allFlightPlans = useMemo(() => {
		return [...(ownFlightPlans || []), ...(corpFlightPlans || [])];
	}, [ownFlightPlans, corpFlightPlans]);

	const flightPathLayers = useMemo(() => {
		if (!visiblePathShipIds || visiblePathShipIds.size === 0) return [];
		const paths: any[] = [];

		for (let i = 0; i < allFlightPlans.length; i++) {
			const plan = allFlightPlans[i];
			const shipId = plan.shipid || plan.id;
			if (!visiblePathShipIds.has(shipId)) continue;
			if (!plan || !plan.segments || plan.segments.length === 0) continue;

			if (isGalaxyView || !currentSystem) {
				for (let j = 0; j < plan.segments.length; j++) {
					const seg = plan.segments[j];
					const origSysId = seg.origin_system_id || seg.origin_system;
					const destSysId = seg.destination_system_id || seg.destination_system;
					const start = findLocationPosition(origSysId);
					const end = findLocationPosition(destSysId);
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
		}

		if (paths.length === 0) return [];
		return [
			new PathLayer({
				id: "flight-paths",
				data: paths,
				getPath: (d: any) => d.path,
				getColor: (d: any) => d.color,
				getWidth: (d: any) => (d.isOwn ? 3 : 2),
				widthUnits: "pixels",
				pickable: false,
			}),
		];
	}, [
		allFlightPlans,
		visiblePathShipIds,
		isGalaxyView,
		currentSystem,
		findLocationPosition,
	]);

	const sectorLayer = useMemo(() => {
		return buildSectorLayers(isGalaxyView, sectors, safeGetColor);
	}, [isGalaxyView, sectors, safeGetColor]);

	const staticGalaxyLayers = useMemo(() => {
		return buildStaticGalaxyLayers({
			isGalaxyView,
			systemConnections,
			gatewayConnections,
			coordToSystemId,
			shortestPathData,
			filter,
			searchQuery,
			systemsPoints,
			maxSystemPopulation,
			ownedSystemsData,
			starAtlas,
			starMapping,
			handleSystemClick,
			handleSystemDoubleClick,
			handleSystemHover,
			allPlanetsData,
			showLabels,
		});
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

	const dynamicLayers = useMemo(() => {
		return buildDynamicLayers({
			starAtlas,
			starMapping,
			shipAtlas,
			planetAtlas,
			stationsAtlas,
			planetMapping,
			shipMapping,
			stationsMapping,
			isPlanetModeActive,
			isGalaxyView,
			currentSystem,
			animatedShipData: props.animatedShipData,
			allGatewaysData,
			activePlanets,
			activeStations,
			orbitTrails,
			microAsteroids: props.microAsteroids,
			flightPathLayers,
			clusteredData,
			showLabels,
			zoom: galaxyViewState.zoom,
			filter,
			searchQuery,
			shortestPathData,
			systemsPoints,
			handleGatewayHover,
			handlePlanetClick,
			handleHoverTooltip,
			handleShipClick,
		});
	}, [
		isGalaxyView,
		isPlanetModeActive,
		galaxyViewState.zoom,
		starAtlas,
		starMapping,
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
		flightPathLayers,
		handleGatewayHover,
		handlePlanetClick,
		handleHoverTooltip,
		handleShipClick,
		allGatewaysData,
		planetMapping,
		shipMapping,
		stationsMapping,
		props.animatedShipData,
		filter,
		searchQuery,
		shortestPathData,
		props.microAsteroids,
	]);

	const layers = useMemo(() => {
		if (!props.viewportInstance) return [];
		return [...sectorLayer, ...staticGalaxyLayers, ...dynamicLayers];
	}, [staticGalaxyLayers, sectorLayer, dynamicLayers, props.viewportInstance]);

	const isShipLayerReady = useMemo(() => {
		if (!shipAtlas || !starAtlas) return false;
		if (updatedShips.length === 0) return false;
		return true;
	}, [shipAtlas, starAtlas, updatedShips.length]);

	const isLayersReady = useMemo(() => {
		if (!props.viewportInstance) return false;
		if (!layers || layers.length === 0) return false;
		if (!starAtlas) return false;
		if (!shipAtlas) return false;
		const hasShipsToRender =
			Array.isArray(props.animatedShipData) &&
			props.animatedShipData.length > 0;
		if (hasShipsToRender) {
			if (updatedShips.length === 0) return false;
		}
		return true;
	}, [
		props.viewportInstance,
		layers,
		starAtlas,
		shipAtlas,
		props.animatedShipData,
		updatedShips.length,
	]);

	return {
		layers,
		updatedShips,
		isShipLayerReady,
		isLayersReady,
		activePlanets,
		activeStations,
		workerStats: workerDebugStats,
	};
};
