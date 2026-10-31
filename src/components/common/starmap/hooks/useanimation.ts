import { useState, useEffect, useRef } from "react";
import type {
	PlanetPosition,
	MapPoint,
	PlanetData,
	StationData,
	GatewayData,
	StationPosition,
	FlightPlan,
	UpdateShipData,
	ShipData,
} from "../types/maptypes";
import {
	calculateShipPositionGalaxy,
	calculateShipPositionInSystem,
	getShipFlightStatus,
} from "../utils/shipposition";
import {
	calculateMovingPlanetPosition,
	calculateMovingStationPosition,
} from "./usesystemviewsetup";

export const useAnimation = (
	centeredSystem: MapPoint | null,
	isPlanetModeActive: boolean,
	allPlanetsData: Record<string, PlanetData[]>,
	allStationsData: Record<string, StationData[]>,
	allGatewaysData: Record<string, GatewayData[]>,
	animatedShipData: ShipData[],
	activeFlightPlans: FlightPlan[],
	setActiveFlightPlans: React.Dispatch<React.SetStateAction<FlightPlan[]>>,
	systemsPoints: MapPoint[],
	isGalaxyView: boolean,
	deckRef: React.RefObject<any>,
	animationWorker: Worker | null,
	isInteracting: boolean,
	mode: string,
) => {
	const animationEnabled = mode !== "public";

	// -----------------------------
	// STATE
	// -----------------------------
	const [activePlanets, setActivePlanets] = useState<PlanetPosition[]>([]);
	const [activeStations, setActiveStations] = useState<StationPosition[]>([]);
	const [updatedShips, setUpdatedShips] = useState<UpdateShipData[]>([]);
	const [orbitTrails, setOrbitTrails] = useState<any[]>([]);
	const [workerStats, setWorkerStats] = useState<any>(null);

	// -----------------------------
	// REFS
	// -----------------------------
	const lastWorkerPostTime = useRef(0);
	const animationFrameId = useRef<number | null>(null);

	// Track system changes to clear ship pool instantly
	const lastSystemIdRef = useRef<string | null>(null);
	const currentSysId = centeredSystem?.originalSystemId || null;
	const systemChanged = lastSystemIdRef.current !== currentSysId;

	// Prevent stale closures in the RAF loop
	const isInteractingRef = useRef(isInteracting);
	useEffect(() => {
		isInteractingRef.current = isInteracting;
	}, [isInteracting]);

	const latestDataRef = useRef<{
		rawBuffers: {
			planetPos?: ArrayBuffer | null;
			stationPos?: ArrayBuffer | null;
			shipPos?: ArrayBuffer | null;
		} | null;
		pCount: number;
		sCount: number;
		shipCount: number;
		trails: any[] | null;
		stats: any | null;
	}>({
		rawBuffers: null,
		pCount: 0,
		sCount: 0,
		shipCount: 0,
		trails: null,
		stats: null,
	});

	const shipPoolMapRef = useRef<Map<string, UpdateShipData>>(new Map());
	const workerShipIdsRef = useRef<string[]>([]);

	const poolRef = useRef({
		planets: [] as PlanetPosition[],
		stations: [] as StationPosition[],
	});

	if (systemChanged) {
		shipPoolMapRef.current.clear();
		lastSystemIdRef.current = currentSysId;
	}

	const systemsSentRef = useRef<number | null>(null);
	const scheduledPostRef = useRef<number | null>(null);
	const lastShipSignatureRef = useRef<string | null>(null);
	const lastShipStateUpdateRef = useRef<number>(0);

	const UPDATE_INTERVAL = 5000;

	// ============================================================
	// 1. STATIC DATA INITIALIZATION
	// ============================================================
	useEffect(() => {
		if (!centeredSystem || !isPlanetModeActive) return;

		const rawPlanets =
			allPlanetsData[centeredSystem.originalSystemId || ""] || [];
		const rawStations =
			allStationsData[centeredSystem.originalSystemId || ""] || [];
		const now = Date.now();

		poolRef.current.planets = rawPlanets.map((p) => {
			return calculateMovingPlanetPosition(centeredSystem, p, now);
		});
		poolRef.current.stations = rawStations.map((s) => {
			return calculateMovingStationPosition(centeredSystem, s, now);
		});

		setActivePlanets([...poolRef.current.planets]);
		setActiveStations([...poolRef.current.stations]);

		setOrbitTrails([]);

		if (!animationEnabled || !animationWorker) {
			const SCALE_FACTOR = 5000000000;
			const trails = rawPlanets.map((p) => {
				const a = p.semimajoraxis ?? 1e10;
				const semiMajor = a / SCALE_FACTOR;
				const points: [number, number][] = [];
				const numSegments = 128;
				for (let idx = 0; idx <= numSegments; idx++) {
					const theta = (idx / numSegments) * Math.PI * 2;
					const px = centeredSystem.x + semiMajor * Math.cos(theta);
					const py = centeredSystem.y + semiMajor * Math.sin(theta);
					points.push([px, py]);
				}
				return {
					path: points,
					color: [255, 255, 255, 30],
				};
			});
			setOrbitTrails(trails);
		}

		if (animationEnabled && animationWorker) {
			try {
				animationWorker.postMessage({
					type: "init-data",
					payload: {
						planets: rawPlanets,
						stations: rawStations,
						centeredSystem,
						isGalaxyView,
					},
				});
			} catch {}
		}
	}, [
		animationEnabled,
		animationWorker,
		centeredSystem,
		isPlanetModeActive,
		isGalaxyView,
		allPlanetsData,
		allStationsData,
	]);

	// ============================================================
	// 2. SEND SYSTEMS (ONCE)
	// ============================================================
	useEffect(() => {
		if (!animationEnabled || !animationWorker || !systemsPoints.length) return;

		if (systemsSentRef.current === systemsPoints.length) return;

		try {
			animationWorker.postMessage({
				type: "update-ships",
				payload: {
					ships: [],
					activeFlightPlans: [],
					systemsPoints,
					isGalaxyView,
				},
			});
			systemsSentRef.current = systemsPoints.length;
		} catch {}
	}, [animationEnabled, animationWorker, systemsPoints, isGalaxyView]);

	// ============================================================
	// 3. DYNAMIC SHIP SYNC (THROTTLED)
	// ============================================================
	useEffect(() => {
		if (!animationEnabled || !animationWorker) return;

		const newPool = new Map<string, UpdateShipData>();
		const now = Date.now();
		animatedShipData.forEach((s) => {
			const shipId = s.shipid || s.id;
			if (!shipId) return;

			const planKey = s.plan?.id ?? s.shipid ?? s.id;
			const plan =
				activeFlightPlans.find(
					(p) => p.id === planKey || p.shipid === shipId || p.id === s.plan?.id,
				) ?? s.plan;

			const flightStatus = getShipFlightStatus(s, plan, now);
			const positionMode: "galaxy" | "system" = flightStatus.isInterSystem
				? "galaxy"
				: "system";
			const shipSysId = flightStatus.systemId;

			let initPos: [number, number] | null = null;
			let initBearing = s.bearing || 0;

			if (positionMode === "galaxy") {
				const res = calculateShipPositionGalaxy(s, plan, now, systemsPoints);
				if (res) {
					initPos = [res[0], res[1]];
					initBearing = res[2];
				}
			} else {
				// Ship is in a system
				const targetSysId = shipSysId || centeredSystem?.originalSystemId;
				const cleanSysKey = String(targetSysId || "")
					.toLowerCase()
					.replace(/^sys-/, "");
				const targetSys = targetSysId
					? systemsPoints.find((p) => {
							const pOrig = String(p.originalSystemId || "")
								.toLowerCase()
								.replace(/^sys-/, "");
							const pId = String(p.id || "")
								.toLowerCase()
								.replace(/^sys-/, "");
							return pOrig === cleanSysKey || pId === cleanSysKey;
						}) || centeredSystem
					: centeredSystem;
				const sysForCalc = targetSys || centeredSystem;
				const rawPlanets = targetSysId
					? allPlanetsData[cleanSysKey] || allPlanetsData[targetSysId] || []
					: [];
				const rawStations = targetSysId
					? allStationsData[cleanSysKey] || allStationsData[targetSysId] || []
					: [];
				const computedPlanets =
					targetSysId &&
					targetSysId === centeredSystem?.originalSystemId &&
					poolRef.current.planets.length > 0
						? poolRef.current.planets
						: sysForCalc
							? rawPlanets.map((p) =>
									calculateMovingPlanetPosition(sysForCalc, p, now),
								)
							: [];
				const computedStations =
					targetSysId &&
					targetSysId === centeredSystem?.originalSystemId &&
					poolRef.current.stations.length > 0
						? poolRef.current.stations
						: sysForCalc
							? rawStations.map((st) =>
									calculateMovingStationPosition(sysForCalc, st, now),
								)
							: [];
				const targetObjects = [...computedPlanets, ...computedStations];

				const res = calculateShipPositionInSystem(
					s,
					plan,
					now,
					targetObjects,
					sysForCalc,
				);
				if (res) {
					initPos = [res[0], res[1]];
					initBearing = res[2] ?? s.bearing ?? 0;
				} else if (sysForCalc) {
					initPos = [sysForCalc.x, sysForCalc.y];
				}
			}

			// Determine visibility for the current camera view
			let isVisible = false;
			if (isGalaxyView) {
				isVisible = positionMode === "galaxy";
			} else if (centeredSystem) {
				const curSys = String(
					centeredSystem.originalSystemId || centeredSystem.id || "",
				).toLowerCase();
				const tgtSys = String(shipSysId || "").toLowerCase();
				isVisible = positionMode === "system" && (!tgtSys || tgtSys === curSys);
			}

			const prev = shipPoolMapRef.current.get(shipId);
			if (
				prev &&
				!systemChanged &&
				prev.isGalaxyView === isGalaxyView &&
				initPos !== null
			) {
				newPool.set(shipId, {
					...s,
					id: shipId,
					name: s.name ?? s.registration ?? "",
					position: prev.position,
					bearing: prev.bearing,
					visible: isVisible,
					positionMode,
					systemId: shipSysId,
					isGalaxyView,
				} as any);
			} else {
				newPool.set(shipId, {
					...s,
					id: shipId,
					name: s.name ?? s.registration ?? "",
					position: initPos || [0, 0],
					bearing: initBearing,
					visible: isVisible,
					positionMode,
					systemId: shipSysId,
					isGalaxyView,
				} as any);
			}
		});

		shipPoolMapRef.current = newPool;

		// Build signature using the identifier and current view mode/system
		const shipSignature = animatedShipData
			.map((s) => s.shipid || s.id)
			.join("|");
		const currentSysKey =
			centeredSystem?.originalSystemId || centeredSystem?.id || "none";
		const signature = `${isGalaxyView ? "G" : "S"}_${currentSysKey}_${shipSignature}`;

		console.log("Animated Data:", animatedShipData);

		const isInitialOrChanged =
			lastShipSignatureRef.current !== signature || updatedShips.length === 0;

		console.log("[StarMap Debug][useAnimation] Ship sync check:", {
			animationEnabled,
			hasAnimationWorker: !!animationWorker,
			animatedShipDataCount: animatedShipData.length,
			newPoolSize: newPool.size,
			currentUpdatedShipsCount: updatedShips.length,
			isInitialOrChanged,
		});

		if (isInitialOrChanged) {
			lastShipSignatureRef.current = signature;
			console.log(
				"[StarMap Debug][useAnimation] Setting updatedShips immediately to newPool size:",
				newPool.size,
			);
			setUpdatedShips(Array.from(newPool.values()));
		}

		const postToWorker = () => {
			try {
				workerShipIdsRef.current = animatedShipData.map(
					(s) => s.shipid || s.id,
				);

				animationWorker.postMessage({
					type: "update-ships",
					payload: {
						ships: animatedShipData,
						activeFlightPlans,
						isGalaxyView,
						centeredSystem,
						systemsPoints,
					},
				});
			} catch {}
			lastWorkerPostTime.current = Date.now();
			scheduledPostRef.current = null;
		};

		if (isInitialOrChanged) {
			if (scheduledPostRef.current !== null) {
				window.clearTimeout(scheduledPostRef.current);
				scheduledPostRef.current = null;
			}
			postToWorker();
			return;
		}

		const timeNow = Date.now();
		if (timeNow - lastWorkerPostTime.current < UPDATE_INTERVAL) {
			if (scheduledPostRef.current == null) {
				scheduledPostRef.current = window.setTimeout(
					postToWorker,
					UPDATE_INTERVAL,
				);
			}
			return;
		}

		postToWorker();

		return () => {
			if (scheduledPostRef.current != null) {
				clearTimeout(scheduledPostRef.current);
				scheduledPostRef.current = null;
			}
		};
	}, [
		animationEnabled,
		animatedShipData,
		activeFlightPlans,
		isGalaxyView,
		centeredSystem,
		animationWorker,
	]);

	// ============================================================
	// 4. WORKER LISTENER
	// ============================================================
	useEffect(() => {
		if (!animationEnabled || !animationWorker) return;

		const onMessage = (e: MessageEvent<any>) => {
			const {
				type,
				planetPos,
				stationPos,
				shipPos,
				planetCount,
				stationCount,
				shipCount,
				trails,
				stats,
				workerPlans,
			} = e.data || {};

			if (type === "tick-update") {
				latestDataRef.current = {
					rawBuffers: { planetPos, stationPos, shipPos },
					pCount: planetCount ?? 0,
					sCount: stationCount ?? 0,
					shipCount: shipCount ?? 0,
					trails: trails?.length ? trails : null,
					stats: stats ?? null,
				};

				const pool = poolRef.current;
				if (planetPos && planetCount) {
					const view = new Float32Array(planetPos);
					const count = Math.min(pool.planets.length, planetCount);
					for (let i = 0; i < count; i++) {
						pool.planets[i].x = view[i * 2];
						pool.planets[i].y = view[i * 2 + 1];
					}
					setActivePlanets([...pool.planets]);
				}
				if (stationPos && stationCount) {
					const view = new Float32Array(stationPos);
					const count = Math.min(pool.stations.length, stationCount);
					for (let i = 0; i < count; i++) {
						pool.stations[i].x = view[i * 2];
						pool.stations[i].y = view[i * 2 + 1];
					}
					setActiveStations([...pool.stations]);
				}

				if (workerPlans?.length && typeof setActiveFlightPlans === "function") {
					setActiveFlightPlans(workerPlans);
				}
			}

			if (type === "worker-debug-snapshot") {
				setWorkerStats(stats);
			}
		};

		animationWorker.addEventListener("message", onMessage);
		return () => animationWorker.removeEventListener("message", onMessage);
	}, [animationEnabled, animationWorker, setActiveFlightPlans]);

	// ============================================================
	// 5. RAF RENDER LOOP (STRICTLY GATED)
	// ============================================================
	useEffect(() => {
		if (!animationEnabled) return;

		const tick = () => {
			animationFrameId.current = requestAnimationFrame(tick);

			// Skip heavy React state updates if the user is dragging the map
			if (isInteractingRef.current) return;

			const data = latestDataRef.current;
			const pool = poolRef.current;

			if (data.rawBuffers?.shipPos && workerShipIdsRef.current.length > 0) {
				const view = new Float32Array(data.rawBuffers.shipPos);
				const count = Math.min(workerShipIdsRef.current.length, data.shipCount);
				let hasChanges = false;

				for (let i = 0; i < count; i++) {
					const id = workerShipIdsRef.current[i];
					const ship = shipPoolMapRef.current.get(id);

					if (ship) {
						const o = i * 4;
						const newX = view[o];
						const newY = view[o + 1];
						const newBearing = view[o + 2];
						const newVis = view[o + 3] > 0.5;

						if (
							ship.position[0] !== newX ||
							ship.position[1] !== newY ||
							ship.bearing !== newBearing ||
							ship.visible !== newVis
						) {
							// Mutate with a fresh array so Deck.GL detects the structural change
							ship.position = [newX, newY];
							ship.bearing = newBearing;
							ship.visible = newVis;
							hasChanges = true;
						}
					}
				}

				const now = Date.now();
				if (hasChanges && now - lastShipStateUpdateRef.current > 75) {
					setUpdatedShips(Array.from(shipPoolMapRef.current.values()));
					lastShipStateUpdateRef.current = now;
				}
			}

			if (data.trails) {
				setOrbitTrails(data.trails);
				data.trails = null;
			}

			if (data.stats) {
				setWorkerStats(data.stats);
				data.stats = null;
			}
		};

		animationFrameId.current = requestAnimationFrame(tick);
		return () => {
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
				animationFrameId.current = null;
			}
		};
	}, [animationEnabled]);

	// ============================================================
	// CONDITIONAL RETURN
	// ============================================================
	return {
		activePlanets: activePlanets,
		activeStations: activeStations,
		updatedShips: animationEnabled ? updatedShips : [],
		orbitTrails: orbitTrails,
		workerDebugStats: animationEnabled ? workerStats : null,
	};
};
