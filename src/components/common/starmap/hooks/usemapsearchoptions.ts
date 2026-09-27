import { useMemo } from "react";
import type { MapPoint, PlanetData } from "../types/maptypes";

export interface SearchOption {
	label: string;
	id: string;
	type: "system" | "planet";
	systemId?: string;
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
			Object.entries(allPlanetsData).forEach(([sysId, planets]) => {
				planets.forEach((p: any) => {
					const name = p.name || p.planetName;
					if (name) {
						options.push({
							label: name,
							id: p.planetid || p.id,
							type: "planet",
							systemId: sysId,
							naturalId: p.planetid || p.id,
						});
					}
				});
			});
		}

		// Deduplicate option labels
		const seen = new Set<string>();
		return options.filter((opt) => {
			const key = `${opt.type}-${opt.label}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}, [systemsPoints, allPlanetsData]);
}
