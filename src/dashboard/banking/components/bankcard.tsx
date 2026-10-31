import React from "react";
import {
	Card,
	CardActionArea,
	Typography,
	Box,
	Chip,
	Tooltip,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PersonIcon from "@mui/icons-material/Person";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import CircleIcon from "@mui/icons-material/Circle";
import type { Bank, BankLoanComparison } from "../types";
import {
	formatAmount,
	formatTermWeeks,
	formatPaymentIntervalShort,
	getOwnerActiveStatus,
} from "../helpers";

export const getCleanBankIntro = (bank: Bank): string | null => {
	const text = bank.headline?.trim();
	if (!text) return null;
	return text.length > 100 ? `${text.slice(0, 100)}...` : text;
};

export interface BankCardProps {
	bank: Bank;
	isMyBank?: boolean;
	loanComparison?: BankLoanComparison | null;
	depositComparison?: import("../types").BankDepositComparison | null;
	onClick?: () => void;
	onInspect?: (bank: Bank) => void;
}

export const BankCard: React.FC<BankCardProps> = ({
	bank,
	isMyBank,
	loanComparison,
	depositComparison,
	onClick,
	onInspect,
}) => {
	const theme = useTheme();

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

	const isDemo = bank.id < 0;
	const currentMoney = bank.liquidity || 0;
	const lentCount = bank.total_loans_count ?? bank.active_loans_count ?? 0;
	const introText = getCleanBankIntro(bank);
	const ownerActivity = getOwnerActiveStatus(
		bank.owner_last_active,
		bank.owner_is_synchronized !== false,
	);

	const handleClick = () => {
		if (onClick) {
			onClick();
		} else if (onInspect) {
			onInspect(bank);
		}
	};

	return (
		<Card
			elevation={0}
			sx={{
				borderRadius: 2,
				bgcolor: alpha(theme.palette.background.paper, 0.45),
				backdropFilter: "blur(12px)",
				border: isMyBank
					? `1.5px solid ${theme.palette.primary.main}`
					: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
				transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
				position: "relative",
				overflow: "hidden",
				display: "flex",
				flexDirection: "column",
				height: "100%",
				"&:hover": {
					transform: "translateY(-3px)",
					borderColor: theme.palette.primary.main,
					boxShadow: `0 8px 24px -4px ${alpha(theme.palette.primary.main, 0.25)}`,
					bgcolor: alpha(theme.palette.background.paper, 0.65),
				},
			}}
		>
			<CardActionArea
				onClick={handleClick}
				sx={{
					p: 2.5,
					flex: 1,
					display: "flex",
					flexDirection: "column",
					alignItems: "stretch",
					justifyContent: "space-between",
					gap: 1.5,
				}}
			>
				{/* Top Row: Bank Name / Ticker & Badges */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						gap: 1,
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1.25,
							minWidth: 0,
						}}
					>
						<Box
							sx={{
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(theme.palette.primary.main, 0.12),
								color: theme.palette.primary.main,
								border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
								flexShrink: 0,
							}}
						>
							<AccountBalanceIcon sx={{ fontSize: 22 }} />
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
								<Typography
									variant="subtitle1"
									sx={{
										fontWeight: 800,
										letterSpacing: 0.3,
										lineHeight: 1.2,
										color: theme.palette.text.primary,
										fontSize: "0.95rem",
									}}
									noWrap
								>
									{bank.name}
								</Typography>
								{isDemo && (
									<Chip
										label="DEMO"
										size="small"
										color="primary"
										variant="outlined"
										sx={{ fontWeight: 800, fontSize: "0.6rem", height: 18 }}
									/>
								)}
							</Box>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 0.6,
									mt: 0.25,
									flexWrap: "wrap",
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
									<PersonIcon sx={{ fontSize: 13, color: "text.secondary" }} />
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontWeight: 600,
											fontSize: "0.72rem",
										}}
										noWrap
									>
										{bank.owner_username}
									</Typography>
								</Box>
								<Tooltip
									title={`Banker Status: ${ownerActivity.label} (Synced: ${bank.owner_is_synchronized !== false ? "Yes" : "No"})`}
								>
									<Box
										sx={{
											display: "inline-flex",
											alignItems: "center",
											gap: 0.4,
											px: 0.6,
											py: 0.1,
											borderRadius: 1,
											bgcolor: alpha(ownerActivity.dotColor, 0.1),
											border: `1px solid ${alpha(ownerActivity.dotColor, 0.25)}`,
										}}
									>
										<CircleIcon
											sx={{ fontSize: 6, color: ownerActivity.dotColor }}
										/>
										<Typography
											variant="caption"
											sx={{
												color: ownerActivity.color,
												fontWeight: 700,
												fontSize: "0.62rem",
												lineHeight: 1,
											}}
										>
											{ownerActivity.label}
										</Typography>
									</Box>
								</Tooltip>
							</Box>
						</Box>
					</Box>

					{/* Badges on right: MY BANK, Deposit Status, Currency, Rate */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.75,
							flexShrink: 0,
							flexWrap: "wrap",
							justifyContent: "flex-end",
						}}
					>
						{isMyBank && (
							<Chip
								label="MY BANK"
								size="small"
								color="primary"
								sx={{ fontWeight: 800, fontSize: "0.65rem", height: 22 }}
							/>
						)}
						{bank.deposit_status === "PAUSED" ? (
							<Chip
								label="DEPOSITS PAUSED"
								size="small"
								sx={{
									fontWeight: 800,
									fontSize: "0.62rem",
									height: 22,
									bgcolor: alpha("#ef4444", 0.15),
									color: "#f87171",
									border: `1px solid ${alpha("#ef4444", 0.3)}`,
								}}
							/>
						) : bank.deposit_status === "NEAR_CAPACITY" ? (
							<Chip
								label="NEAR CAPACITY"
								size="small"
								sx={{
									fontWeight: 800,
									fontSize: "0.62rem",
									height: 22,
									bgcolor: alpha("#f59e0b", 0.15),
									color: "#fbbf24",
									border: `1px solid ${alpha("#f59e0b", 0.3)}`,
								}}
							/>
						) : null}
						<Chip
							label={bank.currency || "ICA"}
							size="small"
							variant="outlined"
							sx={{ fontWeight: 800, fontSize: "0.68rem", height: 22 }}
						/>
						<Chip
							label={rateText}
							size="small"
							sx={{
								fontWeight: 800,
								fontSize: "0.72rem",
								height: 22,
								bgcolor: alpha(rateColor, 0.12),
								color: rateColor,
								border: `1px solid ${alpha(rateColor, 0.3)}`,
							}}
						/>
					</Box>
				</Box>

				{/* Owner Headline */}
				{introText && (
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 600,
							fontStyle: "italic",
							fontSize: "0.75rem",
							display: "-webkit-box",
							WebkitLineClamp: 2,
							WebkitBoxOrient: "vertical",
							overflow: "hidden",
							lineHeight: 1.35,
						}}
					>
						"{introText}"
					</Typography>
				)}

				{/* Borrower Loan Assessment */}
				{loanComparison ? (
					<Box
						sx={{
							p: 1.25,
							borderRadius: 1.5,
							bgcolor:
								!loanComparison.withinMinMax ||
								!loanComparison.hasSufficientLiquidity
									? alpha("#ef4444", 0.08)
									: loanComparison.statusTier === "COMFORTABLE"
										? alpha("#10b981", 0.08)
										: loanComparison.statusTier === "TIGHT"
											? alpha("#f59e0b", 0.08)
											: alpha("#ef4444", 0.08),
							border: `1px solid ${
								!loanComparison.withinMinMax ||
								!loanComparison.hasSufficientLiquidity
									? alpha("#ef4444", 0.3)
									: loanComparison.statusTier === "COMFORTABLE"
										? alpha("#10b981", 0.3)
										: loanComparison.statusTier === "TIGHT"
											? alpha("#f59e0b", 0.3)
											: alpha("#ef4444", 0.3)
							}`,
							display: "flex",
							flexDirection: "column",
							gap: 0.8,
						}}
					>
						{/* Fit Status Header */}
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
								{loanComparison.isProfitMatch && loanComparison.withinMinMax ? (
									<CheckCircleIcon sx={{ fontSize: 15, color: "#34d399" }} />
								) : (
									<WarningAmberIcon
										sx={{
											fontSize: 15,
											color:
												loanComparison.statusTier === "TIGHT"
													? "#fbbf24"
													: "#f87171",
										}}
									/>
								)}
								<Typography
									variant="caption"
									sx={{
										fontWeight: 800,
										fontSize: "0.7rem",
										color:
											!loanComparison.withinMinMax ||
											!loanComparison.hasSufficientLiquidity
												? "#f87171"
												: loanComparison.statusTier === "COMFORTABLE"
													? "#34d399"
													: loanComparison.statusTier === "TIGHT"
														? "#fbbf24"
														: "#f87171",
										letterSpacing: 0.3,
									}}
								>
									{!loanComparison.withinMinMax
										? "OUT OF RANGE"
										: !loanComparison.hasSufficientLiquidity
											? "LOW LIQUIDITY"
											: loanComparison.statusTier === "COMFORTABLE"
												? "COMFORTABLE"
												: loanComparison.statusTier === "TIGHT"
													? "HEAVY LOAD"
													: "EXCEEDS PROFIT"}
								</Typography>
							</Box>

							{loanComparison.userProfitSharePercent > 0 && (
								<Chip
									label={`${loanComparison.userProfitSharePercent}% of profit`}
									size="small"
									sx={{
										height: 18,
										fontSize: "0.62rem",
										fontWeight: 800,
										bgcolor:
											loanComparison.statusTier === "COMFORTABLE"
												? alpha("#10b981", 0.15)
												: loanComparison.statusTier === "TIGHT"
													? alpha("#f59e0b", 0.15)
													: alpha("#ef4444", 0.15),
										color:
											loanComparison.statusTier === "COMFORTABLE"
												? "#34d399"
												: loanComparison.statusTier === "TIGHT"
													? "#fbbf24"
													: "#f87171",
									}}
								/>
							)}
						</Box>

						{/* 3-Metric Overview */}
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: "1.1fr 1.1fr 0.8fr",
								gap: 0.8,
								p: 0.8,
								borderRadius: 1,
								bgcolor: alpha(theme.palette.background.default, 0.45),
							}}
						>
							<Box>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontSize: "0.58rem",
										display: "block",
										fontWeight: 700,
									}}
								>
									PAYOFF TERM
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontWeight: 800,
										fontSize: "0.72rem",
										color:
											loanComparison.statusTier === "COMFORTABLE"
												? "#34d399"
												: "#fbbf24",
									}}
								>
									{loanComparison.optimalLengthWeeks}W (
									{loanComparison.optimalLengthDays}d)
								</Typography>
							</Box>

							<Box>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontSize: "0.58rem",
										display: "block",
										fontWeight: 700,
									}}
								>
									PAYMENT
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontWeight: 800,
										fontSize: "0.72rem",
										color: "text.primary",
									}}
								>
									{formatAmount(loanComparison.installmentPerInterval)}{" "}
									<span
										style={{
											fontSize: "0.58rem",
											color: theme.palette.text.secondary,
										}}
									>
										/ 1W
									</span>
								</Typography>
							</Box>

							<Box>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontSize: "0.58rem",
										display: "block",
										fontWeight: 700,
									}}
								>
									INTEREST
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontWeight: 800,
										fontSize: "0.72rem",
										color: "primary.main",
									}}
								>
									+{formatAmount(loanComparison.totalInterest)}
								</Typography>
							</Box>
						</Box>

						{loanComparison.retainedDailyProfit !== undefined &&
							loanComparison.retainedDailyProfit > 0 && (
								<Typography
									variant="caption"
									sx={{
										color: "#34d399",
										fontSize: "0.62rem",
										fontWeight: 700,
										px: 0.5,
									}}
								>
									✓ Keeps ~{formatAmount(loanComparison.retainedDailyProfit)}/d
									({loanComparison.retainedPercent}%) for rest
								</Typography>
							)}

						{/* Compact 1-line warnings if applicable */}
						{(!loanComparison.withinMinMax ||
							!loanComparison.hasSufficientLiquidity) && (
							<Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
								{!loanComparison.withinMinMax && (
									<Typography
										variant="caption"
										sx={{
											color: "#ef4444",
											fontSize: "0.62rem",
											fontWeight: 700,
										}}
									>
										⚠️ Limit: {formatAmount(bank.min_loan_amount || 0)} -{" "}
										{formatAmount(bank.max_loan_amount || 0)} ICA
									</Typography>
								)}
								{!loanComparison.hasSufficientLiquidity && (
									<Typography
										variant="caption"
										sx={{
											color: "#f97316",
											fontSize: "0.62rem",
											fontWeight: 700,
										}}
									>
										⚠️ Exceeds vault: {formatAmount(bank.liquidity)} ICA
									</Typography>
								)}
							</Box>
						)}
					</Box>
				) : depositComparison ? (
					/* Depositor Yield Analysis */
					<Box
						sx={{
							p: 1.25,
							borderRadius: 1.5,
							bgcolor: !depositComparison.canAcceptDeposit
								? alpha("#ef4444", 0.08)
								: depositComparison.riskTier === "LOW"
									? alpha("#10b981", 0.08)
									: depositComparison.riskTier === "MODERATE"
										? alpha("#f59e0b", 0.08)
										: alpha("#ef4444", 0.08),
							border: `1px solid ${
								!depositComparison.canAcceptDeposit
									? alpha("#ef4444", 0.3)
									: depositComparison.riskTier === "LOW"
										? alpha("#10b981", 0.3)
										: depositComparison.riskTier === "MODERATE"
											? alpha("#f59e0b", 0.3)
											: alpha("#ef4444", 0.3)
							}`,
							display: "flex",
							flexDirection: "column",
							gap: 0.8,
						}}
					>
						{/* Fit Status Header */}
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
								{depositComparison.canAcceptDeposit ? (
									<SavingsOutlinedIcon
										sx={{
											fontSize: 16,
											color:
												depositComparison.riskTier === "LOW"
													? "#34d399"
													: depositComparison.riskTier === "MODERATE"
														? "#fbbf24"
														: "#f87171",
										}}
									/>
								) : (
									<WarningAmberIcon sx={{ fontSize: 16, color: "#f87171" }} />
								)}
								<Typography
									variant="caption"
									sx={{
										fontWeight: 800,
										fontSize: "0.7rem",
										color: !depositComparison.canAcceptDeposit
											? "#f87171"
											: depositComparison.riskTier === "LOW"
												? "#34d399"
												: depositComparison.riskTier === "MODERATE"
													? "#fbbf24"
													: "#f87171",
										letterSpacing: 0.3,
									}}
								>
									{!depositComparison.canAcceptDeposit
										? "DEPOSITS PAUSED"
										: depositComparison.riskLabel.toUpperCase()}
								</Typography>
							</Box>

							<Chip
								label={
									depositComparison.maxMonthlyYieldRate
										? `${depositComparison.monthlyYieldRate}% - ${depositComparison.maxMonthlyYieldRate}%/mo`
										: `${depositComparison.monthlyYieldRate}%/mo`
								}
								size="small"
								sx={{
									height: 18,
									fontSize: "0.62rem",
									fontWeight: 800,
									bgcolor: alpha(theme.palette.primary.main, 0.15),
									color: theme.palette.primary.main,
								}}
							/>
						</Box>

						{/* 3-Metric Overview for Depositor */}
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: "1.2fr 1.2fr 1fr",
								gap: 0.8,
								p: 0.8,
								borderRadius: 1,
								bgcolor: alpha(theme.palette.background.default, 0.45),
							}}
						>
							<Box>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontSize: "0.58rem",
										display: "block",
										fontWeight: 700,
									}}
								>
									WEEKLY ACCOUNTED
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontWeight: 800,
										fontSize: "0.74rem",
										color: "#34d399",
									}}
								>
									+{formatAmount(depositComparison.weeklyPayout)}{" "}
									{bank.currency || "ICA"}
								</Typography>
							</Box>

							<Box>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontSize: "0.58rem",
										display: "block",
										fontWeight: 700,
									}}
								>
									1-MONTH RETURN
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontWeight: 800,
										fontSize: "0.74rem",
										color: "text.primary",
									}}
								>
									+{formatAmount(depositComparison.monthlyPayout)}{" "}
									{bank.currency || "ICA"}
								</Typography>
							</Box>

							<Box>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontSize: "0.58rem",
										display: "block",
										fontWeight: 700,
									}}
								>
									RISK
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontWeight: 800,
										fontSize: "0.72rem",
										color:
											depositComparison.riskTier === "LOW"
												? "#34d399"
												: depositComparison.riskTier === "MODERATE"
													? "#fbbf24"
													: "#f87171",
									}}
								>
									{depositComparison.riskTier}
								</Typography>
							</Box>
						</Box>

						<Typography
							variant="caption"
							sx={{ color: "text.secondary", fontSize: "0.62rem", px: 0.5 }}
						>
							{depositComparison.rejectionReason ||
								depositComparison.riskExplanation}
						</Typography>
					</Box>
				) : (
					/* Key Stats 4-Grid */
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 1.25,
							p: 1.25,
							borderRadius: 1.5,
							bgcolor: alpha(theme.palette.background.default, 0.45),
							border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						}}
					>
						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.65rem",
									fontWeight: 700,
									display: "block",
								}}
							>
								VAULT LIQUIDITY
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 800,
									fontSize: "0.78rem",
									color: theme.palette.success.main,
								}}
							>
								{formatAmount(currentMoney)}{" "}
								<span
									style={{
										fontSize: "0.62rem",
										color: theme.palette.text.secondary,
									}}
								>
									{bank.currency || "ICA"}
								</span>
							</Typography>
						</Box>

						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.65rem",
									fontWeight: 700,
									display: "block",
								}}
							>
								INTEREST &bull; YIELD
							</Typography>
							<Typography
								variant="body2"
								sx={{ fontWeight: 800, fontSize: "0.75rem", color: rateColor }}
							>
								{rateText}{" "}
								<span
									style={{
										fontSize: "0.62rem",
										color: theme.palette.text.secondary,
									}}
								>
									(
									{bank.max_weekly_yield_rate
										? `${bank.weekly_yield_rate || 1.0}-${bank.max_weekly_yield_rate}%/mo`
										: `${bank.weekly_yield_rate || 1.0}%/mo`}
									)
								</span>
							</Typography>
						</Box>

						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.65rem",
									fontWeight: 700,
									display: "block",
								}}
							>
								LOAN RANGE
							</Typography>
							<Typography
								variant="caption"
								sx={{
									fontWeight: 700,
									color: "text.primary",
									fontSize: "0.72rem",
									display: "block",
								}}
							>
								{bank.min_loan_amount
									? formatAmount(bank.min_loan_amount)
									: "0"}{" "}
								-{" "}
								{bank.max_loan_amount
									? formatAmount(bank.max_loan_amount)
									: "No Max"}
							</Typography>
						</Box>

						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.65rem",
									fontWeight: 700,
									display: "block",
								}}
							>
								DEFAULT TERM
							</Typography>
							<Typography
								variant="caption"
								sx={{
									fontWeight: 700,
									color: "text.primary",
									fontSize: "0.72rem",
									display: "block",
								}}
							>
								{formatTermWeeks(bank.default_repay_days || 14)} (
								{formatPaymentIntervalShort(bank.default_interval)})
							</Typography>
						</Box>
					</Box>
				)}

				{/* Footer Link Prompt */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						pt: 0.5,
						mt: "auto",
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 600,
							fontSize: "0.7rem",
						}}
					>
						{lentCount} loan{lentCount === 1 ? "" : "s"} issued
					</Typography>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.5,
							color: theme.palette.primary.main,
						}}
					>
						<Typography
							variant="caption"
							sx={{ fontWeight: 700, fontSize: "0.72rem" }}
						>
							{isMyBank ? "Manage Bank" : "Inspect Terms & Ledger"}
						</Typography>
						<ArrowForwardIosIcon sx={{ fontSize: 9 }} />
					</Box>
				</Box>
			</CardActionArea>
		</Card>
	);
};
