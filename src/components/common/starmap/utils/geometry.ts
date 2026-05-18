import type { XY } from "../types/maptypes";

export const calculateCentroid = (pts: XY[]): XY => {
	if (!pts || pts.length === 0) return [0, 0];
	let sx = 0,
		sy = 0;
	for (const [x, y] of pts) {
		sx += x;
		sy += y;
	}
	return [sx / pts.length, sy / pts.length];
};

export const cross = (o: XY, a: XY, b: XY) =>
	(a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

export const convexHull = (pts: XY[]) => {
	if (!pts || pts.length <= 3) return pts.slice();
	const s = pts
		.slice()
		.sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
	const lower: XY[] = [];
	for (const p of s) {
		while (
			lower.length >= 2 &&
			cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
		)
			lower.pop();
		lower.push(p);
	}
	const upper: XY[] = [];
	for (let i = s.length - 1; i >= 0; i--) {
		const p = s[i];
		while (
			upper.length >= 2 &&
			cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
		)
			upper.pop();
		upper.push(p);
	}
	lower.pop();
	upper.pop();
	return lower.concat(upper);
};

export const densifyPolygon = (poly: XY[], targetSegmentLength = 18) => {
	if (!poly || poly.length < 2) return poly.slice();
	const out: XY[] = [];
	for (let i = 0; i < poly.length; i++) {
		const a = poly[i];
		const b = poly[(i + 1) % poly.length];
		const dx = b[0] - a[0],
			dy = b[1] - a[1];
		const segLen = Math.hypot(dx, dy);
		const n = Math.max(1, Math.ceil(segLen / targetSegmentLength));
		for (let k = 0; k < n; k++) {
			const t = k / n;
			out.push([a[0] + dx * t, a[1] + dy * t]);
		}
	}
	return out;
};

export const chaikinSmooth = (poly: XY[], passes = 2) => {
	if (!poly || poly.length < 3) return poly.slice();
	let pts = poly.slice();
	for (let pass = 0; pass < passes; pass++) {
		const newPts: XY[] = [];
		for (let i = 0; i < pts.length; i++) {
			const a = pts[i],
				b = pts[(i + 1) % pts.length];
			newPts.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
			newPts.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
		}
		pts = newPts;
	}
	return pts;
};

export const pointInPolygon = (pt: XY, poly: XY[]) => {
	const [x, y] = pt;
	let inside = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const xi = poly[i][0],
			yi = poly[i][1];
		const xj = poly[j][0],
			yj = poly[j][1];
		const intersect =
			yi > y !== yj > y &&
			x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
};

// Define the shape for the system boundary/asteroid field
export function createCirclePolygon(
	center: [number, number],
	radius: number,
	numSegments = 64,
): [number, number][] {
	const path: [number, number][] = [];
	for (let i = 0; i <= numSegments; i++) {
		const theta = (i / numSegments) * (Math.PI * 2);
		const x = center[0] + radius * Math.cos(theta);
		const y = center[1] + radius * Math.sin(theta);
		path.push([x, y]);
	}
	return path;
}
