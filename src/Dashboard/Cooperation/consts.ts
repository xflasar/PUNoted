// --- Color Constants (Theme-Agnostic for utility functions) ---

export const COLOR_CONSTANTS = {
	SUCCESS: "#4CAF50",
	ERROR: "#E53935",
	WARNING: "#FF9800",
	GREY_TEXT: "#a0a0a0",
};

export const MIN_NODE_CARD_WIDTH = 280;
export const MIN_NODE_HEIGHT = 230;

// --- API & Storage Keys ---

export const API_MATERIALS_KEY = "globalMaterials_v2";
export const API_BUILDINGS_KEY = "globalBuildings_v1";

export const LOCAL_STORAGE_GROUPS_KEY = "cooperationFlows_minimalist_v9";
export const LOCAL_STORAGE_USER_KEY = "currentUserId";

export const AGRICULTURE_TICKERS = [
	"ALG",
	"BEA",
	"CAF",
	"FOD",
	"GRA",
	"HCP",
	"HER",
	"HOP",
	"MAI",
	"MTP",
	"MUS",
	"NUT",
	"PIB",
	"PPA",
	"RCO",
	"RSI",
	"VEG",
	"VIT",
	"GRN",
];

export const ALLOY_TICKERS = [
	"ALR",
	"AST",
	"BGO",
	"BOS",
	"BRO",
	"FAL",
	"FET",
	"RGO",
	"WAL",
	"WRH",
];

export const CHEMICALS_TICKERS = [
	"BAC",
	"BL",
	"BLE",
	"CST",
	"DDT",
	"EES",
	"ETC",
	"FLX",
	"IND",
	"JUI",
	"KRE",
	"LCR",
	"NAB",
	"NR",
	"NS",
	"OLF",
	"PFE",
	"REA",
	"SOI",
	"TCL",
	"THF",
];

export const CONSTRUCTION_MATERIALS_TICKERS = [
	"CMK",
	"EPO",
	"GL",
	"INS",
	"MCG",
	"MTC",
	"NCS",
	"NFI",
	"NG",
	"RG",
	"SEA",
];

export const CONSTRUCTION_PARTS_TICKERS = [
	"AEF",
	"AIR",
	"DEC",
	"FC",
	"FLO",
	"FLP",
	"GC",
	"GV",
	"LIT",
	"MGC",
	"MHL",
	"PSH",
	"RSH",
	"TCS",
	"TRU",
	"TSH",
];

export const CONSTRUCTION_PREFABS_TICKERS = [
	"BBH",
	"BDE",
	"BSE",
	"BTA",
	"LBH",
	"LDE",
	"LSE",
	"LTA",
	"RBH",
	"RDE",
	"RSE",
	"RTA",
	"ABH",
	"ADE",
	"ASE",
	"ATA",
	"HSE",
];

export const CONSUMABLE_BUNDLES_TICKERS = ["PBU", "SBU", "TBU", "EBU", "CBU"];

export const CONSUMABLE_BASIC_TICKERS = [
	"DW",
	"RAT",
	"OVE",
	"EXO",
	"PT",
	"MED",
	"HMS",
	"SCN",
	"FIM",
	"HSS",
	"PDA",
	"MEA",
	"LC",
	"WS",
];

export const CONSUMABLE_LUXURY_TICKERS = [
	"COF",
	"PWO",
	"KOM",
	"REP",
	"ALE",
	"SC",
	"GIN",
	"VG",
	"WIN",
	"NST",
];

export const DRONES_TICKERS = ["DRF", "DCH", "CCD", "RED", "SDR", "SRD", "SUD"];

export const ELECTRONIC_DEVICES_TICKERS = [
	"AAR",
	"AWF",
	"BID",
	"BMF",
	"BSC",
	"BWS",
	"HD",
	"HOG",
	"HPC",
	"MHP",
	"RAD",
	"SAR",
];

export const ELECTRONIC_PARTS_TICKERS = [
	"CD",
	"DIS",
	"FAN",
	"MB",
	"MPC",
	"PCB",
	"RAM",
	"ROM",
	"SEN",
	"TPU",
	"TRA",
];

export const ELECTRONIC_PIECES_TICKERS = [
	"BCO",
	"BGC",
	"CAP",
	"HCC",
	"LDI",
	"MFK",
	"MWF",
	"SFK",
	"SWF",
	"TRN",
];

export const ELECTRONIC_SYSTEMS_TICKERS = [
	"ACS",
	"ADS",
	"CC",
	"COM",
	"CRU",
	"FFC",
	"LIS",
	"LOG",
	"STS",
	"TAC",
	"WR",
];

export const ELEMENTS_TICKERS = [
	"BE",
	"C",
	"CA",
	"CL",
	"ES",
	"I",
	"MG",
	"NA",
	"S",
	"TA",
	"TC",
	"ZR",
];

export const ENERGY_SYSTEMS_TICKERS = ["CBL", "CBM", "CBS", "POW", "SOL", "SP"];

export const FUELS_TICKERS = ["SF", "FF", "VF"];

export const GASES_TICKERS = [
	"AMM",
	"AR",
	"F",
	"H",
	"HE",
	"HE3",
	"KR",
	"N",
	"NE",
	"O",
];

export const INFRASTRUCTURE_TICKERS = [
	"GWS",
	"PFG",
	"SDM",
	"SPT",
	"SST",
	"TOR",
	"TRS",
];

export const LIQUIDS_TICKERS = ["BTS", "H2O", "HEX", "LES"];

export const MEDICAL_EQUIPMENT_TICKERS = [
	"ADR",
	"BND",
	"PK",
	"SEQ",
	"STR",
	"TUB",
];

export const METALS_TICKERS = [
	"AL",
	"AU",
	"CU",
	"FE",
	"LI",
	"RE",
	"SI",
	"STL",
	"TI",
	"W",
];

export const MINERALS_TICKERS = [
	"BER",
	"BOR",
	"BRM",
	"CLI",
	"GAL",
	"HAL",
	"LST",
	"MAG",
	"MGS",
	"SCR",
	"TAI",
	"TCO",
	"TS",
	"ZIR",
];

export const ORES_TICKERS = [
	"ALO",
	"AUO",
	"CUO",
	"FEO",
	"LIO",
	"REO",
	"SIO",
	"TIO",
];

export const PLASTICS_TICKERS = [
	"DCL",
	"DCM",
	"DCS",
	"PE",
	"PG",
	"PSL",
	"PSM",
	"PSS",
];

export const SHIP_ENGINES_TICKERS = [
	"AEN",
	"AFP",
	"AFR",
	"ANZ",
	"BFP",
	"BFR",
	"CHA",
	"ENG",
	"FIR",
	"FSE",
	"GCH",
	"GEN",
	"GNZ",
	"HNZ",
	"HPR",
	"HTE",
	"HYR",
	"LFE",
	"LFP",
	"MFE",
	"NOZ",
	"QCR",
	"RAG",
	"RCS",
	"RCT",
	"SFE",
	"VOE",
	"VOR",
];

export const SHIP_KITS_TICKERS = [
	"TCB",
	"VSC",
	"SCB",
	"MCB",
	"LCB",
	"WCB",
	"VCB",
	"HCB",
	"SSL",
	"MSL",
	"LSL",
	"SFL",
	"MFL",
	"LFL",
	"VFT",
];

export const SHIP_PARTS_TICKERS = [
	"AGS",
	"AHP",
	"ATP",
	"BGS",
	"BHP",
	"HAM",
	"HHP",
	"LHP",
	"NV1",
	"NV2",
	"RHP",
	"SSC",
	"THP",
];

export const SHIP_SHIELDS_TICKERS = [
	"APT",
	"ARP",
	"AWH",
	"BPT",
	"BRP",
	"BWH",
	"SRP",
];

export const SOFTWARE_COMPONENTS_TICKERS = [
	"BAI",
	"LD",
	"MLI",
	"NF",
	"SA",
	"SAL",
	"WM",
];

export const SOFTWARE_SYSTEMS_TICKERS = ["IDC", "IMM", "SNM", "WAI"];

export const SOFTWARE_TOOLS_TICKERS = ["DA", "DD", "DV", "EDC", "NN", "OS"];

export const TEXTILES_TICKERS = ["CF", "COT", "CTF", "KV", "NL", "SIL", "TK"];

export const UNIT_PREFABS_TICKERS = [
	"BR1",
	"BR2",
	"BRS",
	"BSU",
	"CPU",
	"CQL",
	"CQM",
	"CQS",
	"CQT",
	"DOU",
	"FUN",
	"HAB",
	"LU",
	"RDL",
	"RDS",
	"SU",
	"TCU",
	"WOR",
];

export const UTILITY_TICKERS = ["OFF", "SUN", "UTS"];
