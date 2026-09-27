/**
 * Utility for parsing and guarding flight & telemetry timestamps across PUNoted.
 * Ensures ISO string timestamps missing explicit timezone offsets default to UTC ('Z')
 * rather than browser local timezone.
 */

export function parseFlightTimestamp(val: any): number {
	if (val === null || val === undefined) return 0;
	if (typeof val === "number") {
		if (Number.isNaN(val)) return 0;
		// If timestamp is in seconds (10 digits), convert to milliseconds
		if (val > 0 && val < 10000000000) return val * 1000;
		return val;
	}
	if (typeof val === "string") {
		const trimmed = val.trim();
		if (!trimmed) return 0;

		const num = Number(trimmed);
		if (!Number.isNaN(num)) {
			if (num > 0 && num < 10000000000) return num * 1000;
			return num;
		}

		// If ISO string without timezone offset (+00:00 or Z), force UTC 'Z'
		let isoStr = trimmed;
		if (!isoStr.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(isoStr)) {
			isoStr += "Z";
		}
		const parsed = Date.parse(isoStr);
		return Number.isNaN(parsed) ? 0 : parsed;
	}
	if (typeof val === "object") {
		if (val.timestamp) return parseFlightTimestamp(val.timestamp);
		if (val.epoch) return parseFlightTimestamp(val.epoch);
		if (val.millis) return parseFlightTimestamp(val.millis);
	}
	return 0;
}

export function getFlightArrivalMs(plan: any): number {
	if (!plan) return 0;
	if (Array.isArray(plan.segments) && plan.segments.length > 0) {
		const lastSeg = plan.segments[plan.segments.length - 1];
		if (lastSeg && lastSeg.arrival) {
			return parseFlightTimestamp(lastSeg.arrival);
		}
	}
	if (plan._arrivalMs) return parseFlightTimestamp(plan._arrivalMs);
	if (plan.arrivaltimestamp) return parseFlightTimestamp(plan.arrivaltimestamp);
	if (plan.arrival_timestamp) return parseFlightTimestamp(plan.arrival_timestamp);
	if (plan.arrival) return parseFlightTimestamp(plan.arrival);
	return 0;
}

export function getFlightDepartureMs(plan: any): number {
	if (!plan) return 0;
	if (Array.isArray(plan.segments) && plan.segments.length > 0) {
		const firstSeg = plan.segments[0];
		if (firstSeg && firstSeg.departure) {
			return parseFlightTimestamp(firstSeg.departure);
		}
	}
	if (plan._departureMs) return parseFlightTimestamp(plan._departureMs);
	if (plan.departuretimestamp) return parseFlightTimestamp(plan.departuretimestamp);
	if (plan.departure_timestamp) return parseFlightTimestamp(plan.departure_timestamp);
	if (plan.departure) return parseFlightTimestamp(plan.departure);
	return 0;
}
