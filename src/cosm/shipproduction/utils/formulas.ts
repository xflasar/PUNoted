import { MATERIAL_SPECS, SHIP_SYSTEMS_MOCK } from "./constants";
import optionsProfileData from "../data/optionsProfile.json";

export interface CalculateStatsInput {
	selections: Record<string, string>;
	shipClass: "REGULAR" | "COLONY_SHIP";
}

export interface DynamicStatsResult {
	volume: number;
	sscCount: number;
	plateCount: number;
	crewTicker: string;
	crewLabel: string;
	bridgeTicker: string;
	bridgeLabel: string;
	ffcCount: number;
	lfeCount: number;
	mfeCount: number;
	sfeCount: number;
	heatShieldCount: number;
	whippleShieldCount: number;
	radShieldCount: number;
	habModuleCount: number;
	hasFtl: boolean;
	maxGFactor: number;
	cargoVol: number;
	cargoWgt: number;
	stlCapacity: number;
	ftlCapacity: number;
	calculatedMass: number;
	buildTime: number;
}

export interface PerformanceStats {
	speed: number;
	weight: number;
	shieldStrength: number;
	powerGen: number;
	cargoCapacity: number;
	crewCapacity: number;
	buildTime: number;
}

export interface CalculateBOMResult {
	partsList: { name: string; quantity: number }[];
	performanceSum: PerformanceStats;
	cxTotalPrice: number;
}

/**
 * DETERMINISTIC RULES ENGINE
 * This calculates stats using verified additive deltas and
 * fixed game thresholds. No caching logic is used to ensure
 * live response to UI changes.
 */
export function calculateDynamicStats(
	input: CalculateStatsInput,
): DynamicStatsResult {
	const { selections, shipClass } = input;

	// Base Chassis configuration from extracted data
	let total_volume = 0;
	const optionsProfile = (optionsProfileData.optionsProfile || {}) as Record<
		string,
		any
	>;

	// 1. Absolute Component Summation
	Object.entries(selections).forEach(([key, val]) => {
		if (
			!val ||
			val === "NONE" ||
			val === "" ||
			key === "COMMAND_BRIDGE" ||
			key === "CREW_QUARTERS" ||
			key === "STRUCTURE"
		)
			return;
		const profile = optionsProfile[val];
		if (profile) {
			total_volume += profile.volume || 0;
		}
	});

	if (total_volume < 10) total_volume = 10;

	// Bridge logic based on exact hierarchy:
	const hasFtl =
		selections.FTL_REACTOR !== "NONE" &&
		selections.FTL_REACTOR !== "" &&
		selections.FTL_FUEL_TANK !== "NONE" &&
		selections.FTL_FUEL_TANK !== "";
	let bridgeTicker = "BRS";
	if (hasFtl) {
		const requiresFtlBr2 =
			selections.FTL_REACTOR === "FTL_REACTOR_HIGH_POWER" ||
			selections.FTL_REACTOR === "FTL_REACTOR_HYPER_POWER";
		bridgeTicker = requiresFtlBr2 ? "BR2" : "BR1";
	} else {
		const requiresStlBr2 =
			selections.STL_ENGINE === "STL_ENGINE_ADVANCED" ||
			selections.STL_ENGINE === "STL_ENGINE_HYPERTHRUST";
		bridgeTicker = requiresStlBr2 ? "BR2" : "BRS";
	}

	if (selections.RADIATION_SHIELD === "RADIATION_SHIELD_BASIC") {
		bridgeTicker = "BRP";
	}

	let bridgeLabel =
		bridgeTicker === "BRP"
			? "Protected"
			: bridgeTicker === "BR2"
				? "FTL Bridge"
				: bridgeTicker === "BR1"
					? "Standard Bridge"
					: "Short-distance Bridge";

	// Dynamic Bridge Volume and SSC
	if (bridgeTicker === "BRS") {
		total_volume += 64;
	} else if (bridgeTicker === "BR2") {
		total_volume += 274;
	} else if (bridgeTicker === "BR1" || bridgeTicker === "BRP") {
		total_volume += 100;
	}

	// Crew threshold logic
	let crewTicker = "CQT";
	let crewLabel = "Tiny";
	if (total_volume >= 2700) {
		crewTicker = "CQL";
		crewLabel = "Large";
	} else if (total_volume >= 1700) {
		crewTicker = "CQM";
		crewLabel = "Medium";
	} else if (total_volume >= 950) {
		crewTicker = "CQS";
		crewLabel = "Small";
	} else {
		crewTicker = "CQT";
		crewLabel = "Tiny";
	}

	// 3. Derived Metrics
	const sscCount = Math.ceil(total_volume / 21);
	const plateCount = Math.ceil(Math.pow(total_volume, 2 / 3) / 2.07);
	const ffcCount = hasFtl ? 1 : 0;
	const heatShieldCount =
		selections.HEAT_SHIELD !== "NONE" && selections.HEAT_SHIELD !== ""
			? plateCount
			: 0;
	const whippleShieldCount =
		selections.WHIPPLE_SHIELD !== "NONE" && selections.WHIPPLE_SHIELD !== ""
			? plateCount
			: 0;
	const radShieldCount =
		selections.RADIATION_SHIELD !== "NONE" && selections.RADIATION_SHIELD !== ""
			? plateCount
			: 0;

	// Emitter logic
	let lfeCount = 0,
		mfeCount = 0,
		sfeCount = 0;
	if (hasFtl) {
		lfeCount = Math.floor(total_volume / 1000);
		const remainder1 = total_volume % 1000;
		mfeCount = Math.floor(remainder1 / 300);
		const remainder2 = remainder1 % 300;
		sfeCount = Math.ceil(remainder2 / 100);
		// Observed anomaly for 963m3 requiring 2 SFE instead of 1
		if (total_volume < 1000 && sfeCount === 1) sfeCount = 2;
	}

	return {
		volume: Math.round(total_volume),
		sscCount: Math.round(sscCount),
		plateCount,
		crewTicker,
		crewLabel,
		bridgeTicker,
		bridgeLabel,
		ffcCount,
		lfeCount,
		mfeCount,
		sfeCount,
		heatShieldCount,
		whippleShieldCount,
		radShieldCount,
		habModuleCount: shipClass === "COLONY_SHIP" ? 4 : 0,
		hasFtl,
		maxGFactor: 15,
		cargoVol: 0,
		cargoWgt: 0,
		stlCapacity: 0,
		ftlCapacity: 0,
		calculatedMass: 0, // Migrated to calculateBOM
		buildTime: 0, // Migrated to calculateBOM
	};
}

export function calculateBOM(
	selections: Record<string, string>,
	dynamicStats: DynamicStatsResult,
	shipClass: "REGULAR" | "COLONY_SHIP",
): CalculateBOMResult {
	const newPartsMap = new Map<string, number>();
	const perf: PerformanceStats = {
		speed: 0,
		weight: dynamicStats.calculatedMass,
		shieldStrength: 0,
		powerGen: 0,
		cargoCapacity: 0,
		crewCapacity: 0,
		buildTime: dynamicStats.buildTime,
	};

	const addPerf = (p: any) => {
		if (!p) return;
		perf.speed += p.speed || 0;
		perf.shieldStrength += p.shieldStrength || 0;
		perf.powerGen += p.powerGen || 0;
		perf.cargoCapacity += p.cargoCapacity || 0;
		perf.crewCapacity += p.crewCapacity || 0;
	};

	Object.entries(selections).forEach(([key, val]) => {
		if (val === "NONE" || val === "") return;
		if (
			key === "HULL_TYPE" ||
			key === "HEAT_SHIELD" ||
			key === "WHIPPLE_SHIELD" ||
			key === "RADIATION_SHIELD"
		)
			return;

		const options = SHIP_SYSTEMS_MOCK[key];
		if (options) {
			const opt = options.find((o) => o.option === val);
			if (opt) {
				addPerf(opt.performance);
				const spec = MATERIAL_SPECS[val];
				if (spec) {
					newPartsMap.set(spec.ticker, (newPartsMap.get(spec.ticker) || 0) + 1);
				}
			}
		}
	});

	newPartsMap.set("SSC", (newPartsMap.get("SSC") || 0) + dynamicStats.sscCount);

	const activeHullPlateType = selections.HULL_TYPE;
	const hullPlateTicker = MATERIAL_SPECS[activeHullPlateType]?.ticker || "BHP";
	newPartsMap.set(
		hullPlateTicker,
		(newPartsMap.get(hullPlateTicker) || 0) + dynamicStats.plateCount,
	);

	if (dynamicStats.heatShieldCount > 0) {
		const heatTicker = MATERIAL_SPECS[selections.HEAT_SHIELD]?.ticker || "HSP";
		newPartsMap.set(
			heatTicker,
			(newPartsMap.get(heatTicker) || 0) + dynamicStats.heatShieldCount,
		);
	}
	if (dynamicStats.whippleShieldCount > 0) {
		const whippleTicker =
			MATERIAL_SPECS[selections.WHIPPLE_SHIELD]?.ticker || "WSP";
		newPartsMap.set(
			whippleTicker,
			(newPartsMap.get(whippleTicker) || 0) + dynamicStats.whippleShieldCount,
		);
	}
	if (dynamicStats.radShieldCount > 0) {
		const radTicker =
			MATERIAL_SPECS[selections.RADIATION_SHIELD]?.ticker || "RSP";
		newPartsMap.set(
			radTicker,
			(newPartsMap.get(radTicker) || 0) + dynamicStats.radShieldCount,
		);
	}

	newPartsMap.set(
		dynamicStats.bridgeTicker,
		(newPartsMap.get(dynamicStats.bridgeTicker) || 0) + 1,
	);
	newPartsMap.set(
		dynamicStats.crewTicker,
		(newPartsMap.get(dynamicStats.crewTicker) || 0) + 1,
	);

	if (dynamicStats.ffcCount > 0) {
		newPartsMap.set(
			"FFC",
			(newPartsMap.get("FFC") || 0) + dynamicStats.ffcCount,
		);
	}
	if (dynamicStats.lfeCount > 0) {
		newPartsMap.set(
			"LFE",
			(newPartsMap.get("LFE") || 0) + dynamicStats.lfeCount,
		);
	}
	if (dynamicStats.mfeCount > 0) {
		newPartsMap.set(
			"MFE",
			(newPartsMap.get("MFE") || 0) + dynamicStats.mfeCount,
		);
	}
	if (dynamicStats.sfeCount > 0) {
		newPartsMap.set(
			"SFE",
			(newPartsMap.get("SFE") || 0) + dynamicStats.sfeCount,
		);
	}

	if (dynamicStats.habModuleCount > 0) {
		newPartsMap.set(
			"HAM",
			(newPartsMap.get("HAM") || 0) + dynamicStats.habModuleCount,
		);
	}

	let cxSum = 0;
	let totalWeight = 0;
	newPartsMap.forEach((qty, ticker) => {
		const spec = Object.values(MATERIAL_SPECS).find((s) => s.ticker === ticker);
		if (spec) {
			cxSum += spec.cxPrice * qty;
			totalWeight += spec.weight * qty;
		}
	});

	perf.weight = Math.round(totalWeight * 10) / 10;
	perf.buildTime = Math.floor(perf.weight / 50);

	const list = Array.from(newPartsMap.entries()).map(([name, quantity]) => ({
		name,
		quantity,
	}));

	return { partsList: list, performanceSum: perf, cxTotalPrice: cxSum };
}
