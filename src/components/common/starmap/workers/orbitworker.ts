// ================================
// FILE: orbitWorker.fixed.ts
// ================================

import type {
	MapPoint,
	PlanetData,
	StationData,
	WorkerFlightPlan,
} from "../types/maptypes";
import calculateBearing from "../utils/calculatebearing";
import { shipPositionOnEllipse } from "../utils/gettransferelipse";

// ----------------- CONFIG -----------------
const SCALE_FACTOR = 5e9;
const SCALE_FACTOR_STATIONS = 5e9;
const G = 6.67384e-11;
let UPDATE_INTERVAL_MS = 5000;
const TRAIL_UPDATE_MS = 30000;
const TRAIL_SEGMENTS = 28;
const TRAIL_LENGTH_RAD = Math.PI / 1.5;

let DEBUG = false;

// ----------------- STATE (orbital) -----------------
let cachedPlanets: any[] = [];
let cachedStations: any[] = [];
let starSystemForOrbits: MapPoint | null = null;
let trailCache: any[] = [];
let lastTrailUpdate = 0;
let shipsForInterval: any[] = [];
let plansMap: Map<string, any> = new Map();

// --- OPTIMIZATION: Map for O(1) Galaxy Lookup ---
const systemsMap: Map<string, MapPoint> = new Map();

let centeredSystemCached: MapPoint | null = null;
let isGalaxyViewCached = true;

// Stats
const TICK_STATS_LEN = 200;
const tickTimes: number[] = new Array(TICK_STATS_LEN).fill(0);
let tickIndex = 0;

// ----------------- UTIL (orbital math) -----------------
function nowMs() {
	return typeof performance !== "undefined" && performance.now
		? performance.now()
		: Date.now();
}

function _calculateWorldTimeSeconds(timeMs: number): number {
	const REFERENCE_EPOCH = 1451690603;
	const SIMULATION_INTERVAL = 86400;
	const PLANETARY_MOTION_FACTOR = 20;
	const timeAccelerationFactor =
		(SIMULATION_INTERVAL / 86400) * PLANETARY_MOTION_FACTOR;
	return (
		REFERENCE_EPOCH + (timeMs / 1000 - REFERENCE_EPOCH) * timeAccelerationFactor
	);
}

function keplerEquation(e: number, M: number): number {
	const Mnorm =
		((((M + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
	if (Math.abs(e) < 1e-8) return Mnorm;
	let E = e < 0.8 ? Mnorm : Math.PI;
	for (let iter = 0; iter < 40; iter++) {
		const f = E - e * Math.sin(E) - Mnorm;
		const fp = 1 - e * Math.cos(E);
		const delta = -f / fp;
		E += delta;
		if (Math.abs(delta) < 1e-12) break;
	}
	return E;
}

function orbitalPlaneToInertialInline(
	yOrb: number,
	xOrb: number,
	Ω: number,
	ω: number,
	i: number,
): [number, number, number] {
	const cosw = Math.cos(-ω),
		sinw = Math.sin(-ω);
	const tx = cosw * yOrb - sinw * xOrb;
	const ty = sinw * yOrb + cosw * xOrb;
	const cosi = Math.cos(-i),
		sini = Math.sin(-i);
	const ty2 = cosi * ty;
	const tz2 = sini * ty;
	const cosΩ = Math.cos(-Ω),
		sinΩ = Math.sin(-Ω);
	const ix = cosΩ * tx - sinΩ * ty2;
	const iy = sinΩ * tx + cosΩ * ty2;
	return [ix, iy, tz2];
}

function getPlanetColorByPopulationFast(population: number) {
	if (!population || population <= 0) return [100, 100, 100, 255];
	const log = Math.log10(Math.max(1, population));
	const t = Math.min(1, Math.max(0, (log - 2) / 5));
	const r = Math.round(100 + (255 - 100) * t);
	const g = Math.round(255 - 255 * t);
	const b = Math.round(255 - 155 * t);
	return [r, g, b, 255];
}

function preparePlanetCache(
	planets: PlanetData[],
	stations: StationData[],
	starSystem: MapPoint | null,
) {
	starSystemForOrbits = starSystem;
	cachedPlanets = (planets || []).map((p: any) => {
		const a = p.semimajoraxis ?? 1e10;
		const e = p.eccentricity ?? 0;
		const inc = p.inclination ?? 0;
		const Ω = p.rightascension ?? 0;
		const ω = p.periapsis ?? 0;
		let GM = 398600441800000;
		if (p.mass && starSystem?.mass) GM = G * (p.mass + starSystem.mass);
		const pParam = a * (1 - e * e);
		const n = Math.sqrt(GM / Math.pow(a, 3));
		return { raw: p, pParam, n, a, e, inc, Ω, ω };
	});

	cachedStations = (stations || []).map((s: any) => {
		const a = s.semimajoraxis ?? 1e10;
		const e = s.eccentricity ?? 0;
		const inc = s.inclination ?? 0;
		const Ω = s.rightascension ?? 0;
		const ω = s.periapsis ?? 0;
		let GM = 398600441800000;
		if (starSystem?.mass) GM = G * (125000 + starSystem.mass);
		const pParam = a * (1 - e * e);
		const n = Math.sqrt(GM / Math.pow(a, 3));
		return { raw: s, pParam, n, a, e, inc, Ω, ω };
	});

	trailCache = [];
	lastTrailUpdate = 0;

	// Reset buffers when scene geometry changes to ensure we allocate correct sizes
	planetPosBuffers = null;
	planetColorBuffers = null;
	stationPosBuffers = null;
	stationColorBuffers = null;
	shipPosBuffers = null;
}

function computePlanetPositionCached(i: number, worldTime: number) {
	const c = cachedPlanets[i];
	const { pParam, n, e, inc, Ω, ω } = c;
	const M = n * worldTime;
	const E = keplerEquation(e, M);
	const nu = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(E / 2));
	const r = pParam / (1 + e * Math.cos(nu));
	const xOrb = r * Math.cos(nu);
	const yOrb = r * Math.sin(nu);
	const inertial = orbitalPlaneToInertialInline(yOrb, xOrb, Ω, ω, inc);
	const posX =
		(starSystemForOrbits ? starSystemForOrbits.x : 0) +
		inertial[0] / SCALE_FACTOR;
	const posY =
		(starSystemForOrbits ? starSystemForOrbits.y : 0) -
		inertial[1] / SCALE_FACTOR;
	return { x: posX, y: posY, nu };
}

function computeStationPositionCached(i: number, worldTime: number) {
	const c = cachedStations[i];
	const { pParam, n, e, inc, Ω, ω } = c;
	const M = n * worldTime;
	const E = keplerEquation(e, M);
	const nu = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(E / 2));
	const r = pParam / (1 + e * Math.cos(nu));
	const xOrb = r * Math.cos(nu);
	const yOrb = r * Math.sin(nu);
	const inertial = orbitalPlaneToInertialInline(yOrb, xOrb, Ω, ω, inc);
	const posX =
		(starSystemForOrbits ? starSystemForOrbits.x : 0) +
		inertial[0] / SCALE_FACTOR_STATIONS;
	const posY =
		(starSystemForOrbits ? starSystemForOrbits.y : 0) -
		inertial[1] / SCALE_FACTOR_STATIONS;
	return { x: posX, y: posY, nu };
}

function regenerateTrails(worldTime: number) {
	const trails: any[] = [];
	for (let i = 0; i < cachedPlanets.length; i++) {
		const p = cachedPlanets[i];
		const cur = computePlanetPositionCached(i, worldTime);
		const currentNu = cur.nu;
		const { pParam, e, inc, Ω, ω } = p;
		let prevPoint: [number, number] | null = null;
		for (let s = 0; s <= TRAIL_SEGMENTS; s++) {
			const nu = currentNu - (s / TRAIL_SEGMENTS) * TRAIL_LENGTH_RAD;
			const r = pParam / (1 + e * Math.cos(nu));
			const xOrb = r * Math.cos(nu);
			const yOrb = r * Math.sin(nu);
			const inertial = orbitalPlaneToInertialInline(yOrb, xOrb, Ω, ω, inc);
			const x =
				(starSystemForOrbits ? starSystemForOrbits.x : 0) +
				inertial[0] / SCALE_FACTOR;
			const y =
				(starSystemForOrbits ? starSystemForOrbits.y : 0) -
				inertial[1] / SCALE_FACTOR;
			const currentPoint: [number, number] = [x, y];
			if (prevPoint) {
				const ratio = 1 - s / TRAIL_SEGMENTS;
				const alpha = Math.floor(ratio * 255 * 0.6);
				if (alpha > 10) trails.push({ path: [prevPoint, currentPoint], alpha });
			}
			prevPoint = currentPoint;
		}
	}
	trailCache = trails;
	lastTrailUpdate = Date.now();
}

function getFlightStatus(ship: any, plan: any) {
	if (!plan || !plan.segments)
		return {
			isInterSystem: false,
			systemId: ship.addresssystemid || ship.address_system_id,
		};
	const now = Date.now();
	const activeSegment = plan.segments.find(
		(s: any) => now >= Date.parse(s.departure) && now < Date.parse(s.arrival),
	);
	if (activeSegment) {
		if (
			activeSegment.origin_system_id !== activeSegment.destination_system_id
		) {
			return {
				isInterSystem: true,
				origin: activeSegment.origin_system_id,
				dest: activeSegment.destination_system_id,
			};
		}
		return { isInterSystem: false, systemId: activeSegment.origin_system_id };
	}
	// ARRIVAL LIMBO LOGIC (Galaxy scale)
	if (plan.departuretimestamp && now >= Date.parse(plan.departuretimestamp)) {
		const lastSeg = plan.segments[plan.segments.length - 1];
		return { isInterSystem: false, systemId: lastSeg.destination_system_id };
	}
	return {
		isInterSystem: false,
		systemId: ship.addresssystemid || ship.address_system_id,
	};
}

function calculateShipPositionGalaxy(
	ship: any,
	plan: any,
	currentTime: number,
	sysMap: Map<string, MapPoint>,
): [number, number, number] | null {
	try {
		const activeSegment = plan?.segments?.find(
			(s: any) => currentTime >= s.departure && currentTime < s.arrival,
		);
		if (activeSegment) {
			const startSystem = sysMap.get(activeSegment.origin_system_id);
			const endSystem = sysMap.get(activeSegment.destination_system_id);
			if (!startSystem || !endSystem) return null;
			const duration = activeSegment.arrival - activeSegment.departure;
			if (duration <= 0) return [endSystem.x, endSystem.y, 0];
			const progress = (currentTime - activeSegment.departure) / duration;
			const x = startSystem.x + (endSystem.x - startSystem.x) * progress;
			const y = startSystem.y + (endSystem.y - startSystem.y) * progress;
			return [x, y, calculateBearing([x, y], [endSystem.x, endSystem.y])];
		}
		// ARRIVAL LIMBO LOGIC (Galaxy position)
		if (
			plan &&
			plan.departuretimestamp &&
			currentTime >= Date.parse(plan.departuretimestamp)
		) {
			const lastSeg = plan.segments[plan.segments.length - 1];
			const sys = sysMap.get(lastSeg.destination_system_id);
			return sys ? [sys.x, sys.y, ship.bearing || 0] : null;
		}
		const sys = sysMap.get(ship.addresssystemid || ship.address_system_id);
		return sys ? [sys.x, sys.y, ship.bearing || 0] : null;
	} catch (err) {
		return null;
	}
}

function calculateShipPositionInSystem(
	ship: any,
	plan: any,
	currentTime: number,
	targetLookup: Map<string, { x: number; y: number }>,
	currentSystem: MapPoint | null,
): [number, number, number] | null {
	try {
		const activeSegment = plan?.segments?.find(
			(s: any) => currentTime >= s.departure && currentTime < s.arrival,
		);
		if (!activeSegment) {
			// ARRIVAL LIMBO LOGIC (System position)
			if (plan && plan._arrivalMs && currentTime >= plan._arrivalMs) {
				const lastSeg = plan.segments[plan.segments.length - 1];
				const destId =
					lastSeg.destination_planet_id ?? lastSeg.destination_station_id;
				const target = targetLookup.get(destId);
				return target
					? [target.x, target.y, ship.bearing || 0]
					: currentSystem
						? [currentSystem.x, currentSystem.y, ship.bearing || 0]
						: null;
			}
			// Docked (Static)
			const targetId =
				ship.addressplanetid ??
				ship.addressstationid ??
				ship.address_planet_id ??
				ship.address_station_id;
			const target = targetLookup.get(targetId);
			return target
				? [target.x, target.y, ship.bearing || 0]
				: currentSystem
					? [currentSystem.x, currentSystem.y, ship.bearing || 0]
					: null;
		}
		if (activeSegment.transferellipse && currentSystem) {
			const progress = Math.min(
				1,
				Math.max(
					0,
					(currentTime - activeSegment.departure) /
						(activeSegment.arrival - activeSegment.departure),
				),
			);
			try {
				const res = shipPositionOnEllipse(
					activeSegment.transferellipse,
					progress,
					currentSystem,
				);
				if (res) {
					const sampleNextProgress = Math.min(1.0, progress + 0.005);
					const resNext = shipPositionOnEllipse(
						activeSegment.transferellipse,
						sampleNextProgress,
						currentSystem,
					);
					let bearing = ship.bearing || 0;
					if (resNext) {
						bearing = calculateBearing(
							[res[0], res[1]],
							[resNext[0], resNext[1]],
						);
					}
					return [res[0], res[1], bearing];
				}
			} catch (e) {}
		}
		return currentSystem
			? [currentSystem.x, currentSystem.y, ship.bearing || 0]
			: null;
	} catch (err) {
		return null;
	}
}

/* ------------------------------------------------------------------ */
/*  Double-buffer / safe transfer machinery (prevents detached errors) */
/* ------------------------------------------------------------------ */

let planetPosBuffers: ArrayBuffer[] | null = null;
let planetColorBuffers: ArrayBuffer[] | null = null;
let stationPosBuffers: ArrayBuffer[] | null = null;
let stationColorBuffers: ArrayBuffer[] | null = null;
let shipPosBuffers: ArrayBuffer[] | null = null;

let bufferToggle = 0;
let mainIntervalId: number | null = null;

function ensurePair(
	buffers: ArrayBuffer[] | null,
	bytesNeeded: number,
): ArrayBuffer[] {
	if (!buffers)
		return [new ArrayBuffer(bytesNeeded), new ArrayBuffer(bytesNeeded)];
	const aValid = buffers[0] && buffers[0].byteLength >= bytesNeeded;
	const bValid = buffers[1] && buffers[1].byteLength >= bytesNeeded;
	if (!aValid || !bValid)
		return [new ArrayBuffer(bytesNeeded), new ArrayBuffer(bytesNeeded)];
	return buffers;
}

function ensureBuffers(
	planetCount: number,
	stationCount: number,
	shipCount: number,
) {
	const pLenBytes = planetCount * 2 * 4;
	const pcLen = planetCount * 4;
	const sLenBytes = stationCount * 2 * 4;
	const scLen = stationCount * 4;
	const shLenBytes = shipCount * 4 * 4;

	planetPosBuffers = ensurePair(planetPosBuffers, pLenBytes);
	planetColorBuffers = ensurePair(planetColorBuffers, pcLen);
	stationPosBuffers = ensurePair(stationPosBuffers, sLenBytes);
	stationColorBuffers = ensurePair(stationColorBuffers, scLen);
	shipPosBuffers = ensurePair(shipPosBuffers, shLenBytes);
}

function safeFloat32View(
	buffers: ArrayBuffer[] | null,
	index: number,
	bytesNeeded: number,
): Float32Array {
	try {
		if (!buffers) throw new Error("no-buffers");
		const ab = buffers[index];
		if (!ab || ab.byteLength < bytesNeeded) throw new Error("detached");
		return new Float32Array(ab);
	} catch {
		const newBuf = new ArrayBuffer(bytesNeeded);
		if (buffers) buffers[index] = newBuf;
		return new Float32Array(newBuf);
	}
}

function safeUint8View(
	buffers: ArrayBuffer[] | null,
	index: number,
	bytesNeeded: number,
): Uint8ClampedArray {
	try {
		if (!buffers) throw new Error("no-buffers");
		const ab = buffers[index];
		if (!ab || ab.byteLength < bytesNeeded) throw new Error("detached");
		return new Uint8ClampedArray(ab);
	} catch {
		const newBuf = new ArrayBuffer(bytesNeeded);
		if (buffers) buffers[index] = newBuf;
		return new Uint8ClampedArray(newBuf);
	}
}

/* ------------------------------------------------------------------ */
/*  Main tick: compute positions, write to buffers, and postMessage   */
/* ------------------------------------------------------------------ */

function calculateAndPostEverything() {
	const tickStart = nowMs();
	const now = Date.now();
	const worldTime = _calculateWorldTimeSeconds(now);

	const planetCount = cachedPlanets.length;
	const stationCount = cachedStations.length;
	const shipCount = shipsForInterval.length;

	ensureBuffers(planetCount, stationCount, shipCount);

	const bufIdx = bufferToggle;

	// create typed views (safe)
	const planetPosBuf = safeFloat32View(
		planetPosBuffers,
		bufIdx,
		planetCount * 2 * 4,
	);
	const planetColorBuf = safeUint8View(
		planetColorBuffers,
		bufIdx,
		planetCount * 4,
	);
	const stationPosBuf = safeFloat32View(
		stationPosBuffers,
		bufIdx,
		stationCount * 2 * 4,
	);
	const stationColorBuf = safeUint8View(
		stationColorBuffers,
		bufIdx,
		stationCount * 4,
	);
	const shipPosBuf = safeFloat32View(shipPosBuffers, bufIdx, shipCount * 4 * 4);

	// 1. Planets
	for (let i = 0; i < planetCount; i++) {
		const pos = computePlanetPositionCached(i, worldTime);
		planetPosBuf[i * 2] = pos.x;
		planetPosBuf[i * 2 + 1] = pos.y;
		const pop = cachedPlanets[i].raw?.planetPopulation ?? 0;
		const col = getPlanetColorByPopulationFast(pop);
		planetColorBuf[i * 4] = col[0];
		planetColorBuf[i * 4 + 1] = col[1];
		planetColorBuf[i * 4 + 2] = col[2];
		planetColorBuf[i * 4 + 3] = col[3];
	}

	// 2. Stations
	for (let i = 0; i < stationCount; i++) {
		const pos = computeStationPositionCached(i, worldTime);
		stationPosBuf[i * 2] = pos.x;
		stationPosBuf[i * 2 + 1] = pos.y;
		stationColorBuf[i * 4] = 0;
		stationColorBuf[i * 4 + 1] = 255;
		stationColorBuf[i * 4 + 2] = 0;
		stationColorBuf[i * 4 + 3] = 255;
	}

	// 3. Ships
	const updatedPlans: WorkerFlightPlan[] = [];
	const targetLookup = new Map<string, { x: number; y: number }>();
	if (!isGalaxyViewCached) {
		for (let i = 0; i < planetCount; i++) {
			targetLookup.set(cachedPlanets[i].raw.planetid, {
				x: planetPosBuf[i * 2],
				y: planetPosBuf[i * 2 + 1],
			});
		}
		for (let i = 0; i < stationCount; i++) {
			targetLookup.set(cachedStations[i].raw.stationid, {
				x: stationPosBuf[i * 2],
				y: stationPosBuf[i * 2 + 1],
			});
		}
	}

	for (let si = 0; si < shipCount; si++) {
		const ship = shipsForInterval[si];
		let x = 0,
			y = 0,
			bearing = ship.bearing || 0,
			visible = 1;

		const key = ship.plan?.id ?? ship.id;
		const plan = plansMap.get(key) ?? ship.plan;

		const flightStatus = getFlightStatus(ship, plan);

		if (isGalaxyViewCached) {
			if (flightStatus.isInterSystem) {
				const pos = calculateShipPositionGalaxy(ship, plan, now, systemsMap);
				if (pos) {
					x = pos[0];
					y = pos[1];
					bearing = pos[2];
				} else visible = 0;
			} else {
				const sys =
					systemsMap.get(ship.addresssystemid || ship.address_system_id) ||
					systemsMap.get(flightStatus.systemId);
				if (sys) {
					x = sys.x;
					y = sys.y;
				} else visible = 0;
			}
		} else {
			if (flightStatus.isInterSystem) {
				visible = 0;
			} else if (
				flightStatus.systemId !== centeredSystemCached?.originalSystemId
			) {
				visible = 0;
			} else {
				const pos = calculateShipPositionInSystem(
					ship,
					plan,
					now,
					targetLookup,
					centeredSystemCached,
				);
				if (pos) {
					x = pos[0];
					y = pos[1];
					bearing = pos[2];
				} else visible = 0;
			}
		}

		if (plan && plan._departureMs && plan._departureMs < now) {
			updatedPlans.push({ ...plan, expired: true });
		}

		shipPosBuf[si * 4 + 0] = x;
		shipPosBuf[si * 4 + 1] = y;
		shipPosBuf[si * 4 + 2] = bearing;
		shipPosBuf[si * 4 + 3] = visible;
	}

	// Trails
	if (now - lastTrailUpdate > TRAIL_UPDATE_MS) regenerateTrails(worldTime);

	// Stats
	const tickEnd = nowMs();
	const duration = tickEnd - tickStart;
	tickTimes[tickIndex % TICK_STATS_LEN] = duration;
	tickIndex++;
	const avg = tickTimes.reduce((a, b) => a + b, 0) / TICK_STATS_LEN;

	const msg: any = {
		type: "tick-update",
		time: Date.now(),
		planetCount,
		stationCount,
		shipCount,
		planetPos: planetPosBuf.buffer,
		planetColor: planetColorBuf.buffer,
		stationPos: stationPosBuf.buffer,
		stationColor: stationColorBuf.buffer,
		shipPos: shipPosBuf.buffer,
		// include trails and workerPlans only when non-empty (reduces allocations on main thread)
		trails: trailCache && trailCache.length > 0 ? trailCache : undefined,
		workerPlans:
			updatedPlans && updatedPlans.length > 0 ? updatedPlans : undefined,
		stats: { duration, avg },
	};

	const transfer = [
		planetPosBuf.buffer,
		planetColorBuf.buffer,
		stationPosBuf.buffer,
		stationColorBuf.buffer,
		shipPosBuf.buffer,
	];

	try {
		(self as any).postMessage(msg, transfer);
		// only flip if transfer succeeded (so we don't later try to read a detached buffer)
		bufferToggle ^= 1;
	} catch (err) {
		// fallback: send clone (may be slower / higher memory) but keep bufferToggle so we retry the same buffers next tick
		msg._error = "transfer-failed";
		delete msg.planetPos;
		delete msg.planetColor;
		delete msg.stationPos;
		delete msg.stationColor;
		delete msg.shipPos;
		(self as any).postMessage(msg);
	}

	// After successful transfer, free large worker-side caches to allow GC
	if (trailCache && trailCache.length > 0) {
		trailCache = [];
	}
}

function ensureInterval() {
	if (!mainIntervalId) {
		mainIntervalId = self.setInterval(
			calculateAndPostEverything,
			UPDATE_INTERVAL_MS,
		);
	}
}

/* ------------------------------------------------------------------ */
/*  onmessage handler (rebuild maps/plans, start/stop interval)       */
/* ------------------------------------------------------------------ */

self.onmessage = function (e: MessageEvent) {
	const d = e.data || {};
	const type = d.type;
	ensureInterval();

	if (type === "init-data") {
		try {
			preparePlanetCache(
				d.payload.planets || [],
				d.payload.stations || [],
				d.payload.centeredSystem || null,
			);
			// Reset systems map if provided
			if (d.payload.systemsPoints && d.payload.systemsPoints.length > 0) {
				systemsMap.clear();
				for (const sys of d.payload.systemsPoints) {
					if (sys.originalSystemId) systemsMap.set(sys.originalSystemId, sys);
				}
			}
			centeredSystemCached = d.payload.centeredSystem || centeredSystemCached;
			isGalaxyViewCached = !!d.payload.isPlanetModeActive; // best effort; init-data may or may not include this
			if (mainIntervalId) clearInterval(mainIntervalId);
			mainIntervalId = setInterval(
				calculateAndPostEverything,
				UPDATE_INTERVAL_MS,
			) as unknown as number;
			calculateAndPostEverything();
		} catch (err) {
			if (DEBUG) console.error(err);
		}
		return;
	}

	if (type === "stop-orbit-interval") {
		if (mainIntervalId) {
			clearInterval(mainIntervalId);
			mainIntervalId = null;
		}
		return;
	}

	if (type === "resume-orbit-interval") {
		ensureInterval();
		return;
	}

	if (type === "update-ships") {
		shipsForInterval = (d.payload?.ships || []).slice();
		plansMap = new Map(
			(d.payload?.activeFlightPlans || []).map((p: any) => {
				if (!(p as any)._arrivalMs) {
					if (p.segments && p.segments.length > 0) {
						(p as any)._arrivalMs = p.segments[p.segments.length - 1].arrival;
						(p as any)._departureMs = p.segments[0].departure;
					} else if (p.arrivaltimestamp) {
						const t1 = Date.parse(p.arrivaltimestamp);
						const t2 = p.departuretimestamp
							? Date.parse(p.departuretimestamp)
							: 0;
						(p as any)._arrivalMs = Math.max(t1, t2);
						(p as any)._departureMs = Math.min(t1, t2);
					}
				}
				return [p.shipid || p.id, p];
			}),
		);

		// Only rebuild systemsMap if sent
		if (d.payload?.systemsPoints && d.payload.systemsPoints.length > 0) {
			systemsMap.clear();
			for (const sys of d.payload.systemsPoints) {
				if (sys.originalSystemId) systemsMap.set(sys.originalSystemId, sys);
			}
		}

		centeredSystemCached = d.payload.centeredSystem || centeredSystemCached;
		isGalaxyViewCached = !!d.payload.isGalaxyView;

		if (!mainIntervalId) {
			mainIntervalId = setInterval(
				calculateAndPostEverything,
				UPDATE_INTERVAL_MS,
			) as unknown as number;
			calculateAndPostEverything();
		}
		return;
	}

	if (type === "update-interval-context") {
		centeredSystemCached = d.centeredSystem || centeredSystemCached;
		isGalaxyViewCached = !!d.isGalaxyView;
		return;
	}

	if (type === "worker-debug") {
		DEBUG = !!d.enabled;
		const avg = tickTimes.reduce((a, b) => a + b, 0) / TICK_STATS_LEN;
		(self as any).postMessage({
			type: "worker-debug-snapshot",
			time: Date.now(),
			stats: { tickAvgMs: avg, shipsCount: shipsForInterval.length },
		});
		return;
	}

	if (type === "set-update-interval") {
		const ms = Number(d.ms) || UPDATE_INTERVAL_MS;
		UPDATE_INTERVAL_MS = ms;
		if (mainIntervalId) {
			clearInterval(mainIntervalId);
			mainIntervalId = setInterval(
				calculateAndPostEverything,
				UPDATE_INTERVAL_MS,
			) as unknown as number;
		}
		return;
	}
};

(self as any).addEventListener &&
	(self as any).addEventListener("close", () => {
		if (mainIntervalId) clearInterval(mainIntervalId);
	});
