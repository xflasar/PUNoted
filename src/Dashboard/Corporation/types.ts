/**
 * Represents an individual producer or consumer in a production chain.
 */
export interface ProducerConsumerItem {
    loc: string;
    player: string;
    amount: number;
    isAccurate: boolean;
}

/**
 * Aggregated production and consumption statistics for a specific material ticker.
 */
export interface ProductionSummaryItem {
    ticker: string;
    production: number;
    productionTotal: number;
    productionAccurate: number;
    productionEstimated: number;
    consumption: number;
    consumptionTotal: number;
    consumptionAccurate: number;
    consumptionEstimated: number;
    net: number;
    producers: ProducerConsumerItem[];
    consumers: ProducerConsumerItem[];
    name: string;
}

/**
 * Information about a member of the corporation.
 */
export interface CorpMember {
    joinedDate: string | null;
    companyCode: string;
    companyName: string;
    isSynchronized: boolean;
    lastActive?: string;
}

/**
 * Core overview data for the entire corporation, including members and production summaries.
 */
export interface CorpOverviewData {
    name: string;
    code: string;
    memberCount: number;
    headquarters: string;
    productionSummary: ProductionSummaryItem[];
    members?: CorpMember[];
}

/**
 * Defines a custom grouping category for production items.
 */
export interface CustomCategory {
    id: string;
    title: string;
    items: ProductionSummaryItem[];
    isDrilldown: boolean;
    drillType?: 'prod' | 'cons';
}