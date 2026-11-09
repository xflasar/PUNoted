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
import ClearIcon from "@mui/icons-material/Clear";
import { FormattedNumberInput } from "../../../dashboard/banking/components/formattednumberinput";
import { LoanFinderGuide } from "../../../dashboard/banking/components/loanfinderguide";
import type { OverallLoanSummary } from "../../../dashboard/banking/helpers";
import { formatAmount } from "../../../dashboard/banking/helpers";

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
				p: { xs: 1.5, sm: 2 },
				borderRadius: 2,
				bgcolor: alpha(theme.palette.background.paper, 0.7),
				backdropFilter: "blur(12px)",
				border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
				display: "flex",
				flexDirection: "column",
				gap: 1.5,
				width: "100%",
			}}
		>
			{/* Top Bar: Title + Budget Presets + Toggle + Reset */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 1.5,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
						Loan Calculator &amp; Feasibility
					</Typography>
					<Button
						size="small"
						variant="text"
						onClick={() => setShowGuide(!showGuide)}
						sx={{
							fontSize: "0.72rem",
							fontWeight: 600,
							color: "text.secondary",
							textTransform: "none",
							p: "2px 6px",
							minWidth: "auto",
							"&:hover": { color: "primary.main" },
						}}
					>
						{showGuide ? "Hide guide" : "How it works"}
					</Button>
				</Box>

				{/* Controls Right */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1.5,
						flexWrap: "wrap",
					}}
				>
					{/* Budget */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontWeight: 700,
								fontSize: "0.72rem",
								mr: 0.3,
							}}
						>
							Budget:
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
									fontSize: "0.68rem",
									fontWeight: 700,
									cursor: "pointer",
								}}
							/>
						))}
						<Tooltip title="Custom profit budget %">
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
														fontSize: "0.65rem",
														fontWeight: 700,
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
											width: 24,
											padding: "2px 2px",
											fontSize: "0.72rem",
											fontWeight: 700,
											textAlign: "center",
										},
									},
								}}
								sx={{
									width: 52,
									"& .MuiOutlinedInput-root": {
										height: 22,
										borderRadius: 1,
									},
								}}
							/>
						</Tooltip>
					</Box>

					{/* Only Matches Switch */}
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={onlyShowMatches}
								onChange={(e) => onToggleOnlyMatches(e.target.checked)}
								color="primary"
							/>
						}
						label={
							<Typography
								variant="caption"
								sx={{
									fontWeight: 700,
									fontSize: "0.72rem",
									userSelect: "none",
								}}
							>
								Matches only
							</Typography>
						}
						sx={{ m: 0 }}
					/>

					{/* Reset */}
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
								p: "2px 6px",
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

			{/* Main Full-Width Responsive Inputs Grid */}
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: {
						xs: "1fr",
						sm: "repeat(2, 1fr)",
						md: "repeat(4, 1fr)",
					},
					gap: 1.5,
					alignItems: "center",
					width: "100%",
				}}
			>
				{/* 1. Loan Amount */}
				<FormattedNumberInput
					label="Desired Loan Amount"
					value={loanAmount}
					onChange={onLoanAmountChange}
					placeholder="e.g. 100,000"
					unit="ICA"
				/>

				{/* 2. Daily Profit */}
				<FormattedNumberInput
					label="Daily Net Profit"
					value={dailyProfit}
					onChange={onDailyProfitChange}
					placeholder="e.g. 5,000"
					unit="ICA/d"
				/>

				{/* 3. Loan Term */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 0.5,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							fontWeight: 700,
							fontSize: "0.72rem",
							color: "text.secondary",
							lineHeight: 1,
						}}
					>
						Loan Length
					</Typography>
					<Box
						sx={{ display: "flex", gap: 0.5, alignItems: "center", height: 40 }}
					>
						{[
							{ label: "Auto", val: "" },
							{ label: "2W", val: 2 },
							{ label: "4W", val: 4 },
							{ label: "8W", val: 8 },
						].map((item) => (
							<Chip
								key={item.label}
								label={item.label}
								size="small"
								onClick={() => onTermWeeksChange && onTermWeeksChange(item.val)}
								color={termWeeks === item.val ? "primary" : "default"}
								variant={termWeeks === item.val ? "filled" : "outlined"}
								sx={{
									height: 28,
									flex: 1,
									fontSize: "0.72rem",
									fontWeight: 700,
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
										width: 28,
										padding: "4px 2px",
										fontSize: "0.72rem",
										textAlign: "center",
										fontWeight: 700,
									},
								},
							}}
							sx={{
								width: 50,
								"& .MuiOutlinedInput-root": {
									height: 28,
									borderRadius: 1,
								},
							}}
						/>
					</Box>
				</Box>

				{/* 4. Payment Interval */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 0.5,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							fontWeight: 700,
							fontSize: "0.72rem",
							color: "text.secondary",
							lineHeight: 1,
						}}
					>
						Payment Interval
					</Typography>
					<Box
						sx={{ display: "flex", gap: 0.5, alignItems: "center", height: 40 }}
					>
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
									height: 28,
									flex: 1,
									fontSize: "0.72rem",
									fontWeight: 700,
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
										width: 30,
										padding: "4px 2px",
										fontSize: "0.72rem",
										textAlign: "center",
										fontWeight: 700,
									},
								},
							}}
							sx={{
								width: 52,
								"& .MuiOutlinedInput-root": {
									height: 28,
									borderRadius: 1,
								},
							}}
						/>
					</Box>
				</Box>
			</Box>

			{/* Full-Width Result Summary Strip */}
			{summary && (
				<Box
					sx={{
						py: 1,
						px: 1.5,
						borderRadius: 1.5,
						bgcolor: summary.isUserProfitMatch
							? alpha("#10b981", 0.08)
							: alpha("#f59e0b", 0.08),
						border: `1px solid ${
							summary.isUserProfitMatch
								? alpha("#10b981", 0.25)
								: alpha("#f59e0b", 0.25)
						}`,
						display: "flex",
						flexDirection: { xs: "column", md: "row" },
						justifyContent: "space-between",
						alignItems: { xs: "flex-start", md: "center" },
						gap: 1.5,
						width: "100%",
					}}
				>
					{/* Left: Payoff & Retained status */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							flexWrap: "wrap",
						}}
					>
						<Typography
							variant="subtitle2"
							sx={{
								fontWeight: 800,
								fontSize: "0.85rem",
								color: summary.isUserProfitMatch ? "#34d399" : "#fbbf24",
							}}
						>
							{dailyProfit !== "" && Number(dailyProfit) > 0 ? (
								<>
									{summary.optimalLengthWeeks}W Payoff (
									{summary.optimalPayoffDays}d @ {summary.allocationPercent}%
									budget)
								</>
							) : (
								<>
									Target profit: ~{formatAmount(summary.minOptimalDailyProfit)}{" "}
									ICA/d
								</>
							)}
						</Typography>

						{dailyProfit !== "" && Number(dailyProfit) > 0 && (
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontWeight: 600,
									fontSize: "0.72rem",
								}}
							>
								(Keeps ~{formatAmount(summary.retainedDailyProfit)} ICA/d /{" "}
								{summary.retainedPercent}%)
							</Typography>
						)}

						<Chip
							label={`${summary.qualifyingBanksCount} of ${summary.totalBanksCount} banks match`}
							size="small"
							sx={{
								height: 20,
								fontSize: "0.68rem",
								fontWeight: 700,
								bgcolor: alpha(theme.palette.primary.main, 0.15),
								color: theme.palette.primary.main,
							}}
						/>
					</Box>

					{/* Right: Side-by-side Stable vs Interest-Only */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1.2,
							flexWrap: "wrap",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontWeight: 700,
									fontSize: "0.7rem",
								}}
							>
								STABLE:
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 800,
									fontSize: "0.82rem",
									color: "text.primary",
								}}
							>
								~
								{formatAmount(
									summary.stableInstallment || summary.safeWeeklyInstallment,
								)}
								<span
									style={{
										fontSize: "0.65rem",
										color: theme.palette.text.secondary,
									}}
								>
									{" "}
									/ interval
								</span>
							</Typography>
						</Box>

						<Box
							sx={{
								width: "1px",
								height: 16,
								bgcolor: alpha(theme.palette.divider, 0.2),
							}}
						/>

						<Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
							<Typography
								variant="caption"
								sx={{
									color: "primary.main",
									fontWeight: 700,
									fontSize: "0.7rem",
								}}
							>
								INTEREST-ONLY:
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 800,
									fontSize: "0.82rem",
									color: "primary.main",
								}}
							>
								~{formatAmount(summary.interestOnlyInstallment)}
								<span
									style={{
										fontSize: "0.65rem",
										color: theme.palette.text.secondary,
									}}
								>
									{" "}
									/ interval
								</span>
							</Typography>
						</Box>

						<Chip
							label={`Best: ${summary.lowestInterestRate}% (${summary.lowestInterestBankName})`}
							size="small"
							variant="outlined"
							sx={{
								height: 20,
								fontSize: "0.68rem",
								fontWeight: 700,
								borderColor: alpha(theme.palette.divider, 0.2),
							}}
						/>
					</Box>
				</Box>
			)}
		</Paper>
	);
};
