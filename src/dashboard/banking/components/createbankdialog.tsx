import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	TextField,
	Button,
	Box,
	MenuItem,
	Alert,
	IconButton,
	useTheme,
	Typography,
	InputAdornment,
	Switch,
	FormControlLabel,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import type { CreateBankFormState } from "../usebankingdata";
import { PRUN_CURRENCIES } from "../helpers";
import { FormattedNumberInput } from "./formattednumberinput";

interface CreateBankDialogProps {
	open: boolean;
	form: CreateBankFormState;
	creating: boolean;
	createError: string | null;
	onClose: () => void;
	onChange: <K extends keyof CreateBankFormState>(
		field: K,
		value: CreateBankFormState[K],
	) => void;
	onSubmit: (e: React.FormEvent) => void;
}

export const CreateBankDialog: React.FC<CreateBankDialogProps> = ({
	open,
	form,
	creating,
	createError,
	onClose,
	onChange,
	onSubmit,
}) => {
	const theme = useTheme();

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
						bgcolor: "#111422",
						backgroundImage: "none",
						border: `1.5px solid ${alpha(theme.palette.primary.main, 0.4)}`,
						boxShadow: `0 8px 32px rgba(0,0,0,0.6)`,
						p: 1,
					},
				},
			}}
		>
			{/* Compact Dialog Header */}
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
					<AccountBalanceIcon sx={{ fontSize: 20, color: "primary.main" }} />
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 900,
							letterSpacing: 1,
							textTransform: "uppercase",
							color: theme.palette.text.primary,
						}}
					>
						Establish Bank
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

			<DialogContent sx={{ pt: "14px !important", px: 2.5, pb: 2.5 }}>
				{createError && (
					<Alert
						severity="error"
						sx={{ mb: 1.5, py: 0.5, borderRadius: 1.5, fontSize: "0.8rem" }}
					>
						{createError}
					</Alert>
				)}

				<form
					onSubmit={onSubmit}
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 14,
						paddingTop: 4,
					}}
				>
					{/* 1. Bank Name */}
					<TextField
						label="Bank Name"
						size="small"
						placeholder="e.g. Antares Commercial Vault"
						value={form.name}
						onChange={(e) => onChange("name", e.target.value)}
						required
						fullWidth
						autoFocus
						sx={{
							"& .MuiOutlinedInput-root": {
								bgcolor: alpha(theme.palette.background.default, 0.5),
							},
						}}
					/>

					{/* 2. Card Tagline / Headline (Shown on card preview, max 100 chars) */}
					<TextField
						label="Card Headline / Tagline"
						size="small"
						placeholder="e.g. Fast approval loans for haulers & mining expansion"
						value={form.headline}
						onChange={(e) => onChange("headline", e.target.value.slice(0, 100))}
						fullWidth
						slotProps={{
							input: {
								endAdornment: (
									<InputAdornment position="end">
										<Typography
											variant="caption"
											sx={{
												color: "text.secondary",
												fontSize: "0.65rem",
												fontWeight: 700,
											}}
										>
											{form.headline.length}/100
										</Typography>
									</InputAdornment>
								),
							},
						}}
						sx={{
							"& .MuiOutlinedInput-root": {
								bgcolor: alpha(theme.palette.background.default, 0.5),
							},
						}}
					/>

					{/* Vault Cash Guidance Note */}
					<Alert
						severity="info"
						sx={{ fontSize: "0.74rem", py: 0.5, borderRadius: 1.5 }}
					>
						Vault cash starts at <strong>0 {form.currency}</strong>. Seed your
						bank capital after establishment via <strong>Record Deposit</strong>
						, <strong>Link Verified Contract</strong>, or{" "}
						<strong>CSV Ledger Import</strong>.
					</Alert>

					{/* 3. Row: Currency & Interest Rate % */}
					<Box
						sx={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 1.2 }}
					>
						<TextField
							select
							size="small"
							label="Currency"
							value={form.currency}
							onChange={(e) => onChange("currency", e.target.value)}
							fullWidth
							sx={{
								"& .MuiOutlinedInput-root": {
									bgcolor: alpha(theme.palette.background.default, 0.5),
								},
							}}
						>
							{PRUN_CURRENCIES.map((curr) => (
								<MenuItem
									key={curr.code}
									value={curr.code}
									sx={{ fontSize: "0.82rem" }}
								>
									<Box component="span" sx={{ fontWeight: 800, mr: 1 }}>
										{curr.code}
									</Box>
									<Box
										component="span"
										sx={{ color: "text.secondary", fontSize: "0.78rem" }}
									>
										— {curr.name}
									</Box>
								</MenuItem>
							))}
						</TextField>

						<TextField
							label="Interest Rate"
							size="small"
							type="number"
							value={form.interestRate}
							onChange={(e) =>
								onChange(
									"interestRate",
									e.target.value === "" ? "" : Number(e.target.value),
								)
							}
							placeholder="5.0"
							slotProps={{
								input: {
									endAdornment: (
										<InputAdornment position="end">
											<Typography
												variant="caption"
												sx={{
													fontWeight: 700,
													color: "text.secondary",
													fontSize: "0.7rem",
												}}
											>
												%
											</Typography>
										</InputAdornment>
									),
								},
							}}
							fullWidth
							sx={{
								"& .MuiOutlinedInput-root": {
									bgcolor: alpha(theme.palette.background.default, 0.5),
								},
							}}
						/>
					</Box>

					{/* 4. Row: Repay Duration & Payment Interval */}
					<Box
						sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2 }}
					>
						<TextField
							label="Repay Term"
							size="small"
							type="number"
							value={form.repayDays}
							onChange={(e) =>
								onChange(
									"repayDays",
									e.target.value === "" ? "" : Number(e.target.value),
								)
							}
							placeholder="14"
							slotProps={{
								input: {
									endAdornment: (
										<InputAdornment position="end">
											<Typography
												variant="caption"
												sx={{
													fontWeight: 700,
													color: "text.secondary",
													fontSize: "0.7rem",
												}}
											>
												Days
											</Typography>
										</InputAdornment>
									),
								},
							}}
							fullWidth
							sx={{
								"& .MuiOutlinedInput-root": {
									bgcolor: alpha(theme.palette.background.default, 0.5),
								},
							}}
						/>

						<TextField
							label="Interval"
							size="small"
							type="number"
							value={form.interval}
							onChange={(e) =>
								onChange(
									"interval",
									e.target.value === "" ? "" : Number(e.target.value),
								)
							}
							placeholder="7"
							slotProps={{
								input: {
									endAdornment: (
										<InputAdornment position="end">
											<Typography
												variant="caption"
												sx={{
													fontWeight: 700,
													color: "text.secondary",
													fontSize: "0.7rem",
												}}
											>
												Days
											</Typography>
										</InputAdornment>
									),
								},
							}}
							fullWidth
							sx={{
								"& .MuiOutlinedInput-root": {
									bgcolor: alpha(theme.palette.background.default, 0.5),
								},
							}}
						/>
					</Box>

					{/* 5. Row: Min & Max Loan Amounts (Compact 2-columns with comma formatting) */}
					<Box
						sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2 }}
					>
						<FormattedNumberInput
							label="Min Loan Amount"
							value={form.minLoan}
							onChange={(val) => onChange("minLoan", val)}
							placeholder="e.g. 5,000"
							unit={form.currency}
							icon={
								<AttachMoneyIcon
									sx={{ fontSize: 16, color: "text.secondary" }}
								/>
							}
						/>

						<FormattedNumberInput
							label="Max Loan Amount"
							value={form.maxLoan}
							onChange={(val) => onChange("maxLoan", val)}
							placeholder="e.g. 500,000"
							unit={form.currency}
							icon={
								<AttachMoneyIcon sx={{ fontSize: 16, color: "primary.main" }} />
							}
						/>
					</Box>

					{/* 6. Expandable Description & Terms (Max 2,000 chars) */}
					<TextField
						label="Description & Terms"
						size="small"
						multiline
						minRows={2.5}
						maxRows={8}
						value={form.description}
						onChange={(e) =>
							onChange("description", e.target.value.slice(0, 2000))
						}
						placeholder="Mission, collateral requirements, notes... (optional)"
						helperText={`${form.description.length}/2,000 characters`}
						fullWidth
						sx={{
							"& .MuiInputBase-root": {
								alignItems: "flex-start",
								bgcolor: alpha(theme.palette.background.default, 0.5),
							},
							"& textarea": {
								resize: "vertical",
								fontSize: "0.82rem",
							},
							"& .MuiFormHelperText-root": {
								textAlign: "right",
								fontSize: "0.65rem",
								color: "text.secondary",
							},
						}}
					/>

					{/* Public API & Directory Listing Switch */}
					<Box
						sx={{
							p: 1.25,
							px: 1.75,
							borderRadius: 1.5,
							bgcolor: alpha(theme.palette.background.default, 0.45),
							border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<Box>
							<Typography
								variant="body2"
								sx={{ fontWeight: 800, fontSize: "0.82rem" }}
							>
								Enable Public API & Directory Listing
							</Typography>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.72rem",
									display: "block",
								}}
							>
								{form.isPublic
									? "Your bank will be discoverable by other players in the Public Directory and Public API."
									: "Private / Unlisted: Accessible ONLY to you in your dashboard and Protected API."}
							</Typography>
						</Box>
						<Switch
							checked={form.isPublic}
							onChange={(e) => onChange("isPublic", e.target.checked)}
							color="primary"
							size="small"
						/>
					</Box>

					{/* 7. Action Button: [ Establish Bank ] */}
					<Button
						type="submit"
						variant="contained"
						color="primary"
						disabled={creating}
						sx={{
							mt: 0.5,
							py: 1,
							fontWeight: 900,
							fontSize: "0.85rem",
							letterSpacing: 0.8,
							borderRadius: 1.5,
							textTransform: "uppercase",
							boxShadow: "0 4px 16px rgba(123, 104, 238, 0.35)",
						}}
					>
						{creating ? "Establishing Bank..." : "Establish Bank"}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
};
