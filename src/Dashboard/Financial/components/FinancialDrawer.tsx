import { Box, Typography, IconButton, useTheme, Drawer } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDrawerData } from "../hooks/useDrawerData";
import { EventSummary } from "./EventSummary";
import { CounterpartyProfile } from "./CounterpartyProfile";
import { LedgerStats } from "./LedgerStats";

export default function FinancialDrawer({
	isOpen,
	onClose,
	selectedTx,
	selectedPartnerCode,
	selectedPartnerName,
	currency,
	transactions,
}: any) {
	const theme = useTheme();
	const {
		txDetails,
		loadingTxDetails,
		companyProfile,
		loadingProfile,
		selectedPartnerStats,
	} = useDrawerData(selectedTx, selectedPartnerCode, transactions);

	return (
		<Drawer
			anchor="right"
			open={isOpen}
			onClose={onClose}
			transitionDuration={{ enter: 200, exit: 150 }}
			PaperProps={{
				sx: {
					width: { xs: "100%", sm: 400 },
					backgroundColor: "background.default",
					backgroundImage: "none",
					borderLeft: `1px solid ${theme.palette.divider}`,
					color: "text.primary",
					boxShadow: theme.shadows[10],
				},
			}}
		>
			<Box display="flex" flexDirection="column" height="100%">
				<Box
					px={3}
					py={2.5}
					display="flex"
					alignItems="center"
					justifyContent="space-between"
					borderBottom={`1px solid ${theme.palette.divider}`}
				>
					<Typography variant="h6" fontWeight={800} color="text.primary">
						{selectedTx ? "Transaction Details" : "Entity Profile"}
					</Typography>
					<IconButton
						onClick={onClose}
						size="small"
						sx={{ color: "text.secondary" }}
					>
						<CloseIcon fontSize="small" />
					</IconButton>
				</Box>

				<Box
					flex={1}
					overflow="auto"
					p={2}
					display="flex"
					flexDirection="column"
					gap={2}
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
		</Drawer>
	);
}
