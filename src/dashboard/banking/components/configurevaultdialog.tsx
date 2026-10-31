import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	TextField,
	Switch,
	FormControlLabel,
	Divider,
	useTheme,
	Alert,
	MenuItem,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import type { Bank } from "../types";
import { fetchClient } from "../../../utils/apiclient";

interface ConfigureVaultDialogProps {
	open: boolean;
	bank: Bank;
	onClose: () => void;
	onBankUpdated: () => void;
}

export const ConfigureVaultDialog: React.FC<ConfigureVaultDialogProps> = ({
	open,
	bank,
	onClose,
	onBankUpdated,
}) => {
	const theme = useTheme();

	const [interestRate, setInterestRate] = useState(bank.default_interest_rate);
	const [maxInterestRate, setMaxInterestRate] = useState<number | "">(
		bank.max_interest_rate ?? "",
	);
	const [weeklyYieldRate, setWeeklyYieldRate] = useState<number | "">(
		bank.weekly_yield_rate ?? 1.5,
	);
	const [maxWeeklyYieldRate, setMaxWeeklyYieldRate] = useState<number | "">(
		bank.max_weekly_yield_rate ?? "",
	);
	const [depositStrategy, setDepositStrategy] = useState<
		"PROFIT" | "BALANCED" | "GROWTH"
	>(bank.deposit_strategy || "BALANCED");
	const [depositStatus, setDepositStatus] = useState<
		"OPEN" | "NEAR_CAPACITY" | "PAUSED"
	>(bank.deposit_status || "OPEN");
	const [headline, setHeadline] = useState(bank.headline || "");
	const [description, setDescription] = useState(bank.description || "");
	const [publicShowLoans, setPublicShowLoans] = useState(
		bank.public_show_loans ?? true,
	);
	const [publicShowDeposits, setPublicShowDeposits] = useState(
		bank.public_show_deposits ?? true,
	);
	const [publicShowWithdrawals, setPublicShowWithdrawals] = useState(
		bank.public_show_withdrawals ?? true,
	);
	const [publicShowNames, setPublicShowNames] = useState(
		bank.public_show_names ?? false,
	);
	const [isPublic, setIsPublic] = useState(bank.is_public ?? true);
	const [savingVault, setSavingVault] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Sync states when bank changes or dialog opens
	useEffect(() => {
		if (open) {
			setInterestRate(bank.default_interest_rate);
			setMaxInterestRate(bank.max_interest_rate ?? "");
			setWeeklyYieldRate(bank.weekly_yield_rate ?? 1.5);
			setMaxWeeklyYieldRate(bank.max_weekly_yield_rate ?? "");
			setDepositStrategy(bank.deposit_strategy || "BALANCED");
			setDepositStatus(bank.deposit_status || "OPEN");
			setHeadline(bank.headline || "");
			setDescription(bank.description || "");
			setPublicShowLoans(bank.public_show_loans ?? true);
			setPublicShowDeposits(bank.public_show_deposits ?? true);
			setPublicShowWithdrawals(bank.public_show_withdrawals ?? true);
			setPublicShowNames(bank.public_show_names ?? false);
			setIsPublic(bank.is_public ?? true);
			setError(null);
		}
	}, [open, bank]);

	const handleSave = async () => {
		setSavingVault(true);
		setError(null);
		try {
			const res = await fetchClient(`/internal/banking/${bank.id}`, {
				method: "PUT",
				body: JSON.stringify({
					headline: headline.trim() || null,
					description,
					default_interest_rate: Number(interestRate),
					max_interest_rate:
						maxInterestRate === "" ? null : Number(maxInterestRate),
					weekly_yield_rate:
						weeklyYieldRate === "" ? 1.5 : Number(weeklyYieldRate),
					max_weekly_yield_rate:
						maxWeeklyYieldRate === "" ? null : Number(maxWeeklyYieldRate),
					deposit_strategy: depositStrategy,
					deposit_status: depositStatus,
					public_show_loans: publicShowLoans,
					public_show_deposits: publicShowDeposits,
					public_show_withdrawals: publicShowWithdrawals,
					public_show_names: publicShowNames,
					is_public: isPublic,
				}),
			});

			if (res.ok) {
				onClose();
				onBankUpdated();
			} else {
				const err = await res.json().catch(() => ({}));
				setError(err.detail || "Failed to update vault settings");
			}
		} catch (e: any) {
			console.error("Failed to save bank vault settings", e);
			setError(e.message || "An unexpected network error occurred.");
		} finally {
			setSavingVault(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			slotProps={{
				paper: {
					sx: {
						borderRadius: 3,
						background:
							"linear-gradient(135deg, rgba(20, 24, 38, 0.98) 0%, rgba(12, 14, 24, 0.98) 100%)",
						border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
						backdropFilter: "blur(20px)",
						color: "#fff",
					},
				},
			}}
		>
			<DialogTitle
				sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1 }}
			>
				<TuneIcon sx={{ fontSize: 20, color: "primary.main" }} />
				<Box>
					<Typography
						variant="h6"
						sx={{ fontWeight: 800, fontSize: "1.05rem" }}
					>
						Configure Bank Vault &amp; Privacy
					</Typography>
					<Typography variant="caption" sx={{ color: "text.secondary" }}>
						Bank:{" "}
						<strong style={{ color: theme.palette.primary.main }}>
							{bank.name}
						</strong>
					</Typography>
				</Box>
			</DialogTitle>

			<DialogContent
				sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1.5 }}
			>
				{/* Rates Configuration: Loan Interest Range & Depositor Yield Range */}
				<Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
					<Typography
						variant="caption"
						sx={{
							fontWeight: 800,
							color: "text.secondary",
							textTransform: "uppercase",
							fontSize: "0.68rem",
						}}
					>
						Lending Rates &amp; Depositor Yields
					</Typography>
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr 1fr" },
							gap: 1.2,
						}}
					>
						<TextField
							label="Min Loan Rate (%)"
							type="number"
							value={interestRate}
							onChange={(e) => setInterestRate(Number(e.target.value))}
							size="small"
							helperText="Rate per discussed interval"
						/>
						<TextField
							label="Max Loan Rate (%)"
							type="number"
							placeholder="Optional"
							value={maxInterestRate}
							onChange={(e) =>
								setMaxInterestRate(
									e.target.value === "" ? "" : Number(e.target.value),
								)
							}
							size="small"
							helperText="Optional ceiling per interval"
						/>
						<TextField
							label="Min Yield (%/mo)"
							type="number"
							value={weeklyYieldRate}
							onChange={(e) =>
								setWeeklyYieldRate(
									e.target.value === "" ? "" : Number(e.target.value),
								)
							}
							size="small"
							helperText="1-month yield (paid weekly)"
						/>
						<TextField
							label="Max Yield (%/mo)"
							type="number"
							placeholder="Optional"
							value={maxWeeklyYieldRate}
							onChange={(e) =>
								setMaxWeeklyYieldRate(
									e.target.value === "" ? "" : Number(e.target.value),
								)
							}
							size="small"
							helperText="Max 1-month yield cap"
						/>
					</Box>

					{/* Rate spread validation */}
					{(() => {
						const minLoan = Number(interestRate) || 0;
						const maxLoan =
							maxInterestRate !== "" && Number(maxInterestRate) >= minLoan
								? Number(maxInterestRate)
								: minLoan;
						const minMonthlyYield = Number(weeklyYieldRate) || 0;
						const maxMonthlyYield =
							maxWeeklyYieldRate !== "" &&
							Number(maxWeeklyYieldRate) >= minMonthlyYield
								? Number(maxWeeklyYieldRate)
								: minMonthlyYield;

						// Convert monthly yield to effective per-interval yield based on standard 2-week interval
						const estIntervalYield = minMonthlyYield / 2.0;
						const hasInversion = estIntervalYield > maxLoan;

						if (hasInversion) {
							return (
								<Alert
									severity="warning"
									sx={{ fontSize: "0.74rem", py: 0.5, borderRadius: 1.5 }}
								>
									<strong>Negative Spread Warning:</strong> Depositor yield (
									{minMonthlyYield}%/mo &approx; {estIntervalYield.toFixed(2)}
									%/interval) exceeds your maximum loan rate ({maxLoan}
									%/interval). Without owner equity subsidy, client-funded loans
									at these terms will lose money.
								</Alert>
							);
						}

						if (
							maxMonthlyYield / 2.0 > minLoan &&
							estIntervalYield <= maxLoan
						) {
							return (
								<Alert
									severity="info"
									sx={{ fontSize: "0.74rem", py: 0.5, borderRadius: 1.5 }}
								>
									<strong>Rate Overlap Notice:</strong> Loan rates ({minLoan}% –{" "}
									{maxLoan}% per interval) overlap with depositor yields (
									{minMonthlyYield}% – {maxMonthlyYield}%/mo). Loans priced near
									the lower end ({minLoan}%) may have slim margins.
								</Alert>
							);
						}

						return null;
					})()}

					{/* Deposit Policy & Solvency Strategy */}
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: { xs: "1fr", sm: "1.2fr 1fr" },
							gap: 1.2,
							mt: 0.5,
						}}
					>
						<TextField
							select
							label="Deposit Capacity Policy"
							size="small"
							value={depositStrategy}
							onChange={(e) => setDepositStrategy(e.target.value as any)}
							helperText="Safety margin retained before pausing deposits"
						>
							<MenuItem value="PROFIT">Max Profit (35% safe margin)</MenuItem>
							<MenuItem value="BALANCED">Balanced (20% safe margin)</MenuItem>
							<MenuItem value="GROWTH">
								Growth (0% breakeven / Max Inflow)
							</MenuItem>
						</TextField>

						<TextField
							select
							label="Deposit Acceptance Status"
							size="small"
							value={depositStatus}
							onChange={(e) => setDepositStatus(e.target.value as any)}
							helperText="Manual override for public deposits"
						>
							<MenuItem value="OPEN">Accept Deposits (Auto)</MenuItem>
							<MenuItem value="NEAR_CAPACITY">Near Capacity Notice</MenuItem>
							<MenuItem value="PAUSED">Pause Deposits (Closed)</MenuItem>
						</TextField>
					</Box>
				</Box>

				<TextField
					label="Card Tagline / Headline"
					size="small"
					value={headline}
					onChange={(e) => setHeadline(e.target.value.slice(0, 100))}
					placeholder="e.g. Competitive loans for haulers & mining expansion"
					helperText={`${headline.length}/100 chars (displayed on bank card)`}
					fullWidth
				/>

				<TextField
					label="Bank Description & Terms (Max 2,000 chars)"
					multiline
					minRows={3}
					maxRows={6}
					value={description}
					onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
					helperText={`${description.length}/2,000 characters`}
					fullWidth
					size="small"
					sx={{
						"& .MuiInputBase-root": {
							alignItems: "flex-start",
						},
						"& textarea": {
							resize: "vertical",
						},
						"& .MuiFormHelperText-root": {
							textAlign: "right",
							fontSize: "0.65rem",
							color: "text.secondary",
						},
					}}
				/>

				<Divider
					sx={{ my: 0.5, borderColor: alpha(theme.palette.divider, 0.15) }}
				/>

				{/* Public Visibility & Privacy Settings */}
				<Box
					sx={{
						p: 2,
						borderRadius: 2,
						bgcolor: alpha(theme.palette.background.default, 0.55),
						border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
						display: "flex",
						flexDirection: "column",
						gap: 1.5,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<VisibilityOutlinedIcon
							sx={{ fontSize: 18, color: "primary.main" }}
						/>
						<Typography
							variant="subtitle2"
							sx={{ fontWeight: 800, fontSize: "0.84rem" }}
						>
							Public Ledger Visibility &amp; Privacy
						</Typography>
					</Box>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", mt: -0.5, fontSize: "0.72rem" }}
					>
						Control what prospective borrowers and depositors see when viewing
						your public bank registry profile.
					</Typography>

					{/* Master Public API Toggle */}
					<Box
						sx={{
							p: 1.5,
							borderRadius: 1.5,
							bgcolor: isPublic
								? alpha(theme.palette.success.main, 0.08)
								: alpha(theme.palette.warning.main, 0.08),
							border: `1px solid ${isPublic ? alpha(theme.palette.success.main, 0.25) : alpha(theme.palette.warning.main, 0.25)}`,
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							gap: 2,
						}}
					>
						<Box>
							<Typography
								variant="body2"
								sx={{ fontWeight: 800, fontSize: "0.82rem" }}
							>
								{isPublic
									? "Public API & Directory Enabled"
									: "Private / Unlisted Mode"}
							</Typography>
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									display: "block",
									fontSize: "0.7rem",
									lineHeight: 1.35,
									mt: 0.25,
								}}
							>
								{isPublic
									? "Your bank is discoverable in the public directory and public API."
									: "Your bank is 100% private. Excluded from public views; only accessible by you via dashboard & Protected API."}
							</Typography>
						</Box>
						<Switch
							checked={isPublic}
							onChange={(e) => setIsPublic(e.target.checked)}
							color="primary"
						/>
					</Box>

					{/* Sub-toggles for public elements */}
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
							gap: 1,
							opacity: isPublic ? 1 : 0.45,
							pointerEvents: isPublic ? "auto" : "none",
						}}
					>
						<FormControlLabel
							control={
								<Switch
									checked={publicShowLoans}
									onChange={(e) => setPublicShowLoans(e.target.checked)}
									color="primary"
									size="small"
								/>
							}
							label={
								<Typography
									variant="body2"
									sx={{ fontSize: "0.8rem", fontWeight: 600 }}
								>
									Show Loans History
								</Typography>
							}
						/>
						<FormControlLabel
							control={
								<Switch
									checked={publicShowDeposits}
									onChange={(e) => setPublicShowDeposits(e.target.checked)}
									color="primary"
									size="small"
								/>
							}
							label={
								<Typography
									variant="body2"
									sx={{ fontSize: "0.8rem", fontWeight: 600 }}
								>
									Show Deposits
								</Typography>
							}
						/>
						<FormControlLabel
							control={
								<Switch
									checked={publicShowWithdrawals}
									onChange={(e) => setPublicShowWithdrawals(e.target.checked)}
									color="primary"
									size="small"
								/>
							}
							label={
								<Typography
									variant="body2"
									sx={{ fontSize: "0.8rem", fontWeight: 600 }}
								>
									Show Withdrawals
								</Typography>
							}
						/>
						<FormControlLabel
							control={
								<Switch
									checked={publicShowNames}
									onChange={(e) => setPublicShowNames(e.target.checked)}
									color="primary"
									size="small"
								/>
							}
							label={
								<Box>
									<Typography
										variant="body2"
										sx={{ fontSize: "0.8rem", fontWeight: 600 }}
									>
										Show Usernames
									</Typography>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontSize: "0.68rem",
											display: "block",
										}}
									>
										{publicShowNames
											? "Names are visible"
											: "Anonymized as Anonymous"}
									</Typography>
								</Box>
							}
						/>
					</Box>

					{/* Confidentiality Guarantee */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							p: 1.25,
							borderRadius: 1.5,
							bgcolor: alpha(theme.palette.info.main, 0.08),
							border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
							mt: 0.25,
						}}
					>
						<LockOutlinedIcon
							sx={{
								fontSize: 16,
								color: theme.palette.info.main,
								flexShrink: 0,
							}}
						/>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontSize: "0.7rem",
								lineHeight: 1.35,
							}}
						>
							<strong>Contract Confidentiality:</strong> Contract LocalIDs and
							internal transaction signatures are strictly private and never
							exposed to public viewers.
						</Typography>
					</Box>
				</Box>

				{error && (
					<Typography
						variant="caption"
						sx={{ color: "#f87171", fontWeight: 700 }}
					>
						{error}
					</Typography>
				)}
			</DialogContent>

			<DialogActions sx={{ p: 2, pt: 1 }}>
				<Button
					onClick={onClose}
					color="inherit"
					sx={{ color: "text.secondary" }}
				>
					Cancel
				</Button>
				<Button
					onClick={handleSave}
					variant="contained"
					color="primary"
					disabled={savingVault}
					sx={{ fontWeight: 800 }}
				>
					{savingVault ? "Saving..." : "Save Settings"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
