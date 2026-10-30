import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchClient } from "../../utils/apiclient";
import type { Bank, BankLedgerResponse } from "./types";
import { MOCK_DEMO_BANK, getMockBankLedger } from "./mockbankingdata";
import {
	calculateBankLoanComparison,
	calculateOverallLoanStats,
	calculateBankDepositComparison,
	type OverallLoanSummary,
} from "../../dashboard/banking/helpers";
import type { BankLoanComparison, BankDepositComparison } from "../../dashboard/banking/types";

export interface UsePublicBankingDataReturn {
	banks: Bank[];
	loading: boolean;
	error: string | null;
	loadPublicBanks: () => Promise<void>;
	searchQuery: string;
	setSearchQuery: (q: string) => void;
	selectedCurrency: string;
	setSelectedCurrency: (c: string) => void;
	filteredBanks: Bank[];
	inspectingBank: Bank | null;
	setInspectingBank: (b: Bank | null) => void;
	ledgerData: BankLedgerResponse | null;
	loadingLedger: boolean;
	activeLedgerTab: number;
	setActiveLedgerTab: (t: number) => void;
	loanRecords: BankLedgerResponse["history"];
	depositRecords: BankLedgerResponse["history"];
	// Mode Switch
	calculatorMode: "BORROW" | "INVEST";
	setCalculatorMode: (m: "BORROW" | "INVEST") => void;
	// Loan Finder & Feasibility state
	loanAmount: number | "";
	setLoanAmount: (val: number | "") => void;
	dailyProfit: number | "";
	setDailyProfit: (val: number | "") => void;
	termWeeks: number | "";
	setTermWeeks: (val: number | "") => void;
	intervalDays: number;
	setIntervalDays: (val: number) => void;
	maxAllocationPercent: number;
	setMaxAllocationPercent: (pct: number) => void;
	onlyShowMatches: boolean;
	setOnlyShowMatches: (show: boolean) => void;
	handleResetLoanFinder: () => void;
	overallLoanSummary: OverallLoanSummary | null;
	bankComparisonsMap: Map<number, BankLoanComparison>;
	// Depositor Yield Calculator state
	depositAmount: number | "";
	setDepositAmount: (val: number | "") => void;
	onlyAcceptingDeposits: boolean;
	setOnlyAcceptingDeposits: (val: boolean) => void;
	handleResetDepositCalc: () => void;
	depositComparisonsList: BankDepositComparison[];
	depositComparisonsMap: Map<number, BankDepositComparison>;
}

export const usePublicBankingData = (): UsePublicBankingDataReturn => {
	const [banks, setBanks] = useState<Bank[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Filter & Search states
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCurrency, setSelectedCurrency] = useState<string>("ALL");

	// Mode switch
	const [calculatorMode, setCalculatorMode] = useState<"BORROW" | "INVEST">("BORROW");

	// Loan Finder & Feasibility criteria
	const [loanAmount, setLoanAmount] = useState<number | "">("");
	const [dailyProfit, setDailyProfit] = useState<number | "">("");
	const [termWeeks, setTermWeeks] = useState<number | "">("");
	const [intervalDays, setIntervalDays] = useState<number>(7);
	const [maxAllocationPercent, setMaxAllocationPercent] = useState<number>(50);
	const [onlyShowMatches, setOnlyShowMatches] = useState<boolean>(false);

	// Depositor Yield Calculator criteria
	const [depositAmount, setDepositAmount] = useState<number | "">("");
	const [onlyAcceptingDeposits, setOnlyAcceptingDeposits] = useState<boolean>(false);

	// Selected bank for modal inspection
	const [inspectingBank, setInspectingBank] = useState<Bank | null>(null);
	const [ledgerData, setLedgerData] = useState<BankLedgerResponse | null>(null);
	const [loadingLedger, setLoadingLedger] = useState(false);
	const [activeLedgerTab, setActiveLedgerTab] = useState<number>(0);

	const loadPublicBanks = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetchClient("/internal/banking");
			if (res.ok) {
				const data = await res.json();
				const realBanks: Bank[] = Array.isArray(data) ? data : [];
				const isDev = import.meta.env.DEV;
				// In development, include MOCK_DEMO_BANK for local preview; in production, only use live database banks
				setBanks(isDev ? [MOCK_DEMO_BANK, ...realBanks] : realBanks);
			} else {
				setBanks(import.meta.env.DEV ? [MOCK_DEMO_BANK] : []);
			}
		} catch (e: any) {
			console.error("Failed to load public banks", e);
			setBanks(import.meta.env.DEV ? [MOCK_DEMO_BANK] : []);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadPublicBanks();
	}, [loadPublicBanks]);

	// Fetch public ledger when inspecting a bank
	useEffect(() => {
		if (!inspectingBank) {
			setLedgerData(null);
			setActiveLedgerTab(0);
			return;
		}

		// In development, if inspecting the mock demo bank, supply the mock ledger
		if (import.meta.env.DEV && inspectingBank.id === MOCK_DEMO_BANK.id) {
			setLedgerData(getMockBankLedger(inspectingBank));
			setLoadingLedger(false);
			return;
		}

		let isMounted = true;
		setLoadingLedger(true);
		fetchClient(`/internal/banking/${inspectingBank.id}/ledger`)
			.then(async (res) => {
				if (res.ok && isMounted) {
					const data = await res.json();
					setLedgerData(data);
				}
			})
			.catch((err) => console.error("Failed to load bank ledger", err))
			.finally(() => {
				if (isMounted) setLoadingLedger(false);
			});

		return () => {
			isMounted = false;
		};
	}, [inspectingBank]);

	const loanAmountNum = Number(loanAmount) || 0;
	const dailyProfitNum = Number(dailyProfit) || 0;

	// Cross-bank comparisons map
	const bankComparisonsMap = useMemo(() => {
		const map = new Map<number, BankLoanComparison>();
		if (loanAmountNum <= 0) return map;
		for (const b of banks) {
			map.set(
				b.id,
				calculateBankLoanComparison(b, loanAmountNum, dailyProfitNum, maxAllocationPercent, termWeeks, intervalDays),
			);
		}
		return map;
	}, [banks, loanAmountNum, dailyProfitNum, maxAllocationPercent, termWeeks, intervalDays]);

	// Cross-bank overall statistics summary
	const overallLoanSummary = useMemo(() => {
		return calculateOverallLoanStats(banks, loanAmountNum, dailyProfitNum, maxAllocationPercent, termWeeks, intervalDays);
	}, [banks, loanAmountNum, dailyProfitNum, maxAllocationPercent, termWeeks, intervalDays]);

	const handleResetLoanFinder = useCallback(() => {
		setLoanAmount("");
		setDailyProfit("");
		setTermWeeks("");
		setIntervalDays(7);
		setMaxAllocationPercent(50);
		setOnlyShowMatches(false);
	}, []);

	const handleResetDepositCalc = useCallback(() => {
		setDepositAmount("");
		setOnlyAcceptingDeposits(false);
	}, []);

	// Per-bank calculations map (Investor / Depositor view)
	const depositAmountNum = typeof depositAmount === "number" ? depositAmount : 0;
	const depositComparisonsList = useMemo(() => {
		return banks.map((b) => calculateBankDepositComparison(b, depositAmountNum));
	}, [banks, depositAmountNum]);

	const depositComparisonsMap = useMemo(() => {
		const map = new Map<number, BankDepositComparison>();
		for (const comp of depositComparisonsList) {
			map.set(comp.bank.id, comp);
		}
		return map;
	}, [depositComparisonsList]);

	// Filtered banks (search, currency, and loan or deposit feasibility filter)
	const filteredBanks = useMemo(() => {
		let list = banks.filter((b) => {
			const matchesSearch =
				searchQuery === "" ||
				b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				b.owner_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(b.headline && b.headline.toLowerCase().includes(searchQuery.toLowerCase())) ||
				(b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchesCurrency =
				selectedCurrency === "ALL" || (b.currency || "ICA") === selectedCurrency;

			return matchesSearch && matchesCurrency;
		});

		if (calculatorMode === "INVEST") {
			if (onlyAcceptingDeposits) {
				list = list.filter((b) => b.deposit_status !== "PAUSED");
			}
			if (depositAmountNum > 0) {
				return [...list].sort((a, b) => {
					const compA = depositComparisonsMap.get(a.id);
					const compB = depositComparisonsMap.get(b.id);
					if (compA && compB) {
						if (compA.canAcceptDeposit !== compB.canAcceptDeposit) {
							return compA.canAcceptDeposit ? -1 : 1;
						}
						return compB.weeklyYieldRate - compA.weeklyYieldRate;
					}
					return 0;
				});
			}
			return list;
		}

		if (onlyShowMatches && loanAmountNum > 0) {
			list = list.filter((b) => {
				const comp = bankComparisonsMap.get(b.id);
				return comp ? comp.isProfitMatch && comp.withinMinMax : true;
			});
		}

		// When loan amount is entered, sort profit matches first, then lowest interest rate
		if (loanAmountNum > 0) {
			return [...list].sort((a, b) => {
				const compA = bankComparisonsMap.get(a.id);
				const compB = bankComparisonsMap.get(b.id);
				if (compA && compB) {
					if (compA.isProfitMatch !== compB.isProfitMatch) {
						return compA.isProfitMatch ? -1 : 1;
					}
					return (a.default_interest_rate || 5) - (b.default_interest_rate || 5);
				}
				return 0;
			});
		}

		return list;
	}, [banks, searchQuery, selectedCurrency, calculatorMode, onlyAcceptingDeposits, depositAmountNum, depositComparisonsMap, onlyShowMatches, loanAmountNum, bankComparisonsMap]);

	// Segregated records for tabs
	const loanRecords = useMemo(() => {
		return (ledgerData?.history || []).filter((r) => r.transaction_type === "LOAN");
	}, [ledgerData]);

	const depositRecords = useMemo(() => {
		return (ledgerData?.history || []).filter((r) => r.transaction_type !== "LOAN");
	}, [ledgerData]);

	return {
		banks,
		loading,
		error,
		loadPublicBanks,
		searchQuery,
		setSearchQuery,
		selectedCurrency,
		setSelectedCurrency,
		filteredBanks,
		inspectingBank,
		setInspectingBank,
		ledgerData,
		loadingLedger,
		activeLedgerTab,
		setActiveLedgerTab,
		loanRecords,
		depositRecords,
		calculatorMode,
		setCalculatorMode,
		loanAmount,
		setLoanAmount,
		dailyProfit,
		setDailyProfit,
		termWeeks,
		setTermWeeks,
		intervalDays,
		setIntervalDays,
		maxAllocationPercent,
		setMaxAllocationPercent,
		onlyShowMatches,
		setOnlyShowMatches,
		handleResetLoanFinder,
		overallLoanSummary,
		bankComparisonsMap,
		depositAmount,
		setDepositAmount,
		onlyAcceptingDeposits,
		setOnlyAcceptingDeposits,
		handleResetDepositCalc,
		depositComparisonsList,
		depositComparisonsMap,
	};
};
