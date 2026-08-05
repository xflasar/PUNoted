import React, { useState, useMemo } from "react";
import {
	Box,
	Paper,
	TextField,
	InputAdornment,
	Typography,
	Chip,
	Stack,
} from "@mui/material";
import { Search } from "lucide-react";
import MaterialBadge from "../cosm/components/materialbadge";

export interface CommoditySidebarProps {
	marketData: Record<string, any>[];
	selectedTicker: string;
	selectedExchange: string;
	onSelectCommodity: (ticker: string) => void;
	onSelectExchange: (exchange: string) => void;
}

const EXCHANGES = ["IC1", "AI1", "CI1", "CI2", "NC1", "NC2"];

const formatQty = (num: number) => {
	if (!num) return "-";
	if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
	if (num >= 1000) return (num / 1000).toFixed(1) + "k";
	return num.toLocaleString();
};

export const CommoditySidebar: React.FC<CommoditySidebarProps> = ({
	marketData,
	selectedTicker,
	selectedExchange,
	onSelectCommodity,
	onSelectExchange,
}) => {
	const [searchQuery, setSearchQuery] = useState("");

	const commodities = useMemo(() => {
		return marketData.map((row) => {
			const ticker = row.Ticker || row.ticker || "";
			const askPrice = row[`${selectedExchange}-AskPrice`] || 0;
			const bidPrice = row[`${selectedExchange}-BidPrice`] || 0;
			const askAmt = row[`${selectedExchange}-AskAmt`] || 0;
			const bidAmt = row[`${selectedExchange}-BidAmt`] || 0;
			const avgPrice =
				row[`${selectedExchange}-Average`] || askPrice || bidPrice || 0;

			return {
				ticker,
				name: ticker,
				price: avgPrice,
				askPrice,
				bidPrice,
				askAmt,
				bidAmt,
			};
		});
	}, [marketData, selectedExchange]);

	const filteredCommodities = useMemo(() => {
		if (!searchQuery.trim()) return commodities;
		const q = searchQuery.toLowerCase();
		return commodities.filter((c) => c.ticker.toLowerCase().includes(q));
	}, [commodities, searchQuery]);

	return (
		<Paper
			elevation={3}
			sx={{
				width: { xs: "100%", md: 340 },
				flexShrink: 0,
				display: "flex",
				flexDirection: "column",
				background: "rgba(16, 16, 32, 0.5)",
				border: "1px solid rgba(123, 104, 238, 0.35)",
				boxShadow:
					"0 0 35px rgba(123, 104, 238, 0.18), inset 0 0 20px rgba(123, 104, 238, 0.06)",
				backdropFilter: "blur(25px)",
				borderRadius: "16px",
				overflow: "hidden",
				height: "100%",
			}}
		>
			{/* Header */}
			<Box sx={{ p: 2, borderBottom: "1px solid rgba(123, 104, 238, 0.2)" }}>
				<Typography
					variant="subtitle2"
					sx={{
						fontWeight: 800,
						color: "#7B68EE",
						textTransform: "uppercase",
						fontSize: "0.75rem",
						letterSpacing: "0.15em",
						mb: 1.5,
					}}
				>
					Commodities
				</Typography>

				{/* Search Input */}
				<TextField
					placeholder="Search Commodities..."
					variant="outlined"
					size="small"
					fullWidth
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					sx={{
						mb: 1.5,
						"& .MuiOutlinedInput-root": {
							bgcolor: "rgba(0, 0, 0, 0.4)",
							fontSize: "0.8rem",
							color: "white",
							borderRadius: "8px",
							"& fieldset": { borderColor: "rgba(123, 104, 238, 0.25)" },
							"&:hover fieldset": { borderColor: "rgba(123, 104, 238, 0.6)" },
							"&.Mui-focused fieldset": {
								borderColor: "#7B68EE",
								boxShadow: "0 0 10px rgba(123, 104, 238, 0.4)",
							},
						},
					}}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<Search size={14} color="rgba(255,255,255,0.5)" />
								</InputAdornment>
							),
						},
					}}
				/>

				{/* Exchange Chips */}
				<Box
					sx={{ overflowX: "auto", display: "flex", justifyContent: "center" }}
				>
					<Stack direction="row" spacing={0.5} sx={{ overflowX: "auto" }}>
						{EXCHANGES.map((ex) => (
							<Chip
								key={ex}
								label={ex}
								size="small"
								onClick={() => onSelectExchange(ex)}
								sx={{
									height: 24,
									fontSize: "0.7rem",
									fontWeight: 700,
									bgcolor:
										selectedExchange === ex
											? "#7B68EE"
											: "rgba(255, 255, 255, 0.08)",
									color:
										selectedExchange === ex
											? "white"
											: "rgba(255, 255, 255, 0.6)",
									boxShadow:
										selectedExchange === ex
											? "0 0 12px rgba(123, 104, 238, 0.5)"
											: "none",
									"&:hover": {
										bgcolor:
											selectedExchange === ex
												? "#6a5acd"
												: "rgba(255, 255, 255, 0.15)",
									},
								}}
							/>
						))}
					</Stack>
				</Box>
			</Box>

			{/* Commodity List */}
			<Box
				sx={{
					flex: 1,
					overflowY: "auto",
					"&::-webkit-scrollbar": { width: "4px" },
					"&::-webkit-scrollbar-track": { background: "transparent" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: "rgba(123, 104, 238, 0.4)",
						borderRadius: "2px",
					},
				}}
			>
				{filteredCommodities.map((item) => {
					const isSelected = selectedTicker === item.ticker;
					return (
						<Box
							key={item.ticker}
							onClick={() => onSelectCommodity(item.ticker)}
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								p: 1.25,
								px: 2,
								cursor: "pointer",
								borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
								bgcolor: isSelected
									? "rgba(123, 104, 238, 0.22)"
									: "transparent",
								borderLeft: isSelected
									? "3px solid #7B68EE"
									: "3px solid transparent",
								boxShadow: isSelected
									? "inset 0 0 15px rgba(123, 104, 238, 0.15)"
									: "none",
								transition: "all 0.15s ease",
								"&:hover": {
									bgcolor: isSelected
										? "rgba(123, 104, 238, 0.28)"
										: "rgba(255, 255, 255, 0.05)",
								},
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
								<MaterialBadge ticker={item.ticker} />
								<Typography
									variant="body2"
									sx={{
										fontWeight: isSelected ? 700 : 500,
										color: isSelected ? "#7B68EE" : "white",
										fontSize: "0.85rem",
									}}
								>
									{item.ticker}
								</Typography>
							</Box>

							<Box sx={{ textAlign: "right" }}>
								<Typography
									variant="body2"
									sx={{
										fontVariantNumeric: "tabular-nums",
										fontWeight: 600,
										fontSize: "0.8rem",
									}}
								>
									<span
										style={{
											color: item.askPrice
												? "#ff5252"
												: "rgba(255,255,255,0.3)",
										}}
									>
										{item.askPrice ? item.askPrice.toLocaleString() : "-"}
									</span>{" "}
									|{" "}
									<span
										style={{
											color: item.bidPrice
												? "#69f0ae"
												: "rgba(255,255,255,0.3)",
										}}
									>
										{item.bidPrice ? item.bidPrice.toLocaleString() : "-"}
									</span>
								</Typography>

								<Typography
									variant="caption"
									sx={{
										fontSize: "0.65rem",
										color: "rgba(255,255,255,0.4)",
										display: "block",
									}}
								>
									<span
										style={{
											color: item.askAmt ? "#ff5252" : "rgba(255,255,255,0.3)",
										}}
									>
										Ask: {formatQty(item.askAmt)}
									</span>{" "}
									|{" "}
									<span
										style={{
											color: item.bidAmt ? "#69f0ae" : "rgba(255,255,255,0.3)",
										}}
									>
										Bid: {formatQty(item.bidAmt)}
									</span>
								</Typography>
							</Box>
						</Box>
					);
				})}

				{filteredCommodities.length === 0 && (
					<Box
						sx={{ p: 3, textAlign: "center", color: "rgba(255,255,255,0.4)" }}
					>
						<Typography variant="caption">No commodities found</Typography>
					</Box>
				)}
			</Box>
		</Paper>
	);
};
