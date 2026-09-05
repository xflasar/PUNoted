import React, { useState, useMemo, useEffect } from "react";
import {
	Box,
	Grid,
	Typography,
	TextField,
	InputAdornment,
	Chip,
	IconButton,
	Collapse,
	TablePagination,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

import { FlexCard } from "./sharedui";
import { Transaction } from "../types/finances";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";

interface MarketExposureTabProps {
	transactions?: Transaction[];
	currentData?: any;
	currency?: string;
	onSelectTx: (tx: Transaction) => void;
}

interface GroupedLedgerRow {
	id: string;
	latestTimestamp: string;
	partnerCode: string;
	category: string;
	totalAmount: number;
	items: Transaction[];
}

export const MarketExposureTab: React.FC<MarketExposureTabProps> = ({
	transactions,
	currentData,
	currency = "",
	onSelectTx,
}) => {
	const isMobile = useMediaQuery("(max-width:670px)");

	const [searchTerm, setSearchTerm] = useState("");
	const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(
		new Set(),
	);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [isAutoRows, setIsAutoRows] = useState(true);

	const containerRef = React.useRef<HTMLDivElement>(null);

	const activeTransactions = useMemo(() => {
		if (Array.isArray(transactions) && transactions.length > 0)
			return transactions;
		if (currentData?.Transactions && Array.isArray(currentData.Transactions))
			return currentData.Transactions;
		return [];
	}, [transactions, currentData]);

	const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("ALL");

	// Reset pagination on filter change
	useEffect(() => {
		setPage(0);
	}, [selectedCategoryTab, searchTerm]);

	// Auto calculate rows per page based on container height (mobile card vs desktop table row height)
	useEffect(() => {
		if (!isAutoRows || !containerRef.current) return;
		const el = containerRef.current;

		const updateRows = () => {
			const height = el.clientHeight;
			if (height <= 0) return;

			// Mobile card height ~92px with gap, Desktop table row height ~36px + 30px header
			const itemHeight = isMobile ? 92 : 36;
			const headerHeight = isMobile ? 0 : 30;
			const calculated = Math.max(
				3,
				Math.floor((height - headerHeight) / itemHeight),
			);

			setRowsPerPage((prev) => (prev !== calculated ? calculated : prev));
		};

		updateRows();
		const observer = new ResizeObserver(updateRows);
		observer.observe(el);
		return () => observer.disconnect();
	}, [isAutoRows, isMobile]);

	// Normalize raw transaction type into unified category buckets
	const getNormalizedCategory = (
		type: string = "",
		partnerCode: string = "",
	) => {
		const upper = type.toUpperCase();
		const pUpper = partnerCode.toUpperCase();

		if (
			upper.includes("LIQUIDATED") ||
			upper.includes("UNKNOWN") ||
			upper.includes("???") ||
			pUpper.includes("UNKNOWN") ||
			pUpper.includes("???")
		) {
			return "LIQUIDATED / UNKNOWN";
		}
		if (upper.includes("CORP_CX") || upper.includes("CORP_MARKET"))
			return "CORP CX";
		if (
			upper.includes("CORP_CONTRACT") ||
			upper.includes("CORP_EARNING") ||
			upper.includes("CORP_EXPENSE")
		)
			return "CORP CONTRACT";
		if (upper.includes("CX") || upper.includes("MARKET")) return "CX";
		if (upper.includes("CONTRACT")) return "CONTRACT";
		return "OTHER";
	};

	// Group transactions by Partner + Normalized Category
	const groupedLedger = useMemo(() => {
		const groupsMap = new Map<string, GroupedLedgerRow>();

		activeTransactions.forEach((tx) => {
			const partnerCode = tx.PartnerCode || "SYSTEM";
			const category = getNormalizedCategory(tx.Type, partnerCode);
			const groupKey = `${partnerCode}_${category}`;

			if (!groupsMap.has(groupKey)) {
				groupsMap.set(groupKey, {
					id: groupKey,
					latestTimestamp: tx.Timestamp,
					partnerCode,
					category,
					totalAmount: 0,
					items: [],
				});
			}

			const group = groupsMap.get(groupKey)!;
			group.totalAmount += tx.Amount;
			group.items.push(tx);

			if (new Date(tx.Timestamp) > new Date(group.latestTimestamp)) {
				group.latestTimestamp = tx.Timestamp;
			}
		});

		return Array.from(groupsMap.values()).sort(
			(a, b) =>
				new Date(b.latestTimestamp).getTime() -
				new Date(a.latestTimestamp).getTime(),
		);
	}, [activeTransactions]);

	// Filter by category tabs & search query
	const filteredGroups = useMemo(() => {
		return groupedLedger.filter((g) => {
			// Category tab filter
			if (selectedCategoryTab !== "ALL" && g.category !== selectedCategoryTab) {
				return false;
			}

			// Search term filter
			if (!searchTerm) return true;
			const query = searchTerm.toLowerCase();
			return (
				g.partnerCode.toLowerCase().includes(query) ||
				g.category.toLowerCase().includes(query) ||
				g.items.some(
					(i) =>
						i.PartnerName?.toLowerCase().includes(query) ||
						i.Description?.toLowerCase().includes(query),
				)
			);
		});
	}, [groupedLedger, selectedCategoryTab, searchTerm]);

	const paginatedGroups = useMemo(() => {
		return filteredGroups.slice(
			page * rowsPerPage,
			page * rowsPerPage + rowsPerPage,
		);
	}, [filteredGroups, page, rowsPerPage]);

	// Financial Exposure Summaries calculated dynamically from active category & search filter
	const summaryStats = useMemo(() => {
		let totalReceivables = 0; // Positive Inflows
		let totalPayables = 0; // Negative Outflows
		let cxMarketVolume = 0; // Exchange Trading
		let corpInternalVolume = 0; // Corporation Transfers

		filteredGroups.forEach((group) => {
			group.items.forEach((tx) => {
				if (tx.Amount > 0) totalReceivables += tx.Amount;
				else totalPayables += Math.abs(tx.Amount);

				const upperType = (tx.Type || "").toUpperCase();
				if (upperType.includes("CX") || upperType.includes("MARKET")) {
					cxMarketVolume += Math.abs(tx.Amount);
				} else if (
					upperType.includes("CORP") ||
					upperType.includes("TRANSFER")
				) {
					corpInternalVolume += Math.abs(tx.Amount);
				}
			});
		});

		const netExposure = totalReceivables - totalPayables;
		return {
			totalReceivables,
			totalPayables,
			netExposure,
			cxMarketVolume,
			corpInternalVolume,
		};
	}, [filteredGroups]);

	const categoryTabs = [
		"ALL",
		"CX",
		"CONTRACT",
		"CORP CX",
		"CORP CONTRACT",
		"LIQUIDATED / UNKNOWN",
		"OTHER",
	];

	const toggleGroupExpand = (groupId: string) => {
		setExpandedGroupIds((prev) => {
			const next = new Set(prev);
			if (next.has(groupId)) next.delete(groupId);
			else next.add(groupId);
			return next;
		});
	};

	const [isKpiCollapsed, setIsKpiCollapsed] = useState(false);

	return (
		<FlexCard
			sx={{
				height: "100%",
				minHeight: { xs: 520, sm: "auto" },
				p: { xs: 1, sm: 1.5 },
				display: "flex",
				flexDirection: "column",
				gap: 1.25,
			}}
		>
			{/* Top Metric Cards Bar (Collapsible) */}
			<Collapse in={!isKpiCollapsed} timeout="auto" unmountOnExit>
				<Box
					sx={{
						display: "flex",
						gap: 1,
						overflowX: "auto",
						pb: 0.5,
						"&::-webkit-scrollbar": { height: "3px" },
						"&::-webkit-scrollbar-thumb": {
							backgroundColor: "rgba(123, 104, 238, 0.4)",
							borderRadius: "4px",
						},
					}}
				>
					<Box
						sx={{
							flex: { xs: "0 0 160px", sm: 1 },
							p: 1,
							borderRadius: "8px",
							bgcolor: "rgba(0,0,0,0.45)",
							border: "1px solid rgba(74, 222, 128, 0.25)",
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
							}}
						>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.4)",
									fontSize: "0.6rem",
									fontWeight: 800,
									textTransform: "uppercase",
								}}
							>
								Total Receivables
							</Typography>
							<TrendingUpIcon
								sx={{ fontSize: 15, color: SEMANTIC_COLORS.neonGreen }}
							/>
						</Box>
						<Typography
							sx={{
								fontSize: { xs: "0.78rem", sm: "0.85rem" },
								fontFamily: "monospace",
								fontWeight: 800,
								color: SEMANTIC_COLORS.neonGreen,
								mt: 0.25,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							+{formatCurrency(summaryStats.totalReceivables)} {currency}
						</Typography>
					</Box>

					<Box
						sx={{
							flex: { xs: "0 0 160px", sm: 1 },
							p: 1,
							borderRadius: "8px",
							bgcolor: "rgba(0,0,0,0.45)",
							border: "1px solid rgba(248, 113, 113, 0.25)",
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
							}}
						>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.4)",
									fontSize: "0.6rem",
									fontWeight: 800,
									textTransform: "uppercase",
								}}
							>
								Total Payables
							</Typography>
							<TrendingDownIcon
								sx={{ fontSize: 15, color: SEMANTIC_COLORS.neonRed }}
							/>
						</Box>
						<Typography
							sx={{
								fontSize: { xs: "0.78rem", sm: "0.85rem" },
								fontFamily: "monospace",
								fontWeight: 800,
								color: SEMANTIC_COLORS.neonRed,
								mt: 0.25,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							-{formatCurrency(summaryStats.totalPayables)} {currency}
						</Typography>
					</Box>

					<Box
						sx={{
							flex: { xs: "0 0 160px", sm: 1 },
							p: 1,
							borderRadius: "8px",
							bgcolor: "rgba(0,0,0,0.45)",
							border: "1px solid rgba(123, 104, 238, 0.25)",
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
							}}
						>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.4)",
									fontSize: "0.6rem",
									fontWeight: 800,
									textTransform: "uppercase",
								}}
							>
								Net Exposure
							</Typography>
							<AccountBalanceWalletIcon
								sx={{ fontSize: 15, color: "#7b68ee" }}
							/>
						</Box>
						<Typography
							sx={{
								fontSize: { xs: "0.78rem", sm: "0.85rem" },
								fontFamily: "monospace",
								fontWeight: 800,
								color:
									summaryStats.netExposure >= 0
										? SEMANTIC_COLORS.neonGreen
										: SEMANTIC_COLORS.neonRed,
								mt: 0.25,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{summaryStats.netExposure >= 0 ? "+" : ""}
							{formatCurrency(summaryStats.netExposure)} {currency}
						</Typography>
					</Box>

					<Box
						sx={{
							flex: { xs: "0 0 180px", sm: 1 },
							p: 1,
							borderRadius: "8px",
							bgcolor: "rgba(0,0,0,0.45)",
							border: "1px solid rgba(59, 130, 246, 0.25)",
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
							}}
						>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.4)",
									fontSize: "0.6rem",
									fontWeight: 800,
									textTransform: "uppercase",
								}}
							>
								CX Market vs Corp
							</Typography>
							<CompareArrowsIcon sx={{ fontSize: 15, color: "#3b82f6" }} />
						</Box>
						<Typography
							sx={{
								fontSize: { xs: "0.72rem", sm: "0.78rem" },
								fontFamily: "monospace",
								fontWeight: 800,
								color: "white",
								mt: 0.25,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{formatCurrency(summaryStats.cxMarketVolume)} /{" "}
							{formatCurrency(summaryStats.corpInternalVolume)}
						</Typography>
					</Box>
				</Box>
			</Collapse>

			{/* Category Filter Tabs */}
			<Box
				sx={{
					pb: 0.75,
					borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
					display: "flex",
					alignItems: "center",
					gap: 0.5,
					overflowX: "auto",
					py: 0.25,
					maxWidth: "100%",
					"&::-webkit-scrollbar": { height: "2px" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: "rgba(255,255,255,0.15)",
					},
				}}
			>
				<IconButton
					size="small"
					onClick={() => setIsKpiCollapsed(!isKpiCollapsed)}
					sx={{
						p: 0.3,
						bgcolor: "rgba(123, 104, 238, 0.15)",
						color: "#7b68ee",
						border: "1px solid rgba(123, 104, 238, 0.3)",
						flexShrink: 0,
						"&:hover": { bgcolor: "rgba(123, 104, 238, 0.25)" },
					}}
				>
					{isKpiCollapsed ? (
						<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
					) : (
						<KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
					)}
				</IconButton>
				{categoryTabs.map((tab) => {
					const isSelected = selectedCategoryTab === tab;
					return (
						<Chip
							key={tab}
							label={tab}
							onClick={() => setSelectedCategoryTab(tab)}
							size="small"
							sx={{
								height: 22,
								fontSize: "0.64rem",
								fontWeight: 800,
								cursor: "pointer",
								flexShrink: 0,
								bgcolor: isSelected ? "#7b68ee" : "rgba(255,255,255,0.05)",
								color: isSelected ? "white" : "rgba(255,255,255,0.6)",
								border: `1px solid ${isSelected ? "#7b68ee" : "rgba(255,255,255,0.1)"}`,
								"&:hover": {
									bgcolor: isSelected ? "#7b68ee" : "rgba(255,255,255,0.12)",
								},
							}}
						/>
					);
				})}
			</Box>

			{/* Search Bar (Dedicated Row) */}
			<Box sx={{ width: "100%" }}>
				<TextField
					size="small"
					placeholder="Search counterparty / category..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					sx={{
						width: "100%",
						"& .MuiOutlinedInput-root": {
							bgcolor: "rgba(0, 0, 0, 0.5)",
							borderRadius: "6px",
							color: "white",
							fontSize: "0.74rem",
							py: 0,
							"& fieldset": { borderColor: "rgba(123, 104, 238, 0.3)" },
							"&:hover fieldset": { borderColor: "rgba(123, 104, 238, 0.7)" },
						},
						"& .MuiInputBase-input": { py: 0.3, px: 1 },
					}}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon
										sx={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}
									/>
								</InputAdornment>
							),
						},
					}}
				/>
			</Box>

			{/* Main Interactable Grouped Ledger Table / Mobile Cards */}
			<Box
				ref={containerRef}
				sx={{
					flex: 1,
					overflowY: "auto",
					overflowX: isMobile ? "hidden" : "auto",
					mt: 0.5,
					pr: 0.5,
					"&::-webkit-scrollbar": { width: "4px", height: "4px" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: "rgba(255,255,255,0.1)",
						borderRadius: "4px",
					},
				}}
			>
				{filteredGroups.length > 0 ? (
					isMobile ? (
						/* Custom Row Cards for Mobile Viewport */
						<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
							{paginatedGroups.map((group) => {
								const isExpanded = expandedGroupIds.has(group.id);
								const isMulti = group.items.length > 1;

								return (
									<Box
										key={group.id}
										sx={{
											p: 1.25,
											borderRadius: "8px",
											bgcolor: isExpanded
												? "rgba(123, 104, 238, 0.12)"
												: "rgba(0, 0, 0, 0.4)",
											border: `1px solid ${isExpanded ? "rgba(123, 104, 238, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
											transition: "all 0.15s ease-in-out",
										}}
									>
										{/* Card Content - 3 Distinct Rows */}
										<Box
											onClick={() => {
												if (isMulti) {
													toggleGroupExpand(group.id);
												} else if (onSelectTx && group.items[0]) {
													onSelectTx(group.items[0]);
												}
											}}
											sx={{
												cursor: "pointer",
												display: "flex",
												flexDirection: "column",
												gap: 0.75,
											}}
										>
											{/* Row 1: Party Name (left) & Type / Category (right) */}
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
													gap: 1,
												}}
											>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.5,
														minWidth: 0,
													}}
												>
													{isMulti && (
														<IconButton
															size="small"
															sx={{ p: 0, color: "rgba(255,255,255,0.6)" }}
														>
															{isExpanded ? (
																<KeyboardArrowUpIcon fontSize="small" />
															) : (
																<KeyboardArrowDownIcon fontSize="small" />
															)}
														</IconButton>
													)}
													<Typography
														sx={{
															fontSize: "0.9rem",
															fontWeight: 800,
															color: "white",
														}}
													>
														{group.partnerCode}
													</Typography>
												</Box>

												<Chip
													label={group.category.replace("_", " ")}
													size="small"
													sx={{
														height: 18,
														fontSize: "0.58rem",
														fontWeight: 800,
														bgcolor: "rgba(123, 104, 238, 0.18)",
														color: "#7b68ee",
														flexShrink: 0,
													}}
												/>
											</Box>

											{/* Row 2: Net Exposure Amount */}
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
													gap: 1,
												}}
											>
												<Typography
													variant="caption"
													sx={{
														color: "rgba(255,255,255,0.4)",
														fontSize: "0.62rem",
														fontWeight: 700,
														textTransform: "uppercase",
														flexShrink: 0,
													}}
												>
													Net Exposure
												</Typography>
												<Typography
													sx={{
														fontSize: "0.95rem",
														fontFamily: "monospace",
														fontWeight: 800,
														color:
															group.totalAmount >= 0
																? SEMANTIC_COLORS.neonGreen
																: SEMANTIC_COLORS.neonRed,
														whiteSpace: "nowrap",
													}}
												>
													{group.totalAmount > 0 ? "+" : ""}
													{formatCurrency(group.totalAmount)} {currency}
												</Typography>
											</Box>

											{/* Row 3: Activity Summary & Latest Date */}
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
													pt: 0.5,
													borderTop: "1px dashed rgba(255, 255, 255, 0.07)",
												}}
											>
												<Typography
													sx={{
														fontSize: "0.72rem",
														color: "rgba(255,255,255,0.6)",
														overflow: "hidden",
														textOverflow: "ellipsis",
														whiteSpace: "nowrap",
													}}
												>
													{isMulti
														? `${group.items.length} Transactions`
														: group.items[0]?.PartnerName ||
															"Direct Transaction"}
												</Typography>
												<Typography
													sx={{
														fontSize: "0.68rem",
														color: "rgba(255,255,255,0.4)",
													}}
												>
													Latest:{" "}
													{new Date(group.latestTimestamp).toLocaleDateString()}
												</Typography>
											</Box>
										</Box>

										{/* Expanded Sub-transactions for Mobile */}
										{isMulti && isExpanded && (
											<Collapse in={isExpanded} timeout="auto" unmountOnExit>
												<Box
													sx={{
														mt: 1,
														pt: 1,
														borderTop: "1px solid rgba(123, 104, 238, 0.2)",
														display: "flex",
														flexDirection: "column",
														gap: 0.75,
													}}
												>
													{group.items.map((subTx, idx) => (
														<Box
															key={`${subTx.Id}_${idx}`}
															onClick={() => onSelectTx && onSelectTx(subTx)}
															sx={{
																p: 1,
																borderRadius: "6px",
																bgcolor: "rgba(0,0,0,0.35)",
																border: "1px solid rgba(255,255,255,0.04)",
																display: "flex",
																flexDirection: "column",
																gap: 0.5,
																cursor: "pointer",
																"&:hover": {
																	bgcolor: "rgba(123, 104, 238, 0.15)",
																},
															}}
														>
															{/* Top Line: Tx ID (left) & Amount (right) */}
															<Box
																sx={{
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "space-between",
																	gap: 1,
																}}
															>
																<Typography
																	sx={{
																		fontSize: "0.72rem",
																		fontFamily: "monospace",
																		color: "#7b68ee",
																		fontWeight: 800,
																	}}
																>
																	#{subTx.Id.substring(0, 10)}
																</Typography>
																<Typography
																	sx={{
																		fontSize: "0.78rem",
																		fontFamily: "monospace",
																		fontWeight: 800,
																		color:
																			subTx.Amount >= 0
																				? SEMANTIC_COLORS.neonGreen
																				: SEMANTIC_COLORS.neonRed,
																		whiteSpace: "nowrap",
																	}}
																>
																	{subTx.Amount > 0 ? "+" : ""}
																	{formatCurrency(subTx.Amount)} {currency}
																</Typography>
															</Box>

															{/* Bottom Line: Description (left) & Date (right) */}
															<Box
																sx={{
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "space-between",
																	gap: 1,
																}}
															>
																<Typography
																	sx={{
																		fontSize: "0.7rem",
																		color: "rgba(255,255,255,0.7)",
																		overflow: "hidden",
																		textOverflow: "ellipsis",
																		whiteSpace: "nowrap",
																	}}
																>
																	{subTx.PartnerName ||
																		subTx.Description ||
																		"Direct Execution"}
																</Typography>
																<Typography
																	sx={{
																		fontSize: "0.64rem",
																		color: "rgba(255,255,255,0.45)",
																		flexShrink: 0,
																	}}
																>
																	{new Date(subTx.Timestamp).toLocaleString(
																		undefined,
																		{
																			month: "numeric",
																			day: "numeric",
																			year: "2-digit",
																			hour: "2-digit",
																			minute: "2-digit",
																		},
																	)}
																</Typography>
															</Box>
														</Box>
													))}
												</Box>
											</Collapse>
										)}
									</Box>
								);
							})}
						</Box>
					) : (
						/* Desktop Table View */
						<Box
							component="table"
							sx={{
								width: "100%",
								borderCollapse: "collapse",
								textAlign: "left",
								tableLayout: "fixed",
							}}
						>
							<Box component="thead">
								<Box
									component="tr"
									sx={{
										color: "rgba(255,255,255,0.4)",
										fontSize: "0.62rem",
										textTransform: "uppercase",
										borderBottom: "1px solid rgba(255,255,255,0.06)",
										backgroundColor: "rgba(4,4,10,0.8)",
									}}
								>
									<Box
										component="th"
										sx={{ padding: "6px 8px", width: "32px" }}
									></Box>
									<Box
										component="th"
										sx={{ padding: "6px 8px", width: "130px" }}
									>
										Counterparty
									</Box>
									<Box
										component="th"
										sx={{ padding: "6px 8px", width: "130px" }}
									>
										Category
									</Box>
									<Box component="th" sx={{ padding: "6px 8px" }}>
										Activity Summary
									</Box>
									<Box
										component="th"
										sx={{
											padding: "6px 8px",
											textAlign: "right",
											width: "180px",
										}}
									>
										Net Exposure
									</Box>
								</Box>
							</Box>
							<Box component="tbody">
								{paginatedGroups.map((group) => {
									const isExpanded = expandedGroupIds.has(group.id);
									const isMulti = group.items.length > 1;

									return (
										<React.Fragment key={group.id}>
											{/* Parent Group Row */}
											<Box
												component="tr"
												onClick={() => {
													if (isMulti) {
														toggleGroupExpand(group.id);
													} else if (onSelectTx && group.items[0]) {
														onSelectTx(group.items[0]);
													}
												}}
												sx={{
													borderBottom: "1px solid rgba(255,255,255,0.04)",
													cursor: "pointer",
													backgroundColor: isExpanded
														? "rgba(123, 104, 238, 0.08)"
														: "transparent",
													transition: "background-color 0.15s",
													"&:hover": {
														backgroundColor: "rgba(123, 104, 238, 0.14)",
													},
												}}
											>
												<Box component="td" sx={{ padding: "6px 8px" }}>
													{isMulti ? (
														<IconButton
															size="small"
															sx={{ p: 0.2, color: "rgba(255,255,255,0.6)" }}
														>
															{isExpanded ? (
																<KeyboardArrowUpIcon fontSize="small" />
															) : (
																<KeyboardArrowDownIcon fontSize="small" />
															)}
														</IconButton>
													) : (
														<Box sx={{ width: 16 }} />
													)}
												</Box>
												<Box component="td" sx={{ padding: "6px 8px" }}>
													<Typography
														sx={{
															fontSize: "0.82rem",
															fontWeight: 800,
															color: "white",
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
														}}
													>
														{group.partnerCode}
													</Typography>
												</Box>
												<Box component="td" sx={{ padding: "6px 8px" }}>
													<Chip
														label={group.category.replace("_", " ")}
														size="small"
														sx={{
															height: 18,
															fontSize: "0.6rem",
															fontWeight: 800,
															bgcolor: "rgba(123, 104, 238, 0.15)",
															color: "#7b68ee",
														}}
													/>
												</Box>
												<Box component="td" sx={{ padding: "6px 8px" }}>
													<Typography
														sx={{
															fontSize: "0.74rem",
															color: "rgba(255,255,255,0.7)",
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
														}}
													>
														{isMulti
															? `${group.items.length} Transactions`
															: group.items[0]?.PartnerName ||
																"Direct Transaction"}
													</Typography>
												</Box>
												<Box
													component="td"
													sx={{
														padding: "6px 8px",
														textAlign: "right",
														fontFamily: "monospace",
														fontSize: "0.82rem",
														fontWeight: 800,
														color:
															group.totalAmount >= 0
																? SEMANTIC_COLORS.neonGreen
																: SEMANTIC_COLORS.neonRed,
														whiteSpace: "nowrap",
													}}
												>
													{group.totalAmount > 0 ? "+" : ""}
													{formatCurrency(group.totalAmount)} {currency}
												</Box>
											</Box>

											{/* Expanded Sub-Transactions List */}
											{isMulti && isExpanded && (
												<Box component="tr">
													<Box component="td" colSpan={5} sx={{ padding: 0 }}>
														<Collapse
															in={isExpanded}
															timeout="auto"
															unmountOnExit
														>
															<Box
																sx={{
																	py: 1,
																	px: 1.5,
																	bgcolor: "rgba(0,0,0,0.35)",
																	borderBottom:
																		"1px solid rgba(123, 104, 238, 0.15)",
																}}
															>
																<Box
																	component="table"
																	sx={{
																		width: "100%",
																		borderCollapse: "collapse",
																		tableLayout: "fixed",
																	}}
																>
																	<Box component="thead">
																		<Box
																			component="tr"
																			sx={{
																				color: "rgba(255,255,255,0.4)",
																				fontSize: "0.58rem",
																				textTransform: "uppercase",
																			}}
																		>
																			<Box
																				component="th"
																				sx={{
																					padding: "4px 8px",
																					width: "120px",
																				}}
																			>
																				Timestamp
																			</Box>
																			<Box
																				component="th"
																				sx={{
																					padding: "4px 8px",
																					width: "90px",
																				}}
																			>
																				Tx ID
																			</Box>
																			<Box
																				component="th"
																				sx={{ padding: "4px 8px" }}
																			>
																				Partner / Description
																			</Box>
																			<Box
																				component="th"
																				sx={{
																					padding: "4px 8px",
																					textAlign: "right",
																					width: "110px",
																				}}
																			>
																				Amount
																			</Box>
																		</Box>
																	</Box>
																	<Box component="tbody">
																		{group.items.map((subTx, idx) => (
																			<Box
																				component="tr"
																				key={`${subTx.Id}_${idx}`}
																				onClick={() =>
																					onSelectTx && onSelectTx(subTx)
																				}
																				sx={{
																					borderBottom:
																						"1px solid rgba(255,255,255,0.03)",
																					cursor: "pointer",
																					"&:hover": {
																						backgroundColor:
																							"rgba(123, 104, 238, 0.1)",
																					},
																				}}
																			>
																				<Box
																					component="td"
																					sx={{
																						padding: "5px 8px",
																						fontFamily: "monospace",
																						fontSize: "0.72rem",
																						color: "rgba(255,255,255,0.7)",
																					}}
																				>
																					{new Date(
																						subTx.Timestamp,
																					).toLocaleString(undefined, {
																						year: "numeric",
																						month: "numeric",
																						day: "numeric",
																						hour: "2-digit",
																						minute: "2-digit",
																					})}
																				</Box>
																				<Box
																					component="td"
																					sx={{
																						padding: "5px 8px",
																						fontFamily: "monospace",
																						fontSize: "0.7rem",
																						color: "#7b68ee",
																					}}
																				>
																					#{subTx.Id.substring(0, 8)}
																				</Box>
																				<Box
																					component="td"
																					sx={{
																						padding: "5px 8px",
																						fontSize: "0.74rem",
																						color: "rgba(255,255,255,0.85)",
																					}}
																				>
																					{subTx.PartnerName ||
																						subTx.Description ||
																						"Execution"}
																				</Box>
																				<Box
																					component="td"
																					sx={{
																						padding: "5px 8px",
																						textAlign: "right",
																						fontFamily: "monospace",
																						fontSize: "0.76rem",
																						fontWeight: 800,
																						color:
																							subTx.Amount >= 0
																								? SEMANTIC_COLORS.neonGreen
																								: SEMANTIC_COLORS.neonRed,
																					}}
																				>
																					{subTx.Amount > 0 ? "+" : ""}
																					{formatCurrency(subTx.Amount)}{" "}
																					{currency}
																				</Box>
																			</Box>
																		))}
																	</Box>
																</Box>
															</Box>
														</Collapse>
													</Box>
												</Box>
											)}
										</React.Fragment>
									);
								})}
							</Box>
						</Box>
					)
				) : (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
							color: "rgba(255,255,255,0.4)",
							fontSize: "0.82rem",
						}}
					>
						No market exposure or counterparty ledger transactions match your
						criteria
					</Box>
				)}
			</Box>

			{/* Pagination Footer */}
			<TablePagination
				component="div"
				count={filteredGroups.length}
				page={page}
				onPageChange={(_, newPage) => setPage(newPage)}
				rowsPerPage={rowsPerPage}
				onRowsPerPageChange={(e) => {
					setRowsPerPage(parseInt(e.target.value, 10));
					setPage(0);
					setIsAutoRows(false);
				}}
				rowsPerPageOptions={Array.from(
					new Set([rowsPerPage, 5, 10, 15, 25, 50]),
				).sort((a, b) => a - b)}
				sx={{
					color: "rgba(255,255,255,0.7)",
					borderTop: "1px solid rgba(255,255,255,0.08)",
					".MuiTablePagination-select": { color: "white", fontSize: "0.75rem" },
					".MuiTablePagination-selectIcon": { color: "rgba(255,255,255,0.6)" },
					".MuiTablePagination-displayedRows": { fontSize: "0.75rem" },
					".MuiTablePagination-actions": { color: "#7b68ee" },
				}}
			/>
		</FlexCard>
	);
};
