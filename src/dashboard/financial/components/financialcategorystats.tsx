import React, { useState, useMemo } from "react";
import {
	Box,
	Typography,
	ButtonGroup,
	Button,
	TextField,
	Tooltip,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineOutlined";
import { SEMANTIC_COLORS, formatCurrency } from "../utils/financeutils";
import type { Transaction } from "../types/finances";
import { useGlobalData } from "../../../context/globaldatacontext";

interface FinancialCategoryStatsProps {
	transactions?: Transaction[];
	currency: string;
	timeRange?: string;
	customStartDate?: string;
	customEndDate?: string;
}

export const FinancialCategoryStats: React.FC<FinancialCategoryStatsProps> = ({
	transactions = [],
	currency,
	timeRange = "ALL",
	customStartDate = "",
	customEndDate = "",
}) => {
	const { loansData } = useGlobalData();

	// Categorize and aggregate net velocity dynamically from transactions and loansData
	const categoryMetrics = useMemo(() => {
		const now = Date.now();
		let cutoff = 0;

		if (timeRange === "24H") cutoff = now - 24 * 60 * 60 * 1000;
		else if (timeRange === "7D") cutoff = now - 7 * 24 * 60 * 60 * 1000;
		else if (timeRange === "30D") cutoff = now - 30 * 24 * 60 * 60 * 1000;
		else if (timeRange === "1Y") cutoff = now - 365 * 24 * 60 * 60 * 1000;

		const startMs =
			timeRange === "CUSTOM" && customStartDate
				? new Date(customStartDate).getTime()
				: 0;
		const endMs =
			timeRange === "CUSTOM" && customEndDate
				? new Date(customEndDate).getTime() + 86400000
				: Infinity;

		const map = new Map<
			string,
			{ category: string; income: number; expense: number; net: number }
		>();

		const categories = [
			"CX",
			"CONTRACT",
			"CORP CX",
			"CORP CONTRACT",
			"PUBLIC LOANS",
			"CORP LOANS",
		];
		categories.forEach((cat) =>
			map.set(cat, { category: cat, income: 0, expense: 0, net: 0 }),
		);

		transactions.forEach((tx) => {
			const txTime = new Date(tx.Timestamp).getTime();
			if (timeRange !== "CUSTOM" && timeRange !== "ALL" && txTime < cutoff)
				return;
			if (timeRange === "CUSTOM" && (txTime < startMs || txTime > endMs))
				return;

			let category = "OTHER";
			const fullTypeStr =
				`${tx.Type || ""} ${tx.Category || ""} ${tx.Description || ""}`.toUpperCase();

			if (fullTypeStr.includes("LOAN")) {
				if (fullTypeStr.includes("PUBLIC")) {
					category = "PUBLIC LOANS";
				} else {
					category = "CORP LOANS";
				}
			} else if (
				fullTypeStr.includes("CORP_CX") ||
				fullTypeStr.includes("CORP CX")
			) {
				category = "CORP CX";
			} else if (
				fullTypeStr.includes("CORP_CONTRACT") ||
				fullTypeStr.includes("CORP CONTRACT")
			) {
				category = "CORP CONTRACT";
			} else if (fullTypeStr.includes("CX")) {
				category = "CX";
			} else if (fullTypeStr.includes("CONTRACT")) {
				category = "CONTRACT";
			}

			const item = map.get(category) || {
				category,
				income: 0,
				expense: 0,
				net: 0,
			};
			if (tx.Amount > 0) item.income += tx.Amount;
			else item.expense += Math.abs(tx.Amount);
			item.net += tx.Amount;
			map.set(category, item);
		});

		// Hydrate Public Loans & Corp Loans from global loansData if transactions net is 0
		if (Array.isArray(loansData) && loansData.length > 0) {
			let pubNet = 0,
				pubIn = 0,
				pubOut = 0;
			let corpNet = 0,
				corpIn = 0,
				corpOut = 0;

			loansData.forEach((loan: any) => {
				const status = (loan.status || "").toUpperCase();
				if (status.includes("CANCELLED") || status.includes("REJECTED")) return;

				const isLent =
					loan.contracttype === "LOAN_GIVEN" ||
					loan.party === "CUSTOMER" ||
					loan.is_payout_party;
				const amount = Number(loan.total_amount || loan.amount || 0);
				const isPublic =
					`${loan.loan_strategy || ""} ${loan.type || ""} ${loan.name || ""}`
						.toUpperCase()
						.includes("PUBLIC");

				if (isPublic) {
					if (isLent) {
						pubIn += amount;
						pubNet += amount;
					} else {
						pubOut += amount;
						pubNet -= amount;
					}
				} else {
					if (isLent) {
						corpIn += amount;
						corpNet += amount;
					} else {
						corpOut += amount;
						corpNet -= amount;
					}
				}
			});

			const pubItem = map.get("PUBLIC LOANS");
			if (pubItem && pubItem.net === 0 && (pubIn > 0 || pubOut > 0)) {
				pubItem.income = pubIn;
				pubItem.expense = pubOut;
				pubItem.net = pubNet;
			}

			const corpItem = map.get("CORP LOANS");
			if (corpItem && corpItem.net === 0 && (corpIn > 0 || corpOut > 0)) {
				corpItem.income = corpIn;
				corpItem.expense = corpOut;
				corpItem.net = corpNet;
			}
		}

		return Array.from(map.values());
	}, [transactions, loansData, timeRange, customStartDate, customEndDate]);

	const getCategoryColor = (cat: string) => {
		if (cat === "PUBLIC LOANS") return "#38bdf8";
		if (cat === "CORP LOANS") return "#a855f7";
		if (cat.includes("CORP CX")) return SEMANTIC_COLORS.neonPurple;
		if (cat.includes("CORP CONTRACT")) return "#f43f5e";
		if (cat.includes("CX")) return SEMANTIC_COLORS.neonBlue;
		if (cat.includes("CONTRACT")) return SEMANTIC_COLORS.neonGold;
		return "rgba(255, 255, 255, 0.7)";
	};

	return (
		<Box
			sx={{
				width: "100%",
				backgroundColor: "rgba(4, 4, 10, 0.75)",
				border: "1px solid rgba(123, 104, 238, 0.25)",
				borderRadius: "10px",
				backdropFilter: "blur(25px)",
				py: 0.5,
				px: 1,
				flexShrink: 0,
				display: "flex",
				flexDirection: "column",
				gap: 0.5,
			}}
		>
			{/* Header title */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
					pb: 0.25,
				}}
			>
				<Typography
					sx={{
						color: "#7b68ee",
						fontSize: "0.72rem",
						fontWeight: 800,
						textTransform: "uppercase",
						letterSpacing: "0.08em",
					}}
				>
					Category Cash Flow Ledger ({timeRange})
				</Typography>
			</Box>

			{/* KPI Metric Items Row */}
			<Box
				sx={{
					display: "flex",
					flexWrap: { xs: "wrap", lg: "nowrap" },
					alignItems: "center",
					gap: { xs: 0.5, lg: 0 },
					"& > *:not(:last-child)": {
						borderRight: "1px solid rgba(255, 255, 255, 0.08)",
					},
				}}
			>
				{categoryMetrics.map((item) => {
					const color = getCategoryColor(item.category);
					return (
						<Box
							key={item.category}
							sx={{
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								textAlign: "center",
								px: { xs: 0.75, lg: 1.25 },
								py: 0.25,
								flex: { xs: "1 1 auto", lg: 1 },
								minWidth: 0,
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 0.5,
									mb: 0.25,
									justifyContent: "center",
								}}
							>
								<Box
									sx={{
										width: 5,
										height: 5,
										borderRadius: "50%",
										bgcolor: color,
										boxShadow: `0 0 6px ${color}`,
										flexShrink: 0,
									}}
								/>
								<Tooltip
									title={
										<Box
											sx={{
												whiteSpace: "pre-line",
												py: 0.2,
												fontSize: "0.70rem",
												lineHeight: 1.45,
											}}
										>
											{`${item.category} Velocity (${timeRange}):\n• Gross In: ${item.income > 0 ? `+${formatCurrency(item.income)}` : formatCurrency(0)} ${currency}\n• Gross Out: ${item.expense > 0 ? `-${formatCurrency(item.expense)}` : formatCurrency(0)} ${currency}\n• Net Balance: ${item.net > 0 ? `+${formatCurrency(item.net)}` : item.net < 0 ? `-${formatCurrency(Math.abs(item.net))}` : formatCurrency(0)} ${currency}`}
										</Box>
									}
									arrow
									placement="top"
									slotProps={{
										tooltip: {
											sx: {
												bgcolor: "rgba(10, 10, 22, 0.95)",
												border: "1px solid rgba(123, 104, 238, 0.3)",
												backdropFilter: "blur(15px)",
											},
										},
									}}
								>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 0.3,
											cursor: "help",
										}}
									>
										<Typography
											sx={{
												color: "rgba(255, 255, 255, 0.45)",
												fontSize: "0.67rem",
												fontWeight: 800,
												textTransform: "uppercase",
												letterSpacing: "0.06em",
												whiteSpace: "nowrap",
											}}
										>
											{item.category}
										</Typography>
										<HelpOutlineIcon
											sx={{ fontSize: 11, color: "rgba(255, 255, 255, 0.35)" }}
										/>
									</Box>
								</Tooltip>
							</Box>

							<Typography
								sx={{
									color:
										item.net >= 0
											? SEMANTIC_COLORS.neonGreen
											: SEMANTIC_COLORS.neonRed,
									fontSize: "0.90rem",
									fontWeight: 800,
									fontFamily: "monospace",
									lineHeight: 1.1,
									whiteSpace: "nowrap",
								}}
							>
								{item.net > 0 ? "+" : ""}
								{formatCurrency(item.net, Math.abs(item.net) >= 1000 ? 0 : 2)}
								<Typography
									component="span"
									sx={{
										fontSize: "0.72em",
										color: "rgba(255,255,255,0.45)",
										ml: 0.5,
										fontWeight: 700,
									}}
								>
									{currency}
								</Typography>
							</Typography>
						</Box>
					);
				})}
			</Box>
		</Box>
	);
};
