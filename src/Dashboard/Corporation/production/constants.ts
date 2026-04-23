export const categoryLists: Record<string, string[]> = {
    Agriculture: ["ALG","BEA","CAF","FOD","GRA","HCP","HER","HOP","MAI","MTP","MUS","NUT","PIB","PPA","RCO","RSI","VEG","VIT","GRN"],
    Alloy: ["ALR","AST","BGO","BOS","BRO","FAL","FET","RGO","WAL","WRH"],
    Chemicals: ["BAC","BL","BLE","CST","DDT","EES","ETC","FLX","IND","JUI","KRE","LCR","NAB","NR","NS","OLF","PFE","REA","SOI","TCL","THF"],
    "Construction Materials": ["CMK","EPO","GL","INS","MCG","MTC","NCS","NFI","NG","RG","SEA"],
    "Construction Parts": ["AEF","AIR","DEC","FC","FLO","FLP","GC","GV","LIT","MGC","MHL","PSH","RSH","TCS","TRU","TSH"],
    "Construction Prefabs": ["BBH","BDE","BSE","BTA","LBH","LDE","LSE","LTA","RBH","RDE","RSE","RTA","ABH","ADE","ASE","ATA","HSE"],
    "Consumable Bundles": ["PBU","SBU","TBU","EBU","CBU"],
    "Consumable Basic": ["DW","RAT","OVE","EXO","PT","MED","HMS","SCN","FIM","HSS","PDA","MEA","LC","WS"],
    "Consumable Luxury": ["COF","PWO","KOM","REP","ALE","SC","GIN","VG","WIN","NST"],
    Drones: ["DRF","DCH","CCD","RED","SDR","SRD","SUD"],
    "Electronic Devices": ["AAR","AWF","BID","BMF","BSC","BWS","HD","HOG","HPC","MHP","RAD","SAR"],
    "Electronic Parts": ["CD","DIS","FAN","MB","MPC","PCB","RAM","ROM","SEN","TPU","TRA"],
    "Electronic Pieces": ["BCO","BGC","CAP","HCC","LDI","MFK","MWF","SFK","SWF","TRN"],
    "Electronic Systems": ["ACS","ADS","CC","COM","CRU","FFC","LIS","LOG","STS","TAC","WR"],
    Elements: ["BE","C","CA","CL","ES","I","MG","NA","S","TA","TC","ZR"],
    "Energy Systems": ["CBL","CBM","CBS","POW","SOL","SP"],
    Fuels: ["SF","FF","VF"],
    Gases: ["AMM","AR","F","H","HE","HE3","KR","N","NE","O"],
    Infrastructure: ["GWS","PFG","SDM","SPT","SST","TOR","TRS"],
    Liquids: ["BTS","H2O","HEX","LES"],
    "Medical Equipment": ["ADR","BND","PK","SEQ","STR","TUB"],
    Metals: ["AL","AU","CU","FE","LI","RE","SI","STL","TI","W"],
    Minerals: ["BER","BOR","BRM","CLI","GAL","HAL","LST","MAG","MGS","SCR","TAI","TCO","TS","ZIR"],
    Ores: ["ALO","AUO","CUO","FEO","LIO","REO","SIO","TIO"],
    Plastics: ["DCL","DCM","DCS","PE","PG","PSL","PSM","PSS"],
    "Ship Engines": ["AEN","AFP","AFR","ANZ","BFP","BFR","CHA","ENG","FIR","FSE","GCH","GEN","GNZ","HNZ","HPR","HTE","HYR","LFE","LFP","MFE","NOZ","QCR","RAG","RCS","RCT","SFE","VOE","VOR"],
    "Ship Kits": ["TCB","VSC","SCB","MCB","LCB","WCB","VCB","HCB","SSL","MSL","LSL","SFL","MFL","LFL","VFT"],
    "Ship Parts": ["AGS","AHP","ATP","BGS","BHP","HAM","HHP","LHP","NV1","NV2","RHP","SSC","THP"],
    "Ship Shields": ["APT","ARP","AWH","BPT","BRP","BWH","SRP"],
    "Software Components": ["BAI","LD","MLI","NF","SA","SAL","WM"],
    "Software Systems": ["IDC","IMM","SNM","WAI"],
    "Software Tools": ["DA","DD","DV","EDC","NN","OS"],
    Textiles: ["CF","COT","CTF","KV","NL","SIL","TK"],
    "Unit Prefabs": ["BR1","BR2","BRS","BSU","CPU","CQL","CQM","CQS","CQT","DOU","FUN","HAB","LU","RDL","RDS","SU","TCU","WOR"],
    Utility: ["OFF","SUN","UTS"],
};

export const ALL_CATEGORIES = Object.keys(categoryLists).sort();

const TICKER_TO_CATEGORY_MAP = Object.entries(categoryLists).reduce((acc, [cat, tickers]) => {
    tickers.forEach(t => acc[t] = cat);
    return acc;
}, {} as Record<string, string>);

export const getCategory = (ticker: string) =>
    TICKER_TO_CATEGORY_MAP[ticker] || "Uncategorized";
