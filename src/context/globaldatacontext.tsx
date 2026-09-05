import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	useMemo,
	useRef,
} from "react";
import type { ReactNode } from "react";
import { openDB } from "idb";
import { fetchClient } from "../utils/apiclient";
import { getApiStatus } from "../components/common/apistatusservice";
import { useGlobalWsContext } from "../dashboard/websocket/globalwscontext";
import type { DashboardPayload, DashboardFilter } from "../dashboard/cx/types";
import type {
	FlightPlan,
	ShipData,
} from "../components/common/starmap/types/maptypes";
import type { ShipmentState } from "../dashboard/shipping/types";
import type { StorageState, StorageUnit } from "../dashboard/storage/types";
import type { MaterialData } from "./types";
import type {
	SiteSummary,
	GroupedWorkforceData,
} from "../dashboard/production/types";
import type { FinancialPayload } from "../dashboard/financial/types/finances";

const DB_NAME = "PUNotedDB";
const STORE_NAME = "app-cache";

const dbPromise = openDB(DB_NAME, 1, {
	upgrade(db) {
		db.createObjectStore(STORE_NAME);
	},
});

interface GlobalDataContextState {
	materialData: Record<string, MaterialData>;
	recipes: any[];
	getMatProps: (ticker: string) => { weight: number; volume: number };
	dashboardData: DashboardPayload | null;
	isLoading: boolean;
	fetchDashboard: (filters?: Partial<DashboardFilter>) => void;
	currentCXDashboardFilters: DashboardFilter;
	ownerShips: ShipData[];
	corpShipsGrouped: Record<string, ShipData[]>;
	otherShips: ShipData[];
	allShips: Map<string, ShipData>;
	setAllShips: React.Dispatch<React.SetStateAction<Map<string, ShipData>>>;
	shipBlueprints: any[];
	refreshShipBlueprints: () => Promise<void>;
	activeFlightPlans: FlightPlan[];
	setActiveFlightPlans: React.Dispatch<React.SetStateAction<FlightPlan[]>>;
	shipmentState: ShipmentState;
	setShipmentState: React.Dispatch<React.SetStateAction<ShipmentState>>;
	userSites: any[];
	refreshUserSites: () => Promise<void>;
	storageState?: StorageState | null;
	refreshStorage: () => Promise<void>;
	productionData: Record<string, SiteSummary>;
	workforceData: GroupedWorkforceData | null;
	isProductionLoading: boolean;
	refreshProduction: () => Promise<void>;
	mapData: any | null;
	isMapLoading: boolean;
	mapDataFetchError: string | null;
	fetchMapData: () => Promise<void>;
	refreshMapData: () => Promise<void>;
	marketData: Record<string, any>;
	corpPrices: Record<string, number>;
	refreshCorpPrices: () => Promise<void>;
	corpData: any[];
	fetchCorporationData: () => Promise<void>;
	customPrices: Record<string, number>;
	refreshCustomPrices: () => Promise<void>;
	saveCustomPricesBatch: (prices: Record<string, number>) => Promise<void>;
	loansData: any[];
	refreshLoans: () => Promise<void>;
	financialData: FinancialPayload | null;
	isFinancialLoading: boolean;
	fetchFinances: () => Promise<void>;
	apiStatus: "online" | "offline";
	isLoggedIn: boolean;
	userMetadata: {
		username: string | null;
		displayName: string | null;
		companyCode: string | null;
		companyName: string | null;
		corpName: string | null;
	};
	handleLoginSuccess: () => void;
	handleLogout: () => void;
}

interface WsMessage {
	type: string;
	data?: any;
}

const GlobalDataContext = createContext<GlobalDataContextState | null>(null);

export const GlobalDataProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const { isConnected, sendJson, addMessageListener, removeMessageListener } =
		useGlobalWsContext();

	// --- State Definitions ---
	const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(
		null,
	);
	const [currentCXDashboardFilters, setCurrentCXDashboardFilters] =
		useState<DashboardFilter>({ range: "7D", exchange: "IC1" });
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const [allShips, setAllShips] = useState<Map<string, ShipData>>(new Map());
	const [corpShipsGrouped, setCorpShipsGrouped] = useState<
		Record<string, ShipData[]>
	>({});
	const [shipBlueprints, setShipBlueprints] = useState<any[]>([]);
	const [userSites, setUserSites] = useState<any[]>([]);
	const [activeFlightPlans, setActiveFlightPlans] = useState<FlightPlan[]>([]);
	const [shipmentState, setShipmentState] = useState<ShipmentState>({
		contracts: [],
		ships: {},
	});

	const [materialData, setMaterialData] = useState<
		Record<string, MaterialData>
	>({});
	const [recipes, setRecipes] = useState<any[]>([]);
	const [marketData, setMarketData] = useState<Record<string, any>>({});
	const [corpPrices, setCorpPrices] = useState<Record<string, number>>({});
	const [corpData, setCorpData] = useState<any[]>([]);
	const [customPrices, setCustomPrices] = useState<Record<string, number>>(
		() => {
			try {
				const saved = localStorage.getItem("user_custom_prices");
				return saved ? JSON.parse(saved) : {};
			} catch {
				return {};
			}
		},
	);
	const [loansData, setLoansData] = useState<any[]>([]);

	const fetchCorporationData = useCallback(async () => {
		try {
			const token = localStorage.getItem("authToken");
			if (!token) return;
			const res = await fetchClient("/internal/corporation/");
			if (res?.ok) {
				const json = await res.json();
				if (Array.isArray(json)) {
					console.log("Corporation data", json);
					setCorpData(json);
				}
			}
		} catch (err) {
			console.error("Failed to fetch corp production data:", err);
		}
	}, []);

	const fetchCustomPrices = useCallback(async () => {
		try {
			const res = await fetchClient("/usersettings/custom-prices");
			if (res?.ok) {
				const json = await res.json();
				if (json && typeof json === "object") {
					const cleanMap: Record<string, number> = {};
					Object.entries(json).forEach(([k, v]) => {
						cleanMap[k.toUpperCase()] = Number(v);
					});
					setCustomPrices(cleanMap);
					localStorage.setItem("user_custom_prices", JSON.stringify(cleanMap));
				}
			}
		} catch {}
	}, []);

	const saveCustomPricesBatch = useCallback(
		async (newPrices: Record<string, number>) => {
			try {
				setCustomPrices(newPrices);
				localStorage.setItem("user_custom_prices", JSON.stringify(newPrices));
				const payload = {
					prices: Object.entries(newPrices).map(([ticker, price]) => ({
						ticker,
						price,
					})),
				};
				await fetchClient("/usersettings/custom-prices", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
			} catch {}
		},
		[],
	);

	const [storageState, setStorageState] = useState<StorageState | null>(null);
	const [productionData, setProductionData] = useState<
		Record<string, SiteSummary>
	>({});
	const [workforceData, setWorkforceData] =
		useState<GroupedWorkforceData | null>(null);
	const [isProductionLoading, setIsProductionLoading] =
		useState<boolean>(false);

	const [mapData, setMapData] = useState<any | null>(null);
	const [isMapLoading, setIsMapLoading] = useState<boolean>(false);
	const [mapDataFetchError, setMapDataFetchError] = useState<string | null>(
		null,
	);

	const [financialData, setFinancialData] = useState<FinancialPayload | null>(
		null,
	);
	const [isFinancialLoading, setIsFinancialLoading] = useState<boolean>(false);
	const [apiStatus, setApiStatus] = useState<"online" | "offline">("online");

	// --- IndexedDB ---
	const getCachedData = useCallback(
		async (key: string): Promise<any | null> => {
			try {
				const db = await dbPromise;
				return await db.get(STORE_NAME, key);
			} catch {
				return null;
			}
		},
		[],
	);

	const setCachedData = useCallback(
		async (key: string, data: any): Promise<void> => {
			try {
				const db = await dbPromise;
				await db.put(STORE_NAME, data, key);
			} catch {}
		},
		[],
	);

	const deleteCachedData = useCallback(async (key: string): Promise<void> => {
		try {
			const db = await dbPromise;
			await db.delete(STORE_NAME, key);
		} catch {}
	}, []);

	// Buffer for rapid WS market updates to prevent main thread lockup & disk I/O thrashing
	const pendingMarketDataRef = useRef<Record<string, any>>({});
	const marketFlushTimerRef = useRef<NodeJS.Timeout | null>(null);
	const diskSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

	const flushMarketBuffer = useCallback(() => {
		if (Object.keys(pendingMarketDataRef.current).length === 0) return;

		const updates = { ...pendingMarketDataRef.current };
		pendingMarketDataRef.current = {};

		setMarketData((prev) => {
			let hasChanged = false;
			const next = { ...prev };
			Object.entries(updates).forEach(([ticker, itemUpdates]) => {
				Object.keys(itemUpdates).forEach((key) => {
					const existing = next[ticker];
					if (!existing) {
						hasChanged = true;
						return;
					}

					const existingItem = existing[key];
					if (existingItem === itemUpdates[key]) return;
					hasChanged = true;
				});

				next[ticker] = {
					...(next[ticker] || {}),
					...(itemUpdates as object),
				};
			});

			if (!hasChanged) return prev;

			// Debounce disk saves to IndexedDB (once every 10s instead of every 500ms tick)
			if (!diskSaveTimerRef.current) {
				diskSaveTimerRef.current = setTimeout(() => {
					diskSaveTimerRef.current = null;
					setCachedData("global_market_prices", next);
				}, 10000);
			}

			return next;
		});
	}, [setCachedData]);

	// --- Auth State ---
	const checkAuth = () => {
		try {
			const token = localStorage.getItem("authToken");
			return Boolean(token && token !== "null" && token !== "undefined");
		} catch {
			return false;
		}
	};

	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(checkAuth);
	const [userMetadata, setUserMetadata] = useState({
		username: localStorage.getItem("username"),
		displayName: localStorage.getItem("displayName"),
		companyCode: localStorage.getItem("companyCode"),
		companyName: localStorage.getItem("companyName"),
		corpName: localStorage.getItem("corpName"),
	});

	const handleLoginSuccess = useCallback(() => {
		setIsLoggedIn(true);
		setUserMetadata({
			username: localStorage.getItem("username"),
			displayName: localStorage.getItem("displayName"),
			companyCode: localStorage.getItem("companyCode"),
			companyName: localStorage.getItem("companyName"),
			corpName: localStorage.getItem("corpName"),
		});
	}, []);

	const handleLogout = useCallback(() => {
		localStorage.clear();
		setIsLoggedIn(false);
		setUserMetadata({
			username: null,
			displayName: null,
			companyCode: null,
			companyName: null,
			corpName: null,
		});
		setCorpShipsGrouped({});
		setUserSites([]);
		setAllShips(new Map());
		setCorpPrices({});
		setProductionData({});
		setWorkforceData(null);
		setStorageState(null);
		setShipBlueprints([]);
		setActiveFlightPlans([]);
		setShipmentState({ contracts: [], ships: {} });
		setFinancialData(null);
		setLoansData([]);
		setCustomPrices({});
	}, []);

	// --- REST Methods ---
	const fetchLoansData = useCallback(async () => {
		try {
			const res = await fetchClient("internal/contracts/loans", {
				method: "POST",
			});
			if (res?.ok) {
				const data = await res.json();
				setLoansData(Array.isArray(data) ? data : data?.items || []);
			}
		} catch {}
	}, []);

	const fetchCorpPrices = useCallback(async () => {
		try {
			const res = await fetchClient("/corp_prices_all");
			if (!res?.ok) return;
			const json = await res.json();
			const priceMap: Record<string, number> = {};
			const rawData = json?.data !== undefined ? json.data : json;

			if (Array.isArray(rawData)) {
				rawData.forEach((item: any) => {
					const ticker =
						item?.ticker ||
						item?.Ticker ||
						item?.material_ticker ||
						item?.materialid;
					const price =
						item?.price ??
						item?.Price ??
						item?.corp_price ??
						item?.CorpPrice ??
						0;
					if (ticker && price > 0) {
						priceMap[String(ticker).toUpperCase()] = Number(price);
						priceMap[String(ticker)] = Number(price);
					}
				});
			}
			setCorpPrices(priceMap);
		} catch {}
	}, []);

	const fetchStorageData = useCallback(async () => {
		try {
			const res = await fetchClient("/internal/storage/user_storage");
			if (!res?.ok) return;
			const json = await res.json();

			if (json.success && json.data) {
				const unitsMap: Record<string, StorageUnit> = {};
				const rawData = Array.isArray(json.data)
					? json.data
					: Object.values(json.data);

				rawData.forEach((unit: any) => {
					if (unit.storageid) unitsMap[unit.storageid] = unit;
				});

				setStorageState({ units: unitsMap, lastUpdated: Date.now() });
			}
		} catch {}
	}, []);

	const fetchProductionData = useCallback(async () => {
		try {
			setIsProductionLoading(true);

			const [prodRes, workRes] = await Promise.all([
				fetchClient("/internal/production/user_production"),
				fetchClient("/user_workforce_with_needs"),
			]);

			if (prodRes?.ok) {
				const prodJson = await prodRes.json();
				if (prodJson.success) setProductionData(prodJson.data);
			}
			if (workRes?.ok) {
				const workJson = await workRes.json();
				if (workJson.success) setWorkforceData(workJson.data);
			}
		} catch {
		} finally {
			setIsProductionLoading(false);
		}
	}, []);

	const fetchShipBlueprints = useCallback(async () => {
		try {
			const res = await fetchClient("/internal/ships/blueprints");
			if (!res?.ok) return;
			const json = await res.json();
			if (json && Array.isArray(json.blueprints)) {
				setShipBlueprints(json.blueprints);
			}
		} catch {}
	}, []);

	const fetchUserSites = useCallback(async () => {
		try {
			const res = await fetchClient("/internal/sites/all_user_sites");
			if (!res?.ok) return;
			let json = await res.json();
			while (typeof json === "string") {
				try {
					json = JSON.parse(json);
				} catch {
					break;
				}
			}
			const sitesList = Array.isArray(json?.sites)
				? json.sites
				: Array.isArray(json?.data)
					? json.data
					: Array.isArray(json)
						? json
						: [];
			if (sitesList.length > 0) {
				setUserSites(sitesList);
			}
		} catch (e) {
			console.error("🌐 [GlobalDataContext] fetchUserSites error:", e);
		}
	}, []);

	const fetchShipsData = useCallback(async () => {
		try {
			const res = await fetchClient("/internal/ships/");
			if (!res?.ok) return;
			const json = await res.json();

			if (json && Array.isArray(json.ships)) {
				const shipMap = new Map<string, ShipData>(
					json.ships.map((s: ShipData) => [s.ship_id || s.id, s]),
				);
				setAllShips(shipMap);

				const corpGrouped: Record<string, ShipData[]> = {};

				json.ships.forEach((s: ShipData) => {
					if (s.is_corp || s.iscorp) {
						if (!corpGrouped[s.company_code]) {
							corpGrouped[s.company_code] = [];
						}
						corpGrouped[s.company_code].push(s);
					}
				});

				setCorpShipsGrouped(corpGrouped);
			}
		} catch {}
	}, []);

	const fetchMarketData = useCallback(async () => {
		try {
			const cached = await getCachedData("global_market_prices");
			if (cached) setMarketData(cached);

			const res = await fetchClient("/internal/cx/prices");
			if (res?.ok) {
				let data = await res.json();

				// 1. If backend double-encoded it, parse the string
				if (typeof data === "string") {
					try {
						data = JSON.parse(data);
					} catch (e) {}
				}

				if (data) {
					// 2. Safely map array into a dictionary so spread operators work
					let mappedData: Record<string, any> = {};
					if (Array.isArray(data)) {
						data.forEach((item) => {
							const ticker = item.Ticker || item.ticker || item.material_ticker;
							if (ticker) mappedData[ticker] = item;
						});
					} else {
						mappedData = data;
					}

					setMarketData(mappedData);
					await setCachedData("global_market_prices", mappedData);
				}
			}
		} catch {}
	}, [getCachedData, setCachedData]);

	const fetchFinances = useCallback(async () => {
		try {
			const res = await fetchClient("/internal/finances/overview");
			if (res?.ok) {
				const data = await res.json();
				if (data) {
					setFinancialData(data);
				}
			}
		} catch {
		} finally {
			setIsFinancialLoading(false);
		}
	}, []);

	const fetchMaterials = useCallback(async () => {
		try {
			const cached = await getCachedData("global_materials");
			if (cached) setMaterialData(cached);

			const res = await fetchClient("/internal/materials/list");
			if (res?.ok) {
				const data: MaterialData[] = await res.json();

				if (data && Array.isArray(data)) {
					const matDict: Record<string, MaterialData> = {};
					data.forEach((m) => {
						matDict[m.ticker] = {
							ticker: m.ticker,
							name: m.name,
							category: m.category,
							weight: m.weight || 1,
							volume: m.volume || 1,
						};
					});

					setMaterialData(matDict);
					await setCachedData("global_materials", matDict);
				}
			}
		} catch {}
	}, [getCachedData, setCachedData]);

	const fetchRecipes = useCallback(async () => {
		try {
			const cached = await getCachedData("global_recipes");
			const ONE_DAY_MS = 24 * 60 * 60 * 1000;
			if (cached?.data && cached?.timestamp) {
				setRecipes(cached.data);
				const age = Date.now() - cached.timestamp;
				if (age < ONE_DAY_MS) return;
			}

			const res = await fetchClient("/internal/materials/recipes");
			if (res?.ok) {
				const data = await res.json();
				if (Array.isArray(data)) {
					setRecipes(data);
					await setCachedData("global_recipes", {
						timestamp: Date.now(),
						data,
					});
				}
			}
		} catch (e) {
			console.warn("Failed to fetch internal recipes:", e);
		}
	}, [getCachedData, setCachedData]);

	const getMatProps = useCallback(
		(ticker: string) => {
			return materialData[ticker] || { weight: 1, volume: 1 };
		},
		[materialData],
	);

	const fetchMapData = useCallback(async () => {
		try {
			const cachedData = await getCachedData("map_data");
			const ONE_DAY_MS = 24 * 60 * 60 * 1000;
			if (cachedData?.data && cachedData?.timestamp) {
				setMapData(cachedData.data);
				const age = Date.now() - cachedData.timestamp;
				if (age < ONE_DAY_MS) {
					// Map data is less than 24h old, skip 10s backend download!
					setIsMapLoading(false);
					return;
				}
			}

			const res = await fetchClient("/dashboard_map");
			if (res?.ok) {
				const json = await res.json();
				if (json.data) {
					setMapData(json.data);
					await setCachedData("map_data", {
						timestamp: Date.now(),
						data: json.data,
						version: "1.0",
					});
				}
			}
		} catch (error) {
			setMapDataFetchError(
				error instanceof Error ? error.message : "An unknown error occurred",
			);
		} finally {
			setIsMapLoading(false);
		}
	}, [getCachedData, setCachedData]);

	const refreshMapData = useCallback(async () => {
		await deleteCachedData("map_data");
		setMapData(null);
		await fetchMapData();
	}, [deleteCachedData, fetchMapData]);

	const fetchDashboard = useCallback(
		(partialFilters: Partial<DashboardFilter> = {}) => {
			setIsLoading(true);
			setCurrentCXDashboardFilters((prev) => {
				const merged = { ...prev, ...partialFilters };
				sendJson({ action: "FETCH_DASHBOARD", filters: merged });
				return merged;
			});
		},
		[sendJson],
	);

	useEffect(() => {
		fetchMarketData();
		fetchMaterials();
		fetchRecipes();
		fetchCorpPrices();
	}, [fetchMarketData, fetchCorpPrices, fetchMaterials, fetchRecipes]);

	useEffect(() => {
		if (!isLoggedIn) return;

		fetchShipsData();
		fetchStorageData();
		fetchProductionData();
		fetchUserSites();
		fetchFinances();
		fetchLoansData();
		fetchShipBlueprints();
		fetchCorporationData();
	}, [
		isLoggedIn,
		fetchShipsData,
		fetchStorageData,
		fetchProductionData,
		fetchUserSites,
		fetchFinances,
		fetchLoansData,
		fetchCorpPrices,
		fetchShipBlueprints,
		fetchCorporationData,
	]);

	// --- STABLE WEBSOCKET LISTENER WITH THROTTLED MARKET BATCHING ---
	const handleMessageRef = useRef<(msg: WsMessage) => void>(() => {});

	handleMessageRef.current = (msg: WsMessage) => {
		switch (msg.type) {
			case "DASHBOARD_UPDATE": {
				const payload = msg.data?.cx_analytics ?? msg.data;
				if (payload) setDashboardData(payload);
				setIsLoading(false);
				break;
			}

			case "REFRESH_DASHBOARD":
				fetchDashboard();
				break;

			case "CORP_SITE_PRODUCTION_DELTA": {
				const delta = msg.data || msg;
				if (!delta || !delta.siteid || !delta.player || !delta.loc) break;

				setCorpData((prevCorps: any[]) => {
					if (!Array.isArray(prevCorps) || prevCorps.length === 0)
						return prevCorps;

					return prevCorps.map((corp) => {
						const members = corp.members || [];
						const isMember = members.some(
							(m: any) =>
								m.companyName === delta.player ||
								m.companyCode === delta.player,
						);
						if (!isMember) return corp;

						const currentSummary = corp.productionSummary || [];
						const summaryMap = new Map<string, any>();
						currentSummary.forEach((item: any) => {
							summaryMap.set(item.ticker, {
								...item,
								producers: (item.producers || []).filter(
									(p: any) =>
										!(p.player === delta.player && p.loc === delta.loc),
								),
								consumers: (item.consumers || []).filter(
									(c: any) =>
										!(c.player === delta.player && c.loc === delta.loc),
								),
								userRecipesUsed: (item.userRecipesUsed || [])
									.map((r: any) => ({
										...r,
										users: (r.users || []).filter(
											(u: any) =>
												!(u.player === delta.player && u.loc === delta.loc),
										),
									}))
									.filter((r: any) => (r.users || []).length > 0),
							});
						});

						// Apply new site material contributions
						(delta.materials || []).forEach((mDelta: any) => {
							const ticker = mDelta.ticker;
							let item = summaryMap.get(ticker);

							if (!item) {
								item = {
									ticker,
									productionTotal: 0,
									productionAccurate: 0,
									productionEstimated: 0,
									consumptionTotal: 0,
									consumptionAccurate: 0,
									consumptionEstimated: 0,
									net: 0,
									storageQty: 0,
									price: 0,
									marketSharePct: 0,
									batchProdActive: 0,
									batchProdQueued: 0,
									batchConsActive: 0,
									batchConsQueued: 0,
									producers: [],
									consumers: [],
									userRecipesUsed: [],
								};
							}

							if (mDelta.prodAmount > 0) {
								item.producers.push({
									loc: delta.loc,
									player: delta.player,
									amount: mDelta.prodAmount,
									isAccurate: delta.is_accurate,
									batchProdActive: mDelta.batchProdActive || 0,
									batchProdQueued: mDelta.batchProdQueued || 0,
								});
							}

							if (mDelta.consAmount > 0) {
								item.consumers.push({
									loc: delta.loc,
									player: delta.player,
									amount: mDelta.consAmount,
									isAccurate: delta.is_accurate,
									batchConsActive: mDelta.batchConsActive || 0,
									batchConsQueued: mDelta.batchConsQueued || 0,
								});
							}

							// Merge userRecipesUsed
							if (
								Array.isArray(mDelta.userRecipesUsed) &&
								mDelta.userRecipesUsed.length > 0
							) {
								mDelta.userRecipesUsed.forEach((newRec: any) => {
									let existingRec = item.userRecipesUsed.find(
										(r: any) => r.recipeKey === newRec.recipeKey,
									);
									if (!existingRec) {
										existingRec = {
											recipeKey: newRec.recipeKey,
											building: newRec.building,
											dailyOutput: 0,
											dailyCycles: 0,
											outputAmount: newRec.outputAmount,
											inputs: newRec.inputs || {},
											users: [],
										};
										item.userRecipesUsed.push(existingRec);
									}
									existingRec.users.push({
										player: delta.player,
										loc: delta.loc,
										dailyOutput: newRec.dailyOutput,
										dailyCycles: newRec.dailyCycles,
									});
									existingRec.dailyOutput = existingRec.users.reduce(
										(s: number, u: any) => s + u.dailyOutput,
										0,
									);
									existingRec.dailyCycles = existingRec.users.reduce(
										(s: number, u: any) => s + u.dailyCycles,
										0,
									);
								});
							}

							summaryMap.set(ticker, item);
						});

						// Re-calculate totals, nets, and marketSharePct for each material in summaryMap
						const updatedSummary: any[] = [];
						let totalCorpProdSum = 0;

						summaryMap.forEach((item) => {
							const prodTotal = item.producers.reduce(
								(sum: number, p: any) => sum + (p.amount || 0),
								0,
							);
							const consTotal = item.consumers.reduce(
								(sum: number, c: any) => sum + (c.amount || 0),
								0,
							);

							const bProdAct = item.producers.reduce(
								(sum: number, p: any) => sum + (p.batchProdActive || 0),
								0,
							);
							const bProdQue = item.producers.reduce(
								(sum: number, p: any) => sum + (p.batchProdQueued || 0),
								0,
							);
							const bConsAct = item.consumers.reduce(
								(sum: number, c: any) => sum + (c.batchConsActive || 0),
								0,
							);
							const bConsQue = item.consumers.reduce(
								(sum: number, c: any) => sum + (c.batchConsQueued || 0),
								0,
							);

							totalCorpProdSum += prodTotal;

							updatedSummary.push({
								...item,
								productionTotal: Math.round(prodTotal * 100) / 100,
								productionAccurate:
									Math.round(
										item.producers
											.filter((p: any) => p.isAccurate)
											.reduce((sum: number, p: any) => sum + p.amount, 0) * 100,
									) / 100,
								productionEstimated:
									Math.round(
										item.producers
											.filter((p: any) => !p.isAccurate)
											.reduce((sum: number, p: any) => sum + p.amount, 0) * 100,
									) / 100,
								consumptionTotal: Math.round(consTotal * 100) / 100,
								consumptionAccurate:
									Math.round(
										item.consumers
											.filter((c: any) => c.isAccurate)
											.reduce((sum: number, c: any) => sum + c.amount, 0) * 100,
									) / 100,
								consumptionEstimated:
									Math.round(
										item.consumers
											.filter((c: any) => !c.isAccurate)
											.reduce((sum: number, c: any) => sum + c.amount, 0) * 100,
									) / 100,
								net: Math.round((prodTotal - consTotal) * 100) / 100,
								batchProdActive: Math.round(bProdAct * 100) / 100,
								batchProdQueued: Math.round(bProdQue * 100) / 100,
								batchConsActive: Math.round(bConsAct * 100) / 100,
								batchConsQueued: Math.round(bConsQue * 100) / 100,
							});
						});

						// Calculate market share percentages
						updatedSummary.forEach((item) => {
							item.marketSharePct =
								totalCorpProdSum > 0
									? Math.round(
											(item.productionTotal / totalCorpProdSum) * 1000,
										) / 10
									: 0;
						});

						return {
							...corp,
							productionSummary: updatedSummary,
						};
					});
				});
				break;
			}

			case "INITIAL_SHIPMENT_DATA":
			case "SHIPMENT_DATA_UPDATE":
				if (msg.data) setShipmentState(msg.data);
				break;

			case "STORAGE_UPDATE":
			case "STORAGE_DATA_UPDATE":
				if (!msg.data) return;
				setStorageState((prev) => {
					const nextUnits = prev ? { ...prev.units } : {};
					if (Array.isArray(msg.data)) {
						msg.data.forEach((updatedUnit: StorageUnit) => {
							const unitId = updatedUnit.storageid;
							if (unitId) {
								nextUnits[unitId] = {
									...(nextUnits[unitId] || {}),
									...updatedUnit,
									storageid: unitId,
								};
							}
						});
					} else if (msg.data.storageid || msg.data.id) {
						const unitId = msg.data.storageid || msg.data.id;
						nextUnits[unitId] = {
							...(nextUnits[unitId] || {}),
							...msg.data,
							storageid: unitId,
						};
					} else {
						Object.entries(msg.data).forEach(
							([key, updatedUnit]: [string, any]) => {
								const unitId = updatedUnit.storageid || updatedUnit.id || key;
								nextUnits[unitId] = {
									...(nextUnits[unitId] || {}),
									...updatedUnit,
									storageid: unitId,
								};
							},
						);
					}
					return { units: nextUnits, lastUpdated: Date.now() };
				});
				break;

			case "SHIPMENT_POSITION_UPDATE":
				if (!msg.data?.shipId) break;
				setShipmentState((prev) => ({
					...prev,
					ships: {
						...prev.ships,
						[msg.data.shipId]: {
							...prev.ships[msg.data.shipId],
							flight: msg.data.flight,
						},
					},
				}));
				break;

			case "FLIGHT_PLAN_UPDATE": {
				const plan: FlightPlan = msg.data;
				if (!plan?.shipid) break;

				setActiveFlightPlans((prev) => {
					const map = new Map(prev.map((p) => [p.shipid, p]));
					map.set(plan.shipid, plan);
					return Array.from(map.values());
				});

				setAllShips((prev) => {
					const nextMap = new Map(prev);
					const ship = nextMap.get(plan.shipid!);
					if (ship) {
						nextMap.set(plan.shipid!, { ...ship, plan: { ...plan } });
					}
					return nextMap;
				});
				break;
			}

			case "PRODUCTION_UPDATE":
			case "SITE_UPDATE":
			case "SITE_PLATFORM_UPDATE":
				if (msg.data) {
					setProductionData((prev) => {
						const nextData = { ...prev };
						if (Array.isArray(msg.data)) {
							msg.data.forEach((site: SiteSummary) => {
								if (site.siteid) {
									nextData[site.siteid] = {
										...(nextData[site.siteid] || {}),
										...site,
									};
								}
							});
						} else if (msg.data.siteid) {
							nextData[msg.data.siteid] = {
								...(nextData[msg.data.siteid] || {}),
								...msg.data,
							};
						} else {
							Object.entries(msg.data).forEach(([key, site]: [string, any]) => {
								const sid = site.siteid || key;
								if (sid) {
									nextData[sid] = { ...(nextData[sid] || {}), ...site };
								}
							});
						}
						return nextData;
					});
				}
				break;

			case "SHIP_DATA_UPDATE": {
				if (!msg.data) break;
				const shipUpdates = Array.isArray(msg.data) ? msg.data : [msg.data];

				setAllShips((prev) => {
					const nextMap = new Map(prev);
					for (const shipUpdate of shipUpdates) {
						const shipId = shipUpdate.ship_id;
						if (!shipId) continue;

						const existing = nextMap.get(shipId);
						nextMap.set(shipId, {
							...(existing || {
								ship_id: shipId,
								position: [0, 0],
								progress: 0,
								plan: null,
								is_owner: false,
							}),
							...shipUpdate,
						});
					}
					return nextMap;
				});
				break;
			}

			case "WORKFORCE_UPDATE":
				if (!msg.data) return;
				setWorkforceData((prev) => {
					const next = prev ? { ...prev } : {};
					Object.entries(msg.data).forEach(([siteId, levels]) => {
						next[siteId] = levels as any;
					});
					return next;
				});
				break;

			case "MARKET_DATA_UPDATE":
			case "CX_PRICE_UPDATE":
				if (msg.data) {
					// 1. Safely parse stringified payloads
					let pData = msg.data;
					if (typeof pData === "string") {
						try {
							pData = JSON.parse(pData);
						} catch (e) {}
					}

					if (pData) {
						// 2. Map Array to Dictionary
						let updates: Record<string, any> = {};
						if (Array.isArray(pData)) {
							pData.forEach((item) => {
								const t = item.Ticker;
								if (t) updates[t] = item;
							});
						} else {
							updates = pData;
						}

						// Buffer incoming tick updates
						pendingMarketDataRef.current = {
							...pendingMarketDataRef.current,
							...updates,
						};

						if (!marketFlushTimerRef.current) {
							marketFlushTimerRef.current = setTimeout(() => {
								marketFlushTimerRef.current = null;
								flushMarketBuffer();
							}, 1200);
						}
					}
				}
				break;

			case "CONTRACTS_UPDATE":
			case "CONTRACT_UPDATE":
			case "CX_ORDER_UPDATE":
			case "PRICE_TICK":
				fetchFinances();
				break;

			case "FINANCES_UPDATE":
			case "FINANCIAL_OVERVIEW_UPDATE":
				if (msg.data) {
					setFinancialData(msg.data);
				} else {
					fetchFinances();
				}
				break;
		}
	};

	useEffect(() => {
		const listener = (msg: WsMessage) => handleMessageRef.current(msg);
		addMessageListener(listener);
		return () => removeMessageListener(listener);
	}, [addMessageListener, removeMessageListener]);

	// --- API HEALTH ---
	useEffect(() => {
		if (isConnected && isLoggedIn) setApiStatus("online");
		const checkStatus = async () => setApiStatus(await getApiStatus());
		checkStatus();
		const intervalId = setInterval(checkStatus, 30000);
		return () => clearInterval(intervalId);
	}, [isConnected, isLoggedIn]);

	// --- MEMOIZATION ---
	const ownerShips = useMemo(
		() => Array.from(allShips.values()).filter((s) => s.is_owner),
		[allShips],
	);

	const otherShips = useMemo(
		() => Array.from(allShips.values()).filter((s) => !s.is_owner),
		[allShips],
	);

	const providerValue = useMemo(
		() => ({
			materialData,
			recipes,
			getMatProps,
			dashboardData,
			isLoading,
			fetchDashboard,
			ownerShips,
			corpShipsGrouped,
			otherShips,
			activeFlightPlans,
			setActiveFlightPlans,
			allShips,
			setAllShips,
			shipBlueprints,
			refreshShipBlueprints: fetchShipBlueprints,
			userSites,
			refreshUserSites: fetchUserSites,
			shipmentState,
			setShipmentState,
			currentCXDashboardFilters,
			storageState,
			refreshStorage: fetchStorageData,
			productionData,
			workforceData,
			isProductionLoading,
			refreshProduction: fetchProductionData,
			mapData,
			mapDataFetchError,
			isMapLoading,
			fetchMapData,
			refreshMapData,
			marketData,
			corpPrices,
			corpData,
			fetchCorporationData,
			refreshCorpPrices: fetchCorpPrices,
			customPrices,
			refreshCustomPrices: fetchCustomPrices,
			saveCustomPricesBatch,
			loansData,
			refreshLoans: fetchLoansData,
			financialData,
			isFinancialLoading,
			fetchFinances,
			apiStatus,
			isLoggedIn,
			userMetadata,
			handleLoginSuccess,
			handleLogout,
		}),
		[
			materialData,
			getMatProps,
			dashboardData,
			isLoading,
			fetchDashboard,
			ownerShips,
			corpShipsGrouped,
			otherShips,
			activeFlightPlans,
			allShips,
			shipBlueprints,
			fetchShipBlueprints,
			userSites,
			fetchUserSites,
			shipmentState,
			currentCXDashboardFilters,
			storageState,
			fetchStorageData,
			productionData,
			workforceData,
			isProductionLoading,
			fetchProductionData,
			mapData,
			mapDataFetchError,
			isMapLoading,
			fetchMapData,
			refreshMapData,
			marketData,
			corpPrices,
			fetchCorpPrices,
			corpData,
			fetchCorporationData,
			customPrices,
			fetchCustomPrices,
			saveCustomPricesBatch,
			loansData,
			fetchLoansData,
			financialData,
			isFinancialLoading,
			fetchFinances,
			apiStatus,
			isLoggedIn,
			userMetadata,
			handleLoginSuccess,
			handleLogout,
		],
	);

	return (
		<GlobalDataContext.Provider value={providerValue}>
			{children}
		</GlobalDataContext.Provider>
	);
};

export { GlobalDataContext };

export const useGlobalData = (): GlobalDataContextState => {
	const ctx = useContext(GlobalDataContext);

	if (!ctx) {
		return {
			materialData: {},
			recipes: [],
			getMatProps: () => ({ weight: 1, volume: 1 }),
			dashboardData: null,
			isLoading: false,
			fetchDashboard: () => {},
			currentCXDashboardFilters: { range: "7D" },
			ownerShips: [],
			corpShipsGrouped: {},
			otherShips: [],
			allShips: new Map(),
			setAllShips: () => {},
			activeFlightPlans: [],
			setActiveFlightPlans: () => {},
			shipmentState: { contracts: [], ships: {} },
			setShipmentState: () => {},
			storageState: null,
			refreshStorage: async () => {},
			financialData: null,
			isFinancialLoading: false,
			fetchFinances: async () => {},
			productionData: {},
			workforceData: null,
			isProductionLoading: false,
			refreshProduction: async () => {},
			mapData: null,
			isMapLoading: false,
			mapDataFetchError: null,
			fetchMapData: async () => {},
			refreshMapData: async () => {},
			marketData: {},
			corpPrices: {},
			corpData: [],
			fetchCorporationData: async () => {},
			refreshCorpPrices: async () => {},
			loansData: [],
			refreshLoans: async () => {},
			apiStatus: "online",
			isLoggedIn: false,
			userMetadata: {
				username: null,
				displayName: null,
				companyCode: null,
				companyName: null,
				corpName: null,
			},
			handleLoginSuccess: () => {},
			handleLogout: () => {},
			customPrices: {},
			refreshCustomPrices: async () => {},
			saveCustomPricesBatch: async () => {},
			shipBlueprints: [],
			refreshShipBlueprints: async () => {},
			userSites: [],
			refreshUserSites: async () => {},
		};
	}

	return ctx;
};
