import { useState, useEffect, useRef } from "react";
import type { MapPoint, PlanetData } from "../../types/maptypes";
import type { FilterState } from "../../components/filter/filtercontext";
import { hexToRgba } from "../../utils/colors";

/**
 * Evaluates whether a star system (or its planets) matches active search query and filter criteria.
 */
export function checkSystemMatch(
	sys: MapPoint,
	filter: FilterState | undefined,
	searchQuery: string | undefined,
	allPlanetsData: Record<string, PlanetData[]>,
	systemsPoints: MapPoint[],
	shortestPathDistances?: Record<string, number>,
): boolean {
	const query = searchQuery?.trim().toLowerCase() || "";
	if (query) {
		const systemName = (sys.label || "").toLowerCase();
		let matchesQuery = systemName.includes(query);

		if (!matchesQuery && allPlanetsData) {
			const planets = allPlanetsData[sys.originalSystemId || sys.id] || [];
			matchesQuery = planets.some((p) =>
				(p.planetname || p.planetid || "").toLowerCase().includes(query),
			);
		}

		if (!matchesQuery) {
			return false;
		}
	}

	if (!filter) return true;

	const hasResources = filter.resources && filter.resources.size > 0;
	const hasRadius = filter.filterRadius > 0 && filter.originSystemId != null;
	const hasPlanetType = filter.planetType !== "all";
	const hasFertile = filter.fertileOnly;
	const hasGravity = filter.gravity !== "all";
	const hasTemperature = filter.temperature !== "all";
	const hasPressure = filter.pressure !== "all";
	const hasCogc = filter.cogcEnabled;

	const isFilterActive =
		hasResources ||
		hasRadius ||
		hasPlanetType ||
		hasFertile ||
		hasGravity ||
		hasTemperature ||
		hasPressure ||
		hasCogc;

	if (!isFilterActive) {
		return true;
	}

	const sysPop = sys.population || 0;
	if (
		sysPop < filter.populationRange[0] ||
		sysPop > filter.populationRange[1]
	) {
		return false;
	}

	if (hasRadius && filter.originSystemId) {
		const systemId = sys.originalSystemId || sys.id;
		if (
			shortestPathDistances &&
			shortestPathDistances[systemId] !== undefined
		) {
			if (shortestPathDistances[systemId] > filter.filterRadius) {
				return false;
			}
		} else {
			const originSys = systemsPoints.find(
				(s) =>
					s.originalSystemId === filter.originSystemId ||
					s.id === filter.originSystemId,
			);
			if (originSys) {
				const dx = sys.x - originSys.x;
				const dy = sys.y - originSys.y;
				const dz = (sys.z ?? 0) - (originSys.z ?? 0);
				const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / 36;
				if (dist > filter.filterRadius) {
					return false;
				}
			}
		}
	}

	const planets = allPlanetsData[sys.originalSystemId || sys.id] || [];

	const matchingPlanet = planets.some((p) => {
		if (hasPlanetType) {
			const typeStr = (p.type || "").toUpperCase();
			const isRocky = typeStr.includes("EARTH") || typeStr.includes("ROCKY");
			const isGas = typeStr.includes("GAS");
			if (filter.planetType === "rocky" && !isRocky) return false;
			if (filter.planetType === "gaseous" && !isGas) return false;
		}

		if (hasFertile) {
			if (!p.fertility || p.fertility <= 0) return false;
		}

		if (hasGravity) {
			const grav = p.gravity || 0;
			if (filter.gravity === "low" && grav > 1.0) return false;
			if (filter.gravity === "high" && grav <= 1.0) return false;
		}

		if (hasTemperature) {
			const temp = p.temperature || 0;
			if (filter.temperature === "low" && temp >= 273.15) return false;
			if (filter.temperature === "high" && temp < 273.15) return false;
		}

		if (hasPressure) {
			const press = p.pressure || 0;
			if (filter.pressure === "low" && press > 1.0) return false;
			if (filter.pressure === "high" && press <= 1.0) return false;
		}

		if (hasCogc) {
			const prog = (p.cogc || "").toUpperCase();
			const selectedProg = filter.cogcProgram.toUpperCase();
			const hasActiveProgram = prog && prog !== "NONE";
			if (selectedProg === "ALL") {
				if (!hasActiveProgram) return false;
			} else if (selectedProg === "NONE") {
				if (hasActiveProgram) return false;
			} else {
				if (!prog.includes(selectedProg)) return false;
			}
		}

		if (hasResources) {
			const planetResNames = new Set(
				(p.resources || []).map((r: any) =>
					(r.material || r.name || "").toUpperCase(),
				),
			);

			const matchMode = filter.resourceMatchMode || "all";

			if (matchMode === "all") {
				let hasAll = true;
				for (const res of filter.resources) {
					if (!planetResNames.has(res)) {
						hasAll = false;
						break;
					}
				}
				if (!hasAll) return false;
			} else {
				let hasAny = false;
				for (const res of filter.resources) {
					if (planetResNames.has(res)) {
						hasAny = true;
						break;
					}
				}
				if (!hasAny) return false;
			}
		}

		return true;
	});

	const hasPlanetFilter =
		hasPlanetType ||
		hasFertile ||
		hasGravity ||
		hasTemperature ||
		hasPressure ||
		hasCogc ||
		hasResources;
	if (hasPlanetFilter && !matchingPlanet) {
		return false;
	}

	return true;
}

/**
 * Debounces viewport zoom updates to prevent rapid re-clustering during zoom gestures.
 */
export function useDebouncedZoom(zoom: number, delay: number = 200) {
	const [debouncedZoom, setDebouncedZoom] = useState(zoom);
	const timeoutRef = useRef<any>(null);
	useEffect(() => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => {
			setDebouncedZoom(zoom);
		}, delay);
		return () => clearTimeout(timeoutRef.current);
	}, [zoom, delay]);
	return debouncedZoom;
}

/**
 * Clusters nearby ships into group badges based on screen pixel distance.
 */
export function clusterShipsByRadius(
	ships: any[],
	zoom: number,
	isGalaxyView: boolean,
	systemId: string | null,
): any[] {
	if (!ships || ships.length === 0) return [];

	const screenPixelRadius = !isGalaxyView && systemId ? 2 : 40;
	const scale = Math.pow(2, zoom);
	const worldDist = screenPixelRadius / scale;
	const worldDistSq = worldDist * worldDist;
	const cellSize = worldDist;

	const grid = new Map<string, any[]>();
	for (const ship of ships) {
		if (!ship.position) continue;
		const [x, y] = ship.position;
		const key = `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
		if (!grid.has(key)) grid.set(key, []);
		grid.get(key)!.push(ship);
	}

	const clusters: any[] = [];
	const processedShips = new Set<string>();

	for (const ship of ships) {
		const shipId = ship.ship_id || ship.shipid || ship.id;
		if (processedShips.has(shipId) || !ship.position) continue;

		const clusterShips = [ship];
		processedShips.add(shipId);

		const [x, y] = ship.position;
		const gx = Math.floor(x / cellSize),
			gy = Math.floor(y / cellSize);

		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				const cellShips = grid.get(`${gx + dx},${gy + dy}`);
				if (cellShips) {
					for (const neighbor of cellShips) {
						const neighborId =
							neighbor.ship_id || neighbor.shipid || neighbor.id;
						if (processedShips.has(neighborId)) continue;

						const d2 =
							(neighbor.position[0] - x) ** 2 + (neighbor.position[1] - y) ** 2;
						if (d2 <= worldDistSq) {
							clusterShips.push(neighbor);
							processedShips.add(neighborId);
						}
					}
				}
			}
		}

		if (clusterShips.length > 1) {
			clusters.push({
				...ship,
				id: `c-${shipId}`,
				position: [...ship.position],
				count: clusterShips.length,
				ships: clusterShips,
				ship_type: "cluster",
				name: `${clusterShips.length} Ships`,
				color: [255, 255, 0],
				isOwn: false,
				isCluster: true,
			});
		} else {
			clusters.push({
				...ship,
				isCluster: false,
			});
		}
	}
	return clusters;
}

/**
 * Resolves empire hex codes to RGBA color tuples with fallback alpha.
 */
export function createSafeGetColor(empireLegend: Record<string, string>) {
	return (
		code?: string,
		alpha: number = 255,
	): [number, number, number, number] => {
		if (!code) return [100, 100, 100, alpha];
		const hex = empireLegend[code];
		return hex ? hexToRgba(hex, alpha) : [100, 100, 100, alpha];
	};
}
