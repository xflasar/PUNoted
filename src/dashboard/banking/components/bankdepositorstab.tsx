import React, { useEffect, useState, useCallback } from "react";
import {
	Box,
	Paper,
	Typography,
	Chip,
	IconButton,
	Collapse,
	CircularProgress,
	TextField,
	InputAdornment,
	Divider,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import SearchIcon from "@mui/icons-material/Search";
import type { Bank, DepositorSummary, BankYieldMetrics } from "../types";
import { formatBankDate } from "../helpers";
import { formatAmount } from "../../../utils/formaters";
import { fetchClient } from "../../../utils/apiclient";
import { HelpOutlineOutlined } from "@mui/icons-material";

interface BankDepositorsTabProps {
	bank: Bank;
	isMyBank?: boolean;
}

export const BankDepositorsTab: React.FC<BankDepositorsTabProps> = ({
	bank,
}) => {
	const theme = useTheme();
	const [depositors, setDepositors] = useState<DepositorSummary[]>([]);
	const [metrics, setMetrics] = useState<BankYieldMetrics | null>(null);
	const [loading, setLoading] = useState(true);
	const [expandedUser, setExpandedUser] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	const loadDepositors = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetchClient(
				`/internal/banking/depositors?bank_id=${bank.id}`,
			);
			if (res.ok) {
				const data = await res.json();
				if (data && data.metrics && data.depositors) {
					setMetrics(data.metrics);
					setDepositors(data.depositors);
				} else if (Array.isArray(data)) {
					setDepositors(data);
				}
			}
		} catch (e) {
			console.error("Failed to load depositors", e);
		} finally {
			setLoading(false);
		}
	}, [bank.id]);

	useEffect(() => {
		loadDepositors();
	}, [loadDepositors]);

	const currency = bank.currency || "ICA";

	const filteredDepositors = depositors.filter((d) =>
		!searchQuery.trim()
			? true
			: d.username.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	if (loading && !metrics) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
				<CircularProgress size={28} color="primary" />
			</Box>
		);
	}

	const weeklyYieldRate = metrics?.weekly_yield_rate ?? 1.5;
	const daysElapsed = metrics?.days_elapsed_in_cycle ?? 0.0;
	const estPayoutPool = metrics?.est_weekly_payout_pool ?? 0.0;

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
			{/* Compact Top Bar: Rate, Unified Weekly Cycle & Est. Payout */}
			<Paper
				elevation={0}
				sx={{
					p: 1.5,
					borderRadius: 1.5,
					bgcolor: alpha(theme.palette.background.paper, 0.35),
					border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 1.5,
				}}
			>
				{/* Left: Clean inline stats */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						flexWrap: "wrap",
						gap: 2.5,
					}}
				>
					<Box>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontSize: "0.65rem",
								fontWeight: 700,
								display: "block",
							}}
						>
							WEEKLY YIELD RATE
						</Typography>
						<Typography
							variant="body2"
							sx={{ fontWeight: 800, color: "success.main" }}
						>
							+{weeklyYieldRate}%{" "}
							<span
								style={{
									fontSize: "0.7rem",
									color: theme.palette.text.secondary,
								}}
							>
								/ wk
							</span>
						</Typography>
					</Box>

					<Divider
						orientation="vertical"
						flexItem
						sx={{ borderColor: alpha(theme.palette.divider, 0.15) }}
					/>

					<Tooltip
						title="Global cycle progress: Days elapsed since Monday 00:00 UTC. The cycle closes and distributes dividends automatically at Day 7.0."
						arrow
					>
						<Box sx={{ cursor: "help" }}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontSize: "0.65rem",
										fontWeight: 700,
										display: "block",
									}}
								>
									WEEKLY CYCLE (GLOBAL)
								</Typography>
								<HelpOutlineOutlined
									sx={{ fontSize: 11, color: "text.secondary" }}
								/>
							</Box>
							<Typography
								variant="body2"
								sx={{ fontWeight: 800, color: "text.primary" }}
							>
								Day {daysElapsed}{" "}
								<span
									style={{
										fontSize: "0.7rem",
										color: theme.palette.text.secondary,
									}}
								>
									/ 7.0 (Resets Mon 00:00 UTC)
								</span>
							</Typography>
						</Box>
					</Tooltip>

					<Divider
						orientation="vertical"
						flexItem
						sx={{ borderColor: alpha(theme.palette.divider, 0.15) }}
					/>

					<Box>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontSize: "0.65rem",
								fontWeight: 700,
								display: "block",
							}}
						>
							EST. CYCLE PAYOUT
						</Typography>
						<Typography
							variant="body2"
							sx={{ fontWeight: 800, color: "warning.main" }}
						>
							+{formatAmount(estPayoutPool)}{" "}
							<span
								style={{
									fontSize: "0.7rem",
									color: theme.palette.text.secondary,
								}}
							>
								{currency}
							</span>
						</Typography>
					</Box>
				</Box>

				{/* Right: Search */}
				<TextField
					size="small"
					placeholder="Search depositor..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
								</InputAdornment>
							),
							sx: { fontSize: "0.75rem", height: 32 },
						},
					}}
					sx={{ width: { xs: "100%", sm: 220 } }}
				/>
			</Paper>

			{/* Compact Shareholders & Depositors Table */}
			<Paper
				elevation={0}
				sx={{
					borderRadius: 1.5,
					bgcolor: alpha(theme.palette.background.paper, 0.25),
					border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
					overflow: "hidden",
				}}
			>
				<TableContainer sx={{ maxHeight: 520 }}>
					<Table stickyHeader size="small">
						<TableHead>
							<TableRow>
								<TableCell
									sx={{
										fontWeight: 800,
										py: 1,
										bgcolor: "background.paper",
										fontSize: "0.72rem",
									}}
								>
									SHAREHOLDER
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										py: 1,
										bgcolor: "background.paper",
										fontSize: "0.72rem",
									}}
								>
									DEPOSIT BALANCE
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										py: 1,
										bgcolor: "background.paper",
										fontSize: "0.72rem",
									}}
								>
									POOL SHARE
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										py: 1,
										bgcolor: "background.paper",
										fontSize: "0.72rem",
									}}
								>
									<Tooltip
										title="Yield Weight: Proportion of the 7-day cycle this shareholder's balance qualifies for interest (7.0/7d = 100% full payout if deposited before Monday cycle start; mid-cycle deposits are time-weighted to prevent dividend gaming)."
										arrow
									>
										<Box
											sx={{
												display: "inline-flex",
												alignItems: "center",
												gap: 0.4,
												cursor: "help",
											}}
										>
											<span>YIELD WEIGHT</span>
											<HelpOutlineOutlined
												sx={{ fontSize: 12, color: "text.secondary" }}
											/>
										</Box>
									</Tooltip>
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										py: 1,
										bgcolor: "background.paper",
										fontSize: "0.72rem",
									}}
								>
									EST. WEEKLY YIELD
								</TableCell>
								<TableCell
									sx={{
										fontWeight: 800,
										py: 1,
										bgcolor: "background.paper",
										fontSize: "0.72rem",
										width: 44,
									}}
								/>
							</TableRow>
						</TableHead>
						<TableBody>
							{filteredDepositors.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										align="center"
										sx={{ py: 4, color: "text.secondary", fontSize: "0.8rem" }}
									>
										{depositors.length === 0
											? "No depositor accounts found for this bank yet."
											: "No shareholders match your search."}
									</TableCell>
								</TableRow>
							) : (
								filteredDepositors.map((dep) => {
									const isExpanded = expandedUser === dep.username;
									const isOwner =
										dep.is_owner ||
										dep.username.toLowerCase() ===
											bank.owner_username.toLowerCase();
									const activeDays = dep.days_active_in_cycle ?? 7.0;
									const prorationPercent = Math.round(
										(dep.cycle_proration_factor ?? 1.0) * 100,
									);

									return (
										<React.Fragment key={dep.username}>
											<TableRow
												hover
												onClick={() =>
													setExpandedUser(isExpanded ? null : dep.username)
												}
												sx={{
													cursor: "pointer",
													bgcolor: isOwner
														? alpha("#fbbf24", 0.03)
														: "transparent",
													"&:hover": {
														bgcolor: alpha(theme.palette.action.hover, 0.08),
													},
												}}
											>
												{/* Shareholder Name & Role */}
												<TableCell sx={{ py: 1 }}>
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 1,
														}}
													>
														<Typography
															variant="body2"
															sx={{
																fontWeight: 700,
																color: isOwner ? "#fef08a" : "text.primary",
															}}
														>
															{dep.username}
														</Typography>
														{isOwner ? (
															<Chip
																label="Owner Equity"
																size="small"
																sx={{
																	fontSize: "0.62rem",
																	height: 18,
																	fontWeight: 800,
																	bgcolor: alpha("#fbbf24", 0.15),
																	color: "#fbbf24",
																	border: "1px solid rgba(251, 191, 36, 0.3)",
																}}
															/>
														) : (
															<Chip
																label="Depositor"
																size="small"
																sx={{
																	fontSize: "0.62rem",
																	height: 18,
																	fontWeight: 700,
																	bgcolor: alpha(theme.palette.divider, 0.1),
																	color: "text.secondary",
																}}
															/>
														)}
													</Box>
												</TableCell>

												{/* Capital Balance */}
												<TableCell sx={{ py: 1 }}>
													<Typography
														variant="body2"
														sx={{
															fontWeight: 800,
															color:
																dep.current_balance > 0
																	? "text.primary"
																	: "text.disabled",
														}}
													>
														{formatAmount(dep.current_balance)} {currency}
													</Typography>
												</TableCell>

												{/* Equity Share */}
												<TableCell sx={{ py: 1 }}>
													<Typography
														variant="body2"
														sx={{ fontWeight: 600, color: "text.secondary" }}
													>
														{dep.equity_share_percent ?? 0}%
													</Typography>
												</TableCell>

												{/* Yield Weight & Proration */}
												<TableCell sx={{ py: 1 }}>
													{isOwner ? (
														<Tooltip
															title="Owner seed capital is non-debt reserve equity with 0% yield cost. Profits are earned from borrower loan repayments."
															arrow
														>
															<Typography
																variant="caption"
																sx={{
																	fontWeight: 700,
																	color: "text.secondary",
																	cursor: "help",
																}}
															>
																0% (Owner Reserve)
															</Typography>
														</Tooltip>
													) : (
														<Tooltip
															title={
																activeDays >= 7.0
																	? "Full Weekly Payout (100%): Capital was deposited before Monday cycle start and is active for the full 7-day period."
																	: `${activeDays} of 7 days weighted (${prorationPercent}%): Capital was deposited mid-cycle, earning interest proportional to remaining days.`
															}
															arrow
														>
															<Typography
																variant="body2"
																sx={{
																	fontWeight: 600,
																	color:
																		activeDays >= 7.0
																			? "success.main"
																			: "primary.main",
																	cursor: "help",
																	display: "inline-block",
																}}
															>
																{activeDays}/7d{" "}
																<span
																	style={{
																		fontSize: "0.7rem",
																		color: theme.palette.text.secondary,
																	}}
																>
																	({prorationPercent}%)
																</span>
															</Typography>
														</Tooltip>
													)}
												</TableCell>

												{/* Est. Weekly Yield */}
												<TableCell sx={{ py: 1 }}>
													{isOwner ? (
														<Typography
															variant="body2"
															sx={{ fontWeight: 600, color: "text.secondary" }}
														>
															0 {currency}{" "}
															<span
																style={{
																	fontSize: "0.65rem",
																	color: theme.palette.text.secondary,
																}}
															>
																(Equity)
															</span>
														</Typography>
													) : (
														<Typography
															variant="body2"
															sx={{
																fontWeight: 800,
																color:
																	(dep.projected_weekly_payout ?? 0) > 0
																		? "success.main"
																		: "text.secondary",
															}}
														>
															+{formatAmount(dep.projected_weekly_payout || 0)}{" "}
															{currency}
														</Typography>
													)}
												</TableCell>

												{/* Expand Toggle */}
												<TableCell sx={{ py: 1 }} align="right">
													<IconButton
														size="small"
														sx={{ p: 0.5, color: "text.secondary" }}
													>
														{isExpanded ? (
															<KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
														) : (
															<KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
														)}
													</IconButton>
												</TableCell>
											</TableRow>

											{/* Collapsible Clean Transaction History Sub-Table */}
											<TableRow>
												<TableCell
													colSpan={6}
													sx={{
														p: 0,
														borderBottom: isExpanded ? undefined : "none",
													}}
												>
													<Collapse
														in={isExpanded}
														timeout="auto"
														unmountOnExit
													>
														<Box
															sx={{
																p: 2,
																bgcolor: alpha("#0f172a", 0.45),
																borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
																display: "flex",
																flexDirection: "column",
																gap: 2.5,
															}}
														>
															{/* Weekly Snapshots Table (Financial Graph / Timeline Base) */}
															{dep.weekly_snapshots &&
																dep.weekly_snapshots.length > 0 && (
																	<Box>
																		<Box
																			sx={{
																				display: "flex",
																				alignItems: "center",
																				justifyContent: "space-between",
																				mb: 0.8,
																			}}
																		>
																			<Typography
																				variant="caption"
																				sx={{
																					fontWeight: 800,
																					color: "text.secondary",
																					fontSize: "0.68rem",
																				}}
																			>
																				WEEKLY SNAPSHOT HISTORY (
																				{dep.weekly_snapshots.length} cycles
																				recorded)
																			</Typography>
																			<Typography
																				variant="caption"
																				sx={{
																					color: "text.disabled",
																					fontSize: "0.65rem",
																				}}
																			>
																				Time-Weighted Daily Capital: Mid-cycle
																				deposits/withdrawals are prorated across
																				7 days
																			</Typography>
																		</Box>
																		<Table
																			size="small"
																			sx={{
																				bgcolor: alpha(
																					theme.palette.background.paper,
																					0.15,
																				),
																				borderRadius: 1,
																				overflow: "hidden",
																			}}
																		>
																			<TableHead>
																				<TableRow
																					sx={{
																						bgcolor: alpha(
																							theme.palette.background.paper,
																							0.25,
																						),
																					}}
																				>
																					<TableCell
																						sx={{
																							fontSize: "0.66rem",
																							fontWeight: 700,
																							py: 0.5,
																							color: "text.secondary",
																						}}
																					>
																						WEEK
																					</TableCell>
																					<TableCell
																						sx={{
																							fontSize: "0.66rem",
																							fontWeight: 700,
																							py: 0.5,
																							color: "text.secondary",
																						}}
																					>
																						START CAPITAL
																					</TableCell>
																					<TableCell
																						sx={{
																							fontSize: "0.66rem",
																							fontWeight: 700,
																							py: 0.5,
																							color: "text.secondary",
																						}}
																					>
																						NET INFLOW
																					</TableCell>
																					<TableCell
																						sx={{
																							fontSize: "0.66rem",
																							fontWeight: 700,
																							py: 0.5,
																							color: "text.secondary",
																						}}
																					>
																						<Tooltip
																							title="Effective Capital: Time-weighted balance eligible for weekly yield in this cycle. Capital held for all 7 days gets 100%; mid-week deposits get (Days Left / 7)."
																							arrow
																						>
																							<Box
																								sx={{
																									display: "inline-flex",
																									alignItems: "center",
																									gap: 0.3,
																									cursor: "help",
																								}}
																							>
																								<span>EFFECTIVE CAPITAL</span>
																								<HelpOutlineOutlined
																									sx={{
																										fontSize: 11,
																										color: "text.secondary",
																									}}
																								/>
																							</Box>
																						</Tooltip>
																					</TableCell>
																					<TableCell
																						sx={{
																							fontSize: "0.66rem",
																							fontWeight: 700,
																							py: 0.5,
																							color: "text.secondary",
																						}}
																					>
																						YIELD
																					</TableCell>
																					<TableCell
																						sx={{
																							fontSize: "0.66rem",
																							fontWeight: 700,
																							py: 0.5,
																							color: "text.secondary",
																						}}
																					>
																						CLOSING BALANCE
																					</TableCell>
																					<TableCell
																						sx={{
																							fontSize: "0.66rem",
																							fontWeight: 700,
																							py: 0.5,
																							color: "text.secondary",
																						}}
																					>
																						CYCLE STATUS
																					</TableCell>
																				</TableRow>
																			</TableHead>
																			<TableBody>
																				{dep.weekly_snapshots.map(
																					(ws, sIdx) => {
																						const isCur = ws.is_current;
																						return (
																							<TableRow
																								key={sIdx}
																								hover
																								sx={{
																									"&:last-child td, &:last-child th":
																										{ border: 0 },
																								}}
																							>
																								<TableCell
																									sx={{
																										py: 0.5,
																										fontSize: "0.72rem",
																										fontWeight: 700,
																										color: "text.primary",
																									}}
																								>
																									{ws.week_date}
																								</TableCell>
																								<TableCell
																									sx={{
																										py: 0.5,
																										fontSize: "0.72rem",
																										color: "text.secondary",
																									}}
																								>
																									{formatAmount(
																										ws.starting_balance,
																									)}{" "}
																									{currency}
																								</TableCell>
																								<TableCell
																									sx={{
																										py: 0.5,
																										fontSize: "0.72rem",
																										fontWeight: 700,
																										color:
																											ws.net_deposits >= 0
																												? "#34d399"
																												: "#fb923c",
																									}}
																								>
																									{ws.net_deposits > 0
																										? "+"
																										: ""}
																									{formatAmount(
																										ws.net_deposits,
																									)}{" "}
																									{currency}
																								</TableCell>
																								<TableCell
																									sx={{
																										py: 0.5,
																										fontSize: "0.72rem",
																										fontWeight: 700,
																										color: "info.light",
																									}}
																								>
																									{formatAmount(
																										ws.effective_capital,
																									)}{" "}
																									{currency}
																								</TableCell>
																								<TableCell
																									sx={{
																										py: 0.5,
																										fontSize: "0.72rem",
																										fontWeight: 800,
																										color: "success.main",
																									}}
																								>
																									+
																									{formatAmount(
																										ws.yield_earned,
																									)}{" "}
																									{currency}
																								</TableCell>
																								<TableCell
																									sx={{
																										py: 0.5,
																										fontSize: "0.72rem",
																										fontWeight: 800,
																										color: "text.primary",
																									}}
																								>
																									{formatAmount(
																										isCur
																											? (ws.projected_closing_balance ??
																													ws.closing_balance)
																											: ws.closing_balance,
																									)}{" "}
																									{currency}
																								</TableCell>
																								<TableCell sx={{ py: 0.5 }}>
																									{isCur ? (
																										<Chip
																											label="Current Week (Live)"
																											size="small"
																											sx={{
																												fontSize: "0.6rem",
																												height: 18,
																												fontWeight: 800,
																												bgcolor: alpha(
																													theme.palette.info
																														.main,
																													0.15,
																												),
																												color: "info.light",
																												border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
																											}}
																										/>
																									) : (
																										<Chip
																											label="Settled"
																											size="small"
																											sx={{
																												fontSize: "0.6rem",
																												height: 18,
																												fontWeight: 700,
																												bgcolor: alpha(
																													theme.palette.success
																														.main,
																													0.1,
																												),
																												color: "success.light",
																											}}
																										/>
																									)}
																								</TableCell>
																							</TableRow>
																						);
																					},
																				)}
																			</TableBody>
																		</Table>
																	</Box>
																)}

															{/* Granular Transaction Activity */}
															<Box>
																<Typography
																	variant="caption"
																	sx={{
																		fontWeight: 800,
																		color: "text.secondary",
																		mb: 0.8,
																		display: "block",
																		fontSize: "0.68rem",
																	}}
																>
																	RAW TRANSACTION LOG ({dep.transactions_count}{" "}
																	entries · Member since{" "}
																	{formatBankDate(dep.first_deposit_date)})
																</Typography>

																<Table size="small">
																	<TableHead>
																		<TableRow>
																			<TableCell
																				sx={{
																					fontSize: "0.68rem",
																					fontWeight: 700,
																					py: 0.6,
																					color: "text.secondary",
																				}}
																			>
																				DATE
																			</TableCell>
																			<TableCell
																				sx={{
																					fontSize: "0.68rem",
																					fontWeight: 700,
																					py: 0.6,
																					color: "text.secondary",
																				}}
																			>
																				TYPE
																			</TableCell>
																			<TableCell
																				sx={{
																					fontSize: "0.68rem",
																					fontWeight: 700,
																					py: 0.6,
																					color: "text.secondary",
																				}}
																			>
																				AMOUNT
																			</TableCell>
																			<TableCell
																				sx={{
																					fontSize: "0.68rem",
																					fontWeight: 700,
																					py: 0.6,
																					color: "text.secondary",
																				}}
																			>
																				RUNNING BALANCE
																			</TableCell>
																			<TableCell
																				sx={{
																					fontSize: "0.68rem",
																					fontWeight: 700,
																					py: 0.6,
																					color: "text.secondary",
																				}}
																			>
																				STATUS
																			</TableCell>
																		</TableRow>
																	</TableHead>
																	<TableBody>
																		{dep.history
																			.filter((pt) => pt.type !== "CURRENT")
																			.map((pt, idx) => {
																				const isYield = pt.type === "YIELD";
																				const isDep = pt.type === "DEPOSIT";
																				const isPending =
																					pt.status === "PENDING";

																				return (
																					<TableRow
																						key={idx}
																						hover
																						sx={{
																							"&:last-child td, &:last-child th":
																								{ border: 0 },
																						}}
																					>
																						<TableCell
																							sx={{
																								py: 0.6,
																								fontSize: "0.75rem",
																								color: "text.secondary",
																							}}
																						>
																							{formatBankDate(pt.date)}
																						</TableCell>
																						<TableCell sx={{ py: 0.6 }}>
																							<Chip
																								label={
																									isYield
																										? "YIELD"
																										: isDep
																											? "DEPOSIT"
																											: "WITHDRAWAL"
																								}
																								size="small"
																								sx={{
																									fontSize: "0.62rem",
																									height: 18,
																									fontWeight: 800,
																									bgcolor: isYield
																										? alpha(
																												theme.palette.primary
																													.main,
																												0.15,
																											)
																										: isDep
																											? alpha(
																													theme.palette.success
																														.main,
																													0.15,
																												)
																											: alpha(
																													theme.palette.error
																														.main,
																													0.15,
																												),
																									color: isYield
																										? theme.palette.primary
																												.light
																										: isDep
																											? theme.palette.success
																													.light
																											: theme.palette.error
																													.light,
																									border: `1px solid ${
																										isYield
																											? alpha(
																													theme.palette.primary
																														.main,
																													0.3,
																												)
																											: isDep
																												? alpha(
																														theme.palette
																															.success.main,
																														0.3,
																													)
																												: alpha(
																														theme.palette.error
																															.main,
																														0.3,
																													)
																									}`,
																								}}
																							/>
																						</TableCell>
																						<TableCell
																							sx={{
																								py: 0.6,
																								fontSize: "0.75rem",
																								fontWeight: 700,
																								color:
																									isDep || isYield
																										? theme.palette.success
																												.light
																										: theme.palette.error.light,
																							}}
																						>
																							{isDep || isYield ? "+" : "-"}
																							{formatAmount(pt.amount)}{" "}
																							{currency}
																						</TableCell>
																						<TableCell
																							sx={{
																								py: 0.6,
																								fontSize: "0.75rem",
																								fontWeight: 600,
																							}}
																						>
																							{formatAmount(pt.balance)}{" "}
																							{currency}
																						</TableCell>
																						<TableCell sx={{ py: 0.6 }}>
																							{isPending ? (
																								<Chip
																									label="Awaiting in-game fulfillment"
																									size="small"
																									sx={{
																										fontSize: "0.62rem",
																										height: 18,
																										fontWeight: 700,
																										bgcolor: alpha(
																											theme.palette.warning
																												.main,
																											0.15,
																										),
																										color: "warning.light",
																									}}
																								/>
																							) : (
																								<Chip
																									label="Settled"
																									size="small"
																									sx={{
																										fontSize: "0.62rem",
																										height: 18,
																										fontWeight: 700,
																										bgcolor: alpha(
																											theme.palette.success
																												.main,
																											0.1,
																										),
																										color: "success.light",
																									}}
																								/>
																							)}
																						</TableCell>
																					</TableRow>
																				);
																			})}
																	</TableBody>
																</Table>
															</Box>
														</Box>
													</Collapse>
												</TableCell>
											</TableRow>
										</React.Fragment>
									);
								})
							)}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>
		</Box>
	);
};
