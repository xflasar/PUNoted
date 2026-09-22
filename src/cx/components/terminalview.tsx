import React from "react";
import { FilterList } from "@mui/icons-material";
import { Box, Button, Drawer, Typography } from "@mui/material";
import { OrderBook } from "./orderbook";
import { PriceChart } from "./pricechart";
import { StatsSummary } from "./statssummary";
import { HistoryLog } from "./historylog";
import type { HistoryPoint, TickerDetail } from "../types/types";

interface TerminalViewProps {
	viewMode: "terminal" | "market" | "arbitrage";
	selectedTicker: string;
	selectedExchange: string;
	mobileDrawerOpen: boolean;
	setMobileDrawerOpen: (open: boolean) => void;
	sidebarContent: React.ReactNode;
	handleCustomDateChange: (start: string, end: string) => void;
	setDays: (days: number) => void;
	tickerState: {
		history: HistoryPoint[];
		detail: TickerDetail | null;
		loading: boolean;
	};
	currentPrice: number | undefined;
	currentItem: any;
	days: number;
	startDate: string;
	endDate: string;
}

export const TerminalView = ({
	viewMode,
	selectedTicker,
	selectedExchange,
	mobileDrawerOpen,
	setMobileDrawerOpen,
	sidebarContent,
	handleCustomDateChange,
	setDays,
	tickerState,
	currentPrice,
	currentItem,
	days,
	startDate,
	endDate,
}: TerminalViewProps) => {
	return (
		<Box
			sx={{
				width: "100%",
				height: "100%",
				display: viewMode === "terminal" ? "flex" : "none",
				gap: 2,
				overflow: "hidden",
				flexDirection: "row",
			}}
		>
			{/* Desktop Left Sidebar (hidden on medium/mobile screens < 1200px) */}
			<Box
				sx={{
					display: { xs: "none", lg: "block" },
					height: "100%",
					flexShrink: 0,
				}}
			>
				{sidebarContent}
			</Box>

			{/* Mobile/Tablet Slide-in Drawer */}
			<Drawer
				anchor="left"
				open={mobileDrawerOpen}
				onClose={() => setMobileDrawerOpen(false)}
				slotProps={{
					paper: {
						sx: {
							width: 320,
							bgcolor: "#06060E",
							borderRight: "1px solid rgba(123, 104, 238, 0.3)",
						},
					},
				}}
			>
				{sidebarContent}
			</Drawer>

			{selectedTicker ? (
				<Box
					sx={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						gap: 2,
						overflowY: "auto",
						height: "100%",
						pr: 0.5,
						"&::-webkit-scrollbar": { width: "4px" },
						"&::-webkit-scrollbar-track": { background: "transparent" },
						"&::-webkit-scrollbar-thumb": {
							backgroundColor: "rgba(123, 104, 238, 0.4)",
							borderRadius: "2px",
						},
					}}
				>
					{/* Selector Trigger Button (shown below lg breakpoint < 1200px) */}
					<Box sx={{ display: { xs: "block", lg: "none" }, width: "100%" }}>
						<Button
							variant="contained"
							fullWidth
							startIcon={<FilterList />}
							onClick={() => setMobileDrawerOpen(true)}
							sx={{
								bgcolor: "rgba(123, 104, 238, 0.25)",
								color: "white",
								borderColor: "#7B68EE",
								border: "1px solid rgba(123, 104, 238, 0.4)",
								fontWeight: 700,
								py: 1,
								borderRadius: "10px",
								"&:hover": { bgcolor: "rgba(123, 104, 238, 0.4)" },
							}}
						>
							Select Commodity ({selectedTicker} - {selectedExchange})
						</Button>
					</Box>

					<PriceChart
						ticker={selectedTicker}
						exchange={selectedExchange}
						history={tickerState.history}
						loading={tickerState.loading}
						days={days}
						onChangeDays={setDays}
						startDate={startDate}
						endDate={endDate}
						onCustomDateChange={handleCustomDateChange}
						currentPrice={currentPrice}
						currentItem={currentItem}
					/>

					<StatsSummary
						detail={tickerState.detail}
						currentItem={currentItem}
						exchange={selectedExchange}
						history={tickerState.history}
					/>

					<Box
						sx={{
							display: "flex",
							flexDirection: { xs: "column", md: "row" },
							gap: 2,
						}}
					>
						<Box sx={{ width: { xs: "100%", md: "35%" } }}>
							<OrderBook
								bids={tickerState.detail?.bids || []}
								asks={tickerState.detail?.asks || []}
							/>
						</Box>
						<Box sx={{ width: { xs: "100%", md: "65%" }, flex: 1 }}>
							<HistoryLog
								history={tickerState.history}
								days={days}
								currentItem={currentItem}
								exchange={selectedExchange}
							/>
						</Box>
					</Box>
				</Box>
			) : (
				<Box
					sx={{
						flex: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: "rgba(16, 16, 32, 0.5)",
						border: "1px solid rgba(123, 104, 238, 0.35)",
						borderRadius: "16px",
						p: 4,
					}}
				>
					<Typography variant="h6" sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
						Select a commodity to view market data
					</Typography>
				</Box>
			)}
		</Box>
	);
};
