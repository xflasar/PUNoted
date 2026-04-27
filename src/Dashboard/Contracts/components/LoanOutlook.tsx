import React, { useState, useMemo, memo } from "react";
import {
	Box,
	Typography,
	Paper,
	useTheme,
	Stack,
	Divider,
	Select,
	MenuItem,
	ToggleButton,
	ToggleButtonGroup,
} from "@mui/material";
import { TrendingUp, TrendingDown } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip as ChartTooltip,
	ResponsiveContainer,
	CartesianGrid,
	Legend,
} from "recharts";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { formatCurrency } from "../helpers/helper";
import type { ContractListItem } from "../types";

dayjs.extend(isBetween);

interface ExtendedContract extends ContractListItem {
	installment_count?: number;
	installment_done?: number;
	installment_interval?: number;
	contracttype: string;
	date: string;
	total_amount: number;
	status: string;
}

interface LoanOutlookProps {
	loans: ExtendedContract[];
}

const LoanOutlook = memo(({ loans }: LoanOutlookProps) => {
	const theme = useTheme();
	const [rangeDays, setRangeDays] = useState(14); // Default 14 days for graph
	const [customRange, setCustomRange] = useState<number | string>(""); // Input field for custom

	// --- Helpers ---
	const getProjectedInstallments = (contract: ExtendedContract) => {
		const installments = [];
		const count = contract.installment_count || 1;
		const interval = contract.installment_interval || 30;
		const startDate = dayjs(contract.date);
		const amountPerInstallment = contract.total_amount / count;

		for (let i = 0; i < count; i++) {
			if (i < (contract.installment_done || 0)) continue;
			const dueDate = startDate.add((i + 1) * interval, "day");
			installments.push({
				date: dueDate,
				amount: amountPerInstallment,
				type: contract.contracttype === "LOAN_GIVEN" ? "INCOMING" : "OUTGOING",
			});
		}
		return installments;
	};

	const { graphData, weeklyData, profitStats } = useMemo(() => {
		const now = dayjs();
		const endOfGraph = now.add(rangeDays, "day");

		let weekIn = 0,
			weekOut = 0; // Fixed 7 days for summary boxes
		const buckets: Record<
			string,
			{ dateStr: string; Incoming: number; Outgoing: number }
		> = {};

		// Initialize Buckets
		for (let i = 0; i < rangeDays; i++) {
			const d = now.add(i, "day");
			buckets[d.format("YYYY-MM-DD")] = {
				dateStr: d.format(rangeDays > 14 ? "MM/DD" : "MMM DD"),
				Incoming: 0,
				Outgoing: 0,
			};
		}

		loans.forEach((loan) => {
			if (["OPEN", "PARTIALLY_FULFILLED"].includes(loan.status)) {
				const installments = getProjectedInstallments(loan);
				installments.forEach((inst) => {
					const dKey = inst.date.format("YYYY-MM-DD");

					// 7 Day Summary
					if (inst.date.isBetween(now, now.add(7, "day"), "day", "[]")) {
						if (inst.type === "INCOMING") weekIn += inst.amount;
						else weekOut += inst.amount;
					}

					// Graph Buckets
					if (buckets[dKey]) {
						if (inst.type === "INCOMING") buckets[dKey].Incoming += inst.amount;
						else buckets[dKey].Outgoing += inst.amount;
					}
				});
			}
		});

		return {
			graphData: Object.values(buckets),
			weeklyData: { in: weekIn, out: weekOut },
			profitStats: { profit: 0, loss: 0, net: 0 }, // Placeholder if needed in future
		};
	}, [loans, rangeDays]);

	const handleRangeChange = (
		event: React.MouseEvent<HTMLElement>,
		newRange: number | null,
	) => {
		if (newRange !== null) {
			setRangeDays(newRange);
			setCustomRange("");
		}
	};

	return (
		<Paper
			elevation={0}
			sx={{
				p: 2,
				mb: 2,
				bgcolor: alpha(theme.palette.background.default, 0.6),
				border: `1px solid ${theme.palette.divider}`,
				borderRadius: 2,
				width: "100%",
			}}
		>
			{/* Top Bar: Title & Controls */}
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				mb={2}
				flexWrap="wrap"
				gap={2}
			>
				<Typography variant="subtitle2" fontWeight={800} color="text.secondary">
					CASHFLOW FORECAST
				</Typography>

				<Stack direction="row" spacing={1} alignItems="center">
					<Typography variant="caption" color="text.secondary">
						Range:
					</Typography>
					<ToggleButtonGroup
						value={rangeDays}
						exclusive
						onChange={handleRangeChange}
						size="small"
						sx={{ height: 24 }}
					>
						<ToggleButton value={7} sx={{ fontSize: "0.7rem", py: 0 }}>
							7D
						</ToggleButton>
						<ToggleButton value={14} sx={{ fontSize: "0.7rem", py: 0 }}>
							14D
						</ToggleButton>
						<ToggleButton value={30} sx={{ fontSize: "0.7rem", py: 0 }}>
							30D
						</ToggleButton>
					</ToggleButtonGroup>
					<Select
						value={customRange}
						displayEmpty
						onChange={(e) => {
							const val = Number(e.target.value);
							if (!isNaN(val) && val > 0) {
								setRangeDays(val);
								setCustomRange(val);
							}
						}}
						size="small"
						renderValue={(sel) =>
							sel === "" ? (
								<Typography variant="caption">Custom</Typography>
							) : (
								<Typography variant="caption">{sel} Days</Typography>
							)
						}
						sx={{ height: 24, minWidth: 80, fontSize: "0.7rem" }}
					>
						{[60, 90, 180].map((d) => (
							<MenuItem key={d} value={d}>
								{d} Days
							</MenuItem>
						))}
					</Select>
				</Stack>
			</Stack>

			<Stack
				direction={{ xs: "column", md: "row" }}
				spacing={3}
				alignItems="stretch"
			>
				{/* Summary Boxes (Left) */}
				<Box
					sx={{
						width: { xs: "100%", md: 240 },
						flexShrink: 0,
						display: "flex",
						flexDirection: "column",
						gap: 1,
					}}
				>
					<Box
						sx={{
							p: 2,
							bgcolor: alpha(theme.palette.background.default, 0.5),
							borderRadius: 2,
							border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
						}}
					>
						<Typography
							variant="caption"
							fontWeight={700}
							color="text.secondary"
							mb={1}
							display="block"
						>
							NEXT 7 DAYS SUMMARY
						</Typography>
						<Stack
							direction="row"
							justifyContent="space-between"
							alignItems="center"
							mb={1}
						>
							<Box>
								<Typography
									variant="caption"
									display="block"
									color="success.main"
									fontWeight={700}
								>
									INCOMING
								</Typography>
								<Typography variant="h6" fontWeight={700} lineHeight={1}>
									{formatCurrency(weeklyData.in, "ICA")}
								</Typography>
							</Box>
							<TrendingUp color="success" />
						</Stack>
						<Divider sx={{ my: 1 }} />
						<Stack
							direction="row"
							justifyContent="space-between"
							alignItems="center"
						>
							<Box>
								<Typography
									variant="caption"
									display="block"
									color="error.main"
									fontWeight={700}
								>
									OUTGOING
								</Typography>
								<Typography variant="h6" fontWeight={700} lineHeight={1}>
									{formatCurrency(weeklyData.out, "ICA")}
								</Typography>
							</Box>
							<TrendingDown color="error" />
						</Stack>
					</Box>
				</Box>

				{/* Main Chart (Right) */}
				<Box sx={{ flexGrow: 1, minHeight: 220 }}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={graphData}
							margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								vertical={false}
								stroke={alpha(theme.palette.text.disabled, 0.1)}
							/>
							<XAxis
								dataKey="dateStr"
								tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
								axisLine={false}
								tickLine={false}
							/>
							<YAxis
								tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
								axisLine={false}
								tickLine={false}
								tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
							/>
							<ChartTooltip
								cursor={{ fill: alpha(theme.palette.action.hover, 0.3) }}
								contentStyle={{
									backgroundColor: theme.palette.background.paper,
									borderRadius: 8,
									border: `1px solid ${theme.palette.divider}`,
								}}
								formatter={(val: number) => formatCurrency(val, "ICA")}
							/>
							<Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
							<Bar
								dataKey="Incoming"
								fill={theme.palette.success.main}
								radius={[4, 4, 0, 0]}
								barSize={20}
							/>
							<Bar
								dataKey="Outgoing"
								fill={theme.palette.error.main}
								radius={[4, 4, 0, 0]}
								barSize={20}
							/>
						</BarChart>
					</ResponsiveContainer>
				</Box>
			</Stack>
		</Paper>
	);
});

export default LoanOutlook;
