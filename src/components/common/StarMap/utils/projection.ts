// utils/projection.ts
import type { MapPoint } from "../types/mapTypes";

/**
 * computeSystemScreens
 * - Projects every system world coordinate once using viewport.project and returns:
 *   { screenMap: Map<string, [screenX, screenY]>, missing: string[] }
 *
 * - Key: quantized world coords "qx,qy" using same QUANT_SCALE as connectionLayer
 *
 * Usage: call this once (or in a memo) when systemsPoints or viewport changes.
 * Keep the screenMap between frames while the viewport projection hasn't changed.
 */

const QUANT_SCALE = 100;

export function computeSystemScreens(systemsPoints: MapPoint[], viewport: any) {
	const screenMap = new Map<string, [number, number]>();
	const missingKeys: string[] = [];

	if (!viewport || typeof viewport.project !== "function") {
		return { screenMap, missingKeys };
	}

	for (let i = 0; i < systemsPoints.length; i++) {
		const s = systemsPoints[i];
		if (!s) continue;
		const x = s.x;
		const y = s.y;
		if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
		const qx = Math.round(x * QUANT_SCALE);
		const qy = Math.round(y * QUANT_SCALE);
		const key = `${qx},${qy}`;

		// Call project once per point
		try {
			const p = viewport.project([x, y]);
			if (
				Array.isArray(p) &&
				p.length >= 2 &&
				Number.isFinite(p[0]) &&
				Number.isFinite(p[1])
			) {
				screenMap.set(key, [p[0], p[1]]);
			} else {
				missingKeys.push(key);
			}
		} catch (e) {
			missingKeys.push(key);
		}
	}

	return { screenMap, missingKeys };
}
