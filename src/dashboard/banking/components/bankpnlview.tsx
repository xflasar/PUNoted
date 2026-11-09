import React, { useState, useMemo } from "react";
import {
	Box,
	Paper,
	Typography,
	Chip,
	TextField,
	InputAdornment,
	useTheme,
	ToggleButton,
	ToggleButtonGroup,
	Button,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
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

	// Bank's official configured interest rates
	const bankMinRate = bank.default_interest_rate ?? 1.5;
	const bankMaxRate =
		bank.max_interest_rate ?? (bankMinRate > 2.5 ? bankMinRate : 3.0);

	// Interactive Simulator State
	const [simLoanAmount, setSimLoanAmount] = useState<number | "">(10000000);
	const [simWeeks, setSimWeeks] = useState<number | "">(5);
	const [simRate, setSimRate] = useState<number | "">(bankMinRate);
	const [rateMode, setRateMode] = useState<"WEEKLY" | "TOTAL">("WEEKLY");
	const [fundingMode, setFundingMode] = useState<"VAULT_MIX" | "FULL_CLIENT">(
		"VAULT_MIX",
	);
	const [loanType, setLoanType] = useState<"ALL" | "INTEREST" | "STABLE">(
		"ALL",
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
	}, [loans, metrics, bank.owner_username]);

	// Bank-Level Overall Stats
	const stats = useMemo(() => {
		const loanItems = loans.filter(
			(l) => (l.transaction_type || "LOAN") === "LOAN",
		);
		const repaidLoans = loanItems.filter((l) => l.status === "REPAID");
		const activeLoans = loanItems.filter((l) => l.status === "APPROVED");

		const collectedInterest = repaidLoans.reduce((sum, l) => {
			const r = l.interest_rate ?? bank.default_interest_rate ?? 1.5;
			return sum + (l.amount || 0) * (r / 100.0);
		}, 0);

		const pendingInterest = activeLoans.reduce((sum, l) => {
			const r = l.interest_rate ?? bank.default_interest_rate ?? 1.5;
			return sum + (l.amount || 0) * (r / 100.0);
		}, 0);

		const weeklyInterestRunRate = activeLoans.reduce((sum, l) => {
			const r = l.interest_rate ?? bank.default_interest_rate ?? 1.5;
			const termDays = l.term_days || 14;
			const weeks = Math.max(1, termDays / 7);
			return sum + ((l.amount || 0) * (r / 100.0)) / weeks;
		}, 0);

		const yieldTransactions = loans.filter(
			(l) => l.transaction_type === "YIELD" && l.status !== "REJECTED",
		);
		const historicalYieldPaid = yieldTransactions.reduce(
			(sum, l) => sum + (l.amount || 0),
			0,
		);

		const netWeeklySpread = weeklyInterestRunRate - weeklyClientYieldCost;

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

	// Interactive Simulator Calculation with Dual-Loan Mechanics
	const sim = useMemo(() => {
		const amt = Number(simLoanAmount) || 0;
		const w = Number(simWeeks) || 1;
		const rawRate = Number(simRate) || 0;

		const totalRate = rateMode === "TOTAL" ? rawRate : rawRate * w;
		const weeklyRate = rateMode === "TOTAL" ? rawRate / w : rawRate;

		// Funding allocation
		const clientFundedAmt =
			fundingMode === "VAULT_MIX"
				? Math.min(amt, Math.max(0, actualClientDeposits))
				: amt;
		const ownerFundedAmt = Math.max(0, amt - clientFundedAmt);

		// Client yield cost
		const weeklyCost = clientFundedAmt * (weeklyYieldRate / 100.0);
		const interestClientCost = weeklyCost * w;

		// 1. Interest Loan (Principal stays deployed the entire term, interest fee paid periodically, balloon principal at end)
		const interestGrossInterest = amt * (totalRate / 100.0);
		const interestWeeklyInterest = w > 0 ? interestGrossInterest / w : 0;
		const interestNetWeekly = interestWeeklyInterest - weeklyCost;
		const interestNetProfit = interestGrossInterest - interestClientCost;

		// 2. Stable Loan (Principal repaid in equal installments over the w intervals; average client capital deployed is ~half)
		const stableAmortFactor = w > 0 ? (w + 1) / (2 * w) : 1;
		const stableClientCost = interestClientCost * stableAmortFactor;
		const stableGrossInterest = amt * (totalRate / 100.0);
		const stableNetProfit = stableGrossInterest - stableClientCost;
		const stableWeeklyProfit = w > 0 ? stableNetProfit / w : 0;

		// Installment payments from borrower
		const interestBorrowerPayment = interestWeeklyInterest;
		const stableBorrowerPayment = w > 0 ? (amt + stableGrossInterest) / w : amt;

		// Real cost-recovery breakeven rate (based on actual client yield cost in current funding mode)
		const interestBreakevenTotalRate =
			amt > 0 ? Number(((interestClientCost / amt) * 100).toFixed(2)) : 0;
		const interestBreakevenWeeklyRate =
			w > 0 ? Number((interestBreakevenTotalRate / w).toFixed(3)) : 0;

		const stableBreakevenTotalRate =
			amt > 0 ? Number(((stableClientCost / amt) * 100).toFixed(2)) : 0;
		const stableBreakevenWeeklyRate =
			w > 0 ? Number((stableBreakevenTotalRate / w).toFixed(3)) : 0;

		// Safe yield floor rate: at least covers the bank's client deposit yield (e.g. 2%/wk) so loans remain safe even as deposits grow
		const safeYieldFloorWeeklyRate = weeklyYieldRate;
		const safeYieldFloorTotalRate = Number(
			(safeYieldFloorWeeklyRate * w).toFixed(2),
		);

		// Strategy 1: Competitive / Min Rate (Bank Default, e.g. 1.5%/wk)
		const competitiveWeeklyRate = Number(bankMinRate.toFixed(2));
		const competitiveTotalRate = Number((competitiveWeeklyRate * w).toFixed(2));

		// Strategy 2: Balanced / Spread Rate (Covers full yield cost + healthy margin, e.g. yield + 0.5% or 2.5%/wk)
		const balancedWeeklyRate = Number(
			Math.max(competitiveWeeklyRate, weeklyYieldRate + 0.5).toFixed(2),
		);
		const balancedTotalRate = Number((balancedWeeklyRate * w).toFixed(2));

		// Strategy 3: Max Profit Rate (Bank Max, e.g. 3.0%/wk)
		const maxProfitWeeklyRate = Number(
			Math.max(bankMaxRate, balancedWeeklyRate).toFixed(2),
		);
		const maxProfitTotalRate = Number((maxProfitWeeklyRate * w).toFixed(2));

		const activeBreakevenTotalRate =
			loanType === "STABLE"
				? stableBreakevenTotalRate
				: interestBreakevenTotalRate;
		const activeBreakevenWeeklyRate =
			loanType === "STABLE"
				? stableBreakevenWeeklyRate
				: interestBreakevenWeeklyRate;

		const activeNetProfit =
			loanType === "STABLE" ? stableNetProfit : interestNetProfit;
		const activeWeeklyMargin =
			loanType === "STABLE" ? stableWeeklyProfit : interestNetWeekly;

		const isProfitable = activeNetProfit > 0.01;
		const isBreakeven = Math.abs(activeNetProfit) <= 0.01;

		return {
			amt,
			w,
			rawRate,
			weeklyRate,
			totalRate,
			clientFundedAmt,
			ownerFundedAmt,
			weeklyCost,
			interestClientCost,
			interestGrossInterest,
			interestWeeklyInterest,
			interestNetWeekly,
			interestNetProfit,
			interestBorrowerPayment,
			interestBreakevenTotalRate,
			interestBreakevenWeeklyRate,
			stableClientCost,
			stableGrossInterest,
			stableNetProfit,
			stableWeeklyProfit,
			stableBorrowerPayment,
			stableBreakevenTotalRate,
			stableBreakevenWeeklyRate,
			safeYieldFloorWeeklyRate,
			safeYieldFloorTotalRate,
			competitiveWeeklyRate,
			competitiveTotalRate,
			balancedWeeklyRate,
			balancedTotalRate,
			maxProfitWeeklyRate,
			maxProfitTotalRate,
			activeBreakevenTotalRate,
			activeBreakevenWeeklyRate,
			activeNetProfit,
			activeWeeklyMargin,
			isProfitable,
			isBreakeven,
		};
	}, [
		simLoanAmount,
		simWeeks,
		simRate,
		rateMode,
		fundingMode,
		loanType,
		actualClientDeposits,
		weeklyYieldRate,
		bankMinRate,
		bankMaxRate,
	]);

	const applyRate = (rate: number, isWeekly: boolean) => {
		if (rateMode === "WEEKLY") {
			setSimRate(isWeekly ? rate : Number((rate / (sim.w || 1)).toFixed(2)));
		} else {
			setSimRate(isWeekly ? Number((rate * (sim.w || 1)).toFixed(2)) : rate);
		}
	};

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: 1.5,
				p: { xs: 1, sm: 2 },
			}}
		>
			{/* Top Summary Banner: Net Spread & Capacity in single wide row */}
			<Paper
				elevation={0}
				sx={{
					p: 1.5,
					borderRadius: 2,
					bgcolor:
						stats.netWeeklySpread >= 0
							? alpha("#10b981", 0.06)
							: alpha("#ef4444", 0.06),
					border: `1px solid ${
						stats.netWeeklySpread >= 0
							? alpha("#10b981", 0.25)
							: alpha("#ef4444", 0.25)
					}`,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 1.5,
					width: "100%",
				}}
			>
				{/* Net Spread */}
				<Box
					sx={{
						display: "flex",
						alignItems: "baseline",
						gap: 1,
						flexWrap: "wrap",
					}}
				>
					<Typography
						variant="caption"
						sx={{
							fontWeight: 800,
							fontSize: "0.72rem",
							color: "text.secondary",
							textTransform: "uppercase",
							letterSpacing: 0.3,
						}}
					>
						Weekly Net Margin:
					</Typography>
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 900,
							color: stats.netWeeklySpread >= 0 ? "#34d399" : "#f87171",
							lineHeight: 1.1,
						}}
					>
						{stats.netWeeklySpread >= 0 ? "+" : ""}
						{formatAmount(stats.netWeeklySpread)} {currency}/wk
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", fontSize: "0.7rem" }}
					>
						({formatAmount(stats.weeklyInterestRunRate)} revenue −{" "}
						{formatAmount(weeklyClientYieldCost)} yield cost)
					</Typography>
				</Box>

				{/* Vault Capacity & Utilization */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1.5,
						flexWrap: "wrap",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "baseline", gap: 0.6 }}>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontWeight: 700,
								fontSize: "0.7rem",
							}}
						>
							UTILIZATION:
						</Typography>
						<Typography
							variant="body2"
							sx={{ fontWeight: 800, fontSize: "0.82rem" }}
						>
							{stats.utilizationPercent}%{" "}
							<span
								style={{
									fontSize: "0.68rem",
									color: theme.palette.text.secondary,
								}}
							>
								({formatAmount(stats.activeCapitalOut)} /{" "}
								{formatAmount(stats.totalPool)} {currency})
							</span>
						</Typography>
					</Box>

					<Chip
						label={
							stats.isAtOrOverCapacity
								? "DEPOSITS AT CAP"
								: `+${formatAmount(stats.remainingDepositCapacity)} ${currency} DEPOSIT CAPACITY`
						}
						size="small"
						sx={{
							fontWeight: 800,
							fontSize: "0.66rem",
							height: 22,
							bgcolor: stats.isAtOrOverCapacity
								? alpha("#ef4444", 0.15)
								: alpha("#10b981", 0.15),
							color: stats.isAtOrOverCapacity ? "#f87171" : "#34d399",
							border: `1px solid ${
								stats.isAtOrOverCapacity
									? alpha("#ef4444", 0.3)
									: alpha("#10b981", 0.3)
							}`,
						}}
					/>
				</Box>
			</Paper>

			{/* 4 Key Financial Metrics (Full Width) */}
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: {
						xs: "repeat(2, 1fr)",
						md: "repeat(4, 1fr)",
					},
					gap: 1.25,
					width: "100%",
				}}
			>
				{/* 1. Collected Revenue */}
				<Paper
					variant="outlined"
					sx={{
						p: 1.2,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.paper, 0.4),
						borderColor: alpha(theme.palette.divider, 0.1),
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 800,
							fontSize: "0.62rem",
							textTransform: "uppercase",
						}}
					>
						Repaid Loan Revenue
					</Typography>
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 900,
							color: theme.palette.success.main,
							lineHeight: 1.15,
							mt: 0.3,
						}}
					>
						+{formatAmount(stats.collectedInterest)} {currency}
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontSize: "0.65rem",
							display: "block",
						}}
					>
						{stats.repaidLoansCount} fulfilled loans
					</Typography>
				</Paper>

				{/* 2. Pending Active Interest */}
				<Paper
					variant="outlined"
					sx={{
						p: 1.2,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.paper, 0.4),
						borderColor: alpha(theme.palette.divider, 0.1),
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 800,
							fontSize: "0.62rem",
							textTransform: "uppercase",
						}}
					>
						Pending Active Interest
					</Typography>
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 900,
							color: "primary.main",
							lineHeight: 1.15,
							mt: 0.3,
						}}
					>
						+{formatAmount(stats.pendingInterest)} {currency}
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontSize: "0.65rem",
							display: "block",
						}}
					>
						{stats.activeLoansCount} active loans
					</Typography>
				</Paper>

				{/* 3. Depositor Yield Cost */}
				<Paper
					variant="outlined"
					sx={{
						p: 1.2,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.paper, 0.4),
						borderColor: alpha(theme.palette.divider, 0.1),
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 800,
							fontSize: "0.62rem",
							textTransform: "uppercase",
						}}
					>
						Weekly Depositor Cost
					</Typography>
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 900,
							color: "warning.main",
							lineHeight: 1.15,
							mt: 0.3,
						}}
					>
						-{formatAmount(weeklyClientYieldCost)} {currency}
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontSize: "0.65rem",
							display: "block",
						}}
					>
						At {weeklyYieldRate}%/wk yield
					</Typography>
				</Paper>

				{/* 4. Idle Unlent Reserves */}
				<Paper
					variant="outlined"
					sx={{
						p: 1.2,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.paper, 0.4),
						borderColor: alpha(theme.palette.divider, 0.1),
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 800,
							fontSize: "0.62rem",
							textTransform: "uppercase",
						}}
					>
						Idle Vault Reserves
					</Typography>
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 900,
							color: "text.primary",
							lineHeight: 1.15,
							mt: 0.3,
						}}
					>
						{formatAmount(stats.idleCapital)} {currency}
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontSize: "0.65rem",
							display: "block",
						}}
					>
						Available to deploy
					</Typography>
				</Paper>
			</Box>

			{/* Interactive Loan Profitability & Breakeven Simulator */}
			<Paper
				elevation={0}
				sx={{
					p: 1.75,
					borderRadius: 2,
					bgcolor: alpha(theme.palette.background.paper, 0.5),
					backdropFilter: "blur(12px)",
					border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
					display: "flex",
					flexDirection: "column",
					gap: 1.5,
					width: "100%",
				}}
			>
				{/* Top Bar: Title + Funding Mode + Loan Structure Selector */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
						gap: 1.2,
						width: "100%",
					}}
				>
					<Box>
						<Typography
							variant="subtitle2"
							sx={{
								fontWeight: 800,
								fontSize: "0.88rem",
								letterSpacing: 0.3,
								textTransform: "uppercase",
								color: "text.primary",
							}}
						>
							Loan Profitability &amp; Breakeven Simulator
						</Typography>
						<Typography
							variant="caption"
							sx={{ color: "text.secondary", fontSize: "0.7rem" }}
						>
							Calculate banker net profit, yield costs, and optimal loan
							pricing.
						</Typography>
					</Box>

					{/* Selectors Right */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							flexWrap: "wrap",
						}}
					>
						{/* Loan Type Selector */}
						<ToggleButtonGroup
							size="small"
							exclusive
							value={loanType}
							onChange={(_, val) => val && setLoanType(val)}
							sx={{ height: 26 }}
						>
							<ToggleButton
								value="ALL"
								sx={{ px: 1, fontSize: "0.66rem", fontWeight: 800, py: 0 }}
							>
								Show Both
							</ToggleButton>
							<ToggleButton
								value="INTEREST"
								sx={{ px: 1, fontSize: "0.66rem", fontWeight: 800, py: 0 }}
							>
								Interest Loan
							</ToggleButton>
							<ToggleButton
								value="STABLE"
								sx={{ px: 1, fontSize: "0.66rem", fontWeight: 800, py: 0 }}
							>
								Stable Loan
							</ToggleButton>
						</ToggleButtonGroup>

						{/* Funding Mode */}
						<ToggleButtonGroup
							size="small"
							exclusive
							value={fundingMode}
							onChange={(_, newMode) => newMode && setFundingMode(newMode)}
							sx={{ height: 26 }}
						>
							<ToggleButton
								value="VAULT_MIX"
								sx={{ px: 0.9, fontSize: "0.65rem", fontWeight: 800, py: 0 }}
							>
								Vault Mix
							</ToggleButton>
							<ToggleButton
								value="FULL_CLIENT"
								sx={{ px: 0.9, fontSize: "0.65rem", fontWeight: 800, py: 0 }}
							>
								100% Client
							</ToggleButton>
						</ToggleButtonGroup>
					</Box>
				</Box>

				{/* Inputs Row across full width */}
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: {
							xs: "1fr",
							sm: "1fr 1fr",
							md: "1.4fr 0.9fr 1.3fr",
						},
						gap: 1.25,
						alignItems: "flex-start",
						width: "100%",
					}}
				>
					{/* 1. Loan Principal */}
					<FormattedNumberInput
						label="Loan Principal"
						size="small"
						value={simLoanAmount}
						onChange={(val) => setSimLoanAmount(val)}
						unit={currency}
					/>

					{/* 2. Duration Weeks */}
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
								endAdornment: <InputAdornment position="end">W</InputAdornment>,
								sx: { fontSize: "0.78rem", height: 38 },
							},
						}}
					/>

					{/* 3. Interest Rate & Mode */}
					<Box sx={{ display: "flex", gap: 0.6, alignItems: "flex-start" }}>
						<TextField
							label={
								rateMode === "TOTAL"
									? "Loan Interest (% total)"
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
									? `${sim.weeklyRate.toFixed(3)}%/wk equiv`
									: `Total: ${sim.totalRate.toFixed(2)}% over ${sim.w}w`
							}
							slotProps={{
								input: {
									endAdornment: (
										<InputAdornment position="end">%</InputAdornment>
									),
									sx: { fontSize: "0.78rem", height: 38 },
								},
							}}
							sx={{
								flex: 1,
								"& .MuiFormHelperText-root": { fontSize: "0.62rem", mt: 0.2 },
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
							sx={{ height: 38 }}
						>
							<ToggleButton
								value="TOTAL"
								sx={{ px: 0.9, fontSize: "0.66rem", fontWeight: 800 }}
							>
								Total
							</ToggleButton>
							<ToggleButton
								value="WEEKLY"
								sx={{ px: 0.9, fontSize: "0.66rem", fontWeight: 800 }}
							>
								/wk
							</ToggleButton>
						</ToggleButtonGroup>
					</Box>
				</Box>

				{/* Strategy Presets Recommender */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						flexWrap: "wrap",
						gap: 1,
						p: 1,
						px: 1.25,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.default, 0.4),
						border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
						width: "100%",
					}}
				>
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
							sx={{
								color: "text.secondary",
								fontWeight: 800,
								fontSize: "0.7rem",
								letterSpacing: 0.2,
							}}
						>
							STRATEGY:
						</Typography>

						{/* 1. Competitive / Minimum Rate */}
						<Button
							size="small"
							variant="outlined"
							onClick={() => applyRate(sim.competitiveWeeklyRate, true)}
							sx={{
								height: 24,
								fontSize: "0.68rem",
								fontWeight: 700,
								textTransform: "none",
								py: 0,
								px: 1,
								borderColor: alpha(theme.palette.divider, 0.3),
							}}
						>
							Competitive (
							{rateMode === "WEEKLY"
								? `${sim.competitiveWeeklyRate}%/wk`
								: `${sim.competitiveTotalRate}%`}
							)
						</Button>

						{/* 2. Target Spread (Covers full yield cost + profit spread) */}
						<Button
							size="small"
							variant="contained"
							color="primary"
							onClick={() => applyRate(sim.balancedWeeklyRate, true)}
							sx={{
								height: 24,
								fontSize: "0.68rem",
								fontWeight: 800,
								textTransform: "none",
								py: 0,
								px: 1.2,
							}}
						>
							Target Spread (
							{rateMode === "WEEKLY"
								? `${sim.balancedWeeklyRate}%/wk`
								: `${sim.balancedTotalRate}%`}
							)
						</Button>

						{/* 3. Max Profit Rate */}
						<Button
							size="small"
							variant="outlined"
							color="success"
							onClick={() => applyRate(sim.maxProfitWeeklyRate, true)}
							sx={{
								height: 24,
								fontSize: "0.68rem",
								fontWeight: 800,
								textTransform: "none",
								py: 0,
								px: 1.2,
								borderColor: alpha(theme.palette.success.main, 0.4),
								color: theme.palette.success.main,
								"&:hover": {
									borderColor: theme.palette.success.main,
									bgcolor: alpha(theme.palette.success.main, 0.08),
								},
							}}
						>
							Max Profit (
							{rateMode === "WEEKLY"
								? `${sim.maxProfitWeeklyRate}%/wk`
								: `${sim.maxProfitTotalRate}%`}
							)
						</Button>

						{/* 4. Breakeven Floor */}
						<Button
							size="small"
							variant="text"
							onClick={() => applyRate(sim.activeBreakevenWeeklyRate, true)}
							sx={{
								height: 24,
								fontSize: "0.66rem",
								fontWeight: 700,
								textTransform: "none",
								py: 0,
								px: 0.8,
								color: "text.secondary",
							}}
						>
							Cost Floor (
							{rateMode === "WEEKLY"
								? `${sim.activeBreakevenWeeklyRate}%/wk`
								: `${sim.activeBreakevenTotalRate}%`}
							)
						</Button>
					</Box>

					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontSize: "0.68rem",
							fontStyle: "italic",
						}}
					>
						Yield cost: {weeklyYieldRate}%/wk on{" "}
						{fundingMode === "VAULT_MIX"
							? `${formatAmount(sim.clientFundedAmt)} client deposits (rest is 0% owner equity)`
							: "100% client deposits"}
					</Typography>
				</Box>

				{/* Simulation Outcome Details (Side-by-Side or Selected Loan View) */}
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns:
							loanType === "ALL" ? { xs: "1fr", md: "1fr 1fr" } : "1fr",
						gap: 1.25,
						width: "100%",
					}}
				>
					{/* Interest Loan Card */}
					{(loanType === "ALL" || loanType === "INTEREST") && (
						<Paper
							variant="outlined"
							sx={{
								p: 1.25,
								borderRadius: 1.5,
								bgcolor:
									sim.interestNetProfit > 0.01
										? alpha("#10b981", 0.06)
										: Math.abs(sim.interestNetProfit) <= 0.01
											? alpha("#f59e0b", 0.06)
											: alpha("#ef4444", 0.06),
								borderColor:
									sim.interestNetProfit > 0.01
										? alpha("#10b981", 0.3)
										: Math.abs(sim.interestNetProfit) <= 0.01
											? alpha("#f59e0b", 0.3)
											: alpha("#ef4444", 0.3),
								display: "flex",
								flexDirection: "column",
								gap: 1,
							}}
						>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
									<Typography
										variant="subtitle2"
										sx={{ fontWeight: 800, fontSize: "0.82rem" }}
									>
										Interest-Only Loan
									</Typography>
									<Chip
										label={
											sim.interestNetProfit > 0.01
												? "PROFITABLE"
												: Math.abs(sim.interestNetProfit) <= 0.01
													? "BREAKEVEN"
													: "LOSS"
										}
										size="small"
										sx={{
											height: 18,
											fontSize: "0.6rem",
											fontWeight: 800,
											bgcolor:
												sim.interestNetProfit > 0.01
													? alpha("#10b981", 0.2)
													: Math.abs(sim.interestNetProfit) <= 0.01
														? alpha("#f59e0b", 0.2)
														: alpha("#ef4444", 0.2),
											color:
												sim.interestNetProfit > 0.01
													? "#34d399"
													: Math.abs(sim.interestNetProfit) <= 0.01
														? "#fbbf24"
														: "#f87171",
										}}
									/>
								</Box>
								<Typography
									variant="caption"
									sx={{ fontWeight: 700, color: "text.secondary" }}
								>
									Balloon: {formatAmount(sim.amt)} {currency}
								</Typography>
							</Box>

							{/* Numbers Grid */}
							<Box
								sx={{
									display: "grid",
									gridTemplateColumns: "repeat(3, 1fr)",
									gap: 0.8,
									bgcolor: alpha(theme.palette.background.default, 0.4),
									p: 0.8,
									borderRadius: 1,
								}}
							>
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontSize: "0.58rem",
											fontWeight: 700,
										}}
									>
										NET PROFIT
									</Typography>
									<Typography
										variant="body2"
										sx={{
											fontWeight: 900,
											fontSize: "0.82rem",
											color: sim.interestNetProfit >= 0 ? "#34d399" : "#f87171",
										}}
									>
										{sim.interestNetProfit >= 0 ? "+" : ""}
										{formatAmount(sim.interestNetProfit)}
									</Typography>
									<Typography
										variant="caption"
										sx={{ color: "text.secondary", fontSize: "0.58rem" }}
									>
										{sim.interestNetWeekly >= 0 ? "+" : ""}
										{formatAmount(sim.interestNetWeekly)}/wk
									</Typography>
								</Box>

								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontSize: "0.58rem",
											fontWeight: 700,
										}}
									>
										BORROWER PAYS
									</Typography>
									<Typography
										variant="body2"
										sx={{ fontWeight: 800, fontSize: "0.82rem" }}
									>
										~{formatAmount(sim.interestBorrowerPayment)}/wk
									</Typography>
									<Typography
										variant="caption"
										sx={{ color: "text.secondary", fontSize: "0.58rem" }}
									>
										+{formatAmount(sim.interestGrossInterest)} fee
									</Typography>
								</Box>

								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontSize: "0.58rem",
											fontWeight: 700,
										}}
									>
										BREAKEVEN
									</Typography>
									<Typography
										variant="body2"
										sx={{
											fontWeight: 800,
											fontSize: "0.82rem",
											color:
												sim.totalRate >= sim.interestBreakevenTotalRate
													? "primary.main"
													: "#f87171",
										}}
									>
										{sim.interestBreakevenWeeklyRate}%/wk
									</Typography>
									<Typography
										variant="caption"
										sx={{ color: "text.secondary", fontSize: "0.58rem" }}
									>
										Yield floor: {sim.safeYieldFloorWeeklyRate}%/wk
									</Typography>
								</Box>
							</Box>
						</Paper>
					)}

					{/* Stable Loan Card */}
					{(loanType === "ALL" || loanType === "STABLE") && (
						<Paper
							variant="outlined"
							sx={{
								p: 1.25,
								borderRadius: 1.5,
								bgcolor:
									sim.stableNetProfit > 0.01
										? alpha("#10b981", 0.06)
										: Math.abs(sim.stableNetProfit) <= 0.01
											? alpha("#f59e0b", 0.06)
											: alpha("#ef4444", 0.06),
								borderColor:
									sim.stableNetProfit > 0.01
										? alpha("#10b981", 0.3)
										: Math.abs(sim.stableNetProfit) <= 0.01
											? alpha("#f59e0b", 0.3)
											: alpha("#ef4444", 0.3),
								display: "flex",
								flexDirection: "column",
								gap: 1,
							}}
						>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
									<Typography
										variant="subtitle2"
										sx={{ fontWeight: 800, fontSize: "0.82rem" }}
									>
										Stable Loan (Amortized)
									</Typography>
									<Chip
										label={
											sim.stableNetProfit > 0.01
												? "PROFITABLE"
												: Math.abs(sim.stableNetProfit) <= 0.01
													? "BREAKEVEN"
													: "LOSS"
										}
										size="small"
										sx={{
											height: 18,
											fontSize: "0.6rem",
											fontWeight: 800,
											bgcolor:
												sim.stableNetProfit > 0.01
													? alpha("#10b981", 0.2)
													: Math.abs(sim.stableNetProfit) <= 0.01
														? alpha("#f59e0b", 0.2)
														: alpha("#ef4444", 0.2),
											color:
												sim.stableNetProfit > 0.01
													? "#34d399"
													: Math.abs(sim.stableNetProfit) <= 0.01
														? "#fbbf24"
														: "#f87171",
										}}
									/>
								</Box>
								<Typography
									variant="caption"
									sx={{ fontWeight: 700, color: "text.secondary" }}
								>
									Equal installments ({sim.w}x)
								</Typography>
							</Box>

							{/* Numbers Grid */}
							<Box
								sx={{
									display: "grid",
									gridTemplateColumns: "repeat(3, 1fr)",
									gap: 0.8,
									bgcolor: alpha(theme.palette.background.default, 0.4),
									p: 0.8,
									borderRadius: 1,
								}}
							>
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontSize: "0.58rem",
											fontWeight: 700,
										}}
									>
										NET PROFIT
									</Typography>
									<Typography
										variant="body2"
										sx={{
											fontWeight: 900,
											fontSize: "0.82rem",
											color: sim.stableNetProfit >= 0 ? "#34d399" : "#f87171",
										}}
									>
										{sim.stableNetProfit >= 0 ? "+" : ""}
										{formatAmount(sim.stableNetProfit)}
									</Typography>
									<Typography
										variant="caption"
										sx={{ color: "text.secondary", fontSize: "0.58rem" }}
									>
										{sim.stableWeeklyProfit >= 0 ? "+" : ""}
										{formatAmount(sim.stableWeeklyProfit)}/wk
									</Typography>
								</Box>

								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontSize: "0.58rem",
											fontWeight: 700,
										}}
									>
										BORROWER PAYS
									</Typography>
									<Typography
										variant="body2"
										sx={{ fontWeight: 800, fontSize: "0.82rem" }}
									>
										~{formatAmount(sim.stableBorrowerPayment)}/wk
									</Typography>
									<Typography
										variant="caption"
										sx={{ color: "text.secondary", fontSize: "0.58rem" }}
									>
										Principal + fee
									</Typography>
								</Box>

								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontSize: "0.58rem",
											fontWeight: 700,
										}}
									>
										BREAKEVEN
									</Typography>
									<Typography
										variant="body2"
										sx={{
											fontWeight: 800,
											fontSize: "0.82rem",
											color:
												sim.totalRate >= sim.stableBreakevenTotalRate
													? "primary.main"
													: "#f87171",
										}}
									>
										{sim.stableBreakevenWeeklyRate}%/wk
									</Typography>
									<Typography
										variant="caption"
										sx={{ color: "text.secondary", fontSize: "0.58rem" }}
									>
										Yield floor: {sim.safeYieldFloorWeeklyRate}%/wk
									</Typography>
								</Box>
							</Box>
						</Paper>
					)}
				</Box>
			</Paper>
		</Box>
	);
};
