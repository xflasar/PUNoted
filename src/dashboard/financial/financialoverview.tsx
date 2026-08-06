import React, { useState, useMemo } from "react";
import {
	Box,
	Typography,
	Tabs,
	Tab,
	Alert,
	IconButton,
	TextField,
	InputAdornment,
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
import { AdvancedFinancialCard } from "./components/advancedfinancialcard";
import FinancialDrawer from "./components/financialdrawer";

export default function FinancialOverview() {
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
		volumeBreakdown,
	} = useFinancialData();

	// Load and persist preferred view mode (Simple vs Advanced)
	const [isAdvancedView, setIsAdvancedView] = useState<boolean>(() => {
		return localStorage.getItem("preferredFinancialViewMode") === "advanced";
	});

	const handleToggleAdvancedView = (checked: boolean) => {
		setIsAdvancedView(checked);
		localStorage.setItem(
			"preferredFinancialViewMode",
			checked ? "advanced" : "simple",
		);
	};

	const [isActivityExpanded, setIsActivityExpanded] = useState<boolean>(false);
	const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
	const [selectedPartnerCode, setSelectedPartnerCode] = useState<string | null>(
		null,
	);
	const [selectedPartnerName, setSelectedPartnerName] = useState<string | null>(
		null,
	);
	const [partnerFilter, setPartnerFilter] = useState<string>("");

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

	if (error) {
		return (
			<Box sx={{ p: 3, background: "#020205", height: "100%" }}>
				<Alert severity="error">{error}</Alert>
			</Box>
		);
	}

	const openTransactionDrawer = (tx: Transaction) => {
		setSelectedTx(tx);
		setSelectedPartnerCode(tx.PartnerCode);
		setSelectedPartnerName(tx.PartnerName);
	};

	const openPartnerDrawer = (code: string, name: string) => {
		setSelectedTx(null);
		setSelectedPartnerCode(code);
		setSelectedPartnerName(name);
		setPartnerFilter(code);
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
				background: "#020205",
				backgroundImage:
					"radial-gradient(circle at 50% 10%, #080816 0%, #030308 60%, #000000 100%)",
				color: "white",
				overflow: "hidden",
				position: "relative",
			}}
		>
			{/* Header */}
			<Box
				sx={{
					px: 2,
					pt: 0.5,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					borderBottom: "1px solid rgba(123, 104, 238, 0.15)",
					flexShrink: 0,
					bgcolor: "rgba(4, 4, 10, 0.85)",
					backdropFilter: "blur(25px)",
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
							backgroundColor: "#7b68ee",
							height: 2,
							boxShadow: "0 0 10px #7b68ee",
						},
					}}
				>
					{data?.Currencies.map((c, idx) => (
						<Tab
							key={c.Currency}
							label={c.Currency}
							value={idx}
							sx={{
								color: "rgba(255, 255, 255, 0.5)",
								fontWeight: 800,
								fontSize: "0.8rem",
								letterSpacing: "0.05em",
								minHeight: "36px",
								py: 0.25,
								px: 2,
								"&.Mui-selected": { color: "white" },
							}}
						/>
					))}
				</Tabs>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255, 255, 255, 0.3)",
							display: { xs: "none", sm: "block" },
							fontFamily: "monospace",
							fontSize: "0.68rem",
						}}
					>
						SYS.ONLINE |{" "}
						{data?.Timestamp
							? new Date(data.Timestamp).toLocaleTimeString()
							: "--:--:--"}
					</Typography>
					<IconButton
						size="small"
						onClick={fetchFinances}
						disabled={loading}
						sx={{
							color: "#7b68ee",
							bgcolor: "rgba(123, 104, 238, 0.1)",
							border: "1px solid rgba(123, 104, 238, 0.25)",
							p: 0.4,
							"&:hover": { bgcolor: "rgba(123, 104, 238, 0.2)" },
						}}
					>
						<RefreshIcon sx={{ fontSize: 16 }} />
					</IconButton>
				</Box>
			</Box>

			{/* Grid Layout Container */}
			<Box
				sx={{
					flex: 1,
					minHeight: 0,
					display: "flex",
					flexDirection: "column",
					gap: 1.25,
					p: 1.5,
					overflow: "hidden",
				}}
			>
				<KPISection
					currentData={currentData}
					netPending={netPending}
					volumeBreakdown={volumeBreakdown}
					loading={loading}
					isAdvancedView={isAdvancedView}
					onToggleAdvancedView={handleToggleAdvancedView}
				/>

				{/* Dynamic Grid Layout dependent on View Mode */}
				<Box
					sx={{
						flex: 1,
						minHeight: 0,
						display: "grid",
						gridTemplateRows: isAdvancedView
							? "1fr 1.2fr 1.2fr"
							: "1fr 1fr 1.2fr",
						gap: 1.25,
						position: "relative",
					}}
				>
					{/* Row 1: Liquidity Trend + Velocity Ledger */}
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: { xs: "1fr", lg: "1.8fr 1.2fr" },
							gap: 1.25,
							minHeight: 0,
						}}
					>
						<LiquidityTrendChart
							historyData={currentData?.History}
							currency={currentData?.Currency}
							loading={loading}
						/>
						<VelocityLedgerTable
							cashFlows={currentData?.CashFlows}
							loading={loading}
						/>
					</Box>

					{/* Row 2: Analytics Row (Injects Advanced Card when Advanced View is active) */}
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: isAdvancedView
								? { xs: "1fr", lg: "1fr 1fr 1.2fr" }
								: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
							gap: 1.25,
							minHeight: 0,
						}}
					>
						{isAdvancedView ? (
							<>
								<AdvancedFinancialCard
									currentData={currentData}
									volumeBreakdown={volumeBreakdown}
								/>
								<VelocityBarChart
									incomeExpense30D={incomeExpense30D}
									loading={loading}
								/>
								<FlexCard sx={{ height: "100%" }}>
									<Box
										sx={{
											px: 2,
											py: 1,
											display: "flex",
											alignItems: "center",
											borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
										}}
									>
										<Typography
											fontWeight={800}
											fontSize="0.72rem"
											sx={{
												textTransform: "uppercase",
												letterSpacing: "0.08em",
												color: "rgba(255,255,255,0.7)",
											}}
										>
											Top Partners (30D Volume)
										</Typography>
									</Box>
									<Box sx={{ flex: 1, overflowY: "auto", p: 0 }}>
										<TopPartnersTableContent
											partners={topPartners}
											onRowClick={openPartnerDrawer}
											loading={loading}
										/>
									</Box>
								</FlexCard>
							</>
						) : (
							<>
								<IncomeSourcesChart
									pieChartData={pieChartData}
									loading={loading}
								/>
								<VelocityBarChart
									incomeExpense30D={incomeExpense30D}
									loading={loading}
								/>
								<FlexCard sx={{ height: "100%" }}>
									<Box
										sx={{
											px: 2,
											py: 1,
											display: "flex",
											alignItems: "center",
											borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
										}}
									>
										<Typography
											fontWeight={800}
											fontSize="0.72rem"
											sx={{
												textTransform: "uppercase",
												letterSpacing: "0.08em",
												color: "rgba(255,255,255,0.7)",
											}}
										>
											Top Partners (30D Volume)
										</Typography>
									</Box>
									<Box sx={{ flex: 1, overflowY: "auto", p: 0 }}>
										<TopPartnersTableContent
											partners={topPartners}
											onRowClick={openPartnerDrawer}
											loading={loading}
										/>
									</Box>
								</FlexCard>
							</>
						)}
					</Box>

					{/* Row 3: Activity Log Panel */}
					<FlexCard sx={{ height: "100%" }}>
						<Box
							sx={{
								px: 2,
								py: 0.75,
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
								gap: 1.5,
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
								<Typography
									fontWeight={800}
									fontSize="0.72rem"
									sx={{
										textTransform: "uppercase",
										letterSpacing: "0.08em",
										color: "rgba(255,255,255,0.7)",
									}}
								>
									30-Day Activity Log
								</Typography>
								<TextField
									size="small"
									placeholder="Search counterparty or type..."
									value={partnerFilter}
									onChange={(e) => setPartnerFilter(e.target.value)}
									sx={{
										width: 200,
										"& .MuiOutlinedInput-root": {
											bgcolor: "rgba(0, 0, 0, 0.4)",
											borderRadius: "6px",
											color: "white",
											fontSize: "0.7rem",
											py: 0,
											"& fieldset": {
												borderColor: "rgba(123, 104, 238, 0.25)",
											},
											"&:hover fieldset": {
												borderColor: "rgba(123, 104, 238, 0.6)",
											},
										},
										"& .MuiInputBase-input": { py: 0.35, px: 1 },
									}}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<SearchIcon
													sx={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}
												/>
											</InputAdornment>
										),
										endAdornment: partnerFilter && (
											<InputAdornment position="end">
												<IconButton
													size="small"
													onClick={() => setPartnerFilter("")}
													sx={{ p: 0, color: "white" }}
												>
													<ClearIcon sx={{ fontSize: 12 }} />
												</IconButton>
											</InputAdornment>
										),
									}}
								/>
								<Guide text="Click any row to view full transaction details. Clicking a partner in Top Partners filters this log." />
							</Box>
							<IconButton
								size="small"
								onClick={() => setIsActivityExpanded(true)}
								sx={{
									color: "rgba(255,255,255,0.5)",
									p: 0.4,
									"&:hover": { color: "#7b68ee" },
								}}
							>
								<OpenInFullIcon sx={{ fontSize: 14 }} />
							</IconButton>
						</Box>
						<Box sx={{ flex: 1, overflowY: "auto", p: 0 }}>
							<ActivityTableContent
								transactions={filteredTransactions}
								onRowClick={openTransactionDrawer}
								loading={loading}
							/>
						</Box>
					</FlexCard>

					{/* Fullscreen Overlay */}
					{isActivityExpanded && (
						<FlexCard
							sx={{
								position: "absolute",
								inset: 0,
								zIndex: 10,
								backgroundColor: "rgba(4, 4, 10, 0.98)",
								backdropFilter: "blur(30px)",
								border: "1px solid rgba(123, 104, 238, 0.4)",
								boxShadow: "0 0 50px rgba(123, 104, 238, 0.3)",
							}}
						>
							<Box
								sx={{
									px: 2.5,
									py: 1.25,
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
									gap: 2,
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
									<Typography
										fontWeight={800}
										fontSize="0.8rem"
										sx={{
											color: "#7b68ee",
											letterSpacing: "0.08em",
											textTransform: "uppercase",
										}}
									>
										Expanded Activity Log
									</Typography>
									<TextField
										size="small"
										placeholder="Search counterparty or type..."
										value={partnerFilter}
										onChange={(e) => setPartnerFilter(e.target.value)}
										sx={{
											width: 260,
											"& .MuiOutlinedInput-root": {
												bgcolor: "rgba(0, 0, 0, 0.5)",
												borderRadius: "8px",
												color: "white",
												fontSize: "0.75rem",
												"& fieldset": {
													borderColor: "rgba(123, 104, 238, 0.35)",
												},
												"&:hover fieldset": { borderColor: "#7b68ee" },
											},
										}}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<SearchIcon
														sx={{
															fontSize: 14,
															color: "rgba(255,255,255,0.4)",
														}}
													/>
												</InputAdornment>
											),
											endAdornment: partnerFilter && (
												<InputAdornment position="end">
													<IconButton
														size="small"
														onClick={() => setPartnerFilter("")}
														sx={{ p: 0, color: "white" }}
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
										color: "#7b68ee",
										bgcolor: "rgba(123, 104, 238, 0.15)",
										border: "1px solid rgba(123, 104, 238, 0.3)",
										"&:hover": { bgcolor: "rgba(123, 104, 238, 0.3)" },
									}}
								>
									<CloseFullscreenIcon sx={{ fontSize: 16 }} />
								</IconButton>
							</Box>
							<Box sx={{ flex: 1, overflowY: "auto", p: 0 }}>
								<ActivityTableContent
									transactions={filteredTransactions}
									onRowClick={openTransactionDrawer}
									loading={loading}
								/>
							</Box>
						</FlexCard>
					)}
				</Box>
			</Box>

			<FinancialDrawer
				isOpen={Boolean(selectedTx) || Boolean(selectedPartnerCode)}
				onClose={closeDrawer}
				selectedTx={selectedTx}
				selectedPartnerCode={selectedPartnerCode}
				selectedPartnerName={selectedPartnerName}
				currency={currentData?.Currency || ""}
				transactions={currentData?.Transactions || []}
			/>
		</Box>
	);
}
