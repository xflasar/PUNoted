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
import { calculateTransferPath } from "../../utils/gettransferelipse";
import { getFlightArrivalMs } from "../../utils/timestamputils";

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
		console.log(
			"[StarMap Debug][useMapLayers] Starting buildStarAtlas(STAR_ICONS)...",
		);
		buildStarAtlas(STAR_ICONS)
			.then((d) => {
				if (cancelled) {
					console.log(
						"[StarMap Debug][useMapLayers] STAR_ICONS atlas loaded but cancelled.",
					);
					try {
						(d.atlas as any)?.close?.();
					} catch {
						/* ignore */
					}
					return;
				}
				console.log(
					"[StarMap Debug][useMapLayers] STAR_ICONS atlas loaded successfully.",
				);
				setStarAtlas(d.atlas);
				setStarMapping(d.mapping);
			})
			.catch((err) => {
				console.error(
					"[StarMap Debug][useMapLayers] Failed to build STAR_ICONS atlas:",
					err,
				);
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
		console.log(
			"[StarMap Debug][useMapLayers] Starting buildStarAtlas(SHIP_ICONS)...",
		);
		buildStarAtlas(SHIP_ICONS)
			.then((d) => {
				if (cancelled) {
					console.log(
						"[StarMap Debug][useMapLayers] SHIP_ICONS atlas loaded but cancelled.",
					);
					try {
						(d.atlas as any)?.close?.();
					} catch {
						/* ignore */
					}
					return;
				}
				console.log(
					"[StarMap Debug][useMapLayers] SHIP_ICONS atlas loaded successfully.",
				);
				setShipAtlas(d.atlas);
				setShipMapping(d.mapping);
			})
			.catch((err) => {
				console.error(
					"[StarMap Debug][useMapLayers] Failed to build SHIP_ICONS atlas:",
					err,
				);
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
		if (!isGalaxyView) return [];
		const systemIds = new Set<string>();

		if (mode === "public" || mode === "shipping") {
			// In Public or Shipping Mode: do not show site circles/bases on the galaxy map
			return [];
		} else {
			// In Dashboard Mode: extract system IDs from user production sites/bases
			if (productionData) {
				for (const site of Object.values(productionData)) {
					const isMine = !site.isLeased && !site.tenant;
					if (isMine && site.planetid) {
						const sysId = planetToSystemMap.get(site.planetid);
						if (sysId) systemIds.add(sysId);
					}
				}
			}
		}

		return systemsPoints.filter(
			(p) => p.originalSystemId && systemIds.has(p.originalSystemId),
		);
	}, [
		mode,
		productionData,
		props.shipmentState,
		props.animatedShipData,
		planetToSystemMap,
		systemsPoints,
		isGalaxyView,
	]);

	const debouncedZoom = useDebouncedZoom(galaxyViewState.zoom, 150);

	const visibleShipsForClustering = useMemo(() => {
		if (mode === "public") {
			return [];
		}
		if (!isGalaxyView && props.currentSystemId) {
			const curSys = String(props.currentSystemId).toLowerCase();
			return updatedShips.filter((s: any) => {
				if (s.visible === false) return false;
				const sysId = String(
					s.addresssystemid || s.currentSystemId || s.systemId || "",
				).toLowerCase();

				const plan = s.plan;
				const segments = plan?.segments;
				if (segments && Array.isArray(segments) && segments.length > 0) {
					// Check active segment
					const now = Date.now();
					const activeSeg = segments.find((seg: any) => {
						const dep = seg.departure ? new Date(seg.departure).getTime() : 0;
						const arr = seg.arrival ? new Date(seg.arrival).getTime() : 0;
						return now >= dep && now < arr;
					});
					if (activeSeg) {
						const segType = (activeSeg.segment_type || "").toUpperCase();
						const orig = String(
							activeSeg.origin_system_id || activeSeg.origin_system || "",
						).toLowerCase();
						const dest = String(
							activeSeg.destination_system_id ||
								activeSeg.destination_system ||
								"",
						).toLowerCase();
						if (
							segType === "JUMP" ||
							segType === "CHARGE" ||
							(orig && dest && orig !== dest)
						) {
							return false; // In FTL jump between systems
						}
						return orig === curSys || dest === curSys;
					}

					// Not in an active segment: check if entire flight is finished or not started
					const firstSeg = segments[0];
					const lastSeg = segments[segments.length - 1];
					const firstDep = firstSeg?.departure
						? new Date(firstSeg.departure).getTime()
						: 0;
					const lastArr = lastSeg?.arrival
						? new Date(lastSeg.arrival).getTime()
						: 0;

					if (firstDep > 0 && now < firstDep) {
						const orig = String(
							firstSeg.origin_system_id || firstSeg.origin_system || sysId,
						).toLowerCase();
						return orig === curSys;
					}
					if (lastArr > 0 && now >= lastArr) {
						const dest = String(
							lastSeg.destination_system_id || lastSeg.destination_system || "",
						).toLowerCase();
						return dest === curSys;
					}
					// Mid-flight between segments
					return false;
				}

				// Docked ship without flight plan
				return sysId === curSys;
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
		if (
			mode === "public" ||
			!visiblePathShipIds ||
			visiblePathShipIds.size === 0
		)
			return [];
		const paths: any[] = [];
		const now = Date.now();

		for (let i = 0; i < allFlightPlans.length; i++) {
			const plan = allFlightPlans[i];
			const shipId = plan.shipid || plan.id;
			if (!visiblePathShipIds.has(shipId)) continue;
			if (!plan || !plan.segments || plan.segments.length === 0) continue;

			const planArrivalMs = getFlightArrivalMs(plan);
			if (planArrivalMs > 0 && now >= planArrivalMs) continue;

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
			} else {
				// System view flight paths
				const currentSysId = String(
					currentSystem.originalSystemId || currentSystem.id || "",
				).toLowerCase();
				const systemCenter = { x: currentSystem.x, y: currentSystem.y };

				for (let j = 0; j < plan.segments.length; j++) {
					const seg = plan.segments[j];
					const origSys = String(
						seg.origin_system_id || seg.origin_system || "",
					).toLowerCase();
					const destSys = String(
						seg.destination_system_id || seg.destination_system || "",
					).toLowerCase();
					if (
						origSys &&
						destSys &&
						origSys !== currentSysId &&
						destSys !== currentSysId
					)
						continue;
					if (origSys && !destSys && origSys !== currentSysId) continue;

					if (seg.transferellipse) {
						const coords = calculateTransferPath(
							seg.transferellipse,
							systemCenter,
						);
						if (coords && coords.length > 1) {
							paths.push({
								path: coords,
								id: `${plan.id}-${seg.segment_index ?? j}`,
								shipId: shipId,
								color: plan.color || [255, 255, 0, 150],
								isOwn: plan.isOwn,
							});
							continue;
						}
					}

					// Linear fallback in system between origin and destination objects
					const origObjId = String(
						seg.origin_location_id ||
							seg.origin_planet_id ||
							seg.origin_station_id ||
							"",
					).toLowerCase();
					const destObjId = String(
						seg.destination_location_id ||
							seg.destination_planet_id ||
							seg.destination_station_id ||
							"",
					).toLowerCase();
					const startObj =
						activePlanets.find(
							(p: any) =>
								String(p.planetid || p.id || "").toLowerCase() === origObjId,
						) ||
						activeStations.find(
							(s: any) =>
								String(s.stationid || s.id || "").toLowerCase() === origObjId,
						);
					const endObj =
						activePlanets.find(
							(p: any) =>
								String(p.planetid || p.id || "").toLowerCase() === destObjId,
						) ||
						activeStations.find(
							(s: any) =>
								String(s.stationid || s.id || "").toLowerCase() === destObjId,
						);

					if (startObj && endObj) {
						paths.push({
							path: [
								[startObj.x, startObj.y],
								[endObj.x, endObj.y],
							],
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
				id: `flight-paths-${isGalaxyView ? "galaxy" : "system"}`,
				data: paths,
				getPath: (d: any) => d.path,
				getColor: (d: any) => d.color,
				getWidth: (d: any) => (d.isOwn ? 4 : 3),
				widthUnits: "pixels",
				widthMinPixels: 2,
				capRounded: true,
				jointRounded: true,
				parameters: { depthTest: false },
				pickable: false,
			}),
		];
	}, [
		allFlightPlans,
		visiblePathShipIds,
		isGalaxyView,
		currentSystem,
		findLocationPosition,
		activePlanets,
		activeStations,
	]);

	const sectorLayer = useMemo(() => {
		return buildSectorLayers(isGalaxyView, sectors, safeGetColor);
	}, [isGalaxyView, sectors, safeGetColor]);

	const shippingModeHighlights = useMemo(() => {
		if (mode !== "shipping") return undefined;
		const systemIds = new Set<string>();
		const planetIds = new Set<string>();
		const stationIds = new Set<string>();

		// 1. Collect from shipment contract items (exact origin, destination, or current storage location)
		const contracts = props.shipmentState?.contracts || [];
		contracts.forEach((contract: any) => {
			contract.items?.forEach((item: any) => {
				if (item.systemid) systemIds.add(item.systemid);
				if (item.planetid) planetIds.add(item.planetid);
				if (item.location_type === "STATION" && item.location_name) {
					stationIds.add(item.location_name);
				}
			});
		});

		// 2. Also collect from ships involved in active shipments
		if (props.animatedShipData) {
			props.animatedShipData.forEach((s: any) => {
				if (s.addresssystemid) systemIds.add(s.addresssystemid);
				if (s.destinationsystemid) systemIds.add(s.destinationsystemid);
				if (s.originsystemid) systemIds.add(s.originsystemid);

				if (s.addressplanetid) planetIds.add(s.addressplanetid);
				if (s.destinationplanetid) planetIds.add(s.destinationplanetid);
				if (s.originplanetid) planetIds.add(s.originplanetid);

				if (s.addressstationid) stationIds.add(s.addressstationid);
				if (s.destinationstationid) stationIds.add(s.destinationstationid);
				if (s.originstationid) stationIds.add(s.originstationid);
			});
		}

		return { systemIds, planetIds, stationIds };
	}, [mode, props.shipmentState, props.animatedShipData]);

	// Extract stored packages (in warehouse, station or planet storage, not loaded in ship)
	const { packageCargoSystems, packageCargoNodes } = useMemo(() => {
		if (mode !== "shipping") {
			return { packageCargoSystems: [], packageCargoNodes: [] };
		}

		const contracts = props.shipmentState?.contracts || [];
		const storedItems: any[] = [];

		contracts.forEach((contract: any) => {
			contract.items?.forEach((item: any) => {
				// Only consider unfulfilled delivery or active cargo items
				if (item.status === "FULFILLED") return;
				// Must not be currently loaded on a ship
				if (item.shipid || item.location_type === "SHIP") return;

				storedItems.push(item);
			});
		});

		if (storedItems.length === 0) {
			return { packageCargoSystems: [], packageCargoNodes: [] };
		}

		// 1. Group for Galaxy View: by system
		const sysMap = new Map<
			string,
			{ id: string; x: number; y: number; name: string; count: number }
		>();
		storedItems.forEach((item) => {
			let sysId = item.systemid;
			if (!sysId && item.planetid) {
				sysId = planetToSystemMap.get(item.planetid);
			}
			if (sysId) {
				const sysPoint = systemsPoints.find(
					(s) => s.originalSystemId === sysId || s.id === sysId,
				);
				if (sysPoint) {
					const existing = sysMap.get(sysId);
					if (existing) {
						existing.count += 1;
					} else {
						sysMap.set(sysId, {
							id: sysId,
							x: sysPoint.x,
							y: sysPoint.y,
							name: sysPoint.label || sysPoint.name || sysId,
							count: 1,
						});
					}
				}
			}
		});

		// 2. Group for System View: by station or planet in the current system
		const nodeMap = new Map<
			string,
			{
				id: string;
				x: number;
				y: number;
				name: string;
				type: "STATION" | "PLANET";
				count: number;
			}
		>();
		if (isPlanetModeActive && props.currentSystemId) {
			storedItems.forEach((item) => {
				let sysId = item.systemid;
				if (!sysId && item.planetid) {
					sysId = planetToSystemMap.get(item.planetid);
				}
				if (sysId !== props.currentSystemId) return;

				// Check station
				if (item.location_type === "STATION" && item.location_name) {
					const st = activeStations.find(
						(s: any) =>
							s.stationid === item.location_name ||
							s.id === item.location_name ||
							(s.name &&
								s.name.toLowerCase() === item.location_name.toLowerCase()),
					);
					if (st) {
						const key = `st-${st.stationid || st.id}`;
						const existing = nodeMap.get(key);
						if (existing) {
							existing.count += 1;
						} else {
							nodeMap.set(key, {
								id: st.stationid || st.id,
								x: st.x,
								y: st.y,
								name: st.name || item.location_name,
								type: "STATION",
								count: 1,
							});
						}
						return;
					}
				}

				// Check planet / site
				const planetId =
					item.planetid ||
					(item.location_type === "SITE" ? item.location_name : null);
				if (planetId) {
					const pl = activePlanets.find(
						(p: any) =>
							p.planetid === planetId ||
							p.id === planetId ||
							(p.name && p.name.toLowerCase() === planetId.toLowerCase()),
					);
					if (pl) {
						const key = `pl-${pl.planetid || pl.id}`;
						const existing = nodeMap.get(key);
						if (existing) {
							existing.count += 1;
						} else {
							nodeMap.set(key, {
								id: pl.planetid || pl.id,
								x: pl.x,
								y: pl.y,
								name: pl.name || pl.planetname || planetId,
								type: "PLANET",
								count: 1,
							});
						}
					}
				}
			});
		}

		return {
			packageCargoSystems: Array.from(sysMap.values()),
			packageCargoNodes: Array.from(nodeMap.values()),
		};
	}, [
		mode,
		props.shipmentState,
		planetToSystemMap,
		systemsPoints,
		isPlanetModeActive,
		props.currentSystemId,
		activeStations,
		activePlanets,
	]);

	const staticGalaxyLayers = useMemo(() => {
		return buildStaticGalaxyLayers({
			mode,
			shippingModeHighlights,
			packageCargoSystems,
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
			zoom: galaxyViewState.zoom,
		});
	}, [
		mode,
		shippingModeHighlights,
		packageCargoSystems,
		isGalaxyView,
		galaxyViewState.zoom,
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
			mode,
			shippingModeHighlights,
			packageCargoNodes,
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
		mode,
		shippingModeHighlights,
		packageCargoNodes,
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
		return [
			...sectorLayer,
			...staticGalaxyLayers,
			...flightPathLayers,
			...dynamicLayers,
		];
	}, [
		staticGalaxyLayers,
		sectorLayer,
		flightPathLayers,
		dynamicLayers,
		props.viewportInstance,
	]);

	const isShipLayerReady = useMemo(() => {
		if (!shipAtlas || !starAtlas) return false;
		if (updatedShips.length === 0) return false;
		return true;
	}, [shipAtlas, starAtlas, updatedShips.length]);

	const isLayersReady = useMemo(() => {
		const hasViewport = !!props.viewportInstance;
		const layersCount = layers?.length ?? 0;
		const hasStarAtlas = !!starAtlas;
		const hasShipAtlas = !!shipAtlas;

		// Only wait for ships in "dashboard" mode. In "public" or "shipment" modes we do not block on ships.
		const shouldWaitForShips = mode === "dashboard";
		const hasShipsToRender =
			shouldWaitForShips &&
			Array.isArray(props.animatedShipData) &&
			props.animatedShipData.length > 0;
		const shipsUpdatedOk = !hasShipsToRender || updatedShips.length > 0;

		const ready =
			hasViewport &&
			layersCount > 0 &&
			hasStarAtlas &&
			hasShipAtlas &&
			shipsUpdatedOk;

		const blockers = [
			!hasViewport && "missing viewportInstance (canvas/map size not ready)",
			layersCount === 0 && "layers array is empty",
			!hasStarAtlas && "starAtlas not loaded yet",
			!hasShipAtlas && "shipAtlas not loaded yet",
			!shipsUpdatedOk &&
				`animatedShipData has ${props.animatedShipData?.length} ships, but updatedShips is empty (worker hasn't synced ships yet)`,
		].filter(Boolean);

		console.log("[StarMap Debug][useMapLayers] isLayersReady check:", {
			ready,
			mode,
			shouldWaitForShips,
			hasViewport,
			layersCount,
			hasStarAtlas,
			hasShipAtlas,
			hasShipsToRender,
			animatedShipDataCount: props.animatedShipData?.length ?? 0,
			updatedShipsCount: updatedShips.length,
			blockers,
		});

		if (!ready) {
			console.warn(
				"[StarMap Debug][BLOCKER keeping map in loading state]:",
				blockers.join(" | "),
			);
		}

		return ready;
	}, [
		props.viewportInstance,
		layers,
		starAtlas,
		shipAtlas,
		props.animatedShipData,
		updatedShips.length,
		mode,
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
