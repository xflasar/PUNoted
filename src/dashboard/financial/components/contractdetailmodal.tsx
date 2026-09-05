import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	Box,
	Typography,
	IconButton,
	Chip,
	Grid,
	LinearProgress,
	Divider,
	CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HandshakeIcon from "@mui/icons-material/Handshake";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import PersonIcon from "@mui/icons-material/Person";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PaymentsIcon from "@mui/icons-material/Payments";
import DescriptionIcon from "@mui/icons-material/Description";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";
import { fetchClient } from "../../../utils/apiclient";

interface ContractDetailModalProps {
	open: boolean;
	onClose: () => void;
	contract: any | null;
	currency: string;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
	open,
	onClose,
	contract,
	currency,
}) => {
	const [contractDetail, setContractDetail] = useState<any | null>(null);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		const targetId =
			contract?.id ||
			contract?.Id ||
			contract?.contract_id ||
			contract?.ContractId;
		if (open && targetId) {
			setLoading(true);
			fetchClient(`internal/contracts/detail?contract_id=${targetId}`)
				.then(async (res) => {
					if (res && res.ok) {
						const data = await res.json();
						setContractDetail(data);
					} else {
						setContractDetail(null);
					}
				})
				.catch((err) => {
					console.error("Failed to fetch contract details:", err);
					setContractDetail(null);
				})
				.finally(() => setLoading(false));
		} else {
			setContractDetail(null);
		}
	}, [open, contract]);

	if (!contract) return null;

	const activeContract = contractDetail || contract;

	const partnerName =
		activeContract.partnername ||
		activeContract.counterparty_name ||
		activeContract.partnercode ||
		activeContract.counterparty_code ||
		"Counterparty";
	const partnerCode =
		activeContract.partnercode || activeContract.counterparty_code || "";
	const contractCurrency = activeContract.currency || currency || "ICA";
	const party = activeContract.party || "CUSTOMER";
	const isCustomer = party === "CUSTOMER";

	const natId =
		activeContract.naturalid ||
		activeContract.NaturalId ||
		activeContract.localid ||
		activeContract.LocalId ||
		(activeContract.id
			? `CTR-${String(activeContract.id).substring(0, 8)}`
			: "CTR-N/A");

	const status = (activeContract.status || "ACTIVE").toUpperCase();

	// Parse conditions
	const allConditions: any[] =
		activeContract.conditions || activeContract.Conditions || [];
	const totalCondCount = allConditions.length;
	const fulfilledCondCount = allConditions.filter(
		(c) => (c.status || c.Status || "").toUpperCase() === "FULFILLED",
	).length;

	const condPercent =
		totalCondCount > 0
			? Math.min(100, Math.round((fulfilledCondCount / totalCondCount) * 100))
			: 100;

	// Total contract value calculation
	const totalAmount =
		activeContract.total_amount ||
		activeContract.totalamount ||
		activeContract.amount ||
		allConditions.reduce(
			(sum, c) =>
				sum + Number(c.amountmoney || c.repaymentamount || c.amount || 0),
			0,
		);

	const getStatusChipProps = (st: string) => {
		switch (st) {
			case "FULFILLED":
				return {
					label: "Fulfilled",
					color: SEMANTIC_COLORS.neonGreen,
					bgcolor: "rgba(74, 222, 128, 0.15)",
				};
			case "IN_PROGRESS":
			case "ACTIVE":
			case "PENDING":
				return {
					label: st.replace("_", " "),
					color: "#7b68ee",
					bgcolor: "rgba(123, 104, 238, 0.15)",
				};
			case "CANCELLED":
				return {
					label: "Cancelled",
					color: "rgba(255, 255, 255, 0.5)",
					bgcolor: "rgba(255, 255, 255, 0.1)",
				};
			case "BREACHED":
			case "REJECTED":
				return {
					label: st,
					color: SEMANTIC_COLORS.neonRed,
					bgcolor: "rgba(248, 113, 113, 0.15)",
				};
			default:
				return {
					label: st,
					color: "#7b68ee",
					bgcolor: "rgba(123, 104, 238, 0.15)",
				};
		}
	};

	const statusProps = getStatusChipProps(status);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: {
					bgcolor: "rgba(10, 10, 22, 0.95)",
					backdropFilter: "blur(25px)",
					border: "1px solid rgba(123, 104, 238, 0.3)",
					borderRadius: "14px",
					color: "white",
					boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
				},
			}}
		>
			{/* Dialog Header */}
			<DialogTitle
				sx={{
					m: 0,
					p: 2,
					display: "flex",
					alignItems: "center",
					justify: "space-between",
					borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
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
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Typography
								sx={{ fontSize: "1.1rem", fontWeight: 800, color: "white" }}
							>
								{activeContract.name || `Contract ${natId}`}
							</Typography>
							<Chip
								label={statusProps.label}
								size="small"
								sx={{
									height: 20,
									fontSize: "0.62rem",
									fontWeight: 800,
									bgcolor: statusProps.bgcolor,
									color: statusProps.color,
								}}
							/>
						</Box>
						<Typography
							sx={{
								fontSize: "0.72rem",
								color: "#7b68ee",
								fontFamily: "monospace",
								fontWeight: 700,
							}}
						>
							{natId}
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
					<CloseIcon />
				</IconButton>
			</DialogTitle>

			<DialogContent
				sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}
			>
				{loading ? (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							py: 6,
						}}
					>
						<CircularProgress size={32} sx={{ color: "#7b68ee" }} />
					</Box>
				) : (
					<>
						{/* Key Financial Overview Cards */}
						<Grid container spacing={1.5}>
							<Grid item xs={12} sm={4}>
								<Box
									sx={{
										p: 1.5,
										borderRadius: "10px",
										bgcolor: "rgba(0, 0, 0, 0.4)",
										border: "1px solid rgba(255, 255, 255, 0.08)",
									}}
								>
									<Typography
										sx={{
											fontSize: "0.66rem",
											fontWeight: 800,
											textTransform: "uppercase",
											color: "rgba(255,255,255,0.45)",
											letterSpacing: "0.05em",
										}}
									>
										Total Contract Value
									</Typography>
									<Typography
										sx={{
											fontSize: "1.15rem",
											fontFamily: "monospace",
											fontWeight: 800,
											color: isCustomer
												? SEMANTIC_COLORS.neonGreen
												: SEMANTIC_COLORS.neonRed,
											mt: 0.5,
										}}
									>
										{isCustomer ? "+" : "-"}
										{formatCurrency(totalAmount)}{" "}
										<Typography
											component="span"
											sx={{
												fontSize: "0.7rem",
												color: "rgba(255,255,255,0.5)",
											}}
										>
											{contractCurrency}
										</Typography>
									</Typography>
								</Box>
							</Grid>

							<Grid item xs={12} sm={4}>
								<Box
									sx={{
										p: 1.5,
										borderRadius: "10px",
										bgcolor: "rgba(0, 0, 0, 0.4)",
										border: "1px solid rgba(255, 255, 255, 0.08)",
									}}
								>
									<Typography
										sx={{
											fontSize: "0.66rem",
											fontWeight: 800,
											textTransform: "uppercase",
											color: "rgba(255,255,255,0.45)",
											letterSpacing: "0.05em",
										}}
									>
										Counterparty & Role
									</Typography>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 0.75,
											mt: 0.5,
										}}
									>
										<PersonIcon sx={{ fontSize: 16, color: "#7b68ee" }} />
										<Typography
											sx={{
												fontSize: "0.9rem",
												fontWeight: 800,
												color: "white",
											}}
										>
											{partnerName} {partnerCode && `(${partnerCode})`}
										</Typography>
									</Box>
									<Typography
										sx={{
											fontSize: "0.68rem",
											color: isCustomer
												? SEMANTIC_COLORS.neonGreen
												: SEMANTIC_COLORS.neonRed,
											fontWeight: 700,
											mt: 0.2,
										}}
									>
										Role: {party}
									</Typography>
								</Box>
							</Grid>

							<Grid item xs={12} sm={4}>
								<Box
									sx={{
										p: 1.5,
										borderRadius: "10px",
										bgcolor: "rgba(0, 0, 0, 0.4)",
										border: "1px solid rgba(255, 255, 255, 0.08)",
									}}
								>
									<Typography
										sx={{
											fontSize: "0.66rem",
											fontWeight: 800,
											textTransform: "uppercase",
											color: "rgba(255,255,255,0.45)",
											letterSpacing: "0.05em",
										}}
									>
										Fulfillment Progress
									</Typography>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											mt: 0.5,
										}}
									>
										<Typography
											sx={{
												fontSize: "0.88rem",
												fontFamily: "monospace",
												fontWeight: 800,
												color: "white",
											}}
										>
											{fulfilledCondCount} / {totalCondCount} Conditions
										</Typography>
										<Typography
											sx={{
												fontSize: "0.78rem",
												fontFamily: "monospace",
												fontWeight: 800,
												color: "#7b68ee",
											}}
										>
											{condPercent}%
										</Typography>
									</Box>
									<LinearProgress
										variant="determinate"
										value={condPercent}
										sx={{
											mt: 0.75,
											height: 6,
											borderRadius: 3,
											bgcolor: "rgba(255, 255, 255, 0.08)",
											"& .MuiLinearProgress-bar": { bgcolor: "#7b68ee" },
										}}
									/>
								</Box>
							</Grid>
						</Grid>

						<Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />

						{/* Contract Conditions & Deliverables List */}
						<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
								<DescriptionIcon sx={{ fontSize: 16, color: "#7b68ee" }} />
								<Typography
									sx={{
										fontSize: "0.82rem",
										fontWeight: 800,
										textTransform: "uppercase",
										color: "rgba(255, 255, 255, 0.8)",
										letterSpacing: "0.05em",
									}}
								>
									Contract Terms & Conditions ({allConditions.length})
								</Typography>
							</Box>

							{allConditions.length > 0 ? (
								<Box
									sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}
								>
									{allConditions.map((cond: any, idx: number) => {
										const condStatus = (
											cond.status ||
											cond.Status ||
											"PENDING"
										).toUpperCase();
										const isFulfilled = condStatus === "FULFILLED";
										const condType = (
											cond.type ||
											cond.Type ||
											"CLAUSE"
										).replace(/_/g, " ");

										const matTicker =
											cond.material_ticker || cond.materialid || cond.ticker;
										const amountQty =
											cond.amount || cond.quantity || cond.units;
										const amountMoney =
											cond.amountmoney || cond.repaymentamount;

										return (
											<Box
												key={`cond_${cond.id || idx}_${idx}`}
												sx={{
													p: 1.25,
													borderRadius: "8px",
													bgcolor: isFulfilled
														? "rgba(74, 222, 128, 0.05)"
														: "rgba(0, 0, 0, 0.35)",
													border: `1px solid ${isFulfilled ? "rgba(74, 222, 128, 0.2)" : "rgba(255, 255, 255, 0.08)"}`,
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
													gap: 1.5,
												}}
											>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 1.25,
													}}
												>
													<Box
														sx={{
															color: isFulfilled
																? SEMANTIC_COLORS.neonGreen
																: "#7b68ee",
															display: "flex",
														}}
													>
														{matTicker ? (
															<LocalShippingIcon sx={{ fontSize: 18 }} />
														) : (
															<PaymentsIcon sx={{ fontSize: 18 }} />
														)}
													</Box>
													<Box>
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																gap: 0.75,
															}}
														>
															<Typography
																sx={{
																	fontSize: "0.78rem",
																	fontWeight: 800,
																	color: "white",
																}}
															>
																Condition #{idx + 1}: {condType}
															</Typography>
															<Chip
																label={condStatus}
																size="small"
																sx={{
																	height: 16,
																	fontSize: "0.52rem",
																	fontWeight: 800,
																	bgcolor: isFulfilled
																		? "rgba(74, 222, 128, 0.15)"
																		: "rgba(123, 104, 238, 0.15)",
																	color: isFulfilled
																		? SEMANTIC_COLORS.neonGreen
																		: "#7b68ee",
																}}
															/>
														</Box>
														<Typography
															sx={{
																fontSize: "0.70rem",
																color: "rgba(255,255,255,0.6)",
																mt: 0.2,
															}}
														>
															{matTicker ? (
																<>
																	Deliverable:{" "}
																	<strong>
																		{amountQty}x {matTicker}
																	</strong>{" "}
																	{cond.destination && `to ${cond.destination}`}
																</>
															) : amountMoney ? (
																<>
																	Payment:{" "}
																	<strong>
																		{formatCurrency(amountMoney)}{" "}
																		{contractCurrency}
																	</strong>
																</>
															) : (
																cond.description || "Contract obligation term"
															)}
														</Typography>
													</Box>
												</Box>

												<Box sx={{ textAlign: "right" }}>
													{isFulfilled &&
													(cond.fulfilled_timestamp ||
														cond.fulfilled_at ||
														cond.fulfilledAt ||
														cond.timestamp) ? (
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																gap: 0.4,
																justifyContent: "flex-end",
															}}
														>
															<CalendarMonthIcon
																sx={{
																	fontSize: 12,
																	color: SEMANTIC_COLORS.neonGreen,
																}}
															/>
															<Typography
																sx={{
																	fontSize: "0.66rem",
																	fontFamily: "monospace",
																	color: SEMANTIC_COLORS.neonGreen,
																}}
															>
																{new Date(
																	cond.fulfilled_timestamp ||
																		cond.fulfilled_at ||
																		cond.fulfilledAt ||
																		cond.timestamp,
																).toLocaleDateString()}
															</Typography>
														</Box>
													) : cond.deadline ? (
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																gap: 0.4,
																justifyContent: "flex-end",
															}}
														>
															<CalendarMonthIcon
																sx={{
																	fontSize: 12,
																	color: "rgba(255,255,255,0.4)",
																}}
															/>
															<Typography
																sx={{
																	fontSize: "0.66rem",
																	fontFamily: "monospace",
																	color: "rgba(255,255,255,0.6)",
																}}
															>
																Due:{" "}
																{new Date(cond.deadline).toLocaleDateString()}
															</Typography>
														</Box>
													) : null}
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 0.3,
															justifyContent: "flex-end",
															mt: 0.2,
														}}
													>
														{isFulfilled ? (
															<CheckCircleIcon
																sx={{
																	fontSize: 14,
																	color: SEMANTIC_COLORS.neonGreen,
																}}
															/>
														) : (
															<HourglassTopIcon
																sx={{ fontSize: 14, color: "#7b68ee" }}
															/>
														)}
														<Typography
															sx={{
																fontSize: "0.64rem",
																fontWeight: 800,
																color: isFulfilled
																	? SEMANTIC_COLORS.neonGreen
																	: "#7b68ee",
															}}
														>
															{isFulfilled ? "Fulfilled" : "Pending"}
														</Typography>
													</Box>
												</Box>
											</Box>
										);
									})}
								</Box>
							) : (
								<Box
									sx={{
										p: 2,
										borderRadius: "8px",
										bgcolor: "rgba(0,0,0,0.3)",
										textAlign: "center",
										color: "rgba(255,255,255,0.4)",
										fontSize: "0.75rem",
									}}
								>
									No specific item conditions attached to this contract
									agreement.
								</Box>
							)}
						</Box>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};
