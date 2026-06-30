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

	// --- FILTER STATE ---
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

			const siteStorage = storageUnits.find((u) => u.addressableid === siteId);
			const siteOwner = siteStorage?.owner;

			const matchingUnits = storageUnits.filter((u) => {
				const isSiteStorage = u.addressableid === siteId;
				const isOwnerWarehouse =
					u.storageplanetid === site.planetid &&
					(u.type === "WAREHOUSE" || u.type === "WAREHOUSE_STORE") &&
					u.owner === siteOwner;

				return isSiteStorage || isOwnerWarehouse;
			});

			let finalStorageItems: any[];

			if (matchingUnits.length > 0) {
				const aggregatedItems = new Map<string, any>();
				matchingUnits.forEach((u) => {
					const displayType =
						u.type === "WAREHOUSE_STORE" ? "warehouse" : "site";
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
		const partners = new Set<string>();
		processedSites.forEach((s) => {
			if (s.site.partner) partners.add(s.site.partner);
		});
		return Array.from(partners).sort();
	}, [processedSites]);

	const globalSummary = useMemo(() => {
		const summary: Record<string, { prod: number; cons: number; net: number }> =
			{};
		processedSites.forEach(({ site, richFlows }) => {
			const isLoaned = site.isLeased && site.type === "Outbound";
			if (!isLoaned && selectedSummarySites[site.siteid]) {
				Object.values(richFlows).forEach((f) => {
					if (!summary[f.ticker])
						summary[f.ticker] = { prod: 0, cons: 0, net: 0 };
					if (f.flow > 0) summary[f.ticker].prod += f.flow;
					else summary[f.ticker].cons += f.flow;
					summary[f.ticker].net += f.flow;
				});
			}
		});
		return Object.entries(summary)
			.filter(([_, s]) => Math.abs(s.net) > 0.1)
			.sort((a, b) => a[1].net - b[1].net);
	}, [processedSites, selectedSummarySites]);

	const filteredSites = useMemo(() => {
		let result = processedSites;

		if (leaseFilter === "owned") {
			result = result.filter((s) => !s.site.isLeased);
		} else if (leaseFilter === "leased") {
			result = result.filter(
				(s) => s.site.isLeased && s.site.type === "Inbound",
			);
			if (selectedTenants.length > 0) {
				result = result.filter(
					(s) => s.site.partner && selectedTenants.includes(s.site.partner),
				);
			}
		} else if (leaseFilter === "loaned") {
			result = result.filter(
				(s) => s.site.isLeased && s.site.type === "Outbound",
			);
			if (selectedTenants.length > 0) {
				result = result.filter(
					(s) => s.site.partner && selectedTenants.includes(s.site.partner),
				);
			}
		}

		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			result = result.filter(
				({ site }) =>
					site.planet_name.toLowerCase().includes(term) ||
					(site.partner && site.partner.toLowerCase().includes(term)),
			);
		}

		return result;
	}, [processedSites, searchTerm, leaseFilter, selectedTenants]);

	const ownSites = useMemo(
		() =>
			filteredSites
				.filter(({ site }) => !site.isLeased)
				.sort((a, b) => {
					const aFlows = Object.values(a.richFlows).filter(
						(f) => f.flow !== 0,
					).length;
					const aStorage = a.site.storage_items?.length || 0;
					const aSize = Math.max(aFlows, aStorage);

					const bFlows = Object.values(b.richFlows).filter(
						(f) => f.flow !== 0,
					).length;
					const bStorage = b.site.storage_items?.length || 0;
					const bSize = Math.max(bFlows, bStorage);

					return bSize - aSize;
				}),
		[filteredSites],
	);

	const leasedSites = useMemo(() => {
		const sortedLeased = filteredSites
			.filter(({ site }) => site.isLeased && !!site.partner)
			.sort((a, b) => {
				const aFlows = Object.values(a.richFlows).filter(
					(f) => f.flow !== 0,
				).length;
				const aStorage = a.site.storage_items?.length || 0;
				const aSize = Math.max(aFlows, aStorage);

				const bFlows = Object.values(b.richFlows).filter(
					(f) => f.flow !== 0,
				).length;
				const bStorage = b.site.storage_items?.length || 0;
				const bSize = Math.max(bFlows, bStorage);

				return bSize - aSize;
			});

		return sortedLeased.reduce(
			(acc, s) => {
				const partner = s.site.partner || "Unknown";
				const leaseType = s.site.type || "Unknown";
				const compoundKey = `${leaseType} - ${partner}`;

				if (!acc[compoundKey]) {
					acc[compoundKey] = [];
				}
				acc[compoundKey].push(s);
				return acc;
			},
			{} as Record<string, typeof filteredSites>,
		);
	}, [filteredSites]);

	const handleTargetChange = useCallback((siteId: string, val: string) => {
		const num = parseInt(val, 10);
		if (!isNaN(num) && num >= 0) {
			setSiteTargets((prev) => {
				const next = { ...prev, [siteId]: num };
				localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
				return next;
			});
		}
	}, []);

	const handleSelectSite = useCallback(
		(siteId: string) => {
			setSelectedSite(
				processedSites.find(({ site }) => site.siteid === siteId) || null,
			);
		},
		[processedSites],
	);

	return {
		loading,
		filteredSites,
		ownSites,
		leasedSites,
		processedSites,
		globalSummary,
		availableTenants,
		searchTerm,
		setSearchTerm,
		selectedSite,
		setSelectedSite,
		siteTargets,
		handleTargetChange,
		summaryOpen,
		setSummaryOpen,
		leaseFilter,
		setLeaseFilter,
		selectedTenants,
		setSelectedTenants,
		selectedSummarySites,
		setSelectedSummarySites,
		handleSelectSite,
	};
};
