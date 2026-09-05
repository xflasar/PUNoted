import React from "react";
import { Box, Typography, Tooltip, Skeleton } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineOutlined";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";
import { useGlobalData } from "../../../context/globaldatacontext";

interface KPIMetricItemProps {
	title: string;
	value: number;
	secondarySubValue?: number;
	subBreakdownText?: string;
	color: string;
	isNet?: boolean;
	guide: string;
	loading?: boolean;
	isPrimary?: boolean;
	currency?: string;
	unit?: string;
}

const KPIMetricItem = ({
	title,
	value,
	secondarySubValue,
	subBreakdownText,
	color,
	isNet = false,
	guide,
	loading,
	isPrimary = false,
	currency = "",
	unit = "",
}: KPIMetricItemProps) => {
	const displayUnit = unit || currency;

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				flex: "0 0 auto",
				minWidth: 140,
				px: 1.25,
			}}
		>
			<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}>
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
								py: 0.25,
								fontSize: "0.72rem",
								lineHeight: 1.45,
							}}
						>
							{guide}
						</Box>
					}
					arrow
					placement="top"
					slotProps={{
						tooltip: {
							sx: {
								bgcolor: "rgba(10, 10, 22, 0.95)",
								border: "1px solid rgba(123, 104, 238, 0.3)",
								boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
								backdropFilter: "blur(15px)",
								maxWidth: 320,
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
							{title}
						</Typography>
						<HelpOutlineIcon
							sx={{ fontSize: 11, color: "rgba(255, 255, 255, 0.35)" }}
						/>
					</Box>
				</Tooltip>
			</Box>

			{loading ? (
				<Skeleton
					variant="text"
					width="80%"
					height={18}
					sx={{ bgcolor: "rgba(255, 255, 255, 0.08)" }}
				/>
			) : (
				<Box sx={{ display: "flex", flexDirection: "column", gap: 0.15 }}>
					<Typography
						sx={{
							color:
								isNet && value < 0
									? SEMANTIC_COLORS.neonRed
									: isPrimary
										? "#ffffff"
										: "rgba(255, 255, 255, 0.9)",
							fontSize: isPrimary ? "1.00rem" : "0.90rem",
							fontWeight: 800,
							fontFamily: "monospace",
							lineHeight: 1.1,
							whiteSpace: "nowrap",
						}}
					>
						{isNet && value > 0 ? "+" : ""}
						{formatCurrency(value, Math.abs(value) >= 1000 ? 0 : 2)}
						{displayUnit && (
							<Typography
								component="span"
								sx={{
									fontSize: "0.72em",
									color: "rgba(255,255,255,0.45)",
									ml: 0.4,
									fontWeight: 700,
								}}
							>
								{displayUnit}
							</Typography>
						)}
					</Typography>

					{subBreakdownText && (
						<Typography
							sx={{
								display: "block",
								fontSize: "0.58rem",
								color: "rgba(255, 255, 255, 0.5)",
								fontFamily: "monospace",
								fontWeight: 700,
								whiteSpace: "nowrap",
								lineHeight: 1.1,
								mt: 0.2,
							}}
						>
							{subBreakdownText}
						</Typography>
					)}

					{secondarySubValue !== undefined && !subBreakdownText && (
						<Tooltip
							title="All other global material inventory across planetary bases & ship holds"
							arrow
							placement="top"
						>
							<Typography
								sx={{
									display: "block",
									fontSize: "0.60rem",
									color: "rgba(255, 255, 255, 0.45)",
									fontFamily: "monospace",
									fontWeight: 700,
									whiteSpace: "nowrap",
									cursor: "help",
									lineHeight: 1.1,
									mt: 0.2,
								}}
							>
								+{formatCurrency(secondarySubValue)} global
							</Typography>
						</Tooltip>
					)}
				</Box>
			)}
		</Box>
	);
};

export const KPISection = ({
	currentData,
	netPending,
	totalBuildingValue = 0,
	buildingAssetBreakdown = { owned: 0, leased: 0, loaned: 0, total: 0 },
	totalShipValue = 0,
	inventoryValuationBreakdown = {
		stationStockValue: 0,
		siteGlobalStockValue: 0,
		totalStockValue: 0,
	},
	loading,
	isAdvancedView,
}: any) => {
	const { loansData } = useGlobalData();
	const currency = currentData?.Currency || "";
	const liquid = currentData?.Liquid || 0;
	const stationStock = inventoryValuationBreakdown?.stationStockValue || 0;
	const globalSiteStock =
		inventoryValuationBreakdown?.siteGlobalStockValue || 0;
	const shipStock = inventoryValuationBreakdown?.shipStockValue || 0;
	const globalOtherStock = globalSiteStock + shipStock;
	const lockedBuy = currentData?.LockedBuy || 0;
	const lockedSell = currentData?.LockedSell || 0;
	const encumbered = lockedBuy + lockedSell;

	// Calculate live Net Loans metrics dynamically from global loansData, currentData, or transactions
	const loanMetrics = React.useMemo(() => {
		let publicLent = 0,
			publicBorrowed = 0;
		let corpLent = 0,
			corpBorrowed = 0;

		const loansList =
			Array.isArray(loansData) && loansData.length > 0
				? loansData
				: currentData?.Loans ||
					currentData?.loans ||
					currentData?.PendingLoans ||
					[];

		if (Array.isArray(loansList) && loansList.length > 0) {
			loansList.forEach((loan: any) => {
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
					if (isLent) publicLent += amount;
					else publicBorrowed += amount;
				} else {
					if (isLent) corpLent += amount;
					else corpBorrowed += amount;
				}
			});
		} else {
			(currentData?.Transactions || []).forEach((tx: any) => {
				const fullStr =
					`${tx.Type || ""} ${tx.Category || ""} ${tx.Description || ""}`.toUpperCase();
				if (fullStr.includes("LOAN")) {
					const amt = Number(tx.Amount || 0);
					const isPublic = fullStr.includes("PUBLIC");
					if (amt > 0) {
						if (isPublic) publicLent += amt;
						else corpLent += amt;
					} else {
						if (isPublic) publicBorrowed += Math.abs(amt);
						else corpBorrowed += Math.abs(amt);
					}
				}
			});
		}

		const totalLent = publicLent + corpLent;
		const totalBorrowed = publicBorrowed + corpBorrowed;

		return {
			publicLent,
			publicBorrowed,
			corpLent,
			corpBorrowed,
			totalLent,
			totalBorrowed,
			publicLoans: publicLent - publicBorrowed,
			corpLoans: corpLent - corpBorrowed,
			total: totalLent - totalBorrowed,
		};
	}, [
		loansData,
		currentData?.Loans,
		currentData?.loans,
		currentData?.PendingLoans,
		currentData?.Transactions,
	]);

	const netLoansGuide = `Net Loans Position (${formatCurrency(loanMetrics.total)} ${currency}):\n• Receivable Loans (Lent): ${loanMetrics.totalLent > 0 ? `+${formatCurrency(loanMetrics.totalLent)}` : formatCurrency(0)} ${currency}\n• Payable Loans (Borrowed): ${loanMetrics.totalBorrowed > 0 ? `-${formatCurrency(loanMetrics.totalBorrowed)}` : formatCurrency(0)} ${currency}\n• Public Loans: ${loanMetrics.publicLent > 0 ? `+${formatCurrency(loanMetrics.publicLent)}` : formatCurrency(0)} lent / ${loanMetrics.publicBorrowed > 0 ? `-${formatCurrency(loanMetrics.publicBorrowed)}` : formatCurrency(0)} borrowed\n• Corporate Loans: ${loanMetrics.corpLent > 0 ? `+${formatCurrency(loanMetrics.corpLent)}` : formatCurrency(0)} lent / ${loanMetrics.corpBorrowed > 0 ? `-${formatCurrency(loanMetrics.corpBorrowed)}` : formatCurrency(0)} borrowed`;

	const totalStock =
		(inventoryValuationBreakdown?.totalStockValue || 0) > 0
			? inventoryValuationBreakdown.totalStockValue
			: currentData?.InventoryValue || 0;

	const totalAssetsCalc =
		liquid +
		totalStock +
		totalShipValue +
		totalBuildingValue +
		encumbered +
		(netPending || 0);

	const totalAssetsGuide = `Total Assets (${formatCurrency(totalAssetsCalc)} ${currency}):
• Liquid Cash: ${formatCurrency(liquid)} ${currency}
• Inventory Assets (All Storages): ${formatCurrency(totalStock)} ${currency}
• Building Assets (Structure BOM): ${formatCurrency(totalBuildingValue)} ${currency}
• Ship Assets (Hull Chassis BOM): ${formatCurrency(totalShipValue)} ${currency}
• Encumbered (CX): ${formatCurrency(encumbered)} ${currency}
• Net Contracts: ${formatCurrency(netPending || 0)} ${currency}`;

	const inventoryGuide = `Inventory Assets (${formatCurrency(totalStock)} ${currency}):
• Station / Vault Storage: ${formatCurrency(inventoryValuationBreakdown?.stationStockValue || 0)} ${currency}
• Base Site Storage: ${formatCurrency(inventoryValuationBreakdown?.siteGlobalStockValue || 0)} ${currency}
• Ship Cargo & Fuel: ${formatCurrency(inventoryValuationBreakdown?.shipStockValue || 0)} ${currency}`;

	const buildingGuide = `Building Assets (${formatCurrency(totalBuildingValue)} ${currency}):
• Owned: ${formatCurrency(buildingAssetBreakdown.owned)} ${currency}
• Leased (Inbound): ${formatCurrency(buildingAssetBreakdown.leased)} ${currency}
• Loaned (Outbound): ${formatCurrency(buildingAssetBreakdown.loaned)} ${currency}`;

	return (
		<Box
			sx={{
				width: "100%",
				display: "flex",
				flexWrap: "nowrap",
				alignItems: "center",
				gap: 0,
				backgroundColor: "rgba(4, 4, 10, 0.75)",
				border: `1px solid ${isAdvancedView ? "rgba(123, 104, 238, 0.4)" : "rgba(123, 104, 238, 0.2)"}`,
				borderRadius: "10px",
				backdropFilter: "blur(25px)",
				py: 0.5,
				px: 0.5,
				flexShrink: 0,
				overflowX: "auto",
				"&::-webkit-scrollbar": { height: "3px" },
				"&::-webkit-scrollbar-thumb": {
					backgroundColor: "rgba(123, 104, 238, 0.3)",
					borderRadius: "4px",
				},
				"& > *:not(:last-child)": {
					borderRight: "1px solid rgba(255, 255, 255, 0.08)",
				},
			}}
		>
			<KPIMetricItem
				title="Total Assets"
				value={totalAssetsCalc}
				color={SEMANTIC_COLORS.neonPurple}
				guide={totalAssetsGuide}
				loading={loading}
				isPrimary={true}
				currency={currency}
			/>

			<KPIMetricItem
				title="Liquid Cash"
				value={liquid}
				color={SEMANTIC_COLORS.neonGreen}
				guide="Immediately available unencumbered liquid funds."
				loading={loading}
				currency={currency}
			/>

			<KPIMetricItem
				title="Inventory Assets"
				value={totalStock}
				color={SEMANTIC_COLORS.neonBlue}
				guide={inventoryGuide}
				loading={loading}
				currency={currency}
			/>

			<KPIMetricItem
				title="Ship Assets"
				value={totalShipValue}
				color="#38bdf8"
				guide={`Ship Assets (${formatCurrency(totalShipValue)} ${currency}):\nPure Ship Chassis Hull BOM replacement value across active fleet.`}
				loading={loading}
				currency={currency}
			/>

			<KPIMetricItem
				title="Building Assets"
				value={totalBuildingValue}
				color="#a78bfa"
				guide={buildingGuide}
				loading={loading}
				currency={currency}
			/>

			{isAdvancedView ? (
				<>
					<KPIMetricItem
						title="CX Buy Bids"
						value={lockedBuy}
						color={SEMANTIC_COLORS.neonGold}
						guide="Capital locked inside open CX BUY bids."
						loading={loading}
						currency={currency}
					/>
					<KPIMetricItem
						title="CX Sell Listings"
						value={lockedSell}
						color="#c084fc"
						guide="Market value of commodities actively listed on CX SELL orders."
						loading={loading}
						currency={currency}
					/>
					<KPIMetricItem
						title="Net Contracts"
						value={netPending || 0}
						color={
							(netPending || 0) >= 0
								? SEMANTIC_COLORS.neonGreen
								: SEMANTIC_COLORS.neonRed
						}
						isNet={true}
						guide="Pending Receivables minus Pending Payables."
						loading={loading}
						currency={currency}
					/>
					<KPIMetricItem
						title="Net Loans"
						value={loanMetrics.total || Number(currentData?.NetLoans || 0)}
						color="#a855f7"
						isNet={true}
						subBreakdownText={`Public: ${formatCurrency(loanMetrics.publicLoans)} | Corp: ${formatCurrency(loanMetrics.corpLoans)}`}
						guide={netLoansGuide}
						loading={loading}
						currency={currency}
					/>
				</>
			) : (
				<>
					<KPIMetricItem
						title="Encumbered (CX)"
						value={encumbered}
						color={SEMANTIC_COLORS.neonGold}
						guide="Total locked capital in open CX Buy and Sell orders."
						loading={loading}
						currency={currency}
					/>
					<KPIMetricItem
						title="Net Contracts"
						value={netPending || 0}
						color={
							(netPending || 0) >= 0
								? SEMANTIC_COLORS.neonGreen
								: SEMANTIC_COLORS.neonRed
						}
						isNet={true}
						guide="Pending Receivables minus Pending Payables."
						loading={loading}
						currency={currency}
					/>
				</>
			)}
		</Box>
	);
};
