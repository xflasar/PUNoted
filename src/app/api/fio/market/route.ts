// src/app/api/fio/market/route.ts
import { NextResponse } from 'next/server';
import { fetchAllMarketOverview, fetchAllMaterials } from '@/lib/api/fio';
import { MarketDataRow, FioExchangeAllResponse, FioMaterial } from '@/lib/types';

// Cache for materials and market overview to avoid excessive FIO API calls
let cachedMaterialData: { [ticker: string]: FioMaterial } = {};
let lastMaterialFetchTime: number = 0;
const MATERIAL_CACHE_LIFETIME = 6 * 60 * 60 * 1000; // 6 hours

let cachedMarketOverviewData: FioExchangeAllResponse = [];
let lastMarketOverviewFetchTime: number = 0;
const MARKET_OVERVIEW_CACHE_LIFETIME = 15 * 60 * 1000;

async function getCachedMaterials(): Promise<{ [ticker: string]: FioMaterial }> {
  const now = Date.now();
  if (Object.keys(cachedMaterialData).length === 0 || (now - lastMaterialFetchTime > MATERIAL_CACHE_LIFETIME)) {
    try {
      cachedMaterialData = await fetchAllMaterials();
      lastMaterialFetchTime = now;
      console.log('FIO: Refreshed material definitions cache.');
    } catch (error) {
      console.error('FIO: Failed to refresh material definitions cache:', error);
      if (Object.keys(cachedMaterialData).length === 0) {
        throw error;
      }
    }
  }
  return cachedMaterialData;
}

// This function fetches and caches the FioExchangeAllResponse
async function getCachedMarketOverview(): Promise<FioExchangeAllResponse> {
  const now = Date.now();
  if (cachedMarketOverviewData.length === 0 || (now - lastMarketOverviewFetchTime > MARKET_OVERVIEW_CACHE_LIFETIME)) {
    try {
      cachedMarketOverviewData = await fetchAllMarketOverview();
      lastMarketOverviewFetchTime = now;
      console.log('FIO: Refreshed market overview cache using /exchange/all.');
    } catch (error) {
      console.error('FIO: Failed to refresh market overview cache from /exchange/all:', error);
      if (cachedMarketOverviewData.length === 0) {
        throw error;
      }
    }
  }
  return cachedMarketOverviewData;
}

export async function GET() {
  try {
    // Fetch both materials and raw market data concurrently
    const [materials, rawMarketExchangeData] = await Promise.all([
      getCachedMaterials(),
      getCachedMarketOverview(),
    ]);

    const processedData: MarketDataRow[] = [];

    // Directly map each FioExchangeAllItem to a MarketDataRow
    rawMarketExchangeData.forEach(item => {
      const materialDef = materials[item.MaterialTicker];

      processedData.push({
        materialTicker: item.MaterialTicker,
        materialName: materialDef ? materialDef.Name : item.MaterialTicker,
        exchangeCode: item.ExchangeCode,
        ask: item.Ask,
        askCount: item.AskCount,
        bid: item.Bid,
        bidCount: item.BidCount,
        priceAverage: item.PriceAverage,
        supply: item.Supply,
        demand: item.Demand,
        mmBuy: item.MMBuy,
        mmSell: item.MMSell,
      });
    });

    // Sort data by ticker and then exchange code for consistent display
    processedData.sort((a, b) => {
      if (a.materialTicker !== b.materialTicker) {
        return a.materialTicker.localeCompare(b.materialTicker);
      }
      return a.exchangeCode.localeCompare(b.exchangeCode);
    });

    return NextResponse.json({
      data: processedData,
      lastUpdated: new Date(lastMarketOverviewFetchTime).toISOString(), // Use cache timestamp
    });
  } catch (error: any) {
    console.error('Error in /api/fio/market route:', error);
    return NextResponse.json(
      { message: 'Failed to fetch market data', error: error.message },
      { status: 500 }
    );
  }
}