import React from "react";
import { BankCard, type BankCardProps } from "../../../dashboard/banking/components/bankcard";
import type { Bank } from "../types";
import type { BankLoanComparison } from "../../../dashboard/banking/types";

export interface PublicBankCardProps {
	bank: Bank;
	onInspect: (bank: Bank) => void;
	loanComparison?: BankLoanComparison | null;
	depositComparison?: import("../../../dashboard/banking/types").BankDepositComparison | null;
}

/**
 * Unified BankCard wrapper for public banking.
 * Uses the shared BankCard component with onInspect callback.
 */
export const PublicBankCard: React.FC<PublicBankCardProps> = ({ bank, onInspect, loanComparison, depositComparison }) => {
	return <BankCard bank={bank} onInspect={onInspect} loanComparison={loanComparison} depositComparison={depositComparison} />;
};

export { BankCard, type BankCardProps };
