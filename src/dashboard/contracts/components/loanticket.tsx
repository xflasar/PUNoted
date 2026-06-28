import React, { memo, useState, useEffect } from "react";
import {
	Box,
	Typography,
	Paper,
	Chip,
	Stack,
	IconButton,
	Divider,
	Tooltip,
	Zoom,
	LinearProgress,
	useTheme,
} from "@mui/material";
import {
	Star,
	StarBorder,
	EventRepeat,
	AttachMoney,
	PieChart,
	Info,
	AccessTime,
	Warning,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { formatCurrency, getStatusColor, getStatusBg } from "../helpers/helper";
import InstallmentTracker from "./installmenttracker";
import type { ContractListItem } from "../types";

dayjs.extend(duration);

// Internal hook for ticker to avoid polluting parent
const useCountdown = (targetDate: string | undefined | null) => {
	const [timeLeft, setTimeLeft] = useState<string>("");
	const [isExpired, setIsExpired] = useState(false);

	useEffect(() => {
		if (!targetDate) return;
		const calculate = () => {
			const now = dayjs();
			const target = dayjs(targetDate);
			const diff = target.diff(now);
			if (diff <= 0) {
				setIsExpired(true);
				setTimeLeft("Processing...");
				return;
			}
			const dur = dayjs.duration(diff);
			if (dur.asHours() > 24)
				setTimeLeft(`${Math.floor(dur.asDays())}d ${dur.hours()}h`);
			else setTimeLeft(dayjs(diff).format("HH:mm:ss"));
		};
		calculate();
		const interval = setInterval(calculate, 1000);
		return () => clearInterval(interval);
	}, [targetDate]);

	return { timeLeft, isExpired };
};

interface ExtendedContract extends ContractListItem {
	installment_count?: number;
	installment_done?: number;
	installment_interval?: number;
	implied_interest_rate?: number;
	loan_strategy?: string;
	extension_deadline?: string;
}

interface LoanTicketProps {
	contract: ExtendedContract;
	isLender: boolean;
	isPinned: boolean;
	onTogglePin: (id: string, e: React.MouseEvent) => void; // Changed signature for optimization
	onClick: (id: string) => void;
}

const LoanTicket = memo(
	({ contract, isLender, isPinned, onTogglePin, onClick }: LoanTicketProps) => {
		const theme = useTheme();

		// Status Logic
		const isPaid = contract.status === "FULFILLED";
		const isExtended = !!contract.extension_deadline;
		// Determine if visually overdue (Database status might not update instantly)
		const isOverdue =
			contract.duedate && dayjs(contract.duedate).isBefore(dayjs()) && !isPaid;

		const isActive = ["OPEN", "PARTIALLY_FULFILLED"].includes(contract.status);
		const { timeLeft, isExpired } = useCountdown(
			isActive ? contract.duedate : null,
		);

		// Styling
		const roleColor = isLender
			? theme.palette.success.main
			: theme.palette.error.main;

		let statusLabel = contract.status;
		if (isExtended && contract.status === "BREACHED")
			statusLabel = "BREACHED (EXT)";
		else if (isOverdue && isActive) statusLabel = "OVERDUE"; // Visual override

		let statusColor = getStatusColor(contract.status, theme);
		let statusBg = getStatusBg(contract.status, theme);

		if (isExtended && contract.status === "BREACHED") {
			statusColor = theme.palette.secondary.main;
			statusBg = alpha(theme.palette.secondary.main, 0.1);
		} else if (isOverdue && isActive) {
			statusColor = theme.palette.error.main;
			statusBg = alpha(theme.palette.error.main, 0.1);
		}

		const borderColor = isPinned
			? theme.palette.primary.main
			: isOverdue
				? theme.palette.error.main
				: theme.palette.divider;
		const bgColor = isPinned
			? alpha(theme.palette.primary.main, 0.02)
			: alpha(theme.palette.background.default, 0.6);

		// Calculations
		const rate = contract.implied_interest_rate || 0;
		const principal = contract.total_amount / (1 + rate / 100);
		const interest = contract.total_amount - principal;
		const intervalLabel = contract.installment_interval
			? `${contract.installment_interval}d`
			: "1x";
		const strategyLabel =
			contract.loan_strategy === "STABLE_INTEREST" ? "Stable" : "Amort";
		const totalInst = contract.installment_count || 1;
		const doneInst = contract.installment_done || 0;
		const progressPercent = Math.min((doneInst / totalInst) * 100, 100);

		const handlePin = (e: React.MouseEvent) => onTogglePin(contract.id, e);
		const handleClick = () => onClick(contract.id);

		const FinancialTooltip = (
			<Box sx={{ p: 0.5 }}>
				<Typography
					variant="caption"
					fontWeight={700}
					sx={{
						borderBottom: "1px solid rgba(255,255,255,0.2)",
						mb: 0.5,
						display: "block",
					}}
				>
					FINANCIAL BREAKDOWN
				</Typography>
				<Stack direction="row" justifyContent="space-between" spacing={2}>
					<Typography variant="caption">Principal:</Typography>
					<Typography variant="caption" fontWeight={700} fontFamily="monospace">
						{formatCurrency(principal, contract.currency)}
					</Typography>
				</Stack>
				<Stack direction="row" justifyContent="space-between" spacing={2}>
					<Typography
						variant="caption"
						color={isLender ? "success.light" : "error.light"}
					>
						Interest ({rate}%):
					</Typography>
					<Typography
						variant="caption"
						fontWeight={700}
						fontFamily="monospace"
						color={isLender ? "success.light" : "error.light"}
					>
						+{formatCurrency(interest, contract.currency)}
					</Typography>
				</Stack>
			</Box>
		);

		return (
			<Paper
				sx={{
					mb: 0.5,
					overflow: "hidden",
					borderRadius: 1.25,
					border: `1px solid ${borderColor}`,
					bgcolor: bgColor,
					transition: "all 0.1s",
					boxShadow: isPinned ? theme.shadows[1] : "none",
					"&:hover": {
						bgcolor: "background.paper",
						borderColor: roleColor,
						transform: "translateX(2px)",
					},
				}}
			>
				{/* Header */}
				<Box
					sx={{
						p: 0.5,
						px: 1,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
						bgcolor: alpha(roleColor, 0.04),
					}}
				>
					<Stack
						direction="row"
						spacing={1}
						alignItems="center"
						sx={{ overflow: "hidden" }}
					>
						<IconButton
							size="small"
							onClick={handlePin}
							sx={{ p: 0, color: isPinned ? "primary.main" : "text.disabled" }}
						>
							{isPinned ? (
								<Star sx={{ fontSize: 16 }} />
							) : (
								<StarBorder sx={{ fontSize: 16 }} />
							)}
						</IconButton>
						<Typography
							variant="subtitle2"
							fontWeight={800}
							fontSize="0.85rem"
							noWrap
							sx={{ maxWidth: 180 }}
						>
							{contract.partnername}
						</Typography>
						{isOverdue && (
							<Tooltip title="Payment Overdue">
								<Warning color="error" sx={{ fontSize: 14 }} />
							</Tooltip>
						)}
					</Stack>
					<Stack direction="row" spacing={1} alignItems="center">
						<Typography
							variant="caption"
							fontFamily="monospace"
							color="text.secondary"
							fontSize="0.65rem"
						>
							{contract.localid}
						</Typography>
						<Chip
							label={statusLabel}
							size="small"
							sx={{
								height: 16,
								fontSize: "0.6rem",
								fontWeight: 800,
								borderRadius: 0.5,
								bgcolor: statusBg,
								color: statusColor,
							}}
						/>
					</Stack>
				</Box>

				{/* Body */}
				<Box sx={{ p: 0.75 }}>
					{/* Metrics */}
					<Box
						sx={{
							display: "flex",
							flexWrap: "wrap",
							gap: 1.5,
							alignItems: "center",
							mb: 0.5,
						}}
					>
						<Tooltip
							title={FinancialTooltip}
							arrow
							placement="top"
							TransitionComponent={Zoom}
						>
							<Box sx={{ flex: "0 0 auto", cursor: "help" }}>
								<Typography
									variant="caption"
									color="text.secondary"
									fontSize="0.6rem"
									display="block"
									lineHeight={1}
									mb={0.25}
								>
									TOTAL
								</Typography>
								<Typography
									variant="subtitle2"
									fontFamily="monospace"
									fontWeight={800}
									lineHeight={1}
									color="text.primary"
									fontSize="0.95rem"
								>
									{formatCurrency(contract.total_amount, contract.currency)}
								</Typography>
							</Box>
						</Tooltip>
						<Box
							sx={{
								display: "flex",
								gap: 1.5,
								flexWrap: "wrap",
								flex: 1,
								alignItems: "center",
							}}
						>
							<Divider
								orientation="vertical"
								flexItem
								sx={{ height: 20, alignSelf: "center" }}
							/>
							<Box>
								<Typography
									variant="caption"
									color="text.secondary"
									fontSize="0.6rem"
									display="block"
									lineHeight={1}
									mb={0.25}
								>
									PRINCIPAL
								</Typography>
								<Stack direction="row" spacing={0.25} alignItems="center">
									<AttachMoney sx={{ fontSize: 10, color: "text.secondary" }} />
									<Typography
										variant="caption"
										fontWeight={400}
										fontSize="0.75rem"
									>
										{formatCurrency(principal, contract.currency)}
									</Typography>
								</Stack>
							</Box>
							<Box>
								<Typography
									variant="caption"
									color="text.secondary"
									fontSize="0.6rem"
									display="block"
									lineHeight={1}
									mb={0.25}
								>
									INTEREST ({rate}%)
								</Typography>
								<Stack direction="row" spacing={0.25} alignItems="center">
									<PieChart
										sx={{
											fontSize: 10,
											color: isLender ? "success.main" : "error.main",
										}}
									/>
									<Typography
										variant="caption"
										fontWeight={400}
										fontSize="0.75rem"
										color={isLender ? "success.main" : "error.main"}
									>
										+{formatCurrency(interest, contract.currency)}
									</Typography>
								</Stack>
							</Box>
						</Box>
					</Box>

					{/* Footer Info */}
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Stack direction="row" spacing={1} alignItems="center">
							<Chip
								label={strategyLabel}
								size="small"
								variant="outlined"
								sx={{
									height: 18,
									fontSize: "0.65rem",
									borderColor: theme.palette.divider,
								}}
							/>
							<Chip
								icon={<EventRepeat sx={{ fontSize: "10px !important" }} />}
								label={intervalLabel}
								size="small"
								variant="outlined"
								sx={{
									height: 18,
									fontSize: "0.65rem",
									borderColor: theme.palette.divider,
									pl: 0.5,
								}}
							/>
						</Stack>
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Box sx={{ textAlign: "right" }}>
								{isActive && timeLeft ? (
									<Stack
										direction="row"
										spacing={0.5}
										alignItems="center"
										justifyContent="flex-end"
									>
										<AccessTime
											sx={{
												fontSize: 12,
												color: isExpired ? "warning.main" : "text.secondary",
												animation: isExpired ? "pulse 2s infinite" : "none",
											}}
										/>
										<Typography
											variant="body2"
											fontWeight={700}
											fontSize="0.8rem"
											fontFamily="monospace"
											color={isExpired ? "warning.main" : "text.primary"}
											lineHeight={1}
										>
											{timeLeft}
										</Typography>
									</Stack>
								) : (
									<Typography
										variant="body2"
										fontWeight={600}
										fontSize="0.8rem"
										color="text.secondary"
										lineHeight={1}
									>
										{isExtended ? (
											<span style={{ color: theme.palette.secondary.main }}>
												{dayjs(contract.extension_deadline).format("MMM DD")}{" "}
												(Ext)
											</span>
										) : contract.duedate ? (
											dayjs(contract.duedate).format("MMM DD")
										) : (
											"--"
										)}
									</Typography>
								)}
								<Typography
									variant="caption"
									color="text.secondary"
									fontSize="0.6rem"
									display="block"
									lineHeight={1}
									sx={{ mt: 0.2 }}
								>
									{isActive
										? isExpired
											? "AUTO-PAY PENDING"
											: "TIME REMAINING"
										: "DUE DATE"}
								</Typography>
							</Box>
							<IconButton
								size="small"
								onClick={handleClick}
								sx={{
									p: 0.25,
									bgcolor: alpha(theme.palette.action.active, 0.05),
								}}
							>
								<Info sx={{ fontSize: 18 }} />
							</IconButton>
						</Stack>
					</Box>

					<InstallmentTracker
						total={totalInst}
						done={doneInst}
						color={roleColor}
						startDate={contract.date}
						interval={contract.installment_interval}
					/>
				</Box>

				{!isPaid && totalInst > 24 && (
					<LinearProgress
						variant="determinate"
						value={progressPercent}
						sx={{
							height: 3,
							bgcolor: alpha(roleColor, 0.1),
							"& .MuiLinearProgress-bar": { bgcolor: roleColor },
						}}
					/>
				)}
			</Paper>
		);
	},
);

export default LoanTicket;
