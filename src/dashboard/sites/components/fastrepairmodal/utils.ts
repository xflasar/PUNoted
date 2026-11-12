/**
 * Official Prosperous Universe building degradation formulas:
 */
export function calcBuildingCondition(ageDays: number): number {
	return ageDays > 180
		? 0
		: 0.67 / (1 + Math.exp((1789 / 25000) * (ageDays - 100.87))) + 0.33;
}

export function calcRepairAmount(
	fullMaterialAmount: number,
	plannedRepairAgeDays: number,
): number {
	plannedRepairAgeDays = Math.floor(plannedRepairAgeDays);
	const reclaimableCost = Math.floor(
		fullMaterialAmount * ((180 - Math.min(180, plannedRepairAgeDays)) / 180),
	);
	const repairCost = fullMaterialAmount - reclaimableCost;
	return repairCost;
}

export const BUILDING_CONSTRUCTION_MATERIALS: Record<
	string,
	Record<string, number>
> = {
	AAF: { ABH: 6, ADE: 8, ASE: 8, ATA: 1, TRU: 8 },
	AML: { ABH: 10, ADE: 6, ASE: 6, TRU: 6 },
	APF: { ABH: 6, ADE: 10, ASE: 10, TRU: 8 },
	ASM: { LBH: 4, LDE: 2, LSE: 6, LTA: 2, TRU: 4 },
	BMP: { BBH: 4, BDE: 2, BSE: 6 },
	CHP: { BBH: 3, BDE: 3, BSE: 3, TRU: 4 },
	CLF: { BSE: 2, LDE: 4, LSE: 2, TRU: 8 },
	CLR: { LBH: 6, LDE: 4, LSE: 4, LTA: 4, TRU: 4 },
	COL: { BSE: 16 },
	DRS: { RBH: 4, RDE: 6, RSE: 6, RTA: 2, TRU: 6 },
	ECA: { RBH: 4, RDE: 6, RSE: 6, RTA: 2, TRU: 6 },
	EDM: { LBH: 4, LDE: 4, LSE: 6, TRU: 4 },
	EEP: { RBH: 6, RDE: 6, RSE: 12, RTA: 2, TRU: 6 },
	ELP: { RBH: 4, RDE: 4, RSE: 6, TRU: 6 },
	EXT: { BSE: 16 },
	FER: { LBH: 2, LDE: 2, LSE: 2, TRU: 5 },
	FP: { BBH: 3, BDE: 3, BSE: 3 },
	FRM: { BBH: 4, BSE: 4 },
	FS: { BBH: 2, LBH: 2, LDE: 2, TRU: 4 },
	GF: { LBH: 4, LSE: 6, TRU: 5 },
	HWP: { BBH: 4, BDE: 6, BSE: 6, LTA: 2, TRU: 4 },
	HYF: { BSE: 2, LBH: 4, MHL: 16, TRU: 4 },
	INC: { BBH: 3, BDE: 2, BSE: 4, BTA: 1 },
	IVP: { RBH: 6, RDE: 4, RSE: 4, RTA: 2, TRU: 6 },
	LAB: { LDE: 12, LSE: 6, TRU: 8 },
	MCA: { RBH: 4, RDE: 6, RSE: 4, TRU: 6 },
	ORC: { ASE: 8, ATA: 4, TRU: 2 },
	PAC: { BSE: 6, LBH: 10, LDE: 6, MCG: 100, TRU: 4 },
	PHF: { LBH: 4, LDE: 6, LSE: 8, LTA: 2, TRU: 6 },
	POL: { BDE: 4, BSE: 4, LBH: 8, TRU: 2 },
	PP1: { BBH: 3, BDE: 3, BSE: 4 },
	PP2: { BBH: 6, BDE: 6, BSE: 3, TRU: 4 },
	PP3: { LDE: 6, LSE: 4, TRU: 6 },
	PP4: { RBH: 6, RDE: 6, RSE: 8, TRU: 4 },
	PPF: { BSE: 2, LBH: 4, LDE: 2, TRU: 2 },
	REF: { BBH: 6, BDE: 6, BSE: 6 },
	RIG: { BSE: 12 },
	SCA: { RBH: 3, RDE: 6, RSE: 2, TRU: 4 },
	SD: { LBH: 6, LDE: 6, LSE: 10, LTA: 4, TRU: 8 },
	SE: { RBH: 4, RDE: 6, RSE: 6, RTA: 2, TRU: 4 },
	SKF: { BBH: 4, BDE: 6, BSE: 4, LTA: 2, TRU: 6 },
	SL: { LDE: 8, LTA: 6, RBH: 12, RSE: 12, TRU: 8 },
	SME: { BBH: 4, BDE: 4, BSE: 6 },
	SPF: { RBH: 8, RDE: 6, RSE: 6, RTA: 2, TRU: 6 },
	SPP: { RBH: 12, RDE: 6, RSE: 6, RTA: 2, TRU: 8 },
	TNP: { LBH: 6, LDE: 8, LSE: 12, TRU: 8 },
	UPF: { BBH: 8, BDE: 10, BSE: 10, BTA: 3, TRU: 8 },
	WEL: { BBH: 8, BSE: 6 },
	WPL: { BDE: 2, LBH: 6, LSE: 3, TRU: 6 },
	DEFAULT: { BSE: 4, BBH: 3, BDE: 3 },
};

// Use Material Badge coloring instead
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

export const NON_REPAIRABLE_BUILDING_TYPES = new Set([
	"HABITATION",
	"STORAGE",
	"CORE",
	"INFRASTRUCTURE",
]);

/**
 * Checks if a building platform is a production facility that degrades and requires repairs.
 * Filtered by building type:
 * - HABITATION (workforce) does not degrade / repair
 * - STORAGE does not degrade / repair
 * - CORE / INFRASTRUCTURE do not degrade / repair
 * - Only MANUFACTURING / PRODUCTION / RESOURCE EXTRACTION degrade and require repair.
 */
export function isRepairableBuilding(buildingType?: string): boolean {
	const upperType = (buildingType || "").trim().toUpperCase();

	if (!upperType) {
		return true;
	}

	return (
		!NON_REPAIRABLE_BUILDING_TYPES.has(upperType) &&
		(upperType === "MANUFACTURING" ||
			upperType === "PRODUCTION" ||
			upperType === "RESOURCES" ||
			upperType === "RESOURCE_EXTRACTION")
	);
}

export const CX_EXCHANGES = ["IC1", "NC1", "AI1", "CI1", "CORP"];
