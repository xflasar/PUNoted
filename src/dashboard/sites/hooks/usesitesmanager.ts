import { useState, useEffect, useMemo, useCallback } from "react";
import { useGlobalData } from "../../../context/globaldatacontext";
import type { FlowData, SiteWithFlows } from "../../production/types";
import { LOCAL_STORAGE_KEY, DEFAULT_DAYS } from "../utils/constants";

export const useSitesManager = () => {
	const {
		productionData: data,
		workforceData: workforce,
		isProductionLoading: loading,
		storageState,
	} = useGlobalData();

	// --- STATE ---
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedSite, setSelectedSite] = useState<SiteWithFlows | null>(null);
	const [siteTargets, setSiteTargets] = useState<Record<string, number>>({});
	const [summaryOpen, setSummaryOpen] = useState(false);

	// --- GROUPING & FILTER STATE ---
	const [groupLoanedMode, setGroupLoanedModeState] = useState<"owned" | "user">(
		() => {
			try {
				const saved = localStorage.getItem("punoted_group_loaned_mode");
				if (saved === "user" || saved === "owned") return saved;
			} catch {}
			return "owned";
		},
	);

	const setGroupLoanedMode = useCallback((mode: "owned" | "user") => {
		setGroupLoanedModeState(mode);
		try {
			localStorage.setItem("punoted_group_loaned_mode", mode);
		} catch {}
	}, []);

	const [leaseFilter, setLeaseFilter] = useState<
		"all" | "owned" | "leased" | "loaned"
	>("all");
	const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
	const [selectedSummarySites, setSelectedSummarySites] = useState<
		Record<string, boolean>
	>({});

	// --- LOAD DATA ---
	useEffect(() => {
		try {
			const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (stored) setSiteTargets(JSON.parse(stored));
		} catch {}
	}, []);

	// --- HELPER TO EXTRACT CLEAN PARTNER USERNAME ---
	const getCleanPartnerName = useCallback((site: any): string => {
		const raw =
			site.tenant ||
			site.leased_to ||
			site.leased_from ||
			site.partner ||
			"Partner";
		if (typeof raw !== "string") return "Partner";
		let clean = raw.trim();
		if (clean.includes(" - ")) {
			const parts = clean.split(" - ");
			clean = parts[1] || parts[0] || clean;
		}
		return clean;
	}, []);

	// --- PROCESSING ---
	const processedSites = useMemo(() => {
		if (!data) return [];

		let rawSitesList: any[] = [];
		if (Array.isArray(data)) {
			rawSitesList = data;
		} else if (typeof data === "object") {
			const owned = Array.isArray((data as any).owned)
				? (data as any).owned
				: Object.values((data as any).owned || {});
			const inbound = Array.isArray((data as any).inbound)
				? (data as any).inbound
				: Object.values((data as any).inbound || {});
			const outbound = Array.isArray((data as any).outbound)
				? (data as any).outbound
				: Object.values((data as any).outbound || {});
			rawSitesList = [...owned, ...inbound, ...outbound];
		}

		const storageUnits = storageState?.units
			? Object.values(storageState.units)
			: [];

		return rawSitesList.map((site) => {
			const siteId = site.siteid || site.id;
			const richFlows: Record<string, FlowData> = {};

			const flowsSource = site.site_daily_flow || {};
			Object.entries(flowsSource).forEach(([ticker, val]: [string, any]) => {
				richFlows[ticker] = {
					ticker,
					flow: val.flow,
					baseFlow: val.flow,
					workforceFlow: 0,
					currentAmount: val.currentAmount,
					daysRemaining: 0,
					missing: 0,
					isProduction: val.flow > 0,
				};
			});

			const siteWorkforce = workforce ? workforce[siteId] : null;
			if (siteWorkforce) {
				siteWorkforce.forEach((level) => {
					level.needs.forEach((need) => {
						if (!richFlows[need.ticker]) {
							richFlows[need.ticker] = {
								ticker: need.ticker,
								flow: 0,
								baseFlow: 0,
								workforceFlow: 0,
								currentAmount: need.currentamount,
								daysRemaining: 0,
								missing: 0,
								isProduction: false,
							};
						}
						const consumption = -(need.unitsperinterval || 0);
						richFlows[need.ticker].workforceFlow += consumption;
						richFlows[need.ticker].flow += consumption;
					});
				});
			}

			const siteStorage = storageUnits.find(
				(u) =>
					u.addressableid === siteId ||
					(u.storageplanetid === site.planetid && u.type === "SITE"),
			);
			const siteOwner = siteStorage?.owner;

			const matchingUnits = storageUnits.filter((u) => {
				const isSiteStorage =
					u.addressableid === siteId ||
					(u.storageplanetid === site.planetid && u.type === "SITE");
				const isOwnerWarehouse =
					u.storageplanetid === site.planetid &&
					(u.type === "WAREHOUSE" || u.type === "WAREHOUSE_STORE") &&
					(!siteOwner || u.owner === siteOwner);

				return isSiteStorage || isOwnerWarehouse;
			});

			const matchingWarehouseUnits = storageUnits.filter((u) => {
				return (
					u.storageplanetid === site.planetid &&
					(u.type === "WAREHOUSE" || u.type === "WAREHOUSE_STORE") &&
					(!siteOwner || u.owner === siteOwner)
				);
			});

			const totalWhVolCap = matchingWarehouseUnits.reduce(
				(acc, u) => acc + (u.volumecapacity || 0),
				0,
			);
			const totalWhWeightCap = matchingWarehouseUnits.reduce(
				(acc, u) => acc + (u.weightcapacity || 0),
				0,
			);

			let finalStorageItems: any[];

			if (matchingUnits.length > 0) {
				const aggregatedItems = new Map<string, any>();
				matchingUnits.forEach((u) => {
					const displayType =
						u.type === "WAREHOUSE_STORE" || u.type === "WAREHOUSE"
							? "warehouse"
							: "site";
					(u.items || []).forEach((item: any) => {
						const key = `${item.name}-${displayType}`;
						if (aggregatedItems.has(key)) {
							aggregatedItems.get(key)!.amount += item.quantity;
						} else {
							aggregatedItems.set(key, {
								ticker: item.name,
								amount: item.quantity,
								type: displayType,
								material_id: item.id || "",
							});
						}
					});
				});
				finalStorageItems = Array.from(aggregatedItems.values());
			} else {
				const aggregatedItems = new Map<string, any>();
				(site.storage_items || []).forEach((item: any) => {
					const displayType =
						item.type && item.type.includes("WAREHOUSE") ? "warehouse" : "site";
					const key = `${item.ticker}-${displayType}`;
					if (aggregatedItems.has(key)) {
						aggregatedItems.get(key)!.amount += item.amount;
					} else {
						aggregatedItems.set(key, { ...item, type: displayType });
					}
				});
				finalStorageItems = Array.from(aggregatedItems.values());
			}

			Object.keys(richFlows).forEach((ticker) => {
				const siteStored = finalStorageItems
					.filter((item) => item.ticker === ticker && item.type === "site")
					.reduce((acc, item) => acc + (item.amount || 0), 0);

				const warehouseStored = finalStorageItems
					.filter((item) => item.ticker === ticker && item.type === "warehouse")
					.reduce((acc, item) => acc + (item.amount || 0), 0);

				richFlows[ticker].siteAmount = siteStored;
				richFlows[ticker].warehouseAmount = warehouseStored;
				richFlows[ticker].currentAmount = siteStored + warehouseStored;
			});

			const leaseType = site.type || (site.tenant ? "Outbound" : "owned");
			const isLeased = leaseType !== "owned";
			const partner = site.leased_to || site.leased_from || site.tenant || null;

			return {
				site: {
					...site,
					siteid: siteId,
					storage_items: finalStorageItems,
					storage_capacity:
						siteStorage?.volumecapacity ||
						site.storage_capacity ||
						site.volumecapacity ||
						site.volume_capacity ||
						site.capacity,
					weight_capacity:
						siteStorage?.weightcapacity ||
						site.weight_capacity ||
						site.weightcapacity,
					warehouse_capacity: totalWhVolCap || (site as any).warehouse_capacity,
					warehouse_weight_capacity:
						totalWhWeightCap || (site as any).warehouse_weight_capacity,
					isLeased: isLeased,
					type: leaseType,
					partner: partner,
					tenant: partner,
				},
				richFlows,
			};
		});
	}, [data, workforce, storageState]);

	useEffect(() => {
		setSelectedSummarySites((prev) => {
			const next = { ...prev };
			let updated = false;
			processedSites.forEach(({ site }) => {
				const isLoaned = site.isLeased && site.type === "Outbound";
				if (!isLoaned && next[site.siteid] === undefined) {
					next[site.siteid] = true;
					updated = true;
				}
			});
			return updated ? next : prev;
		});
	}, [processedSites]);

	const availableTenants = useMemo(() => {
		const tenantsMap = new Map<string, string>();
		processedSites.forEach(({ site }) => {
			const rawTenant = getCleanPartnerName(site);
			if (
				rawTenant &&
				typeof rawTenant === "string" &&
				rawTenant !== "Partner"
			) {
				const trimmed = rawTenant.trim();
				const normalizedKey = trimmed.toLowerCase();
				if (!tenantsMap.has(normalizedKey)) {
					tenantsMap.set(normalizedKey, trimmed);
				}
			}
		});
		return Array.from(tenantsMap.values()).sort((a, b) => a.localeCompare(b));
	}, [processedSites, getCleanPartnerName]);

	// --- FILTERED SITES ---
	const filteredSites = useMemo(() => {
		return processedSites.filter(({ site }) => {
			const siteName = site.planet_name || "";
			const matchesSearch = siteName
				.toLowerCase()
				.includes(searchTerm.toLowerCase());

			let matchesLease = true;
			if (leaseFilter === "owned") matchesLease = !site.isLeased;
			else if (leaseFilter === "leased")
				matchesLease = site.isLeased && site.type === "Inbound";
			else if (leaseFilter === "loaned")
				matchesLease = site.isLeased && site.type === "Outbound";

			let matchesTenant = true;
			if (selectedTenants.length > 0) {
				const siteTenant = getCleanPartnerName(site).toLowerCase();
				matchesTenant = selectedTenants.some(
					(t) => t.trim().toLowerCase() === siteTenant,
				);
			}

			return matchesSearch && matchesLease && matchesTenant;
		});
	}, [
		processedSites,
		searchTerm,
		leaseFilter,
		selectedTenants,
		getCleanPartnerName,
	]);

	const ownSites = useMemo(() => {
		if (groupLoanedMode === "owned") {
			return filteredSites.filter(
				({ site }) => !site.isLeased || site.type === "Outbound",
			);
		}
		return filteredSites.filter(({ site }) => !site.isLeased);
	}, [filteredSites, groupLoanedMode]);

	const leasedSites = useMemo(() => {
		const groupsMap = new Map<
			string,
			{ display: string; items: SiteWithFlows[] }
		>();
		filteredSites.forEach((item) => {
			const isOutbound = item.site.type === "Outbound";
			const isInbound =
				item.site.type === "Inbound" || (item.site.isLeased && !isOutbound);

			const shouldGroup =
				groupLoanedMode === "user" ? isInbound || isOutbound : isInbound;

			if (shouldGroup) {
				const partnerDisplay = getCleanPartnerName(item.site);
				const partnerKey = partnerDisplay.trim().toLowerCase();

				if (!groupsMap.has(partnerKey)) {
					groupsMap.set(partnerKey, { display: partnerDisplay, items: [] });
				} else {
					const existing = groupsMap.get(partnerKey)!;
					if (
						partnerDisplay !== partnerDisplay.toLowerCase() &&
						existing.display === existing.display.toLowerCase()
					) {
						existing.display = partnerDisplay;
					}
				}
				groupsMap.get(partnerKey)!.items.push(item);
			}
		});

		const result: Record<string, SiteWithFlows[]> = {};
		groupsMap.forEach(({ display, items }) => {
			result[display] = items;
		});
		return result;
	}, [filteredSites, groupLoanedMode, getCleanPartnerName]);

	const globalSummary = useMemo<
		[string, { prod: number; cons: number; net: number }][]
	>(() => {
		const flows: Record<string, { prod: number; cons: number; net: number }> =
			{};

		processedSites.forEach(({ site, richFlows }) => {
			if (selectedSummarySites[site.siteid]) {
				Object.entries(richFlows).forEach(([ticker, data]) => {
					if (!flows[ticker]) {
						flows[ticker] = { prod: 0, cons: 0, net: 0 };
					}
					if (data.flow > 0) {
						flows[ticker].prod += data.flow;
					} else if (data.flow < 0) {
						flows[ticker].cons += Math.abs(data.flow);
					}
					flows[ticker].net += data.flow;
				});
			}
		});

		return Object.entries(flows).sort(([a], [b]) => a.localeCompare(b));
	}, [processedSites, selectedSummarySites]);

	const handleTargetChange = useCallback((siteId: string, val: string) => {
		const num = parseFloat(val);
		if (isNaN(num)) return;

		setSiteTargets((prev) => {
			const next = { ...prev, [siteId]: num };
			try {
				localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
			} catch {}
			return next;
		});
	}, []);

	const handleSelectSite = useCallback(
		(siteId: string) => {
			const found = processedSites.find(
				(s) => s.site.siteid === siteId || s.siteid === siteId,
			);
			if (found) setSelectedSite(found);
		},
		[processedSites],
	);

	return {
		searchTerm,
		setSearchTerm,
		selectedSite,
		setSelectedSite,
		siteTargets,
		handleTargetChange,
		summaryOpen,
		setSummaryOpen,
		groupLoanedMode,
		setGroupLoanedMode,
		leaseFilter,
		setLeaseFilter,
		selectedTenants,
		setSelectedTenants,
		selectedSummarySites,
		setSelectedSummarySites,
		availableTenants,
		filteredSites,
		ownSites,
		leasedSites,
		globalSummary,
		handleSelectSite,
		processedSites,
		loading,
		DEFAULT_DAYS,
	};
};
