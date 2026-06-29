import type { MapPoint, PlanetData } from "../../types/maptypes";

export interface SearchResultsPanelProps {
	systems: MapPoint[];
	allPlanetsData: Record<string, PlanetData[]>;
	filter: any;
	searchQuery: string;
	onSelectSystem: (sys: MapPoint) => void;
	onSelectPlanet: (planetId: string, sys: MapPoint) => void;
	onClose: () => void;
}

export type SortOption = "name" | "population" | "resources";

export interface SystemRowProps {
	sys: MapPoint;
	planets: PlanetData[];
	isExpanded: boolean;
	filterResourcesArray: string[];
	onToggle: (id: string, e: React.MouseEvent) => void;
	onSelectSystem: (sys: MapPoint) => void;
	onSelectPlanet: (planetId: string, sys: MapPoint) => void;
}
