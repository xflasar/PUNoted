import React, { useState, useMemo } from "react";
import {
	Box,
	Typography,
	Chip,
	Tooltip,
	IconButton,
	Collapse,
	LinearProgress,
	Button,
	ButtonGroup,
	Skeleton,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import SpeedIcon from "@mui/icons-material/Speed";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CategoryIcon from "@mui/icons-material/Category";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import BarChartIcon from "@mui/icons-material/BarChart";

import { FlexCard } from "./sharedui";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";
import { LiquidityTrendChart, VelocityBarChart } from "./chartssection";

interface CashFlowTabProps {
	historyData?: any[];
	currency: string;
	currentData?: any;
	transactions?: any[];
	timeRange?: string;
	loading?: boolean;
	onSelectTx?: (tx: any) => void;
}

interface ClusterGroup {
	id: string;
	category: string;
	totalAmount: number;
	count: number;
	latestTimestamp: string;
	transactions: any[];
}

export const CashFlowTab: React.FC<CashFlowTabProps> = ({
	historyData = [],
	currency = "ICA",
	currentData,
	transactions = [],
	timeRange = "30D",
	loading = false,
	onSelectTx,
}) => {
	const [mainChartView, setMainChartView] = useState<"LIQUIDITY" | "VELOCITY">(
		"LIQUIDITY",
	);
	const [expandedSection, setExpandedSection] = useState<
		"NONE" | "INFLOW" | "OUTFLOW"
	>("NONE");
	const [expandedGroupIds, setExpandedGroupIds] = useState<
		Record<string, boolean>
	>({});

	const handleSectionToggle = (section: "INFLOW" | "OUTFLOW") => {
		setExpandedSection((prev) => (prev === section ? "NONE" : section));
	};

	const toggleGroupExpand = (groupId: string) => {
		setExpandedGroupIds((prev) => ({
			...prev,
			[groupId]: !prev[groupId],
		}));
	};

	// Process Transactions into Inflows, Outflows, Net Flow, Velocity, and Clustered Groups
	const {
		totalInflow,
		totalOutflow,
		netCashFlow,
		inflowTxCount,
		outflowTxCount,
		inflowClusters,
		outflowClusters,
		dailyVelocityData,
		velocityRatio,
		velocityStatus,
	} = useMemo(() => {
		const rawTxs: any[] =
			transactions && transactions.length > 0
				? transactions
				: currentData?.Transactions || [];

		let inflow = 0;
		let outflow = 0;
		let inCount = 0;
		let outCount = 0;

		const inflowMap = new Map<
			string,
			{ total: number; count: number; latest: string; txs: any[] }
		>();
		const outflowMap = new Map<
			string,
			{ total: number; count: number; latest: string; txs: any[] }
		>();
		const dailyMap = new Map<
			string,
			{ Income: number; Expense: number; timestamp: number }
		>();

		rawTxs.forEach((tx) => {
			const amt = Number(tx.Amount || tx.amount || 0);
			const rawDate =
				tx.Timestamp || tx.date || tx.timestamp || new Date().toISOString();
			const txTime = new Date(rawDate).getTime();
			const dateLabel = rawDate
				? new Date(rawDate).toLocaleDateString(undefined, {
						month: "short",
						day: "numeric",
					})
				: "Date";

			let rawCat = (
				tx.Category ||
				tx.category ||
				tx.Type ||
				tx.type ||
				"General"
			).trim();
			const fullTypeStr =
				`${tx.Type || ""} ${tx.Category || ""} ${tx.Description || ""}`.toUpperCase();

			let cat = rawCat;
			if (fullTypeStr.includes("LOAN")) {
				if (fullTypeStr.includes("PUBLIC")) {
					cat = "Public Loans";
				} else {
					cat = "Corporate Loans";
				}
			}

			const existingDaily = dailyMap.get(dateLabel) || {
				Income: 0,
				Expense: 0,
				timestamp: txTime,
			};

			if (amt > 0) {
				inflow += amt;
				inCount++;
				existingDaily.Income += amt;

				const grp = inflowMap.get(cat) || {
					total: 0,
					count: 0,
					latest: rawDate,
					txs: [],
				};
				grp.total += amt;
				grp.count += 1;
				grp.txs.push(tx);
				if (new Date(rawDate) > new Date(grp.latest)) grp.latest = rawDate;
				inflowMap.set(cat, grp);
			} else if (amt < 0) {
				const posAmt = Math.abs(amt);
				outflow += posAmt;
				outCount++;
				existingDaily.Expense += posAmt;

				const grp = outflowMap.get(cat) || {
					total: 0,
					count: 0,
					latest: rawDate,
					txs: [],
				};
				grp.total += posAmt;
				grp.count += 1;
				grp.txs.push(tx);
				if (new Date(rawDate) > new Date(grp.latest)) grp.latest = rawDate;
				outflowMap.set(cat, grp);
			}
			dailyMap.set(dateLabel, existingDaily);
		});

		const dailyVelocityData = Array.from(dailyMap.entries())
			.map(([name, vals]) => ({
				name,
				Income: vals.Income,
				Expense: vals.Expense,
				timestamp: vals.timestamp,
			}))
			.sort((a, b) => a.timestamp - b.timestamp);

		const inflowClusters: ClusterGroup[] = Array.from(inflowMap.entries())
			.map(([category, val]) => ({
				id: `in_${category}`,
				category,
				totalAmount: val.total,
				count: val.count,
				latestTimestamp: val.latest,
				transactions: val.txs.sort(
					(a, b) =>
						new Date(b.Timestamp || 0).getTime() -
						new Date(a.Timestamp || 0).getTime(),
				),
			}))
			.sort((a, b) => b.totalAmount - a.totalAmount);

		const outflowClusters: ClusterGroup[] = Array.from(outflowMap.entries())
			.map(([category, val]) => ({
				id: `out_${category}`,
				category,
				totalAmount: val.total,
				count: val.count,
				latestTimestamp: val.latest,
				transactions: val.txs.sort(
					(a, b) =>
						new Date(b.Timestamp || 0).getTime() -
						new Date(a.Timestamp || 0).getTime(),
				),
			}))
			.sort((a, b) => b.totalAmount - a.totalAmount);

		const net = inflow - outflow;
		const turnover = inflow + outflow;
		const liquid = Math.max(
			1,
			Number(currentData?.Liquid || currentData?.liquid || 1),
		);
		const ratioNum = turnover / liquid;
		const velocityRatioStr = ratioNum.toFixed(2);

		const velocityStatus =
			ratioNum >= 2.0
				? {
						label: "Fast Cycling",
						color: SEMANTIC_COLORS.neonGreen,
						bg: "rgba(74, 222, 128, 0.15)",
					}
				: ratioNum >= 0.8
					? {
							label: "Moderate",
							color: "#7b68ee",
							bg: "rgba(123, 104, 238, 0.15)",
						}
					: {
							label: "Stagnant",
							color: "#f59e0b",
							bg: "rgba(245, 158, 11, 0.15)",
						};

		return {
			totalInflow: inflow,
			totalOutflow: outflow,
			netCashFlow: net,
			inflowTxCount: inCount,
			outflowTxCount: outCount,
			inflowClusters,
			outflowClusters,
			dailyVelocityData,
			velocityRatio: velocityRatioStr,
			velocityStatus,
		};
	}, [transactions, currentData]);

	const velocityGuide = `Capital Velocity (${velocityRatio}x):
• Turnover (${timeRange}): ${formatCurrency(totalInflow + totalOutflow)} ${currency}
• Reserves: ${formatCurrency(currentData?.Liquid || 0)} ${currency}
Measures capital turnover speed per liquid reserve. Linked to active timeframe ${timeRange}.`;

	return (
		<Box
			sx={{
				height: "100%",
				width: "100%",
				overflowY: "auto",
				display: "flex",
				flexDirection: "column",
				gap: 1,
				pr: 0.5,
				"&::-webkit-scrollbar": { width: "3px" },
				"&::-webkit-scrollbar-thumb": {
					backgroundColor: "rgba(123, 104, 238, 0.3)",
					borderRadius: "4px",
				},
			}}
		>
			{/* 1. Main Featured Chart Container with Swap View Toggle */}
			<Box
				sx={{
					position: "relative",
					minHeight: 200,
					height: 230,
					width: "100%",
					flexShrink: 0,
				}}
			>
				{/* Top Right Chart View Selector Button Group */}
				<Box sx={{ position: "absolute", top: 8, right: 12, zIndex: 5 }}>
					<ButtonGroup
						size="small"
						variant="outlined"
						sx={{
							bgcolor: "rgba(4, 4, 10, 0.85)",
							backdropFilter: "blur(10px)",
							borderRadius: "6px",
						}}
					>
						<Button
							onClick={() => setMainChartView("LIQUIDITY")}
							startIcon={<ShowChartIcon sx={{ fontSize: 13 }} />}
							sx={{
								fontSize: "0.60rem",
								fontWeight: 800,
								py: 0.2,
								px: 0.8,
								color:
									mainChartView === "LIQUIDITY"
										? "white"
										: "rgba(255,255,255,0.5)",
								bgcolor:
									mainChartView === "LIQUIDITY" ? "#7b68ee" : "transparent",
								borderColor: "rgba(123, 104, 238, 0.3)",
								"&:hover": { bgcolor: "#6956e0" },
							}}
						>
							Liquidity
						</Button>
						<Button
							onClick={() => setMainChartView("VELOCITY")}
							startIcon={<BarChartIcon sx={{ fontSize: 13 }} />}
							sx={{
								fontSize: "0.60rem",
								fontWeight: 800,
								py: 0.2,
								px: 0.8,
								color:
									mainChartView === "VELOCITY"
										? "white"
										: "rgba(255,255,255,0.5)",
								bgcolor:
									mainChartView === "VELOCITY" ? "#7b68ee" : "transparent",
								borderColor: "rgba(123, 104, 238, 0.3)",
								"&:hover": { bgcolor: "#6956e0" },
							}}
						>
							Velocity
						</Button>
					</ButtonGroup>
				</Box>

				{/* Active Chart Component */}
				{mainChartView === "LIQUIDITY" ? (
					<LiquidityTrendChart
						historyData={historyData}
						currency={currency}
						timeRange={timeRange}
					/>
				) : (
					<VelocityBarChart
						incomeExpense30D={dailyVelocityData}
						timeRange={timeRange}
					/>
				)}
			</Box>

			{/* 2. Middle Section: Inflow / Outflow / Net Position Summary Cards */}
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
					gap: 0.75,
					flexShrink: 0,
				}}
			>
				{/* Inflow Card */}
				<FlexCard
					onClick={() => handleSectionToggle("INFLOW")}
					sx={{
						p: 1,
						display: "flex",
						flexDirection: "column",
						borderLeft: "2px solid #4ade80",
						bgcolor:
							expandedSection === "INFLOW"
								? "rgba(74, 222, 128, 0.1)"
								: "rgba(4, 4, 10, 0.65)",
						cursor: "pointer",
						"&:hover": { bgcolor: "rgba(74, 222, 128, 0.08)" },
						transition: "all 0.15s ease",
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							mb: 0.25,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<ArrowUpwardIcon
								sx={{ color: SEMANTIC_COLORS.neonGreen, fontSize: 14 }}
							/>
							<Typography
								sx={{
									fontSize: "0.66rem",
									fontWeight: 800,
									textTransform: "uppercase",
									color: "rgba(255,255,255,0.6)",
									letterSpacing: "0.05em",
								}}
							>
								Cash Inflow ({timeRange})
							</Typography>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<Chip
								label={`${inflowTxCount} txs`}
								size="small"
								sx={{
									height: 14,
									fontSize: "0.52rem",
									fontWeight: 800,
									bgcolor: "rgba(74, 222, 128, 0.12)",
									color: SEMANTIC_COLORS.neonGreen,
								}}
							/>
							<IconButton
								size="small"
								sx={{
									p: 0.1,
									color:
										expandedSection === "INFLOW"
											? SEMANTIC_COLORS.neonGreen
											: "rgba(255,255,255,0.5)",
								}}
							>
								{expandedSection === "INFLOW" ? (
									<KeyboardArrowUpIcon sx={{ fontSize: 14 }} />
								) : (
									<KeyboardArrowDownIcon sx={{ fontSize: 14 }} />
								)}
							</IconButton>
						</Box>
					</Box>
					<Typography
						sx={{
							fontSize: { xs: "0.92rem", sm: "1.05rem" },
							fontFamily: "monospace",
							fontWeight: 800,
							color: SEMANTIC_COLORS.neonGreen,
							lineHeight: 1.2,
						}}
					>
						{loading ? (
							<Skeleton
								variant="text"
								width={110}
								height={24}
								sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
							/>
						) : (
							<>
								+{formatCurrency(totalInflow)}{" "}
								<Typography
									component="span"
									sx={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.5)" }}
								>
									{currency}
								</Typography>
							</>
						)}
					</Typography>
				</FlexCard>

				{/* Outflow Card */}
				<FlexCard
					onClick={() => handleSectionToggle("OUTFLOW")}
					sx={{
						p: 1,
						display: "flex",
						flexDirection: "column",
						borderLeft: "2px solid #f87171",
						bgcolor:
							expandedSection === "OUTFLOW"
								? "rgba(248, 113, 113, 0.1)"
								: "rgba(4, 4, 10, 0.65)",
						cursor: "pointer",
						"&:hover": { bgcolor: "rgba(248, 113, 113, 0.08)" },
						transition: "all 0.15s ease",
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							mb: 0.25,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<ArrowDownwardIcon
								sx={{ color: SEMANTIC_COLORS.neonRed, fontSize: 14 }}
							/>
							<Typography
								sx={{
									fontSize: "0.66rem",
									fontWeight: 800,
									textTransform: "uppercase",
									color: "rgba(255,255,255,0.6)",
									letterSpacing: "0.05em",
								}}
							>
								Cash Outflow ({timeRange})
							</Typography>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<Chip
								label={`${outflowTxCount} txs`}
								size="small"
								sx={{
									height: 14,
									fontSize: "0.52rem",
									fontWeight: 800,
									bgcolor: "rgba(248, 113, 113, 0.12)",
									color: SEMANTIC_COLORS.neonRed,
								}}
							/>
							<IconButton
								size="small"
								sx={{
									p: 0.1,
									color:
										expandedSection === "OUTFLOW"
											? SEMANTIC_COLORS.neonRed
											: "rgba(255,255,255,0.5)",
								}}
							>
								{expandedSection === "OUTFLOW" ? (
									<KeyboardArrowUpIcon sx={{ fontSize: 14 }} />
								) : (
									<KeyboardArrowDownIcon sx={{ fontSize: 14 }} />
								)}
							</IconButton>
						</Box>
					</Box>
					<Typography
						sx={{
							fontSize: { xs: "0.92rem", sm: "1.05rem" },
							fontFamily: "monospace",
							fontWeight: 800,
							color: SEMANTIC_COLORS.neonRed,
							lineHeight: 1.2,
						}}
					>
						{loading ? (
							<Skeleton
								variant="text"
								width={110}
								height={24}
								sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
							/>
						) : (
							<>
								{totalOutflow > 0
									? `-${formatCurrency(totalOutflow)}`
									: formatCurrency(0)}{" "}
								<Typography
									component="span"
									sx={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.5)" }}
								>
									{currency}
								</Typography>
							</>
						)}
					</Typography>
				</FlexCard>

				{/* Net Position Card */}
				<FlexCard
					sx={{
						p: 1,
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						borderLeft: `2px solid ${netCashFlow >= 0 ? "#4ade80" : "#f87171"}`,
						bgcolor: "rgba(4, 4, 10, 0.65)",
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							mb: 0.25,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<AccountBalanceWalletIcon
								sx={{
									color:
										netCashFlow >= 0
											? SEMANTIC_COLORS.neonGreen
											: SEMANTIC_COLORS.neonRed,
									fontSize: 14,
								}}
							/>
							<Typography
								sx={{
									fontSize: "0.66rem",
									fontWeight: 800,
									textTransform: "uppercase",
									color: "rgba(255,255,255,0.6)",
									letterSpacing: "0.05em",
								}}
							>
								Net Position
							</Typography>
						</Box>
						<Chip
							label={netCashFlow >= 0 ? "Surplus" : "Deficit"}
							size="small"
							sx={{
								height: 14,
								fontSize: "0.52rem",
								fontWeight: 800,
								bgcolor:
									netCashFlow >= 0
										? "rgba(74, 222, 128, 0.12)"
										: "rgba(248, 113, 113, 0.12)",
								color:
									netCashFlow >= 0
										? SEMANTIC_COLORS.neonGreen
										: SEMANTIC_COLORS.neonRed,
							}}
						/>
					</Box>
					<Typography
						sx={{
							fontSize: { xs: "0.92rem", sm: "1.05rem" },
							fontFamily: "monospace",
							fontWeight: 800,
							color:
								netCashFlow >= 0
									? SEMANTIC_COLORS.neonGreen
									: SEMANTIC_COLORS.neonRed,
							lineHeight: 1.2,
						}}
					>
						{loading ? (
							<Skeleton
								variant="text"
								width={110}
								height={24}
								sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
							/>
						) : (
							<>
								{netCashFlow > 0
									? `+${formatCurrency(netCashFlow)}`
									: netCashFlow < 0
										? `-${formatCurrency(Math.abs(netCashFlow))}`
										: formatCurrency(0)}{" "}
								<Typography
									component="span"
									sx={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.5)" }}
								>
									{currency}
								</Typography>
							</>
						)}
					</Typography>
				</FlexCard>
			</Box>

			{/* Collapsible Clustered Transactions Section */}
			<Collapse
				in={expandedSection !== "NONE"}
				timeout="auto"
				unmountOnExit
				sx={{ flexShrink: 0 }}
			>
				<FlexCard
					sx={{
						p: 1.25,
						bgcolor: "rgba(4, 4, 10, 0.85)",
						border: "1px solid rgba(123, 104, 238, 0.2)",
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							mb: 1,
							pb: 0.5,
							borderBottom: "1px solid rgba(255,255,255,0.08)",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
							<CategoryIcon
								sx={{
									fontSize: 16,
									color:
										expandedSection === "INFLOW"
											? SEMANTIC_COLORS.neonGreen
											: SEMANTIC_COLORS.neonRed,
								}}
							/>
							<Typography
								sx={{ fontSize: "0.78rem", fontWeight: 800, color: "white" }}
							>
								{expandedSection === "INFLOW"
									? "Cash Inflow Breakdown"
									: "Cash Outflow Breakdown"}{" "}
								({timeRange})
							</Typography>
						</Box>
						<IconButton
							size="small"
							onClick={() => setExpandedSection("NONE")}
							sx={{ color: "rgba(255,255,255,0.5)", p: 0.1 }}
						>
							<KeyboardArrowUpIcon fontSize="small" />
						</IconButton>
					</Box>

					{/* Group Cards Matching Market Exposure List Style */}
					<Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
						{(expandedSection === "INFLOW"
							? inflowClusters
							: outflowClusters
						).map((group, groupIdx) => {
							const targetTotal =
								expandedSection === "INFLOW" ? totalInflow : totalOutflow;
							const sharePct =
								targetTotal > 0
									? ((group.totalAmount / targetTotal) * 100).toFixed(1)
									: "0";
							const isExpanded = Boolean(expandedGroupIds[group.id]);

							return (
								<Box
									key={`${group.id}_${groupIdx}`}
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
										onClick={() => toggleGroupExpand(group.id)}
										sx={{
											cursor: "pointer",
											display: "flex",
											flexDirection: "column",
											gap: 0.5,
										}}
									>
										{/* Row 1: Category Name (left) & Category Chip (right) */}
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
												<IconButton
													size="small"
													onClick={(e) => {
														e.stopPropagation();
														toggleGroupExpand(group.id);
													}}
													sx={{ p: 0, color: "rgba(255,255,255,0.6)" }}
												>
													{isExpanded ? (
														<KeyboardArrowUpIcon fontSize="small" />
													) : (
														<KeyboardArrowDownIcon fontSize="small" />
													)}
												</IconButton>
												<Typography
													sx={{
														fontSize: "0.86rem",
														fontWeight: 800,
														color: "white",
													}}
												>
													{group.category}
												</Typography>
											</Box>

											<Chip
												label={`${group.count} Txs`}
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

										{/* Row 2: Amount & Share % */}
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
												}}
											>
												Net{" "}
												{expandedSection === "INFLOW" ? "Inflow" : "Outflow"}
											</Typography>
											<Typography
												sx={{
													fontSize: "0.92rem",
													fontFamily: "monospace",
													fontWeight: 800,
													color:
														expandedSection === "INFLOW"
															? SEMANTIC_COLORS.neonGreen
															: SEMANTIC_COLORS.neonRed,
												}}
											>
												{expandedSection === "INFLOW" ? "+" : "-"}
												{formatCurrency(group.totalAmount)} {currency}
											</Typography>
										</Box>

										{/* Row 3: Share Progress Bar & Latest Date */}
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												pt: 0.4,
												borderTop: "1px dashed rgba(255, 255, 255, 0.07)",
												gap: 1,
											}}
										>
											<Box
												sx={{
													flex: 1,
													display: "flex",
													alignItems: "center",
													gap: 0.75,
												}}
											>
												<LinearProgress
													variant="determinate"
													value={Math.min(100, Number(sharePct))}
													sx={{
														flex: 1,
														height: 4,
														borderRadius: 2,
														bgcolor: "rgba(255,255,255,0.08)",
														"& .MuiLinearProgress-bar": {
															bgcolor:
																expandedSection === "INFLOW"
																	? SEMANTIC_COLORS.neonGreen
																	: SEMANTIC_COLORS.neonRed,
														},
													}}
												/>
												<Typography
													sx={{
														fontSize: "0.64rem",
														fontFamily: "monospace",
														color: "rgba(255,255,255,0.6)",
													}}
												>
													{sharePct}%
												</Typography>
											</Box>
											<Typography
												sx={{
													fontSize: "0.65rem",
													color: "rgba(255,255,255,0.4)",
													flexShrink: 0,
												}}
											>
												Latest:{" "}
												{new Date(group.latestTimestamp).toLocaleDateString()}
											</Typography>
										</Box>
									</Box>

									{/* Expanded Sub-transactions */}
									<Collapse in={isExpanded} timeout="auto" unmountOnExit>
										<Box
											sx={{
												mt: 0.75,
												pt: 0.75,
												borderTop: "1px solid rgba(123, 104, 238, 0.2)",
												display: "flex",
												flexDirection: "column",
												gap: 0.5,
												maxHeight: 260,
												overflowY: "auto",
												pr: 0.5,
											}}
										>
											{group.transactions.map((subTx, subIdx) => {
												const uniqueKey = `${group.id}_tx_${subTx.id || subTx.Id || "t"}_${subTx.Timestamp || subIdx}_${subIdx}`;
												return (
													<Box
														key={uniqueKey}
														onClick={(e) => {
															e.stopPropagation();
															if (onSelectTx) onSelectTx(subTx);
														}}
														sx={{
															p: 0.75,
															borderRadius: "6px",
															bgcolor: "rgba(0,0,0,0.35)",
															border: "1px solid rgba(255,255,255,0.04)",
															display: "flex",
															flexDirection: "column",
															gap: 0.4,
															cursor: onSelectTx ? "pointer" : "default",
															"&:hover": {
																bgcolor: "rgba(123, 104, 238, 0.15)",
															},
														}}
													>
														{/* Line 1: Partner / Code (left) & Amount (right) */}
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
																	gap: 0.75,
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
																	{subTx.PartnerCode ||
																		subTx.PartnerName ||
																		`#Tx-${(subTx.id || subTx.Id || "").toString().substring(0, 8)}`}
																</Typography>
																{(() => {
																	const typeStr =
																		`${subTx.Type || ""} ${subTx.Category || ""} ${subTx.Description || ""}`.toUpperCase();
																	if (typeStr.includes("LOAN")) {
																		const isPublic = typeStr.includes("PUBLIC");
																		return (
																			<Chip
																				label={
																					isPublic ? "PUBLIC LOAN" : "CORP LOAN"
																				}
																				size="small"
																				sx={{
																					height: 14,
																					fontSize: "0.50rem",
																					fontWeight: 800,
																					bgcolor: isPublic
																						? "rgba(56, 189, 248, 0.18)"
																						: "rgba(168, 85, 247, 0.18)",
																					color: isPublic
																						? "#38bdf8"
																						: "#a855f7",
																					border: `1px solid ${isPublic ? "rgba(56, 189, 248, 0.4)" : "rgba(168, 85, 247, 0.4)"}`,
																				}}
																			/>
																		);
																	}
																	return null;
																})()}
															</Box>
															<Typography
																sx={{
																	fontSize: "0.76rem",
																	fontFamily: "monospace",
																	fontWeight: 800,
																	color:
																		Number(subTx.Amount || 0) >= 0
																			? SEMANTIC_COLORS.neonGreen
																			: SEMANTIC_COLORS.neonRed,
																}}
															>
																{Number(subTx.Amount || 0) >= 0 ? "+" : ""}
																{formatCurrency(Number(subTx.Amount || 0))}{" "}
																{currency}
															</Typography>
														</Box>

														{/* Line 2: Description (left) & Date (right) */}
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
																	fontSize: "0.66rem",
																	color: "rgba(255,255,255,0.6)",
																	whiteSpace: "nowrap",
																	overflow: "hidden",
																	textOverflow: "ellipsis",
																}}
															>
																{subTx.Description ||
																	subTx.Type ||
																	"Transaction"}
															</Typography>
															<Typography
																sx={{
																	fontSize: "0.64rem",
																	color: "rgba(255,255,255,0.4)",
																}}
															>
																{new Date(
																	subTx.Timestamp || subTx.date || Date.now(),
																).toLocaleDateString()}
															</Typography>
														</Box>
													</Box>
												);
											})}
										</Box>
									</Collapse>
								</Box>
							);
						})}
					</Box>
				</FlexCard>
			</Collapse>

			{/* 3. Bottom Section: Capital Velocity Metric & Complementary View Chart */}
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.6fr" },
					gap: 0.75,
					minHeight: 220,
					flexShrink: 0,
				}}
			>
				{/* Capital Velocity Card */}
				<FlexCard
					sx={{
						p: 1.25,
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						bgcolor: "rgba(4, 4, 10, 0.65)",
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<SpeedIcon sx={{ color: "#7b68ee", fontSize: 16 }} />
							<Typography
								sx={{
									fontSize: "0.72rem",
									fontWeight: 800,
									textTransform: "uppercase",
									color: "white",
									letterSpacing: "0.05em",
								}}
							>
								Capital Velocity
							</Typography>
						</Box>
						<Tooltip title={velocityGuide} arrow placement="top">
							<IconButton
								size="small"
								sx={{ color: "rgba(255,255,255,0.4)", p: 0.1 }}
							>
								<InfoOutlinedIcon sx={{ fontSize: 13 }} />
							</IconButton>
						</Tooltip>
					</Box>

					<Box sx={{ my: 0.5 }}>
						<Typography
							sx={{
								fontSize: "1.75rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: "#7b68ee",
								lineHeight: 1,
							}}
						>
							{velocityRatio}x
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.4)",
								fontSize: "0.62rem",
								mt: 0.25,
								display: "block",
							}}
						>
							Capital turnover rate ({timeRange})
						</Typography>
					</Box>

					<Box
						sx={{
							pt: 0.75,
							borderTop: "1px solid rgba(255,255,255,0.06)",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<Chip
							label={velocityStatus.label}
							size="small"
							sx={{
								height: 16,
								fontSize: "0.55rem",
								fontWeight: 800,
								bgcolor: velocityStatus.bg,
								color: velocityStatus.color,
							}}
						/>
						<Typography
							sx={{
								fontSize: "0.62rem",
								fontFamily: "monospace",
								color: "rgba(255,255,255,0.4)",
							}}
						>
							Liquid: {formatCurrency(currentData?.Liquid || 0)} {currency}
						</Typography>
					</Box>
				</FlexCard>

				{/* Complementary Secondary Chart */}
				<Box sx={{ height: 220, minHeight: 220 }}>
					{mainChartView === "LIQUIDITY" ? (
						<VelocityBarChart
							incomeExpense30D={dailyVelocityData}
							timeRange={timeRange}
						/>
					) : (
						<LiquidityTrendChart
							historyData={historyData}
							currency={currency}
							timeRange={timeRange}
						/>
					)}
				</Box>
			</Box>
		</Box>
	);
};
