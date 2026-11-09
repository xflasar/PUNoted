import React, { useState } from "react";
import {
	Box,
	Paper,
	Typography,
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
	Tooltip,
	CircularProgress,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Button,
	Alert,
	useTheme,
	useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import ClearIcon from "@mui/icons-material/Clear";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import type { BankLoanRecord } from "../types";
import { formatAmount } from "../../../utils/formaters";
import { EditLoanDialog } from "./editloandialog";
import { RelinkContractDialog } from "./relinkcontractdialog";
import { fetchClient } from "../../../utils/apiclient";
import {
	getLoanStatusChipProps,
	getTransactionTypeChipProps,
} from "../helpers";

interface BankDetailLedgerProps {
	loans: BankLoanRecord[];
	loading: boolean;
	currency?: string;
	isOwner?: boolean;
	defaultInterestRate?: number;
	onRefresh?: () => void;
}

export const BankDetailLedger: React.FC<BankDetailLedgerProps> = ({
	loans,
	loading,
	currency = "ICA",
	isOwner = false,
	defaultInterestRate = 1.5,
	onRefresh,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [searchQuery, setSearchQuery] = useState("");
	const [filterType, setFilterType] = useState<
		"ALL" | "LOAN" | "DEPOSIT" | "WITHDRAWAL"
	>("ALL");
	const [copiedId, setCopiedId] = useState<string | null>(null);

	// Action menu & dialog states for bank owners
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
			onRefresh?.();
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

	const loanCount = loans.filter(
		(l) => (l.transaction_type || "LOAN") === "LOAN",
	).length;
	const depositCount = loans.filter(
		(l) => l.transaction_type === "DEPOSIT",
	).length;
	const withdrawalCount = loans.filter(
		(l) => l.transaction_type === "WITHDRAWAL",
	).length;

	const filteredLoans = loans.filter((l) => {
		const type = l.transaction_type || "LOAN";
		if (filterType !== "ALL" && type !== filterType) {
			return false;
		}
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		return (
			l.requester_username?.toLowerCase().includes(q) ||
			l.partner_name?.toLowerCase().includes(q) ||
			l.partner_code?.toLowerCase().includes(q) ||
			l.contract_id?.toLowerCase().includes(q)
		);
	});

	return (
		<Box sx={{ display: "flex", flexDirection: "column" }}>
			{/* Controls Bar: Type filter chips + Search input */}
			<Box
				sx={{
					py: { xs: 0.8, sm: 1 },
					px: { xs: 1, sm: 2 },
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 0.8,
					bgcolor: alpha(theme.palette.background.default, 0.45),
					borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
				}}
			>
				{/* Filter Chips */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 0.6,
						flexWrap: "wrap",
					}}
				>
					<Chip
						label={`All (${loans.length})`}
						size="small"
						color={filterType === "ALL" ? "primary" : "default"}
						variant={filterType === "ALL" ? "filled" : "outlined"}
						onClick={() => setFilterType("ALL")}
						sx={{
							fontWeight: 600,
							fontSize: "0.7rem",
							height: 22,
							cursor: "pointer",
						}}
					/>
					<Chip
						label={`Loans (${loanCount})`}
						size="small"
						color={filterType === "LOAN" ? "primary" : "default"}
						variant={filterType === "LOAN" ? "filled" : "outlined"}
						onClick={() => setFilterType("LOAN")}
						sx={{
							fontWeight: 600,
							fontSize: "0.7rem",
							height: 22,
							cursor: "pointer",
						}}
					/>
					{depositCount > 0 && (
						<Chip
							label={`Deposits (${depositCount})`}
							size="small"
							color={filterType === "DEPOSIT" ? "success" : "default"}
							variant={filterType === "DEPOSIT" ? "filled" : "outlined"}
							onClick={() => setFilterType("DEPOSIT")}
							sx={{
								fontWeight: 600,
								fontSize: "0.7rem",
								height: 22,
								cursor: "pointer",
							}}
						/>
					)}
					{withdrawalCount > 0 && (
						<Chip
							label={`Withdrawals (${withdrawalCount})`}
							size="small"
							color={filterType === "WITHDRAWAL" ? "error" : "default"}
							variant={filterType === "WITHDRAWAL" ? "filled" : "outlined"}
							onClick={() => setFilterType("WITHDRAWAL")}
							sx={{
								fontWeight: 600,
								fontSize: "0.7rem",
								height: 22,
								cursor: "pointer",
							}}
						/>
					)}
				</Box>

				{/* Search Field */}
				<TextField
					size="small"
					placeholder="Search partner or contract ID..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
								</InputAdornment>
							),
							endAdornment: searchQuery ? (
								<InputAdornment position="end">
									<IconButton
										size="small"
										onClick={() => setSearchQuery("")}
										sx={{ p: 0.25 }}
									>
										<ClearIcon sx={{ fontSize: 14 }} />
									</IconButton>
								</InputAdornment>
							) : null,
						},
					}}
					sx={{
						width: { xs: "100%", sm: 260 },
						"& .MuiOutlinedInput-root": {
							height: 30,
							fontSize: "0.78rem",
							bgcolor: alpha(theme.palette.background.paper, 0.4),
						},
					}}
				/>
			</Box>

			{/* Transactions Table (Desktop) */}
			{!isMobile && (
				<TableContainer sx={{ maxHeight: 480, overflowX: "hidden" }}>
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
										fontWeight: 600,
										py: 0.7,
										px: 1,
										bgcolor: alpha(theme.palette.background.paper, 0.95),
										width: isOwner ? "7%" : "9%",
										fontSize: "0.68rem",
										color: "text.secondary",
									}}
								>
									TYPE
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 600,
										py: 0.7,
										px: 1,
										bgcolor: alpha(theme.palette.background.paper, 0.95),
										fontSize: "0.68rem",
										width: isOwner ? "20%" : "26%",
										color: "text.secondary",
									}}
								>
									PARTNER
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 600,
										py: 0.7,
										px: 1,
										bgcolor: alpha(theme.palette.background.paper, 0.95),
										fontSize: "0.68rem",
										width: isOwner ? "18%" : "24%",
										color: "text.secondary",
									}}
								>
									AMOUNT
								</TableCell>
								{isOwner && (
									<TableCell
										sx={{
											fontWeight: 600,
											py: 0.7,
											px: 1,
											bgcolor: alpha(theme.palette.background.paper, 0.95),
											fontSize: "0.68rem",
											width: "18%",
											color: "text.secondary",
										}}
									>
										INTEREST / PROFIT
									</TableCell>
								)}
								<TableCell
									sx={{
										fontWeight: 600,
										py: 0.7,
										px: 1,
										bgcolor: alpha(theme.palette.background.paper, 0.95),
										fontSize: "0.68rem",
										width: isOwner ? "16%" : "20%",
										color: "text.secondary",
									}}
								>
									CONTRACT
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 600,
										py: 0.7,
										px: 1,
										bgcolor: alpha(theme.palette.background.paper, 0.95),
										fontSize: "0.68rem",
										width: isOwner ? "16%" : "21%",
										color: "text.secondary",
									}}
								>
									STATUS
								</TableCell>
								{isOwner && (
									<TableCell
										align="right"
										sx={{
											fontWeight: 600,
											py: 0.7,
											px: 1,
											bgcolor: alpha(theme.palette.background.paper, 0.95),
											fontSize: "0.68rem",
											width: "60px",
											color: "text.secondary",
										}}
									>
										ACTIONS
									</TableCell>
								)}
							</TableRow>
						</TableHead>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell
										colSpan={isOwner ? 7 : 5}
										align="center"
										sx={{ py: 4 }}
									>
										<CircularProgress size={24} color="primary" />
									</TableCell>
								</TableRow>
							) : filteredLoans.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={isOwner ? 7 : 5}
										align="center"
										sx={{ py: 4, color: "text.secondary", fontSize: "0.8rem" }}
									>
										{loans.length === 0
											? "No transactions recorded for this bank yet."
											: "No transactions matched your current filters."}
									</TableCell>
								</TableRow>
							) : (
								filteredLoans.map((loan) => {
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
										<TableRow
											key={loan.id}
											hover
											sx={{
												"&:last-child td, &:last-child th": { border: 0 },
												transition: "background-color 0.15s ease",
											}}
										>
											{/* Type (Clean small badge) */}
											<TableCell sx={{ py: 0.6, px: 1 }}>
												<Box
													component="span"
													sx={{
														display: "inline-block",
														fontSize: "0.65rem",
														fontWeight: 600,
														px: 0.6,
														py: 0.15,
														borderRadius: 0.8,
														bgcolor: typeProps.bg,
														color: typeProps.color,
														border: `1px solid ${typeProps.border}`,
													}}
												>
													{loan.transaction_type === "DEPOSIT"
														? "DEP"
														: loan.transaction_type === "WITHDRAWAL"
															? "WTH"
															: "LOAN"}
												</Box>
											</TableCell>

											{/* Borrower / Partner */}
											<TableCell sx={{ py: 0.6, px: 1 }}>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.5,
														minWidth: 0,
													}}
												>
													{loan.partner_code && (
														<Typography
															component="span"
															sx={{
																fontWeight: 600,
																fontSize: "0.78rem",
																color: theme.palette.primary.main,
																flexShrink: 0,
															}}
														>
															[{loan.partner_code}]
														</Typography>
													)}
													<Typography
														variant="body2"
														sx={{
															fontWeight: 500,
															fontSize: "0.8rem",
															whiteSpace: "nowrap",
															overflow: "hidden",
															textOverflow: "ellipsis",
														}}
													>
														{loan.partner_name || loan.requester_username}
													</Typography>
												</Box>
											</TableCell>

											{/* Amount */}
											<TableCell sx={{ py: 0.6, px: 1 }}>
												<Typography
													variant="body2"
													sx={{
														fontWeight: 600,
														color: typeProps.color,
														fontSize: "0.82rem",
													}}
												>
													{formatAmount(loan.amount)}{" "}
													<span
														style={{
															fontSize: "0.68rem",
															opacity: 0.75,
															fontWeight: 400,
														}}
													>
														{loan.currency || currency}
													</span>
												</Typography>
											</TableCell>

											{/* Yield / Profit (Owner View) */}
											{isOwner && (
												<TableCell sx={{ py: 0.6, px: 1 }}>
													{(loan.transaction_type || "LOAN") === "LOAN" ? (
														(() => {
															const r =
																loan.interest_rate ?? defaultInterestRate;
															const profitAmount =
																loan.total_interest_amount &&
																loan.total_interest_amount > 0
																	? loan.total_interest_amount
																	: (loan.amount || 0) * (r / 100.0);
															const termDays = loan.term_days || 14;

															return (
																<Box
																	sx={{
																		display: "flex",
																		alignItems: "center",
																		gap: 0.75,
																	}}
																>
																	<Typography
																		variant="body2"
																		sx={{
																			fontWeight: 600,
																			color: isRepaid
																				? "#34d399"
																				: "primary.main",
																			fontSize: "0.78rem",
																		}}
																	>
																		+{formatAmount(profitAmount)}
																	</Typography>
																	<Typography
																		variant="caption"
																		sx={{
																			color: "text.secondary",
																			fontSize: "0.68rem",
																			fontWeight: 500,
																		}}
																	>
																		{r}% &bull; {termDays}d
																	</Typography>
																</Box>
															);
														})()
													) : (
														<Typography
															variant="caption"
															sx={{
																color: "text.secondary",
																fontSize: "0.7rem",
															}}
														>
															{loan.transaction_type === "DEPOSIT"
																? "Inflow"
																: "Outflow"}
														</Typography>
													)}
												</TableCell>
											)}

											{/* Contract Link */}
											<TableCell sx={{ py: 0.6, px: 1 }}>
												{loan.contract_id ? (
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 0.5,
														}}
													>
														<Tooltip
															title={
																copiedId === loan.contract_id
																	? "Copied!"
																	: "Click to copy"
															}
														>
															<Chip
																label={loan.contract_id}
																size="small"
																onClick={() => handleCopy(loan.contract_id!)}
																clickable
																variant="outlined"
																sx={{
																	fontFamily: "monospace",
																	fontWeight: 500,
																	fontSize: "0.68rem",
																	height: 20,
																	bgcolor: alpha(
																		theme.palette.background.paper,
																		0.4,
																	),
																}}
															/>
														</Tooltip>
														{loan.is_verified && (
															<Tooltip title="Verified Game Contract">
																<VerifiedUserIcon
																	sx={{ fontSize: 13, color: "#34d399" }}
																/>
															</Tooltip>
														)}
													</Box>
												) : (
													<Typography
														variant="caption"
														sx={{ color: "text.secondary", fontSize: "0.7rem" }}
													>
														—
													</Typography>
												)}
											</TableCell>

											{/* Status */}
											<TableCell sx={{ py: 0.6, px: 1 }}>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.6,
													}}
												>
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
																		  (loan.transaction_type || "LOAN") ===
																				"LOAN"
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
															fontWeight: 600,
															fontSize: "0.62rem",
															height: 19,
														}}
													/>

													{(loan.total_installments || 0) > 0 && (
														<Box
															component="span"
															sx={{
																fontSize: "0.62rem",
																fontWeight: 600,
																px: 0.5,
																py: 0.05,
																borderRadius: 0.6,
																bgcolor: alpha(theme.palette.divider, 0.1),
																color: "text.secondary",
																fontFamily: "monospace",
															}}
														>
															{loan.fulfilled_installments || 0}/
															{loan.total_installments}
														</Box>
													)}
												</Box>
											</TableCell>

											{/* Actions (Owner View Only) */}
											{isOwner && (
												<TableCell align="right" sx={{ py: 0.6, px: 0.5 }}>
													<IconButton
														size="small"
														onClick={(e) => handleOpenMenu(e, loan)}
														sx={{
															color: "text.secondary",
															p: 0.25,
															"&:hover": { color: "text.primary" },
														}}
													>
														<MoreVertIcon sx={{ fontSize: 16 }} />
													</IconButton>
												</TableCell>
											)}
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
						gap: 1,
						p: { xs: 1, sm: 1.5 },
						maxHeight: 520,
						overflowY: "auto",
					}}
				>
					{loading ? (
						<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
							<CircularProgress size={24} color="primary" />
						</Box>
					) : filteredLoans.length === 0 ? (
						<Typography
							align="center"
							sx={{ py: 4, color: "text.secondary", fontSize: "0.8rem" }}
						>
							{loans.length === 0
								? "No transactions recorded for this bank yet."
								: "No transactions matched your current filters."}
						</Typography>
					) : (
						filteredLoans.map((loan) => {
							const statusProps = getLoanStatusChipProps(
								loan.status,
								loan.transaction_type,
							);
							const isRepaid = loan.status === "REPAID";
							const typeProps = getTransactionTypeChipProps(
								loan.transaction_type,
								theme,
							);
							const r = loan.interest_rate ?? defaultInterestRate;
							const profitAmount =
								loan.total_interest_amount && loan.total_interest_amount > 0
									? loan.total_interest_amount
									: (loan.amount || 0) * (r / 100.0);
							const termDays = loan.term_days || 14;
							const weeks = Math.max(1, termDays / 7);
							const weeklyProfit = profitAmount / weeks;

							return (
								<Paper
									key={loan.id}
									elevation={0}
									sx={{
										p: 1.2,
										px: 1.4,
										borderRadius: 2,
										bgcolor: alpha(theme.palette.background.paper, 0.45),
										border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
										display: "flex",
										flexDirection: "column",
										gap: 0.75,
										transition: "border-color 0.2s ease",
										"&:hover": {
											borderColor: alpha(theme.palette.primary.main, 0.3),
										},
									}}
								>
									{/* Top Line: [TAG] Partner Name • Type • Status & Actions */}
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
											<Typography
												variant="body2"
												sx={{
													fontWeight: 800,
													fontSize: "0.85rem",
													whiteSpace: "nowrap",
													overflow: "hidden",
													textOverflow: "ellipsis",
												}}
											>
												{loan.partner_code ? (
													<span
														style={{
															color: theme.palette.primary.main,
															fontWeight: 900,
														}}
													>
														[{loan.partner_code}]{" "}
													</span>
												) : (
													""
												)}
												{loan.partner_name || loan.requester_username}
											</Typography>

											{loan.transaction_type &&
												loan.transaction_type !== "LOAN" && (
													<Box
														component="span"
														sx={{
															fontSize: "0.6rem",
															fontWeight: 800,
															px: 0.6,
															py: 0.1,
															borderRadius: 0.8,
															bgcolor: typeProps.bg,
															color: typeProps.color,
															border: `1px solid ${typeProps.border}`,
														}}
													>
														{typeProps.label}
													</Box>
												)}
										</Box>

										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 0.5,
												flexShrink: 0,
											}}
										>
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
											{isOwner && (
												<IconButton
													size="small"
													onClick={(e) => handleOpenMenu(e, loan)}
													sx={{ color: "text.secondary", p: 0.25, ml: 0.2 }}
												>
													<MoreVertIcon sx={{ fontSize: 16 }} />
												</IconButton>
											)}
										</Box>
									</Box>

									{/* Bottom Line: Amount + Terms on Left | Contract ID & Profit on Right */}
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											pt: 0.4,
											borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
										}}
									>
										{/* Left: Amount + Rate / Terms */}
										<Box
											sx={{ display: "flex", alignItems: "baseline", gap: 0.8 }}
										>
											<Typography
												variant="body2"
												sx={{
													fontWeight: 900,
													color: typeProps.color,
													fontSize: "0.92rem",
												}}
											>
												{formatAmount(loan.amount)}{" "}
												<span style={{ fontSize: "0.68rem", opacity: 0.75 }}>
													{loan.currency || currency}
												</span>
											</Typography>

											{(loan.transaction_type || "LOAN") === "LOAN" && (
												<Typography
													variant="caption"
													sx={{
														color: "text.secondary",
														fontSize: "0.7rem",
														fontWeight: 700,
													}}
												>
													{r}% &bull; {termDays}d
												</Typography>
											)}
										</Box>

										{/* Right: Profit (if owner) & Contract short link */}
										<Box
											sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
										>
											{isOwner &&
												(loan.transaction_type || "LOAN") === "LOAN" && (
													<Typography
														variant="caption"
														sx={{
															fontWeight: 800,
															color: isRepaid ? "#34d399" : "primary.main",
															fontSize: "0.72rem",
														}}
													>
														+{formatAmount(profitAmount)}
													</Typography>
												)}

											{loan.contract_id && (
												<Chip
													label={loan.contract_id}
													size="small"
													onClick={() => handleCopy(loan.contract_id!)}
													variant="outlined"
													sx={{
														fontFamily: "monospace",
														fontWeight: 700,
														fontSize: "0.62rem",
														height: 18,
														px: 0.2,
														bgcolor: alpha(theme.palette.background.paper, 0.4),
													}}
												/>
											)}
										</Box>
									</Box>
								</Paper>
							);
						})
					)}
				</Box>
			)}

			{/* Row Action Menu for Bank Owners */}
			<Menu
				anchorEl={menuAnchorEl}
				open={Boolean(menuAnchorEl)}
				onClose={handleCloseMenu}
				slotProps={{
					paper: {
						sx: {
							minWidth: 180,
							borderRadius: 1.5,
							bgcolor: "background.paper",
							border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
						},
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
						{activeLoan?.currency || currency} • Type:{" "}
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
					onRefresh?.();
				}}
			/>

			{/* Relink Contract Dialog */}
			<RelinkContractDialog
				open={relinkDialogOpen}
				loan={activeLoan}
				onClose={() => setRelinkDialogOpen(false)}
				onSuccess={() => {
					onRefresh?.();
				}}
			/>
		</Box>
	);
};
