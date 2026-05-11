import { useState, useEffect, useCallback } from "react";

export const useShipPrices = () => {
	const [cxPrices, setCxPrices] = useState<any[]>([]);
	const [corpPrices, setCorpPrices] = useState<Record<string, number>>({});
	const [isFetchingPrices, setIsFetchingPrices] = useState(false);

	const fetchLivePrices = useCallback(async () => {
		try {
			setIsFetchingPrices(true);

			// Fetch both APIs concurrently
			const [responseCX, responseCORP] = await Promise.all([
				fetch("https://api.punoted.net/dev/internal/cx/prices", {
					method: "GET",
					headers: { "Content-Type": "application/json" },
				}),
				fetch("https://api.punoted.net/dev/internal/corporation/prices", {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
					},
				}),
			]);

			if (!responseCX.ok)
				throw new Error("Failed to fetch CX prices from internal API");
			if (!responseCORP.ok)
				throw new Error("Failed to fetch CORP prices from internal API");

			// Parse both JSON responses concurrently
			const [cxData, corpData] = await Promise.all([
				responseCX.json(),
				responseCORP.json(),
			]);
			console.log("Fetched CX Prices:", cxData);
			console.log("Fetched CORP Prices:", corpData);
			setCxPrices(cxData || cxData.data || cxData);
			setCorpPrices(corpData || corpData.data || corpData);
		} catch (error) {
			console.error(
				"Error fetching live pricing, defaulting to mock cache:",
				error,
			);
		} finally {
			setIsFetchingPrices(false);
		}
	}, []);

	useEffect(() => {
		fetchLivePrices();
	}, [fetchLivePrices]);

	return {
		cxPrices,
		corpPrices,
		isFetchingPrices,
		refetchPrices: fetchLivePrices,
	};
};
