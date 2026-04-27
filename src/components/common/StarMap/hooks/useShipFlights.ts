import { useState, useEffect } from "react";
import type { FlightPlan } from "../types/mapTypes";

interface ShipFlightsResponse {
	success: boolean;
	data: FlightPlan[];
}

export const useShipFlights = () => {
	const [shipFlights, setShipFlights] = useState<FlightPlan[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchShipFlights = async () => {
			setLoading(true);
			setError(null);
			try {
				const response = await fetch(
					"https://api.punoted.net/user_ships_flights",
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("authToken")}`,
							"Content-Type": "application/json",
						},
					},
				);

				if (!response.ok) {
					throw new Error(`Failed to fetch ship flights: ${response.status}`);
				}

				const data: ShipFlightsResponse = await response.json();

				if (data.success) {
					setShipFlights(data.data);
				} else {
					setError(
						"Failed to fetch ship flights: API returned unsuccessful status",
					);
				}
			} catch (e: any) {
				setError(`Failed to fetch ship flights: ${e.message}`);
			} finally {
				setLoading(false);
			}
		};

		fetchShipFlights();
	}, []);

	return { shipFlights, loading, error };
};

export interface FlightPlan {
	id: string;
	shipId: string;
	segments: FlightSegment[];
}

export interface FlightSegment {
	origin: { x: number; y: number };
	destination: { x: number; y: number };
	departure: number;
	arrival: number;
}
