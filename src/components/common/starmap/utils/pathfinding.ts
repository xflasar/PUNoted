import type { MapPoint } from "../types/maptypes";

/**
 * Finds the shortest sequence of system IDs between startSystemId and endSystemId
 * using Dijkstra on the galaxy hyperlane connections graph.
 */
export function findSystemPath(
	startSystemId: string,
	endSystemId: string,
	rawConnections: any[],
	systemsPoints: MapPoint[],
): string[] {
	if (!startSystemId || !endSystemId) return [];
	if (startSystemId === endSystemId) return [startSystemId];

	// 1. Build adjacency list
	const adj = new Map<string, string[]>();
	rawConnections.forEach((conn: any) => {
		const u = String(
			conn.systemidorigin || conn.systemIdOrigin || conn.origin || "",
		);
		const v = String(
			conn.systemiddestination ||
				conn.systemIdDestination ||
				conn.destination ||
				"",
		);
		if (u && v) {
			if (!adj.has(u)) adj.set(u, []);
			if (!adj.has(v)) adj.set(v, []);
			adj.get(u)!.push(v);
			adj.get(v)!.push(u);
		}
	});

	// Fast lookup for 3D coordinates
	const sysMap = new Map<string, MapPoint>();
	systemsPoints.forEach((s) => {
		const id = s.originalSystemId || s.systemId || s.id;
		if (id) sysMap.set(String(id), s);
	});

	const originId = String(startSystemId);
	const targetId = String(endSystemId);

	if (!sysMap.has(originId) || !sysMap.has(targetId)) {
		return [originId, targetId];
	}

	const distances: Record<string, number> = {};
	const predecessors: Record<string, string> = {};
	const unvisited = new Set<string>();

	sysMap.forEach((_, id) => {
		distances[id] = Infinity;
		unvisited.add(id);
	});
	distances[originId] = 0;

	while (unvisited.size > 0) {
		let u: string | null = null;
		let minDist = Infinity;
		unvisited.forEach((id) => {
			if (distances[id] < minDist) {
				minDist = distances[id];
				u = id;
			}
		});

		if (u === null || minDist === Infinity) break;
		if (u === targetId) break; // Reached destination
		unvisited.delete(u);

		const neighbors = adj.get(u) || [];
		neighbors.forEach((v) => {
			if (!unvisited.has(v)) return;
			const nodeU = sysMap.get(u!);
			const nodeV = sysMap.get(v);
			if (nodeU && nodeV) {
				const dx = nodeU.x - nodeV.x;
				const dy = nodeU.y - nodeV.y;
				const dz = (nodeU.z ?? 0) - (nodeV.z ?? 0);
				const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / 36;
				const alt = distances[u!] + dist;
				if (alt < distances[v]) {
					distances[v] = alt;
					predecessors[v] = u!;
				}
			}
		});
	}

	// Reconstruct path from predecessors
	if (!predecessors[targetId] && originId !== targetId) {
		// Fallback to direct connection if disjoint/not connected in graph
		return [originId, targetId];
	}

	const path: string[] = [];
	let curr: string | undefined = targetId;
	while (curr) {
		path.unshift(curr);
		curr = predecessors[curr];
	}

	return path;
}
