export interface EmpireSummaryProps {
	summaryOpen: boolean;
	processedSites: any[];
	selectedSummarySites: Record<string, boolean>;
	setSelectedSummarySites: React.Dispatch<
		React.SetStateAction<Record<string, boolean>>
	>;
	globalSummary: [string, { prod: number; cons: number; net: number }][];
}
