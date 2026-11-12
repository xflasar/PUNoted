import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Box, Alert, useTheme, useMediaQuery } from "@mui/material";
import BaseStarMap from "../../components/common/starmap/basestarmap";
import type { LocationFocusTarget } from "../shipping/components/shipmentdetailwidget";
import type { ShipRoute } from "../../types/ship_routes";
import { fetchUserShipRoutes } from "../../services/shiprouteservice";
import { ShippingRouteListPanel } from "./components/shippingroutelistpanel";
import { ShippingRouteDetailPanel } from "./components/shippingroutedetailpanel";
import { useGlobalData } from "../../context/globaldatacontext";
import { createShippingRouteLayer } from "../../components/common/starmap/layers/routelineslayer";

export const ShippingRoutesPage: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const { allShips, mapData } = useGlobalData();

	const [routes, setRoutes] = useState<ShipRoute[]>([]);
	const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
	const [showAllRoutes, setShowAllRoutes] = useState<boolean>(true);
	const [cameraFocus, setCameraFocus] = useState<LocationFocusTarget | null>(
		null,
	);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const loadRoutes = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await fetchUserShipRoutes();
			setRoutes(data);
		} catch (err: any) {
			setError(err.message || "Failed to load shipping routes.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadRoutes();
	}, [loadRoutes]);

	const selectedRoute = useMemo(() => {
		return routes.find((r) => r.routeid === selectedRouteId) || null;
	}, [routes, selectedRouteId]);

	// Coordinates lookup for systems
	const systemCoordinatesMap = useMemo(() => {
		const coordsMap = new Map<string, [number, number]>();
		if (mapData?.systems) {
			mapData.systems.forEach((sys: any) => {
				const id = sys.systemid || sys.naturalid || sys.id;
				if (id && sys.x != null && sys.y != null) {
					coordsMap.set(id, [sys.x, sys.y]);
				}
			});
		}
		return coordsMap;
	}, [mapData]);

	// Check if camera is currently focused inside a system
	const isSystemMode = Boolean(cameraFocus && cameraFocus.type === "SYSTEM");
	const currentSystemId = cameraFocus?.systemId || cameraFocus?.id || null;

	// Build custom shipping route paths layer for BaseStarMap
	const customRouteLayer = useMemo(() => {
		return createShippingRouteLayer({
			routes,
			selectedRouteId,
			showAll: showAllRoutes,
			isSystemMode,
			currentSystemId,
			systemCoordinatesMap,
			allPlanetsData: mapData?.planets || [],
			allStationsData: mapData?.stations || [],
		});
	}, [
		routes,
		selectedRouteId,
		showAllRoutes,
		isSystemMode,
		currentSystemId,
		systemCoordinatesMap,
		mapData,
	]);

	// Filter ships to only those assigned to active/selected routes
	const routeShipsMap = useMemo(() => {
		const targetShipIds = new Set<string>();

		routes.forEach((route) => {
			if (showAllRoutes || route.routeid === selectedRouteId) {
				route.assigned_ships.forEach((s) => targetShipIds.add(s.shipid));
			}
		});

		const filtered: Record<string, any> = {};
		allShips.forEach((ship, shipId) => {
			if (targetShipIds.has(shipId) || targetShipIds.has(ship.shipid || "")) {
				filtered[shipId] = ship;
			}
		});

		return filtered;
	}, [routes, selectedRouteId, showAllRoutes, allShips]);

	const handleFocusSystem = useCallback((systemId: string) => {
		setCameraFocus({
			type: "SYSTEM",
			id: systemId,
			systemId: systemId,
			nonce: Date.now(),
		});
	}, []);

	const handleSelectRoute = useCallback((routeId: string) => {
		// Toggle selection if clicking the same route, otherwise select
		setSelectedRouteId((prev) => (prev === routeId ? null : routeId));
	}, []);

	return (
		<Box
			sx={{
				width: "100%",
				height: "100%",
				minHeight: "100vh",
				position: "relative",
				overflow: "hidden",
				bgcolor: "#02040a",
			}}
		>
			{/* BASE STAR MAP IN BACKGROUND WITH CUSTOM ROUTE LINES LAYER */}
			<Box
				id="starmap-container"
				sx={{
					position: "absolute",
					inset: 0,
					zIndex: 1,
					width: "100%",
					height: "100%",
				}}
			>
				<BaseStarMap
					mode="shipping"
					overrideShips={routeShipsMap}
					focusTarget={cameraFocus}
					shipRoutes={routes}
					selectedRouteId={selectedRouteId}
					showAllRoutes={showAllRoutes}
				/>
			</Box>

			{/* FLOATING HUD: LEFT PANEL - ROUTE LIST & SELECTOR */}
			<Box
				sx={{
					position: "absolute",
					top: 70,
					left: 16,
					zIndex: 10,
					display: "flex",
					flexDirection: "column",
					gap: 1.5,
				}}
			>
				{error && (
					<Alert severity="error" sx={{ width: 280, borderRadius: 1.5 }}>
						{error}
					</Alert>
				)}

				<ShippingRouteListPanel
					routes={routes}
					selectedRouteId={selectedRouteId}
					showAllRoutes={showAllRoutes}
					onToggleShowAll={setShowAllRoutes}
					onSelectRoute={handleSelectRoute}
					onRefresh={loadRoutes}
					isLoading={loading}
				/>
			</Box>

			{/* FLOATING HUD: RIGHT PANEL - ROUTE DETAILS & WAYPOINTS */}
			{selectedRoute && (
				<Box
					sx={{
						position: "absolute",
						top: 70,
						right: 16,
						zIndex: 10,
					}}
				>
					<ShippingRouteDetailPanel
						route={selectedRoute}
						onClose={() => setSelectedRouteId(null)}
						onFocusSystem={handleFocusSystem}
					/>
				</Box>
			)}
		</Box>
	);
};

export default ShippingRoutesPage;
