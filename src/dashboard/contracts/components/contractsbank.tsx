import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Paper,
	TextField,
	Button,
	Grid,
	Card,
	CardContent,
	CircularProgress,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	useTheme,
	Stack,
	Avatar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ListAltIcon from "@mui/icons-material/ListAlt";
import DescriptionIcon from "@mui/icons-material/Description";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import { fetchClient } from "../../../utils/apiclient";

interface Bank {
	id: number;
	name: string;
	owner_username: string;
	liquidity: number;
	default_interest_rate: number;
	description?: string;
	active_loans_count?: number;
}

interface LoanRequest {
	id: number;
	bank_id: number;
	requester_username: string;
	amount: number;
	interest_rate: number;
	term_days: number;
	status: string;
	contract_id?: string;
	bank_name?: string;
	created_at: string;
}

export default function ContractsBank() {
	const theme = useTheme();
	const [myBank, setMyBank] = useState<Bank | null>(null);
	const [banks, setBanks] = useState<Bank[]>([]);
	const [requestedLoans, setRequestedLoans] = useState<LoanRequest[]>([]);
	const [receivedLoans, setReceivedLoans] = useState<LoanRequest[]>([]);
	const [loading, setLoading] = useState(true);

	// Create Bank Form State
	const [createName, setCreateName] = useState("");
	const [createDesc, setCreateDesc] = useState("");
	const [createLiquidity, setCreateLiquidity] = useState(100000);
	const [createRate, setCreateRate] = useState(5.0);

	// Request Loan Dialog State
	const [requestDialogOpen, setRequestDialogOpen] = useState(false);
	const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
	const [loanAmount, setLoanAmount] = useState(10000);
	const [loanTerm, setLoanTerm] = useState(7);
	const [loanRate, setLoanRate] = useState(5.0);

	// Approve Loan Dialog State
	const [approveDialogOpen, setApproveDialogOpen] = useState(false);
	const [selectedLoan, setSelectedLoan] = useState<LoanRequest | null>(null);
	const [contractId, setContractId] = useState("");

	const fetchData = async () => {
		setLoading(true);
		try {
			const mbRes = await fetchClient("/internal/contracts/banks/my-bank");
			const mbData = mbRes.ok ? await mbRes.json() : null;
			setMyBank(mbData);

			const bRes = await fetchClient("/internal/contracts/banks");
			const bData = bRes.ok ? await bRes.json() : [];
			setBanks(bData);

			const rlRes = await fetchClient(
				"/internal/contracts/banks/loans/requested",
			);
			const rlData = rlRes.ok ? await rlRes.json() : [];
			setRequestedLoans(rlData);

			if (mbData) {
				const recRes = await fetchClient(
					`/internal/contracts/banks/loans/received?bank_id=${mbData.id}`,
				);
				const recData = recRes.ok ? await recRes.json() : [];
				setReceivedLoans(recData);
			}
		} catch (e) {
			console.error("Failed to load banking data", e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleCreateBank = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const res = await fetchClient("/internal/contracts/banks", {
				method: "POST",
				body: JSON.stringify({
					name: createName,
					description: createDesc,
					liquidity: createLiquidity,
					default_interest_rate: createRate,
				}),
			});
			if (res.ok) {
				fetchData();
			} else {
				const err = await res.json();
				alert(err.detail || "Failed to create bank");
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleRequestLoanSubmit = async () => {
		if (!selectedBank) return;
		try {
			const res = await fetchClient("/internal/contracts/banks/request", {
				method: "POST",
				body: JSON.stringify({
					bank_id: selectedBank.id,
					amount: loanAmount,
					interest_rate: loanRate,
					term_days: loanTerm,
				}),
			});
			if (res.ok) {
				setRequestDialogOpen(false);
				fetchData();
			} else {
				alert("Failed to submit request");
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleApproveLoan = async () => {
		if (!selectedLoan) return;
		try {
			const res = await fetchClient("/internal/contracts/banks/loans/action", {
				method: "POST",
				body: JSON.stringify({
					loan_id: selectedLoan.id,
					status: "APPROVED",
					contract_id: contractId,
				}),
			});
			if (res.ok) {
				setApproveDialogOpen(false);
				setContractId("");
				fetchData();
			} else {
				alert("Failed to approve loan");
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleRejectLoan = async (loanId: number) => {
		try {
			const res = await fetchClient("/internal/contracts/banks/loans/action", {
				method: "POST",
				body: JSON.stringify({
					loan_id: loanId,
					status: "REJECTED",
				}),
			});
			if (res.ok) {
				fetchData();
			}
		} catch (err) {
			console.error(err);
		}
	};

	if (loading) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100%",
					p: 5,
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box
			sx={{
				p: { xs: 2, md: 3 },
				display: "flex",
				flexDirection: "column",
				gap: 3,
				height: "100%",
				overflowY: "auto",
				boxSizing: "border-box",
				bgcolor: "background.default",
				"&::-webkit-scrollbar": { width: "6px" },
				"&::-webkit-scrollbar-thumb": {
					backgroundColor: theme.palette.divider,
					borderRadius: "4px",
				},
			}}
		>
			<Typography
				variant="h6"
				sx={{
					border: `1px solid ${theme.palette.divider}`,
					p: 2,
					background: theme.palette.background.default,
					fontWeight: 800,
					color: "warning.main",
				}}
			>
				This feature is higly ALPHA use on your own risk. (Not that any risk is
				there) Do expect possible changes and wipe of data for banking.
			</Typography>
			<Grid container spacing={3}>
				{/* Owner's Bank View */}
				{myBank ? (
					<Grid item xs={12} md={6}>
						<Paper
							elevation={0}
							sx={{
								p: 3,
								border: `1px solid ${theme.palette.divider}`,
								background:
									"linear-gradient(135deg, rgba(20, 25, 40, 0.75) 0%, rgba(28, 35, 55, 0.75) 100%)",
								backdropFilter: "blur(16px)",
								borderRadius: "16px",
								boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
							}}
						>
							<Box
								sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}
							>
								<Avatar
									sx={{
										bgcolor: alpha(theme.palette.primary.main, 0.15),
										color: "primary.main",
										width: 48,
										height: 48,
									}}
								>
									<AccountBalanceIcon sx={{ fontSize: 24 }} />
								</Avatar>
								<Box>
									<Typography
										variant="h6"
										sx={{
											fontWeight: 800,
											color: "text.primary",
											lineHeight: 1.2,
										}}
									>
										{myBank.name}
									</Typography>
									<Typography
										variant="caption"
										color="primary.main"
										sx={{ fontWeight: 700, textTransform: "uppercase" }}
									>
										Bank Dashboard
									</Typography>
								</Box>
							</Box>
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ mb: 3, fontStyle: "italic" }}
							>
								{myBank.description || "No description provided."}
							</Typography>
							<Grid container spacing={2}>
								<Grid item xs={6}>
									<Box
										sx={{
											p: 2,
											bgcolor: "rgba(255, 255, 255, 0.02)",
											border: `1px solid ${theme.palette.divider}`,
											borderRadius: 2,
										}}
									>
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block", fontWeight: 700, mb: 0.5 }}
										>
											LIQUID FUNDS
										</Typography>
										<Typography
											variant="subtitle1"
											sx={{
												fontWeight: 800,
												fontFamily: "monospace",
												color: "success.main",
											}}
										>
											{myBank.liquidity.toLocaleString()} ICA
										</Typography>
									</Box>
								</Grid>
								<Grid item xs={6}>
									<Box
										sx={{
											p: 2,
											bgcolor: "rgba(255, 255, 255, 0.02)",
											border: `1px solid ${theme.palette.divider}`,
											borderRadius: 2,
										}}
									>
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block", fontWeight: 700, mb: 0.5 }}
										>
											DEFAULT INTEREST
										</Typography>
										<Typography
											variant="subtitle1"
											sx={{ fontWeight: 800, color: "primary.main" }}
										>
											{myBank.default_interest_rate}%
										</Typography>
									</Box>
								</Grid>
							</Grid>
						</Paper>
					</Grid>
				) : (
					<Grid item xs={12} md={6}>
						<Paper
							elevation={0}
							sx={{
								p: 3,
								border: `1px solid ${theme.palette.divider}`,
								background:
									"linear-gradient(135deg, rgba(20, 25, 40, 0.75) 0%, rgba(28, 35, 55, 0.75) 100%)",
								backdropFilter: "blur(16px)",
								borderRadius: "16px",
								boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
							}}
						>
							<Box
								sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}
							>
								<Avatar
									sx={{
										bgcolor: alpha(theme.palette.primary.main, 0.15),
										color: "primary.main",
										width: 40,
										height: 40,
									}}
								>
									<AccountBalanceIcon />
								</Avatar>
								<Typography variant="h6" sx={{ fontWeight: 800 }}>
									Found a Player Bank
								</Typography>
							</Box>
							<form onSubmit={handleCreateBank}>
								<Grid container spacing={2}>
									<Grid item xs={12}>
										<TextField
											label="Bank Name"
											size="small"
											fullWidth
											required
											value={createName}
											onChange={(e) => setCreateName(e.target.value)}
										/>
									</Grid>
									<Grid item xs={12}>
										<TextField
											label="Description"
											size="small"
											fullWidth
											multiline
											rows={2}
											value={createDesc}
											onChange={(e) => setCreateDesc(e.target.value)}
										/>
									</Grid>
									<Grid item xs={6}>
										<TextField
											label="Initial Liquidity (ICA)"
											size="small"
											type="number"
											fullWidth
											required
											value={createLiquidity}
											onChange={(e) =>
												setCreateLiquidity(Number(e.target.value))
											}
										/>
									</Grid>
									<Grid item xs={6}>
										<TextField
											label="Default Interest Rate (%)"
											size="small"
											type="number"
											fullWidth
											required
											value={createRate}
											onChange={(e) => setCreateRate(Number(e.target.value))}
										/>
									</Grid>
									<Grid item xs={12}>
										<Button
											type="submit"
											variant="contained"
											fullWidth
											sx={{ fontWeight: 700, mt: 1 }}
										>
											Create Bank
										</Button>
									</Grid>
								</Grid>
							</form>
						</Paper>
					</Grid>
				)}

				{/* Available Player Banks */}
				<Grid item xs={12} md={6}>
					<Paper
						elevation={0}
						sx={{
							p: 3,
							height: "100%",
							maxHeight: myBank ? 295 : "none",
							border: `1px solid ${theme.palette.divider}`,
							background: "rgba(20, 25, 40, 0.5)",
							backdropFilter: "blur(16px)",
							borderRadius: "16px",
							display: "flex",
							flexDirection: "column",
							boxSizing: "border-box",
						}}
					>
						<Box
							sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}
						>
							<Avatar
								sx={{
									bgcolor: alpha(theme.palette.secondary.main, 0.15),
									color: "secondary.main",
									width: 40,
									height: 40,
								}}
							>
								<RequestQuoteIcon />
							</Avatar>
							<Typography variant="h6" sx={{ fontWeight: 800 }}>
								Available Player Banks
							</Typography>
						</Box>
						<Box
							sx={{
								flex: 1,
								overflowY: "auto",
								display: "flex",
								flexDirection: "column",
								gap: 2,
								pr: 0.5,
								"&::-webkit-scrollbar": { width: "6px" },
								"&::-webkit-scrollbar-thumb": {
									backgroundColor: theme.palette.divider,
									borderRadius: "4px",
								},
							}}
						>
							{banks.filter((b) => b.owner_username !== myBank?.owner_username)
								.length === 0 ? (
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{ textAlign: "center", py: 5 }}
								>
									No other player banks registered.
								</Typography>
							) : (
								banks
									.filter((b) => b.owner_username !== myBank?.owner_username)
									.map((bank) => (
										<Card
											key={bank.id}
											sx={{
												background: "rgba(255, 255, 255, 0.02)",
												border: `1px solid ${theme.palette.divider}`,
												borderRadius: "12px",
												transition:
													"transform 0.15s ease, background-color 0.15s ease",
												"&:hover": {
													transform: "translateY(-2px)",
													bgcolor: "rgba(255, 255, 255, 0.04)",
												},
											}}
										>
											<CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
												<Box
													sx={{
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
													}}
												>
													<Box>
														<Typography
															variant="subtitle2"
															sx={{ fontWeight: 800 }}
														>
															{bank.name}
														</Typography>
														<Typography
															variant="caption"
															color="text.secondary"
														>
															Owner: {bank.owner_username} • Rate:{" "}
															{bank.default_interest_rate}%
														</Typography>
													</Box>
													<Button
														variant="outlined"
														size="small"
														sx={{ fontWeight: 700 }}
														onClick={() => {
															setSelectedBank(bank);
															setLoanRate(bank.default_interest_rate);
															setRequestDialogOpen(true);
														}}
													>
														Request Loan
													</Button>
												</Box>
											</CardContent>
										</Card>
									))
							)}
						</Box>
					</Paper>
				</Grid>
			</Grid>

			{/* Bank Owner: Received Requests */}
			{myBank && (
				<Paper
					elevation={0}
					sx={{
						p: 3,
						border: `1px solid ${theme.palette.divider}`,
						background: "rgba(20, 25, 40, 0.5)",
						backdropFilter: "blur(16px)",
						borderRadius: "16px",
					}}
				>
					<Box
						sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}
					>
						<Avatar
							sx={{
								bgcolor: alpha(theme.palette.warning.main, 0.15),
								color: "warning.main",
								width: 40,
								height: 40,
							}}
						>
							<ListAltIcon />
						</Avatar>
						<Typography variant="h6" sx={{ fontWeight: 800 }}>
							Loan Requests Received
						</Typography>
					</Box>
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell
										sx={{
											fontWeight: 800,
											borderBottom: `1px solid ${theme.palette.divider}`,
										}}
									>
										Requester
									</TableCell>
									<TableCell
										sx={{
											fontWeight: 800,
											borderBottom: `1px solid ${theme.palette.divider}`,
										}}
										align="right"
									>
										Amount
									</TableCell>
									<TableCell
										sx={{
											fontWeight: 800,
											borderBottom: `1px solid ${theme.palette.divider}`,
										}}
										align="right"
									>
										Rate
									</TableCell>
									<TableCell
										sx={{
											fontWeight: 800,
											borderBottom: `1px solid ${theme.palette.divider}`,
										}}
										align="right"
									>
										Term
									</TableCell>
									<TableCell
										sx={{
											fontWeight: 800,
											borderBottom: `1px solid ${theme.palette.divider}`,
										}}
									>
										Status
									</TableCell>
									<TableCell
										sx={{
											fontWeight: 800,
											borderBottom: `1px solid ${theme.palette.divider}`,
										}}
										align="center"
									>
										Actions
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{receivedLoans.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={6}
											align="center"
											sx={{ py: 4, color: "text.secondary" }}
										>
											No loan requests received.
										</TableCell>
									</TableRow>
								) : (
									receivedLoans.map((lr) => (
										<TableRow
											key={lr.id}
											sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.01)" } }}
										>
											<TableCell sx={{ fontWeight: 700, py: 1.5 }}>
												{lr.requester_username}
											</TableCell>
											<TableCell
												align="right"
												sx={{ fontFamily: "monospace", py: 1.5 }}
											>
												{lr.amount.toLocaleString()} ICA
											</TableCell>
											<TableCell align="right" sx={{ py: 1.5 }}>
												{lr.interest_rate}%
											</TableCell>
											<TableCell align="right" sx={{ py: 1.5 }}>
												{lr.term_days} Days
											</TableCell>
											<TableCell sx={{ py: 1.5 }}>
												<Chip
													label={lr.status}
													size="small"
													color={
														lr.status === "PENDING"
															? "warning"
															: lr.status === "APPROVED"
																? "success"
																: lr.status === "REPAID"
																	? "primary"
																	: "error"
													}
													sx={{
														fontWeight: 800,
														fontSize: "0.65rem",
														height: 20,
													}}
												/>
											</TableCell>
											<TableCell align="center" sx={{ py: 1.5 }}>
												{lr.status === "PENDING" && (
													<Box
														sx={{
															display: "flex",
															gap: 1,
															justifyContent: "center",
														}}
													>
														<Button
															variant="contained"
															color="success"
															size="small"
															sx={{ fontWeight: 700 }}
															onClick={() => {
																setSelectedLoan(lr);
																setApproveDialogOpen(true);
															}}
														>
															Approve
														</Button>
														<Button
															variant="outlined"
															color="error"
															size="small"
															sx={{ fontWeight: 700 }}
															onClick={() => handleRejectLoan(lr.id)}
														>
															Reject
														</Button>
													</Box>
												)}
												{lr.status === "APPROVED" && lr.contract_id && (
													<Typography
														variant="caption"
														color="text.secondary"
														sx={{ fontFamily: "monospace" }}
													>
														Linked: {lr.contract_id}
													</Typography>
												)}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</Paper>
			)}

			{/* My Requested Loans Ledger */}
			<Paper
				elevation={0}
				sx={{
					p: 3,
					border: `1px solid ${theme.palette.divider}`,
					background: "rgba(20, 25, 40, 0.5)",
					backdropFilter: "blur(16px)",
					borderRadius: "16px",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
					<Avatar
						sx={{
							bgcolor: alpha(theme.palette.info.main, 0.15),
							color: "info.main",
							width: 40,
							height: 40,
						}}
					>
						<SwapHorizIcon />
					</Avatar>
					<Typography variant="h6" sx={{ fontWeight: 800 }}>
						My Loan Requests & Debts
					</Typography>
				</Box>
				<TableContainer>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell
									sx={{
										fontWeight: 800,
										borderBottom: `1px solid ${theme.palette.divider}`,
									}}
								>
									Bank
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										borderBottom: `1px solid ${theme.palette.divider}`,
									}}
									align="right"
								>
									Amount
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										borderBottom: `1px solid ${theme.palette.divider}`,
									}}
									align="right"
								>
									Interest Rate
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										borderBottom: `1px solid ${theme.palette.divider}`,
									}}
									align="right"
								>
									Term
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										borderBottom: `1px solid ${theme.palette.divider}`,
									}}
								>
									Status
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										borderBottom: `1px solid ${theme.palette.divider}`,
									}}
								>
									Linked Contract
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{requestedLoans.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										align="center"
										sx={{ py: 4, color: "text.secondary" }}
									>
										No loan requests submitted.
									</TableCell>
								</TableRow>
							) : (
								requestedLoans.map((lr) => (
									<TableRow
										key={lr.id}
										sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.01)" } }}
									>
										<TableCell sx={{ fontWeight: 700, py: 1.5 }}>
											{lr.bank_name}
										</TableCell>
										<TableCell
											align="right"
											sx={{ fontFamily: "monospace", py: 1.5 }}
										>
											{lr.amount.toLocaleString()} ICA
										</TableCell>
										<TableCell align="right" sx={{ py: 1.5 }}>
											{lr.interest_rate}%
										</TableCell>
										<TableCell align="right" sx={{ py: 1.5 }}>
											{lr.term_days} Days
										</TableCell>
										<TableCell sx={{ py: 1.5 }}>
											<Chip
												label={lr.status}
												size="small"
												color={
													lr.status === "PENDING"
														? "warning"
														: lr.status === "APPROVED"
															? "success"
															: lr.status === "REPAID"
																? "primary"
																: "error"
												}
												sx={{
													fontWeight: 800,
													fontSize: "0.65rem",
													height: 20,
												}}
											/>
										</TableCell>
										<TableCell sx={{ py: 1.5 }}>
											{lr.contract_id ? (
												<Typography
													variant="body2"
													sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}
												>
													{lr.contract_id}
												</Typography>
											) : lr.status === "APPROVED" ? (
												<Typography
													variant="caption"
													color="warning.main"
													sx={{ fontWeight: 700 }}
												>
													Pending Game Contract Setup
												</Typography>
											) : (
												"-"
											)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>

			{/* Dialog: Request Loan */}
			<Dialog
				open={requestDialogOpen}
				onClose={() => setRequestDialogOpen(false)}
				slotProps={{
					paper: {
						sx: {
							backgroundColor: "rgba(20, 25, 40, 0.95)",
							backdropFilter: "blur(12px)",
							border: "1px solid rgba(255, 255, 255, 0.08)",
							borderRadius: "16px",
							boxShadow: "0 12px 40px 0 rgba(0, 0, 0, 0.5)",
						},
					},
				}}
			>
				<DialogTitle sx={{ fontWeight: 800 }}>
					Request Loan from {selectedBank?.name}
				</DialogTitle>
				<DialogContent>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 2.5,
							pt: 1,
							minWidth: 280,
						}}
					>
						<TextField
							label="Loan Amount (ICA)"
							type="number"
							size="small"
							value={loanAmount}
							onChange={(e) => setLoanAmount(Number(e.target.value))}
						/>
						<TextField
							label="Term (Days)"
							type="number"
							size="small"
							value={loanTerm}
							onChange={(e) => setLoanTerm(Number(e.target.value))}
						/>
						<TextField
							label="Offered Interest Rate (%)"
							type="number"
							size="small"
							value={loanRate}
							onChange={(e) => setLoanRate(Number(e.target.value))}
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button
						onClick={() => setRequestDialogOpen(false)}
						sx={{ fontWeight: 700 }}
					>
						Cancel
					</Button>
					<Button
						onClick={handleRequestLoanSubmit}
						variant="contained"
						sx={{ fontWeight: 700 }}
					>
						Submit Request
					</Button>
				</DialogActions>
			</Dialog>

			{/* Dialog: Approve Loan & Link Contract */}
			<Dialog
				open={approveDialogOpen}
				onClose={() => setApproveDialogOpen(false)}
				slotProps={{
					paper: {
						sx: {
							backgroundColor: "rgba(20, 25, 40, 0.95)",
							backdropFilter: "blur(12px)",
							border: "1px solid rgba(255, 255, 255, 0.08)",
							borderRadius: "16px",
							boxShadow: "0 12px 40px 0 rgba(0, 0, 0, 0.5)",
						},
					},
				}}
			>
				<DialogTitle sx={{ fontWeight: 800 }}>Approve Loan Request</DialogTitle>
				<DialogContent>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 2,
							pt: 1,
							minWidth: 280,
						}}
					>
						<Typography variant="body2" color="text.secondary">
							To approve this loan, please provide the local ID of the in-game
							contract you created for it. When that contract is fulfilled
							in-game, this loan will automatically update.
						</Typography>
						<TextField
							label="In-Game Contract Local ID"
							size="small"
							required
							placeholder="e.g. LOAN-100"
							value={contractId}
							onChange={(e) => setContractId(e.target.value)}
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button
						onClick={() => setApproveDialogOpen(false)}
						sx={{ fontWeight: 700 }}
					>
						Cancel
					</Button>
					<Button
						onClick={handleApproveLoan}
						variant="contained"
						color="success"
						sx={{ fontWeight: 700 }}
					>
						Approve Loan
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
