import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Box,
	Typography,
	Alert,
	IconButton,
	FormControlLabel,
	Checkbox,
	Chip,
	useTheme,
	CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import ArrowDownwardOutlinedIcon from "@mui/icons-material/ArrowDownwardOutlined";
import ArrowUpwardOutlinedIcon from "@mui/icons-material/ArrowUpwardOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import type { Bank, BankLoanRecord } from "../types";
import { fetchClient } from "../../../utils/apiclient";
import { FormattedNumberInput } from "./formattednumberinput";

interface ManualDepositDialogProps {
	open: boolean;
	bank: Bank;
	onClose: () => void;
	onSuccess: (newRecord?: BankLoanRecord) => void;
}

const QUICK_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];

export const ManualDepositDialog: React.FC<ManualDepositDialogProps> = ({
	open,
	bank,
	onClose,
	onSuccess,
}) => {
	const theme = useTheme();

	const [transactionType, setTransactionType] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT");
	const [amount, setAmount] = useState<number | "">("");
	const [username, setUsername] = useState<string>(bank.owner_username || "");
	const [note, setNote] = useState<string>("");
	const [updateLiquidity, setUpdateLiquidity] = useState<boolean>(true);

	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			setTransactionType("DEPOSIT");
			setAmount("");
			setUsername(bank.owner_username || "");
			setNote("");
			setUpdateLiquidity(true);
			setError(null);
			setSubmitting(false);
		}
	}, [open, bank]);

	const handleAddQuickAmount = (delta: number) => {
		setAmount((prev) => (typeof prev === "number" ? prev + delta : delta));
	};

	const handleSubmit = async () => {
		if (amount === "" || Number(amount) <= 0) {
			setError("Please enter a valid amount greater than 0");
			return;
		}

		if (!username.trim()) {
			setError("Please provide a contributor / depositor username");
			return;
		}

		setSubmitting(true);
		setError(null);

		try {
			const res = await fetchClient("/internal/banking/deposits/manual", {
				method: "POST",
				body: JSON.stringify({
					bank_id: bank.id,
					amount: Number(amount),
					username: username.trim(),
					transaction_type: transactionType,
					note: note.trim() || undefined,
					update_liquidity: updateLiquidity,
				}),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.detail || "Failed to record manual transaction");
			}

			const data = await res.json();
			onSuccess(data);
			onClose();
		} catch (err: any) {
			console.error("Error recording manual transaction:", err);
			setError(err.message || "An unexpected error occurred");
		} finally {
			setSubmitting(false);
		}
	};

	const currency = bank.currency || "ICA";
	const isDeposit = transactionType === "DEPOSIT";

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					bgcolor: theme.palette.background.paper,
					backgroundImage: "none",
					borderRadius: 2.5,
					border: `1.5px solid ${alpha(isDeposit ? theme.palette.success.main : theme.palette.error.main, 0.4)}`,
					boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.4)}`,
				},
			}}
		>
			<DialogTitle
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					pb: 1,
					pt: 2,
					px: 2.5,
					borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
					<AccountBalanceWalletOutlinedIcon sx={{ color: isDeposit ? theme.palette.success.main : theme.palette.error.main, fontSize: 24 }} />
					<Box>
						<Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.2 }}>
							Record Manual Deposit / Capital
						</Typography>
						<Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
							Bank: <strong style={{ color: theme.palette.text.primary }}>{bank.name}</strong>
						</Typography>
					</Box>
				</Box>
				<IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
					<CloseIcon fontSize="small" />
				</IconButton>
			</DialogTitle>

			<DialogContent sx={{ pt: 2.5, pb: 2, px: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}>
				{error && (
					<Alert severity="error" onClose={() => setError(null)} sx={{ fontSize: "0.82rem" }}>
						{error}
					</Alert>
				)}

				{/* Transaction Type Segmented Toggle */}
				<Box>
					<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", fontSize: "0.68rem", mb: 0.8, display: "block" }}>
						Transaction Direction
					</Typography>
					<Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
						<Button
							variant={isDeposit ? "contained" : "outlined"}
							color={isDeposit ? "success" : "inherit"}
							onClick={() => setTransactionType("DEPOSIT")}
							startIcon={<ArrowDownwardOutlinedIcon />}
							sx={{
								textTransform: "none",
								fontWeight: 800,
								py: 1.2,
								fontSize: "0.85rem",
								bgcolor: isDeposit ? alpha(theme.palette.success.main, 0.18) : "transparent",
								color: isDeposit ? theme.palette.success.light : "text.secondary",
								borderColor: isDeposit ? theme.palette.success.main : alpha(theme.palette.divider, 0.2),
								"&:hover": {
									bgcolor: isDeposit ? alpha(theme.palette.success.main, 0.28) : alpha(theme.palette.action.hover, 0.08),
								},
							}}
						>
							Deposit / Capital Inflow
						</Button>

						<Button
							variant={!isDeposit ? "contained" : "outlined"}
							color={!isDeposit ? "error" : "inherit"}
							onClick={() => setTransactionType("WITHDRAWAL")}
							startIcon={<ArrowUpwardOutlinedIcon />}
							sx={{
								textTransform: "none",
								fontWeight: 800,
								py: 1.2,
								fontSize: "0.85rem",
								bgcolor: !isDeposit ? alpha(theme.palette.error.main, 0.18) : "transparent",
								color: !isDeposit ? theme.palette.error.light : "text.secondary",
								borderColor: !isDeposit ? theme.palette.error.main : alpha(theme.palette.divider, 0.2),
								"&:hover": {
									bgcolor: !isDeposit ? alpha(theme.palette.error.main, 0.28) : alpha(theme.palette.action.hover, 0.08),
								},
							}}
						>
							Withdrawal / Capital Draw
						</Button>
					</Box>
				</Box>

				{/* Contributor / Depositor Username */}
				<Box>
					<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
						<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", fontSize: "0.68rem" }}>
							Contributor / Depositor Username
						</Typography>
						{username !== bank.owner_username && (
							<Chip
								label={`Use Bank Owner (${bank.owner_username})`}
								size="small"
								clickable
								onClick={() => setUsername(bank.owner_username)}
								sx={{ fontSize: "0.65rem", height: 20 }}
							/>
						)}
					</Box>
					<TextField
						size="small"
						fullWidth
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="e.g. your username or investor name"
						helperText="The user credited with this deposit in the ledger and depositors tab."
						slotProps={{
							formHelperText: {
								sx: { fontSize: "0.7rem", color: "text.secondary" },
							},
						}}
					/>
				</Box>

				{/* Amount Field & Quick Buttons */}
				<Box>
					<FormattedNumberInput
						label={isDeposit ? "Deposit Amount" : "Withdrawal Amount"}
						value={amount}
						onChange={(val) => setAmount(val)}
						unit={currency}
						placeholder="0"
						required
					/>

					{/* Quick amount addition pills */}
					<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mt: 1, alignItems: "center" }}>
						<Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem", mr: 0.5 }}>
							Quick Add:
						</Typography>
						{QUICK_AMOUNTS.map((q) => (
							<Chip
								key={q}
								label={`+${(q / 1000).toLocaleString()}k`}
								size="small"
								variant="outlined"
								clickable
								onClick={() => handleAddQuickAmount(q)}
								sx={{
									fontSize: "0.65rem",
									fontWeight: 700,
									height: 22,
									borderColor: alpha(theme.palette.divider, 0.2),
									"&:hover": {
										borderColor: isDeposit ? theme.palette.success.main : theme.palette.error.main,
										bgcolor: isDeposit ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
									},
								}}
							/>
						))}
						{amount !== "" && (
							<Chip
								label="Clear"
								size="small"
								variant="outlined"
								clickable
								onClick={() => setAmount("")}
								sx={{ fontSize: "0.65rem", height: 22, color: "text.secondary" }}
							/>
						)}
					</Box>
				</Box>

				{/* Optional Reference Note */}
				<Box>
					<TextField
						label="Reference / Note (Optional)"
						size="small"
						fullWidth
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="e.g. Owner seed capital injection, In-game direct transfer, APEX trade"
						helperText="Optional reference or description displayed in the ledger."
						slotProps={{
							formHelperText: {
								sx: { fontSize: "0.7rem", color: "text.secondary" },
							},
						}}
					/>
				</Box>

				{/* Update Bank Liquidity Reserves Checkbox */}
				<Box
					sx={{
						p: 1.5,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.default, 0.5),
						border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
					}}
				>
					<FormControlLabel
						control={
							<Checkbox
								checked={updateLiquidity}
								onChange={(e) => setUpdateLiquidity(e.target.checked)}
								color={isDeposit ? "success" : "error"}
								size="small"
							/>
						}
						label={
							<Box>
								<Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.82rem" }}>
									Update Bank Liquidity Reserves (Current Money)
								</Typography>
								<Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem", display: "block" }}>
									{isDeposit
										? `Immediately add +${typeof amount === "number" ? amount.toLocaleString() : "0"} ${currency} to bank's available reserve balance.`
										: `Immediately deduct -${typeof amount === "number" ? amount.toLocaleString() : "0"} ${currency} from bank's available reserve balance.`}
								</Typography>
							</Box>
						}
					/>
				</Box>

				<Alert severity="info" sx={{ fontSize: "0.74rem", py: 0.5 }}>
					Manual transactions are marked as <strong>Manual</strong> in the ledger since they are not linked to an in-game contract. They fully participate in depositor history, total deposits, and liquidity calculations.
				</Alert>
			</DialogContent>

			<DialogActions sx={{ p: 2, px: 2.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
				<Button onClick={onClose} color="inherit" disabled={submitting} sx={{ fontWeight: 700, textTransform: "none" }}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					color={isDeposit ? "success" : "error"}
					disabled={submitting || amount === "" || Number(amount) <= 0}
					startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SavingsOutlinedIcon sx={{ fontSize: 18 }} />}
					sx={{
						fontWeight: 800,
						textTransform: "none",
						px: 2.5,
					}}
				>
					{submitting
						? "Saving..."
						: isDeposit
						? "Record Deposit"
						: "Record Withdrawal"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
