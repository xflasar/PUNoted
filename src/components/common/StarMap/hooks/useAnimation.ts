import { useState, useEffect, useRef } from 'react';
import type {
  PlanetPosition,
  MapPoint,
  PlanetData,
  StationData,
  GatewayData,
  StationPosition,
  AnimatedShipData,
  FlightPlan,
  UpdateShipData
} from '../types/mapTypes';

export const useAnimation = (
  centeredSystem: MapPoint | null,
  isPlanetModeActive: boolean,
  allPlanetsData: Record<string, PlanetData[]>,
  allStationsData: Record<string, StationData[]>,
  allGatewaysData: Record<string, GatewayData[]>,
  animatedShipData: AnimatedShipData[],
  activeFlightPlans: FlightPlan[],
  setActiveFlightPlans: React.Dispatch<React.SetStateAction<FlightPlan[]>>,
  systemsPoints: MapPoint[],
  isGalaxyView: boolean,
  deckRef: React.RefObject<any>,
  animationWorker: Worker | null,
  isInteracting: boolean,
  mode: string
) => {
  const animationEnabled = mode !== 'public';

  
  // -----------------------------
  // STATE (only meaningful if enabled)
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
    stats: null
  });

  const poolRef = useRef({
    planets: [] as PlanetPosition[],
    stations: [] as StationPosition[],
    ships: [] as UpdateShipData[]
  });

  const systemsSentRef = useRef<number | null>(null);
  const scheduledPostRef = useRef<number | null>(null);
  const lastShipSignatureRef = useRef<string | null>(null);


  const UPDATE_INTERVAL = 1000;

  // ============================================================
  // 🚫 HARD EXIT: PUBLIC MODE PRODUCES NO STATE
  // ============================================================
  if (!animationEnabled) {
    return {
      activePlanets: [],
      activeStations: [],
      updatedShips: [],
      orbitTrails: [],
      workerDebugStats: null
    };
  }

  // ============================================================
  // 1. STATIC DATA INITIALIZATION
  // ============================================================
  useEffect(() => {
    if (!animationWorker || !centeredSystem || !isPlanetModeActive) return;

    const rawPlanets =
      allPlanetsData[centeredSystem.originalSystemId] || [];
    const rawStations =
      allStationsData[centeredSystem.originalSystemId] || [];

    poolRef.current.planets = rawPlanets.map(p => ({ ...p, x: 0, y: 0 }));
    poolRef.current.stations = rawStations.map(s => ({ ...s, x: 0, y: 0 }));

    setActivePlanets([...poolRef.current.planets]);
    setActiveStations([...poolRef.current.stations]);

    try {
      animationWorker.postMessage({
        type: 'init-data',
        payload: { planets: rawPlanets, stations: rawStations, centeredSystem }
      });
    } catch {}
  }, [
    animationEnabled,
    animationWorker,
    centeredSystem,
    isPlanetModeActive,
    allPlanetsData,
    allStationsData
  ]);

  // ============================================================
  // 2. SEND SYSTEMS (ONCE)
  // ============================================================
  useEffect(() => {
    if (!animationWorker || !systemsPoints.length) return;

    if (systemsSentRef.current === systemsPoints.length) return;

    try {
      animationWorker.postMessage({
        type: 'update-ships',
        payload: {
          ships: [],
          activeFlightPlans: [],
          systemsPoints,
          isGalaxyView
        }
      });
      systemsSentRef.current = systemsPoints.length;
    } catch {}
  }, [animationEnabled, animationWorker, systemsPoints, isGalaxyView]);

  // ============================================================
  // 3. DYNAMIC SHIP SYNC (THROTTLED)
  // ============================================================
  useEffect(() => {
    if (!animationWorker) return;

    const prevPositions = new Map<
      string,
      { pos: [number, number]; bearing: number }
    >();

    for (const s of poolRef.current.ships) {
      prevPositions.set(s.id, { pos: s.position, bearing: s.bearing });
    }

    const sPool = animatedShipData.map(s => {
      const prev = prevPositions.get(s.id);
      return {
        ...s,
        position: prev ? prev.pos : [0, 0],
        bearing: prev ? prev.bearing : 0,
        visible: true
      };
    });

    poolRef.current.ships = sPool;
    const signature = sPool.map(s => s.id).join('|');

if (lastShipSignatureRef.current !== signature) {
  lastShipSignatureRef.current = signature;
  setUpdatedShips(sPool);
}

    const now = Date.now();
    if (now - lastWorkerPostTime.current < UPDATE_INTERVAL) {
      if (scheduledPostRef.current == null) {
        scheduledPostRef.current = window.setTimeout(() => {
          try {
            animationWorker.postMessage({
              type: 'update-ships',
              payload: {
                ships: animatedShipData,
                activeFlightPlans,
                isGalaxyView,
                centeredSystem
              }
            });
          } catch {}
          lastWorkerPostTime.current = Date.now();
          scheduledPostRef.current = null;
        }, UPDATE_INTERVAL);
      }
      return;
    }

    try {
      animationWorker.postMessage({
        type: 'update-ships',
        payload: {
          ships: animatedShipData,
          activeFlightPlans,
          isGalaxyView,
          centeredSystem
        }
      });
      lastWorkerPostTime.current = now;
    } catch {}

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
    animationWorker
  ]);

  // ============================================================
  // 4. WORKER LISTENER
  // ============================================================
  useEffect(() => {
    if (!animationWorker) return;

    const onMessage = (e: MessageEvent<any>) => {
      if (isInteracting) return;

      const {
        type,
        planetPos,
        stationPos,
        shipPos,
        pCount,
        sCount,
        shipCount,
        trails,
        stats,
        workerPlans
      } = e.data || {};

      if (type === 'tick-update') {
        latestDataRef.current = {
          rawBuffers: { planetPos, stationPos, shipPos },
          pCount: pCount ?? 0,
          sCount: sCount ?? 0,
          shipCount: shipCount ?? 0,
          trails: trails?.length ? trails : null,
          stats: stats ?? null
        };

        if (workerPlans?.length) {
          setActiveFlightPlans(workerPlans);
        }
      }

      if (type === 'worker-debug-snapshot') {
        setWorkerStats(stats);
      }
    };

    animationWorker.addEventListener('message', onMessage);
    return () => animationWorker.removeEventListener('message', onMessage);
  }, [animationEnabled, animationWorker, isInteracting, setActiveFlightPlans]);

  // ============================================================
  // 5. RAF RENDER LOOP (STRICTLY GATED)
  // ============================================================
  useEffect(() => {
    if (!animationEnabled) return;

    const tick = () => {
      animationFrameId.current = requestAnimationFrame(tick);

      const data = latestDataRef.current;
      const pool = poolRef.current;

      if (data.rawBuffers?.shipPos && pool.ships.length === data.shipCount) {
        const view = new Float32Array(data.rawBuffers.shipPos);
        for (let i = 0; i < data.shipCount; i++) {
          const s = pool.ships[i];
          const o = i * 4;
          s.position[0] = view[o];
          s.position[1] = view[o + 1];
          s.bearing = view[o + 2];
          s.visible = view[o + 3] > 0.5;
        }
        setUpdatedShips([...pool.ships]);
      }

      if (data.rawBuffers?.planetPos && pool.planets.length === data.pCount) {
        const view = new Float32Array(data.rawBuffers.planetPos);
        for (let i = 0; i < data.pCount; i++) {
          pool.planets[i].x = view[i * 2];
          pool.planets[i].y = view[i * 2 + 1];
        }
        setActivePlanets([...pool.planets]);
      }

      if (data.rawBuffers?.stationPos && pool.stations.length === data.sCount) {
        const view = new Float32Array(data.rawBuffers.stationPos);
        for (let i = 0; i < data.sCount; i++) {
          pool.stations[i].x = view[i * 2];
          pool.stations[i].y = view[i * 2 + 1];
        }
        setActiveStations([...pool.stations]);
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

  return {
    activePlanets,
    activeStations,
    updatedShips,
    orbitTrails,
    workerDebugStats: workerStats
  };
};
