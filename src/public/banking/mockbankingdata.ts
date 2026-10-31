import type { Bank } from "../../dashboard/banking/types";
import type { BankLedgerResponse, LedgerRecord } from "./types";

const MOCK_BORROWERS = [
	"Hazzaah",
	"Deckss",
	"Insula_Crisium",
	"Okawari",
	"evayoo",
	"Shrewdsun1",
	"Finest_One",
	"REALMRAKER",
	"jcheung9941",
	"Akyan",
	"Some_Dude",
	"rwinner16",
	"Dyeus_Phter",
	"Bobzor",
	"nanoengineer",
	"superbadsounds",
	"RATGORWESBAR",
	"Umbers",
	"liliDragon",
];

const MOCK_LENDERS = [
	"Archiel",
	"lowstrife",
	"allocater",
	"sidepipe",
	"jvaler",
	"Roh",
	"CoinCrafter23",
	"Hal98",
	"Hectorino",
	"CptColeslaw",
	"Evolvolution",
	"Pxlfox",
	"OptimizedFuncti",
	"SilentReaper",
	"SurvivorBob",
	"Marshmallows72",
];

const generateMockHistory = (
	currency: string,
	baseRate: number,
): LedgerRecord[] => {
	const now = new Date();
	const records: LedgerRecord[] = [];
	let idCounter = 1001;

	const createDate = (daysAgo: number, hoursAgo = 0) => {
		const d = new Date(
			now.getTime() - (daysAgo * 86400000 + hoursAgo * 3600000),
		);
		return d.toISOString();
	};

	// 1. Repaid Historical Loans
	const repaidConfigs = [
		{ days: 58, amt: 25000, term: 14, rate: baseRate },
		{ days: 55, amt: 50000, term: 7, rate: baseRate - 0.5 },
		{ days: 52, amt: 100000, term: 14, rate: baseRate },
		{ days: 49, amt: 75000, term: 21, rate: baseRate + 0.5 },
		{ days: 47, amt: 150000, term: 14, rate: baseRate },
		{ days: 44, amt: 250000, term: 28, rate: baseRate + 1.0 },
		{ days: 42, amt: 50000, term: 7, rate: baseRate },
		{ days: 39, amt: 500000, term: 30, rate: baseRate + 0.5 },
		{ days: 37, amt: 120000, term: 14, rate: baseRate },
		{ days: 35, amt: 80000, term: 14, rate: baseRate },
		{ days: 33, amt: 300000, term: 21, rate: baseRate },
		{ days: 31, amt: 1000000, term: 28, rate: baseRate + 1.5 },
		{ days: 29, amt: 45000, term: 7, rate: baseRate - 0.5 },
		{ days: 27, amt: 200000, term: 14, rate: baseRate },
		{ days: 25, amt: 600000, term: 21, rate: baseRate },
		{ days: 23, amt: 150000, term: 14, rate: baseRate },
		{ days: 21, amt: 90000, term: 7, rate: baseRate },
		{ days: 19, amt: 350000, term: 14, rate: baseRate + 0.5 },
		{ days: 17, amt: 750000, term: 28, rate: baseRate + 1.0 },
		{ days: 15, amt: 100000, term: 14, rate: baseRate },
		{ days: 13, amt: 220000, term: 14, rate: baseRate },
		{ days: 12, amt: 450000, term: 21, rate: baseRate },
		{ days: 10, amt: 80000, term: 7, rate: baseRate },
		{ days: 9, amt: 1250000, term: 30, rate: baseRate + 0.5 },
		{ days: 8, amt: 180000, term: 14, rate: baseRate },
		{ days: 7, amt: 320000, term: 14, rate: baseRate },
	];

	repaidConfigs.forEach((c, idx) => {
		records.push({
			id: idCounter++,
			amount: c.amt,
			interest_rate: Number(c.rate.toFixed(1)),
			term_days: c.term,
			status: "REPAID",
			transaction_type: "LOAN",
			is_verified: true,
			created_at: createDate(c.days),
			currency,
			requester_username: MOCK_BORROWERS[idx % MOCK_BORROWERS.length],
		});
	});

	// 2. Active / Approved Loans
	const activeConfigs = [
		{ days: 6, amt: 500000, term: 28, rate: baseRate },
		{ days: 5, amt: 150000, term: 14, rate: baseRate },
		{ days: 4, amt: 850000, term: 30, rate: baseRate + 0.5 },
		{ days: 4, amt: 200000, term: 14, rate: baseRate },
		{ days: 3, amt: 1200000, term: 30, rate: baseRate + 1.0 },
		{ days: 2, amt: 75000, term: 14, rate: baseRate },
		{ days: 2, amt: 300000, term: 21, rate: baseRate },
		{ days: 1, amt: 450000, term: 14, rate: baseRate },
		{ days: 1, amt: 900000, term: 28, rate: baseRate + 0.5 },
	];

	activeConfigs.forEach((c, idx) => {
		records.push({
			id: idCounter++,
			amount: c.amt,
			interest_rate: Number(c.rate.toFixed(1)),
			term_days: c.term,
			status: "APPROVED",
			transaction_type: "LOAN",
			is_verified: true,
			created_at: createDate(c.days),
			currency,
			requester_username: MOCK_BORROWERS[(idx + 4) % MOCK_BORROWERS.length],
		});
	});

	// 3. Pending Inquiries
	const pendingConfigs = [
		{ hours: 14, amt: 100000, term: 14, rate: baseRate },
		{ hours: 8, amt: 250000, term: 21, rate: baseRate },
		{ hours: 3, amt: 500000, term: 28, rate: baseRate },
	];

	pendingConfigs.forEach((c, idx) => {
		records.push({
			id: idCounter++,
			amount: c.amt,
			interest_rate: Number(c.rate.toFixed(1)),
			term_days: c.term,
			status: "PENDING",
			transaction_type: "LOAN",
			is_verified: false,
			created_at: createDate(0, c.hours),
			currency,
			requester_username: MOCK_BORROWERS[(idx + 8) % MOCK_BORROWERS.length],
		});
	});

	// 4. Deposits
	const depositConfigs = [
		{ days: 59, amt: 5000000 },
		{ days: 51, amt: 2000000 },
		{ days: 45, amt: 1500000 },
		{ days: 38, amt: 3000000 },
		{ days: 32, amt: 1000000 },
		{ days: 26, amt: 4000000 },
		{ days: 20, amt: 1200000 },
		{ days: 16, amt: 2500000 },
		{ days: 11, amt: 800000 },
		{ days: 7, amt: 3500000 },
		{ days: 4, amt: 1500000 },
		{ days: 1, amt: 2000000 },
	];

	depositConfigs.forEach((c, idx) => {
		records.push({
			id: idCounter++,
			amount: c.amt,
			interest_rate: 0,
			term_days: 0,
			status: "APPROVED",
			transaction_type: "DEPOSIT",
			is_verified: true,
			created_at: createDate(c.days),
			currency,
			requester_username: MOCK_LENDERS[idx % MOCK_LENDERS.length],
		});
	});

	// 5. Withdrawals
	const withdrawalConfigs = [
		{ days: 48, amt: 500000 },
		{ days: 40, amt: 1000000 },
		{ days: 30, amt: 800000 },
		{ days: 22, amt: 1500000 },
		{ days: 15, amt: 600000 },
		{ days: 9, amt: 1200000 },
		{ days: 5, amt: 400000 },
		{ days: 2, amt: 750000 },
	];

	withdrawalConfigs.forEach((c, idx) => {
		records.push({
			id: idCounter++,
			amount: c.amt,
			interest_rate: 0,
			term_days: 0,
			status: "APPROVED",
			transaction_type: "WITHDRAWAL",
			is_verified: true,
			created_at: createDate(c.days),
			currency,
			requester_username: MOCK_LENDERS[(idx + 3) % MOCK_LENDERS.length],
		});
	});

	return records.sort(
		(a, b) =>
			new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
	);
};

/**
 * Returns a complete realistic mock ledger response for a given bank.
 * Used on the public banking page when previewing bank ledgers.
 */
export const getMockBankLedger = (bank: Bank): BankLedgerResponse => {
	const currency = bank.currency || "ICA";
	const baseRate = bank.default_interest_rate ?? 5.0;
	const history = generateMockHistory(currency, baseRate);

	let totalLent = 0;
	let totalRepaid = 0;
	let activeLent = 0;
	let loansCount = 0;
	let totalDeposits = 0;
	let totalWithdrawals = 0;

	for (const r of history) {
		if (r.transaction_type === "LOAN") {
			loansCount++;
			if (r.status === "REPAID" || r.status === "APPROVED") {
				totalLent += r.amount;
			}
			if (r.status === "REPAID") {
				totalRepaid += r.amount;
			} else if (r.status === "APPROVED") {
				activeLent += r.amount;
			}
		} else if (r.transaction_type === "DEPOSIT") {
			totalDeposits += r.amount;
		} else if (r.transaction_type === "WITHDRAWAL") {
			totalWithdrawals += r.amount;
		}
	}

	return {
		bank_id: bank.id,
		bank_name: bank.name,
		total_loans: loansCount,
		total_lent: totalLent,
		total_repaid: totalRepaid,
		active_lent: activeLent,
		total_deposits: totalDeposits,
		total_withdrawals: totalWithdrawals,
		history,
	};
};

export const MOCK_DEMO_BANK: Bank = {
	id: -99,
	name: "Apex Frontier Reserve (Demo)",
	owner_username: "ApexConsortium",
	headline:
		"Premier Commercial & Industrial Creditor across Benten & Moros Systems",
	description: `Fully capitalized reserve bank offering low-interest commercial credit lines, ship construction financing, and liquidity backing for deep-space industrial ventures. All loans backed by verifiable escrow contracts.

### Lending Requirements
1. Active APEX Corporation standing
2. Escrow contract or collateralized promissory note
3. Repayments processed on weekly or bi-weekly cycle

### Collateral & Default Terms
Delinquent loans past grace period will be reported to galactic commercial registries and subject to asset lien proceedings. Early repayments incur zero penalty.`,
	liquidity: 14500000,
	default_interest_rate: 3.5,
	created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
	currency: "ICA",
	default_repay_days: 14,
	default_interval: "WEEKLY",
	min_loan_amount: 50000,
	max_loan_amount: 5000000,
	active_loans_count: 9,
	total_loans_count: 38,
	total_lent_amount: 11150000,
	active_lent_amount: 4625000,
	total_deposit_amount: 25000000,
	total_withdrawal_amount: 4300000,
	depositors_count: 12,
	owner_is_synchronized: true,
	owner_last_active: new Date(Date.now() - 5 * 60000).toISOString(),
};
