import React, { useState, useEffect, useMemo } from "react";
import {
	Box,
	Typography,
	Chip,
	LinearProgress,
	TextField,
	InputAdornment,
	CircularProgress,
	Button,
	ButtonGroup,
	useMediaQuery,
	useTheme,
	IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HandshakeIcon from "@mui/icons-material/Handshake";
import CallMadeIcon from "@mui/icons-material/CallMade";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import FilterListIcon from "@mui/icons-material/FilterList";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { FlexCard } from "./sharedui";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";
import { fetchClient } from "../../../utils/apiclient";
import { ContractDetailModal } from "./contractdetailmodal";

interface ContractsTabProps {
	currentData: any;
	netPending: number;
	timeRange?: string;
	onSelectTx?: (tx: any) => void;
}

export const ContractsTab: React.FC<ContractsTabProps> = ({
	currentData,
	netPending,
	timeRange = "ALL",
	onSelectTx,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	const currency = currentData?.Currency || "";
	const receivables = currentData?.PendingReceivable || 0;
	const payables = currentData?.PendingPayable || 0;
	const allTransactions: any[] = currentData?.Transactions || [];

	// Local State
	const [viewMode, setViewMode] = useState<"CONTRACTS" | "TRANSACTIONS">(
		"CONTRACTS",
	);
	const [statusFilter, setStatusFilter] = useState<string>("ALL");
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [contracts, setContracts] = useState<any[]>([]);
	const [loadingContracts, setLoadingContracts] = useState<boolean>(false);
	const [selectedContract, setSelectedContract] = useState<any | null>(null);
	const [page, setPage] = useState<number>(1);
	const pageSize = 25;

	// Reset page when switching views or filters
	useEffect(() => {
		setPage(1);
	}, [viewMode, statusFilter, searchQuery]);

	// Derive contracts list directly from real-time WebSocket currentData, fallback to live fetch
	const rawContracts = useMemo(() => {
		if (
			currentData?.Contracts &&
			Array.isArray(currentData.Contracts) &&
			currentData.Contracts.length > 0
		) {
			return currentData.Contracts;
		}
		if (
			currentData?.contracts &&
			Array.isArray(currentData.contracts) &&
			currentData.contracts.length > 0
		) {
			return currentData.contracts;
		}
		return contracts;
	}, [currentData, contracts]);

	// Fetch live contract agreements fallback if not in currentData
	useEffect(() => {
		if (currentData?.Contracts?.length || currentData?.contracts?.length) {
			return;
		}
		let isMounted = true;
		const fetchContracts = async () => {
			setLoadingContracts(true);
			try {
				const res = await fetchClient("/internal/contracts/list", {
					method: "POST",
					body: JSON.stringify({
						status: statusFilter === "ALL" ? "" : statusFilter,
						search: searchQuery,
						page: 1,
						limit: 5000,
					}),
				});
				if (res.ok) {
					const data = await res.json();
					if (isMounted) {
						setContracts(data.items || []);
					}
				}
			} catch (err) {
				console.error("Failed to fetch contracts list:", err);
			} finally {
				if (isMounted) setLoadingContracts(false);
			}
		};

		const debounceTimer = setTimeout(fetchContracts, 250);
		return () => {
			isMounted = false;
			clearTimeout(debounceTimer);
		};
	}, [currentData, statusFilter, searchQuery]);

	// Format Natural ID helper
	const getNaturalContractId = (item: any) => {
		if (!item) return "N/A";
		const raw =
			item.naturalid ||
			item.NaturalId ||
			item.localid ||
			item.LocalId ||
			item.id ||
			"";
		if (!raw) return "N/A";
		if (raw.startsWith("CTR_") || raw.startsWith("CTR-")) return raw;
		return `CTR-${raw.substring(0, 10)}`;
	};

	// Filter contract-related transactions
	const contractTransactions = useMemo(() => {
		return allTransactions.filter((tx) => {
			const matchesType =
				tx.ContractId ||
				tx.Id?.startsWith("CTR_") ||
				tx.Type?.includes("CONTRACT");
			if (!matchesType) return false;
			if (!searchQuery) return true;
			const q = searchQuery.toLowerCase();
			return (
				tx.Id?.toLowerCase().includes(q) ||
				tx.ContractId?.toLowerCase().includes(q) ||
				tx.PartnerName?.toLowerCase().includes(q) ||
				tx.PartnerCode?.toLowerCase().includes(q) ||
				tx.Type?.toLowerCase().includes(q)
			);
		});
	}, [allTransactions, searchQuery]);

	// Filter contracts list by global timeRange using condition fulfillment timestamps & dates
	const filteredContracts = useMemo(() => {
		if (!rawContracts || rawContracts.length === 0) return [];
		if (!timeRange || timeRange === "ALL" || timeRange === "CUSTOM")
			return rawContracts;

		const getContractLatestTime = (c: any) => {
			const conds: any[] = c.conditions || c.Conditions || [];
			const fulfilledCondTimes = conds
				.filter(
					(cond) =>
						(cond.status || cond.Status || "").toUpperCase() === "FULFILLED",
				)
				.map((cond) =>
					new Date(
						cond.fulfilled_timestamp ||
							cond.fulfilled_at ||
							cond.fulfilledAt ||
							cond.timestamp ||
							0,
					).getTime(),
				)
				.filter((t) => !isNaN(t) && t > 0);

			const maxCondTime =
				fulfilledCondTimes.length > 0 ? Math.max(...fulfilledCondTimes) : 0;
			const contractBaseTime = new Date(
				c.date || c.duedate || c.Timestamp || 0,
			).getTime();
			return Math.max(
				maxCondTime,
				isNaN(contractBaseTime) ? 0 : contractBaseTime,
			);
		};

		const contractTimes = rawContracts
			.map(getContractLatestTime)
			.filter((t) => t > 0);
		const maxTime =
			contractTimes.length > 0 ? Math.max(...contractTimes) : Date.now();

		const daysMap: Record<string, number> = {
			"24H": 1,
			"7D": 7,
			"14D": 14,
			"30D": 30,
			"6M": 180,
			"1Y": 365,
		};
		const days = daysMap[timeRange] || 365;
		const cutoff = maxTime - days * 86400000;

		return rawContracts.filter((c) => {
			const t = getContractLatestTime(c);
			return t === 0 || t >= cutoff;
		});
	}, [rawContracts, timeRange]);

	// Active list based on View Mode
	const currentList =
		viewMode === "CONTRACTS" ? filteredContracts : contractTransactions;
	const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize));
	const paginatedList = useMemo(() => {
		const start = (page - 1) * pageSize;
		return currentList.slice(start, start + pageSize);
	}, [currentList, page, pageSize]);

	// Status chip color helper
	const getStatusChipProps = (status: string) => {
		switch (status?.toUpperCase()) {
			case "FULFILLED":
				return {
					bgcolor: "rgba(74, 222, 128, 0.15)",
					color: "#4ade80",
					border: "1px solid rgba(74, 222, 128, 0.3)",
				};
			case "ACCEPTED":
				return {
					bgcolor: "rgba(168, 85, 247, 0.15)",
					color: "#a855f7",
					border: "1px solid rgba(168, 85, 247, 0.3)",
				};
			case "PENDING":
				return {
					bgcolor: "rgba(251, 191, 36, 0.15)",
					color: "#fbbf24",
					border: "1px solid rgba(251, 191, 36, 0.3)",
				};
			case "BREACHED":
				return {
					bgcolor: "rgba(248, 113, 113, 0.15)",
					color: "#f87171",
					border: "1px solid rgba(248, 113, 113, 0.3)",
				};
			case "CANCELLED":
			case "REJECTED":
				return {
					bgcolor: "rgba(148, 163, 184, 0.15)",
					color: "#94a3b8",
					border: "1px solid rgba(148, 163, 184, 0.3)",
				};
			default:
				return {
					bgcolor: "rgba(123, 104, 238, 0.15)",
					color: "#7b68ee",
					border: "1px solid rgba(123, 104, 238, 0.3)",
				};
		}
	};

	return (
		<Box
			sx={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				gap: 1,
				minHeight: 0,
				overflowY: "auto",
			}}
		>
			{/* Top Overview & KPI Header Card */}
			<FlexCard
				sx={{
					p: 1.25,
					display: "flex",
					flexDirection: "column",
					gap: 1,
					flexShrink: 0,
				}}
			>
				<Box
					sx={{
						pb: 0.5,
						borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
						gap: 1,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
						<HandshakeIcon
							sx={{ fontSize: 18, color: SEMANTIC_COLORS.neonPurple }}
						/>
						<Typography
							sx={{
								fontWeight: 800,
								fontSize: "0.82rem",
								textTransform: "uppercase",
								letterSpacing: "0.06em",
								color: SEMANTIC_COLORS.neonPurple,
							}}
						>
							Contracts Ledger & Settlement Analytics
						</Typography>
					</Box>

					<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
						<Typography
							sx={{
								fontSize: "0.72rem",
								color: "rgba(255,255,255,0.6)",
								fontFamily: "monospace",
							}}
						>
							Agreements:{" "}
							<strong style={{ color: "white" }}>{contracts.length}</strong>
						</Typography>
						<Typography
							sx={{
								fontFamily: "monospace",
								fontWeight: 800,
								fontSize: "0.80rem",
								color:
									netPending >= 0
										? SEMANTIC_COLORS.neonGreen
										: SEMANTIC_COLORS.neonRed,
							}}
						>
							Net Pending: {netPending > 0 ? "+" : ""}
							{formatCurrency(netPending)} {currency}
						</Typography>
					</Box>
				</Box>

				{/* Receivables vs Payables Progress Visualizer */}
				<Box
					sx={{
						p: 1,
						borderRadius: "6px",
						bgcolor: "rgba(0,0,0,0.35)",
						border: "1px solid rgba(123, 104, 238, 0.2)",
						display: "flex",
						flexDirection: "column",
						gap: 0.5,
					}}
				>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<CallReceivedIcon
								sx={{ fontSize: 13, color: SEMANTIC_COLORS.neonGreen }}
							/>
							<Typography
								sx={{
									fontSize: "0.68rem",
									fontWeight: 700,
									color: "rgba(255,255,255,0.7)",
								}}
							>
								Contract Receivables
							</Typography>
						</Box>
						<Typography
							sx={{
								fontFamily: "monospace",
								fontWeight: 800,
								fontSize: "0.78rem",
								color: SEMANTIC_COLORS.neonGreen,
							}}
						>
							+{formatCurrency(receivables)} {currency}
						</Typography>
					</Box>

					<LinearProgress
						variant="determinate"
						value={
							receivables + payables > 0
								? (receivables / (receivables + payables)) * 100
								: 50
						}
						sx={{
							height: 4,
							borderRadius: 2,
							bgcolor: "rgba(248, 113, 113, 0.2)",
							"& .MuiLinearProgress-bar": {
								bgcolor: SEMANTIC_COLORS.neonGreen,
							},
						}}
					/>

					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<CallMadeIcon
								sx={{ fontSize: 13, color: SEMANTIC_COLORS.neonRed }}
							/>
							<Typography
								sx={{
									fontSize: "0.68rem",
									fontWeight: 700,
									color: "rgba(255,255,255,0.7)",
								}}
							>
								Contract Payables
							</Typography>
						</Box>
						<Typography
							sx={{
								fontFamily: "monospace",
								fontWeight: 800,
								fontSize: "0.78rem",
								color: SEMANTIC_COLORS.neonRed,
							}}
						>
							-{formatCurrency(payables)} {currency}
						</Typography>
					</Box>
				</Box>
			</FlexCard>

			{/* Main Data Section */}
			<FlexCard
				sx={{
					flex: 1,
					minHeight: 0,
					p: 1.25,
					display: "flex",
					flexDirection: "column",
					gap: 1,
				}}
			>
				{/* Controls Bar: Mode Switcher + Filters + Search */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
						gap: 1,
						pb: 0.75,
						borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
						flexShrink: 0,
					}}
				>
					{/* Mode Switcher Buttons */}
					<ButtonGroup
						size="small"
						sx={{ bgcolor: "rgba(0,0,0,0.4)", borderRadius: "6px", p: "2px" }}
					>
						<Button
							onClick={() => setViewMode("CONTRACTS")}
							variant={viewMode === "CONTRACTS" ? "contained" : "text"}
							startIcon={<AssignmentIcon sx={{ fontSize: 13 }} />}
							sx={{
								fontSize: "0.66rem",
								fontWeight: 800,
								py: 0.2,
								px: 1,
								bgcolor:
									viewMode === "CONTRACTS"
										? "rgba(123, 104, 238, 0.25)"
										: "transparent",
								color:
									viewMode === "CONTRACTS"
										? "#7b68ee"
										: "rgba(255,255,255,0.6)",
								border:
									viewMode === "CONTRACTS"
										? "1px solid rgba(123, 104, 238, 0.4)"
										: "none",
							}}
						>
							Contract Agreements ({contracts.length})
						</Button>
						<Button
							onClick={() => setViewMode("TRANSACTIONS")}
							variant={viewMode === "TRANSACTIONS" ? "contained" : "text"}
							startIcon={<ReceiptLongIcon sx={{ fontSize: 13 }} />}
							sx={{
								fontSize: "0.66rem",
								fontWeight: 800,
								py: 0.2,
								px: 1,
								bgcolor:
									viewMode === "TRANSACTIONS"
										? "rgba(123, 104, 238, 0.25)"
										: "transparent",
								color:
									viewMode === "TRANSACTIONS"
										? "#7b68ee"
										: "rgba(255,255,255,0.6)",
								border:
									viewMode === "TRANSACTIONS"
										? "1px solid rgba(123, 104, 238, 0.4)"
										: "none",
							}}
						>
							Settlement Logs ({contractTransactions.length})
						</Button>
					</ButtonGroup>

					{/* Category & Status Filter Chips */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.5,
							flexWrap: "wrap",
						}}
					>
						{viewMode === "CONTRACTS" && (
							<>
								<FilterListIcon
									sx={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}
								/>
								{["ALL", "PENDING", "ACCEPTED", "FULFILLED", "BREACHED"].map(
									(st) => (
										<Chip
											key={st}
											label={st}
											size="small"
											onClick={() => setStatusFilter(st)}
											sx={{
												height: 18,
												fontSize: "0.56rem",
												fontWeight: 800,
												cursor: "pointer",
												bgcolor:
													statusFilter === st
														? "rgba(123, 104, 238, 0.3)"
														: "rgba(255,255,255,0.04)",
												color:
													statusFilter === st
														? "#7b68ee"
														: "rgba(255,255,255,0.6)",
												border:
													statusFilter === st
														? "1px solid rgba(123, 104, 238, 0.5)"
														: "1px solid rgba(255,255,255,0.08)",
											}}
										/>
									),
								)}
							</>
						)}

						{/* Search Input */}
						<TextField
							size="small"
							placeholder="Search Natural ID..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon
											sx={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}
										/>
									</InputAdornment>
								),
							}}
							sx={{
								width: 150,
								"& .MuiInputBase-root": {
									height: 22,
									fontSize: "0.65rem",
									bgcolor: "rgba(0,0,0,0.4)",
									borderRadius: "4px",
									color: "white",
								},
							}}
						/>
					</Box>
				</Box>

				{/* Scrollable Content Container (Mobile Cards vs Desktop Table) */}
				<Box
					sx={{
						flex: 1,
						minHeight: 0,
						overflowY: "auto",
						pr: 0.5,
						"&::-webkit-scrollbar": { width: "4px" },
						"&::-webkit-scrollbar-thumb": {
							backgroundColor: "rgba(255,255,255,0.15)",
							borderRadius: "4px",
						},
					}}
				>
					{viewMode === "CONTRACTS" ? (
						loadingContracts ? (
							<Box
								sx={{
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									height: "100%",
									gap: 1,
									color: "#7b68ee",
									py: 4,
								}}
							>
								<CircularProgress size={18} color="inherit" />
								<Typography sx={{ fontSize: "0.75rem" }}>
									Loading agreements...
								</Typography>
							</Box>
						) : paginatedList.length > 0 ? (
							isMobile ? (
								/* Mobile Card View */
								<Box
									sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}
								>
									{paginatedList.map((item, idx) => {
										const chipStyle = getStatusChipProps(item.status);
										const natId = getNaturalContractId(item);
										return (
											<Box
												key={`m_ctr_${item.id || idx}_${idx}`}
												onClick={() => setSelectedContract(item)}
												sx={{
													p: 1,
													borderRadius: "6px",
													bgcolor: "rgba(0,0,0,0.35)",
													border: "1px solid rgba(255,255,255,0.06)",
													display: "flex",
													flexDirection: "column",
													gap: 0.5,
													cursor: "pointer",
													"&:hover": { bgcolor: "rgba(123, 104, 238, 0.1)" },
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
														sx={{
															fontSize: "0.74rem",
															fontFamily: "monospace",
															color: "#7b68ee",
															fontWeight: 800,
														}}
													>
														{natId}
													</Typography>
													<Chip
														label={item.status || "ACTIVE"}
														size="small"
														sx={{
															height: 16,
															fontSize: "0.52rem",
															fontWeight: 800,
															...chipStyle,
														}}
													/>
												</Box>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														justifyContent: "space-between",
													}}
												>
													<Typography
														sx={{
															fontSize: "0.72rem",
															color: "white",
															fontWeight: 700,
														}}
													>
														{item.partnername ||
															item.partnercode ||
															"Counterparty"}
													</Typography>
													<Typography
														sx={{
															fontSize: "0.76rem",
															fontFamily: "monospace",
															fontWeight: 800,
															color:
																item.party === "CUSTOMER"
																	? SEMANTIC_COLORS.neonGreen
																	: SEMANTIC_COLORS.neonRed,
														}}
													>
														{item.party === "CUSTOMER" ? "+" : "-"}
														{formatCurrency(item.total_amount || 0)} {currency}
													</Typography>
												</Box>
											</Box>
										);
									})}
								</Box>
							) : (
								/* Desktop Table View */
								<table
									style={{
										width: "100%",
										borderCollapse: "collapse",
										textAlign: "left",
										tableLayout: "fixed",
									}}
								>
									<thead>
										<tr
											style={{
												color: "rgba(255,255,255,0.4)",
												fontSize: "0.58rem",
												textTransform: "uppercase",
												borderBottom: "1px solid rgba(255,255,255,0.06)",
												backgroundColor: "rgba(4,4,10,0.8)",
												position: "sticky",
												top: 0,
												zIndex: 1,
											}}
										>
											<th style={{ padding: "6px 8px", width: "130px" }}>
												Natural ID
											</th>
											<th style={{ padding: "6px 8px" }}>Contract Name</th>
											<th style={{ padding: "6px 8px", width: "100px" }}>
												Status
											</th>
											<th style={{ padding: "6px 8px", width: "120px" }}>
												Counterparty
											</th>
											<th style={{ padding: "6px 8px", width: "90px" }}>
												Party
											</th>
											<th
												style={{
													padding: "6px 8px",
													textAlign: "right",
													width: "130px",
												}}
											>
												Total Amount
											</th>
										</tr>
									</thead>
									<tbody>
										{paginatedList.map((item, idx) => {
											const chipStyle = getStatusChipProps(item.status);
											const natId = getNaturalContractId(item);
											return (
												<tr
													key={`contract_${item.id || idx}_${idx}`}
													onClick={() => setSelectedContract(item)}
													style={{
														borderBottom: "1px solid rgba(255,255,255,0.03)",
														cursor: "pointer",
													}}
												>
													<td
														style={{
															padding: "6px 8px",
															fontFamily: "monospace",
															fontSize: "0.68rem",
															color: "#7b68ee",
															fontWeight: 800,
														}}
													>
														{natId}
													</td>
													<td
														style={{
															padding: "6px 8px",
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
														}}
													>
														<Typography
															sx={{
																fontSize: "0.72rem",
																fontWeight: 600,
																color: "white",
															}}
														>
															{item.name || `Contract ${natId}`}
														</Typography>
													</td>
													<td style={{ padding: "6px 8px" }}>
														<Chip
															label={item.status || "ACTIVE"}
															size="small"
															sx={{
																height: 18,
																fontSize: "0.56rem",
																fontWeight: 800,
																...chipStyle,
															}}
														/>
													</td>
													<td style={{ padding: "6px 8px" }}>
														<Typography
															sx={{
																fontSize: "0.72rem",
																color: "rgba(255,255,255,0.8)",
															}}
														>
															{item.partnername || item.partnercode || "N/A"}
														</Typography>
													</td>
													<td style={{ padding: "6px 8px" }}>
														<Typography
															sx={{
																fontSize: "0.65rem",
																fontWeight: 700,
																color:
																	item.party === "CUSTOMER"
																		? SEMANTIC_COLORS.neonGreen
																		: SEMANTIC_COLORS.neonRed,
															}}
														>
															{item.party || "N/A"}
														</Typography>
													</td>
													<td
														style={{
															padding: "6px 8px",
															textAlign: "right",
															fontFamily: "monospace",
															fontSize: "0.75rem",
															fontWeight: 800,
															color:
																item.party === "CUSTOMER"
																	? SEMANTIC_COLORS.neonGreen
																	: SEMANTIC_COLORS.neonRed,
														}}
													>
														{item.party === "CUSTOMER" ? "+" : "-"}
														{formatCurrency(item.total_amount || 0)}{" "}
														{item.currency || currency}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							)
						) : (
							<Box
								sx={{
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									height: "100%",
									color: "rgba(255,255,255,0.4)",
									fontSize: "0.78rem",
									py: 4,
								}}
							>
								No contracts found matching criteria
							</Box>
						)
					) : paginatedList.length > 0 ? (
						isMobile ? (
							/* Mobile Settlement Logs Cards */
							<Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
								{paginatedList.map((tx, idx) => {
									const natRef =
										tx.ContractNaturalId ||
										tx.ContractLocalId ||
										tx.ContractId ||
										(tx.Id ? `CTR-${tx.Id.substring(0, 8)}` : "N/A");
									return (
										<Box
											key={`m_settle_${tx.Id || idx}_${idx}`}
											onClick={() => onSelectTx && onSelectTx(tx)}
											sx={{
												p: 1,
												borderRadius: "6px",
												bgcolor: "rgba(0,0,0,0.35)",
												border: "1px solid rgba(255,255,255,0.06)",
												display: "flex",
												flexDirection: "column",
												gap: 0.4,
												cursor: "pointer",
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
													sx={{
														fontSize: "0.72rem",
														fontFamily: "monospace",
														color: "#7b68ee",
														fontWeight: 800,
													}}
												>
													{natRef}
												</Typography>
												<Typography
													sx={{
														fontSize: "0.76rem",
														fontFamily: "monospace",
														fontWeight: 800,
														color:
															Number(tx.Amount || 0) >= 0
																? SEMANTIC_COLORS.neonGreen
																: SEMANTIC_COLORS.neonRed,
													}}
												>
													{Number(tx.Amount || 0) >= 0 ? "+" : ""}
													{formatCurrency(Number(tx.Amount || 0))} {currency}
												</Typography>
											</Box>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
												}}
											>
												<Typography
													sx={{
														fontSize: "0.68rem",
														color: "rgba(255,255,255,0.7)",
													}}
												>
													{tx.PartnerCode || tx.PartnerName || "Settlement"}
												</Typography>
												<Typography
													sx={{
														fontSize: "0.62rem",
														color: "rgba(255,255,255,0.4)",
													}}
												>
													{new Date(tx.Timestamp).toLocaleDateString()}
												</Typography>
											</Box>
										</Box>
									);
								})}
							</Box>
						) : (
							/* Desktop Settlement Logs Table */
							<table
								style={{
									width: "100%",
									borderCollapse: "collapse",
									textAlign: "left",
									tableLayout: "fixed",
								}}
							>
								<thead>
									<tr
										style={{
											color: "rgba(255,255,255,0.4)",
											fontSize: "0.58rem",
											textTransform: "uppercase",
											borderBottom: "1px solid rgba(255,255,255,0.06)",
											backgroundColor: "rgba(4,4,10,0.8)",
											position: "sticky",
											top: 0,
											zIndex: 1,
										}}
									>
										<th style={{ padding: "6px 8px", width: "115px" }}>
											Timestamp
										</th>
										<th style={{ padding: "6px 8px", width: "130px" }}>Type</th>
										<th style={{ padding: "6px 8px", width: "120px" }}>
											Counterparty
										</th>
										<th style={{ padding: "6px 8px" }}>Contract Natural Ref</th>
										<th
											style={{
												padding: "6px 8px",
												textAlign: "right",
												width: "130px",
											}}
										>
											Settlement
										</th>
									</tr>
								</thead>
								<tbody>
									{paginatedList.map((tx, idx) => {
										const natRef =
											tx.ContractNaturalId ||
											tx.ContractLocalId ||
											tx.ContractId ||
											(tx.Id ? `CTR-${tx.Id.substring(0, 8)}` : "N/A");
										return (
											<tr
												key={`settle_${tx.Id || idx}_${idx}`}
												onClick={() => onSelectTx && onSelectTx(tx)}
												style={{
													borderBottom: "1px solid rgba(255,255,255,0.03)",
													cursor: "pointer",
												}}
											>
												<td
													style={{
														padding: "6px 8px",
														fontFamily: "monospace",
														fontSize: "0.68rem",
														color: "rgba(255,255,255,0.6)",
													}}
												>
													{new Date(tx.Timestamp).toLocaleDateString()}{" "}
													{new Date(tx.Timestamp).toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</td>
												<td style={{ padding: "6px 8px" }}>
													<Chip
														label={(tx.Type || "SETTLEMENT").replace("_", " ")}
														size="small"
														sx={{
															height: 18,
															fontSize: "0.56rem",
															fontWeight: 800,
															bgcolor: "rgba(123, 104, 238, 0.15)",
															color: "#7b68ee",
														}}
													/>
												</td>
												<td style={{ padding: "6px 8px" }}>
													<Typography
														sx={{
															fontSize: "0.72rem",
															fontWeight: 700,
															color: "white",
														}}
													>
														{tx.PartnerCode || tx.PartnerName || "N/A"}
													</Typography>
												</td>
												<td
													style={{
														padding: "6px 8px",
														fontFamily: "monospace",
														fontSize: "0.68rem",
														color: "#7b68ee",
														fontWeight: 800,
													}}
												>
													{natRef}
												</td>
												<td
													style={{
														padding: "6px 8px",
														textAlign: "right",
														fontFamily: "monospace",
														fontSize: "0.75rem",
														fontWeight: 800,
														color:
															Number(tx.Amount || 0) >= 0
																? SEMANTIC_COLORS.neonGreen
																: SEMANTIC_COLORS.neonRed,
													}}
												>
													{Number(tx.Amount || 0) >= 0 ? "+" : ""}
													{formatCurrency(Number(tx.Amount || 0))} {currency}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						)
					) : (
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								height: "100%",
								color: "rgba(255,255,255,0.4)",
								fontSize: "0.78rem",
								py: 4,
							}}
						>
							No settlement logs recorded
						</Box>
					)}
				</Box>

				{/* Pagination Controls Bar */}
				{currentList.length > pageSize && (
					<Box
						sx={{
							pt: 0.75,
							borderTop: "1px solid rgba(255,255,255,0.06)",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							flexShrink: 0,
						}}
					>
						<Typography
							sx={{
								fontSize: "0.66rem",
								color: "rgba(255,255,255,0.5)",
								fontFamily: "monospace",
							}}
						>
							Showing {(page - 1) * pageSize + 1} -{" "}
							{Math.min(currentList.length, page * pageSize)} of{" "}
							{currentList.length} items
						</Typography>

						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<IconButton
								size="small"
								disabled={page <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								sx={{
									p: 0.2,
									color: page > 1 ? "#7b68ee" : "rgba(255,255,255,0.2)",
								}}
							>
								<ChevronLeftIcon fontSize="small" />
							</IconButton>
							<Typography
								sx={{
									fontSize: "0.68rem",
									fontFamily: "monospace",
									fontWeight: 800,
									color: "white",
								}}
							>
								{page} / {totalPages}
							</Typography>
							<IconButton
								size="small"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								sx={{
									p: 0.2,
									color:
										page < totalPages ? "#7b68ee" : "rgba(255,255,255,0.2)",
								}}
							>
								<ChevronRightIcon fontSize="small" />
							</IconButton>
						</Box>
					</Box>
				)}
			</FlexCard>

			<ContractDetailModal
				open={Boolean(selectedContract)}
				onClose={() => setSelectedContract(null)}
				contract={selectedContract}
				currency={currency}
			/>
		</Box>
	);
};
