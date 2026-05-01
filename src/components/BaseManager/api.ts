import { useCallback, useEffect, useState } from "react";
import type { BaseManagerApiResponse } from "./types";

// temporary api_base_url until we set up env vars
const FALLBACK_API_BASE_URL = "https://api.punoted.net/dev/";
const API_BASE_URL = String(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(import.meta as any)?.env?.VITE_API_BASE_URL || FALLBACK_API_BASE_URL,
).endsWith("/")
	? String(
			(import.meta as any)?.env?.VITE_API_BASE_URL || FALLBACK_API_BASE_URL,
		)
	: `${String((import.meta as any)?.env?.VITE_API_BASE_URL || FALLBACK_API_BASE_URL)}/`;

export const useBaseManagerData = (cx: string = "IC1") => {
	const [data, setData] = useState<BaseManagerApiResponse | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const loadData = useCallback(async (cxName: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const res = await fetch(`${API_BASE_URL}internal/cx/prices?cx=${cxName}`);
			if (!res.ok) throw new Error("Failed to fetch base manager data.");
			const fetchedData = await res.json();

			// Transform array of objects into expected BaseManagerApiResponse
			const transformedData: BaseManagerApiResponse = {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				cxPrices: Array.isArray(fetchedData)
					? fetchedData.map((item: any) => ({
							ticker: item.ticker ? item.ticker.split(".")[0] : "",
							price:
								item.askprice !== null
									? parseFloat(item.askprice)
									: item.askprice_7d_avg !== null
										? parseFloat(item.askprice_7d_avg)
										: 0,
						}))
					: [],
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				corpPrices: Array.isArray(fetchedData)
					? fetchedData.map((item: any) => ({
							ticker: item.ticker ? item.ticker.split(".")[0] : "",
							price:
								item.bidprice !== null
									? parseFloat(item.bidprice)
									: item.bidprice_7d_avg !== null
										? parseFloat(item.bidprice_7d_avg)
										: 0,
						}))
					: [],
			};

			setData(transformedData);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData(cx);
	}, [cx, loadData]);

	return {
		data,
		isLoading,
		error,
		forceRefetch: () => loadData(cx),
	};
};
