export interface ContractListItem {
	id: string;
	localid?: string;
	name?: string;
	preamble?: string;
	date: string;
	status:
	| "PENDING"
	| "ACCEPTED"
	| "FULFILLED"
	| "BREACHED"
	| "CANCELLED"
	| "REJECTED";
	contracttype?: string;
	partnername?: string;
	partnercode?: string;
	duedate?: string;
	total_amount: number;
	currency: string;
	operation_type?: string;
	party?: string; // CUSTOMER or PROVIDER
}

export interface WeeklyStats {
	revenue: number;
	expenses: number;
	net: number;
	count: number;
}

export interface DashboardStats {
	current_week: WeeklyStats;
	last_week: WeeklyStats;
	total_active: number;
	total_breached_final: number;
	active_breached: number;
}

export interface DashboardWidgets {
	immediate: ContractListItem[];
	active: ContractListItem[];
	breached: ContractListItem[];
}

export interface Condition {
	id: string;
	type: string;
	status: string;
	index: number;
	party?: string;
	contractparty?: string;
	deadline?: string;
	amountmoney?: number;
	currencymoney?: string;
	interestamount?: number;
	currency?: string;
	repaymentamount?: number;
	totalamount?: number;
	implied_interest_rate?: number;
	material_summary?: string;
	material_ticker?: string;
	amount?: number;
	addresssystemid?: string;
	addressplanetid?: string;
	addressstationid?: string;
	destinationsystemid?: string;
	destinationplanetid?: string;
	destinationstationid?: string;
	reputationchange?: number;
	addresssystemname?: string;
	addressplanetname?: string;
	addressstationname?: string;
	destinationsystemname?: string;
	destinationplanetname?: string;
	destinationstationname?: string;
}

export interface ContractDetailData {
	id: string;
	localid?: string;
	name?: string;
	date: string;
	status: string;
	contracttype?: string;
	partnername?: string;
	partnercode?: string;
	duedate?: string;
	preamble?: string;
	party?: string;
	is_income?: boolean;
	total_amount?: number;
	currency?: string;
	motion_planet_name?: string;
	conditions: Condition[];
}

export interface VendorOrder {
	id?: string;
	ticker?: string;
	price?: number;
	type?: string;
}

export interface UseContractDetailProps {
	contractId: string | null;
	open: boolean;
}

export interface UseContractDetailResult {
	contract: Contract | null;
	vendorOrders: VendorOrder[];
	loading: boolean;
	theme: any;
	corpPrices: any;
	marketData: any;
	storageState: any;
	financialData: any;
}

export interface Contract extends ContractDetailData {
	id: string;
	partner: string;
	partner_code: string;
	partner_name: string;
	fulfillment_percentage: number;
	action_state: any;
	total_amount: number;
	amount_color: string;
	contract_currency: string;
	is_income: boolean;
	has_amount: boolean;
	sign: string;
	status: string;
	total_cond_count: number;
	fulfilled_cond_count: number;
}
