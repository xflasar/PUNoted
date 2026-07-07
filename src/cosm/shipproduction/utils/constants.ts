// --- Material Specifications & CX Prices ---
export const MATERIAL_SPECS: Record<
	string,
	{ ticker: string; weight: number; cxPrice: number }
> = {
	// Selectable options
	STL_ENGINE_STANDARD: { ticker: "ENG", weight: 8, cxPrice: 45000 },
	STL_ENGINE_FUEL_SAVING: { ticker: "FSE", weight: 6, cxPrice: 58000 },
	STL_ENGINE_GLASS: { ticker: "GEN", weight: 5, cxPrice: 72000 },
	STL_ENGINE_ADVANCED: { ticker: "AEN", weight: 14, cxPrice: 95000 },
	STL_ENGINE_HYPERTHRUST: { ticker: "HTE", weight: 16, cxPrice: 150000 },

	STL_FUEL_TANK_SMALL: { ticker: "SSL", weight: 20, cxPrice: 15000 },
	STL_FUEL_TANK_MEDIUM: { ticker: "MSL", weight: 50, cxPrice: 38000 },
	STL_FUEL_TANK_LARGE: { ticker: "LSL", weight: 125, cxPrice: 75000 },

	FTL_REACTOR_STANDARD: { ticker: "RCT", weight: 7, cxPrice: 55000 },
	FTL_REACTOR_QUICK_CHARGE: { ticker: "QCR", weight: 14, cxPrice: 85000 },
	FTL_REACTOR_HIGH_POWER: { ticker: "HPR", weight: 16, cxPrice: 180000 },
	FTL_REACTOR_HYPER_POWER: { ticker: "HYR", weight: 25, cxPrice: 280000 },

	FTL_FUEL_TANK_SMALL: { ticker: "SFL", weight: 9, cxPrice: 25000 },
	FTL_FUEL_TANK_MEDIUM: { ticker: "MFL", weight: 24, cxPrice: 50000 },
	FTL_FUEL_TANK_LARGE: { ticker: "LFL", weight: 60, cxPrice: 95000 },

	VORTEX_REACTOR_STANDARD: { ticker: "VOR", weight: 35, cxPrice: 320000 },
	VORTEX_FUEL_TANK_STANDARD: { ticker: "VFT", weight: 1000, cxPrice: 140000 },

	CARGO_BAY_TINY: { ticker: "TCB", weight: 20, cxPrice: 12000 },
	CARGO_BAY_VERY_SMALL: { ticker: "VSC", weight: 35, cxPrice: 24000 },
	CARGO_BAY_SMALL: { ticker: "SCB", weight: 50, cxPrice: 48000 },
	CARGO_BAY_MEDIUM: { ticker: "MCB", weight: 100, cxPrice: 95000 },
	CARGO_BAY_LARGE: { ticker: "LCB", weight: 200, cxPrice: 180000 },
	CARGO_BAY_HIGH_LOAD: { ticker: "WCB", weight: 200, cxPrice: 240000 },
	CARGO_BAY_HIGH_VOLUME: { ticker: "VCB", weight: 200, cxPrice: 280000 },
	CARGO_BAY_HUGE: { ticker: "HCB", weight: 500, cxPrice: 550000 },

	HULL_PLATES_BASIC: { ticker: "BHP", weight: 9, cxPrice: 8500 },
	HULL_PLATES_LIGHTWEIGHT: { ticker: "LHP", weight: 4, cxPrice: 12000 },
	HULL_PLATES_REINFORCED: { ticker: "RHP", weight: 10, cxPrice: 15000 },
	HULL_PLATES_HARDENED: { ticker: "HHP", weight: 10, cxPrice: 18000 },
	HULL_PLATES_ADVANCED: { ticker: "AHP", weight: 10, cxPrice: 25000 },

	HEAT_SHIELD_BASIC: { ticker: "BPT", weight: 0.02, cxPrice: 14000 },
	HEAT_SHIELD_ADVANCED: { ticker: "APT", weight: 0.03, cxPrice: 28000 },

	WHIPPLE_SHIELD_BASIC: { ticker: "BWH", weight: 0.1, cxPrice: 16000 },
	WHIPPLE_SHIELD_ADVANCED: { ticker: "AWH", weight: 0.12, cxPrice: 32000 },

	GRAVITY_SHIELD_BASIC: { ticker: "STS", weight: 0.1, cxPrice: 22000 },

	RADIATION_SHIELD_BASIC: { ticker: "BRP", weight: 0.03, cxPrice: 15000 },
	RADIATION_SHIELD_ADVANCED: { ticker: "ARP", weight: 0.04, cxPrice: 30000 },
	RADIATION_SHIELD_SPECIALIZED: { ticker: "SRP", weight: 0.1, cxPrice: 60000 },

	REPAIR_DRONES_SMALL: { ticker: "RDS", weight: 50, cxPrice: 45000 },
	REPAIR_DRONES_LARGE: { ticker: "RDL", weight: 150, cxPrice: 98000 },

	HIGH_G_SEATS_BASIC: { ticker: "BGS", weight: 20, cxPrice: 35000 },
	HIGH_G_SEATS_ADVANCED: { ticker: "AGS", weight: 30, cxPrice: 70000 },

	// Auto-calculated derived items
	SSC: { ticker: "SSC", weight: 1, cxPrice: 1200 },
	FFC: { ticker: "FFC", weight: 50, cxPrice: 150000 },
	LFE: { ticker: "LFE", weight: 0.4, cxPrice: 85000 },
	MFE: { ticker: "MFE", weight: 0.2, cxPrice: 45000 },
	SFE: { ticker: "SFE", weight: 0.1, cxPrice: 25000 },

	BRS: { ticker: "BRS", weight: 150, cxPrice: 80000 },
	BR1: { ticker: "BR1", weight: 180, cxPrice: 140000 },
	BR2: { ticker: "BR2", weight: 280, cxPrice: 220000 },

	CQT: { ticker: "CQT", weight: 12.5, cxPrice: 25000 },
	CQS: { ticker: "CQS", weight: 25, cxPrice: 45000 },
	CQM: { ticker: "CQM", weight: 50, cxPrice: 75000 },
	CQL: { ticker: "CQL", weight: 75, cxPrice: 120000 },

	// Colony ship specific
	HAM: { ticker: "HAM", weight: 1200, cxPrice: 95000 },
};

export interface PredefinedPreset {
	id: string;
	name: string;
	price: number;
	shipClass: "REGULAR" | "COLONY_SHIP";
	selections: Record<string, string>;
}

export const STATIC_PRESETS: PredefinedPreset[] = [
	{
		id: "lcbftl",
		name: "LCB FTL",
		price: 4900000,
		shipClass: "REGULAR",
		selections: {
			STL_ENGINE: "STL_ENGINE_STANDARD",
			STL_FUEL_TANK: "STL_FUEL_TANK_SMALL",
			FTL_REACTOR: "FTL_REACTOR_STANDARD",
			FTL_FUEL_TANK: "FTL_FUEL_TANK_SMALL",
			VORTEX_REACTOR: "NONE",
			VORTEX_FUEL_TANK: "NONE",
			CARGO_BAY: "CARGO_BAY_LARGE",
			HULL_TYPE: "HULL_PLATES_BASIC",
			HEAT_SHIELD: "NONE",
			WHIPPLE_SHIELD: "NONE",
			GRAVITY_SHIELD: "NONE",
			RADIATION_SHIELD: "NONE",
			REPAIR_DRONES: "NONE",
			HIGH_G_SEATS: "NONE",
		},
	},
	{
		id: "lcbstl",
		name: "LCB STL",
		price: 2800000,
		shipClass: "REGULAR",
		selections: {
			STL_ENGINE: "STL_ENGINE_STANDARD",
			STL_FUEL_TANK: "STL_FUEL_TANK_SMALL",
			FTL_REACTOR: "NONE",
			FTL_FUEL_TANK: "NONE",
			VORTEX_REACTOR: "NONE",
			VORTEX_FUEL_TANK: "NONE",
			CARGO_BAY: "CARGO_BAY_LARGE",
			HULL_TYPE: "HULL_PLATES_BASIC",
			HEAT_SHIELD: "NONE",
			WHIPPLE_SHIELD: "NONE",
			GRAVITY_SHIELD: "NONE",
			RADIATION_SHIELD: "NONE",
			REPAIR_DRONES: "NONE",
			HIGH_G_SEATS: "NONE",
		},
	},
];

export const MOCK_CORP_COMPANIES = [
	"oog",
	"capital",
	"management",
	"galaxycorp",
	"infinitum",
	"solaris",
	"corp",
	"co",
];
export const MOCK_CORP_USERNAMES = [
	"admin",
	"ceo",
	"captain",
	"corporate",
	"member",
];

export interface FormSpec {
	key: string;
	label: string;
	tooltip: string;
	allowNone?: boolean;
}

export const FORM_SPECS: FormSpec[] = [
	{
		key: "STL_ENGINE",
		label: "STL Engine",
		tooltip:
			"Affects the ship’s thrust, i.e. maximum acceleration during STL flight, and its rate of STL fuel consumption.",
	},
	{
		key: "STL_FUEL_TANK",
		label: "STL fuel tank",
		tooltip: "Determines how much STL fuel the ship will be able to hold.",
	},
	{
		key: "FTL_REACTOR",
		label: "FTL Reactor",
		tooltip:
			"Affects the ship’s power, i.e. maximum speed gain from overcharging during FTL. More powerful reactors generally take longer to charge. Overcharging a reactor increases the damage taken during FTL flight.",
		allowNone: true,
	},
	{
		key: "FTL_FUEL_TANK",
		label: "FTL fuel tank",
		tooltip: "Determines how much FTL fuel the ship will be able to hold.",
		allowNone: true,
	},
	{
		key: "VORTEX_REACTOR",
		label: "Vortex reactor",
		tooltip:
			"A special reactor for colony ships making use of certain aspects of gateway travel technology.",
	},
	{
		key: "VORTEX_FUEL_TANK",
		label: "Vortex fuel tank",
		tooltip: "Determines how much Vortex fuel the ship will be able to hold.",
	},
	{
		key: "CARGO_BAY",
		label: "Cargo bay",
		tooltip:
			"Determines the total weight and volume of commodities the ship can carry.",
	},
	{
		key: "HULL_TYPE",
		label: "Hull plates",
		tooltip:
			"Hull plates differ in how well they shield the ship from damage, the maximum g-factor they can support, as well as their weight.",
	},
	{
		key: "HEAT_SHIELD",
		label: "Heat shielding",
		tooltip: "Reduces the damage taken from entering a planet’s atmosphere.",
		allowNone: true,
	},
	{
		key: "WHIPPLE_SHIELD",
		label: "Whipple Shielding",
		tooltip:
			"Reduces the damage taken from STL flight through meteoroid-dense systems.",
		allowNone: true,
	},
	{
		key: "GRAVITY_SHIELD",
		label: "Stability System",
		tooltip:
			"Prevents taking damage from landing on planets with unusually high or low gravity.",
		allowNone: true,
	},
	{
		key: "RADIATION_SHIELD",
		label: "Radiation Shielding",
		tooltip:
			"Reduces the damage taken from STL flight close to high-radiation stars.",
		allowNone: true,
	},
	{
		key: "REPAIR_DRONES",
		label: "Self-repair Drone Hub",
		tooltip: "Reduces the damage taken from any source.",
		allowNone: true,
	},
	{
		key: "HIGH_G_SEATS",
		label: "High-G Seats",
		tooltip:
			"Increases the maximum g-factor the ship can endure, thus increasing its maximum speed during STL flight.",
		allowNone: true,
	},
];

export interface DerivedSpec {
	key: string;
	label: string;
}

export const DERIVED_SPECS: DerivedSpec[] = [
	{ key: "STRUCTURE", label: "Struct" },
	{ key: "COMMAND_BRIDGE", label: "Bridge" },
	{ key: "CREW_QUARTERS", label: "Crew" },
	{ key: "FTL_FIELD_CONTROLLER", label: "FFC" },
	{ key: "FTL_EMITTER_SMALL", label: "SFE" },
	{ key: "FTL_EMITTER_MEDIUM", label: "MFE" },
	{ key: "FTL_EMITTER_LARGE", label: "LFE" },
	{ key: "HABITATION_MODULE", label: "Hab" },
];

export const SHIP_SYSTEMS_MOCK: Record<
	string,
	{
		option: string;
		label: string;
		materialName: string | null;
		modifierText?: string;
		performance?: Record<string, number>;
	}[]
> = {
	STL_ENGINE: [
		{
			option: "STL_ENGINE_STANDARD",
			label: "Standard STL Engine",
			materialName: "standardEngine",
			modifierText: "0.015 / s",
			performance: { speed: 8 },
		},
		{
			option: "STL_ENGINE_FUEL_SAVING",
			label: "Fuel-saving STL Engine",
			materialName: "fuelSavingEngine",
			modifierText: "0.0075 / s",
			performance: { speed: 6 },
		},
		{
			option: "STL_ENGINE_ADVANCED",
			label: "Advanced STL Engine",
			materialName: "advancedEngine",
			modifierText: "0.02 / s",
			performance: { speed: 12 },
		},
		{
			option: "STL_ENGINE_HYPERTHRUST",
			label: "Hyperthrust STL Engine",
			materialName: "hyperthrustEngine",
			modifierText: "0.03 / s",
			performance: { speed: 18 },
		},
		{
			option: "STL_ENGINE_GLASS",
			label: "Glass-based STL Engine",
			materialName: "glassEngine",
			modifierText: "0.015 / s",
			performance: { speed: 5 },
		},
	],
	STL_FUEL_TANK: [
		{
			option: "STL_FUEL_TANK_SMALL",
			label: "Small STL Tank Kit",
			materialName: "smallStlTank",
			modifierText: "1500 units",
		},
		{
			option: "STL_FUEL_TANK_MEDIUM",
			label: "Medium STL Tank Kit",
			materialName: "mediumStlTank",
			modifierText: "3500 units",
		},
		{
			option: "STL_FUEL_TANK_LARGE",
			label: "Large STL Tank Kit",
			materialName: "largeStlTank",
			modifierText: "8000 units",
		},
	],
	FTL_REACTOR: [
		{
			option: "FTL_REACTOR_STANDARD",
			label: "Standard FTL Reactor",
			materialName: "standardReactor",
			modifierText: "2400GW, charge factor 2",
			performance: { powerGen: 2400 },
		},
		{
			option: "FTL_REACTOR_QUICK_CHARGE",
			label: "Quick-charge Reactor",
			materialName: "quickChargeReactor",
			modifierText: "2000GW, charge factor 10",
			performance: { powerGen: 2000 },
		},
		{
			option: "FTL_REACTOR_HIGH_POWER",
			label: "High-power Reactor",
			materialName: "highPowerReactor",
			modifierText: "4800GW, charge factor 15",
			performance: { powerGen: 4800 },
		},
		{
			option: "FTL_REACTOR_HYPER_POWER",
			label: "Hyper-power Reactor",
			materialName: "hyperPowerReactor",
			modifierText: "7200GW, charge factor 30",
			performance: { powerGen: 7200 },
		},
	],
	FTL_FUEL_TANK: [
		{
			option: "FTL_FUEL_TANK_SMALL",
			label: "Small FTL Tank Kit",
			materialName: "smallFtlTank",
			modifierText: "300 units",
		},
		{
			option: "FTL_FUEL_TANK_MEDIUM",
			label: "Medium FTL Tank Kit",
			materialName: "mediumFtlTank",
			modifierText: "800 units",
		},
		{
			option: "FTL_FUEL_TANK_LARGE",
			label: "Large FTL Tank Kit",
			materialName: "largeFtlTank",
			modifierText: "2000 units",
		},
	],
	VORTEX_REACTOR: [
		{
			option: "VORTEX_REACTOR_STANDARD",
			label: "Vortex Reactor Unit",
			materialName: "vortexEngine",
			modifierText: "4000GW, charge factor 3",
			performance: { powerGen: 4000 },
		},
	],
	VORTEX_FUEL_TANK: [
		{
			option: "VORTEX_FUEL_TANK_STANDARD",
			label: "Vortex Fuel Tank Kit",
			materialName: "vortexFuelTank",
			modifierText: "1500 units",
		},
	],
	CARGO_BAY: [
		{
			option: "CARGO_BAY_TINY",
			label: "Tiny Cargo Bay Kit",
			materialName: "tinyCargoBay",
			modifierText: "100t/100m³",
			performance: { cargoCapacity: 100 },
		},
		{
			option: "CARGO_BAY_VERY_SMALL",
			label: "Very Small Cargo Kit",
			materialName: "verySmallCargoBay",
			modifierText: "250t/250m³",
			performance: { cargoCapacity: 250 },
		},
		{
			option: "CARGO_BAY_SMALL",
			label: "Small Cargo Bay Kit",
			materialName: "smallCargoBay",
			modifierText: "500t/500m³",
			performance: { cargoCapacity: 500 },
		},
		{
			option: "CARGO_BAY_MEDIUM",
			label: "Medium Cargo Bay Kit",
			materialName: "mediumCargoBay",
			modifierText: "1000t/1000m³",
			performance: { cargoCapacity: 1000 },
		},
		{
			option: "CARGO_BAY_LARGE",
			label: "Large Cargo Bay Kit",
			materialName: "largeCargoBay",
			modifierText: "2000t/2000m³",
			performance: { cargoCapacity: 2000 },
		},
		{
			option: "CARGO_BAY_HUGE",
			label: "Huge Cargo Bay Kit",
			materialName: "hugeCargoBay",
			modifierText: "5000t/5000m³",
			performance: { cargoCapacity: 5000 },
		},
		{
			option: "CARGO_BAY_HIGH_VOLUME",
			label: "High-volume Cargo Kit",
			materialName: "highVolumeCargoBay",
			modifierText: "1000t/3000m³",
			performance: { cargoCapacity: 3000 },
		},
		{
			option: "CARGO_BAY_HIGH_LOAD",
			label: "High-load Cargo Kit",
			materialName: "highLoadCargoBay",
			modifierText: "3000t/1000m³",
			performance: { cargoCapacity: 1000 },
		},
	],
	HULL_TYPE: [
		{
			option: "HULL_PLATES_BASIC",
			label: "Basic Hull Plate",
			materialName: "basicHullPlate",
			modifierText: "0% damage reduction",
		},
		{
			option: "HULL_PLATES_LIGHTWEIGHT",
			label: "Lightweight Plate",
			materialName: "lightweightHullPlate",
			modifierText: "-10% damage reduction",
		},
		{
			option: "HULL_PLATES_REINFORCED",
			label: "Reinforced Plate",
			materialName: "reinforcedHullPlate",
			modifierText: "+10% damage reduction",
			performance: { shieldStrength: 10 },
		},
		{
			option: "HULL_PLATES_HARDENED",
			label: "Hardened Plate",
			materialName: "hardenedHullPlate",
			modifierText: "+15% damage reduction",
			performance: { shieldStrength: 15 },
		},
		{
			option: "HULL_PLATES_ADVANCED",
			label: "Advanced Plate",
			materialName: "advancedHullPlate",
			modifierText: "+30% damage reduction",
			performance: { shieldStrength: 30 },
		},
	],
	HEAT_SHIELD: [
		{
			option: "HEAT_SHIELD_BASIC",
			label: "Basic Thermal Tile",
			materialName: "basicHeatShield",
			modifierText: "50% damage reduction",
		},
		{
			option: "HEAT_SHIELD_ADVANCED",
			label: "Advanced Thermal Tile",
			materialName: "advancedHeatShield",
			modifierText: "100% damage reduction",
		},
	],
	WHIPPLE_SHIELD: [
		{
			option: "WHIPPLE_SHIELD_BASIC",
			label: "Basic Whipple Shield",
			materialName: "basicWhippleShielding",
			modifierText: "50% damage reduction",
		},
		{
			option: "WHIPPLE_SHIELD_ADVANCED",
			label: "Advanced Whipple Shield",
			materialName: "advancedWhippleShielding",
			modifierText: "100% damage reduction",
		},
	],
	GRAVITY_SHIELD: [
		{
			option: "GRAVITY_SHIELD_BASIC",
			label: "Stability System",
			materialName: "stabilitySupportSystem",
			modifierText: "protected",
		},
	],
	RADIATION_SHIELD: [
		{
			option: "RADIATION_SHIELD_BASIC",
			label: "Basic Anti-rad Plate",
			materialName: "basicRadiationShielding",
			modifierText: "15% damage reduction",
		},
		{
			option: "RADIATION_SHIELD_ADVANCED",
			label: "Advanced Anti-rad Plate",
			materialName: "advancedRadiationShielding",
			modifierText: "35% damage reduction",
		},
		{
			option: "RADIATION_SHIELD_SPECIALIZED",
			label: "Specialized Anti-rad Plate",
			materialName: "specializedRadiationShielding",
			modifierText: "70% damage reduction",
		},
	],
	REPAIR_DRONES: [
		{
			option: "REPAIR_DRONES_SMALL",
			label: "Small Repair Drones",
			materialName: "smallShipRepairDroneUnit",
			modifierText: "5% damage reduction",
		},
		{
			option: "REPAIR_DRONES_LARGE",
			label: "Large Repair Drones",
			materialName: "largeShipRepairDroneUnit",
			modifierText: "10% damage reduction",
		},
	],
	HIGH_G_SEATS: [
		{
			option: "HIGH_G_SEATS_BASIC",
			label: "Basic High-G Seats",
			materialName: "basicHighgSeats",
			modifierText: "+5 max g-factor",
		},
		{
			option: "HIGH_G_SEATS_ADVANCED",
			label: "Advanced High-G Seats",
			materialName: "advancedHighgSeats",
			modifierText: "+12 max g-factor",
		},
	],
};
