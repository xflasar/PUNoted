import React, { useState, useMemo, useEffect, useRef } from "react";
import {
	Box,
	Typography,
	TextField,
	InputAdornment,
	Chip,
	ButtonGroup,
	Button,
	Collapse,
	IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
	ResponsiveContainer,
	ComposedChart,
	Area,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
} from "recharts";
import { FlexCard } from "./sharedui";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";
import { PartnerMetrics, Transaction } from "../types/finances";

interface CounterpartyTabProps {
	partners: PartnerMetrics[];
	transactions: Transaction[];
	currency: string;
	timeRange?: string;
	onSelectTx?: (tx: Transaction) => void;
}

interface GroupedContractTx {
	id: string;
	contractId: string;
	category: string;
	latestTimestamp: string;
	totalAmount: number;
	items: Transaction[];
}

export const CounterpartyTab: React.FC<CounterpartyTabProps> = ({
	partners,
	transactions,
	currency,
	timeRange = "30D",
	onSelectTx,
}) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCode, setSelectedCode] = useState<string | null>(
		partners[0]?.code || null,
	);
	const [timeframe, setTimeframe] = useState<string>(timeRange);
	const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(
		new Set(),
	);

	useEffect(() => {
		if (timeRange) setTimeframe(timeRange);
	}, [timeRange]);

	const timeframeLabel = useMemo(() => {
		switch (timeframe) {
			case "24H":
				return "Last 24 Hours";
			case "7D":
				return "Last 7 Days";
			case "14D":
				return "Last 14 Days";
			case "30D":
				return "Last 30 Days";
			case "6M":
				return "Last 6 Months";
			case "1Y":
				return "Last 1 Year";
			case "ALL":
			case "AllTime":
				return "All Time";
			default:
				return `Last ${timeframe}`;
		}
	}, [timeframe]);

	// Container width detection via continuous interval + window resize listener
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState<number>(0);

	useEffect(() => {
		const updateWidth = () => {
			if (containerRef.current) {
				const w =
					containerRef.current.getBoundingClientRect().width ||
					containerRef.current.clientWidth;
				if (w > 0) {
					setContainerWidth(w);
				}
			}
		};

		updateWidth();

		const interval = setInterval(updateWidth, 150);
		window.addEventListener("resize", updateWidth);

		return () => {
			clearInterval(interval);
			window.removeEventListener("resize", updateWidth);
		};
	}, []);

	const isWideEnough = containerWidth >= 750;

	// Filter partners by search query
	const filteredPartners = useMemo(() => {
		return partners.filter((p) => {
			if (!searchQuery) return true;
			const q = searchQuery.toLowerCase();
			return (
				p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
			);
		});
	}, [partners, searchQuery]);

	// Categorize partners into Timeline Groups (Always ALL TIME)
	const timelineGroupedPartners = useMemo(() => {
		const now = new Date();
		const todayStart = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
		).getTime();
		const sevenDaysAgo = now.getTime() - 7 * 86400000;
		const thirtyDaysAgo = now.getTime() - 30 * 86400000;

		const groups: {
			today: PartnerMetrics[];
			sevenDays: PartnerMetrics[];
			thirtyDays: PartnerMetrics[];
			older: PartnerMetrics[];
		} = {
			today: [],
			sevenDays: [],
			thirtyDays: [],
			older: [],
		};

		filteredPartners.forEach((p) => {
			const ts = p.lastTimestamp ? new Date(p.lastTimestamp).getTime() : 0;
			if (ts >= todayStart) {
				groups.today.push(p);
			} else if (ts >= sevenDaysAgo) {
				groups.sevenDays.push(p);
			} else if (ts >= thirtyDaysAgo) {
				groups.thirtyDays.push(p);
			} else {
				groups.older.push(p);
			}
		});

		return groups;
	}, [filteredPartners]);

	const selectedPartner = useMemo(() => {
		return partners.find((p) => p.code === selectedCode) || partners[0] || null;
	}, [partners, selectedCode]);

	// Filter partner transactions based on active Timeframe button / global timeRange
	const partnerTxs = useMemo(() => {
		if (!selectedPartner) return [];
		const raw = transactions.filter(
			(tx) => tx.PartnerCode === selectedPartner.code,
		);
		if (
			timeframe === "ALL" ||
			timeframe === "CUSTOM" ||
			timeframe === "AllTime"
		)
			return raw;

		const maxTxTime =
			raw.length > 0
				? Math.max(...raw.map((t) => new Date(t.Timestamp).getTime()))
				: Date.now();

		const daysMap: Record<string, number> = {
			"24H": 1,
			"7D": 7,
			"14D": 14,
			"30D": 30,
			"6M": 180,
			"1Y": 365,
		};
		const days = daysMap[timeframe] || 30;
		const cutoff = maxTxTime - days * 86400000;
		return raw.filter((tx) => new Date(tx.Timestamp).getTime() >= cutoff);
	}, [transactions, selectedPartner, timeframe]);

	// Group transactions ONLY if they share the exact same Contract ID
	const groupedPartnerTxs = useMemo(() => {
		const groups: GroupedContractTx[] = [];
		const contractMap = new Map<string, GroupedContractTx>();

		partnerTxs.forEach((tx) => {
			const isContract =
				Boolean(tx.ContractId) ||
				tx.Id.startsWith("CTR_") ||
				tx.Type.includes("CONTRACT");
			if (isContract) {
				const contractId = tx.ContractId || tx.Id.split("_")[1] || tx.Id;
				const existing = contractMap.get(contractId);
				if (existing) {
					existing.items.push(tx);
					existing.totalAmount += tx.Amount;
				} else {
					const newGroup: GroupedContractTx = {
						id: `ctr_group_${contractId}`,
						contractId,
						category: tx.Type,
						latestTimestamp: tx.Timestamp,
						totalAmount: tx.Amount,
						items: [tx],
					};
					contractMap.set(contractId, newGroup);
					groups.push(newGroup);
				}
			} else {
				groups.push({
					id: tx.Id,
					contractId: "",
					category: tx.Type,
					latestTimestamp: tx.Timestamp,
					totalAmount: tx.Amount,
					items: [tx],
				});
			}
		});

		return groups;
	}, [partnerTxs]);

	// Calculate selected partner summary stats
	const partnerStats = useMemo(() => {
		let grossIncome = 0;
		let grossExpense = 0;
		partnerTxs.forEach((tx) => {
			if (tx.Amount > 0) grossIncome += tx.Amount;
			else grossExpense += Math.abs(tx.Amount);
		});
		return { grossIncome, grossExpense, netFlow: grossIncome - grossExpense };
	}, [partnerTxs]);

	// Dynamic Dual-Y Axis Timeline Chart Points
	const partnerChartData = useMemo(() => {
		if (!partnerTxs.length) return [];
		const pointMap = new Map<
			string,
			{ date: string; Earnings: number; Expenses: number; ItemVolume: number }
		>();

		partnerTxs.forEach((tx) => {
			const dObj = new Date(tx.Timestamp);
			const label =
				timeframe === "7D"
					? `${dObj.getMonth() + 1}/${dObj.getDate()} ${dObj.getHours()}:00`
					: `${dObj.getMonth() + 1}/${dObj.getDate()}`;

			const existing = pointMap.get(label) || {
				date: label,
				Earnings: 0,
				Expenses: 0,
				ItemVolume: 0,
			};
			const abs = Math.abs(tx.Amount);
			existing.ItemVolume += tx.ItemQuantity || 1;
			if (tx.Amount > 0) existing.Earnings += tx.Amount;
			else existing.Expenses += abs;
			pointMap.set(label, existing);
		});

		return Array.from(pointMap.values()).reverse();
	}, [partnerTxs, timeframe]);

	const toggleGroupExpand = (groupId: string) => {
		setExpandedGroupIds((prev) => {
			const next = new Set(prev);
			if (next.has(groupId)) next.delete(groupId);
			else next.add(groupId);
			return next;
		});
	};

	const renderPartnerGroupTable = (
		title: string,
		groupPartners: PartnerMetrics[],
	) => {
		if (groupPartners.length === 0) return null;

		return (
			<Box key={title} sx={{ mb: 1.25 }}>
				<Box
					sx={{
						position: "sticky",
						top: 0,
						zIndex: 6,
						py: 0.4,
						px: 0.75,
						bgcolor: "#080814",
						borderLeft: "3px solid #7b68ee",
						mb: 0,
						boxShadow: "0 2px 6px rgba(0,0,0,0.8)",
					}}
				>
					<Typography
						sx={{
							fontSize: "0.68rem",
							fontWeight: 800,
							color: "#7b68ee",
							textTransform: "uppercase",
							letterSpacing: "0.06em",
						}}
					>
						{title} ({groupPartners.length})
					</Typography>
				</Box>

				<table
					style={{
						width: "100%",
						borderCollapse: "collapse",
						textAlign: "left",
						tableLayout: "fixed",
					}}
				>
					<thead
						style={{
							position: "sticky",
							top: "23px",
							zIndex: 5,
							backgroundColor: "#080814",
						}}
					>
						<tr
							style={{
								color: "rgba(255,255,255,0.4)",
								fontSize: "0.65rem",
								textTransform: "uppercase",
								borderBottom: "1px solid rgba(255,255,255,0.06)",
								backgroundColor: "#080814",
							}}
						>
							<th
								style={{
									padding: "4px 6px",
									width: "55px",
									position: "sticky",
									top: "23px",
									zIndex: 5,
									backgroundColor: "#080814",
								}}
							>
								Code
							</th>
							<th
								style={{
									padding: "4px 6px",
									position: "sticky",
									top: "23px",
									zIndex: 5,
									backgroundColor: "#080814",
								}}
							>
								Company Name
							</th>
							<th
								style={{
									padding: "4px 6px",
									textAlign: "right",
									width: "85px",
									position: "sticky",
									top: "23px",
									zIndex: 5,
									backgroundColor: "#080814",
								}}
							>
								Profit
							</th>
						</tr>
					</thead>
					<tbody>
						{groupPartners.map((partner) => {
							const isSelected = selectedPartner?.code === partner.code;

							return (
								<tr
									key={partner.code}
									onClick={() => setSelectedCode(partner.code)}
									style={{
										borderBottom: "1px solid rgba(255,255,255,0.03)",
										cursor: "pointer",
										backgroundColor: isSelected
											? "rgba(123, 104, 238, 0.18)"
											: "transparent",
										transition: "background-color 0.15s",
									}}
								>
									<td style={{ padding: "5px 6px", whiteSpace: "nowrap" }}>
										<Typography
											sx={{
												fontSize: "0.86rem",
												fontWeight: 800,
												color: isSelected ? "#7b68ee" : "white",
											}}
										>
											{partner.code}
										</Typography>
									</td>
									<td
										style={{
											padding: "5px 6px",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										<Typography
											sx={{
												fontSize: "0.83rem",
												color: "rgba(255,255,255,0.85)",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											{partner.name}
										</Typography>
									</td>
									<td
										style={{
											padding: "5px 6px",
											textAlign: "right",
											fontFamily: "monospace",
											fontSize: "0.83rem",
											fontWeight: 800,
											color:
												partner.net >= 0
													? SEMANTIC_COLORS.neonGreen
													: SEMANTIC_COLORS.neonRed,
											whiteSpace: "nowrap",
										}}
									>
										{partner.net > 0 ? "+" : ""}
										{formatCurrency(partner.net, 0)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</Box>
		);
	};

	return (
		<Box
			ref={containerRef}
			sx={{
				width: "100%",
				height: isWideEnough ? "100%" : "auto",
				minHeight: 0,
				overflowY: isWideEnough ? "hidden" : "auto",
			}}
		>
			<Box
				sx={{
					height: isWideEnough ? "100%" : "auto",
					display: "grid",
					gridTemplateColumns: isWideEnough
						? "minmax(270px, 360px) minmax(420px, 1fr)"
						: "1fr",
					gap: 1.25,
					minHeight: 0,
					pb: isWideEnough ? 0 : 2,
				}}
			>
				{/* Left Column: Partners Directory with Full Width Search Bar on New Line */}
				<FlexCard
					sx={{
						height: isWideEnough ? "100%" : "360px",
						maxHeight: isWideEnough ? "none" : "360px",
						p: 1.25,
						display: "flex",
						flexDirection: "column",
						minHeight: 0,
					}}
				>
					{/* Directory Header */}
					<Box
						sx={{
							pb: 0.75,
							borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography
							sx={{
								fontWeight: 800,
								fontSize: "0.92rem",
								textTransform: "uppercase",
								letterSpacing: "0.08em",
								color: "#7b68ee",
							}}
						>
							Partners ({filteredPartners.length})
						</Typography>
					</Box>

					{/* Full-width Search Input on New Line */}
					<Box sx={{ mt: 1, mb: 0.5 }}>
						<TextField
							fullWidth
							size="small"
							placeholder="Search party code or company name..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							sx={{
								"& .MuiOutlinedInput-root": {
									bgcolor: "rgba(0, 0, 0, 0.4)",
									borderRadius: "6px",
									color: "white",
									fontSize: "0.83rem",
									py: 0,
									"& fieldset": { borderColor: "rgba(123, 104, 238, 0.25)" },
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
												sx={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}
											/>
										</InputAdornment>
									),
								},
							}}
						/>
					</Box>

					<Box
						sx={{
							flex: 1,
							overflowY: "auto",
							mt: 0.5,
							pr: 0.5,
							"&::-webkit-scrollbar": { width: "4px" },
							"&::-webkit-scrollbar-thumb": {
								backgroundColor: "rgba(255,255,255,0.1)",
								borderRadius: "4px",
							},
						}}
					>
						{filteredPartners.length > 0 ? (
							<>
								{renderPartnerGroupTable(
									"Today",
									timelineGroupedPartners.today,
								)}
								{renderPartnerGroupTable(
									"Last 7 Days",
									timelineGroupedPartners.sevenDays,
								)}
								{renderPartnerGroupTable(
									"Last 30 Days",
									timelineGroupedPartners.thirtyDays,
								)}
								{renderPartnerGroupTable(
									"Older History",
									timelineGroupedPartners.older,
								)}
							</>
						) : (
							<Box
								sx={{
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									height: "100%",
									color: "rgba(255,255,255,0.4)",
									fontSize: "0.83rem",
								}}
							>
								No counterparties match your search query
							</Box>
						)}
					</Box>
				</FlexCard>

				{/* Right Column: Split Top (Header + Grouped Transactions) & Bottom (Dual Y-Axis Chart) */}
				{selectedPartner ? (
					<Box
						sx={{
							height: isWideEnough ? "100%" : "auto",
							display: "flex",
							flexDirection: "column",
							gap: 1.5,
							minHeight: 0,
						}}
					>
						{/* Top Panel (Transactions Ledger) */}
						<FlexCard
							sx={{
								flex: isWideEnough ? 1 : "none",
								height: isWideEnough ? "auto" : "380px",
								maxHeight: isWideEnough ? "none" : "380px",
								minHeight: 0,
								p: 1.25,
								display: "flex",
								flexDirection: "column",
								gap: 1,
							}}
						>
							{/* Header */}
							<Box
								sx={{
									pb: 0.5,
									borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<Box>
									<Typography
										sx={{
											fontSize: "1.04rem",
											fontWeight: 800,
											color: "white",
										}}
									>
										{selectedPartner.name} ({selectedPartner.code})
									</Typography>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.4)",
											fontFamily: "monospace",
											fontSize: "0.75rem",
										}}
									>
										{partnerTxs.length} Executions ({timeframeLabel})
									</Typography>
								</Box>

								{/* Timeframe Selector */}
								<ButtonGroup
									size="small"
									variant="outlined"
									sx={{ borderColor: "rgba(123, 104, 238, 0.3)" }}
								>
									{["24H", "7D", "14D", "30D", "6M", "1Y", "ALL"].map((tf) => (
										<Button
											key={tf}
											onClick={() => setTimeframe(tf)}
											sx={{
												fontSize: "0.66rem",
												fontWeight: 800,
												px: 0.8,
												py: 0.2,
												bgcolor: timeframe === tf ? "#7b68ee" : "transparent",
												color:
													timeframe === tf ? "white" : "rgba(255,255,255,0.6)",
											}}
										>
											{tf}
										</Button>
									))}
								</ButtonGroup>
							</Box>

							{/* Stats Bar */}
							<Box
								sx={{
									display: "grid",
									gridTemplateColumns: "repeat(3, 1fr)",
									gap: 0.75,
								}}
							>
								<Box
									sx={{
										p: 0.75,
										borderRadius: "6px",
										bgcolor: "rgba(0,0,0,0.3)",
										border: "1px solid rgba(74, 222, 128, 0.2)",
									}}
								>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.4)",
											fontSize: "0.64rem",
											fontWeight: 700,
										}}
									>
										GROSS INFLOW ({currency})
									</Typography>
									<Typography
										variant="body2"
										sx={{
											fontFamily: "monospace",
											fontWeight: 800,
											fontSize: "0.86rem",
											color: SEMANTIC_COLORS.neonGreen,
										}}
									>
										+{formatCurrency(partnerStats.grossIncome)} {currency}
									</Typography>
								</Box>

								<Box
									sx={{
										p: 0.75,
										borderRadius: "6px",
										bgcolor: "rgba(0,0,0,0.3)",
										border: "1px solid rgba(248, 113, 113, 0.2)",
									}}
								>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.4)",
											fontSize: "0.64rem",
											fontWeight: 700,
										}}
									>
										GROSS OUTFLOW ({currency})
									</Typography>
									<Typography
										variant="body2"
										sx={{
											fontFamily: "monospace",
											fontWeight: 800,
											fontSize: "0.86rem",
											color: SEMANTIC_COLORS.neonRed,
										}}
									>
										-{formatCurrency(partnerStats.grossExpense)} {currency}
									</Typography>
								</Box>

								<Box
									sx={{
										p: 0.75,
										borderRadius: "6px",
										bgcolor: "rgba(0,0,0,0.3)",
										border: "1px solid rgba(123, 104, 238, 0.2)",
									}}
								>
									<Typography
										variant="caption"
										sx={{
											color: "rgba(255,255,255,0.4)",
											fontSize: "0.64rem",
											fontWeight: 700,
										}}
									>
										NET PROFIT / FLOW ({currency})
									</Typography>
									<Typography
										variant="body2"
										sx={{
											fontFamily: "monospace",
											fontWeight: 800,
											fontSize: "0.86rem",
											color:
												partnerStats.netFlow >= 0
													? SEMANTIC_COLORS.neonGreen
													: SEMANTIC_COLORS.neonRed,
										}}
									>
										{partnerStats.netFlow > 0 ? "+" : ""}
										{formatCurrency(partnerStats.netFlow)} {currency}
									</Typography>
								</Box>
							</Box>

							{/* Grouped Contract & Single Trade Ledger List */}
							<Box
								sx={{
									flex: 1,
									minHeight: 0,
									width: "100%",
									overflowY: "auto",
									overflowX: "hidden",
									pr: 0.5,
									"&::-webkit-scrollbar": { width: "4px" },
									"&::-webkit-scrollbar-thumb": {
										backgroundColor: "rgba(123, 104, 238, 0.4)",
										borderRadius: "4px",
									},
								}}
							>
								{groupedPartnerTxs.length > 0 ? (
									<Box
										sx={{
											display: "flex",
											flexDirection: "column",
											width: "100%",
										}}
									>
										{/* Sticky Header Bar */}
										<Box
											sx={{
												position: "sticky",
												top: 0,
												zIndex: 10,
												bgcolor: "#080814",
												px: 1,
												py: 0.6,
												borderBottom: "1px solid rgba(255,255,255,0.08)",
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												width: "100%",
												boxSizing: "border-box",
											}}
										>
											<Typography
												sx={{
													fontSize: "0.66rem",
													fontWeight: 800,
													color: "rgba(255,255,255,0.45)",
													textTransform: "uppercase",
													letterSpacing: "0.06em",
												}}
											>
												Timestamp & Type
											</Typography>
											<Typography
												sx={{
													fontSize: "0.66rem",
													fontWeight: 800,
													color: "rgba(255,255,255,0.45)",
													textTransform: "uppercase",
													letterSpacing: "0.06em",
													textAlign: "right",
												}}
											>
												Net Payment
											</Typography>
										</Box>

										{/* Transaction Rows */}
										{groupedPartnerTxs.map((group) => {
											const isExpanded = expandedGroupIds.has(group.id);
											const isMulti = group.items.length > 1;
											const d = new Date(group.latestTimestamp);
											const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
											const timeStr = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;

											return (
												<React.Fragment key={group.id}>
													<Box
														onClick={() => {
															if (isMulti) {
																toggleGroupExpand(group.id);
															} else if (onSelectTx && group.items[0]) {
																onSelectTx(group.items[0]);
															}
														}}
														sx={{
															py: 0.75,
															px: 1,
															borderBottom: "1px solid rgba(255,255,255,0.04)",
															cursor: "pointer",
															bgcolor: isExpanded
																? "rgba(123, 104, 238, 0.08)"
																: "transparent",
															transition: "background-color 0.15s",
															display: "flex",
															alignItems: "center",
															justifyContent: "space-between",
															gap: 1,
															width: "100%",
															boxSizing: "border-box",
															"&:hover": {
																bgcolor: "rgba(123, 104, 238, 0.06)",
															},
														}}
													>
														{/* Left: Expand Arrow (if multi) + Separate Date/Time Boxes + Wrapping Type & Tx Count Chips */}
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																gap: 0.75,
																minWidth: 0,
																flex: 1,
															}}
														>
															{isMulti && (
																<IconButton
																	size="small"
																	sx={{
																		p: 0.1,
																		color: "rgba(255,255,255,0.5)",
																		flexShrink: 0,
																	}}
																>
																	{isExpanded ? (
																		<KeyboardArrowUpIcon
																			sx={{ fontSize: 14 }}
																		/>
																	) : (
																		<KeyboardArrowDownIcon
																			sx={{ fontSize: 14 }}
																		/>
																	)}
																</IconButton>
															)}

															{/* Separate Date (Row 1) and Time (Row 2) Micro-Pills when panel width < 800px */}
															<Box
																sx={{
																	display: "flex",
																	flexDirection:
																		containerWidth > 0 && containerWidth < 800
																			? "column"
																			: "row",
																	alignItems:
																		containerWidth > 0 && containerWidth < 800
																			? "flex-start"
																			: "center",
																	gap:
																		containerWidth > 0 && containerWidth < 800
																			? "1px"
																			: "6px",
																	flexShrink: 0,
																}}
															>
																<Box
																	sx={{
																		px: 0.45,
																		py: 0.1,
																		borderRadius: "3px",
																		bgcolor: "rgba(255,255,255,0.06)",
																		border: "1px solid rgba(255,255,255,0.08)",
																	}}
																>
																	<Typography
																		sx={{
																			fontSize: "0.72rem",
																			fontFamily: "monospace",
																			color: "rgba(255,255,255,0.85)",
																			fontWeight: 700,
																			lineHeight: 1.1,
																			whiteSpace: "nowrap",
																		}}
																	>
																		{dateStr}
																	</Typography>
																</Box>
																<Box
																	sx={{
																		px: 0.4,
																		py: 0.1,
																		borderRadius: "3px",
																		bgcolor: "rgba(0,0,0,0.35)",
																		border: "1px solid rgba(255,255,255,0.04)",
																	}}
																>
																	<Typography
																		sx={{
																			fontSize: "0.64rem",
																			fontFamily: "monospace",
																			color: "rgba(255,255,255,0.5)",
																			lineHeight: 1.1,
																			whiteSpace: "nowrap",
																		}}
																	>
																		{timeStr}
																	</Typography>
																</Box>
															</Box>

															{/* Wrapping Type Chip & Batch Count Badge Box */}
															<Box
																sx={{
																	display: "flex",
																	flexWrap: "wrap",
																	alignItems: "center",
																	gap: 0.5,
																	flex: 1,
																	minWidth: 0,
																}}
															>
																<Chip
																	label={group.category.replace("_", " ")}
																	size="small"
																	sx={{
																		height: 20,
																		fontSize: "0.62rem",
																		fontWeight: 800,
																		bgcolor: "rgba(123, 104, 238, 0.15)",
																		color: "#7b68ee",
																		whiteSpace: "nowrap",
																	}}
																/>
																{isMulti && (
																	<Chip
																		label={`${group.items.length} txs`}
																		size="small"
																		sx={{
																			height: 18,
																			fontSize: "0.58rem",
																			fontWeight: 800,
																			bgcolor: "rgba(255,255,255,0.1)",
																			color: "rgba(255,255,255,0.85)",
																			border:
																				"1px solid rgba(255,255,255,0.15)",
																			whiteSpace: "nowrap",
																		}}
																	/>
																)}
															</Box>
														</Box>

														{/* Right: Net Payment (Un-truncated, Right-Aligned) */}
														<Typography
															sx={{
																fontSize: "0.86rem",
																fontFamily: "monospace",
																fontWeight: 800,
																color:
																	group.totalAmount >= 0
																		? SEMANTIC_COLORS.neonGreen
																		: SEMANTIC_COLORS.neonRed,
																whiteSpace: "nowrap",
																flexShrink: 0,
																textAlign: "right",
															}}
														>
															{group.totalAmount > 0 ? "+" : ""}
															{formatCurrency(group.totalAmount)} {currency}
														</Typography>
													</Box>

													{/* Expanded Batch Sub-Transactions */}
													{isMulti && (
														<Collapse
															in={isExpanded}
															timeout="auto"
															unmountOnExit
														>
															<Box
																sx={{
																	p: 0.75,
																	bgcolor: "rgba(0,0,0,0.3)",
																	display: "flex",
																	flexDirection: "column",
																	gap: 0.5,
																}}
															>
																{group.items.map((subTx) => (
																	<Box
																		key={subTx.Id}
																		onClick={() =>
																			onSelectTx && onSelectTx(subTx)
																		}
																		sx={{
																			py: 0.4,
																			px: 1,
																			borderRadius: "4px",
																			bgcolor: "rgba(255,255,255,0.02)",
																			cursor: "pointer",
																			display: "flex",
																			alignItems: "center",
																			justifyContent: "space-between",
																			gap: 1,
																			"&:hover": {
																				bgcolor: "rgba(255,255,255,0.05)",
																			},
																		}}
																	>
																		<Box
																			sx={{
																				display: "flex",
																				alignItems: "center",
																				gap: 1,
																				minWidth: 0,
																				flex: 1,
																			}}
																		>
																			<Typography
																				sx={{
																					fontSize: "0.72rem",
																					fontFamily: "monospace",
																					color: "rgba(255,255,255,0.4)",
																					whiteSpace: "nowrap",
																				}}
																			>
																				{new Date(
																					subTx.Timestamp,
																				).toLocaleTimeString([], {
																					hour: "2-digit",
																					minute: "2-digit",
																				})}
																			</Typography>
																			<Chip
																				label={subTx.Type}
																				size="small"
																				sx={{
																					height: 16,
																					fontSize: "0.58rem",
																					bgcolor: "rgba(255,255,255,0.05)",
																					color: "rgba(255,255,255,0.6)",
																				}}
																			/>
																			<Typography
																				sx={{
																					fontSize: "0.76rem",
																					color: "rgba(255,255,255,0.7)",
																					overflow: "hidden",
																					textOverflow: "ellipsis",
																					whiteSpace: "nowrap",
																				}}
																			>
																				{subTx.PartnerName}
																			</Typography>
																		</Box>
																		<Typography
																			sx={{
																				fontSize: "0.80rem",
																				fontFamily: "monospace",
																				fontWeight: 700,
																				color:
																					subTx.Amount >= 0
																						? SEMANTIC_COLORS.neonGreen
																						: SEMANTIC_COLORS.neonRed,
																				whiteSpace: "nowrap",
																				flexShrink: 0,
																			}}
																		>
																			{subTx.Amount > 0 ? "+" : ""}
																			{formatCurrency(subTx.Amount)} {currency}
																		</Typography>
																	</Box>
																))}
															</Box>
														</Collapse>
													)}
												</React.Fragment>
											);
										})}
									</Box>
								) : (
									<Box
										sx={{
											display: "flex",
											justifyContent: "center",
											alignItems: "center",
											height: "100%",
											color: "rgba(255,255,255,0.4)",
											fontSize: "0.83rem",
										}}
									>
										No transaction logs recorded for this partner in {timeframe}{" "}
										filter
									</Box>
								)}
							</Box>
						</FlexCard>

						{/* Bottom Panel: Dual Y-Axis Chart for Partner */}
						<FlexCard
							sx={{
								height: "210px",
								minHeight: "210px",
								p: 1.25,
								display: "flex",
								flexDirection: "column",
							}}
						>
							<Box
								sx={{
									pb: 0.5,
									borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<Typography
									sx={{
										fontWeight: 800,
										fontSize: "0.83rem",
										textTransform: "uppercase",
										letterSpacing: "0.08em",
										color: SEMANTIC_COLORS.neonGreen,
									}}
								>
									Partner Flow Timeline ({currency} Cash Flow & Material Item
									Volume)
								</Typography>
							</Box>

							<Box sx={{ flex: 1, minHeight: 0, mt: 0.5 }}>
								{partnerChartData.length > 0 ? (
									<ResponsiveContainer
										minWidth={0}
										minHeight={0}
										initialDimension={{ width: 300, height: 200 }}
										width="100%"
										height="100%"
									>
										<ComposedChart
											data={partnerChartData}
											margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
										>
											<XAxis
												dataKey="date"
												stroke="rgba(255,255,255,0.4)"
												fontSize={10}
												tickLine={false}
											/>
											<YAxis
												yAxisId="left"
												stroke={SEMANTIC_COLORS.neonGreen}
												fontSize={10}
												tickLine={false}
												tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
												label={{
													value: `Unit based on currency (${currency})`,
													angle: -90,
													position: "insideLeft",
													fill: "rgba(255,255,255,0.45)",
													fontSize: 9,
													offset: 10,
												}}
											/>
											<YAxis
												yAxisId="right"
												orientation="right"
												stroke={SEMANTIC_COLORS.neonBlue}
												fontSize={10}
												tickLine={false}
												tickFormatter={(val) => `${val.toLocaleString()} u`}
											/>
											<Tooltip
												contentStyle={{
													backgroundColor: "rgba(4,4,10,0.95)",
													border: "1px solid rgba(123,104,238,0.3)",
													borderRadius: "8px",
													fontSize: "0.7rem",
												}}
												formatter={(val: any, name: any) => [
													name === "ItemVolume"
														? `${Number(val).toLocaleString()} u`
														: `${formatCurrency(Number(val))} ${currency}`,
													name,
												]}
											/>
											<Legend
												verticalAlign="bottom"
												height={24}
												wrapperStyle={{ fontSize: "0.68rem" }}
											/>
											<Area
												yAxisId="left"
												type="monotone"
												dataKey="Earnings"
												stroke={SEMANTIC_COLORS.neonGreen}
												fill="rgba(74, 222, 128, 0.15)"
												strokeWidth={2}
											/>
											<Area
												yAxisId="left"
												type="monotone"
												dataKey="Expenses"
												stroke={SEMANTIC_COLORS.neonRed}
												fill="rgba(248, 113, 113, 0.15)"
												strokeWidth={2}
											/>
											<Bar
												yAxisId="right"
												dataKey="ItemVolume"
												name="Item Volume (u)"
												fill="rgba(96, 165, 250, 0.4)"
												radius={[2, 2, 0, 0]}
												barSize={12}
											/>
										</ComposedChart>
									</ResponsiveContainer>
								) : (
									<Box
										sx={{
											display: "flex",
											justifyContent: "center",
											alignItems: "center",
											height: "100%",
											color: "rgba(255,255,255,0.4)",
											fontSize: "0.75rem",
										}}
									>
										No timeline chart points available for this partner in{" "}
										{timeframe} filter
									</Box>
								)}
							</Box>
						</FlexCard>
					</Box>
				) : (
					<FlexCard
						sx={{
							height: "100%",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<Typography
							sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}
						>
							Select a counterparty from the directory to inspect workspace
						</Typography>
					</FlexCard>
				)}
			</Box>
		</Box>
	);
};
