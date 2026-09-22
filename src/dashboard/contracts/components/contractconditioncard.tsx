import React from "react";
import { Paper, Box, Stack, Chip, Typography } from "@mui/material";
import {
	CheckCircle as CheckCircleIcon,
	LocalShipping as LocalShippingIcon,
	Payments as PaymentsIcon,
} from "@mui/icons-material";
import MaterialBadge from "../../../cosm/components/materialbadge";
import {
	formatCurrency,
	SEMANTIC_COLORS,
} from "../../financial/utils/financeutils";
import dayjs from "dayjs";
import type { Condition, VendorOrder } from "../types";
import { useContractConditionCard } from "../hooks/usecontractconditioncard";

interface ContractConditionCardProps {
	cond: Condition;
	idx: number;
	contract: any;
	allConditions: Condition[];
	marketData: any;
	corpPrices: any;
	vendorOrders: VendorOrder[];
	storageState: any;
	financialData: any;
}

export const ContractConditionCard: React.FC<ContractConditionCardProps> =
	React.memo((props) => {
		const { cond, idx, contract } = props;
		const {
			isFulfilled,
			condType,
			isMaterial,
			isMoney,
			isMyCondition,
			matTicker,
			matQty,
			locName,
			unitPrice,
			marketPrice,
			corpPrice,
			vendorPrice,
			isVendorMatch,
			isCorpMatch,
			availableStock,
			hasEnoughStock,
			canUserAfford,
		} = useContractConditionCard(props);

		return (
			<Paper
				key={cond.id || idx}
				variant="outlined"
				sx={{
					p: 1.5,
					flex: "1 1 250px",
					maxWidth: "340px",
					minWidth: "250px",
					borderRadius: "10px",
					bgcolor: isFulfilled
						? "rgba(74, 222, 128, 0.04)"
						: "rgba(18, 18, 37, 0.75)",
					borderColor: isFulfilled
						? "rgba(74, 222, 128, 0.25)"
						: isMyCondition
							? "rgba(56, 189, 248, 0.25)"
							: "rgba(123, 104, 238, 0.2)",
					boxShadow: isFulfilled ? "0 0 12px rgba(74, 222, 128, 0.05)" : "none",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					gap: 1.25,
					transition: "all 0.2s ease-in-out",
					"&:hover": {
						borderColor: isFulfilled
							? "rgba(74, 222, 128, 0.4)"
							: "rgba(123, 104, 238, 0.4)",
						bgcolor: "rgba(24, 24, 48, 0.85)",
					},
				}}
			>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
					{/* Header: Item Index & Status Chips */}
					<Stack
						sx={{
							display: "flex",
							flexDirection: "row",
							spacing: 0.75,
							alignItems: "center",
							justifyContent: "space-between",
							flexWrap: "wrap",
						}}
					>
						<Chip
							icon={
								isFulfilled ? (
									<CheckCircleIcon
										sx={{
											fontSize: "14px !important",
											color: `${SEMANTIC_COLORS.neonGreen} !important`,
										}}
									/>
								) : isMaterial ? (
									<LocalShippingIcon
										sx={{
											fontSize: "14px !important",
											color: "#38bdf8 !important",
										}}
									/>
								) : (
									<PaymentsIcon
										sx={{
											fontSize: "14px !important",
											color: `${SEMANTIC_COLORS.neonGreen} !important`,
										}}
									/>
								)
							}
							label={`Condition #${cond.index !== undefined ? cond.index : idx + 1}`}
							size="small"
							sx={{
								height: 22,
								fontSize: "0.68rem",
								fontWeight: 800,
								bgcolor: isFulfilled
									? "rgba(74, 222, 128, 0.12)"
									: isMaterial
										? "rgba(56, 189, 248, 0.12)"
										: "rgba(74, 222, 128, 0.12)",
								color: isFulfilled
									? SEMANTIC_COLORS.neonGreen
									: isMaterial
										? "#38bdf8"
										: SEMANTIC_COLORS.neonGreen,
								border: `1px solid ${
									isFulfilled
										? "rgba(74, 222, 128, 0.3)"
										: isMaterial
											? "rgba(56, 189, 248, 0.3)"
											: "rgba(74, 222, 128, 0.3)"
								}`,
							}}
						/>

						<Chip
							label={isFulfilled ? "PAID" : "PENDING"}
							size="small"
							sx={{
								height: 20,
								fontSize: "0.58rem",
								fontWeight: 800,
								bgcolor: isFulfilled
									? "rgba(74, 222, 128, 0.15)"
									: "rgba(123, 104, 238, 0.15)",
								color: isFulfilled ? SEMANTIC_COLORS.neonGreen : "#7b68ee",
							}}
						/>
					</Stack>

					{/* Sub-Header: Condition Type & Stance */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							gap: 0.5,
						}}
					>
						<Typography
							sx={{ fontSize: "0.78rem", fontWeight: 800, color: "white" }}
						>
							{condType}
						</Typography>
						<Chip
							label={isMyCondition ? "YOU" : "PARTNER"}
							size="small"
							sx={{
								height: 18,
								fontSize: "0.55rem",
								fontWeight: 800,
								bgcolor: isMyCondition
									? "rgba(56, 189, 248, 0.15)"
									: "rgba(245, 158, 11, 0.15)",
								color: isMyCondition ? "#38bdf8" : "#f59e0b",
							}}
						/>
					</Box>

					{/* Material Display Row with MaterialBadge */}
					{isMaterial && (
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 0.75,
								p: 1,
								borderRadius: "8px",
								bgcolor: "rgba(0,0,0,0.35)",
								border: "1px solid rgba(255,255,255,0.06)",
							}}
						>
							{matTicker ? (
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										flexWrap: "wrap",
										gap: 0.75,
									}}
								>
									<Box
										sx={{
											display: "inline-flex",
											alignItems: "center",
											gap: 0.75,
										}}
									>
										<Typography
											sx={{
												fontSize: "0.85rem",
												fontWeight: 800,
												color: "white",
											}}
										>
											{matQty ? matQty.toLocaleString() : 1}x
										</Typography>
									</Box>
									<MaterialBadge ticker={matTicker} />
								</Box>
							) : (
								<Typography
									variant="body2"
									sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 700 }}
								>
									{cond.material_summary || "Deliverable Material"}
								</Typography>
							)}

							{/* Stock level tag at specified delivery location */}
							{matTicker && isMyCondition && !isFulfilled && (
								<Chip
									label={`Stock: ${availableStock.toLocaleString()} / ${matQty || 1} ${hasEnoughStock ? "✓" : "⚠️"}`}
									size="small"
									sx={{
										height: 18,
										fontSize: "0.6rem",
										fontWeight: 800,
										width: "100%",
										justifyContent: "center",
										bgcolor: hasEnoughStock
											? "rgba(74, 222, 128, 0.15)"
											: "rgba(239, 68, 68, 0.15)",
										color: hasEnoughStock
											? SEMANTIC_COLORS.neonGreen
											: "#ef4444",
										border: `1px solid ${hasEnoughStock ? "rgba(74, 222, 128, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
									}}
								/>
							)}
						</Box>
					)}

					{/* Location & Deadline Rows */}
					{(locName ||
						cond.deadline ||
						(cond as any).deadlineduration_millis ||
						contract?.duedate) && (
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 0.25,
								my: 0.25,
							}}
						>
							{locName && (
								<Typography
									variant="caption"
									sx={{
										color: "rgba(255,255,255,0.65)",
										fontSize: "0.7rem",
										display: "block",
									}}
								>
									📍 Location:{" "}
									<strong style={{ color: "#a78bfa" }}>{locName}</strong>
								</Typography>
							)}

							{(cond.deadline ||
								(cond as any).deadlineduration_millis ||
								(!isFulfilled && contract?.duedate)) && (
								<Typography
									variant="caption"
									sx={{
										color: "rgba(255,255,255,0.65)",
										fontSize: "0.68rem",
										display: "flex",
										alignItems: "center",
										gap: 0.5,
									}}
								>
									⏱️ Due:{" "}
									<strong
										style={{
											color: isFulfilled
												? SEMANTIC_COLORS.neonGreen
												: "#f59e0b",
										}}
									>
										{cond.deadline
											? dayjs(cond.deadline).format("M/D/YYYY HH:mm")
											: (cond as any).deadlineduration_millis
												? `${Math.round((cond as any).deadlineduration_millis / 86400000)} Days from start`
												: dayjs(contract.duedate).format("M/D/YYYY")}
									</strong>
								</Typography>
							)}
						</Box>
					)}

					{/* Condition Money Display */}
					{cond.amountmoney && (
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
								sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700 }}
							>
								Amount:
							</Typography>
							<Typography
								sx={{
									fontSize: "1.05rem",
									fontFamily: "monospace",
									fontWeight: 800,
									color: isMyCondition
										? SEMANTIC_COLORS.neonRed
										: SEMANTIC_COLORS.neonGreen,
								}}
							>
								{isMyCondition ? "-" : "+"}
								{formatCurrency(cond.amountmoney)} {contract.contract_currency}
							</Typography>
						</Box>
					)}
				</Box>

				{/* Bottom Footer: Audit Chips & Action Badges */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 0.5,
						pt: 0.75,
						borderTop: "1px dashed rgba(255,255,255,0.08)",
					}}
				>
					{/* Action Payment status for User */}
					{isMyCondition && !isFulfilled && isMoney && (
						<Chip
							label={canUserAfford ? "READY TO PAY" : "INSUFFICIENT BALANCE"}
							size="small"
							sx={{
								height: 20,
								fontSize: "0.58rem",
								fontWeight: 800,
								width: "100%",
								bgcolor: canUserAfford
									? "rgba(74, 222, 128, 0.2)"
									: "rgba(239, 68, 68, 0.2)",
								color: canUserAfford ? SEMANTIC_COLORS.neonGreen : "#ef4444",
								border: `1px solid ${canUserAfford ? SEMANTIC_COLORS.neonGreen : "#ef4444"}`,
							}}
						/>
					)}

					{/* Pricing Audit Chips Bar */}
					{unitPrice > 0 && (
						<Stack
							sx={{
								display: "flex",
								flexDirection: "row",
								gap: 0.5,
								flexWrap: "wrap",
								justifyContent: "flex-start",
								alignItems: "center",
								alignContent: "flex-start",
							}}
						>
							<Chip
								label={`Unit: ${formatCurrency(unitPrice)}`}
								size="small"
								variant="outlined"
								sx={{
									height: 18,
									fontSize: "0.58rem",
									fontWeight: 700,
									borderColor: "rgba(255,255,255,0.2)",
									color: "rgba(255,255,255,0.8)",
								}}
							/>

							{vendorPrice !== null && (
								<Chip
									label={isVendorMatch ? `Vendor Match ✓` : `Vendor Order ✕`}
									size="small"
									sx={{
										height: 18,
										fontSize: "0.58rem",
										fontWeight: 800,
										bgcolor: isVendorMatch
											? "rgba(74, 222, 128, 0.15)"
											: "rgba(245, 158, 11, 0.15)",
										color: isVendorMatch
											? SEMANTIC_COLORS.neonGreen
											: "#f59e0b",
										border: `1px solid ${isVendorMatch ? "rgba(74, 222, 128, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
									}}
								/>
							)}

							{corpPrice !== null && (
								<Chip
									label={isCorpMatch ? `Corp Match ✓` : `Corp ✕`}
									size="small"
									sx={{
										height: 18,
										fontSize: "0.58rem",
										fontWeight: 800,
										bgcolor: isCorpMatch
											? "rgba(74, 222, 128, 0.15)"
											: "rgba(239, 68, 68, 0.15)",
										color: isCorpMatch ? SEMANTIC_COLORS.neonGreen : "#ef4444",
										border: `1px solid ${isCorpMatch ? "rgba(74, 222, 128, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
									}}
								/>
							)}

							{/* CX Market Price & Overpriced Alert Reference */}
							{marketPrice !== null &&
								(() => {
									const diffPct =
										unitPrice > 0
											? ((unitPrice - marketPrice) / marketPrice) * 100
											: 0;
									const isOverpriced = diffPct > 15;
									const isUnderpriced = diffPct < -15;

									return (
										<Chip
											label={
												isOverpriced
													? `OVERPRICED (+${Math.round(diffPct)}% vs CX)`
													: isUnderpriced
														? `BELOW CX (-${Math.abs(Math.round(diffPct))}% vs CX)`
														: `CX: ${formatCurrency(marketPrice)}`
											}
											size="small"
											variant={
												isOverpriced || isUnderpriced ? "filled" : "outlined"
											}
											sx={{
												height: 18,
												fontSize: "0.58rem",
												fontWeight: 800,
												bgcolor: isOverpriced
													? "rgba(239, 68, 68, 0.2)"
													: isUnderpriced
														? "rgba(74, 222, 128, 0.2)"
														: "transparent",
												color: isOverpriced
													? SEMANTIC_COLORS.neonRed
													: isUnderpriced
														? SEMANTIC_COLORS.neonGreen
														: "#c084fc",
												border: `1px solid ${
													isOverpriced
														? SEMANTIC_COLORS.neonRed
														: isUnderpriced
															? SEMANTIC_COLORS.neonGreen
															: "rgba(123, 104, 238, 0.3)"
												}`,
											}}
										/>
									);
								})()}
						</Stack>
					)}
				</Box>
			</Paper>
		);
	});
