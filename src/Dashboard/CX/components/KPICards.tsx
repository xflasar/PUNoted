import {
	Grid,
	Card,
	CardContent,
	Typography,
	Box,
	Tooltip,
	useTheme,
	alpha,
} from "@mui/material";
import {
	TrendingUp,
	TrendingDown,
	SwapHoriz,
	AttachMoney,
} from "@mui/icons-material";
import { KpiData } from "../types";
import { formatCompactNumber } from "../helpers/formatNumber";

export const KPICards = ({ data }: { data: KpiData | null | undefined }) => {
	const theme = useTheme();

	// Safety fallback: If data is missing, use default values to prevent crash
	const safeData = data || {
		profit: 0,
		revenue: 0,
		expenses: 0,
		volumeSold: 0,
		volumeBought: 0,
		bestSellingItem: "-",
		mostBoughtItem: "-",
	};

	const tooltipComponentsProps = {
		tooltip: {
			sx: {
				backgroundColor: alpha(theme.palette.background.default, 0.8),
				backdropFilter: "blur(12px)",
				border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
				color: theme.palette.text.primary,
				boxShadow: theme.shadows[4],
				fontSize: "0.75rem",
			},
		},
		arrow: {
			sx: {
				color: alpha(theme.palette.background.default, 0.8),
			},
		},
	};

	const items = [
		{
			title: "Net Profit",
			value: safeData.profit,
			isMoney: true,
			icon: <AttachMoney fontSize="small" />,
			color: safeData.profit >= 0 ? "success.main" : "error.main",
		},
		{
			title: "Total Revenue",
			value: safeData.revenue,
			isMoney: true,
			icon: <TrendingUp fontSize="small" />,
			color: "text.primary",
		},
		{
			title: "Total Expenses",
			value: safeData.expenses,
			isMoney: true,
			icon: <TrendingDown fontSize="small" />,
			color: "error.light",
		},
		{
			title: "Trade Volume",
			value: safeData.volumeSold,
			sub: safeData.volumeBought,
			isMoney: false,
			icon: <SwapHoriz fontSize="small" />,
			color: "info.main",
		},
		{
			title: "Best Selling Item",
			value: safeData.bestSellingItem,
			isMoney: false,
			color: "success.main",
		},
		{
			title: "Most Bought Item",
			value: safeData.mostBoughtItem,
			isMoney: false,
			color: "error.main",
		},
	];

	return (
		<Grid container spacing={1} sx={{ justifyContent: "center" }}>
			{items.map((item, i) => (
				<Grid item xs={6} key={i}>
					<Tooltip
						title={
							<Box sx={{ textAlign: "center", p: 0.5 }}>
								<Typography
									variant="caption"
									display="block"
									color="text.secondary"
								>
									{item.title}
								</Typography>
								<Typography variant="body2" fontWeight="bold">
									{typeof item.value === "number"
										? item.value.toLocaleString()
										: item.value}
									{item.isMoney && typeof item.value === "number" ? " ICA" : ""}
								</Typography>
								{item.sub !== undefined && (
									<Typography variant="caption" display="block">
										{item.sub.toLocaleString()} Bought
									</Typography>
								)}
							</Box>
						}
						arrow
						placement="top"
						componentsProps={tooltipComponentsProps}
					>
						<Card
							sx={{
								height: "100%",
								cursor: "help",
								backgroundColor: theme.palette.background.paper,
								backgroundImage: "none",
								border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
								boxShadow: "none",
							}}
						>
							<CardContent
								sx={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "space-between",
									textAlign: "center",
									p: "8px !important",
									"&:last-child": { pb: "8px !important" },
									height: "100%",
								}}
							>
								<Box
									display="flex"
									alignItems="center"
									justifyContent="center"
									gap={0.5}
									mb={0.5}
								>
									<Typography
										color="text.secondary"
										variant="caption"
										noWrap
										fontWeight="bold"
										fontSize="0.7rem"
									>
										{item.title}
									</Typography>
									{item.icon && (
										<Box
											sx={{
												color: item.color,
												opacity: 0.8,
												display: "flex",
												"& svg": { fontSize: "0.9rem" },
											}}
										>
											{item.icon}
										</Box>
									)}
								</Box>

								<Typography
									variant="h6"
									sx={{
										color: item.color,
										fontWeight: "bold",
										lineHeight: 1.2,
										fontSize: { xs: "0.9rem", md: "1.1rem" },
									}}
								>
									{typeof item.value === "number"
										? formatCompactNumber(item.value, item.isMoney)
										: item.value}
								</Typography>

								{item.sub !== undefined && (
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ fontSize: "0.65rem" }}
									>
										{formatCompactNumber(item.sub, false)} Bought
									</Typography>
								)}
							</CardContent>
						</Card>
					</Tooltip>
				</Grid>
			))}
		</Grid>
	);
};
