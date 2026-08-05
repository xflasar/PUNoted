import React from "react";
import { Box, Paper, Typography, Grid, useTheme } from "@mui/material";
import type { TickerDetail } from "./types";

export interface StatsSummaryProps {
	detail: TickerDetail | null;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ detail }) => {
	const theme = useTheme();

	const items = [
		{
			label: "Ask Price",
			val: detail?.askprice ? `${detail.askprice.toLocaleString()}` : "-",
		},
		{
			label: "Bid Price",
			val: detail?.bidprice ? `${detail.bidprice.toLocaleString()}` : "-",
		},
		{
			label: "High",
			val: detail?.high ? `${detail.high.toLocaleString()}` : "-",
		},
		{ label: "Low", val: detail?.low ? `${detail.low.toLocaleString()}` : "-" },
		{
			label: "Volume",
			val: detail?.volume ? `${detail.volume.toLocaleString()}` : "-",
		},
		{
			label: "Traded",
			val: detail?.traded ? `${detail.traded.toLocaleString()}` : "-",
		},
		{
			label: "All-Time High",
			val: detail?.alltimehigh ? `${detail.alltimehigh.toLocaleString()}` : "-",
		},
		{
			label: "All-Time Low",
			val: detail?.alltimelow ? `${detail.alltimelow.toLocaleString()}` : "-",
		},
	];

	return (
		<Paper
			elevation={3}
			sx={{
				p: 2,
				background: "rgba(16, 16, 32, 0.5)",
				border: "1px solid rgba(123, 104, 238, 0.35)",
				boxShadow:
					"0 0 35px rgba(123, 104, 238, 0.18), inset 0 0 20px rgba(123, 104, 238, 0.06)",
				backdropFilter: "blur(25px)",
				borderRadius: "16px",
			}}
		>
			<Typography
				variant="subtitle2"
				sx={{
					fontWeight: 800,
					color: "#7B68EE",
					textTransform: "uppercase",
					fontSize: "0.75rem",
					letterSpacing: "0.15em",
					mb: 1.5,
				}}
			>
				Market Data
			</Typography>

			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					gap: 2,
					justifyContent: "space-between",
				}}
			>
				{items.map((it) => (
					<Box sx={{ width: "30%", flex: 1 }} key={it.label}>
						<Box
							sx={{
								bgcolor: theme.palette.primary.dark,
								p: 1.25,
								borderRadius: "8px",
								border: "1px solid rgba(255, 255, 255, 0.08)",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								textAlign: "center",
							}}
						>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255, 255, 255, 0.5)",
									fontSize: "0.65rem",
									display: "block",
									mb: 0.25,
								}}
							>
								{it.label}
							</Typography>
							<Typography
								variant="body2"
								sx={{
									color: "white",
									fontWeight: 700,
									fontVariantNumeric: "tabular-nums",
									fontSize: "0.85rem",
								}}
							>
								{it.val}
							</Typography>
						</Box>
					</Box>
				))}
			</Box>
		</Paper>
	);
};
