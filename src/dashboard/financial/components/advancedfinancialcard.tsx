import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { FlexCard } from "./sharedui";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";

export const AdvancedFinancialCard = ({
	currentData,
	volumeBreakdown,
}: any) => {
	const transactions = currentData?.Transactions || [];

	const cxTxs = transactions.filter((tx: any) => tx.Type.includes("CX"));
	const contractTxs = transactions.filter((tx: any) =>
		tx.Type.includes("CONTRACT"),
	);

	const cxBuys = cxTxs.filter((tx: any) => tx.Amount < 0);
	const cxSells = cxTxs.filter((tx: any) => tx.Amount > 0);

	const cxBuyExpense = cxBuys.reduce(
		(acc: number, tx: any) => acc + Math.abs(tx.Amount),
		0,
	);
	const cxSellRevenue = cxSells.reduce(
		(acc: number, tx: any) => acc + tx.Amount,
		0,
	);
	const cxNetProfit = cxSellRevenue - cxBuyExpense;

	const contractIncome = contractTxs
		.filter((tx: any) => tx.Amount > 0)
		.reduce((acc: number, tx: any) => acc + tx.Amount, 0);
	const contractExpense = contractTxs
		.filter((tx: any) => tx.Amount < 0)
		.reduce((acc: number, tx: any) => acc + Math.abs(tx.Amount), 0);
	const contractNet = contractIncome - contractExpense;

	const totalVol =
		(volumeBreakdown?.cx || 0) + (volumeBreakdown?.contract || 0);
	const cxRatio =
		totalVol > 0
			? Math.round(((volumeBreakdown?.cx || 0) / totalVol) * 100)
			: 0;
	const contractRatio = totalVol > 0 ? 100 - cxRatio : 0;

	return (
		<FlexCard
			sx={{
				height: "100%",
				p: 2,
				border: "1px solid rgba(123, 104, 238, 0.35)",
			}}
		>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				mb={1.5}
			>
				<Typography
					fontWeight={800}
					fontSize="0.75rem"
					sx={{
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						color: "#7b68ee",
					}}
				>
					Full Company Telemetry & Dependency Matrix
				</Typography>
				<Typography
					variant="caption"
					fontFamily="monospace"
					color="rgba(255,255,255,0.5)"
				>
					30D Active Breakdown
				</Typography>
			</Box>

			{/* Dependency Visual Ratio Bar */}
			<Box mb={2}>
				<Box
					sx={{
						display: "flex",
						height: 8,
						borderRadius: 4,
						overflow: "hidden",
						bgcolor: "rgba(255,255,255,0.05)",
					}}
				>
					<Box
						sx={{
							width: `${cxRatio}%`,
							bgcolor: SEMANTIC_COLORS.neonBlue,
							transition: "width 0.5s",
						}}
					/>
					<Box
						sx={{
							width: `${contractRatio}%`,
							bgcolor: SEMANTIC_COLORS.neonGold,
							transition: "width 0.5s",
						}}
					/>
				</Box>
				<Box display="flex" justifyContent="space-between" mt={0.5}>
					<Typography
						variant="caption"
						sx={{
							color: SEMANTIC_COLORS.neonBlue,
							fontFamily: "monospace",
							fontSize: "0.68rem",
							fontWeight: 700,
						}}
					>
						CX Dependency: {cxRatio}% (
						{formatCurrency(volumeBreakdown?.cx || 0, 0)})
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: SEMANTIC_COLORS.neonGold,
							fontFamily: "monospace",
							fontSize: "0.68rem",
							fontWeight: 700,
						}}
					>
						Contract Dependency: {contractRatio}% (
						{formatCurrency(volumeBreakdown?.contract || 0, 0)})
					</Typography>
				</Box>
			</Box>

			{/* Split Telemetry Details */}
			<Box
				display="grid"
				gridTemplateColumns="1fr 1fr"
				gap={1.5}
				sx={{ flex: 1, minHeight: 0 }}
			>
				{/* CX Module */}
				<Box
					sx={{
						p: 1.25,
						borderRadius: "8px",
						bgcolor: "rgba(96, 165, 250, 0.04)",
						border: "1px solid rgba(96, 165, 250, 0.15)",
					}}
				>
					<Box display="flex" alignItems="center" gap={0.75} mb={1}>
						<ShoppingCartIcon
							sx={{ color: SEMANTIC_COLORS.neonBlue, fontSize: 14 }}
						/>
						<Typography
							fontWeight={800}
							fontSize="0.7rem"
							color={SEMANTIC_COLORS.neonBlue}
						>
							CX TELEMETRY
						</Typography>
					</Box>
					<Box display="flex" flexDirection="column" gap={0.6}>
						<Box display="flex" justifyContent="space-between">
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.5)"
								fontSize="0.68rem"
							>
								Executed Trades
							</Typography>
							<Typography
								variant="caption"
								fontFamily="monospace"
								fontWeight={700}
								fontSize="0.68rem"
							>
								{cxTxs.length}
							</Typography>
						</Box>
						<Box display="flex" justifyContent="space-between">
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.5)"
								fontSize="0.68rem"
							>
								Buy Outflow
							</Typography>
							<Typography
								variant="caption"
								fontFamily="monospace"
								fontWeight={700}
								fontSize="0.68rem"
								color={SEMANTIC_COLORS.neonRed}
							>
								-{formatCurrency(cxBuyExpense)}
							</Typography>
						</Box>
						<Box display="flex" justifyContent="space-between">
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.5)"
								fontSize="0.68rem"
							>
								Sell Inflow
							</Typography>
							<Typography
								variant="caption"
								fontFamily="monospace"
								fontWeight={700}
								fontSize="0.68rem"
								color={SEMANTIC_COLORS.neonGreen}
							>
								+{formatCurrency(cxSellRevenue)}
							</Typography>
						</Box>
						<Divider
							sx={{ borderColor: "rgba(255, 255, 255, 0.06)", my: 0.2 }}
						/>
						<Box display="flex" justifyContent="space-between">
							<Typography
								variant="caption"
								fontWeight={800}
								fontSize="0.68rem"
								color="white"
							>
								Net CX Profit
							</Typography>
							<Typography
								variant="caption"
								fontFamily="monospace"
								fontWeight={800}
								fontSize="0.68rem"
								color={
									cxNetProfit >= 0
										? SEMANTIC_COLORS.neonGreen
										: SEMANTIC_COLORS.neonRed
								}
							>
								{cxNetProfit > 0 ? "+" : ""}
								{formatCurrency(cxNetProfit)}
							</Typography>
						</Box>
					</Box>
				</Box>

				{/* Contract Module */}
				<Box
					sx={{
						p: 1.25,
						borderRadius: "8px",
						bgcolor: "rgba(251, 191, 36, 0.04)",
						border: "1px solid rgba(251, 191, 36, 0.15)",
					}}
				>
					<Box display="flex" alignItems="center" gap={0.75} mb={1}>
						<AssignmentIcon
							sx={{ color: SEMANTIC_COLORS.neonGold, fontSize: 14 }}
						/>
						<Typography
							fontWeight={800}
							fontSize="0.7rem"
							color={SEMANTIC_COLORS.neonGold}
						>
							CONTRACT TELEMETRY
						</Typography>
					</Box>
					<Box display="flex" flexDirection="column" gap={0.6}>
						<Box display="flex" justifyContent="space-between">
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.5)"
								fontSize="0.68rem"
							>
								Contracts Executed
							</Typography>
							<Typography
								variant="caption"
								fontFamily="monospace"
								fontWeight={700}
								fontSize="0.68rem"
							>
								{contractTxs.length}
							</Typography>
						</Box>
						<Box display="flex" justifyContent="space-between">
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.5)"
								fontSize="0.68rem"
							>
								Payments Received
							</Typography>
							<Typography
								variant="caption"
								fontFamily="monospace"
								fontWeight={700}
								fontSize="0.68rem"
								color={SEMANTIC_COLORS.neonGreen}
							>
								+{formatCurrency(contractIncome)}
							</Typography>
						</Box>
						<Box display="flex" justifyContent="space-between">
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.5)"
								fontSize="0.68rem"
							>
								Payments Issued
							</Typography>
							<Typography
								variant="caption"
								fontFamily="monospace"
								fontWeight={700}
								fontSize="0.68rem"
								color={SEMANTIC_COLORS.neonRed}
							>
								-{formatCurrency(contractExpense)}
							</Typography>
						</Box>
						<Divider
							sx={{ borderColor: "rgba(255, 255, 255, 0.06)", my: 0.2 }}
						/>
						<Box display="flex" justifyContent="space-between">
							<Typography
								variant="caption"
								fontWeight={800}
								fontSize="0.68rem"
								color="white"
							>
								Net Contract Yield
							</Typography>
							<Typography
								variant="caption"
								fontFamily="monospace"
								fontWeight={800}
								fontSize="0.68rem"
								color={
									contractNet >= 0
										? SEMANTIC_COLORS.neonGreen
										: SEMANTIC_COLORS.neonRed
								}
							>
								{contractNet > 0 ? "+" : ""}
								{formatCurrency(contractNet)}
							</Typography>
						</Box>
					</Box>
				</Box>
			</Box>
		</FlexCard>
	);
};
