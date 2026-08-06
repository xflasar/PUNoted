import React, { useState, useMemo } from "react";
import {
	Box,
	Typography,
	Tabs,
	Tab,
	CircularProgress,
	Alert,
	IconButton,
	TextField,
	InputAdornment,
	alpha,
	useTheme,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

import type { Transaction } from "./types/finances";
import { useFinancialData } from "./hooks/usefinancialdata";
import { FlexCard, Guide } from "./components/sharedui";
import { KPISection } from "./components/kpisection";
import {
	ActivityTableContent,
	TopPartnersTableContent,
} from "./components/tablesection";
import {
	LiquidityTrendChart,
	IncomeSourcesChart,
	VelocityBarChart,
	VelocityLedgerTable,
} from "./components/chartssection";
import FinancialDrawer from "./components/financialdrawer";

export default function FinancialOverview() {
	const theme = useTheme();

	const {
		data,
		loading,
		error,
		activeCurrencyIndex,
		handleTabChange,
		fetchFinances,
		currentData,
		netPending,
		topPartners,
		incomeExpense30D,
		pieChartData,
	} = useFinancialData();

	const [isActivityExpanded, setIsActivityExpanded] = useState<boolean>(false);
	const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
	const [selectedPartnerCode, setSelectedPartnerCode] = useState<string | null>(
		null,
	);
	const [selectedPartnerName, setSelectedPartnerName] = useState<string | null>(
		null,
	);
	const [partnerFilter, setPartnerFilter] = useState<string>("");

	// Filter transactions by partner code, partner name, or transaction type
	const filteredTransactions = useMemo(() => {
		if (!currentData?.Transactions) return [];
		if (!partnerFilter) return currentData.Transactions;
		const query = partnerFilter.toLowerCase().trim();
		return currentData.Transactions.filter(
			(tx) =>
				(tx.PartnerCode && tx.PartnerCode.toLowerCase().includes(query)) ||
				(tx.PartnerName && tx.PartnerName.toLowerCase().includes(query)) ||
				(tx.Type && tx.Type.toLowerCase().includes(query)),
		);
	}, [currentData?.Transactions, partnerFilter]);

	if (loading)
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
					bgcolor: "background.default",
				}}
			>
				<CircularProgress
					size={60}
					thickness={4}
					sx={{ color: "primary.main" }}
				/>
			</Box>
		);
	if (error || !data || data.Currencies.length === 0 || !currentData)
		return (
			<Box sx={{ p: 4, bgcolor: "background.default", height: "100vh" }}>
				<Alert severity={error ? "error" : "info"}>
					{error || "No data available."}
				</Alert>
			</Box>
		);

	const openTransactionDrawer = (tx: Transaction) => {
		setSelectedTx(tx);
		setSelectedPartnerCode(tx.PartnerCode);
		setSelectedPartnerName(tx.PartnerName);
	};

	const openPartnerDrawer = (code: string, name: string) => {
		setSelectedTx(null);
		setSelectedPartnerCode(code);
		setSelectedPartnerName(name);
		setPartnerFilter(code); // Auto-filter activity log by this partner code!
	};

	const closeDrawer = () => {
		setSelectedTx(null);
		setSelectedPartnerCode(null);
		setSelectedPartnerName(null);
	};

	return (
		<Box
			sx={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				backgroundColor: "background.default",
				color: "text.primary",
				overflow: "hidden",
				boxSizing: "border-box",
			}}
		>
			{/* Header */}
			<Box
				sx={{
					px: 3,
					pt: 1.5,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					borderBottom: 1,
					borderColor: "divider",
					pb: 0,
					flexShrink: 0,
				}}
			>
				<Tabs
					value={activeCurrencyIndex}
					onChange={handleTabChange}
					variant="scrollable"
					scrollButtons="auto"
					sx={{
						minHeight: "36px",
						"& .MuiTabs-indicator": {
							backgroundColor: theme.palette.primary.main,
							height: 3,
						},
					}}
				>
					{data.Currencies.map((c, idx) => (
						<Tab
							key={c.Currency}
							label={c.Currency}
							value={idx}
							sx={{
								color: "text.secondary",
								fontWeight: 800,
								fontSize: "0.9rem",
								minHeight: "36px",
								py: 0.5,
								"&.Mui-selected": { color: "text.primary" },
							}}
						/>
					))}
				</Tabs>
				<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							display: { xs: "none", sm: "block" },
						}}
					>
						Synced: {new Date(data.Timestamp).toLocaleTimeString()}
					</Typography>
					<IconButton
						size="small"
						onClick={fetchFinances}
						sx={{
							color: "primary.main",
							bgcolor: alpha(theme.palette.primary.main, 0.1),
							"&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
						}}
					>
						<RefreshIcon fontSize="small" />
					</IconButton>
				</Box>
			</Box>

			{/* Main Content Layout */}
			<Box
				sx={{
					flex: 1,
					minHeight: 0,
					overflowY: "auto",
					display: "flex",
					flexDirection: "column",
					gap: 2,
					p: { xs: 1.5, md: 2 },
					"&::-webkit-scrollbar": { width: "6px" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: theme.palette.divider,
						borderRadius: "4px",
					},
				}}
			>
				<KPISection currentData={currentData} netPending={netPending} />

				{isActivityExpanded ? (
					<FlexCard sx={{ minHeight: 500 }}>
						<Box
							sx={{
								px: 2,
								py: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								borderBottom: `1px solid ${theme.palette.divider}`,
								gap: 2,
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
								<Typography
									fontWeight={700}
									fontSize="0.85rem"
									color="primary.main"
								>
									Expanded Activity Log
								</Typography>
								<TextField
									size="small"
									placeholder="Search counterparty or type..."
									value={partnerFilter}
									onChange={(e) => setPartnerFilter(e.target.value)}
									sx={{
										width: 240,
										"& .MuiInputBase-input": {
											py: 0.4,
											px: 1,
											fontSize: "0.72rem",
										},
									}}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<SearchIcon sx={{ fontSize: 14, opacity: 0.6 }} />
											</InputAdornment>
										),
										endAdornment: partnerFilter && (
											<InputAdornment position="end">
												<IconButton
													size="small"
													onClick={() => setPartnerFilter("")}
													sx={{ p: 0 }}
												>
													<ClearIcon sx={{ fontSize: 14 }} />
												</IconButton>
											</InputAdornment>
										),
									}}
								/>
							</Box>
							<IconButton
								size="small"
								onClick={() => setIsActivityExpanded(false)}
								sx={{
									color: "primary.main",
									bgcolor: alpha(theme.palette.primary.main, 0.1),
									"&:hover": {
										bgcolor: alpha(theme.palette.primary.main, 0.2),
									},
								}}
							>
								<CloseFullscreenIcon fontSize="small" />
							</IconButton>
						</Box>
						<Box
							sx={{
								flex: 1,
								overflowY: "auto",
								p: 0,
								minHeight: 350,
								"&::-webkit-scrollbar": { width: "6px" },
								"&::-webkit-scrollbar-thumb": {
									backgroundColor: theme.palette.divider,
									borderRadius: "4px",
								},
							}}
						>
							<ActivityTableContent
								transactions={filteredTransactions}
								onRowClick={openTransactionDrawer}
							/>
						</Box>
					</FlexCard>
				) : (
					<>
						{/* Row 2: Trend & Ledger */}
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: { xs: "1fr", lg: "1.8fr 1.2fr" },
								gap: 2,
							}}
						>
							<LiquidityTrendChart
								historyData={currentData.History}
								currency={currentData.Currency}
							/>
							<VelocityLedgerTable cashFlows={currentData.CashFlows} />
						</Box>

						{/* Row 3: Analytics */}
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: {
									xs: "1fr",
									md: "repeat(2, 1fr)",
									lg: "repeat(3, 1fr)",
								},
								gap: 2,
							}}
						>
							<IncomeSourcesChart pieChartData={pieChartData} />
							<VelocityBarChart incomeExpense30D={incomeExpense30D} />
							<FlexCard sx={{ height: 260 }}>
								<Box
									sx={{
										px: 2,
										py: 1,
										display: "flex",
										alignItems: "center",
										borderBottom: `1px solid ${theme.palette.divider}`,
									}}
								>
									<Typography fontWeight={700} fontSize="0.85rem">
										Top Partners (30D Volume)
									</Typography>
								</Box>
								<Box
									sx={{
										flex: 1,
										overflowY: "auto",
										p: 0,
										minHeight: 0,
										"&::-webkit-scrollbar": { width: "6px" },
										"&::-webkit-scrollbar-thumb": {
											backgroundColor: theme.palette.divider,
											borderRadius: "4px",
										},
									}}
								>
									<TopPartnersTableContent
										partners={topPartners}
										onRowClick={openPartnerDrawer}
									/>
								</Box>
							</FlexCard>
						</Box>

						{/* Row 4: Full-width Activity Log */}
						<FlexCard sx={{ flex: 1, minHeight: 280 }}>
							<Box
								sx={{
									px: 2,
									py: 1,
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									borderBottom: `1px solid ${theme.palette.divider}`,
									gap: 2,
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
									<Typography fontWeight={700} fontSize="0.85rem">
										30-Day Activity Log
									</Typography>
									<TextField
										size="small"
										placeholder="Search counterparty or type..."
										value={partnerFilter}
										onChange={(e) => setPartnerFilter(e.target.value)}
										sx={{
											width: 220,
											"& .MuiInputBase-input": {
												py: 0.35,
												px: 0.8,
												fontSize: "0.7rem",
											},
										}}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<SearchIcon sx={{ fontSize: 13, opacity: 0.6 }} />
												</InputAdornment>
											),
											endAdornment: partnerFilter && (
												<InputAdornment position="end">
													<IconButton
														size="small"
														onClick={() => setPartnerFilter("")}
														sx={{ p: 0 }}
													>
														<ClearIcon sx={{ fontSize: 13 }} />
													</IconButton>
												</InputAdornment>
											),
										}}
									/>
									<Guide text="Click any row to view full transaction details. Clicking a partner in Top Partners filters this list." />
								</Box>
								<IconButton
									size="small"
									onClick={() => setIsActivityExpanded(true)}
									sx={{ color: "text.secondary", p: 0.5 }}
								>
									<OpenInFullIcon fontSize="small" />
								</IconButton>
							</Box>
							<Box
								sx={{
									flex: 1,
									overflowY: "auto",
									p: 0,
									minHeight: 180,
									"&::-webkit-scrollbar": { width: "6px" },
									"&::-webkit-scrollbar-thumb": {
										backgroundColor: theme.palette.divider,
										borderRadius: "4px",
									},
								}}
							>
								<ActivityTableContent
									transactions={filteredTransactions}
									onRowClick={openTransactionDrawer}
								/>
							</Box>
						</FlexCard>
					</>
				)}
			</Box>

			<FinancialDrawer
				isOpen={Boolean(selectedTx) || Boolean(selectedPartnerCode)}
				onClose={closeDrawer}
				selectedTx={selectedTx}
				selectedPartnerCode={selectedPartnerCode}
				selectedPartnerName={selectedPartnerName}
				currency={currentData.Currency}
				transactions={currentData.Transactions}
			/>
		</Box>
	);
}
