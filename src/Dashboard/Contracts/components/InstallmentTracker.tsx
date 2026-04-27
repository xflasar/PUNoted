import React, { memo } from "react";
import { Box, Stack, Tooltip, Typography, Zoom, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import dayjs from "dayjs";

interface InstallmentTrackerProps {
	total: number;
	done: number;
	color: string;
	startDate?: string;
	interval?: number;
}

const InstallmentTracker = memo(
	({ total, done, color, startDate, interval }: InstallmentTrackerProps) => {
		const theme = useTheme();
		if (!total || total > 24) return null;

		return (
			<Box sx={{ mt: 1, width: "100%" }}>
				<Stack
					direction="row"
					spacing={0.25}
					alignItems="center"
					sx={{
						height: 8,
						bgcolor: alpha(theme.palette.action.disabledBackground, 0.1),
						borderRadius: 0.5,
						p: 0.25,
					}}
				>
					{Array.from({ length: total }).map((_, i) => {
						const isCompleted = i < done;

						const estimatedDate =
							startDate && interval
								? dayjs(startDate)
										.add((i + 1) * interval, "day")
										.format("MMM D, YYYY")
								: null;

						const tooltipTitle = (
							<Box sx={{ textAlign: "center" }}>
								<Typography variant="caption" fontWeight={700} display="block">
									Installment #{i + 1}
								</Typography>
								{estimatedDate && (
									<Typography
										variant="caption"
										color="text.secondary"
										display="block"
									>
										Est: {estimatedDate}
									</Typography>
								)}
								{isCompleted ? (
									<Typography
										variant="caption"
										color="success.light"
										fontWeight={700}
									>
										PAID
									</Typography>
								) : (
									<Typography variant="caption" color="text.secondary">
										PENDING
									</Typography>
								)}
							</Box>
						);

						return (
							<Tooltip
								key={i}
								title={tooltipTitle}
								arrow
								placement="top"
								TransitionComponent={Zoom}
							>
								<Box
									sx={{
										flex: 1,
										height: "100%",
										borderRadius: 0.25,
										bgcolor: isCompleted
											? color
											: alpha(theme.palette.text.disabled, 0.15),
										transition: "all 0.2s",
										cursor: "help",
										"&:hover": {
											transform: "scaleY(1.4)",
											bgcolor: isCompleted
												? color
												: alpha(theme.palette.text.primary, 0.3),
										},
									}}
								/>
							</Tooltip>
						);
					})}
				</Stack>
			</Box>
		);
	},
);

export default InstallmentTracker;
