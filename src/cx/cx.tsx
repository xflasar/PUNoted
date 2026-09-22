import { useMemo } from "react";
import { Box } from "@mui/material";
import { CommoditySidebar } from "./components/commoditysidebar";
import { ArbitrageFinder } from "./components/arbitragefinder";
import { MarketList } from "./components/marketlist";
import { CXPageSkeleton } from "./components/cxskeleton";
import { TerminalView } from "./components/terminalview";
import { CXHeader } from "./components/cxheader";
import { useTickerData } from "./hooks/usetickerdata";

const CX = () => {
	const {
		marketData,
		loadingMarket,
		isMobile,
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
		navigate,
	} = useTickerData();

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
				width: "100vw",
				height: "100vh",
				bgcolor: "#020205",
				backgroundImage:
					"radial-gradient(circle at 50% 20%, #080816 0%, #030308 60%, #000000 100%)",
				color: "white",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
			}}
		>
			<CXHeader
				viewMode={viewMode}
				setViewMode={setViewMode}
				isMobile={isMobile}
				navigate={navigate}
			/>
			<Box
				sx={{
					flex: 1,
					width: "100%",
					maxWidth: 1560,
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
	);
};

export default CX;
