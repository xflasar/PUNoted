import React from "react";
import { Box, Typography, Chip, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import type { Bank } from "../types";
import { formatAmount } from "../../../utils/formaters";

interface BankDetailMetricsProps {
	bank: Bank;
	currentMoney: number;
	lentCount: number;
	totalLentAmount: number;
	netCustomerDeposits: number;
}

export const BankDetailMetrics: React.FC<BankDetailMetricsProps> = ({
	bank,
	currentMoney,
	lentCount,
	totalLentAmount,
	netCustomerDeposits,
}) => {
	const theme = useTheme();
	const currency = bank.currency || "ICA";
	const rate = bank.default_interest_rate ?? 5;
	const rateText =
		bank.max_interest_rate &&
		bank.max_interest_rate > (bank.default_interest_rate ?? 0)
			? `${bank.default_interest_rate}% - ${bank.max_interest_rate}% / interval`
			: `${rate}% / interval`;
	const rateColor =
		rate <= 5
			? theme.palette.success.main
			: rate <= 10
				? theme.palette.primary.main
				: theme.palette.warning.main;

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: { xs: "1fr", sm: "1.2fr 1.8fr" },
				borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
			}}
		>
			{/* Left Box: Current Money (Available Liquidity) */}
			<Box
				sx={{
					p: 2.2,
					px: 2.5,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					borderRight: {
						xs: "none",
						sm: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
					},
					borderBottom: {
						xs: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
						sm: "none",
					},
					bgcolor: alpha(theme.palette.background.paper, 0.35),
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
					<AccountBalanceWalletOutlinedIcon
						sx={{ fontSize: 16, color: "success.main" }}
					/>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 800,
							textTransform: "uppercase",
							letterSpacing: 0.6,
							fontSize: "0.68rem",
						}}
					>
						Current Vault Liquidity
					</Typography>
				</Box>
				<Typography
					variant="h4"
					sx={{
						fontWeight: 900,
						color: theme.palette.success.main,
						letterSpacing: 0.3,
						fontSize: { xs: "1.5rem", md: "1.75rem" },
						lineHeight: 1.15,
					}}
				>
					{formatAmount(currentMoney)}{" "}
					<span
						style={{
							fontSize: "0.85rem",
							color: theme.palette.text.secondary,
							fontWeight: 700,
						}}
					>
						{currency}
					</span>
				</Typography>
				<Typography
					variant="caption"
					sx={{ color: "text.secondary", fontSize: "0.68rem", mt: 0.4 }}
				>
					Available capital for loan disbursement
				</Typography>
			</Box>

			{/* Right Box: Interest Rate on top, Lent / Total Lent split below */}
			<Box sx={{ display: "flex", flexDirection: "column" }}>
				{/* Top Strip: Interest Rate & Weekly Yield */}
				<Box
					sx={{
						py: 0.8,
						px: 2,
						borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
						bgcolor: alpha(theme.palette.primary.main, 0.05),
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						flexWrap: "wrap",
						gap: 1,
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1.5,
							flexWrap: "wrap",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
							<PercentOutlinedIcon sx={{ fontSize: 15, color: rateColor }} />
							<Typography
								variant="subtitle2"
								sx={{ fontWeight: 800, color: rateColor, fontSize: "0.82rem" }}
							>
								{rateText} Loan Rate
							</Typography>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
							<TrendingUpOutlinedIcon sx={{ fontSize: 15, color: "#34d399" }} />
							<Typography
								variant="subtitle2"
								sx={{ fontWeight: 800, color: "#34d399", fontSize: "0.82rem" }}
							>
								{bank.max_weekly_yield_rate
									? `${bank.weekly_yield_rate || 1.0}% - ${bank.max_weekly_yield_rate}%/mo Yield`
									: `${bank.weekly_yield_rate || 1.0}%/mo Yield`}
							</Typography>
						</Box>
					</Box>

					<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
						{bank.deposit_status === "PAUSED" && (
							<Chip
								label="DEPOSITS PAUSED"
								size="small"
								sx={{
									fontWeight: 800,
									height: 18,
									fontSize: "0.6rem",
									bgcolor: alpha("#ef4444", 0.15),
									color: "#f87171",
									border: `1px solid ${alpha("#ef4444", 0.3)}`,
								}}
							/>
						)}
						{bank.deposit_status === "NEAR_CAPACITY" && (
							<Chip
								label="NEAR CAPACITY"
								size="small"
								sx={{
									fontWeight: 800,
									height: 18,
									fontSize: "0.6rem",
									bgcolor: alpha("#f59e0b", 0.15),
									color: "#fbbf24",
									border: `1px solid ${alpha("#f59e0b", 0.3)}`,
								}}
							/>
						)}
						<Chip
							label="Standard Terms"
							size="small"
							variant="outlined"
							sx={{
								fontWeight: 800,
								height: 18,
								fontSize: "0.62rem",
								borderColor: alpha(rateColor, 0.4),
								color: rateColor,
							}}
						/>
					</Box>
				</Box>

				{/* Bottom Split: Lent Count | Total Volume | Client Deposits */}
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
						height: "100%",
					}}
				>
					{/* Lent (Count) */}
					<Box
						sx={{
							p: 1.25,
							px: 1.8,
							borderRight: {
								xs: "none",
								sm: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
							},
							borderBottom: {
								xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
								sm: "none",
							},
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontWeight: 800,
								textTransform: "uppercase",
								fontSize: "0.62rem",
							}}
						>
							Issued Loans
						</Typography>
						<Typography
							variant="subtitle1"
							sx={{
								fontWeight: 800,
								color: "text.primary",
								lineHeight: 1.2,
								mt: 0.2,
							}}
						>
							{lentCount}
						</Typography>
						<Typography
							variant="caption"
							sx={{ color: "text.secondary", fontSize: "0.62rem" }}
						>
							Total contracts
						</Typography>
					</Box>

					{/* Total Lent (Volume) */}
					<Box
						sx={{
							p: 1.25,
							px: 1.8,
							borderRight: {
								xs: "none",
								sm: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
							},
							borderBottom: {
								xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
								sm: "none",
							},
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<TrendingUpOutlinedIcon
								sx={{ fontSize: 13, color: "primary.main" }}
							/>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontWeight: 800,
									textTransform: "uppercase",
									fontSize: "0.62rem",
								}}
							>
								Total Lent
							</Typography>
						</Box>
						<Typography
							variant="subtitle1"
							sx={{
								fontWeight: 800,
								color: "primary.main",
								lineHeight: 1.2,
								mt: 0.2,
							}}
						>
							{formatAmount(totalLentAmount)}{" "}
							<span
								style={{
									fontSize: "0.65rem",
									color: theme.palette.text.secondary,
								}}
							>
								{currency}
							</span>
						</Typography>
						<Typography
							variant="caption"
							sx={{ color: "text.secondary", fontSize: "0.62rem" }}
						>
							Total volume
						</Typography>
					</Box>

					{/* Net Customer Deposits */}
					<Box
						sx={{
							p: 1.25,
							px: 1.8,
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<SavingsOutlinedIcon
								sx={{ fontSize: 13, color: "success.main" }}
							/>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontWeight: 800,
									textTransform: "uppercase",
									fontSize: "0.62rem",
								}}
							>
								Client Deposits
							</Typography>
						</Box>
						<Typography
							variant="subtitle1"
							sx={{
								fontWeight: 800,
								color: theme.palette.success.light,
								lineHeight: 1.2,
								mt: 0.2,
							}}
						>
							{formatAmount(netCustomerDeposits)}{" "}
							<span
								style={{
									fontSize: "0.65rem",
									color: theme.palette.text.secondary,
								}}
							>
								{currency}
							</span>
						</Typography>
						<Typography
							variant="caption"
							sx={{ color: "text.secondary", fontSize: "0.62rem" }}
						>
							Held in vault
						</Typography>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};
