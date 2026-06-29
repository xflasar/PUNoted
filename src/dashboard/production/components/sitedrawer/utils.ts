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
	H2O: { weight: 1, volume: 1 },
	FE: { weight: 10, volume: 1.5 },
	O: { weight: 0.8, volume: 0.9 },
	EL_P: { weight: 50, volume: 50 },
	SI: { weight: 6, volume: 1 },
	COF: { weight: 5, volume: 5 },
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
