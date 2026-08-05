export interface FastLogisticsModalProps {
	open: boolean;
	onClose: () => void;
	initialTab?: "resupply" | "export";
	siteName: string;
	consumptionList?: any[];
	productionList?: any[];
	storageList?: any[];
	targetDays?: number;
	siteStorageCapacity?: number;
	warehouseStorageCapacity?: number;
	siteStoredVol?: number;
	siteStoredMass?: number;
	daysUntilFull?: number | null;
	onShowSnackbar?: (msg: string) => void;
}

export interface CargoOption {
	id: string;
	name: string;
	volCap: number;
	massCap: number;
}
