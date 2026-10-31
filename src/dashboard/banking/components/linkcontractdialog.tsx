import React, { useState, useEffect, useRef } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Box,
	Typography,
	Paper,
	Chip,
	CircularProgress,
	Alert,
	Divider,
	IconButton,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	InputAdornment,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddLinkIcon from "@mui/icons-material/AddLink";
import HandshakeIcon from "@mui/icons-material/Handshake";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import type { Bank, BankLoanRecord } from "../types";
import { fetchClient } from "../../../utils/apiclient";
import { CheckCircleOutlineOutlined } from "@mui/icons-material";

interface LinkContractDialogProps {
	open: boolean;
	bank: Bank;
	onClose: () => void;
	onSuccess: (newLoan: BankLoanRecord) => void;
}

interface ContractSummary {
	id: string;
	localid?: string;
	partnername?: string;
	partnercode?: string;
	total_amount?: number;
	currency?: string;
	status?: string;
	contracttype?: string;
	date?: string;
	term_days?: number;
	interest_rate?: number;
}

export const LinkContractDialog: React.FC<LinkContractDialogProps> = ({
	open,
	bank,
	onClose,
	onSuccess,
}) => {
	const theme = useTheme();
	const [localId, setLocalId] = useState("");
	const [transactionType, setTransactionType] = useState<
		"LOAN" | "DEPOSIT" | "WITHDRAWAL"
	>("LOAN");

	const [recentContracts, setRecentContracts] = useState<ContractSummary[]>([]);
	const [loadingRecent, setLoadingRecent] = useState(false);
	const [searchingContract, setSearchingContract] = useState(false);
	const [selectedPreview, setSelectedPreview] =
		useState<ContractSummary | null>(null);

	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const searchTimerRef = useRef<any>(null);

	// Load recent contracts so the banker can quickly pick one
	useEffect(() => {
		if (open) {
			setError(null);
			setLocalId("");
			setSelectedPreview(null);
			setTransactionType("LOAN");

			setLoadingRecent(true);
			fetchClient("/internal/contracts/list", {
				method: "POST",
				body: JSON.stringify({ page: 1, limit: 50 }),
			})
				.then((res) => (res.ok ? res.json() : { items: [] }))
				.then((data: any) => {
					setRecentContracts(data.items || []);
				})
				.catch((err) => {
					console.error("Failed to load recent contracts", err);
				})
				.finally(() => {
					setLoadingRecent(false);
				});
		}
	}, [open, bank]);

	// Live debounced search when user types a local ID
	useEffect(() => {
		const trimmed = localId.trim();
		if (!trimmed) {
			setSelectedPreview(null);
			return;
		}

		// First check locally in recent contracts for instantaneous feedback
		const localMatch = recentContracts.find(
			(c) =>
				(c.localid && c.localid.toLowerCase() === trimmed.toLowerCase()) ||
				(c.id && c.id.toLowerCase() === trimmed.toLowerCase()),
		);
		if (localMatch) {
			setSelectedPreview(localMatch);
			return;
		}

		// Debounce backend search for older or unindexed contracts
		if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

		if (trimmed.length >= 3) {
			setSearchingContract(true);
			searchTimerRef.current = setTimeout(async () => {
				try {
					const res = await fetchClient("/internal/contracts/list", {
						method: "POST",
						body: JSON.stringify({ search: trimmed, page: 1, limit: 5 }),
					});
					if (res.ok) {
						const data = await res.json();
						const items: ContractSummary[] = data.items || [];
						const matched =
							items.find(
								(c) =>
									(c.localid &&
										c.localid.toLowerCase() === trimmed.toLowerCase()) ||
									(c.id && c.id.toLowerCase() === trimmed.toLowerCase()),
							) || items[0];

						if (matched) {
							setSelectedPreview(matched);
						} else {
							setSelectedPreview(null);
						}
					}
				} catch (err) {
					console.error("Search contract error", err);
				} finally {
					setSearchingContract(false);
				}
			}, 300);
		} else {
			setSelectedPreview(null);
		}

		return () => {
			if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		};
	}, [localId, recentContracts]);

	const handleSelectRecent = (val: string) => {
		setLocalId(val);
		setError(null);
	};

	const handleSubmit = async () => {
		const trimmedId = localId.trim();
		if (!trimmedId) {
			setError("Please provide a contract Local ID.");
			return;
		}

		setSubmitting(true);
		setError(null);

		try {
			const res = await fetchClient("/internal/banking/loans/link", {
				method: "POST",
				body: JSON.stringify({
					bank_id: bank.id,
					contract_localid: trimmedId,
					transaction_type: transactionType,
				}),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.detail || "Failed to link contract to bank");
			}

			const createdLoan: BankLoanRecord = await res.json();
			onSuccess(createdLoan);
			onClose();
		} catch (err: any) {
			setError(err.message || "An unexpected error occurred while linking.");
		} finally {
			setSubmitting(false);
		}
	};

	const isDeposit = transactionType === "DEPOSIT";
	const isWithdrawal = transactionType === "WITHDRAWAL";
	const isLoan = transactionType === "LOAN";
	const mainColor = isDeposit
		? theme.palette.success.main
		: isWithdrawal
			? theme.palette.error.main
			: theme.palette.primary.main;
	const mainBtnColor: "success" | "error" | "primary" = isDeposit
		? "success"
		: isWithdrawal
			? "error"
			: "primary";

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			slotProps={{
				paper: {
					sx: {
						borderRadius: 2,
						bgcolor: alpha(theme.palette.background.default, 0.96),
						backdropFilter: "blur(16px)",
						border: `1.5px solid ${alpha(mainColor, 0.4)}`,
						boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
						p: 0.5,
					},
				},
			}}
		>
			<DialogTitle
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					pt: 1.5,
					pb: 1,
					px: 2.5,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<AddLinkIcon sx={{ color: mainColor, fontSize: 20 }} />
					<Typography
						variant="subtitle1"
						sx={{ fontWeight: 800, letterSpacing: 0.5 }}
					>
						{isDeposit
							? "Link Verified Deposit Contract"
							: isWithdrawal
								? "Link Verified Withdrawal Contract"
								: "Link In-Game Loan Contract"}
					</Typography>
				</Box>
				<IconButton
					size="small"
					onClick={onClose}
					sx={{ color: "text.secondary" }}
				>
					<CloseIcon sx={{ fontSize: 18 }} />
				</IconButton>
			</DialogTitle>

			<DialogContent
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: 1.5,
					px: 2.5,
					pt: "8px !important",
					pb: 1.5,
				}}
			>
				{/* Transaction Type 3-Way Segmented Toggle */}
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr 1fr",
						p: 0.5,
						bgcolor: alpha(theme.palette.background.paper, 0.4),
						borderRadius: 1.5,
						gap: 0.5,
					}}
				>
					<Button
						size="small"
						variant={isLoan ? "contained" : "text"}
						color={isLoan ? "primary" : "inherit"}
						onClick={() => setTransactionType("LOAN")}
						sx={{
							textTransform: "none",
							fontWeight: 800,
							fontSize: "0.72rem",
							borderRadius: 1.2,
							py: 0.5,
						}}
					>
						Outgoing Loan
					</Button>
					<Button
						size="small"
						variant={isDeposit ? "contained" : "text"}
						color={isDeposit ? "success" : "inherit"}
						onClick={() => setTransactionType("DEPOSIT")}
						sx={{
							textTransform: "none",
							fontWeight: 800,
							fontSize: "0.72rem",
							borderRadius: 1.2,
							py: 0.5,
						}}
					>
						Deposit (Inflow)
					</Button>
					<Button
						size="small"
						variant={isWithdrawal ? "contained" : "text"}
						color={isWithdrawal ? "error" : "inherit"}
						onClick={() => setTransactionType("WITHDRAWAL")}
						sx={{
							textTransform: "none",
							fontWeight: 800,
							fontSize: "0.72rem",
							borderRadius: 1.2,
							py: 0.5,
						}}
					>
						Withdrawal (Outflow)
					</Button>
				</Box>

				<Typography
					variant="caption"
					sx={{ color: "text.secondary", lineHeight: 1.4 }}
				>
					{isDeposit &&
						"Link an incoming in-game contract where a user deposits capital into the bank. If the payment condition is pending in-game, the transaction remains PENDING and will not inflate vault liquidity or depositor balance until fulfilled."}
					{isWithdrawal &&
						"Link an outgoing in-game contract where the bank pays capital back to a client. It will remain PENDING until the payment condition is fulfilled in-game, after which it will be deducted from vault liquidity and depositor balance."}
					{isLoan &&
						"Link an in-game trade or loan contract. Enter its Local ID (e.g. X4CNYDJ) or select from recent contracts. All parameters (amount, interest, and term) will be extracted automatically."}
				</Typography>

				{error && (
					<Alert
						severity="error"
						sx={{ py: 0.5, borderRadius: 1.5, fontSize: "0.8rem" }}
					>
						{error}
					</Alert>
				)}

				{/* 1. Direct Text Input for Contract Local ID */}
				<TextField
					label={
						isDeposit
							? "Deposit Contract Local ID"
							: isWithdrawal
								? "Withdrawal Contract Local ID"
								: "Contract Local ID"
					}
					size="small"
					placeholder="e.g. W1CNYD9"
					value={localId}
					onChange={(e) => setLocalId(e.target.value)}
					fullWidth
					autoFocus
					slotProps={{
						input: {
							endAdornment: (
								<InputAdornment position="end">
									{searchingContract ? (
										<CircularProgress
											size={16}
											color="inherit"
											sx={{ mr: 0.5 }}
										/>
									) : (
										<SearchIcon
											sx={{ fontSize: 18, color: "text.secondary" }}
										/>
									)}
								</InputAdornment>
							),
						},
					}}
					sx={{
						"& .MuiOutlinedInput-root": {
							bgcolor: alpha(theme.palette.background.paper, 0.4),
						},
					}}
				/>

				{/* Quick pick from recent contracts */}
				{recentContracts.length > 0 && (
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<FormControl
							size="small"
							fullWidth
							sx={{
								"& .MuiOutlinedInput-root": {
									bgcolor: alpha(theme.palette.background.paper, 0.3),
								},
							}}
						>
							<InputLabel
								id="recent-contract-select"
								sx={{ fontSize: "0.78rem" }}
							>
								Or pick from recent contracts...
							</InputLabel>
							<Select
								labelId="recent-contract-select"
								label="Or pick from recent contracts..."
								value=""
								onChange={(e) => handleSelectRecent(e.target.value as string)}
								size="small"
								sx={{ fontSize: "0.78rem" }}
							>
								{recentContracts.map((c) => (
									<MenuItem
										key={c.id}
										value={c.localid || c.id}
										sx={{ fontSize: "0.78rem" }}
									>
										<strong style={{ marginRight: 6 }}>
											{c.localid || c.id}
										</strong>{" "}
										— {c.partnercode ? `[${c.partnercode}] ` : ""}
										{c.partnername || "Unknown"} (
										{(c.total_amount || 0).toLocaleString()}{" "}
										{c.currency || "ICA"})
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
				)}

				{/* Live Preview Card with Auto-Extracted Contract Data */}
				{selectedPreview ? (
					<Paper
						elevation={0}
						sx={{
							p: 1.5,
							borderRadius: 2,
							bgcolor: alpha(mainColor, 0.06),
							border: `1px solid ${alpha(mainColor, 0.25)}`,
							display: "flex",
							flexDirection: "column",
							gap: 1.2,
						}}
					>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
								<HandshakeIcon sx={{ color: mainColor, fontSize: 18 }} />
								<Typography variant="body2" sx={{ fontWeight: 800 }}>
									{selectedPreview.partnercode
										? `[${selectedPreview.partnercode}] `
										: ""}
									{selectedPreview.partnername || "Unknown Partner"}
								</Typography>
							</Box>
							<Chip
								label={
									selectedPreview.status === "FULFILLED" ||
									selectedPreview.status === "CLOSED"
										? isDeposit
											? "VERIFIED DEPOSIT"
											: isWithdrawal
												? "SETTLED PAYOUT"
												: "REPAID"
										: selectedPreview.status || "OPEN"
								}
								size="small"
								color={
									selectedPreview.status === "FULFILLED" ||
									selectedPreview.status === "CLOSED"
										? "success"
										: "info"
								}
								sx={{ fontSize: "0.65rem", fontWeight: 800, height: 20 }}
							/>
						</Box>

						<Divider sx={{ borderColor: alpha(theme.palette.divider, 0.12) }} />

						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: "repeat(3, 1fr)",
								gap: 1,
							}}
						>
							<Box
								sx={{
									bgcolor: alpha(theme.palette.background.paper, 0.4),
									p: 1,
									borderRadius: 1.5,
								}}
							>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontSize: "0.68rem",
										display: "block",
									}}
								>
									{isDeposit
										? "Deposit Amount"
										: isWithdrawal
											? "Withdrawal Amount"
											: "Principal Amount"}
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontWeight: 800,
										color: mainColor,
										fontSize: "0.82rem",
									}}
								>
									{(selectedPreview.total_amount || 0).toLocaleString()}{" "}
									{selectedPreview.currency || "ICA"}
								</Typography>
							</Box>

							<Box
								sx={{
									bgcolor: alpha(theme.palette.background.paper, 0.4),
									p: 1,
									borderRadius: 1.5,
								}}
							>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontSize: "0.68rem",
										display: "block",
									}}
								>
									{isDeposit || isWithdrawal ? "Type" : "Interest Rate"}
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontWeight: 800,
										color: "text.primary",
										fontSize: "0.82rem",
									}}
								>
									{isDeposit
										? "Deposit / Inflow"
										: isWithdrawal
											? "Withdrawal / Outflow"
											: selectedPreview.interest_rate != null
												? `${selectedPreview.interest_rate}%`
												: "From Contract"}
								</Typography>
							</Box>

							<Box
								sx={{
									bgcolor: alpha(theme.palette.background.paper, 0.4),
									p: 1,
									borderRadius: 1.5,
								}}
							>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontSize: "0.68rem",
										display: "block",
									}}
								>
									{isDeposit
										? "Vault Inflow"
										: isWithdrawal
											? "Vault Outflow"
											: "Term Duration"}
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontWeight: 800,
										color: isDeposit
											? "success.main"
											: isWithdrawal
												? "warning.main"
												: "text.primary",
										fontSize: "0.82rem",
									}}
								>
									{isDeposit
										? `+${(selectedPreview.total_amount || 0).toLocaleString()} ${selectedPreview.currency || "ICA"}`
										: isWithdrawal
											? `-${(selectedPreview.total_amount || 0).toLocaleString()} ${selectedPreview.currency || "ICA"}`
											: selectedPreview.term_days != null
												? `${selectedPreview.term_days} Days`
												: "From Contract"}
								</Typography>
							</Box>
						</Box>

						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontSize: "0.7rem",
								fontStyle: "italic",
								textAlign: "center",
								pt: 0.2,
							}}
						>
							{isDeposit
								? "If the payment condition is pending in-game, the transaction will remain PENDING until fulfilled before crediting vault liquidity."
								: isWithdrawal
									? "If the payout condition is pending in-game, the transaction will remain PENDING until disbursed before deducting vault liquidity."
									: "All financial parameters and conditions will be synced directly from this contract."}
						</Typography>
					</Paper>
				) : localId.trim() && !searchingContract ? (
					<Box
						sx={{
							p: 1.2,
							borderRadius: 1.5,
							bgcolor: alpha(theme.palette.info.main, 0.08),
							border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "info.light",
								fontSize: "0.75rem",
								display: "block",
							}}
						>
							Contract <strong>{localId.trim()}</strong> will be verified
							against the ledger.{" "}
							{isDeposit
								? "If payment condition is still pending in-game, status remains PENDING and vault liquidity will only be credited once fulfilled."
								: isWithdrawal
									? "If payout condition is still pending in-game, status remains PENDING and vault liquidity will only be deducted once fulfilled."
									: "Principal amount, interest rate, term days, and repayment status will all be extracted automatically from its contract conditions."}
						</Typography>
					</Box>
				) : null}
			</DialogContent>

			<DialogActions sx={{ px: 2.5, py: 1.5, pt: 0.5 }}>
				<Button
					onClick={onClose}
					size="small"
					color="inherit"
					disabled={submitting}
					sx={{ textTransform: "none" }}
				>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					color={mainBtnColor}
					size="small"
					disabled={submitting || !localId.trim()}
					startIcon={
						submitting ? (
							<CircularProgress size={14} color="inherit" />
						) : (
							<CheckCircleOutlineOutlined sx={{ fontSize: 16 }} />
						)
					}
					sx={{
						fontWeight: 800,
						textTransform: "none",
						px: 2.5,
						borderRadius: 1.5,
					}}
				>
					{submitting
						? "Linking..."
						: isDeposit
							? "Link Verified Deposit"
							: isWithdrawal
								? "Link Verified Withdrawal"
								: "Link Contract Loan"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
