// --- Core Data Structures ---

export interface Material {
	ticker: string;
	name: string;
	volume: number; // m³ per unit
	tonnage: number; // tons per unit
}

export interface StorageItem {
	materialTicker: string;
	amount: number;
}

export interface Storage {
	id: string;
	name: string;
	maxTonnage: number;
	maxVolume: number;
	currentTonnage: number;
	currentVolume: number;
	items: StorageItem[];
}

// --- Main Entities ---

export interface Site {
	id: string;
	name: string;
	planetName: string;
	siteStorage: Storage;
	warehouse: Storage | null;
	dailyProduction: {
		materialTicker: string;
		amount: number;
		tonnage: number;
		volume: number;
	}[];
	dailyConsumption: {
		materialTicker: string;
		amount: number;
		tonnage: number;
		volume: number;
	}[];
}

export interface FlightSegment {
	segment_type: "TAKE_OFF" | "TRANSIT" | "LANDING";
	segment_index: number;
	departure: number; // timestamp
	arrival: number; // timestamp
	duration: number;
	destination_location_id: string;
	// Add other fields from the API if needed for UI
}

export interface FlightPlan {
	id: string;
	shipid: string;
	arrivaltimestamp: string; // ISO 8601 date string
	departuretimestamp: string; // ISO 8601 date string
	destinationplanetid: string;
	originplanetid: string;
	segments: FlightSegment[];
	// Add other fields from the API if needed for UI
}

export interface Ship {
	id: string;
	name: string;
	shipStorage: Storage;
	status: "idle" | "in-transit" | "docked";
	locationId: string | null;
	assignedSiteId: string | null;
	currentFlight: FlightPlan | null;
}

export interface CX {
	id: string;
	name: string;
	location: string; // Planet name
	listings: { materialTicker: string; price: number; quantity: number }[];
}

// --- Logistics & Automation ---

export interface Bottleneck {
	type: "material_shortage" | "storage_overflow";
	siteId: string;
	siteName: string;
	materialTicker: string;
	details: string;
	dailyNeed: number;
	currentAmount: number;
}

export interface LogisticsSummary {
	systemNetBalance: { materialTicker: string; netAmount: number }[];
	transportAnalysis: {
		totalShipCapacityTonnage: number;
		requiredTransportTonnage: number;
		totalShipCapacityVolume: number;
		requiredTransportVolume: number;
		sufficiencyStatus: "sufficient" | "insufficient" | "balanced";
	};
	bottlenecks: Bottleneck[];
}

export interface TransportRecommendation {
	id: string;
	fromId: string; // site or CX id
	toId: string; // site id
	fromName?: string;
	toName?: string;
	materialTicker: string;
	amount: number;
	priority: "critical" | "high" | "medium" | "low";
	reason: string;
}
