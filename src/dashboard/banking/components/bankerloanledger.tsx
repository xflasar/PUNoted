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
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	CircularProgress,
	Alert,
	useTheme,
	useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddLinkIcon from "@mui/icons-material/AddLink";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SearchIcon from "@mui/icons-material/Search";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import SouthWestIcon from "@mui/icons-material/SouthWest";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import type { Bank, BankLoanRecord } from "../types";
import { LinkContractDialog } from "./linkcontractdialog";
import { ImportLedgerDialog } from "./importledgerdialog";
import { EditLoanDialog } from "./editloandialog";
import { RelinkContractDialog } from "./relinkcontractdialog";
import { fetchClient } from "../../../utils/apiclient";
import {
	formatAmount,
	formatBankDate,
	getTransactionTypeChipProps,
	getLoanStatusChipProps,
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
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [linkDialogOpen, setLinkDialogOpen] = useState(false);
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterTab, setFilterTab] = useState<
		"ALL" | "LOANS" | "DEPOSITS" | "WITHDRAWALS"
	>("ALL");
	const [copiedId, setCopiedId] = useState<string | null>(null);

	// Action menu & dialog states
	const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
	const [activeLoan, setActiveLoan] = useState<BankLoanRecord | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [relinkDialogOpen, setRelinkDialogOpen] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const handleOpenMenu = (
		event: React.MouseEvent<HTMLElement>,
		loan: BankLoanRecord,
	) => {
		setMenuAnchorEl(event.currentTarget);
		setActiveLoan(loan);
	};

	const handleCloseMenu = () => {
		setMenuAnchorEl(null);
	};

	const handleTriggerEdit = () => {
		handleCloseMenu();
		setEditDialogOpen(true);
	};

	const handleTriggerRelink = () => {
		handleCloseMenu();
		setRelinkDialogOpen(true);
	};

	const handleTriggerDelete = () => {
		handleCloseMenu();
		setDeleteError(null);
		setDeleteConfirmOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!activeLoan) return;
		setIsDeleting(true);
		setDeleteError(null);
		try {
			const res = await fetchClient(
				`/internal/banking/loans/${activeLoan.id}`,
				{
					method: "DELETE",
				},
			);
			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.detail || "Failed to delete transaction");
			}
			setDeleteConfirmOpen(false);
			setActiveLoan(null);
			onRefresh();
		} catch (err: any) {
			setDeleteError(err.message || "Failed to delete");
		} finally {
			setIsDeleting(false);
		}
	};

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

			{/* Table (Desktop) */}
			{!isMobile && (
				<TableContainer
					sx={{
						maxHeight: 520,
						overflowX: "hidden",
						borderRadius: 1.5,
						border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
					}}
				>
					<Table
						stickyHeader
						size="small"
						sx={{
							width: "100%",
							tableLayout: "fixed",
						}}
					>
						<TableHead>
							<TableRow>
								<TableCell
									sx={{
										fontWeight: 800,
										bgcolor: "background.paper",
										width: "10%",
										py: 0.8,
										px: 1,
										fontSize: "0.68rem",
									}}
								>
									TYPE
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										bgcolor: "background.paper",
										width: "18%",
										py: 0.8,
										px: 1,
										fontSize: "0.68rem",
									}}
								>
									COUNTERPARTY
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										bgcolor: "background.paper",
										width: "18%",
										py: 0.8,
										px: 1,
										fontSize: "0.68rem",
									}}
								>
									AMOUNT
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										bgcolor: "background.paper",
										width: "14%",
										py: 0.8,
										px: 1,
										fontSize: "0.68rem",
									}}
								>
									TERMS
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										bgcolor: "background.paper",
										width: "15%",
										py: 0.8,
										px: 1,
										fontSize: "0.68rem",
									}}
								>
									CONTRACT
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										bgcolor: "background.paper",
										width: "15%",
										py: 0.8,
										px: 1,
										fontSize: "0.68rem",
									}}
								>
									STATUS
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										bgcolor: "background.paper",
										width: "6%",
										py: 0.8,
										px: 0.5,
										fontSize: "0.68rem",
									}}
								>
									DATE
								</TableCell>
								<TableCell
									align="right"
									sx={{
										fontWeight: 800,
										bgcolor: "background.paper",
										width: "4%",
										py: 0.8,
										px: 0.5,
										fontSize: "0.68rem",
									}}
								>
									ACT
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{filteredLoans.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={8}
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
											{/* Type (Badge & Icon) */}
											<TableCell sx={{ py: 0.8, px: 1 }}>
												<Tooltip
													title={
														loan.transaction_type === "DEPOSIT"
															? "Deposit: Inflow to bank vault"
															: loan.transaction_type === "WITHDRAWAL"
																? "Withdrawal: Outflow from bank vault"
																: "Loan: Capital disbursed to borrower"
													}
												>
													<Chip
														icon={
															loan.transaction_type === "DEPOSIT" ? (
																<SouthWestIcon
																	sx={{
																		fontSize: "12px !important",
																		color: "inherit !important",
																	}}
																/>
															) : loan.transaction_type === "WITHDRAWAL" ? (
																<NorthEastIcon
																	sx={{
																		fontSize: "12px !important",
																		color: "inherit !important",
																	}}
																/>
															) : (
																<ArrowUpwardIcon
																	sx={{
																		fontSize: "12px !important",
																		color: "inherit !important",
																	}}
																/>
															)
														}
														label={typeProps.label}
														size="small"
														sx={{
															fontWeight: 800,
															fontSize: "0.65rem",
															height: 22,
															bgcolor: typeProps.bg,
															color: typeProps.color,
															border: `1px solid ${typeProps.border}`,
														}}
													/>
												</Tooltip>
											</TableCell>

											{/* Counterparty */}
											<TableCell sx={{ py: 0.8, px: 1 }}>
												<Box sx={{ display: "flex", flexDirection: "column" }}>
													<Typography
														variant="body2"
														sx={{
															fontWeight: 800,
															fontSize: "0.8rem",
															whiteSpace: "nowrap",
															overflow: "hidden",
															textOverflow: "ellipsis",
														}}
													>
														{loan.partner_code ? (
															<span
																style={{ color: theme.palette.primary.main }}
															>
																[{loan.partner_code}]{" "}
															</span>
														) : (
															""
														)}
														{loan.partner_name || loan.requester_username}
													</Typography>
													{loan.partner_name &&
														loan.partner_code &&
														loan.requester_username !== loan.partner_name && (
															<Typography
																variant="caption"
																sx={{
																	color: "text.secondary",
																	fontSize: "0.65rem",
																	whiteSpace: "nowrap",
																	overflow: "hidden",
																	textOverflow: "ellipsis",
																}}
															>
																@{loan.requester_username}
															</Typography>
														)}
												</Box>
											</TableCell>

											{/* Amount + Payout Icon */}
											<TableCell sx={{ py: 0.8, px: 1 }}>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.6,
														flexWrap: "wrap",
													}}
												>
													<Typography
														variant="body2"
														sx={{
															fontWeight: 900,
															color: typeProps.color,
															fontSize: "0.82rem",
															letterSpacing: "-0.01em",
														}}
													>
														{amount.toLocaleString()}{" "}
														<span
															style={{ fontSize: "0.68rem", opacity: 0.75 }}
														>
															{currency}
														</span>
													</Typography>

													{(loan.transaction_type || "LOAN") === "LOAN" && (
														<>
															{/* Payout Icon */}
															{loan.payout_fulfilled ? (
																<Tooltip title="Principal Disbursed: Initial loan funds sent to borrower">
																	<CheckCircleIcon
																		sx={{ fontSize: 14, color: "#34d399" }}
																	/>
																</Tooltip>
															) : (
																<Tooltip title="Awaiting Payout: Contract accepted, awaiting loan disbursement">
																	<HourglassTopIcon
																		sx={{ fontSize: 14, color: "#f59e0b" }}
																	/>
																</Tooltip>
															)}
														</>
													)}
												</Box>
											</TableCell>

											{/* Terms & Structure (Badge & Icon First) */}
											<TableCell sx={{ py: 0.8, px: 1 }}>
												{(loan.transaction_type || "LOAN") === "LOAN" ? (
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 0.5,
															flexWrap: "wrap",
														}}
													>
														{/* Rate Chip */}
														<Box
															component="span"
															sx={{
																fontSize: "0.68rem",
																fontWeight: 800,
																px: 0.6,
																py: 0.1,
																borderRadius: 0.8,
																bgcolor: alpha(
																	theme.palette.primary.main,
																	0.12,
																),
																color: theme.palette.primary.light,
															}}
														>
															{loan.interest_rate}%
														</Box>

														{/* Term Days */}
														<Typography
															variant="caption"
															sx={{
																color: "text.secondary",
																fontSize: "0.65rem",
																fontWeight: 600,
															}}
														>
															{loan.term_days ? `${loan.term_days}d` : "Open"}
														</Typography>

														{/* Loan Structure Icon Badge */}
														{loan.loan_structure === "INTEREST_ONLY" ? (
															<Tooltip title="Interest-Only Loan: Regular installments pay interest only. Principal repaid at maturity!">
																<Box
																	component="span"
																	sx={{
																		display: "inline-flex",
																		alignItems: "center",
																		gap: 0.3,
																		px: 0.5,
																		py: 0.1,
																		borderRadius: 0.8,
																		bgcolor: alpha("#f59e0b", 0.12),
																		color: "#fbbf24",
																		border: `1px solid ${alpha("#f59e0b", 0.3)}`,
																		fontSize: "0.6rem",
																		fontWeight: 800,
																	}}
																>
																	<AccountBalanceWalletIcon
																		sx={{ fontSize: 10 }}
																	/>
																	IO
																</Box>
															</Tooltip>
														) : loan.loan_structure === "AMORTIZING_STABLE" ? (
															<Tooltip title="Stable Loan: Both principal and interest are paid in amortized installments.">
																<Box
																	component="span"
																	sx={{
																		display: "inline-flex",
																		alignItems: "center",
																		gap: 0.3,
																		px: 0.5,
																		py: 0.1,
																		borderRadius: 0.8,
																		bgcolor: alpha("#10b981", 0.12),
																		color: "#34d399",
																		border: `1px solid ${alpha("#10b981", 0.3)}`,
																		fontSize: "0.6rem",
																		fontWeight: 800,
																	}}
																>
																	<TrendingDownIcon sx={{ fontSize: 10 }} />
																	AMORT
																</Box>
															</Tooltip>
														) : null}
													</Box>
												) : (
													<Typography
														variant="caption"
														sx={{
															color: "text.secondary",
															fontSize: "0.7rem",
															fontWeight: 600,
														}}
													>
														{loan.transaction_type === "DEPOSIT"
															? "↓ Vault Inflow"
															: "↑ Vault Outflow"}
													</Typography>
												)}
											</TableCell>

											{/* Contract Link + Verified Icon */}
											<TableCell sx={{ py: 0.8, px: 1 }}>
												{contractId !== "N/A" ? (
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 0.5,
														}}
													>
														<Tooltip
															title={
																copiedId === contractId
																	? "Copied!"
																	: "Click to copy Contract ID"
															}
														>
															<Chip
																label={contractId}
																size="small"
																onClick={() => handleCopy(contractId)}
																clickable
																variant="outlined"
																sx={{
																	fontFamily: "monospace",
																	fontWeight: 800,
																	fontSize: "0.7rem",
																	height: 22,
																	bgcolor: alpha(
																		theme.palette.background.paper,
																		0.6,
																	),
																}}
															/>
														</Tooltip>

														{/* Verified Badge Icon */}
														{loan.is_verified ? (
															<Tooltip title="Verified: Backed by in-game contract snapshot in PUNoted">
																<VerifiedUserIcon
																	sx={{ fontSize: 16, color: "#34d399" }}
																/>
															</Tooltip>
														) : (
															<Tooltip title="Self-Reported: Imported from spreadsheet or recorded without verified contract snapshot">
																<HistoryEduIcon
																	sx={{ fontSize: 16, color: "#94a3b8" }}
																/>
															</Tooltip>
														)}

														{/* PrUn Contract Status Indicator */}
														{loan.contract_status &&
															loan.contract_status !== "FULFILLED" && (
																<Tooltip
																	title={`In-game status: ${loan.contract_status}`}
																>
																	<Box
																		component="span"
																		sx={{
																			width: 7,
																			height: 7,
																			borderRadius: "50%",
																			bgcolor:
																				loan.contract_status ===
																				"PARTIALLY_FULFILLED"
																					? "#38bdf8"
																					: "#fbbf24",
																		}}
																	/>
																</Tooltip>
															)}
													</Box>
												) : (
													<Tooltip title="No game contract linked yet">
														<Typography
															variant="caption"
															sx={{
																color: "text.secondary",
																fontSize: "0.75rem",
															}}
														>
															—
														</Typography>
													</Tooltip>
												)}
											</TableCell>

											{/* Status & Installments */}
											<TableCell sx={{ py: 0.8, px: 1 }}>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.6,
														flexWrap: "wrap",
													}}
												>
													{/* Compact Status Pill */}
													<Tooltip
														title={
															isRepaid
																? "Fully settled & fulfilled"
																: loan.status === "APPROVED"
																	? (loan.fulfilled_installments || 0) > 0
																		? `Active loan in repayment (${loan.fulfilled_installments || 0}/${loan.total_installments || 0} installments paid)`
																		: "Active loan (Principal disbursed)"
																	: loan.status === "ACCEPTED"
																		? "Accepted by borrower, awaiting initial payout disbursement"
																		: loan.status
														}
													>
														<Chip
															label={
																isRepaid
																	? "REPAID"
																	: loan.status === "APPROVED" &&
																		  (loan.transaction_type || "LOAN") ===
																				"LOAN"
																		? (loan.fulfilled_installments || 0) > 0 ||
																			(loan.repaid_amount || 0) > 0
																			? "REPAYING"
																			: "ACTIVE"
																		: loan.status === "ACCEPTED" &&
																			  (loan.transaction_type || "LOAN") ===
																					"LOAN"
																			? "ACCEPTED"
																			: loan.status
															}
															size="small"
															color={
																isRepaid
																	? "success"
																	: loan.status === "APPROVED"
																		? "primary"
																		: loan.status === "ACCEPTED"
																			? "info"
																			: loan.status === "REJECTED"
																				? "error"
																				: "default"
															}
															sx={{
																fontWeight: 800,
																fontSize: "0.64rem",
																height: 20,
															}}
														/>
													</Tooltip>

													{/* Mini Installment Counter Pill */}
													{(loan.total_installments || 0) > 0 && (
														<Tooltip
															title={`Installments: ${loan.fulfilled_installments || 0} of ${loan.total_installments} completed${loan.repaid_amount ? ` • Repaid: ${formatAmount(loan.repaid_amount)} ${currency}` : ""}`}
														>
															<Box
																component="span"
																sx={{
																	fontSize: "0.62rem",
																	fontWeight: 800,
																	px: 0.6,
																	py: 0.1,
																	borderRadius: 1,
																	bgcolor: alpha(theme.palette.divider, 0.1),
																	color: "text.secondary",
																	fontFamily: "monospace",
																}}
															>
																{loan.fulfilled_installments || 0}/
																{loan.total_installments}
															</Box>
														</Tooltip>
													)}
												</Box>
											</TableCell>

											{/* Created / Due */}
											<TableCell sx={{ py: 0.8, px: 0.5 }}>
												<Tooltip
													title={`Recorded: ${loan.created_at ? formatBankDate(loan.created_at) : "N/A"}${loan.due_date ? ` • Due: ${formatBankDate(loan.due_date)}` : ""}`}
												>
													<Typography
														variant="caption"
														sx={{
															color: "text.secondary",
															fontSize: "0.65rem",
															display: "block",
															whiteSpace: "nowrap",
														}}
													>
														{loan.created_at
															? formatBankDate(loan.created_at).split(" ")[0]
															: "—"}
													</Typography>
												</Tooltip>
											</TableCell>

											{/* Actions */}
											<TableCell align="right">
												<IconButton
													size="small"
													onClick={(e) => handleOpenMenu(e, loan)}
													sx={{
														color: "text.secondary",
														"&:hover": { color: "text.primary" },
													}}
												>
													<MoreVertIcon fontSize="small" />
												</IconButton>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{/* Transactions Card List (Mobile) */}
			{isMobile && (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 1.5,
						maxHeight: 520,
						overflowY: "auto",
					}}
				>
					{filteredLoans.length === 0 ? (
						<Typography
							align="center"
							sx={{ py: 4, color: "text.secondary", fontSize: "0.85rem" }}
						>
							No transactions found.
						</Typography>
					) : (
						filteredLoans.map((loan) => {
							const contractId = loan.contract_id || "N/A";
							const amount = loan.amount || 0;
							const currency = loan.currency || bank.currency;
							const statusProps = getLoanStatusChipProps(
								loan.status,
								loan.transaction_type,
							);
							const isRepaid = loan.status === "REPAID";
							const typeProps = getTransactionTypeChipProps(
								loan.transaction_type,
								theme,
							);

							return (
								<Paper
									key={loan.id}
									elevation={0}
									sx={{
										p: 1.25,
										borderRadius: 2,
										bgcolor: alpha(theme.palette.background.paper, 0.5),
										border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
										display: "flex",
										flexDirection: "column",
										gap: 0.8,
										transition: "border-color 0.2s ease",
										"&:hover": {
											borderColor: alpha(theme.palette.primary.main, 0.3),
										},
									}}
								>
									{/* Row 1: Type + Partner/Requester + Action Menu */}
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											gap: 1,
										}}
									>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 0.8,
												minWidth: 0,
											}}
										>
											<Chip
												icon={
													loan.transaction_type === "DEPOSIT" ? (
														<SouthWestIcon
															sx={{
																fontSize: "11px !important",
																color: "inherit !important",
															}}
														/>
													) : loan.transaction_type === "WITHDRAWAL" ? (
														<NorthEastIcon
															sx={{
																fontSize: "11px !important",
																color: "inherit !important",
															}}
														/>
													) : (
														<ArrowUpwardIcon
															sx={{
																fontSize: "11px !important",
																color: "inherit !important",
															}}
														/>
													)
												}
												label={typeProps.label}
												size="small"
												sx={{
													fontWeight: 800,
													fontSize: "0.62rem",
													height: 20,
													bgcolor: typeProps.bg,
													color: typeProps.color,
													border: `1px solid ${typeProps.border}`,
												}}
											/>
											<Box sx={{ minWidth: 0 }}>
												<Typography
													variant="body2"
													sx={{
														fontWeight: 800,
														fontSize: "0.82rem",
														whiteSpace: "nowrap",
														overflow: "hidden",
														textOverflow: "ellipsis",
													}}
												>
													{loan.partner_code ? (
														<span style={{ color: theme.palette.primary.main }}>
															[{loan.partner_code}]{" "}
														</span>
													) : (
														""
													)}
													{loan.partner_name || loan.requester_username}
												</Typography>
											</Box>
										</Box>

										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 0.5,
												flexShrink: 0,
											}}
										>
											{/* Status Chip */}
											<Chip
												label={
													isRepaid
														? "REPAID"
														: loan.status === "APPROVED" &&
															  (loan.transaction_type || "LOAN") === "LOAN"
															? (loan.fulfilled_installments || 0) > 0 ||
																(loan.repaid_amount || 0) > 0
																? "REPAYING"
																: "ACTIVE"
															: loan.status === "ACCEPTED" &&
																  (loan.transaction_type || "LOAN") === "LOAN"
																? "ACCEPTED"
																: statusProps.label
												}
												size="small"
												color={
													isRepaid
														? "success"
														: loan.status === "APPROVED"
															? "primary"
															: loan.status === "ACCEPTED"
																? "info"
																: statusProps.color
												}
												sx={{
													fontWeight: 800,
													fontSize: "0.62rem",
													height: 20,
												}}
											/>
											<IconButton
												size="small"
												onClick={(e) => handleOpenMenu(e, loan)}
												sx={{ color: "text.secondary", p: 0.25 }}
											>
												<MoreVertIcon sx={{ fontSize: 16 }} />
											</IconButton>
										</Box>
									</Box>

									{/* Row 2: Amount & Disbursement Status + Rate/Term badge */}
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											bgcolor: alpha(theme.palette.background.default, 0.45),
											p: 0.8,
											px: 1,
											borderRadius: 1.25,
										}}
									>
										<Box
											sx={{ display: "flex", alignItems: "center", gap: 0.6 }}
										>
											<Typography
												variant="body1"
												sx={{
													fontWeight: 900,
													color: typeProps.color,
													fontSize: "0.95rem",
													letterSpacing: "-0.01em",
												}}
											>
												{amount.toLocaleString()}{" "}
												<span style={{ fontSize: "0.7rem", opacity: 0.75 }}>
													{currency}
												</span>
											</Typography>

											{(loan.transaction_type || "LOAN") === "LOAN" &&
												(loan.payout_fulfilled ? (
													<Tooltip title="Principal Disbursed to borrower">
														<CheckCircleIcon
															sx={{ fontSize: 14, color: "#34d399" }}
														/>
													</Tooltip>
												) : (
													<Tooltip title="Contract Accepted, awaiting loan payout">
														<HourglassTopIcon
															sx={{ fontSize: 14, color: "#f59e0b" }}
														/>
													</Tooltip>
												))}
										</Box>

										<Box
											sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
										>
											{(loan.transaction_type || "LOAN") === "LOAN" ? (
												<>
													<Box
														component="span"
														sx={{
															fontSize: "0.65rem",
															fontWeight: 800,
															px: 0.6,
															py: 0.15,
															borderRadius: 0.8,
															bgcolor: alpha(theme.palette.primary.main, 0.12),
															color: theme.palette.primary.light,
														}}
													>
														{loan.interest_rate}%
													</Box>
													<Typography
														variant="caption"
														sx={{
															color: "text.secondary",
															fontSize: "0.68rem",
															fontWeight: 700,
														}}
													>
														{loan.term_days ? `${loan.term_days}d` : "Open"}
													</Typography>
													{loan.loan_structure === "INTEREST_ONLY" ? (
														<Tooltip title="Interest-Only">
															<Box
																component="span"
																sx={{
																	fontSize: "0.58rem",
																	fontWeight: 800,
																	px: 0.5,
																	py: 0.1,
																	borderRadius: 0.6,
																	bgcolor: alpha("#f59e0b", 0.15),
																	color: "#fbbf24",
																}}
															>
																IO
															</Box>
														</Tooltip>
													) : loan.loan_structure === "AMORTIZING_STABLE" ? (
														<Tooltip title="Amortized">
															<Box
																component="span"
																sx={{
																	fontSize: "0.58rem",
																	fontWeight: 800,
																	px: 0.5,
																	py: 0.1,
																	borderRadius: 0.6,
																	bgcolor: alpha("#10b981", 0.15),
																	color: "#34d399",
																}}
															>
																AMORT
															</Box>
														</Tooltip>
													) : null}
												</>
											) : (
												<Typography
													variant="caption"
													sx={{
														color: "text.secondary",
														fontSize: "0.68rem",
														fontWeight: 600,
													}}
												>
													{loan.transaction_type === "DEPOSIT"
														? "Vault Inflow"
														: "Vault Outflow"}
												</Typography>
											)}
										</Box>
									</Box>

									{/* Row 3: Footer metadata (Contract ID, Verified badge, Date/Installments) */}
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											fontSize: "0.68rem",
											color: "text.secondary",
											pt: 0.2,
											flexWrap: "wrap",
											gap: 0.5,
										}}
									>
										{/* Contract and verification */}
										<Box
											sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
										>
											{contractId !== "N/A" ? (
												<>
													<Chip
														label={contractId}
														size="small"
														onClick={() => handleCopy(contractId)}
														variant="outlined"
														sx={{
															fontFamily: "monospace",
															fontWeight: 800,
															fontSize: "0.68rem",
															height: 19,
															bgcolor: alpha(
																theme.palette.background.paper,
																0.4,
															),
														}}
													/>
													{loan.is_verified ? (
														<Tooltip title="Verified Game Contract">
															<VerifiedUserIcon
																sx={{ fontSize: 13, color: "#34d399" }}
															/>
														</Tooltip>
													) : (
														<Tooltip title="Self-Reported">
															<HistoryEduIcon
																sx={{ fontSize: 13, color: "#94a3b8" }}
															/>
														</Tooltip>
													)}
												</>
											) : (
												<Typography
													variant="caption"
													sx={{ color: "text.secondary", fontSize: "0.65rem" }}
												>
													No contract
												</Typography>
											)}
										</Box>

										{/* Right side: Date or installment count */}
										<Box
											sx={{ display: "flex", alignItems: "center", gap: 0.6 }}
										>
											{(loan.total_installments || 0) > 0 ? (
												<Box
													component="span"
													sx={{
														fontSize: "0.62rem",
														fontWeight: 800,
														px: 0.5,
														py: 0.1,
														borderRadius: 0.8,
														bgcolor: alpha(theme.palette.divider, 0.1),
														color: "text.secondary",
														fontFamily: "monospace",
													}}
												>
													{loan.fulfilled_installments || 0}/
													{loan.total_installments} inst.
												</Box>
											) : null}

											<Typography
												variant="caption"
												sx={{
													fontSize: "0.65rem",
													color: "text.secondary",
												}}
											>
												{loan.created_at
													? formatBankDate(loan.created_at).split(" ")[0]
													: "—"}
											</Typography>
										</Box>
									</Box>
								</Paper>
							);
						})
					)}
				</Box>
			)}

			{/* Row Action Menu */}
			<Menu
				anchorEl={menuAnchorEl}
				open={Boolean(menuAnchorEl)}
				onClose={handleCloseMenu}
				PaperProps={{
					sx: {
						minWidth: 180,
						borderRadius: 1.5,
						bgcolor: "background.paper",
						border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
					},
				}}
			>
				<MenuItem onClick={handleTriggerRelink}>
					<ListItemIcon>
						<LinkIcon fontSize="small" sx={{ color: "info.main" }} />
					</ListItemIcon>
					<ListItemText
						primary="Relink Contract"
						secondary="Update contract ID & snapshot"
					/>
				</MenuItem>
				{!activeLoan?.is_verified && (
					<MenuItem onClick={handleTriggerEdit}>
						<ListItemIcon>
							<EditIcon fontSize="small" sx={{ color: "primary.main" }} />
						</ListItemIcon>
						<ListItemText
							primary="Edit Entry"
							secondary="Modify amounts or terms (self-imported only)"
						/>
					</MenuItem>
				)}
				<MenuItem onClick={handleTriggerDelete} sx={{ color: "error.main" }}>
					<ListItemIcon>
						<DeleteIcon fontSize="small" sx={{ color: "error.main" }} />
					</ListItemIcon>
					<ListItemText primary="Delete" secondary="Permanently remove" />
				</MenuItem>
			</Menu>

			{/* Confirm Delete Dialog */}
			<Dialog
				open={deleteConfirmOpen}
				onClose={() => !isDeleting && setDeleteConfirmOpen(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle sx={{ fontWeight: 800 }}>Confirm Deletion</DialogTitle>
				<DialogContent>
					{deleteError && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{deleteError}
						</Alert>
					)}
					<DialogContentText>
						Are you sure you want to delete this ledger transaction (#
						{activeLoan?.id}) for{" "}
						<strong>
							{activeLoan?.requester_username ||
								activeLoan?.partner_name ||
								"Unknown"}
						</strong>
						?
					</DialogContentText>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", mt: 1, display: "block" }}
					>
						Amount: {formatAmount(activeLoan?.amount || 0)}{" "}
						{activeLoan?.currency || bank.currency || "ICA"} • Type:{" "}
						{activeLoan?.transaction_type || "LOAN"}
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "error.main", mt: 1, display: "block" }}
					>
						This action cannot be undone. If you made a mistake importing or
						recording this entry, you can safely re-import or re-link after
						deletion.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button
						onClick={() => setDeleteConfirmOpen(false)}
						color="inherit"
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmDelete}
						color="error"
						variant="contained"
						disabled={isDeleting}
						startIcon={
							isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />
						}
					>
						Delete Transaction
					</Button>
				</DialogActions>
			</Dialog>

			{/* Edit Loan Dialog */}
			<EditLoanDialog
				open={editDialogOpen}
				loan={activeLoan}
				onClose={() => setEditDialogOpen(false)}
				onSuccess={() => {
					onRefresh();
				}}
			/>

			{/* Relink Contract Dialog */}
			<RelinkContractDialog
				open={relinkDialogOpen}
				loan={activeLoan}
				onClose={() => setRelinkDialogOpen(false)}
				onSuccess={() => {
					onRefresh();
				}}
			/>

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
