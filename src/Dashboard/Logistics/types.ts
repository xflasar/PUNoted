export interface Storage {
    maxTonnage: number;
    maxVolume: number;
    currentTonnage: number;
    currentVolume: number;
}

export interface Site {
    id: string;
    name: string;
    storage: Storage;
    dailyProduction: Record<string, number>; // Material Ticker -> Amount
    dailyConsumption: Record<string, number>; // Material Ticker -> Amount
}

export interface Ship {
    id: string;
    name: string;
    maxTonnage: number;
    maxVolume: number;
    status: string; // 'idle' | 'in-transit' | 'docked'
    location: string;
    assignedSiteId?: string;
}