import React, { useMemo } from "react";
import { Box, Typography, Paper, IconButton, useTheme } from "@mui/material";
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
	<Box
		sx={{
			display: "flex",
			alignItems: "center",
			gap: 0.75,
			p: 0.75,
			px: 1.25,
			bgcolor: "rgba(0,0,0,0.3)",
			borderRadius: "8px",
			border: "1px solid rgba(123, 104, 238, 0.15)",
			flex: "1 1 calc(25% - 8px)",
			minWidth: 90,
		}}
	>
		<Icon
			size={14}
			style={{
				opacity: 0.7,
				color:
					typeof color === "string" && color.includes(".") ? undefined : color,
			}}
		/>
		<Box>
			<Typography
				variant="caption"
				sx={{
					fontSize: "0.58rem",
					color: "rgba(255,255,255,0.6)",
					display: "block",
					fontWeight: 700,
					letterSpacing: "0.5px",
				}}
			>
				{label}
			</Typography>
			<Typography
				variant="caption"
				sx={{
					fontWeight: 800,
					fontSize: "0.78rem",
					color,
				}}
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

	if (site.site_daily_flow) {
		Object.entries(site.site_daily_flow).forEach(([ticker, data]: any) => {
			const price = priceMap[ticker] || 0;
			if (data.flow > 0) {
				dailyRevenue += data.flow * price;
			} else if (data.flow < 0) {
				dailyExpenses += Math.abs(data.flow * price);
			}
		});
	}

	const dailyProfit = dailyRevenue - dailyExpenses;

	const buildingCount = site.production_lines
		.map((line) => line.capacity || 1)
		.reduce((a, b) => a + b, 0);

	const permitsUsed =
		site.invested_permits ??
		(site as any).building_count ??
		site.production_lines?.length ??
		0;
	const permitsMax =
		site.maximum_permits ?? (site as any).plots ?? site.area ?? 0;
	const permitsDisplay =
		permitsMax > 0 ? `${permitsUsed}/${permitsMax}` : `${permitsUsed}`;

	return (
		<Paper
			square
			elevation={0}
			sx={{
				p: 1.5,
				bgcolor: "rgba(16, 16, 32, 0.8)",
				borderBottom: "1px solid rgba(123, 104, 238, 0.25)",
			}}
		>
			{/* Row 1: Identity Bar */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 1.25,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					<Typography
						sx={{
							lineHeight: 1,
							color: "white",
							fontSize: "1.05rem",
							fontWeight: 900,
						}}
					>
						{site.planet_name_alt
							? `${site.planet_name_alt}`
							: site.planet_name}
					</Typography>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
						<MapPin size={12} color={theme.palette.text.secondary} />
						<Typography
							variant="caption"
							sx={{
								fontSize: "0.7rem",
								fontWeight: 700,
								color: "text.secondary",
							}}
						>
							{site.planet_name_alt
								? `${site.planet_name_alt} (${site.planet_name})`
								: site.planet_name}
						</Typography>
					</Box>
					{site.founded_timestamp && (
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<Calendar size={12} color={theme.palette.text.secondary} />
							<Typography
								variant="caption"
								sx={{
									fontSize: "0.7rem",
									fontWeight: 700,
									color: "text.secondary",
								}}
							>
								Est. {site.founded_timestamp.split("T")[0]}
							</Typography>
						</Box>
					)}
				</Box>

				<IconButton
					onClick={onClose}
					size="small"
					sx={{ color: "rgba(255,255,255,0.6)" }}
				>
					<X size={18} />
				</IconButton>
			</Box>

			{/* Row 2: Operational Stats (Balanced 4-Column Bar) */}
			<Box
				sx={{
					display: "flex",
					flexWrap: "wrap",
					gap: 1,
					justifyContent: "space-between",
				}}
			>
				<CompactStat label="BUILDINGS" value={buildingCount} icon={Building2} />
				<CompactStat label="PERMITS" value={permitsDisplay} icon={Package} />
				<CompactStat
					label="DAILY PROFIT"
					value={`${dailyProfit >= 0 ? "+" : ""}${(dailyProfit / 1000).toFixed(1)}k`}
					icon={DollarSign}
					color="#69f0ae"
				/>
				<CompactStat
					label="EXPENSES"
					value={`${(dailyExpenses / 1000).toFixed(1)}k`}
					icon={DollarSign}
					color="#ff5252"
				/>
			</Box>
		</Paper>
	);
};
