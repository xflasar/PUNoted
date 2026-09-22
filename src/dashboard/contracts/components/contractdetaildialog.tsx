import {
	Dialog,
	DialogTitle,
	DialogContent,
	IconButton,
	Typography,
	Box,
	Chip,
	Divider,
	CircularProgress,
	Paper,
	Grid,
	Stack,
	LinearProgress,
} from "@mui/material";
import {
	Close as CloseIcon,
	Handshake as HandshakeIcon,
	Person as PersonIcon,
	Description as DescriptionIcon,
} from "@mui/icons-material";
import {
	formatCurrency,
	SEMANTIC_COLORS,
} from "../../financial/utils/financeutils";
import { useContractDetail } from "../hooks/usecontractdetail";
import { ContractConditionCard } from "./contractconditioncard";
import type { Condition } from "../types";

export interface ContractDetailDialogProps {
	open: boolean;
	contractId: string | null;
	onClose: () => void;
	showSettlementLogs?: boolean;
}

export const ContractDetailDialog: React.FC<ContractDetailDialogProps> = ({
	open,
	contractId,
	onClose,
	showSettlementLogs = false,
}) => {
	const {
		contract,
		vendorOrders,
		loading,
		theme,
		corpPrices,
		marketData,
		storageState,
		financialData,
	} = useContractDetail({ contractId, open });

	if (!open || !contractId) return null;

	const allConditions: Condition[] = contract?.conditions || [];

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="lg"
			slotProps={{
				paper: {
					sx: {
						backgroundColor: "rgba(10, 10, 20, 0.96)",
						backdropFilter: "blur(25px)",
						border: "1px solid rgba(123, 104, 238, 0.35)",
						borderRadius: "14px",
						boxShadow:
							"0 0 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(123, 104, 238, 0.25)",
						color: "white",
						overflow: "hidden",
						m: { xs: 1, sm: "auto" },
						maxWidth: { xs: "98vw", sm: "90vw", md: "1100px" },
						width: { xs: "100%", sm: "900px", md: "1100px" },
						maxHeight: { xs: "94vh", sm: "90vh" },
					},
				},
			}}
		>
			{/* Dialog Header */}
			<DialogTitle
				sx={{
					p: { xs: 1.5, sm: 2 },
					px: { xs: 2, sm: 2.5 },
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
					bgcolor: "rgba(123, 104, 238, 0.06)",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					<Box
						sx={{
							p: 0.75,
							borderRadius: "8px",
							bgcolor: "rgba(123, 104, 238, 0.15)",
							color: "#7b68ee",
							display: "flex",
						}}
					>
						<HandshakeIcon />
					</Box>
					<Box>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								flexWrap: "wrap",
							}}
						>
							<Typography
								variant="subtitle1"
								sx={{ fontWeight: 800, color: "white", fontSize: "1.05rem" }}
							>
								{contract?.name || `Contract Agreement [ ${contract?.id} ]`}
							</Typography>
							<Chip
								label={contract?.status}
								size="small"
								sx={{
									height: 20,
									fontSize: "0.62rem",
									fontWeight: 800,
									bgcolor:
										contract?.status === "FULFILLED"
											? "rgba(74, 222, 128, 0.15)"
											: "rgba(123, 104, 238, 0.15)",
									color:
										contract?.status === "FULFILLED"
											? SEMANTIC_COLORS.neonGreen
											: "#7b68ee",
									border: `1px solid ${contract?.status === "FULFILLED" ? "rgba(74, 222, 128, 0.3)" : "rgba(123, 104, 238, 0.3)"}`,
								}}
							/>
							{contract?.action_state && (
								<Chip
									label={contract.action_state.label}
									size="small"
									color={contract.action_state.color}
									sx={{ height: 20, fontSize: "0.62rem", fontWeight: 800 }}
								/>
							)}
						</Box>
						<Typography
							sx={{
								fontSize: "0.72rem",
								color: "#7b68ee",
								fontFamily: "monospace",
								fontWeight: 700,
							}}
						>
							{contract?.id} • {contract?.contracttype || "TRADE"}
						</Typography>
					</Box>
				</Box>
				<IconButton
					onClick={onClose}
					sx={{
						color: "rgba(255, 255, 255, 0.5)",
						"&:hover": { color: "white" },
					}}
				>
					<CloseIcon fontSize="small" />
				</IconButton>
			</DialogTitle>

			{/* Dialog Content */}
			<DialogContent
				sx={{
					p: { xs: 1.25, sm: 1.75 },
					display: "flex",
					flexDirection: "column",
					gap: 1.25,
					overflowY: "auto",
				}}
			>
				{loading ? (
					<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
						<CircularProgress size={30} sx={{ color: "#7b68ee" }} />
					</Box>
				) : !contract ? (
					<Typography
						variant="body2"
						color="text.secondary"
						align="center"
						sx={{ py: 3 }}
					>
						Unable to load contract details.
					</Typography>
				) : (
					<>
						{/* Overview KPI Cards Grid */}
						<Grid
							container
							spacing={1.25}
							sx={{ justifyContent: "space-around", mt: 1 }}
						>
							{/* Card 1: Total Contract Value */}
							<Grid item xs={12} sm={4}>
								<Box
									sx={{
										p: 1.25,
										borderRadius: "8px",
										bgcolor: "rgba(18, 18, 37, 0.6)",
										borderColor: "rgba(123, 104, 238, 0.2)",
										border: "1px solid rgba(123, 104, 238, 0.25)",
										height: "100%",
										display: "flex",
										flexDirection: "column",
										justifyContent: "space-between",
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
												color: "rgba(255,255,255,0.6)",
												fontWeight: 800,
												fontSize: "0.62rem",
												textTransform: "uppercase",
											}}
										>
											TOTAL CONTRACT VALUE
										</Typography>
										{contract.has_amount && (
											<Chip
												label={
													contract.is_income
														? "NET INCOME (+)"
														: "NET EXPENSE (-)"
												}
												size="small"
												sx={{
													height: 16,
													fontSize: "0.52rem",
													fontWeight: 800,
													bgcolor: contract.is_income
														? "rgba(74, 222, 128, 0.15)"
														: "rgba(239, 68, 68, 0.15)",
													color: contract.amount_color,
												}}
											/>
										)}
									</Box>

									<Typography
										sx={{
											fontSize: "1.15rem",
											fontFamily: "monospace",
											fontWeight: 800,
											color: contract.amount_color,
											my: 0.5,
										}}
									>
										{contract.sign}
										{formatCurrency(contract.total_amount)}{" "}
										{contract.contract_currency}
									</Typography>

									<Typography
										sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}
									>
										Role: {contract.partner} (
										{contract.is_income
											? "Income Receivable"
											: "Expense Payable"}
										)
									</Typography>
								</Box>
							</Grid>

							{/* Card 2: Counterparty & Role */}
							<Grid item xs={12} sm={4}>
								<Box
									sx={{
										p: 1.25,
										borderRadius: "8px",
										bgcolor: "rgba(18, 18, 37, 0.6)",
										borderColor: "rgba(123, 104, 238, 0.2)",
										border: "1px solid rgba(123, 104, 238, 0.25)",
										height: "100%",
										display: "flex",
										flexDirection: "column",
										justifyContent: "space-between",
									}}
								>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											mb: 0.5,
										}}
									>
										<Typography
											variant="caption"
											sx={{
												color: "rgba(255,255,255,0.6)",
												fontWeight: 800,
												fontSize: "0.62rem",
												textTransform: "uppercase",
											}}
										>
											COUNTERPARTY & ROLE
										</Typography>
										<Chip
											label={contract.partner}
											size="small"
											sx={{
												height: 16,
												fontSize: "0.52rem",
												fontWeight: 800,
												bgcolor: "rgba(56, 189, 248, 0.15)",
												color: "#38bdf8",
											}}
										/>
									</Box>
									<Box
										sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
									>
										<PersonIcon sx={{ fontSize: 18, color: "#7b68ee" }} />
										<Typography
											sx={{
												fontSize: "0.92rem",
												fontWeight: 800,
												color: "white",
											}}
										>
											{contract.partner_name}{" "}
											{contract.partner_code && `[${contract.partner_code}]`}
										</Typography>
									</Box>
									<Typography
										sx={{
											fontSize: "0.68rem",
											color: contract.amount_color,
											fontWeight: 700,
											mt: 0.25,
										}}
									>
										Contract Party: {contract.partner}
									</Typography>
								</Box>
							</Grid>

							{/* Card 3: Fulfillment Progress */}
							<Grid item xs={12} sm={4}>
								<Box
									sx={{
										p: 1.25,
										borderRadius: "8px",
										bgcolor: "rgba(18, 18, 37, 0.6)",
										borderColor: "rgba(123, 104, 238, 0.2)",
										border: "1px solid rgba(123, 104, 238, 0.25)",
										height: "100%",
										display: "flex",
										flexDirection: "column",
										justifyContent: "space-between",
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
												color: "rgba(255,255,255,0.6)",
												fontWeight: 800,
												fontSize: "0.62rem",
												textTransform: "uppercase",
											}}
										>
											TERMS FULFILLMENT
										</Typography>
										<Typography
											variant="caption"
											sx={{
												color: "#7b68ee",
												fontWeight: 800,
												fontSize: "0.68rem",
											}}
										>
											{contract.fulfilled_cond_count} /{" "}
											{contract.total_cond_count}
										</Typography>
									</Box>
									<Box sx={{ my: 0.5 }}>
										<LinearProgress
											variant="determinate"
											value={contract.fulfillment_percentage}
											sx={{
												height: 6,
												borderRadius: 3,
												bgcolor: "rgba(255, 255, 255, 0.08)",
												"& .MuiLinearProgress-bar": {
													borderRadius: 3,
													bgcolor:
														contract.fulfillment_percentage === 100
															? SEMANTIC_COLORS.neonGreen
															: "#7b68ee",
												},
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
											variant="caption"
											sx={{
												color: "rgba(255,255,255,0.5)",
												fontSize: "0.6rem",
											}}
										>
											Progress Rate:
										</Typography>
										<Typography
											variant="caption"
											sx={{
												color:
													contract.fulfillment_percentage === 100
														? SEMANTIC_COLORS.neonGreen
														: "white",
												fontWeight: 800,
												fontSize: "0.65rem",
											}}
										>
											{contract.fulfillment_percentage}%
										</Typography>
									</Box>
								</Box>
							</Grid>
						</Grid>

						{/* Preamble Notice */}
						{contract.preamble && (
							<Paper
								variant="outlined"
								sx={{
									p: 1.25,
									bgcolor: "rgba(123, 104, 238, 0.05)",
									borderColor: "rgba(123, 104, 238, 0.2)",
								}}
							>
								<Stack
									sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}
								>
									<Typography
										variant="body2"
										sx={{
											fontStyle: "italic",
											fontSize: "0.78rem",
											color: "rgba(255,255,255,0.8)",
										}}
									>
										{contract.preamble}
									</Typography>
								</Stack>
							</Paper>
						)}

						<Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />

						{/* Contract Conditions List (Installments-Style Responsive Grid) */}
						<Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
									<DescriptionIcon sx={{ fontSize: 16, color: "#7b68ee" }} />
									<Typography
										sx={{
											fontSize: "0.82rem",
											fontWeight: 800,
											textTransform: "uppercase",
											color: "rgba(255, 255, 255, 0.9)",
											letterSpacing: "0.05em",
										}}
									>
										Conditions ({allConditions.length})
									</Typography>
								</Box>
								<Chip
									label={`${contract.fulfilled_cond_count} / ${contract.total_cond_count} COMPLETED`}
									size="small"
									sx={{
										height: 20,
										fontSize: "0.62rem",
										fontWeight: 800,
										bgcolor:
											contract.fulfilled_cond_count ===
												contract.total_cond_count &&
											contract.total_cond_count > 0
												? "rgba(74, 222, 128, 0.15)"
												: "rgba(123, 104, 238, 0.15)",
										color:
											contract.fulfilled_cond_count ===
												contract.total_cond_count &&
											contract.total_cond_count > 0
												? SEMANTIC_COLORS.neonGreen
												: "#7b68ee",
										border: `1px solid ${contract.fulfilled_cond_count === contract.total_cond_count && contract.total_cond_count > 0 ? "rgba(74, 222, 128, 0.3)" : "rgba(123, 104, 238, 0.3)"}`,
									}}
								/>
							</Box>

							{allConditions.length > 0 ? (
								<Box
									sx={{
										display: "flex",
										flexWrap: "wrap",
										gap: 1.25,
										justifyContent: "flex-start",
										width: "100%",
									}}
								>
									{allConditions.map((cond, idx) => (
										<ContractConditionCard
											key={cond.id || idx}
											cond={cond}
											idx={idx}
											contract={contract}
											allConditions={allConditions}
											marketData={marketData}
											corpPrices={corpPrices}
											vendorOrders={vendorOrders}
											storageState={storageState}
											financialData={financialData}
										/>
									))}
								</Box>
							) : (
								<Typography
									variant="body2"
									sx={{ color: "text.secondary", fontStyle: "italic" }}
								>
									No conditions attached to this contract.
								</Typography>
							)}
						</Box>

						{/* Settlement Logs (Rendered on Financial Page) */}
						{showSettlementLogs && (
							<Box
								sx={{
									mt: 1,
									pt: 1,
									borderTop: `1px solid ${theme.palette.divider}`,
								}}
							>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontWeight: 800,
										display: "block",
										mb: 0.75,
									}}
								>
									SETTLEMENT LOGS & TRANSACTION HISTORY
								</Typography>
								<Stack spacing={0.75}>
									{allConditions
										.filter(
											(cond) =>
												(cond.status || "").toUpperCase() === "FULFILLED",
										)
										.map((cond, idx) => (
											<Paper
												key={cond.id || idx}
												variant="outlined"
												sx={{
													p: 1,
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													bgcolor: "rgba(74, 222, 128, 0.05)",
													borderColor: "rgba(74, 222, 128, 0.2)",
												}}
											>
												<Box>
													<Typography
														variant="subtitle2"
														sx={{ fontSize: "0.75rem", fontWeight: 700 }}
													>
														Condition #{cond.index || idx + 1}:{" "}
														{cond.type?.replace(/_/g, " ")}
													</Typography>
													{cond.material_summary && (
														<Typography
															variant="caption"
															sx={{ color: "text.secondary" }}
														>
															{cond.material_summary}
														</Typography>
													)}
												</Box>
												<Chip
													label="Fulfilled"
													size="small"
													color="success"
													sx={{
														height: 16,
														fontSize: "0.55rem",
														fontWeight: 800,
													}}
												/>
											</Paper>
										))}
								</Stack>
							</Box>
						)}
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default ContractDetailDialog;
