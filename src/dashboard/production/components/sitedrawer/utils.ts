export const CARGO_BAYS = [
	{
		id: "TCB",
		name: "Tiny Cargo Bay (100t / 100m³)",
		weight: 100,
		volume: 100,
	},
	{
		id: "VSC",
		name: "Very Small Cargo Bay (250t / 250m³)",
		weight: 250,
		volume: 250,
	},
	{
		id: "SCB",
		name: "Small Cargo Bay (500t / 500m³)",
		weight: 500,
		volume: 500,
	},
	{
		id: "MCB",
		name: "Medium Cargo Bay (1000t / 1000m³)",
		weight: 1000,
		volume: 1000,
	},
	{
		id: "WCB",
		name: "High-load Cargo Bay (3000t / 1000m³)",
		weight: 3000,
		volume: 1000,
	},
	{
		id: "VCB",
		name: "High-volume Cargo Bay (1000t / 3000m³)",
		weight: 1000,
		volume: 3000,
	},
	{
		id: "LCB",
		name: "Large Cargo Bay (2000t / 2000m³)",
		weight: 2000,
		volume: 2000,
	},
	{
		id: "HCB",
		name: "Huge Cargo Bay (5000t / 5000m³)",
		weight: 5000,
		volume: 5000,
	},
];

export const MATERIAL_PROPS: Record<
	string,
	{ weight: number; volume: number }
> = {
	// Consumables & Basics
	H2O: { weight: 1.0, volume: 1.0 },
	O: { weight: 0.8, volume: 0.9 },
	DW: { weight: 1.0, volume: 1.0 },
	COF: { weight: 0.5, volume: 0.5 },
	PWO: { weight: 1.0, volume: 1.0 },
	PT: { weight: 0.8, volume: 0.8 },
	RAT: { weight: 0.4, volume: 0.4 },
	SF: { weight: 1.2, volume: 1.2 },
	EXO: { weight: 2.0, volume: 2.0 },
	GAL: { weight: 0.6, volume: 0.6 },
	HE3: { weight: 0.1, volume: 0.5 },
	AMM: { weight: 0.7, volume: 1.0 },
	REP: { weight: 5.0, volume: 2.5 },
	C: { weight: 1.2, volume: 1.0 },

	// Ores & Metals
	FE: { weight: 7.8, volume: 1.0 },
	AL: { weight: 2.7, volume: 1.0 },
	ALO: { weight: 3.5, volume: 1.0 },
	SI: { weight: 2.3, volume: 1.0 },
	MG: { weight: 1.7, volume: 1.0 },
	TI: { weight: 4.5, volume: 1.0 },
	LI: { weight: 0.5, volume: 1.0 },
	FLX: { weight: 2.5, volume: 1.0 },
	LST: { weight: 2.7, volume: 1.0 },

	// Products & Prefabs
	MCG: { weight: 1.5, volume: 1.5 },
	BEA: { weight: 3.0, volume: 2.0 },
	GRN: { weight: 0.5, volume: 0.5 },
	VEG: { weight: 0.4, volume: 0.4 },
	PSL: { weight: 10.0, volume: 10.0 },
	SIO: { weight: 2.6, volume: 1.0 },
	EL_P: { weight: 50.0, volume: 50.0 },
};

export const getMatProps = (
	ticker: string,
): { weight: number; volume: number } => {
	if (MATERIAL_PROPS[ticker]) return MATERIAL_PROPS[ticker];
	return { weight: 1.2, volume: 1.0 };
};

export const copyToClipboard = (text: string) => {
	if (navigator.clipboard && window.isSecureContext) {
		navigator.clipboard.writeText(text);
	} else {
		const ta = document.createElement("textarea");
		ta.value = text;
		ta.style.position = "fixed";
		ta.style.left = "-9999px";
		document.body.appendChild(ta);
		ta.select();
		document.execCommand("copy");
		document.body.removeChild(ta);
	}
};

export const formatNumber = (val: number) =>
	val >= 100000
		? `${(val / 1000).toFixed(1)} k`
		: val.toLocaleString(undefined, { maximumFractionDigits: 0 });

export const smartFormat = (val: number) => {
	if (val >= 1000000) {
		return {
			text: `${(val / 1000000).toFixed(1)} M`,
			full: val.toLocaleString("en-US", { maximumFractionDigits: 0 }),
			isAbbreviated: true,
		};
	}
	return {
		text: val.toLocaleString("en-US", { maximumFractionDigits: 0 }),
		full: "",
		isAbbreviated: false,
	};
};
