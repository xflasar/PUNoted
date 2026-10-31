import React from "react";
import {
	Paper,
	Box,
	Typography,
	Button,
	Chip,
	useTheme,
	FormControlLabel,
	Switch,
	TextField,
	InputAdornment,
	Tooltip,
	Collapse,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CalculateIcon from "@mui/icons-material/Calculate";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ClearIcon from "@mui/icons-material/Clear";
import SpeedIcon from "@mui/icons-material/Speed";

import { FormattedNumberInput } from "../../../dashboard/banking/components/formattednumberinput";
import { LoanFinderGuide } from "../../../dashboard/banking/components/loanfinderguide";
import type { OverallLoanSummary } from "../../../dashboard/banking/helpers";
import { formatAmount } from "../../../dashboard/banking/helpers";
import { HelpOutlineOutlined } from "@mui/icons-material";

interface PublicLoanFinderProps {
	loanAmount: number | "";
	dailyProfit: number | "";
	termWeeks?: number | "";
	intervalDays?: number;
	maxAllocationPercent: number;
	onlyShowMatches: boolean;
	summary: OverallLoanSummary | null;
	onLoanAmountChange: (val: number | "") => void;
	onDailyProfitChange: (val: number | "") => void;
	onTermWeeksChange?: (val: number | "") => void;
	onIntervalDaysChange?: (val: number) => void;
	onAllocationChange: (pct: number) => void;
	onToggleOnlyMatches: (val: boolean) => void;
	onReset: () => void;
}

export const PublicLoanFinder: React.FC<PublicLoanFinderProps> = ({
	loanAmount,
	dailyProfit,
	termWeeks = "",
	intervalDays = 7,
	maxAllocationPercent,
	onlyShowMatches,
	summary,
	onLoanAmountChange,
	onDailyProfitChange,
	onTermWeeksChange,
	onIntervalDaysChange,
	onAllocationChange,
	onToggleOnlyMatches,
	onReset,
}) => {
	const theme = useTheme();
	const [showGuide, setShowGuide] = React.useState(false);
	const [inputPct, setInputPct] = React.useState<string>(
		String(maxAllocationPercent),
	);

	React.useEffect(() => {
		setInputPct(String(maxAllocationPercent));
	}, [maxAllocationPercent]);

	const handlePctChange = (valStr: string) => {
		setInputPct(valStr);
		const num = parseInt(valStr, 10);
		if (!isNaN(num)) {
			const clamped = Math.max(1, Math.min(100, num));
			onAllocationChange(clamped);
		}
	};

	const handlePctBlur = () => {
		const num = parseInt(inputPct, 10);
		if (isNaN(num) || num < 1) {
			onAllocationChange(50);
			setInputPct("50");
		} else if (num > 100) {
			onAllocationChange(100);
			setInputPct("100");
		} else {
			setInputPct(String(num));
		}
	};

	const hasActiveSearch = loanAmount !== "" || dailyProfit !== "";

	return (
		<Paper
			elevation={0}
			sx={{
				p: 1.5,
				borderRadius: 2,
				bgcolor: alpha(theme.palette.background.paper, 0.45),
				backdropFilter: "blur(14px)",
				border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
				boxShadow: `0 4px 16px -2px ${alpha(theme.palette.primary.main, 0.06)}`,
				display: "flex",
				flexDirection: "column",
				gap: 1.25,
			}}
		>
			{/* Top Bar: Clean Header + Repay Budget + Matches Toggle + Reset */}
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
					<Typography
						variant="subtitle2"
						sx={{ fontWeight: 800, fontSize: "0.85rem", letterSpacing: 0.3 }}
					>
						Loan Finder &amp; Feasibility Calculator
					</Typography>
					<Button
						size="small"
						variant="outlined"
						startIcon={
							<HelpOutlineOutlined sx={{ fontSize: "14px !important" }} />
						}
						onClick={() => setShowGuide(!showGuide)}
						sx={{
							height: 22,
							fontSize: "0.68rem",
							fontWeight: 700,
							borderRadius: 1.5,
							textTransform: "none",
							py: 0,
							px: 1,
							borderColor: showGuide
								? "primary.main"
								: alpha(theme.palette.divider, 0.25),
							bgcolor: showGuide
								? alpha(theme.palette.primary.main, 0.12)
								: "transparent",
							color: showGuide ? "primary.main" : "text.secondary",
							"&:hover": {
								borderColor: "primary.main",
								bgcolor: alpha(theme.palette.primary.main, 0.08),
								color: "primary.main",
							},
						}}
					>
						{showGuide ? "Hide Guide" : "How It Works"}
					</Button>
				</Box>

				{/* Allocation Budget Chips + Manual Input, Matches Switch & Reset */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1.2,
						flexWrap: "wrap",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontWeight: 700,
								fontSize: "0.7rem",
								whiteSpace: "nowrap",
							}}
						>
							Repay Budget:
						</Typography>
						{[25, 33, 50, 75].map((pct) => (
							<Chip
								key={pct}
								label={`${pct}%`}
								size="small"
								onClick={() => {
									onAllocationChange(pct);
									setInputPct(String(pct));
								}}
								color={maxAllocationPercent === pct ? "primary" : "default"}
								variant={maxAllocationPercent === pct ? "filled" : "outlined"}
								sx={{
									height: 22,
									fontSize: "0.65rem",
									fontWeight: 800,
									cursor: "pointer",
									px: 0.2,
								}}
							/>
						))}
						<Tooltip title="Manually enter % of daily profit allocated to repayment (1 - 100%)">
							<TextField
								size="small"
								type="number"
								value={inputPct}
								onChange={(e) => handlePctChange(e.target.value)}
								onBlur={handlePctBlur}
								placeholder="50"
								slotProps={{
									input: {
										endAdornment: (
											<InputAdornment position="end" sx={{ mr: -0.5 }}>
												<Typography
													variant="caption"
													sx={{
														fontSize: "0.68rem",
														fontWeight: 800,
														color: "text.secondary",
													}}
												>
													%
												</Typography>
											</InputAdornment>
										),
									},
									htmlInput: {
										min: 1,
										max: 100,
										step: 1,
										style: {
											width: 28,
											padding: "2px 2px",
											fontSize: "0.72rem",
											fontWeight: 800,
											textAlign: "center",
										},
									},
								}}
								sx={{
									width: 62,
									"& .MuiOutlinedInput-root": {
										height: 22,
										borderRadius: 1,
										bgcolor: alpha(theme.palette.background.default, 0.6),
										"& fieldset": {
											borderColor: alpha(theme.palette.primary.main, 0.3),
										},
										"&:hover fieldset": {
											borderColor: theme.palette.primary.main,
										},
										"&.Mui-focused fieldset": {
											borderColor: theme.palette.primary.main,
										},
									},
								}}
							/>
						</Tooltip>
					</Box>

					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={onlyShowMatches}
								onChange={(e) => onToggleOnlyMatches(e.target.checked)}
								color="primary"
								sx={{ mr: 0.5 }}
							/>
						}
						label={
							<Typography
								variant="caption"
								sx={{
									fontWeight: 700,
									userSelect: "none",
									fontSize: "0.72rem",
								}}
							>
								Only Matches
							</Typography>
						}
						sx={{ m: 0 }}
					/>

					{hasActiveSearch && (
						<Button
							size="small"
							variant="text"
							startIcon={<ClearIcon sx={{ fontSize: "14px !important" }} />}
							onClick={onReset}
							sx={{
								color: "text.secondary",
								textTransform: "none",
								fontSize: "0.72rem",
								py: 0,
								px: 0.8,
								minWidth: "auto",
							}}
						>
							Reset
						</Button>
					)}
				</Box>
			</Box>

			{/* Collapsible Explainer Guide */}
			<Collapse in={showGuide} unmountOnExit>
				<LoanFinderGuide onClose={() => setShowGuide(false)} />
			</Collapse>

			{/* 2-Column Inputs Grid (Wanted Money & Daily Profit) */}
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: {
						xs: "1fr",
						sm: "1fr 1fr",
					},
					gap: 1.5,
					alignItems: "center",
				}}
			>
				{/* 1. Desired Loan Amount */}
				<FormattedNumberInput
					label="Desired Loan Amount (Wanted Capital)"
					value={loanAmount}
					onChange={onLoanAmountChange}
					placeholder="e.g. 100,000"
					unit="ICA"
					icon={
						<AttachMoneyIcon sx={{ fontSize: 18, color: "primary.main" }} />
					}
				/>

				{/* 2. Company Daily Net Profit (Borrower Cash Flow) */}
				<FormattedNumberInput
					label="Company Daily Net Profit (Optional)"
					value={dailyProfit}
					onChange={onDailyProfitChange}
					placeholder="e.g. 5,000"
					unit="ICA/d"
					icon={<TrendingUpIcon sx={{ fontSize: 18, color: "#34d399" }} />}
				/>
			</Box>

			{/* Secondary Controls: Desired Length & Repayment Interval */}
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: { xs: "1fr", sm: "1.2fr 1fr" },
					gap: 1.2,
					alignItems: "center",
					pt: 0.5,
				}}
			>
				{/* Loan Duration (Weeks) */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						flexWrap: "wrap",
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 800,
							fontSize: "0.68rem",
						}}
					>
						LOAN LENGTH:
					</Typography>
					<Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
						{[
							{ label: "Auto", val: "" },
							{ label: "2 Wks", val: 2 },
							{ label: "4 Wks", val: 4 },
							{ label: "8 Wks", val: 8 },
						].map((item) => (
							<Chip
								key={item.label}
								label={item.label}
								size="small"
								onClick={() => onTermWeeksChange && onTermWeeksChange(item.val)}
								color={termWeeks === item.val ? "primary" : "default"}
								variant={termWeeks === item.val ? "filled" : "outlined"}
								sx={{
									height: 22,
									fontSize: "0.65rem",
									fontWeight: 800,
									cursor: "pointer",
								}}
							/>
						))}
						<TextField
							size="small"
							type="number"
							value={
								typeof termWeeks === "number" && ![2, 4, 8].includes(termWeeks)
									? termWeeks
									: ""
							}
							onChange={(e) => {
								const v =
									e.target.value === ""
										? ""
										: Math.max(1, Number(e.target.value));
								if (onTermWeeksChange) onTermWeeksChange(v);
							}}
							placeholder="Wks"
							slotProps={{
								htmlInput: {
									min: 1,
									max: 52,
									style: {
										width: 32,
										padding: "2px 4px",
										fontSize: "0.72rem",
										textAlign: "center",
										fontWeight: 800,
									},
								},
							}}
							sx={{
								width: 52,
								"& .MuiOutlinedInput-root": { height: 22, borderRadius: 1 },
							}}
						/>
					</Box>
				</Box>

				{/* Repayment Interval */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						justifyContent: { xs: "flex-start", sm: "flex-end" },
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 800,
							fontSize: "0.68rem",
						}}
					>
						PAYMENT INTERVAL:
					</Typography>
					<Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
						{[
							{ label: "Weekly (7d)", val: 7 },
							{ label: "Bi-Weekly (14d)", val: 14 },
						].map((item) => (
							<Chip
								key={item.label}
								label={item.label}
								size="small"
								onClick={() =>
									onIntervalDaysChange && onIntervalDaysChange(item.val)
								}
								color={(intervalDays || 7) === item.val ? "primary" : "default"}
								variant={
									(intervalDays || 7) === item.val ? "filled" : "outlined"
								}
								sx={{
									height: 22,
									fontSize: "0.65rem",
									fontWeight: 800,
									cursor: "pointer",
								}}
							/>
						))}
						<TextField
							size="small"
							type="number"
							value={
								typeof intervalDays === "number" &&
								![7, 14].includes(intervalDays)
									? intervalDays
									: ""
							}
							onChange={(e) => {
								const v =
									e.target.value === ""
										? 7
										: Math.max(1, Number(e.target.value));
								if (onIntervalDaysChange) onIntervalDaysChange(v);
							}}
							placeholder="Days"
							slotProps={{
								htmlInput: {
									min: 1,
									max: 365,
									style: {
										width: 34,
										padding: "2px 4px",
										fontSize: "0.72rem",
										textAlign: "center",
										fontWeight: 800,
									},
								},
							}}
							sx={{
								width: 56,
								"& .MuiOutlinedInput-root": { height: 22, borderRadius: 1 },
							}}
						/>
					</Box>
				</Box>
			</Box>

			{/* Overall Summary Strip: Borrower-Centric Fast Repayment & Retained Operations Budget */}
			{summary && (
				<Paper
					variant="outlined"
					sx={{
						py: 1,
						px: 1.5,
						borderRadius: 1.5,
						bgcolor: summary.isUserProfitMatch
							? alpha("#10b981", 0.08)
							: summary.optimalLengthWeeks > 26
								? alpha("#ef4444", 0.08)
								: alpha("#f59e0b", 0.08),
						borderColor: summary.isUserProfitMatch
							? alpha("#10b981", 0.3)
							: summary.optimalLengthWeeks > 26
								? alpha("#ef4444", 0.3)
								: alpha("#f59e0b", 0.3),
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
						gap: 1,
					}}
				>
					{/* Left: Optimal Plan Headline & Retained Budget Pill */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							flexWrap: "wrap",
						}}
					>
						{summary.isUserProfitMatch ? (
							<CheckCircleIcon sx={{ color: "#34d399", fontSize: 18 }} />
						) : (
							<WarningAmberIcon sx={{ color: "#fbbf24", fontSize: 18 }} />
						)}
						{dailyProfit !== "" && Number(dailyProfit) > 0 ? (
							<>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontWeight: 700,
										fontSize: "0.72rem",
									}}
								>
									OPTIMAL PLAN:
								</Typography>
								<Typography
									variant="subtitle2"
									sx={{
										fontWeight: 800,
										fontSize: "0.84rem",
										color: summary.isUserProfitMatch ? "#34d399" : "#fbbf24",
									}}
								>
									{summary.optimalLengthWeeks}W Payoff
									<span
										style={{
											fontSize: "0.7rem",
											opacity: 0.8,
											fontWeight: 600,
											marginLeft: 4,
										}}
									>
										({summary.optimalPayoffDays}d @ {summary.allocationPercent}%
										budget)
									</span>
								</Typography>

								<Chip
									label={`Keeps ~${formatAmount(summary.retainedDailyProfit)} ICA/d (${summary.retainedPercent}%) for rest`}
									size="small"
									sx={{
										height: 19,
										fontSize: "0.62rem",
										fontWeight: 800,
										bgcolor: alpha("#10b981", 0.16),
										color: "#34d399",
									}}
								/>
							</>
						) : (
							<>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontWeight: 700,
										fontSize: "0.72rem",
									}}
								>
									TARGET PROFIT (4W):
								</Typography>
								<Typography
									variant="subtitle2"
									sx={{
										fontWeight: 800,
										fontSize: "0.84rem",
										color: "#fbbf24",
									}}
								>
									~{formatAmount(summary.minOptimalDailyProfit)} ICA/day
								</Typography>
								<Chip
									label={`For 4W fast payoff at ${summary.allocationPercent}% repay budget`}
									size="small"
									sx={{
										height: 19,
										fontSize: "0.62rem",
										fontWeight: 800,
										bgcolor: alpha("#f59e0b", 0.18),
										color: "#fbbf24",
									}}
								/>
							</>
						)}
					</Box>

					{/* Right: Quick Stat Chips */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.8,
							flexWrap: "wrap",
						}}
					>
						<Chip
							icon={<SpeedIcon sx={{ fontSize: "12px !important" }} />}
							label={`Safe Installment: ~${formatAmount(summary.safeWeeklyInstallment)} / week`}
							size="small"
							variant="outlined"
							sx={{ fontWeight: 700, fontSize: "0.66rem", height: 20 }}
						/>
						<Chip
							label={`Best Rate: ${summary.lowestInterestRate}% (${summary.lowestInterestBankName})`}
							size="small"
							color="primary"
							variant="outlined"
							sx={{ fontWeight: 700, fontSize: "0.66rem", height: 20 }}
						/>
						<Chip
							label={`${summary.qualifyingBanksCount} of ${summary.totalBanksCount} Banks Eligible`}
							size="small"
							sx={{
								fontWeight: 800,
								fontSize: "0.66rem",
								height: 20,
								bgcolor: alpha(theme.palette.primary.main, 0.15),
								color: theme.palette.primary.main,
							}}
						/>
					</Box>
				</Paper>
			)}
		</Paper>
	);
};
