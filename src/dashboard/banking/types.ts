export interface Bank {
	id: number;
	owner_username: string;
	name: string;
	headline?: string;
	description?: string;
	liquidity: number;
	default_interest_rate: number;
	created_at: string;
	active_loans_count?: number;
	total_loans_count?: number;
	total_lent_amount?: number;
	active_lent_amount?: number;
	currency?: string;
	default_repay_days?: number;
	default_interval?: string;
	min_loan_amount?: number;
	max_loan_amount?: number;
	total_deposit_amount?: number;
	total_withdrawal_amount?: number;
	depositors_count?: number;
	public_show_loans?: boolean;
	public_show_deposits?: boolean;
	public_show_withdrawals?: boolean;
	public_show_names?: boolean;
	is_public?: boolean;
	max_interest_rate?: number;
	weekly_yield_rate?: number;
	max_weekly_yield_rate?: number;
	deposit_status?: "OPEN" | "NEAR_CAPACITY" | "PAUSED";
	deposit_strategy?: "PROFIT" | "BALANCED" | "GROWTH";
	owner_is_synchronized?: boolean;
	owner_last_active?: string;
}

export interface BankLoanRecord {
	id: number;
	bank_id: number;
	requester_username: string;
	amount: number;
	interest_rate: number;
	term_days: number;
	status: "PENDING" | "APPROVED" | "REPAID" | "REJECTED";
	contract_id?: string;
	created_at: string;
	updated_at: string;
	bank_name?: string;
	partner_code?: string;
	partner_name?: string;
	contract_status?: string;
	contract_duedate?: string;
	currency?: string;
	transaction_type?: "LOAN" | "DEPOSIT" | "WITHDRAWAL";
	is_verified?: boolean;
}

export interface LinkContractPayload {
	bank_id: number;
	contract_localid: string;
	interest_rate?: number;
	term_days?: number;
}

export interface DepositorHistoryPoint {
	date: string;
	type: string;
	amount: number;
	balance: number;
	status?: string;
}

export interface DepositorWeeklySnapshot {
	week_date: string;
	starting_balance: number;
	net_deposits: number;
	effective_capital: number;
	yield_earned: number;
	closing_balance: number;
	projected_closing_balance?: number;
	is_current?: boolean;
}

export interface DepositorSummary {
	username: string;
	total_deposited: number;
	total_withdrawn: number;
	current_balance: number;
	first_deposit_date?: string;
	last_activity_date?: string;
	transactions_count: number;
	history: DepositorHistoryPoint[];
	weekly_snapshots?: DepositorWeeklySnapshot[];
	is_owner?: boolean;
	equity_share_percent?: number;
	days_active_in_cycle?: number;
	cycle_proration_factor?: number;
	weekly_yield_rate?: number;
	effective_capital?: number;
	projected_weekly_payout?: number;
}

export interface BankWeeklyHistoryPoint {
	week_date: string;
	total_pool: number;
	owner_equity: number;
	client_deposits: number;
	total_yield_distributed: number;
	depositors_count: number;
	is_current?: boolean;
}

export interface BankYieldMetrics {
	total_pool: number;
	owner_equity: number;
	owner_equity_percent: number;
	client_deposits: number;
	client_deposits_percent: number;
	weekly_yield_rate: number;
	cycle_start_date: string;
	next_distribution_date: string;
	days_elapsed_in_cycle: number;
	cycle_progress_percent: number;
	est_weekly_payout_pool: number;
	weekly_history?: BankWeeklyHistoryPoint[];
}

export interface BankDepositorsResponse {
	metrics: BankYieldMetrics;
	depositors: DepositorSummary[];
}


export interface LoanFinderCriteria {
	loanAmount: number | "";
	dailyProfit: number | "";
	ingameName: string;
	maxProfitAllocationPercent?: number; // e.g. 50%
	termWeeks?: number | ""; // e.g. 2, 4, 8 weeks (or "" for auto-calculate from daily profit)
	intervalDays?: number; // e.g. 7 (Weekly) or 14 (Bi-weekly)
}

export interface BankLoanComparison {
	bank: Bank;
	totalInterest: number;
	totalRepayment: number;
	dailyRepaymentDemand: number;
	installmentPerInterval: number;
	optimalDailyProfit: number; // based on allocation %
	userProfitSharePercent: number; // % of user's profit needed for debt
	retainedDailyProfit?: number; // daily profit retained for company operations/rest
	retainedPercent?: number; // % of profit retained
	statusTier: "COMFORTABLE" | "TIGHT" | "INSUFFICIENT";
	statusExplanation: string;
	isProfitMatch: boolean;
	profitCoveragePercent: number;
	profitSurplus: number;
	optimalLengthWeeks: number;
	optimalLengthDays: number;
	optimalIntervalWeeks: number;
	optimalIntervalDays: number;
	withinMinMax: boolean;
	hasSufficientLiquidity: boolean;
}

export interface BankDepositComparison {
	bank: Bank;
	depositAmount: number;
	weeklyYieldRate: number;
	maxWeeklyYieldRate?: number;
	monthlyYieldRate: number;
	maxMonthlyYieldRate?: number;
	weeklyPayout: number;
	monthlyPayout: number;
	annualizedRate: number;
	riskTier: "LOW" | "MODERATE" | "HIGH";
	riskLabel: string;
	riskExplanation: string;
	canAcceptDeposit: boolean;
	rejectionReason?: string;
}
