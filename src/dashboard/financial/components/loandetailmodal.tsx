import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	Box,
	Typography,
	IconButton,
	Chip,
	Grid,
	LinearProgress,
	Divider,
	Alert,
	CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PersonIcon from "@mui/icons-material/Person";
import RepeatIcon from "@mui/icons-material/Repeat";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";
import { fetchClient } from "../../../utils/apiclient";

interface LoanDetailModalProps {
	open: boolean;
	onClose: () => void;
	loan: any | null;
	currency: string;
}

export const LoanDetailModal: React.FC<LoanDetailModalProps> = ({
	open,
	onClose,
	loan,
	currency,
}) => {
	const [contractDetail, setContractDetail] = useState<any | null>(null);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		if (open && loan?.id) {
			setLoading(true);
			fetchClient(`internal/contracts/detail?contract_id=${loan.id}`)
				.then(async (res) => {
					if (res && res.ok) {
						const data = await res.json();
						setContractDetail(data);
					} else {
						setContractDetail(null);
					}
				})
				.catch((err) => {
					console.error("Failed to fetch contract details:", err);
					setContractDetail(null);
				})
				.finally(() => setLoading(false));
		} else {
			setContractDetail(null);
		}
	}, [open, loan?.id]);

	if (!loan) return null;

	const activeLoan = contractDetail || loan;

	const isLent =
		activeLoan.contracttype === "LOAN_GIVEN" ||
		activeLoan.party === "CUSTOMER" ||
		activeLoan.is_payout_party;
	const partnerName =
		activeLoan.partnername ||
		activeLoan.counterparty_name ||
		activeLoan.partnercode ||
		activeLoan.counterparty_code ||
		"Unknown Counterparty";
	const partnerCode =
		activeLoan.partnercode || activeLoan.counterparty_code || "";
	const loanCurrency = activeLoan.currency || currency || "ICA";
	const interestRatePercent =
		activeLoan.implied_interest_rate !== undefined
			? activeLoan.implied_interest_rate
			: activeLoan.interest_rate
				? activeLoan.interest_rate * 100
				: 0;

	const allConditions: any[] = activeLoan.conditions || [];
	const payoutCond = allConditions.find((c) => c.type === "LOAN_PAYOUT");
	const installmentConds = allConditions.filter(
		(c) => c.type === "LOAN_INSTALLMENT",
	);

	const totalInst =
		installmentConds.length > 0
			? installmentConds.length
			: activeLoan.installment_count || activeLoan.total_installments || 1;
	const fulfilledInst =
		installmentConds.length > 0
			? installmentConds.filter(
					(c) => (c.status || "").toUpperCase() === "FULFILLED",
				).length
			: (activeLoan.installment_done ?? activeLoan.fulfilled_installments ?? 0);
	const intervalDays = activeLoan.installment_interval || 7;
	const instPercent = Math.min(
		100,
		Math.round((fulfilledInst / totalInst) * 100),
	);

	const startDate = activeLoan.date ? new Date(activeLoan.date) : new Date();

	// Exact principal from payout condition or database sum
	let initialPrincipal =
		payoutCond?.amountmoney ||
		payoutCond?.repaymentamount ||
		activeLoan.principal ||
		activeLoan.initial_principal ||
		activeLoan.payout_amount ||
		0;

	// If no payout condition found, sum repayment amounts from installment conditions
	if (!initialPrincipal && installmentConds.length > 0) {
		initialPrincipal = installmentConds.reduce(
			(sum: number, c: any) => sum + (Number(c.repaymentamount) || 0),
			0,
		);
	}
	if (!initialPrincipal) {
		initialPrincipal = activeLoan.total_amount || 0;
	}

	let totalAmount = activeLoan.total_amount || 0;
	let totalInterestExpected = activeLoan.total_interest || 0;

	if (installmentConds.length > 0) {
		totalAmount = installmentConds.reduce(
			(sum: number, c: any) =>
				sum +
				(Number(c.totalamount) ||
					Number(c.repaymentamount || 0) + Number(c.interestamount || 0)),
			0,
		);
		totalInterestExpected = installmentConds.reduce(
			(sum: number, c: any) => sum + (Number(c.interestamount) || 0),
			0,
		);
	}

	// Map database installment conditions into display cards
	const installments =
		installmentConds.length > 0
			? installmentConds.map((c: any, i: number) => {
					const instDate = c.deadline
						? new Date(c.deadline)
						: new Date(startDate.getTime() + (i + 1) * intervalDays * 86400000);
					const isCompleted = (c.status || "").toUpperCase() === "FULFILLED";
					const isCurrentNext =
						(c.status || "").toUpperCase() === "PENDING" &&
						(i === 0 ||
							(installmentConds[i - 1]?.status || "").toUpperCase() ===
								"FULFILLED");

					return {
						number: c.index !== undefined ? c.index : i + 1,
						date: instDate,
						principalAmount: Number(c.repaymentamount) || 0,
						interestAmount: Number(c.interestamount) || 0,
						totalPayment:
							Number(c.totalamount) ||
							(Number(c.repaymentamount) || 0) +
								(Number(c.interestamount) || 0),
						status: (c.status || "PENDING").toUpperCase(),
						isCompleted,
						isCurrentNext,
					};
				})
			: Array.from({ length: totalInst }, (_, i) => {
					const instDate = new Date(
						startDate.getTime() + (i + 1) * intervalDays * 86400000,
					);
					const isCompleted = i < fulfilledInst;
					const isCurrentNext =
						i === fulfilledInst &&
						activeLoan.status !== "FULFILLED" &&
						activeLoan.status !== "CANCELLED";

					return {
						number: i + 1,
						date: instDate,
						principalAmount: initialPrincipal / totalInst,
						interestAmount: totalInterestExpected / totalInst,
						totalPayment: totalAmount / totalInst,
						status: isCompleted ? "FULFILLED" : "PENDING",
						isCompleted,
						isCurrentNext,
					};
				});

	// Final due date is strictly the date of the LAST installment payment
	const finalDueDate =
		installments.length > 0
			? installments[installments.length - 1].date
			: new Date(startDate.getTime() + totalInst * intervalDays * 86400000);

	// Next upcoming payment warning calculation
	const nextInst = installments.find((inst) => inst.isCurrentNext);
	const now = new Date();
	let dueWarningDays: number | null = null;
	if (nextInst) {
		const diffMs = nextInst.date.getTime() - now.getTime();
		dueWarningDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
	}

	const getStatusColor = (status: string) => {
		const s = (status || "").toUpperCase();
		if (s.includes("FULFILLED") && !s.includes("PARTIALLY"))
			return {
				bg: "rgba(74, 222, 128, 0.15)",
				text: "#4ade80",
				border: "rgba(74, 222, 128, 0.3)",
			};
		if (s.includes("PARTIALLY"))
			return {
				bg: "rgba(56, 189, 248, 0.15)",
				text: "#38bdf8",
				border: "rgba(56, 189, 248, 0.3)",
			};
		if (s.includes("CANCEL"))
			return {
				bg: "rgba(248, 113, 113, 0.15)",
				text: "#f87171",
				border: "rgba(248, 113, 113, 0.3)",
			};
		return {
			bg: "rgba(168, 85, 247, 0.15)",
			text: "#c084fc",
			border: "rgba(168, 85, 247, 0.3)",
		};
	};

	const statusStyle = getStatusColor(activeLoan.status);

	const boxThemeStyle = {
		p: 1.75,
		width: "100%",
		height: "100%",
		borderRadius: "10px",
		bgcolor: "rgba(123, 104, 238, 0.08)",
		border: "1px solid rgba(123, 104, 238, 0.25)",
		display: "flex",
		flexDirection: "column" as const,
		justifyContent: "space-between" as const,
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="lg"
			fullWidth
			slotProps={{
				paper: {
					sx: {
						backgroundColor: "rgba(10, 10, 20, 0.95)",
						backdropFilter: "blur(25px)",
						border: "1px solid rgba(123, 104, 238, 0.35)",
						borderRadius: "14px",
						boxShadow:
							"0 0 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(123, 104, 238, 0.2)",
						color: "white",
						overflow: "hidden",
						m: { xs: 1, sm: 2 },
						maxHeight: { xs: "94vh", sm: "90vh" },
					},
				},
			}}
		>
			{/* Dialog Header */}
			<DialogTitle
				sx={{
					p: { xs: 1.5, sm: 2 },
					px: { xs: 2, sm: 2.5 },
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
					bgcolor: "rgba(123, 104, 238, 0.06)",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					<AccountBalanceIcon sx={{ color: "#7b68ee", fontSize: 26 }} />
					<Box>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								flexWrap: "wrap",
							}}
						>
							<Typography
								variant="subtitle1"
								sx={{ fontWeight: 800, color: "white", fontSize: "1.05rem" }}
							>
								{activeLoan.name ||
									`Loan Contract [ ${activeLoan.localid || (activeLoan.id ? activeLoan.id.substring(0, 8) : "")} ]`}
							</Typography>
							<Chip
								label={isLent ? "LENT (CREDITOR)" : "BORROWED (DEBTOR)"}
								size="small"
								sx={{
									height: 22,
									fontSize: "0.68rem",
									fontWeight: 800,
									bgcolor: isLent
										? "rgba(74, 222, 128, 0.18)"
										: "rgba(248, 113, 113, 0.18)",
									color: isLent
										? SEMANTIC_COLORS.neonGreen
										: SEMANTIC_COLORS.neonRed,
									border: `1px solid ${isLent ? "rgba(74, 222, 128, 0.4)" : "rgba(248, 113, 113, 0.4)"}`,
								}}
							/>
							<Chip
								label={activeLoan.status || "ACTIVE"}
								size="small"
								sx={{
									height: 22,
									fontSize: "0.68rem",
									fontWeight: 800,
									bgcolor: statusStyle.bg,
									color: statusStyle.text,
									border: `1px solid ${statusStyle.border}`,
								}}
							/>
						</Box>
					</Box>
				</Box>
				<IconButton
					onClick={onClose}
					sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "white" } }}
				>
					<CloseIcon fontSize="small" />
				</IconButton>
			</DialogTitle>

			<DialogContent
				sx={{
					p: { xs: 1.5, sm: 2.5 },
					display: "flex",
					flexDirection: "column",
					gap: 2,
				}}
			>
				{loading ? (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							minHeight: 250,
						}}
					>
						<CircularProgress size={32} sx={{ color: "#7b68ee" }} />
					</Box>
				) : (
					<>
						{/* Upcoming Due Date Payment Alert Warning */}
						{dueWarningDays !== null && dueWarningDays <= 2 && (
							<Alert
								icon={
									<WarningAmberIcon
										sx={{ color: dueWarningDays <= 0 ? "#f87171" : "#f59e0b" }}
									/>
								}
								sx={{
									bgcolor:
										dueWarningDays <= 0
											? "rgba(248, 113, 113, 0.12)"
											: "rgba(245, 158, 11, 0.12)",
									border: `1px solid ${dueWarningDays <= 0 ? "rgba(248, 113, 113, 0.35)" : "rgba(245, 158, 11, 0.35)"}`,
									color: "white",
									borderRadius: "8px",
									py: 0.5,
									"& .MuiAlert-message": {
										fontSize: "0.78rem",
										fontWeight: 700,
									},
								}}
							>
								{dueWarningDays <= 0
									? `Payment Warning: Installment #${nextInst?.number} is due today or past due! Ensure counterparty account liquid balance.`
									: `Payment Notice: Installment #${nextInst?.number} is due in ${dueWarningDays} day${dueWarningDays > 1 ? "s" : ""} on ${nextInst?.date.toLocaleDateString()}.`}
							</Alert>
						)}

						{/* Uniform Overview Cards Grid (2x2 on mobile, 4x1 on desktop) */}
						<Grid
							container
							spacing={1.25}
							sx={{ mt: 2, justifyContent: "space-evenly" }}
						>
							<Grid item xs={6} md={3} sx={{ display: "flex" }}>
								<Box sx={boxThemeStyle}>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.45)",
											fontSize: "0.68rem",
											textTransform: "uppercase",
											fontWeight: 800,
											letterSpacing: "0.05em",
										}}
									>
										Counterparty
									</Typography>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
											mt: 0.5,
										}}
									>
										<PersonIcon sx={{ fontSize: 22, color: "#7b68ee" }} />
										<Box>
											<Typography
												sx={{
													fontSize: "0.92rem",
													fontWeight: 800,
													color: "white",
													lineHeight: 1.2,
												}}
											>
												{partnerName}
											</Typography>
											{partnerCode && (
												<Typography
													sx={{
														fontSize: "0.74rem",
														fontFamily: "monospace",
														color: "#7b68ee",
														fontWeight: 700,
													}}
												>
													[{partnerCode}]
												</Typography>
											)}
										</Box>
									</Box>
								</Box>
							</Grid>

							<Grid item xs={6} md={3} sx={{ display: "flex" }}>
								<Box sx={boxThemeStyle}>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.45)",
											fontSize: "0.68rem",
											textTransform: "uppercase",
											fontWeight: 800,
											letterSpacing: "0.05em",
										}}
									>
										Principal & Total Return
									</Typography>
									<Box sx={{ mt: 0.5 }}>
										<Typography
											sx={{
												fontSize: "0.98rem",
												fontFamily: "monospace",
												fontWeight: 800,
												color: isLent
													? SEMANTIC_COLORS.neonGreen
													: SEMANTIC_COLORS.neonRed,
											}}
										>
											{isLent ? "+" : "-"}
											{formatCurrency(initialPrincipal)} {loanCurrency}
										</Typography>
										<Typography
											sx={{
												fontSize: "0.68rem",
												fontFamily: "monospace",
												color: "rgba(255,255,255,0.55)",
												mt: 0.25,
											}}
										>
											Return: {formatCurrency(totalAmount)}
										</Typography>
										<Typography
											sx={{
												fontSize: "0.68rem",
												fontFamily: "monospace",
												color: "rgba(255,255,255,0.55)",
												mt: 0.25,
											}}
										>
											Interest: {formatCurrency(totalAmount - initialPrincipal)}
										</Typography>
									</Box>
								</Box>
							</Grid>

							<Grid item xs={6} md={3} sx={{ display: "flex" }}>
								<Box sx={boxThemeStyle}>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.45)",
											fontSize: "0.68rem",
											textTransform: "uppercase",
											fontWeight: 800,
											letterSpacing: "0.05em",
										}}
									>
										Type & Rate
									</Typography>
									<Box sx={{ mt: 0.5 }}>
										<Typography
											sx={{
												fontSize: "0.88rem",
												fontWeight: 800,
												color: "white",
											}}
										>
											{activeLoan.loan_strategy || "STABLE_LOAN"}
										</Typography>
										<Typography
											sx={{
												fontSize: "0.74rem",
												fontFamily: "monospace",
												color: "#c084fc",
												fontWeight: 700,
												mt: 0.25,
											}}
										>
											Rate:{" "}
											{Number(
												initialPrincipal > 0 &&
													installmentConds.length > 0 &&
													installmentConds[0].interestamount
													? (installmentConds[0].interestamount /
															initialPrincipal) *
															100
													: 1.0,
											).toFixed(1)}
											% / installment
										</Typography>
										<Typography
											sx={{
												fontSize: "0.66rem",
												fontFamily: "monospace",
												color: "rgba(255,255,255,0.55)",
												mt: 0.25,
											}}
										>
											Total Interest:{" "}
											{Number(
												initialPrincipal > 0
													? (totalInterestExpected / initialPrincipal) * 100
													: interestRatePercent,
											).toFixed(1)}
											% (Contract)
										</Typography>
									</Box>
								</Box>
							</Grid>

							<Grid item xs={6} md={3} sx={{ display: "flex" }}>
								<Box sx={boxThemeStyle}>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.45)",
											fontSize: "0.68rem",
											textTransform: "uppercase",
											fontWeight: 800,
											letterSpacing: "0.05em",
										}}
									>
										Installment Progress
									</Typography>
									<Box sx={{ mt: 0.5 }}>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												mb: 0.5,
											}}
										>
											<Typography
												sx={{
													fontSize: "0.72rem",
													color: "rgba(255,255,255,0.6)",
												}}
											>
												Fulfilled
											</Typography>
											<Typography
												sx={{
													fontSize: "0.85rem",
													fontFamily: "monospace",
													fontWeight: 800,
													color: "white",
												}}
											>
												{fulfilledInst}/{totalInst}
											</Typography>
										</Box>
										<LinearProgress
											variant="determinate"
											value={instPercent}
											sx={{
												width: "100%",
												height: 6,
												borderRadius: 3,
												bgcolor: "rgba(255,255,255,0.08)",
												"& .MuiLinearProgress-bar": { bgcolor: "#7b68ee" },
											}}
										/>
									</Box>
								</Box>
							</Grid>
						</Grid>

						{/* Dates & Interval Banner */}
						<Box
							sx={{
								p: 1.75,
								borderRadius: "10px",
								bgcolor: "rgba(123, 104, 238, 0.08)",
								border: "1px solid rgba(123, 104, 238, 0.25)",
								display: "flex",
								flexWrap: "wrap",
								gap: 2,
								alignItems: "center",
								justifyContent: "space-between",
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
								<CalendarMonthIcon sx={{ color: "#7b68ee", fontSize: 22 }} />
								<Box>
									<Typography
										sx={{
											fontSize: "0.66rem",
											color: "rgba(255,255,255,0.45)",
											textTransform: "uppercase",
											fontWeight: 800,
											letterSpacing: "0.05em",
										}}
									>
										Issue Date
									</Typography>
									<Typography
										sx={{
											fontSize: "0.82rem",
											fontFamily: "monospace",
											fontWeight: 700,
											color: "white",
										}}
									>
										{startDate.toLocaleDateString()}{" "}
										{startDate.toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</Typography>
								</Box>
							</Box>

							<Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
								<RepeatIcon sx={{ color: "#38bdf8", fontSize: 22 }} />
								<Box>
									<Typography
										sx={{
											fontSize: "0.66rem",
											color: "rgba(255,255,255,0.45)",
											textTransform: "uppercase",
											fontWeight: 800,
											letterSpacing: "0.05em",
										}}
									>
										Payment Interval
									</Typography>
									<Typography
										sx={{
											fontSize: "0.82rem",
											fontFamily: "monospace",
											fontWeight: 700,
											color: "white",
										}}
									>
										Every {intervalDays} Days ({totalInst} Total Payments)
									</Typography>
								</Box>
							</Box>

							<Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
								<CalendarMonthIcon sx={{ color: "#f59e0b", fontSize: 22 }} />
								<Box>
									<Typography
										sx={{
											fontSize: "0.66rem",
											color: "rgba(255,255,255,0.45)",
											textTransform: "uppercase",
											fontWeight: 800,
											letterSpacing: "0.05em",
										}}
									>
										Final Due Date (Last Payment)
									</Typography>
									<Typography
										sx={{
											fontSize: "0.86rem",
											fontFamily: "monospace",
											fontWeight: 800,
											color: "#f59e0b",
										}}
									>
										{finalDueDate.toLocaleDateString()}
									</Typography>
								</Box>
							</Box>
						</Box>

						<Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

						{/* Installment Payment Schedule Visual Timeline from DB Conditions */}
						<Box>
							<Box
								sx={{
									mb: 1.5,
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<Typography
									sx={{
										fontSize: "0.85rem",
										fontWeight: 800,
										textTransform: "uppercase",
										letterSpacing: "0.08em",
										color: "#7b68ee",
									}}
								>
									Payment Schedule
								</Typography>
							</Box>

							<Box
								sx={{
									display: "grid",
									gridTemplateColumns: {
										xs: "1fr",
										sm: "repeat(2, 1fr)",
										md: "repeat(3, 1fr)",
									},
									gap: 1.25,
									maxHeight: 290,
									overflowY: "auto",
									pr: 0.5,
									"&::-webkit-scrollbar": { width: "4px" },
									"&::-webkit-scrollbar-thumb": {
										bgcolor: "rgba(255,255,255,0.1)",
										borderRadius: "4px",
									},
								}}
							>
								{installments.map((inst) => (
									<Box
										key={inst.number}
										sx={{
											p: 1.5,
											borderRadius: "10px",
											bgcolor: inst.isCompleted
												? "rgba(74, 222, 128, 0.06)"
												: inst.isCurrentNext
													? "rgba(56, 189, 248, 0.08)"
													: "rgba(255,255,255,0.02)",
											border: `1px solid ${
												inst.isCompleted
													? "rgba(74, 222, 128, 0.25)"
													: inst.isCurrentNext
														? "rgba(56, 189, 248, 0.35)"
														: "rgba(255,255,255,0.06)"
											}`,
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
										}}
									>
										<Box
											sx={{ display: "flex", alignItems: "center", gap: 1.25 }}
										>
											{inst.isCompleted ? (
												<CheckCircleIcon
													sx={{
														fontSize: 22,
														color: SEMANTIC_COLORS.neonGreen,
													}}
												/>
											) : inst.isCurrentNext ? (
												<HourglassTopIcon
													sx={{ fontSize: 22, color: "#38bdf8" }}
												/>
											) : (
												<Box
													sx={{
														width: 22,
														height: 22,
														borderRadius: "50%",
														border: "1.5px solid rgba(255,255,255,0.25)",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
													}}
												>
													<Typography
														sx={{
															fontSize: "0.68rem",
															fontWeight: 800,
															color: "rgba(255,255,255,0.5)",
														}}
													>
														{inst.number}
													</Typography>
												</Box>
											)}
											<Box>
												<Typography
													sx={{
														fontSize: "0.82rem",
														fontWeight: 800,
														color: "white",
													}}
												>
													Installment #{inst.number}
												</Typography>
												<Typography
													sx={{
														fontSize: "0.72rem",
														fontFamily: "monospace",
														color: "rgba(255,255,255,0.55)",
													}}
												>
													{inst.date.toLocaleDateString()}
												</Typography>
												<Chip
													label={
														inst.isCompleted
															? "PAID"
															: inst.isCurrentNext
																? "DUE NEXT"
																: "PENDING"
													}
													size="small"
													sx={{
														height: 16,
														fontSize: "0.58rem",
														fontWeight: 800,
														mt: 0.5,
														bgcolor: inst.isCompleted
															? "rgba(74, 222, 128, 0.18)"
															: inst.isCurrentNext
																? "rgba(56, 189, 248, 0.18)"
																: "rgba(255,255,255,0.06)",
														color: inst.isCompleted
															? SEMANTIC_COLORS.neonGreen
															: inst.isCurrentNext
																? "#38bdf8"
																: "rgba(255,255,255,0.45)",
													}}
												/>
											</Box>
										</Box>

										{/* Exact Payment Breakdown From Database Contract Conditions */}
										<Box sx={{ textAlign: "right" }}>
											<Typography
												sx={{
													fontSize: "0.88rem",
													fontFamily: "monospace",
													fontWeight: 800,
													color: "#7b68ee",
												}}
											>
												{formatCurrency(inst.totalPayment)} {loanCurrency}
											</Typography>
											<Typography
												sx={{
													fontSize: "0.68rem",
													fontFamily: "monospace",
													color: "rgba(255,255,255,0.65)",
												}}
											>
												Principal: {formatCurrency(inst.principalAmount)}
											</Typography>
											<Typography
												sx={{
													fontSize: "0.68rem",
													fontFamily: "monospace",
													color: "#c084fc",
													fontWeight: 700,
												}}
											>
												Interest: +{formatCurrency(inst.interestAmount)}
											</Typography>
										</Box>
									</Box>
								))}
							</Box>
						</Box>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};
