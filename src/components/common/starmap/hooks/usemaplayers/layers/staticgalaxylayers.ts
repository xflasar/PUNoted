import {
	ScatterplotLayer,
	PathLayer,
	IconLayer,
	TextLayer,
} from "@deck.gl/layers";
import type { MapPoint } from "../../../types/maptypes";
import type { FilterState } from "../../../components/filter/filtercontext";
import { checkSystemMatch } from "../utils";
import {
	getSystemIcon,
	getSystemPos,
	getLabelPos,
	getPathData,
	getConnectionColor,
} from "../constants";

interface BuildStaticGalaxyLayersProps {
	isGalaxyView: boolean;
	systemConnections: { sourcePosition: number[]; targetPosition: number[] }[];
	gatewayConnections: {
		sourcePosition: number[];
		targetPosition: number[];
		type: string;
	}[];
	coordToSystemId: Map<string, string>;
	shortestPathData: {
		distances: Record<string, number>;
		pathEdges: Set<string>;
	};
	filter?: FilterState;
	searchQuery?: string;
	systemsPoints: MapPoint[];
	maxSystemPopulation: number;
	ownedSystemsData: MapPoint[];
	starAtlas: ImageBitmap | null;
	starMapping: any;
	handleSystemClick: (sys: MapPoint | null) => void;
	handleSystemDoubleClick?: (sys: MapPoint | null) => void;
	handleSystemHover: (info: any) => void;
	allPlanetsData: Record<string, any[]>;
	showLabels: boolean;
}

/**
 * Builds static galaxy view layers (system connections, system icon atlas, static labels, filter highlights).
 */
export function buildStaticGalaxyLayers(props: BuildStaticGalaxyLayersProps) {
	const {
		isGalaxyView,
		systemConnections,
		gatewayConnections,
		coordToSystemId,
		shortestPathData,
		filter,
		searchQuery,
		systemsPoints,
		maxSystemPopulation,
		ownedSystemsData,
		starAtlas,
		starMapping,
		handleSystemClick,
		handleSystemDoubleClick,
		handleSystemHover,
		allPlanetsData,
		showLabels,
	} = props;

	if (!isGalaxyView) return [];
	const layers: any[] = [];

	if (systemConnections && systemConnections.length > 0) {
		const connectionData = systemConnections.map((c: any) => {
			const keyA = `${c.sourcePosition[0].toFixed(1)},${c.sourcePosition[1].toFixed(1)}`;
			const keyB = `${c.targetPosition[0].toFixed(1)},${c.targetPosition[1].toFixed(1)}`;
			const idA = coordToSystemId.get(keyA);
			const idB = coordToSystemId.get(keyB);
			const isHighlighted =
				idA &&
				idB &&
				shortestPathData.pathEdges.has([idA, idB].sort().join("-"));
			return {
				path: [c.sourcePosition, c.targetPosition],
				isHighlighted,
			};
		});

		const regularConnections = connectionData.filter((c) => !c.isHighlighted);
		const highlightedConnections = connectionData.filter(
			(c) => c.isHighlighted,
		);

		layers.push(
			new PathLayer({
				id: "static-connections",
				data: regularConnections,
				getPath: getPathData,
				getColor: getConnectionColor,
				getWidth: 0.8,
				widthUnits: "pixels",
				pickable: false,
			}),
		);

		if (highlightedConnections.length > 0) {
			layers.push(
				new PathLayer({
					id: "highlighted-connections",
					data: highlightedConnections,
					getPath: getPathData,
					getColor: [255, 170, 0, 255],
					getWidth: 3.5,
					widthUnits: "pixels",
					pickable: false,
					parameters: { depthTest: false },
				}),
			);
		}
	}

	if (gatewayConnections && gatewayConnections.length > 0) {
		layers.push(
			new PathLayer({
				id: "static-gateway-connections",
				data: gatewayConnections,
				getPath: (d: any) => [d.sourcePosition, d.targetPosition],
				getColor: [180, 0, 255, 100],
				getWidth: 7,
				widthUnits: "meters",
				pickable: false,
			}),
		);
	}

	// Draw radius circle
	if (filter?.originSystemId && filter.filterRadius > 0) {
		const originSys = systemsPoints.find(
			(s) =>
				s.originalSystemId === filter.originSystemId ||
				s.id === filter.originSystemId,
		);
		if (originSys) {
			layers.push(
				new ScatterplotLayer({
					id: "filter-radius-circle",
					data: [originSys],
					getPosition: (d: any) => [d.x, d.y],
					getRadius: () => filter.filterRadius * 36,
					radiusUnits: "meters",
					getLineColor: [255, 120, 0, 180],
					getFillColor: [255, 120, 0, 15],
					lineWidthMinPixels: 2.0,
					stroked: true,
					filled: true,
					pickable: false,
				}),
			);
		}
	}

	const isFilterActive =
		(filter?.resources && filter.resources.size > 0) ||
		(filter?.filterRadius && filter.filterRadius > 0) ||
		(filter?.planetType && filter.planetType !== "all") ||
		filter?.fertileOnly ||
		(filter?.gravity && filter.gravity !== "all") ||
		(filter?.temperature && filter.temperature !== "all") ||
		(filter?.pressure && filter.pressure !== "all") ||
		filter?.cogcEnabled;
	const hasSearch = !!searchQuery;

	if (isGalaxyView && (isFilterActive || hasSearch)) {
		const matchedSystems = systemsPoints.filter((s) =>
			checkSystemMatch(
				s,
				filter,
				searchQuery,
				allPlanetsData,
				systemsPoints,
				shortestPathData.distances,
			),
		);
		if (matchedSystems.length > 0) {
			layers.push(
				new ScatterplotLayer({
					id: "systems-filtered-highlight",
					data: matchedSystems,
					getPosition: (d: any) => [d.x, d.y],
					getRadius: (d: any) => {
						const popRatio =
							maxSystemPopulation > 1
								? Math.log1p(d.population ?? 0) /
									Math.log1p(maxSystemPopulation)
								: 0;
						return 23 * (1 + popRatio * 2);
					},
					radiusUnits: "meters",
					getLineColor: [255, 120, 0, 240],
					getFillColor: [255, 120, 0, 25],
					lineWidthMinPixels: 3.0,
					stroked: true,
					filled: true,
					pickable: false,
				}),
			);
		}
	}

	if (isGalaxyView && ownedSystemsData.length > 0) {
		layers.push(
			new ScatterplotLayer({
				id: "systems-owned-sites-highlight",
				data: ownedSystemsData,
				getPosition: (d: any) => [d.x, d.y],
				getRadius: (d: any) => {
					const popRatio =
						maxSystemPopulation > 1
							? Math.log1p(d.population ?? 0) / Math.log1p(maxSystemPopulation)
							: 0;
					return 22 * (1 + popRatio * 2) * 0.75;
				},
				radiusUnits: "meters",
				getLineColor: [0, 229, 255, 220],
				getFillColor: [0, 229, 255, 45],
				lineWidthMinPixels: 2.5,
				stroked: true,
				filled: true,
				pickable: false,
			}),
		);
	}

	if (isGalaxyView && starAtlas) {
		layers.push(
			new IconLayer({
				id: "systems-icons",
				data: systemsPoints,
				iconAtlas: starAtlas,
				iconMapping: starMapping,
				getIcon: getSystemIcon,
				getPosition: getSystemPos,
				sizeUnits: "meters",
				sizeScale: 1,
				sizeMinPixels: 8,
				sizeMaxPixels: 225,
				pickable: true,
				getSize: (d: any) => {
					const popRatio =
						maxSystemPopulation > 1
							? Math.log1p(d.population ?? 0) / Math.log1p(maxSystemPopulation)
							: 0;
					return 22 * (1 + popRatio * 2);
				},
				onClick: handleSystemClick,
				onDoubleClick: handleSystemDoubleClick,
				onHover: handleSystemHover,
				getColor: (d: any) => {
					if (!isFilterActive && !hasSearch) {
						return [255, 255, 255, 255];
					}
					const isMatch = checkSystemMatch(
						d,
						filter,
						searchQuery,
						allPlanetsData,
						systemsPoints,
						shortestPathData.distances,
					);
					return isMatch ? [255, 120, 0, 255] : [255, 255, 255, 45];
				},
				updateTriggers: {
					getColor: [filter, searchQuery, shortestPathData],
				},
			}),
		);
	}

	if (systemsPoints && systemsPoints.length > 0) {
		const labelData = showLabels
			? [...systemsPoints].sort(
					(a: any, b: any) => (a.population || 0) - (b.population || 0),
				)
			: [];
		layers.push(
			new TextLayer({
				id: "static-system-labels",
				data: labelData,
				getPosition: getLabelPos,
				getText: (d: any) => d.label,
				getSize: 12,
				getColor: (d: any) => {
					if (!isFilterActive && !hasSearch) {
						return [255, 255, 255, 255];
					}
					const isMatch = checkSystemMatch(
						d,
						filter,
						searchQuery,
						allPlanetsData,
						systemsPoints,
						shortestPathData.distances,
					);
					return isMatch ? [255, 160, 0, 255] : [255, 255, 255, 45];
				},
				billboard: true,
				background: true,
				getBackgroundColor: (d: any) => {
					if (!isFilterActive && !hasSearch) {
						return [0, 0, 0, 160];
					}
					const isMatch = checkSystemMatch(
						d,
						filter,
						searchQuery,
						allPlanetsData,
						systemsPoints,
						shortestPathData.distances,
					);
					return isMatch ? [40, 20, 0, 180] : [0, 0, 0, 30];
				},
				backgroundPadding: [4, 2],
				getPixelOffset: [0, 22],
				sizeUnits: "pixels",
				pickable: false,
				updateTriggers: {
					data: [showLabels],
					getColor: [filter, searchQuery, shortestPathData],
					getBackgroundColor: [filter, searchQuery, shortestPathData],
				},
			}),
		);
	}

	return layers;
}
