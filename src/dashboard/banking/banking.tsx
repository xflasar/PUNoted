import React, { useState, useMemo } from "react";
import {
	Box,
	Paper,
	Typography,
	Button,
	TextField,
	InputAdornment,
	IconButton,
	Chip,
	useTheme,
	Tooltip,
	ToggleButton,
	ToggleButtonGroup,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SyncIcon from "@mui/icons-material/Sync";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import { AddCircleOutlineOutlined } from "@mui/icons-material";
import GlobalLoadingOverlay from "../../components/common/globalloadingoverlay";
import { useBankingData } from "./usebankingdata";
import { BankCard } from "./components/bankcard";
import { BankDetailView } from "./components/bankdetailview";
import { CreateBankDialog } from "./components/createbankdialog";
import { LoanFinderBar } from "./components/loanfinderbar";
import { DepositCalculatorBar } from "./components/depositcalculatorbar";
import type {
	LoanFinderCriteria,
	BankLoanComparison,
	BankDepositComparison,
} from "./types";
import {
	calculateBankLoanComparison,
	calculateOverallLoanStats,
	calculateBankDepositComparison,
} from "./helpers";

const BankingPage: React.FC = () => {
	const theme = useTheme();
	const {
		myBank,
		allBanks,
		loading,
		loadBankingData,
		syncLoans,
		isSyncing,
		form,
		setFormField,
		creating,
		createError,
		handleCreateBank,
	} = useBankingData();

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	// In-game name auto-detection from stored authentication metadata
	const initialDisplayName =
		localStorage.getItem("displayName") ||
		localStorage.getItem("username") ||
		"";
	const isSyncedUser = Boolean(initialDisplayName);

	const [loanCriteria, setLoanCriteria] = useState<LoanFinderCriteria>({
		loanAmount: "",
		dailyProfit: "",
		ingameName: initialDisplayName,
	});
	const [onlyShowMatches, setOnlyShowMatches] = useState(false);

	// Calculator Mode: "BORROW" (Loan Finder) vs "INVEST" (Deposit Yield Calculator)
	const [calculatorMode, setCalculatorMode] = useState<"BORROW" | "INVEST">(
		"BORROW",
	);
	const [depositCalcAmount, setDepositCalcAmount] = useState<number | "">("");
	const [onlyAcceptingDeposits, setOnlyAcceptingDeposits] = useState(false);

	const handleCriteriaChange = (
		field: keyof LoanFinderCriteria,
		value: any,
	) => {
		setLoanCriteria((prev) => ({ ...prev, [field]: value }));
	};

	const handleResetCriteria = () => {
		setLoanCriteria({
			loanAmount: "",
			dailyProfit: "",
			ingameName: initialDisplayName,
		});
		setOnlyShowMatches(false);
	};

	const handleResetDepositCalc = () => {
		setDepositCalcAmount("");
		setOnlyAcceptingDeposits(false);
	};

	const loanAmountNum =
		typeof loanCriteria.loanAmount === "number" ? loanCriteria.loanAmount : 0;
	const dailyProfitNum =
		typeof loanCriteria.dailyProfit === "number" ? loanCriteria.dailyProfit : 0;
	const allocationPct = loanCriteria.maxProfitAllocationPercent || 50;
	const termWeeks = loanCriteria.termWeeks;
	const intervalDays = loanCriteria.intervalDays || 7;

	// Overall loan feasibility benchmarks across all banks
	const overallSummary = useMemo(() => {
		if (loanAmountNum <= 0) return null;
		return calculateOverallLoanStats(
			allBanks,
			loanAmountNum,
			dailyProfitNum,
			allocationPct,
			termWeeks,
			intervalDays,
		);
	}, [
		allBanks,
		loanAmountNum,
		dailyProfitNum,
		allocationPct,
		termWeeks,
		intervalDays,
	]);

	// Per-bank calculations map (Borrower view)
	const bankComparisonsMap = useMemo(() => {
		const map = new Map<number, BankLoanComparison>();
		if (loanAmountNum <= 0) return map;
		for (const b of allBanks) {
			map.set(
				b.id,
				calculateBankLoanComparison(
					b,
					loanAmountNum,
					dailyProfitNum,
					allocationPct,
					termWeeks,
					intervalDays,
				),
			);
		}
		return map;
	}, [
		allBanks,
		loanAmountNum,
		dailyProfitNum,
		allocationPct,
		termWeeks,
		intervalDays,
	]);

	// Per-bank calculations map (Investor / Depositor view)
	const depositAmountNum =
		typeof depositCalcAmount === "number" ? depositCalcAmount : 0;
	const depositComparisonsList = useMemo(() => {
		return allBanks.map((b) =>
			calculateBankDepositComparison(b, depositAmountNum),
		);
	}, [allBanks, depositAmountNum]);

	const depositComparisonsMap = useMemo(() => {
		const map = new Map<number, BankDepositComparison>();
		for (const comp of depositComparisonsList) {
			map.set(comp.bank.id, comp);
		}
		return map;
	}, [depositComparisonsList]);

	// Find the selected bank
	const selectedBank = useMemo(() => {
		if (!selectedBankId) return null;
		return (
			allBanks.find((b) => b.id === selectedBankId) ||
			(myBank?.id === selectedBankId ? myBank : null)
		);
	}, [selectedBankId, allBanks, myBank]);

	// Filter and sort banks based on search input, loan criteria, or deposit criteria
	const filteredBanks = useMemo(() => {
		let list = allBanks;

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(b) =>
					b.name.toLowerCase().includes(q) ||
					b.owner_username.toLowerCase().includes(q) ||
					(b.description && b.description.toLowerCase().includes(q)),
			);
		}

		if (calculatorMode === "INVEST") {
			if (onlyAcceptingDeposits) {
				list = list.filter((b) => b.deposit_status !== "PAUSED");
			}
			if (depositAmountNum > 0) {
				return [...list].sort((a, b) => {
					const compA = depositComparisonsMap.get(a.id);
					const compB = depositComparisonsMap.get(b.id);
					// Prioritize banks that can accept deposits, then highest yield
					if (compA && compB) {
						if (compA.canAcceptDeposit !== compB.canAcceptDeposit) {
							return compA.canAcceptDeposit ? -1 : 1;
						}
						return compB.weeklyYieldRate - compA.weeklyYieldRate;
					}
					return 0;
				});
			}
			return list;
		}

		if (onlyShowMatches && loanAmountNum > 0) {
			list = list.filter((b) => {
				const comp = bankComparisonsMap.get(b.id);
				return comp ? comp.isProfitMatch && comp.withinMinMax : true;
			});
		}

		// When loan amount is entered, sort profit matches first, then lowest interest rate
		if (loanAmountNum > 0) {
			return [...list].sort((a, b) => {
				const compA = bankComparisonsMap.get(a.id);
				const compB = bankComparisonsMap.get(b.id);
				if (compA && compB) {
					if (compA.isProfitMatch !== compB.isProfitMatch) {
						return compA.isProfitMatch ? -1 : 1;
					}
					return (
						(a.default_interest_rate || 5) - (b.default_interest_rate || 5)
					);
				}
				return 0;
			});
		}

		return list;
	}, [
		allBanks,
		searchQuery,
		calculatorMode,
		onlyAcceptingDeposits,
		depositAmountNum,
		depositComparisonsMap,
		onlyShowMatches,
		loanAmountNum,
		bankComparisonsMap,
	]);

	const onBankCreated = async (e: React.FormEvent) => {
		const success = await handleCreateBank(e);
		if (success) {
			setCreateDialogOpen(false);
		}
	};

	if (loading) {
		return (
			<Box sx={{ position: "relative", minHeight: "100vh", width: "100%" }}>
				<GlobalLoadingOverlay
					loading={true}
					statusText="ACCESSING BANKING LEDGER & VAULTS..."
				/>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				height: "100vh",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				bgcolor: "background.default",
			}}
		>
			{/* Top Bar matching Sketch 1: Centered "BANKS" Title + Top-Right Search Input */}
			<Paper
				square
				elevation={0}
				sx={{
					zIndex: 10,
					px: { xs: 2, md: 4 },
					py: 1.5,
					bgcolor: alpha(theme.palette.background.default, 0.85),
					backdropFilter: "blur(14px)",
					borderBottom: `1.5px solid ${alpha(theme.palette.divider, 0.2)}`,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					flexShrink: 0,
					gap: 2,
				}}
			>
				{/* Left Side: Optional Quick Shortcuts or Bank Counter */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1.5,
						minWidth: { md: 240 },
					}}
				>
					{myBank ? (
						<Chip
							icon={<AccountBalanceIcon sx={{ fontSize: "16px !important" }} />}
							label={`My Bank: ${myBank.name}`}
							size="small"
							color="primary"
							onClick={() => setSelectedBankId(myBank.id)}
							sx={{ fontWeight: 800, cursor: "pointer" }}
						/>
					) : (
						<Button
							size="small"
							variant="outlined"
							color="primary"
							startIcon={<AddCircleOutlineOutlined />}
							onClick={() => setCreateDialogOpen(true)}
							sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}
						>
							Establish Bank
						</Button>
					)}
				</Box>

				{/* Center: Big Bold "BANKS" Title from Sketch */}
				<Typography
					variant="h4"
					sx={{
						fontWeight: 900,
						letterSpacing: 3,
						textTransform: "uppercase",
						color: theme.palette.text.primary,
						textAlign: "center",
						userSelect: "none",
					}}
				>
					BANKS
				</Typography>

				{/* Right Side: Sync Button & Search Input with (x) Clear Button */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "flex-end",
						gap: 1,
						minWidth: { md: 240 },
					}}
				>
					<Tooltip title="Synchronize Loan Repayments & Liquidity">
						<span>
							<IconButton
								size="small"
								onClick={() => syncLoans()}
								disabled={isSyncing}
								sx={{
									bgcolor: alpha(theme.palette.background.paper, 0.4),
									borderRadius: 2,
									p: 1,
									border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
									"&:hover": {
										bgcolor: alpha(theme.palette.primary.main, 0.1),
									},
								}}
							>
								<SyncIcon
									sx={{
										fontSize: 18,
										animation: isSyncing ? "spin 1s linear infinite" : "none",
										"@keyframes spin": {
											"0%": { transform: "rotate(0deg)" },
											"100%": { transform: "rotate(360deg)" },
										},
									}}
								/>
							</IconButton>
						</span>
					</Tooltip>
					<TextField
						size="small"
						placeholder="Search banks..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon
											sx={{ fontSize: 18, color: "text.secondary" }}
										/>
									</InputAdornment>
								),
								endAdornment: searchQuery ? (
									<InputAdornment position="end">
										<IconButton
											size="small"
											onClick={() => setSearchQuery("")}
											edge="end"
										>
											<ClearIcon sx={{ fontSize: 16 }} />
										</IconButton>
									</InputAdornment>
								) : null,
							},
						}}
						sx={{
							width: { xs: 160, sm: 220 },
							"& .MuiOutlinedInput-root": {
								borderRadius: 2,
								bgcolor: alpha(theme.palette.background.paper, 0.4),
							},
						}}
					/>
				</Box>
			</Paper>

			{/* Main Content Area */}
			<Box
				sx={{
					flexGrow: 1,
					overflowY: "auto",
					p: { xs: 2, md: 4 },
					boxSizing: "border-box",
					"&::-webkit-scrollbar": { width: "6px" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: alpha(theme.palette.divider, 0.2),
						borderRadius: "4px",
					},
				}}
			>
				{selectedBank ? (
					/* Bank Detail View (Sketch 2) */
					<BankDetailView
						bank={selectedBank}
						isMyBank={myBank?.id === selectedBank.id}
						onBack={() => setSelectedBankId(null)}
						onBankUpdated={loadBankingData}
					/>
				) : (
					/* Banks Grid View (Sketch 1: 3 Columns) */
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
						{/* Mode Switcher Tabs: Borrow (Loan Finder) vs Invest (Deposit Calculator) */}
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								flexWrap: "wrap",
								gap: 1.5,
							}}
						>
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

							<Typography
								variant="caption"
								sx={{ color: "text.secondary", fontSize: "0.74rem" }}
							>
								Showing <strong>{filteredBanks.length}</strong>{" "}
								{filteredBanks.length === 1 ? "bank" : "banks"} available
							</Typography>
						</Box>

						{/* Dynamic Toolbar: Loan Finder vs Deposit Yield Calculator */}
						{calculatorMode === "BORROW" ? (
							<LoanFinderBar
								criteria={loanCriteria}
								onChange={handleCriteriaChange}
								onReset={handleResetCriteria}
								summary={overallSummary}
								isSyncedUser={isSyncedUser}
								onlyShowMatches={onlyShowMatches}
								onToggleOnlyMatches={setOnlyShowMatches}
							/>
						) : (
							<DepositCalculatorBar
								depositAmount={depositCalcAmount}
								onDepositAmountChange={(val) => setDepositCalcAmount(val)}
								onlyAccepting={onlyAcceptingDeposits}
								onToggleOnlyAccepting={(val) => setOnlyAcceptingDeposits(val)}
								onReset={handleResetDepositCalc}
								comparisons={depositComparisonsList}
							/>
						)}

						{filteredBanks.length === 0 ? (
							<Paper
								elevation={0}
								sx={{
									p: 8,
									textAlign: "center",
									borderRadius: 2,
									bgcolor: alpha(theme.palette.background.paper, 0.4),
									border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
								}}
							>
								<AccountBalanceIcon
									sx={{
										fontSize: 56,
										color: "text.secondary",
										opacity: 0.4,
										mb: 1.5,
									}}
								/>
								<Typography
									variant="h6"
									sx={{ fontWeight: 800, color: "text.secondary" }}
								>
									{calculatorMode === "BORROW" && onlyShowMatches
										? "No banks match your profit and loan criteria"
										: calculatorMode === "INVEST" && onlyAcceptingDeposits
											? "No banks currently open for deposits"
											: searchQuery
												? "No banks matched your search"
												: "No banks registered yet"}
								</Typography>
								<Typography
									variant="body2"
									sx={{ color: "text.secondary", mt: 0.5, mb: 3 }}
								>
									{calculatorMode === "BORROW" && onlyShowMatches
										? "Try toggling off 'Only Matches' or adjust your daily profit and loan amount."
										: calculatorMode === "INVEST" && onlyAcceptingDeposits
											? "Try toggling off 'Accepting Only' to view full directory."
											: searchQuery
												? "Try clearing your search term in the top right."
												: "Be the first player to establish a public player bank!"}
								</Typography>
								{!myBank && !onlyShowMatches && (
									<Button
										variant="contained"
										color="primary"
										startIcon={<AddCircleOutlineOutlined />}
										onClick={() => setCreateDialogOpen(true)}
										sx={{ fontWeight: 800, borderRadius: 1.5 }}
									>
										Establish Player Bank
									</Button>
								)}
							</Paper>
						) : (
							<Box
								sx={{
									display: "grid",
									gridTemplateColumns: {
										xs: "1fr",
										sm: "1fr 1fr",
										md: "1fr 1fr 1fr",
									},
									gap: 2.5,
								}}
							>
								{filteredBanks.map((bank) => (
									<BankCard
										key={bank.id}
										bank={bank}
										isMyBank={myBank?.id === bank.id}
										loanComparison={
											calculatorMode === "BORROW"
												? bankComparisonsMap.get(bank.id)
												: null
										}
										depositComparison={
											calculatorMode === "INVEST"
												? depositComparisonsMap.get(bank.id)
												: null
										}
										onClick={() => setSelectedBankId(bank.id)}
									/>
								))}
							</Box>
						)}
					</Box>
				)}
			</Box>

			{/* Create Bank Dialog (matching wireframe) */}
			<CreateBankDialog
				open={createDialogOpen}
				form={form}
				creating={creating}
				createError={createError}
				onClose={() => setCreateDialogOpen(false)}
				onChange={setFormField}
				onSubmit={onBankCreated}
			/>
		</Box>
	);
};

export default BankingPage;
