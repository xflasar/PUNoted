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
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import type { BankLoanRecord } from "../types";
import { fetchClient } from "../../../utils/apiclient";

interface RelinkContractDialogProps {
	open: boolean;
	loan: BankLoanRecord | null;
	onClose: () => void;
	onSuccess: () => void;
}

export const RelinkContractDialog: React.FC<RelinkContractDialogProps> = ({
	open,
	loan,
	onClose,
	onSuccess,
}) => {
	const theme = useTheme();
	const [contractLocalId, setContractLocalId] = useState("");
	const [interestRate, setInterestRate] = useState<string>("");
	const [termDays, setTermDays] = useState<string>("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (loan && open) {
			setContractLocalId(loan.contract_id || "");
			setInterestRate(loan.interest_rate?.toString() || "");
			setTermDays(loan.term_days?.toString() || "");
			setError(null);
		}
	}, [loan, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!loan || !contractLocalId.trim()) {
			setError("Contract Local ID is required");
			return;
		}
		setSubmitting(true);
		setError(null);

		try {
			const payload: any = {
				loan_id: loan.id,
				contract_localid: contractLocalId.trim(),
				interest_rate: interestRate ? parseFloat(interestRate) : undefined,
				term_days: termDays ? parseInt(termDays, 10) : undefined,
			};

			const res = await fetchClient("/internal/banking/loans/relink", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.detail || "Failed to relink contract");
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
					<LinkIcon sx={{ color: "info.main" }} />
					<Typography variant="h6" sx={{ fontWeight: 800 }}>
						Relink Contract
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
							bgcolor: alpha(theme.palette.info.main, 0.04),
							borderRadius: 1.5,
							border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
						}}
					>
						<Typography
							variant="caption"
							sx={{ color: "text.secondary", display: "block" }}
						>
							Record ID: #{loan.id} • Current Contract:{" "}
							{loan.contract_id || "None"}
						</Typography>
						<Typography variant="caption" sx={{ color: "text.secondary" }}>
							Counterparty:{" "}
							{loan.requester_username ||
								loan.partner_code ||
								loan.partner_name ||
								"Unknown"}
						</Typography>
					</Paper>

					<TextField
						label="New Contract Local ID"
						size="small"
						fullWidth
						required
						autoFocus
						value={contractLocalId}
						onChange={(e) => setContractLocalId(e.target.value)}
						placeholder="e.g. CON-1234 or contract GUID"
						helperText="The contract local ID from in-game contract buffer"
					/>

					{(loan.transaction_type || "LOAN") === "LOAN" && (
						<Box sx={{ display: "flex", gap: 1.5 }}>
							<TextField
								label="Override Rate (%) (optional)"
								type="number"
								size="small"
								fullWidth
								value={interestRate}
								onChange={(e) => setInterestRate(e.target.value)}
							/>
							<TextField
								label="Override Term (Days) (optional)"
								type="number"
								size="small"
								fullWidth
								value={termDays}
								onChange={(e) => setTermDays(e.target.value)}
							/>
						</Box>
					)}
				</DialogContent>

				<DialogActions sx={{ p: 2, pt: 1 }}>
					<Button onClick={onClose} color="inherit" disabled={submitting}>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="contained"
						color="info"
						disabled={submitting || !contractLocalId.trim()}
						startIcon={
							submitting ? <CircularProgress size={16} /> : <LinkIcon />
						}
					>
						Relink Contract
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
};
