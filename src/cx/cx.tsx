import React, { useCallback, useEffect, useRef, useState } from "react";
import {
	Box,
	Button,
	CircularProgress,
	Typography,
	ToggleButtonGroup,
	ToggleButton,
	Grid,
} from "@mui/material";
import { fetchClient } from "../utils/apiclient";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { CommoditySidebar } from "./commoditysidebar";
import { PriceChart } from "./pricechart";
import { StatsSummary } from "./statssummary";
import { OrderBook } from "./orderbook";
import { HistoryLog } from "./historylog";
import { ArbitrageFinder } from "./arbitragefinder";
import MarketPricesTab from "../cosm/pricelist/pricelist";
import type { HistoryPoint, TickerDetail } from "./types";
import { ShowChart, TableChart, SwapHoriz } from "@mui/icons-material";

const CX = () => {
	const navigate = useNavigate();
	const [marketData, setMarketData] = useState<Record<string, any>[]>([]);
	const [loadingMarket, setLoadingMarket] = useState<boolean>(true);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	// View mode: 'terminal' vs 'table' vs 'arbitrage'
	const [viewMode, setViewMode] = useState<"terminal" | "table" | "arbitrage">(
		"terminal",
	);

	const [selectedTicker, setSelectedTicker] = useState<string>("AUR");
	const [selectedExchange, setSelectedExchange] = useState<string>("IC1");
	const [days, setDays] = useState<number>(7);

	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");

	const [history, setHistory] = useState<HistoryPoint[]>([]);
	const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

	const [detail, setDetail] = useState<TickerDetail | null>(null);

	const initializedRef = useRef(false);

	// 2. Fetch history for selected ticker via fetchClient
	const fetchHistory = useCallback(
		async (
			ticker: string,
			exchange: string,
			daysNum: number,
			start?: string,
			end?: string,
		) => {
			if (!ticker) return;
			setLoadingHistory(true);
			try {
				let query = `v1/cx/history/${ticker}?exchange=${exchange}&days=${daysNum}`;
				if (daysNum === -1 && start && end) {
					query = `v1/cx/history/${ticker}?exchange=${exchange}&start_date=${start}&end_date=${end}`;
				}
				const response = await fetchClient(query);
				if (!response.ok) throw new Error("Failed to fetch history");
				const data = await response.json();
				setHistory(Array.isArray(data) ? data : []);
			} catch (err) {
				console.error("Failed to fetch ticker history", err);
				setHistory([]);
			} finally {
				setLoadingHistory(false);
			}
		},
		[],
	);

	// 3. Fetch details & orderbook for selected ticker via fetchClient
	const fetchDetail = useCallback(async (ticker: string, exchange: string) => {
		if (!ticker) return;
		try {
			const response = await fetchClient(
				`v1/cx/detail/${ticker}?exchange=${exchange}`,
			);
			if (!response.ok) throw new Error("Failed to fetch detail");
			const data = await response.json();
			setDetail(data || null);
		} catch (err) {
			console.error("Failed to fetch ticker detail", err);
			setDetail(null);
		}
	}, []);

	// 1. Fetch initial list of commodities & prices via fetchClient
	const fetchMarketData = useCallback(async () => {
		try {
			const response = await fetchClient("market_price_all");
			if (!response.ok) throw new Error("Failed to fetch market prices");
			const json = await response.json();
			const data = Array.isArray(json) ? json : json.data || [];
			setMarketData(data);
			setLastUpdated(new Date());

			if (!initializedRef.current && data.length > 0) {
				initializedRef.current = true;
				const hasAur = data.some((r: any) => (r.Ticker || r.ticker) === "AUR");
				const initialTicker = hasAur ? "AUR" : data[0].Ticker || data[0].ticker;
				setSelectedTicker(initialTicker);
				// Immediately load data for the initial commodity
				fetchHistory(initialTicker, selectedExchange, days, startDate, endDate);
				fetchDetail(initialTicker, selectedExchange);
			}
		} catch (err) {
			console.error("Failed to fetch market data", err);
		} finally {
			setLoadingMarket(false);
		}
	}, [selectedExchange, days, startDate, endDate, fetchHistory, fetchDetail]);

	useEffect(() => {
		fetchMarketData();
		const interval = setInterval(fetchMarketData, 60000);
		return () => clearInterval(interval);
	}, [fetchMarketData]);

	useEffect(() => {
		if (selectedTicker && viewMode === "terminal") {
			fetchHistory(selectedTicker, selectedExchange, days, startDate, endDate);
			fetchDetail(selectedTicker, selectedExchange);
		}
	}, [
		selectedTicker,
		selectedExchange,
		days,
		startDate,
		endDate,
		viewMode,
		fetchHistory,
		fetchDetail,
	]);

	const currentItem = marketData.find(
		(r) => (r.Ticker || r.ticker) === selectedTicker,
	);
	const currentPrice = currentItem
		? currentItem[`${selectedExchange}-Average`] ||
			currentItem[`${selectedExchange}-AskPrice`]
		: undefined;

	const handleCustomDateChange = (start: string, end: string) => {
		setStartDate(start);
		setEndDate(end);
		if (start && end) {
			setDays(-1);
		}
	};

	return (
		<Box
			sx={{
				width: "100vw",
				height: "100vh",
				bgcolor: "#020205",
				backgroundImage:
					"radial-gradient(circle at 50% 20%, #080816 0%, #030308 60%, #000000 100%)",
				color: "white",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
			}}
		>
			{/* Top Bar Header */}
			<Box
				sx={{
					height: 60,
					px: 3,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					borderBottom: "1px solid rgba(123, 104, 238, 0.2)",
					bgcolor: "rgba(6, 6, 14, 0.85)",
					backdropFilter: "blur(12px)",
					flexShrink: 0,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
					<Button
						variant="outlined"
						size="small"
						startIcon={<FaArrowLeft style={{ color: "#7B68EE" }} />}
						onClick={() => navigate("/")}
						sx={{
							color: "white",
							borderColor: "#7B68EE",
							fontSize: "0.85rem",
							fontWeight: 600,
							textTransform: "none",
							"&:hover": {
								borderColor: "#6a5acd",
								bgcolor: "rgba(123, 104, 238, 0.12)",
								boxShadow: "0 0 12px rgba(123, 104, 238, 0.3)",
							},
						}}
					>
						Back to Homepage
					</Button>

					<Typography
						variant="h5"
						sx={{
							fontWeight: 800,
							letterSpacing: "0.05em",
							background: "linear-gradient(90deg, #5D80F7, #7B68EE)",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
							textShadow: "0 0 20px rgba(123, 104, 238, 0.4)",
							fontSize: { xs: "1.1rem", sm: "1.4rem" },
						}}
					>
						CX Prices
					</Typography>
				</Box>

				{/* View Mode Toggle: Terminal vs Table vs Arbitrage */}
				<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
					<ToggleButtonGroup
						value={viewMode}
						exclusive
						onChange={(_, val) => val && setViewMode(val)}
						size="small"
						sx={{
							bgcolor: "rgba(255, 255, 255, 0.04)",
							border: "1px solid rgba(123, 104, 238, 0.2)",
							borderRadius: "8px",
							overflow: "hidden",
							"& .MuiToggleButton-root": {
								color: "rgba(255, 255, 255, 0.6)",
								fontSize: "0.75rem",
								px: 1.5,
								py: 0.5,
								gap: 0.75,
								border: "none",
								fontWeight: 700,
								textTransform: "uppercase",
								transition: "all 0.2s ease",
								"&.Mui-selected": {
									color: "white",
									bgcolor: "#7B68EE",
									boxShadow: "0 0 15px rgba(123, 104, 238, 0.5)",
									"&:hover": { bgcolor: "#6a5acd" },
								},
								"&:hover": {
									bgcolor: "rgba(123, 104, 238, 0.15)",
									color: "white",
								},
							},
						}}
					>
						<ToggleButton value="terminal">
							<ShowChart fontSize="small" /> Terminal View
						</ToggleButton>
						<ToggleButton value="table">
							<TableChart fontSize="small" /> All Prices Matrix
						</ToggleButton>
						<ToggleButton value="arbitrage">
							<SwapHoriz fontSize="small" /> Trade & Arbitrage
						</ToggleButton>
					</ToggleButtonGroup>
				</Box>
			</Box>

			{/* Centered Main Layout Container */}
			<Box
				sx={{
					flex: 1,
					width: "100%",
					maxWidth: 1560,
					mx: "auto",
					p: 2,
					display: "flex",
					gap: 2,
					overflow: "hidden",
				}}
			>
				{loadingMarket && marketData.length === 0 ? (
					<Box
						sx={{
							display: "flex",
							height: "100%",
							width: "100%",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<CircularProgress sx={{ color: "#7B68EE" }} />
					</Box>
				) : viewMode === "table" ? (
					<Box sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
						<MarketPricesTab
							isLoggedIn={false}
							marketData={marketData}
							lastUpdated={lastUpdated}
						/>
					</Box>
				) : viewMode === "arbitrage" ? (
					<Box sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
						<ArbitrageFinder marketData={marketData} />
					</Box>
				) : (
					<Box
						sx={{
							width: "100%",
							height: "100%",
							display: "flex",
							gap: 2,
							overflow: "hidden",
							flexDirection: { xs: "column", md: "row" },
						}}
					>
						{/* Left Sidebar: Commodity List */}
						<CommoditySidebar
							marketData={marketData}
							selectedTicker={selectedTicker}
							selectedExchange={selectedExchange}
							onSelectCommodity={setSelectedTicker}
							onSelectExchange={setSelectedExchange}
						/>

						{/* Center/Right Detail Panel */}
						{selectedTicker ? (
							<Box
								sx={{
									flex: 1,
									display: "flex",
									flexDirection: "column",
									gap: 2,
									overflowY: "auto",
									height: "100%",
									pr: 0.5,
									"&::-webkit-scrollbar": { width: "4px" },
									"&::-webkit-scrollbar-track": { background: "transparent" },
									"&::-webkit-scrollbar-thumb": {
										backgroundColor: "rgba(123, 104, 238, 0.4)",
										borderRadius: "2px",
									},
								}}
							>
								{/* Top: Price History Chart */}
								<PriceChart
									ticker={selectedTicker}
									exchange={selectedExchange}
									history={history}
									loading={loadingHistory}
									days={days}
									onChangeDays={setDays}
									startDate={startDate}
									endDate={endDate}
									onCustomDateChange={handleCustomDateChange}
									currentPrice={currentPrice}
								/>

								{/* Middle: Market Statistics Summary */}
								<StatsSummary detail={detail} />

								{/* Bottom Row: Order Book (Bids & Asks) + History Time Series Log */}
								<Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
									<Box sx={{ width: "35%" }}>
										<OrderBook
											bids={detail?.bids || []}
											asks={detail?.asks || []}
										/>
									</Box>
									<Box sx={{ width: "100%", flex: 1 }}>
										<HistoryLog history={history} />
									</Box>
								</Box>
							</Box>
						) : (
							<Box
								sx={{
									flex: 1,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									background: "rgba(16, 16, 32, 0.5)",
									border: "1px solid rgba(123, 104, 238, 0.35)",
									borderRadius: "16px",
									p: 4,
								}}
							>
								<Typography
									variant="h6"
									sx={{ color: "rgba(255, 255, 255, 0.5)" }}
								>
									Select a commodity to view market data
								</Typography>
							</Box>
						)}
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default CX;
