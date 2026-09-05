import React, { useState, useEffect, useMemo } from "react";
import {
	Dialog,
	Box,
	Typography,
	IconButton,
	Grid,
	Chip,
	Button,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MaterialBadge from "../../../cosm/components/materialbadge";
import { PriceChart } from "../../../cx/pricechart";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";
import { useGlobalData } from "../../../context/globaldatacontext";
import { fetchClient } from "../../../utils/apiclient";
import type { HistoryPoint } from "../../../cx/types";

interface MaterialMarketModalProps {
	ticker: string | null;
	currency: string;
	onClose: () => void;
}

const ALL_EXCHANGES = [
	{ code: "IC1", name: "Benten (IC1)" },
	{ code: "AI1", name: "Promitor (AI1)" },
	{ code: "CI1", name: "Kati (CI1)" },
	{ code: "CI2", name: "Montem (CI2)" },
	{ code: "NC1", name: "Antares (NC1)" },
	{ code: "NC2", name: "Boucher (NC2)" },
	{ code: "EC1", name: "Hephaestus (EC1)" },
];

export const MaterialMarketModal: React.FC<MaterialMarketModalProps> = ({
	ticker,
	currency,
	onClose,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const { marketData } = useGlobalData();
	const [days, setDays] = useState<number>(30);
	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");
	const [history, setHistory] = useState<HistoryPoint[]>([]);
	const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

	// Default exchange code matching currency
	const defaultExchange = useMemo(() => {
		return currency === "AIC"
			? "AI1"
			: currency === "NCC"
				? "NC1"
				: currency === "CIS"
					? "CI1"
					: currency === "ECD"
						? "EC1"
						: "IC1";
	}, [currency]);

	const [selectedExchange, setSelectedExchange] =
		useState<string>(defaultExchange);

	useEffect(() => {
		if (ticker) {
			setSelectedExchange(defaultExchange);
		}
	}, [defaultExchange, ticker]);

	// Fetch historical price data via backend API for selected exchange
	useEffect(() => {
		if (!ticker) return;

		let isMounted = true;
		const fetchHistoryData = async () => {
			setLoadingHistory(true);
			try {
				let endpoint = `internal/cx/history/${ticker}?exchange=${selectedExchange}&days=${days}`;
				if (startDate && endDate) {
					endpoint = `internal/cx/history/${ticker}?exchange=${selectedExchange}&start_date=${startDate}&end_date=${endDate}`;
				}
				const res = await fetchClient(endpoint);
				if (res.ok && isMounted) {
					const data = await res.json();
					setHistory(Array.isArray(data) ? data : []);
				}
			} catch (err) {
				console.error("Failed to fetch historical market data:", err);
				if (isMounted) setHistory([]);
			} finally {
				if (isMounted) setLoadingHistory(false);
			}
		};

		fetchHistoryData();
		return () => {
			isMounted = false;
		};
	}, [ticker, selectedExchange, days, startDate, endDate]);

	// Find live market data row for ticker
	const materialMarketRow = useMemo(() => {
		if (!ticker || !marketData) return null;

		if (Array.isArray(marketData)) {
			return marketData.find(
				(m: any) =>
					m.Ticker === ticker ||
					m.MaterialTicker === ticker ||
					m.Ticker === `${ticker}.${selectedExchange}` ||
					m.Ticker?.startsWith(ticker + "."),
			);
		}
		if (typeof marketData === "object") {
			return (
				marketData[ticker] ||
				marketData[`${ticker}.${selectedExchange}`] ||
				Object.values(marketData).find(
					(m: any) =>
						m?.Ticker === ticker ||
						m?.MaterialTicker === ticker ||
						m?.Ticker?.startsWith(ticker + "."),
				)
			);
		}
		return null;
	}, [ticker, marketData, selectedExchange]);

	if (!ticker) return null;

	// Market metrics for active exchange
	const bidPrice = materialMarketRow
		? materialMarketRow[`${selectedExchange}-BidPrice`] ||
			materialMarketRow.BidPrice ||
			materialMarketRow.bid ||
			0
		: 0;
	const bidAvail = materialMarketRow
		? materialMarketRow[`${selectedExchange}-BidAvail`] ||
			materialMarketRow[`${selectedExchange}-BidAmt`] ||
			0
		: 0;
	const askPrice = materialMarketRow
		? materialMarketRow[`${selectedExchange}-AskPrice`] ||
			materialMarketRow.AskPrice ||
			materialMarketRow.ask ||
			0
		: 0;
	const askAvail = materialMarketRow
		? materialMarketRow[`${selectedExchange}-AskAvail`] ||
			materialMarketRow[`${selectedExchange}-AskAmt`] ||
			0
		: 0;
	const avgPrice = materialMarketRow
		? materialMarketRow[`${selectedExchange}-Average`] ||
			materialMarketRow.PriceAverage ||
			materialMarketRow.price ||
			0
		: 0;
	const avg7d = materialMarketRow
		? materialMarketRow[`${selectedExchange}-7DAverage`] ||
			materialMarketRow[`${selectedExchange}-7DBidPrice`] ||
			0
		: 0;
	const avg30d = materialMarketRow
		? materialMarketRow[`${selectedExchange}-30DAverage`] ||
			materialMarketRow[`${selectedExchange}-30DBidPrice`] ||
			0
		: 0;
	const tradedVal = materialMarketRow
		? materialMarketRow[`${selectedExchange}-Traded`] || 0
		: 0;

	return (
		<Dialog
			open={Boolean(ticker)}
			onClose={onClose}
			maxWidth="lg"
			fullWidth
			fullScreen={isMobile}
			slotProps={{
				paper: {
					sx: {
						backgroundColor: "rgba(4, 4, 10, 0.96)",
						backdropFilter: "blur(30px)",
						border: isMobile ? "none" : "1px solid rgba(123, 104, 238, 0.35)",
						color: "white",
						borderRadius: isMobile ? 0 : "20px",
						boxShadow: "0 0 60px rgba(123, 104, 238, 0.25)",
						p: 0,
						m: isMobile ? 0 : 2,
						overflowX: "hidden",
						overflowY: "auto",
						maxHeight: isMobile ? "100vh" : "96vh",
					},
				},
			}}
		>
			<Box
				sx={{
					p: { xs: 1.25, sm: 2.25 },
					display: "flex",
					flexDirection: "column",
					gap: 1.5,
				}}
			>
				{/* Top Header Bar (Sticky Top) */}
				<Box
					sx={{
						position: "sticky",
						top: 0,
						zIndex: 10,
						bgcolor: "rgba(4, 4, 10, 0.98)",
						backdropFilter: "blur(30px)",
						pt: { xs: 1.25, sm: 2.25 },
						pb: 1.25,
						px: { xs: 1.25, sm: 2.25 },
						mx: { xs: -1.25, sm: -2.25 },
						mt: { xs: -1.25, sm: -2.25 },
						borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
						display: "flex",
						alignItems: "center",
						justify: "space-between",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
						<MaterialBadge ticker={ticker} />
						<Box>
							<Typography
								sx={{
									fontSize: { xs: "0.92rem", sm: "1.1rem" },
									fontWeight: 800,
									color: "white",
								}}
							>
								{ticker} Market Intelligence
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.64rem" }}
							>
								Commodity Exchange Rates & Live Historical Trend
							</Typography>
						</Box>
					</Box>
					<IconButton
						onClick={onClose}
						size="small"
						sx={{
							color: "rgba(255,255,255,0.6)",
							"&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.1)" },
						}}
					>
						<CloseIcon fontSize="small" />
					</IconButton>
				</Box>

				{/* CX Exchange Selector Pill Tabs - Responsive Flex Wrap / Scroll */}
				<Box
					sx={{
						display: "flex",
						gap: 0.75,
						overflowX: "auto",
						pb: 0.5,
						"&::-webkit-scrollbar": { height: "3px" },
						"&::-webkit-scrollbar-thumb": {
							backgroundColor: "rgba(123, 104, 238, 0.3)",
							borderRadius: "4px",
						},
					}}
				>
					{ALL_EXCHANGES.map((ex) => {
						const isSelected = selectedExchange === ex.code;
						const exBid = materialMarketRow
							? materialMarketRow[`${ex.code}-BidPrice`] || 0
							: 0;

						return (
							<Button
								key={ex.code}
								onClick={() => setSelectedExchange(ex.code)}
								size="small"
								sx={{
									py: 0.4,
									px: 1,
									minWidth: "fit-content",
									borderRadius: "8px",
									textTransform: "none",
									fontSize: "0.70rem",
									fontWeight: 800,
									color: isSelected ? "white" : "rgba(255,255,255,0.6)",
									bgcolor: isSelected ? "#7b68ee" : "rgba(255,255,255,0.04)",
									border: isSelected
										? "1px solid #7b68ee"
										: "1px solid rgba(255,255,255,0.06)",
									boxShadow: isSelected
										? "0 0 14px rgba(123, 104, 238, 0.4)"
										: "none",
									justifyContent: "center",
									whiteSpace: "nowrap",
									flexShrink: 0,
									"&:hover": {
										bgcolor: isSelected ? "#6956e0" : "rgba(255,255,255,0.08)",
									},
								}}
							>
								{ex.code}{" "}
								{exBid > 0 && (
									<Typography
										component="span"
										sx={{
											opacity: 0.7,
											ml: 0.4,
											fontFamily: "monospace",
											fontSize: "0.66rem",
										}}
									>
										({formatCurrency(exBid)})
									</Typography>
								)}
							</Button>
						);
					})}
				</Box>

				{/* Key Statistics Grid - Responsive 2 to 6 Columns */}
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: {
							xs: "repeat(2, 1fr)",
							sm: "repeat(3, 1fr)",
							md: "repeat(6, 1fr)",
						},
						gap: 1,
					}}
				>
					<Box
						sx={{
							p: 1,
							borderRadius: "10px",
							bgcolor: "rgba(0,0,0,0.45)",
							border: "1px solid rgba(74, 222, 128, 0.25)",
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.4)",
								fontSize: "0.60rem",
								fontWeight: 800,
								textTransform: "uppercase",
								whiteSpace: "nowrap",
							}}
						>
							BID ({bidAvail.toLocaleString()} U)
						</Typography>
						<Typography
							sx={{
								fontSize: "0.85rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: SEMANTIC_COLORS.neonGreen,
								mt: 0.25,
							}}
						>
							{bidPrice > 0 ? formatCurrency(bidPrice) : "-"}
						</Typography>
					</Box>

					<Box
						sx={{
							p: 1,
							borderRadius: "10px",
							bgcolor: "rgba(0,0,0,0.45)",
							border: "1px solid rgba(248, 113, 113, 0.25)",
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.4)",
								fontSize: "0.60rem",
								fontWeight: 800,
								textTransform: "uppercase",
								whiteSpace: "nowrap",
							}}
						>
							ASK ({askAvail.toLocaleString()} U)
						</Typography>
						<Typography
							sx={{
								fontSize: "0.85rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: SEMANTIC_COLORS.neonRed,
								mt: 0.25,
							}}
						>
							{askPrice > 0 ? formatCurrency(askPrice) : "-"}
						</Typography>
					</Box>

					<Box
						sx={{
							p: 1,
							borderRadius: "10px",
							bgcolor: "rgba(0,0,0,0.45)",
							border: "1px solid rgba(123, 104, 238, 0.25)",
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.4)",
								fontSize: "0.60rem",
								fontWeight: 800,
								textTransform: "uppercase",
								whiteSpace: "nowrap",
							}}
						>
							AVG PRICE
						</Typography>
						<Typography
							sx={{
								fontSize: "0.85rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: "#7b68ee",
								mt: 0.25,
							}}
						>
							{avgPrice > 0 ? formatCurrency(avgPrice) : "-"}
						</Typography>
					</Box>

					<Box
						sx={{
							p: 1,
							borderRadius: "10px",
							bgcolor: "rgba(0,0,0,0.45)",
							border: "1px solid rgba(255,255,255,0.1)",
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.4)",
								fontSize: "0.60rem",
								fontWeight: 800,
								textTransform: "uppercase",
								whiteSpace: "nowrap",
							}}
						>
							7D AVERAGE
						</Typography>
						<Typography
							sx={{
								fontSize: "0.85rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: "rgba(255,255,255,0.9)",
								mt: 0.25,
							}}
						>
							{avg7d > 0 ? formatCurrency(avg7d) : "-"}
						</Typography>
					</Box>

					<Box
						sx={{
							p: 1,
							borderRadius: "10px",
							bgcolor: "rgba(0,0,0,0.45)",
							border: "1px solid rgba(255,255,255,0.1)",
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.4)",
								fontSize: "0.60rem",
								fontWeight: 800,
								textTransform: "uppercase",
								whiteSpace: "nowrap",
							}}
						>
							30D AVERAGE
						</Typography>
						<Typography
							sx={{
								fontSize: "0.85rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: "rgba(255,255,255,0.9)",
								mt: 0.25,
							}}
						>
							{avg30d > 0 ? formatCurrency(avg30d) : "-"}
						</Typography>
					</Box>

					<Box
						sx={{
							p: 1,
							borderRadius: "10px",
							bgcolor: "rgba(0,0,0,0.45)",
							border: "1px solid rgba(255,255,255,0.1)",
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.4)",
								fontSize: "0.60rem",
								fontWeight: 800,
								textTransform: "uppercase",
								whiteSpace: "nowrap",
							}}
						>
							24H TRADED
						</Typography>
						<Typography
							sx={{
								fontSize: "0.85rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: "white",
								mt: 0.25,
							}}
						>
							{tradedVal.toLocaleString()} u
						</Typography>
					</Box>
				</Box>

				<Box
					sx={{
						borderTop: "1px solid rgba(255, 255, 255, 0.08)",
						pt: 1.5,
						flex: 1,
						minHeight: 0,
					}}
				>
					<PriceChart
						ticker={ticker}
						exchange={selectedExchange}
						history={history}
						loading={loadingHistory}
						days={days}
						onChangeDays={(d) => setDays(d)}
						startDate={startDate}
						endDate={endDate}
						onCustomDateChange={(s, e) => {
							setStartDate(s);
							setEndDate(e);
						}}
						currentPrice={avgPrice}
					/>
				</Box>
			</Box>
		</Dialog>
	);
};
