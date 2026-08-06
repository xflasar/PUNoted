import React from "react";
import { Box, Typography, Tooltip, alpha, useTheme } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LockIcon from "@mui/icons-material/Lock";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import StorefrontIcon from "@mui/icons-material/Storefront";
import InventoryIcon from "@mui/icons-material/Inventory2";
import { formatCurrency } from "../utils/financeutils";
import { FlexCard } from "./sharedui";

const KPIBlock = ({ title, value, icon, color, isNet = false, guide }: any) => (
	<FlexCard sx={{ p: 1.5, justifyContent: "center" }}>
		<Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
			<Box
				sx={{
					color,
					display: "flex",
					alignItems: "center",
				}}
			>
				{React.cloneElement(icon, { sx: { fontSize: 16 } })}
			</Box>
			<Tooltip title={guide} arrow placement="top">
				<Typography
					sx={{
						color: "text.secondary",
						fontSize: "0.68rem",
						fontWeight: 700,
						textTransform: "uppercase",
						letterSpacing: "0.5px",
						cursor: "help",
						borderBottom: "1px dashed rgba(255, 255, 255, 0.25)",
						pb: 0.1,
					}}
				>
					{title}
				</Typography>
			</Tooltip>
		</Box>
		<Typography
			sx={{
				color: isNet && value < 0 ? "error.main" : "text.primary",
				fontSize: { xs: "1rem", lg: "1.1rem" },
				fontWeight: 800,
				whiteSpace: "nowrap",
			}}
		>
			{isNet && value > 0 ? "+" : ""}
			{formatCurrency(value, Math.abs(value) >= 1000 ? 0 : 2)}
		</Typography>
	</FlexCard>
);

export const KPISection = ({
	currentData,
	netPending,
	volumeBreakdown,
}: any) => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: {
					xs: "repeat(2, 1fr)",
					sm: "repeat(3, 1fr)",
					md: "repeat(4, 1fr)",
					xl: "repeat(8, 1fr)",
				},
				gap: 1.5,
				flexShrink: 0,
			}}
		>
			<KPIBlock
				title="Total Assets (WIP)"
				value={currentData.TotalAssets}
				icon={<AccountBalanceIcon />}
				color={theme.palette.primary.main}
				guide="Liquid Cash + CX Buy + CX Sell + Surplus Inventory + Pending Receivable."
			/>
			<KPIBlock
				title="Liquid Cash"
				value={currentData.Liquid}
				icon={<AccountBalanceWalletIcon />}
				color={theme.palette.success.main}
				guide="Funds currently available."
			/>
			<KPIBlock
				title="Surplus Inv. (WIP)"
				value={currentData.InventoryValue}
				icon={<InventoryIcon />}
				color={theme.palette.info.main}
				guide="Market value of tradeable items in Stations/Ships."
			/>
			<KPIBlock
				title="CX Buy"
				value={currentData.LockedBuy}
				icon={<LockIcon />}
				color={theme.palette.warning.main}
				guide="Cash tied up in open CX BUY orders."
			/>
			<KPIBlock
				title="CX Sell"
				value={currentData.LockedSell}
				icon={<StorefrontIcon />}
				color={theme.palette.primary.main}
				guide="Market value of inventory in open CX SELL orders."
			/>
			<KPIBlock
				title="Net Contracts (WIP)"
				value={netPending}
				icon={<SwapHorizIcon />}
				color={
					netPending >= 0
						? theme.palette.success.main
						: theme.palette.error.main
				}
				isNet={true}
				guide="Receivables minus Payables."
			/>
			{volumeBreakdown && (
				<>
					<KPIBlock
						title="30D CX Vol."
						value={volumeBreakdown.cx}
						icon={<StorefrontIcon />}
						color="#00e5ff"
						guide="Total CX trade volume (buys + sells) in last 30 days."
					/>
					<KPIBlock
						title="30D Contract Vol."
						value={volumeBreakdown.contract}
						icon={<SwapHorizIcon />}
						color="#ffa726"
						guide="Total contract payment volume in last 30 days."
					/>
				</>
			)}
		</Box>
	);
};
