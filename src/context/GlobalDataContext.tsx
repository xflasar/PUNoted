import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	ReactNode,
} from "react";
import { API_BASE_URL } from "../config/api";
import { useGlobalWsContext } from "../Dashboard/websocket/GlobalWsContext";
import { DashboardPayload, DashboardFilter } from "../Dashboard/CX/types";
import type {
	AnimatedShipData,
	FlightPlan,
} from "../components/common/StarMap/types/mapTypes";
import type { ShipmentState } from "../Dashboard/Shipping/types";
import type { StorageState, StorageUnit } from "../Dashboard/Storage/types";
import type { MaterialData } from "./types";

/**
 * Cache structure for map data stored in localStorage
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
	animatedShipData: AnimatedShipData[];
	/** State setter for animated ship data */
	setAnimatedShipData: React.Dispatch<React.SetStateAction<AnimatedShipData[]>>;
	/** Array of active flight plans for ships in transit */
	activeFlightPlans: FlightPlan[];
	/** State setter for active flight plans */
	setActiveFlightPlans: React.Dispatch<React.SetStateAction<FlightPlan[]>>;
	/** Raw initial ship data received from the backend on connection */
	rawInitialShips: any[] | null;
	/** State setter for raw initial ship data */
	setRawInitialShips: (data: any[] | null) => void;
	/** Current state of user shipments and contracts */
	shipmentState: ShipmentState;
	/** State setter for user shipments and contracts */
	setShipmentState: React.Dispatch<React.SetStateAction<ShipmentState>>;
	/** Current state of user storage units */
	storageState?: StorageState | null;
	/** Triggers a manual refresh of the user's storage data via REST API */
	refreshStorage: () => Promise<void>;
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

	const [animatedShipData, setAnimatedShipData] = useState<AnimatedShipData[]>(
		[],
	);
	const [activeFlightPlans, setActiveFlightPlans] = useState<FlightPlan[]>([]);
	const [rawInitialShips, setRawInitialShips] = useState<any[] | null>(null);

	const [shipmentState, setShipmentState] = useState<ShipmentState>({
		contracts: [],
		ships: {},
	});

	const [materialData, setMaterialData] = useState<
		Record<string, MaterialData>
	>({});

	const fetchMaterials = useCallback(async () => {
		try {
			// 1. Load from cache for zero-latency UI
			const cached = localStorage.getItem("global_materials_json_cache");
			if (cached) {
				setMaterialData(JSON.parse(cached));
				setIsLoading(false);
			}

			// 2. Fetch fresh JSON from the new backend endpoint
			const res = await fetch(`${API_BASE_URL}v1/materials/list`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("authToken")}`,
				},
			});

			// Because your backend returns a JSON array directly:
			const data: MaterialData[] = await res.json();

			if (data && Array.isArray(data)) {
				// 3. Map the array into a quick-lookup dictionary
				const matDict: Record<string, MaterialData> = {};

				data.forEach((m) => {
					matDict[m.ticker] = {
						ticker: m.ticker,
						name: m.name,
						category: m.category,
						weight: m.weight || 1, // Fallback to 1 to prevent division by zero
						volume: m.volume || 1,
					};
				});

				setMaterialData(matDict);
				localStorage.setItem(
					"global_materials_json_cache",
					JSON.stringify(matDict),
				);
			}
		} catch (e) {
			console.error("Failed to fetch global materials", e);
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

	const [storageState, setStorageState] = useState<StorageState | null>(null);

	// --- Map Data State ---
	const [mapData, setMapData] = useState<any | null>(null);
	const [isMapLoading, setIsMapLoading] = useState<boolean>(false);
	const [mapFetchError, setMapFetchError] = useState<string | null>(null);
	const [lastDashboardSessionId, setLastDashboardSessionId] = useState<
		string | null
	>(null);

	/**
	 * Cache utilities for map data
	 */
	const CACHE_KEY = "global_map_data_cache";
	const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

	const getCachedMapData = (): any | null => {
		try {
			const cached = localStorage.getItem(CACHE_KEY);
			if (!cached) return null;

			const cacheData: MapDataCache = JSON.parse(cached);
			const now = Date.now();
			const age = now - cacheData.timestamp;

			// Return cache if still valid
			if (age < CACHE_TTL) {
				console.log(`Map data cache HIT (age: ${Math.round(age / 1000)}s)`);
				return cacheData.data;
			} else {
				console.log("Map data cache expired");
				localStorage.removeItem(CACHE_KEY);
				return null;
			}
		} catch (e) {
			console.error("Failed to parse cached map data:", e);
			localStorage.removeItem(CACHE_KEY);
			return null;
		}
	};

	const setCachedMapData = (data: any): void => {
		try {
			const cacheData: MapDataCache = {
				timestamp: Date.now(),
				data,
				version: "1.0", // Bump this on breaking schema changes
			};
			localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
			console.log("Map data cached successfully");
		} catch (e) {
			console.error("Failed to cache map data:", e);
			// Gracefully continue even if caching fails
		}
	};

	/**
	 * Fetches map data from API with caching strategy
	 * Tries cache first, then fetches fresh data if cache miss or expired
	 * Only fetches if session ID has changed (prevents redundant refetches)
	 */
	const fetchMapData = useCallback(
		async (sessionId?: string) => {
			// If sessionId provided and matches last one, skip fetch
			if (sessionId && lastDashboardSessionId === sessionId && mapData) {
				console.log("Map data already loaded for this session, skipping fetch");
				return;
			}

			// Update session ID
			if (sessionId) {
				setLastDashboardSessionId(sessionId);
			}

			try {
				// 1. Load from cache first for instant UI
				const cachedData = getCachedMapData();
				if (cachedData) {
					setMapData(cachedData);
					setIsMapLoading(false);
					setMapFetchError(null);
					return; // Return early with cached data
				}

				// 2. Fetch fresh data from API if cache miss
				setIsMapLoading(true);
				setMapFetchError(null);

				const res = await fetch(`${API_BASE_URL}dashboard_map`);
				if (!res.ok) {
					throw new Error(`API returned ${res.status}`);
				}

				const json = await res.json();
				const freshData = json.data;

				if (freshData) {
					setMapData(freshData);
					setCachedMapData(freshData);
					setMapFetchError(null);
				}

				setIsMapLoading(false);
			} catch (err: any) {
				console.error("Map data fetch error:", err);
				setMapFetchError(String(err?.message ?? err));
				setIsMapLoading(false);

				// If fetch fails but we have cached data, use it
				const cachedData = getCachedMapData();
				if (cachedData && !mapData) {
					setMapData(cachedData);
					setMapFetchError(null);
				}
			}
		},
		[mapData, lastDashboardSessionId],
	);

	/**
	 * Manually refresh map data - clears cache and fetches fresh
	 */
	const refreshMapData = useCallback(async () => {
		localStorage.removeItem(CACHE_KEY);
		setMapData(null);
		setMapFetchError(null);
		await fetchMapData();
	}, [fetchMapData]);

	/**
	 * Fetches user storage data directly from the REST API.
	 * Called on initial load and can be triggered manually via refreshStorage.
	 */
	const fetchStorageData = useCallback(async () => {
		try {
			const token = localStorage.getItem("authToken");
			if (!token) return;

			const res = await fetch(`${API_BASE_URL}internal/storage/user_storage`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			const json = await res.json();

			if (json.success && json.data) {
				const unitsMap: Record<string, StorageUnit> = {};

				// The API might return an array of units or a dictionary of units.
				// We normalize it to an array here to safely iterate over it.
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

	// Initial storage fetch
	useEffect(() => {
		fetchStorageData();
	}, [fetchStorageData]);

	/**
	 * Updates local filters and requests fresh dashboard data from the WebSocket server.
	 * Uses a functional state update to ensure the latest filters are merged correctly.
	 */
	const fetchDashboard = useCallback(
		(partialFilters: Partial<DashboardFilter> = {}) => {
			setIsLoading(true);

			setCurrentCXDashboardFilters((prevFilters) => {
				const mergedFilters = {
					...prevFilters, // Retain existing parameters (e.g., exchange)
					...partialFilters, // Overwrite updated parameters (e.g., range)
				};

				// Request the updated dashboard payload via WebSocket
				sendJson({
					action: "FETCH_DASHBOARD",
					filters: mergedFilters,
				});

				return mergedFilters;
			});
		},
		[sendJson],
	);

	/**
	 * Centralized WebSocket message handler.
	 * Routes incoming messages to the appropriate state setters based on the message 'type'.
	 */
	useEffect(() => {
		const handleMessage = (msg: WsMessage) => {
			switch (msg.type) {
				case "DASHBOARD_UPDATE":
					if (msg.data?.cx_analytics) {
						// Spread into a new object to ensure React detects the state change
						setDashboardData({ ...msg.data.cx_analytics });
					}
					setIsLoading(false);
					break;

				case "REFRESH_DASHBOARD":
					// Triggered by backend to force clients to request fresh data
					fetchDashboard(currentCXDashboardFilters);
					break;

				case "INITIAL_SHIP_DATA":
					setRawInitialShips(msg.data);
					break;

				case "INITIAL_SHIPMENT_DATA":
				case "SHIPMENT_DATA_UPDATE":
					// Entire shipment state replacement (contracts and ships)
					setShipmentState(msg.data);
					break;

				case "STORAGE_UPDATE":
				case "STORAGE_DATA_UPDATE":
					if (!msg.data) return;

					setStorageState((prev) => {
						const nextUnits = prev ? { ...prev.units } : {};
						const updates = Array.isArray(msg.data) ? msg.data : [msg.data];

						// Merge incoming storage updates into the existing dictionary
						updates.forEach((updatedUnit: StorageUnit) => {
							if (updatedUnit.storageid) {
								nextUnits[updatedUnit.storageid] = updatedUnit;
							}
						});

						return {
							units: nextUnits,
							lastUpdated: Date.now(),
						};
					});
					break;

				case "SHIPMENT_POSITION_UPDATE":
					// Granular update for a specific ship's flight status
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
					setActiveFlightPlans((prev) => {
						const map = new Map(prev.map((p) => [p.shipid, p]));
						map.set(plan.shipid, { ...plan });
						return Array.from(map.values());
					});

					// Attach the new flight plan to the corresponding animated ship
					setAnimatedShipData((prev) =>
						prev.map((ship) =>
							ship.id === plan.shipid ? { ...ship, plan: { ...plan } } : ship,
						),
					);
					break;
				}

				case "SHIP_DATA_UPDATE": {
					const shipUpdate = msg.data;
					const shipId = shipUpdate.shipid || shipUpdate.id;
					setAnimatedShipData((prev) => {
						const shipMap = new Map(prev.map((s) => [s.id, s]));
						const existing = shipMap.get(shipId);

						// Merge the new ship data with existing data, or create a default structure if new
						shipMap.set(shipId, {
							...(existing || {
								id: shipId,
								position: [0, 0],
								progress: 0,
								plan: null,
							}),
							...shipUpdate,
						});
						return Array.from(shipMap.values());
					});
					break;
				}

				case "CONTRACTS_UPDATE":
					// Placeholder for future contract-specific handling
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

	/**
	 * Automatically requests initial context data once the WebSocket connects successfully.
	 */
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
				animatedShipData,
				setAnimatedShipData,
				activeFlightPlans,
				setActiveFlightPlans,
				rawInitialShips,
				setRawInitialShips,
				shipmentState,
				setShipmentState,
				currentCXDashboardFilters,
				storageState,
				refreshStorage: fetchStorageData,
				mapData,
				isMapLoading,
				mapFetchError,
				fetchMapData,
				refreshMapData,
			}}
		>
			{children}
		</GlobalDataContext.Provider>
	);
};

export { GlobalDataContext };

/**
 * Custom hook to safely consume the GlobalDataContext.
 * If used outside of a provider (e.g., in a public-facing page without auth),
 * it returns a safe, empty fallback object instead of throwing an error.
 *
 * @returns {GlobalDataContextState} The current global state and actions.
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
			animatedShipData: [],
			setAnimatedShipData: () => {},
			activeFlightPlans: [],
			setActiveFlightPlans: () => {},
			rawInitialShips: null,
			setRawInitialShips: () => {},
			shipmentState: { contracts: [], ships: {} },
			setShipmentState: () => {},
			storageState: null,
			refreshStorage: async () => {},
			mapData: null,
			isMapLoading: false,
			mapFetchError: null,
			fetchMapData: async () => {},
			refreshMapData: async () => {},
		} as GlobalDataContextState;
	}

	return ctx;
};
