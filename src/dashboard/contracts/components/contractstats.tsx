import React from "react";
import { Box, Paper, Typography, Grid, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
	TrendingUp,
	TrendingDown,
	AccountBalanceWallet,
} from "@mui/icons-material";
import {
	BarChart,
	Bar,
	XAxis,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from "recharts";
import { formatCurrency } from "../helpers/helper";

interface Props {
	stats: any;
	loading: boolean;
}

const StatCard = ({ title, value, subValue, icon, color, theme }: any) => (
	<Paper
		sx={{
			p: 2,
			flex: 1,
			bgcolor: alpha(theme.palette.background.default, 0.6),
			backdropFilter: "blur(10px)",
			border: `1px solid ${theme.palette.divider}`,
			display: "flex",
			flexDirection: "column",
			justifyContent: "space-between",
			minHeight: 110,
		}}
	>
		<Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
			<Typography
				variant="caption"
				fontWeight="bold"
				color="text.secondary"
				textTransform="uppercase"
			>
				{title}
			</Typography>
			<Box sx={{ color: color }}>{icon}</Box>
		</Box>
		<Box>
			<Typography variant="h5" fontWeight={800}>
				{value}
			</Typography>
			{subValue && (
				<Typography
					variant="caption"
					color={subValue.includes("-") ? "error.main" : "success.main"}
				>
					{subValue}
				</Typography>
			)}
		</Box>
	</Paper>
);

const ContractStats: React.FC<Props> = ({ stats, loading }) => {
	const theme = useTheme();

	if (loading || !stats)
		return (
			<Box
				sx={{
					height: 200,
					bgcolor: alpha(theme.palette.action.disabled, 0.1),
					borderRadius: 2,
				}}
			/>
		);

	const chartData = Object.entries(stats.status_counts).map(
		([name, value]) => ({ name, value }),
	);
	const COLORS = [
		theme.palette.success.main,
		theme.palette.info.main,
		theme.palette.warning.main,
		theme.palette.error.main,
		theme.palette.text.disabled,
	];

	return (
		<Grid container spacing={2} sx={{ height: "100%" }}>
			{/* Financials */}
			<Grid
				item
				xs={12}
				md={3}
				sx={{ display: "flex", flexDirection: "column", gap: 2 }}
			>
				<StatCard
					title="Net Value"
					value={formatCurrency(stats.net_value, "ICA")}
					icon={<AccountBalanceWallet />}
					color={theme.palette.primary.main}
					theme={theme}
				/>
			</Grid>
			<Grid item xs={6} md={2}>
				<StatCard
					title="Revenue"
					value={formatCurrency(stats.total_revenue, "ICA")}
					icon={<TrendingUp />}
					color={theme.palette.success.main}
					theme={theme}
				/>
			</Grid>
			<Grid item xs={6} md={2}>
				<StatCard
					title="Expenses"
					value={formatCurrency(stats.total_expenses, "ICA")}
					icon={<TrendingDown />}
					color={theme.palette.error.main}
					theme={theme}
				/>
			</Grid>

			{/* Status Chart */}
			<Grid item xs={12} md={5}>
				<Paper
					sx={{
						p: 2,
						height: "100%",
						bgcolor: alpha(theme.palette.background.default, 0.6),
						border: `1px solid ${theme.palette.divider}`,
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Typography
						variant="caption"
						fontWeight="bold"
						color="text.secondary"
						textTransform="uppercase"
						mb={1}
					>
						Status Distribution (Total: {stats.total_count})
					</Typography>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={chartData}>
							<XAxis
								dataKey="name"
								tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
								interval={0}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: theme.palette.background.paper,
									borderColor: theme.palette.divider,
								}}
								itemStyle={{ color: theme.palette.text.primary }}
								cursor={{ fill: alpha(theme.palette.action.hover, 0.2) }}
							/>
							<Bar dataKey="value" radius={[4, 4, 0, 0]}>
								{chartData.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={COLORS[index % COLORS.length]}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</Paper>
			</Grid>
		</Grid>
	);
};

export default ContractStats;
