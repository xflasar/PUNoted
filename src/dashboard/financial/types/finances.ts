export interface HistoryPoint {
	Date: string;
	Balance: number;
}

export interface CashFlowMetrics {
	Income: number;
	Expense: number;
	Net: number;
}

export interface CashFlowCategory {
	Category: string;
	"7D": CashFlowMetrics;
	"30D": CashFlowMetrics;
	AllTime: CashFlowMetrics;
}

export interface PartnerMetrics {
	code: string;
	name: string;
	volume: number;
	net: number;
	lastTimestamp?: string;
}

export interface Transaction {
	Id: string;
	ContractId?: string;
	Type: string;
	Amount: number;
	ItemQuantity?: number;
	Timestamp: string;
	PartnerName: string;
	PartnerCode: string;
	Category?: string;
	Description?: string;
}

export interface CurrencyData {
	Currency: string;
	Liquid: number;
	LockedBuy: number;
	LockedSell: number;
	InventoryValue: number;
	BaseValuation?: number;
	ShipValuation?: number;
	PendingReceivable: number;
	PendingPayable: number;
	TotalAssets: number;
	CashFlows: CashFlowCategory[];
	History: HistoryPoint[];
	Transactions: Transaction[];
}

export interface FinancialPayload {
	CompanyId: string;
	Timestamp: string;
	Currencies: CurrencyData[];
}

export interface PartnerMetrics {
	code: string;
	name: string;
	volume: number;
	net: number;
}

export interface TransactionDetail {
	ReferenceId: string;
	Location: string;
	FeeAmount: number;
	FeeCurrency: string;
	ContextData: string;
}

export interface PublicCompanyProfile {
	UserId: string;
	Username: string | null;
	CompanyId: string | null;
	CompanyName: string | null;
	CompanyCode: string | null;
	SubscriptionLevel: string | null;
	HighestTier: string | null;
	Pioneer: boolean;
	Moderator: boolean;
	Team: boolean;
	Translator: boolean;
	ActiveDaysPerWeek: number;
	CreatedTimestamp: number;
	Gifts: any;
}

// Core Financial State per Currency (Specification Data Model)
export interface CurrencyLedger {
	Currency: string;
	LiquidCash: number;

	Valuations: {
		WarehouseInventory: number;
		BaseInventory: number;
		ShipCargo: number;
		FixedAssets: number;
	};

	MarketExposure: {
		CxBidsLocked: number;
		CxAsksValue: number;
		LocalMarketAdsLocked: number;
	};

	Liabilities: {
		PendingReceivables: number;
		PendingPayables: number;
		ActiveLoans: number;
		TaxesOwed: number;
	};

	CashFlows: CashFlowCategory[];
	TransactionHistory: Transaction[];
	DailyBalances: HistoryPoint[];
}
