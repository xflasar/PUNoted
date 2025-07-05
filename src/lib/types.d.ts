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