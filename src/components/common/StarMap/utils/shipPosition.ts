import type { MapPoint } from "../types/mapTypes";
import calculateBearing from "./calculateBearing";
const SCALE_FACTOR_DEFAULT = 5000000;
export function calculateShipPositionInSystem(
	ship: any,
	plan: any,
	currentTime: number,
	activePlanets: any[],
	currentSystem: MapPoint | null,
	scaleFactor = SCALE_FACTOR_DEFAULT,
): [number, number] | null {
	if (!plan || !Array.isArray(plan.segments) || plan.segments.length === 0) {
		const targetId = ship.addressplanetid ?? ship.addressstationid;
		const target = activePlanets.find((p) => p.planetid === targetId);
		if (target && typeof target.x === "number" && typeof target.y === "number")
			return [target.x, target.y];
		return null;
	}

	const activeSegment = plan.segments.find(
		(s: any) => currentTime >= s.departure && currentTime < s.arrival,
	);
	if (!activeSegment) {
		const last = plan.segments[plan.segments.length - 1];
		const dest = activePlanets.find(
			(p) => p.planetid === last?.destination_location_id,
		);
		if (dest && typeof dest.x === "number" && typeof dest.y === "number")
			return [dest.x, dest.y];
		return null;
	}

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
			return null;
		}
		if (!transfer) return null;

		const systemMapX = currentSystem?.x ?? 0;
		const systemMapY = currentSystem?.y ?? 0;
		const duration = activeSegment.arrival - activeSegment.departure;
		const t =
			duration > 0
				? Math.min(
						1,
						Math.max(0, (currentTime - activeSegment.departure) / duration),
					)
				: 1;

		const sx_m = Number(transfer.startpositionx);
		const sy_m = Number(transfer.startpositiony);
		const tx_m = Number(transfer.targetpositionx);
		const ty_m = Number(transfer.targetpositiony);
		if ([sx_m, sy_m, tx_m, ty_m].some((v) => Number.isNaN(v))) return null;

		const curX_m = sx_m * (1 - t) + tx_m * t;
		const curY_m = sy_m * (1 - t) + ty_m * t;
		return [
			systemMapX + curX_m / scaleFactor,
			systemMapY - curY_m / scaleFactor,
		];
	}

	if (activeSegment.segment_type === "TAKE_OFF") {
		const planet = activePlanets.find(
			(p) => p.planetid === activeSegment.origin_location_id,
		);
		if (planet && typeof planet.x === "number" && typeof planet.y === "number")
			return [planet.x, planet.y];
		return null;
	}

	if (
		activeSegment.segment_type === "JUMP" ||
		activeSegment.segment_type === "CHARGE"
	)
		return null;

	const tgt = activePlanets.find(
		(p) => p.planetid === activeSegment.destination_location_id,
	);
	if (tgt && typeof tgt.x === "number" && typeof tgt.y === "number")
		return [tgt.x, tgt.y];
	return null;
}

export function calculateShipPositionGalaxy(
	ship: any,
	plan: any,
	currentTime: number,
	systemsPoints: MapPoint[],
): [number, number, number] | null {
	if (!plan || !Array.isArray(plan.segments) || plan.segments.length === 0) {
		const currentSystemPoint = systemsPoints.find(
			(p) => p.originalSystemId === ship.addresssystemid,
		);
		return currentSystemPoint
			? [currentSystemPoint.x, currentSystemPoint.y, ship.bearing || 0]
			: null;
	}

	const activeSegment = plan.segments.find(
		(s: any) => currentTime >= s.departure && currentTime < s.arrival,
	);
	if (!activeSegment) {
		return null;
	}

	const startSystem = systemsPoints.find(
		(p) => p.originalSystemId === activeSegment.origin_system_id,
	);
	const endSystem = systemsPoints.find(
		(p) => p.originalSystemId === activeSegment.destination_system_id,
	);

	if (!startSystem || !endSystem) {
		return null;
	}

	const startCoords = [startSystem.x, startSystem.y];
	const endCoords = [endSystem.x, endSystem.y];

	const duration = activeSegment.arrival - activeSegment.departure;
	if (duration <= 0) {
		return [endCoords[0], endCoords[1], 0];
	}

	const elapsed = currentTime - activeSegment.departure;
	const progress = Math.min(1.0, elapsed / duration);

	const startX = startCoords[0];
	const startY = startCoords[1];
	const endX = endCoords[0];
	const endY = endCoords[1];

	const currentX = startX + (endX - startX) * progress;
	const currentY = startY + (endY - startY) * progress;

	const bearing = calculateBearing(
		[currentX, currentY],
		[endCoords[0], endCoords[1]],
	);

	//console.log(`[ShipPositionGalaxy] Ship ${ship.id} at time ${currentTime}: (${currentX}, ${currentY}) bearing ${bearing}`);

	return [currentX, currentY, bearing];
}
