import { useState, useEffect, useMemo } from "react";
import { useGlobalData } from "../../../context/globaldatacontext";
import type { PartnerMetrics } from "../types/finances";

export type TimeRangePreset = "24H" | "7D" | "30D" | "1Y" | "ALL" | "CUSTOM";

export const useFinancialData = () => {
	const {
		financialData: data,
		isFinancialLoading: loading,
		fetchFinances,
	} = useGlobalData();
	const [activeCurrencyIndex, setActiveCurrencyIndex] = useState<number>(0);
	const [timeRange, setTimeRange] = useState<TimeRangePreset>("ALL");
	const [customStartDate, setCustomStartDate] = useState<string>("");
	const [customEndDate, setCustomEndDate] = useState<string>("");

	useEffect(() => {
		if (data?.Currencies && data.Currencies.length > 0) {
			const savedCurrency = localStorage.getItem("preferredCurrency");
			if (savedCurrency) {
				const foundIndex = data.Currencies.findIndex(
					(c) => c.Currency === savedCurrency,
				);
				setActiveCurrencyIndex(foundIndex !== -1 ? foundIndex : 0);
			}
		}
	}, [data]);

	const handleCurrencyChange = (newIndex: number) => {
		setActiveCurrencyIndex(newIndex);
		if (data?.Currencies && data.Currencies[newIndex]) {
			localStorage.setItem(
				"preferredCurrency",
				data.Currencies[newIndex].Currency,
			);
		}
	};

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		handleCurrencyChange(newValue);
	};

	const currentData =
		data?.Currencies && activeCurrencyIndex < data.Currencies.length
			? data.Currencies[activeCurrencyIndex]
			: data?.Currencies?.[0];

	// Filter transactions by time range
	const filteredTransactions = useMemo(() => {
		if (!currentData?.Transactions) return [];
		if (timeRange === "ALL") return currentData.Transactions;

		const txList = currentData.Transactions;
		let maxTxTime = Date.now();
		if (txList.length > 0) {
			const latestInDb = Math.max(
				...txList
					.map((t) => new Date(t.Timestamp).getTime())
					.filter((t) => !isNaN(t)),
			);
			if (latestInDb > 0 && Date.now() - latestInDb > 24 * 60 * 60 * 1000) {
				maxTxTime = latestInDb;
			}
		}

		let cutoff = 0;
		if (timeRange === "24H") cutoff = maxTxTime - 24 * 60 * 60 * 1000;
		else if (timeRange === "7D") cutoff = maxTxTime - 7 * 24 * 60 * 60 * 1000;
		else if (timeRange === "30D") cutoff = maxTxTime - 30 * 24 * 60 * 60 * 1000;
		else if (timeRange === "1Y") cutoff = maxTxTime - 365 * 24 * 60 * 60 * 1000;

		if (timeRange === "CUSTOM") {
			const startMs = customStartDate ? new Date(customStartDate).getTime() : 0;
			const endMs = customEndDate
				? new Date(customEndDate).getTime() + 86400000
				: Infinity;
			return txList.filter((tx) => {
				const txMs = new Date(tx.Timestamp).getTime();
				return txMs >= startMs && txMs <= endMs;
			});
		}

		return txList.filter((tx) => new Date(tx.Timestamp).getTime() >= cutoff);
	}, [currentData?.Transactions, timeRange, customStartDate, customEndDate]);

	// Derived Calculations based on filtered transactions
	const netPending = currentData
		? currentData.PendingReceivable - currentData.PendingPayable
		: 0;

	const incomeExpense30D =
		currentData?.CashFlows?.map((flow) => ({
			name: (flow.Category || "").replace(/_/g, " "),
			Income: flow["30D"]?.Income || 0,
			Expense: -(flow["30D"]?.Expense || 0),
		})) || [];

	const pieChartData =
		currentData?.CashFlows?.map((flow) => ({
			name: (flow.Category || "").replace(/_/g, " "),
			value: flow["30D"]?.Income || 0,
		}))
			.filter((item) => item.value > 0)
			.sort((a, b) => b.value - a.value) || [];

	const topPartners = useMemo(() => {
		if (!filteredTransactions) return [];
		const partnerMap = new Map<
			string,
			PartnerMetrics & { lastTimestamp: string }
		>();

		filteredTransactions.forEach((tx) => {
			if (!tx.PartnerCode) return;
			const existing = partnerMap.get(tx.PartnerCode) || {
				code: tx.PartnerCode,
				name: tx.PartnerName || tx.PartnerCode,
				volume: 0,
				income: 0,
				expense: 0,
				net: 0,
				lastTimestamp: tx.Timestamp,
			};
			const absAmt = Math.abs(tx.Amount);
			existing.volume += absAmt;
			if (tx.Amount > 0) {
				existing.income += tx.Amount;
			} else {
				existing.expense += absAmt;
			}
			existing.net += tx.Amount;

			if (new Date(tx.Timestamp) > new Date(existing.lastTimestamp)) {
				existing.lastTimestamp = tx.Timestamp;
			}
			partnerMap.set(tx.PartnerCode, existing);
		});

		return Array.from(partnerMap.values());
	}, [filteredTransactions]);

	// ponytail: CX vs Contract volume split from filtered transaction types
	const volumeBreakdown = useMemo(() => {
		if (!filteredTransactions) return { cx: 0, contract: 0, corp: 0 };
		let cx = 0,
			contract = 0,
			corp = 0;
		filteredTransactions.forEach((tx) => {
			const abs = Math.abs(tx.Amount);
			if (tx.Type.includes("CORP")) corp += abs;
			else if (tx.Type.includes("CX")) cx += abs;
			else if (tx.Type.includes("CONTRACT")) contract += abs;
		});
		return { cx, contract, corp };
	}, [filteredTransactions]);

	return {
		data,
		loading,
		error: null,
		activeCurrencyIndex,
		setActiveCurrencyIndex,
		handleCurrencyChange,
		handleTabChange,
		fetchFinances,
		currentData,
		filteredTransactions,
		timeRange,
		setTimeRange,
		customStartDate,
		setCustomStartDate,
		customEndDate,
		setCustomEndDate,
		netPending,
		incomeExpense30D,
		pieChartData,
		topPartners,
		volumeBreakdown,
	};
};
