import React, { useState, useEffect, useCallback, memo } from "react";
import { Box, CircularProgress } from "@mui/material";
import { API_BASE_URL } from "../../config/api";
import CorpPricesTab from "./CorpPricesTab";

const MemoizedCorpTab = memo(CorpPricesTab);
MemoizedCorpTab.displayName = "MemoizedCorpTab";

/**
 * Represents the structure of generic market data received from the API.
 */
type MarketDataRecord = Record<string, any>;

/**
 * The primary dashboard component for corporation pricing.
 * Manages fetching market data used by the corporation store.
 */
const MainDashboard: React.FC = () => {
	const [marketData, setMarketData] = useState<MarketDataRecord[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	/**
	 * Asynchronously retrieves the latest market pricing data from the external API.
	 * Updates local state with the fetched data upon success.
	 */
	const fetchMarketData = useCallback(async () => {
		try {
			const response = await fetch(`${API_BASE_URL}market_price_all`);
			if (!response.ok) {
				throw new Error("Network response was not ok");
			}
			const json = await response.json();
			const data = Array.isArray(json) ? json : json.data || [];
			setMarketData(data);
		} catch (err) {
			console.error("Failed to fetch", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchMarketData();
		const interval = setInterval(fetchMarketData, 60000);
		return () => clearInterval(interval);
	}, [fetchMarketData]);

	return (
		<Box
			id="main"
			sx={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				bgcolor: "#0a0b1e",
				backgroundImage:
					"radial-gradient(circle at 50% 50%, #1a1d42 0%, #050508 100%)",
				overflow: "hidden",
			}}
		>
			<Box
				id="content"
				sx={{
					flex: 1,
					overflow: "hidden",
					position: "relative",
					display: "flex",
					flexDirection: "column",
					minHeight: 0,
				}}
			>
				{loading && marketData.length === 0 ? (
					<Box
						sx={{
							display: "flex",
							height: "100%",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<CircularProgress color="primary" />
					</Box>
				) : (
					<MemoizedCorpTab marketData={marketData} />
				)}
			</Box>
		</Box>
	);
};

export default MainDashboard;
