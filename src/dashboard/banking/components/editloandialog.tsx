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
	Paper,
	CircularProgress,
	Alert,
	IconButton,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import type { BankLoanRecord } from "../types";
import { fetchClient } from "../../../utils/apiclient";

interface EditLoanDialogProps {
	open: boolean;
	loan: BankLoanRecord | null;
	onClose: () => void;
	onSuccess: () => void;
}

export const EditLoanDialog: React.FC<EditLoanDialogProps> = ({
	open,
	loan,
	onClose,
	onSuccess,
}) => {
	const theme = useTheme();
	const [amount, setAmount] = useState<string>("");
	const [interestRate, setInterestRate] = useState<string>("");
	const [termDays, setTermDays] = useState<string>("");
	const [requester, setRequester] = useState<string>("");
	const [contractId, setContractId] = useState<string>("");
	const [loanStructure, setLoanStructure] = useState<string>("STANDARD");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (loan && open) {
			setAmount(loan.amount?.toString() || "");
			setInterestRate(loan.interest_rate?.toString() || "");
			setTermDays(loan.term_days?.toString() || "");
			setRequester(
				loan.requester_username || loan.partner_code || loan.partner_name || "",
			);
			setContractId(loan.contract_id || "");
			setLoanStructure(loan.loan_structure || "STANDARD");
			setError(null);
		}
	}, [loan, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!loan) return;
		setSubmitting(true);
		setError(null);

		try {
			const payload: any = {
				loan_id: loan.id,
				amount: amount ? parseFloat(amount) : undefined,
				interest_rate: interestRate ? parseFloat(interestRate) : undefined,
				term_days: termDays ? parseInt(termDays, 10) : undefined,
				requester_username: requester.trim() || undefined,
				contract_id: contractId.trim() || undefined,
				loan_structure:
					(loan.transaction_type || "LOAN") === "LOAN"
						? loanStructure
						: undefined,
			};

			const res = await fetchClient(`/internal/banking/loans/${loan.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(
					errData.detail || "Failed to update transaction record",
				);
			}

			onSuccess();
			onClose();
		} catch (err: any) {
			setError(err.message || "An unexpected error occurred");
		} finally {
			setSubmitting(false);
		}
	};

	if (!loan) return null;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
			slotProps={{
				paper: {
					sx: {
						borderRadius: 2,
						bgcolor: "background.paper",
						backgroundImage: "none",
						border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
					},
				},
			}}
		>
			<DialogTitle
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					pb: 1,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					<EditIcon sx={{ color: "primary.main" }} />
					<Typography variant="h6" sx={{ fontWeight: 800 }}>
						Edit Transaction
					</Typography>
				</Box>
				<IconButton size="small" onClick={onClose}>
					<CloseIcon fontSize="small" />
				</IconButton>
			</DialogTitle>

			<form onSubmit={handleSubmit}>
				<DialogContent
					sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
				>
					{error && (
						<Alert severity="error" onClose={() => setError(null)}>
							{error}
						</Alert>
					)}

					<Paper
						elevation={0}
						sx={{
							p: 1.5,
							bgcolor: alpha(theme.palette.primary.main, 0.04),
							borderRadius: 1.5,
							border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
						}}
					>
						<Typography
							variant="caption"
							sx={{ color: "text.secondary", display: "block" }}
						>
							Record ID: #{loan.id} • Type: {loan.transaction_type || "LOAN"}
						</Typography>
						<Typography variant="caption" sx={{ color: "text.secondary" }}>
							Status: {loan.status}
						</Typography>
					</Paper>

					<TextField
						label="Counterparty / Username"
						size="small"
						fullWidth
						value={requester}
						onChange={(e) => setRequester(e.target.value)}
						helperText="Name of borrower or depositor"
					/>

					<TextField
						label="Amount"
						type="number"
						size="small"
						fullWidth
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
					/>

					{(loan.transaction_type || "LOAN") === "LOAN" && (
						<>
							<Box sx={{ display: "flex", gap: 1.5 }}>
								<TextField
									label="Interest Rate (%)"
									type="number"
									size="small"
									fullWidth
									value={interestRate}
									onChange={(e) => setInterestRate(e.target.value)}
								/>
								<TextField
									label="Term (Days)"
									type="number"
									size="small"
									fullWidth
									value={termDays}
									onChange={(e) => setTermDays(e.target.value)}
								/>
							</Box>
							<FormControl size="small" fullWidth>
								<InputLabel id="edit-loan-structure-label">
									Loan Structure / Type
								</InputLabel>
								<Select
									labelId="edit-loan-structure-label"
									label="Loan Structure / Type"
									value={loanStructure}
									onChange={(e) => setLoanStructure(e.target.value)}
								>
									<MenuItem value="STANDARD">Standard / General</MenuItem>
									<MenuItem value="INTEREST_ONLY">
										Interest-Only Loan (IO)
									</MenuItem>
									<MenuItem value="AMORTIZING_STABLE">
										Stable Loan (Principal + Interest Amortized)
									</MenuItem>
								</Select>
							</FormControl>
						</>
					)}

					<TextField
						label="Contract ID / Local ID"
						size="small"
						fullWidth
						value={contractId}
						onChange={(e) => setContractId(e.target.value)}
						helperText="Contract reference string or code"
					/>
				</DialogContent>

				<DialogActions sx={{ p: 2, pt: 1 }}>
					<Button onClick={onClose} color="inherit" disabled={submitting}>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={submitting}
						startIcon={
							submitting ? <CircularProgress size={16} /> : <EditIcon />
						}
					>
						Save Changes
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
};
