import React, { useState, useMemo } from "react";
import {
	Box,
	Typography,
	Skeleton,
	IconButton,
	Select,
	MenuItem,
	ButtonGroup,
	Button,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import type { Transaction } from "../types/finances";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";

interface TableSectionProps {
	transactions: Transaction[];
	onRowClick: (tx: Transaction) => void;
	currency?: string;
	loading?: boolean;
}

const formatCompactTimestamp = (tsString: string) => {
	try {
		const d = new Date(tsString);
		return d
			.toLocaleString("en-US", {
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			})
			.replace(",", "");
	} catch {
		return tsString;
	}
};

export const TableSection: React.FC<TableSectionProps> = ({
	transactions,
	onRowClick,
	currency = "",
	loading = false,
}) => {
	const [pageSize, setPageSize] = useState<number>(20);
	const [page, setPage] = useState<number>(0);

	const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
	const paginatedTx = useMemo(() => {
		const start = page * pageSize;
		return transactions.slice(start, start + pageSize);
	}, [transactions, page, pageSize]);

	if (loading) {
		return (
			<Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
				{[...Array(8)].map((_, i) => (
					<Skeleton
						key={i}
						variant="rectangular"
						height={32}
						sx={{
							borderRadius: "4px",
							bgcolor: "rgba(255, 255, 255, 0.03)",
						}}
					/>
				))}
			</Box>
		);
	}

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				justifyContent: "space-between",
			}}
		>
			<Box
				sx={{
					flex: 1,
					overflowX: "auto",
					overflowY: "auto",
					minWidth: 0,
					"&::-webkit-scrollbar": { height: "3px", width: "4px" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: "rgba(255,255,255,0.1)",
					},
				}}
			>
				<Box
					component="table"
					sx={{
						width: "100%",
						minWidth: "580px",
						borderCollapse: "collapse",
						textAlign: "left",
						tableLayout: "fixed",
					}}
				>
					<Box
						component="thead"
						sx={{
							position: "sticky",
							top: 0,
							zIndex: 2,
							backgroundColor: "rgba(4, 4, 10, 0.98)",
						}}
					>
						<Box
							component="tr"
							sx={{
								color: "rgba(255, 255, 255, 0.4)",
								fontSize: "0.62rem",
								textTransform: "uppercase",
							}}
						>
							<Box
								component="th"
								sx={{
									padding: "6px 8px",
									fontWeight: 800,
									width: "110px",
									borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
								}}
							>
								Time (UTC)
							</Box>
							<Box
								component="th"
								sx={{
									padding: "6px 8px",
									fontWeight: 800,
									width: "130px",
									borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
								}}
							>
								Type
							</Box>
							<Box
								component="th"
								sx={{
									padding: "6px 8px",
									fontWeight: 800,
									borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
								}}
							>
								Counterparty
							</Box>
							<Box
								component="th"
								sx={{
									padding: "6px 8px",
									fontWeight: 800,
									textAlign: "right",
									width: "140px",
									borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
								}}
							>
								Amount
							</Box>
						</Box>
					</Box>
					<Box component="tbody">
						{paginatedTx.map((tx, i) => {
							const isCorpTx = tx.Type.includes("CORP");
							return (
								<Box
									component="tr"
									key={`${tx.Id}-${i}`}
									onClick={() => onRowClick(tx)}
									sx={{
										borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
										cursor: "pointer",
										transition: "background-color 0.15s ease",
										"&:hover": {
											backgroundColor: "rgba(123, 104, 238, 0.08)",
										},
									}}
								>
									<Box
										component="td"
										sx={{
											padding: "6px 8px",
											color: "rgba(255,255,255,0.4)",
											fontSize: "0.68rem",
											fontFamily: "monospace",
											whiteSpace: "nowrap",
										}}
									>
										{formatCompactTimestamp(tx.Timestamp)}
									</Box>
									<Box
										component="td"
										sx={{ padding: "6px 8px", whiteSpace: "nowrap" }}
									>
										<Box
											component="span"
											sx={{
												px: 0.75,
												py: 0.15,
												borderRadius: "4px",
												fontSize: "0.58rem",
												fontWeight: 800,
												display: "inline-block",
												maxWidth: "100%",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
												bgcolor: isCorpTx
													? "rgba(123, 104, 238, 0.15)"
													: "rgba(255, 255, 255, 0.05)",
												color: isCorpTx
													? SEMANTIC_COLORS.neonPurple
													: "rgba(255, 255, 255, 0.8)",
												border: `1px solid ${isCorpTx ? "rgba(123, 104, 238, 0.35)" : "rgba(255, 255, 255, 0.08)"}`,
											}}
										>
											{tx.Type}
										</Box>
									</Box>
									<Box component="td" sx={{ padding: "6px 8px" }}>
										<Typography
											sx={{
												fontSize: "0.72rem",
												fontWeight: 700,
												color: "rgba(255, 255, 255, 0.9)",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											{tx.PartnerName || tx.PartnerCode}
										</Typography>
									</Box>
									<Box
										component="td"
										sx={{
											padding: "6px 8px",
											textAlign: "right",
											fontFamily: "monospace",
											fontSize: "0.72rem",
											fontWeight: 700,
											color:
												tx.Amount >= 0
													? SEMANTIC_COLORS.neonGreen
													: SEMANTIC_COLORS.neonRed,
											whiteSpace: "nowrap",
										}}
									>
										{tx.Amount >= 0 ? "+" : ""}
										{formatCurrency(tx.Amount)} {currency}
									</Box>
								</Box>
							);
						})}
					</Box>
				</Box>
			</Box>

			{/* Pagination Control Bar */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					px: 1,
					py: 0.4,
					borderTop: "1px solid rgba(255,255,255,0.06)",
					bgcolor: "rgba(0,0,0,0.4)",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255,255,255,0.4)",
							fontSize: "0.64rem",
							fontFamily: "monospace",
						}}
					>
						Page {page + 1} of {totalPages} ({transactions.length} items)
					</Typography>
					<Select
						size="small"
						value={pageSize}
						onChange={(e) => {
							setPageSize(Number(e.target.value));
							setPage(0);
						}}
						sx={{
							height: 20,
							fontSize: "0.62rem",
							color: "rgba(255,255,255,0.7)",
							bgcolor: "rgba(255,255,255,0.05)",
							"& .MuiSelect-select": { py: 0, px: 0.75 },
							"& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
						}}
					>
						<MenuItem value={10}>10 / page</MenuItem>
						<MenuItem value={20}>20 / page</MenuItem>
						<MenuItem value={50}>50 / page</MenuItem>
						<MenuItem value={100}>100 / page</MenuItem>
					</Select>
				</Box>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<IconButton
						size="small"
						disabled={page === 0}
						onClick={() => setPage((p) => Math.max(0, p - 1))}
						sx={{ color: "white", p: 0.2, "&.Mui-disabled": { opacity: 0.3 } }}
					>
						<ChevronLeftIcon fontSize="small" />
					</IconButton>
					<IconButton
						size="small"
						disabled={page >= totalPages - 1}
						onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
						sx={{ color: "white", p: 0.2, "&.Mui-disabled": { opacity: 0.3 } }}
					>
						<ChevronRightIcon fontSize="small" />
					</IconButton>
				</Box>
			</Box>
		</Box>
	);
};

export const TopPartnersTableContent: React.FC<{
	partners: Array<{
		name: string;
		code: string;
		volume: number;
		income?: number;
		expense?: number;
		net?: number;
	}>;
	onRowClick: (tx: Partial<Transaction>) => void;
	loading?: boolean;
	currency?: string;
}> = ({ partners, onRowClick, loading = false, currency = "" }) => {
	const [mode, setMode] = useState<"INCOME" | "EXPENSE" | "NET" | "VOLUME">(
		"INCOME",
	);
	const [pageSize, setPageSize] = useState<number>(10);
	const [page, setPage] = useState<number>(0);

	const sortedPartners = useMemo(() => {
		const list = [...partners];
		if (mode === "INCOME") {
			return list.sort((a, b) => (b.income || 0) - (a.income || 0));
		}
		if (mode === "EXPENSE") {
			return list.sort((a, b) => (b.expense || 0) - (a.expense || 0));
		}
		if (mode === "NET") {
			return list.sort((a, b) => Math.abs(b.net || 0) - Math.abs(a.net || 0));
		}
		return list.sort((a, b) => (b.volume || 0) - (a.volume || 0));
	}, [partners, mode]);

	const totalPages = Math.max(1, Math.ceil(sortedPartners.length / pageSize));
	const paginatedPartners = useMemo(() => {
		const start = page * pageSize;
		return sortedPartners.slice(start, start + pageSize);
	}, [sortedPartners, page, pageSize]);

	if (loading) {
		return (
			<Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
				{[...Array(5)].map((_, i) => (
					<Skeleton
						key={i}
						variant="rectangular"
						height={28}
						sx={{
							borderRadius: "4px",
							bgcolor: "rgba(255, 255, 255, 0.03)",
						}}
					/>
				))}
			</Box>
		);
	}

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				justifyContent: "space-between",
			}}
		>
			<Box sx={{ flex: 1, overflowX: "auto", overflowY: "auto", minWidth: 0 }}>
				<Box
					component="table"
					sx={{
						width: "100%",
						borderCollapse: "collapse",
						textAlign: "left",
						tableLayout: "fixed",
					}}
				>
					<Box
						component="thead"
						sx={{
							position: "sticky",
							top: 0,
							zIndex: 2,
							backgroundColor: "rgba(4, 4, 10, 0.98)",
						}}
					>
						<Box
							component="tr"
							sx={{
								color: "rgba(255, 255, 255, 0.4)",
								fontSize: "0.62rem",
								textTransform: "uppercase",
							}}
						>
							<Box
								component="th"
								sx={{
									padding: "6px 10px",
									fontWeight: 800,
									width: "40%",
									borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
								}}
							>
								Partner
							</Box>
							<Box
								component="th"
								sx={{
									padding: "4px 6px",
									fontWeight: 800,
									textAlign: "right",
									width: "60%",
									borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "flex-end",
									}}
								>
									<ButtonGroup
										size="small"
										variant="outlined"
										sx={{ height: 20 }}
									>
										<Button
											onClick={() => {
												setMode("INCOME");
												setPage(0);
											}}
											sx={{
												px: 0.5,
												py: 0,
												fontSize: "0.56rem",
												fontWeight: 800,
												bgcolor:
													mode === "INCOME"
														? "rgba(100, 255, 218, 0.2)"
														: "transparent",
												color:
													mode === "INCOME"
														? "#64FFDA"
														: "rgba(255, 255, 255, 0.4)",
												borderColor: "rgba(255, 255, 255, 0.12)",
												"&:hover": { bgcolor: "rgba(100, 255, 218, 0.3)" },
											}}
										>
											Income
										</Button>
										<Button
											onClick={() => {
												setMode("EXPENSE");
												setPage(0);
											}}
											sx={{
												px: 0.5,
												py: 0,
												fontSize: "0.56rem",
												fontWeight: 800,
												bgcolor:
													mode === "EXPENSE"
														? "rgba(255, 82, 82, 0.2)"
														: "transparent",
												color:
													mode === "EXPENSE"
														? "#FF5252"
														: "rgba(255, 255, 255, 0.4)",
												borderColor: "rgba(255, 255, 255, 0.12)",
												"&:hover": { bgcolor: "rgba(255, 82, 82, 0.3)" },
											}}
										>
											Expense
										</Button>
										<Button
											onClick={() => {
												setMode("NET");
												setPage(0);
											}}
											sx={{
												px: 0.5,
												py: 0,
												fontSize: "0.56rem",
												fontWeight: 800,
												bgcolor:
													mode === "NET"
														? "rgba(123, 104, 238, 0.2)"
														: "transparent",
												color:
													mode === "NET"
														? "#7B68EE"
														: "rgba(255, 255, 255, 0.4)",
												borderColor: "rgba(255, 255, 255, 0.12)",
												"&:hover": { bgcolor: "rgba(123, 104, 238, 0.3)" },
											}}
										>
											Net
										</Button>
										<Button
											onClick={() => {
												setMode("VOLUME");
												setPage(0);
											}}
											sx={{
												px: 0.5,
												py: 0,
												fontSize: "0.56rem",
												fontWeight: 800,
												bgcolor:
													mode === "VOLUME"
														? "rgba(255, 255, 255, 0.15)"
														: "transparent",
												color:
													mode === "VOLUME"
														? "white"
														: "rgba(255, 255, 255, 0.4)",
												borderColor: "rgba(255, 255, 255, 0.12)",
												"&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
											}}
										>
											Vol
										</Button>
									</ButtonGroup>
								</Box>
							</Box>
						</Box>
					</Box>
					<Box component="tbody">
						{paginatedPartners.map((p, i) => {
							let displayVal = 0;
							let color = SEMANTIC_COLORS.neonGreen;
							let prefix = "";

							if (mode === "INCOME") {
								displayVal = p.income || 0;
								prefix = displayVal > 0 ? "+" : "";
								color = SEMANTIC_COLORS.neonGreen;
							} else if (mode === "EXPENSE") {
								displayVal = p.expense || 0;
								prefix = displayVal > 0 ? "-" : "";
								color = SEMANTIC_COLORS.neonRed;
							} else if (mode === "NET") {
								displayVal = p.net || 0;
								prefix = displayVal > 0 ? "+" : "";
								color =
									displayVal >= 0
										? SEMANTIC_COLORS.neonGreen
										: SEMANTIC_COLORS.neonRed;
							} else {
								displayVal = p.volume || 0;
								color = "rgba(255, 255, 255, 0.9)";
							}

							return (
								<Box
									component="tr"
									key={`${p.code}-${i}`}
									onClick={() =>
										onRowClick({ PartnerCode: p.code, PartnerName: p.name })
									}
									sx={{
										borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
										cursor: "pointer",
										transition: "background-color 0.15s ease",
										"&:hover": {
											backgroundColor: "rgba(123, 104, 238, 0.08)",
										},
									}}
								>
									<Box component="td" sx={{ padding: "6px 10px" }}>
										<Typography
											sx={{
												fontSize: "0.75rem",
												fontWeight: 700,
												color: "rgba(255, 255, 255, 0.9)",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											{p.name || p.code}
										</Typography>
									</Box>
									<Box
										component="td"
										sx={{
											padding: "6px 10px",
											textAlign: "right",
											fontFamily: "monospace",
											fontSize: "0.75rem",
											fontWeight: 700,
											color,
										}}
									>
										{prefix}
										{formatCurrency(displayVal)} {currency}
									</Box>
								</Box>
							);
						})}
					</Box>
				</Box>
			</Box>

			{/* Pagination Control Bar */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					px: 1,
					py: 0.4,
					borderTop: "1px solid rgba(255,255,255,0.06)",
					bgcolor: "rgba(0,0,0,0.4)",
				}}
			>
				<Typography
					variant="caption"
					sx={{
						color: "rgba(255,255,255,0.4)",
						fontSize: "0.64rem",
						fontFamily: "monospace",
					}}
				>
					Page {page + 1} of {totalPages}
				</Typography>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<IconButton
						size="small"
						disabled={page === 0}
						onClick={() => setPage((p) => Math.max(0, p - 1))}
						sx={{ color: "white", p: 0.2, "&.Mui-disabled": { opacity: 0.3 } }}
					>
						<ChevronLeftIcon fontSize="small" />
					</IconButton>
					<IconButton
						size="small"
						disabled={page >= totalPages - 1}
						onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
						sx={{ color: "white", p: 0.2, "&.Mui-disabled": { opacity: 0.3 } }}
					>
						<ChevronRightIcon fontSize="small" />
					</IconButton>
				</Box>
			</Box>
		</Box>
	);
};

export const ActivityTableContent = TableSection;
