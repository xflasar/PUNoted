import type { Bank, BankLoanRecord, BankLoanComparison } from "./types";
import { formatAmount, formatPrice } from "../../utils/formaters";

export { formatAmount, formatPrice };

export const PRUN_CURRENCIES = [
	{ code: "ICA", name: "Austral" },
	{ code: "AIC", name: "Martian Coin" },
	{ code: "CIS", name: "Sol" },
	{ code: "NCC", name: "NCE Coupons" },
] as const;

export const getCurrencyFullName = (code?: string): string => {
	const match = PRUN_CURRENCIES.find((c) => c.code === code);
	return match ? match.name : code || "ICA";
};

export const formatPaymentInterval = (val?: string | number | null): string => {
	if (!val && val !== 0) return "At Maturity";
	const str = String(val).trim();
	if (!str || str === "0" || str.toLowerCase() === "at maturity") return "At Maturity";
	if (str.toUpperCase() === "WEEKLY" || str === "7") return "7 Days (Weekly)";
	if (str.toUpperCase() === "BIWEEKLY" || str === "14") return "14 Days (Bi-weekly)";
	if (str.toUpperCase() === "MONTHLY" || str === "28") return "28 Days (4 Weeks)";
	if (/^\d+$/.test(str)) {
		const num = parseInt(str, 10);
		if (num === 0) return "At Maturity";
		if (num % 7 === 0) {
			const weeks = num / 7;
			return `${num} Days (${weeks} ${weeks === 1 ? "Week" : "Weeks"})`;
		}
		return `${num} Days`;
	}
	return str;
};

export const formatPaymentIntervalShort = (val?: string | number | null): string => {
	if (!val && val !== 0) return "At Maturity";
	const str = String(val).trim();
	if (!str || str === "0" || str.toLowerCase() === "at maturity") return "At Maturity";
	if (str.toUpperCase() === "WEEKLY" || str === "7") return "7d (Weekly)";
	if (str.toUpperCase() === "BIWEEKLY" || str === "14") return "14d (2w)";
	if (str.toUpperCase() === "MONTHLY" || str === "28") return "28d (4w)";
	if (/^\d+$/.test(str)) {
		const num = parseInt(str, 10);
		return `${num}d`;
	}
	return str;
};

export const formatTermWeeks = (days?: number | null): string => {
	if (!days) return "-";
	if (days % 7 === 0) {
		const w = days / 7;
		return `${w} ${w === 1 ? "Week" : "Weeks"}`;
	}
	const w = (days / 7).toFixed(1).replace(/\.0$/, "");
	return `${w} Weeks`;
};

export interface OwnerActivityStatus {
	label: string;
	color: string;
	dotColor: string;
	isOnline: boolean;
	isSynchronized: boolean;
}

export const getOwnerActiveStatus = (
	lastActive?: string | null,
	isSynchronized: boolean = true,
): OwnerActivityStatus => {
	if (!isSynchronized) {
		return {
			label: "Not Synced",
			color: "text.disabled",
			dotColor: "#9e9e9e",
			isOnline: false,
			isSynchronized: false,
		};
	}

	if (!lastActive) {
		return {
			label: "Offline",
			color: "text.secondary",
			dotColor: "#9e9e9e",
			isOnline: false,
			isSynchronized: true,
		};
	}

	const diff = Date.now() - new Date(lastActive).getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 15) {
		return {
			label: "Active Now",
			color: "#34d399",
			dotColor: "#10b981",
			isOnline: true,
			isSynchronized: true,
		};
	}

	if (days >= 7) {
		return {
			label: "Inactive",
			color: "#f87171",
			dotColor: "#ef4444",
			isOnline: false,
			isSynchronized: true,
		};
	}

	let timeAgo = "Just now";
	if (days > 0) timeAgo = `${days}d ago`;
	else if (hours > 0) timeAgo = `${hours}h ago`;
	else if (minutes > 0) timeAgo = `${minutes}m ago`;

	if (days >= 3) {
		return {
			label: timeAgo,
			color: "#fbbf24",
			dotColor: "#f59e0b",
			isOnline: false,
			isSynchronized: true,
		};
	}

	return {
		label: timeAgo,
		color: "#34d399",
		dotColor: "#10b981",
		isOnline: true,
		isSynchronized: true,
	};
};

export interface VaultMetrics {
	activeLoans: BankLoanRecord[];
	activeCapitalOut: number;
	repaidLoans: BankLoanRecord[];
	totalRepaidCapital: number;
	totalDeposits: number;
	totalWithdrawals: number;
	netDeposits: number;
	verifiedLentCapital: number;
	unverifiedLentCapital: number;
	availableLendingCapacity: number;
}

/**
 * Computes live banking vault metrics based on the bank's liquidity, linked loans, and customer deposits.
 */
export const calculateVaultMetrics = (
	bank: Bank | null,
	loans: BankLoanRecord[],
): VaultMetrics => {
	const loanTransactions = loans.filter((l) => (l.transaction_type || "LOAN") === "LOAN");
	const activeLoans = loanTransactions.filter((l) => l.status === "APPROVED");
	const activeCapitalOut = activeLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
	const repaidLoans = loanTransactions.filter((l) => l.status === "REPAID");
	const totalRepaidCapital = repaidLoans.reduce((sum, l) => sum + (l.amount || 0), 0);

	const verifiedLentCapital = loanTransactions
		.filter((l) => l.is_verified)
		.reduce((sum, l) => sum + (l.amount || 0), 0);
	const unverifiedLentCapital = loanTransactions
		.filter((l) => !l.is_verified)
		.reduce((sum, l) => sum + (l.amount || 0), 0);

	const deposits = loans.filter((l) => l.transaction_type === "DEPOSIT" && l.status !== "REJECTED");
	const withdrawals = loans.filter((l) => l.transaction_type === "WITHDRAWAL" && l.status !== "REJECTED");
	const totalDeposits = deposits.reduce((sum, l) => sum + (l.amount || 0), 0);
	const totalWithdrawals = withdrawals.reduce((sum, l) => sum + (l.amount || 0), 0);
	const netDeposits = Math.max(0, totalDeposits - totalWithdrawals);

	const availableLendingCapacity = Math.max(
		0,
		(bank?.liquidity || 0) + netDeposits - activeCapitalOut,
	);

	return {
		activeLoans,
		activeCapitalOut,
		repaidLoans,
		totalRepaidCapital,
		totalDeposits,
		totalWithdrawals,
		netDeposits,
		verifiedLentCapital,
		unverifiedLentCapital,
		availableLendingCapacity,
	};
};

/**
 * Formats an ISO date string into a localized short date.
 */
export const formatBankDate = (dateStr?: string | null): string => {
	if (!dateStr) return "N/A";
	try {
		return new Date(dateStr).toLocaleDateString();
	} catch {
		return dateStr;
	}
};

/**
 * Maps a loan status string to MUI Chip color and label properties.
 */
export const getLoanStatusChipProps = (
	status: string,
	transactionType?: string,
): { label: string; color: "success" | "warning" | "info" | "error" | "default" | "primary" } => {
	const t = transactionType?.toUpperCase();
	switch (status) {
		case "REPAID":
			return { label: "REPAID", color: "success" };
		case "APPROVED":
			if (t === "DEPOSIT") return { label: "SETTLED", color: "success" };
			if (t === "WITHDRAWAL") return { label: "DISBURSED", color: "error" };
			return { label: "ACTIVE", color: "primary" };
		case "PENDING":
			if (t === "DEPOSIT") return { label: "PENDING PAYMENT", color: "warning" };
			if (t === "WITHDRAWAL") return { label: "PENDING PAYOUT", color: "warning" };
			return { label: "PENDING", color: "warning" };
		case "REJECTED":
			return { label: "REJECTED", color: "error" };
		default:
			return { label: status, color: "default" };
	}
};

/**
 * Maps a transaction type to label, theme-specific colors, and border styling.
 * - WITHDRAWAL: Red (error palette: #ff5252)
 * - DEPOSIT: Green (success palette: #69f0ae)
 * - LOAN: Theme (primary palette: #7b68ee)
 */
export const getTransactionTypeChipProps = (
	type?: string,
	theme?: any,
): { label: string; bg: string; color: string; border: string } => {
	const t = type?.toUpperCase();
	switch (t) {
		case "DEPOSIT": {
			const main = theme?.palette?.success?.main || "#69f0ae";
			const light = theme?.palette?.success?.light || "#8cf5c2";
			return {
				label: "DEPOSIT",
				bg: "rgba(105, 240, 174, 0.14)",
				color: light,
				border: "rgba(105, 240, 174, 0.3)",
			};
		}
		case "WITHDRAWAL": {
			const main = theme?.palette?.error?.main || "#ff5252";
			const light = theme?.palette?.error?.light || "#ff7676";
			return {
				label: "WITHDRAWAL",
				bg: "rgba(255, 82, 82, 0.14)",
				color: light,
				border: "rgba(255, 82, 82, 0.3)",
			};
		}
		case "LOAN":
		default: {
			const main = theme?.palette?.primary?.main || "#7b68ee";
			const light = theme?.palette?.primary?.light || "#9988ff";
			return {
				label: "LOAN",
				bg: "rgba(123, 104, 238, 0.14)",
				color: light,
				border: "rgba(123, 104, 238, 0.3)",
			};
		}
	}
};

/**
 * Calculates loan suitability, interest, repayment, and required daily profit for a specific bank.
 * Derives optimal fast repayment from the borrower's profit & allocation budget rather than fixed bank defaults,
 * ensuring the player repays swiftly while retaining enough profit for company operations.
 */
export const calculateBankLoanComparison = (
	bank: Bank,
	loanAmount: number,
	dailyProfit: number,
	maxAllocationPercent: number = 50,
	customTermWeeks?: number | "",
	customIntervalDays: number = 7,
): BankLoanComparison => {
	const rate = bank.default_interest_rate || 5.0;
	const totalInterest = loanAmount * (rate / 100);
	const totalRepayment = loanAmount + totalInterest;

	const allocationFactor = Math.max(0.1, Math.min(1.0, (maxAllocationPercent || 50) / 100));
	const retainedPercent = Math.round((1 - allocationFactor) * 100);

	const intervalDays = customIntervalDays > 0 ? customIntervalDays : 7;
	const intervalWeeks = intervalDays / 7;
	const optimalIntervalWeeks = intervalWeeks;
	const optimalIntervalDays = intervalDays;

	let optimalLengthDays: number;
	let optimalLengthWeeks: number;
	let installmentPerInterval: number;
	let dailyRepaymentDemand: number;
	let optimalDailyProfit: number;
	let userProfitSharePercent: number;
	let retainedDailyProfit: number;

	const specifiedWeeks = typeof customTermWeeks === "number" && customTermWeeks > 0 ? customTermWeeks : null;

	if (specifiedWeeks) {
		// User explicitly selected loan duration in weeks
		optimalLengthWeeks = specifiedWeeks;
		optimalLengthDays = specifiedWeeks * 7;
		const totalIntervals = Math.max(1, optimalLengthDays / intervalDays);
		installmentPerInterval = Math.round(totalRepayment / totalIntervals);
		dailyRepaymentDemand = installmentPerInterval / intervalDays;

		if (dailyProfit > 0) {
			userProfitSharePercent = Math.round((dailyRepaymentDemand / dailyProfit) * 1000) / 10;
			optimalDailyProfit = dailyProfit;
			retainedDailyProfit = Math.max(0, dailyProfit - dailyRepaymentDemand);
		} else {
			userProfitSharePercent = 0;
			optimalDailyProfit = Math.round(dailyRepaymentDemand / allocationFactor);
			retainedDailyProfit = 0;
		}
	} else if (dailyProfit > 0) {
		// Auto-calculated duration based on player profit & budget allocation
		const dailyRepayBudget = dailyProfit * allocationFactor;
		optimalLengthDays = Math.max(7, Math.ceil(totalRepayment / dailyRepayBudget));
		optimalLengthWeeks = Math.max(1, Math.ceil(optimalLengthDays / 7));
		optimalLengthDays = optimalLengthWeeks * 7;

		const totalIntervals = Math.max(1, optimalLengthDays / intervalDays);
		installmentPerInterval = Math.round(totalRepayment / totalIntervals);
		dailyRepaymentDemand = installmentPerInterval / intervalDays;
		userProfitSharePercent = Math.round((dailyRepaymentDemand / dailyProfit) * 1000) / 10;
		optimalDailyProfit = dailyProfit;
		retainedDailyProfit = Math.max(0, dailyProfit - dailyRepaymentDemand);
	} else {
		// Default duration: use bank's default_repay_days or standard 4-week benchmark
		const defaultDays = bank.default_repay_days && bank.default_repay_days > 0 ? bank.default_repay_days : 28;
		optimalLengthWeeks = Math.max(1, Math.round(defaultDays / 7));
		optimalLengthDays = optimalLengthWeeks * 7;

		const totalIntervals = Math.max(1, optimalLengthDays / intervalDays);
		installmentPerInterval = Math.round(totalRepayment / totalIntervals);
		dailyRepaymentDemand = installmentPerInterval / intervalDays;
		userProfitSharePercent = 0;
		optimalDailyProfit = Math.round(dailyRepaymentDemand / allocationFactor);
		retainedDailyProfit = 0;
	}

	// Bank lending constraints
	const withinMinMax =
		(!bank.min_loan_amount || loanAmount >= bank.min_loan_amount) &&
		(!bank.max_loan_amount || loanAmount <= bank.max_loan_amount);

	const hasSufficientLiquidity = (bank.liquidity || 0) >= loanAmount;

	let statusTier: "COMFORTABLE" | "TIGHT" | "INSUFFICIENT" = "COMFORTABLE";
	let statusExplanation = "";

	if (!withinMinMax) {
		statusTier = "INSUFFICIENT";
		statusExplanation = `Loan amount (${formatAmount(loanAmount)} ICA) is outside this bank's limits (${formatAmount(bank.min_loan_amount || 0)} - ${formatAmount(bank.max_loan_amount || 0)} ICA).`;
	} else if (!hasSufficientLiquidity) {
		statusTier = "INSUFFICIENT";
		statusExplanation = `Loan amount exceeds available vault liquidity (${formatAmount(bank.liquidity || 0)} ICA).`;
	} else if (dailyProfit <= 0) {
		statusTier = "TIGHT";
		statusExplanation = `Optimal profit is ~${formatAmount(optimalDailyProfit)} ICA/day to pay off in 4W at ${maxAllocationPercent}% repay budget.`;
	} else if (optimalLengthWeeks > 52) {
		statusTier = "INSUFFICIENT";
		statusExplanation = `Payoff would exceed 1 year (${optimalLengthWeeks}W) at current profit. Increase repayment % or decrease loan.`;
	} else if (optimalLengthWeeks > 26) {
		statusTier = "TIGHT";
		statusExplanation = `Extended term: ~${optimalLengthWeeks}W (${optimalLengthDays}d) to pay off at ${maxAllocationPercent}% profit (~${formatAmount(installmentPerInterval)}/W). Keeps ${retainedPercent}% for operations.`;
	} else {
		statusTier = "COMFORTABLE";
		statusExplanation = `Fast payoff in ${optimalLengthWeeks}W (${optimalLengthDays}d) at ${maxAllocationPercent}% profit (~${formatAmount(installmentPerInterval)}/W). Leaves ~${formatAmount(retainedDailyProfit)}/d (${retainedPercent}%) for rest.`;
	}

	const isProfitMatch = statusTier === "COMFORTABLE" && withinMinMax && hasSufficientLiquidity;
	const profitCoveragePercent =
		optimalDailyProfit > 0 && dailyProfit > 0
			? Math.round((dailyProfit / optimalDailyProfit) * 100)
			: 0;
	const profitSurplus = dailyProfit - optimalDailyProfit;

	return {
		bank,
		totalInterest,
		totalRepayment,
		dailyRepaymentDemand,
		installmentPerInterval,
		optimalDailyProfit,
		userProfitSharePercent,
		retainedDailyProfit,
		retainedPercent,
		statusTier,
		statusExplanation,
		isProfitMatch,
		profitCoveragePercent,
		profitSurplus,
		optimalLengthWeeks,
		optimalLengthDays,
		optimalIntervalWeeks,
		optimalIntervalDays,
		withinMinMax,
		hasSufficientLiquidity,
	};
};

export interface OverallLoanSummary {
	minRequiredDailyProfit: number;
	minOptimalDailyProfit: number;
	maxRequiredDailyProfit: number;
	avgRequiredDailyProfit: number;
	optimalLengthWeeks: number;
	optimalLengthDays: number;
	optimalPayoffDays: number;
	optimalIntervalWeeks: number;
	safeWeeklyInstallment: number;
	retainedDailyProfit: number;
	retainedPercent: number;
	qualifyingBanksCount: number;
	lowestInterestRate: number;
	lowestInterestBankName: string;
	isUserProfitMatch: boolean;
	totalBanksCount: number;
	allocationPercent: number;
	totalRepayment: number;
	totalInterest: number;
}

/**
 * Calculates cross-bank statistics and overall optimal plan for the borrower.
 * Optimized for fast, clean repayment at the chosen profit % allocation,
 * ensuring sufficient retained income remains for company operations.
 */
export const calculateOverallLoanStats = (
	banks: Bank[],
	loanAmount: number,
	dailyProfit: number,
	maxAllocationPercent: number = 50,
	customTermWeeks?: number | "",
	customIntervalDays: number = 7,
): OverallLoanSummary | null => {
	if (!banks.length || loanAmount <= 0) return null;

	const comparisons = banks.map((b) =>
		calculateBankLoanComparison(b, loanAmount, dailyProfit, maxAllocationPercent, customTermWeeks, customIntervalDays),
	);
	const qualifying = comparisons.filter((c) => c.isProfitMatch);

	// Pick lowest interest bank
	let lowestRate = Infinity;
	let lowestBankName = "";
	for (const b of banks) {
		const r = b.default_interest_rate || 5.0;
		if (r < lowestRate) {
			lowestRate = r;
			lowestBankName = b.name;
		}
	}
	const effectiveRate = lowestRate !== Infinity && lowestRate >= 0 ? lowestRate : 5.0;
	const totalInterest = loanAmount * (effectiveRate / 100);
	const totalRepayment = loanAmount + totalInterest;

	const allocationFactor = Math.max(0.1, Math.min(1.0, (maxAllocationPercent || 50) / 100));
	const retainedPercent = Math.round((1 - allocationFactor) * 100);

	const intervalDays = customIntervalDays > 0 ? customIntervalDays : 7;
	const intervalWeeks = intervalDays / 7;
	const optimalIntervalWeeks = intervalWeeks;

	let optimalLengthWeeks: number;
	let optimalPayoffDays: number;
	let optimalLengthDays: number;
	let safeWeeklyInstallment: number;
	let retainedDailyProfit: number;
	let minOptimalDailyProfit: number;
	let minRequiredDailyProfit: number;

	const specifiedWeeks = typeof customTermWeeks === "number" && customTermWeeks > 0 ? customTermWeeks : null;

	if (specifiedWeeks) {
		optimalLengthWeeks = specifiedWeeks;
		optimalLengthDays = specifiedWeeks * 7;
		optimalPayoffDays = optimalLengthDays;
		const totalIntervals = Math.max(1, optimalLengthDays / intervalDays);
		safeWeeklyInstallment = Math.round(totalRepayment / totalIntervals);
		const dailyDemand = safeWeeklyInstallment / intervalDays;
		minRequiredDailyProfit = Math.round(dailyDemand);
		minOptimalDailyProfit = Math.round(dailyDemand / allocationFactor);
		retainedDailyProfit = dailyProfit > 0 ? Math.max(0, dailyProfit - dailyDemand) : 0;
	} else if (dailyProfit > 0) {
		const dailyBudget = dailyProfit * allocationFactor;
		optimalPayoffDays = Math.max(7, Math.ceil(totalRepayment / dailyBudget));
		optimalLengthWeeks = Math.max(1, Math.ceil(optimalPayoffDays / 7));
		optimalLengthDays = optimalLengthWeeks * 7;
		const totalIntervals = Math.max(1, optimalLengthDays / intervalDays);
		safeWeeklyInstallment = Math.round(totalRepayment / totalIntervals);
		const dailyDemand = safeWeeklyInstallment / intervalDays;
		retainedDailyProfit = Math.max(0, dailyProfit - dailyDemand);
		minOptimalDailyProfit = Math.round((totalRepayment / 28) / allocationFactor);
		minRequiredDailyProfit = Math.round(dailyDemand);
	} else {
		optimalLengthWeeks = 4;
		optimalPayoffDays = 28;
		optimalLengthDays = 28;
		const totalIntervals = Math.max(1, 28 / intervalDays);
		safeWeeklyInstallment = Math.round(totalRepayment / totalIntervals);
		const dailyDemand = safeWeeklyInstallment / intervalDays;
		minOptimalDailyProfit = Math.round(dailyDemand / allocationFactor);
		minRequiredDailyProfit = Math.round(dailyDemand);
		retainedDailyProfit = 0;
	}

	const dailyDemands = comparisons.map((c) => c.dailyRepaymentDemand);
	const maxRequired = Math.max(...dailyDemands);
	const avgRequired = dailyDemands.reduce((s, p) => s + p, 0) / dailyDemands.length;

	const isUserProfitMatch =
		dailyProfit > 0 ? optimalLengthWeeks <= 26 && qualifying.length > 0 : false;

	return {
		minRequiredDailyProfit,
		minOptimalDailyProfit,
		maxRequiredDailyProfit: maxRequired,
		avgRequiredDailyProfit: avgRequired,
		optimalLengthWeeks,
		optimalLengthDays,
		optimalPayoffDays,
		optimalIntervalWeeks,
		safeWeeklyInstallment,
		retainedDailyProfit,
		retainedPercent,
		qualifyingBanksCount: qualifying.length,
		lowestInterestRate: lowestRate === Infinity ? 0 : lowestRate,
		lowestInterestBankName: lowestBankName,
		isUserProfitMatch,
		totalBanksCount: banks.length,
		allocationPercent: maxAllocationPercent,
		totalRepayment,
		totalInterest,
	};
};

/**
 * Computes estimated yield payouts and solvency risk metrics for a prospective depositor.
 *
 * Yield is configured as a 1-month rate and accounted weekly (monthlyRate / 4).
 * Evaluates solvency risk based on active loan count, vault liquidity, and deposit capacity.
 */
export const calculateBankDepositComparison = (
	bank: Bank,
	depositAmount: number,
): import("./types").BankDepositComparison => {
	const monthlyRate = bank.weekly_yield_rate ?? 1.0;
	const maxMonthlyRate = bank.max_weekly_yield_rate;
	const weeklyRate = monthlyRate / 4.0;
	const maxWeeklyRate = maxMonthlyRate ? maxMonthlyRate / 4.0 : undefined;

	const weeklyPayout = Math.round(depositAmount * (weeklyRate / 100.0));
	const monthlyPayout = weeklyPayout * 4;
	const annualizedRate = monthlyRate * 12;

	const isPaused = bank.deposit_status === "PAUSED";
	const isNearCap = bank.deposit_status === "NEAR_CAPACITY";

	const activeLoansCount = bank.active_loans_count ?? 0;
	const totalLent = bank.total_lent_amount ?? bank.active_lent_amount ?? 0;
	const currentMoney = bank.liquidity || 0;

	// Solvency risk assessment
	let riskTier: "LOW" | "MODERATE" | "HIGH" = "LOW";
	let riskLabel = "Low Risk (Healthy Cash Flow)";
	let riskExplanation = `${activeLoansCount} active loans generating steady weekly interest.`;
	let canAcceptDeposit = !isPaused;
	let rejectionReason = isPaused
		? "Bank has paused new deposits to protect capital solvency."
		: undefined;

	// Flag deposits exceeding available vault liquidity
	if (depositAmount > currentMoney && currentMoney > 0) {
		riskTier = "HIGH";
		riskLabel = "High Risk (Exceeds Vault)";
		riskExplanation = `Deposit exceeds current vault liquidity (${(depositAmount / currentMoney).toFixed(1)}x vault size).`;
	} else if (activeLoansCount === 0 && totalLent === 0) {
		riskTier = "HIGH";
		riskLabel = "High Risk (Unproven / 0 Loans)";
		riskExplanation = "Bank has 0 active loans. Yield relies solely on owner equity subsidies.";
	} else if (activeLoansCount <= 2 || isNearCap) {
		riskTier = "MODERATE";
		riskLabel = "Moderate Risk (Growing)";
		riskExplanation = "Limited active borrowers or bank is nearing its deposit capacity.";
	}

	return {
		bank,
		depositAmount,
		weeklyYieldRate: Number(weeklyRate.toFixed(3)),
		maxWeeklyYieldRate: maxWeeklyRate ? Number(maxWeeklyRate.toFixed(3)) : undefined,
		monthlyYieldRate: monthlyRate,
		maxMonthlyYieldRate: maxMonthlyRate,
		weeklyPayout,
		monthlyPayout,
		annualizedRate,
		riskTier,
		riskLabel,
		riskExplanation,
		canAcceptDeposit,
		rejectionReason,
	};
};



