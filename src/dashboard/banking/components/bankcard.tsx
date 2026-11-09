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
	const currentMoney =
		bank.available_liquidity !== undefined
			? bank.available_liquidity
			: bank.liquidity || 0;
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
					: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
				transition: "all 0.18s ease-in-out",
				position: "relative",
				overflow: "hidden",
				display: "flex",
				flexDirection: "column",
				height: "100%",
				"&:hover": {
					transform: "translateY(-2px)",
					borderColor: theme.palette.primary.main,
					boxShadow: `0 6px 20px -4px ${alpha(theme.palette.primary.main, 0.2)}`,
					bgcolor: alpha(theme.palette.background.paper, 0.65),
				},
			}}
		>
			<CardActionArea
				onClick={handleClick}
				sx={{
					p: 2,
					flex: 1,
					display: "flex",
					flexDirection: "column",
					alignItems: "stretch",
					justifyContent: "space-between",
					gap: 1.25,
					width: "100%",
				}}
			>
				{/* Top Section: Header & Badges */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 0.8,
						width: "100%",
					}}
				>
					{/* Name & Indicators */}
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "flex-start",
							gap: 1,
							minWidth: 0,
						}}
					>
						<Box sx={{ minWidth: 0, flex: 1 }}>
							<Tooltip title={bank.name} placement="top" arrow>
								<Typography
									variant="subtitle1"
									noWrap
									sx={{
										fontWeight: 800,
										letterSpacing: 0.2,
										lineHeight: 1.2,
										color: theme.palette.text.primary,
										fontSize: "0.98rem",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{bank.name}
								</Typography>
							</Tooltip>

							{/* Operator & Status */}
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 0.8,
									mt: 0.4,
									flexWrap: "wrap",
								}}
							>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontWeight: 600,
										fontSize: "0.72rem",
									}}
								>
									{bank.owner_username}
								</Typography>

								<Tooltip
									title={`Status: ${ownerActivity.label} (Synced: ${
										bank.owner_is_synchronized !== false ? "Yes" : "No"
									})`}
								>
									<Box
										sx={{
											display: "inline-flex",
											alignItems: "center",
											gap: 0.4,
											px: 0.5,
											py: 0.1,
											borderRadius: 1,
											bgcolor: alpha(ownerActivity.dotColor, 0.1),
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

						{/* Tag Badges */}
						<Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
							{isDemo && (
								<Chip
									label="DEMO"
									size="small"
									color="primary"
									variant="outlined"
									sx={{ fontWeight: 800, fontSize: "0.6rem", height: 18 }}
								/>
							)}
							{isMyBank && (
								<Chip
									label="MY BANK"
									size="small"
									color="primary"
									sx={{ fontWeight: 800, fontSize: "0.62rem", height: 18 }}
								/>
							)}
						</Box>
					</Box>

					{/* Rate & Status Pills */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.6,
							flexWrap: "wrap",
						}}
					>
						<Chip
							label={bank.currency || "ICA"}
							size="small"
							variant="outlined"
							sx={{ fontWeight: 700, fontSize: "0.68rem", height: 20 }}
						/>
						<Chip
							label={rateText}
							size="small"
							sx={{
								fontWeight: 700,
								fontSize: "0.68rem",
								height: 20,
								bgcolor: alpha(rateColor, 0.12),
								color: rateColor,
							}}
						/>
						{bank.deposit_status === "PAUSED" ? (
							<Chip
								label="PAUSED"
								size="small"
								sx={{
									fontWeight: 700,
									fontSize: "0.62rem",
									height: 20,
									bgcolor: alpha("#ef4444", 0.15),
									color: "#f87171",
								}}
							/>
						) : bank.deposit_status === "NEAR_CAPACITY" ? (
							<Chip
								label="NEAR CAPACITY"
								size="small"
								sx={{
									fontWeight: 700,
									fontSize: "0.62rem",
									height: 20,
									bgcolor: alpha("#f59e0b", 0.15),
									color: "#fbbf24",
								}}
							/>
						) : null}
					</Box>
				</Box>

				{/* Owner Headline */}
				{introText && (
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontStyle: "italic",
							fontSize: "0.72rem",
							display: "-webkit-box",
							WebkitLineClamp: 2,
							WebkitBoxOrient: "vertical",
							overflow: "hidden",
							lineHeight: 1.3,
						}}
					>
						"{introText}"
					</Typography>
				)}

				{/* Borrower Loan Assessment or Stats */}
				{loanComparison ? (
					<Box
						sx={{
							p: 1.2,
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
									? alpha("#ef4444", 0.25)
									: loanComparison.statusTier === "COMFORTABLE"
										? alpha("#10b981", 0.25)
										: loanComparison.statusTier === "TIGHT"
											? alpha("#f59e0b", 0.25)
											: alpha("#ef4444", 0.25)
							}`,
							display: "flex",
							flexDirection: "column",
							gap: 0.8,
							width: "100%",
						}}
					>
						{/* Fit Status */}
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
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

							{loanComparison.userProfitSharePercent > 0 && (
								<Chip
									label={`${loanComparison.userProfitSharePercent}% budget`}
									size="small"
									sx={{
										height: 18,
										fontSize: "0.62rem",
										fontWeight: 700,
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

						{/* Dual Comparison Cards */}
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: 0.8,
								width: "100%",
							}}
						>
							{/* Stable Loan */}
							<Box
								sx={{
									p: 0.8,
									borderRadius: 1,
									bgcolor: alpha(theme.palette.background.default, 0.45),
									border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
								}}
							>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										mb: 0.2,
									}}
								>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontSize: "0.6rem",
											fontWeight: 700,
											textTransform: "uppercase",
										}}
									>
										Stable
									</Typography>
									<Typography
										variant="caption"
										sx={{
											fontSize: "0.58rem",
											fontWeight: 700,
											color: "text.secondary",
										}}
									>
										{loanComparison.totalIntervals ||
											loanComparison.optimalLengthWeeks}
										x
									</Typography>
								</Box>
								<Typography
									variant="body2"
									sx={{
										fontWeight: 800,
										fontSize: "0.8rem",
										color: "text.primary",
										lineHeight: 1.15,
									}}
								>
									{formatAmount(
										loanComparison.stableInstallment ||
											loanComparison.installmentPerInterval,
									)}
									<span
										style={{
											fontSize: "0.6rem",
											color: theme.palette.text.secondary,
										}}
									>
										{" "}
										/{" "}
										{loanComparison.optimalIntervalDays === 14
											? "2W"
											: loanComparison.optimalIntervalDays === 7
												? "1W"
												: `${loanComparison.optimalIntervalDays}d`}
									</span>
								</Typography>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontSize: "0.58rem",
										display: "block",
										mt: 0.2,
									}}
								>
									Principal + fee
								</Typography>
							</Box>

							{/* Interest-Only Loan */}
							<Box
								sx={{
									p: 0.8,
									borderRadius: 1,
									bgcolor: alpha(theme.palette.background.default, 0.45),
									border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
								}}
							>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										mb: 0.2,
									}}
								>
									<Typography
										variant="caption"
										sx={{
											color: "primary.main",
											fontSize: "0.6rem",
											fontWeight: 700,
											textTransform: "uppercase",
										}}
									>
										Interest
									</Typography>
									<Typography
										variant="caption"
										sx={{
											fontSize: "0.58rem",
											fontWeight: 700,
											color: "primary.main",
										}}
									>
										+{formatAmount(loanComparison.totalInterest)}
									</Typography>
								</Box>
								<Typography
									variant="body2"
									sx={{
										fontWeight: 800,
										fontSize: "0.8rem",
										color: "primary.main",
										lineHeight: 1.15,
									}}
								>
									{formatAmount(loanComparison.interestOnlyPerInterval)}
									<span
										style={{
											fontSize: "0.6rem",
											color: theme.palette.text.secondary,
										}}
									>
										{" "}
										/{" "}
										{loanComparison.optimalIntervalDays === 14
											? "2W"
											: loanComparison.optimalIntervalDays === 7
												? "1W"
												: `${loanComparison.optimalIntervalDays}d`}
									</span>
								</Typography>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontSize: "0.58rem",
										display: "block",
										mt: 0.2,
									}}
								>
									Balloon: {formatAmount(loanComparison.balloonFinalPayment)}
								</Typography>
							</Box>
						</Box>

						{/* Retained profit or Warnings */}
						{loanComparison.retainedDailyProfit !== undefined &&
						loanComparison.retainedDailyProfit > 0 ? (
							<Typography
								variant="caption"
								sx={{
									color: "#34d399",
									fontSize: "0.65rem",
									fontWeight: 600,
								}}
							>
								Keeps ~{formatAmount(loanComparison.retainedDailyProfit)}/d (
								{loanComparison.retainedPercent}%)
							</Typography>
						) : null}

						{(!loanComparison.withinMinMax ||
							!loanComparison.hasSufficientLiquidity) && (
							<Box sx={{ display: "flex", flexDirection: "column", gap: 0.2 }}>
								{!loanComparison.withinMinMax && (
									<Typography
										variant="caption"
										sx={{
											color: "#ef4444",
											fontSize: "0.62rem",
											fontWeight: 700,
										}}
									>
										Limits: {formatAmount(bank.min_loan_amount || 0)} -{" "}
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
										Exceeds vault: {formatAmount(currentMoney)} ICA
									</Typography>
								)}
							</Box>
						)}
					</Box>
				) : depositComparison ? (
					/* Depositor Yield Analysis */
					<Box
						sx={{
							p: 1.2,
							borderRadius: 1.5,
							bgcolor: !depositComparison.canAcceptDeposit
								? alpha("#ef4444", 0.08)
								: alpha("#10b981", 0.08),
							border: `1px solid ${
								!depositComparison.canAcceptDeposit
									? alpha("#ef4444", 0.25)
									: alpha("#10b981", 0.25)
							}`,
							display: "flex",
							flexDirection: "column",
							gap: 0.8,
							width: "100%",
						}}
					>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Typography
								variant="caption"
								sx={{
									fontWeight: 800,
									fontSize: "0.7rem",
									color: !depositComparison.canAcceptDeposit
										? "#f87171"
										: "#34d399",
									letterSpacing: 0.3,
								}}
							>
								{!depositComparison.canAcceptDeposit
									? "PAUSED"
									: depositComparison.riskLabel.toUpperCase()}
							</Typography>
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
									fontWeight: 700,
									bgcolor: alpha(theme.palette.primary.main, 0.15),
									color: theme.palette.primary.main,
								}}
							/>
						</Box>

						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
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
									WEEKLY PAYOUT
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontWeight: 800,
										fontSize: "0.76rem",
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
										fontSize: "0.76rem",
										color: "text.primary",
									}}
								>
									+{formatAmount(depositComparison.monthlyPayout)}{" "}
									{bank.currency || "ICA"}
								</Typography>
							</Box>
						</Box>
					</Box>
				) : (
					/* Key Stats 4-Grid */
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 1,
							p: 1.2,
							borderRadius: 1.5,
							bgcolor: alpha(theme.palette.background.default, 0.45),
							border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
							width: "100%",
						}}
					>
						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.62rem",
									fontWeight: 700,
									display: "block",
									letterSpacing: 0.2,
								}}
							>
								AVAILABLE AMOUNT
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 800,
									fontSize: "0.84rem",
									color: theme.palette.success.main,
									lineHeight: 1.2,
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
							{bank.liquidity !== undefined &&
							bank.liquidity !== currentMoney ? (
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontSize: "0.6rem",
										fontWeight: 600,
										display: "block",
										lineHeight: 1.15,
										mt: 0.2,
									}}
								>
									Total: {formatAmount(bank.liquidity)}
								</Typography>
							) : null}
						</Box>

						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.62rem",
									fontWeight: 700,
									display: "block",
								}}
							>
								INTEREST &bull; YIELD
							</Typography>
							<Typography
								variant="body2"
								sx={{ fontWeight: 800, fontSize: "0.78rem", color: rateColor }}
							>
								{rateText}
							</Typography>
						</Box>

						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.62rem",
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
									fontSize: "0.62rem",
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

				{/* Footer: Loan count + Action */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						pt: 0.4,
						mt: "auto",
						width: "100%",
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 600,
							fontSize: "0.68rem",
						}}
					>
						{lentCount} loan{lentCount === 1 ? "" : "s"} issued
					</Typography>
					<Typography
						variant="caption"
						sx={{
							fontWeight: 700,
							fontSize: "0.72rem",
							color: "primary.main",
						}}
					>
						{isMyBank ? "Manage →" : "Inspect →"}
					</Typography>
				</Box>
			</CardActionArea>
		</Card>
	);
};
