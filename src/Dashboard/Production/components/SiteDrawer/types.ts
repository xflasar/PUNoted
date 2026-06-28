export type MaterialProps = {
	weight: number;
	volume: number;
	category: string;
};
export type LogisticsRow = {
	ticker: string;
	missing: number;
	priority?: number;
};

export type ShipState = {
	id: string;
	name: string;
	weight: number;
	volume: number;
	fleetId: string;
	loadedW: number;
	loadedV: number;
	inventory: Record<string, number>;
	primaryCategory: string | null;
};

export type CargoPlanResult = {
	fleet: ShipState[];
	fleetMaxW: number;
	fleetMaxV: number;
	idealW: number;
	idealV: number;
	loadedW: number;
	loadedV: number;
	allocatedResults: Record<string, number>;
};
