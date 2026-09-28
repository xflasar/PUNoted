import { useMemo } from "react";
import { useGlobalData } from "../../../context/globaldatacontext";
import { CurrencyData } from "../types/finances";
import type { ShipData } from "../../../components/common/starmap/types/maptypes";

export interface SubStorageUnit {
	id: string;
	name: string;
	type: string;
	totalValue: number;
	itemCount: number;
	items: Array<{
		ticker: string;
		amount: number;
		unitPrice: number;
		corpPrice: number;
		totalValue: number;
	}>;
}

export interface SiteGroup {
	id: string;
	siteId: string;
	ownerName: string;
	amOwner?: boolean;
	leaseType?: string;
	leasedTo?: string;
	leasedFrom?: string;
	categoryType?: string;
	isLeased: boolean;
	totalValue: number;
	buildingAssetValue: number;
	buildingBomItems?: Array<{
		ticker: string;
		amount: number;
		unitPrice: number;
		corpPrice: number;
		totalValue: number;
	}>;
	dailyRepairCost: number;
	subUnits: SubStorageUnit[];
	items: Array<{
		ticker: string;
		amount: number;
		unitPrice: number;
		corpPrice: number;
		totalValue: number;
	}>;
}

export interface LocationValuation {
	id: string;
	name: string;
	type: "BASE" | "WAREHOUSE" | "SHIP";
	totalValue: number;
	buildingAssetValue: number;
	dailyRepairCost: number;
	itemCount: number;
	sites: SiteGroup[];
	subUnits: SubStorageUnit[];
	items: Array<{
		ticker: string;
		amount: number;
		unitPrice: number;
		corpPrice: number;
		totalValue: number;
	}>;
}

const CURRENCY_TO_CX_CODES: Record<string, string[]> = {
	ICA: ["IC1"],
	AIC: ["AI1"],
	CIS: ["CI1", "CI2"],
	NCC: ["NC1", "NC2"],
	ECD: ["EC1"],
};

export type PriceMode = "ACTUAL" | "7D_AVG" | "30D_AVG";
export type PriceSource = "MARKET" | "CORP" | "CUSTOM";

const getMaterialUnitPrice = (
	ticker: string,
	marketData: any,
	corpPrices: Record<string, number> = {},
	customPrices: Record<string, number> = {},
	currencyCode: string = "ICA",
	priceMode: PriceMode = "ACTUAL",
	priceSource: PriceSource = "MARKET",
): {
	unitPrice: number;
	corpPrice: number;
	customPrice: number;
	activeValuationPrice: number;
} => {
	const cPrice = corpPrices[ticker] || corpPrices[ticker?.toUpperCase()] || 0;
	const custPrice =
		customPrices[ticker] || customPrices[ticker?.toUpperCase()] || 0;

	if (!ticker || !marketData) {
		let actPrice = 0;
		if (priceSource === "CORP" && cPrice > 0) actPrice = cPrice;
		else if (priceSource === "CUSTOM" && custPrice > 0) actPrice = custPrice;
		return {
			unitPrice: 0,
			corpPrice: cPrice,
			customPrice: custPrice,
			activeValuationPrice: actPrice,
		};
	}

	const possibleCxCodes = CURRENCY_TO_CX_CODES[currencyCode] || [
		currencyCode,
		"IC1",
	];
	let found: any = null;

	if (Array.isArray(marketData)) {
		found = marketData.find((m: any) => {
			const t =
				m.Ticker || m.ticker || m.MaterialTicker || m.material_ticker || "";
			if (t === ticker) return true;
			return possibleCxCodes.some(
				(code) => t === `${ticker}.${code}` || t.endsWith(`.${code}`),
			);
		});
	} else if (typeof marketData === "object") {
		found =
			marketData[ticker] ||
			Object.values(marketData).find((m: any) => {
				const t =
					m?.Ticker ||
					m?.ticker ||
					m?.MaterialTicker ||
					m?.material_ticker ||
					"";
				if (t === ticker) return true;
				return possibleCxCodes.some(
					(code) => t === `${ticker}.${code}` || t.endsWith(`.${code}`),
				);
			});
	}

	const foundCorpPrice =
		cPrice || found?.corp_price || found?.CorpPrice || found?.price || 0;
	let mktPrice = 0;

	if (found) {
		for (const code of possibleCxCodes) {
			if (priceMode === "7D_AVG") {
				const p =
					found[`${code}-7DAverage`] ||
					found[`${code}-7dAvg`] ||
					found[`${code}-7DAskPrice`] ||
					found.avg7d ||
					found.PriceAverage7d ||
					found.price_7d_avg ||
					found[`${code}-Average`] ||
					found[`${code}-AskPrice`];
				if (p && p > 0) {
					mktPrice = Number(p);
					break;
				}
			} else if (priceMode === "30D_AVG") {
				const p =
					found[`${code}-30DAverage`] ||
					found[`${code}-30dAvg`] ||
					found[`${code}-30DAskPrice`] ||
					found.avg30d ||
					found.PriceAverage30d ||
					found.price_30d_avg ||
					found[`${code}-Average`] ||
					found[`${code}-AskPrice`];
				if (p && p > 0) {
					mktPrice = Number(p);
					break;
				}
			} else {
				const p =
					found[`${code}-Average`] ||
					found[`${code}-AskPrice`] ||
					found[`${code}-BidPrice`] ||
					found.PriceAverage ||
					found.priceaverage ||
					found.price;
				if (p && p > 0) {
					mktPrice = Number(p);
					break;
				}
			}
		}

		if (!mktPrice) {
			mktPrice =
				found["IC1-Average"] ||
				found["IC1-AskPrice"] ||
				found.PriceAverage ||
				found.priceaverage ||
				found.price ||
				0;
		}
	}

	let activeValuationPrice = mktPrice;
	if (priceSource === "CORP" && foundCorpPrice > 0) {
		activeValuationPrice = foundCorpPrice;
	} else if (priceSource === "CUSTOM" && custPrice > 0) {
		activeValuationPrice = custPrice;
	}

	return {
		unitPrice: mktPrice,
		corpPrice: foundCorpPrice,
		customPrice: custPrice,
		activeValuationPrice,
	};
};

export const useFinancialCalculations = (
	currentData: CurrencyData | null,
	priceMode: PriceMode = "ACTUAL",
	priceSource: PriceSource = "MARKET",
) => {
	const {
		storageState,
		marketData,
		corpPrices,
		customPrices,
		workforceData,
		shipBlueprints,
		userSites,
		productionData,
		allShips,
		ownerShips: ownShips,
		otherShips,
	} = useGlobalData();
	console.log(shipBlueprints);

	// Process storage units grouped by Planet/Location -> Site Owner -> Sub Storage
	const locationValuations = useMemo(() => {
		let rawStorages: any[] = [];
		if (storageState?.units) {
			rawStorages = Array.isArray(storageState.units)
				? storageState.units
				: Object.values(storageState.units);
		} else if (Array.isArray(storageState)) {
			rawStorages = storageState;
		} else {
			rawStorages =
				(currentData as any)?.Locations ||
				(currentData as any)?.Storage ||
				(currentData as any)?.Storages ||
				[];
		}

		const cxCode = currentData?.Currency || "ICA";

		// --- 1. BUILD SITES DICTIONARY & SHIPS LIST ---
		const siteObjectsMap = new Map<
			string,
			{
				siteId: string;
				planetName: string;
				ownerName: string;
				amOwner?: boolean;
				leaseType?: string;
				leasedTo?: string;
				leasedFrom?: string;
				isLeased: boolean;
				buildingTickers: string[];
				buildingMaterials?: Record<string, number>;
				subUnitsMap: Map<
					string,
					{
						id: string;
						name: string;
						type: string;
						items: Array<{
							ticker: string;
							amount: number;
							unitPrice: number;
							corpPrice: number;
							totalValue: number;
						}>;
						totalValue: number;
					}
				>;
			}
		>();

		const shipObjectsMap = new Map<
			string,
			{
				shipId: string;
				name: string;
				ownerName: string;
				blueprintId?: string;
				shipData: ShipData;
				subUnitsMap: Map<
					string,
					{
						id: string;
						name: string;
						type: string;
						items: Array<{
							ticker: string;
							amount: number;
							unitPrice: number;
							corpPrice: number;
							totalValue: number;
						}>;
						totalValue: number;
					}
				>;
			}
		>();

		// Pre-initialize Sites from userSites list (or productionData fallback if userSites is settling)
		const effectiveSites =
			Array.isArray(userSites) && userSites.length > 0
				? userSites
				: Object.values(productionData || {});

		if (Array.isArray(effectiveSites)) {
			effectiveSites.forEach((site: any) => {
				const siteId = site.site_id || site.siteid || site.id || "DEFAULT_SITE";
				const ownerName = (
					site.owner_name ||
					site.owner_company_code ||
					site.owner ||
					"ME"
				).toUpperCase();
				const companyCode = (
					site.owner_company_code ||
					site.company_code ||
					""
				).toUpperCase();
				const planetName =
					site.planet_name || site.planetname || site.name || "Site Location";

				siteObjectsMap.set(siteId, {
					siteId,
					planetName,
					ownerName,
					companyCode,
					amOwner: site.am_owner !== false,
					leaseType: site.lease_type || (site.is_leased ? "Inbound" : "owned"),
					leasedTo: site.leased_to,
					leasedFrom: site.leased_from,
					isLeased: !!site.is_leased,
					buildingTickers: Array.isArray(site.site_building_tickers)
						? site.site_building_tickers
						: Array.isArray(site.buildings)
							? site.buildings
							: [],
					buildingMaterials:
						site.site_building_materials &&
						typeof site.site_building_materials === "object"
							? site.site_building_materials
							: {},
					subUnitsMap: new Map(),
				});
			});
		}

		// Pre-initialize shipObjectsMap strictly from ownShips list (only user-owned fleet vessels)
		const registeredShips = ownShips || [];

		registeredShips.forEach((s: ShipData) => {
			const sId = s.id;
			if (!sId || shipObjectsMap.has(sId)) return;

			const sName = s.name || s.registration;
			const ownerName = s.company_code || s.ownerName || "UNKNOWN";
			const extractedBpId = s.blueprint_natural_id;

			shipObjectsMap.set(sId, {
				shipId: sId,
				name: sName,
				ownerName,
				blueprintId: extractedBpId,
				shipData: s,
				subUnitsMap: new Map(),
			});
		});

		// Link Storage Units (Planetary Vaults, Warehouses, Ships) to Sites or Ships
		rawStorages.forEach((unit: any) => {
			const uType = (unit.type || "").toUpperCase();
			const isShipStore = uType.includes("SHIP") || uType.includes("FUEL");

			if (isShipStore) {
				console.log("Unit: ", unit);
				const shipName = unit.name || "UNKNOWN";
				console.log(registeredShips);
				const matchedShipFromAll = (registeredShips || []).find(
					(s: ShipData) => s.shipid === unit.addressableid,
				);

				console.log("matchedShipFromAll", matchedShipFromAll);

				const shipId = matchedShipFromAll?.shipid;
				if (!shipId) {
					console.warn("Ship not found for unit: ", unit);
					return;
				}
				const ownerName = (
					matchedShipFromAll?.display_name || "UNKNOWN"
				).toUpperCase();

				if (!shipObjectsMap.has(shipId!)) {
					const extractedBpId = matchedShipFromAll?.blueprintnaturalid;

					const userCode = (
						localStorage.getItem("companyCode") ||
						localStorage.getItem("username") ||
						""
					).toUpperCase();
					const isUserOwned =
						matchedShipFromAll?.is_owner !== undefined
							? !!matchedShipFromAll.is_owner
							: unit.am_owner !== false &&
								(!matchedShipFromAll?.company_code ||
									matchedShipFromAll?.company_code.toUpperCase() === userCode);

					shipObjectsMap.set(shipId, {
						shipId,
						name: matchedShipFromAll?.name || shipName,
						ownerName,
						isUserOwned,
						blueprintId: extractedBpId,
						shipData: matchedShipFromAll,
						subUnitsMap: new Map(),
					});
				}

				const ship = shipObjectsMap.get(shipId)!;
				const subName = uType.includes("STL")
					? "STL Fuel Tank"
					: uType.includes("FTL")
						? "FTL Fuel Tank"
						: "Ship Cargo Hold";
				const subKey =
					unit.storageid ||
					unit.unitid ||
					unitStoreId ||
					`${subName}_${unit.id || "default"}`;

				if (!ship.subUnitsMap.has(subKey)) {
					ship.subUnitsMap.set(subKey, {
						id: subKey,
						name: subName,
						type: uType,
						items: [],
						totalValue: 0,
					});
				}

				const subUnit = ship.subUnitsMap.get(subKey)!;
				const rawItems = unit.items || unit.storage_items || [];

				rawItems.forEach((item: any) => {
					const ticker =
						item.name || item.ticker || item.material_ticker || item.materialid;
					const amount = item.quantity ?? item.amount ?? 0;
					if (!ticker || amount <= 0) return;

					const { corpPrice, activeValuationPrice } = getMaterialUnitPrice(
						ticker,
						marketData,
						corpPrices,
						customPrices,
						cxCode,
						priceMode,
						priceSource,
					);
					const itemVal = amount * activeValuationPrice;

					subUnit.items.push({
						ticker,
						amount,
						unitPrice: activeValuationPrice,
						corpPrice,
						totalValue: itemVal,
					});
					subUnit.totalValue += itemVal;
				});
				subUnit.items.sort((a, b) => b.totalValue - a.totalValue);
			} else {
				// Planetary Site Storage or Station Warehouse
				const rawSiteId = unit.site_id || unit.siteid;
				const planetName =
					unit.storagelocation ||
					unit.planetname ||
					unit.planet_name ||
					unit.name ||
					"Site Location";
				const ownerName = (unit.owner_code || unit.owner || "ME").toUpperCase();

				let siteId = rawSiteId;

				// Link to an existing site on the same planet AND same owner if siteId is unassigned
				if (!siteId || !siteObjectsMap.has(siteId)) {
					const normPlanet = planetName.trim().toUpperCase();
					const normOwner = ownerName.trim().toUpperCase();

					const samePlanetOwnerSite = Array.from(siteObjectsMap.values()).find(
						(s) => {
							const sPlanet = (s.planetName || "").trim().toUpperCase();
							const sOwner = (s.ownerName || "").trim().toUpperCase();
							const sCode = ((s as any).companyCode || "").trim().toUpperCase();

							const matchPlanet =
								sPlanet &&
								normPlanet &&
								(sPlanet === normPlanet ||
									normPlanet.includes(sPlanet) ||
									sPlanet.includes(normPlanet));
							const matchOwner =
								normOwner &&
								(sOwner === normOwner ||
									sCode === normOwner ||
									(s.companyCode && s.companyCode === normOwner));
							return matchPlanet && matchOwner;
						},
					);

					if (samePlanetOwnerSite) {
						siteId = samePlanetOwnerSite.siteId;
					} else {
						siteId =
							rawSiteId ||
							unit.addressableid ||
							`SITE_${normPlanet.replace(/\s+/g, "_")}_${normOwner.replace(/\s+/g, "_")}`;
					}
				}

				if (!siteObjectsMap.has(siteId)) {
					siteObjectsMap.set(siteId, {
						siteId,
						planetName,
						ownerName,
						amOwner: unit.am_owner !== false,
						leaseType:
							unit.lease_type || (unit.is_leased ? "Inbound" : "owned"),
						leasedTo: unit.leased_to,
						leasedFrom: unit.leased_from,
						categoryType: unit.type || unit.categoryType,
						isLeased: !!(unit.is_leased || unit.isLeased),
						buildingTickers: unit.site_building_tickers || unit.buildings || [],
						buildingMaterials: unit.site_building_materials || {},
						subUnitsMap: new Map(),
					});
				}

				const site = siteObjectsMap.get(siteId)!;
				const isWarehouse =
					uType.includes("WAREHOUSE") || site.categoryType === "WAREHOUSE";
				const rawName =
					unit.name && unit.name !== "null" && unit.name !== "undefined"
						? String(unit.name).trim()
						: null;

				const isLocationName =
					rawName &&
					(rawName.toUpperCase() === (planetName || "").toUpperCase() ||
						rawName.toUpperCase() ===
							(unit.storagelocation || "").toUpperCase() ||
						rawName.toUpperCase() === (site.planetName || "").toUpperCase());

				let subName = rawName && !isLocationName ? rawName : "";
				if (!subName) {
					if (
						uType.includes("WAREHOUSE") ||
						site.categoryType === "WAREHOUSE"
					) {
						subName = "Warehouse Storage";
					} else if (uType.includes("STORE") || uType.includes("BASE")) {
						subName = "Base Storage";
					} else if (uType.includes("SHIP")) {
						subName = "Ship Cargo Hold";
					} else {
						subName = "Site Storage";
					}
				}

				const subKey =
					unit.storageid || unit.unitid || `${subName}_${Math.random()}`;

				if (!site.subUnitsMap.has(subKey)) {
					site.subUnitsMap.set(subKey, {
						id: subKey,
						name: subName,
						type: uType,
						items: [],
						totalValue: 0,
					});
				}

				const subUnit = site.subUnitsMap.get(subKey)!;
				const rawItems = unit.items || unit.storage_items || [];

				rawItems.forEach((item: any) => {
					const ticker =
						item.name || item.ticker || item.material_ticker || item.materialid;
					const amount = item.quantity ?? item.amount ?? 0;
					if (!ticker || amount <= 0) return;

					const { corpPrice, activeValuationPrice } = getMaterialUnitPrice(
						ticker,
						marketData,
						corpPrices,
						customPrices,
						cxCode,
						priceMode,
						priceSource,
					);
					const itemVal = amount * activeValuationPrice;

					subUnit.items.push({
						ticker,
						amount,
						unitPrice: activeValuationPrice,
						corpPrice,
						totalValue: itemVal,
					});
					subUnit.totalValue += itemVal;
				});
				subUnit.items.sort((a, b) => b.totalValue - a.totalValue);
			}
		});

		// --- 2. GROUP SITES BY PLANET (LOCATION DICTIONARY) ---
		const planetDictionary = new Map<string, SiteGroup[]>();

		siteObjectsMap.forEach((site) => {
			let siteTotalValue = 0;
			let siteBuildingAssetValue = 0;
			const siteSubUnits: SubStorageUnit[] = [];
			const siteItemsMap = new Map<
				string,
				{
					ticker: string;
					amount: number;
					unitPrice: number;
					corpPrice: number;
					totalValue: number;
				}
			>();
			const buildingBomItemsMap = new Map<
				string,
				{
					ticker: string;
					amount: number;
					unitPrice: number;
					corpPrice: number;
					totalValue: number;
				}
			>();

			// Calculate Building BOM & Repair Costs
			if (
				site.buildingMaterials &&
				Object.keys(site.buildingMaterials).length > 0
			) {
				let bCost = 0;
				Object.entries(site.buildingMaterials).forEach(([matTicker, qty]) => {
					const { activeValuationPrice, corpPrice } = getMaterialUnitPrice(
						matTicker,
						marketData,
						corpPrices,
						customPrices,
						cxCode,
						priceMode,
						priceSource,
					);
					const tot = qty * activeValuationPrice;
					bCost += tot;

					const existing = buildingBomItemsMap.get(matTicker) || {
						ticker: matTicker,
						amount: 0,
						unitPrice: activeValuationPrice,
						corpPrice,
						totalValue: 0,
					};
					existing.amount += qty;
					existing.totalValue += tot;
					buildingBomItemsMap.set(matTicker, existing);
				});
				siteBuildingAssetValue += bCost;
			} else {
				(site.buildingTickers || []).forEach((bTicker) => {
					const upperTicker = bTicker.toUpperCase();
					const matchedBp = Array.isArray(shipBlueprints)
						? shipBlueprints.find(
								(bp: any) =>
									bp.natural_id.toUpperCase() === upperTicker ||
									(bp.name || "").toUpperCase() === upperTicker,
							)
						: null;

					let bom: Record<string, number> = {};
					if (matchedBp?.bill_of_material) {
						if (Array.isArray(matchedBp.bill_of_material)) {
							matchedBp.bill_of_material.forEach((bItem: any) => {
								const t =
									bItem.ticker ||
									bItem.material_ticker ||
									bItem.materialid ||
									bItem.name;
								const q = Number(
									bItem.amount || bItem.quantity || bItem.units || 0,
								);
								if (t && q > 0) bom[t.toUpperCase()] = q;
							});
						} else if (typeof matchedBp.bill_of_material === "object") {
							Object.entries(matchedBp.bill_of_material).forEach(
								([k, v]: [string, any]) => {
									const q =
										typeof v === "number"
											? v
											: Number(v?.amount || v?.quantity || 0);
									if (q > 0) bom[k.toUpperCase()] = q;
								},
							);
						}
					}

					let bCost = 0;
					Object.entries(bom).forEach(([matTicker, qty]) => {
						const { activeValuationPrice, corpPrice } = getMaterialUnitPrice(
							matTicker,
							marketData,
							corpPrices,
							customPrices,
							cxCode,
							priceMode,
							priceSource,
						);
						const tot = qty * activeValuationPrice;
						bCost += tot;

						const existing = buildingBomItemsMap.get(matTicker) || {
							ticker: matTicker,
							amount: 0,
							unitPrice: activeValuationPrice,
							corpPrice,
							totalValue: 0,
						};
						existing.amount += qty;
						existing.totalValue += tot;
						buildingBomItemsMap.set(matTicker, existing);
					});
					siteBuildingAssetValue += bCost;
				});
			}

			const siteDailyRepairCost = siteBuildingAssetValue * 0.00166;

			const subNameCounts = new Map<string, number>();
			site.subUnitsMap.forEach((sub) => {
				subNameCounts.set(sub.name, (subNameCounts.get(sub.name) || 0) + 1);
			});
			const subNameIndex = new Map<string, number>();

			site.subUnitsMap.forEach((sub) => {
				let displayName = sub.name;
				if ((subNameCounts.get(sub.name) || 0) > 1) {
					const idx = (subNameIndex.get(sub.name) || 0) + 1;
					subNameIndex.set(sub.name, idx);
					displayName = `${sub.name} #${idx}`;
				}

				siteSubUnits.push({
					id: sub.id,
					name: displayName,
					type: sub.type,
					totalValue: sub.totalValue,
					itemCount: sub.items.length,
					items: sub.items,
				});
				siteTotalValue += sub.totalValue;

				sub.items.forEach((it) => {
					const existing = siteItemsMap.get(it.ticker) || {
						ticker: it.ticker,
						amount: 0,
						unitPrice: it.unitPrice,
						corpPrice: it.corpPrice,
						totalValue: 0,
					};
					existing.amount += it.amount;
					existing.totalValue += it.totalValue;
					siteItemsMap.set(it.ticker, existing);
				});
			});

			// ponytail: Include structure building BOM asset value in total site valuation
			siteTotalValue += siteBuildingAssetValue;

			const compiledSite: SiteGroup = {
				id: site.siteId,
				siteId: site.siteId,
				ownerName: site.ownerName,
				amOwner: site.amOwner !== false,
				leaseType: site.leaseType || (site.isLeased ? "Inbound" : "owned"),
				leasedTo: site.leasedTo || null,
				leasedFrom: site.leasedFrom || null,
				categoryType: site.categoryType,
				isLeased: !!site.isLeased,
				totalValue: siteTotalValue,
				buildingAssetValue: siteBuildingAssetValue,
				buildingBomItems: Array.from(buildingBomItemsMap.values()).sort(
					(a, b) => b.totalValue - a.totalValue,
				),
				dailyRepairCost: siteDailyRepairCost,
				subUnits: siteSubUnits,
				items: Array.from(siteItemsMap.values()).sort(
					(a, b) => b.totalValue - a.totalValue,
				),
			};

			const pName = site.planetName;
			if (!planetDictionary.has(pName)) {
				planetDictionary.set(pName, []);
			}
			planetDictionary.get(pName)!.push(compiledSite);
		});

		// --- 3. ASSEMBLE LOCATION VALUATIONS FOR PLANETS ---
		const valuations: LocationValuation[] = [];

		planetDictionary.forEach((sites, planetName) => {
			let planetTotalValue = 0;
			let planetBuildingAssetValue = 0;
			let planetDailyRepairCost = 0;
			const planetAllSubUnits: SubStorageUnit[] = [];
			const planetAllItemsMap = new Map<
				string,
				{
					ticker: string;
					amount: number;
					unitPrice: number;
					corpPrice: number;
					totalValue: number;
				}
			>();

			sites.forEach((site) => {
				planetTotalValue += site.totalValue;
				planetBuildingAssetValue += site.buildingAssetValue;
				planetDailyRepairCost += site.dailyRepairCost;

				site.subUnits.forEach((sub) => planetAllSubUnits.push(sub));
				site.items.forEach((it) => {
					const existing = planetAllItemsMap.get(it.ticker) || {
						ticker: it.ticker,
						amount: 0,
						unitPrice: it.unitPrice,
						corpPrice: it.corpPrice,
						totalValue: 0,
					};
					existing.amount += it.amount;
					existing.totalValue += it.totalValue;
					planetAllItemsMap.set(it.ticker, existing);
				});
			});

			const flattenedItems = Array.from(planetAllItemsMap.values()).sort(
				(a, b) => b.totalValue - a.totalValue,
			);

			valuations.push({
				id: `PLANET_${planetName}`,
				name: planetName,
				type: "BASE",
				totalValue: planetTotalValue,
				buildingAssetValue: planetBuildingAssetValue,
				dailyRepairCost: planetDailyRepairCost,
				itemCount: flattenedItems.length,
				sites,
				subUnits: planetAllSubUnits,
				items: flattenedItems,
			});
		});

		// --- 4. ASSEMBLE LOCATION VALUATIONS FOR SHIPS ---
		shipObjectsMap.forEach((ship) => {
			let shipTotalValue = 0;
			let shipHullAssetValue = 0;
			const shipSubUnits: SubStorageUnit[] = [];
			const shipItemsMap = new Map<
				string,
				{
					ticker: string;
					amount: number;
					unitPrice: number;
					corpPrice: number;
					totalValue: number;
				}
			>();
			const shipBomItemsMap = new Map<
				string,
				{
					ticker: string;
					amount: number;
					unitPrice: number;
					corpPrice: number;
					totalValue: number;
				}
			>();

			// Match blueprint for ship chassis
			const shipNameUpper = ship.name.toUpperCase();
			const shipDataObj = ship.shipData || {};

			// Match blueprint strictly by blueprintnaturalid
			console.log("shipDataObj: ", shipDataObj);
			console.log("ship: ", ship);
			let targetBpId = null;
			if (shipDataObj.blueprintnaturalid) {
				targetBpId = shipDataObj.blueprintnaturalid.toUpperCase();
			}

			const directBp =
				shipDataObj.blueprint ||
				shipDataObj.ship_blueprint ||
				shipDataObj.blueprint_data;

			const matchedShipBp =
				directBp ||
				(targetBpId && Array.isArray(shipBlueprints)
					? shipBlueprints.find((bp: any) => {
							const bpNatId = (
								bp.natural_id ||
								bp.naturalId ||
								bp.natural_id_blueprint ||
								bp.id ||
								""
							).toUpperCase();
							return bpNatId === targetBpId;
						})
					: null);

			let bom: Record<string, number> = {};
			const rawBomSource =
				matchedShipBp?.bill_of_material ||
				matchedShipBp?.bom ||
				matchedShipBp?.materials ||
				shipDataObj?.bill_of_material ||
				shipDataObj?.bom;

			if (rawBomSource) {
				let rawBom = rawBomSource;
				if (typeof rawBom === "string") {
					try {
						rawBom = JSON.parse(rawBom);
					} catch {}
				}
				const quantities = Array.isArray(rawBom)
					? rawBom
					: rawBom?.quantities ||
						rawBom?.building_materials ||
						rawBom?.materials ||
						[];
				if (Array.isArray(quantities)) {
					quantities.forEach((bItem: any) => {
						const t =
							bItem.material?.ticker ||
							bItem.ticker ||
							bItem.material_ticker ||
							bItem.materialid ||
							bItem.name;
						const q = Number(
							bItem.amount || bItem.quantity || bItem.units || 0,
						);
						if (t && q > 0) bom[t.toUpperCase()] = q;
					});
				} else if (typeof rawBom === "object" && rawBom !== null) {
					Object.entries(rawBom).forEach(([k, v]: [string, any]) => {
						const q =
							typeof v === "number"
								? v
								: Number(v?.amount || v?.quantity || v?.units || 0);
						if (q > 0) bom[k.toUpperCase()] = q;
					});
				}
			}

			if (
				Object.keys(bom).length === 0 &&
				targetBpId &&
				Array.isArray(shipBlueprints)
			) {
				const matchedBp = shipBlueprints.find((bp: any) => {
					const bpNatId = bp.natural_id.toUpperCase();
					return bpNatId === targetBpId;
				});

				const rawBomSource =
					matchedBp?.bill_of_material || matchedBp?.bom || matchedBp?.materials;

				if (rawBomSource) {
					let rawBom = rawBomSource;
					if (typeof rawBom === "string") {
						try {
							rawBom = JSON.parse(rawBom);
						} catch {}
					}
					const quantities = Array.isArray(rawBom)
						? rawBom
						: rawBom?.quantities ||
							rawBom?.building_materials ||
							rawBom?.materials ||
							[];
					if (Array.isArray(quantities)) {
						quantities.forEach((bItem: any) => {
							const t =
								bItem.material?.ticker ||
								bItem.ticker ||
								bItem.material_ticker ||
								bItem.materialid ||
								bItem.name;
							const q = Number(
								bItem.amount || bItem.quantity || bItem.units || 0,
							);
							if (t && q > 0) bom[t.toUpperCase()] = q;
						});
					} else if (typeof rawBom === "object" && rawBom !== null) {
						Object.entries(rawBom).forEach(([k, v]: [string, any]) => {
							const q =
								typeof v === "number"
									? v
									: Number(v?.amount || v?.quantity || v?.units || 0);
							if (q > 0) bom[k.toUpperCase()] = q;
						});
					}
				}
			}

			Object.entries(bom).forEach(([matTicker, qty]) => {
				const { activeValuationPrice, corpPrice } = getMaterialUnitPrice(
					matTicker,
					marketData,
					corpPrices,
					customPrices,
					cxCode,
					priceMode,
					priceSource,
				);
				const tot = qty * activeValuationPrice;
				shipHullAssetValue += tot;

				const existing = shipBomItemsMap.get(matTicker) || {
					ticker: matTicker,
					amount: 0,
					unitPrice: activeValuationPrice,
					corpPrice,
					totalValue: 0,
				};
				existing.amount += qty;
				existing.totalValue += tot;
				shipBomItemsMap.set(matTicker, existing);
			});

			ship.subUnitsMap.forEach((sub) => {
				shipSubUnits.push({
					id: sub.id,
					name: sub.name,
					type: sub.type,
					totalValue: sub.totalValue,
					itemCount: sub.items.length,
					items: sub.items,
				});
				shipTotalValue += sub.totalValue;

				sub.items.forEach((it) => {
					const existing = shipItemsMap.get(it.ticker) || {
						ticker: it.ticker,
						amount: 0,
						unitPrice: it.unitPrice,
						corpPrice: it.corpPrice,
						totalValue: 0,
					};
					existing.amount += it.amount;
					existing.totalValue += it.totalValue;
					shipItemsMap.set(it.ticker, existing);
				});
			});

			// ponytail: Include ship hull chassis asset value in total ship location valuation
			shipTotalValue += shipHullAssetValue;

			const compiledShipSite: SiteGroup = {
				id: ship.shipId,
				siteId: ship.shipId,
				ownerName: ship.ownerName,
				isLeased: false,
				totalValue: shipTotalValue,
				buildingAssetValue: shipHullAssetValue,
				buildingBomItems: Array.from(shipBomItemsMap.values()).sort(
					(a, b) => b.totalValue - a.totalValue,
				),
				dailyRepairCost: 0,
				subUnits: shipSubUnits,
				items: Array.from(shipItemsMap.values()).sort(
					(a, b) => b.totalValue - a.totalValue,
				),
			};

			const flattenedItems = Array.from(shipItemsMap.values()).sort(
				(a, b) => b.totalValue - a.totalValue,
			);

			valuations.push({
				id: `SHIP_${ship.shipId}`,
				name: ship.name,
				type: "SHIP",
				totalValue: shipTotalValue,
				buildingAssetValue: shipHullAssetValue,
				dailyRepairCost: 0,
				itemCount: flattenedItems.length,
				sites: [compiledShipSite],
				subUnits: shipSubUnits,
				items: flattenedItems,
			});
		});

		return valuations.sort((a, b) => {
			if (a.type !== "SHIP" && b.type === "SHIP") return -1;
			if (a.type === "SHIP" && b.type !== "SHIP") return 1;
			return b.totalValue - a.totalValue;
		});
	}, [
		storageState,
		marketData,
		corpPrices,
		customPrices,
		currentData?.Currency,
		priceMode,
		priceSource,
		userSites,
		shipBlueprints,
		productionData,
		allShips,
		ownShips,
		otherShips,
	]);

	// Daily Workforce Burn Rate calculation
	const workforceBurnRate = useMemo(() => {
		const wfGrouped = workforceData;
		if (!wfGrouped) return { dailyCost: 0, items: [] };

		let dailyCost = 0;
		const items: Array<{
			ticker: string;
			dailyAmount: number;
			dailyCost: number;
		}> = [];

		Object.values(wfGrouped).forEach((wfLevels: any) => {
			if (!Array.isArray(wfLevels)) return;
			wfLevels.forEach((level: any) => {
				const needs = level?.needs || [];
				needs.forEach((need: any) => {
					const ticker = need.ticker || need.materialid;
					const dailyAmount = need.unitsperinterval || need.daily_amount || 0;
					if (!ticker || dailyAmount <= 0) return;

					const unitPrice = getMaterialUnitPrice(
						ticker,
						marketData,
						corpPrices,
					);
					const cost = dailyAmount * unitPrice.activeValuationPrice;

					dailyCost += cost;
					const existing = items.find((i) => i.ticker === ticker);
					if (existing) {
						existing.dailyAmount += dailyAmount;
						existing.dailyCost += cost;
					} else {
						items.push({ ticker, dailyAmount, dailyCost: cost });
					}
				});
			});
		});

		items.sort((a, b) => b.dailyCost - a.dailyCost);
		return { dailyCost, items };
	}, [workforceData, marketData]);

	// Asset distribution breakdown for pie chart
	const assetDistribution = useMemo(() => {
		const liquid = currentData?.Liquid || 0;
		const cxBuyLocked = currentData?.LockedBuy || 0;
		const cxSellListings = currentData?.LockedSell || 0;

		let leasedSites: Record<string, boolean> = {};
		try {
			const saved = localStorage.getItem("financial_leased_sites");
			if (saved) leasedSites = JSON.parse(saved);
		} catch (e) {
			console.error(e);
		}

		let activeInventoryValue = 0;
		locationValuations.forEach((loc) => {
			if (!leasedSites[loc.id]) {
				activeInventoryValue += loc.totalValue;
			}
		});

		return [
			{ name: "Liquid Cash", value: liquid, color: "#4ade80" },
			{
				name: "Warehouse Stock",
				value: activeInventoryValue,
				color: "#60a5fa",
			},
			{ name: "CX Sell Orders", value: cxSellListings, color: "#c084fc" },
			{ name: "CX Buy Orders", value: cxBuyLocked, color: "#fbbf24" },
		].filter((item) => item.value > 0);
	}, [currentData, locationValuations]);

	const inventoryValuationBreakdown = useMemo(() => {
		let stationStockValue = 0;
		let siteGlobalStockValue = 0;
		let shipStockValue = 0;

		locationValuations.forEach((loc) => {
			if (loc.type === "SHIP") {
				(loc.subUnits || []).forEach((sub) => {
					shipStockValue += sub.totalValue || 0;
				});
			} else {
				(loc.subUnits || []).forEach((sub) => {
					const typeStr = `${sub.type || ""} ${sub.name || ""}`.toUpperCase();
					const isStationVault =
						typeStr.includes("WAREHOUSE") ||
						typeStr.includes("VAULT") ||
						typeStr.includes("STATION") ||
						typeStr.includes("PUBLIC");

					if (isStationVault) {
						stationStockValue += sub.totalValue || 0;
					} else {
						siteGlobalStockValue += sub.totalValue || 0;
					}
				});
			}
		});

		return {
			stationStockValue,
			siteGlobalStockValue,
			shipStockValue,
			totalStockValue:
				stationStockValue + siteGlobalStockValue + shipStockValue,
		};
	}, [locationValuations]);

	const buildingAssetBreakdown = useMemo(() => {
		let owned = 0;
		let leased = 0;
		let loaned = 0;

		let leasedSites: Record<string, boolean> = {};
		try {
			const saved = localStorage.getItem("financial_leased_sites");
			if (saved) leasedSites = JSON.parse(saved);
		} catch (e) {
			console.error(e);
		}

		locationValuations.forEach((loc) => {
			if (loc.type === "SHIP") return; // Skip ships from Building Assets

			(loc.sites || []).forEach((site) => {
				const isUserToggledLeased = !!leasedSites[site.id];
				const isOutboundLeased = site.leaseType === "Outbound";
				const isInboundLeased =
					site.leaseType === "Inbound" || (!site.amOwner && site.isLeased);

				const isLoaned = isUserToggledLeased || isOutboundLeased;

				if (isLoaned) {
					loaned += site.buildingAssetValue || 0;
				} else if (isInboundLeased) {
					leased += site.buildingAssetValue || 0;
				} else {
					owned += site.buildingAssetValue || 0;
				}
			});
		});

		return {
			owned,
			leased,
			loaned,
			total: owned + leased + loaned,
		};
	}, [locationValuations]);

	const totalBuildingValue = useMemo(() => {
		return buildingAssetBreakdown.total;
	}, [buildingAssetBreakdown]);

	const shipAssetBreakdown = useMemo(() => {
		let owned = 0;
		let other = 0;

		locationValuations.forEach((loc) => {
			if (loc.type === "SHIP") {
				const hullValue = loc.buildingAssetValue || 0;
				if ((loc as any).isUserOwned !== false) {
					owned += hullValue;
				} else {
					other += hullValue;
				}
			}
		});

		return {
			owned,
			other,
			total: owned + other,
		};
	}, [locationValuations]);

	const totalShipValue = useMemo(() => {
		return shipAssetBreakdown.total;
	}, [shipAssetBreakdown]);

	return {
		locationValuations,
		workforceBurnRate,
		assetDistribution,
		inventoryValuationBreakdown,
		totalBuildingValue,
		buildingAssetBreakdown,
		shipAssetBreakdown,
		totalShipValue,
	};
};
