import React from "react";
import {
	Box,
	Typography,
	Paper,
	CircularProgress,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import type { BankLedgerResponse, LedgerRecord } from "../types";
import { formatAmount } from "../../../dashboard/banking/helpers";

interface PublicLoanLedgerProps {
	ledgerData: BankLedgerResponse | null;
	loanRecords: LedgerRecord[];
	loading: boolean;
	currency: string;
}

const formatTermWeeks = (days?: number) => {
	if (!days) return "-";
	if (days % 7 === 0) {
		const w = days / 7;
		return `${w} ${w === 1 ? "Week" : "Weeks"}`;
	}
	const w = (days / 7).toFixed(1).replace(/\.0$/, "");
	return `${w} Weeks`;
};

export const PublicLoanLedger: React.FC<PublicLoanLedgerProps> = ({
	ledgerData,
	loanRecords,
	loading,
	currency,
}) => {
	const theme = useTheme();

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: 1,
				flex: 1,
				minHeight: 0,
			}}
		>
			{ledgerData && (
				<Box
					sx={{
						display: "flex",
						gap: 2,
						alignItems: "center",
						justifyContent: "space-evenly",
						flexWrap: "wrap",
						pb: 0.5,
						flexShrink: 0,
					}}
				>
					<Typography variant="caption" sx={{ color: "text.secondary" }}>
						Total Lent:{" "}
						<strong style={{ color: "text.primary" }}>
							{formatAmount(ledgerData.total_lent)} {currency}
						</strong>
					</Typography>
					<Typography variant="caption" sx={{ color: "text.secondary" }}>
						Repaid:{" "}
						<strong style={{ color: theme.palette.success.main }}>
							{formatAmount(ledgerData.total_repaid)} {currency}
						</strong>
					</Typography>
					{ledgerData.active_lent > 0 && (
						<Typography variant="caption" sx={{ color: "text.secondary" }}>
							Active:{" "}
							<strong style={{ color: theme.palette.primary.main }}>
								{formatAmount(ledgerData.active_lent)} {currency}
							</strong>
						</Typography>
					)}
				</Box>
			)}

			{loading ? (
				<Box
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						flex: 1,
						py: 4,
					}}
				>
					<CircularProgress size={24} />
				</Box>
			) : ledgerData?.public_show_loans === false ? (
				<Paper
					elevation={0}
					sx={{
						p: 3,
						textAlign: "center",
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.default, 0.4),
						border: `1px dashed ${alpha(theme.palette.divider, 0.15)}`,
						flex: 1,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: 1,
					}}
				>
					<Typography
						variant="body2"
						sx={{ fontWeight: 700, color: "text.secondary" }}
					>
						Loan Ledger Private
					</Typography>
					<Typography variant="caption" sx={{ color: "text.secondary" }}>
						The bank owner has configured loan history to be private for public
						viewers.
					</Typography>
				</Paper>
			) : loanRecords.length === 0 ? (
				<Paper
					elevation={0}
					sx={{
						p: 2.5,
						textAlign: "center",
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.default, 0.4),
						border: `1px dashed ${alpha(theme.palette.divider, 0.15)}`,
						flex: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Typography variant="caption" sx={{ color: "text.secondary" }}>
						No historical loans recorded for this bank yet.
					</Typography>
				</Paper>
			) : (
				<TableContainer
					component={Paper}
					elevation={0}
					sx={{
						flex: 1,
						minHeight: 120,
						maxHeight: { xs: 240, md: 360 },
						height: "auto",
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.default, 0.4),
						border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
						overflowY: "auto",
						overflowX: "auto",
						"&::-webkit-scrollbar": { width: 5, height: 5 },
						"&::-webkit-scrollbar-thumb": {
							backgroundColor: alpha(theme.palette.divider, 0.3),
							borderRadius: 4,
						},
					}}
				>
					<Table size="small" stickyHeader sx={{ minWidth: 460 }}>
						<TableHead>
							<TableRow>
								<TableCell
									sx={{ fontSize: "0.68rem", fontWeight: 800, py: 0.75, px: 1 }}
								>
									DATE
								</TableCell>
								<TableCell
									sx={{ fontSize: "0.68rem", fontWeight: 800, py: 0.75, px: 1 }}
								>
									BORROWER
								</TableCell>
								<TableCell
									sx={{ fontSize: "0.68rem", fontWeight: 800, py: 0.75, px: 1 }}
								>
									AMOUNT
								</TableCell>
								<TableCell
									sx={{ fontSize: "0.68rem", fontWeight: 800, py: 0.75, px: 1 }}
								>
									RATE
								</TableCell>
								<TableCell
									sx={{ fontSize: "0.68rem", fontWeight: 800, py: 0.75, px: 1 }}
								>
									TERM
								</TableCell>
								<TableCell
									sx={{ fontSize: "0.68rem", fontWeight: 800, py: 0.75, px: 1 }}
								>
									STATUS
								</TableCell>
								<TableCell
									sx={{ fontSize: "0.68rem", fontWeight: 800, py: 0.75, px: 1 }}
									align="right"
								>
									VERIFIED
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{loanRecords.map((tx) => {
								const isRepaid = tx.status === "REPAID";
								const isApproved = tx.status === "APPROVED";
								const statusColor = isRepaid
									? theme.palette.success.main
									: isApproved
										? theme.palette.primary.main
										: theme.palette.warning.main;
								const isAnonymous =
									!tx.requester_username ||
									tx.requester_username === "Anonymous";

								return (
									<TableRow key={tx.id} hover>
										<TableCell
											sx={{
												fontSize: "0.7rem",
												color: "text.secondary",
												py: 0.75,
												px: 1,
												whiteSpace: "nowrap",
											}}
										>
											{new Date(tx.created_at).toLocaleDateString()}
										</TableCell>
										<TableCell
											sx={{
												fontSize: "0.7rem",
												fontWeight: 700,
												color: isAnonymous ? "text.secondary" : "text.primary",
												py: 0.75,
												px: 1,
												whiteSpace: "nowrap",
											}}
										>
											{tx.requester_username || "Anonymous"}
										</TableCell>
										<TableCell
											sx={{
												fontSize: "0.7rem",
												fontWeight: 800,
												py: 0.75,
												px: 1,
												whiteSpace: "nowrap",
											}}
										>
											{formatAmount(tx.amount)} {tx.currency}
										</TableCell>
										<TableCell
											sx={{
												fontSize: "0.7rem",
												color: "text.secondary",
												py: 0.75,
												px: 1,
												whiteSpace: "nowrap",
											}}
										>
											{tx.interest_rate}%
										</TableCell>
										<TableCell
											sx={{
												fontSize: "0.7rem",
												color: "text.secondary",
												py: 0.75,
												px: 1,
												whiteSpace: "nowrap",
											}}
										>
											{formatTermWeeks(tx.term_days)}
										</TableCell>
										<TableCell sx={{ py: 0.75, px: 1 }}>
											<Chip
												label={tx.status}
												size="small"
												sx={{
													fontSize: "0.62rem",
													height: 18,
													fontWeight: 800,
													color: statusColor,
													bgcolor: alpha(statusColor, 0.12),
													border: `1px solid ${alpha(statusColor, 0.25)}`,
												}}
											/>
										</TableCell>
										<TableCell align="right" sx={{ py: 0.75, px: 1 }}>
											{tx.is_verified ? (
												<Chip
													icon={
														<CheckCircleIcon
															sx={{ fontSize: "11px !important" }}
														/>
													}
													label="Contract"
													size="small"
													color="success"
													variant="outlined"
													sx={{
														fontSize: "0.62rem",
														height: 18,
														fontWeight: 700,
													}}
												/>
											) : (
												<Typography
													variant="caption"
													sx={{ color: "text.secondary", fontSize: "0.62rem" }}
												>
													Manual
												</Typography>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Box>
	);
};
