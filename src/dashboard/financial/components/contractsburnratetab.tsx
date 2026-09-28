import React, { useMemo } from "react";
import { Box, Typography, Chip, LinearProgress } from "@mui/material";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import HandshakeIcon from "@mui/icons-material/Handshake";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { FlexCard } from "./sharedui";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";
import MaterialBadge from "../../../cosm/components/materialbadge";
import { LocationValuation } from "../hooks/usefinancialcalculations";
import {
	CheckBoxOutlineBlankOutlined,
	ErrorOutlined,
} from "@mui/icons-material";

interface ContractsBurnRateTabProps {
	workforceBurnRate: {
		dailyCost: number;
		items: Array<{ ticker: string; dailyAmount: number; dailyCost: number }>;
	};
	locationValuations: LocationValuation[];
	currentData: any;
	netPending: number;
}

export const ContractsBurnRateTab: React.FC<ContractsBurnRateTabProps> = ({
	workforceBurnRate,
	locationValuations,
	currentData,
	netPending,
}) => {
	const currency = currentData?.Currency || "";
	const receivables = currentData?.PendingReceivable || 0;
	const payables = currentData?.PendingPayable || 0;

	// Calculate total stored quantities per material across all locations
	const storageTotalsMap = useMemo(() => {
		const map = new Map<string, number>();
		locationValuations.forEach((loc) => {
			loc.items.forEach((item) => {
				const current = map.get(item.ticker) || 0;
				map.set(item.ticker, current + item.amount);
			});
		});
		return map;
	}, [locationValuations]);

	// Enrich workforce items with storage stock & Days of Buffer Runway Remaining
	const enrichedBurnItems = useMemo(() => {
		return workforceBurnRate.items.map((item) => {
			const storedUnits = storageTotalsMap.get(item.ticker) || 0;
			const daysRemaining =
				item.dailyAmount > 0 ? storedUnits / item.dailyAmount : 999;
			return {
				...item,
				storedUnits,
				daysRemaining,
			};
		});
	}, [workforceBurnRate.items, storageTotalsMap]);

	const renderBufferStatusChip = (days: number) => {
		if (days >= 7) {
			return (
				<Chip
					icon={
						<CheckBoxOutlineBlankOutlined
							sx={{ fontSize: "14px !important", color: "#4ade80" }}
						/>
					}
					label={`${days.toFixed(1)} Days Buffer`}
					size="small"
					sx={{
						height: 20,
						fontSize: "0.62rem",
						fontWeight: 800,
						bgcolor: "rgba(74, 222, 128, 0.12)",
						color: "#4ade80",
						border: "1px solid rgba(74, 222, 128, 0.3)",
					}}
				/>
			);
		}
		if (days >= 3) {
			return (
				<Chip
					icon={
						<WarningAmberIcon
							sx={{ fontSize: "14px !important", color: "#fbbf24" }}
						/>
					}
					label={`${days.toFixed(1)} Days (Low Buffer)`}
					size="small"
					sx={{
						height: 20,
						fontSize: "0.62rem",
						fontWeight: 800,
						bgcolor: "rgba(251, 191, 36, 0.12)",
						color: "#fbbf24",
						border: "1px solid rgba(251, 191, 36, 0.3)",
					}}
				/>
			);
		}
		return (
			<Chip
				icon={
					<ErrorOutlined
						sx={{ fontSize: "14px !important", color: "#f87171" }}
					/>
				}
				label={`${days.toFixed(1)} Days (CRITICAL)`}
				size="small"
				sx={{
					height: 20,
					fontSize: "0.62rem",
					fontWeight: 800,
					bgcolor: "rgba(248, 113, 113, 0.15)",
					color: "#f87171",
					border: "1px solid rgba(248, 113, 113, 0.4)",
				}}
			/>
		);
	};

	return (
		<Box
			sx={{
				height: "100%",
				display: "grid",
				gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" },
				gap: 1.5,
				minHeight: 0,
			}}
		>
			{/* Left Column: Workforce Consumable Burn Rate & Storage Runway Matrix */}
			<FlexCard
				sx={{ height: "100%", p: 2, display: "flex", flexDirection: "column" }}
			>
				<Box
					sx={{
						pb: 1.5,
						borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
						mb: 1.5,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Box display="flex" alignItems="center" gap={1}>
						<LocalFireDepartmentIcon
							sx={{ fontSize: 18, color: SEMANTIC_COLORS.neonRed }}
						/>
						<Typography
							fontWeight={800}
							fontSize="0.78rem"
							sx={{
								textTransform: "uppercase",
								letterSpacing: "0.08em",
								color: SEMANTIC_COLORS.neonRed,
							}}
						>
							Workforce Consumable Burn Rate & Buffer Runway
						</Typography>
					</Box>
					<Typography
						variant="caption"
						fontFamily="monospace"
						color={SEMANTIC_COLORS.neonRed}
						fontWeight={800}
						fontSize="0.75rem"
					>
						Total Daily Drain: -{formatCurrency(workforceBurnRate.dailyCost)}{" "}
						{currency}/day
					</Typography>
				</Box>

				<Box
					sx={{
						flex: 1,
						overflowY: "auto",
						pr: 0.5,
						"&::-webkit-scrollbar": { width: "4px" },
						"&::-webkit-scrollbar-thumb": {
							backgroundColor: "rgba(255,255,255,0.1)",
							borderRadius: "4px",
						},
					}}
				>
					{enrichedBurnItems.length > 0 ? (
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
										fontSize: "0.62rem",
										textTransform: "uppercase",
										borderBottom: "1px solid rgba(255,255,255,0.06)",
									}}
								>
									<th style={{ padding: "8px 12px", width: "110px" }}>
										Material
									</th>
									<th
										style={{
											padding: "8px 12px",
											textAlign: "right",
											width: "120px",
										}}
									>
										Daily Burn Rate
									</th>
									<th
										style={{
											padding: "8px 12px",
											textAlign: "right",
											width: "130px",
										}}
									>
										Daily Financial Loss
									</th>
									<th
										style={{
											padding: "8px 12px",
											textAlign: "right",
											width: "120px",
										}}
									>
										Stock Held
									</th>
									<th style={{ padding: "8px 12px", textAlign: "right" }}>
										Buffer Runway
									</th>
								</tr>
							</thead>
							<tbody>
								{enrichedBurnItems.map((item) => (
									<tr
										key={item.ticker}
										style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
									>
										<td style={{ padding: "8px 12px" }}>
											<Box display="flex" alignItems="center" gap={1}>
												<Box sx={{ fontSize: "0.75em" }}>
													<MaterialBadge ticker={item.ticker} />
												</Box>
												<Typography
													fontSize="0.75rem"
													fontWeight={700}
													color="white"
												>
													{item.ticker}
												</Typography>
											</Box>
										</td>
										<td
											style={{
												padding: "8px 12px",
												textAlign: "right",
												fontFamily: "monospace",
												fontSize: "0.75rem",
												color: "rgba(255,255,255,0.8)",
											}}
										>
											{item.dailyAmount.toFixed(1)} u/day
										</td>
										<td
											style={{
												padding: "8px 12px",
												textAlign: "right",
												fontFamily: "monospace",
												fontSize: "0.75rem",
												fontWeight: 700,
												color: SEMANTIC_COLORS.neonRed,
											}}
										>
											-{formatCurrency(item.dailyCost)} {currency}
										</td>
										<td
											style={{
												padding: "8px 12px",
												textAlign: "right",
												fontFamily: "monospace",
												fontSize: "0.75rem",
												color: "rgba(255,255,255,0.8)",
											}}
										>
											{item.storedUnits.toLocaleString()} u
										</td>
										<td style={{ padding: "8px 12px", textAlign: "right" }}>
											{renderBufferStatusChip(item.daysRemaining)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<Box
							display="flex"
							justifyContent="center"
							alignItems="center"
							height="100%"
							color="rgba(255,255,255,0.4)"
							fontSize="0.8rem"
						>
							No active workforce consumable consumption data detected
						</Box>
					)}
				</Box>
			</FlexCard>

			{/* Right Column: Contract Obligations & Liabilities Breakdown */}
			<FlexCard
				sx={{ height: "100%", p: 2, display: "flex", flexDirection: "column" }}
			>
				<Box
					sx={{
						pb: 1.5,
						borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
						mb: 1.5,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Box display="flex" alignItems="center" gap={1}>
						<HandshakeIcon
							sx={{ fontSize: 18, color: SEMANTIC_COLORS.neonPurple }}
						/>
						<Typography
							fontWeight={800}
							fontSize="0.78rem"
							sx={{
								textTransform: "uppercase",
								letterSpacing: "0.08em",
								color: SEMANTIC_COLORS.neonPurple,
							}}
						>
							Contract Receivables vs Payables
						</Typography>
					</Box>
					<Typography
						variant="caption"
						fontFamily="monospace"
						color={
							netPending >= 0
								? SEMANTIC_COLORS.neonGreen
								: SEMANTIC_COLORS.neonRed
						}
						fontWeight={800}
						fontSize="0.75rem"
					>
						Net: {netPending > 0 ? "+" : ""}
						{formatCurrency(netPending)} {currency}
					</Typography>
				</Box>

				<Box
					display="flex"
					flexDirection="column"
					gap={1.5}
					sx={{
						p: 2,
						borderRadius: "10px",
						bgcolor: "rgba(0,0,0,0.3)",
						border: "1px solid rgba(123, 104, 238, 0.2)",
					}}
				>
					<Box
						display="flex"
						justifyContent="space-between"
						alignItems="center"
					>
						<Typography
							variant="caption"
							color="rgba(255,255,255,0.7)"
							fontSize="0.75rem"
							fontWeight={700}
						>
							Pending Contract Receivables
						</Typography>
						<Typography
							variant="body2"
							fontFamily="monospace"
							fontWeight={800}
							color={SEMANTIC_COLORS.neonGreen}
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
							height: 6,
							borderRadius: 3,
							bgcolor: "rgba(248, 113, 113, 0.2)",
							"& .MuiLinearProgress-bar": {
								bgcolor: SEMANTIC_COLORS.neonGreen,
							},
						}}
					/>

					<Box
						display="flex"
						justifyContent="space-between"
						alignItems="center"
					>
						<Typography
							variant="caption"
							color="rgba(255,255,255,0.7)"
							fontSize="0.75rem"
							fontWeight={700}
						>
							Pending Contract Payables
						</Typography>
						<Typography
							variant="body2"
							fontFamily="monospace"
							fontWeight={800}
							color={SEMANTIC_COLORS.neonRed}
						>
							-{formatCurrency(payables)} {currency}
						</Typography>
					</Box>
				</Box>
			</FlexCard>
		</Box>
	);
};
