export interface LeasedSiteGroupProps {
	groupKey: string;
	sites: any[];
	collapsed: boolean;
	onToggle: () => void;
	siteTargets: Record<string, number>;
	onTargetDaysChange: (siteId: string, val: string) => void;
	onSelectSite: (siteId: string) => void;
}
