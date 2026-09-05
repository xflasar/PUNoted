import React, { useState, useMemo, useEffect } from "react";
import {
	Box,
	Typography,
	Tabs,
	Tab,
	Alert,
	IconButton,
	TextField,
	InputAdornment,
	Switch,
	Chip,
	Select,
	MenuItem,
	ButtonGroup,
	Button,
	Tooltip,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import TuneIcon from "@mui/icons-material/Tune";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import StorefrontIcon from "@mui/icons-material/Storefront";
import HandshakeIcon from "@mui/icons-material/Handshake";
import TimelineIcon from "@mui/icons-material/Timeline";
import BusinessIcon from "@mui/icons-material/Business";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Collapse from "@mui/material/Collapse";
import { LocalFireDepartmentOutlined } from "@mui/icons-material";

import type { Transaction } from "./types/finances";
import {
	useFinancialData,
	type TimeRangePreset,
} from "./hooks/usefinancialdata";
import { useGlobalData } from "../../context/globaldatacontext";
import { formatCurrency } from "./utils/financeutils";
import {
	useFinancialCalculations,
	type PriceMode,
	type PriceSource,
} from "./hooks/usefinancialcalculations";
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
import { BalanceSheetTab } from "./components/balancesheettab";
import { MarketExposureTab } from "./components/marketexposuretab";
import { ContractsTab } from "./components/contractstab";
import { BurnRateTab } from "./components/burnratetab";
import { CounterpartyTab } from "./components/counterpartytab";
import { CashFlowTab } from "./components/cashflowtab";
import { LoansTab } from "./components/loanstab";
import FinancialDrawer from "./components/financialdrawer";
import { FinancialCategoryStats } from "./components/financialcategorystats";

export default function FinancialOverview() {
	const globalData = useGlobalData();
	const {
		data,
		loading,
		error,
		activeCurrencyIndex,
		setActiveCurrencyIndex,
		handleCurrencyChange,
		handleTabChange,
		fetchFinances,
		currentData,
		filteredTransactions: hookFilteredTransactions,
		timeRange,
		setTimeRange,
		customStartDate,
		setCustomStartDate,
		customEndDate,
		setCustomEndDate,
		netPending,
		topPartners,
		incomeExpense30D,
		pieChartData,
		volumeBreakdown,
	} = useFinancialData();

	const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);

	const userMetadata = globalData?.userMetadata;
	const userCorp = (
		userMetadata?.corpName ||
		userMetadata?.companyCode ||
		""
	).toUpperCase();
	const isCorpAuthorized = userCorp.includes("COSM");

	const [priceMode, setPriceMode] = useState<PriceMode>(() => {
		return (
			(localStorage.getItem("balanceSheetPriceMode") as PriceMode) || "ACTUAL"
		);
	});
	const [priceSource, setPriceSource] = useState<PriceSource>(() => {
		const saved =
			(localStorage.getItem("balanceSheetPriceSource") as PriceSource) ||
			"MARKET";
		return isCorpAuthorized ? saved : "MARKET";
	});

	// Guarantee non-COSM users always use MARKET pricing
	const effectivePriceSource = isCorpAuthorized ? priceSource : "MARKET";

	const handlePriceModeChange = (mode: PriceMode) => {
		setPriceMode(mode);
		localStorage.setItem("balanceSheetPriceMode", mode);
	};

	const handlePriceSourceChange = (source: PriceSource) => {
		if (source === "CORP" && !isCorpAuthorized) return;
		setPriceSource(source);
		localStorage.setItem("balanceSheetPriceSource", source);
	};

	// Real-time financial calculations (location inventory valuations, workforce burn rate, asset distribution)
	const {
		locationValuations,
		workforceBurnRate,
		assetDistribution,
		totalBuildingValue,
		buildingAssetBreakdown,
		totalShipValue,
		inventoryValuationBreakdown,
	} = useFinancialCalculations(currentData, priceMode, effectivePriceSource);

	// Load and persist preferred view mode (Simple vs Advanced)
	const [isAdvancedView, setIsAdvancedView] = useState<boolean>(() => {
		return localStorage.getItem("preferredFinancialViewMode") === "advanced";
	});

	const [advancedSubTab, setAdvancedSubTab] = useState<number>(0);

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
	const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

	useEffect(() => {
		if (data) {
			setLastUpdatedTime(new Date().toLocaleTimeString());
		}
	}, [data]);

	const filteredTransactions = useMemo(() => {
		if (!hookFilteredTransactions) return [];
		if (!partnerFilter) return hookFilteredTransactions;
		const query =
			typeof partnerFilter === "string"
				? partnerFilter.toLowerCase().trim()
				: String(partnerFilter).toLowerCase().trim();
		if (!query) return hookFilteredTransactions;
		return hookFilteredTransactions.filter(
			(tx) =>
				(tx.PartnerCode &&
					String(tx.PartnerCode).toLowerCase().includes(query)) ||
				(tx.PartnerName &&
					String(tx.PartnerName).toLowerCase().includes(query)) ||
				(tx.Type && String(tx.Type).toLowerCase().includes(query)),
		);
	}, [hookFilteredTransactions, partnerFilter]);

	if (error) {
		return (
			<Box sx={{ p: 3, background: "#020205", height: "100%" }}>
				<Alert severity="error">{error}</Alert>
			</Box>
		);
	}

	const openTransactionDrawer = (tx: Transaction) => {
		setSelectedTx(tx);
		setSelectedPartnerCode(tx.PartnerCode || null);
		setSelectedPartnerName(tx.PartnerName || null);
	};

	const openPartnerDrawer = (codeOrObj: any, name?: string) => {
		let code = "";
		let partnerName = "";
		if (codeOrObj && typeof codeOrObj === "object") {
			code = String(codeOrObj.PartnerCode || codeOrObj.code || "");
			partnerName = String(codeOrObj.PartnerName || codeOrObj.name || code);
		} else {
			code = String(codeOrObj || "");
			partnerName = String(name || code);
		}
		setSelectedTx(null);
		setSelectedPartnerCode(code);
		setSelectedPartnerName(partnerName);
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
				maxHeight: "100%",
				minHeight: 0,
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
			{/* Persistent Header */}
			<Box
				sx={{
					px: 2,
					py: 0.5,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					borderBottom: "1px solid rgba(123, 104, 238, 0.15)",
					flexShrink: 0,
					bgcolor: "rgba(4, 4, 10, 0.85)",
					backdropFilter: "blur(25px)",
					flexWrap: "nowrap",
					overflowX: "auto",
					gap: 1.5,
					"&::-webkit-scrollbar": { height: "3px" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: "rgba(123, 104, 238, 0.3)",
						borderRadius: "4px",
					},
				}}
			>
				{/* Compact Single-Box Currency Dropdown Selector */}
				<Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
					<Typography
						sx={{
							fontSize: "0.68rem",
							fontWeight: 800,
							color: "#7b68ee",
							textTransform: "uppercase",
							letterSpacing: "0.08em",
						}}
					>
						Currency:
					</Typography>
					<Select
						size="small"
						value={
							data?.Currencies &&
							data.Currencies.length > 0 &&
							activeCurrencyIndex < data.Currencies.length
								? activeCurrencyIndex
								: ""
						}
						onChange={(e) => {
							const val = e.target.value;
							if (val !== "") {
								handleCurrencyChange
									? handleCurrencyChange(Number(val))
									: setActiveCurrencyIndex(Number(val));
							}
						}}
						sx={{
							height: 28,
							fontSize: "0.76rem",
							fontFamily: "monospace",
							fontWeight: 800,
							color: "white",
							bgcolor: "rgba(123, 104, 238, 0.15)",
							borderRadius: "6px",
							border: "1px solid rgba(123, 104, 238, 0.35)",
							"& .MuiSelect-select": { py: 0.2, px: 1.2 },
							"& .MuiSelect-icon": { color: "#7b68ee", fontSize: 18 },
							"& .MuiOutlinedInput-notchedOutline": { border: "none" },
						}}
					>
						{data?.Currencies?.map((c, idx) => (
							<MenuItem
								key={c.Currency}
								value={idx}
								sx={{
									fontSize: "0.74rem",
									fontFamily: "monospace",
									fontWeight: 800,
								}}
							>
								{c.Currency} ({formatCurrency(c.Liquid)})
							</MenuItem>
						))}
					</Select>
				</Box>

				{/* Compact Control Selectors Container */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						flexWrap: "wrap",
					}}
				>
					{/* Timeframe Select */}
					<Select
						size="small"
						value={timeRange}
						onChange={(e) => setTimeRange(e.target.value as TimeRangePreset)}
						sx={{
							height: 28,
							fontSize: "0.74rem",
							fontFamily: "monospace",
							fontWeight: 800,
							color: "white",
							bgcolor: "rgba(123, 104, 238, 0.15)",
							borderRadius: "6px",
							border: "1px solid rgba(123, 104, 238, 0.35)",
							"& .MuiSelect-select": { py: 0.2, px: 1 },
							"& .MuiSelect-icon": { color: "#7b68ee", fontSize: 18 },
							"& .MuiOutlinedInput-notchedOutline": { border: "none" },
						}}
					>
						{(["ALL", "24H", "7D", "30D", "1Y", "CUSTOM"] as const).map(
							(preset) => (
								<MenuItem
									key={preset}
									value={preset}
									sx={{
										fontSize: "0.74rem",
										fontFamily: "monospace",
										fontWeight: 800,
									}}
								>
									{preset === "CUSTOM"
										? "Custom Range"
										: preset === "ALL"
											? "All Time"
											: preset}
								</MenuItem>
							),
						)}
					</Select>

					{timeRange === "CUSTOM" && (
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<TextField
								type="date"
								size="small"
								value={customStartDate}
								onChange={(e) => setCustomStartDate(e.target.value)}
								sx={{
									width: 110,
									"& .MuiOutlinedInput-root": {
										bgcolor: "rgba(0, 0, 0, 0.5)",
										borderRadius: "6px",
										color: "white",
										fontSize: "0.7rem",
										"& fieldset": { borderColor: "rgba(123, 104, 238, 0.4)" },
									},
									"& .MuiInputBase-input": { py: 0.2, px: 0.8 },
								}}
							/>
							<Typography
								variant="caption"
								sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem" }}
							>
								to
							</Typography>
							<TextField
								type="date"
								size="small"
								value={customEndDate}
								onChange={(e) => setCustomEndDate(e.target.value)}
								sx={{
									width: 110,
									"& .MuiOutlinedInput-root": {
										bgcolor: "rgba(0, 0, 0, 0.5)",
										borderRadius: "6px",
										color: "white",
										fontSize: "0.7rem",
										"& fieldset": { borderColor: "rgba(123, 104, 238, 0.4)" },
									},
									"& .MuiInputBase-input": { py: 0.2, px: 0.8 },
								}}
							/>
						</Box>
					)}

					{/* Global Price Source Select */}
					<Select
						size="small"
						value={effectivePriceSource}
						onChange={(e) =>
							handlePriceSourceChange(e.target.value as PriceSource)
						}
						sx={{
							height: 28,
							fontSize: "0.74rem",
							fontFamily: "monospace",
							fontWeight: 800,
							color: "white",
							bgcolor: "rgba(123, 104, 238, 0.15)",
							borderRadius: "6px",
							border: "1px solid rgba(123, 104, 238, 0.35)",
							"& .MuiSelect-select": { py: 0.2, px: 1 },
							"& .MuiSelect-icon": { color: "#7b68ee", fontSize: 18 },
							"& .MuiOutlinedInput-notchedOutline": { border: "none" },
						}}
					>
						<MenuItem
							value="MARKET"
							sx={{
								fontSize: "0.74rem",
								fontFamily: "monospace",
								fontWeight: 800,
							}}
						>
							Market (CX)
						</MenuItem>
						<MenuItem
							value="CORP"
							disabled={!isCorpAuthorized}
							sx={{
								fontSize: "0.74rem",
								fontFamily: "monospace",
								fontWeight: 800,
							}}
						>
							Corp Pricing
						</MenuItem>
						<MenuItem
							value="CUSTOM"
							sx={{
								fontSize: "0.74rem",
								fontFamily: "monospace",
								fontWeight: 800,
							}}
						>
							Custom Sheet
						</MenuItem>
					</Select>

					{/* Global Price Mode Select (Shown when MARKET is selected) */}
					{effectivePriceSource === "MARKET" && (
						<Select
							size="small"
							value={priceMode}
							onChange={(e) =>
								handlePriceModeChange(e.target.value as PriceMode)
							}
							sx={{
								height: 28,
								fontSize: "0.74rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: "white",
								bgcolor: "rgba(123, 104, 238, 0.15)",
								borderRadius: "6px",
								border: "1px solid rgba(123, 104, 238, 0.35)",
								"& .MuiSelect-select": { py: 0.2, px: 1 },
								"& .MuiSelect-icon": { color: "#7b68ee", fontSize: 18 },
								"& .MuiOutlinedInput-notchedOutline": { border: "none" },
							}}
						>
							<MenuItem
								value="ACTUAL"
								sx={{
									fontSize: "0.74rem",
									fontFamily: "monospace",
									fontWeight: 800,
								}}
							>
								Actual Price
							</MenuItem>
							<MenuItem
								value="7D_AVG"
								sx={{
									fontSize: "0.74rem",
									fontFamily: "monospace",
									fontWeight: 800,
								}}
							>
								7D Average
							</MenuItem>
							<MenuItem
								value="30D_AVG"
								sx={{
									fontSize: "0.74rem",
									fontFamily: "monospace",
									fontWeight: 800,
								}}
							>
								30D Average
							</MenuItem>
						</Select>
					)}
				</Box>

				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.5,
							bgcolor: "rgba(123, 104, 238, 0.1)",
							border: "1px solid rgba(123, 104, 238, 0.25)",
							borderRadius: "6px",
							px: 1,
							py: 0.2,
						}}
					>
						<TuneIcon
							sx={{
								fontSize: 14,
								color: isAdvancedView ? "#7b68ee" : "rgba(255,255,255,0.5)",
							}}
						/>
						<Typography
							sx={{
								fontSize: "0.7rem",
								fontWeight: 700,
								color: isAdvancedView ? "#7b68ee" : "rgba(255,255,255,0.6)",
							}}
						>
							{isAdvancedView ? "Advanced" : "Simple"}
						</Typography>
						<Switch
							checked={isAdvancedView}
							onChange={(e) => handleToggleAdvancedView(e.target.checked)}
							size="small"
							sx={{
								"& .MuiSwitch-switchBase.Mui-checked": { color: "#7b68ee" },
								"& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
									backgroundColor: "#7b68ee",
								},
							}}
						/>
					</Box>

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

					{/* Header Banner Collapse Toggle Button */}
					<IconButton
						size="small"
						onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
						sx={{
							color: "#64FFDA",
							bgcolor: "rgba(100, 255, 218, 0.1)",
							border: "1px solid rgba(100, 255, 218, 0.3)",
							p: 0.4,
							"&:hover": { bgcolor: "rgba(100, 255, 218, 0.2)" },
						}}
					>
						{isHeaderCollapsed ? (
							<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
						) : (
							<KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
						)}
					</IconButton>
				</Box>
			</Box>

			{/* Main Layout Container */}
			<Box
				sx={{
					flex: 1,
					minHeight: 0,
					display: "flex",
					flexDirection: "column",
					gap: 1.25,
					p: { xs: 1, sm: 1.5 },
					overflowY: "auto",
					overflowX: "hidden",
					"&::-webkit-scrollbar": { width: "4px" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: "rgba(123, 104, 238, 0.3)",
						borderRadius: "4px",
					},
				}}
			>
				{/* Collapsible KPI & Category Stats Header Banner */}
				<Collapse
					in={!isHeaderCollapsed}
					timeout="auto"
					unmountOnExit
					sx={{ flexShrink: 0 }}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 1.25,
							mb: 0.5,
						}}
					>
						{/* Top KPI Bar */}
						<KPISection
							currentData={currentData}
							netPending={netPending}
							volumeBreakdown={volumeBreakdown}
							totalBuildingValue={totalBuildingValue}
							buildingAssetBreakdown={buildingAssetBreakdown}
							totalShipValue={totalShipValue}
							inventoryValuationBreakdown={inventoryValuationBreakdown}
							loading={loading}
							isAdvancedView={isAdvancedView}
							onToggleAdvancedView={handleToggleAdvancedView}
						/>

						<Box
							sx={{
								display: "flex",
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<FinancialCategoryStats
								transactions={currentData?.Transactions}
								currency={currentData?.Currency || ""}
								timeRange={timeRange}
								customStartDate={customStartDate}
								customEndDate={customEndDate}
							/>
						</Box>
					</Box>
				</Collapse>

				{/* Advanced Mode Sub-Tab Navigation Bar */}
				{isAdvancedView && (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
							pb: 0.5,
							flexShrink: 0,
							width: "100%",
						}}
					>
						<Tabs
							value={advancedSubTab}
							onChange={(_, val) => setAdvancedSubTab(val)}
							variant="scrollable"
							scrollButtons="auto"
							sx={{
								minHeight: "28px",
								"& .MuiTabs-indicator": {
									backgroundColor: "#7b68ee",
									height: 2,
								},
							}}
						>
							<Tab
								icon={<AccountBalanceWalletIcon sx={{ fontSize: 14 }} />}
								iconPosition="start"
								label="Balance Sheet"
								sx={{
									minHeight: "28px",
									py: 0,
									px: 1.5,
									fontSize: "0.72rem",
									fontWeight: 700,
									color: "rgba(255,255,255,0.5)",
									"&.Mui-selected": { color: "#7b68ee" },
								}}
							/>
							<Tab
								icon={<TimelineIcon sx={{ fontSize: 14 }} />}
								iconPosition="start"
								label="Cash Flow & Velocity"
								sx={{
									minHeight: "28px",
									py: 0,
									px: 1.5,
									fontSize: "0.72rem",
									fontWeight: 700,
									color: "rgba(255,255,255,0.5)",
									"&.Mui-selected": { color: "#7b68ee" },
								}}
							/>
							<Tab
								icon={<StorefrontIcon sx={{ fontSize: 14 }} />}
								iconPosition="start"
								label="Market Exposure"
								sx={{
									minHeight: "28px",
									py: 0,
									px: 1.5,
									fontSize: "0.72rem",
									fontWeight: 700,
									color: "rgba(255,255,255,0.5)",
									"&.Mui-selected": { color: "#7b68ee" },
								}}
							/>
							<Tab
								icon={<HandshakeIcon sx={{ fontSize: 14 }} />}
								iconPosition="start"
								label="Contracts"
								sx={{
									minHeight: "28px",
									py: 0,
									px: 1.5,
									fontSize: "0.72rem",
									fontWeight: 700,
									color: "rgba(255,255,255,0.5)",
									"&.Mui-selected": { color: "#7b68ee" },
								}}
							/>
							<Tab
								icon={<LocalFireDepartmentOutlined sx={{ fontSize: 14 }} />}
								iconPosition="start"
								label="Burn Rate"
								sx={{
									minHeight: "28px",
									py: 0,
									px: 1.5,
									fontSize: "0.72rem",
									fontWeight: 700,
									color: "rgba(255,255,255,0.5)",
									"&.Mui-selected": { color: "#7b68ee" },
								}}
							/>
							<Tab
								icon={<BusinessIcon sx={{ fontSize: 14 }} />}
								iconPosition="start"
								label="Counterparties Network"
								sx={{
									minHeight: "28px",
									py: 0,
									px: 1.5,
									fontSize: "0.72rem",
									fontWeight: 700,
									color: "rgba(255,255,255,0.5)",
									"&.Mui-selected": { color: "#7b68ee" },
								}}
							/>
							<Tab
								icon={<AccountBalanceIcon sx={{ fontSize: 14 }} />}
								iconPosition="start"
								label="Loans & Credit Ledger"
								sx={{
									minHeight: "28px",
									py: 0,
									px: 1.5,
									fontSize: "0.72rem",
									fontWeight: 700,
									color: "rgba(255,255,255,0.5)",
									"&.Mui-selected": { color: "#7b68ee" },
								}}
							/>
						</Tabs>
					</Box>
				)}

				{/* Content Section */}
				<Box
					sx={{
						flex: 1,
						minHeight: 0,
						width: "100%",
						position: "relative",
						display: "flex",
						flexDirection: "column",
					}}
				>
					{isAdvancedView ? (
						<Box
							sx={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
								minHeight: 0,
								width: "100%",
							}}
						>
							{advancedSubTab === 0 && (
								<BalanceSheetTab
									locationValuations={locationValuations}
									assetDistribution={assetDistribution}
									currency={currentData?.Currency || ""}
									currentData={currentData}
									priceMode={priceMode}
									onPriceModeChange={handlePriceModeChange}
									priceSource={priceSource}
									onPriceSourceChange={handlePriceSourceChange}
								/>
							)}
							{advancedSubTab === 1 && (
								<CashFlowTab
									cashFlows={currentData?.CashFlows || []}
									historyData={currentData?.History || []}
									currency={currentData?.Currency || ""}
									currentData={currentData}
									transactions={filteredTransactions}
									timeRange={timeRange}
									loading={loading}
									onSelectTx={openTransactionDrawer}
								/>
							)}
							{advancedSubTab === 2 && (
								<MarketExposureTab
									currency={currentData?.Currency || ""}
									currentData={currentData}
									transactions={filteredTransactions}
									onSelectTx={openTransactionDrawer}
								/>
							)}
							{advancedSubTab === 3 && (
								<ContractsTab
									currentData={currentData}
									netPending={netPending}
									timeRange={timeRange}
									onSelectTx={openTransactionDrawer}
								/>
							)}
							{advancedSubTab === 4 && (
								<BurnRateTab
									workforceBurnRate={workforceBurnRate}
									locationValuations={locationValuations}
									currency={currentData?.Currency || ""}
								/>
							)}
							{advancedSubTab === 5 && (
								<CounterpartyTab
									partners={topPartners}
									transactions={filteredTransactions}
									currency={currentData?.Currency || ""}
									timeRange={timeRange}
									onSelectTx={openTransactionDrawer}
								/>
							)}
							{advancedSubTab === 6 && (
								<LoansTab currency={currentData?.Currency || ""} />
							)}
						</Box>
					) : (
						/* Basic Mode Single-Page Grid View */
						<Box
							sx={{
								flex: 1,
								minHeight: 0,
								display: "flex",
								flexDirection: "column",
								gap: 1.25,
								height: { xs: "auto", lg: "100%" },
							}}
						>
							{/* Row 1: Liquidity Trend Chart */}
							<Box
								sx={{
									height: { xs: "280px", sm: "320px", lg: "33%" },
									minHeight: { xs: "250px", lg: 0 },
									flexShrink: 0,
								}}
							>
								<LiquidityTrendChart
									historyData={currentData?.History}
									currency={currentData?.Currency}
									timeRange={timeRange}
									loading={loading}
								/>
							</Box>

							{/* Row 2: Horizontal Scrollable Carousel Container for 4 Cards */}
							<Box
								sx={{
									height: { xs: "340px", sm: "360px", lg: "33%" },
									minHeight: { xs: "320px", lg: 0 },
									display: "flex",
									flexDirection: "row",
									flexWrap: "nowrap",
									alignItems: "stretch",
									overflowX: "auto",
									gap: 1.5,
									pb: 0.5,
									flexShrink: 0,
									"&::-webkit-scrollbar": { height: "5px" },
									"&::-webkit-scrollbar-thumb": {
										backgroundColor: "rgba(123, 104, 238, 0.35)",
										borderRadius: "4px",
									},
									"& > *": {
										flex: { xs: "0 0 340px", sm: "0 0 380px", lg: "1 0 380px" },
										minWidth: { xs: "320px", sm: "360px", lg: "380px" },
										height: "100%",
									},
								}}
							>
								<VelocityLedgerTable
									cashFlows={currentData?.CashFlows}
									transactions={filteredTransactions}
									loading={loading}
								/>
								<IncomeSourcesChart
									pieChartData={pieChartData}
									loading={loading}
									timeRange={timeRange}
								/>
								<VelocityBarChart
									incomeExpense30D={incomeExpense30D}
									loading={loading}
									timeRange={timeRange}
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
											Top Partners ({timeRange})
										</Typography>
									</Box>
									<Box sx={{ flex: 1, overflowY: "auto", p: 0 }}>
										<TopPartnersTableContent
											partners={topPartners}
											onRowClick={openPartnerDrawer}
											loading={loading}
											currency={currentData?.Currency || ""}
										/>
									</Box>
								</FlexCard>
							</Box>

							{/* Row 3: Activity Log */}
							<Box
								sx={{
									height: { xs: "420px", sm: "460px", lg: "34%" },
									minHeight: { xs: "380px", lg: 0 },
									flex: { lg: 1 },
								}}
							>
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
										<Box
											sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
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
												{timeRange} Activity Log
											</Typography>
											<TextField
												size="small"
												placeholder="Search counterparty..."
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
												slotProps={{
													input: {
														startAdornment: (
															<InputAdornment position="start">
																<SearchIcon
																	sx={{
																		fontSize: 13,
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
																	<ClearIcon sx={{ fontSize: 12 }} />
																</IconButton>
															</InputAdornment>
														),
													},
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
							</Box>
						</Box>
					)}

					{/* Fullscreen Activity Overlay */}
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
										sx={{
											color: "#7b68ee",
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											fontWeight: 800,
											fontSize: "1rem",
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
										slotProps={{
											input: {
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
											},
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
				isBasicMode={!isAdvancedView}
				showPartnerDetails={advancedSubTab === 1}
			/>
		</Box>
	);
}
