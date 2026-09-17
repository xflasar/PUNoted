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
	BarChart,
	Bar,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	Brush,
} from "recharts";
import type { HistoryPoint } from "../types/types";
import MaterialBadge from "../../cosm/components/materialbadge";

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
	currentItem?: Record<string, any>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload && payload.length) {
		const data = payload[0]?.payload;
		if (!data || data.high == null || data.low == null) return null;

		const formattedDate = label
			? new Date(label).toLocaleDateString(undefined, {
				weekday: "short",
				month: "short",
				day: "numeric",
				year: "numeric",
			})
			: "Unknown Date";

		const isUp = (data.close ?? 0) >= (data.open ?? 0);
		const color = isUp ? "#26a69a" : "#ef5350";

		return (
			<Box
				sx={{
					bgcolor: "rgba(12, 12, 24, 0.95)",
					border: "1px solid rgba(123, 104, 238, 0.4)",
					p: 1.5,
					borderRadius: "10px",
					boxShadow: "0 0 20px rgba(0, 0, 0, 0.8)",
				}}
			>
				<Typography
					variant="caption"
					sx={{ color: "rgba(255, 255, 255, 0.6)", display: "block", mb: 0.5 }}
				>
					{formattedDate}
				</Typography>
				{data.open != null && (
					<Typography variant="body2" sx={{ color: "white", fontSize: "0.75rem" }}>
						Open: {data.open.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
					</Typography>
				)}
				<Typography variant="body2" sx={{ color: "#ef5350", fontWeight: 600, fontSize: "0.75rem" }}>
					High: {data.high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
				</Typography>
				<Typography variant="body2" sx={{ color: "#26a69a", fontWeight: 600, fontSize: "0.75rem" }}>
					Low: {data.low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
				</Typography>
				{data.close != null && (
					<Typography variant="body2" sx={{ color, fontWeight: 700, fontSize: "0.75rem" }}>
						Close: {data.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
					</Typography>
				)}
				{data.volume != null && data.volume > 0 && (
					<Typography variant="body2" sx={{ color: "#29b6f6", fontWeight: 600, fontSize: "0.75rem", mt: 0.5 }}>
						Volume: {data.volume.toLocaleString()}
					</Typography>
				)}
			</Box>
		);
	}
	return null;
};

// TradingView Style Standard Candlestick Component
const CandlestickBar = (props: any) => {
	const { x, y, width, height, payload } = props;
	if (!payload || payload.high == null || payload.low == null || payload.high <= 0 || payload.low <= 0) {
		return null;
	}

	const open = payload.open;
	const close = payload.close;
	const high = payload.high;
	const low = payload.low;

	if (open == null || close == null) return null;

	const isUp = close >= open;
	const color = isUp ? "#26a69a" : "#ef5350";

	const candleWidth = Math.max(Math.min(width * 0.65, 12), 3);
	const cx = x + width / 2;

	const h = height || 0;
	const yHigh = y;
	const yLow = y + h;

	const range = high - low;
	const yOpen = range > 0 ? yLow - ((open - low) / range) * h : yHigh;
	const yClose = range > 0 ? yLow - ((close - low) / range) * h : yHigh;

	const yBodyTop = Math.min(yOpen, yClose);
	const yBodyBottom = Math.max(yOpen, yClose);
	const bodyHeight = Math.max(Math.abs(yBodyBottom - yBodyTop), 2);

	return (
		<g className="recharts-candlestick">
			{/* High to Low Wick Line */}
			<line
				x1={cx}
				y1={yHigh}
				x2={cx}
				y2={Math.max(yLow, yHigh + 2)}
				stroke={color}
				strokeWidth={1.5}
			/>
			{/* Open to Close Body Box */}
			<rect
				x={cx - candleWidth / 2}
				y={yBodyTop}
				width={candleWidth}
				height={bodyHeight}
				fill={color}
				stroke={color}
				strokeWidth={1}
				rx={0.5}
			/>
		</g>
	);
};

const PriceChartBase: React.FC<PriceChartProps> = ({
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
	currentItem,
}) => {
	const [showCustomPicker, setShowCustomPicker] = useState<boolean>(
		days === -1,
	);

	// Process history into standard OHLC Candlestick data points
	const chartData = React.useMemo(() => {
		const ex = exchange || "IC1";
		const liveAsk =
			currentItem?.[`${ex}-AskPrice`] ||
			currentItem?.[`${ex}-Average`] ||
			currentPrice ||
			0;
		const liveBid =
			currentItem?.[`${ex}-BidPrice`] ||
			currentItem?.[`${ex}-Average`] ||
			currentPrice ||
			0;
		const liveSupply =
			currentItem?.[`${ex}-AskAmt`] || currentItem?.[`${ex}-AskAvail`] || 0;

		const dateMap = new Map<string, { ask: number; bid: number; avg: number; vol: number }>();

		// Parse API history points
		console.log(history);
		history.forEach((pt) => {
			if (!pt.timestamp) return;
			const dateKey = pt.timestamp.split("T")[0];
			const ask = pt.askprice || 0;
			const bid = pt.bidprice || 0;
			const avg = pt.priceaverage || (ask + bid) / 2 || ask || bid;
			const vol = pt.supply || 0;
			console.log(pt);

			if (ask <= 0 && bid <= 0 && avg <= 0) return;

			if (!dateMap.has(dateKey)) {
				dateMap.set(dateKey, { ask, bid, avg, vol });
			} else {
				const existing = dateMap.get(dateKey)!;
				if (ask > 0) existing.ask = Math.max(existing.ask, ask);
				if (bid > 0) existing.bid = Math.min(existing.bid > 0 ? existing.bid : bid, bid);
				existing.avg = avg || existing.avg;
				existing.vol += vol;
			}
		});

		// Append today's live market snapshot
		const todayKey = new Date().toISOString().split("T")[0];
		if (!dateMap.has(todayKey) && (liveAsk > 0 || liveBid > 0)) {
			const avg = (liveAsk + liveBid) / 2 || liveAsk || liveBid;
			dateMap.set(todayKey, { ask: liveAsk, bid: liveBid, avg, vol: liveSupply });
		}

		// Sort dates chronologically
		const sortedDates = Array.from(dateMap.keys()).sort();

		// Calculate OHLC for days with data
		const candleDataMap = new Map<string, { time: string; open: number; high: number; low: number; close: number; volume: number }>();
		let prevClose: number | null = null;

		for (const dKey of sortedDates) {
			const item = dateMap.get(dKey)!;
			const close = item.avg || item.ask || item.bid;
			const open = prevClose != null ? prevClose : item.bid || close;
			const high = Math.max(item.ask || close, item.bid || close, open, close);
			const low = Math.min(
				item.bid > 0 ? item.bid : close,
				item.ask > 0 ? item.ask : close,
				open,
				close
			);

			prevClose = close;
			candleDataMap.set(dKey, {
				time: dKey,
				open,
				high,
				low,
				close,
				volume: item.vol,
			});
		}

		// Generate continuous date timeline for selected timeframe
		const numDays = days && days > 0 ? days : 30;
		const now = new Date();
		const result: any[] = [];

		for (let i = numDays - 1; i >= 0; i--) {
			const d = new Date(now);
			d.setDate(d.getDate() - i);
			const dateKey = d.toISOString().split("T")[0];
			const candle = candleDataMap.get(dateKey);

			if (candle) {
				result.push({
					...candle,
					range: [candle.low, candle.high],
				});
			} else {
				// Empty day slot (shows date on X-axis, leaves gap on chart)
				result.push({
					time: dateKey,
					open: null,
					high: null,
					low: null,
					close: null,
					volume: 0,
					range: null,
				});
			}
		}

		return result;
	}, [history, currentPrice, currentItem, exchange, days]);

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
				minHeight: 320,
			}}
		>
			{/* Header with Ticker & Controls */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 1.5,
					flexWrap: "wrap",
					gap: 1.5,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
					<Typography
						variant="h5"
						sx={{ fontWeight: 800, color: "white", letterSpacing: "0.02em" }}
					>
						<MaterialBadge ticker={ticker} />
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
							sx={{ color: "#26a69a", fontWeight: 700, ml: 1 }}
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
				<Stack sx={{ direction: "row", spacing: 1, alignItems: "center", flexWrap: "wrap" }}>
					{showCustomPicker && (
						<Stack
							sx={{ direction: "row", spacing: 1, alignItems: "center", justifyContent: "space-between" }}
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
									bgcolor:
										days === item.value
											? "#7B68EE"
											: "rgba(255, 255, 255, 0.04)",
									color: days === item.value ? "white" : "rgba(255,255,255,0.7)",
									borderColor: "rgba(123, 104, 238, 0.3)",
									fontWeight: 700,
									fontSize: "0.7rem",
									"&:hover": {
										bgcolor:
											days === item.value
												? "#6a5acd"
												: "rgba(123, 104, 238, 0.2)",
										borderColor: "#7B68EE",
									},
								}}
							>
								{item.label}
							</Button>
						))}
					</ButtonGroup>
				</Stack>
			</Box>

			{/* Chart Area Split: Top Panel (Candlesticks) + Bottom Panel (Volume) */}
			<Box sx={{ flex: 1, minHeight: 250, display: "flex", flexDirection: "column", gap: 1 }}>
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
				) : chartData.length === 0 ? (
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
							No historical snapshots recorded for {ticker} in the selected timeframe ({days === -1 ? "Custom Range" : `${days}d`})
						</Typography>
					</Box>
				) : (
					<>
						{/* Top Panel: Candlesticks & Price Trendline */}
						<Box sx={{ height: "72%", width: "100%" }}>
							<ResponsiveContainer width="100%" height="100%">
								<ComposedChart
									syncId="cxTerminalChart"
									data={chartData}
									margin={{ top: 10, right: 15, left: 0, bottom: 0 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="rgba(255,255,255,0.06)"
										vertical={false}
									/>
									<XAxis dataKey="time" hide />
									<YAxis
										yAxisId="price"
										orientation="right"
										domain={[
											(dataMin: number) => (isFinite(dataMin) && dataMin > 0 ? Math.floor(dataMin * 0.95) : "auto"),
											(dataMax: number) => (isFinite(dataMax) && dataMax > 0 ? Math.ceil(dataMax * 1.05) : "auto"),
										]}
										stroke="rgba(255,255,255,0.4)"
										style={{ fontSize: "0.7rem" }}
										tickFormatter={(val) => (typeof val === "number" ? val.toLocaleString() : val)}
									/>
									<Tooltip
										content={<CustomTooltip />}
										cursor={{ stroke: "rgba(255, 255, 255, 0.2)", strokeDasharray: "3 3" }}
									/>
									{/* Candlestick Layer */}
									<Bar
										yAxisId="price"
										dataKey="range"
										fill="none"
										stroke="none"
										shape={(props: any) => <CandlestickBar {...props} />}
										isAnimationActive={false}
									/>
									{/* Connecting Price Line */}
									<Line
										yAxisId="price"
										type="monotone"
										dataKey="close"
										stroke="#7B68EE"
										strokeWidth={2}
										strokeDasharray="4 4"
										dot={false}
										connectNulls
										isAnimationActive={false}
									/>
								</ComposedChart>
							</ResponsiveContainer>
						</Box>

						{/* Bottom Panel: Dedicated Volume Sub-chart */}
						<Box
							sx={{
								height: "28%",
								width: "100%",
								borderTop: "1px dashed rgba(123, 104, 238, 0.4)",
								pt: 1,
							}}
						>
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									syncId="cxTerminalChart"
									data={chartData}
									margin={{ top: 0, right: 15, left: 0, bottom: 0 }}
								>
									<CartesianGrid
										strokeDasharray="4 4"
										stroke="rgba(255,255,255,0.12)"
										vertical={false}
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
										style={{ fontSize: "0.68rem" }}
									/>
									<YAxis
										orientation="right"
										stroke="rgba(255,255,255,0.4)"
										style={{ fontSize: "0.65rem" }}
										tickFormatter={(val) =>
											typeof val === "number"
												? val >= 1000000
													? `${(val / 1000000).toFixed(0)}M`
													: val >= 1000
														? `${(val / 1000).toFixed(0)}K`
														: val.toString()
												: val
										}
									/>
									<Tooltip
										content={() => null}
										cursor={{ stroke: "rgba(123, 104, 238, 0.6)", strokeWidth: 1, strokeDasharray: "3 3", fill: "transparent" }}
									/>
									<Bar
										dataKey="volume"
										fill="#29b6f6"
										opacity={0.9}
										barSize={5}
										isAnimationActive={false}
									/>
									<Brush
										dataKey="time"
										height={12}
										stroke="#7b68ee"
										fill="rgba(4, 4, 10, 0.9)"
										tickFormatter={() => ""}
									/>
								</BarChart>
							</ResponsiveContainer>
						</Box>
					</>
				)}
			</Box>
		</Paper>
	);
};

export const PriceChart = React.memo(PriceChartBase);
