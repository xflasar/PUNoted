import React from "react";
import {
	Box,
	Container,
	Typography,
	Paper,
	Button,
	CircularProgress,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

import { usePublicBankingData } from "./banking/usepublicbankingdata";
import { PublicBankingHeader } from "./banking/components/publicbankingheader";
import { PublicBankingToolbar } from "./banking/components/publicbankingtoolbar";
import { PublicBankCard } from "./banking/components/publicbankcard";
import { PublicBankModal } from "./banking/components/publicbankmodal";
import { PublicLoanFinder } from "./banking/components/publicloanfinder";
import { DepositCalculatorBar } from "../dashboard/banking/components/depositcalculatorbar";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";

export const PublicBanking: React.FC = () => {
	const theme = useTheme();
	const {
		loading,
		error,
		loadPublicBanks,
		searchQuery,
		setSearchQuery,
		selectedCurrency,
		setSelectedCurrency,
		filteredBanks,
		inspectingBank,
		setInspectingBank,
		ledgerData,
		loadingLedger,
		activeLedgerTab,
		setActiveLedgerTab,
		loanRecords,
		depositRecords,
		calculatorMode,
		setCalculatorMode,
		loanAmount,
		setLoanAmount,
		dailyProfit,
		setDailyProfit,
		termWeeks,
		setTermWeeks,
		intervalDays,
		setIntervalDays,
		maxAllocationPercent,
		setMaxAllocationPercent,
		onlyShowMatches,
		setOnlyShowMatches,
		handleResetLoanFinder,
		overallLoanSummary,
		bankComparisonsMap,
		depositAmount,
		setDepositAmount,
		onlyAcceptingDeposits,
		setOnlyAcceptingDeposits,
		handleResetDepositCalc,
		depositComparisonsList,
		depositComparisonsMap,
	} = usePublicBankingData();

	return (
		<Box
			sx={{
				minHeight: "100vh",
				width: "100%",
				bgcolor: "background.default",
				color: "text.primary",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Sticky Top Header */}
			<PublicBankingHeader />

			{/* Subheader Toolbar with Currency Tabs & Search */}
			<PublicBankingToolbar
				selectedCurrency={selectedCurrency}
				onCurrencyChange={setSelectedCurrency}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
			/>

			{/* Main Content Area */}
			<Container maxWidth="xl" sx={{ py: 3, flex: 1, display: "flex", flexDirection: "column", gap: 2.5 }}>
				{/* Mode Switcher Tabs: Borrow (Loan Finder) vs Invest (Deposit Calculator) */}
				<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
					<ToggleButtonGroup
						size="small"
						exclusive
						value={calculatorMode}
						onChange={(_, val) => val && setCalculatorMode(val)}
						sx={{
							bgcolor: alpha(theme.palette.background.paper, 0.4),
							borderRadius: 2,
							p: 0.3,
							border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
						}}
					>
						<ToggleButton
							value="BORROW"
							sx={{
								px: 2,
								py: 0.5,
								fontSize: "0.78rem",
								fontWeight: 800,
								textTransform: "none",
								borderRadius: 1.5,
								gap: 0.75,
							}}
						>
							<CalculateOutlinedIcon sx={{ fontSize: 16 }} />
							Borrower Calculator
						</ToggleButton>
						<ToggleButton
							value="INVEST"
							sx={{
								px: 2,
								py: 0.5,
								fontSize: "0.78rem",
								fontWeight: 800,
								textTransform: "none",
								borderRadius: 1.5,
								gap: 0.75,
							}}
						>
							<SavingsOutlinedIcon sx={{ fontSize: 16 }} />
							Depositor Calculator
						</ToggleButton>
					</ToggleButtonGroup>

					<Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.74rem" }}>
						Showing <strong>{filteredBanks.length}</strong> {filteredBanks.length === 1 ? "bank" : "banks"} available
					</Typography>
				</Box>

				{/* Dynamic Toolbar: Public Loan Finder vs Deposit Yield Calculator */}
				{calculatorMode === "BORROW" ? (
					<PublicLoanFinder
						loanAmount={loanAmount}
						dailyProfit={dailyProfit}
						termWeeks={termWeeks}
						intervalDays={intervalDays}
						maxAllocationPercent={maxAllocationPercent}
						onlyShowMatches={onlyShowMatches}
						summary={overallLoanSummary}
						onLoanAmountChange={setLoanAmount}
						onDailyProfitChange={setDailyProfit}
						onTermWeeksChange={setTermWeeks}
						onIntervalDaysChange={setIntervalDays}
						onAllocationChange={setMaxAllocationPercent}
						onToggleOnlyMatches={setOnlyShowMatches}
						onReset={handleResetLoanFinder}
					/>
				) : (
					<DepositCalculatorBar
						depositAmount={depositAmount}
						onDepositAmountChange={(val) => setDepositAmount(val)}
						onlyAccepting={onlyAcceptingDeposits}
						onToggleOnlyAccepting={(val) => setOnlyAcceptingDeposits(val)}
						onReset={handleResetDepositCalc}
						comparisons={depositComparisonsList}
					/>
				)}

				{loading ? (
					<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, py: 12 }}>
						<CircularProgress size={36} color="primary" />
					</Box>
				) : error ? (
					<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, py: 12 }}>
						<Paper
							sx={{
								p: 4,
								textAlign: "center",
								borderRadius: 2.5,
								bgcolor: alpha(theme.palette.error.dark, 0.1),
								border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
								maxWidth: 440,
								width: "100%",
							}}
						>
							<Typography color="error" variant="body2" sx={{ fontWeight: 700, mb: 1.5 }}>
								{error}
							</Typography>
							<Button size="small" variant="outlined" onClick={loadPublicBanks} sx={{ textTransform: "none" }}>
								Retry
							</Button>
						</Paper>
					</Box>
				) : filteredBanks.length === 0 ? (
					<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, py: 12 }}>
						<Paper
							sx={{
								p: 5,
								textAlign: "center",
								borderRadius: 2.5,
								bgcolor: alpha(theme.palette.background.paper, 0.2),
								border: `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
								maxWidth: 440,
								width: "100%",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<AccountBalanceIcon sx={{ fontSize: 44, color: "text.secondary", mb: 1.5, opacity: 0.4 }} />
							<Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1rem" }}>
								No Banks Found
							</Typography>
							<Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5 }}>
								No registered banks match your search or filters.
							</Typography>
						</Paper>
					</Box>
				) : (
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
							gap: 2,
						}}
					>
						{filteredBanks.map((bank) => (
							<PublicBankCard
								key={bank.id}
								bank={bank}
								onInspect={setInspectingBank}
								loanComparison={calculatorMode === "BORROW" ? bankComparisonsMap.get(bank.id) : null}
								depositComparison={calculatorMode === "INVEST" ? depositComparisonsMap.get(bank.id) : null}
							/>
						))}
					</Box>
				)}
			</Container>

			{/* Bank Profile & Public Ledger Modal */}
			<PublicBankModal
				inspectingBank={inspectingBank}
				onClose={() => setInspectingBank(null)}
				ledgerData={ledgerData}
				loadingLedger={loadingLedger}
				activeLedgerTab={activeLedgerTab}
				onTabChange={setActiveLedgerTab}
				loanRecords={loanRecords}
				depositRecords={depositRecords}
			/>
		</Box>
	);
};

export default PublicBanking;
