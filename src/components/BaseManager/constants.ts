export const EXPERT_BONUS = [0, 0.0306, 0.0696, 0.1248, 0.1974, 0.2840];
export const EXPERT_CATEGORIES = ["Agriculture", "Chemistry", "Construction", "Electronics", "Food Industries", "Fuel Refining", "Manufacturing", "Metallurgy", "Resource Extraction"];

export const FACTIONS = [
    "No faction",
    "Antares Initiative",
    "Castillo-Ito Mercantile",
    "Insitor Cooperative",
    "NEO Charter Exploration"
];

export const FACTION_BONUSES: Record<string, Record<string, number>> = {
    "antares initiative": { "electronics": 0.10 },
    "castillo-ito mercantile": { "manufacturing": 0.10 },
    "insitor cooperative": { "agriculture": 0.06, "food industries": 0.04 },
    "neo charter exploration": { "metallurgy": 0.04, "construction": 0.06 },
    "no faction": { "chemistry": 0.04, "fuel refining": 0.04, "resource extraction": 0.04 }
};

export const LUXURY_MULTIPLIERS: Record<number, number[]> = {
    0: [1.0],                                      
    1: [0.8667, 1.0],                              
    2: [0.7944, 0.8667, 1.0],                      
    3: [0.7445, 0.7944, 0.8667, 1.0],              
    4: [0.7080, 0.7445, 0.7944, 0.8667, 1.0]       
};

export const WORKER_NEEDS: Record<string, { essentials: string[], luxuries: string[] }> = {
    Pioneer: { essentials: ['RAT', 'DW', 'O2'], luxuries: [] },
    Settler: { essentials: ['RAT', 'DW', 'O2'], luxuries: ['REP'] },
    Technician: { essentials: ['RAT', 'DW', 'O2'], luxuries: ['REP', 'COF'] },
    Engineer: { essentials: ['RAT', 'DW', 'O2'], luxuries: ['REP', 'COF', 'SN'] },
    Scientist: { essentials: ['RAT', 'DW', 'O2'], luxuries: ['REP', 'COF', 'SN', 'SC'] }
};

export const FALLBACK_NEEDS: Record<string, { essentials: string[], luxuries: string[] }> = {
    Pioneer: { essentials: ['RAT', 'DW', 'O2'], luxuries: [] },
    Settler: { essentials: ['RAT', 'DW', 'O2'], luxuries: ['REP'] },
    Technician: { essentials: ['RAT', 'DW', 'O2'], luxuries: ['REP', 'COF'] },
    Engineer: { essentials: ['RAT', 'DW', 'O2'], luxuries: ['REP', 'COF', 'SN'] },
    Scientist: { essentials: ['RAT', 'DW', 'O2'], luxuries: ['REP', 'COF', 'SN', 'SC'] }
};

export const PERMIT_AREAS: Record<number, number> = { 1: 500, 2: 750, 3: 1000 };

export const FALLBACK_PRICES: Record<string, { market: number, corp: number }> = {
    'BSE': { market: 1500, corp: 1200 }, 'BBH': { market: 2000, corp: 1600 }, 'TRU': { market: 5000, corp: 4500 },
    'H2O': { market: 10, corp: 8 }, 'ENG': { market: 120, corp: 100 }, 'BIO': { market: 35, corp: 30 },
    'GAS': { market: 85, corp: 75 }, 'ORE': { market: 25, corp: 20 }, 'MTL': { market: 210, corp: 180 },
    'FEO': { market: 10, corp: 8 }, 'FE': { market: 120, corp: 100 }, 'STL': { market: 800, corp: 700 }, 'AIR': { market: 10000, corp: 9000 }
};

export const FALLBACK_BUILDINGS = [
    { ticker: 'FRM', name: 'Farm', type: 'production', area: 150, buildReq: [{ticker: 'BSE', amount: 20}, {ticker: 'TRU', amount: 2}], workers: { Pioneer: 50, Settler: 20 }, category: 'Agriculture' },
    { ticker: 'RIG', name: 'Rig', type: 'production', area: 100, buildReq: [{ticker: 'BSE', amount: 15}, {ticker: 'TRU', amount: 5}], workers: { Pioneer: 40, Technician: 10 }, category: 'Resource Extraction' },
    { ticker: 'SME', name: 'Smelter', type: 'production', area: 200, buildReq: [{ticker: 'BSE', amount: 30}, {ticker: 'TRU', amount: 8}], workers: { Settler: 40, Technician: 20 }, category: 'Metallurgy' },
    { ticker: 'PP1', name: 'Incinerator', type: 'production', area: 100, buildReq: [{ticker: 'BSE', amount: 10}], workers: { Pioneer: 30 }, category: 'Chemistry' },
    { ticker: 'HB1', name: 'Pioneer Hab', type: 'infrastructure', area: 50, buildReq: [{ticker: 'BBH', amount: 10}], supply: { Pioneer: 100 } },
    { ticker: 'HB2', name: 'Settler Hab', type: 'infrastructure', area: 50, buildReq: [{ticker: 'BBH', amount: 15}], supply: { Settler: 100 } },
    { ticker: 'HB3', name: 'Tech Hab', type: 'infrastructure', area: 50, buildReq: [{ticker: 'BBH', amount: 20}], supply: { Technician: 100 } },
    { ticker: 'HB4', name: 'Eng Hab', type: 'infrastructure', area: 50, buildReq: [{ticker: 'BBH', amount: 30}], supply: { Engineer: 100 } },
    { ticker: 'HB5', name: 'Sci Hab', type: 'infrastructure', area: 50, buildReq: [{ticker: 'BBH', amount: 40}], supply: { Scientist: 100 } },
    { ticker: 'STO', name: 'Storage', type: 'infrastructure', area: 100, buildReq: [{ticker: 'BSE', amount: 15}], storageWeight: 1000, storageVolume: 1000 },
    { ticker: 'STA', name: 'Small Storage', type: 'infrastructure', area: 8, buildReq: [{ticker: 'BBH', amount: 3}, {ticker: 'BDE', amount: 3}, {ticker: 'BSE', amount: 1}], storageWeight: 500, storageVolume: 500 },
] as any[];

export const FALLBACK_RECIPES = [
    { id: 'R-FEO', name: 'Extract FEO', shortName: 'FEO [Ext]', duration: 1000, madeIn: 'EXT', ticker: 'FEO', inputs: [], outputs: [{ ticker: 'FEO', amount: 1 }] },
    { id: 'R-FE', name: 'Smelt FE', shortName: 'FE [FEO]', duration: 1000, madeIn: 'SME', ticker: 'FE', inputs: [{ ticker: 'FEO', amount: 10 }], outputs: [{ ticker: 'FE', amount: 1 }] },
];