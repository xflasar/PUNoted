import React from "react";
import { Box, Typography, IconButton, Dialog } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDrawerData } from "../hooks/usedrawerdata";
import { EventSummary } from "./eventsummary";
import { CounterpartyProfile } from "./counterpartyprofile";
import { LedgerStats } from "./ledgerstats";

export default function FinancialDrawer({
	isOpen,
	onClose,
	selectedTx,
	selectedPartnerCode,
	selectedPartnerName,
	currency,
	transactions,
}: any) {
	const {
		txDetails,
		loadingTxDetails,
		companyProfile,
		loadingProfile,
		selectedPartnerStats,
	} = useDrawerData(selectedTx, selectedPartnerCode, transactions);

	return (
		<Dialog
			open={isOpen}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
			scroll="paper"
			slotProps={{
				paper: {
					sx: {
						backgroundColor: "rgba(4, 4, 10, 0.95)",
						backdropFilter: "blur(25px)",
						backgroundImage: "none",
						border: "1px solid rgba(123, 104, 238, 0.25)",
						color: "white",
						boxShadow: "0 0 50px rgba(123, 104, 238, 0.18)",
						borderRadius: "20px",
						margin: 2,
					},
				},
			}}
		>
			<Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
				<Box
					sx={{
						px: 3,
						py: 2,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
					}}
				>
					<Typography
						variant="subtitle1"
						sx={{ fontWeight: 800, color: "white" }}
					>
						{selectedTx ? "Transaction Details" : "Entity Profile"}
					</Typography>
					<IconButton
						onClick={onClose}
						size="small"
						sx={{ color: "rgba(255,255,255,0.6)" }}
					>
						<CloseIcon fontSize="small" />
					</IconButton>
				</Box>
				<Box
					sx={{
						flex: 1,
						overflowY: "auto",
						p: 2.5,
						display: "flex",
						flexDirection: "column",
						gap: 2,
					}}
				>
					{selectedTx && (
						<EventSummary
							tx={selectedTx}
							currency={currency}
							details={txDetails}
							loading={loadingTxDetails}
						/>
					)}
					{selectedPartnerCode && !selectedPartnerCode.includes("CORP") && (
						<CounterpartyProfile
							profile={companyProfile}
							loading={loadingProfile}
							fallbackCode={selectedPartnerCode}
							fallbackName={selectedPartnerName}
						/>
					)}
					{selectedPartnerStats && <LedgerStats stats={selectedPartnerStats} />}
				</Box>
			</Box>
		</Dialog>
	);
}
