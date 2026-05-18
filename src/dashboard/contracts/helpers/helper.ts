import { alpha } from "@mui/material/styles";

export const getStatusColor = (status: string, theme: any) => {
	switch (status) {
		case "FULFILLED":
			return theme.palette.success.main;
		case "OPEN":
			return theme.palette.info.main;
		case "BREACHED":
			return theme.palette.error.main;
		case "REJECTED":
			return theme.palette.error.main;
		case "TERMINATED":
			return theme.palette.error.main;
		case "CANCELLED":
			return theme.palette.text.disabled;
		case "PARTIALLY_FULFILLED":
			return theme.palette.warning.main;
		default:
			return theme.palette.text.primary;
	}
};

export const getStatusBg = (status: string, theme: any) => {
	return alpha(getStatusColor(status, theme), 0.15);
};

export const formatCurrency = (
	amount: number | string | undefined | null,
	currency: string = "ICA",
) => {
	if (amount === undefined || amount === null) return `0 ${currency}`;

	// 1. Ensure we have a number (handles API strings)
	const num = typeof amount === "string" ? parseFloat(amount) : amount;

	if (isNaN(num)) return `0 ${currency}`;

	// 2. Check if it's "effectively" an integer (handles 1000000.00000001)
	// We treat it as whole if it's within a tiny margin of an integer
	const isEffectivelyWhole = Math.abs(num - Math.round(num)) < 0.0001;

	// 3. Configure the formatter
	const formatter = new Intl.NumberFormat("en-US", {
		minimumFractionDigits: isEffectivelyWhole ? 0 : 2,
		maximumFractionDigits: isEffectivelyWhole ? 0 : 2,
	});

	return `${formatter.format(num)} ${currency}`;
};
