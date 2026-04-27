import type { TimeRange } from "../types"; // Adjust path to your CX types

export const getRangeDates = (range: TimeRange) => {
	const now = new Date();

	const end = new Date(now);
	const start = new Date(now);

	if (range === "24H") {
		// Snap to the next full hour for the end date, then go back 26 hours
		end.setMinutes(0, 0, 0);
		end.setHours(end.getHours() + 1);
		start.setTime(end.getTime() - 26 * 60 * 60 * 1000);
	} else {
		// For Daily ranges (7D, 30D), snap to the start of the next UTC day
		const currentDayUTC = now.getUTCDate();
		end.setUTCDate(currentDayUTC + 1);
		end.setUTCHours(0, 0, 0, 0);

		// Define how many days to look back
		const daysBack = range === "30D" ? 32 : 9; // Adding buffer days for chart padding
		start.setTime(end.getTime() - daysBack * 24 * 60 * 60 * 1000);
	}

	return {
		startDate: start.toISOString(),
		endDate: end.toISOString(),
	};
};
