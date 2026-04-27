import { useState, useEffect, useMemo } from "react";
import {
	FinancialPayload,
	PartnerMetrics,
	Transaction,
} from "../types/finance";

export const useFinancialData = () => {
	const [data, setData] = useState<FinancialPayload | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [activeCurrencyIndex, setActiveCurrencyIndex] = useState<number>(0);

	const fetchFinances = async () => {
		setLoading(true);
		setError(null);
		try {
			const token = localStorage.getItem("authToken");
			if (!token) throw new Error("No authentication token found.");

			const response = await fetch(
				"https://api.punoted.net/dev/internal/finances/overview",
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);

			if (!response.ok) throw new Error("Failed to fetch financial data");

			const jsonData: FinancialPayload = await response.json();
			setData(jsonData);

			const savedCurrency = localStorage.getItem("preferredCurrency");
			if (savedCurrency && jsonData.Currencies) {
				const foundIndex = jsonData.Currencies.findIndex(
					(c) => c.Currency === savedCurrency,
				);
				setActiveCurrencyIndex(foundIndex !== -1 ? foundIndex : 0);
			} else {
				setActiveCurrencyIndex(0);
			}
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchFinances();
	}, []);

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setActiveCurrencyIndex(newValue);
		if (data && data.Currencies[newValue]) {
			localStorage.setItem(
				"preferredCurrency",
				data.Currencies[newValue].Currency,
			);
		}
	};

	const currentData = data?.Currencies[activeCurrencyIndex];

	// Derived Calculations
	const netPending = currentData
		? currentData.PendingReceivable - currentData.PendingPayable
		: 0;

	const incomeExpense30D =
		currentData?.CashFlows.map((flow) => ({
			name: flow.Category.replace("_", " "),
			Income: flow["30D"].Income,
			Expense: -flow["30D"].Expense,
		})) || [];

	const pieChartData =
		currentData?.CashFlows.map((flow) => ({
			name: flow.Category.replace("_", " "),
			value: flow["30D"].Income,
		}))
			.filter((item) => item.value > 0)
			.sort((a, b) => b.value - a.value) || [];

	const topPartners = useMemo(() => {
		if (!currentData?.Transactions) return [];
		const partnerMap = new Map<string, PartnerMetrics>();

		currentData.Transactions.forEach((tx) => {
			if (!tx.PartnerCode || tx.Type.includes("CORP")) return;
			const existing = partnerMap.get(tx.PartnerCode) || {
				code: tx.PartnerCode,
				name: tx.PartnerName,
				volume: 0,
				net: 0,
			};
			existing.volume += Math.abs(tx.Amount);
			existing.net += tx.Amount;
			partnerMap.set(tx.PartnerCode, existing);
		});

		return Array.from(partnerMap.values())
			.sort((a, b) => b.volume - a.volume)
			.slice(0, 15);
	}, [currentData]);

	return {
		data,
		loading,
		error,
		activeCurrencyIndex,
		handleTabChange,
		fetchFinances,
		currentData,
		netPending,
		incomeExpense30D,
		pieChartData,
		topPartners,
	};
};
