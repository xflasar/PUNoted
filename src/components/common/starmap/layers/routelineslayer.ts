import { PathLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { ShipRoute } from "../../../../types/ship_routes";
import type { MapPoint } from "../types/maptypes";
import { findSystemPath } from "../utils/pathfinding";

interface RouteLinesLayerProps {
	routes: ShipRoute[];
	selectedRouteId: string | null;
	showAll: boolean;
	isSystemMode: boolean;
	currentSystemId: string | null;
	systemCoordinatesMap: Map<string, [number, number]>;
	allPlanetsData?: any[];
	allStationsData?: any[];
	rawConnections?: any[];
	systemsPoints?: MapPoint[];
}

export const createShippingRouteLayer = ({
	routes,
	selectedRouteId,
	showAll,
	isSystemMode,
	currentSystemId,
	systemCoordinatesMap,
	allPlanetsData = [],
	allStationsData = [],
	rawConnections = [],
	systemsPoints = [],
}: RouteLinesLayerProps) => {
	if (!routes || routes.length === 0) return [];

	// Lookup maps for in-system coordinates (current position of planets and stations)
	const bodyCoordMap = new Map<string, [number, number]>();
	if (isSystemMode && currentSystemId) {
		allPlanetsData.forEach((p: any) => {
			if (p.x != null && p.y != null) {
				if (p.planetid) bodyCoordMap.set(p.planetid, [p.x, p.y]);
				if (p.name) bodyCoordMap.set(p.name.toLowerCase(), [p.x, p.y]);
			}
		});
		allStationsData.forEach((s: any) => {
			if (s.x != null && s.y != null) {
				if (s.stationid) bodyCoordMap.set(s.stationid, [s.x, s.y]);
				if (s.name) bodyCoordMap.set(s.name.toLowerCase(), [s.x, s.y]);
			}
		});
	}

	const routeSegments: any[] = [];

	routes.forEach((route) => {
		const isSelected = route.routeid === selectedRouteId;
		if (!showAll && !isSelected) return;

		const waypoints = route.waypoints;
		if (waypoints.length < 2) return;

		const totalSteps = route.repeats ? waypoints.length : waypoints.length - 1;

		for (let i = 0; i < totalSteps; i++) {
			const wp1 = waypoints[i];
			const wp2 = waypoints[(i + 1) % waypoints.length];

			if (isSystemMode && currentSystemId) {
				// SYSTEM VIEW:
				const wp1InSystem = wp1.system_id === currentSystemId;
				const wp2InSystem = wp2.system_id === currentSystemId;

				if (wp1InSystem && wp2InSystem) {
					// Both waypoints inside the current system
					const pos1 =
						bodyCoordMap.get(wp1.location_id) ||
						bodyCoordMap.get(wp1.location_name?.toLowerCase()) ||
						systemCoordinatesMap.get(wp1.system_id);
					const pos2 =
						bodyCoordMap.get(wp2.location_id) ||
						bodyCoordMap.get(wp2.location_name?.toLowerCase()) ||
						systemCoordinatesMap.get(wp2.system_id);

					if (pos1 && pos2) {
						routeSegments.push({
							path: [pos1, pos2],
							color: isSelected ? [123, 104, 238, 240] : [100, 100, 160, 130],
							width: isSelected ? 3 : 1.5,
						});
					}
				} else if (wp1InSystem && !wp2InSystem) {
					// Exiting system towards wp2's external system
					const pos1 =
						bodyCoordMap.get(wp1.location_id) ||
						bodyCoordMap.get(wp1.location_name?.toLowerCase()) ||
						systemCoordinatesMap.get(wp1.system_id);

					// Determine immediate next jump system using Dijkstra
					const hops = findSystemPath(
						wp1.system_id,
						wp2.system_id,
						rawConnections,
						systemsPoints,
					);
					const nextHopSysId = hops.length > 1 ? hops[1] : wp2.system_id;

					const extSysCoords =
						systemCoordinatesMap.get(nextHopSysId) ||
						systemCoordinatesMap.get(wp2.system_id);
					const curSysCoords = systemCoordinatesMap.get(currentSystemId);

					if (pos1 && extSysCoords && curSysCoords) {
						const dx = extSysCoords[0] - curSysCoords[0];
						const dy = extSysCoords[1] - curSysCoords[1];
						const len = Math.sqrt(dx * dx + dy * dy) || 1;
						const exitDistance = 350;
						const exitPos: [number, number] = [
							pos1[0] + (dx / len) * exitDistance,
							pos1[1] + (dy / len) * exitDistance,
						];

						routeSegments.push({
							path: [pos1, exitPos],
							color: isSelected ? [255, 171, 0, 220] : [180, 140, 50, 120],
							width: isSelected ? 2.5 : 1.5,
						});
					}
				} else if (!wp1InSystem && wp2InSystem) {
					// Entering system from wp1's external system
					const pos2 =
						bodyCoordMap.get(wp2.location_id) ||
						bodyCoordMap.get(wp2.location_name?.toLowerCase()) ||
						systemCoordinatesMap.get(wp2.system_id);

					// Determine last jump system before entering this system
					const hops = findSystemPath(
						wp1.system_id,
						wp2.system_id,
						rawConnections,
						systemsPoints,
					);
					const prevHopSysId =
						hops.length > 1 ? hops[hops.length - 2] : wp1.system_id;

					const extSysCoords =
						systemCoordinatesMap.get(prevHopSysId) ||
						systemCoordinatesMap.get(wp1.system_id);
					const curSysCoords = systemCoordinatesMap.get(currentSystemId);

					if (pos2 && extSysCoords && curSysCoords) {
						const dx = extSysCoords[0] - curSysCoords[0];
						const dy = extSysCoords[1] - curSysCoords[1];
						const len = Math.sqrt(dx * dx + dy * dy) || 1;
						const enterDistance = 350;
						const enterPos: [number, number] = [
							pos2[0] + (dx / len) * enterDistance,
							pos2[1] + (dy / len) * enterDistance,
						];

						routeSegments.push({
							path: [enterPos, pos2],
							color: isSelected ? [0, 229, 255, 220] : [50, 140, 180, 120],
							width: isSelected ? 2.5 : 1.5,
						});
					}
				}
			} else {
				// GALAXY VIEW:
				// Calculate complete path through connections/hyperlanes between wp1 and wp2
				if (wp1.system_id !== wp2.system_id) {
					const hops = findSystemPath(
						wp1.system_id,
						wp2.system_id,
						rawConnections,
						systemsPoints,
					);
					for (let h = 0; h < hops.length - 1; h++) {
						const sysA = systemCoordinatesMap.get(hops[h]);
						const sysB = systemCoordinatesMap.get(hops[h + 1]);
						if (sysA && sysB) {
							routeSegments.push({
								path: [sysA, sysB],
								color: isSelected ? [123, 104, 238, 255] : [90, 80, 160, 140],
								width: isSelected ? 3.5 : 1.8,
							});
						}
					}
				}
			}
		}
	});

	// --- Waypoint Badges (Additive waypoint numbers) ---
	const activeRoutes = routes.filter((r) => {
		if (selectedRouteId) return r.routeid === selectedRouteId;
		return showAll;
	});

	const badgeMap = new Map<
		string,
		{
			key: string;
			position: [number, number];
			numbers: number[];
			name: string;
			isSelected: boolean;
		}
	>();

	activeRoutes.forEach((route) => {
		const isSelected = route.routeid === selectedRouteId;
		route.waypoints.forEach((wp, idx) => {
			const num =
				wp.position ||
				(wp.waypoint_index != null ? wp.waypoint_index + 1 : idx + 1);

			if (isSystemMode && currentSystemId) {
				if (wp.system_id === currentSystemId) {
					const locKey =
						wp.location_id || wp.location_name?.toLowerCase() || wp.system_id;
					const pos =
						bodyCoordMap.get(wp.location_id) ||
						bodyCoordMap.get(wp.location_name?.toLowerCase()) ||
						systemCoordinatesMap.get(wp.system_id);

					if (pos) {
						const existing = badgeMap.get(locKey);
						if (existing) {
							if (!existing.numbers.includes(num)) existing.numbers.push(num);
						} else {
							badgeMap.set(locKey, {
								key: locKey,
								position: pos,
								numbers: [num],
								name: wp.location_name || wp.system_name,
								isSelected,
							});
						}
					}
				}
			} else {
				// Galaxy View
				const sysKey = wp.system_id;
				const pos = systemCoordinatesMap.get(sysKey);
				if (pos) {
					const existing = badgeMap.get(sysKey);
					if (existing) {
						if (!existing.numbers.includes(num)) existing.numbers.push(num);
					} else {
						badgeMap.set(sysKey, {
							key: sysKey,
							position: pos,
							numbers: [num],
							name: wp.system_name,
							isSelected,
						});
					}
				}
			}
		});
	});

	const badgeData = Array.from(badgeMap.values()).map((b) => {
		b.numbers.sort((a, b) => a - b);
		return {
			...b,
			badgeText: b.numbers.join(", "),
		};
	});

	const layers: any[] = [];

	if (routeSegments.length > 0) {
		layers.push(
			new PathLayer({
				id: `shipping-routes-visual-layer-${isSystemMode ? "sys" : "gal"}`,
				data: routeSegments,
				getPath: (d: any) => d.path,
				getColor: (d: any) => d.color,
				getWidth: (d: any) => d.width,
				widthUnits: "pixels",
				widthMinPixels: 1.5,
				widthMaxPixels: 6,
				jointRounded: true,
				capRounded: true,
				parameters: { depthTest: false },
				pickable: false,
				updateTriggers: {
					getPath: [
						routes,
						isSystemMode,
						currentSystemId,
						bodyCoordMap,
						rawConnections,
					],
					getColor: [selectedRouteId, showAll],
					getWidth: [selectedRouteId, showAll],
				},
			}),
		);
	}

	if (badgeData.length > 0) {
		// Waypoint node indicator dot
		layers.push(
			new ScatterplotLayer({
				id: `shipping-route-nodes-${isSystemMode ? "sys" : "gal"}`,
				data: badgeData,
				getPosition: (d: any) => d.position,
				getRadius: 6,
				radiusUnits: "pixels",
				radiusMinPixels: 4,
				radiusMaxPixels: 10,
				getFillColor: [123, 104, 238, 230],
				getLineColor: [255, 255, 255, 240],
				getLineWidth: 2,
				lineWidthUnits: "pixels",
				stroked: true,
				filled: true,
				parameters: { depthTest: false },
				pickable: false,
				updateTriggers: {
					getPosition: [badgeData],
				},
			}),
		);

		// Waypoint additive number badge
		layers.push(
			new TextLayer({
				id: `shipping-route-badges-${isSystemMode ? "sys" : "gal"}`,
				data: badgeData,
				getPosition: (d: any) => d.position,
				getText: (d: any) => d.badgeText,
				getSize: 11,
				getColor: [255, 255, 255, 255],
				fontFamily: "Inter, Roboto, monospace, sans-serif",
				fontWeight: 600,
				getTextAnchor: "middle",
				getAlignmentBaseline: "center",
				getPixelOffset: [0, -18],
				billboard: true,
				background: true,
				getBackgroundColor: [20, 18, 38, 235],
				getBorderColor: [138, 110, 255, 255],
				getBorderWidth: 1.5,
				backgroundPadding: [5, 3],
				parameters: { depthTest: false },
				pickable: false,
				updateTriggers: {
					getText: [badgeData],
					getPosition: [badgeData],
				},
			}),
		);
	}

	return layers;
};
