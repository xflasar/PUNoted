export interface ProducerConsumerItem {
    loc: string;
    player: string;
    amount: number;
    isAccurate: boolean;
}

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

export interface CorpMember {
    joinedDate: string | null;
    companyCode: string;
    companyName: string;
    isSynchronized: boolean;
    lastActive?: string;
}

export interface CorpOverviewData {
    name: string;
    code: string;
    memberCount: number;
    headquarters: string;
    productionSummary: ProductionSummaryItem[];
    members?: CorpMember[];
}

export interface CustomCategory {
    id: string;
    title: string;
    items: ProductionSummaryItem[];
    isDrilldown: boolean;
    drillType?: 'prod' | 'cons';
}