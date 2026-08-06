import { alpha } from "@mui/material";

export const SEMANTIC_COLORS = {
	neonPurple: "#7b68ee",
	neonBlue: "#60a5fa",
	neonGreen: "#4ade80",
	neonRed: "#f87171",
	neonGold: "#fbbf24",
	chartPalette: ["#7b68ee", "#60a5fa", "#4ade80", "#fbbf24", "#c084fc"],
};

export const formatCurrency = (val: number, decimals: number = 2) => {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(val);
};

export const compactFormatter = (value: number) => {
	if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
	if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
	return value.toString();
};

export const formatCompactTimestamp = (timestamp: string) => {
	const date = new Date(timestamp);
	return date.toLocaleString("en-US", {
		timeZone: "UTC",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
};
