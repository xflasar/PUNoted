// --- Formatter Helper ---
export const formatCompactNumber = (
	num: number,
	isCurrency: boolean = false,
	currencySymbol: string = "ICA",
) => {
	// 1. Get the absolute value for checking magnitude
	let value = Math.abs(num);
	let suffix = "";

	// 2. Check magnitude against positive thresholds
	if (value >= 1000000000) {
		value = value / 1000000000;
		suffix = "b";
	} else if (value >= 1000000) {
		value = value / 1000000;
		suffix = "m";
	}

	// 3. Re-apply the negative sign if original number was negative
	if (num < 0) {
		value = value * -1;
	}

	const formattedValue = value.toLocaleString(undefined, {
		maximumFractionDigits: 1,
	});
	return isCurrency
		? `${formattedValue}${suffix} ${currencySymbol}`
		: `${formattedValue}${suffix}`;
};
