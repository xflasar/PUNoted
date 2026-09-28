export interface CargoBay {
	id: string;
	label: string;
	volume: number;
	weight: number;
}

export const CARGO_BAYS: CargoBay[] = [
	{ id: "STL_SMALL", label: "STL Small", volume: 500, weight: 500 },
	{ id: "STL_MEDIUM", label: "STL Medium", volume: 2000, weight: 2000 },
	{ id: "STL_LARGE", label: "STL Large", volume: 10000, weight: 10000 },
	{ id: "FTL_SMALL", label: "FTL Small", volume: 100, weight: 100 },
	{ id: "FTL_MEDIUM", label: "FTL Medium", volume: 500, weight: 500 },
	{ id: "FTL_LARGE", label: "FTL Large", volume: 2000, weight: 2000 },
];

export const copyToClipboard = (text: string) =>
	navigator.clipboard.writeText(text);

export interface MaterialProp {
	volume: number;
	weight: number;
}

export const MATERIAL_PROPS: Record<string, MaterialProp> = {
	DW: { volume: 1.0, weight: 1.0 },
	RAT: { volume: 0.1, weight: 0.05 },
	O: { volume: 0.8, weight: 0.8 },
	H: { volume: 0.5, weight: 0.1 },
	FE: { volume: 0.1, weight: 0.7 },
	AL: { volume: 0.1, weight: 0.3 },
	CU: { volume: 0.1, weight: 0.85 },
	SI: { volume: 0.15, weight: 0.25 },
	C: { volume: 0.2, weight: 0.2 },
	COF: { volume: 0.2, weight: 0.1 },
	VEG: { volume: 0.3, weight: 0.1 },
	MEAT: { volume: 0.3, weight: 0.2 },
	PWO: { volume: 0.5, weight: 0.2 },
};

export const getMatProps = (ticker: string): MaterialProp => {
	return MATERIAL_PROPS[ticker] || { volume: 1.0, weight: 1.0 };
};
