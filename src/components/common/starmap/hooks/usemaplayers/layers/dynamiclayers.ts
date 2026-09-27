import {
	ScatterplotLayer,
	PathLayer,
	IconLayer,
	TextLayer,
} from "@deck.gl/layers";
import type { MapPoint, PlanetPosition } from "../../../types/maptypes";
import type { FilterState } from "../../../components/filter/filtercontext";
import { SYSTEM_BASE_RADIUS } from "../../../constants/map";
import {
	getGatewayPosition,
	getGatewayColor,
	getPathData,
	getPathColor,
	getPlanetIcon,
	getPlanetPosition,
	getStationIcon,
	getStationPosition,
	getShipIconType,
	getShipPosition,
	getClusterBadgePos,
	getClusterBadgeText,
	getClusterBadgeColor,
	getClusterBadgeBg,
	getShipLabelPos,
	getShipLabelText,
	getShipLabelBg,
	getSystemIcon,
	getSystemPos,
	getSemimajorAxisAU,
} from "../constants";

interface BuildDynamicLayersProps {
	starAtlas: ImageBitmap | null;
	starMapping?: any;
	shipAtlas: ImageBitmap | null;
	planetAtlas: ImageBitmap | null;
	stationsAtlas: ImageBitmap | null;
	planetMapping: any;
	shipMapping: any;
	stationsMapping: any;
	isPlanetModeActive: boolean;
	isGalaxyView: boolean;
	currentSystem: MapPoint | null;
	animatedShipData: any[];
	allGatewaysData: Record<string, any[]>;
	activePlanets: PlanetPosition[];
	activeStations: any[];
	orbitTrails: any[];
	microAsteroids?: any[];
	flightPathLayers: any[];
	clusteredData: any[];
	showLabels: boolean;
	zoom?: number;
	filter?: FilterState;
	searchQuery?: string;
	shortestPathData: { distances: Record<string, number> };
	systemsPoints: MapPoint[];
	handleGatewayHover: (info: any) => void;
	handlePlanetClick: (info: any) => void;
	handleHoverTooltip: (info: any) => void;
	handleStationClick?: (info: any) => void;
	handleShipClick: (info: any) => void;
}

/**
 * Builds dynamic system mode layers (planets, stations, gateways, orbit trails, flight paths, ship icons, cluster badges).
 */
export function buildDynamicLayers(props: BuildDynamicLayersProps) {
	const {
		starAtlas,
		starMapping,
		shipAtlas,
		planetAtlas,
		stationsAtlas,
		planetMapping,
		shipMapping,
		stationsMapping,
		isPlanetModeActive,
		isGalaxyView,
		currentSystem,
		animatedShipData,
		allGatewaysData,
		activePlanets,
		activeStations,
		orbitTrails,
		microAsteroids,
		flightPathLayers,
		clusteredData,
		showLabels,
		zoom,
		filter,
		searchQuery,
		shortestPathData,
		systemsPoints,
		handleGatewayHover,
		handlePlanetClick,
		handleHoverTooltip,
		handleStationClick,
		handleShipClick,
	} = props;

	if (!starAtlas || !shipAtlas) return [];
	const dLayers: any[] = [];

	if (isPlanetModeActive && planetAtlas && stationsAtlas) {
		const dockedShipsMap = new Map<string, any[]>();
		const allSystemShips = animatedShipData || [];
		allSystemShips.forEach((s: any) => {
			const isMoving =
				s.plan &&
				s.plan.segments &&
				s.plan.segments.length > 0 &&
				(() => {
					const segments = s.plan.segments;
					const arrival = segments[segments.length - 1].arrival;
					const departure = segments[0].departure;
					const now = Date.now();
					return now >= departure && now <= arrival;
				})();
			if (!isMoving) {
				const locId = s.addressplanetid || s.addressstationid;
				if (locId) {
					if (!dockedShipsMap.has(locId)) dockedShipsMap.set(locId, []);
					dockedShipsMap.get(locId)!.push(s);
				}
			}
		});

		const activeGateways =
			allGatewaysData[currentSystem?.originalSystemId ?? ""] || [];
		const gatewayData = activeGateways.map((g: any) => ({
			...g,
			x: (currentSystem?.x ?? 0) + (g.semimajoraxis || 1000),
			y: currentSystem?.y ?? 0,
		}));
		if (gatewayData.length) {
			dLayers.push(
				new ScatterplotLayer({
					id: "gateways-dynamic",
					data: gatewayData,
					getPosition: getGatewayPosition,
					getFillColor: getGatewayColor,
					getRadius: SYSTEM_BASE_RADIUS * 0.06 * 0.3,
					radiusUnits: "meters",
					radiusMinPixels: 8,
					pickable: true,
					onHover: handleGatewayHover,
				}),
			);
		}

		if (orbitTrails && orbitTrails.length > 0) {
			dLayers.push(
				new PathLayer({
					id: "orbit-trails",
					data: orbitTrails,
					getPath: getPathData,
					getColor: getPathColor,
					getWidth: 2,
					widthUnits: "pixels",
					parameters: { blend: true, depthTest: false },
				}),
			);
		}

		if (microAsteroids && microAsteroids.length > 0) {
			dLayers.push(
				new ScatterplotLayer({
					id: "micro-asteroids",
					data: microAsteroids,
					getPosition: (d: any) => d.position,
					getRadius: (d: any) => d.size,
					radiusUnits: "pixels",
					getFillColor: (d: any) => d.color,
					pickable: false,
				}),
			);
		}

		if (flightPathLayers.length > 0) dLayers.push(...flightPathLayers);

		dLayers.push(
			new IconLayer<PlanetPosition>({
				id: `planets-dynamic-${currentSystem?.originalSystemId || "none"}`,
				data: activePlanets,
				iconAtlas: planetAtlas,
				iconMapping: planetMapping,
				getIcon: getPlanetIcon,
				getPosition: getPlanetPosition,
				getSize: (d: any) => (d.scaledPlanetRadius ?? 1.0) * 2.0,
				sizeUnits: "meters",
				sizeMinPixels: 35,
				sizeMaxPixels: 400,
				pickable: true,
				onClick: handlePlanetClick,
				onHover: handleHoverTooltip,
				getColor: (d: any) => {
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
					if (!isFilterActive && !hasSearch) {
						return [255, 255, 255, 255];
					}

					let matches = true;
					const query = searchQuery?.trim().toLowerCase() || "";
					if (query) {
						const planetName = (d.name || d.planetname || "").toLowerCase();
						matches = planetName.includes(query);
					}

					if (matches && filter) {
						const pop = d.planetPopulation || 0;
						matches =
							pop >= filter.populationRange[0] &&
							pop <= filter.populationRange[1];
					}

					if (
						matches &&
						filter?.filterRadius &&
						filter.filterRadius > 0 &&
						filter.originSystemId
					) {
						const systemId = d.parentSystemId;
						if (systemId) {
							if (shortestPathData.distances[systemId] !== undefined) {
								matches =
									shortestPathData.distances[systemId] <= filter.filterRadius;
							} else {
								const originSys = systemsPoints.find(
									(s) =>
										s.originalSystemId === filter.originSystemId ||
										s.id === filter.originSystemId,
								);
								if (originSys) {
									const dx = d.x - originSys.x;
									const dy = d.y - originSys.y;
									const dist = Math.sqrt(dx * dx + dy * dy) / 3;
									matches = dist <= filter.filterRadius;
								}
							}
						}
					}

					if (matches && filter?.planetType && filter.planetType !== "all") {
						const typeStr = (d.type || "").toUpperCase();
						const isRocky =
							typeStr.includes("EARTH") || typeStr.includes("ROCKY");
						const isGas = typeStr.includes("GAS");
						if (filter.planetType === "rocky" && !isRocky) matches = false;
						if (filter.planetType === "gaseous" && !isGas) matches = false;
					}

					if (matches && filter?.fertileOnly) {
						if (!d.fertility || d.fertility <= 0) matches = false;
					}

					if (matches && filter?.gravity && filter.gravity !== "all") {
						const grav = d.gravity || 0;
						if (filter.gravity === "low" && grav > 1.0) matches = false;
						if (filter.gravity === "high" && grav <= 1.0) matches = false;
					}

					if (matches && filter?.temperature && filter.temperature !== "all") {
						const temp = d.temperature || 0;
						if (filter.temperature === "low" && temp >= 273.15) matches = false;
						if (filter.temperature === "high" && temp < 273.15) matches = false;
					}

					if (matches && filter?.pressure && filter.pressure !== "all") {
						const press = d.pressure || 0;
						if (filter.pressure === "low" && press > 1.0) matches = false;
						if (filter.pressure === "high" && press <= 1.0) matches = false;
					}

					if (matches && filter?.cogcEnabled) {
						const prog = (d.cogc || "").toUpperCase();
						const selectedProg = filter.cogcProgram.toUpperCase();
						const hasActiveProgram = prog && prog !== "NONE";
						if (selectedProg === "ALL") {
							if (!hasActiveProgram) matches = false;
						} else if (selectedProg === "NONE") {
							if (hasActiveProgram) matches = false;
						} else {
							if (!prog.includes(selectedProg)) matches = false;
						}
					}

					if (matches && filter?.resources && filter.resources.size > 0) {
						const hasMatch = d.resources?.some((r: any) => {
							const ticker = (r.material || r.name || "").toUpperCase();
							return ticker && filter.resources.has(ticker);
						});
						if (!hasMatch) matches = false;
					}

					return matches ? [255, 120, 0, 255] : [255, 255, 255, 45];
				},
				updateTriggers: {
					getColor: [filter, searchQuery, shortestPathData],
				},
			}),
		);

		if (currentSystem) {
			// Central Star Icon (Identical texture & properties as Galaxy Mode)
			if (starAtlas) {
				dLayers.push(
					new IconLayer({
						id: `star-icon-${currentSystem.originalSystemId || "none"}`,
						data: [currentSystem],
						iconAtlas: starAtlas,
						iconMapping: starMapping,
						getIcon: getSystemIcon,
						getPosition: getSystemPos,
						sizeUnits: "meters",
						sizeScale: 1,
						sizeMinPixels: 24,
						sizeMaxPixels: 250,
						getSize: 28,
						getColor: [255, 255, 255, 255],
						pickable: false,
					}),
				);
			}

			// Tactical Radar Rings for System Planets + Outer Boundary
			const gridRings: any[] = [];
			const ringLabels: any[] = [];
			const numSegments = 96;

			if (activePlanets && activePlanets.length > 0) {
				activePlanets.forEach((p) => {
					const auVal = getSemimajorAxisAU((p as any).semimajoraxis);
					const r = Math.sqrt(
						(p.x - currentSystem.x) ** 2 + (p.y - currentSystem.y) ** 2,
					);
					if (r > 0 && auVal > 0) {
						const ringPoints: [number, number][] = [];
						for (let i = 0; i <= numSegments; i++) {
							const theta = (i / numSegments) * Math.PI * 2;
							ringPoints.push([
								currentSystem.x + r * Math.cos(theta),
								currentSystem.y + r * Math.sin(theta),
							]);
						}
						gridRings.push({ path: ringPoints });
						ringLabels.push({
							text: `${auVal.toFixed(2)} AU`,
							position: [currentSystem.x + r, currentSystem.y],
						});
					}
				});
			}

			if (gridRings.length > 0) {
				dLayers.push(
					new PathLayer({
						id: `system-tactical-rings-${currentSystem.originalSystemId || "none"}`,
						data: gridRings,
						getPath: (d: any) => d.path,
						getColor: [0, 229, 255, 26],
						getWidth: 1,
						widthUnits: "pixels",
						parameters: { blend: true },
					}),
				);

				dLayers.push(
					new TextLayer({
						id: `system-tactical-ring-labels-${currentSystem.originalSystemId || "none"}`,
						data: ringLabels,
						getPosition: (d: any) => d.position,
						getText: (d: any) => d.text,
						getColor: [0, 229, 255, 140],
						getSize: 10,
						sizeUnits: "pixels",
						getPixelOffset: [12, -6],
						billboard: true,
						pickable: false,
					}),
				);
			}
		}

		if (activeStations && activeStations.length > 0) {
			dLayers.push(
				new IconLayer({
					id: `stations-dynamic-${currentSystem?.originalSystemId || "none"}`,
					data: activeStations,
					iconAtlas: stationsAtlas,
					iconMapping: stationsMapping,
					getIcon: getStationIcon,
					getPosition: getStationPosition,
					getSize: (d: any) => (d.scaledStationRadius ?? 1.0) * 2.0,
					sizeUnits: "meters",
					sizeMinPixels: 35,
					sizeMaxPixels: 400,
					pickable: true,
					onClick: handleStationClick,
					onHover: handleHoverTooltip,
				}),
			);
		}

		// --- SMART SPOKE LABEL PLACEMENT (DE-COLLISION) ---
		const labelItems: any[] = [];
		const sysX = currentSystem?.x ?? 0;
		const sysY = currentSystem?.y ?? 0;

		activePlanets.forEach((p, idx) => {
			const dx = p.x - sysX;
			const dy = p.y - sysY;
			const angle = Math.atan2(dy, dx);
			// Stagger label distance radially out from object center to prevent label collisions
			const staggerDist = 38 + (idx % 3) * 16;
			const offsetX = Math.cos(angle) * staggerDist;
			const offsetY = Math.sin(angle) * staggerDist;

			labelItems.push({
				id: `planet-label-${p.planetid}`,
				text: p.name || p.planetname,
				position: [p.x, p.y],
				pixelOffset: [offsetX, offsetY],
				color: [0, 229, 255, 255],
			});
		});

		activeStations.forEach((st, idx) => {
			const dx = st.x - sysX;
			const dy = st.y - sysY;
			const angle = Math.atan2(dy, dx);
			const staggerDist = 42 + (idx % 3) * 16;
			const offsetX = Math.cos(angle) * staggerDist;
			const offsetY = Math.sin(angle) * staggerDist;

			labelItems.push({
				id: `station-label-${st.stationid || st.id}`,
				text: st.name || "Station",
				position: [st.x, st.y],
				pixelOffset: [offsetX, offsetY],
				color: [255, 185, 0, 255],
			});
		});

		if (labelItems.length > 0) {
			dLayers.push(
				new TextLayer({
					id: `planet-station-labels-${currentSystem?.originalSystemId || "none"}`,
					data: labelItems,
					getPosition: (d: any) => d.position,
					getText: (d: any) => d.text,
					getPixelOffset: (d: any) => d.pixelOffset,
					getColor: (d: any) => d.color,
					getSize: 12,
					sizeUnits: "pixels",
					background: true,
					getBackgroundColor: [15, 15, 15, 210],
					backgroundPadding: [4, 2],
					billboard: true,
					pickable: false,
				}),
			);
		}
	}

	if (clusteredData.length > 0) {
		dLayers.push(
			new IconLayer({
				id: "ships-icons",
				data: clusteredData,
				iconAtlas: shipAtlas,
				iconMapping: shipMapping,
				getIcon: getShipIconType,
				getPosition: getShipPosition,
				getSize: (d: any) => (d.isCluster ? 38 : 30),
				getAngle: (d: any) => (d.isCluster ? 0 : -(d.bearing ?? 0)),
				sizeUnits: "pixels",
				sizeMinPixels: isGalaxyView ? 14 : 24,
				sizeMaxPixels: isGalaxyView ? 105 : 100,
				pickable: true,
				onClick: handleShipClick,
			}),
		);

		if (showLabels || !isGalaxyView) {
			dLayers.push(
				new TextLayer({
					id: "ship-labels",
					data: clusteredData.filter((d: any) => !d.isCluster),
					getPosition: getShipLabelPos,
					getText: getShipLabelText,
					getPixelOffset: [0, -30],
					getColor: (d: any) =>
						d.isOwn ? [123, 104, 238, 255] : [0, 150, 255, 255],
					getSize: 13,
					sizeUnits: "pixels",
					background: true,
					getBackgroundColor: getShipLabelBg,
					backgroundPadding: [3, 1],
					billboard: true,
					pickable: false,
				}),
			);
		}

		const clustersOnly = clusteredData.filter((d: any) => d.isCluster);
		if (clustersOnly.length > 0) {
			dLayers.push(
				new TextLayer({
					id: "ship-clusters-badges",
					data: clustersOnly,
					getPosition: getClusterBadgePos,
					getText: getClusterBadgeText,
					getSize: 14,
					sizeUnits: "pixels",
					getColor: getClusterBadgeColor,
					background: true,
					getBackgroundColor: getClusterBadgeBg,
					backgroundPadding: [4, 2],
					billboard: true,
					pickable: false,
				}),
			);
		}
	}

	return dLayers;
}
