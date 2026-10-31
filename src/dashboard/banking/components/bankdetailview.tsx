import React, { useState, useEffect, useCallback } from "react";
import {
	Box,
	Paper,
	Typography,
	Button,
	Chip,
	Tabs,
	Tab,
	Tooltip,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddLinkIcon from "@mui/icons-material/AddLink";
import EditIcon from "@mui/icons-material/Edit";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CalculateIcon from "@mui/icons-material/Calculate";
import CircleIcon from "@mui/icons-material/Circle";

import type { Bank, BankLoanRecord, BankYieldMetrics } from "../types";
import { fetchClient } from "../../../utils/apiclient";
import { formatAmount } from "../../../utils/formaters";
import { getOwnerActiveStatus } from "../helpers";
import { BankDescriptionViewer } from "./bankdescriptionviewer";
import { BankDetailMetrics } from "./bankdetailmetrics";
import { BankDetailLedger } from "./bankdetailledger";
import { BankDepositorsTab } from "./bankdepositorstab";
import { BankPnlView } from "./bankpnlview";
import { ConfigureVaultDialog } from "./configurevaultdialog";
import { LinkContractDialog } from "./linkcontractdialog";
import { ImportLedgerDialog } from "./importledgerdialog";
import { ManualDepositDialog } from "./manualdepositdialog";

interface BankDetailViewProps {
	bank: Bank;
	isMyBank: boolean;
	onBack: () => void;
	onBankUpdated: () => void;
}

export const BankDetailView: React.FC<BankDetailViewProps> = ({
	bank,
	isMyBank,
	onBack,
	onBankUpdated,
}) => {
	const theme = useTheme();
	const [loans, setLoans] = useState<BankLoanRecord[]>([]);
	const [loadingLoans, setLoadingLoans] = useState(true);
	const [metrics, setMetrics] = useState<BankYieldMetrics | null>(null);
	const [depositorsCount, setDepositorsCount] = useState<number | null>(null);
	const [viewTab, setViewTab] = useState<"LEDGER" | "DEPOSITORS" | "PNL">(
		"LEDGER",
	);

	// Modals
	const [linkDialogOpen, setLinkDialogOpen] = useState(false);
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [manualDepositOpen, setManualDepositOpen] = useState(false);
	const [editVaultOpen, setEditVaultOpen] = useState(false);

	const loadLoans = useCallback(async () => {
		setLoadingLoans(true);
		try {
			const res = await fetchClient(
				`/internal/banking/loans/received?bank_id=${bank.id}`,
			);
			const data: BankLoanRecord[] = res.ok ? await res.json() : [];
			const seen = new Set<number>();
			const unique = (data || []).filter((item) => {
				if (seen.has(item.id)) return false;
				seen.add(item.id);
				return true;
			});
			setLoans(unique);
		} catch (e) {
			console.error("Failed to load bank loans", e);
		} finally {
			setLoadingLoans(false);
		}
	}, [bank.id]);

	const loadMetrics = useCallback(async () => {
		try {
			const res = await fetchClient(
				`/internal/banking/depositors?bank_id=${bank.id}`,
			);
			if (res.ok) {
				const data = await res.json();
				if (data && data.metrics) {
					setMetrics(data.metrics);
				}
				if (data && data.depositors && Array.isArray(data.depositors)) {
					setDepositorsCount(data.depositors.length);
				}
			}
		} catch (e) {
			console.error("Failed to load bank yield metrics", e);
		}
	}, [bank.id]);

	useEffect(() => {
		loadLoans();
		loadMetrics();
	}, [loadLoans, loadMetrics]);

	// Compute metrics
	const currentMoney = bank.liquidity || 0;
	const loanItems = loans.filter(
		(l) => (l.transaction_type || "LOAN") === "LOAN",
	);
	const lentCount =
		loanItems.length > 0
			? loanItems.length
			: (bank.total_loans_count ?? bank.active_loans_count ?? 0);
	const totalLentAmount =
		loanItems.length > 0
			? loanItems.reduce((acc, l) => acc + (l.amount || 0), 0)
			: (bank.total_lent_amount ?? 0);

	const isSettled = (st: string) =>
		st === "APPROVED" || st === "REPAID" || st === "FULFILLED";
	const isClient = (u: string) =>
		(u || "").toLowerCase() !== (bank.owner_username || "").toLowerCase();

	const deposits = loans.filter(
		(l) => l.transaction_type === "DEPOSIT" && isSettled(l.status),
	);
	const clientDeposits = deposits.filter((l) => isClient(l.requester_username));
	const clientWithdrawals = loans.filter(
		(l) =>
			l.transaction_type === "WITHDRAWAL" &&
			isSettled(l.status) &&
			isClient(l.requester_username),
	);

	const grossClientDeposited = clientDeposits.reduce(
		(acc, l) => acc + (l.amount || 0),
		0,
	);
	const grossClientWithdrawn = clientWithdrawals.reduce(
		(acc, l) => acc + (l.amount || 0),
		0,
	);

	const netCustomerDeposits =
		metrics?.client_deposits !== undefined
			? metrics.client_deposits
			: Math.max(0, grossClientDeposited - grossClientWithdrawn);

	// Profit & Solvency Summary
	const loanOnlyList = loans.filter(
		(l) => (l.transaction_type || "LOAN") === "LOAN",
	);
	const repaidLoans = loanOnlyList.filter((l) => l.status === "REPAID");
	const activeLoans = loanOnlyList.filter((l) => l.status === "APPROVED");

	const collectedInterest = repaidLoans.reduce((sum, l) => {
		const r = l.interest_rate ?? bank.default_interest_rate ?? 1.5;
		return sum + (l.amount || 0) * (r / 100.0);
	}, 0);

	const weeklyInterestRunRate = activeLoans.reduce((sum, l) => {
		const r = l.interest_rate ?? bank.default_interest_rate ?? 1.5;
		const termDays = l.term_days || 14;
		const weeks = Math.max(1, termDays / 7);
		return sum + ((l.amount || 0) * (r / 100.0)) / weeks;
	}, 0);

	const weeklyClientYieldCost = metrics?.est_weekly_payout_pool ?? 0.0;
	const netWeeklySpread = weeklyInterestRunRate - weeklyClientYieldCost;

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pb: 2 }}>
			{/* Top Bar with Back Button & Action Controls */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 1,
				}}
			>
				<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
					<Button
						startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
						onClick={onBack}
						variant="outlined"
						size="small"
						sx={{
							textTransform: "none",
							fontWeight: 700,
							borderColor: alpha(theme.palette.divider, 0.3),
							color: "text.primary",
							"&:hover": { borderColor: theme.palette.primary.main },
						}}
					>
						Back to Banks
					</Button>

					{isMyBank && (
						<Button
							startIcon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
							onClick={() => setViewTab(viewTab === "PNL" ? "LEDGER" : "PNL")}
							variant={viewTab === "PNL" ? "contained" : "outlined"}
							color="success"
							size="small"
							sx={{
								textTransform: "none",
								fontWeight: 800,
								fontSize: "0.75rem",
							}}
						>
							Profit &amp; Solvency
						</Button>
					)}
				</Box>

				{isMyBank && (
					<Box
						sx={{
							display: "flex",
							gap: 1,
							alignItems: "center",
							flexWrap: "wrap",
						}}
					>
						<Button
							size="small"
							variant="outlined"
							color="info"
							startIcon={<UploadFileIcon sx={{ fontSize: 15 }} />}
							onClick={() => setImportDialogOpen(true)}
							sx={{
								textTransform: "none",
								fontWeight: 700,
								fontSize: "0.75rem",
							}}
						>
							Import CSV Ledger
						</Button>
						<Button
							size="small"
							variant="outlined"
							color="primary"
							startIcon={<EditIcon sx={{ fontSize: 15 }} />}
							onClick={() => setEditVaultOpen(true)}
							sx={{
								textTransform: "none",
								fontWeight: 700,
								fontSize: "0.75rem",
							}}
						>
							Configure Vault
						</Button>
						<Button
							size="small"
							variant="outlined"
							color="primary"
							startIcon={<SavingsOutlinedIcon sx={{ fontSize: 15 }} />}
							onClick={() => setManualDepositOpen(true)}
							sx={{
								textTransform: "none",
								fontWeight: 700,
								fontSize: "0.75rem",
							}}
						>
							Manual Deposit
						</Button>
						<Button
							size="small"
							variant="contained"
							color="primary"
							startIcon={<AddLinkIcon sx={{ fontSize: 15 }} />}
							onClick={() => setLinkDialogOpen(true)}
							sx={{
								textTransform: "none",
								fontWeight: 800,
								fontSize: "0.75rem",
							}}
						>
							Link Contract
						</Button>
					</Box>
				)}
			</Box>

			{/* Main Bank Card */}
			<Paper
				elevation={0}
				sx={{
					borderRadius: 2,
					border: `1.5px solid ${alpha(theme.palette.primary.main, 0.35)}`,
					bgcolor: alpha(theme.palette.background.paper, 0.5),
					backdropFilter: "blur(14px)",
					overflow: "hidden",
				}}
			>
				{/* Bank Header Title & Tagline */}
				<Box
					sx={{
						py: 2,
						px: 2.5,
						textAlign: "center",
						borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
						bgcolor: alpha(theme.palette.background.default, 0.6),
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyCenter: "center",
							gap: 1.5,
							flexWrap: "wrap",
							justifyContent: "center",
						}}
					>
						<Typography
							variant="h4"
							sx={{
								fontWeight: 900,
								letterSpacing: 1.5,
								color: theme.palette.text.primary,
								textTransform: "uppercase",
								lineHeight: 1.2,
							}}
						>
							{bank.name}
						</Typography>
						{bank.is_public === false && (
							<Chip
								label="UNLISTED / PRIVATE"
								size="small"
								color="warning"
								variant="outlined"
								sx={{ fontWeight: 800, fontSize: "0.65rem", height: 20 }}
							/>
						)}
					</Box>

					{bank.headline && (
						<Typography
							variant="subtitle2"
							sx={{ color: "primary.main", fontWeight: 700, mt: 0.3 }}
						>
							"{bank.headline}"
						</Typography>
					)}

					{(() => {
						const ownerActivity = getOwnerActiveStatus(
							bank.owner_last_active,
							bank.owner_is_synchronized !== false,
						);
						return (
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									gap: 0.75,
									mt: 0.3,
									flexWrap: "wrap",
								}}
							>
								<Typography variant="caption" sx={{ color: "text.secondary" }}>
									Operator:{" "}
									<strong style={{ color: theme.palette.text.primary }}>
										{bank.owner_username}
									</strong>
								</Typography>
								<Tooltip
									title={`Banker Status: ${ownerActivity.label} (Synced: ${bank.owner_is_synchronized !== false ? "Yes" : "No"})`}
								>
									<Box
										sx={{
											display: "inline-flex",
											alignItems: "center",
											gap: 0.4,
											px: 0.6,
											py: 0.15,
											borderRadius: 1,
											bgcolor: alpha(ownerActivity.dotColor, 0.1),
											border: `1px solid ${alpha(ownerActivity.dotColor, 0.25)}`,
										}}
									>
										<CircleIcon
											sx={{ fontSize: 6, color: ownerActivity.dotColor }}
										/>
										<Typography
											variant="caption"
											sx={{
												color: ownerActivity.color,
												fontWeight: 700,
												fontSize: "0.65rem",
												lineHeight: 1,
											}}
										>
											{ownerActivity.label}
										</Typography>
									</Box>
								</Tooltip>
							</Box>
						);
					})()}

					{/* Lending Policies Accordion */}
					<BankDescriptionViewer
						description={bank.description}
						bankName={bank.name}
					/>
				</Box>

				{/* Modular Vault Metrics Component */}
				<BankDetailMetrics
					bank={bank}
					currentMoney={currentMoney}
					lentCount={lentCount}
					totalLentAmount={totalLentAmount}
					netCustomerDeposits={netCustomerDeposits}
				/>

				{/* Executive Profit & Solvency Summary Strip (Owner Only) */}
				{isMyBank && (
					<Box
						sx={{
							py: 1.25,
							px: 2.5,
							borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
							bgcolor:
								netWeeklySpread >= 0
									? alpha("#10b981", 0.06)
									: alpha("#ef4444", 0.06),
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							flexWrap: "wrap",
							gap: 1.5,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
							{netWeeklySpread >= 0 ? (
								<TrendingUpIcon sx={{ fontSize: 28, color: "#34d399" }} />
							) : (
								<TrendingDownIcon sx={{ fontSize: 28, color: "#f87171" }} />
							)}
							<Box>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<Typography
										variant="subtitle2"
										sx={{ fontWeight: 900, fontSize: "0.88rem" }}
									>
										Net Spread: {netWeeklySpread >= 0 ? "+" : ""}
										{formatAmount(netWeeklySpread)} {bank.currency || "ICA"} /
										wk
									</Typography>
									<Chip
										label={
											netWeeklySpread >= 0
												? "PROFITABLE SPREAD"
												: "NET CASH DEFICIT"
										}
										size="small"
										sx={{
											fontWeight: 800,
											fontSize: "0.62rem",
											height: 18,
											bgcolor:
												netWeeklySpread >= 0
													? alpha("#10b981", 0.2)
													: alpha("#ef4444", 0.2),
											color: netWeeklySpread >= 0 ? "#34d399" : "#f87171",
										}}
									/>
								</Box>
								<Typography
									variant="caption"
									sx={{ color: "text.secondary", fontSize: "0.72rem" }}
								>
									+{formatAmount(collectedInterest)} {bank.currency || "ICA"}{" "}
									collected profit &bull; -{formatAmount(weeklyClientYieldCost)}{" "}
									{bank.currency || "ICA"}/wk depositor yield cost
								</Typography>
							</Box>
						</Box>

						<Button
							size="small"
							variant={viewTab === "PNL" ? "contained" : "outlined"}
							color={viewTab === "PNL" ? "primary" : "inherit"}
							startIcon={<CalculateIcon sx={{ fontSize: 15 }} />}
							onClick={() => setViewTab("PNL")}
							sx={{
								textTransform: "none",
								fontWeight: 800,
								fontSize: "0.72rem",
								borderColor: alpha(theme.palette.divider, 0.3),
							}}
						>
							{viewTab === "PNL"
								? "Viewing Full P&L & Simulator"
								: "Open Full P&L & Simulator"}
						</Button>
					</Box>
				)}

				{/* View Navigation Tabs: Ledger vs Depositors vs Profit & Solvency */}
				<Box
					sx={{
						borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
						px: 2,
						bgcolor: alpha(theme.palette.background.default, 0.5),
					}}
				>
					<Tabs
						value={viewTab}
						onChange={(_, val) => setViewTab(val)}
						textColor="primary"
						indicatorColor="primary"
						sx={{
							minHeight: 38,
							"& .MuiTab-root": {
								minHeight: 38,
								py: 0.5,
								fontWeight: 800,
								textTransform: "none",
								fontSize: "0.82rem",
							},
						}}
					>
						<Tab
							label={`Transaction Ledger (${loans.length})`}
							value="LEDGER"
						/>
						{isMyBank && (
							<Tab
								label={`Depositors & Capital Growth (${depositorsCount ?? bank.depositors_count ?? (deposits.length > 0 ? new Set(deposits.map((d) => d.requester_username)).size : 0)})`}
								value="DEPOSITORS"
							/>
						)}
						{isMyBank && (
							<Tab
								icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
								iconPosition="start"
								label="Profit & Solvency"
								value="PNL"
							/>
						)}
					</Tabs>
				</Box>

				{/* Tab Panels */}
				{isMyBank && viewTab === "DEPOSITORS" ? (
					<Box sx={{ p: 2 }}>
						<BankDepositorsTab bank={bank} isMyBank={isMyBank} />
					</Box>
				) : isMyBank && viewTab === "PNL" ? (
					<BankPnlView bank={bank} loans={loans} metrics={metrics} />
				) : (
					<BankDetailLedger
						loans={loans}
						loading={loadingLoans}
						currency={bank.currency}
						isOwner={isMyBank}
						defaultInterestRate={bank.default_interest_rate ?? 1.5}
					/>
				)}
			</Paper>

			{/* Dialogs */}
			{isMyBank && (
				<>
					<LinkContractDialog
						open={linkDialogOpen}
						bank={bank}
						onClose={() => setLinkDialogOpen(false)}
						onSuccess={() => {
							loadLoans();
							loadMetrics();
							onBankUpdated();
						}}
					/>

					<ImportLedgerDialog
						open={importDialogOpen}
						bankId={bank.id}
						bankName={bank.name}
						onClose={() => setImportDialogOpen(false)}
						onSuccess={() => {
							loadLoans();
							loadMetrics();
							onBankUpdated();
						}}
					/>

					<ManualDepositDialog
						open={manualDepositOpen}
						bank={bank}
						onClose={() => setManualDepositOpen(false)}
						onSuccess={() => {
							loadLoans();
							loadMetrics();
							onBankUpdated();
						}}
					/>

					<ConfigureVaultDialog
						open={editVaultOpen}
						bank={bank}
						onClose={() => setEditVaultOpen(false)}
						onBankUpdated={() => {
							loadMetrics();
							onBankUpdated();
						}}
					/>
				</>
			)}
		</Box>
	);
};
