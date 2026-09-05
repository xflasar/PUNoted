import React, { useState, useMemo } from "react";
import {
	Box,
	Paper,
	Typography,
	TextField,
	InputAdornment,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel,
	TablePagination,
	Chip,
	Button,
	Tooltip,
	Stack,
	IconButton,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { Search, Eye } from "lucide-react";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import MaterialBadge from "../cosm/components/materialbadge";
import { useGlobalData } from "../context/globaldatacontext";

interface MarketListProps {
	marketData: Record<string, any>[];
	onSelectTicker: (ticker: string, exchange: string) => void;
}

const EXCHANGES = ["IC1", "AI1", "CI1", "CI2", "NC1", "NC2"];

type SortField = "ticker" | "price" | "mmBuy" | "mmSell" | "avg7d" | "avg30d";
type SortOrder = "asc" | "desc";

const formatCurrency = (val: any) => {
	if (val === undefined || val === null || val === "" || val === 0) return "-";
	const num = Number(val);
	if (isNaN(num) || num === 0) return "-";
	return num >= 1000
		? num.toLocaleString(undefined, { maximumFractionDigits: 2 })
		: num.toFixed(2);
};

const getExVal = (r: Record<string, any>, ex: string, field: string) => {
	const targetEx = !ex || ex === "ALL" ? "IC1" : ex;
	const exactKey = `${targetEx}-${field}`;
	if (r[exactKey] !== undefined && r[exactKey] !== null)
		return Number(r[exactKey]);
	const lower = exactKey.toLowerCase();
	for (const [k, v] of Object.entries(r)) {
		if (k.toLowerCase() === lower && v !== undefined && v !== null)
			return Number(v);
	}
	return 0;
};

export const MarketList: React.FC<MarketListProps> = React.memo(
	({ marketData, onSelectTicker }) => {
		const theme = useTheme();
		const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
		const globalData = useGlobalData();
		const materialMap = globalData?.materialData ?? {};

		const [searchQuery, setSearchQuery] = useState("");
		const [exactMatch, setExactMatch] = useState(false);
		const [selectedExFilter, setSelectedExFilter] = useState<string>("ALL");
		const [sortField, setSortField] = useState<SortField>("ticker");
		const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
		const [page, setPage] = useState(0);
		const [rowsPerPage, setRowsPerPage] = useState(25);

		const handleSort = (field: SortField) => {
			if (sortField === field) {
				setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
			} else {
				setSortField(field);
				setSortOrder("asc");
			}
		};

		const processedRows = useMemo(() => {
			return marketData.map((row) => {
				const ticker = (row.Ticker || row.ticker || "").toUpperCase();
				const matInfo = materialMap[ticker];
				const name = matInfo?.name || ticker;

				const activeEx = selectedExFilter === "ALL" ? "IC1" : selectedExFilter;
				const price =
					getExVal(row, activeEx, "Average") ||
					getExVal(row, activeEx, "AskPrice") ||
					getExVal(row, activeEx, "BidPrice");
				const avg7d = getExVal(row, activeEx, "7dAvg");
				const avg30d = getExVal(row, activeEx, "30dAvg");
				const mmBuy = Number(row["MMBuy"] || row["mmBuy"] || 0);
				const mmSell = Number(row["MMSell"] || row["mmSell"] || 0);

				return {
					raw: row,
					ticker,
					name,
					category: matInfo?.category || "Other",
					price,
					avg7d,
					avg30d,
					mmBuy,
					mmSell,
				};
			});
		}, [marketData, materialMap, selectedExFilter]);

		const filteredRows = useMemo(() => {
			let list = processedRows;
			if (searchQuery.trim()) {
				const terms = searchQuery
					.split(",")
					.map((t) => t.trim().toLowerCase())
					.filter(Boolean);

				if (terms.length > 0) {
					list = list.filter((r) => {
						const tLower = r.ticker.toLowerCase();
						const nLower = r.name.toLowerCase();
						const cLower = r.category.toLowerCase();

						return terms.some((term) => {
							if (exactMatch) {
								return tLower === term || nLower === term;
							}
							return (
								tLower.includes(term) ||
								nLower.includes(term) ||
								cLower.includes(term)
							);
						});
					});
				}
			}
			list.sort((a, b) => {
				let valA = a[sortField];
				let valB = b[sortField];

				if (typeof valA === "string") {
					const cmp = (valA as string).localeCompare(valB as string);
					return sortOrder === "asc" ? cmp : -cmp;
				}
				const diff = (valA as number) - (valB as number);
				return sortOrder === "asc" ? diff : -diff;
			});

			return list;
		}, [processedRows, searchQuery, exactMatch, sortField, sortOrder]);

		const paginatedRows = useMemo(() => {
			return filteredRows.slice(
				page * rowsPerPage,
				page * rowsPerPage + rowsPerPage,
			);
		}, [filteredRows, page, rowsPerPage]);

		return (
			<Paper
				elevation={3}
				sx={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					background: "rgba(10, 10, 24, 0.75)",
					border: "1px solid rgba(123, 104, 238, 0.3)",
					boxShadow:
						"0 0 35px rgba(123, 104, 238, 0.15), inset 0 0 20px rgba(123, 104, 238, 0.05)",
					backdropFilter: "blur(20px)",
					borderRadius: "16px",
					overflow: "hidden",
				}}
			>
				{/* Controls Header */}
				<Box
					sx={{
						p: 2.5,
						borderBottom: "1px solid rgba(123, 104, 238, 0.2)",
						display: "flex",
						flexDirection: { xs: "column", md: "row" },
						alignItems: { xs: "stretch", md: "center" },
						justifyContent: "space-between",
						gap: 2,
						bgcolor: "rgba(6, 6, 16, 0.5)",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
						<TextField
							placeholder={
								exactMatch
									? "Exact search (e.g. WR, W, MCG)..."
									: "Search (e.g. WR, W, MCG)..."
							}
							size="small"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start">
											<Search size={18} style={{ color: "#7B68EE" }} />
										</InputAdornment>
									),
									endAdornment: (
										<InputAdornment position="end">
											<Tooltip
												title={
													exactMatch ? "Exact Match: ON" : "Exact Match: OFF"
												}
											>
												<IconButton
													size="small"
													onClick={() => setExactMatch((prev) => !prev)}
													sx={{
														color: exactMatch
															? "#7B68EE"
															: "rgba(255, 255, 255, 0.4)",
														bgcolor: exactMatch
															? "rgba(123, 104, 238, 0.2)"
															: "transparent",
														p: 0.25,
														borderRadius: "4px",
														"&:hover": {
															bgcolor: exactMatch
																? "rgba(123, 104, 238, 0.3)"
																: "rgba(255, 255, 255, 0.1)",
														},
													}}
												>
													<CenterFocusStrongIcon sx={{ fontSize: 18 }} />
												</IconButton>
											</Tooltip>
										</InputAdornment>
									),
								},
							}}
							sx={{
								width: { xs: "100%", sm: 340 },
								"& .MuiOutlinedInput-root": {
									bgcolor: "rgba(0, 0, 0, 0.4)",
									borderRadius: "10px",
									color: "white",
									fontSize: "0.85rem",
									"& fieldset": { borderColor: "rgba(123, 104, 238, 0.3)" },
									"&:hover fieldset": {
										borderColor: "rgba(123, 104, 238, 0.6)",
									},
									"&.Mui-focused fieldset": { borderColor: "#7B68EE" },
								},
							}}
						/>
						<Typography
							variant="body2"
							sx={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.8rem" }}
						>
							Showing <strong>{filteredRows.length}</strong> commodities
						</Typography>
					</Box>

					{/* Exchange Filters */}
					<Stack
						direction="row"
						spacing={1}
						sx={{ overflowX: "auto", pb: { xs: 1, md: 0 } }}
					>
						<Chip
							label="ALL EXCHANGES"
							clickable
							onClick={() => setSelectedExFilter("ALL")}
							sx={{
								bgcolor:
									selectedExFilter === "ALL"
										? "#7B68EE"
										: "rgba(255, 255, 255, 0.05)",
								color: "white",
								fontWeight: 700,
								fontSize: "0.75rem",
								border: "1px solid rgba(123, 104, 238, 0.3)",
								"&:hover": {
									bgcolor:
										selectedExFilter === "ALL"
											? "#6a5acd"
											: "rgba(123, 104, 238, 0.2)",
								},
							}}
						/>
						{EXCHANGES.map((ex) => (
							<Chip
								key={ex}
								label={ex}
								clickable
								onClick={() => setSelectedExFilter(ex)}
								sx={{
									bgcolor:
										selectedExFilter === ex
											? "#7B68EE"
											: "rgba(255, 255, 255, 0.05)",
									color: "white",
									fontWeight: 700,
									fontSize: "0.75rem",
									border: "1px solid rgba(123, 104, 238, 0.3)",
									"&:hover": {
										bgcolor:
											selectedExFilter === ex
												? "#6a5acd"
												: "rgba(123, 104, 238, 0.2)",
									},
								}}
							/>
						))}
					</Stack>
				</Box>

				{/* Market View: Mobile Cards vs Desktop Table */}
				{isMobile ? (
					<Box
						sx={{
							p: 1.5,
							display: "flex",
							flexDirection: "column",
							gap: 1.5,
							overflowY: "auto",
							flex: 1,
							"&::-webkit-scrollbar": { width: "4px" },
							"&::-webkit-scrollbar-thumb": {
								backgroundColor: "rgba(123, 104, 238, 0.4)",
								borderRadius: "2px",
							},
						}}
					>
						{paginatedRows.map((row) => {
							const r = row.raw;
							const askPx = getExVal(r, selectedExFilter, "AskPrice");
							const bidPx = getExVal(r, selectedExFilter, "BidPrice");
							const askAmt =
								getExVal(r, selectedExFilter, "AskAmt") ||
								getExVal(r, selectedExFilter, "AskAvail");
							const bidAmt =
								getExVal(r, selectedExFilter, "BidAmt") ||
								getExVal(r, selectedExFilter, "BidAvail");

							return (
								<Box
									key={row.ticker}
									onClick={() =>
										onSelectTicker(
											row.ticker,
											selectedExFilter === "ALL" ? "IC1" : selectedExFilter,
										)
									}
									sx={{
										bgcolor: "rgba(16, 16, 32, 0.75)",
										border: "1px solid rgba(123, 104, 238, 0.3)",
										borderRadius: "12px",
										p: 1.5,
										display: "flex",
										flexDirection: "column",
										gap: 1.25,
										cursor: "pointer",
										transition: "all 0.15s ease",
										"&:hover": {
											borderColor: "#7B68EE",
											bgcolor: "rgba(123, 104, 238, 0.15)",
										},
									}}
								>
									{/* Card Header */}
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
										}}
									>
										<MaterialBadge ticker={row.ticker} />
										<Button
											size="small"
											variant="outlined"
											startIcon={<Eye size={12} />}
											onClick={(e) => {
												e.stopPropagation();
												onSelectTicker(
													row.ticker,
													selectedExFilter === "ALL" ? "IC1" : selectedExFilter,
												);
											}}
											sx={{
												color: "#7B68EE",
												borderColor: "rgba(123, 104, 238, 0.4)",
												fontSize: "0.7rem",
												py: 0.25,
												px: 1,
												borderRadius: "6px",
											}}
										>
											View
										</Button>
									</Box>

									{/* Stats Grid */}
									<Box
										sx={{
											display: "grid",
											gridTemplateColumns: "1fr 1fr",
											gap: 1,
											pt: 0.5,
											borderTop: "1px solid rgba(255,255,255,0.06)",
										}}
									>
										<Box>
											<Typography
												variant="caption"
												sx={{
													color: "rgba(255,255,255,0.5)",
													fontSize: "0.65rem",
													display: "block",
												}}
											>
												{selectedExFilter === "ALL"
													? "IC1 Live"
													: `${selectedExFilter} Live`}
											</Typography>
											<Typography
												variant="body2"
												sx={{ fontWeight: 800, color: "#7B68EE" }}
											>
												{formatCurrency(row.price)}
											</Typography>
										</Box>

										<Box>
											<Typography
												variant="caption"
												sx={{
													color: "rgba(255,255,255,0.5)",
													fontSize: "0.65rem",
													display: "block",
												}}
											>
												7D / 30D Avg
											</Typography>
											<Typography
												variant="body2"
												sx={{ fontWeight: 600, color: "white" }}
											>
												{formatCurrency(row.avg7d)} /{" "}
												{formatCurrency(row.avg30d)}
											</Typography>
										</Box>

										<Box>
											<Typography
												variant="caption"
												sx={{
													color: "#FF5252",
													fontSize: "0.65rem",
													display: "block",
												}}
											>
												Ask
											</Typography>
											<Typography
												variant="body2"
												sx={{
													fontWeight: 700,
													color:
														askPx > 0 ? "#FF5252" : "rgba(255,255,255,0.3)",
												}}
											>
												{askPx > 0
													? `${formatCurrency(askPx)}${askAmt > 0 ? ` (${askAmt})` : ""}`
													: "-"}
											</Typography>
										</Box>

										<Box>
											<Typography
												variant="caption"
												sx={{
													color: "#4CAF50",
													fontSize: "0.65rem",
													display: "block",
												}}
											>
												Bid
											</Typography>
											<Typography
												variant="body2"
												sx={{
													fontWeight: 700,
													color:
														bidPx > 0 ? "#4CAF50" : "rgba(255,255,255,0.3)",
												}}
											>
												{bidPx > 0
													? `${formatCurrency(bidPx)}${bidAmt > 0 ? ` (${bidAmt})` : ""}`
													: "-"}
											</Typography>
										</Box>
									</Box>

									{/* All Exchanges Row */}
									{selectedExFilter === "ALL" && (
										<Box
											sx={{
												display: "flex",
												gap: 0.5,
												flexWrap: "wrap",
												pt: 0.5,
												borderTop: "1px dashed rgba(255,255,255,0.06)",
											}}
										>
											{EXCHANGES.map((ex) => {
												const exPx =
													getExVal(r, ex, "Average") ||
													getExVal(r, ex, "AskPrice") ||
													getExVal(r, ex, "BidPrice");
												return (
													<Chip
														key={ex}
														label={`${ex}: ${formatCurrency(exPx)}`}
														size="small"
														sx={{
															height: 20,
															fontSize: "0.65rem",
															bgcolor:
																exPx > 0
																	? "rgba(123, 104, 238, 0.15)"
																	: "rgba(255,255,255,0.04)",
															color:
																exPx > 0 ? "white" : "rgba(255,255,255,0.3)",
															border: "1px solid rgba(123, 104, 238, 0.2)",
														}}
													/>
												);
											})}
										</Box>
									)}
								</Box>
							);
						})}
					</Box>
				) : (
					<TableContainer
						sx={{
							flex: 1,
							maxHeight: "100%",
							overflowY: "auto",
							"&::-webkit-scrollbar": { width: "6px" },
							"&::-webkit-scrollbar-track": { background: "rgba(0,0,0,0.2)" },
							"&::-webkit-scrollbar-thumb": {
								backgroundColor: "rgba(123, 104, 238, 0.4)",
								borderRadius: "3px",
							},
						}}
					>
						<Table stickyHeader size="small">
							<TableHead>
								<TableRow
									sx={{
										"& th": {
											bgcolor: "#090918",
											color: "#7B68EE",
											fontWeight: 800,
											fontSize: "0.75rem",
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											borderBottom: "1px solid rgba(123, 104, 238, 0.3)",
											py: 1.5,
										},
									}}
								>
									<TableCell>
										<TableSortLabel
											active={sortField === "ticker"}
											direction={sortOrder}
											onClick={() => handleSort("ticker")}
											sx={{ color: "inherit !important" }}
										>
											Commodity
										</TableSortLabel>
									</TableCell>
									<TableCell align="right">
										<TableSortLabel
											active={sortField === "mmBuy"}
											direction={sortOrder}
											onClick={() => handleSort("mmBuy")}
											sx={{ color: "inherit !important" }}
										>
											MM Buy
										</TableSortLabel>
									</TableCell>
									<TableCell align="right">
										<TableSortLabel
											active={sortField === "mmSell"}
											direction={sortOrder}
											onClick={() => handleSort("mmSell")}
											sx={{ color: "inherit !important" }}
										>
											MM Sell
										</TableSortLabel>
									</TableCell>

									{selectedExFilter === "ALL" ? (
										EXCHANGES.map((ex) => (
											<TableCell key={ex} align="right">
												{ex} Avg
											</TableCell>
										))
									) : (
										<>
											<TableCell align="right">
												<TableSortLabel
													active={sortField === "price"}
													direction={sortOrder}
													onClick={() => handleSort("price")}
													sx={{ color: "inherit !important" }}
												>
													{selectedExFilter} Live
												</TableSortLabel>
											</TableCell>
											<TableCell align="right">
												<TableSortLabel
													active={sortField === "avg7d"}
													direction={sortOrder}
													onClick={() => handleSort("avg7d")}
													sx={{ color: "inherit !important" }}
												>
													7D Avg
												</TableSortLabel>
											</TableCell>
											<TableCell align="right">
												<TableSortLabel
													active={sortField === "avg30d"}
													direction={sortOrder}
													onClick={() => handleSort("avg30d")}
													sx={{ color: "inherit !important" }}
												>
													30D Avg
												</TableSortLabel>
											</TableCell>
											<TableCell align="right">
												{selectedExFilter} Ask / Bid
											</TableCell>
										</>
									)}

									<TableCell align="center">Terminal</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{paginatedRows.map((row) => {
									const r = row.raw;
									const askPx = getExVal(r, selectedExFilter, "AskPrice");
									const bidPx = getExVal(r, selectedExFilter, "BidPrice");
									const askAmt =
										getExVal(r, selectedExFilter, "AskAmt") ||
										getExVal(r, selectedExFilter, "AskAvail");
									const bidAmt =
										getExVal(r, selectedExFilter, "BidAmt") ||
										getExVal(r, selectedExFilter, "BidAvail");

									return (
										<TableRow
											key={row.ticker}
											hover
											onClick={() =>
												onSelectTicker(
													row.ticker,
													selectedExFilter === "ALL" ? "IC1" : selectedExFilter,
												)
											}
											sx={{
												cursor: "pointer",
												transition: "all 0.15s ease",
												"&:hover": {
													bgcolor: "rgba(123, 104, 238, 0.12) !important",
												},
												"& td": {
													borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
													color: "white",
													py: 1.25,
													fontSize: "0.85rem",
												},
											}}
										>
											{/* Material Badge ONLY */}
											<TableCell>
												<Box
													sx={{ display: "inline-flex", alignItems: "center" }}
												>
													<MaterialBadge ticker={row.ticker} />
												</Box>
											</TableCell>

											{/* MM Buy / MM Sell */}
											<TableCell align="right">
												<Typography
													variant="body2"
													sx={{
														color:
															row.mmBuy > 0
																? "#4CAF50"
																: "rgba(255,255,255,0.4)",
														fontWeight: 600,
													}}
												>
													{formatCurrency(row.mmBuy)}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography
													variant="body2"
													sx={{
														color:
															row.mmSell > 0
																? "#FF5252"
																: "rgba(255,255,255,0.4)",
														fontWeight: 600,
													}}
												>
													{formatCurrency(row.mmSell)}
												</Typography>
											</TableCell>

											{/* Exchange Columns */}
											{selectedExFilter === "ALL" ? (
												EXCHANGES.map((ex) => {
													const exPrice =
														getExVal(r, ex, "Average") ||
														getExVal(r, ex, "AskPrice") ||
														getExVal(r, ex, "BidPrice");
													return (
														<TableCell key={ex} align="right">
															<Typography
																variant="body2"
																sx={{
																	color:
																		exPrice > 0
																			? "#E0E0E0"
																			: "rgba(255,255,255,0.25)",
																	fontWeight: exPrice > 0 ? 600 : 400,
																}}
															>
																{formatCurrency(exPrice)}
															</Typography>
														</TableCell>
													);
												})
											) : (
												<>
													{/* Single Exchange Columns */}
													<TableCell align="right">
														<Typography
															variant="body2"
															sx={{ fontWeight: 800, color: "#7B68EE" }}
														>
															{formatCurrency(row.price)}
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography
															variant="body2"
															sx={{ color: "rgba(255,255,255,0.85)" }}
														>
															{formatCurrency(row.avg7d)}
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography
															variant="body2"
															sx={{ color: "rgba(255,255,255,0.85)" }}
														>
															{formatCurrency(row.avg30d)}
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Box
															sx={{
																display: "flex",
																flexDirection: "column",
																alignItems: "flex-end",
															}}
														>
															<Typography
																variant="caption"
																sx={{
																	color:
																		askPx > 0
																			? "#FF5252"
																			: "rgba(255,255,255,0.3)",
																	fontWeight: 700,
																}}
															>
																Ask:{" "}
																{askPx > 0
																	? `${formatCurrency(askPx)}${askAmt > 0 ? ` (${askAmt})` : ""}`
																	: "-"}
															</Typography>
															<Typography
																variant="caption"
																sx={{
																	color:
																		bidPx > 0
																			? "#4CAF50"
																			: "rgba(255,255,255,0.3)",
																	fontWeight: 700,
																}}
															>
																Bid:{" "}
																{bidPx > 0
																	? `${formatCurrency(bidPx)}${bidAmt > 0 ? ` (${bidAmt})` : ""}`
																	: "-"}
															</Typography>
														</Box>
													</TableCell>
												</>
											)}

											{/* Action Column */}
											<TableCell align="center">
												<Button
													size="small"
													variant="outlined"
													startIcon={<Eye size={14} />}
													onClick={(e) => {
														e.stopPropagation();
														onSelectTicker(
															row.ticker,
															selectedExFilter === "ALL"
																? "IC1"
																: selectedExFilter,
														);
													}}
													sx={{
														color: "#7B68EE",
														borderColor: "rgba(123, 104, 238, 0.4)",
														fontSize: "0.7rem",
														textTransform: "none",
														py: 0.25,
														px: 1,
														borderRadius: "6px",
														"&:hover": {
															borderColor: "#7B68EE",
															bgcolor: "rgba(123, 104, 238, 0.15)",
														},
													}}
												>
													View
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>
				)}

				<TablePagination
					rowsPerPageOptions={[25, 50, 100]}
					component="div"
					count={filteredRows.length}
					rowsPerPage={rowsPerPage}
					page={page}
					onPageChange={(_, newPage) => setPage(newPage)}
					onRowsPerPageChange={(e) => {
						setRowsPerPage(parseInt(e.target.value, 10));
						setPage(0);
					}}
					sx={{
						color: "white",
						borderTop: "1px solid rgba(123, 104, 238, 0.2)",
						"& .MuiTablePagination-selectIcon": { color: "white" },
						"& .MuiIconButton-root": { color: "white" },
					}}
				/>
			</Paper>
		);
	},
);
