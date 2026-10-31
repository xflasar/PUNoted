import React, { useState } from "react";
import {
	Box,
	Paper,
	Typography,
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	IconButton,
	TextField,
	InputAdornment,
	Tabs,
	Tab,
	Tooltip,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddLinkIcon from "@mui/icons-material/AddLink";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SearchIcon from "@mui/icons-material/Search";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import type { Bank, BankLoanRecord } from "../types";
import { LinkContractDialog } from "./linkcontractdialog";
import { ImportLedgerDialog } from "./importledgerdialog";
import { CheckCircleOutlineOutlined } from "@mui/icons-material";
import {
	formatAmount,
	formatBankDate,
	getTransactionTypeChipProps,
} from "../helpers";

interface BankerLoanLedgerProps {
	bank: Bank;
	loans: BankLoanRecord[];
	onRefresh: () => void;
}

export const BankerLoanLedger: React.FC<BankerLoanLedgerProps> = ({
	bank,
	loans,
	onRefresh,
}) => {
	const theme = useTheme();
	const [linkDialogOpen, setLinkDialogOpen] = useState(false);
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterTab, setFilterTab] = useState<
		"ALL" | "LOANS" | "DEPOSITS" | "WITHDRAWALS"
	>("ALL");
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text);
		setCopiedId(text);
		setTimeout(() => setCopiedId(null), 2000);
	};

	const filteredLoans = loans.filter((loan) => {
		const transType = loan.transaction_type || "LOAN";
		// Tab filter
		if (filterTab === "LOANS" && transType !== "LOAN") return false;
		if (filterTab === "DEPOSITS" && transType !== "DEPOSIT") return false;
		if (filterTab === "WITHDRAWALS" && transType !== "WITHDRAWAL") return false;

		// Text filter
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		return (
			loan.requester_username?.toLowerCase().includes(q) ||
			loan.partner_name?.toLowerCase().includes(q) ||
			loan.partner_code?.toLowerCase().includes(q) ||
			loan.contract_id?.toLowerCase().includes(q)
		);
	});

	const loansCount = loans.filter(
		(l) => (l.transaction_type || "LOAN") === "LOAN",
	).length;
	const depositsCount = loans.filter(
		(l) => l.transaction_type === "DEPOSIT",
	).length;
	const withdrawalsCount = loans.filter(
		(l) => l.transaction_type === "WITHDRAWAL",
	).length;

	return (
		<Paper
			elevation={0}
			sx={{
				p: 3,
				borderRadius: 2,
				border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
				background:
					"linear-gradient(135deg, rgba(18, 20, 32, 0.8) 0%, rgba(24, 26, 44, 0.8) 100%)",
				backdropFilter: "blur(12px)",
				display: "flex",
				flexDirection: "column",
				gap: 2.5,
			}}
		>
			{/* Top Header & Action */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 2,
				}}
			>
				<Box>
					<Typography variant="h6" sx={{ fontWeight: 800 }}>
						Bank Ledger &amp; Transactions
					</Typography>
					<Typography variant="body2" sx={{ color: "text.secondary" }}>
						Historical and live ledger with verified in-game contract snapshots
						and spreadsheet imports.
					</Typography>
				</Box>

				<Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
					<Button
						variant="outlined"
						startIcon={<UploadFileIcon />}
						onClick={() => setImportDialogOpen(true)}
						sx={{
							textTransform: "none",
							fontWeight: 700,
							px: 2,
							py: 1,
							borderRadius: 1.5,
							borderColor: alpha(theme.palette.primary.main, 0.4),
							color: theme.palette.primary.light,
							"&:hover": {
								borderColor: theme.palette.primary.main,
								bgcolor: alpha(theme.palette.primary.main, 0.08),
							},
						}}
					>
						Import CSV Ledger
					</Button>

					<Button
						variant="contained"
						color="primary"
						startIcon={<AddLinkIcon />}
						onClick={() => setLinkDialogOpen(true)}
						sx={{
							textTransform: "none",
							fontWeight: 800,
							px: 2.5,
							py: 1,
							borderRadius: 1.5,
							boxShadow: "0 4px 14px 0 rgba(123, 104, 238, 0.4)",
						}}
					>
						Record / Link Contract
					</Button>
				</Box>
			</Box>

			{/* Filters Bar */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 2,
				}}
			>
				<Tabs
					value={filterTab}
					onChange={(_, val) => setFilterTab(val)}
					textColor="primary"
					indicatorColor="primary"
					sx={{
						minHeight: 36,
						"& .MuiTab-root": { minHeight: 36, py: 0.5, fontWeight: 700 },
					}}
				>
					<Tab label={`All (${loans.length})`} value="ALL" />
					<Tab label={`Loans (${loansCount})`} value="LOANS" />
					<Tab label={`Deposits (${depositsCount})`} value="DEPOSITS" />
					<Tab
						label={`Withdrawals (${withdrawalsCount})`}
						value="WITHDRAWALS"
					/>
				</Tabs>

				<TextField
					size="small"
					placeholder="Search counterparty or contract..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
								</InputAdornment>
							),
						},
					}}
					sx={{ width: { xs: "100%", sm: 260 } }}
				/>
			</Box>

			{/* Table */}
			<TableContainer
				sx={{
					maxHeight: 520,
					borderRadius: 1.5,
					border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
				}}
			>
				<Table stickyHeader size="small">
					<TableHead>
						<TableRow>
							<TableCell
								sx={{
									fontWeight: 800,
									bgcolor: "background.paper",
									width: 110,
								}}
							>
								TYPE
							</TableCell>
							<TableCell sx={{ fontWeight: 800, bgcolor: "background.paper" }}>
								COUNTERPARTY
							</TableCell>
							<TableCell sx={{ fontWeight: 800, bgcolor: "background.paper" }}>
								AMOUNT
							</TableCell>
							<TableCell sx={{ fontWeight: 800, bgcolor: "background.paper" }}>
								TERMS
							</TableCell>
							<TableCell sx={{ fontWeight: 800, bgcolor: "background.paper" }}>
								CONTRACT LINK
							</TableCell>
							<TableCell sx={{ fontWeight: 800, bgcolor: "background.paper" }}>
								STATUS &amp; AUDIT
							</TableCell>
							<TableCell sx={{ fontWeight: 800, bgcolor: "background.paper" }}>
								DATE / DUE
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filteredLoans.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={7}
									align="center"
									sx={{ py: 6, color: "text.secondary" }}
								>
									{loans.length === 0
										? "No ledger transactions recorded yet. Use 'Import CSV Ledger' to import your existing sheet or 'Record / Link Contract' for in-game contracts."
										: "No transactions matched your filter."}
								</TableCell>
							</TableRow>
						) : (
							filteredLoans.map((loan) => {
								const isRepaid = loan.status === "REPAID";
								const isApproved = loan.status === "APPROVED";
								const amount = loan.amount || 0;
								const currency = loan.currency || "ICA";
								const contractId = loan.contract_id || "N/A";
								const typeProps = getTransactionTypeChipProps(
									loan.transaction_type,
									theme,
								);

								return (
									<TableRow
										key={loan.id}
										hover
										sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
									>
										{/* Type */}
										<TableCell>
											<Chip
												label={typeProps.label}
												size="small"
												sx={{
													fontWeight: 800,
													fontSize: "0.68rem",
													bgcolor: typeProps.bg,
													color: typeProps.color,
													border: `1px solid ${typeProps.border}`,
												}}
											/>
										</TableCell>

										{/* Counterparty */}
										<TableCell>
											<Box sx={{ display: "flex", flexDirection: "column" }}>
												<Typography variant="body2" sx={{ fontWeight: 700 }}>
													{loan.partner_code ? `[${loan.partner_code}] ` : ""}
													{loan.partner_name || loan.requester_username}
												</Typography>
												{loan.partner_name && loan.partner_code && (
													<Typography
														variant="caption"
														sx={{ color: "text.secondary" }}
													>
														User: {loan.requester_username}
													</Typography>
												)}
											</Box>
										</TableCell>

										{/* Amount */}
										<TableCell>
											<Typography
												variant="body2"
												sx={{ fontWeight: 800, color: typeProps.color }}
											>
												{amount.toLocaleString()}{" "}
												<span
													style={{
														fontSize: "0.75rem",
														color: theme.palette.text.secondary,
													}}
												>
													{currency}
												</span>
											</Typography>
										</TableCell>

										{/* Terms */}
										<TableCell>
											{loan.interest_rate > 0 ? (
												<>
													<Typography variant="body2" sx={{ fontWeight: 600 }}>
														{loan.interest_rate}%
													</Typography>
													<Typography
														variant="caption"
														sx={{ color: "text.secondary" }}
													>
														{loan.term_days ? `${loan.term_days} days` : "Open"}
													</Typography>
												</>
											) : (
												<Typography
													variant="caption"
													sx={{ color: "text.secondary" }}
												>
													Standard (0%)
												</Typography>
											)}
										</TableCell>

										{/* Contract Link */}
										<TableCell>
											{contractId !== "N/A" ? (
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.5,
													}}
												>
													<Chip
														label={contractId}
														size="small"
														variant="outlined"
														sx={{
															fontFamily: "monospace",
															fontWeight: 700,
															fontSize: "0.75rem",
															bgcolor: alpha(theme.palette.primary.main, 0.08),
															borderColor: alpha(
																theme.palette.primary.main,
																0.25,
															),
														}}
													/>
													<Tooltip
														title={
															copiedId === contractId
																? "Copied!"
																: "Copy Local ID"
														}
													>
														<IconButton
															size="small"
															onClick={() => handleCopy(contractId)}
														>
															<ContentCopyIcon sx={{ fontSize: 14 }} />
														</IconButton>
													</Tooltip>
												</Box>
											) : (
												<Typography
													variant="caption"
													sx={{ color: "text.secondary" }}
												>
													No contract
												</Typography>
											)}
											{loan.contract_status && (
												<Typography
													variant="caption"
													sx={{
														color: "text.secondary",
														display: "block",
														mt: 0.2,
													}}
												>
													PrUn: {loan.contract_status}
												</Typography>
											)}
										</TableCell>

										{/* Status & Audit */}
										<TableCell>
											<Box
												sx={{
													display: "flex",
													flexDirection: "column",
													gap: 0.5,
													alignItems: "flex-start",
												}}
											>
												{isRepaid ? (
													<Chip
														icon={
															<CheckCircleOutlineOutlined
																sx={{ fontSize: "14px !important" }}
															/>
														}
														label="REPAID"
														size="small"
														color="success"
														sx={{
															fontWeight: 700,
															fontSize: "0.68rem",
															height: 22,
														}}
													/>
												) : isApproved ? (
													<Chip
														icon={
															<HourglassTopIcon
																sx={{ fontSize: "14px !important" }}
															/>
														}
														label="ACTIVE"
														size="small"
														color="warning"
														sx={{
															fontWeight: 700,
															fontSize: "0.68rem",
															height: 22,
														}}
													/>
												) : (
													<Chip
														label={loan.status}
														size="small"
														color={
															loan.status === "REJECTED" ? "error" : "info"
														}
														sx={{
															fontWeight: 700,
															fontSize: "0.68rem",
															height: 22,
														}}
													/>
												)}

												{/* Verification indicator */}
												{loan.is_verified ? (
													<Tooltip title="Verified: Backed by in-game contract snapshot in PUNoted">
														<Chip
															icon={
																<VerifiedUserIcon
																	sx={{
																		fontSize: "12px !important",
																		color: "#34d399 !important",
																	}}
																/>
															}
															label="Verified"
															size="small"
															variant="outlined"
															sx={{
																fontSize: "0.65rem",
																height: 20,
																color: "#34d399",
																borderColor: alpha("#34d399", 0.3),
																bgcolor: alpha("#10b981", 0.05),
															}}
														/>
													</Tooltip>
												) : (
													<Tooltip title="Self-Reported: Imported from spreadsheet or recorded without verified contract snapshot">
														<Chip
															icon={
																<HistoryEduIcon
																	sx={{
																		fontSize: "12px !important",
																		color: "#94a3b8 !important",
																	}}
																/>
															}
															label="Self-Reported"
															size="small"
															variant="outlined"
															sx={{
																fontSize: "0.65rem",
																height: 20,
																color: "#94a3b8",
																borderColor: alpha("#94a3b8", 0.3),
																bgcolor: alpha("#94a3b8", 0.05),
															}}
														/>
													</Tooltip>
												)}
											</Box>
										</TableCell>

										{/* Created / Due */}
										<TableCell>
											<Typography
												variant="caption"
												sx={{ display: "block", color: "text.primary" }}
											>
												{formatBankDate(loan.created_at)}
											</Typography>
											{loan.contract_duedate ? (
												<Typography
													variant="caption"
													sx={{ color: "warning.main", display: "block" }}
												>
													Due: {formatBankDate(loan.contract_duedate)}
												</Typography>
											) : loan.term_days ? (
												<Typography
													variant="caption"
													sx={{ color: "text.secondary", display: "block" }}
												>
													Term: {loan.term_days}d
												</Typography>
											) : null}
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</TableContainer>

			{/* Link Contract Dialog */}
			<LinkContractDialog
				open={linkDialogOpen}
				bank={bank}
				onClose={() => setLinkDialogOpen(false)}
				onSuccess={() => {
					onRefresh();
				}}
			/>

			{/* Import CSV Ledger Dialog */}
			<ImportLedgerDialog
				open={importDialogOpen}
				bankId={bank.id}
				bankName={bank.name}
				onClose={() => setImportDialogOpen(false)}
				onSuccess={() => {
					onRefresh();
				}}
			/>
		</Paper>
	);
};
