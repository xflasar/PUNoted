import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMediaQuery, useTheme } from "@mui/material";
import { fetchClient } from "../../utils/apiclient";
import { useGlobalData } from "../../context/globaldatacontext";
import type { HistoryPoint, TickerDetail } from "../types/types";
import { useNavigate } from "react-router-dom";

const EMPTY_MARKET_MAP: Record<string, any> = {};

export function useTickerData() {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
	const globalData = useGlobalData();
	const navigate = useNavigate();

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
	const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

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

	return {
		navigate,
		marketData,
		loadingMarket,
		isMobile,
		viewMode,
		setViewMode,
		selectedTicker,
		setSelectedTicker,
		selectedExchange,
		setSelectedExchange,
		days,
		setDays,
		startDate,
		endDate,
		mobileDrawerOpen,
		setMobileDrawerOpen,
		tickerState,
		currentItem,
		currentPrice,
		handleCustomDateChange,
		handleSelectCommodity,
		handleSelectExchange,
		handleMarketListSelectTicker,
	};
}
