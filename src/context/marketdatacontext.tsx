import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { ReactNode } from "react";
import { fetchClient } from "../utils/apiclient";
import { useGlobalWsContext } from "../dashboard/websocket/globalwscontext";

interface MarketDataContextState {
	marketData: Record<string, any>;
	marketDataList: Record<string, any>[];
	isMarketLoading: boolean;
}

const MarketDataContext = createContext<MarketDataContextState | null>(null);

export const MarketDataProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [marketData, setMarketData] = useState<Record<string, any>>({});
	const [isMarketLoading, setIsMarketLoading] = useState(true);
	const { addMessageListener, removeMessageListener } = useGlobalWsContext();

	const fetchMarketData = useCallback(async () => {
		try {
			const res = await fetchClient("/internal/cx/prices");
			if (res.ok) {
				const data = await res.json();
				if (Array.isArray(data) && data.length > 0) {
					const keyed: Record<string, any> = {};
					data.forEach((row: any) => {
						const ticker = row.Ticker || row.ticker;
						if (ticker) keyed[ticker] = row;
					});
					setMarketData(keyed);
				} else if (data && typeof data === "object" && !Array.isArray(data)) {
					setMarketData(data);
				}
			}
		} catch (e) {
			console.error("[MarketData] fetch failed:", e);
		} finally {
			setIsMarketLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchMarketData();
	}, [fetchMarketData]);

	// Throttle WS updates: batch ticks and apply at most once per second
	const pendingRef = useRef<Record<string, any>>({});
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const handleMessage = (msg: any) => {
			if (
				msg.type !== "MARKET_DATA_UPDATE" &&
				msg.type !== "CX_PRICE_UPDATE" &&
				msg.type !== "cx_broker_data"
			)
				return;
			if (!msg.data) return;

			let pData = msg.data;
			if (typeof pData === "string") {
				try {
					pData = JSON.parse(pData);
				} catch (e) {}
			}
			let updates: Record<string, any> = {};
			if (Array.isArray(pData)) {
				pData.forEach((item: any) => {
					const t = item.Ticker || item.ticker || item.material_ticker;
					if (t) updates[t] = item;
				});
			} else {
				updates = pData;
			}

			Object.entries(updates).forEach(([ticker, item]) => {
				pendingRef.current[ticker] = {
					...(pendingRef.current[ticker] || {}),
					...(item as object),
				};
			});

			if (!timerRef.current) {
				timerRef.current = setTimeout(() => {
					timerRef.current = null;
					const batch = { ...pendingRef.current };
					pendingRef.current = {};
					setMarketData((prev) => {
						const next = { ...prev };
						Object.entries(batch).forEach(([ticker, itemUpdates]) => {
							next[ticker] = {
								...(next[ticker] || {}),
								...(itemUpdates as object),
							};
						});
						return next;
					});
				}, 1000);
			}
		};
		addMessageListener(handleMessage);
		return () => {
			removeMessageListener(handleMessage);
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [addMessageListener, removeMessageListener]);

	const marketDataList = useMemo(() => Object.values(marketData), [marketData]);

	const value = useMemo(
		() => ({ marketData, marketDataList, isMarketLoading }),
		[marketData, marketDataList, isMarketLoading],
	);

	return (
		<MarketDataContext.Provider value={value}>
			{children}
		</MarketDataContext.Provider>
	);
};

export const useMarketData = () => {
	const ctx = useContext(MarketDataContext);
	return ctx ?? { marketData: {}, marketDataList: [], isMarketLoading: false };
};
