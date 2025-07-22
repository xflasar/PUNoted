// src/lib/types.d.ts

// --- FIO API Response Types ---

// Type for each item in the /exchange/all response
export interface FioExchangeAllItem {
  MaterialTicker: string;
  ExchangeCode: string;
  MMBuy: number | null;
  MMSell: number | null;
  PriceAverage: number;
  AskCount: number | null;
  Ask: number | null;
  Supply: number;
  BidCount: number | null;
  Bid: number | null;
  Demand: number;
}

// The full response for /exchange/all is an array of FioExchangeAllItem
export type FioExchangeAllResponse = FioExchangeAllItem[];


// Full Material Definition from /data/materials
export interface FioMaterial {
  MaterialId: string;
  CategoryName: string;
  CategoryId: string;
  Name: string; // Full material name (e.g., "water")
  Ticker: string; // Material ticker (e.g., "H2O")
  Weight: number;
  Volume: number;
  UserNameSubmitted: string; // Could be null
  Timestamp: string;
}

// Single Order (Buy or Sell) from /exchange/{ticker}.{exchangeCode}
export interface FioExchangeOrder {
  OrderId: string;
  CompanyId: string;
  CompanyName: string;
  CompanyCode: string;
  ItemCount: number | null; // Can be null for market maker orders
  ItemCost: number;
}

// Exchange Data for a specific material from /exchange/{ticker}.{exchangeCode}
export interface FioExchangeData {
  BuyingOrders: FioExchangeOrder[];
  SellingOrders: FioExchangeOrder[];
  CXDataModelId: string;
  MaterialName: string;
  MaterialTicker: string;
  MaterialId: string;
  ExchangeName: string;
  ExchangeCode: string; // e.g., "IC1"
  Currency: string;
  Previous: number | null;
  Price: number; // Current average price on this exchange
  PriceTimeEpochMs: number;
  High: number;
  AllTimeHigh: number;
  Low: number;
  AllTimeLow: number;
  Ask: number; // Best sell price on this exchange
  AskCount: number; // Amount at best sell price
  Bid: number; // Best buy price on this exchange
  BidCount: number; // Amount at best buy price
  Supply: number; // Total supply on this exchange
  Demand: number; // Total demand on this exchange
  Traded: number; // Traded volume in units
  VolumeAmount: number; // Traded volume in currency
  PriceAverage: number; // Another average price
  NarrowPriceBandLow: number;
  NarrowPriceBandHigh: number;
  WidePriceBandLow: number;
  WidePriceBandHigh: number;
  MMBuy: number | null; // Market Maker Buy price
  MMSell: number | null; // Market Maker Sell price
  UserNameSubmitted: string; // Could be null
  Timestamp: string;
}

// Response from /market/all
export interface FioMarketAllPayload {
  materials: {
    [ticker: string]: {
      MaterialId: string;
      Price: number; // Average global price
      Ask: number; // Global best ask (sell price)
      Bid: number; // Global best bid (buy price)
      AskCount: number;
      BidCount: number;
      Volume: number; // Global volume traded
    };
  };
}

// --- Frontend Data Table Types ---

// This type represents a single row in the table, corresponding to one Material on one Exchange.
export interface MarketDataRow {
  materialTicker: string;
  materialName: string;
  exchangeCode: string;
  ask: number | null; // Sell price on this exchange
  askCount: number | null; // Amount at this ask
  bid: number | null; // Buy price on this exchange
  bidCount: number | null; // Amount at this bid
  priceAverage: number; // Average price on this exchange
  supply: number; // Total supply on this exchange
  demand: number; // Total demand on this exchange
  mmBuy: number | null; // Market Maker Buy price on this exchange
  mmSell: number | null; // Market Maker Sell price on this exchange
}

// Represents a single input material for an order
export interface ProductionLineInput {
  ProductionLineInputId: string;
  MaterialName: string;
  MaterialTicker: string;
  MaterialId: string;
  MaterialAmount: number;
}

// Represents a single output material for an order
export interface ProductionLineOutput {
  ProductionLineOutputId: string;
  MaterialName: string;
  MaterialTicker: string;
  MaterialId: string;
  MaterialAmount: number;
}

// Represents a single production order within a production line
export interface ProductionLineOrder {
  Inputs: ProductionLineInput[];
  Outputs: ProductionLineOutput[];
  ProductionLineOrderId: string;
  CreatedEpochMs: number;
  StartedEpochMs: number | null;
  CompletionEpochMs: number | null;
  DurationMs: number;
  LastUpdatedEpochMs: number | null;
  CompletedPercentage: number | null;
  IsHalted: boolean;
  Recurring: boolean;
  StandardRecipeName: string;
  ProductionFee: number;
  ProductionFeeCurrency: string;
  ProductionFeeCollectorId: string | null;
  ProductionFeeCollectorName: string | null;
  ProductionFeeCollectorCode: string | null;
}

// Represents a single production line (e.g., a farm, a refinery)
export interface FioProductionLine {
  Orders: ProductionLineOrder[];
  ProductionLineId: string;
  SiteId: string;
  PlanetId: string;
  PlanetNaturalId: string;
  PlanetName: string;
  Type: string; // e.g., "foodProcessor", "basicMaterialsPlant", "rig"
  Capacity: number;
  Efficiency: number;
  Condition: number;
  UserNameSubmitted: string;
  Timestamp: string; // ISO 8601 date string
}

// The response from /production/{username} is an array of FioProductionLine
export type FioProductionResponse = FioProductionLine[];

// Helper type to group production lines by planet for the UI
export interface FioPlanetProduction {
  id: string; // PlanetId
  name: string; // PlanetName
  naturalId: string; // PlanetNaturalId
  productionLines: FioProductionLine[];
}

// --- Storage API Types ---

export interface FioStorageItem {
  MaterialId: string;
  MaterialName: string;
  MaterialTicker: string;
  MaterialCategory: string;
  MaterialWeight: number;
  MaterialVolume: number;
  MaterialAmount: number;
  MaterialValue: number;
  MaterialValueCurrency: string; // e.g., "ICA"
  Type: string; // e.g., "INVENTORY"
  TotalWeight: number;
  TotalVolume: number;
}

export interface FioStorageUnit {
  StorageItems: FioStorageItem[];
  StorageId: string;
  AddressableId: string; // This might be the ID of the planet/ship/base
  Name: string; // Name of the storage location (e.g., "C-CI-060a Cargo Bay")
  WeightLoad: number;
  WeightCapacity: number;
  VolumeLoad: number;
  VolumeCapacity: number;
  FixedStore: boolean;
  Type: string; // e.g., "STL_FUEL_STORE", "STL_WAREHOUSE", "SP_CARGO"
  UserNameSubmitted: string;
  Timestamp: string; // ISO 8601 string
  PlanetId?: string; // If the storage is tied to a planet
  PlanetName?: string;
  PlanetNaturalId?: string;
}

export type FioStorageResponse = FioStorageUnit[]; // The endpoint returns an array of storage units

// FioSite interface
export interface FioSite {
  SiteId: string;
  PlanetId: string;
  PlanetIdentifier: string; // e.g., "FK-794b"
  PlanetName: string; // e.g., "Boucher"
  UserNameSubmitted: string;
  Timestamp: string;
  Buildings?: any[];
  InvestedPermits?: number;
  MaximumPermits?: number;
}

// FioWarehouse interface
export interface FioWarehouse {
  StoreId: string; // This is the ID we'll use for linking to FioStorageUnit.AddressableId
  WarehouseId: string; // A unique ID for the specific warehouse instance
  LocationName: string; // e.g., "Nova Honshu" (often the planet/base name where the warehouse is located)
  LocationNaturalId: string; // e.g., "BS-788c"
  VolumeCapacity: number;
  WeightCapacity: number;
  Units: number; // Number of warehouse units
  FeeAmount: number;
  FeeCurrency: string;
  UserNameSubmitted: string;
  Timestamp: string;
  NextPaymentTimestampEpochMs?: number;
  FeeCollectorCode?: string | null;
  FeeCollectorId?: string | null;
  FeeCollectorName?: string | null;
}

export interface EnhancedFioStorageUnit extends FioStorageUnit {
  linkedLocationName?: string; // The primary name of the linked site (PlanetName) or warehouse (LocationName)
  linkedLocationType?: 'PLANET_BASE' | 'WAREHOUSE_BUILDING' | 'UNKNOWN'; // Distinguishes the type of linked entity
  linkedLocationIdentifier?: string; // PlanetIdentifier for sites, LocationNaturalId for warehouses
}

// --- Production Input/Output API Types ---
export interface ProductionInputOutputItem {
  OrderId: string;
  Material: string; // Material Ticker
  Count: number;
}

// These are arrays of ProductionInputOutputItem
export type FioProductionInputResponse = ProductionInputOutputItem[];
export type FioProductionOutputResponse = ProductionInputOutputItem[];

// --- Workforce API Types ---
export interface WorkforceNeed {
  Category: string;
  Essential: boolean;
  MaterialId: string;
  MaterialName: string;
  MaterialTicker: string;
  Satisfaction: number;
  UnitsPerInterval: number;
  UnitsPerOneHundred: number;
}

export interface Workforce {
  Capacity: number;
  Population: number;
  Required: number;
  Reserve: number;
  Satisfaction: number;
  WorkforceNeeds: WorkforceNeed[];
  WorkforceTypeName: string;
}

export interface FioWorkforceWrapper {
  LastWorkforceUpdateTime: number;
  PlanetId: string;
  PlanetName: string;
  PlanetNaturalId: string;
  SiteId: string;
  Timestamp: string;
  UserNameSubmitted: string;
  Workforces: Workforce[];
}

// The API endpoint returns an array containing one of these wrapper objects
export type FioWorkforceResponse = FioWorkforceWrapper[];

// --- New Static Game Data Types ---

export interface RecipeInput {
  Key: string; // e.g., "AAF-CC" (BuildingTicker-MaterialTicker)
  Material: string; // Material Ticker, e.g., "FC"
  Amount: number; // Amount needed
}

export interface RecipeOutput {
  Key: string; // e.g., "FP-COF" (BuildingTicker-MaterialTicker)
  Material: string; // Material Ticker, e.g., "COF"
  Amount: number; // Amount produced
}

export interface Building {
  Ticker: string; // e.g., "FP"
  Name: string; // e.g., "foodProcessor"
  Area: number; // e.g., 42
  Expertise: string; // e.g., "FOOD_INDUSTRIES"
}

export interface BuildingCost {
  Key: string; // e.g., "FP-BSE" (BuildingTicker-MaterialTicker)
  Building: string; // Building Ticker, e.g., "FP"
  Material: string; // Material Ticker, e.g., "BSE"
  Amount: number; // Amount of material needed for cost
}

export interface BuildingWorkforce {
  Key: string; // e.g., "FP-PIONEER" (BuildingTicker-WorkforceLevel)
  Building: string; // Building Ticker, e.g., "FP"
  Level: string; // Workforce Level, e.g., "PIONEER"
  Capacity: number; // Workforce capacity needed
}

// --- Backend (ML/AI) Response Types ---
// These types define the structure of data returned by your Python Flask backend.

export interface ExpansionRecommendation {
  planetId: string;
  planetName: string;
  reasoning: string;
  estimatedCostICA: number;
  buildingsToBuild: { name: string; ticker: string; count: number; }[];
  requiredInputsDaily?: { name: string; ticker: string; amount: number; }[]; // Optional daily inputs
  estimatedDailyOutput?: { name: string; ticker: string; amount: number; }; // Optional daily output
}

export interface OptimizationInsight {
  type: 'supply_shortage' | 'production_bottleneck' | 'workforce_unrest' | 'overstock' | 'profit_opportunity' | string;
  description: string;
  recommendation?: string;
  planetName?: string;
  materialTicker?: string;
}

/**
 * Represents the overall structure of the data returned by the /dashboard endpoint.
 */
export interface DashboardData {
  current_state: CurrentStateData;
  history_data: HistoryData;
}

/**
 * Represents the current state data, including ships and workforces.
 */
export interface CurrentStateData {
  ships: Record<string, ShipData>;
  workforces: Record<string, WorkforceData>;
  latest_production_update?: any;
  latest_comex_broker_data?: any;
}

/**
 * Represents the historical data for various categories.
 */
export interface HistoryData {
  accounting_bookings: Record<string, AccountingBookingEntry[]>;
  production_orders: Record<string, ProductionOrderEntry[]>;
  comex_trader_orders: Record<string, ComexTraderOrderEntry[]>;
  storage_changes: Record<string, StorageChangeEntry[]>;
  ship_flights: Record<string, ShipFlightEntry[]>;
  contracts: Record<string, ContractEntry[]>;
}

/**
 * Types for `ship_processing` function.
 */
export interface ShipData {
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

export interface CurrentFlightData {
  departure?: any;
  arrival?: any;
  status?: string;
  eta?: any;
  chargeTime?: any;
  stlFuelConsumption?: number;
  ftlFuelConsumption?: number;
  stlDistance?: number;
  ftlDistance?: number;
  minReactorUsageFactor?: number;
  maxReactorUsageFactor?: number;
  origin?: FlightLocation;
  destination?: FlightLocation;
}

export interface FlightLocation {
  system_name: string | null;
  planet_name: string | null;
}

/**
 * Types for `workforce_processing` function.
 */
export interface WorkforceData {
  siteId: string;
  address?: WorkforceAddress;
  workforces: SingleWorkforce[];
}

export interface WorkforceAddress {
  system_name: string | null;
  planet_name: string | null;
}

export interface SingleWorkforce {
  level?: number;
  capacity?: number;
  population?: number;
  required?: number;
  satisfaction?: number;
  needs?: WorkforceNeed[];
  workforceTypeName?: string;
}

export interface WorkforceNeed {
  material_id: string | null;
  material_ticker: string | null;
  needed: number | null; // Corresponds to 'unitsPerInterval'
  essential: boolean | null;
  satisfaction: number | null;
}

/**
 * Types for `accounting_processing` function.
 */
export interface AccountingBookingEntry {
  overall_timestamp: number | null;
  booking_timestamp: number | null;
  accountCategory: string | null;
  balance_amount: number | null;
  debit: boolean | null;
}

/**
 * Types for `production_orders_processing` function.
 */
export interface ProductionOrderEntry {
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

export interface ProductionMaterialSummary {
  ticker: string | null;
  amount: number | null;
}

/**
 * Types for `comex_trader_processing` function.
 */
export interface ComexTraderOrderEntry {
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

export interface ComexTradeDetail {
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
export interface StorageChangeEntry {
  overall_timestamp: number | null;
  name: string | null;
  weightLoad: number | null;
  weightCapacity: number | null;
  volumeLoad: number | null;
  volumeCapacity: number | null;
  items_summary: StorageItemSummary[];
}

export interface StorageItemSummary {
  material_ticker: string | null;
  amount: number | null;
  value_amount: number | null;
  value_currency: string | null;
}

/**
 * Types for `ship_flight_processing` function.
 */
export interface ShipFlightEntry {
  overall_timestamp: number | null;
  messageType: string | null;
  flightId: string | null;
  status: string | null;
  eta_millis: number | null;
  chargeTime_millis: number | null;
  stlFuelConsumption: number | null;
  ftlFuelConsumption: number | null;
  stlDistance: number | null;
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
export interface ContractEntry {
  overall_timestamp: number | null;
  messageType: string | null;
  localId: string | null;
  date_timestamp: number | null;
  party: string | null;
  partner_name: string | null;
  partner_code: string | null;
  status: string | null;
  dueDate_timestamp: number | null;
  name: string | null;
  preamble: string | null;
  conditions_summary: ContractConditionSummary[];
}

export interface ContractConditionSummary {
  condition_type: string | null;
  condition_status: string | null;
  condition_id: string | null;
  condition_party: string | null;
  index: number | null;
  amount?: number | null; // For PAYMENT
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
}
