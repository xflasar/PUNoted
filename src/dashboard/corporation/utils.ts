import type { Theme } from "@mui/material";

/**
 * Formats a number with compact notation if it exceeds the threshold, otherwise standard formatting.
 */
export const formatSmartNumber = (num: number, threshold = 1000000) => {
	if (Math.abs(num) >= threshold) {
		return new Intl.NumberFormat("en-US", {
			notation: "compact",
			compactDisplay: "short",
			maximumFractionDigits: 1,
		}).format(num);
	}
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(num);
};

/**
 * Formats a number with exact precision (no fractional digits).
 */
export const formatExactNumber = (num: number) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(num);

/**
 * Determines if a user's last active time is considered stale (e.g., older than 3 days).
 */
export const isUserStale = (lastActive?: string) => {
	if (!lastActive) return false;
	const diff = new Date().getTime() - new Date(lastActive).getTime();
	return diff >= 3 * 24 * 60 * 60 * 1000;
};

/**
 * Returns a theme-appropriate color based on whether a net value is positive, negative, or zero.
 */
export const getNetColor = (net: number, theme: Theme) =>
	net > 0
		? theme.palette.success.main
		: net < 0
			? theme.palette.error.main
			: theme.palette.text.secondary;
