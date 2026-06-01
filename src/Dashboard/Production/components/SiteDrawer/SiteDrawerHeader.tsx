import React, { useMemo } from "react";
import {
	Box,
	Typography,
	Paper,
	IconButton,
	Stack,
	useTheme,
	alpha,
	Divider,
} from "@mui/material";
import {
	X,
	Building2,
	MapPin,
	Calendar,
	DollarSign,
	Package,
} from "lucide-react";
import type { SiteSummary } from "../../types";
import { useGlobalData } from "../../../../context/globaldatacontext";

const CompactStat = ({
	label,
	value,
	icon: Icon,
	color = "text.primary",
}: any) => (
	<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
		<Icon size={12} style={{ opacity: 0.6 }} />
		<Box>
			<Typography
				variant="caption"
				sx={{ fontSize: "0.6rem", color: "text.secondary", display: "block" }}
			>
				{label}
			</Typography>
			<Typography
				variant="caption"
				sx={{ fontWeight: 800, fontSize: "0.75rem" }}
			>
				{value}
			</Typography>
		</Box>
	</Box>
);

export const SiteDrawerHeader: React.FC<{
	site: SiteSummary;
	onClose: () => void;
}> = ({ site, onClose }) => {
	const theme = useTheme();
	const { marketData } = useGlobalData();

	const marketId = "IC1";

	const priceMap = useMemo(() => {
		const map: Record<string, number> = {};
		if (Array.isArray(marketData)) {
			marketData.forEach((d) => {
				map[d.Ticker] =
					(d[`${marketId}-AskPrice`] || 0) > 0
						? d[`${marketId}-AskPrice`] || 0
						: d[`${marketId}-Average`] || 0;
			});
		}
		return map;
	}, [marketData, marketId]);

	let dailyRevenue = 0;
	let dailyExpenses = 0;

	Object.entries(site.site_daily_flow).map(([ticker, data]) => {
		if (data.flow > 0) {
			dailyRevenue += data.flow * priceMap[ticker];
		} else if (data.flow < 0) {
			dailyExpenses += Math.abs(data.flow * priceMap[ticker]);
		}
	});

	const dailyProfit = dailyRevenue - dailyExpenses;

	const buildingCount = site.production_lines
		.map((line) => line.capacity)
		.reduce((a, b) => a + b, 0);

	return (
		<Paper
			square
			elevation={0}
			sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}
		>
			{/* Row 1: Identity */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					mb: 1.5,
				}}
			>
				<Box>
					<Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1 }}>
						{site.planet_name_alt
							? `${site.planet_name_alt}`
							: site.planet_name}
					</Typography>
					<Stack direction="row" spacing={1} mt={0.5}>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<MapPin size={12} color={theme.palette.text.secondary} />
							<Typography
								variant="caption"
								fontWeight={700}
								color="text.secondary"
							>
								{site.planet_name_alt
									? `${site.planet_name_alt} (${site.planet_name})`
									: site.planet_name}
							</Typography>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<Calendar size={12} color={theme.palette.text.secondary} />
							<Typography
								variant="caption"
								fontWeight={700}
								color="text.secondary"
							>
								Est. {site.founded_timestamp.split("T")[0]}
							</Typography>
						</Box>
					</Stack>
				</Box>
				<IconButton onClick={onClose} size="small">
					<X size={16} />
				</IconButton>
			</Box>

			<Divider sx={{ mb: 1.5 }} />

			{/* Row 2: Operational Stats */}
			<Stack direction="row" spacing={3} sx={{ flexWrap: "wrap", gap: 1 }}>
				<CompactStat label="BUILDINGS" value={buildingCount} icon={Building2} />
				<CompactStat
					label="PERMITS"
					value={`${site.invested_permits}/${site.maximum_permits}`}
					icon={Package}
				/>
				<Box sx={{ flex: 1 }} />
				<CompactStat
					label="DAILY PROFIT"
					value={`+${(dailyProfit / 1000).toFixed(1)}k`}
					icon={DollarSign}
					color={theme.palette.success.main}
				/>
				<CompactStat
					label="EXPENSES"
					value={`${(dailyExpenses / 1000).toFixed(1)}k`}
					icon={DollarSign}
					color={theme.palette.error.main}
				/>
			</Stack>
		</Paper>
	);
};
