import type { FlightPlan } from "../../components/common/StarMap/types/mapTypes";

/** * Represents the current stage of the shipment contract 
 */
export type ShipmentStage = 'PROVISION' | 'PICKUP' | 'DELIVERY';

/** * Tracking status based on whether the partner is registered in the DB 
 */
export type TrackingStatus = 'ACTIVE' | 'UNAVAILABLE_NOT_REGISTERED';

/**
 * Role of the logged-in user in the contract
 */
export type ShipmentRole = 'CLIENT' | 'CARRIER';

export interface ShipmentData {
    // Metadata
    contract_id: string;
    contract_local_id: string;
    created_at: string;
    my_role: 'CLIENT' | 'CARRIER';
    partner_username: string;
    tracking_status: 'ACTIVE' | 'UNAVAILABLE_NOT_REGISTERED';

    // Location Info
    location_type: 'SHIP' | 'STATION' | 'SITE' | 'UNKNOWN';
    location_name: string;
    system_name: string | null;
    systemid: string | null;
    planetid: string | null;

    // Moving Data
    shipid: string | null;
    ship_name: string | null;
    active_flight_plan: FlightPlan | null; // <--- The new JSON object from SQL

    // Destination Info (Helper fields)
    flight_dest_system_name?: string;
    flight_arrival?: string;
}

// 1. The Ship Object (Telemetry Source)
export interface ShipmentShip {
    id: string;
    name: string;
    registration: string | null;
    flight: FlightPlan | null; // Full flight plan with segments
}

// 2. The Item Object (Logical Cargo)
export interface ShipmentItem {
    item_id: string;
    location_type: 'SHIP' | 'STATION' | 'SITE' | 'UNKNOWN';
    location_name: string;
    system_name: string | null;
    systemid: string | null;
    planetid: string | null;
    shipid: string | null; // Reference key to the ships dictionary
}

// 3. The Contract Object (Business Logic)
export interface ShipmentContract {
    contract_id: string;
    local_id: string;
    partner_name: string;
    role: 'CLIENT' | 'CARRIER';
    created_at: string;
    items: ShipmentItem[];
}

// 4. The Global State Container
export interface ShipmentState {
    contracts: ShipmentContract[];
    ships: Record<string, ShipmentShip>; // Dictionary: { "ship-id": ShipData }
}