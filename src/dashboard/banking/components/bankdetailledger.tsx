import React, { useState } from "react";
import {
	Box,
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
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import ClearIcon from "@mui/icons-material/Clear";
import { CheckCircleOutlineOutlined } from "@mui/icons-material";
import type { BankLoanRecord } from "../types";
import { formatAmount } from "../../../utils/formaters";
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
}

export const BankDetailLedger: React.FC<BankDetailLedgerProps> = ({
	loans,
	loading,
	currency = "ICA",
	isOwner = false,
	defaultInterestRate = 1.5,
}) => {
	const theme = useTheme();
	const [searchQuery, setSearchQuery] = useState("");
	const [filterType, setFilterType] = useState<
		"ALL" | "LOAN" | "DEPOSIT" | "WITHDRAWAL"
	>("ALL");
	const [copiedId, setCopiedId] = useState<string | null>(null);

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
					py: 1,
					px: 2,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 1.25,
					bgcolor: alpha(theme.palette.background.default, 0.45),
					borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
				}}
			>
				{/* Filter Chips */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 0.75,
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
							fontWeight: 800,
							fontSize: "0.68rem",
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
							fontWeight: 800,
							fontSize: "0.68rem",
							height: 22,
							cursor: "pointer",
						}}
					/>
					<Chip
						label={`Deposits (${depositCount})`}
						size="small"
						color={filterType === "DEPOSIT" ? "success" : "default"}
						variant={filterType === "DEPOSIT" ? "filled" : "outlined"}
						onClick={() => setFilterType("DEPOSIT")}
						sx={{
							fontWeight: 800,
							fontSize: "0.68rem",
							height: 22,
							cursor: "pointer",
						}}
					/>
					<Chip
						label={`Withdrawals (${withdrawalCount})`}
						size="small"
						color={filterType === "WITHDRAWAL" ? "error" : "default"}
						variant={filterType === "WITHDRAWAL" ? "filled" : "outlined"}
						onClick={() => setFilterType("WITHDRAWAL")}
						sx={{
							fontWeight: 800,
							fontSize: "0.68rem",
							height: 22,
							cursor: "pointer",
						}}
					/>
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

			{/* Transactions Table */}
			<TableContainer sx={{ maxHeight: 480 }}>
				<Table stickyHeader size="small">
					<TableHead>
						<TableRow>
							<TableCell
								sx={{
									fontWeight: 800,
									py: 1,
									bgcolor: alpha(theme.palette.background.paper, 0.95),
									width: 110,
									fontSize: "0.72rem",
								}}
							>
								TYPE
							</TableCell>
							<TableCell
								sx={{
									fontWeight: 800,
									py: 1,
									bgcolor: alpha(theme.palette.background.paper, 0.95),
									fontSize: "0.72rem",
								}}
							>
								BORROWER / PARTNER
							</TableCell>
							<TableCell
								sx={{
									fontWeight: 800,
									py: 1,
									bgcolor: alpha(theme.palette.background.paper, 0.95),
									fontSize: "0.72rem",
								}}
							>
								AMOUNT
							</TableCell>
							{isOwner && (
								<TableCell
									sx={{
										fontWeight: 800,
										py: 1,
										bgcolor: alpha(theme.palette.background.paper, 0.95),
										fontSize: "0.72rem",
									}}
								>
									PROFIT / YIELD
								</TableCell>
							)}
							<TableCell
								sx={{
									fontWeight: 800,
									py: 1,
									bgcolor: alpha(theme.palette.background.paper, 0.95),
									fontSize: "0.72rem",
								}}
							>
								CONTRACT LINK
							</TableCell>
							<TableCell
								sx={{
									fontWeight: 800,
									py: 1,
									bgcolor: alpha(theme.palette.background.paper, 0.95),
									fontSize: "0.72rem",
								}}
							>
								STATUS &amp; AUDIT
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell
									colSpan={isOwner ? 6 : 5}
									align="center"
									sx={{ py: 4 }}
								>
									<CircularProgress size={24} color="primary" />
								</TableCell>
							</TableRow>
						) : filteredLoans.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={isOwner ? 6 : 5}
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
										{/* Type */}
										<TableCell sx={{ py: 0.9 }}>
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

										{/* Borrower / Partner */}
										<TableCell>
											<Typography
												variant="body2"
												sx={{ fontWeight: 700, fontSize: "0.82rem" }}
											>
												{loan.partner_code ? `[${loan.partner_code}] ` : ""}
												{loan.partner_name || loan.requester_username}
											</Typography>
											{loan.partner_name && loan.partner_code && (
												<Typography
													variant="caption"
													sx={{
														color: "text.secondary",
														display: "block",
														fontSize: "0.68rem",
													}}
												>
													User: {loan.requester_username}
												</Typography>
											)}
										</TableCell>

										{/* Amount */}
										<TableCell>
											<Typography
												variant="body2"
												sx={{
													fontWeight: 800,
													color: typeProps.color,
													fontSize: "0.82rem",
												}}
											>
												{formatAmount(loan.amount)} {loan.currency || currency}
											</Typography>
										</TableCell>

										{/* Profit / Yield (Owner View Only) */}
										{isOwner && (
											<TableCell>
												{(loan.transaction_type || "LOAN") === "LOAN" ? (
													(() => {
														const r = loan.interest_rate ?? defaultInterestRate;
														const profitAmount =
															(loan.amount || 0) * (r / 100.0);
														const termDays = loan.term_days || 14;
														const weeks = Math.max(1, termDays / 7);
														const weeklyProfit = profitAmount / weeks;

														return (
															<Box>
																<Typography
																	variant="body2"
																	sx={{
																		fontWeight: 900,
																		color: isRepaid
																			? "#34d399"
																			: loan.status === "APPROVED"
																				? "primary.main"
																				: "text.secondary",
																		fontSize: "0.82rem",
																		display: "flex",
																		alignItems: "center",
																		gap: 0.5,
																	}}
																>
																	+{formatAmount(profitAmount)}{" "}
																	{loan.currency || currency}
																</Typography>
																<Typography
																	variant="caption"
																	sx={{
																		color: "text.secondary",
																		display: "block",
																		fontSize: "0.65rem",
																	}}
																>
																	+{formatAmount(weeklyProfit)}/wk &bull; {r}%{" "}
																	{isRepaid ? "earned" : "projected"}
																</Typography>
															</Box>
														);
													})()
												) : loan.transaction_type === "DEPOSIT" ? (
													<Typography
														variant="caption"
														sx={{
															color: "text.secondary",
															fontSize: "0.72rem",
														}}
													>
														Capital Inflow
													</Typography>
												) : loan.transaction_type === "WITHDRAWAL" ? (
													<Typography
														variant="caption"
														sx={{
															color: "text.secondary",
															fontSize: "0.72rem",
														}}
													>
														Capital Outflow
													</Typography>
												) : (
													<Typography
														variant="caption"
														sx={{
															color: "text.secondary",
															fontSize: "0.72rem",
														}}
													>
														—
													</Typography>
												)}
											</TableCell>
										)}

										{/* Contract Link */}
										<TableCell>
											{loan.contract_id ? (
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.5,
													}}
												>
													<Chip
														label={loan.contract_id}
														size="small"
														variant="outlined"
														sx={{
															fontFamily: "monospace",
															fontWeight: 700,
															fontSize: "0.72rem",
															height: 22,
														}}
													/>
													<Tooltip
														title={
															copiedId === loan.contract_id
																? "Copied!"
																: "Copy Local ID"
														}
													>
														<IconButton
															size="small"
															onClick={() => handleCopy(loan.contract_id!)}
														>
															<ContentCopyIcon sx={{ fontSize: 13 }} />
														</IconButton>
													</Tooltip>
												</Box>
											) : (
												<Typography
													variant="caption"
													sx={{ color: "text.secondary", fontSize: "0.75rem" }}
												>
													—
												</Typography>
											)}
										</TableCell>

										{/* Status & Audit */}
										<TableCell>
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												<Chip
													icon={
														isRepaid ? (
															<CheckCircleOutlineOutlined
																sx={{ fontSize: "14px !important" }}
															/>
														) : (
															<HourglassTopIcon
																sx={{ fontSize: "14px !important" }}
															/>
														)
													}
													label={statusProps.label}
													size="small"
													color={statusProps.color}
													sx={{
														fontWeight: 800,
														fontSize: "0.65rem",
														height: 22,
													}}
												/>

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
																borderColor: alpha("#34d399", 0.35),
																bgcolor: alpha("#10b981", 0.08),
															}}
														/>
													</Tooltip>
												) : (
													<Tooltip title="Self-Reported: Recorded or imported without verified contract snapshot">
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
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
};
