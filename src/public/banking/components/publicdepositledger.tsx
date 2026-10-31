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

interface PublicDepositLedgerProps {
	ledgerData: BankLedgerResponse | null;
	depositRecords: LedgerRecord[];
	loading: boolean;
	currency: string;
}

export const PublicDepositLedger: React.FC<PublicDepositLedgerProps> = ({
	ledgerData,
	depositRecords,
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
						Total Deposited:{" "}
						<strong style={{ color: "#10B981" }}>
							{formatAmount(ledgerData.total_deposits || 0)} {currency}
						</strong>
					</Typography>
					<Typography variant="caption" sx={{ color: "text.secondary" }}>
						Total Withdrawn:{" "}
						<strong style={{ color: "#F59E0B" }}>
							{formatAmount(ledgerData.total_withdrawals || 0)} {currency}
						</strong>
					</Typography>
					<Typography variant="caption" sx={{ color: "text.secondary" }}>
						Net Pledged:{" "}
						<strong style={{ color: "text.primary" }}>
							{formatAmount(
								Math.max(
									0,
									(ledgerData.total_deposits || 0) -
										(ledgerData.total_withdrawals || 0),
								),
							)}{" "}
							{currency}
						</strong>
					</Typography>
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
			) : ledgerData?.public_show_deposits === false &&
			  ledgerData?.public_show_withdrawals === false ? (
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
						Deposits & Withdrawals Private
					</Typography>
					<Typography variant="caption" sx={{ color: "text.secondary" }}>
						The bank owner has configured deposit and withdrawal records to be
						private for public viewers.
					</Typography>
				</Paper>
			) : depositRecords.length === 0 ? (
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
						No historical deposits or withdrawals recorded yet for this bank.
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
									TYPE
								</TableCell>
								<TableCell
									sx={{ fontSize: "0.68rem", fontWeight: 800, py: 0.75, px: 1 }}
								>
									USER
								</TableCell>
								<TableCell
									sx={{ fontSize: "0.68rem", fontWeight: 800, py: 0.75, px: 1 }}
								>
									AMOUNT
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
							{depositRecords.map((tx) => {
								const isDeposit = tx.transaction_type === "DEPOSIT";
								const typeColor = isDeposit
									? theme.palette.success.light
									: theme.palette.error.light;
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
												fontWeight: 800,
												color: typeColor,
												py: 0.75,
												px: 1,
												whiteSpace: "nowrap",
											}}
										>
											{tx.transaction_type}
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
										<TableCell sx={{ py: 0.75, px: 1 }}>
											<Chip
												label={tx.status}
												size="small"
												sx={{
													fontSize: "0.62rem",
													height: 18,
													fontWeight: 800,
													color:
														tx.status === "APPROVED" || tx.status === "REPAID"
															? "#10B981"
															: "#F59E0B",
													bgcolor: alpha(
														tx.status === "APPROVED" || tx.status === "REPAID"
															? "#10B981"
															: "#F59E0B",
														0.12,
													),
													border: `1px solid ${alpha(tx.status === "APPROVED" || tx.status === "REPAID" ? "#10B981" : "#F59E0B", 0.25)}`,
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
