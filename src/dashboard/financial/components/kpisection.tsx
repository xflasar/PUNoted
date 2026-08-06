import React from "react";
import {
	Box,
	Typography,
	Tooltip,
	Skeleton,
	Checkbox,
	FormControlLabel,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LockIcon from "@mui/icons-material/Lock";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import StorefrontIcon from "@mui/icons-material/Storefront";
import InventoryIcon from "@mui/icons-material/Inventory2";
import TuneIcon from "@mui/icons-material/Tune";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";

interface KPIMetricItemProps {
	title: string;
	value: number;
	color: string;
	isNet?: boolean;
	guide: string;
	loading?: boolean;
	isPrimary?: boolean;
}

const KPIMetricItem = ({
	title,
	value,
	color,
	isNet = false,
	guide,
	loading,
	isPrimary = false,
}: KPIMetricItemProps) => {
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				px: 1.5,
				py: 0.75,
				flex: 1,
				minWidth: 0,
			}}
		>
			<Box display="flex" alignItems="center" gap={0.75} mb={0.25}>
				<Box
					sx={{
						width: 6,
						height: 6,
						borderRadius: "50%",
						bgcolor: color,
						boxShadow: `0 0 8px ${color}`,
						flexShrink: 0,
					}}
				/>
				<Tooltip title={guide} arrow placement="top">
					<Typography
						sx={{
							color: "rgba(255, 255, 255, 0.45)",
							fontSize: "0.6rem",
							fontWeight: 800,
							textTransform: "uppercase",
							letterSpacing: "0.08em",
							cursor: "help",
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{title}
					</Typography>
				</Tooltip>
			</Box>

			{loading ? (
				<Skeleton
					variant="text"
					width="80%"
					height={22}
					sx={{ bgcolor: "rgba(255, 255, 255, 0.08)" }}
				/>
			) : (
				<Typography
					sx={{
						color:
							isNet && value < 0
								? SEMANTIC_COLORS.neonRed
								: isPrimary
									? "#ffffff"
									: "rgba(255, 255, 255, 0.9)",
						fontSize: isPrimary ? "1rem" : "0.88rem",
						fontWeight: 800,
						fontFamily: "monospace",
						lineHeight: 1.1,
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{isNet && value > 0 ? "+" : ""}
					{formatCurrency(value, Math.abs(value) >= 1000 ? 0 : 2)}
				</Typography>
			)}
		</Box>
	);
};

export const KPISection = ({
	currentData,
	netPending,
	volumeBreakdown,
	loading,
	isAdvancedView,
	onToggleAdvancedView,
}: any) => {
	const totalVol =
		(volumeBreakdown?.cx || 0) + (volumeBreakdown?.contract || 0);

	return (
		<Box
			sx={{
				width: "100%",
				display: "flex",
				alignItems: "center",
				backgroundColor: "rgba(4, 4, 10, 0.75)",
				border: `1px solid ${isAdvancedView ? "rgba(123, 104, 238, 0.4)" : "rgba(123, 104, 238, 0.2)"}`,
				borderRadius: "12px",
				backdropFilter: "blur(25px)",
				boxShadow: isAdvancedView
					? "0 0 25px rgba(123, 104, 238, 0.15)"
					: "0 4px 20px rgba(0, 0, 0, 0.4)",
				py: 0.5,
				px: 1,
				flexShrink: 0,
				transition: "all 0.25s ease-in-out",
				"& > *:not(:last-child)": {
					borderRight: "1px solid rgba(255, 255, 255, 0.08)",
				},
			}}
		>
			<KPIMetricItem
				title="Total Assets"
				value={currentData?.TotalAssets || 0}
				color={SEMANTIC_COLORS.neonPurple}
				guide="Liquid Cash + Locked Bids + CX Sell Listings + Surplus Warehouse Stock + Receivables."
				loading={loading}
				isPrimary
			/>
			<KPIMetricItem
				title="Liquid Cash"
				value={currentData?.Liquid || 0}
				color={SEMANTIC_COLORS.neonGreen}
				guide="Immediately available unencumbered funds."
				loading={loading}
				isPrimary
			/>

			{/* Advanced Granular View vs Simple Mode View */}
			{isAdvancedView ? (
				<>
					<KPIMetricItem
						title="Surplus Stock"
						value={currentData?.InventoryValue || 0}
						color={SEMANTIC_COLORS.neonBlue}
						guide="Base inventory sitting in stations/ships."
						loading={loading}
					/>
					<KPIMetricItem
						title="CX Buy Bids"
						value={currentData?.LockedBuy || 0}
						color={SEMANTIC_COLORS.neonGold}
						guide="Capital locked inside open CX BUY bids."
						loading={loading}
					/>
					<KPIMetricItem
						title="CX Sell Listings"
						value={currentData?.LockedSell || 0}
						color="#c084fc"
						guide="Market value of commodities actively listed on CX SELL orders."
						loading={loading}
					/>
					<KPIMetricItem
						title="Net Contracts"
						value={netPending || 0}
						color={
							(netPending || 0) >= 0
								? SEMANTIC_COLORS.neonGreen
								: SEMANTIC_COLORS.neonRed
						}
						isNet={true}
						guide="Pending Receivables minus Pending Payables."
						loading={loading}
					/>
					<KPIMetricItem
						title="30D CX Volume"
						value={volumeBreakdown?.cx || 0}
						color={SEMANTIC_COLORS.neonBlue}
						guide="Total CX trade volume (buys + sells) over the last 30 days."
						loading={loading}
					/>
					<KPIMetricItem
						title="30D Contract Vol."
						value={volumeBreakdown?.contract || 0}
						color={SEMANTIC_COLORS.neonGold}
						guide="Total contract payment volume over the last 30 days."
						loading={loading}
					/>
				</>
			) : (
				<>
					<KPIMetricItem
						title="Market Inventory"
						value={
							(currentData?.InventoryValue || 0) +
							(currentData?.LockedSell || 0)
						}
						color={SEMANTIC_COLORS.neonBlue}
						guide="Base Surplus Inventory + Commodities currently listed on CX SELL orders."
						loading={loading}
					/>
					<KPIMetricItem
						title="CX Buy Locked"
						value={currentData?.LockedBuy || 0}
						color={SEMANTIC_COLORS.neonGold}
						guide="Capital locked inside open CX BUY bids."
						loading={loading}
					/>
					<KPIMetricItem
						title="Net Contracts"
						value={netPending || 0}
						color={
							(netPending || 0) >= 0
								? SEMANTIC_COLORS.neonGreen
								: SEMANTIC_COLORS.neonRed
						}
						isNet={true}
						guide="Pending Receivables minus Pending Payables."
						loading={loading}
					/>
					<KPIMetricItem
						title="30D Turnover"
						value={totalVol}
						color="#c084fc"
						guide="Total combined volume moved through CX and Contracts over the last 30 days."
						loading={loading}
					/>
				</>
			)}

			{/* Persistent View Switcher Control */}
			<Box
				sx={{
					px: 1.5,
					display: "flex",
					alignItems: "center",
					borderRight: "none !important",
				}}
			>
				<FormControlLabel
					control={
						<Checkbox
							size="small"
							checked={isAdvancedView}
							onChange={(e) => onToggleAdvancedView(e.target.checked)}
							icon={
								<TuneIcon
									sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}
								/>
							}
							checkedIcon={<TuneIcon sx={{ fontSize: 16, color: "#7b68ee" }} />}
							sx={{ p: 0.5 }}
						/>
					}
					label={
						<Typography
							sx={{
								fontSize: "0.68rem",
								fontWeight: 800,
								color: isAdvancedView ? "#7b68ee" : "rgba(255,255,255,0.5)",
								textTransform: "uppercase",
								letterSpacing: "0.06em",
								userSelect: "none",
							}}
						>
							Advanced
						</Typography>
					}
					sx={{ ml: 0, mr: 0, gap: 0.5 }}
				/>
			</Box>
		</Box>
	);
};
