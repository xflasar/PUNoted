import React from "react";
import { Box, Paper, Typography, Grid, useTheme } from "@mui/material";
import type { TickerDetail } from "./types";

export interface StatsSummaryProps {
	detail: TickerDetail | null;
	currentItem?: Record<string, any>;
	exchange?: string;
}

export const StatsSummary: React.FC<StatsSummaryProps> = React.memo(
	({ detail, currentItem, exchange = "IC1" }) => {
		const theme = useTheme();

		const ex = exchange || "IC1";
		const askPx = detail?.askprice || currentItem?.[`${ex}-AskPrice`] || 0;
		const bidPx = detail?.bidprice || currentItem?.[`${ex}-BidPrice`] || 0;
		const avgPx = currentItem?.[`${ex}-Average`] || 0;

		const high =
			detail?.high || currentItem?.[`${ex}-7dAvg`] || avgPx || askPx || 0;
		const low =
			detail?.low || currentItem?.[`${ex}-30dAvg`] || avgPx || bidPx || 0;
		const volume = detail?.volume || 0;
		const traded = detail?.traded || 0;
		const alltimehigh = detail?.alltimehigh || high || 0;
		const alltimelow = detail?.alltimelow || low || 0;

		const formatVal = (num: number) => {
			if (!num || num === 0) return "-";
			return num >= 1000
				? num.toLocaleString(undefined, { maximumFractionDigits: 2 })
				: num.toFixed(2);
		};

		const items = [
			{ label: "Ask Price", val: formatVal(askPx) },
			{ label: "Bid Price", val: formatVal(bidPx) },
			{ label: "High", val: formatVal(high) },
			{ label: "Low", val: formatVal(low) },
			{ label: "Volume", val: formatVal(volume) },
			{ label: "Traded", val: formatVal(traded) },
			{ label: "All-Time High", val: formatVal(alltimehigh) },
			{ label: "All-Time Low", val: formatVal(alltimelow) },
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
						flexWrap: "wrap",
						gap: 1.5,
						justifyContent: "space-between",
					}}
				>
					{items.map((it) => (
						<Box
							sx={{
								width: {
									xs: "calc(50% - 6px)",
									sm: "calc(25% - 9px)",
									md: "calc(12.5% - 10px)",
								},
								flexGrow: 1,
							}}
							key={it.label}
						>
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
	},
);
