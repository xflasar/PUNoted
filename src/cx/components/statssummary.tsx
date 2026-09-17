import React from "react";
import { Box, Grid, Paper, Typography, useTheme } from "@mui/material";
import type { HistoryPoint, TickerDetail } from "../types/types";

export interface StatsSummaryProps {
	detail: TickerDetail | null;
	currentItem?: Record<string, any>;
	exchange?: string;
	history?: HistoryPoint[];
}

export const StatsSummary: React.FC<StatsSummaryProps> = React.memo(
	({ detail, currentItem, exchange = "IC1", history = [] }) => {
		const theme = useTheme();

		const ex = exchange || "IC1";
		const askPx = detail?.askprice || currentItem?.[`${ex}-AskPrice`] || 0;
		const bidPx = detail?.bidprice || currentItem?.[`${ex}-BidPrice`] || 0;
		const avgPx = currentItem?.[`${ex}-Average`] || 0;

		const high =
			detail?.high || currentItem?.[`${ex}-7dAvg`] || avgPx || askPx || 0;
		const low =
			detail?.low || currentItem?.[`${ex}-30dAvg`] || avgPx || bidPx || 0;

		// Calculate total volume from history if detail.volume is absent/0
		const historyVolume = React.useMemo(() => {
			if (!history || history.length === 0) return 0;
			return history.reduce((acc, pt: any) => {
				const vol = pt.volume ?? pt.supply ?? pt.traded ?? pt.amount ?? 0;
				return acc + Math.abs(Number(vol) || 0);
			}, 0);
		}, [history]);

		const volume =
			detail?.volume ||
			historyVolume ||
			currentItem?.[`${ex}-Volume`] ||
			currentItem?.[`${ex}-Supply`] ||
			0;

		const traded =
			detail?.traded ||
			currentItem?.[`${ex}-Traded`] ||
			currentItem?.[`${ex}-TradeCount`] ||
			(history ? history.length : 0);

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
			{ label: "Volume (Period)", val: formatVal(volume) },
			{ label: "Traded", val: formatVal(traded) },
			{ label: "All-Time High", val: formatVal(alltimehigh) },
			{ label: "All-Time Low", val: formatVal(alltimelow) },
		];

		return (
			<Paper
				elevation={3}
				sx={{
					p: 2,
					background: "rgba(10, 10, 20, 0.4)",
					border: "1px solid rgba(123, 104, 238, 0.35)",
					boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
					backdropFilter: "blur(12px)",
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

				<Grid container spacing={1.5} sx={{ justifyContent: "space-evenly" }}>
					{items.map((it) => (
						<Grid item xs={6} sm={3} md={1.5} key={it.label}>
							<Box
								sx={{
									bgcolor: "transparent",
									p: 1.25,
									borderRadius: "8px",
									border: "1px solid rgba(123, 104, 238, 0.3)",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									textAlign: "center",
									minHeight: 64,
									height: "100%",
									transition: "all 0.2s ease",
									"&:hover": {
										borderColor: "#7B68EE",
										bgcolor: "rgba(123, 104, 238, 0.1)",
									},
								}}
							>
								<Typography
									variant="caption"
									sx={{
										color: "rgba(255, 255, 255, 0.6)",
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
						</Grid>
					))}
				</Grid>
			</Paper>
		);
	},
);
