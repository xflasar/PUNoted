import type { SystemNode, FlightSegment } from "../types/maptypes";

/**
 * Simple Dijkstra implementation to find the shortest path between two systems.
 * It uses the provided flight segments as edges with a weight of `duration`.
 * If `useAStar` is true, an Euclidean heuristic based on the node coordinates
 * is applied (A*). Otherwise it falls back to pure Dijkstra.
 */
export function findShortestPath(
	originId: string,
	destinationId: string,
	nodes: Record<string, SystemNode>,
	segments: FlightSegment[],
	useAStar = false,
): { path: string[]; totalTime: number } {
	const distances: Record<string, number> = {};
	const previous: Record<string, string | null> = {};
	const visited = new Set<string>();

	// initialize distances
	Object.keys(nodes).forEach((id) => {
		distances[id] = Infinity;
		previous[id] = null;
	});
	distances[originId] = 0;

	// adjacency list
	const adjacency: Record<string, { to: string; duration: number }[]> = {};
	segments.forEach((seg) => {
		if (!adjacency[seg.from]) adjacency[seg.from] = [];
		adjacency[seg.from].push({ to: seg.to, duration: seg.duration });
		// assume undirected for galaxy routes unless direction matters
		if (!adjacency[seg.to]) adjacency[seg.to] = [];
		adjacency[seg.to].push({ to: seg.from, duration: seg.duration });
	});

	const heuristic = (nodeId: string) => {
		if (!useAStar) return 0;
		const a = nodes[nodeId];
		const b = nodes[destinationId];
		if (!a || !b) return 0;
		const dx = a.x - b.x;
		const dy = a.y - b.y;
		return Math.sqrt(dx * dx + dy * dy);
	};

	while (visited.size < Object.keys(nodes).length) {
		// pick unvisited node with smallest (distance + heuristic)
		let currentId: string | null = null;
		let smallest = Infinity;
		for (const id of Object.keys(nodes)) {
			if (visited.has(id)) continue;
			const score = distances[id] + heuristic(id);
			if (score < smallest) {
				smallest = score;
				currentId = id;
			}
		}
		if (currentId === null) break; // unreachable
		if (currentId === destinationId) break;

		visited.add(currentId);
		const neighbors = adjacency[currentId] || [];
		for (const { to, duration } of neighbors) {
			if (visited.has(to)) continue;
			const alt = distances[currentId] + duration;
			if (alt < distances[to]) {
				distances[to] = alt;
				previous[to] = currentId;
			}
		}
	}

	// reconstruct path
	const path: string[] = [];
	let cur: string | null = destinationId;
	const totalTime = distances[destinationId] ?? Infinity;
	while (cur) {
		path.unshift(cur);
		cur = previous[cur];
	}
	// if origin is not at start, path is invalid
	if (path[0] !== originId) {
		return { path: [], totalTime: Infinity };
	}
	return { path, totalTime };
}
