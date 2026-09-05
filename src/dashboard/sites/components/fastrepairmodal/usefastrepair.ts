import { useMemo, useCallback } from "react";
import { getMatProps } from "../../../production/utils/materialprops";
import { useGlobalData } from "../../../../context/globaldatacontext";
import {
	calcBuildingCondition,
	calcRepairAmount,
	BUILDING_CONSTRUCTION_MATERIALS,
} from "./utils";
import type { PlatformBreakdownItem } from "./types";

interface PlanetEnvironmentalProps {
	surfaceType?: string; // "ROCKY" | "GASEOUS"
	pressure?: number; // in atm
	gravity?: number; // in g
	temperature?: number; // in °C
}

interface SitePlatformCondition {
	platform_id?: string;
	building_type?: string;
	building_ticker?: string;
	age_days?: number;
	last_repair?: string | number;
	platform_condition?: number;
	condition?: number;
	area?: number;
	build_materials?: { ticker: string; amount: number }[];
}

interface UseFastRepairOptions {
	currentCondition: number;
	sitePlatformConditions: SitePlatformCondition[];
	selectedExchange: string;
	timeOffset: number;
	planetProps?: PlanetEnvironmentalProps;
	richFlows?: Record<string, any>;
}

export function useFastRepair({
	currentCondition,
	sitePlatformConditions,
	selectedExchange,
	timeOffset,
	planetProps,
	richFlows,
}: UseFastRepairOptions) {
	const globalData = useGlobalData();

	const globalGetMatProps = useCallback(
		(t: string) => {
			return globalData?.getMatProps
				? globalData.getMatProps(t)
				: { volume: 1, weight: 1 };
		},
		[globalData],
	);

	const getMatPrice = useCallback(
		(mat: string): number => {
			let marketObj: any = null;
			if (Array.isArray(globalData?.marketData)) {
				marketObj = globalData.marketData.find(
					(item: any) =>
						(item.Ticker || item.ticker || "").toUpperCase() ===
						mat.toUpperCase(),
				);
			} else if (
				globalData?.marketData &&
				typeof globalData.marketData === "object"
			) {
				marketObj = globalData.marketData[mat];
			}

			if (!marketObj) return 150;

			if (selectedExchange === "CORP") {
				return (
					marketObj.corp_price ||
					marketObj.price ||
					marketObj["IC1-Average"] ||
					150
				);
			}

			const askKey = `${selectedExchange}-AskPrice`;
			const avgKey = `${selectedExchange}-Average`;
			const bidKey = `${selectedExchange}-BidPrice`;

			return (
				marketObj[askKey] ||
				marketObj[avgKey] ||
				marketObj[bidKey] ||
				marketObj.price ||
				150
			);
		},
		[globalData?.marketData, selectedExchange],
	);

	const getMatMarketInfo = useCallback(
		(mat: string) => {
			let marketObj: any = null;
			if (Array.isArray(globalData?.marketData)) {
				marketObj = globalData.marketData.find(
					(item: any) =>
						(item.Ticker || item.ticker || "").toUpperCase() ===
						mat.toUpperCase(),
				);
			} else if (
				globalData?.marketData &&
				typeof globalData.marketData === "object"
			) {
				marketObj = globalData.marketData[mat];
			}

			if (!marketObj) return { corpPrice: 150, cxAvail: 0, askPrice: 150 };

			const askKey = `${selectedExchange}-AskPrice`;
			const askAvailKey = `${selectedExchange}-AskAvail`;
			const askAmtKey = `${selectedExchange}-AskAmt`;

			const corpPrice =
				marketObj.corp_price ||
				marketObj.price ||
				marketObj["IC1-Average"] ||
				150;
			const cxAvail = marketObj[askAvailKey] || marketObj[askAmtKey] || 0;
			const askPrice = marketObj[askKey] || marketObj.price || 150;

			return {
				corpPrice,
				cxAvail,
				askPrice,
			};
		},
		[globalData?.marketData, selectedExchange],
	);

	// Calculate dynamic environmental additional construction materials per building base on planet parameters
	const getEnvironmentalMaterials = useCallback(
		(area: number = 0): Record<string, number> => {
			if (!planetProps) return {};
			const envMats: Record<string, number> = {};

			// Surface Type
			const surface = (planetProps.surfaceType || "").toUpperCase();
			if (surface === "ROCKY" && area > 0) {
				envMats["MCG"] = area * 4;
			} else if (surface === "GASEOUS" && area > 0) {
				envMats["AEF"] = Math.ceil(area / 3);
			}

			// Atmospheric Pressure
			if (planetProps.pressure !== undefined) {
				if (planetProps.pressure < 0.25 && area > 0) {
					envMats["SEA"] = (envMats["SEA"] || 0) + area * 1;
				} else if (planetProps.pressure > 2.0) {
					envMats["HSE"] = (envMats["HSE"] || 0) + 1;
				}
			}

			// Gravity
			if (planetProps.gravity !== undefined) {
				if (planetProps.gravity < 0.25) {
					envMats["MGC"] = (envMats["MGC"] || 0) + 1;
				} else if (planetProps.gravity > 2.5) {
					envMats["BL"] = (envMats["BL"] || 0) + 1;
				}
			}

			// Temperature
			if (planetProps.temperature !== undefined) {
				if (planetProps.temperature < -25 && area > 0) {
					envMats["INS"] = (envMats["INS"] || 0) + area * 10;
				} else if (planetProps.temperature > 75) {
					envMats["TSH"] = (envMats["TSH"] || 0) + 1;
				}
			}

			return envMats;
		},
		[planetProps],
	);

	// Filter out Non-Production Platforms
	const repairablePlatforms = useMemo(() => {
		if (!sitePlatformConditions || sitePlatformConditions.length === 0)
			return [];

		return sitePlatformConditions.filter((p) => {
			const buildingType = (p.building_type || "").toUpperCase();
			return (
				buildingType !== "CORE" &&
				buildingType !== "HABITATION" &&
				buildingType !== "STORAGE"
			);
		});
	}, [sitePlatformConditions]);

	// Normalize Platform Entries & Compute Full Construction Requirements (Base + Env)
	const platformEntries = useMemo(() => {
		const now = Date.now();

		return repairablePlatforms.map((p, idx) => {
			const ticker = (p.building_ticker || "").toUpperCase();
			let currentAgeDays = p.age_days;

			if (currentAgeDays === undefined && p.last_repair) {
				currentAgeDays =
					(now - new Date(p.last_repair).getTime()) / (1000 * 60 * 60 * 24);
			}
			if (currentAgeDays === undefined) {
				const cond =
					p.platform_condition !== undefined
						? p.platform_condition
						: p.condition !== undefined
							? p.condition
							: currentCondition;
				currentAgeDays = (1 - cond) * 180;
			}

			currentAgeDays = Math.min(180, Math.max(0, currentAgeDays));
			const currentConditionPct = calcBuildingCondition(currentAgeDays);

			const fullMaterials: Record<string, number> = {};

			// 1. Base Materials
			if (Array.isArray(p.build_materials) && p.build_materials.length > 0) {
				p.build_materials.forEach((bm) => {
					if (bm.ticker && bm.amount) {
						fullMaterials[bm.ticker] = bm.amount;
					}
				});
			} else {
				const baseDefaults =
					BUILDING_CONSTRUCTION_MATERIALS[ticker] ||
					BUILDING_CONSTRUCTION_MATERIALS.DEFAULT ||
					{};
				Object.entries(baseDefaults).forEach(([mat, qty]) => {
					fullMaterials[mat] = qty;
				});
			}

			// 2. Environmental Material Modifiers
			const envMaterials = getEnvironmentalMaterials(p.area || 0);
			Object.entries(envMaterials).forEach(([mat, qty]) => {
				fullMaterials[mat] = (fullMaterials[mat] || 0) + qty;
			});

			return {
				id: p.platform_id || `platform_${idx}`,
				ticker,
				currentAgeDays,
				currentConditionPct,
				fullMaterials,
			};
		});
	}, [repairablePlatforms, currentCondition, getEnvironmentalMaterials]);

	// Age & Condition Statistics
	const { minAge, maxAge, avgAge, avgConditionPct } = useMemo(() => {
		if (platformEntries.length === 0) {
			return { minAge: 0, maxAge: 0, avgAge: 0, avgConditionPct: 1.0 };
		}

		let min = 180;
		let max = 0;
		let totalAge = 0;

		platformEntries.forEach((entry) => {
			if (entry.currentAgeDays < min) min = entry.currentAgeDays;
			if (entry.currentAgeDays > max) max = entry.currentAgeDays;
			totalAge += entry.currentAgeDays;
		});

		const computedAvg = totalAge / platformEntries.length;
		const plannedAvgAge = Math.min(180, computedAvg + timeOffset);

		return {
			minAge: min,
			maxAge: max,
			avgAge: computedAvg,
			avgConditionPct: calcBuildingCondition(plannedAvgAge),
		};
	}, [platformEntries, timeOffset]);

	const maxTimeOffset = useMemo(() => {
		return Math.max(0, 180 - avgAge);
	}, [avgAge]);

	// Aggregated Planetary Base Material Requirements (Including Environmental Costs)
	const fullPlanetaryMaterials = useMemo(() => {
		const fullMats: Record<string, number> = {};
		if (platformEntries && platformEntries.length > 0) {
			platformEntries.forEach((entry) => {
				Object.entries(entry.fullMaterials).forEach(([mat, fullQty]) => {
					fullMats[mat] = (fullMats[mat] || 0) + fullQty;
				});
			});
		}
		return fullMats;
	}, [platformEntries]);

	// Per-building Repair Cost & Material Requirements
	const platformBreakdown: PlatformBreakdownItem[] = useMemo(() => {
		return platformEntries.map((entry) => {
			const plannedAge = Math.min(180, entry.currentAgeDays + timeOffset);
			const plannedCond = calcBuildingCondition(plannedAge);
			const itemNeeds: Record<string, number> = {};
			let bCost = 0;

			Object.entries(entry.fullMaterials).forEach(([mat, fullQty]) => {
				const needed = calcRepairAmount(fullQty, plannedAge);
				if (needed > 0) {
					itemNeeds[mat] = needed;
					bCost += needed * getMatPrice(mat);
				}
			});

			return {
				id: entry.id,
				ticker: entry.ticker,
				condition: plannedCond,
				ageDays: plannedAge,
				repairCost: bCost,
				materials: itemNeeds,
			};
		});
	}, [platformEntries, timeOffset, getMatPrice]);

	// Aggregated Shopping Cart Repair Materials, Costs, Volume, and Weight
	const { repairMaterials, totalRepairCost, totalVolume, totalWeight } =
		useMemo(() => {
			const matTotals: Record<string, number> = {};

			if (Object.keys(fullPlanetaryMaterials).length > 0) {
				const plannedAvgAge = Math.min(180, avgAge + timeOffset);
				Object.entries(fullPlanetaryMaterials).forEach(([mat, fullAmount]) => {
					const needed = calcRepairAmount(fullAmount, plannedAvgAge);
					if (needed > 0) {
						matTotals[mat] = needed;
					}
				});
			} else {
				platformBreakdown.forEach((pb) => {
					Object.entries(pb.materials).forEach(([mat, qty]) => {
						matTotals[mat] = (matTotals[mat] || 0) + qty;
					});
				});
			}

			let cost = 0;
			let vol = 0;
			let weight = 0;

			Object.entries(matTotals).forEach(([mat, qty]) => {
				const price = getMatPrice(mat);
				const props = globalGetMatProps(mat);
				cost += qty * price;
				vol += qty * props.volume;
				weight += qty * props.weight;
			});

			return {
				repairMaterials: matTotals,
				totalRepairCost: cost,
				totalVolume: vol,
				totalWeight: weight,
			};
		}, [
			fullPlanetaryMaterials,
			platformBreakdown,
			avgAge,
			timeOffset,
			getMatPrice,
			globalGetMatProps,
		]);

	// Calculate base profit at 100% building condition (efficiency 1.0)
	const baseDailyProfit = useMemo(() => {
		if (!richFlows) return 0;
		let total = 0;
		Object.entries(richFlows).forEach(([ticker, data]: [string, any]) => {
			const price = getMatPrice(ticker);
			const flow = data.flow || 0;
			total += flow * price;
		});
		return total;
	}, [richFlows, getMatPrice]);

	// Recharts Timeline Points Computation (Fixed 0 to 180 days planned age)
	const timelineGraphData = useMemo(() => {
		const points = [];

		for (let d = 0; d <= 180; d += 1) {
			let totalCond = 0;
			let cost = 0;
			const itemQtys: Record<string, number> = {};

			if (Object.keys(fullPlanetaryMaterials).length > 0) {
				totalCond = calcBuildingCondition(d) * platformEntries.length;
				Object.entries(fullPlanetaryMaterials).forEach(([mat, fullAmount]) => {
					const needed = calcRepairAmount(fullAmount, d);
					itemQtys[mat] = needed;
				});
			} else {
				platformEntries.forEach((entry) => {
					totalCond += calcBuildingCondition(d);
					Object.entries(entry.fullMaterials).forEach(([mat, fullQty]) => {
						const needed = calcRepairAmount(fullQty, d);
						itemQtys[mat] = (itemQtys[mat] || 0) + needed;
					});
				});
			}

			const avgCondPct =
				platformEntries.length > 0
					? (totalCond / platformEntries.length) * 100
					: 100;
			const dailyProfit = Math.round(
				baseDailyProfit * calcBuildingCondition(d),
			);

			Object.entries(itemQtys).forEach(([mat, qty]) => {
				const price = getMatPrice(mat);
				cost += qty * price;
			});

			points.push({
				dayLabel: `${d}d`,
				day: d,
				conditionPct: parseFloat(avgCondPct.toFixed(1)),
				totalCost: Math.round(cost),
				dailyProfit,
				...itemQtys,
			});
		}

		return points;
	}, [fullPlanetaryMaterials, platformEntries, getMatPrice, baseDailyProfit]);

	// Compute projections for the next 90 days (or up to maxTimeOffset limit)
	const projectedDays = useMemo(() => {
		const days = [];
		const limit = Math.min(180, Math.floor(maxTimeOffset));
		for (let d = 0; d <= limit; d++) {
			let totalCond = 0;
			let cost = 0;
			const itemQtys: Record<string, number> = {};

			if (Object.keys(fullPlanetaryMaterials).length > 0) {
				const plannedAvgAge = Math.min(180, avgAge + d);
				totalCond =
					calcBuildingCondition(plannedAvgAge) * platformEntries.length;
				Object.entries(fullPlanetaryMaterials).forEach(([mat, fullAmount]) => {
					const needed = calcRepairAmount(fullAmount, plannedAvgAge);
					itemQtys[mat] = needed;
				});
			} else {
				platformEntries.forEach((entry) => {
					const plannedAge = Math.min(180, entry.currentAgeDays + d);
					totalCond += calcBuildingCondition(plannedAge);
					Object.entries(entry.fullMaterials).forEach(([mat, fullQty]) => {
						const needed = calcRepairAmount(fullQty, plannedAge);
						itemQtys[mat] = (itemQtys[mat] || 0) + needed;
					});
				});
			}

			const avgCondPct =
				platformEntries.length > 0
					? (totalCond / platformEntries.length) * 100
					: 100;

			Object.entries(itemQtys).forEach(([mat, qty]) => {
				const price = getMatPrice(mat);
				cost += qty * price;
			});

			days.push({
				offset: d,
				conditionPct: parseFloat(avgCondPct.toFixed(1)),
				totalCost: Math.round(cost),
			});
		}
		return days;
	}, [
		fullPlanetaryMaterials,
		platformEntries,
		avgAge,
		maxTimeOffset,
		getMatPrice,
	]);

	return {
		minAge,
		maxAge,
		avgAge,
		avgConditionPct,
		maxTimeOffset,
		platformBreakdown,
		repairMaterials,
		totalRepairCost,
		totalVolume,
		totalWeight,
		timelineGraphData,
		getMatPrice,
		getMatMarketInfo,
		projectedDays,
	};
}
