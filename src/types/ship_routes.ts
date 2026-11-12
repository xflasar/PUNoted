// src/types/ship_routes.ts

export type StepType =
	| "LOAD"
	| "UNLOAD"
	| "REFUEL"
	| "WAIT"
	| "LOAD_SHIPMENT"
	| "UNLOAD_SHIPMENT";

export type LimitType = "PERCENTAGE" | "UNITS" | "CAPACITY";
export type FuelType = "STL" | "FTL";
export type FuelSource = "LOCAL_STORE" | "CARGO";
export type WaitUnit = "MINUTES" | "HOURS" | "DAYS";

export interface RouteStep {
	stepid: string;
	step_index: number;
	type: StepType;
	materialid: string | null;
	material_ticker: string | null;
	min_type: LimitType | null;
	min_units: number | null;
	max_type: LimitType | null;
	max_units: number | null;
	retain: number | null;
	fuel_type: FuelType | null;
	fuel_source: FuelSource | null;
	wait_amount: number | null;
	wait_unit: WaitUnit | null;
}

export interface RouteWaypoint {
	waypointid: string;
	waypoint_index: number;
	system_id: string;
	system_name: string;
	location_id: string;
	location_type: "PLANET" | "STATION" | "SYSTEM" | string;
	location_name: string;
	landing: boolean;
	fuel_usage_factor: number;
	reactor_usage_factor: number;
	ftl_preference: "FASTEST" | "SHORTEST" | string | null;
	use_gateways: boolean;
	steps: RouteStep[];
}

export interface AssignedRouteShip {
	shipid: string;
	name: string;
	registration: string;
	status: string;
	flightid: string | null;
}

export interface ShipRoute {
	routeid: string;
	naturalid: string;
	name: string;
	repeats: boolean;
	created_at: string | null;
	updated_at: string | null;
	waypoints: RouteWaypoint[];
	assigned_ships: AssignedRouteShip[];
}
