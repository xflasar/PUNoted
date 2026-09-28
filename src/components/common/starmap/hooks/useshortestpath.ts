import { useMemo } from "react";
import type { MapPoint, PlanetData } from "../types/maptypes";

interface UseShortestPathProps {
	originSystemId?: string | null;
	rawConnections: any[];
	systemsPoints: MapPoint[];
}

/**
 * Calculates shortest path Dijkstra distances across star systems.
 */
export function useShortestPath({
	originSystemId,
	rawConnections,
	systemsPoints,
}: UseShortestPathProps): Record<string, number> {
	return useMemo(() => {
		if (
			!originSystemId ||
			!rawConnections ||
			rawConnections.length === 0 ||
			!systemsPoints
		) {
			return {};
		}

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

		const sysMap = new Map<string, MapPoint>();
		systemsPoints.forEach((s) => {
			const id = s.originalSystemId || s.id;
			if (id) sysMap.set(String(id), s);
		});

		const originId = String(originSystemId);
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

		return distances;
	}, [originSystemId, rawConnections, systemsPoints]);
}
