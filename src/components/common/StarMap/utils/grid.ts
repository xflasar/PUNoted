import type { MapPoint, Edge } from "../types/mapTypes";

const CACHE_PREFIX = "LAYOUT_CACHE_";

// Utility function to generate a consistent, short hash from a string (for the cache key)
function simpleHash(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash |= 0; // Convert to 32bit integer
	}
	return Math.abs(hash).toString(36);
}

// Generates a stable key based on all inputs that affect the layout result.
function getCacheKey(systems: MapPoint[], edges: Edge[], opts: any): string {
	// 1. Collect unique, sorted IDs of all systems
	const systemIds = systems
		.map((s) => s.originalSystemId || s.id)
		.sort()
		.join("|");

	// 2. Collect sorted edge definitions (origin-destination)
	const edgeDefs = edges
		.map((e) => [e.systemidorigin, e.systemiddestination].sort().join("-"))
		.sort()
		.join("|");

	// 3. Combine layout parameters
	const params = [
		`CELL:${opts.cellSize}`,
		`SEP:${opts.minSeparation}`,
		`LINE:${opts.minLineSeparation}`,
		`MAXITER:${opts.maxIterations}`,
	].join("|");

	const rawKey = `${systemIds}##${edgeDefs}##${params}`;
	return simpleHash(rawKey);
}

// --- UTILITY FUNCTIONS (same as previous optimized version) ---

export function buildSystemGrid(systems: MapPoint[], cellSize = 40) {
	const grid = new Map<string, MapPoint[]>();
	for (const system of systems) {
		const gridX = Math.floor(system.x / cellSize);
		const gridY = Math.floor(system.y / cellSize);
		const key = `${gridX},${gridY}`;
		if (!grid.has(key)) grid.set(key, []);
		grid.get(key)!.push(system);
	}
	return grid;
}

/**
 * Maps edges to the grid cells they cross using a simplified line rasterization.
 */
function buildEdgeGrid(edges: any[], cellSize: number) {
	const edgeGrid = new Map<string, any[]>();
	for (const edge of edges) {
		let x0 = Math.floor(edge.ax / cellSize);
		let y0 = Math.floor(edge.ay / cellSize);
		const x1 = Math.floor(edge.bx / cellSize);
		const y1 = Math.floor(edge.by / cellSize);

		const dx = Math.abs(x1 - x0);
		const dy = Math.abs(y1 - y0);
		const sx = x0 < x1 ? 1 : -1;
		const sy = y0 < y1 ? 1 : -1;
		let err = dx - dy;

		while (true) {
			const key = `${x0},${y0}`;
			if (!edgeGrid.has(key)) edgeGrid.set(key, []);
			edgeGrid.get(key)!.push(edge);

			if (x0 === x1 && y0 === y1) break;
			const e2 = 2 * err;
			if (e2 > -dy) {
				err -= dy;
				x0 += sx;
			}
			if (e2 < dx) {
				err += dx;
				y0 += sy;
			}
		}
	}
	return edgeGrid;
}

/**
 * Calculates the shortest distance and closest point on a line segment (a, b) to a point (p).
 */
function distanceToSegment(
	ax: number,
	ay: number,
	bx: number,
	by: number,
	px: number,
	py: number,
): { distance: number; cx: number; cy: number } {
	const dx = bx - ax;
	const dy = by - ay;
	const lenSq = dx * dx + dy * dy;

	let t = 0;
	if (lenSq !== 0) {
		t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
	}

	t = Math.max(0, Math.min(1, t));

	const cx = ax + t * dx;
	const cy = ay + t * dy;
	const distance = Math.hypot(px - cx, py - cy);

	return { distance, cx, cy };
}

// --- MAIN ASYNC/FALLBACK FUNCTION WITH CACHING ---

export async function resolveInitialOverlapsAsync(
	systems: MapPoint[],
	edges: Edge[],
	opts?: {
		cellSize?: number;
		minSeparation?: number;
		maxIterations?: number;
		minLineSeparation?: number;
	},
): Promise<{
	adjusted: MapPoint[];
	bounds: { minX: number; minY: number; maxX: number; maxY: number };
}> {
	const cellSize = opts?.cellSize ?? 40;
	const minSeparation = opts?.minSeparation ?? 20;
	const maxIterations = opts?.maxIterations ?? 100;
	const minLineSeparation = opts?.minLineSeparation ?? 10;

	const finalOpts = {
		cellSize,
		minSeparation,
		maxIterations,
		minLineSeparation,
	};
	const cacheKey = getCacheKey(systems, edges, finalOpts);

	// 1. CHECK CACHE
	try {
		const cachedData = localStorage.getItem(CACHE_PREFIX + cacheKey);
		if (cachedData) {
			const parsed = JSON.parse(cachedData);
			// Basic check for data integrity
			if (
				parsed.adjusted &&
				parsed.bounds &&
				parsed.adjusted.length === systems.length
			) {
				return parsed;
			}
		}
	} catch (e) {
		// console.error("Cache read failed, recalculating:", e);
		// If cache read or parse fails, we continue to calculate
	}

	// Map system IDs to positions for quick edge lookups
	const systemMap = new Map<string, MapPoint>();
	for (const s of systems) {
		if (s.originalSystemId) systemMap.set(s.originalSystemId, s);
	}

	// Pre-process edges to contain coordinates based on the current system positions
	const edgesWithCoords = edges
		.map((c) => {
			const origin = systemMap.get(c.systemidorigin);
			const destination = systemMap.get(c.systemiddestination);
			if (origin && destination) {
				return {
					id: `${c.systemidorigin}-${c.systemiddestination}`,
					systemidorigin: c.systemidorigin,
					systemiddestination: c.systemiddestination,
					ax: origin.x,
					ay: origin.y,
					bx: destination.x,
					by: destination.y,
				};
			}
			return null;
		})
		.filter((e): e is NonNullable<typeof e> => e !== null);

	// 2. RUN CALCULATION (Worker or Synchronous Fallback)
	try {
		// Pass finalOpts to the worker
		// @ts-ignore
		const worker = new Worker(
			new URL("../workers/gridWorker.ts", import.meta.url),
			{ type: "module" },
		);
		const result = await new Promise<{ adjusted: MapPoint[]; bounds: any }>(
			(resolve, reject) => {
				// Define cleanup helper
				const cleanup = () => {
					// CRITICAL: Remove the listeners from the Worker object
					worker.removeEventListener("message", onMessage);
					worker.removeEventListener("error", onError);
					// Now terminate the thread
					worker.terminate();
				};

				const onMessage = (ev: MessageEvent) => {
					cleanup();
					resolve(ev.data);
				};
				const onError = (e: ErrorEvent) => {
					cleanup();
					reject(e);
				};

				// Attach listeners
				worker.addEventListener("message", onMessage);
				worker.addEventListener("error", onError);

				worker.postMessage({ systems, edges, ...finalOpts });
			},
		);

		// 3. CACHE RESULT (if worker was successful)
		try {
			localStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(result));
		} catch (e) {
			// console.warn("Could not cache layout result (likely size limit hit).");
		}
		return result;
	} catch (err) {
		// Synchronous fallback (same optimized logic as before)
		const adjusted = systems.map((s) => ({ ...s }));
		const damp = 0.9;
		const LINE_REPULSION_GAIN = 0.05;

		for (let iter = 0; iter < maxIterations; iter++) {
			let moved = false;
			const systemGrid = buildSystemGrid(adjusted, cellSize);

			const currentEdges = edgesWithCoords.map((e) => {
				const origin = adjusted.find(
					(s) => s.originalSystemId === e.systemidorigin,
				);
				const destination = adjusted.find(
					(s) => s.originalSystemId === e.systemiddestination,
				);
				return {
					...e,
					ax: origin?.x ?? e.ax,
					ay: origin?.y ?? e.ay,
					bx: destination?.x ?? e.bx,
					by: destination?.y ?? e.by,
				};
			});

			const edgeGrid = buildEdgeGrid(currentEdges, cellSize);
			const forces = new Map<string, [number, number]>();

			for (const system of adjusted) {
				let fx = 0,
					fy = 0;
				const gx = Math.floor(system.x / cellSize);
				const gy = Math.floor(system.y / cellSize);

				// 1. SYSTEM-SYSTEM REPULSION (Grid Accelerated)
				for (let dx = -1; dx <= 1; dx++) {
					for (let dy = -1; dy <= 1; dy++) {
						const key = `${gx + dx},${gy + dy}`;
						const neighbors = systemGrid.get(key) || [];
						for (const other of neighbors) {
							if (system.id === other.id) continue;
							const dxv = system.x - other.x;
							const dyv = system.y - other.y;
							const distance = Math.hypot(dxv, dyv) || 1e-6;
							if (distance < minSeparation) {
								const overlap = minSeparation - distance;
								const angle = Math.atan2(dyv, dxv);
								const mag = overlap * overlap * 0.01;
								fx += Math.cos(angle) * mag;
								fy += Math.sin(angle) * mag;
							}
						}
					}
				}

				// 2. LINE-SYSTEM REPULSION (Grid Accelerated)
				for (let dx_cell = -1; dx_cell <= 1; dx_cell++) {
					for (let dy_cell = -1; dy_cell <= 1; dy_cell++) {
						const key = `${gx + dx_cell},${gy + dy_cell}`;
						const nearbyEdges = edgeGrid.get(key) || [];

						for (const edge of nearbyEdges) {
							if (
								system.originalSystemId === edge.systemidorigin ||
								system.originalSystemId === edge.systemiddestination
							) {
								continue;
							}
							const { distance, cx, cy } = distanceToSegment(
								edge.ax,
								edge.ay,
								edge.bx,
								edge.by,
								system.x,
								system.y,
							);

							if (distance < minLineSeparation) {
								const overlap = minLineSeparation - distance;
								const dxv = system.x - cx;
								const dyv = system.y - cy;
								const angle = Math.atan2(dyv, dxv);
								const mag = overlap * LINE_REPULSION_GAIN;
								fx += Math.cos(angle) * mag;
								fy += Math.sin(angle) * mag;
							}
						}
					}
				}
				forces.set(system.id, [fx, fy]);
			}

			// Position Update
			for (const system of adjusted) {
				const [fx, fy] = forces.get(system.id) || [0, 0];
				const dx = fx * damp;
				const dy = fy * damp;
				if (Math.hypot(dx, dy) > 1e-3) {
					system.x += dx;
					system.y += dy;
					moved = true;
				}
			}
			if (!moved) break;
		}

		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;
		for (const s of adjusted) {
			minX = Math.min(minX, s.x);
			minY = Math.min(minY, s.y);
			maxX = Math.max(maxX, s.x);
			maxY = Math.max(maxY, s.y);
		}
		const result = { adjusted, bounds: { minX, minY, maxX, maxY } };

		// 3. CACHE RESULT (if sync fallback was successful)
		try {
			localStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(result));
		} catch (e) {
			// console.warn("Could not cache layout result (likely size limit hit).");
		}
		return result;
	}
}

// --- CONNECTION HELPER ---

export function buildSystemConnections(
	connections: Edge[],
	systems: MapPoint[],
) {
	const systemMap = new Map<string, MapPoint>();
	for (const s of systems)
		if (s.originalSystemId) systemMap.set(s.originalSystemId, s);
	const edges = [];
	for (const c of connections) {
		const origin = systemMap.get(c.systemidorigin);
		const destination = systemMap.get(c.systemiddestination);
		if (origin && destination)
			edges.push({
				sourcePosition: [origin.x, origin.y],
				targetPosition: [destination.x, destination.y],
			});
	}
	return edges;
}
