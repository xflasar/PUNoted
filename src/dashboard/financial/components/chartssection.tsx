import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import {
	BarChart,
	Bar,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
	Legend,
	ReferenceLine,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import {
	formatCurrency,
	compactFormatter,
	SEMANTIC_COLORS,
} from "../utils/financeutils";
import { FlexCard } from "./sharedui";

export const LiquidityTrendChart = ({
	historyData,
	currency,
	loading,
}: any) => {
	return (
		<FlexCard sx={{ height: "100%" }}>
			<Box
				sx={{
					px: 2.5,
					py: 1.25,
					display: "flex",
					alignItems: "center",
					borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
				}}
			>
				<Typography
					fontWeight={800}
					fontSize="0.75rem"
					sx={{
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						color: "rgba(255,255,255,0.7)",
					}}
				>
					30-Day Liquidity Trend ({currency})
				</Typography>
			</Box>
			<Box
				sx={{
					flex: 1,
					px: 1,
					pb: 1,
					pt: 1.5,
					minHeight: 0,
					position: "relative",
				}}
			>
				{loading ? (
					<Box
						display="flex"
						flexDirection="column"
						justifyContent="center"
						alignItems="center"
						height="100%"
						width="100%"
					>
						<CircularProgress
							size={30}
							thickness={4}
							sx={{ color: "#7b68ee" }}
						/>
					</Box>
				) : historyData && historyData.length > 0 ? (
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart
							data={historyData}
							margin={{ top: 5, right: 15, left: -15, bottom: 0 }}
						>
							<defs>
								<linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#7b68ee" stopOpacity={0.4} />
									<stop offset="95%" stopColor="#7b68ee" stopOpacity={0.0} />
								</linearGradient>
							</defs>
							<CartesianGrid
								strokeDasharray="3 3"
								vertical={false}
								stroke="rgba(255, 255, 255, 0.04)"
							/>
							<XAxis
								dataKey="Date"
								tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
								axisLine={false}
								tickLine={false}
								dy={5}
							/>
							<YAxis
								tickFormatter={compactFormatter}
								tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
								axisLine={false}
								tickLine={false}
							/>
							<RechartsTooltip
								formatter={(value: number) => [
									formatCurrency(value),
									"Balance",
								]}
								contentStyle={{
									backgroundColor: "rgba(4, 4, 10, 0.95)",
									borderColor: "rgba(123, 104, 238, 0.35)",
									color: "#fff",
									borderRadius: "10px",
									padding: "8px 12px",
									fontSize: "0.75rem",
									boxShadow: "0 0 20px rgba(123, 104, 238, 0.25)",
									backdropFilter: "blur(20px)",
								}}
							/>
							<Area
								type="monotone"
								dataKey="Balance"
								stroke="#7b68ee"
								strokeWidth={2.5}
								fill="url(#colorBalance)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				) : (
					<Box
						display="flex"
						justifyContent="center"
						alignItems="center"
						height="100%"
						color="rgba(255,255,255,0.4)"
						fontSize="0.8rem"
					>
						Insufficient historical data
					</Box>
				)}
			</Box>
		</FlexCard>
	);
};

export const IncomeSourcesChart = ({ pieChartData, loading }: any) => {
	return (
		<FlexCard sx={{ height: "100%" }}>
			<Box
				sx={{
					px: 2.5,
					py: 1.25,
					borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
				}}
			>
				<Typography
					fontWeight={800}
					fontSize="0.75rem"
					sx={{
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						color: "rgba(255,255,255,0.7)",
					}}
				>
					30-Day Income Sources
				</Typography>
			</Box>
			<Box sx={{ flex: 1, p: 1, minHeight: 0 }}>
				{loading ? (
					<Box
						display="flex"
						flexDirection="column"
						justifyContent="center"
						alignItems="center"
						height="100%"
						width="100%"
					>
						<CircularProgress
							size={30}
							thickness={4}
							sx={{ color: "#7b68ee" }}
						/>
					</Box>
				) : pieChartData.length > 0 ? (
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={pieChartData}
								cx="50%"
								cy="42%"
								innerRadius="50%"
								outerRadius="75%"
								paddingAngle={3}
								dataKey="value"
								stroke="none"
							>
								{pieChartData.map((entry: any, index: number) => (
									<Cell
										key={`cell-${index}`}
										fill={
											SEMANTIC_COLORS.chartPalette[
												index % SEMANTIC_COLORS.chartPalette.length
											]
										}
									/>
								))}
							</Pie>
							<RechartsTooltip
								formatter={(value: number) => formatCurrency(value)}
								contentStyle={{
									backgroundColor: "rgba(4, 4, 10, 0.95)",
									borderColor: "rgba(255, 255, 255, 0.1)",
									color: "#fff",
									borderRadius: "10px",
									fontSize: "0.75rem",
									backdropFilter: "blur(20px)",
								}}
							/>
							<Legend
								verticalAlign="bottom"
								align="center"
								iconType="circle"
								wrapperStyle={{
									fontSize: "11px",
									color: "rgba(255,255,255,0.5)",
								}}
							/>
						</PieChart>
					</ResponsiveContainer>
				) : (
					<Box
						display="flex"
						justifyContent="center"
						alignItems="center"
						height="100%"
						color="rgba(255,255,255,0.4)"
						fontSize="0.8rem"
					>
						No income generated
					</Box>
				)}
			</Box>
		</FlexCard>
	);
};

export const VelocityBarChart = ({ incomeExpense30D, loading }: any) => {
	return (
		<FlexCard sx={{ height: "100%" }}>
			<Box
				sx={{
					px: 2.5,
					py: 1.25,
					borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
				}}
			>
				<Typography
					fontWeight={800}
					fontSize="0.75rem"
					sx={{
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						color: "rgba(255,255,255,0.7)",
					}}
				>
					30-Day Velocity
				</Typography>
			</Box>
			<Box sx={{ flex: 1, px: 1, pt: 1.5, pb: 1, minHeight: 0 }}>
				{loading ? (
					<Box
						display="flex"
						flexDirection="column"
						justifyContent="center"
						alignItems="center"
						height="100%"
						width="100%"
					>
						<CircularProgress
							size={30}
							thickness={4}
							sx={{ color: "#7b68ee" }}
						/>
					</Box>
				) : incomeExpense30D.length > 0 ? (
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={incomeExpense30D}
							margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								vertical={false}
								stroke="rgba(255, 255, 255, 0.04)"
							/>
							<XAxis
								dataKey="name"
								tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }}
								axisLine={false}
								tickLine={false}
								dy={5}
							/>
							<YAxis
								tickFormatter={compactFormatter}
								tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }}
								axisLine={false}
								tickLine={false}
							/>
							<RechartsTooltip
								cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
								formatter={(value: number) => formatCurrency(Math.abs(value))}
								contentStyle={{
									backgroundColor: "rgba(4, 4, 10, 0.95)",
									borderColor: "rgba(255, 255, 255, 0.1)",
									color: "#fff",
									borderRadius: "10px",
									fontSize: "0.75rem",
									backdropFilter: "blur(20px)",
								}}
							/>
							<Legend
								wrapperStyle={{
									fontSize: "11px",
									color: "rgba(255,255,255,0.5)",
								}}
								iconType="circle"
							/>
							<ReferenceLine
								y={0}
								stroke="rgba(255, 255, 255, 0.1)"
								strokeWidth={1}
							/>
							<Bar
								dataKey="Income"
								fill={SEMANTIC_COLORS.neonGreen}
								radius={[3, 3, 0, 0]}
								maxBarSize={18}
							/>
							<Bar
								dataKey="Expense"
								fill={SEMANTIC_COLORS.neonRed}
								radius={[0, 0, 3, 3]}
								maxBarSize={18}
							/>
						</BarChart>
					</ResponsiveContainer>
				) : (
					<Box
						display="flex"
						justifyContent="center"
						alignItems="center"
						height="100%"
						color="rgba(255,255,255,0.4)"
						fontSize="0.8rem"
					>
						No operational data
					</Box>
				)}
			</Box>
		</FlexCard>
	);
};

export const VelocityLedgerTable = ({ cashFlows, loading }: any) => {
	return (
		<FlexCard sx={{ height: "100%" }}>
			<Box
				sx={{
					px: 2.5,
					py: 1.25,
					borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
				}}
			>
				<Typography
					fontWeight={800}
					fontSize="0.75rem"
					sx={{
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						color: "rgba(255,255,255,0.7)",
					}}
				>
					Velocity Ledger
				</Typography>
			</Box>
			<Box
				sx={{
					flex: 1,
					overflowY: "auto",
					p: 0,
					"&::-webkit-scrollbar": { width: "4px" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: "rgba(255, 255, 255, 0.1)",
						borderRadius: "4px",
					},
				}}
			>
				{loading ? (
					<Box
						display="flex"
						flexDirection="column"
						justifyContent="center"
						alignItems="center"
						height="100%"
						width="100%"
					>
						<CircularProgress
							size={30}
							thickness={4}
							sx={{ color: "#7b68ee" }}
						/>
					</Box>
				) : (
					<table
						style={{
							width: "100%",
							borderCollapse: "collapse",
							textAlign: "left",
						}}
					>
						<thead
							style={{
								position: "sticky",
								top: 0,
								zIndex: 1,
								backgroundColor: "rgba(4, 4, 10, 0.95)",
								backdropFilter: "blur(20px)",
							}}
						>
							<tr
								style={{
									color: "rgba(255,255,255,0.4)",
									fontSize: "0.65rem",
									textTransform: "uppercase",
								}}
							>
								<th
									style={{
										padding: "8px 16px",
										fontWeight: 800,
										borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
									}}
								>
									Category
								</th>
								<th
									style={{
										padding: "8px 16px",
										fontWeight: 800,
										textAlign: "right",
										borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
									}}
								>
									7D Net
								</th>
								<th
									style={{
										padding: "8px 16px",
										fontWeight: 800,
										textAlign: "right",
										borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
									}}
								>
									30D Net
								</th>
							</tr>
						</thead>
						<tbody>
							{cashFlows && cashFlows.length > 0 ? (
								cashFlows.map((flow: any) => {
									const isCorp = flow.Category.includes("CORP");
									return (
										<tr
											key={flow.Category}
											style={{
												borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
											}}
										>
											<td
												style={{
													padding: "8px 16px",
													fontWeight: 600,
													color: isCorp ? SEMANTIC_COLORS.neonPurple : "#fff",
													fontSize: "0.75rem",
												}}
											>
												{flow.Category.replace("_", " ")}
											</td>
											<td
												style={{
													padding: "8px 16px",
													textAlign: "right",
													fontFamily: "monospace",
													fontSize: "0.75rem",
													color:
														flow["7D"].Net >= 0
															? SEMANTIC_COLORS.neonGreen
															: SEMANTIC_COLORS.neonRed,
												}}
											>
												{flow["7D"].Net > 0 ? "+" : ""}
												{formatCurrency(flow["7D"].Net)}
											</td>
											<td
												style={{
													padding: "8px 16px",
													textAlign: "right",
													fontFamily: "monospace",
													fontSize: "0.75rem",
													color:
														flow["30D"].Net >= 0
															? SEMANTIC_COLORS.neonGreen
															: SEMANTIC_COLORS.neonRed,
												}}
											>
												{flow["30D"].Net > 0 ? "+" : ""}
												{formatCurrency(flow["30D"].Net)}
											</td>
										</tr>
									);
								})
							) : (
								<tr>
									<td
										colSpan={3}
										style={{
											padding: "24px",
											textAlign: "center",
											color: "rgba(255,255,255,0.4)",
											fontSize: "0.8rem",
										}}
									>
										No ledger entries found.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				)}
			</Box>
		</FlexCard>
	);
};
