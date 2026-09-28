export interface PlanetEnvironmentalProps {
	surfaceType?: string; // "ROCKY" | "GASEOUS"
	pressure?: number; // in atm
	gravity?: number; // in g
	temperature?: number; // in °C
}

export interface FastRepairModalProps {
	open: boolean;
	onClose: () => void;
	siteName: string;
	currentCondition?: number;
	productionLines?: any[];
	sitePlatformConditions?: any[];
	platformRepairList?: { ticker: string; amount: number }[];
	onShowSnackbar?: (msg: string) => void;
	planetProps?: PlanetEnvironmentalProps;
	richFlows?: Record<string, any>;
}

export interface PlatformBreakdownItem {
	id: string;
	ticker: string;
	condition: number;
	ageDays: number;
	repairCost: number;
	materials: Record<string, number>;
}
