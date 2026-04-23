import React, { useState, useEffect, useCallback, memo } from "react";
import {
	Box,
	Tabs,
	Tab,
	useMediaQuery,
	useTheme,
	Paper,
	CircularProgress,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import MarketPricesTab from "./PriceList";
import CorpPricesTab from "./CorpPricesTab";
import { glassStyle } from "./CustomComponents/glassStyle";

const MemoizedMarketTab = memo(MarketPricesTab);
MemoizedMarketTab.displayName = "MemoizedMarketTab";

const MemoizedCorpTab = memo(CorpPricesTab);
MemoizedCorpTab.displayName = "MemoizedCorpTab";

/**
 * Properties for the MainDashboard component.
 */
interface MainDashboardProps {
	/**
	 * Indicates whether the current user is authenticated.
	 */
	isLoggedIn: boolean;
}

/**
 * Represents the structure of generic market data received from the API.
 */
type MarketDataRecord = Record<string, any>;

/**
 * The primary dashboard component for market and corporate pricing.
 * Manages the fetching of market data and the navigation state between different pricing views.
 */
const MainDashboard: React.FC<MainDashboardProps> = ({ isLoggedIn }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [searchParams, setSearchParams] = useSearchParams();

	const [marketData, setMarketData] = useState<MarketDataRecord[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	// The active sub-tab derived from the URL search parameters, defaulting to the market view.
	const subtabValue = searchParams.get("subtab") || "market-prices";

	/**
	 * Updates the URL search parameters to reflect the newly selected tab.
	 *
	 * @param _event - The synthetic event from the tab selection.
	 * @param newValue - The identifier of the selected tab.
	 */
	const handleChange = useCallback(
		(_event: React.SyntheticEvent, newValue: string) => {
			setSearchParams({ tab: "priceList", subtab: newValue });
		},
		[setSearchParams],
	);

	/**
	 * Asynchronously retrieves the latest market pricing data from the external API.
	 * Updates local state with the fetched data and the current timestamp upon success.
	 */
	const fetchMarketData = useCallback(async () => {
		try {
			const response = await fetch("https://api.punoted.net/market_price_all");
			if (!response.ok) {
				throw new Error("Network response was not ok");
			}
			const json = await response.json();
			const data = Array.isArray(json) ? json : json.data || [];
			setMarketData(data);
			setLastUpdated(new Date());
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
			<Paper
				square
				elevation={0}
				sx={{
					...glassStyle,
					zIndex: 10,
					flexShrink: 0,
					borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
				}}
			>
				<Tabs
					value={subtabValue}
					onChange={handleChange}
					centered={!isMobile}
					variant={isMobile ? "fullWidth" : "standard"}
					textColor="inherit"
					sx={{
						minHeight: "48px",
						"& .MuiTabs-indicator": { backgroundColor: "#7b68ee", height: 3 },
						"& .MuiTab-root": {
							textTransform: "none",
							fontWeight: 600,
							fontSize: "1rem",
							color: "rgba(255, 255, 255, 0.5)",
							"&.Mui-selected": { color: "#fff" },
						},
					}}
				>
					<Tab label="ComEx Market (CX)" value="market-prices" />
					<Tab label="Corporation Store" value="corp-prices" />
				</Tabs>
			</Paper>

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
					<>
						<div
							style={{
								display: subtabValue === "market-prices" ? "block" : "none",
								height: "100%",
							}}
						>
							<MemoizedMarketTab
								isLoggedIn={isLoggedIn}
								marketData={marketData}
								lastUpdated={lastUpdated}
							/>
						</div>

						<div
							style={{
								display: subtabValue === "corp-prices" ? "block" : "none",
								height: "100%",
							}}
						>
							<MemoizedCorpTab marketData={marketData} />
						</div>
					</>
				)}
			</Box>
		</Box>
	);
};

export default MainDashboard;
