import React, { useState, useMemo, useEffect } from "react";
import {
	Box,
	Typography,
	TextField,
	InputAdornment,
	Chip,
	Grid,
	LinearProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { FlexCard } from "./sharedui";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";
import { useGlobalData } from "../../../context/globaldatacontext";
import { LoanDetailModal } from "./loandetailmodal";

interface LoansTabProps {
	currency: string;
}

export const LoansTab: React.FC<LoansTabProps> = ({ currency }) => {
	const { loansData } = useGlobalData();
	const loans = Array.isArray(loansData) ? loansData : [];
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [selectedLoan, setSelectedLoan] = useState<any | null>(null);

	// Container width detection via ResizeObserver to handle sidebar collapse & screen resizes seamlessly
	const containerRef = React.useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState<number>(1000);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentRect) {
					setContainerWidth(entry.contentRect.width);
				}
			}
		});

		observer.observe(el);
		setContainerWidth(el.clientWidth);

		return () => observer.disconnect();
	}, []);

	const isWideEnoughForTable = containerWidth >= 755;

	// Active loan metrics
	const loanStats = useMemo(() => {
		let totalLent = 0;
		let totalBorrowed = 0;
		let activeLentCount = 0;
		let activeBorrowedCount = 0;

		loans.forEach((loan) => {
			const status = (loan.status || "").toUpperCase();
			if (
				status.includes("CANCELLED") ||
				status.includes("REJECTED") ||
				status === "FULFILLED"
			)
				return;

			const isLent =
				loan.contracttype === "LOAN_GIVEN" ||
				loan.party === "CUSTOMER" ||
				loan.is_payout_party;
			const amount = Number(loan.total_amount || loan.amount || 0);

			if (isLent) {
				totalLent += amount;
				activeLentCount += 1;
			} else {
				totalBorrowed += amount;
				activeBorrowedCount += 1;
			}
		});

		const netLoanBalance = totalLent - totalBorrowed;
		return {
			totalLent,
			totalBorrowed,
			netLoanBalance,
			activeLentCount,
			activeBorrowedCount,
		};
	}, [loans]);

	const filteredLoans = useMemo(() => {
		if (!searchTerm) return loans;
		const query = searchTerm.toLowerCase();
		return loans.filter(
			(l) =>
				l.id?.toLowerCase().includes(query) ||
				l.localid?.toLowerCase().includes(query) ||
				l.partnercode?.toLowerCase().includes(query) ||
				l.partnername?.toLowerCase().includes(query) ||
				l.counterparty_code?.toLowerCase().includes(query) ||
				l.counterparty_name?.toLowerCase().includes(query) ||
				l.loan_strategy?.toLowerCase().includes(query) ||
				l.status?.toLowerCase().includes(query),
		);
	}, [loans, searchTerm]);

	const getStatusChip = (status: string) => {
		const s = (status || "").toUpperCase();
		if (
			s.includes("FULFILLED") &&
			!s.includes("PARTIALLY") &&
			!s.includes("PARTIAL")
		) {
			return (
				<Chip
					label="FULFILLED"
					size="small"
					sx={{
						height: 18,
						fontSize: "0.58rem",
						fontWeight: 800,
						bgcolor: "rgba(74, 222, 128, 0.15)",
						color: "#4ade80",
						border: "1px solid rgba(74, 222, 128, 0.3)",
					}}
				/>
			);
		}
		if (s.includes("PARTIALLY") || s.includes("PARTIAL")) {
			return (
				<Chip
					label="PARTIAL"
					size="small"
					sx={{
						height: 18,
						fontSize: "0.58rem",
						fontWeight: 800,
						bgcolor: "rgba(56, 189, 248, 0.15)",
						color: "#38bdf8",
						border: "1px solid rgba(56, 189, 248, 0.3)",
					}}
				/>
			);
		}
		if (s.includes("CANCEL") || s.includes("REJECTED")) {
			return (
				<Chip
					label="CANCELLED"
					size="small"
					sx={{
						height: 18,
						fontSize: "0.58rem",
						fontWeight: 800,
						bgcolor: "rgba(148, 163, 184, 0.15)",
						color: "#94a3b8",
						border: "1px solid rgba(148, 163, 184, 0.3)",
					}}
				/>
			);
		}
		return (
			<Chip
				label={s || "ACTIVE"}
				size="small"
				sx={{
					height: 18,
					fontSize: "0.58rem",
					fontWeight: 800,
					bgcolor: "rgba(168, 85, 247, 0.15)",
					color: "#c084fc",
					border: "1px solid rgba(168, 85, 247, 0.3)",
				}}
			/>
		);
	};

	return (
		<FlexCard
			sx={{
				height: "100%",
				p: 1.5,
				display: "flex",
				flexDirection: "column",
				gap: 1.5,
			}}
		>
			{/* Loan Detail Modal */}
			<LoanDetailModal
				open={!!selectedLoan}
				onClose={() => setSelectedLoan(null)}
				loan={selectedLoan}
				currency={currency}
			/>

			{/* Top Metric Cards Bar */}
			<Grid container spacing={1.25} sx={{ justifyContent: "space-between" }}>
				<Grid item xs={6} md={3}>
					<Box
						sx={{
							p: 1.25,
							borderRadius: "10px",
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
									fontSize: "0.62rem",
									fontWeight: 800,
									textTransform: "uppercase",
								}}
							>
								Total Principal Lent
							</Typography>
						</Box>
						<Typography
							sx={{
								fontSize: "0.95rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: SEMANTIC_COLORS.neonGreen,
								mt: 0.25,
							}}
						>
							+{formatCurrency(loanStats.totalLent)} {currency}
						</Typography>
					</Box>
				</Grid>

				<Grid item xs={6} md={3}>
					<Box
						sx={{
							p: 1.25,
							borderRadius: "10px",
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
									fontSize: "0.62rem",
									fontWeight: 800,
									textTransform: "uppercase",
								}}
							>
								Total Principal Borrowed
							</Typography>
						</Box>
						<Typography
							sx={{
								fontSize: "0.95rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: SEMANTIC_COLORS.neonRed,
								mt: 0.25,
							}}
						>
							-{formatCurrency(loanStats.totalBorrowed)} {currency}
						</Typography>
					</Box>
				</Grid>

				<Grid item xs={6} md={3}>
					<Box
						sx={{
							p: 1.25,
							borderRadius: "10px",
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
									fontSize: "0.62rem",
									fontWeight: 800,
									textTransform: "uppercase",
								}}
							>
								Net Loan
							</Typography>
						</Box>
						<Typography
							sx={{
								fontSize: "0.95rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color:
									loanStats.netLoanBalance >= 0
										? SEMANTIC_COLORS.neonGreen
										: SEMANTIC_COLORS.neonRed,
								mt: 0.25,
							}}
						>
							{loanStats.netLoanBalance >= 0 ? "+" : ""}
							{formatCurrency(loanStats.netLoanBalance)} {currency}
						</Typography>
					</Box>
				</Grid>

				<Grid item xs={6} md={3}>
					<Box
						sx={{
							p: 1.25,
							borderRadius: "10px",
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
									fontSize: "0.62rem",
									fontWeight: 800,
									textTransform: "uppercase",
								}}
							>
								Active Contracts Count
							</Typography>
						</Box>
						<Typography
							sx={{
								fontSize: "0.85rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: "white",
								mt: 0.25,
							}}
						>
							{loanStats.activeLentCount} Lent / {loanStats.activeBorrowedCount}{" "}
							Borrowed
						</Typography>
					</Box>
				</Grid>
			</Grid>

			{/* Sub-Header & Search Filter Bar */}
			<Box
				sx={{
					pb: 1,
					borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<TextField
					placeholder="Search contract / counterparty..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					sx={{
						width: "100%",
						"& .MuiOutlinedInput-root": {
							bgcolor: "rgba(0, 0, 0, 0.5)",
							borderRadius: "6px",
							color: "white",
							fontSize: "1rem",
							"& fieldset": { borderColor: "rgba(123, 104, 238, 0.3)" },
							"&:hover fieldset": { borderColor: "rgba(123, 104, 238, 0.7)" },
						},
						"& .MuiInputBase-input": { py: 0.5, px: 1 },
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

			<Box
				ref={containerRef}
				sx={{
					flex: 1,
					overflowY: "auto",
					mt: 1,
					"&::-webkit-scrollbar": { width: "4px" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: "rgba(255,255,255,0.1)",
						borderRadius: "4px",
					},
				}}
			>
				{filteredLoans.length > 0 ? (
					isWideEnoughForTable ? (
						/* Desktop Table View (when container width >= 740px) */
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
									}}
								>
									<Box
										component="th"
										sx={{ padding: "8px 8px", width: "85px" }}
									>
										Contract ID
									</Box>
									<Box
										component="th"
										sx={{ padding: "8px 8px", width: "85px" }}
									>
										Type
									</Box>
									<Box component="th" sx={{ padding: "8px 8px" }}>
										Counterparty
									</Box>
									<Box
										component="th"
										sx={{ padding: "8px 8px", width: "95px" }}
									>
										Strategy
									</Box>
									<Box
										component="th"
										sx={{
											padding: "8px 8px",
											textAlign: "right",
											width: "75px",
										}}
									>
										Interest
									</Box>
									<Box
										component="th"
										sx={{
											padding: "8px 8px",
											textAlign: "right",
											width: "120px",
										}}
									>
										Total Principal
									</Box>
									<Box
										component="th"
										sx={{
											padding: "8px 8px",
											textAlign: "right",
											width: "80px",
										}}
									>
										Interval
									</Box>
									<Box
										component="th"
										sx={{
											padding: "8px 8px",
											textAlign: "right",
											width: "120px",
										}}
									>
										Installments
									</Box>
									<Box
										component="th"
										sx={{
											padding: "8px 8px",
											textAlign: "right",
											width: "95px",
										}}
									>
										Status
									</Box>
								</Box>
							</Box>
							<Box component="tbody">
								{filteredLoans.map((loan) => {
									const isLent =
										loan.contracttype === "LOAN_GIVEN" ||
										loan.party === "CUSTOMER" ||
										loan.is_payout_party;
									const partnerName =
										loan.partnername ||
										loan.counterparty_name ||
										loan.partnercode ||
										loan.counterparty_code ||
										"Unknown";
									const partnerCode =
										loan.partnercode || loan.counterparty_code || "";
									const strategy =
										loan.loan_strategy || loan.interest_type || "STABLE_LOAN";
									const interestRate =
										loan.implied_interest_rate !== undefined
											? loan.implied_interest_rate
											: loan.interest_rate
												? loan.interest_rate * 100
												: 0;
									const totalInst =
										loan.installment_count || loan.total_installments || 1;
									const fulfilledInst =
										loan.installment_done ?? loan.fulfilled_installments ?? 0;
									const instPercent = Math.min(
										100,
										Math.round((fulfilledInst / totalInst) * 100),
									);
									const intervalDays = loan.installment_interval || 7;

									return (
										<Box
											component="tr"
											key={loan.id}
											onClick={() => setSelectedLoan(loan)}
											sx={{
												borderBottom: "1px solid rgba(255,255,255,0.03)",
												cursor: "pointer",
												transition: "background-color 0.15s ease-in-out",
												"&:hover": {
													backgroundColor: "rgba(123, 104, 238, 0.12)",
												},
											}}
										>
											<Box
												component="td"
												sx={{ padding: "8px 8px", whiteSpace: "nowrap" }}
											>
												<Typography
													sx={{
														fontSize: "0.72rem",
														fontFamily: "monospace",
														fontWeight: 800,
														color: "#7b68ee",
													}}
												>
													{loan.localid ||
														(loan.id ? loan.id.substring(0, 8) : "-")}
												</Typography>
											</Box>
											<Box component="td" sx={{ padding: "8px 8px" }}>
												<Chip
													label={isLent ? "LENT" : "BORROWED"}
													size="small"
													sx={{
														height: 18,
														fontSize: "0.58rem",
														fontWeight: 800,
														bgcolor: isLent
															? "rgba(74, 222, 128, 0.15)"
															: "rgba(248, 113, 113, 0.15)",
														color: isLent
															? SEMANTIC_COLORS.neonGreen
															: SEMANTIC_COLORS.neonRed,
														border: `1px solid ${isLent ? "rgba(74, 222, 128, 0.3)" : "rgba(248, 113, 113, 0.3)"}`,
													}}
												/>
											</Box>
											<Box
												component="td"
												sx={{
													padding: "8px 8px",
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												<Typography
													sx={{
														fontSize: "0.74rem",
														fontWeight: 700,
														color: "white",
														lineHeight: 1.2,
														overflow: "hidden",
														textOverflow: "ellipsis",
														whiteSpace: "nowrap",
													}}
												>
													{partnerName}
												</Typography>
												{partnerCode && (
													<Typography
														sx={{
															fontSize: "0.64rem",
															fontFamily: "monospace",
															color: "rgba(255,255,255,0.4)",
														}}
													>
														[{partnerCode}]
													</Typography>
												)}
											</Box>
											<Box
												component="td"
												sx={{ padding: "8px 8px", whiteSpace: "nowrap" }}
											>
												<Typography
													sx={{
														fontSize: "0.68rem",
														color: "rgba(255,255,255,0.7)",
														whiteSpace: "nowrap",
													}}
												>
													{strategy}
												</Typography>
											</Box>
											<Box
												component="td"
												sx={{
													padding: "8px 8px",
													textAlign: "right",
													fontFamily: "monospace",
													fontSize: "0.74rem",
													color: "#c084fc",
													fontWeight: 700,
													whiteSpace: "nowrap",
												}}
											>
												{Number(interestRate).toFixed(1)}%
											</Box>
											<Box
												component="td"
												sx={{
													padding: "8px 8px",
													textAlign: "right",
													fontFamily: "monospace",
													fontSize: "0.76rem",
													fontWeight: 800,
													color: isLent
														? SEMANTIC_COLORS.neonGreen
														: SEMANTIC_COLORS.neonRed,
													whiteSpace: "nowrap",
												}}
											>
												{formatCurrency(loan.total_amount)}{" "}
												{loan.currency || currency}
											</Box>
											<Box
												component="td"
												sx={{
													padding: "8px 8px",
													textAlign: "right",
													fontFamily: "monospace",
													fontSize: "0.7rem",
													color: "rgba(255,255,255,0.6)",
													whiteSpace: "nowrap",
												}}
											>
												{intervalDays} Days
											</Box>
											<Box
												component="td"
												sx={{ padding: "8px 8px", textAlign: "right" }}
											>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														justifyContent: "flex-end",
														gap: 0.75,
													}}
												>
													<LinearProgress
														variant="determinate"
														value={instPercent}
														sx={{
															width: 40,
															height: 4,
															borderRadius: 2,
															bgcolor: "rgba(255,255,255,0.08)",
															"& .MuiLinearProgress-bar": {
																bgcolor: SEMANTIC_COLORS.neonPurple,
															},
														}}
													/>
													<Typography
														sx={{
															fontSize: "0.66rem",
															fontFamily: "monospace",
															color: "rgba(255,255,255,0.8)",
															fontWeight: 700,
															whiteSpace: "nowrap",
														}}
													>
														{fulfilledInst}/{totalInst}
													</Typography>
												</Box>
											</Box>
											<Box
												component="td"
												sx={{ padding: "8px 8px", textAlign: "right" }}
											>
												{getStatusChip(loan.status)}
											</Box>
										</Box>
									);
								})}
							</Box>
						</Box>
					) : (
						/* Mobile/Compact Card List View (when container width < 740px) */
						<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
							{filteredLoans.map((loan) => {
								const isLent =
									loan.contracttype === "LOAN_GIVEN" ||
									loan.party === "CUSTOMER" ||
									loan.is_payout_party;
								const partnerName =
									loan.partnername ||
									loan.counterparty_name ||
									loan.partnercode ||
									loan.counterparty_code ||
									"Unknown";
								const partnerCode =
									loan.partnercode || loan.counterparty_code || "";
								const strategy =
									loan.loan_strategy || loan.interest_type || "STABLE_LOAN";
								const interestRate =
									loan.implied_interest_rate !== undefined
										? loan.implied_interest_rate
										: loan.interest_rate
											? loan.interest_rate * 100
											: 0;
								const totalInst =
									loan.installment_count || loan.total_installments || 1;
								const fulfilledInst =
									loan.installment_done ?? loan.fulfilled_installments ?? 0;
								const instPercent = Math.min(
									100,
									Math.round((fulfilledInst / totalInst) * 100),
								);

								return (
									<Box
										key={loan.id}
										onClick={() => setSelectedLoan(loan)}
										sx={{
											p: 1.25,
											borderRadius: "8px",
											bgcolor: "rgba(255, 255, 255, 0.03)",
											border: "1px solid rgba(255, 255, 255, 0.06)",
											cursor: "pointer",
											transition: "all 0.15s ease-in-out",
											"&:hover": {
												bgcolor: "rgba(123, 104, 238, 0.12)",
												borderColor: "rgba(123, 104, 238, 0.3)",
											},
											display: "flex",
											flexDirection: "column",
											gap: 0.75,
										}}
									>
										{/* Card Header Bar */}
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
											}}
										>
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												<Typography
													sx={{
														fontSize: "0.78rem",
														fontFamily: "monospace",
														fontWeight: 800,
														color: "#7b68ee",
													}}
												>
													{loan.localid ||
														(loan.id ? loan.id.substring(0, 8) : "-")}
												</Typography>
												<Chip
													label={isLent ? "LENT" : "BORROWED"}
													size="small"
													sx={{
														height: 18,
														fontSize: "0.58rem",
														fontWeight: 800,
														bgcolor: isLent
															? "rgba(74, 222, 128, 0.15)"
															: "rgba(248, 113, 113, 0.15)",
														color: isLent
															? SEMANTIC_COLORS.neonGreen
															: SEMANTIC_COLORS.neonRed,
														border: `1px solid ${isLent ? "rgba(74, 222, 128, 0.3)" : "rgba(248, 113, 113, 0.3)"}`,
													}}
												/>
											</Box>
											{getStatusChip(loan.status)}
										</Box>

										{/* Counterparty & Principal Info */}
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
											}}
										>
											<Box>
												<Typography
													sx={{
														fontSize: "0.82rem",
														fontWeight: 800,
														color: "white",
													}}
												>
													{partnerName}{" "}
													{partnerCode && (
														<span
															style={{
																color: "rgba(255,255,255,0.4)",
																fontFamily: "monospace",
																fontSize: "0.7rem",
															}}
														>
															[{partnerCode}]
														</span>
													)}
												</Typography>
												<Typography
													sx={{
														fontSize: "0.68rem",
														color: "rgba(255,255,255,0.6)",
													}}
												>
													{strategy} • {Number(interestRate).toFixed(1)}% Int
												</Typography>
											</Box>
											<Typography
												sx={{
													fontSize: "0.85rem",
													fontFamily: "monospace",
													fontWeight: 800,
													color: isLent
														? SEMANTIC_COLORS.neonGreen
														: SEMANTIC_COLORS.neonRed,
												}}
											>
												{formatCurrency(loan.total_amount)}{" "}
												{loan.currency || currency}
											</Typography>
										</Box>

										{/* Progress Bar */}
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 1,
												mt: 0.25,
											}}
										>
											<LinearProgress
												variant="determinate"
												value={instPercent}
												sx={{
													flex: 1,
													height: 4,
													borderRadius: 2,
													bgcolor: "rgba(255,255,255,0.08)",
													"& .MuiLinearProgress-bar": {
														bgcolor: SEMANTIC_COLORS.neonPurple,
													},
												}}
											/>
											<Typography
												sx={{
													fontSize: "0.66rem",
													fontFamily: "monospace",
													color: "rgba(255,255,255,0.7)",
												}}
											>
												{fulfilledInst}/{totalInst} Inst
											</Typography>
										</Box>
									</Box>
								);
							})}
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
						}}
					>
						<Typography sx={{ fontSize: "0.82rem" }}>
							No loan contracts found
						</Typography>
					</Box>
				)}
			</Box>
		</FlexCard>
	);
};
