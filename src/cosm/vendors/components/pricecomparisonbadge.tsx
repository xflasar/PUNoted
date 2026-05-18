import React from "react";
import { Box, Typography, Tooltip, Chip, alpha, useTheme } from "@mui/material";
import { Target } from "lucide-react";
import type { DiffStats } from "../utils/pricecomparison";

const PriceComparisonBadge = ({
	label,
	stats,
}: {
	label: string;
	stats: DiffStats;
}) => {
	const theme = useTheme();

	return (
		<Tooltip
			title={
				<Box sx={{ textAlign: "center" }}>
					<Typography
						variant="caption"
						sx={{ display: "block", fontWeight: "bold" }}
					>
						{label} Price Difference
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: theme.palette.text.secondary }}
					>
						{label} Price: {stats.refPrice} ICA
					</Typography>
				</Box>
			}
			slotProps={{
				tooltip: {
					sx: {
						backdropFilter: "blur(8px)",
						background: alpha(theme.palette.background.default, 0.95),
						border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						color: theme.palette.text.primary,
					},
				},
			}}
		>
			<Chip
				icon={stats.color === "neutral" ? <Target size={12} /> : undefined}
				label={stats.color === "neutral" ? label : `${label} ${stats.label}`}
				size="small"
				variant="outlined"
				sx={{
					fontSize: "0.7rem",
					"& .MuiChip-icon": { color: "inherit" },
					color:
						stats.color === "neutral"
							? theme.palette.primary.light
							: stats.isGood
								? theme.palette.success.light
								: theme.palette.error.light,
					borderColor:
						stats.color === "neutral"
							? alpha(theme.palette.primary.main, 0.3)
							: stats.isGood
								? alpha(theme.palette.success.main, 0.3)
								: alpha(theme.palette.error.main, 0.3),
					bgcolor:
						stats.color === "neutral"
							? alpha(theme.palette.primary.main, 0.06)
							: stats.isGood
								? alpha(theme.palette.success.main, 0.05)
								: alpha(theme.palette.error.main, 0.05),
				}}
			/>
		</Tooltip>
	);
};

export default PriceComparisonBadge;
