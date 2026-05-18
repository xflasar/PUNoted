import React from "react";
import { Box, Typography, Stack, type Theme } from "@mui/material";
import { formatSmartNumber } from "../utils";

/**
 * ValueStack Component
 *
 * Displays a formatted stack of numbers typically representing a total amount,
 * followed by a breakdown of "Accurate" (A) and "Estimated" (E) values.
 * It intelligently scales the font sizes based on mobile or grid mode.
 */
export const ValueStack = React.memo(
	({
		displayTotal,
		accurate,
		estimated,
		isCompact,
		colorBase,
		isGridMode,
		isMobile,
		theme,
		stale,
	}: {
		displayTotal: string | React.ReactNode;
		accurate: number;
		estimated: number;
		isCompact: boolean;
		colorBase: string;
		isGridMode?: boolean;
		isMobile?: boolean;
		theme: Theme;
		stale?: boolean;
	}) => {
		// Determine the primary color for the total value based on the state (stale)
		// and the provided color base (success, error, or default disabled).
		const mainColor = stale
			? theme.palette.warning.main
			: colorBase === "success"
				? theme.palette.success.light
				: colorBase === "error"
					? theme.palette.error.light
					: theme.palette.text.disabled;

		// Responsive font sizing based on the current view mode and device size.
		const totalFontSize = isMobile || isGridMode ? "0.75rem" : "0.85rem";
		const subFontSize = "0.65rem";

		// Determines the threshold for abbreviating numbers (e.g. 1k instead of 1,000).
		// When in compact or grid mode, abbreviate all numbers (threshold 0).
		const breakdownThreshold = isCompact || isGridMode ? 0 : 9999999;

		// Pre-format the accurate and estimated breakdown numbers.
		const displayAccurate = formatSmartNumber(accurate, breakdownThreshold);
		const displayEstimated = formatSmartNumber(estimated, breakdownThreshold);

		return (
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-end",
					width: "100%",
					overflow: "hidden",
				}}
			>
				{/* Main Total Value Display */}
				<Typography
					variant="body2"
					noWrap
					sx={{
						fontSize: totalFontSize,
						fontWeight: 700,
						color: mainColor,
						lineHeight: 1.1,
						textShadow: "0px 0px 5px rgba(0,0,0,0.3)",
						mb: 0.25,
						textAlign: "right",
						width: "100%",
					}}
				>
					{displayTotal}
				</Typography>

				{/* Breakdown Section: Only shown if there are estimated values */}
				{estimated > 0 && (
					<Stack
						sx={{
							flexDirection: "column",
							alignItems: "flex-end",
							gap: 0,
							width: "100%",
						}}
					>
						{/* Accurate value breakdown: Only shown if there is an accurate portion */}
						{accurate > 0 && (
							<Typography
								variant="caption"
								noWrap
								sx={{
									fontSize: subFontSize,
									color: theme.palette.text.secondary,
									lineHeight: 1.1,
								}}
							>
								<span style={{ opacity: 0.5, marginRight: 2 }}>A:</span>
								{displayAccurate}
							</Typography>
						)}
						{/* Estimated value breakdown */}
						<Typography
							variant="caption"
							noWrap
							sx={{
								fontSize: subFontSize,
								color: theme.palette.secondary.main,
								fontStyle: "italic",
								lineHeight: 1.1,
							}}
						>
							<span style={{ opacity: 0.5, marginRight: 2 }}>E:</span>
							{displayEstimated}
						</Typography>
					</Stack>
				)}
			</Box>
		);
	},
);
