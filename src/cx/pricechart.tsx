import React, { useState } from "react";
import {
	Box,
	Paper,
	Typography,
	Button,
	ButtonGroup,
	CircularProgress,
	TextField,
	Stack,
} from "@mui/material";
import {
	ResponsiveContainer,
	ComposedChart,
	Area,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	Brush,
} from "recharts";
import type { HistoryPoint } from "./types";

export interface PriceChartProps {
	ticker: string;
	exchange: string;
	history: HistoryPoint[];
	loading: boolean;
	days: number;
	onChangeDays: (days: number) => void;
	startDate: string;
	endDate: string;
	onCustomDateChange: (start: string, end: string) => void;
	currentPrice?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload && payload.length) {
		const formattedDate = label
			? new Date(label).toLocaleString()
			: "Unknown Time";
		return (
			<Box
				sx={{
					bgcolor: "rgba(16, 16, 32, 0.95)",
					border: "1px solid rgba(123, 104, 238, 0.4)",
					p: 1.5,
					borderRadius: "10px",
					boxShadow: "0 0 20px rgba(123, 104, 238, 0.3)",
				}}
			>
				<Typography
					variant="caption"
					sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block", mb: 0.5 }}
				>
					{formattedDate}
				</Typography>
				{payload.map((item: any) => (
					<Typography
						key={item.name}
						variant="body2"
						sx={{ color: item.color, fontWeight: 600, fontSize: "0.75rem" }}
					>
						{item.name}:{" "}
						{typeof item.value === "number"
							? item.value.toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})
							: item.value}
					</Typography>
				))}
			</Box>
		);
	}
	return null;
};

export const PriceChart: React.FC<PriceChartProps> = ({
	ticker,
	exchange,
	history,
	loading,
	days,
	onChangeDays,
	startDate,
	endDate,
	onCustomDateChange,
	currentPrice,
}) => {
	const [showCustomPicker, setShowCustomPicker] = useState<boolean>(
		days === -1,
	);

	const chartData = React.useMemo(() => {
		const points = history.map((pt) => ({
			time: pt.timestamp,
			Ask: pt.askprice || null,
			Bid: pt.bidprice || null,
			Volume: pt.supply || 0,
		}));

		if (currentPrice != null && currentPrice > 0 && points.length > 0) {
			const lastPt = points[points.length - 1];
			const nowIso = new Date().toISOString();
			const lastTime = lastPt.time ? new Date(lastPt.time).getTime() : 0;
			if (Date.now() - lastTime > 60000) {
				points.push({
					time: nowIso,
					Ask: currentPrice,
					Bid: currentPrice,
					Volume: lastPt.Volume || 0,
				});
			}
		}
		return points;
	}, [history, currentPrice]);

	const displayChartData = React.useMemo(() => {
		if (!chartData || chartData.length <= 90) return chartData;
		const maxPts = 90;
		const step = (chartData.length - 1) / (maxPts - 1);
		const sampled: any[] = [];
		for (let i = 0; i < maxPts; i++) {
			sampled.push(chartData[Math.round(i * step)]);
		}
		return sampled;
	}, [chartData]);

	const handleTimeframeClick = (d: number) => {
		if (d === -1) {
			setShowCustomPicker(true);
			onChangeDays(-1);
		} else {
			setShowCustomPicker(false);
			onChangeDays(d);
		}
	};

	return (
		<Paper
			elevation={0}
			sx={{
				p: 0,
				background: "transparent",
				border: "none",
				boxShadow: "none",
				backdropFilter: "none",
				display: "flex",
				flexDirection: "column",
				height: "100%",
				minHeight: 270,
			}}
		>
			{/* Header with Ticker & Controls */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 2,
					flexWrap: "wrap",
					gap: 1.5,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
					<Typography
						variant="h5"
						sx={{ fontWeight: 800, color: "white", letterSpacing: "0.02em" }}
					>
						{ticker}
					</Typography>
					<Typography
						variant="subtitle2"
						sx={{ color: "#7B68EE", fontWeight: 700 }}
					>
						({exchange})
					</Typography>
					{currentPrice != null && currentPrice > 0 && (
						<Typography
							variant="h6"
							sx={{ color: "#69f0ae", fontWeight: 700, ml: 1 }}
						>
							{currentPrice.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}{" "}
							<Typography
								component="span"
								variant="caption"
								sx={{ color: "rgba(255,255,255,0.5)" }}
							>
								ICA
							</Typography>
						</Typography>
					)}
				</Box>

				{/* Timeframe Controls */}
				<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
					{showCustomPicker && (
						<Stack
							direction="row"
							spacing={1}
							alignItems="center"
							justifyContent="space-between"
						>
							<TextField
								type="date"
								size="small"
								value={startDate}
								onChange={(e) => onCustomDateChange(e.target.value, endDate)}
								sx={{
									width: 140,
									"& .MuiOutlinedInput-root": {
										bgcolor: "rgba(0,0,0,0.4)",
										color: "white",
										fontSize: "0.75rem",
										height: 32,
										"& fieldset": { borderColor: "rgba(123, 104, 238, 0.3)" },
									},
								}}
							/>
							<Typography
								variant="caption"
								sx={{ color: "rgba(255,255,255,0.5)" }}
							>
								to
							</Typography>
							<TextField
								type="date"
								size="small"
								value={endDate}
								onChange={(e) => onCustomDateChange(startDate, e.target.value)}
								sx={{
									width: 140,
									"& .MuiOutlinedInput-root": {
										bgcolor: "rgba(0,0,0,0.4)",
										color: "white",
										fontSize: "0.75rem",
										height: 32,
										"& fieldset": { borderColor: "rgba(123, 104, 238, 0.3)" },
									},
								}}
							/>
						</Stack>
					)}

					<ButtonGroup size="small" variant="outlined">
						{[
							{ label: "7D", value: 7 },
							{ label: "30D", value: 30 },
							{ label: "ALL", value: 365 },
							{ label: "CUSTOM", value: -1 },
						].map((item) => (
							<Button
								key={item.label}
								onClick={() => handleTimeframeClick(item.value)}
								sx={{
									color:
										days === item.value ? "white" : "rgba(255,255,255,0.6)",
									bgcolor: days === item.value ? "#7B68EE" : "transparent",
									borderColor: "rgba(123, 104, 238, 0.3) !important",
									fontWeight: 700,
									fontSize: "0.75rem",
									px: 1.5,
									boxShadow:
										days === item.value
											? "0 0 12px rgba(123, 104, 238, 0.5)"
											: "none",
									"&:hover": {
										bgcolor:
											days === item.value
												? "#6a5acd"
												: "rgba(123, 104, 238, 0.15)",
									},
								}}
							>
								{item.label}
							</Button>
						))}
					</ButtonGroup>
				</Stack>
			</Box>

			{/* Chart Area */}
			<Box
				sx={{
					flex: 1,
					width: "100%",
					position: "relative",
					minHeight: 280,
				}}
			>
				{loading ? (
					<Box
						sx={{
							display: "flex",
							height: "100%",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<CircularProgress size={32} sx={{ color: "#7B68EE" }} />
					</Box>
				) : displayChartData.length === 0 ? (
					<Box
						sx={{
							display: "flex",
							height: "100%",
							alignItems: "center",
							justifyContent: "center",
							color: "rgba(255,255,255,0.4)",
						}}
					>
						<Typography variant="body2">
							No historical snapshots recorded for {ticker}
						</Typography>
					</Box>
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart
							data={displayChartData}
							margin={{ top: 0, right: -20, left: 0, bottom: 0 }}
						>
							<defs>
								<linearGradient id="askGrad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#ff5252" stopOpacity={0.4} />
									<stop offset="95%" stopColor="#ff5252" stopOpacity={0.0} />
								</linearGradient>
								<linearGradient id="bidGrad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#69f0ae" stopOpacity={0.4} />
									<stop offset="95%" stopColor="#69f0ae" stopOpacity={0.0} />
								</linearGradient>
							</defs>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="rgba(255,255,255,0.06)"
							/>
							<XAxis
								dataKey="time"
								tickFormatter={(tick) =>
									tick
										? new Date(tick).toLocaleDateString(undefined, {
												month: "short",
												day: "numeric",
											})
										: ""
								}
								stroke="rgba(255,255,255,0.4)"
								style={{ fontSize: "0.7rem" }}
							/>
							<YAxis
								yAxisId="price"
								orientation="right"
								domain={["auto", "auto"]}
								stroke="rgba(255,255,255,0.4)"
								style={{ fontSize: "0.7rem" }}
								tickFormatter={(val) =>
									typeof val === "number" ? val.toLocaleString() : val
								}
							/>
							<YAxis yAxisId="vol" orientation="left" hide />
							<Tooltip
								content={<CustomTooltip />}
								cursor={{
									stroke: "rgba(123, 104, 238, 0.6)",
									strokeWidth: 1.5,
									strokeDasharray: "4 4",
								}}
							/>
							<Area
								yAxisId="price"
								type="monotone"
								dataKey="Ask"
								stroke="#ff5252"
								strokeWidth={2}
								fillOpacity={1}
								fill="url(#askGrad)"
								connectNulls
								isAnimationActive={false}
								activeDot={{
									r: 5,
									fill: "#ff5252",
									stroke: "#ffffff",
									strokeWidth: 2,
								}}
							/>
							<Area
								yAxisId="price"
								type="monotone"
								dataKey="Bid"
								stroke="#69f0ae"
								strokeWidth={2}
								fillOpacity={1}
								fill="url(#bidGrad)"
								connectNulls
								isAnimationActive={false}
								activeDot={{
									r: 5,
									fill: "#69f0ae",
									stroke: "#ffffff",
									strokeWidth: 2,
								}}
							/>
							<Bar
								yAxisId="vol"
								dataKey="Volume"
								fill="rgba(123, 104, 238, 0.3)"
								barSize={6}
								isAnimationActive={false}
							/>
							<Brush
								dataKey="time"
								height={14}
								stroke="#7b68ee"
								fill="rgba(4, 4, 10, 0.9)"
								tickFormatter={() => ""}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				)}
			</Box>
		</Paper>
	);
};
