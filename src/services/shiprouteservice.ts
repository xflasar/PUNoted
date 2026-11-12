// src/services/shiprouteservice.ts
import { API_BASE_URL } from "../config/api";
import type { ShipRoute } from "../types/ship_routes";

export async function fetchUserShipRoutes(): Promise<ShipRoute[]> {
	const token = localStorage.getItem("authToken");
	const response = await fetch(`${API_BASE_URL}internal/ship-routes/`, {
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	});

	if (!response.ok) {
		throw new Error(
			`Failed to fetch ship routes: ${response.status} ${response.statusText}`,
		);
	}

	const data = await response.json();
	return data.routes || [];
}

export async function fetchSingleShipRoute(
	routeId: string,
): Promise<ShipRoute> {
	const token = localStorage.getItem("authToken");
	const response = await fetch(
		`${API_BASE_URL}internal/ship-routes/${routeId}`,
		{
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to fetch ship route ${routeId}: ${response.status} ${response.statusText}`,
		);
	}

	return await response.json();
}
