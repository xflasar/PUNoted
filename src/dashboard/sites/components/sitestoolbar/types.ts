export interface SitesToolbarProps {
	summaryOpen: boolean;
	setSummaryOpen: (val: boolean) => void;
	filteredSitesCount: number;
	totalLinesCount: number;
	groupLoanedMode?: "owned" | "user";
	setGroupLoanedMode?: (mode: "owned" | "user") => void;
	leaseFilter: string;
	setLeaseFilter: (val: any) => void;
	availableTenants: string[];
	selectedTenants: string[];
	setSelectedTenants: (val: string[]) => void;
	searchTerm: string;
	setSearchTerm: (val: string) => void;
}
