import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	useMemo,
} from "react";
import type { ReactNode } from "react";
import { openDB } from "idb";
import { fetchClient } from "../utils/apiClient";
import { useGlobalWsContext } from "../dashboard/websocket/globalwscontext";
import type { DashboardPayload, DashboardFilter } from "../dashboard/cx/types";
import type {
	AnimatedShipData,
	FlightPlan,
	ShipData,
	MapPoint,
	PlanetData,
	StationData,
} from "../components/common/starmap/types/maptypes";
import { processMapDataSingleton } from "../components/common/starmap/hooks/usemapdata";
import type { ShipmentState } from "../dashboard/shipping/types";
import type { StorageState, StorageUnit } from "../dashboard/storage/types";
import type { MaterialData } from "./types";
import type {
	SiteSummary,
	GroupedWorkforceData,
} from "../dashboard/production/types";

// --- IndexedDB Configuration ---
const DB_NAME = "PUNotedDB";
const STORE_NAME = "app-cache";

// Initialize IndexedDB
const dbPromise = openDB(DB_NAME, 1, {
	upgrade(db) {
		db.createObjectStore(STORE_NAME);
	},
});

/**
 * Cache structure for map data
 */
interface MapDataCache {
	timestamp: number;
	data: any;
	version: string;
}

/**
 * Defines the structure of the Global Data Context.
 * This context provides application-wide state for dashboards, ships, shipments, and storage.
 */
interface GlobalDataContextState {
	materialData: Record<string, MaterialData>;
	getMatProps: (ticker: string) => { weight: number; volume: number };
	/** Current dashboard analytics data payload */
	dashboardData: DashboardPayload | null;
	/** Indicates if the dashboard data is currently being fetched */
	isLoading: boolean;
	/** Triggers a fetch/update of the dashboard data with optional filters */
	fetchDashboard: (filters: Partial<DashboardFilter>) => void;
	/** The currently active filters applied to the dashboard */
	currentCXDashboardFilters: DashboardFilter;
	/** Array of active ships with their current animation/position states */
	ownerShips: ShipData[];
	/** Array of non-owner ships with their current animation/position states */
	otherShips: ShipData[];
	/** All Ships State */
	allShips: Map<string, ShipData>;
	/** State setter for all ships data */
	setAllShips: React.Dispatch<React.SetStateAction<Map<string, ShipData>>>;
	/** Array of active flight plans for ships in transit */
	activeFlightPlans: FlightPlan[];
	/** State setter for active flight plans */
	setActiveFlightPlans: React.Dispatch<React.SetStateAction<FlightPlan[]>>;
	/** Current state of user shipments and contracts */
	shipmentState: ShipmentState;
	/** State setter for user shipments and contracts */
	setShipmentState: React.Dispatch<React.SetStateAction<ShipmentState>>;
	/** Current state of user storage units */
	storageState?: StorageState | null;
	/** Triggers a manual refresh of the user's storage data via REST API */
	refreshStorage: () => Promise<void>;
	/** Production sites data */
	productionData: Record<string, SiteSummary>;
	/** Workforce data */
	workforceData: GroupedWorkforceData | null;
	/** Loading state for production/workforce data */
	isProductionLoading: boolean;
	/** Triggers a manual refresh of the user's production data via REST API */
	refreshProduction: () => Promise<void>;
	/** Map data for the galaxy map (systems, planets, stations, gateways, sectors) */
	mapData: any | null;
	/** Indicates if the map data is currently being fetched */
	isMapLoading: boolean;
	/** Fetch error message for map data if any */
	mapFetchError: string | null;
	/** Triggers a fetch/update of the map data */
	fetchMapData: () => Promise<void>;
	/** Manually refresh map data and clear cache */
	refreshMapData: () => Promise<void>;
	/** Processed Map Points */
	systemsPoints: MapPoint[];
	/** Processed Planet Data */
	allPlanetsData: Record<string, PlanetData[]>;
	/** Processed Station Data */
	allStationsData: Record<string, StationData[]>;
	/** Market data for the application */
	marketData: Record<string, any>;
}

/**
 * Interface defining the expected structure of incoming WebSocket messages.
 */
interface WsMessage {
	type: string;
	data?: any;
}

const GlobalDataContext = createContext<GlobalDataContextState | null>(null);

/**
 * GlobalDataProvider Component
 *
 * Acts as the centralized state manager for real-time and globally required data across the app.
 * It connects to the WebSocket context to receive live updates for ships, shipments, and dashboard analytics.
 */
export const GlobalDataProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const { status, sendJson, addMessageListener, removeMessageListener } =
		useGlobalWsContext();

	// --- State Definitions ---
	const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(
		null,
	);
	const [currentCXDashboardFilters, setCurrentCXDashboardFilters] =
		useState<DashboardFilter>({ range: "7D", exchange: "IC1" });
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const [allShips, setAllShips] = useState<Map<string, ShipData>>(new Map());

	const [activeFlightPlans, setActiveFlightPlans] = useState<FlightPlan[]>([]);

	const [shipmentState, setShipmentState] = useState<ShipmentState>({
		contracts: [],
		ships: {},
	});

	const [materialData, setMaterialData] = useState<
		Record<string, MaterialData>
	>({});

	const [marketData, setMarketData] = useState<Record<string, any>>({});

	const [storageState, setStorageState] = useState<StorageState | null>(null);

	const [productionData, setProductionData] = useState<
		Record<string, SiteSummary>
	>({});
	const [workforceData, setWorkforceData] =
		useState<GroupedWorkforceData | null>(null);
	const [isProductionLoading, setIsProductionLoading] = useState<boolean>(true);

	// --- Map Data State ---
	const [mapData, setMapData] = useState<any | null>(null);
	const [systemsPoints, setSystemsPoints] = useState<MapPoint[]>([]);
	const [allPlanetsData, setAllPlanetsData] = useState<
		Record<string, PlanetData[]>
	>({});
	const [allStationsData, setAllStationsData] = useState<
		Record<string, StationData[]>
	>({});

	useEffect(() => {
		if (mapData) {
			processMapDataSingleton(mapData)
				.then((processed) => {
					setSystemsPoints(processed.systemsPoints);
					setAllPlanetsData(processed.allPlanetsData);
					setAllStationsData(processed.allStationsData);
				})
				.catch((err) =>
					console.error("Failed to process map data globally:", err),
				);
		}
	}, [mapData]);

	const [isMapLoading, setIsMapLoading] = useState<boolean>(false);
	const [mapFetchError, setMapFetchError] = useState<string | null>(null);
	const [lastDashboardSessionId, setLastDashboardSessionId] = useState<
		string | null
	>(null);

	// --- IndexedDB Helper Methods ---
	const getCachedData = async (key: string): Promise<any | null> => {
		const db = await dbPromise;
		return await db.get(STORE_NAME, key);
	};

	const setCachedData = async (key: string, data: any): Promise<void> => {
		const db = await dbPromise;
		await db.put(STORE_NAME, data, key);
	};

	const deleteCachedData = async (key: string): Promise<void> => {
		const db = await dbPromise;
		await db.delete(STORE_NAME, key);
	};

	const fetchMarketData = useCallback(async () => {
		try {
			const res = await fetchClient("/v1/cx/prices");

			const data = await res.json();

			if (data) {
				setMarketData(data);
			}
		} catch (e) {
			console.error("Background market update failed", e);
		}
	}, []);

	useEffect(() => {
		fetchMarketData();
	}, [fetchMarketData]);

	// --- Materials Fetching (Stale-While-Revalidate) ---
	const fetchMaterials = useCallback(async () => {
		// 1. Instant Cache Load
		const cached = await getCachedData("global_materials");
		if (cached) {
			setMaterialData(cached);
			setIsLoading(false); // Stop loader immediately
		}

		// 2. Background Revalidation
		try {
			const res = await fetchClient("/v1/materials/list");

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
		} catch (e) {
			console.error("Background materials update failed", e);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Helper function exposed to all components
	const getMatProps = (ticker: string) => {
		return materialData[ticker] || { weight: 1, volume: 1 };
	};

	useEffect(() => {
		fetchMaterials();
	}, [fetchMaterials]);

	// --- Map Data Fetching (Stale-While-Revalidate) ---
	const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

	const fetchMapData = useCallback(
		async (sessionId?: string) => {
			if (sessionId && lastDashboardSessionId === sessionId && mapData) {
				return;
			}

			if (sessionId) setLastDashboardSessionId(sessionId);

			// 1. Instant Cache Load
			const cachedData: MapDataCache | null = await getCachedData("map_data");
			if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
				setMapData(cachedData.data);
			}

			// 2. Background Revalidation
			try {
				// Don't show loading spinner if we already have data
				if (!mapData && !cachedData) setIsMapLoading(true);
				setMapFetchError(null);

				const res = await fetchClient("/dashboard_map");
				if (!res.ok) throw new Error(`API returned ${res.status}`);

				const json = await res.json();
				const freshData = json.data;

				if (freshData) {
					setMapData(freshData);
					await setCachedData("map_data", {
						timestamp: Date.now(),
						data: freshData,
						version: "1.0",
					});
				}
			} catch (err: any) {
				console.error("Map background update failed:", err);
				setMapFetchError(String(err?.message ?? err));
			} finally {
				setIsMapLoading(false);
			}
		},
		[mapData, lastDashboardSessionId],
	);

	const refreshMapData = useCallback(async () => {
		await deleteCachedData("map_data");
		setMapData(null);
		setMapFetchError(null);
		await fetchMapData();
	}, [fetchMapData]);

	// --- Storage ---
	const fetchStorageData = useCallback(async () => {
		try {
			const res = await fetchClient("/internal/storage/user_storage");

			const json = await res.json();

			if (json.success && json.data) {
				const unitsMap: Record<string, StorageUnit> = {};
				const rawData = Array.isArray(json.data)
					? json.data
					: Object.values(json.data);

				rawData.forEach((unit: any) => {
					if (unit.storageid) {
						unitsMap[unit.storageid] = unit;
					}
				});

				setStorageState({
					units: unitsMap,
					lastUpdated: Date.now(),
				});
			}
		} catch (error) {
			console.error("Failed to fetch storage data:", error);
		}
	}, []);

	useEffect(() => {
		fetchStorageData();
	}, [fetchStorageData]);

	const fetchProductionData = useCallback(async () => {
		try {
			setIsProductionLoading(true);

			const [prodRes, workRes] = await Promise.all([
				fetchClient("/internal/production/user_production"),
				fetchClient("/user_workforce_with_needs"),
			]);

			const prodJson = await prodRes.json();
			const workJson = await workRes.json();

			if (prodJson.success) setProductionData(prodJson.data);
			if (workJson.success) setWorkforceData(workJson.data);
		} catch (error) {
			console.error("Failed to fetch production data:", error);
		} finally {
			setIsProductionLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchProductionData();
	}, [fetchProductionData]);

	// --- Dashboard Logic ---
	const fetchDashboard = useCallback(
		(partialFilters: Partial<DashboardFilter> = {}) => {
			setIsLoading(true);

			setCurrentCXDashboardFilters((prevFilters) => {
				const mergedFilters = {
					...prevFilters,
					...partialFilters,
				};

				sendJson({
					action: "FETCH_DASHBOARD",
					filters: mergedFilters,
				});

				return mergedFilters;
			});
		},
		[sendJson],
	);

	const fetchShipsData = useCallback(async () => {
		try {
			const res = await fetchClient("/internal/ships/");
			const json = await res.json();

			if (json && Array.isArray(json.ships)) {
				const shipMap = new Map<string, ShipData>(
					json.ships.map((s: ShipData) => [s.ship_id, s]),
				);
				setAllShips(shipMap);
			}
		} catch (error) {
			console.error("Failed to fetch ship data:", error);
		}
	}, []);

	useEffect(() => {
		fetchShipsData();
	}, [fetchShipsData]);

	const ownerShips = useMemo(
		() => Array.from(allShips.values()).filter((s) => s.is_owner),
		[allShips],
	);

	const otherShips = useMemo(
		() => Array.from(allShips.values()).filter((s) => !s.is_owner),
		[allShips],
	);

	// --- WebSocket Handler ---
	useEffect(() => {
		const handleMessage = (msg: WsMessage) => {
			switch (msg.type) {
				case "DASHBOARD_UPDATE":
					if (msg.data?.cx_analytics) {
						setDashboardData({ ...msg.data.cx_analytics });
					}
					setIsLoading(false);
					break;

				case "REFRESH_DASHBOARD":
					fetchDashboard(currentCXDashboardFilters);
					break;

				case "INITIAL_SHIPMENT_DATA":
				case "SHIPMENT_DATA_UPDATE":
					setShipmentState(msg.data);
					break;

				case "STORAGE_UPDATE":
				case "STORAGE_DATA_UPDATE":
					if (!msg.data) return;

					setStorageState((prev) => {
						const nextUnits = prev ? { ...prev.units } : {};

						if (Array.isArray(msg.data)) {
							msg.data.forEach((updatedUnit: StorageUnit) => {
								const unitId = updatedUnit.storageid || updatedUnit.id;
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

						return {
							units: nextUnits,
							lastUpdated: Date.now(),
						};
					});
					break;

				case "SHIPMENT_POSITION_UPDATE":
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

					if (!plan.shipid) {
						console.warn("Received FlightPlan without shipid", plan);
						break;
					}

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

				case "SHIP_DATA_UPDATE": {
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

				case "PRODUCTION_UPDATE":
					if (!msg.data) return;
					setProductionData((prev) => {
						const next = { ...prev };
						if (Array.isArray(msg.data)) {
							msg.data.forEach((site: SiteSummary) => {
								if (site.siteid) {
									next[site.siteid] = { ...(next[site.siteid] || {}), ...site };
								}
							});
						} else if (msg.data.siteid) {
							next[msg.data.siteid] = {
								...(next[msg.data.siteid] || {}),
								...msg.data,
							};
						} else {
							Object.entries(msg.data).forEach(([key, site]: [string, any]) => {
								const siteId = site.siteid || key;
								next[siteId] = {
									...(next[siteId] || {}),
									...site,
									siteid: siteId,
								};
							});
						}
						return next;
					});
					break;

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

				case "CONTRACTS_UPDATE":
					console.log("WS: General Contract Update");
					break;
			}
		};

		addMessageListener(handleMessage);
		return () => removeMessageListener(handleMessage);
	}, [
		addMessageListener,
		removeMessageListener,
		fetchDashboard,
		currentCXDashboardFilters,
	]);

	useEffect(() => {
		if (status === "connected") {
			console.log("GlobalData: Connected, requesting initial data...");
			fetchDashboard({ range: "7D" });
			sendJson({ action: "SUBSCRIBE", channel: "dashboard" });
		}
	}, [status, fetchDashboard, sendJson]);

	return (
		<GlobalDataContext.Provider
			value={{
				materialData,
				getMatProps,
				dashboardData,
				isLoading,
				fetchDashboard,
				ownerShips,
				otherShips,
				activeFlightPlans,
				setActiveFlightPlans,
				allShips,
				setAllShips,
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
				isMapLoading,
				mapFetchError,
				fetchMapData,
				refreshMapData,
				systemsPoints,
				allPlanetsData,
				allStationsData,
				marketData,
			}}
		>
			{children}
		</GlobalDataContext.Provider>
	);
};

export { GlobalDataContext };

/**
 * Custom hook to safely consume the GlobalDataContext.
 */
export const useGlobalData = (): GlobalDataContextState => {
	const ctx = useContext(GlobalDataContext);

	if (!ctx) {
		return {
			materialData: {},
			getMatProps: () => ({ weight: 1, volume: 1 }),
			dashboardData: null,
			isLoading: false,
			fetchDashboard: () => {},
			currentCXDashboardFilters: { range: "7D" },
			ownerShips: [],
			otherShips: [],
			allShips: new Map(),
			setAllShips: () => {},
			activeFlightPlans: [],
			setActiveFlightPlans: () => {},
			shipmentState: { contracts: [], ships: {} },
			setShipmentState: () => {},
			storageState: null,
			refreshStorage: async () => {},
			productionData: {},
			workforceData: null,
			isProductionLoading: false,
			refreshProduction: async () => {},
			mapData: null,
			isMapLoading: false,
			mapFetchError: null,
			fetchMapData: async () => {},
			refreshMapData: async () => {},
			systemsPoints: [],
			allPlanetsData: {},
			allStationsData: {},
			marketData: {},
		} as GlobalDataContextState;
	}

	return ctx;
};
