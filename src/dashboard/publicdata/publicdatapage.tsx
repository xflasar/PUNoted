import React, { useMemo, useState } from "react";
import {
	Box,
	Tab,
	Tabs,
	ToggleButton,
	ToggleButtonGroup,
	useMediaQuery,
	useTheme,
	Paper,
} from "@mui/material";
import { ShowChart, ViewList, SwapHoriz } from "@mui/icons-material";

// CX imports
import { useTickerData } from "../../cx/hooks/usetickerdata";
import { CommoditySidebar } from "../../cx/components/commoditysidebar";
import { TerminalView } from "../../cx/components/terminalview";
import { MarketList } from "../../cx/components/marketlist";
import { ArbitrageFinder } from "../../cx/components/arbitragefinder";
import { CXPageSkeleton } from "../../cx/components/cxskeleton";

// COSM imports
import VendorsList from "../../cosm/vendors/vendorlist";
import MainDashboard from "../../cosm/pricelist/maindashboard";
import ProductionDashboard from "../../cosm/shipproduction/productiondashboard";

type PublicDataTab =
	| "cx"
	| "vendors"
	| "cart"
	| "store"
	| "priceList"
	| "production";

const PublicDataPage: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const [activeTab, setActiveTab] = useState<PublicDataTab>("cx");
	const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
		() => new Set(["cx"]),
	);

	// CX Hook & State
	const {
		marketData,
		loadingMarket,
		isMobile: cxMobile,
		viewMode,
		setViewMode,
		selectedTicker,
		selectedExchange,
		days,
		setDays,
		startDate,
		endDate,
		mobileDrawerOpen,
		setMobileDrawerOpen,
		tickerState,
		currentItem,
		currentPrice,
		handleCustomDateChange,
		handleSelectCommodity,
		handleSelectExchange,
		handleMarketListSelectTicker,
	} = useTickerData();

	const handleTabChange = (
		_: React.SyntheticEvent,
		newValue: PublicDataTab,
	) => {
		setActiveTab(newValue);
		setVisitedTabs((prev) => {
			if (prev.has(newValue)) return prev;
			const next = new Set(prev);
			next.add(newValue);
			return next;
		});
	};

	const sidebarContent = useMemo(
		() => (
			<CommoditySidebar
				marketData={marketData}
				selectedTicker={selectedTicker}
				selectedExchange={selectedExchange}
				onSelectCommodity={handleSelectCommodity}
				onSelectExchange={handleSelectExchange}
			/>
		),
		[
			marketData,
			selectedTicker,
			selectedExchange,
			handleSelectCommodity,
			handleSelectExchange,
		],
	);

	return (
		<Box
			sx={{
				height: "100%",
				width: "100%",
				flex: 1,
				overflow: "hidden",
				display: "flex",
				flexDirection: "column",
				bgcolor: "#020205",
				backgroundImage:
					"radial-gradient(circle at 50% 10%, #080816 0%, #030308 60%, #000000 100%)",
				color: "white",
			}}
		>
			{/* Top Navigation Bar */}
			<Paper
				elevation={0}
				sx={{
					borderBottom: "1px solid rgba(123, 104, 238, 0.2)",
					bgcolor: "rgba(6, 6, 14, 0.9)",
					backdropFilter: "blur(12px)",
					px: { xs: 1, sm: 2 },
					pt: 1,
					pb: 0.5,
					flexShrink: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					flexWrap: "wrap",
					gap: 1,
				}}
			>
				<Tabs
					value={activeTab}
					onChange={handleTabChange}
					variant="scrollable"
					scrollButtons="auto"
					centered={!isMobile}
					sx={{
						minHeight: 40,
						flex: 1,
						"& .MuiTabs-flexContainer": {
							justifyContent: { xs: "flex-start", sm: "center" },
						},
						"& .MuiTabs-indicator": {
							backgroundColor: "#7B68EE",
							height: 3,
							borderRadius: "3px 3px 0 0",
							boxShadow: "0 0 10px #7B68EE",
						},
						"& .MuiTab-root": {
							color: "rgba(255, 255, 255, 0.6)",
							fontSize: { xs: "0.8rem", sm: "0.9rem" },
							fontWeight: 600,
							textTransform: "none",
							minHeight: 40,
							minWidth: { xs: 70, sm: 110 },
							px: { xs: 1.5, sm: 2.5 },
							py: 0.5,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							"&.Mui-selected": {
								color: "#fff",
							},
							"&:hover": {
								color: "rgba(255, 255, 255, 0.9)",
								backgroundColor: "rgba(123, 104, 238, 0.08)",
							},
						},
					}}
				>
					<Tab value="cx" label="CX Exchange" />
					<Tab value="vendors" label="COSM Market" />
					<Tab value="cart" label="COSM Cart" />
					<Tab value="store" label="COSM My Store" />
					<Tab value="priceList" label="COSM Prices" />
					<Tab value="production" label="COSM Ship Production" />
				</Tabs>

				{/* CX ViewMode Toggle */}
				{activeTab === "cx" && (
					<Box sx={{ display: "flex", alignItems: "center", my: "auto" }}>
						<ToggleButtonGroup
							value={viewMode}
							exclusive
							onChange={(_, val) => {
								if (val) setViewMode(val);
							}}
							size="small"
							sx={{
								bgcolor: "rgba(255, 255, 255, 0.04)",
								border: "1px solid rgba(123, 104, 238, 0.2)",
								borderRadius: "8px",
								overflow: "hidden",
								"& .MuiToggleButton-root": {
									color: "rgba(255, 255, 255, 0.6)",
									fontSize: { xs: "0.65rem", sm: "0.75rem" },
									px: { xs: 1, sm: 1.5 },
									py: 0.5,
									gap: 0.5,
									border: "none",
									fontWeight: 700,
									textTransform: "uppercase",
									"&.Mui-selected": {
										color: "white",
										bgcolor: "#7B68EE",
										boxShadow: "0 0 15px rgba(123, 104, 238, 0.5)",
										"&:hover": { bgcolor: "#6a5acd" },
									},
									"&:hover": {
										bgcolor: "rgba(123, 104, 238, 0.15)",
										color: "white",
									},
								},
							}}
						>
							<ToggleButton value="terminal">
								<ShowChart fontSize="small" />
								{cxMobile ? "Terminal" : "Terminal View"}
							</ToggleButton>
							<ToggleButton value="market">
								<ViewList fontSize="small" />
								{cxMobile ? "Overview" : "Market Overview"}
							</ToggleButton>
							<ToggleButton value="arbitrage" disabled>
								<SwapHoriz fontSize="small" />
								{cxMobile ? "Arbitrage" : "Trade & Arbitrage"}
							</ToggleButton>
						</ToggleButtonGroup>
					</Box>
				)}
			</Paper>

			{/* Main Content Area */}
			<Box
				sx={{
					flex: 1,
					width: "100%",
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
					position: "relative",
				}}
			>
				{/* CX Tab */}
				<Box
					role="tabpanel"
					hidden={activeTab !== "cx"}
					sx={{
						height: "100%",
						width: "100%",
						display: activeTab === "cx" ? "flex" : "none",
						flexDirection: "column",
						overflow: "hidden",
					}}
				>
					<Box
						sx={{
							flex: 1,
							width: "100%",
							maxWidth: 1600,
							mx: "auto",
							p: { xs: 1, sm: 2 },
							display: "flex",
							gap: 2,
							overflow: "hidden",
						}}
					>
						{loadingMarket && marketData.length === 0 ? (
							<CXPageSkeleton />
						) : (
							<>
								{/* Market Overview View */}
								{viewMode === "market" && (
									<Box
										sx={{
											width: "100%",
											height: "100%",
											display: "flex",
											overflow: "hidden",
										}}
									>
										<MarketList
											marketData={marketData}
											onSelectTicker={handleMarketListSelectTicker}
										/>
									</Box>
								)}

								{/* Trade & Arbitrage View */}
								{viewMode === "arbitrage" && (
									<Box
										sx={{
											width: "100%",
											height: "100%",
											display: "flex",
											overflow: "hidden",
										}}
									>
										<ArbitrageFinder marketData={marketData} />
									</Box>
								)}

								{/* Terminal View */}
								<TerminalView
									viewMode={viewMode}
									selectedTicker={selectedTicker}
									selectedExchange={selectedExchange}
									mobileDrawerOpen={mobileDrawerOpen}
									setMobileDrawerOpen={setMobileDrawerOpen}
									sidebarContent={sidebarContent}
									handleCustomDateChange={handleCustomDateChange}
									setDays={setDays}
									tickerState={tickerState}
									currentPrice={currentPrice}
									currentItem={currentItem}
									days={days}
									startDate={startDate}
									endDate={endDate}
								/>
							</>
						)}
					</Box>
				</Box>

				{/* PX Market / Cart / My Store Tabs */}
				<Box
					role="tabpanel"
					hidden={
						activeTab !== "vendors" &&
						activeTab !== "cart" &&
						activeTab !== "store"
					}
					sx={{
						height: "100%",
						width: "100%",
						overflow: "hidden",
						display:
							activeTab === "vendors" ||
								activeTab === "cart" ||
								activeTab === "store"
								? "flex"
								: "none",
						flexDirection: "column",
					}}
				>
					{(visitedTabs.has("vendors") ||
						visitedTabs.has("cart") ||
						visitedTabs.has("store")) && (
							<VendorsList
								loggedIn={true}
								activeTab={
									activeTab === "vendors" ||
										activeTab === "cart" ||
										activeTab === "store"
										? activeTab
										: "vendors"
								}
								onLoginRequest={() => { }}
							/>
						)}
				</Box>

				{/* COSM Price List Tab */}
				<Box
					role="tabpanel"
					hidden={activeTab !== "priceList"}
					sx={{
						height: "100%",
						width: "100%",
						overflow: "hidden",
						display: activeTab === "priceList" ? "flex" : "none",
						flexDirection: "column",
					}}
				>
					{(activeTab === "priceList" || visitedTabs.has("priceList")) && (
						<MainDashboard />
					)}
				</Box>

				{/* Ship Production Tab */}
				<Box
					role="tabpanel"
					hidden={activeTab !== "production"}
					sx={{
						height: "100%",
						width: "100%",
						overflow: "hidden",
						display: activeTab === "production" ? "flex" : "none",
						flexDirection: "column",
					}}
				>
					{(activeTab === "production" || visitedTabs.has("production")) && (
						<ProductionDashboard isMobile={isMobile} />
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default PublicDataPage;
