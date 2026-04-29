export interface DiffStats {
	value: number;
	label: string;
	isGood: boolean;
	color: "neutral" | "success" | "error";
	refPrice: number;
}

export const getDiffStats = (
	vendorPrice: number,
	refPrice: number | undefined,
	orderSide: "ask" | "bid",
): DiffStats | null => {
	if (!refPrice || refPrice === 0 || !vendorPrice) return null;

	const diff = ((vendorPrice - refPrice) / refPrice) * 100;
	const roundedDiff = Number(diff.toFixed(1));
	const normalizedDiff = Object.is(roundedDiff, -0) ? 0 : roundedDiff;
	const formatted = `${normalizedDiff > 0 ? "+" : ""}${normalizedDiff.toFixed(1)}%`;

	const isNeutral = normalizedDiff === 0;
	let isGood = false;
	if (!isNeutral) {
		if (orderSide === "ask") isGood = normalizedDiff < 0;
		else isGood = normalizedDiff > 0;
	}

	return {
		value: normalizedDiff,
		label: formatted,
		isGood,
		color: isNeutral ? "neutral" : isGood ? "success" : "error",
		refPrice,
	};
};
