import type { MapPoint } from "../types/maptypes";
import calculateBearing from "./calculatebearing";
import { parseFlightTimestamp as parseTimestamp } from "./timestamputils";

const SCALE_FACTOR_DEFAULT = 5000000000;

export function cleanId(val: any): string {
	return String(val ?? "").toLowerCase().replace(/^(planet-|station-|sys-)/, "").trim();
}

export function matchesLocation(obj: any, targetId: any): boolean {
	if (!obj || targetId === null || targetId === undefined) return false;
	const cleanTarget = cleanId(targetId);
	if (!cleanTarget) return false;
	const candidates = [
		obj.planetid,
		obj.stationid,
		obj.id,
		obj.location_id,
		obj.planet_id,
		obj.station_id,
		obj.name,
	];
	return candidates.some((c) => c !== undefined && c !== null && cleanId(c) === cleanTarget);
}

export function matchesSystem(sys: MapPoint, sysId: any): boolean {
	if (!sys || sysId === null || sysId === undefined) return false;
	const cleanTarget = cleanId(sysId);
	if (!cleanTarget) return false;
	const candidates = [
		sys.originalSystemId,
		sys.id,
		(sys as any).systemId,
		(sys as any).label,
		(sys as any).name,
	];
	return candidates.some((c) => c !== undefined && c !== null && cleanId(c) === cleanTarget);
}

export function calculateShipPositionInSystem(
	ship: any,
	plan: any,
	currentTime: number,
	activePlanets: any[],
	currentSystem: MapPoint | null,
	scaleFactor = SCALE_FACTOR_DEFAULT,
): [number, number, number] | null {
	const currentSysId = currentSystem?.originalSystemId || currentSystem?.id;
	const shipSysId = ship.addresssystemid || ship.systemid || ship.system_id || ship.address_system_id;

	if (!plan || !Array.isArray(plan.segments) || plan.segments.length === 0) {
		const targetId =
			ship.addressplanetid ??
			ship.addressstationid ??
			ship.address_planet_id ??
			ship.address_station_id ??
			ship.planetid ??
			ship.stationid;
		if (targetId) {
			const target = activePlanets.find((p) => matchesLocation(p, targetId));
			if (target && typeof target.x === "number" && typeof target.y === "number")
				return [target.x, target.y, ship.bearing || 0];
		}

		if (
			currentSystem &&
			shipSysId &&
			currentSysId &&
			cleanId(shipSysId) === cleanId(currentSysId)
		) {
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
		const segType = (activeSegment.segment_type || "").toUpperCase();
		const segOrigSys = String(
			activeSegment.origin_system_id || activeSegment.origin_system || activeSegment.originsystemid || "",
		).toLowerCase();
		const segDestSys = String(
			activeSegment.destination_system_id || activeSegment.destination_system || activeSegment.destinationsystemid || "",
		).toLowerCase();
		const curSys = String(currentSysId || "").toLowerCase();

		// FTL jump / JUMP segment or inter-system flight is in hyperspace/galaxy view, not in-system
		if (
			segType === "JUMP" ||
			segType === "CHARGE" ||
			(segOrigSys && segDestSys && cleanId(segOrigSys) !== cleanId(segDestSys))
		) {
			return null;
		}

		// If current segment is in another system entirely
		if (curSys && segOrigSys && segDestSys && cleanId(segOrigSys) !== cleanId(curSys) && cleanId(segDestSys) !== cleanId(curSys)) {
			return null;
		}
	} else {
		// No segment currently in [dep, arr]. Check if the flight is already in progress
		const firstSeg = plan.segments[0];
		const lastSeg = plan.segments[plan.segments.length - 1];
		const firstDep = parseTimestamp(firstSeg?.departure);
		const lastArr = parseTimestamp(lastSeg?.arrival);

		if (firstDep > 0 && currentTime < firstDep) {
			// Ship hasn't departed yet: check if origin is in this system
			const origSysId = String(
				firstSeg?.originsystemid || firstSeg?.origin_system_id || firstSeg?.origin_system || plan?.originsystemid || shipSysId || "",
			).toLowerCase();
			const curSys = String(currentSysId || "").toLowerCase();
			if (curSys && origSysId && cleanId(origSysId) !== cleanId(curSys)) {
				return null;
			}
			const origId =
				firstSeg?.originplanetid ||
				firstSeg?.originstationid ||
				firstSeg?.origin_location_id ||
				firstSeg?.origin_planet_id ||
				firstSeg?.origin_station_id ||
				plan?.originplanetid ||
				plan?.originstationid ||
				ship.addressplanetid ||
				ship.addressstationid ||
				ship.address_planet_id ||
				ship.address_station_id;
			const origObj = activePlanets.find((p) => matchesLocation(p, origId));
			if (origObj && typeof origObj.x === "number" && typeof origObj.y === "number") {
				return [origObj.x, origObj.y, ship.bearing || 0];
			}
			if (currentSystem && cleanId(origSysId) === cleanId(curSys)) {
				return [currentSystem.x, currentSystem.y, ship.bearing || 0];
			}
			return null;
		}

		if (lastArr > 0 && currentTime >= lastArr) {
			// Flight completed: check if destination is in this system
			const destSysId = String(
				lastSeg?.destinationsystemid || lastSeg?.destination_system_id || lastSeg?.destination_system || plan?.destinationsystemid || "",
			).toLowerCase();
			const curSys = String(currentSysId || "").toLowerCase();
			if (curSys && destSysId && cleanId(destSysId) !== cleanId(curSys)) {
				return null;
			}
			const destId =
				lastSeg?.destinationplanetid ||
				lastSeg?.destinationstationid ||
				lastSeg?.destination_location_id ||
				lastSeg?.destination_planet_id ||
				lastSeg?.destination_station_id ||
				plan?.destinationplanetid ||
				plan?.destinationstationid ||
				ship.addressplanetid ||
				ship.addressstationid ||
				ship.address_planet_id ||
				ship.address_station_id;
			const destObj = activePlanets.find((p) => matchesLocation(p, destId));
			if (destObj && typeof destObj.x === "number" && typeof destObj.y === "number") {
				return [destObj.x, destObj.y, ship.bearing || 0];
			}
			if (currentSystem && cleanId(destSysId) === cleanId(curSys)) {
				return [currentSystem.x, currentSystem.y, ship.bearing || 0];
			}
			return null;
		}

		// Between segments during flight: find the next segment or previous segment
		const upcomingSeg = plan.segments.find((s: any) => parseTimestamp(s.departure) > currentTime);
		if (upcomingSeg) {
			const upcomingType = (upcomingSeg.segment_type || "").toUpperCase();
			const upOrigSys = String(upcomingSeg.originsystemid || upcomingSeg.origin_system_id || upcomingSeg.origin_system || "").toLowerCase();
			const curSys = String(currentSysId || "").toLowerCase();
			if (upcomingType === "JUMP" || (curSys && upOrigSys && cleanId(upOrigSys) !== cleanId(curSys))) {
				return null;
			}
		}
		return null;
	}

	const dep = parseTimestamp(activeSegment.departure);
	const arr = parseTimestamp(activeSegment.arrival);
	const duration = arr - dep;
	const t =
		duration > 0
			? Math.min(1.0, Math.max(0, (currentTime - dep) / duration))
			: 1;

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
		const origId =
			activeSegment.originplanetid ||
			activeSegment.originstationid ||
			activeSegment.origin_location_id ||
			activeSegment.origin_planet_id ||
			activeSegment.origin_station_id;
		const planet = activePlanets.find((p) => matchesLocation(p, origId));
		if (planet && typeof planet.x === "number" && typeof planet.y === "number")
			return [planet.x, planet.y, ship.bearing || 0];
	}

	const origId =
		activeSegment.originplanetid ||
		activeSegment.originstationid ||
		activeSegment.origin_location_id ||
		activeSegment.origin_planet_id ||
		activeSegment.origin_station_id;
	const destId =
		activeSegment.destinationplanetid ||
		activeSegment.destinationstationid ||
		activeSegment.destination_location_id ||
		activeSegment.destination_planet_id ||
		activeSegment.destination_station_id;
	const origTgt = activePlanets.find((p) => matchesLocation(p, origId));
	const destTgt = activePlanets.find((p) => matchesLocation(p, destId));

	if (
		origTgt &&
		destTgt &&
		typeof origTgt.x === "number" &&
		typeof destTgt.x === "number"
	) {
		const x = origTgt.x + (destTgt.x - origTgt.x) * t;
		const y = origTgt.y + (destTgt.y - origTgt.y) * t;
		const bearing = calculateBearing([x, y], [destTgt.x, destTgt.y]);
		return [x, y, bearing];
	}

	if (destTgt && typeof destTgt.x === "number" && typeof destTgt.y === "number")
		return [destTgt.x, destTgt.y, ship.bearing || 0];

	if (origTgt && typeof origTgt.x === "number" && typeof origTgt.y === "number")
		return [origTgt.x, origTgt.y, ship.bearing || 0];

	return currentSystem
		? [currentSystem.x, currentSystem.y, ship.bearing || 0]
		: null;
}

export function calculateShipPositionGalaxy(
	ship: any,
	plan: any,
	currentTime: number,
	systemsPoints: MapPoint[],
): [number, number, number] | null {
	if (!plan || !Array.isArray(plan.segments) || plan.segments.length === 0) {
		const sysId = ship.addresssystemid || ship.systemid || ship.system_id;
		const currentSystemPoint = systemsPoints.find((p) => matchesSystem(p, sysId));
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
		const firstSeg = plan.segments[0];
		const firstDep = parseTimestamp(firstSeg?.departure);
		if (firstDep > 0 && currentTime < firstDep) {
			const origSysId =
				firstSeg.originsystemid ||
				firstSeg.origin_system_id ||
				firstSeg.origin_system ||
				plan?.originsystemid ||
				ship.addresssystemid;
			const sys = systemsPoints.find((p) => matchesSystem(p, origSysId));
			if (sys) return [sys.x, sys.y, ship.bearing || 0];
		}

		const upcomingSeg = plan.segments.find(
			(s: any) => parseTimestamp(s.departure) > currentTime,
		);
		if (upcomingSeg) {
			const upSysId =
				upcomingSeg.originsystemid ||
				upcomingSeg.origin_system_id ||
				upcomingSeg.origin_system;
			const sys = systemsPoints.find((p) => matchesSystem(p, upSysId));
			if (sys) return [sys.x, sys.y, ship.bearing || 0];
		}

		const fallbackSysId =
			plan?.originsystemid ||
			plan?.destinationsystemid ||
			ship.addresssystemid ||
			ship.systemid ||
			ship.system_id;
		const sys = systemsPoints.find((p) => matchesSystem(p, fallbackSysId));
		return sys ? [sys.x, sys.y, ship.bearing || 0] : null;
	}

	const origSysId =
		activeSegment.originsystemid ||
		activeSegment.origin_system_id ||
		(activeSegment as any).origin_system;
	const destSysId =
		activeSegment.destinationsystemid ||
		activeSegment.destination_system_id ||
		(activeSegment as any).destination_system;

	const startSystem = systemsPoints.find((p) => matchesSystem(p, origSysId));
	const endSystem = systemsPoints.find((p) => matchesSystem(p, destSysId));

	if (!startSystem || !endSystem) {
		const fallbackSys = startSystem || endSystem;
		return fallbackSys
			? [fallbackSys.x, fallbackSys.y, ship.bearing || 0]
			: null;
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

export function getShipFlightStatus(ship: any, plan: any, currentTime = Date.now()) {
	if (!plan || !plan.segments || !Array.isArray(plan.segments) || plan.segments.length === 0) {
		return {
			isInterSystem: false,
			systemId: ship?.addresssystemid || ship?.systemid || ship?.system_id || null,
		};
	}

	const activeSegment = plan.segments.find((s: any) => {
		const dep = parseTimestamp(s.departure);
		const arr = parseTimestamp(s.arrival);
		return currentTime >= dep && currentTime < arr;
	});

	if (activeSegment) {
		const segType = (activeSegment.segment_type || "").toUpperCase();
		const origSys =
			activeSegment.originsystemid ||
			activeSegment.origin_system_id ||
			(activeSegment as any).origin_system;
		const destSys =
			activeSegment.destinationsystemid ||
			activeSegment.destination_system_id ||
			(activeSegment as any).destination_system;
		if (
			segType === "JUMP" ||
			segType === "CHARGE" ||
			(origSys && destSys && cleanId(origSys) !== cleanId(destSys))
		) {
			return {
				isInterSystem: true,
				origin: origSys,
				dest: destSys,
			};
		}
		return { isInterSystem: false, systemId: origSys || destSys };
	}

	const firstSeg = plan.segments[0];
	const lastSeg = plan.segments[plan.segments.length - 1];
	const firstDep = parseTimestamp(firstSeg?.departure);
	const lastArr = parseTimestamp(lastSeg?.arrival);

	if (firstDep > 0 && currentTime < firstDep) {
		return {
			isInterSystem: false,
			systemId:
				firstSeg.originsystemid ||
				firstSeg.origin_system_id ||
				firstSeg.origin_system ||
				plan?.originsystemid ||
				ship?.addresssystemid ||
				null,
		};
	}

	if (lastArr > 0 && currentTime >= lastArr) {
		return {
			isInterSystem: false,
			systemId:
				lastSeg.destinationsystemid ||
				lastSeg.destination_system_id ||
				lastSeg.destination_system ||
				lastSeg.originsystemid ||
				lastSeg.origin_system_id ||
				plan?.destinationsystemid ||
				ship?.addresssystemid ||
				null,
		};
	}

	const upcomingSeg = plan.segments.find(
		(s: any) => parseTimestamp(s.departure) > currentTime,
	);
	if (upcomingSeg) {
		const upOrigSys =
			upcomingSeg.originsystemid ||
			upcomingSeg.origin_system_id ||
			upcomingSeg.origin_system;
		return {
			isInterSystem: false,
			systemId: upOrigSys || ship?.addresssystemid || null,
		};
	}

	return {
		isInterSystem: false,
		systemId: ship?.addresssystemid || ship?.systemid || ship?.system_id || null,
	};
}

