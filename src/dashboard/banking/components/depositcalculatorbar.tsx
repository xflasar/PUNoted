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
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ClearIcon from "@mui/icons-material/Clear";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { FormattedNumberInput } from "./formattednumberinput";
import { formatAmount } from "../helpers";
import type { Bank, BankDepositComparison } from "../types";

export interface DepositCalculatorBarProps {
	depositAmount: number | "";
	onDepositAmountChange: (val: number | "") => void;
	onlyAccepting: boolean;
	onToggleOnlyAccepting: (val: boolean) => void;
	onReset: () => void;
	comparisons: BankDepositComparison[];
}

export const DepositCalculatorBar: React.FC<DepositCalculatorBarProps> = ({
	depositAmount,
	onDepositAmountChange,
	onlyAccepting,
	onToggleOnlyAccepting,
	onReset,
	comparisons,
}) => {
	const theme = useTheme();
	const hasActiveSearch = depositAmount !== "" && Number(depositAmount) > 0;

	// Aggregated stats across accepting banks
	const accepting = comparisons.filter((c) => c.canAcceptDeposit);
	const bestMonthlyRate = accepting.length > 0 ? Math.max(...accepting.map((c) => c.monthlyYieldRate ?? c.weeklyYieldRate * 4)) : 0;
	const bestWeeklyRate = accepting.length > 0 ? Math.max(...accepting.map((c) => c.weeklyYieldRate)) : 0;
	const bestMonthlyPayout = accepting.length > 0 ? Math.max(...accepting.map((c) => c.monthlyPayout)) : 0;
	const lowestRiskCount = accepting.filter((c) => c.riskTier === "LOW").length;

	return (
		<Paper
			elevation={0}
			sx={{
				p: 1.5,
				borderRadius: 2,
				bgcolor: alpha(theme.palette.background.paper, 0.55),
				backdropFilter: "blur(16px)",
				border: `1px solid ${alpha("#10b981", 0.3)}`,
				boxShadow: `0 4px 16px -2px ${alpha("#10b981", 0.08)}`,
				display: "flex",
				flexDirection: "column",
				gap: 1.25,
			}}
		>
			{/* Top Bar: Title & Quick Filters */}
			<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<SavingsOutlinedIcon sx={{ fontSize: 18, color: "#34d399" }} />
					<Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.85rem", letterSpacing: 0.3 }}>
						Depositor Yield Calculator
					</Typography>
					<Chip
						label="Investor Mode"
						size="small"
						sx={{
							height: 20,
							fontSize: "0.62rem",
							fontWeight: 800,
							bgcolor: alpha("#10b981", 0.15),
							color: "#34d399",
						}}
					/>
				</Box>

				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={onlyAccepting}
								onChange={(e) => onToggleOnlyAccepting(e.target.checked)}
								color="success"
								sx={{ mr: 0.5 }}
							/>
						}
						label={
							<Typography variant="caption" sx={{ fontWeight: 700, userSelect: "none", fontSize: "0.72rem" }}>
								Accepting Only
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
							sx={{ color: "text.secondary", textTransform: "none", fontSize: "0.72rem", py: 0, px: 0.8, minWidth: "auto" }}
						>
							Reset
						</Button>
					)}
				</Box>
			</Box>

			{/* Input Row */}
			<Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1.3fr 2fr" }, gap: 1.5, alignItems: "center" }}>
				<FormattedNumberInput
					label="Willing to Deposit"
					size="small"
					value={depositAmount}
					onChange={onDepositAmountChange}
					placeholder="e.g. 500,000"
					unit="ICA"
					icon={<SavingsOutlinedIcon sx={{ fontSize: 16, color: "#34d399" }} />}
				/>

				{hasActiveSearch ? (
					/* Benchmark Badges / Stats Strip */
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" },
							gap: 1,
							p: 1,
							borderRadius: 1.5,
							bgcolor: alpha(theme.palette.background.default, 0.5),
							border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						}}
					>
						<Box>
							<Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.6rem", fontWeight: 800, display: "block" }}>
								MAX 1-MO YIELD
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: 900, color: "#34d399", fontSize: "0.85rem", lineHeight: 1.2 }}>
								{bestMonthlyRate}% / mo
							</Typography>
							<Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.58rem" }}>
								({(bestMonthlyRate / 4).toFixed(2)}%/wk &bull; {bestMonthlyRate * 12}% APR)
							</Typography>
						</Box>

						<Box>
							<Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.6rem", fontWeight: 800, display: "block" }}>
								MAX 1-MO RETURN
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: 900, color: theme.palette.text.primary, fontSize: "0.85rem", lineHeight: 1.2 }}>
								+{formatAmount(bestMonthlyPayout)} ICA
							</Typography>
							<Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.58rem" }}>
								(+{formatAmount(Math.round(bestMonthlyPayout / 4))} / wk)
							</Typography>
						</Box>

						<Box sx={{ display: { xs: "none", sm: "block" } }}>
							<Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.6rem", fontWeight: 800, display: "block" }}>
								LOW RISK VAULTS
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: 900, color: "#34d399", fontSize: "0.85rem", lineHeight: 1.2 }}>
								{lowestRiskCount} banks
							</Typography>
							<Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.58rem" }}>
								Active loan cash flow
							</Typography>
						</Box>
					</Box>
				) : (
					<Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem", fontStyle: "italic" }}>
						Enter an amount you'd like to deposit to compare weekly accounted dividends, solvency risks, and accepting banks in real-time.
					</Typography>
				)}
			</Box>
		</Paper>
	);
};
