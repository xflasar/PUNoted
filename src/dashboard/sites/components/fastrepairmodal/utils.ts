/**
 * Official Prosperous Universe XITREP extension building degradation formulas:
 */
export function calcBuildingCondition(ageDays: number): number {
	//return ageDays > 180 ? 0 : 1 - ageDays / 180;
	return ageDays > 180
		? 0
		: 0.67 / (1 + Math.exp((1789 / 25000) * (ageDays - 100.87))) + 0.33;
}

export function calcRepairAmount(
	fullMaterialAmount: number,
	plannedRepairAgeDays: number,
): number {
	//const condition = calcBuildingCondition(plannedRepairAgeDays);
	plannedRepairAgeDays = Math.floor(plannedRepairAgeDays);
	const reclaimableCost = Math.floor(
		fullMaterialAmount * ((180 - Math.min(180, plannedRepairAgeDays)) / 180),
	);
	const repairCost = fullMaterialAmount - reclaimableCost;
	return repairCost;
	//return Math.ceil(fullMaterialAmount * (1 - condition));
}

// Standard PrUn building construction material requirements per building type (fallback)
export const BUILDING_CONSTRUCTION_MATERIALS: Record<
	string,
	Record<string, number>
> = {
	PP1: { BGC: 4, MCG: 4, SEA: 2 },
	PP2: { BGC: 8, MCG: 8, SEA: 4 },
	EXT: { BGC: 8, MCG: 4, SEA: 4 },
	RIG: { BGC: 12, MCG: 8, TRU: 4 },
	HYD: { BGC: 6, MCG: 6, SEA: 3 },
	COL: { BGC: 10, MCG: 10, TRU: 6 },
	BMP: { BGC: 4, MCG: 4, SEA: 2 },
	SME: { BSE: 6, BBH: 4, BDE: 4, MCG: 68, SEA: 17 },
	CL: { BGC: 6, MCG: 6, SEA: 3 },
	FRM: { BGC: 20, TRU: 2 },
	CHP: { BGC: 8, MCG: 8, SEA: 4 },
	FP: { BGC: 8, MCG: 8, SEA: 4 },
	DEFAULT: { BGC: 6, MCG: 6, SEA: 3 },
};

export const MATERIAL_COLORS: Record<string, string> = {
	BGC: "#ff9800",
	MCG: "#2196f3",
	SEA: "#00e5ff",
	TRU: "#e91e63",
	BBL: "#9c27b0",
	LST: "#4caf50",
	MGC: "#ffeb3b",
	BSE: "#4caf50",
	BBH: "#ab47bc",
	BDE: "#26a69a",
};

export const CX_EXCHANGES = ["IC1", "NC1", "AI1", "CI1", "CORP"];
