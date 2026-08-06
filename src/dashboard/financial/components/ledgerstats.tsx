import { Box, Typography } from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { DrawerRow, FlexCard } from "./sharedui";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";

interface LedgerStatsProps {
	stats: {
		totalReceived: number;
		totalPaid: number;
		net: number;
		cxVolume?: number;
		contractVolume?: number;
	} | null;
}

export const LedgerStats = ({ stats }: LedgerStatsProps) => {
	if (!stats) return null;

	return (
		<FlexCard>
			<Box
				px={2.5}
				py={1.25}
				display="flex"
				alignItems="center"
				borderBottom="1px solid rgba(255, 255, 255, 0.06)"
			>
				<SwapHorizIcon fontSize="small" sx={{ color: "#fbbf24", mr: 1 }} />
				<Typography
					fontWeight={700}
					fontSize="0.75rem"
					sx={{
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						color: "rgba(255,255,255,0.8)",
					}}
				>
					30-Day Ledger
				</Typography>
			</Box>
			<Box sx={{ display: "flex", flexDirection: "column" }}>
				<DrawerRow
					label="Total Received"
					value={`+${formatCurrency(stats.totalReceived)}`}
					valueColor={SEMANTIC_COLORS.neonGreen}
					isMonospace
				/>
				<DrawerRow
					label="Total Paid"
					value={`-${formatCurrency(stats.totalPaid)}`}
					valueColor={SEMANTIC_COLORS.neonRed}
					isMonospace
				/>
				<DrawerRow
					label="Net Volume"
					value={`${stats.net > 0 ? "+" : ""}${formatCurrency(stats.net)}`}
					valueColor={
						stats.net >= 0 ? SEMANTIC_COLORS.neonGreen : SEMANTIC_COLORS.neonRed
					}
					isMonospace
				/>
				{stats.cxVolume !== undefined && stats.cxVolume > 0 && (
					<DrawerRow
						label="CX Volume"
						value={formatCurrency(stats.cxVolume)}
						valueColor="#60a5fa"
						isMonospace
					/>
				)}
				{stats.contractVolume !== undefined && stats.contractVolume > 0 && (
					<DrawerRow
						label="Contract Volume"
						value={formatCurrency(stats.contractVolume)}
						valueColor="#fbbf24"
						isMonospace
						noBorder
					/>
				)}
			</Box>
		</FlexCard>
	);
};
