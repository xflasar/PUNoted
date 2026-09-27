import type { MapPoint } from "../types/maptypes";
import calculateBearing from "./calculatebearing";
import { parseFlightTimestamp as parseTimestamp } from "./timestamputils";

const SCALE_FACTOR_DEFAULT = 5000000;

export function calculateShipPositionInSystem(
	ship: any,
	plan: any,
	currentTime: number,
	activePlanets: any[],
	currentSystem: MapPoint | null,
	scaleFactor = SCALE_FACTOR_DEFAULT,
): [number, number, number] | null {
	const currentSysId = currentSystem?.originalSystemId || currentSystem?.id;
	const shipSysId =
		ship.addresssystemid ??
		ship.address_system_id ??
		ship.systemid ??
		ship.system_id ??
		ship.addressSystemId;

	if (!plan || !Array.isArray(plan.segments) || plan.segments.length === 0) {
		const targetId =
			ship.addressplanetid ??
			ship.addressstationid ??
			ship.address_planet_id ??
			ship.address_station_id;
		const target = activePlanets.find(
			(p) => p.planetid === targetId || (p as any).stationid === targetId,
		);
		if (target && typeof target.x === "number" && typeof target.y === "number")
			return [target.x, target.y, ship.bearing || 0];

		if (currentSystem && shipSysId && currentSysId && shipSysId === currentSysId) {
			return [currentSystem.x, currentSystem.y, ship.bearing || 0];
		}
		return null;
	}

	const activeSegment = plan.segments.find((s: any) => {
		const dep = parseTimestamp(s.departure);
		const arr = parseTimestamp(s.arrival);
		return currentTime >= dep && currentTime < arr;
	});

	if (activeSegment) {
		const segOrigSys = activeSegment.origin_system_id || activeSegment.origin_system;
		const segDestSys = activeSegment.destination_system_id || activeSegment.destination_system;
		if (
			currentSysId &&
			segOrigSys &&
			segDestSys &&
			segOrigSys !== currentSysId &&
			segDestSys !== currentSysId
		) {
			return null;
		}
	}

	if (!activeSegment) {
		const last = plan.segments[plan.segments.length - 1];
		const destId =
			last?.destination_location_id ||
			last?.destination_planet_id ||
			last?.destination_station_id;
		const dest = activePlanets.find(
			(p) => p.planetid === destId || (p as any).stationid === destId,
		);
		if (dest && typeof dest.x === "number" && typeof dest.y === "number")
			return [dest.x, dest.y, ship.bearing || 0];

		if (currentSystem && shipSysId && currentSysId && shipSysId === currentSysId) {
			return [currentSystem.x, currentSystem.y, ship.bearing || 0];
		}
		return null;
	}

	const dep = parseTimestamp(activeSegment.departure);
	const arr = parseTimestamp(activeSegment.arrival);
	const duration = arr - dep;
	const t = duration > 0 ? Math.min(1.0, Math.max(0, (currentTime - dep) / duration)) : 1;

	if (
		activeSegment.segment_type === "APPROACH" ||
		activeSegment.segment_type === "DEPARTURE"
	) {
		let transfer: any = null;
		try {
			transfer =
				typeof activeSegment.transferellipse === "string"
					? JSON.parse(activeSegment.transferellipse)
					: activeSegment.transferellipse;
		} catch {
			transfer = null;
		}

		if (transfer) {
			const systemMapX = currentSystem?.x ?? 0;
			const systemMapY = currentSystem?.y ?? 0;

			const sx_m = Number(transfer.startpositionx);
			const sy_m = Number(transfer.startpositiony);
			const tx_m = Number(transfer.targetpositionx);
			const ty_m = Number(transfer.targetpositiony);
			if (![sx_m, sy_m, tx_m, ty_m].some((v) => Number.isNaN(v))) {
				const curX_m = sx_m * (1 - t) + tx_m * t;
				const curY_m = sy_m * (1 - t) + ty_m * t;

				const bearing = calculateBearing(
					[systemMapX + sx_m / scaleFactor, systemMapY - sy_m / scaleFactor],
					[systemMapX + tx_m / scaleFactor, systemMapY - ty_m / scaleFactor],
				);

				return [
					systemMapX + curX_m / scaleFactor,
					systemMapY - curY_m / scaleFactor,
					bearing,
				];
			}
		}
	}

	if (activeSegment.segment_type === "TAKE_OFF") {
		const planet = activePlanets.find(
			(p) => p.planetid === (activeSegment.origin_location_id || activeSegment.origin_planet_id),
		);
		if (planet && typeof planet.x === "number" && typeof planet.y === "number")
			return [planet.x, planet.y, ship.bearing || 0];
	}

	const origId = activeSegment.origin_location_id || activeSegment.origin_planet_id || activeSegment.origin_station_id;
	const destId = activeSegment.destination_location_id || activeSegment.destination_planet_id || activeSegment.destination_station_id;
	const origTgt = activePlanets.find((p) => p.planetid === origId);
	const destTgt = activePlanets.find((p) => p.planetid === destId);

	if (origTgt && destTgt && typeof origTgt.x === "number" && typeof destTgt.x === "number") {
		const x = origTgt.x + (destTgt.x - origTgt.x) * t;
		const y = origTgt.y + (destTgt.y - origTgt.y) * t;
		const bearing = calculateBearing([x, y], [destTgt.x, destTgt.y]);
		return [x, y, bearing];
	}

	if (destTgt && typeof destTgt.x === "number" && typeof destTgt.y === "number")
		return [destTgt.x, destTgt.y, ship.bearing || 0];

	if (origTgt && typeof origTgt.x === "number" && typeof origTgt.y === "number")
		return [origTgt.x, origTgt.y, ship.bearing || 0];

	return currentSystem ? [currentSystem.x, currentSystem.y, ship.bearing || 0] : null;
}

export function calculateShipPositionGalaxy(
	ship: any,
	plan: any,
	currentTime: number,
	systemsPoints: MapPoint[],
): [number, number, number] | null {
	if (!plan || !Array.isArray(plan.segments) || plan.segments.length === 0) {
		const sysId = ship.addresssystemid || ship.address_system_id;
		const currentSystemPoint = systemsPoints.find(
			(p) => p.originalSystemId === sysId,
		);
		return currentSystemPoint
			? [currentSystemPoint.x, currentSystemPoint.y, ship.bearing || 0]
			: null;
	}

	const activeSegment = plan.segments.find((s: any) => {
		const dep = parseTimestamp(s.departure);
		const arr = parseTimestamp(s.arrival);
		return currentTime >= dep && currentTime < arr;
	});

	if (!activeSegment) {
		const lastSeg = plan.segments[plan.segments.length - 1];
		const lastArr = parseTimestamp(lastSeg.arrival);
		if (lastArr > 0 && currentTime >= lastArr) {
			const destSysId = lastSeg.destination_system_id || lastSeg.origin_system_id;
			const sys = systemsPoints.find((p) => p.originalSystemId === destSysId);
			if (sys) return [sys.x, sys.y, ship.bearing || 0];
		}
		const sysId = ship.addresssystemid || ship.address_system_id;
		const sys = systemsPoints.find((p) => p.originalSystemId === sysId);
		return sys ? [sys.x, sys.y, ship.bearing || 0] : null;
	}

	const origSysId = activeSegment.origin_system_id || (activeSegment as any).origin_system;
	const destSysId = activeSegment.destination_system_id || (activeSegment as any).destination_system;

	const startSystem = systemsPoints.find((p) => p.originalSystemId === origSysId);
	const endSystem = systemsPoints.find((p) => p.originalSystemId === destSysId);

	if (!startSystem || !endSystem) {
		const fallbackSys = startSystem || endSystem;
		return fallbackSys ? [fallbackSys.x, fallbackSys.y, ship.bearing || 0] : null;
	}

	const dep = parseTimestamp(activeSegment.departure);
	const arr = parseTimestamp(activeSegment.arrival);
	const duration = arr - dep;
	if (duration <= 0) {
		return [endSystem.x, endSystem.y, 0];
	}

	const elapsed = currentTime - dep;
	const progress = Math.min(1.0, Math.max(0, elapsed / duration));

	const currentX = startSystem.x + (endSystem.x - startSystem.x) * progress;
	const currentY = startSystem.y + (endSystem.y - startSystem.y) * progress;

	const bearing = calculateBearing(
		[currentX, currentY],
		[endSystem.x, endSystem.y],
	);

	return [currentX, currentY, bearing];
}
