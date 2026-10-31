import React from "react";
import {
	Box,
	Typography,
	Paper,
	Chip,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Tabs,
	Tab,
	Tooltip,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CircleIcon from "@mui/icons-material/Circle";

import type { Bank, BankLedgerResponse, LedgerRecord } from "../types";
import {
	formatAmount,
	formatPaymentInterval,
	getOwnerActiveStatus,
} from "../../../dashboard/banking/helpers";
import { PublicLoanLedger } from "./publicloanledger";
import { PublicDepositLedger } from "./publicdepositledger";

interface PublicBankModalProps {
	inspectingBank: Bank | null;
	onClose: () => void;
	ledgerData: BankLedgerResponse | null;
	loadingLedger: boolean;
	activeLedgerTab: number;
	onTabChange: (tabIndex: number) => void;
	loanRecords: LedgerRecord[];
	depositRecords: LedgerRecord[];
}

export const PublicBankModal: React.FC<PublicBankModalProps> = ({
	inspectingBank,
	onClose,
	ledgerData,
	loadingLedger,
	activeLedgerTab,
	onTabChange,
	loanRecords,
	depositRecords,
}) => {
	const theme = useTheme();

	if (!inspectingBank) return null;

	const isDemo = inspectingBank.id < 0;
	const currency = inspectingBank.currency || "ICA";

	return (
		<Dialog
			open={Boolean(inspectingBank)}
			onClose={onClose}
			maxWidth="lg"
			fullWidth
			slotProps={{
				paper: {
					sx: {
						borderRadius: 2.5,
						bgcolor: "background.paper",
						border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
						p: 0.5,
						height: "auto",
						maxHeight: { xs: "92vh", md: "85vh" },
						display: "flex",
						flexDirection: "column",
						overflow: "hidden",
					},
				},
			}}
		>
			{/* Header */}
			<DialogTitle sx={{ pb: 1, pt: 2, px: 2.5, flexShrink: 0 }}>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
						gap: 1,
					}}
				>
					<Box>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								flexWrap: "wrap",
							}}
						>
							<Typography variant="h6" sx={{ fontWeight: 900 }}>
								{inspectingBank.name}
							</Typography>
							{isDemo && (
								<Chip
									label="DEMO PREVIEW"
									size="small"
									color="primary"
									variant="outlined"
									sx={{ fontWeight: 800, fontSize: "0.65rem", height: 20 }}
								/>
							)}
							{inspectingBank.deposit_status === "PAUSED" && (
								<Chip
									label="DEPOSITS PAUSED"
									size="small"
									sx={{
										fontWeight: 800,
										fontSize: "0.62rem",
										height: 20,
										bgcolor: alpha("#ef4444", 0.15),
										color: "#f87171",
										border: `1px solid ${alpha("#ef4444", 0.3)}`,
									}}
								/>
							)}
							{inspectingBank.deposit_status === "NEAR_CAPACITY" && (
								<Chip
									label="NEAR CAPACITY"
									size="small"
									sx={{
										fontWeight: 800,
										fontSize: "0.62rem",
										height: 20,
										bgcolor: alpha("#f59e0b", 0.15),
										color: "#fbbf24",
										border: `1px solid ${alpha("#f59e0b", 0.3)}`,
									}}
								/>
							)}
						</Box>
						{(() => {
							const ownerActivity = getOwnerActiveStatus(
								inspectingBank.owner_last_active,
								inspectingBank.owner_is_synchronized !== false,
							);
							return (
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 0.75,
										flexWrap: "wrap",
									}}
								>
									<Typography
										variant="caption"
										sx={{ color: "text.secondary", fontWeight: 700 }}
									>
										Banker:{" "}
										<strong style={{ color: theme.palette.text.primary }}>
											{inspectingBank.owner_username}
										</strong>
									</Typography>
									<Tooltip
										title={`Banker Status: ${ownerActivity.label} (Synced: ${inspectingBank.owner_is_synchronized !== false ? "Yes" : "No"})`}
									>
										<Box
											sx={{
												display: "inline-flex",
												alignItems: "center",
												gap: 0.4,
												px: 0.6,
												py: 0.15,
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
													fontSize: "0.65rem",
													lineHeight: 1,
												}}
											>
												{ownerActivity.label}
											</Typography>
										</Box>
									</Tooltip>
								</Box>
							);
						})()}
					</Box>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.75,
							flexWrap: "wrap",
						}}
					>
						<Chip
							label={currency}
							color="primary"
							variant="outlined"
							size="small"
							sx={{ fontWeight: 800, height: 22 }}
						/>
						<Chip
							label={
								inspectingBank.max_interest_rate &&
								inspectingBank.max_interest_rate >
									(inspectingBank.default_interest_rate || 0)
									? `${inspectingBank.default_interest_rate}% - ${inspectingBank.max_interest_rate}% / interval`
									: `${inspectingBank.default_interest_rate}% / interval`
							}
							color="primary"
							size="small"
							sx={{ fontWeight: 800, height: 22 }}
						/>
						<Chip
							label={
								inspectingBank.max_weekly_yield_rate
									? `${inspectingBank.weekly_yield_rate || 1.0}% - ${inspectingBank.max_weekly_yield_rate}%/mo Yield`
									: `${inspectingBank.weekly_yield_rate || 1.0}%/mo Yield`
							}
							size="small"
							sx={{
								fontWeight: 800,
								height: 22,
								bgcolor: alpha("#10b981", 0.15),
								color: "#34d399",
								border: `1px solid ${alpha("#10b981", 0.3)}`,
							}}
						/>
					</Box>
				</Box>
			</DialogTitle>

			{/* Responsive Content */}
			<DialogContent
				dividers
				sx={{
					p: 2.5,
					flex: 1,
					minHeight: 0,
					display: "flex",
					flexDirection: "column",
					overflowY: "auto",
					overflowX: "hidden",
				}}
			>
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: { xs: "1fr", md: "4fr 6fr" },
						gap: 2.5,
						alignItems: "stretch",
						flex: 1,
						minHeight: 0,
					}}
				>
					{/* Left Side: Terms & Conditions */}
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 1.5,
							minHeight: 0,
						}}
					>
						{inspectingBank.headline && (
							<Typography
								variant="body2"
								sx={{
									fontWeight: 600,
									fontStyle: "italic",
									color: "text.secondary",
									borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
									pl: 1.5,
									py: 0.25,
									flexShrink: 0,
								}}
							>
								"{inspectingBank.headline}"
							</Typography>
						)}

						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								flex: 1,
								minHeight: 0,
							}}
						>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontWeight: 800,
									letterSpacing: 0.8,
									textTransform: "uppercase",
									flexShrink: 0,
								}}
							>
								TERMS & CONDITIONS
							</Typography>
							<Paper
								elevation={0}
								sx={{
									mt: 1,
									p: 2,
									borderRadius: 1.5,
									bgcolor: alpha(theme.palette.background.default, 0.6),
									border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
									flex: 1,
									maxHeight: { xs: 220, md: 340 },
									minHeight: 120,
									overflowY: "auto",
									overflowX: "hidden",
									"&::-webkit-scrollbar": { width: 5 },
									"&::-webkit-scrollbar-thumb": {
										backgroundColor: alpha(theme.palette.divider, 0.3),
										borderRadius: 4,
									},
								}}
							>
								<Typography
									variant="body2"
									sx={{
										lineHeight: 1.6,
										whiteSpace: "pre-wrap",
										wordBreak: "break-word",
										overflowWrap: "anywhere",
										fontSize: "0.85rem",
									}}
								>
									{inspectingBank.description ||
										"No specific terms and conditions specified by this institution."}
								</Typography>
							</Paper>
						</Box>

						{/* How to Borrow Guidance */}
						<Paper
							elevation={0}
							sx={{
								p: 1.75,
								borderRadius: 1.5,
								bgcolor: alpha(theme.palette.primary.main, 0.05),
								border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
								display: "flex",
								gap: 1.25,
								alignItems: "flex-start",
								flexShrink: 0,
							}}
						>
							<InfoOutlinedIcon
								sx={{
									color: "primary.main",
									fontSize: 18,
									mt: 0.2,
									flexShrink: 0,
								}}
							/>
							<Box>
								<Typography
									variant="caption"
									sx={{
										fontWeight: 800,
										color: "primary.light",
										display: "block",
									}}
								>
									HOW TO BORROW OR DEPOSIT
								</Typography>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										lineHeight: 1.4,
										display: "block",
										mt: 0.25,
									}}
								>
									Arrange transactions directly with{" "}
									<strong style={{ color: theme.palette.text.primary }}>
										{inspectingBank.owner_username}
									</strong>{" "}
									in-game via APEX or by initiating a loan request.
								</Typography>
							</Box>
						</Paper>
					</Box>

					{/* Right Side: Bank Stats + Ledgers */}
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 1.5,
							minHeight: 0,
						}}
					>
						{/* Bank Stats Grid */}
						<Paper
							elevation={0}
							sx={{
								p: 2,
								borderRadius: 1.5,
								bgcolor: alpha(theme.palette.background.default, 0.7),
								border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
								flexShrink: 0,
							}}
						>
							<Box
								sx={{
									display: "grid",
									gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
									gap: 1.5,
								}}
							>
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontWeight: 700,
											fontSize: "0.7rem",
										}}
									>
										VAULT LIQUIDITY
									</Typography>
									<Typography
										variant="body1"
										sx={{ fontWeight: 900, color: "#10B981" }}
									>
										{formatAmount(inspectingBank.liquidity || 0)} {currency}
									</Typography>
								</Box>
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontWeight: 700,
											fontSize: "0.7rem",
										}}
									>
										LOAN INTEREST
									</Typography>
									<Typography
										variant="body1"
										sx={{ fontWeight: 900, color: theme.palette.primary.main }}
									>
										{inspectingBank.max_interest_rate &&
										inspectingBank.max_interest_rate >
											(inspectingBank.default_interest_rate || 0)
											? `${inspectingBank.default_interest_rate}% - ${inspectingBank.max_interest_rate}%`
											: `${inspectingBank.default_interest_rate}%`}
										<span
											style={{
												fontSize: "0.68rem",
												fontWeight: 600,
												color: theme.palette.text.secondary,
											}}
										>
											{" "}
											/ interval
										</span>
									</Typography>
								</Box>
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontWeight: 700,
											fontSize: "0.7rem",
										}}
									>
										1-MONTH YIELD
									</Typography>
									<Typography
										variant="body1"
										sx={{ fontWeight: 900, color: "#34d399" }}
									>
										{inspectingBank.max_weekly_yield_rate
											? `${inspectingBank.weekly_yield_rate || 1.0}% - ${inspectingBank.max_weekly_yield_rate}%/mo`
											: `${inspectingBank.weekly_yield_rate || 1.0}%/mo`}
									</Typography>
									<Typography
										variant="caption"
										sx={{ color: "text.secondary", fontSize: "0.6rem" }}
									>
										Accounted weekly (1/4th)
									</Typography>
								</Box>
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontWeight: 700,
											fontSize: "0.7rem",
										}}
									>
										MIN LOAN
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 700 }}>
										{inspectingBank.min_loan_amount
											? formatAmount(inspectingBank.min_loan_amount)
											: "0"}{" "}
										{currency}
									</Typography>
								</Box>
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontWeight: 700,
											fontSize: "0.7rem",
										}}
									>
										MAX LOAN
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 700 }}>
										{inspectingBank.max_loan_amount
											? formatAmount(inspectingBank.max_loan_amount)
											: "No Max"}{" "}
										{currency}
									</Typography>
								</Box>
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontWeight: 700,
											fontSize: "0.7rem",
										}}
									>
										DEFAULT TERM
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 700 }}>
										{inspectingBank.default_repay_days
											? inspectingBank.default_repay_days % 7 === 0
												? `${inspectingBank.default_repay_days / 7} ${inspectingBank.default_repay_days / 7 === 1 ? "Week" : "Weeks"}`
												: `${(inspectingBank.default_repay_days / 7).toFixed(1).replace(/\.0$/, "")} Weeks`
											: "2 Weeks"}
									</Typography>
								</Box>
							</Box>
						</Paper>

						{/* Ledger Tabs */}
						<Box
							sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}
						>
							<Tabs
								value={activeLedgerTab}
								onChange={(_, val) => onTabChange(val)}
								sx={{
									minHeight: 36,
									"& .MuiTab-root": {
										textTransform: "none",
										fontWeight: 700,
										fontSize: "0.825rem",
										minHeight: "100%",
										py: 0.5,
									},
								}}
							>
								<Tab label={`Loan History (${loanRecords.length})`} />
								<Tab
									label={`Deposits & Withdrawals (${depositRecords.length})`}
								/>
							</Tabs>
						</Box>

						{/* Tab 0: Loan History */}
						{activeLedgerTab === 0 && (
							<PublicLoanLedger
								ledgerData={ledgerData}
								loanRecords={loanRecords}
								loading={loadingLedger}
								currency={currency}
							/>
						)}

						{/* Tab 1: Deposits & Withdrawals */}
						{activeLedgerTab === 1 && (
							<PublicDepositLedger
								ledgerData={ledgerData}
								depositRecords={depositRecords}
								loading={loadingLedger}
								currency={currency}
							/>
						)}
					</Box>
				</Box>
			</DialogContent>

			<DialogActions
				sx={{ p: 1.5, px: 2.5, justifyContent: "flex-end", flexShrink: 0 }}
			>
				<Button
					variant="outlined"
					size="small"
					onClick={onClose}
					sx={{
						textTransform: "none",
						fontWeight: 700,
						borderRadius: 1.5,
						px: 2.5,
						borderColor: alpha(theme.palette.divider, 0.3),
					}}
				>
					Close
				</Button>
			</DialogActions>
		</Dialog>
	);
};
