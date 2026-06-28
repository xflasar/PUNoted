export interface StorageItem {
	id?: string;
	name: string;
	quantity: number;
	type?: string;
	total_worth?: number;
}

export interface StorageUnit {
	addressableid: string | undefined;
	storageplanetid: any;
	owner: any;
	storageid: string; // The unique key
	name: string;
	type: string;
	storagelocation: string | null;
	volumecapacity: number;
	volumeload: number;
	weightcapacity: number;
	weightload: number;
	items: StorageItem[];
}

export interface StorageState {
	units: Record<string, StorageUnit>; // Dictionary for fast updates
	lastUpdated: number;
}
