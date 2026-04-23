// src/Dashboard/CX/types.ts

// --- Filters ---
export type TimeRange = '1H' | '24H' | '7D' | '30D' | 'ALL' | 'CUSTOM';

export interface DashboardFilter {
    range: TimeRange;
    startDate?: string;
    endDate?: string;
    exchange?: string;
}

// --- Data Models ---
export interface CxOrder {
    orderid: string;
    materialid: string;
    ticker: string;
    type: 'SELLING' | 'BUYING';
    initial_amount: number;
    price: number; 
    currency: string;
    status: 'FILLED' | 'OPEN' | 'PARTIALLY_FILLED' | 'CANCELLED';
    created: string; 
    filled_amount: number;
    fill_percent: number;
    total_value: number; 
}

export interface KpiData {
    revenue: number;
    expenses: number;
    profit: number;
    volumeSold: number;
    volumeBought: number;
    bestSellingItem: string;
    mostBoughtItem: string;
    totalTrades: number;
}

export interface ChartDataPoint {
    time: string;
    revenue: number;
    expenses: number;
    volume: number;
}

export interface Trade {
    time: string;
    ticker: string;
    type: 'SELLING' | 'BUYING';
    amount: number;
    value: number;
}

// --- NEW: Storage Valuation Interface ---
export interface StorageValuationItem {
    ticker: string;
    materialId: string;
    amount: number;
    marketAsk: number;
    marketBid: number;
    totalValueCorp: number;
    totalValue: number;

}

export interface StorageValuationResponse {
    storages: StorageValuation[];
    storageName: string;
    items: StorageValuationItem[];
}

export interface StorageValuation {
    storageid: string;
    storagelocation: string;
}

export interface PriceData {
    ticker: string;
    ask: number;
    bid: number;
}

export interface WatcherItem {
    id: string;
    ticker: string;
    targetPrice: number;
    type: 'BUY' | 'SELL';
    lastPrice?: number;
    triggered: boolean;
}

export interface DashboardPayload {
    kpi: KpiData;
    chartData: ChartDataPoint[];
    activeOrders: CxOrder[];
    trades: Trade[];
    lastUpdated: string;
}

// --- WebSocket Messages ---
export interface WsMessage {
    type: 'DASHBOARD_UPDATE' | 'ORDER_UPDATE' | 'ERROR';
    payload: any;
}

export interface WsRequest {
    action: 'SUBSCRIBE' | 'UNSUBSCRIBE';
    filter: DashboardFilter;
}