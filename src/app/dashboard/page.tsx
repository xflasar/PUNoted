// src/app/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, TextField, Paper, CircularProgress, Alert,
  Switch, FormControlLabel, FormGroup,
  createTheme, ThemeProvider, CssBaseline
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import {
  fetchAllMaterials,
  fetchUserProductionInputs,
  fetchUserProductionOutputs,
  fetchUserWorkforce,
  fetchUserStorage
} from '@/lib/api/fio';
import { backendApiClient } from '@/lib/api/backend';

// Import new components
import WorkforceOverview from '../../components/dashboard/WorkforceOverview';
import MaterialInventoryOverview from '../../components/dashboard/MaterialInventoryOverview';
import ShipsOverview from '../../components/dashboard/ShipsOverview';
import AccountingBookingsOverview from '../../components/dashboard/AccountingBookingsOverview';
import ComexTraderOrdersOverview from '../../components/dashboard/ComexTraderOrdersOverview';
import ProductionOrdersOverview from '../../components/dashboard/ProductionOrdersOverview';
import StorageChangesHistory from '../../components/dashboard/StorageChangesHistory';
import ShipFlightsHistory from '../../components/dashboard/ShipFlightsHistory';
import ContractsHistory from '../../components/dashboard/Contracts/ContractsHistory';
import ContractsWidget from '@/components/dashboard/Contracts/ContractsWidget';

// Re-defining FIO types here to ensure compatibility with PUCExt data structure
// In a real application, these would ideally be in a shared types file and mapped.
export interface FioMaterial { // Exported for use in other components
  Ticker: string;
  Name: string;
  Weight: number; // Assuming these exist for calculation
  Volume: number; // Assuming these exist for calculation
}

export interface ProductionInputOutputItem { // Exported
  materialTicker: string;
  amount: number;
  type: 'input' | 'output';
}

// Adjusted FioWorkforceResponse and Workforce to be compatible with new backend types
export interface Workforce { // Exported
  level: string; // FIO uses string, backend uses number
  population: number;
  required: number;
  capacity: number;
  satisfaction: number;
  needs: { material_ticker: string; needed: number; satisfaction: number; essential: boolean }[];
  siteId?: string; // Added to match SingleWorkforce if it's directly used
}

export interface FioWorkforceResponse { // Exported
  siteId: string;
  address?: { system_name: string | null; planet_name: string | null; };
  Workforces: Workforce[]; // Changed to capital W
}

export interface FioStorageItem { // Exported
  materialTicker: string;
  amount: number;
  totalWeight: number;
  totalVolume: number;
  totalValue: number;
}

export interface FioStorageUnit { // Exported
  id: string;
  name: string;
  type: string;
  totalWeight: number;
  totalVolume: number;
  items: FioStorageItem[];
}

// FIO specific types for ships, accounting, trader orders (will be replaced by backend types for PUCExt)
export interface FioShip { // Exported
  id: string;
  registration: string;
  name: string | null;
  mass: number;
  volume: number;
  blueprintNaturalId: string;
  acceleration: number;
  current_flight: {
    arrival: { timestamp: number };
    departure: { timestamp: number };
    destination: { planet_name: string; system_name: string };
    origin: { planet_name: string; system_name: string };
  } | null;
}

export interface FioAccountingBooking { // Exported
  booking_timestamp: number;
  accountCategory: string;
  balance_amount: number;
  debit: boolean;
}

export interface FioTraderOrder { // Exported
  material_ticker: string;
  order_type: string;
  amount: number;
  limit_amount: number;
  limit_currency: string;
  status: string;
  created_timestamp: number;
}


const MOCK_CURRENT_USER_NAME = 'XSUPEFLY';

type DashboardPageStage = 'initialChoice' | 'loading' | 'dashboardDisplay' | 'notFound';
type DataSourceType = 'fio' | 'pucext';

// --- New Backend API Types ---

/**
 * Represents the overall structure of the data returned by the /dashboard endpoint.
 */
export interface DashboardData { // Exported
  current_state: CurrentStateData;
  history_data: HistoryData;
}

/**
 * Represents the current state data, including ships and workforces.
 */
export interface CurrentStateData { // Exported
  ships: Record<string, ShipData>;
  workforces: Record<string, WorkforceData>;
  latest_production_update?: any; // Type based on actual structure if needed
  latest_comex_broker_data?: any; // Type based on actual structure if needed
}

/**
 * Types for `ship_processing` function.
 */
export interface ShipData { // Exported
  id: string;
  registration: string;
  name: string | null;
  mass: number;
  volume: number;
  blueprintNaturalId: string;
  acceleration: number;
  thrust: number;
  operatingEmptyMass: number;
  reactorPower: number;
  crew: number;
  cargoHoldCapacity: number;
  fuelTankCapacity: number;
  ftlFuelTankCapacity: number;
  current_flight: CurrentFlightData | null;
}

export interface CurrentFlightData { // Exported
  departure?: { timestamp: number }; // Can be more specific if structure is known (e.g., { timestamp: number })
  arrival?: { timestamp: number }; // Can be more specific if structure is known
  status?: string;
  eta?: any; // Can be more specific
  chargeTime?: any; // Can be more specific
  stlFuelConsumption?: number;
  ftlFuelConsumption?: number;
  ftlDistance?: number;
  minReactorUsageFactor?: number;
  maxReactorUsageFactor?: number;
  origin?: FlightLocation;
  destination?: FlightLocation;
}

export interface FlightLocation { // Exported
  system_name: string | null;
  planet_name: string | null;
}

/**
 * Types for `workforce_processing` function.
 */
export interface WorkforceData { // Exported
  siteId: string;
  address?: WorkforceAddress;
  Workforces: SingleWorkforce[]; // Changed to capital W
}

export interface WorkforceAddress { // Exported
  system_name: string | null;
  planet_name: string | null;
}

export interface SingleWorkforce { // Exported
  level?: number; // Changed to number
  capacity?: number;
  population?: number;
  required?: number;
  satisfaction?: number;
  needs?: WorkforceNeed[];
  workforceTypeName?: string; // Inferred, might be a direct property depending on original data
}

export interface WorkforceNeed { // Exported
  material_id: string | null;
  material_ticker: string | null;
  needed: number | null; // Corresponds to 'unitsPerInterval'
  essential: boolean | null;
  satisfaction: number | null;
}

/**
 * Types for `accounting_processing` function.
 */
export interface AccountingBookingEntry { // Exported
  overall_timestamp: number | null;
  booking_timestamp: number | null;
  accountCategory: string | null;
  balance_amount: number | null;
  debit: boolean | null;
}

/**
 * Types for `production_orders_processing` function.
 */
export interface ProductionOrderEntry { // Exported
  overall_timestamp: number | null;
  messageType: string | null;
  productionLineId: string | null;
  status: string | null;
  created_timestamp: number | null;
  started_timestamp: number | null;
  completion_timestamp: number | null;
  duration_millis: number | null;
  lastUpdated: number | null;
  completed: number | null;
  halted: boolean | null;
  recurring: boolean | null;
  recipeId: string | null;
  productionFee_amount: number | null;
  productionFee_currency: string | null;
  inputs_summary: ProductionMaterialSummary[];
  outputs_summary: ProductionMaterialSummary[];
}

export interface ProductionMaterialSummary { // Exported
  ticker: string | null;
  amount: number | null;
}

/**
 * Types for `comex_trader_processing` function.
 */
export interface ComexTraderOrderEntry { // Exported
  overall_timestamp: number | null;
  messageType: string | null;
  exchange_code: string | null;
  order_type: 'SELLING' | 'BUYING' | null;
  material_ticker: string | null;
  amount: number | null;
  initialAmount: number | null;
  limit_amount: number | null;
  limit_currency: string | null;
  created_timestamp: number | null;
  fulfilled_timestamp: number | null;
  cancelled_timestamp: number | null;
  fulfilledAmount: number | null;
  remainingAmount: number | null;
  fulfilled_trades: ComexTradeDetail[];
}

export interface ComexTradeDetail { // Exported
  trade_id: string | null;
  companyTradedWith: string | null;
  amount: number | null;
  time: number | null;
  price: number | null;
  priceCurrency: string | null;
}

/**
 * Types for `storage_processing` function.
 */
export interface StorageChangeEntry { // Exported
  overall_timestamp: number | null;
  name: string | null;
  weightLoad: number | null;
  weightCapacity: number | null;
  volumeLoad: number | null;
  volumeCapacity: number | null;
  items_summary: StorageItemSummary[];
}

export interface StorageItemSummary { // Exported
  material_ticker: string | null;
  amount: number | null;
  value_amount: number | null;
  value_currency: string | null;
}

/**
 * Types for `ship_flight_processing` function.
 */
export interface ShipFlightEntry { // Exported
  overall_timestamp: number | null;
  messageType: string | null;
  flightId: string | null;
  status: string | null;
  eta_millis: number | null;
  chargeTime_millis: number | null;
  stlFuelConsumption: number | null;
  ftlFuelConsumption: number | null;
  ftlDistance: number | null;
  minReactorUsageFactor: number | null;
  maxReactorUsageFactor: number | null;
  departure_timestamp: number | null;
  arrival_timestamp: number | null;
  destination_entity_name: string | null;
  destination_entity_type: string | null;
  destination_system_name?: string | null;
  destination_system_id?: string | null;
  destination_planet_name?: string | null;
  destination_planet_id?: string | null;
  destination_station_name?: string | null;
  destination_station_id?: string | null;
  total_stl_fuel_consumption_segments?: number;
  total_ftl_fuel_consumption_segments?: number;
  total_damage_segments?: number;
  flight_details_from_file_raw?: any; // Consider defining a more specific type if this is used
  origin_system_name?: string | null;
  origin_system_id?: string | null;
  origin_planet_name?: string | null;
  origin_planet_id?: string | null;
  origin_station_name?: string | null;
  origin_station_id?: string | null;
  origin_entity_type?: string | null;
}


/**
 * Types for `contracts_history_processing` function.
 */
export interface ContractEntry { // Exported
  overall_timestamp: number | null;
  messageType: string | null;
  localId: string | null;
  date_timestamp: number | null;
  party: string | null;
  partner_name: string | null;
  partner_code: string | null;
  status: string | null;
  dueDate_timestamp?: number | null;
  name: string | null;
  preamble: string | null;
  fulfillmentPercentage: number;
  conditions_summary: ContractConditionSummary[];
}

export interface ContractConditionSummary { // Exported
  type: string | null;
  status: string | null;
  id: string | null;
  party: string | null;
  quantity: { amount: number, material: {name: string, ticker: string}}
  index: number | null;
  amount?: {amount: number, currency: string} | null; // For PAYMENT
  currency?: string | null; // For PAYMENT
  material_name?: string | null; // For DELIVERY, SHIPMENT, COMEX_PURCHASE_PICKUP
  material_ticker?: string | null; // For DELIVERY, SHIPMENT, COMEX_PURCHASE_PICKUP
  quantity_amount?: number | null; // For DELIVERY, SHIPMENT, COMEX_PURCHASE_PICKUP
  quantity_weight?: number | null; // For DELIVERY, SHIPMENT
  quantity_volume?: number | null; // For DELIVERY, SHIPMENT
  address_system_name?: string | null; // For DELIVERY, COMEX_PURCHASE_PICKUP
  address_planet_station_name?: string | null; // For DELIVERY, COMEX_PURCHASE_PICKUP
  price_amount?: number | null; // For COMEX_PURCHASE_PICKUP
  price_currency?: string | null; // For COMEX_PURCHASE_PICKUP
  countryId?: string | null; // For REPUTATION
  reputationChange?: number | null; // For REPUTATION
  destination_system_name?: string | null; // For DELIVERY_SHIPMENT
  destination_planet_station_name?: string | null; // For DELIVERY_SHIPMENT
  shipmentItemId?: string | null; // For DELIVERY_SHIPMENT
  address: any;
  autoProvisionStoreId?: string | null;
  deadlineDuration?: { millis?: number | null } | null;
  dependencies: string[];
}

// --- End New Backend API Types ---

// Dark theme definition
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9', // primary elements
      light: '#e3f2fd', // backgrounds
      dark: '#42a5f5', // accents
      contrastText: '#000000',
    },
    background: {
      default: '#121212', // background
      paper: '#1e1e1e', // cards/papers
    },
    text: {
      primary: '#ffffff', // text
      secondary: '#b0b0b0', // secondary text
    },
    divider: '#424242', // dividers
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#333333', // table headers
          color: '#ffffff', // table headers
        },
      },
    },
  },
});

export default function DashboardPage() {
  const [stage, setStage] = useState<DashboardPageStage>('initialChoice');
  const [otherPlayerName, setOtherPlayerName] = useState<string>('');
  const [userName, setUserName] = useLocalStorage('userName', MOCK_CURRENT_USER_NAME);
  const [dataSource, setDataSource] = useLocalStorage<DataSourceType>('dashboardDataSource', 'fio');
  const [fioApiKey, setFioApiKey] = useLocalStorage<string>('fioApiKey', '');
  const [selectedInitialDataSource, setSelectedInitialDataSource] = useState<DataSourceType>('fio');

  const [productionInputs, setProductionInputs] = useState<ProductionInputOutputItem[]>([]);
  const [productionOutputs, setProductionOutputs] = useState<ProductionInputOutputItem[]>([]);
  const [workforceData, setWorkforceData] = useState<FioWorkforceResponse[]>([]);
  const [storageData, setStorageData] = useState<FioStorageUnit[]>([]);
  const [allMaterials, setAllMaterials] = useState<FioMaterial[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [backendData, setBackendData] = useState<DashboardData | null>(null);

  // Helper function to introduce a delay
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const fetchData = useCallback(async (player: string, currentDataSource: DataSourceType) => {
    setStage('loading');
    setError(null);
    try {
      // Clear previous data
      setProductionInputs([]);
      setProductionOutputs([]);
      setWorkforceData([]);
      setStorageData([]);
      setBackendData(null); // Clear backend data

      if (currentDataSource === 'fio') {
        // Fetch dynamic FIO data with delays
        const inputs = await fetchUserProductionInputs(player, fioApiKey);
        await delay(500);
        const outputs = await fetchUserProductionOutputs(player, fioApiKey);
        await delay(500);
        const workforce = await fetchUserWorkforce(player, fioApiKey);
        await delay(500);
        const storage = await fetchUserStorage(player, fioApiKey);

        if (!inputs && !outputs && !workforce && !storage) {
          setStage('notFound');
          return;
        }

        setWorkforceData(workforce ? Object.values(workforce).map(wf => ({ ...wf, Workforces: wf.workforces || wf.Workforces || [] })) : []);
        setStorageData(storage || []);

      } else { // PUCExt data source
        const response = await backendApiClient.get('/dashboard');
        if (response.status !== 200) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: DashboardData = await response.data;
        console.log(data)
        setBackendData(data); // Store the raw backend data

        // Map backend workforce data to FioWorkforceResponse structure
        const mappedWorkforce: FioWorkforceResponse[] = Object.values(data.current_state.workforces).map(wfData => ({
          siteId: wfData.siteId,
          address: wfData.address,
          Workforces: (wfData.Workforces || []).map(singleWf => ({
            level: singleWf.workforceTypeName || String(singleWf.level),
            population: singleWf.population || 0,
            required: singleWf.required || 0,
            capacity: singleWf.capacity || 0,
            satisfaction: singleWf.satisfaction || 0,
            needs: singleWf.needs ? singleWf.needs.map(need => ({
              material_ticker: need.material_ticker || 'UNKNOWN',
              needed: need.needed || 0,
              satisfaction: need.satisfaction || 0,
              essential: need.essential || false,
            })) : [],
            siteId: wfData.siteId,
          })),
        }));
        setWorkforceData(mappedWorkforce);
        console.log(mappedWorkforce)

        // Map backend storage data to FioStorageUnit structure
        const mappedStorage: FioStorageUnit[] = Object.values(data.history_data.storage_changes).map((storageEntries, index) => {
          const latestEntry = storageEntries.sort((a, b) => (b.overall_timestamp || 0) - (a.overall_timestamp || 0))[0];

          const items: FioStorageItem[] = latestEntry.items_summary.map(itemSummary => {
            const material = allMaterials.find(mat => mat.Ticker === itemSummary.material_ticker);
            const totalWeight = itemSummary.amount && material?.Weight ? itemSummary.amount * material.Weight : 0;
            const totalVolume = itemSummary.amount && material?.Volume ? itemSummary.amount * material.Volume : 0;
            return {
              materialTicker: itemSummary.material_ticker || 'UNKNOWN',
              amount: itemSummary.amount || 0,
              totalValue: itemSummary.value_amount || 0,
              totalWeight: totalWeight,
              totalVolume: totalVolume,
            };
          });

          return {
            id: `storage-${index}-${latestEntry.overall_timestamp}`,
            name: latestEntry.name || 'Unnamed Storage',
            type: 'WAREHOUSE',
            totalWeight: latestEntry.weightLoad || 0,
            totalVolume: latestEntry.volumeLoad || 0,
            items: items,
          };
        });
        setStorageData(mappedStorage);

        // Map production orders for inputs/outputs
        const allProductionInputs: ProductionInputOutputItem[] = [];
        const allProductionOutputs: ProductionInputOutputItem[] = [];
        Object.values(data.history_data.production_orders).forEach(orders => {
          orders.forEach(order => {
            order.inputs_summary.forEach(input => {
              if (input.ticker && input.amount !== null) {
                allProductionInputs.push({ materialTicker: input.ticker, amount: input.amount, type: 'input' });
              }
            });
            order.outputs_summary.forEach(output => {
              if (output.ticker && output.amount !== null) {
                allProductionOutputs.push({ materialTicker: output.ticker, amount: output.amount, type: 'output' });
              }
            });
          });
        });
        setProductionInputs(allProductionInputs);
        setProductionOutputs(allProductionOutputs);
      }

      setStage('dashboardDisplay');

    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(`Failed to load dashboard data from ${currentDataSource.toUpperCase()}. Please check the username and try again.`);
      setStage('initialChoice');
    }
  }, [allMaterials, fioApiKey]);

  // Load static materials once
  useEffect(() => {
    const loadMaterials = async () => {
      if (allMaterials.length === 0) {
        const materials = await fetchAllMaterials();
        setAllMaterials(Object.values(materials));
      }
    };
    loadMaterials();
  }, [allMaterials.length]);

  // Re-fetch dashboard data when userName or dataSource changes *after* initial choice
  useEffect(() => {
    if (stage === 'dashboardDisplay' && userName && allMaterials.length > 0) {
      fetchData(userName, dataSource);
    }
  }, [userName, dataSource, fetchData, allMaterials.length]);


  const handleFetchDashboard = () => {
    const playerToFetch = selectedInitialDataSource === 'fio' ? otherPlayerName : userName;

    if (selectedInitialDataSource === 'fio' && !playerToFetch.trim()) {
      setError("Please enter a player username for FIO Data.");
      return;
    }

    setDataSource(selectedInitialDataSource);
    if (selectedInitialDataSource === 'fio') {
      setUserName(otherPlayerName);
    }

    setStage('loading');
    fetchData(playerToFetch, selectedInitialDataSource);
  };

  const handleBackToChoice = () => {
    setStage('initialChoice');
    setOtherPlayerName('');
    setError(null);
  };

  const handleRefresh = () => {
    fetchData(userName, dataSource);
  };

  const handleDataSourceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSource: DataSourceType = event.target.checked ? 'pucext' : 'fio';
    setDataSource(newSource);
  };

  const handleInitialDataSourceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedInitialDataSource(event.target.checked ? 'pucext' : 'fio');
  };

  // Helper to get material name from ticker
  const getMaterialName = useCallback((ticker: string) => {
    const material = allMaterials.find(mat => mat.Ticker === ticker);
    return material ? material.Name : ticker;
  }, [allMaterials]);

  // Process workforce data for display
  const processedWorkforceData = useMemo(() => {
    const siteMap = new Map<string, {
      siteId: string;
      planetName: string;
      workforces: {
        workforceLevel: string;
        population: number;
        required: number;
        capacity: number;
        satisfaction: number;
        needs: { materialTicker: string; needed: number; satisfaction: number; essential: boolean }[];
      }[];
    }>();

    workforceData.forEach(siteWorkforce => {
      const siteId = siteWorkforce.siteId;
      const planetName = siteWorkforce.address?.planet_name || 'Unknown Planet';

      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, {
          siteId: siteId,
          planetName: planetName,
          workforces: []
        });
      }

      const currentSite = siteMap.get(siteId)!;

      siteWorkforce.Workforces.forEach(wf => {
        if (wf.required !== 0){
          currentSite.workforces.push({
            workforceLevel: wf.level,
            population: wf.population || 0,
            required: wf.required || 0,
            capacity: wf.capacity || 0,
            satisfaction: wf.satisfaction || 0,
            needs: wf.needs ? wf.needs.map(need => ({
              materialTicker: need.material_ticker || 'UNKNOWN',
              needed: need.needed || 0,
              satisfaction: need.satisfaction || 0,
              essential: need.essential || false,
            })) : [],
          });
        } 
      });
    });
    return Array.from(siteMap.values());
  }, [workforceData]);

  // Process storage data for overall material inventory
  const processedStorageSummary = useMemo(() => {
    const summaryMap = new Map<string, { totalAmount: number; totalWeight: number; totalVolume: number; totalValue: number }>();

    storageData.forEach(unit => {
      unit.items.forEach(item => {
        const current = summaryMap.get(item.materialTicker) || { totalAmount: 0, totalWeight: 0, totalVolume: 0, totalValue: 0 };
        current.totalAmount += item.amount;
        current.totalWeight += item.totalWeight;
        current.totalVolume += item.totalVolume;
        current.totalValue += item.totalValue;
        summaryMap.set(item.materialTicker, current);
      });
    });

    return Array.from(summaryMap.entries()).map(([materialTicker, data]) => ({
      materialTicker,
      materialName: getMaterialName(materialTicker),
      ...data
    })).sort((a, b) => a.materialName.localeCompare(b.materialName));
  }, [storageData, getMaterialName]);


  const renderContent = () => {
    switch (stage) {
      case 'initialChoice':
        return (
          <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', bgcolor: 'background.default' }}>
            <Paper elevation={6} sx={{ p: 4, borderRadius: '12px', textAlign: 'center', maxWidth: '500px', width: '100%', bgcolor: 'background.paper', color: 'text.primary' }}>
              <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
                FIO Dashboard
              </Typography>
              <FormGroup sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedInitialDataSource === 'pucext'}
                      onChange={handleInitialDataSourceChange}
                      name="initialDataSourceSwitch"
                      color="primary"
                    />
                  }
                  label={selectedInitialDataSource === 'fio' ? "Select FIO Data" : "Select PUCExt Data"}
                  sx={{ color: 'text.primary' }}
                />
              </FormGroup>

              {selectedInitialDataSource === 'fio' ? (
                <>
                  <TextField
                    label="Enter Player Username"
                    variant="outlined"
                    value={otherPlayerName}
                    onChange={(e) => setOtherPlayerName(e.target.value)}
                    fullWidth
                    sx={{ mb: 2, '& .MuiInputBase-input': { color: 'text.primary' }, '& .MuiInputLabel-root': { color: 'text.secondary' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
                    InputLabelProps={{ shrink: true }} // Fix deprecated
                  />
                  <TextField
                    label="FIO API Key (Optional)"
                    variant="outlined"
                    value={fioApiKey}
                    onChange={(e) => setFioApiKey(e.target.value)}
                    fullWidth
                    sx={{ mb: 2, '& .MuiInputBase-input': { color: 'text.primary' }, '& .MuiInputLabel-root': { color: 'text.secondary' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
                    type="password"
                    InputLabelProps={{ shrink: true }} // Fix deprecated
                  />
                </>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Using username from local storage for PUCExt data.
                </Typography>
              )}
              
              <Button
                variant="contained"
                onClick={handleFetchDashboard}
                fullWidth
                disabled={selectedInitialDataSource === 'fio' && !otherPlayerName.trim()}
                sx={{ py: 1.5, borderRadius: '8px' }}
              >
                View Dashboard
              </Button>
              {error && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>
                  {error}
                </Alert>
              )}
            </Paper>
          </Box>
        );

      case 'loading':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: 'background.default', color: 'text.primary' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>Loading Dashboard Data...</Typography>
          </Box>
        );

      case 'notFound':
        return (
          <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', bgcolor: 'background.default', color: 'text.primary' }}>
            <Alert severity="warning" sx={{ mb: 3, borderRadius: '8px' }}>
              No data found for the user or an error occurred.
            </Alert>
            <Button variant="contained" onClick={handleBackToChoice} startIcon={<ArrowBackIcon />} sx={{ borderRadius: '8px' }}>
              Back to Player Selection
            </Button>
          </Box>
        );

      case 'dashboardDisplay':
        return (
          <Box sx={{ p: 3, flexGrow: 1, maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', bgcolor: 'background.default', color: 'text.primary' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" component="h1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                {userName}&apos;s FIO Dashboard
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dataSource === 'pucext'}
                        onChange={handleDataSourceChange}
                        name="dataSourceSwitch"
                        color="primary"
                      />
                    }
                    label={dataSource === 'fio' ? "Using FIO Data" : "Using PUCExt Data"}
                    sx={{ mr: 2, color: 'text.primary' }}
                  />
                </FormGroup>
                <Button
                  variant="outlined"
                  onClick={handleRefresh}
                  startIcon={<RefreshIcon />}
                  sx={{ mr: 1, borderRadius: '8px', color: 'text.primary', borderColor: 'divider' }}
                >
                  Refresh Data
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleBackToChoice}
                  startIcon={<ArrowBackIcon />}
                  sx={{ borderRadius: '8px', color: 'text.primary', borderColor: 'divider' }}
                >
                  Change Player
                </Button>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
                {error}
              </Alert>
            )}

            {/* Render new components */}
            <WorkforceOverview
              processedWorkforceData={processedWorkforceData}
              dataSource={dataSource}
              getMaterialName={getMaterialName}
            />
            <MaterialInventoryOverview
              processedStorageSummary={processedStorageSummary}
              dataSource={dataSource}
            />
            {dataSource === 'pucext' && (
              <>
                <ShipsOverview backendData={backendData} />
                <AccountingBookingsOverview backendData={backendData} />
                <ComexTraderOrdersOverview backendData={backendData} />
                <ProductionOrdersOverview backendData={backendData} />
                <StorageChangesHistory backendData={backendData} />
                <ShipFlightsHistory backendData={backendData} />
                <ContractsWidget backendData={backendData} />
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {renderContent()}
      </Box>
    </ThemeProvider>
  );
}
