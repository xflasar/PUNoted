export interface HistoryPoint {
	timestamp: string;
	askprice: number;
	bidprice: number;
	supply: number;
}

export interface OrderBookEntry {
	price: number;
	amount: number;
	trader?: string;
}

export interface TickerDetail {
	found: boolean;
	ticker: string;
	exchange: string;
	full_ticker: string;
	priceaverage: number;
	askprice: number;
	askamount: number;
	bidprice: number;
	bidamount: number;
	high: number;
	low: number;
	volume: number;
	traded: number;
	alltimehigh: number;
	alltimelow: number;
	last_update: string | null;
	bids: OrderBookEntry[];
	asks: OrderBookEntry[];
}

export interface CommodityItem {
	ticker: string;
	name: string;
	price: number;
	change: number; // percentage
	askPrice: number;
	bidPrice: number;
	askAmt: number;
	bidAmt: number;
	rawRecord: Record<string, any>;
}
