import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Box,
	Button,
	Typography,
	ToggleButtonGroup,
	ToggleButton,
	Skeleton,
	Drawer,
	useMediaQuery,
	useTheme,
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
import { MarketList } from "./marketlist";
import type { HistoryPoint, TickerDetail } from "./types";
import { useGlobalData } from "../context/globaldatacontext";
import {
	ShowChart,
	SwapHoriz,
	ViewList,
	FilterList,
} from "@mui/icons-material";

const EMPTY_MARKET_MAP: Record<string, any> = {};

const CXPageSkeleton = () => (
	<Box
		sx={{
			display: "flex",
			width: "100%",
			height: "100%",
			gap: 2,
			flexDirection: { xs: "column", md: "row" },
			overflow: "hidden",
		}}
	>
		<Box
			sx={{
				width: { xs: "100%", md: 300 },
				flexShrink: 0,
				height: "100%",
				bgcolor: "rgba(6, 6, 14, 0.75)",
				borderRadius: "16px",
				border: "1px solid rgba(123, 104, 238, 0.2)",
				p: 2,
				boxSizing: "border-box",
				display: "flex",
				flexDirection: "column",
				gap: 1.25,
				overflow: "hidden",
			}}
		>
			<Skeleton
				variant="text"
				width={110}
				height={20}
				sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 1 }}
			/>
			<Skeleton
				variant="rectangular"
				height={36}
				sx={{ borderRadius: "8px", bgcolor: "rgba(255,255,255,0.05)" }}
			/>
		</Box>
		<Box
			sx={{
				flex: 1,
				display: "flex",
				flexDirection: "column",
				gap: 2,
				height: "100%",
				overflow: "hidden",
			}}
		>
			<Skeleton
				variant="rectangular"
				height={310}
				sx={{ borderRadius: "16px", bgcolor: "rgba(255,255,255,0.04)" }}
			/>
		</Box>
	</Box>
);

const CX = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

	const navigate = useNavigate();
	const globalData = useGlobalData();

	const rawMarketData = globalData?.marketData ?? EMPTY_MARKET_MAP;

	const marketData = useMemo(() => {
		if (Array.isArray(rawMarketData)) return rawMarketData;
		return Object.values(rawMarketData);
	}, [rawMarketData]);

	const loadingMarket = marketData.length === 0;

	const [viewMode, setViewMode] = useState<"terminal" | "market" | "arbitrage">(
		"terminal",
	);
	const [selectedTicker, setSelectedTicker] = useState<string>("AUR");
	const [selectedExchange, setSelectedExchange] = useState<string>("IC1");
	const [days, setDays] = useState<number>(7);
	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");

	const [tickerState, setTickerState] = useState<{
		history: HistoryPoint[];
		detail: TickerDetail | null;
		loading: boolean;
	}>({
		history: [],
		detail: null,
		loading: false,
	});

	const initializedRef = useRef(false);

	useEffect(() => {
		if (!initializedRef.current && marketData.length > 0) {
			initializedRef.current = true;
			const hasAur = marketData.some(
				(r: any) => (r.Ticker || r.ticker) === "AUR",
			);
			const initialTicker = hasAur
				? "AUR"
				: marketData[0]?.Ticker || marketData[0]?.ticker || "AUR";
			setSelectedTicker(initialTicker);
		}
	}, [marketData]);

	const abortControllerRef = useRef<AbortController | null>(null);

	const fetchTickerData = useCallback(
		async (
			ticker: string,
			exchange: string,
			daysNum: number,
			start?: string,
			end?: string,
		) => {
			if (!ticker) return;

			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			const controller = new AbortController();
			abortControllerRef.current = controller;

			try {
				let historyQuery = `internal/cx/history/${ticker}?exchange=${exchange}&days=${daysNum}`;
				if (daysNum === -1 && start && end) {
					historyQuery = `internal/cx/history/${ticker}?exchange=${exchange}&start_date=${start}&end_date=${end}`;
				}
				const detailQuery = `internal/cx/detail/${ticker}?exchange=${exchange}`;

				const [histRes, detRes] = await Promise.all([
					fetchClient(historyQuery, { signal: controller.signal }),
					fetchClient(detailQuery, { signal: controller.signal }),
				]);

				const histData = histRes.ok ? await histRes.json() : [];
				const detData = detRes.ok ? await detRes.json() : null;
				const points = Array.isArray(histData) ? histData : [];

				setTickerState({
					history: points,
					detail: detData,
					loading: false,
				});

				if (points.length === 0 && daysNum !== -1) {
					const ladder = [7, 30, 365];
					const idx = ladder.indexOf(daysNum);
					if (idx !== -1 && idx < ladder.length - 1) {
						setDays(ladder[idx + 1]);
					}
				}
			} catch (err: any) {
				if (err.name !== "AbortError") {
					setTickerState({ history: [], detail: null, loading: false });
				}
			}
		},
		[],
	);

	useEffect(() => {
		if (selectedTicker && viewMode === "terminal") {
			fetchTickerData(
				selectedTicker,
				selectedExchange,
				days,
				startDate,
				endDate,
			);
		}
	}, [
		selectedTicker,
		selectedExchange,
		days,
		startDate,
		endDate,
		viewMode,
		fetchTickerData,
	]);

	const currentItem = useMemo(
		() => marketData.find((r) => (r.Ticker || r.ticker) === selectedTicker),
		[marketData, selectedTicker],
	);

	const currentPrice = currentItem
		? currentItem[`${selectedExchange}-Average`] ||
			currentItem[`${selectedExchange}-AskPrice`]
		: undefined;

	const handleCustomDateChange = useCallback((start: string, end: string) => {
		setStartDate(start);
		setEndDate(end);
		if (start && end) {
			setDays(-1);
		}
	}, []);

	const handleSelectCommodity = useCallback(
		(t: string) => {
			setSelectedTicker(t);
			if (isMobile) setMobileDrawerOpen(false);
		},
		[isMobile],
	);

	const handleSelectExchange = useCallback((e: string) => {
		setSelectedExchange(e);
	}, []);

	const handleMarketListSelectTicker = useCallback((t: string, e: string) => {
		setSelectedTicker(t);
		setSelectedExchange(e);
		setViewMode("terminal");
	}, []);

	const sidebarContent = useMemo(
		() => (
			<CommoditySidebar
				marketData={marketData}
				selectedTicker={selectedTicker}
				selectedExchange={selectedExchange}
				onSelectCommodity={handleSelectCommodity}
				onSelectExchange={handleSelectExchange}
			/>
		),
		[
			marketData,
			selectedTicker,
			selectedExchange,
			handleSelectCommodity,
			handleSelectExchange,
		],
	);

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
			<Box
				sx={{
					height: 60,
					px: { xs: 1.5, sm: 3 },
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					borderBottom: "1px solid rgba(123, 104, 238, 0.2)",
					bgcolor: "rgba(6, 6, 14, 0.85)",
					backdropFilter: "blur(12px)",
					flexShrink: 0,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					<Button
						variant="outlined"
						size="small"
						startIcon={<FaArrowLeft style={{ color: "#7B68EE" }} />}
						onClick={() => navigate("/")}
						sx={{
							color: "white",
							borderColor: "#7B68EE",
							fontSize: { xs: "0.75rem", sm: "0.85rem" },
							fontWeight: 600,
							textTransform: "none",
							"&:hover": {
								borderColor: "#6a5acd",
								bgcolor: "rgba(123, 104, 238, 0.12)",
								boxShadow: "0 0 12px rgba(123, 104, 238, 0.3)",
							},
						}}
					>
						Back
					</Button>
				</Box>

				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<ToggleButtonGroup
						value={viewMode}
						exclusive
						onChange={(_, val) => {
							if (val) {
								console.log("[CX DEBUG] ViewMode changed to:", val);
								setViewMode(val);
							}
						}}
						size="small"
						sx={{
							bgcolor: "rgba(255, 255, 255, 0.04)",
							border: "1px solid rgba(123, 104, 238, 0.2)",
							borderRadius: "8px",
							overflow: "hidden",
							"& .MuiToggleButton-root": {
								color: "rgba(255, 255, 255, 0.6)",
								fontSize: { xs: "0.65rem", sm: "0.75rem" },
								px: { xs: 1, sm: 1.5 },
								py: 0.5,
								gap: 0.5,
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
							<ShowChart fontSize="small" />{" "}
							{isMobile ? "Terminal" : "Terminal View"}
						</ToggleButton>
						<ToggleButton value="market">
							<ViewList fontSize="small" />{" "}
							{isMobile ? "Overview" : "Market Overview"}
						</ToggleButton>
						<ToggleButton value="arbitrage">
							<SwapHoriz fontSize="small" />{" "}
							{isMobile ? "Arbitrage" : "Trade & Arbitrage"}
						</ToggleButton>
					</ToggleButtonGroup>
				</Box>
			</Box>

			<Box
				sx={{
					flex: 1,
					width: "100%",
					maxWidth: 1560,
					mx: "auto",
					p: { xs: 1, sm: 2 },
					display: "flex",
					gap: 2,
					overflow: "hidden",
				}}
			>
				{loadingMarket && marketData.length === 0 ? (
					<CXPageSkeleton />
				) : (
					<>
						{/* Market Overview View */}
						{viewMode === "market" && (
							<Box
								sx={{
									width: "100%",
									height: "100%",
									display: "flex",
									overflow: "hidden",
								}}
							>
								<MarketList
									marketData={marketData}
									onSelectTicker={handleMarketListSelectTicker}
								/>
							</Box>
						)}

						{/* Trade & Arbitrage View */}
						{viewMode === "arbitrage" && (
							<Box
								sx={{
									width: "100%",
									height: "100%",
									display: "flex",
									overflow: "hidden",
								}}
							>
								<ArbitrageFinder marketData={marketData} />
							</Box>
						)}

						{/* Terminal View */}
						<Box
							sx={{
								width: "100%",
								height: "100%",
								display: viewMode === "terminal" ? "flex" : "none",
								gap: 2,
								overflow: "hidden",
								flexDirection: "row",
							}}
						>
							{/* Desktop Left Sidebar (hidden on mobile) */}
							<Box
								sx={{
									display: { xs: "none", md: "block" },
									height: "100%",
									flexShrink: 0,
								}}
							>
								{sidebarContent}
							</Box>

							{/* Mobile Slide-in Drawer */}
							<Drawer
								anchor="left"
								open={mobileDrawerOpen}
								onClose={() => setMobileDrawerOpen(false)}
								PaperProps={{
									sx: {
										width: 320,
										bgcolor: "#06060E",
										borderRight: "1px solid rgba(123, 104, 238, 0.3)",
									},
								}}
							>
								{sidebarContent}
							</Drawer>

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
									{/* Mobile Selector Trigger Button */}
									<Box
										sx={{ display: { xs: "block", md: "none" }, width: "100%" }}
									>
										<Button
											variant="contained"
											fullWidth
											startIcon={<FilterList />}
											onClick={() => setMobileDrawerOpen(true)}
											sx={{
												bgcolor: "rgba(123, 104, 238, 0.25)",
												color: "white",
												borderColor: "#7B68EE",
												border: "1px solid rgba(123, 104, 238, 0.4)",
												fontWeight: 700,
												py: 1,
												borderRadius: "10px",
												"&:hover": { bgcolor: "rgba(123, 104, 238, 0.4)" },
											}}
										>
											Select Commodity ({selectedTicker} - {selectedExchange})
										</Button>
									</Box>

									<PriceChart
										ticker={selectedTicker}
										exchange={selectedExchange}
										history={tickerState.history}
										loading={tickerState.loading}
										days={days}
										onChangeDays={setDays}
										startDate={startDate}
										endDate={endDate}
										onCustomDateChange={handleCustomDateChange}
										currentPrice={currentPrice}
									/>

									<StatsSummary
										detail={tickerState.detail}
										currentItem={currentItem}
										exchange={selectedExchange}
									/>

									<Box
										sx={{
											display: "flex",
											flexDirection: { xs: "column", md: "row" },
											gap: 2,
										}}
									>
										<Box sx={{ width: { xs: "100%", md: "35%" } }}>
											<OrderBook
												bids={tickerState.detail?.bids || []}
												asks={tickerState.detail?.asks || []}
											/>
										</Box>
										<Box sx={{ width: { xs: "100%", md: "65%" }, flex: 1 }}>
											<HistoryLog
												history={tickerState.history}
												days={days}
												currentItem={currentItem}
												exchange={selectedExchange}
											/>
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
					</>
				)}
			</Box>
		</Box>
	);
};

export default CX;
