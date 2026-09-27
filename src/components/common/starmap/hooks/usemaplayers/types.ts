import type { OrthographicViewport } from "@deck.gl/core";
import type {
	MapPoint,
	Sector,
	PlanetPosition,
	AnimatedShipData,
	StationPosition,
	ShipData,
	GatewayData,
	PlanetData,
	StationData,
} from "../../types/maptypes";
import type { FilterState } from "../../components/filter/filtercontext";

export interface UseMapLayersProps {
	systemToSectorMap: Map<string, string>;
	visibilityVersion: number;
	galaxyViewState: any;
	SYSTEMS_VISIBLE_ZOOM: number;
	sectors: Sector[];
	empireLegend: Record<string, string>;
	viewportInstance: OrthographicViewport | null;
	systemsPoints: MapPoint[];
	maxSystemPopulation: number;
	ZOOM_SENSITIVITY: number;
	MAX_ALLOWED_RADIUS: number;
	onSystemClick: (sys: MapPoint | null) => void;
	onSystemDoubleClick?: (sys: MapPoint | null) => void;
	isPlanetModeActive: boolean;
	setTooltip: (
		tooltip: { x: number; y: number; content: string } | null,
	) => void;
	isGalaxyView: boolean;
	popFilterSetting: string;
	systemConnections: { sourcePosition: number[]; targetPosition: number[] }[];
	gatewayConnections: {
		sourcePosition: number[];
		targetPosition: number[];
		type: string;
	}[];
	throttleKey: number;
	systemBoundingBox: any[];
	orbitLines: any[];
	orbitLinesStatic: any[];
	allPlanetsData: Record<string, PlanetData[]>;
	allStationsData: Record<string, StationData[]>;
	allGatewaysData: Record<string, GatewayData[]>;
	setSelectedPlanet: (planet: PlanetPosition | null) => void;
	setSelectedStation?: (station: StationPosition | null) => void;
	animatedShipData: ShipData[];
	activeFlightPlans: any[];
	ownFlightPlans: any[];
	corpFlightPlans: any[];
	setActiveFlightPlans: React.Dispatch<React.SetStateAction<any[]>>;
	mode: "public" | "dashboard" | "shipping";
	onShipHover: (info: { object: any; x: number; y: number } | null) => void;
	onShipClick: (ship: AnimatedShipData) => void;
	currentSystemId: string | null;
	currentSystem: MapPoint | null;
	deckRef: React.RefObject<any>;
	animationWorker: Worker | null;
	isInteracting: boolean;
	visiblePathShipIds: Set<string>;
	selectedShipId: string | null;
	productionData?: Record<string, any>;
	filter?: FilterState;
	searchQuery?: string;
	rawConnections?: any[];
	microAsteroids?: any[];
}
