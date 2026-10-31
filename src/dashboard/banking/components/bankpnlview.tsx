import React, { useState, useMemo } from "react";
import {
	Box,
	Paper,
	Typography,
	Chip,
	TextField,
	InputAdornment,
	Divider,
	Tooltip,
	useTheme,
	Alert,
	ToggleButton,
	ToggleButtonGroup,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SpeedIcon from "@mui/icons-material/Speed";
import CalculateIcon from "@mui/icons-material/Calculate";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";

import type { Bank, BankLoanRecord, BankYieldMetrics } from "../types";
import { formatAmount } from "../../../utils/formaters";
import { FormattedNumberInput } from "./formattednumberinput";

interface BankPnlViewProps {
	bank: Bank;
	loans: BankLoanRecord[];
	metrics: BankYieldMetrics | null;
}

export const BankPnlView: React.FC<BankPnlViewProps> = ({
	bank,
	loans,
	metrics,
}) => {
	const theme = useTheme();
	const currency = bank.currency || "ICA";
	const weeklyYieldRate =
		bank.weekly_yield_rate ?? metrics?.weekly_yield_rate ?? 1.5;
	const weeklyClientYieldCost = metrics?.est_weekly_payout_pool ?? 0.0;

	// Interactive Simulator State
	const [simLoanAmount, setSimLoanAmount] = useState<number | "">(100000);
	const [simWeeks, setSimWeeks] = useState<number | "">(4);
	const [simRate, setSimRate] = useState<number | "">(
		bank.default_interest_rate ?? 1.5,
	);
	const [rateMode, setRateMode] = useState<"WEEKLY" | "TOTAL">("WEEKLY");
	const [fundingMode, setFundingMode] = useState<"VAULT_MIX" | "FULL_CLIENT">(
		"VAULT_MIX",
	);

	const isSettled = (st: string) =>
		st === "APPROVED" || st === "REPAID" || st === "FULFILLED";
	const isClient = (u: string) =>
		(u || "").toLowerCase() !== (bank.owner_username || "").toLowerCase();

	// Actual external customer deposits in the bank (excluding owner equity)
	const actualClientDeposits = useMemo(() => {
		if (metrics?.client_deposits !== undefined) {
			return metrics.client_deposits;
		}
		const grossDeposits = loans
			.filter(
				(l) =>
					l.transaction_type === "DEPOSIT" &&
					isSettled(l.status) &&
					isClient(l.requester_username),
			)
			.reduce((sum, l) => sum + (l.amount || 0), 0);
		const grossWithdrawals = loans
			.filter(
				(l) =>
					l.transaction_type === "WITHDRAWAL" &&
					isSettled(l.status) &&
					isClient(l.requester_username),
			)
			.reduce((sum, l) => sum + (l.amount || 0), 0);
		return Math.max(0, grossDeposits - grossWithdrawals);
	}, [metrics?.client_deposits, loans, bank.owner_username]);

	// 1. Calculate Historical Revenue & Expenses
	const stats = useMemo(() => {
		const loanItems = loans.filter(
			(l) => (l.transaction_type || "LOAN") === "LOAN",
		);
		const repaidLoans = loanItems.filter((l) => l.status === "REPAID");
		const activeLoans = loanItems.filter((l) => l.status === "APPROVED");

		// Total interest collected from repaid loans (interest_rate is total rate for loan)
		const collectedInterest = repaidLoans.reduce((sum, l) => {
			const r = l.interest_rate ?? bank.default_interest_rate ?? 1.5;
			return sum + (l.amount || 0) * (r / 100.0);
		}, 0);

		// Projected interest on currently active loans
		const pendingInterest = activeLoans.reduce((sum, l) => {
			const r = l.interest_rate ?? bank.default_interest_rate ?? 1.5;
			return sum + (l.amount || 0) * (r / 100.0);
		}, 0);

		// Weekly run-rate of interest from active loans (total interest / term in weeks)
		const weeklyInterestRunRate = activeLoans.reduce((sum, l) => {
			const r = l.interest_rate ?? bank.default_interest_rate ?? 1.5;
			const termDays = l.term_days || 14;
			const weeks = Math.max(1, termDays / 7);
			return sum + ((l.amount || 0) * (r / 100.0)) / weeks;
		}, 0);

		// Total historical yield distributed to depositors
		const yieldTransactions = loans.filter(
			(l) => l.transaction_type === "YIELD" && l.status !== "REJECTED",
		);
		const historicalYieldPaid = yieldTransactions.reduce(
			(sum, l) => sum + (l.amount || 0),
			0,
		);

		// Current Net Weekly Spread
		const netWeeklySpread = weeklyInterestRunRate - weeklyClientYieldCost;

		// Vault Capital Utilization
		const totalPool = metrics?.total_pool || bank.liquidity || 0;
		const activeCapitalOut = activeLoans.reduce(
			(sum, l) => sum + (l.amount || 0),
			0,
		);
		const utilizationPercent =
			totalPool > 0
				? Math.min(100, Math.round((activeCapitalOut / totalPool) * 100))
				: 0;
		const idleCapital = Math.max(0, totalPool - activeCapitalOut);

		// Deposit Capacity & Solvency calculations
		const strategy = bank.deposit_strategy || "BALANCED";
		const safetyMargin =
			strategy === "PROFIT" ? 0.35 : strategy === "BALANCED" ? 0.2 : 0.0;
		const maxAllowedWeeklyCost = weeklyInterestRunRate * (1 - safetyMargin);
		const effectiveYieldDecimal = (weeklyYieldRate || 1.5) / 100.0;
		const maxSafeDeposits =
			effectiveYieldDecimal > 0
				? maxAllowedWeeklyCost / effectiveYieldDecimal
				: 0;
		const currentClientDeposits = actualClientDeposits;
		const remainingDepositCapacity = Math.max(
			0,
			maxSafeDeposits - currentClientDeposits,
		);
		const isAtOrOverCapacity =
			currentClientDeposits >= maxSafeDeposits && maxSafeDeposits > 0;
		const isNearCapacity =
			currentClientDeposits >= maxSafeDeposits * 0.8 && !isAtOrOverCapacity;

		return {
			collectedInterest,
			pendingInterest,
			weeklyInterestRunRate,
			historicalYieldPaid,
			netWeeklySpread,
			totalPool,
			activeCapitalOut,
			utilizationPercent,
			idleCapital,
			activeLoansCount: activeLoans.length,
			repaidLoansCount: repaidLoans.length,
			maxSafeDeposits,
			remainingDepositCapacity,
			isAtOrOverCapacity,
			isNearCapacity,
			safetyMargin,
			strategy,
		};
	}, [
		loans,
		metrics,
		bank,
		weeklyClientYieldCost,
		weeklyYieldRate,
		actualClientDeposits,
	]);

	// 2. Interactive Loan Profitability Calculation
	const sim = useMemo(() => {
		const amt = Number(simLoanAmount) || 0;
		const w = Number(simWeeks) || 1;
		const rawRate = Number(simRate) || 0;

		// PrUn quotes total term rate by default (e.g. 1.5% total on 2M is 30k ICA)
		const totalRate = rateMode === "TOTAL" ? rawRate : rawRate * w;
		const weeklyRate = rateMode === "TOTAL" ? rawRate / w : rawRate;

		const grossInterest = amt * (totalRate / 100.0);
		const weeklyInterest = w > 0 ? grossInterest / w : 0;

		// Client deposits yield cost vs 0% Owner Equity:
		// In VAULT_MIX mode, client deposits are used first up to actual available client deposits.
		// Any remaining portion is funded by owner equity (0% yield cost).
		const clientFundedAmt =
			fundingMode === "VAULT_MIX"
				? Math.min(amt, Math.max(0, actualClientDeposits))
				: amt;
		const ownerFundedAmt = Math.max(0, amt - clientFundedAmt);

		const weeklyCost = clientFundedAmt * (weeklyYieldRate / 100.0);
		const clientCost = weeklyCost * w;

		const netWeekly = weeklyInterest - weeklyCost;
		const netProfit = grossInterest - clientCost;

		// Breakeven loan interest rate needed to cover depositor yield over the term
		const breakevenTotalRate =
			amt > 0 ? Number(((clientCost / amt) * 100).toFixed(2)) : 0;
		const breakevenWeeklyRate =
			w > 0 ? Number((breakevenTotalRate / w).toFixed(3)) : 0;
		const isProfitable = netProfit > 0.01;
		const isBreakeven = Math.abs(netProfit) <= 0.01;

		return {
			amt,
			w,
			rawRate,
			weeklyRate,
			totalRate,
			clientFundedAmt,
			ownerFundedAmt,
			weeklyInterest,
			grossInterest,
			weeklyCost,
			clientCost,
			netWeekly,
			netProfit,
			breakevenWeeklyRate,
			breakevenTotalRate,
			isProfitable,
			isBreakeven,
		};
	}, [
		simLoanAmount,
		simWeeks,
		simRate,
		rateMode,
		fundingMode,
		actualClientDeposits,
		weeklyYieldRate,
	]);

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, p: 1.5 }}>
			{/* Top Bar: Executive Net Interest Margin (Weekly Spread) */}
			<Paper
				elevation={0}
				sx={{
					p: 1.25,
					px: 1.75,
					borderRadius: 1.5,
					bgcolor:
						stats.netWeeklySpread >= 0
							? alpha("#10b981", 0.08)
							: alpha("#ef4444", 0.08),
					border: `1.5px solid ${stats.netWeeklySpread >= 0 ? alpha("#10b981", 0.3) : alpha("#ef4444", 0.3)}`,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 1.25,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
					{stats.netWeeklySpread >= 0 ? (
						<TrendingUpIcon sx={{ fontSize: 26, color: "#34d399" }} />
					) : (
						<TrendingDownIcon sx={{ fontSize: 26, color: "#f87171" }} />
					)}
					<Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Typography
								variant="subtitle1"
								sx={{ fontWeight: 900, lineHeight: 1.2 }}
							>
								{stats.netWeeklySpread >= 0 ? "+" : ""}
								{formatAmount(stats.netWeeklySpread)} {currency} / week
							</Typography>
							<Chip
								label={
									stats.netWeeklySpread >= 0
										? "PROFITABLE SPREAD"
										: "NET CASH DEFICIT"
								}
								size="small"
								sx={{
									fontWeight: 800,
									fontSize: "0.62rem",
									height: 18,
									bgcolor:
										stats.netWeeklySpread >= 0
											? alpha("#10b981", 0.2)
											: alpha("#ef4444", 0.2),
									color: stats.netWeeklySpread >= 0 ? "#34d399" : "#f87171",
								}}
							/>
						</Box>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								display: "block",
								fontSize: "0.7rem",
								mt: 0.15,
							}}
						>
							Weekly Net Margin: {formatAmount(stats.weeklyInterestRunRate)}{" "}
							{currency}/wk loan revenue minus{" "}
							{formatAmount(weeklyClientYieldCost)} {currency}/wk depositor
							yield.
						</Typography>
					</Box>
				</Box>

				{/* Capital Utilization */}
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
					<Box sx={{ textAlign: "right" }}>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontWeight: 800,
								display: "block",
								fontSize: "0.62rem",
							}}
						>
							VAULT UTILIZATION
						</Typography>
						<Typography
							variant="body2"
							sx={{ fontWeight: 900, color: "text.primary", lineHeight: 1.2 }}
						>
							{stats.utilizationPercent}%{" "}
							<span
								style={{
									fontSize: "0.7rem",
									color: theme.palette.text.secondary,
								}}
							>
								({formatAmount(stats.activeCapitalOut)} /{" "}
								{formatAmount(stats.totalPool)} {currency})
							</span>
						</Typography>
					</Box>
				</Box>
			</Paper>

			{/* Deposit Capacity & Solvency Gauge Banner */}
			<Paper
				variant="outlined"
				sx={{
					p: 1.2,
					px: 1.5,
					borderRadius: 1.5,
					bgcolor: stats.isAtOrOverCapacity
						? alpha("#ef4444", 0.08)
						: stats.isNearCapacity
							? alpha("#f59e0b", 0.08)
							: alpha("#10b981", 0.06),
					borderColor: stats.isAtOrOverCapacity
						? alpha("#ef4444", 0.3)
						: stats.isNearCapacity
							? alpha("#f59e0b", 0.3)
							: alpha("#10b981", 0.25),
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 1,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<AccountBalanceIcon
						sx={{
							fontSize: 20,
							color: stats.isAtOrOverCapacity
								? "#f87171"
								: stats.isNearCapacity
									? "#fbbf24"
									: "#34d399",
						}}
					/>
					<Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
							<Typography
								variant="subtitle2"
								sx={{ fontWeight: 900, fontSize: "0.82rem" }}
							>
								Deposit Capacity:{" "}
								{stats.isAtOrOverCapacity
									? "AT FULL CAPACITY"
									: `+${formatAmount(stats.remainingDepositCapacity)} ${currency} remaining`}
							</Typography>
							<Chip
								label={
									stats.isAtOrOverCapacity
										? "DEPOSITS OVER LIMIT (NEGATIVE CARRY)"
										: stats.isNearCapacity
											? "CAPACITY NEARING CAP"
											: "HEALTHY INFLOW ROOM"
								}
								size="small"
								sx={{
									fontWeight: 800,
									fontSize: "0.62rem",
									height: 18,
									bgcolor: stats.isAtOrOverCapacity
										? alpha("#ef4444", 0.2)
										: stats.isNearCapacity
											? alpha("#f59e0b", 0.2)
											: alpha("#10b981", 0.15),
									color: stats.isAtOrOverCapacity
										? "#f87171"
										: stats.isNearCapacity
											? "#fbbf24"
											: "#34d399",
								}}
							/>
						</Box>
						<Typography
							variant="caption"
							sx={{ color: "text.secondary", fontSize: "0.68rem" }}
						>
							Policy: <strong>{stats.strategy}</strong> (
							{Math.round(stats.safetyMargin * 100)}% profit margin reserved).
							Max safe customer deposits:{" "}
							<strong>
								{formatAmount(stats.maxSafeDeposits)} {currency}
							</strong>{" "}
							based on {weeklyYieldRate}%/wk yield.
						</Typography>
					</Box>
				</Box>

				{/* Quick indicator pill */}
				<Typography
					variant="caption"
					sx={{ fontWeight: 800, color: "text.secondary", fontSize: "0.72rem" }}
				>
					Current Client Deposits:{" "}
					<strong style={{ color: theme.palette.text.primary }}>
						{formatAmount(actualClientDeposits)} {currency}
					</strong>
				</Typography>
			</Paper>

			{/* 4-Stat Financial Grid (Compact) */}
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
					gap: 1,
				}}
			>
				{/* 1. All-Time Collected Interest */}
				<Paper
					variant="outlined"
					sx={{
						p: 1.1,
						px: 1.25,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.default, 0.6),
						borderColor: alpha(theme.palette.divider, 0.15),
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 800,
							fontSize: "0.62rem",
							display: "block",
						}}
					>
						REPAID LOAN REVENUE
					</Typography>
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 900,
							color: theme.palette.success.main,
							lineHeight: 1.2,
							mt: 0.2,
						}}
					>
						+{formatAmount(stats.collectedInterest)} {currency}
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", fontSize: "0.62rem" }}
					>
						Across {stats.repaidLoansCount} fulfilled loans
					</Typography>
				</Paper>

				{/* 2. Pending Active Interest */}
				<Paper
					variant="outlined"
					sx={{
						p: 1.1,
						px: 1.25,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.default, 0.6),
						borderColor: alpha(theme.palette.divider, 0.15),
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 800,
							fontSize: "0.62rem",
							display: "block",
						}}
					>
						PENDING ACTIVE INTEREST
					</Typography>
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 900,
							color: "primary.main",
							lineHeight: 1.2,
							mt: 0.2,
						}}
					>
						+{formatAmount(stats.pendingInterest)} {currency}
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", fontSize: "0.62rem" }}
					>
						On {stats.activeLoansCount} active loans
					</Typography>
				</Paper>

				{/* 3. Depositor Yield Cost */}
				<Paper
					variant="outlined"
					sx={{
						p: 1.1,
						px: 1.25,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.default, 0.6),
						borderColor: alpha(theme.palette.divider, 0.15),
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 800,
							fontSize: "0.62rem",
							display: "block",
						}}
					>
						WEEKLY DEPOSITOR COST
					</Typography>
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 900,
							color: "warning.main",
							lineHeight: 1.2,
							mt: 0.2,
						}}
					>
						-{formatAmount(weeklyClientYieldCost)} {currency}
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", fontSize: "0.62rem" }}
					>
						Owed weekly at {weeklyYieldRate}% yield
					</Typography>
				</Paper>

				{/* 4. Idle Reserve Capital */}
				<Paper
					variant="outlined"
					sx={{
						p: 1.1,
						px: 1.25,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.default, 0.6),
						borderColor: alpha(theme.palette.divider, 0.15),
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 800,
							fontSize: "0.62rem",
							display: "block",
						}}
					>
						IDLE UNLENT RESERVES
					</Typography>
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 900,
							color: "text.primary",
							lineHeight: 1.2,
							mt: 0.2,
						}}
					>
						{formatAmount(stats.idleCapital)} {currency}
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", fontSize: "0.62rem" }}
					>
						Available to deploy into loans
					</Typography>
				</Paper>
			</Box>

			{/* Interactive Loan Profitability & Breakeven Simulator (Compact) */}
			<Paper
				elevation={0}
				sx={{
					p: 1.5,
					borderRadius: 1.5,
					bgcolor: alpha(theme.palette.background.default, 0.65),
					border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
					display: "flex",
					flexDirection: "column",
					gap: 1.25,
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
						gap: 1,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<CalculateIcon sx={{ fontSize: 18, color: "primary.main" }} />
						<Box>
							<Typography
								variant="subtitle2"
								sx={{ fontWeight: 800, fontSize: "0.82rem" }}
							>
								Loan Profitability &amp; Breakeven Simulator
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: "text.secondary", fontSize: "0.68rem" }}
							>
								Test proposed terms before signing contracts to guarantee
								profitable margins.
							</Typography>
						</Box>
					</Box>

					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							flexWrap: "wrap",
						}}
					>
						<Chip
							icon={<AccountBalanceIcon sx={{ fontSize: "12px !important" }} />}
							label={`Client Deposits: ${formatAmount(actualClientDeposits)} ${currency}`}
							size="small"
							variant="outlined"
							sx={{ fontWeight: 700, fontSize: "0.62rem", height: 22 }}
						/>

						<ToggleButtonGroup
							size="small"
							exclusive
							value={fundingMode}
							onChange={(_, newMode) => newMode && setFundingMode(newMode)}
							sx={{ height: 22 }}
						>
							<ToggleButton
								value="VAULT_MIX"
								sx={{
									px: 0.9,
									fontSize: "0.6rem",
									fontWeight: 800,
									textTransform: "none",
									py: 0,
								}}
							>
								Vault Mix (Real)
							</ToggleButton>
							<ToggleButton
								value="FULL_CLIENT"
								sx={{
									px: 0.9,
									fontSize: "0.6rem",
									fontWeight: 800,
									textTransform: "none",
									py: 0,
								}}
							>
								100% Client Funded
							</ToggleButton>
						</ToggleButtonGroup>
					</Box>
				</Box>

				{/* Simulator Inputs Grid */}
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: { xs: "1fr", sm: "1.2fr 0.9fr 1.4fr" },
						gap: 1,
						alignItems: "flex-start",
					}}
				>
					<FormattedNumberInput
						label="Loan Principal"
						size="small"
						value={simLoanAmount}
						onChange={(val) => setSimLoanAmount(val)}
						unit={currency}
						icon={
							<AttachMoneyIcon sx={{ fontSize: 15, color: "primary.main" }} />
						}
					/>

					<TextField
						label="Duration (Weeks)"
						size="small"
						type="number"
						value={simWeeks}
						onChange={(e) =>
							setSimWeeks(
								e.target.value === ""
									? ""
									: Math.max(1, Number(e.target.value)),
							)
						}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<CalendarTodayIcon
											sx={{ fontSize: 15, color: "text.secondary" }}
										/>
									</InputAdornment>
								),
								endAdornment: <InputAdornment position="end">W</InputAdornment>,
								sx: { fontSize: "0.78rem", height: 36 },
							},
						}}
					/>

					<Box sx={{ display: "flex", gap: 0.75, alignItems: "flex-start" }}>
						<TextField
							label={
								rateMode === "TOTAL"
									? "Loan Interest Rate (% total)"
									: "Weekly Rate (%/wk)"
							}
							size="small"
							type="number"
							value={simRate}
							onChange={(e) =>
								setSimRate(e.target.value === "" ? "" : Number(e.target.value))
							}
							helperText={
								rateMode === "TOTAL"
									? `${sim.weeklyRate.toFixed(3)}% / week equivalent`
									: `Total: ${sim.totalRate.toFixed(2)}% over ${sim.w} wks`
							}
							slotProps={{
								input: {
									endAdornment: (
										<InputAdornment position="end">%</InputAdornment>
									),
									sx: { fontSize: "0.78rem", height: 36 },
								},
							}}
							sx={{
								flex: 1,
								"& .MuiFormHelperText-root": { fontSize: "0.62rem", mt: 0.25 },
							}}
						/>

						<ToggleButtonGroup
							size="small"
							exclusive
							value={rateMode}
							onChange={(_, newMode) => {
								if (!newMode) return;
								setRateMode(newMode);
								if (typeof simRate === "number") {
									if (newMode === "TOTAL") {
										setSimRate(Number((simRate * sim.w).toFixed(2)));
									} else {
										setSimRate(Number((simRate / sim.w).toFixed(3)));
									}
								}
							}}
							sx={{ height: 36 }}
						>
							<ToggleButton
								value="TOTAL"
								sx={{ px: 0.9, fontSize: "0.65rem", fontWeight: 800 }}
							>
								Total
							</ToggleButton>
							<ToggleButton
								value="WEEKLY"
								sx={{ px: 0.9, fontSize: "0.65rem", fontWeight: 800 }}
							>
								/wk
							</ToggleButton>
						</ToggleButtonGroup>
					</Box>
				</Box>

				{/* Simulation Result Stats (Clean KPI Grid) */}
				<Paper
					variant="outlined"
					sx={{
						p: 1.25,
						borderRadius: 1.5,
						bgcolor: sim.isProfitable
							? alpha("#10b981", 0.05)
							: sim.isBreakeven
								? alpha("#f59e0b", 0.05)
								: alpha("#ef4444", 0.05),
						borderColor: sim.isProfitable
							? alpha("#10b981", 0.25)
							: sim.isBreakeven
								? alpha("#f59e0b", 0.25)
								: alpha("#ef4444", 0.25),
						display: "flex",
						flexDirection: "column",
						gap: 1.25,
					}}
				>
					{/* Header: Status & Spread Badge */}
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							flexWrap: "wrap",
							gap: 1,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
							{sim.isProfitable ? (
								<CheckCircleIcon sx={{ fontSize: 18, color: "#34d399" }} />
							) : sim.isBreakeven ? (
								<HelpOutlineOutlinedIcon
									sx={{ fontSize: 18, color: "#fbbf24" }}
								/>
							) : (
								<WarningAmberIcon sx={{ fontSize: 18, color: "#f87171" }} />
							)}
							<Typography
								variant="subtitle2"
								sx={{
									fontWeight: 900,
									color: sim.isProfitable
										? "#34d399"
										: sim.isBreakeven
											? "#fbbf24"
											: "#f87171",
									fontSize: "0.78rem",
									letterSpacing: "0.3px",
								}}
							>
								{sim.isProfitable
									? "PROFITABLE LOAN"
									: sim.isBreakeven
										? "BREAK-EVEN (0 SPREAD)"
										: "NEGATIVE MARGIN (LOSS!)"}
							</Typography>
						</Box>

						<Chip
							label={`Net Spread: ${sim.netWeekly >= 0 ? "+" : ""}${formatAmount(sim.netWeekly)} ${currency}/wk (${sim.netProfit >= 0 ? "+" : ""}${formatAmount(sim.netProfit)} total)`}
							size="small"
							sx={{
								fontWeight: 800,
								fontSize: "0.68rem",
								height: 20,
								bgcolor: sim.isProfitable
									? alpha("#10b981", 0.2)
									: sim.isBreakeven
										? alpha("#f59e0b", 0.2)
										: alpha("#ef4444", 0.2),
								color: sim.isProfitable
									? "#34d399"
									: sim.isBreakeven
										? "#fbbf24"
										: "#f87171",
							}}
						/>
					</Box>

					{/* 4 Stats Cards Grid */}
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: {
								xs: "repeat(2, 1fr)",
								sm: "repeat(4, 1fr)",
							},
							gap: 1,
						}}
					>
						{/* Stat 1: Gross Loan Revenue */}
						<Paper
							elevation={0}
							sx={{
								p: 0.9,
								px: 1.1,
								borderRadius: 1,
								bgcolor: alpha(theme.palette.background.paper, 0.45),
								border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
							}}
						>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontWeight: 800,
									fontSize: "0.58rem",
									display: "block",
									textTransform: "uppercase",
									letterSpacing: "0.5px",
								}}
							>
								Gross Revenue
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 900,
									color: "#34d399",
									fontSize: "0.88rem",
									lineHeight: 1.2,
									mt: 0.2,
								}}
							>
								+{formatAmount(sim.grossInterest)}{" "}
								<span style={{ fontSize: "0.65rem", fontWeight: 700 }}>
									{currency}
								</span>
							</Typography>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.62rem",
									display: "block",
									mt: 0.2,
								}}
							>
								+{formatAmount(sim.weeklyInterest)}/wk &bull;{" "}
								{sim.totalRate.toFixed(2)}% term
							</Typography>
						</Paper>

						{/* Stat 2: Depositor Cost */}
						<Paper
							elevation={0}
							sx={{
								p: 0.9,
								px: 1.1,
								borderRadius: 1,
								bgcolor: alpha(theme.palette.background.paper, 0.45),
								border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
							}}
						>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontWeight: 800,
									fontSize: "0.58rem",
									display: "block",
									textTransform: "uppercase",
									letterSpacing: "0.5px",
								}}
							>
								Depositor Cost
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 900,
									color: sim.clientCost > 0 ? "#f87171" : "text.secondary",
									fontSize: "0.88rem",
									lineHeight: 1.2,
									mt: 0.2,
								}}
							>
								{sim.clientCost > 0 ? `-${formatAmount(sim.clientCost)}` : "0"}{" "}
								<span style={{ fontSize: "0.65rem", fontWeight: 700 }}>
									{currency}
								</span>
							</Typography>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.62rem",
									display: "block",
									mt: 0.2,
								}}
							>
								{sim.weeklyCost > 0
									? `-${formatAmount(sim.weeklyCost)}/wk`
									: "0/wk"}{" "}
								&bull;{" "}
								{fundingMode === "VAULT_MIX"
									? `${formatAmount(sim.clientFundedAmt)} client / ${formatAmount(sim.ownerFundedAmt)} equity`
									: `${weeklyYieldRate}%/wk yield`}
							</Typography>
						</Paper>

						{/* Stat 3: Net Profit */}
						<Paper
							elevation={0}
							sx={{
								p: 0.9,
								px: 1.1,
								borderRadius: 1,
								bgcolor: alpha(theme.palette.background.paper, 0.45),
								border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
							}}
						>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontWeight: 800,
									fontSize: "0.58rem",
									display: "block",
									textTransform: "uppercase",
									letterSpacing: "0.5px",
								}}
							>
								Net Profit
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 900,
									color: sim.isProfitable
										? "#34d399"
										: sim.isBreakeven
											? "#fbbf24"
											: "#f87171",
									fontSize: "0.88rem",
									lineHeight: 1.2,
									mt: 0.2,
								}}
							>
								{sim.netProfit >= 0 ? "+" : ""}
								{formatAmount(sim.netProfit)}{" "}
								<span style={{ fontSize: "0.65rem", fontWeight: 700 }}>
									{currency}
								</span>
							</Typography>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.62rem",
									display: "block",
									mt: 0.2,
								}}
							>
								{sim.netWeekly >= 0 ? "+" : ""}
								{formatAmount(sim.netWeekly)}/wk margin
							</Typography>
						</Paper>

						{/* Stat 4: Breakeven Rate */}
						<Paper
							elevation={0}
							sx={{
								p: 0.9,
								px: 1.1,
								borderRadius: 1,
								bgcolor: alpha(theme.palette.background.paper, 0.45),
								border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
							}}
						>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontWeight: 800,
									fontSize: "0.58rem",
									display: "block",
									textTransform: "uppercase",
									letterSpacing: "0.5px",
								}}
							>
								Breakeven Rate
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 900,
									color:
										sim.totalRate >= sim.breakevenTotalRate
											? "primary.main"
											: "#f87171",
									fontSize: "0.88rem",
									lineHeight: 1.2,
									mt: 0.2,
								}}
							>
								{sim.breakevenTotalRate}%{" "}
								<span style={{ fontSize: "0.65rem", fontWeight: 700 }}>
									total
								</span>
							</Typography>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.62rem",
									display: "block",
									mt: 0.2,
								}}
							>
								Min{" "}
								{sim.breakevenWeeklyRate > 0 && sim.breakevenWeeklyRate < 0.01
									? sim.breakevenWeeklyRate
									: Number(sim.breakevenWeeklyRate.toFixed(2))}
								%/wk needed
							</Typography>
						</Paper>
					</Box>
				</Paper>
			</Paper>
		</Box>
	);
};
