// src/Dashboard/CX/api.ts

import type {
	CxDashboardStats,
	PaginatedCxOrders,
	PriceData,
	StorageValuationResponse,
} from "./types";

const CX_API_BASE = "https://api.punoted.net/cx";

export const getDashboardStats = async (): Promise<CxDashboardStats> => {
	const url = `${CX_API_BASE}/dashboard`;
	const response = await fetch(url, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${localStorage.getItem("authToken")}`,
		},
	});
	if (!response.ok) throw new Error("Failed to fetch dashboard stats");
	const result = await response.json();
	if (!result.success)
		throw new Error("API returned an error for dashboard stats");
	return result.data;
};

export const getOrders = async (
	page: number,
	pageSize: number,
): Promise<PaginatedCxOrders> => {
	const url = `${CX_API_BASE}/orders?page=${page}&pageSize=${pageSize}`;
	const response = await fetch(url, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${localStorage.getItem("authToken")}`,
		},
	});
	if (!response.ok) throw new Error("Failed to fetch orders");
	const result = await response.json();
	if (!result.success) throw new Error("API returned an error for orders");
	return result.data;
};

// --- NEW: Storage Valuation Endpoint ---
export const getStorageValuation = async (
	exchangeTicker: string = "IC1",
	storageId?: string | null,
): Promise<StorageValuationResponse> => {
	const params = new URLSearchParams();
	params.append("exchange", exchangeTicker);

	// Only append storageid if it is a real value
	if (storageId && storageId !== "undefined") {
		params.append("storageid", storageId);
	}

	const url = `${CX_API_BASE}/storage-valuation?${params.toString()}`;
	console.log(
		"Fetching storage valuation for:",
		storageId || "Default",
		exchangeTicker,
	);

	const response = await fetch(url, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${localStorage.getItem("authToken")}`,
		},
	});

	if (!response.ok) {
		console.error("Failed to fetch storage valuation", response);
		throw new Error("Failed to fetch storage valuation");
	}

	const result = await response.json();
	if (!result.status || result.status !== "success") {
		console.error("API returned error for storage valuation:", result);
		throw new Error(result.message || "API Error");
	}

	return result.data;
};

export const getBulkPrices = async (
	tickers: string[],
	exchange: string = "IC1",
): Promise<PriceData[]> => {
	const url = `${CX_API_BASE}/prices`;
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${localStorage.getItem("authToken")}`,
		},
		body: JSON.stringify({ tickers, exchange }),
	});
	if (!response.ok) return [];
	const result = await response.json();
	return result.data || [];
};
