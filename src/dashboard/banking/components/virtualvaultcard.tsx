import React, { useState } from "react";
import {
	Box,
	Paper,
	Typography,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Chip,
	Divider,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ShieldIcon from "@mui/icons-material/Shield";
import EditIcon from "@mui/icons-material/Edit";
import type { Bank, BankLoanRecord } from "../types";
import { fetchClient } from "../../../utils/apiclient";
import { calculateVaultMetrics, formatAmount } from "../helpers";

interface VirtualVaultCardProps {
	bank: Bank;
	loans: BankLoanRecord[];
	onUpdate: () => void;
}

export const VirtualVaultCard: React.FC<VirtualVaultCardProps> = ({
	bank,
	loans,
	onUpdate,
}) => {
	const theme = useTheme();
	const [editOpen, setEditOpen] = useState(false);
	const [liquidity, setLiquidity] = useState(bank.liquidity);
	const [interestRate, setInterestRate] = useState(bank.default_interest_rate);
	const [description, setDescription] = useState(bank.description || "");
	const [saving, setSaving] = useState(false);

	const {
		activeLoans,
		activeCapitalOut,
		repaidLoans,
		totalRepaidCapital,
		availableLendingCapacity,
	} = calculateVaultMetrics(bank, loans);

	const handleSave = async () => {
		setSaving(true);
		try {
			const res = await fetchClient("/internal/banking", {
				method: "POST",
				body: JSON.stringify({
					name: bank.name,
					description,
					liquidity: Number(liquidity),
					default_interest_rate: Number(interestRate),
				}),
			});
			if (res.ok) {
				setEditOpen(false);
				onUpdate();
			} else {
				const err = await res.json();
				alert(err.detail || "Failed to update vault settings");
			}
		} catch (e) {
			console.error("Failed to update vault", e);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Paper
			elevation={0}
			sx={{
				p: 3,
				borderRadius: 2,
				border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
				background:
					"linear-gradient(135deg, rgba(20, 22, 36, 0.9) 0%, rgba(28, 30, 50, 0.9) 100%)",
				backdropFilter: "blur(12px)",
				display: "flex",
				flexDirection: "column",
				gap: 2.5,
			}}
		>
			{/* Top Header */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					flexWrap: "wrap",
					gap: 2,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					<Box
						sx={{
							width: 48,
							height: 48,
							borderRadius: 2,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(theme.palette.primary.main, 0.15),
							color: theme.palette.primary.main,
							border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
						}}
					>
						<AccountBalanceIcon sx={{ fontSize: 28 }} />
					</Box>
					<Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Typography
								variant="h6"
								sx={{ fontWeight: 800, letterSpacing: 0.5 }}
							>
								{bank.name}
							</Typography>
							<Chip
								label="OPERATING VAULT"
								size="small"
								color="primary"
								variant="outlined"
								sx={{ fontSize: "0.65rem", fontWeight: 700, height: 20 }}
							/>
						</Box>
						<Typography
							variant="body2"
							sx={{ color: "text.secondary", mt: 0.2 }}
						>
							{bank.description || "Official player-run lending institution."}
						</Typography>
					</Box>
				</Box>

				<Button
					size="small"
					variant="outlined"
					color="primary"
					startIcon={<EditIcon sx={{ fontSize: 16 }} />}
					onClick={() => {
						setLiquidity(bank.liquidity);
						setInterestRate(bank.default_interest_rate);
						setDescription(bank.description || "");
						setEditOpen(true);
					}}
					sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}
				>
					Configure Vault
				</Button>
			</Box>

			{/* Virtual Separation Note */}
			<Box
				sx={{
					p: 1.5,
					borderRadius: 1.5,
					bgcolor: alpha(theme.palette.info.main, 0.08),
					border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
					display: "flex",
					alignItems: "center",
					gap: 1.5,
				}}
			>
				<ShieldIcon sx={{ color: "info.main", fontSize: 20, flexShrink: 0 }} />
				<Typography
					variant="caption"
					sx={{ color: "text.secondary", lineHeight: 1.4 }}
				>
					<strong>Isolated Virtual Vault:</strong> PrUn accounts share a single
					cash balance. PUNoted rings-fences your pledged bank capital (
					{bank.liquidity.toLocaleString()} ICA) so you never accidentally
					over-lend operating cash needed for factory upkeep or shipping fuel.
				</Typography>
			</Box>

			<Divider sx={{ borderColor: alpha(theme.palette.divider, 0.2) }} />

			{/* Key Figures Grid */}
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: {
						xs: "1fr",
						sm: "1fr 1fr",
						md: "1fr 1fr 1fr 1fr",
					},
					gap: 2,
				}}
			>
				{/* Pledged Reserve */}
				<Paper
					elevation={0}
					sx={{
						p: 2,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.paper, 0.4),
						border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
					}}
				>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", fontWeight: 600 }}
					>
						PLEDGED VAULT CAPITAL
					</Typography>
					<Typography
						variant="h5"
						sx={{ fontWeight: 800, mt: 0.5, color: theme.palette.text.primary }}
					>
						{bank.liquidity.toLocaleString()}{" "}
						<span
							style={{
								fontSize: "0.8rem",
								color: theme.palette.text.secondary,
							}}
						>
							ICA
						</span>
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
					>
						Allocated bank reserves
					</Typography>
				</Paper>

				{/* Active Outstanding */}
				<Paper
					elevation={0}
					sx={{
						p: 2,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.warning.main, 0.05),
						border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
					}}
				>
					<Typography
						variant="caption"
						sx={{ color: "warning.main", fontWeight: 600 }}
					>
						ACTIVE CAPITAL LENT
					</Typography>
					<Typography
						variant="h5"
						sx={{ fontWeight: 800, mt: 0.5, color: "warning.main" }}
					>
						{activeCapitalOut.toLocaleString()}{" "}
						<span style={{ fontSize: "0.8rem", opacity: 0.8 }}>ICA</span>
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
					>
						{activeLoans.length} active loan
						{activeLoans.length === 1 ? "" : "s"} outstanding
					</Typography>
				</Paper>

				{/* Available to Lend */}
				<Paper
					elevation={0}
					sx={{
						p: 2,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.success.main, 0.05),
						border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
					}}
				>
					<Typography
						variant="caption"
						sx={{ color: "success.main", fontWeight: 600 }}
					>
						AVAILABLE TO LEND
					</Typography>
					<Typography
						variant="h5"
						sx={{ fontWeight: 800, mt: 0.5, color: "success.main" }}
					>
						{availableLendingCapacity.toLocaleString()}{" "}
						<span style={{ fontSize: "0.8rem", opacity: 0.8 }}>ICA</span>
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
					>
						Safe to disburse right now
					</Typography>
				</Paper>

				{/* Default Terms */}
				<Paper
					elevation={0}
					sx={{
						p: 2,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.primary.main, 0.05),
						border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
					}}
				>
					<Typography
						variant="caption"
						sx={{ color: "primary.main", fontWeight: 600 }}
					>
						DEFAULT INTEREST RATE
					</Typography>
					<Typography
						variant="h5"
						sx={{ fontWeight: 800, mt: 0.5, color: "primary.main" }}
					>
						{bank.default_interest_rate}%
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
					>
						Repaid to date: {totalRepaidCapital.toLocaleString()} ICA
					</Typography>
				</Paper>
			</Box>

			{/* Edit Vault Dialog */}
			<Dialog
				open={editOpen}
				onClose={() => setEditOpen(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle sx={{ fontWeight: 800 }}>
					Configure Virtual Vault
				</DialogTitle>
				<DialogContent
					sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
				>
					<TextField
						label="Pledged Bank Liquidity (ICA)"
						type="number"
						value={liquidity}
						onChange={(e) => setLiquidity(Number(e.target.value))}
						helperText="The virtual capital you dedicate for banking."
						fullWidth
					/>
					<TextField
						label="Default Interest Rate (%)"
						type="number"
						value={interestRate}
						onChange={(e) => setInterestRate(Number(e.target.value))}
						helperText="Standard baseline rate auto-suggested when linking contracts."
						fullWidth
					/>
					<TextField
						label="Bank Description & Terms"
						multiline
						rows={3}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="E.g., Specializing in short-term fuel trade loans with token payback."
						fullWidth
					/>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button onClick={() => setEditOpen(false)} color="inherit">
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						variant="contained"
						color="primary"
						disabled={saving}
					>
						{saving ? "Saving..." : "Save Settings"}
					</Button>
				</DialogActions>
			</Dialog>
		</Paper>
	);
};
