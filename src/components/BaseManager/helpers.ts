import {
	EXPERT_BONUS,
	FACTION_BONUSES,
	LUXURY_MULTIPLIERS,
	WORKER_NEEDS,
	PERMIT_AREAS,
} from "./constants";
import { EngineParams, EfficiencyBreakdown } from "./types";

/**
 * Formats a numeric value into a compact currency string (e.g., 1.5K, 2M).
 *
 * @param val - The numeric value to format.
 * @returns A formatted string representing the currency.
 */
export const formatCurrency = (val: number): string =>
	new Intl.NumberFormat("en-US", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(val);

/**
 * Converts a duration in seconds into a human-readable string (e.g., '1d 2h 30m').
 *
 * @param seconds - The total duration in seconds.
 * @returns A formatted string representing the duration.
 */
export const formatDuration = (seconds: number): string => {
	const d = Math.floor(seconds / 86400);
	const h = Math.floor((seconds % 86400) / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	let parts = [];
	if (d > 0) parts.push(`${d}d`);
	if (h > 0) parts.push(`${h}h`);
	if (m > 0) parts.push(`${m}m`);
	return parts.length > 0 ? parts.join(" ") : `${Math.floor(seconds)}s`;
};

/**
 * Normalizes a worker name by capitalizing the first letter and lowercasing the rest.
 *
 * @param w - The raw worker name.
 * @returns The normalized worker name.
 */
const normalizeWorker = (w: string): string =>
	w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

/**
 * Core engine function that calculates all relevant metrics for a player's base.
 * This includes area usage, required materials for construction (CapEx),
 * workforce supply/demand and efficiencies, material inputs/outputs over a 24h period,
 * and overall profitability.
 *
 * @param params - The input parameters containing the base state and global modifiers.
 * @returns A comprehensive object containing the calculated base metrics.
 */
export const calculateBaseMetrics = (params: EngineParams) => {
	const {
		activeData,
		activeBuildings,
		activeRecipes,
		activeNeeds,
		experts,
		activeCogc,
		planetFactor,
		getPrice,
		faction = "no faction",
		usedPermits = 1,
		totalPermits = 1,
	} = params;

	const permitArea = PERMIT_AREAS[Number(activeData.permitLevel)] || 500;
	let usedArea = 25;
	let storageMaxWeight = 1500,
		storageMaxVolume = 1500,
		totalCapEx = 0; // Default 1500/1500

	const workforce: Record<string, any> = {
		Pioneer: { demand: 0, supply: 0, open: 0, efficiency: 0 },
		Settler: { demand: 0, supply: 0, open: 0, efficiency: 0 },
		Technician: { demand: 0, supply: 0, open: 0, efficiency: 0 },
		Engineer: { demand: 0, supply: 0, open: 0, efficiency: 0 },
		Scientist: { demand: 0, supply: 0, open: 0, efficiency: 0 },
	};

	const buildMaterials: Record<string, number> = {};

	/**
	 * Helper to accumulate building materials for a given ticker and count.
	 */
	const addBuildReq = (ticker: string, count: number) => {
		const bInfo = activeBuildings.find((b) => b.ticker === ticker);
		if (bInfo?.buildReq)
			bInfo.buildReq.forEach((req: any) => {
				buildMaterials[req.ticker] =
					(buildMaterials[req.ticker] || 0) + Number(req.amount) * count;
			});
	};

	// Calculate area, build materials, and worker demand for production platforms
	activeData.platforms.forEach((p: any) => {
		const b = activeBuildings.find((mb) => mb.ticker === p.buildingTicker);
		const amount = Number(p.amount) || 1;
		if (b) {
			usedArea += Number(b.area) * amount;
			addBuildReq(b.ticker, amount);
			if (b.workers)
				Object.keys(b.workers).forEach(
					(w) =>
						(workforce[normalizeWorker(w)].demand +=
							Number((b.workers as any)[w]) * amount),
				);
		}
	});

	// Calculate area, build materials, and worker supply/storage for infrastructure
	activeData.infrastructure.forEach((i: any) => {
		const b = activeBuildings.find((mb) => mb.ticker === i.buildingTicker);
		const amount = Number(i.amount) || 1;
		if (b) {
			usedArea += Number(b.area) * amount;
			addBuildReq(b.ticker, amount);
			if (b.supply)
				Object.keys(b.supply).forEach(
					(w) =>
						(workforce[normalizeWorker(w)].supply +=
							Number((b.supply as any)[w]) * amount),
				);
			if (b.storageWeight) storageMaxWeight += Number(b.storageWeight) * amount;
			if (b.storageVolume) storageMaxVolume += Number(b.storageVolume) * amount;
		}
	});

	// Calculate total capital expenditure based on current material prices
	Object.entries(buildMaterials).forEach(
		([ticker, amt]) => (totalCapEx += amt * getPrice(ticker)),
	);

	// Determine workforce efficiency based on satisfied luxuries
	Object.keys(workforce).forEach((w) => {
		workforce[w].open = Math.max(0, workforce[w].supply - workforce[w].demand);
		const needs = WORKER_NEEDS[w];
		if (!needs) {
			workforce[w].efficiency = 100;
			return;
		}

		let activeLux = 0;
		needs.luxuries.forEach((l) => {
			if (activeNeeds[w]?.[l]) activeLux++;
		});
		const multiplierTable = LUXURY_MULTIPLIERS[needs.luxuries.length];
		workforce[w].efficiency = multiplierTable
			? multiplierTable[activeLux] * 100
			: 100;
	});

	const materialIO: Record<string, any> = {};
	const platformEfficiencies: Record<string, EfficiencyBreakdown> = {};
	const platformBuildingQueues: Record<string, any[]> = {};
	const platformActiveRecipes: Record<string, any[]> = {};

	const activeFactionLower = String(faction).toLowerCase().trim();
	const safeTotalPermits = Math.max(1, Number(totalPermits));
	// Modifier scales faction bonuses based on available vs used permits
	const permitModifier = -2 * (Number(usedPermits) / safeTotalPermits) + 3;

	// Calculate per-platform efficiencies and material input/output rates
	activeData.platforms.forEach((p: any) => {
		const bInfo = activeBuildings.find((mb) => mb.ticker === p.buildingTicker);
		const bCategory = bInfo?.category || "Unknown";
		const platformAmount = Number(p.amount) || 1;

		let buildingWorkforceEff = 100;
		if (bInfo?.workers) {
			Object.keys(bInfo.workers).forEach((w) => {
				const eff = workforce[normalizeWorker(w)]?.efficiency || 100;
				if (eff < buildingWorkforceEff) buildingWorkforceEff = eff; // Bottlenecked by lowest efficiency worker
			});
		}

		const bCategoryLower = String(bCategory).toLowerCase().trim();
		const activeCogcLower = activeCogc
			? String(activeCogc).toLowerCase().trim()
			: "";

		const expCategoryKey = Object.keys(experts).find(
			(k) => String(k).toLowerCase().trim() === bCategoryLower,
		);
		const expCount = expCategoryKey ? experts[expCategoryKey] : 0;
		const expertBonus = EXPERT_BONUS[expCount] || 0;

		const cogcBonus =
			activeCogcLower === bCategoryLower && activeCogcLower !== "" ? 1.25 : 1.0;

		const baseFactionBonus =
			FACTION_BONUSES[activeFactionLower]?.[bCategoryLower] || 0;
		const factionBonus = baseFactionBonus * permitModifier;

		const resourceFactor = (Number(planetFactor) || 100) / 100;

		const totalEfficiency =
			(buildingWorkforceEff / 100) *
			(1 + expertBonus) *
			cogcBonus *
			(1 + factionBonus) *
			resourceFactor;

		platformEfficiencies[p.id] = {
			workforce: buildingWorkforceEff,
			expert: expertBonus * 100,
			faction: factionBonus * 100,
			cogc: cogcBonus,
			planet: resourceFactor * 100,
			total: totalEfficiency * 100,
		};

		// Adjust recipe durations based on calculated platform efficiency
		const bRecipes = (p.activeRecipes || [])
			.map((id: string) => {
				const baseRecipe = activeRecipes.find((r) => r.id === id);
				if (!baseRecipe) return null;
				return {
					...baseRecipe,
					duration:
						Number(baseRecipe.duration) / Math.max(0.0001, totalEfficiency),
				};
			})
			.filter(Boolean);

		platformActiveRecipes[p.id] = bRecipes;

		// Distribute recipes evenly across the amount of identical platforms
		let bOrders: any[] = Array(platformAmount).fill(null);
		if (bRecipes.length > 0) {
			for (let i = 0; i < platformAmount; i++) {
				bOrders[i] = bRecipes[i % bRecipes.length];
			}
		}
		platformBuildingQueues[p.id] = bOrders;

		// Tally material consumption and production over a 24h cycle
		if (bRecipes.length > 0 && totalEfficiency > 0) {
			let totalQueueDurationActual = 0;
			bRecipes.forEach(
				(r: any) => (totalQueueDurationActual += Number(r.duration) || 1),
			);

			const loopsPerDay = (86400 * platformAmount) / totalQueueDurationActual;

			bRecipes.forEach((recipe: any) => {
				recipe.inputs?.forEach((input: any) => {
					const inputAmt = Number(input.amount) || 0;
					if (!materialIO[input.ticker])
						materialIO[input.ticker] = { prod: 0, cons: 0, delta: 0 };
					materialIO[input.ticker].cons += inputAmt * loopsPerDay;
					materialIO[input.ticker].delta -= inputAmt * loopsPerDay;
				});
				recipe.outputs?.forEach((output: any) => {
					const outputAmt = Number(output.amount) || 0;
					if (!materialIO[output.ticker])
						materialIO[output.ticker] = { prod: 0, cons: 0, delta: 0 };
					materialIO[output.ticker].prod += outputAmt * loopsPerDay;
					materialIO[output.ticker].delta += outputAmt * loopsPerDay;
				});
			});
		}
	});

	// Calculate aggregated profit and freight volumes
	let totalDailyProfit = 0,
		totalWeightImport = 0,
		totalWeightExport = 0,
		totalVolumeImport = 0,
		totalVolumeExport = 0;
	Object.entries(materialIO).forEach(([ticker, m]) => {
		const delta = Number(m.delta) * 0.5; // Approximation factor for weight/volume (can be refined)
		totalDailyProfit += Number(m.delta) * getPrice(ticker);
		if (delta < 0) {
			totalWeightImport += Math.abs(delta);
			totalVolumeImport += Math.abs(delta);
		} else {
			totalWeightExport += delta;
			totalVolumeExport += delta;
		}
	});

	const allUniqueMaterials = Array.from(
		new Set([...Object.keys(materialIO), ...Object.keys(buildMaterials)]),
	).sort();

	return {
		usedArea,
		permitArea,
		storageMaxWeight,
		storageMaxVolume,
		totalCapEx,
		workforce,
		materialIO,
		platformEfficiencies,
		platformBuildingQueues,
		buildMaterials,
		totalWeightImport,
		totalWeightExport,
		totalVolumeImport,
		totalVolumeExport,
		totalDailyProfit,
		allUniqueMaterials,
		platformActiveRecipes,
	};
};

/**
 * Result structure for the node production aggregation calculation.
 */
export interface NodeAggregationResult {
	/** The material ticker being aggregated */
	targetTicker: string;
	/** Total gross output of the material across all users */
	totalOutput: number;
	/** Total gross consumption of the material across all users */
	totalConsumption: number;
	/** Net flow of the material (positive means surplus, negative means deficit) */
	netFlow: number;
	/** Combined daily required inputs to produce the target material */
	aggregatedInputs: Record<string, number>;
	/** Combined daily byproducts generated alongside the target material */
	byproducts: Record<string, number>;
	/** Number of users actively producing or consuming the target material */
	activeProducers: number;
	/** Detailed breakdown of production per user */
	userProd: any[];
}

/**
 * Aggregates production data across multiple users in a node for a specific target material.
 * Analyzes recipes to determine total inputs required and total byproducts generated.
 *
 * @param users - Array of users belonging to the node.
 * @param targetTicker - The material ticker to analyze.
 * @param staticData - Game static data containing materials and recipes.
 * @param getPrice - Function to get the price of a material.
 * @returns NodeAggregationResult detailing the aggregate production metrics.
 */
export const aggregateNodeProduction = (
	users: any[],
	targetTicker: string,
	staticData: any,
	getPrice: (ticker: string) => number,
): NodeAggregationResult => {
	const result = {
		targetTicker: targetTicker.toUpperCase(),
		totalOutput: 0,
		totalConsumption: 0,
		netFlow: 0,
		aggregatedInputs: {} as Record<string, number>,
		byproducts: {} as Record<string, number>,
		activeProducers: 0,
		userProd: [] as any[],
	};

	if (!users || users.length === 0 || !staticData) return result;

	// Flatten static recipes for easier lookup
	const activeRecipes: any[] = [];
	staticData.materials?.forEach((m: any) => {
		m.inputRecipes?.forEach((r: any) => {
			const actualOutputs =
				r.outputs?.length > 0 ? r.outputs : [{ ticker: m.ticker, amount: 1 }];
			activeRecipes.push({
				id: r.processid || r.id,
				duration: r.durationmillis ? r.durationmillis / 1000 : 0,
				madeIn: r.madeIn,
				ticker: m.ticker,
				inputs: r.inputs || [],
				outputs: actualOutputs,
			});
		});
	});

	// Iterate over each user and calculate their base metrics
	users.forEach((user) => {
		if (
			!user.baseData ||
			user.baseData.status === "uninitialized" ||
			!user.baseData.platforms
		) {
			result.userProd.push({
				username: user.displayName || user.username,
				isRegistered: user.isRegistered,
				prod: 0,
				cons: 0,
				net: 0,
			});
			return;
		}

		const metrics = calculateBaseMetrics({
			activeData: user.baseData,
			activeBuildings: staticData.buildings || [],
			activeRecipes: activeRecipes,
			activeWorkerNeeds: staticData.needs || {},
			activeNeeds: user.activeNeeds || {},
			experts: user.experts || {},
			activeCogc: user.activeCogc || null,
			planetFactor: user.planetFactor !== undefined ? user.planetFactor : 100,
			getPrice,
			faction: user.faction || "No faction",
			usedPermits: user.usedPermits || 1,
			totalPermits: user.totalPermits || 1,
		});

		const io = metrics.materialIO || {};
		const targetIO = io[result.targetTicker] || { prod: 0, cons: 0, delta: 0 };

		const userProd = targetIO.prod || 0;
		const userCons = targetIO.cons || 0;
		let userIsProducingTarget = false;

		if (userProd > 0 || userCons > 0) {
			result.totalOutput += userProd;
			result.totalConsumption += userCons;
		}

		// Analyze specific platform recipes to identify input/byproduct ratios
		user.baseData.platforms.forEach((p: any) => {
			const recipesOnPlatform = metrics.platformActiveRecipes[p.id] || [];
			const targetRecipes = recipesOnPlatform.filter((r: any) =>
				r.outputs?.some(
					(out: any) =>
						String(out.ticker).toUpperCase() === result.targetTicker,
				),
			);

			if (targetRecipes.length === 0) return;

			// EXACT PARALLEL RATIO ALLOCATION FOR NODE
			const platformAmount = Number(p.amount) || 1;
			const buildingsPerRecipe = platformAmount / recipesOnPlatform.length;
			const resourceFactor = (Number(user.planetFactor) || 100) / 100;

			targetRecipes.forEach((recipe: any) => {
				userIsProducingTarget = true;
				const loopsPerDay =
					(86400 / (Number(recipe.duration) || 1)) * buildingsPerRecipe;

				recipe.inputs?.forEach((input: any) => {
					const inputAmt = Number(input.amount) || 0;
					const consumedDaily = inputAmt * loopsPerDay;

					if (String(input.ticker).toUpperCase() === result.targetTicker) {
						// Internal consumption is already handled globally above
					} else {
						result.aggregatedInputs[input.ticker] =
							(result.aggregatedInputs[input.ticker] || 0) + consumedDaily;
					}
				});

				recipe.outputs?.forEach((output: any) => {
					if (String(output.ticker).toUpperCase() !== result.targetTicker) {
						const outputAmt = Number(output.amount) || 0;
						result.byproducts[output.ticker] =
							(result.byproducts[output.ticker] || 0) +
							outputAmt * loopsPerDay * resourceFactor;
					}
				});
			});
		});

		if (userIsProducingTarget) result.activeProducers++;

		result.userProd.push({
			username: user.displayName || user.username,
			isRegistered: user.isRegistered,
			prod: userProd,
			cons: userCons,
			net: userProd - userCons,
		});
	});

	result.netFlow = result.totalOutput - result.totalConsumption;
	return result;
};
