import React, { useCallback } from "react";
import {
	ResponsiveContainer,
	ComposedChart,
	Area,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ReferenceArea,
	Label,
} from "recharts";
import {
	Box,
	Typography,
	Paper,
	Divider,
	useTheme,
	alpha,
} from "@mui/material";
import { TrendingUp, TrendingDown, SwapHoriz } from "@mui/icons-material";
import { format, parseISO, differenceInDays } from "date-fns";
import { ChartDataPoint, TimeRange } from "../types";
import { formatCompactNumber } from "../helpers/formatnumber";

interface EnhancedChartDataPoint extends ChartDataPoint {
	topRevenueItem?: string;
	topVolumeItem?: string;
}

interface RevenueChartProps {
	data: EnhancedChartDataPoint[];
	range: TimeRange;
	currency?: string;
	onMouseDown?: (e: any) => void;
	onMouseMove?: (e: any) => void;
	onMouseUp?: () => void;
	refAreaLeft?: string | null;
	refAreaRight?: string | null;
}

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label, currency }: any) => {
	if (!active || !payload || !payload.length) return null;

	const data = payload[0].payload as EnhancedChartDataPoint;
	const profit = data.revenue - data.expenses;
	const profitColor = profit >= 0 ? "#00E676" : "#FF3D00";

	const Row = ({ label, value, color, icon }: any) => (
		<Box
			display="flex"
			justifyContent="space-between"
			alignItems="center"
			mb={0.5}
		>
			<Box display="flex" alignItems="center" gap={1}>
				{icon}
				<Typography
					variant="caption"
					sx={{ color: "#aaa", fontSize: "0.75rem" }}
				>
					{label}
				</Typography>
			</Box>
			<Typography
				variant="body2"
				fontWeight="bold"
				sx={{ color: color, fontSize: "0.85rem" }}
			>
				{value}
			</Typography>
		</Box>
	);

	return (
		<Paper
			elevation={4}
			sx={{
				minWidth: 220,
				p: 0,
				backgroundColor: alpha("#121212", 0.95),
				border: `1px solid ${alpha("#fff", 0.15)}`,
				borderRadius: 2,
				overflow: "hidden",
				boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
			}}
		>
			<Box sx={{ bgcolor: "rgba(255,255,255,0.05)", p: 1.5, pb: 1 }}>
				<Typography variant="subtitle2" sx={{ color: "#eee", fontWeight: 600 }}>
					{format(parseISO(label), "MMM dd, yyyy")}
				</Typography>
				<Typography variant="caption" sx={{ color: "#888" }}>
					{format(parseISO(label), "HH:mm")}
				</Typography>
			</Box>
			<Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
			<Box sx={{ p: 1.5 }}>
				<Row
					label="Revenue"
					value={formatCompactNumber(data.revenue)}
					color="#00E676"
					icon={
						<Box width={8} height={8} borderRadius="50%" bgcolor="#00E676" />
					}
				/>
				<Row
					label="Expenses"
					value={formatCompactNumber(data.expenses)}
					color="#FF3D00"
					icon={
						<Box width={8} height={8} borderRadius="50%" bgcolor="#FF3D00" />
					}
				/>
				<Row
					label="Net Profit"
					value={`${profit > 0 ? "+" : ""}${formatCompactNumber(profit)}`}
					color={profitColor}
					icon={
						<Box
							width={8}
							height={8}
							borderRadius="50%"
							border={`1px solid ${profitColor}`}
						/>
					}
				/>
				<Divider
					sx={{
						my: 1,
						borderColor: "rgba(255,255,255,0.1)",
						borderStyle: "dashed",
					}}
				/>
				<Row
					label="Volume"
					value={data.volume.toLocaleString()}
					color="#B388FF"
					icon={<SwapHoriz sx={{ fontSize: 14, color: "#651FFF" }} />}
				/>
			</Box>
			{(data.topRevenueItem || data.topVolumeItem) && (
				<Box sx={{ bgcolor: "rgba(101, 31, 255, 0.1)", p: 1, px: 1.5 }}>
					{data.topRevenueItem && (
						<Typography
							variant="caption"
							display="block"
							sx={{ color: "#ccc", fontSize: "0.7rem" }}
						>
							Top Rev:{" "}
							<span style={{ color: "#fff", fontWeight: "bold" }}>
								{data.topRevenueItem}
							</span>
						</Typography>
					)}
					{data.topVolumeItem && (
						<Typography
							variant="caption"
							display="block"
							sx={{ color: "#ccc", fontSize: "0.7rem" }}
						>
							Most Bought:{" "}
							<span style={{ color: "#fff", fontWeight: "bold" }}>
								{data.topVolumeItem}
							</span>
						</Typography>
					)}
				</Box>
			)}
		</Paper>
	);
};

export const RevenueChart = ({
	data,
	range,
	currency = "ICA",
	onMouseDown,
	onMouseMove,
	onMouseUp,
	refAreaLeft,
	refAreaRight,
}: RevenueChartProps) => {
	const colors = {
		revenue: "#00E676",
		expense: "#FF3D00",
		volume: "#651FFF",
		grid: "#555555",
		text: "#B0B0B0",
	};

	const xAxisTickFormatter = useCallback(
		(timeStr: string) => {
			const date = parseISO(timeStr);
			if (range === "24H") return format(date, "HH:mm");
			if (data.length > 0) {
				const start = parseISO(data[0].time);
				const end = parseISO(data[data.length - 1].time);
				const diff = differenceInDays(end, start);
				if (diff < 2) return format(date, "HH:mm");
				if (diff < 60) return format(date, "MM/dd");
				if (diff < 365) return format(date, "MMM");
				return format(date, "yyyy");
			}
			return format(date, "MM/dd");
		},
		[range, data],
	);

	return (
		<ResponsiveContainer width="100%" height="100%">
			<ComposedChart
				data={data}
				margin={{ top: 30, right: 10, left: 10, bottom: 5 }}
				onMouseDown={onMouseDown}
				onMouseMove={onMouseMove}
				onMouseUp={onMouseUp}
			>
				<defs>
					<linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor={colors.revenue} stopOpacity={0.4} />
						<stop offset="95%" stopColor={colors.revenue} stopOpacity={0.0} />
					</linearGradient>
					<linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor={colors.expense} stopOpacity={0.4} />
						<stop offset="95%" stopColor={colors.expense} stopOpacity={0.0} />
					</linearGradient>
					<linearGradient id="gradVolume" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={colors.volume} stopOpacity={0.3} />
						<stop offset="95%" stopColor={colors.volume} stopOpacity={0.05} />
					</linearGradient>
				</defs>

				{/* Visible Grid Lines - Increased Opacity */}
				<CartesianGrid
					strokeDasharray="3 3"
					vertical={false}
					stroke={colors.grid}
					opacity={0.4}
				/>

				<XAxis
					dataKey="time"
					tickFormatter={xAxisTickFormatter}
					minTickGap={40}
					tick={{ fontSize: 11, fill: colors.text }}
					axisLine={false}
					tickLine={false}
					dy={10}
				/>

				<YAxis
					yAxisId="left"
					tickFormatter={(val) => formatCompactNumber(val)}
					tick={{ fontSize: 11, fill: colors.text }}
					axisLine={false}
					tickLine={false}
					width={45}
				>
					<Label
						value={currency}
						offset={20}
						position="top"
						style={{ fontSize: 10, fontWeight: "bold", fill: colors.text }}
					/>
				</YAxis>

				<YAxis yAxisId="right" orientation="right" hide />

				<Tooltip
					content={<CustomTooltip currency={currency} />}
					cursor={{
						stroke: "rgba(255,255,255,0.3)",
						strokeWidth: 1,
						strokeDasharray: "4 4",
					}}
				/>
				<Legend
					verticalAlign="top"
					height={36}
					iconType="circle"
					iconSize={8}
					wrapperStyle={{
						top: 0,
						right: 0,
						left: 0,
						fontSize: "0.75rem",
						color: colors.text,
					}}
				/>

				<Bar
					yAxisId="right"
					dataKey="volume"
					fill="url(#gradVolume)"
					barSize={24}
					name="Volume"
					isAnimationActive={false}
					radius={[4, 4, 0, 0]}
				/>
				<Area
					yAxisId="left"
					type="monotone"
					dataKey="revenue"
					stroke={colors.revenue}
					strokeWidth={2}
					fill="url(#gradRevenue)"
					name="Revenue"
					isAnimationActive={false}
					activeDot={{
						r: 5,
						strokeWidth: 2,
						stroke: "#fff",
						fill: colors.revenue,
					}}
				/>
				<Area
					yAxisId="left"
					type="monotone"
					dataKey="expenses"
					stroke={colors.expense}
					strokeWidth={2}
					fill="url(#gradExpense)"
					name="Expenses"
					isAnimationActive={false}
					activeDot={{
						r: 5,
						strokeWidth: 2,
						stroke: "#fff",
						fill: colors.expense,
					}}
				/>

				{refAreaLeft && refAreaRight && (
					<ReferenceArea
						yAxisId="left"
						x1={refAreaLeft}
						x2={refAreaRight}
						strokeOpacity={0.3}
						fill={colors.volume}
						fillOpacity={0.2}
					/>
				)}
			</ComposedChart>
		</ResponsiveContainer>
	);
};
