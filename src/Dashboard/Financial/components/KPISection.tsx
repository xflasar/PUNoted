import React from "react";
import { Box, Typography, alpha, useTheme } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LockIcon from "@mui/icons-material/Lock";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import StorefrontIcon from "@mui/icons-material/Storefront";
import InventoryIcon from "@mui/icons-material/Inventory2";
import { formatCurrency } from "../utils/financeUtils";
import { FlexCard, Guide } from "./SharedUi";

const KPIBlock = ({ title, value, icon, color, isNet = false, guide }: any) => (
	<FlexCard sx={{ p: 1.5, justifyContent: "center" }}>
		<Box
			display="flex"
			justifyContent="space-between"
			alignItems="center"
			mb={0.5}
		>
			<Box display="flex" alignItems="center">
				<Typography
					sx={{
						color: "text.secondary",
						fontSize: "0.7rem",
						fontWeight: 700,
						textTransform: "uppercase",
						letterSpacing: "0.5px",
					}}
				>
					{title}
				</Typography>
				<Guide text={guide} />
			</Box>
			<Box
				sx={{
					color,
					display: "flex",
					bgcolor: alpha(color, 0.1),
					p: 0.5,
					borderRadius: "4px",
				}}
			>
				{React.cloneElement(icon, { fontSize: "small" })}
			</Box>
		</Box>
		<Typography
			sx={{
				color: isNet && value < 0 ? "error.main" : "text.primary",
				fontSize: { xs: "1.15rem", lg: "1.25rem" },
				fontWeight: 800,
			}}
		>
			{isNet && value > 0 ? "+" : ""}
			{formatCurrency(value)}
		</Typography>
	</FlexCard>
);

export const KPISection = ({ currentData, netPending }: any) => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: {
					xs: "1fr",
					sm: "repeat(2, 1fr)",
					md: "repeat(3, 1fr)",
					xl: "repeat(6, 1fr)",
				},
				gap: 2,
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
		</Box>
	);
};
