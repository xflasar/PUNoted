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
	pledgedLiquidity?: number;
	activeOutstandingCapital?: number;
	lentCount: number;
	totalLentAmount: number;
	netCustomerDeposits: number;
}

export const BankDetailMetrics: React.FC<BankDetailMetricsProps> = ({
	bank,
	currentMoney,
	pledgedLiquidity,
	activeOutstandingCapital,
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
				display: "flex",
				flexDirection: "column",
				borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
			}}
		>
			{/* Top clean rates row */}
			<Box
				sx={{
					py: 0.75,
					px: { xs: 1.5, sm: 2.5 },
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					bgcolor: alpha(theme.palette.background.default, 0.5),
					borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
					flexWrap: "wrap",
					gap: 1,
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 2,
						flexWrap: "wrap",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
						<PercentOutlinedIcon sx={{ fontSize: 13, color: rateColor }} />
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontWeight: 700,
								fontSize: "0.68rem",
							}}
						>
							LOANS:
						</Typography>
						<Typography
							variant="caption"
							sx={{ fontWeight: 800, color: rateColor, fontSize: "0.72rem" }}
						>
							{rateText}
						</Typography>
					</Box>

					<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
						<TrendingUpOutlinedIcon sx={{ fontSize: 13, color: "#34d399" }} />
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontWeight: 700,
								fontSize: "0.68rem",
							}}
						>
							YIELD:
						</Typography>
						<Typography
							variant="caption"
							sx={{ fontWeight: 800, color: "#34d399", fontSize: "0.72rem" }}
						>
							{bank.max_weekly_yield_rate
								? `${bank.weekly_yield_rate || 1.0}% - ${bank.max_weekly_yield_rate}%/mo`
								: `${bank.weekly_yield_rate || 1.0}%/mo`}
						</Typography>
					</Box>
				</Box>

				<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
					{bank.deposit_status === "PAUSED" ? (
						<Chip
							label="DEPOSITS PAUSED"
							size="small"
							sx={{
								fontWeight: 800,
								height: 18,
								fontSize: "0.58rem",
								bgcolor: alpha("#ef4444", 0.15),
								color: "#f87171",
								border: `1px solid ${alpha("#ef4444", 0.3)}`,
							}}
						/>
					) : (
						<Chip
							label="OPEN FOR DEPOSITS"
							size="small"
							sx={{
								fontWeight: 800,
								height: 18,
								fontSize: "0.58rem",
								bgcolor: alpha("#10b981", 0.12),
								color: "#34d399",
								border: `1px solid ${alpha("#10b981", 0.3)}`,
							}}
						/>
					)}
				</Box>
			</Box>

			{/* 3 Core Numbers: Vault Liquidity | Total Lent | Customer Deposits */}
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: { xs: "1.2fr 1fr 1fr", sm: "1.4fr 1fr 1fr" },
					bgcolor: alpha(theme.palette.background.paper, 0.25),
				}}
			>
				{/* 1. Vault Liquidity */}
				<Box
					sx={{
						py: { xs: 1, sm: 1.5 },
						px: { xs: 1.25, sm: 2.5 },
						borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
					}}
				>
					<Box
						sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.2 }}
					>
						<AccountBalanceWalletOutlinedIcon
							sx={{ fontSize: 13, color: "success.main" }}
						/>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontWeight: 800,
								textTransform: "uppercase",
								fontSize: "0.6rem",
								letterSpacing: 0.5,
							}}
						>
							Available Amount
						</Typography>
					</Box>
					<Typography
						variant="h6"
						sx={{
							fontWeight: 900,
							color: theme.palette.success.main,
							letterSpacing: -0.2,
							fontSize: { xs: "1.05rem", sm: "1.35rem" },
							lineHeight: 1.1,
						}}
					>
						{formatAmount(currentMoney)}{" "}
						<span
							style={{
								fontSize: "0.65rem",
								color: theme.palette.text.secondary,
								fontWeight: 700,
							}}
						>
							{currency}
						</span>
					</Typography>
					{pledgedLiquidity !== undefined && (
						<Box sx={{ mt: 0.3 }}>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.62rem",
									fontWeight: 600,
									display: "block",
									lineHeight: 1.2,
								}}
							>
								Total Vault: {formatAmount(pledgedLiquidity)} {currency}
								{activeOutstandingCapital
									? ` • ${formatAmount(activeOutstandingCapital)} lent`
									: ""}
							</Typography>
						</Box>
					)}
				</Box>

				{/* 2. Total Lent */}
				<Box
					sx={{
						py: { xs: 1, sm: 1.5 },
						px: { xs: 1, sm: 2 },
						borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
					}}
				>
					<Box
						sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.2 }}
					>
						<TrendingUpOutlinedIcon
							sx={{ fontSize: 13, color: "primary.main" }}
						/>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontWeight: 800,
								textTransform: "uppercase",
								fontSize: "0.6rem",
							}}
						>
							Lent ({lentCount})
						</Typography>
					</Box>
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 800,
							color: "primary.main",
							fontSize: { xs: "0.85rem", sm: "1.05rem" },
							lineHeight: 1.1,
						}}
					>
						{formatAmount(totalLentAmount)}{" "}
						<span
							style={{
								fontSize: "0.6rem",
								color: theme.palette.text.secondary,
							}}
						>
							{currency}
						</span>
					</Typography>
				</Box>

				{/* 3. Customer Deposits */}
				<Box
					sx={{
						py: { xs: 1, sm: 1.5 },
						px: { xs: 1, sm: 2 },
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
					}}
				>
					<Box
						sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.2 }}
					>
						<SavingsOutlinedIcon
							sx={{ fontSize: 13, color: "success.light" }}
						/>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontWeight: 800,
								textTransform: "uppercase",
								fontSize: "0.6rem",
							}}
						>
							Deposits
						</Typography>
					</Box>
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 800,
							color: theme.palette.success.light,
							fontSize: { xs: "0.85rem", sm: "1.05rem" },
							lineHeight: 1.1,
						}}
					>
						{formatAmount(netCustomerDeposits)}{" "}
						<span
							style={{
								fontSize: "0.6rem",
								color: theme.palette.text.secondary,
							}}
						>
							{currency}
						</span>
					</Typography>
				</Box>
			</Box>
		</Box>
	);
};
