import React from "react";
import {
	Box,
	Typography,
	ToggleButtonGroup,
	ToggleButton,
	useTheme,
} from "@mui/material";
import { DollarSign, Package } from "lucide-react";
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	ReferenceLine,
	Tooltip as RechartsTooltip,
	Legend,
} from "recharts";
import { MATERIAL_COLORS } from "./utils";

interface DegradationChartProps {
	timelineGraphData: any[];
	chartTab: "cost" | "items";
	setChartTab: (val: "cost" | "items") => void;
	avgAge: number;
	timeOffset: number;
	optimalAge: number;
	selectedExchange: string;
	getCurrencyLabel: (ex: string) => string;
	materialKeys: string[];
	getMatPrice: (mat: string) => number;
}

export const DegradationChart: React.FC<DegradationChartProps> = ({
	timelineGraphData,
	chartTab,
	setChartTab,
	avgAge,
	timeOffset,
	optimalAge,
	selectedExchange,
	getCurrencyLabel,
	materialKeys,
	getMatPrice,
}) => {
	const theme = useTheme();

	const renderCustomTooltip = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			return (
				<Box
					sx={{
						bgcolor: "rgba(16, 16, 32, 0.95)",
						border: `1px solid ${theme.palette.primary.main}55`,
						p: 1.25,
						borderRadius: "8px",
						boxShadow: "0 6px 24px rgba(0,0,0,0.8)",
						display: "flex",
						flexDirection: "column",
						gap: 0.5,
						minWidth: 150,
						zIndex: 99999,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							fontWeight: 800,
							fontSize: "0.72rem",
							color: "rgba(255,255,255,0.5)",
							borderBottom: "1px solid rgba(255,255,255,0.08)",
							pb: 0.25,
							mb: 0.25,
						}}
					>
						Target Age: {label}d
					</Typography>
					{payload.map((item: any, idx: number) => {
						const isCondition = item.name.includes("Condition");
						const isProfit = item.name.includes("Profit");
						const isCost = item.name.includes("Cost");

						let valStr = "";
						if (isCondition) {
							valStr = `${item.value}%`;
						} else if (isProfit || isCost) {
							valStr = `${Number(item.value).toLocaleString()} ${getCurrencyLabel(selectedExchange)}`;
						} else {
							const qty = Number(item.value);
							const price = getMatPrice(item.name);
							const total = qty * price;
							valStr = `${qty.toLocaleString()} u (${total.toLocaleString()} ${getCurrencyLabel(selectedExchange)})`;
						}

						return (
							<Box
								key={idx}
								sx={{
									display: "flex",
									justifyContent: "space-between",
									gap: 2,
									alignItems: "center",
								}}
							>
								<Typography
									variant="caption"
									sx={{
										fontSize: "0.68rem",
										color: item.stroke || item.color || "rgba(255,255,255,0.7)",
										fontWeight: 700,
									}}
								>
									{item.name}
								</Typography>
								<Typography
									variant="caption"
									sx={{
										fontSize: "0.68rem",
										fontWeight: 800,
										color: "white",
										fontFamily: "monospace",
									}}
								>
									{valStr}
								</Typography>
							</Box>
						);
					})}
				</Box>
			);
		}
		return null;
	};

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					p: 0.75,
					px: 1.25,
					bgcolor: "rgba(0, 0, 0, 0.4)",
					border: "1px solid rgba(255, 255, 255, 0.06)",
					borderRadius: "6px",
				}}
			>
				<Typography
					variant="subtitle2"
					sx={{
						fontWeight: 800,
						fontSize: "0.8rem",
						color: theme.palette.primary.main,
					}}
				>
					DEGRADATION ANALYTICS & PROJECTION
				</Typography>

				<ToggleButtonGroup
					size="small"
					value={chartTab}
					exclusive
					onChange={(_, v) => v && setChartTab(v)}
					sx={{
						height: 24,
						bgcolor: "rgba(0,0,0,0.5)",
						border: "1px solid rgba(123, 104, 238, 0.2)",
						borderRadius: "6px",
						"& .MuiToggleButton-root": {
							py: 0,
							px: 1,
							fontSize: "0.68rem",
							fontWeight: 700,
							color: "rgba(255,255,255,0.6)",
							border: "none",
							"&.Mui-selected": { color: "white", bgcolor: "#7B68EE" },
						},
					}}
				>
					<ToggleButton value="cost">
						<DollarSign size={12} style={{ marginRight: 3 }} /> Repair & Profit
					</ToggleButton>
					<ToggleButton value="items">
						<Package size={12} style={{ marginRight: 3 }} /> Material Items (u)
					</ToggleButton>
				</ToggleButtonGroup>
			</Box>

			<Box
				sx={{
					width: "100%",
					height: 210,
					bgcolor: "rgba(0,0,0,0.3)",
					p: 1,
					borderRadius: "8px",
					border: "1px solid rgba(255,255,255,0.06)",
				}}
			>
				<ResponsiveContainer width="100%" height="100%">
					{chartTab === "cost" ? (
						<AreaChart
							data={timelineGraphData}
							margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
						>
							<defs>
								<linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#ffd700" stopOpacity={0.4} />
									<stop offset="95%" stopColor="#ffd700" stopOpacity={0.0} />
								</linearGradient>
							</defs>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="rgba(255,255,255,0.08)"
							/>
							<XAxis
								dataKey="day"
								type="number"
								domain={[0, 180]}
								stroke="rgba(255,255,255,0.5)"
								fontSize={11}
								tickFormatter={(v) => `${v}d`}
							/>
							<YAxis
								stroke={theme.palette.warning.main}
								fontSize={11}
								tickFormatter={(v) => v.toLocaleString()}
							/>
							<YAxis
								yAxisId="right"
								orientation="right"
								domain={[0, 100]}
								stroke="#69f0ae"
								fontSize={11}
								tickFormatter={(v) => `${v}%`}
							/>
							<RechartsTooltip content={renderCustomTooltip} />
							<Legend wrapperStyle={{ fontSize: "0.72rem", paddingTop: 4 }} />
							<Area
								type="monotone"
								dataKey="totalCost"
								name="Total Repair Cost ($)"
								stroke="#ffd700"
								strokeWidth={2.5}
								fillOpacity={1}
								fill="url(#costGrad)"
							/>
							<Line
								type="monotone"
								dataKey="dailyProfit"
								name="Projected Daily Profit (Est)"
								stroke="rgba(255,255,255,0.25)"
								strokeDasharray="4 4"
								strokeWidth={2}
								dot={false}
							/>
							<Line
								yAxisId="right"
								type="monotone"
								dataKey="conditionPct"
								name="Condition (%)"
								stroke="#69f0ae"
								strokeWidth={2.5}
								dot={false}
							/>
							<ReferenceLine
								x={Math.round(avgAge + timeOffset)}
								stroke="#7B68EE"
								strokeWidth={2}
								label={{
									value: "Target",
									fill: "#7B68EE",
									fontSize: 10,
									position: "top",
								}}
							/>
							<ReferenceLine
								x={60}
								stroke="#4caf50"
								strokeDasharray="3 3"
								label={{
									value: "60d Mark",
									fill: "#4caf50",
									fontSize: 9,
									position: "insideBottomLeft",
								}}
							/>
							<ReferenceLine
								x={90}
								stroke="#ff9800"
								strokeDasharray="3 3"
								label={{
									value: "90d Mark",
									fill: "#ff9800",
									fontSize: 9,
									position: "insideBottomLeft",
								}}
							/>
							<ReferenceLine
								x={optimalAge}
								stroke={theme.palette.primary.main}
								strokeDasharray="5 5"
								label={{
									value: `Optimal (${optimalAge}d)`,
									fill: theme.palette.primary.main,
									fontSize: 9,
									position: "insideTopLeft",
								}}
							/>
						</AreaChart>
					) : (
						<LineChart
							data={timelineGraphData}
							margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="rgba(255,255,255,0.08)"
							/>
							<XAxis
								dataKey="day"
								type="number"
								domain={[0, 180]}
								stroke="rgba(255,255,255,0.5)"
								fontSize={11}
								tickFormatter={(v) => `${v}d`}
							/>
							<YAxis
								stroke="#00e5ff"
								fontSize={11}
								tickFormatter={(v) => `${v} u`}
							/>
							<RechartsTooltip content={renderCustomTooltip} />
							<Legend wrapperStyle={{ fontSize: "0.72rem", paddingTop: 4 }} />
							<ReferenceLine
								x={Math.round(avgAge + timeOffset)}
								stroke="#7B68EE"
								strokeWidth={2}
								label={{
									value: "Target",
									fill: "#7B68EE",
									fontSize: 10,
									position: "top",
								}}
							/>
							<ReferenceLine
								x={60}
								stroke="#4caf50"
								strokeDasharray="3 3"
								label={{
									value: "60d Mark",
									fill: "#4caf50",
									fontSize: 9,
									position: "insideBottomLeft",
								}}
							/>
							<ReferenceLine
								x={90}
								stroke="#ff9800"
								strokeDasharray="3 3"
								label={{
									value: "90d Mark",
									fill: "#ff9800",
									fontSize: 9,
									position: "insideBottomLeft",
								}}
							/>
							<ReferenceLine
								x={optimalAge}
								stroke={theme.palette.primary.main}
								strokeDasharray="5 5"
								label={{
									value: `Optimal (${optimalAge}d)`,
									fill: theme.palette.primary.main,
									fontSize: 9,
									position: "insideTopLeft",
								}}
							/>
							{materialKeys.map((mat) => (
								<Line
									key={mat}
									type="monotone"
									dataKey={mat}
									name={mat}
									stroke={MATERIAL_COLORS[mat] || "#00e5ff"}
									strokeWidth={2}
									dot={false}
								/>
							))}
						</LineChart>
					)}
				</ResponsiveContainer>
			</Box>
		</Box>
	);
};
