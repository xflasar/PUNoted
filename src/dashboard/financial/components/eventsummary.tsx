import {
	Box,
	Typography,
	CircularProgress,
	alpha,
	useTheme,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { DrawerRow, FlexCard } from "./sharedui";
import {
	formatCurrency,
	SEMANTIC_COLORS,
	formatCompactTimestamp,
} from "../utils/financeutils";
import type { Transaction, TransactionDetail } from "../types/finances";
import React from "react";

interface EventSummaryProps {
	tx: Transaction;
	currency: string;
	details: TransactionDetail | null;
	loading: boolean;
	transactions?: Transaction[];
}

export const EventSummary = ({
	tx,
	currency,
	details,
	loading,
	transactions = [],
}: EventSummaryProps) => {
	const isContract =
		details?.Location === "Contract" ||
		tx.Type.includes("CONTRACT") ||
		Boolean(tx.ContractId) ||
		(tx.Description && tx.Description.toLowerCase().includes("contract"));

	// Calculate aggregated contract metrics across all related transactions
	const contractSummary = React.useMemo(() => {
		if (!isContract) return null;
		const targetRef = tx.ContractId || details?.ReferenceId || tx.Id;
		const partner = tx.PartnerCode;

		const related = transactions.filter((t) => {
			if (t.ContractId && targetRef && t.ContractId === targetRef) return true;
			if (details?.ReferenceId && t.Id.includes(details.ReferenceId))
				return true;
			if (partner && t.PartnerCode === partner && t.Type.includes("CONTRACT"))
				return true;
			return t.Id === tx.Id;
		});

		let grossRevenue = 0;
		let grossCost = 0;
		let minTime = Infinity;
		let maxTime = -Infinity;

		related.forEach((t) => {
			const amt = Number(t.Amount || 0);
			if (amt > 0) grossRevenue += amt;
			else grossCost += Math.abs(amt);

			const ts = new Date(t.Timestamp || 0).getTime();
			if (ts < minTime) minTime = ts;
			if (ts > maxTime) maxTime = ts;
		});

		// Context Data status extraction (e.g. "Name: Local Market | Status: FULFILLED")
		let status = "FULFILLED";
		if (details?.ContextData) {
			const statusMatch = details.ContextData.match(/Status:\s*([A-Z_]+)/i);
			if (statusMatch) status = statusMatch[1].toUpperCase();
		}

		return {
			contractId: targetRef,
			executionCount: related.length,
			grossRevenue,
			grossCost,
			netFlow: grossRevenue - grossCost,
			status,
			startDate: isFinite(minTime)
				? new Date(minTime).toLocaleDateString()
				: null,
			endDate: isFinite(maxTime)
				? new Date(maxTime).toLocaleDateString()
				: null,
		};
	}, [isContract, tx, details, transactions]);

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
			<FlexCard>
				<Box
					sx={{
						px: 2.5,
						display: "flex",
						alignItems: "center",
						borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
					}}
				>
					<ReceiptLongIcon fontSize="small" sx={{ color: "#7b68ee", mr: 1 }} />
					<Typography
						sx={{
							fontWeight: 700,
							fontSize: "0.75rem",
							textTransform: "uppercase",
							letterSpacing: "0.08em",
							color: "rgba(255,255,255,0.8)",
						}}
					>
						Event Summary
					</Typography>
				</Box>
				<Box sx={{ display: "flex", flexDirection: "column" }}>
					<DrawerRow
						label="Type"
						value={tx.Type}
						valueColor={
							tx.Type.includes("CORP") ? SEMANTIC_COLORS.neonPurple : "#fff"
						}
					/>
					<DrawerRow
						label="Timestamp (UTC)"
						value={formatCompactTimestamp(tx.Timestamp)}
						isMonospace
					/>
					<DrawerRow
						label="Amount"
						value={`${tx.Amount > 0 ? "+" : ""}${formatCurrency(tx.Amount)} ${currency}`}
						valueColor={
							tx.Amount >= 0
								? SEMANTIC_COLORS.neonGreen
								: SEMANTIC_COLORS.neonRed
						}
						isMonospace
						noBorder={!loading && !details}
					/>
					{loading && (
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								py: 2,
								borderTop: "1px solid rgba(255, 255, 255, 0.06)",
							}}
						>
							<CircularProgress size={20} sx={{ color: "#7b68ee" }} />
						</Box>
					)}
					{details && (
						<>
							<DrawerRow
								label="Location"
								value={details.Location}
								isTopBorder
							/>
							<DrawerRow label="Context" value={details.ContextData} />
							{details.FeeAmount > 0 && (
								<DrawerRow
									label="Fees"
									value={`${formatCurrency(details.FeeAmount)} ${details.FeeCurrency}`}
									valueColor={SEMANTIC_COLORS.neonRed}
									isMonospace
								/>
							)}
							<DrawerRow
								label="Reference ID"
								value={details.ReferenceId}
								isMonospace
								noBorder
							/>
						</>
					)}
				</Box>
			</FlexCard>

			{/* Aggregated Contract Details Summary Card */}
			{contractSummary && (
				<FlexCard
					sx={{
						borderLeft: "2px solid #7b68ee",
						bgcolor: "rgba(123, 104, 238, 0.08)",
					}}
				>
					<Box
						sx={{
							px: 2.5,
							py: 1.25,
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
						}}
					>
						<Typography
							sx={{
								textTransform: "uppercase",
								letterSpacing: "0.08em",
								color: "#7b68ee",
								fontWeight: 800,
								fontSize: "0.75rem",
							}}
						>
							Contract Overview
						</Typography>
						<Typography
							sx={{
								fontSize: "0.62rem",
								fontWeight: 800,
								px: 0.75,
								py: 0.15,
								borderRadius: "4px",
								bgcolor: "rgba(74, 222, 128, 0.18)",
								color: SEMANTIC_COLORS.neonGreen,
								fontFamily: "monospace",
							}}
						>
							{contractSummary.status}
						</Typography>
					</Box>
					<Box sx={{ display: "flex", flexDirection: "column" }}>
						<DrawerRow
							label="Milestone Fulfillments"
							value={`${contractSummary.executionCount} Executions`}
							isMonospace
						/>
						<DrawerRow
							label="Gross Contract Income"
							value={`+${formatCurrency(contractSummary.grossRevenue)} ${currency}`}
							valueColor={SEMANTIC_COLORS.neonGreen}
							isMonospace
						/>
						{contractSummary.grossCost > 0 && (
							<DrawerRow
								label="Contract Costs"
								value={`-${formatCurrency(contractSummary.grossCost)} ${currency}`}
								valueColor={SEMANTIC_COLORS.neonRed}
								isMonospace
							/>
						)}
						<DrawerRow
							label="Net Contract Profit"
							value={`${contractSummary.netFlow >= 0 ? "+" : ""}${formatCurrency(contractSummary.netFlow)} ${currency}`}
							valueColor={
								contractSummary.netFlow >= 0
									? SEMANTIC_COLORS.neonGreen
									: SEMANTIC_COLORS.neonRed
							}
							isMonospace
						/>
						{contractSummary.startDate && (
							<DrawerRow
								label="Execution Timeline"
								value={`${contractSummary.startDate} → ${contractSummary.endDate}`}
								isMonospace
								noBorder
							/>
						)}
					</Box>
				</FlexCard>
			)}
		</Box>
	);
};
