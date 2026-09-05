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
	Brush,
} from "recharts";
import {
	formatCurrency,
	compactFormatter,
	SEMANTIC_COLORS,
} from "../utils/financeutils";
import { FlexCard } from "./sharedui";
import { useGlobalData } from "../../../context/globaldatacontext";

export const LiquidityTrendChart = ({
	historyData = [],
	currency,
	loading,
	timeRange,
}: any) => {
	const [timeframe, setTimeframe] = React.useState<string>(timeRange || "30D");

	React.useEffect(() => {
		if (timeRange) {
			setTimeframe(timeRange);
		}
	}, [timeRange]);

	const filteredData = React.useMemo(() => {
		if (!historyData || historyData.length === 0) return [];
		const sorted = [...historyData].sort(
			(a, b) =>
				new Date(a.Date || a.timestamp || 0).getTime() -
				new Date(b.Date || b.timestamp || 0).getTime(),
		);

		if (timeframe === "ALL" || timeframe === "CUSTOM") return sorted;

		const daysMap: Record<string, number> = {
			"24H": 1,
			"7D": 7,
			"14D": 14,
			"30D": 30,
			"6M": 180,
			"1Y": 365,
		};
		const days = daysMap[timeframe] || 30;
		return sorted.slice(-days);
	}, [historyData, timeframe]);

	// Fast 90-point downsampler for buttery smooth 60fps Brush performance
	const chartData = React.useMemo(() => {
		if (!filteredData || filteredData.length <= 90) return filteredData;
		const maxPts = 90;
		const step = (filteredData.length - 1) / (maxPts - 1);
		const sampled: any[] = [];
		for (let i = 0; i < maxPts; i++) {
			sampled.push(filteredData[Math.round(i * step)]);
		}
		return sampled;
	}, [filteredData]);

	const minDateStr = filteredData.length > 0 ? filteredData[0]?.Date || "" : "";
	const maxDateStr =
		filteredData.length > 0
			? filteredData[filteredData.length - 1]?.Date || ""
			: "";

	return (
		<FlexCard sx={{ height: "100%", minHeight: { xs: 200, lg: 160 } }}>
			<Box
				sx={{
					px: 2,
					py: 0.75,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
					flexWrap: "wrap",
					gap: 1,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Typography
						fontWeight={800}
						fontSize="0.75rem"
						sx={{
							textTransform: "uppercase",
							letterSpacing: "0.08em",
							color: "rgba(255,255,255,0.7)",
						}}
					>
						Liquidity ({currency})
					</Typography>
					{minDateStr && (
						<Typography
							sx={{
								fontSize: "0.58rem",
								fontFamily: "monospace",
								color: "rgba(255,255,255,0.4)",
							}}
						>
							{minDateStr} →{" "}
							<span style={{ color: "#7b68ee", fontWeight: 700 }}>
								Current: {maxDateStr}
							</span>
						</Typography>
					)}
				</Box>

				{/* Timeframe Buttons for Liquidity Graph (Shown only when global timeRange not supplied) */}
				{!timeRange && (
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
						{["7D", "14D", "30D", "6M", "1Y", "ALL", "CUSTOM"].map((tf) => (
							<Box
								key={tf}
								onClick={() => setTimeframe(tf)}
								sx={{
									px: 0.75,
									py: 0.15,
									borderRadius: "4px",
									fontSize: "0.58rem",
									fontWeight: 800,
									cursor: "pointer",
									fontFamily: "monospace",
									bgcolor:
										timeframe === tf ? "#7b68ee" : "rgba(255,255,255,0.04)",
									color: timeframe === tf ? "#fff" : "rgba(255,255,255,0.5)",
									border: `1px solid ${timeframe === tf ? "#7b68ee" : "rgba(255,255,255,0.06)"}`,
									transition: "all 0.15s ease",
									"&:hover": {
										bgcolor:
											timeframe === tf ? "#6956e0" : "rgba(255,255,255,0.08)",
									},
								}}
							>
								{tf}
							</Box>
						))}
					</Box>
				)}
			</Box>
			<Box
				sx={{
					flex: 1,
					px: 1,
					pb: 0.5,
					pt: 1,
					height: 200,
					minHeight: 200,
					position: "relative",
				}}
			>
				{loading ? (
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
							width: "100%",
						}}
					>
						<CircularProgress
							size={26}
							thickness={4}
							sx={{ color: "#7b68ee" }}
						/>
					</Box>
				) : chartData && chartData.length > 0 ? (
					<ResponsiveContainer
						minWidth={0}
						minHeight={0}
						initialDimension={{ width: 300, height: 200 }}
						width="100%"
						height="100%"
					>
						<AreaChart
							data={chartData}
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
								cursor={{
									stroke: "rgba(123, 104, 238, 0.6)",
									strokeWidth: 1.5,
									strokeDasharray: "4 4",
								}}
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
								isAnimationActive={false}
								activeDot={{
									r: 6,
									fill: "#7b68ee",
									stroke: "#ffffff",
									strokeWidth: 2,
								}}
							/>
							<Brush
								dataKey="Date"
								height={14}
								stroke="#7b68ee"
								fill="rgba(4, 4, 10, 0.9)"
								tickFormatter={() => ""}
							/>
						</AreaChart>
					</ResponsiveContainer>
				) : (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
							color: "rgba(255,255,255,0.4)",
							fontSize: "0.8rem",
						}}
					>
						Insufficient historical data
					</Box>
				)}
			</Box>
		</FlexCard>
	);
};

export const IncomeSourcesChart = ({
	pieChartData,
	loading,
	timeRange = "30D",
}: any) => {
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
					{timeRange} Income Sources
				</Typography>
			</Box>
			<Box
				sx={{
					flex: 1,
					p: 1,
					minHeight: { xs: 220, lg: 130 },
					height: { xs: 220, lg: "100%" },
				}}
			>
				{loading ? (
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
							width: "100%",
						}}
					>
						<CircularProgress
							size={30}
							thickness={4}
							sx={{ color: "#7b68ee" }}
						/>
					</Box>
				) : pieChartData.length > 0 ? (
					<ResponsiveContainer
						minWidth={0}
						minHeight={0}
						initialDimension={{ width: 300, height: 200 }}
						width="100%"
						height="100%"
					>
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
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
							color: "rgba(255,255,255,0.4)",
							fontSize: "0.8rem",
						}}
					>
						No income generated
					</Box>
				)}
			</Box>
		</FlexCard>
	);
};

export const VelocityBarChart = ({
	incomeExpense30D = [],
	loading,
	timeRange = "30D",
}: any) => {
	const chartData = React.useMemo(() => {
		if (!incomeExpense30D || incomeExpense30D.length <= 60)
			return incomeExpense30D;
		const maxPts = 60;
		const step = (incomeExpense30D.length - 1) / (maxPts - 1);
		const sampled: any[] = [];
		for (let i = 0; i < maxPts; i++) {
			sampled.push(incomeExpense30D[Math.round(i * step)]);
		}
		return sampled;
	}, [incomeExpense30D]);

	const minDateStr =
		incomeExpense30D.length > 0 ? incomeExpense30D[0]?.name || "" : "";
	const maxDateStr =
		incomeExpense30D.length > 0
			? incomeExpense30D[incomeExpense30D.length - 1]?.name || ""
			: "";

	return (
		<FlexCard sx={{ height: "100%" }}>
			<Box
				sx={{
					px: 2,
					py: 0.75,
					display: "flex",
					alignItems: "center",
					justify: "space-between",
					borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Typography
						fontWeight={800}
						fontSize="0.75rem"
						sx={{
							textTransform: "uppercase",
							letterSpacing: "0.08em",
							color: "rgba(255,255,255,0.7)",
						}}
					>
						{timeRange} Velocity
					</Typography>
					{minDateStr && (
						<Typography
							sx={{
								fontSize: "0.58rem",
								fontFamily: "monospace",
								color: "rgba(255,255,255,0.4)",
							}}
						>
							{minDateStr} →{" "}
							<span style={{ color: "#7b68ee", fontWeight: 700 }}>
								Current: {maxDateStr}
							</span>
						</Typography>
					)}
				</Box>
			</Box>
			<Box
				sx={{
					flex: 1,
					px: 1,
					pt: 1,
					pb: 0.5,
					height: 200,
					minHeight: 200,
					position: "relative",
				}}
			>
				{loading ? (
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
							width: "100%",
						}}
					>
						<CircularProgress
							size={30}
							thickness={4}
							sx={{ color: "#7b68ee" }}
						/>
					</Box>
				) : chartData && chartData.length > 0 ? (
					<ResponsiveContainer
						minWidth={0}
						minHeight={0}
						initialDimension={{ width: 300, height: 200 }}
						width="100%"
						height="100%"
					>
						<BarChart
							data={chartData}
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
								cursor={{ fill: "rgba(123, 104, 238, 0.15)" }}
								formatter={(value: number) => formatCurrency(Math.abs(value))}
								contentStyle={{
									backgroundColor: "rgba(4, 4, 10, 0.95)",
									borderColor: "rgba(123, 104, 238, 0.35)",
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
							<Bar
								dataKey="Income"
								fill="#4ade80"
								radius={[4, 4, 0, 0]}
								isAnimationActive={false}
							/>
							<Bar
								dataKey="Expense"
								fill="#f87171"
								radius={[4, 4, 0, 0]}
								isAnimationActive={false}
							/>
							<Brush
								dataKey="name"
								height={14}
								stroke="#7b68ee"
								fill="rgba(4, 4, 10, 0.9)"
								tickFormatter={() => ""}
							/>
						</BarChart>
					</ResponsiveContainer>
				) : (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
							color: "rgba(255,255,255,0.4)",
							fontSize: "0.8rem",
						}}
					>
						No velocity data recorded
					</Box>
				)}
			</Box>
		</FlexCard>
	);
};

export const VelocityLedgerTable = ({
	cashFlows = [],
	transactions = [],
	loading,
}: any) => {
	const { loansData } = useGlobalData();

	// Compute effective cash flows including Public & Corp Loans with fallback to transactions & loansData
	const effectiveCashFlows = React.useMemo(() => {
		const now = Date.now();
		const ms7D = 7 * 86400000;
		const ms30D = 30 * 86400000;

		const txMetricsMap = new Map<
			string,
			{
				category: string;
				net7D: number;
				net30D: number;
			}
		>();

		const defaultCategories = [
			"CX",
			"CONTRACT",
			"CORP CX",
			"CORP CONTRACT",
			"PUBLIC LOANS",
			"CORP LOANS",
		];
		defaultCategories.forEach((cat) => {
			txMetricsMap.set(cat, { category: cat, net7D: 0, net30D: 0 });
		});

		(transactions || []).forEach((tx: any) => {
			const txTime = new Date(tx.Timestamp || 0).getTime();
			if (isNaN(txTime) || txTime <= 0) return;
			const age = now - txTime;
			const amt = Number(tx.Amount || 0);
			if (isNaN(amt) || amt === 0) return;

			let category = "OTHER";
			const fullStr =
				`${tx.Type || ""} ${tx.Category || ""} ${tx.Description || ""} ${tx.PartnerName || ""} ${tx.PartnerCode || ""}`.toUpperCase();

			if (
				fullStr.includes("LOAN") ||
				fullStr.includes("REPAYMENT") ||
				fullStr.includes("INSTALLMENT") ||
				fullStr.includes("INTEREST") ||
				fullStr.includes("PAYOUT") ||
				fullStr.includes("DEBT")
			) {
				if (fullStr.includes("PUBLIC")) category = "PUBLIC LOANS";
				else category = "CORP LOANS";
			} else if (fullStr.includes("CORP_CX") || fullStr.includes("CORP CX")) {
				category = "CORP CX";
			} else if (
				fullStr.includes("CORP_CONTRACT") ||
				fullStr.includes("CORP CONTRACT")
			) {
				category = "CORP CONTRACT";
			} else if (fullStr.includes("CX")) {
				category = "CX";
			} else if (fullStr.includes("CONTRACT")) {
				category = "CONTRACT";
			}

			const metric = txMetricsMap.get(category) || {
				category,
				net7D: 0,
				net30D: 0,
			};
			if (age <= ms7D) metric.net7D += amt;
			if (age <= ms30D) metric.net30D += amt;
			txMetricsMap.set(category, metric);
		});

		// Hydrate loan velocity from global loansData (using explicit conditions or projected installments)
		if (Array.isArray(loansData) && loansData.length > 0) {
			const loansNet7DMap = new Map<string, number>();
			const loansNet30DMap = new Map<string, number>();

			loansData.forEach((loan: any) => {
				const status = (loan.status || "").toUpperCase();
				if (
					status.includes("CANCELLED") ||
					status.includes("REJECTED") ||
					status.includes("TERMINATED") ||
					status.includes("BREACHED")
				) {
					return;
				}

				const isPublic =
					`${loan.loan_strategy || ""} ${loan.type || ""} ${loan.name || ""}`
						.toUpperCase()
						.includes("PUBLIC");
				const categoryKey = isPublic ? "PUBLIC LOANS" : "CORP LOANS";

				const isLent =
					loan.contracttype === "LOAN_GIVEN" ||
					loan.party === "CUSTOMER" ||
					loan.is_payout_party ||
					(loan.type || "").toUpperCase().includes("GIVEN");

				const conds: any[] = loan.conditions || [];
				const intervalDays = Number(loan.installment_interval || 7);
				const doneInst = Number(
					loan.installment_done ?? loan.fulfilled_installments ?? 0,
				);
				let startDateMs = new Date(
					loan.date ||
						loan.start_date ||
						loan.created_at ||
						loan.timestamp ||
						0,
				).getTime();
				if (isNaN(startDateMs) || startDateMs <= 0) {
					const dueMs = new Date(loan.duedate || 0).getTime();
					const totalInst = Math.max(
						1,
						Number(
							loan.installment_count ||
								loan.total_installments ||
								conds.length ||
								1,
						),
					);
					if (!isNaN(dueMs) && dueMs > 0) {
						startDateMs = dueMs - totalInst * intervalDays * 86400000;
					}
				}

				if (Array.isArray(conds) && conds.length > 0) {
					conds.forEach((c: any) => {
						const cType = (c.type || "").toUpperCase();
						if (cType !== "LOAN_INSTALLMENT") return;

						const condStatus = (c.status || "").toUpperCase();
						const cIdx = Number(c.index !== undefined ? c.index : 1);
						const isFulfilled =
							condStatus === "FULFILLED" || (cIdx > 0 && cIdx <= doneInst);
						if (!isFulfilled) return;

						let condTime = c.deadline ? new Date(c.deadline).getTime() : 0;
						if (isNaN(condTime) || condTime <= 0) {
							condTime =
								startDateMs > 0
									? startDateMs + cIdx * intervalDays * 86400000
									: 0;
						}
						if (condTime <= 0) return;

						const age = now - condTime;
						const repAmt = Number(c.repaymentamount || 0);
						const intAmt = Number(c.interestamount || 0);
						const amt = Number(
							c.totalamount || repAmt + intAmt || c.amountmoney || 0,
						);
						if (amt === 0) return;

						const signedAmt = isLent ? amt : -amt;

						if (age >= 0 && age <= ms7D) {
							loansNet7DMap.set(
								categoryKey,
								(loansNet7DMap.get(categoryKey) || 0) + signedAmt,
							);
						}
						if (age >= 0 && age <= ms30D) {
							loansNet30DMap.set(
								categoryKey,
								(loansNet30DMap.get(categoryKey) || 0) + signedAmt,
							);
						}
					});
				} else {
					// Fallback: Compute completed installment velocity from loan metadata (accounting for interest)
					const totalInst = Math.max(
						1,
						Number(loan.installment_count || loan.total_installments || 1),
					);
					const doneInst = Number(
						loan.installment_done ?? loan.fulfilled_installments ?? 0,
					);
					const intervalDays = Number(loan.installment_interval || 7);

					// Determine total repayment including principal & interest
					const principal = Number(
						loan.principal ||
							loan.initial_principal ||
							loan.payout_amount ||
							loan.amount ||
							0,
					);
					let ratePercent = 0;
					if (
						loan.implied_interest_rate !== undefined &&
						loan.implied_interest_rate !== null
					) {
						ratePercent = Number(loan.implied_interest_rate);
					} else if (
						loan.interest_rate !== undefined &&
						loan.interest_rate !== null
					) {
						const rawRate = Number(loan.interest_rate);
						ratePercent = rawRate <= 1 ? rawRate * 100 : rawRate;
					}

					let interestAmt = Number(
						loan.total_interest || loan.interest_amount || loan.interest || 0,
					);
					if (interestAmt === 0 && ratePercent > 0 && principal > 0) {
						interestAmt = principal * (ratePercent / 100);
					}

					const explicitTotal = Number(
						loan.total_repayment || loan.total_amount || 0,
					);
					const totalAmt =
						explicitTotal > 0 && explicitTotal >= principal + interestAmt
							? explicitTotal
							: principal > 0
								? principal + interestAmt
								: explicitTotal;

					const installmentAmt = totalInst > 0 ? totalAmt / totalInst : 0;

					let startDateMs = new Date(
						loan.date ||
							loan.start_date ||
							loan.created_at ||
							loan.timestamp ||
							0,
					).getTime();
					if (isNaN(startDateMs) || startDateMs <= 0) {
						const dueMs = new Date(loan.duedate || 0).getTime();
						if (!isNaN(dueMs) && dueMs > 0) {
							startDateMs = dueMs - totalInst * intervalDays * 86400000;
						}
					}

					if (
						installmentAmt > 0 &&
						!isNaN(startDateMs) &&
						startDateMs > 0 &&
						doneInst > 0
					) {
						const signedAmt = isLent ? installmentAmt : -installmentAmt;
						const completedCount = Math.min(doneInst, totalInst);

						for (let i = 0; i < completedCount; i++) {
							const installmentTime =
								startDateMs + (i + 1) * intervalDays * 86400000;
							const age = now - installmentTime;

							if (age >= 0 && age <= ms7D) {
								loansNet7DMap.set(
									categoryKey,
									(loansNet7DMap.get(categoryKey) || 0) + signedAmt,
								);
							}
							if (age >= 0 && age <= ms30D) {
								loansNet30DMap.set(
									categoryKey,
									(loansNet30DMap.get(categoryKey) || 0) + signedAmt,
								);
							}
						}
					}
				}
			});

			["PUBLIC LOANS", "CORP LOANS"].forEach((cat) => {
				const metric = txMetricsMap.get(cat) || {
					category: cat,
					net7D: 0,
					net30D: 0,
				};
				const loan7D = loansNet7DMap.get(cat) || 0;
				const loan30D = loansNet30DMap.get(cat) || 0;

				if (metric.net7D === 0 && loan7D !== 0) {
					metric.net7D = loan7D;
				}
				if (metric.net30D === 0 && loan30D !== 0) {
					metric.net30D = loan30D;
				}
				txMetricsMap.set(cat, metric);
			});
		}

		const result: Array<{ category: string; net7D: number; net30D: number }> =
			[];
		const processedCats = new Set<string>();

		(cashFlows || []).forEach((flow: any) => {
			if (!flow || !flow.Category) return;
			const rawCat = (flow.Category || "").replace(/_/g, " ").toUpperCase();
			processedCats.add(rawCat);

			const txMetric = txMetricsMap.get(rawCat) || { net7D: 0, net30D: 0 };

			const extractVal = (
				obj: any,
				key: "7D" | "30D",
				fallbackTxVal: number,
			): number => {
				if (!obj) return fallbackTxVal;
				const p = obj[key] || obj[key.toLowerCase()];
				if (typeof p === "number" && !isNaN(p)) return p;
				if (typeof p === "object" && p !== null) {
					if (typeof p.Net === "number" && !isNaN(p.Net)) return p.Net;
					if (typeof p.net === "number" && !isNaN(p.net)) return p.net;
					const inc = Number(p.Income || p.income || 0);
					const exp = Number(p.Expense || p.expense || 0);
					if (inc !== 0 || exp !== 0) return inc - exp;
				}
				return fallbackTxVal;
			};

			const val7D = extractVal(flow, "7D", txMetric.net7D);
			const val30D = extractVal(flow, "30D", txMetric.net30D);

			result.push({
				category: rawCat,
				net7D: val7D !== 0 ? val7D : txMetric.net7D,
				net30D: val30D !== 0 ? val30D : txMetric.net30D,
			});
		});

		txMetricsMap.forEach((metric, cat) => {
			if (!processedCats.has(cat)) {
				result.push({
					category: cat,
					net7D: metric.net7D,
					net30D: metric.net30D,
				});
			}
		});

		return result;
	}, [cashFlows, transactions, loansData]);

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
					overflowX: "auto",
					p: 0,
					"&::-webkit-scrollbar": { width: "4px", height: "3px" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: "rgba(255, 255, 255, 0.1)",
						borderRadius: "4px",
					},
				}}
			>
				{loading ? (
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
							width: "100%",
						}}
					>
						<CircularProgress
							size={30}
							thickness={4}
							sx={{ color: "#7b68ee" }}
						/>
					</Box>
				) : (
					<Box
						component="table"
						sx={{
							width: "100%",
							minWidth: "320px",
							borderCollapse: "collapse",
							textAlign: "left",
							tableLayout: "fixed",
						}}
					>
						<Box
							component="thead"
							sx={{
								position: "sticky",
								top: 0,
								zIndex: 1,
								backgroundColor: "rgba(4, 4, 10, 0.95)",
								backdropFilter: "blur(20px)",
							}}
						>
							<Box
								component="tr"
								sx={{
									color: "rgba(255,255,255,0.4)",
									fontSize: "0.65rem",
									textTransform: "uppercase",
								}}
							>
								<Box
									component="th"
									sx={{
										padding: "8px 12px",
										fontWeight: 800,
										width: "40%",
										borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
									}}
								>
									Category
								</Box>
								<Box
									component="th"
									sx={{
										padding: "8px 12px",
										fontWeight: 800,
										textAlign: "right",
										width: "30%",
										borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
									}}
								>
									7D Net
								</Box>
								<Box
									component="th"
									sx={{
										padding: "8px 12px",
										fontWeight: 800,
										textAlign: "right",
										width: "30%",
										borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
									}}
								>
									30D Net
								</Box>
							</Box>
						</Box>
						<Box component="tbody">
							{effectiveCashFlows && effectiveCashFlows.length > 0 ? (
								effectiveCashFlows.map((flow: any) => {
									const isCorp = flow.category.includes("CORP");
									const net7D = flow.net7D || 0;
									const net30D = flow.net30D || 0;

									return (
										<Box
											component="tr"
											key={flow.category}
											sx={{
												borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
											}}
										>
											<Box
												component="td"
												sx={{
													padding: "8px 12px",
													fontWeight: 700,
													color: isCorp ? SEMANTIC_COLORS.neonPurple : "#fff",
													fontSize: "0.72rem",
													whiteSpace: "nowrap",
													overflow: "hidden",
													textOverflow: "ellipsis",
												}}
											>
												{flow.category}
											</Box>
											<Box
												component="td"
												sx={{
													padding: "8px 6px",
													textAlign: "right",
													fontFamily: "monospace",
													fontSize: "0.68rem",
													fontWeight: 800,
													whiteSpace: "nowrap",
													color:
														net7D > 0
															? SEMANTIC_COLORS.neonGreen
															: net7D < 0
																? SEMANTIC_COLORS.neonRed
																: "rgba(255,255,255,0.4)",
												}}
											>
												{net7D > 0 ? "+" : ""}
												{formatCurrency(
													net7D,
													Math.abs(net7D) >= 1000000 ? 0 : 2,
												)}
											</Box>
											<Box
												component="td"
												sx={{
													padding: "8px 6px",
													textAlign: "right",
													fontFamily: "monospace",
													fontSize: "0.68rem",
													fontWeight: 800,
													whiteSpace: "nowrap",
													color:
														net30D > 0
															? SEMANTIC_COLORS.neonGreen
															: net30D < 0
																? SEMANTIC_COLORS.neonRed
																: "rgba(255,255,255,0.4)",
												}}
											>
												{net30D > 0 ? "+" : ""}
												{formatCurrency(
													net30D,
													Math.abs(net30D) >= 1000000 ? 0 : 2,
												)}
											</Box>
										</Box>
									);
								})
							) : (
								<Box component="tr">
									<Box
										component="td"
										colSpan={3}
										sx={{
											padding: "16px",
											textAlign: "center",
											color: "rgba(255,255,255,0.4)",
											fontSize: "0.75rem",
										}}
									>
										No velocity ledger records
									</Box>
								</Box>
							)}
						</Box>
					</Box>
				)}
			</Box>
		</FlexCard>
	);
};
