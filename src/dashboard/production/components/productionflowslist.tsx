import React from "react";
import { Box, Typography, Tooltip, Divider, useTheme } from "@mui/material";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import MaterialBadge from "../../../cosm/components/materialbadge";
import type { FlowData } from "../types";

const formatFlow = (val: number) => {
	const sign = val > 0 ? "+" : "";
	return `${sign}${val.toLocaleString("en-US", { maximumFractionDigits: 1 })}`;
};

const smartFormat = (val: number, isFlow: boolean = false) => {
	const absVal = Math.abs(val);
	const sign = isFlow && val > 0 ? "+" : "";
	const fullStr = isFlow
		? formatFlow(val)
		: val.toLocaleString("en-US", { maximumFractionDigits: 0 });

	if (absVal >= 1000000) {
		return {
			text: `${sign}${(val / 1000000).toFixed(1)}M`,
			full: fullStr,
			isAbbreviated: true,
		};
	}

	const formatted = isFlow
		? formatFlow(val)
		: val.toLocaleString("en-US", { maximumFractionDigits: 0 });
	return {
		text: formatted,
		full: fullStr,
		isAbbreviated: false,
	};
};

interface ProductionFlowsListProps {
	productionList: FlowData[];
	consumptionList: FlowData[];
	targetDays: number;
	dailyImportVolume: number;
	dailyImportMass: number;
	dailyExportVolume: number;
	dailyExportMass: number;
	dailyRevenue: number;
	dailyExpenses: number;
	dailyProfit: number;
}

export const ProductionFlowsList: React.FC<ProductionFlowsListProps> = ({
	productionList,
	consumptionList,
	targetDays,
	dailyImportVolume,
	dailyImportMass,
	dailyExportVolume,
	dailyExportMass,
	dailyRevenue,
	dailyExpenses,
	dailyProfit,
}) => {
	const theme = useTheme();

	return (
		<Box
			sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}
		>
			{/* Import/day, Export/day & Financial Summary */}
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: 0.35,
					px: 1.25,
					py: 0.6,
					bgcolor: "rgba(0, 0, 0, 0.4)",
					borderRadius: "8px",
					border: "1px solid rgba(123, 104, 238, 0.15)",
					mb: 0.5,
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255, 255, 255, 0.6)",
							fontWeight: 700,
							fontSize: "0.78rem",
							whiteSpace: "nowrap",
						}}
					>
						Import/day:
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: "text.primary",
							fontWeight: 600,
							fontSize: "0.78rem",
							fontFamily: "monospace",
							whiteSpace: "nowrap",
						}}
					>
						{dailyImportVolume.toLocaleString(undefined, {
							maximumFractionDigits: 1,
						})}{" "}
						m³ /{" "}
						{dailyImportMass.toLocaleString(undefined, {
							maximumFractionDigits: 1,
						})}{" "}
						t
					</Typography>
				</Box>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255, 255, 255, 0.6)",
							fontWeight: 700,
							fontSize: "0.78rem",
							whiteSpace: "nowrap",
						}}
					>
						Export/day:
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: "text.primary",
							fontWeight: 600,
							fontSize: "0.78rem",
							fontFamily: "monospace",
							whiteSpace: "nowrap",
						}}
					>
						{dailyExportVolume.toLocaleString(undefined, {
							maximumFractionDigits: 1,
						})}{" "}
						m³ /{" "}
						{dailyExportMass.toLocaleString(undefined, {
							maximumFractionDigits: 1,
						})}{" "}
						t
					</Typography>
				</Box>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						pt: 0.4,
						borderTop: "1px solid rgba(255,255,255,0.06)",
					}}
				>
					<Tooltip title="Daily Revenue from production sales">
						<Typography
							variant="caption"
							sx={{
								color: "#69f0ae",
								fontSize: "0.8rem",
								fontFamily: "monospace",
								fontVariantNumeric: "tabular-nums",
								fontWeight: 600,
							}}
						>
							+${(dailyRevenue / 1000).toFixed(1)}k
						</Typography>
					</Tooltip>
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}
					>
						|
					</Typography>
					<Tooltip title="Daily Expenses for inputs & workforce">
						<Typography
							variant="caption"
							sx={{
								color: "#ff5252",
								fontSize: "0.8rem",
								fontFamily: "monospace",
								fontVariantNumeric: "tabular-nums",
								fontWeight: 600,
							}}
						>
							-${(dailyExpenses / 1000).toFixed(1)}k
						</Typography>
					</Tooltip>
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}
					>
						|
					</Typography>
					<Tooltip title="Net Daily Profit / Loss">
						<Typography
							variant="caption"
							sx={{
								color: dailyProfit >= 0 ? "#69f0ae" : "#ff5252",
								fontSize: "0.8rem",
								fontFamily: "monospace",
								fontVariantNumeric: "tabular-nums",
								fontWeight: 700,
							}}
						>
							{dailyProfit >= 0 ? "+" : ""}${(dailyProfit / 1000).toFixed(1)}k/d
						</Typography>
					</Tooltip>
				</Box>
			</Box>

			{/* PROD Header */}
			{productionList.length > 0 && (
				<Box>
					<Typography
						variant="subtitle2"
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.5,
							mb: 0.25,
							height: 18,
							color: "#69f0ae",
							fontWeight: 800,
							fontSize: "0.78rem",
						}}
					>
						<ArrowUpCircle size={13} color="#69f0ae" /> PROD
					</Typography>
					<Box sx={{ display: "grid", gap: 0.25 }}>
						{productionList.map((p) => (
							<Box
								key={p.ticker}
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									rowGap: 0.3,
									columnGap: 0.75,
									px: 0.5,
									borderRadius: "6px",
								}}
							>
								<Box
									sx={{
										fontSize: "0.75em",
										display: "flex",
										alignItems: "center",
									}}
								>
									<MaterialBadge ticker={p.ticker} />
								</Box>
								<Typography
									variant="caption"
									sx={{
										fontWeight: 700,
										color: "#69f0ae",
										textAlign: "right",
										fontSize: "0.8rem",
										fontFamily: "monospace",
										fontVariantNumeric: "tabular-nums",
									}}
								>
									{smartFormat(p.flow, true).text}/d
								</Typography>
							</Box>
						))}
					</Box>
				</Box>
			)}

			{consumptionList.length > 0 && (
				<Box sx={{ mt: productionList.length ? 0.5 : 0 }}>
					<Typography
						variant="subtitle2"
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.5,
							mb: 0.25,
							color: "#ff5252",
							fontWeight: 800,
							fontSize: "0.78rem",
						}}
					>
						<ArrowDownCircle size={13} /> CONS
					</Typography>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
						{consumptionList.map((c, index) => {
							const dailyCons = Math.abs(c.flow);
							const siteStock = c.siteAmount || 0;
							const whStock = c.warehouseAmount || 0;

							const siteDays = dailyCons > 0 ? siteStock / dailyCons : 999;
							const whDays = dailyCons > 0 ? whStock / dailyCons : 0;

							const targetQty = targetDays * dailyCons;
							const siteMissing = Math.max(0, targetQty - siteStock);

							const isCritical = siteDays < targetDays / 5;
							const isWarning = siteDays < targetDays;
							const daysColor = isCritical
								? "#ff5252"
								: isWarning
									? "#ffd700"
									: "rgba(255, 255, 255, 0.85)";

							const { text: siteMissingText } = smartFormat(siteMissing);

							return (
								<Box key={c.ticker}>
									{index > 0 && (
										<Divider
											sx={{ borderColor: "rgba(255, 255, 255, 0.08)", my: 0.4 }}
										/>
									)}
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											rowGap: 0.3,
											columnGap: 0.75,
											px: 0.5,
											borderRadius: "6px",
										}}
									>
										{/* Left: Material Badge + Daily Flow */}
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 0.75,
												flexShrink: 0,
											}}
										>
											<Box
												sx={{
													fontSize: "0.75em",
													display: "flex",
													alignItems: "center",
												}}
											>
												<MaterialBadge ticker={c.ticker} />
											</Box>
											<Typography
												variant="caption"
												sx={{
													color: "#ff5252",
													fontSize: "0.75rem",
													fontFamily: "monospace",
													fontVariantNumeric: "tabular-nums",
													fontWeight: 700,
													whiteSpace: "nowrap",
												}}
											>
												-{dailyCons.toFixed(2)}/d
											</Typography>
										</Box>

										{/* Right / Wrapped: Supply Days & Need / Stored Amount */}
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 0.75,
												flexWrap: "wrap",
												justifyContent: "center",
											}}
										>
											{/* Supply Days Status Chip */}
											<Tooltip
												title={`Site Inventory: ${siteDays > 999 ? "∞" : `${siteDays.toFixed(1)}d`} (${siteStock.toLocaleString()} u)${whDays > 0 ? ` | Warehouse Backup: ${whDays.toFixed(1)}d (${whStock.toLocaleString()} u)` : ""}`}
											>
												<Box
													sx={{
														px: 0.65,
														borderRadius: "4px",
														bgcolor: `${daysColor}15`,
														border: `1px solid ${daysColor}35`,
														display: "flex",
														alignItems: "center",
														gap: 0.35,
														whiteSpace: "nowrap",
													}}
												>
													<Typography
														variant="caption"
														sx={{
															fontSize: "0.72rem",
															fontWeight: 800,
															color: daysColor,
															fontFamily: "monospace",
														}}
													>
														{siteDays > 999 ? "∞" : `${siteDays.toFixed(1)}d`}
													</Typography>
													{whDays > 0 && (
														<Typography
															variant="caption"
															sx={{
																fontSize: "0.68rem",
																fontWeight: 600,
																color: "rgba(255,255,255,0.55)",
																fontFamily: "monospace",
															}}
														>
															(+{whDays.toFixed(1)}d)
														</Typography>
													)}
												</Box>
											</Tooltip>

											{/* Stored / Need Amount */}
											<Tooltip
												title={`Site Stock: ${siteStock.toLocaleString()} u | Need for ${targetDays}d: ${siteMissing > 0 ? siteMissingText : "Covered"}`}
											>
												<Typography
													variant="caption"
													sx={{
														color:
															siteMissing > 0
																? "#ffd700"
																: "rgba(255,255,255,0.75)",
														fontSize: "0.75rem",
														fontFamily: "monospace",
														fontVariantNumeric: "tabular-nums",
														fontWeight: 600,
														textAlign: "right",
														whiteSpace: "nowrap",
													}}
												>
													{siteStock.toLocaleString()} u
												</Typography>
											</Tooltip>
										</Box>
									</Box>
								</Box>
							);
						})}
					</Box>
				</Box>
			)}

			{!productionList.length && !consumptionList.length && (
				<Typography
					variant="caption"
					color="text.disabled"
					fontStyle="italic"
					textAlign="center"
					sx={{ py: 1, fontSize: "0.7rem" }}
				>
					No active flow
				</Typography>
			)}
		</Box>
	);
};
