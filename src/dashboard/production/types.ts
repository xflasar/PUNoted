export interface ProductionOrder {
	order_id: string;
	production_recipe: {
		name: string;
		inputs: { ticker: string; factor: number }[];
		outputs: { ticker: string; factor: number }[];
	};
}

export interface ProductionLine {
	line_id: string;
	type: string;
	capacity: number;
	efficiency: number;
	condition: number;
	queue: ProductionOrder[];
}

// Rich flow object containing calculated values
export interface FlowData {
	ticker: string;
	flow: number; // Net flow (Production - Consumption)
	baseFlow: number; // Original API flow
	workforceFlow: number; // Workforce consumption (negative)
	currentAmount: number; // Total amount available
	siteAmount?: number; // Amount stored in site (automatically used)
	warehouseAmount?: number; // Amount stored in warehouse (manually used)
	daysRemaining: number;
	missing: number; // Amount needed to meet target
	isProduction: boolean; // True if flow > 0
}

export interface StorageItem {
	ticker: string;
	amount: number;
	material_id: string;
	type?: string;
}

export interface SiteSummary {
	planetid: any;
	siteid?: string;
	planet_name: string;
	area: number;
	invested_permits: number;
	maximum_permits: number;
	site_daily_flow: Record<string, { flow: number; currentAmount: number }>;
	production_lines: ProductionLine[];
	storage_items: StorageItem[];
	overall_platform_condition: number;
	warning_level: number;
	isLeased?: boolean;
	tenant?: string;
}

export interface SiteWithFlows {
	siteid: string;
	site: SiteSummary;
	richFlows: Record<string, FlowData>;
}

// Workforce
export interface Need {
	ticker: string;
	unitsperinterval: number;
	currentamount: number;
}

export interface WorkforceLevel {
	needs: Need[];
}

export interface GroupedWorkforceData {
	[siteId: string]: WorkforceLevel[];
}

export interface ApiResponse {
	success: boolean;
	data: Record<string, SiteSummary>;
}

export interface ApiResponseWorkforce {
	success: boolean;
	data: GroupedWorkforceData;
}
