import type { Bank } from "../../dashboard/banking/types";

export interface LedgerRecord {
	id: number;
	amount: number;
	interest_rate: number;
	term_days: number;
	status: string;
	transaction_type: string;
	is_verified: boolean;
	created_at: string;
	contract_status?: string;
	contract_duedate?: string;
	currency: string;
	requester_username?: string;
}

export interface BankLedgerResponse {
	bank_id: number;
	bank_name: string;
	public_show_loans?: boolean;
	public_show_deposits?: boolean;
	public_show_withdrawals?: boolean;
	public_show_names?: boolean;
	total_loans: number;
	total_lent: number;
	total_repaid: number;
	active_lent: number;
	total_deposits?: number;
	total_withdrawals?: number;
	history: LedgerRecord[];
}

export type { Bank };
