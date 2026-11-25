import { useMemo } from "react";
import type { MapPoint, PlanetData } from "../types/maptypes";

export interface SearchOption {
	label: string;
	id: string;
	type: "system" | "planet";
	systemId?: string;
	systemName?: string;
	x?: number;
	y?: number;
	naturalId?: string;
}

interface UseMapSearchOptionsProps {
	systemsPoints: MapPoint[];
	allPlanetsData: Record<string, PlanetData[]>;
}

/**
 * Builds deduplicated autocomplete options for systems and planets search bar.
 */
export function useMapSearchOptions({
	systemsPoints,
	allPlanetsData,
}: UseMapSearchOptionsProps): SearchOption[] {
	return useMemo(() => {
		const options: SearchOption[] = [];

		if (systemsPoints) {
			systemsPoints.forEach((sys: any) => {
				const name = sys.name || sys.systemName || sys.label;
				if (name) {
					options.push({
						label: name,
						id: sys.originalSystemId || sys.id,
						type: "system",
						x: sys.x,
						y: sys.y,
						naturalId: sys.naturalid || sys.naturalId || sys.id,
					});
				}
			});
		}

		if (allPlanetsData) {
			const systemNameMap = new Map<string, string>();
			if (systemsPoints) {
				systemsPoints.forEach((s: any) => {
					const sId = s.originalSystemId || s.id;
					const sName = s.name || s.systemName || s.label || sId;
					if (sId) systemNameMap.set(sId, sName);
					if (s.id) systemNameMap.set(s.id, sName);
				});
			}

			Object.entries(allPlanetsData).forEach(([sysId, planets]) => {
				const parentSysName = systemNameMap.get(sysId) || sysId;

				planets.forEach((p: any) => {
					const name =
						p.planetname || p.name || p.planetName || p.planetid || p.id;
					if (name) {
						options.push({
							label: name,
							id: p.planetid || p.id,
							type: "planet",
							systemId: sysId,
							systemName: parentSysName,
							naturalId: p.planetid || p.id,
						});
					}
				});
			});
		}

		// Deduplicate option labels
		const seen = new Set<string>();
		return options.filter((opt) => {
			const key = `${opt.type}-${opt.id}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}, [systemsPoints, allPlanetsData]);
}
