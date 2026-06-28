import { Box, Typography, alpha, useTheme } from "@mui/material";
import type { Transaction, PartnerMetrics } from "../types/finances";
import {
	formatCurrency,
	SEMANTIC_COLORS,
	formatCompactTimestamp,
} from "../utils/financeutils";

export const ActivityTableContent = ({
	transactions,
	onRowClick,
}: {
	transactions: Transaction[];
	onRowClick: (tx: Transaction) => void;
}) => {
	const theme = useTheme();

	if (!transactions || transactions.length === 0) {
		return (
			<Box p={3} textAlign="center">
				<Typography variant="body2" color="text.secondary">
					No recent activity found.
				</Typography>
			</Box>
		);
	}

	return (
		<table
			style={{
				width: "100%",
				minWidth: "500px",
				borderCollapse: "collapse",
				textAlign: "left",
			}}
		>
			<thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
				<tr
					style={{
						backgroundColor: "rgba(30, 37, 52, 0.98)",
						color: theme.palette.text.secondary,
						fontSize: "0.65rem",
						textTransform: "uppercase",
					}}
				>
					<th
						style={{
							padding: "8px 12px",
							fontWeight: 800,
							borderBottom: `1px solid ${theme.palette.divider}`,
						}}
					>
						Timestamp (UTC)
					</th>
					<th
						style={{
							padding: "8px 12px",
							fontWeight: 800,
							borderBottom: `1px solid ${theme.palette.divider}`,
						}}
					>
						Event Type
					</th>
					<th
						style={{
							padding: "8px 12px",
							fontWeight: 800,
							borderBottom: `1px solid ${theme.palette.divider}`,
						}}
					>
						Counterparty
					</th>
					<th
						style={{
							padding: "8px 12px",
							fontWeight: 800,
							textAlign: "right",
							borderBottom: `1px solid ${theme.palette.divider}`,
						}}
					>
						Amount
					</th>
				</tr>
			</thead>
			<tbody>
				{transactions.map((tx, i) => {
					const isCorpTx = tx.Type.includes("CORP");
					return (
						<tr
							key={`${tx.Id}-${i}`}
							onClick={() => onRowClick(tx)}
							style={{
								borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
								cursor: "pointer",
								transition: "background-color 0.15s ease",
							}}
							onMouseEnter={(e) =>
								(e.currentTarget.style.backgroundColor = alpha(
									theme.palette.primary.main,
									0.1,
								))
							}
							onMouseLeave={(e) =>
								(e.currentTarget.style.backgroundColor = "transparent")
							}
						>
							<td
								style={{
									padding: "8px 12px",
									color: theme.palette.text.secondary,
									fontSize: "0.75rem",
									fontFamily: "monospace",
									whiteSpace: "nowrap",
								}}
							>
								{formatCompactTimestamp(tx.Timestamp)}
							</td>
							<td
								style={{
									padding: "8px 12px",
									fontWeight: 600,
									color: theme.palette.text.primary,
									fontSize: "0.75rem",
									whiteSpace: "nowrap",
								}}
							>
								<Box
									component="span"
									sx={{
										px: 1,
										py: 0.5,
										borderRadius: "4px",
										bgcolor: isCorpTx
											? alpha(SEMANTIC_COLORS.neonBlue, 0.15)
											: alpha(theme.palette.divider, 0.5),
										color: isCorpTx ? SEMANTIC_COLORS.neonBlue : "inherit",
									}}
								>
									{tx.Type}
								</Box>
							</td>
							<td
								style={{
									padding: "8px 12px",
									fontWeight: 600,
									color: isCorpTx
										? SEMANTIC_COLORS.neonBlue
										: theme.palette.text.primary,
									fontSize: "0.8rem",
									whiteSpace: "nowrap",
								}}
							>
								{tx.PartnerName}{" "}
								<Typography
									component="span"
									fontSize="0.7rem"
									color={
										isCorpTx
											? alpha(SEMANTIC_COLORS.neonBlue, 0.7)
											: theme.palette.text.secondary
									}
								>
									({tx.PartnerCode})
								</Typography>
							</td>
							<td
								style={{
									padding: "8px 12px",
									textAlign: "right",
									fontFamily: "monospace",
									fontSize: "0.8rem",
									color:
										tx.Amount >= 0
											? theme.palette.success.main
											: theme.palette.error.main,
									whiteSpace: "nowrap",
								}}
							>
								{tx.Amount > 0 ? "+" : ""}
								{formatCurrency(tx.Amount)}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

export const TopPartnersTableContent = ({
	partners,
	onRowClick,
}: {
	partners: PartnerMetrics[];
	onRowClick: (code: string, name: string) => void;
}) => {
	const theme = useTheme();

	if (!partners || partners.length === 0) {
		return (
			<Box p={3} textAlign="center">
				<Typography variant="body2" color="text.secondary">
					No partner data found.
				</Typography>
			</Box>
		);
	}

	return (
		<table
			style={{
				width: "100%",
				minWidth: "300px",
				borderCollapse: "collapse",
				textAlign: "left",
			}}
		>
			<thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
				<tr
					style={{
						backgroundColor: "rgba(30, 37, 52, 0.98)",
						color: theme.palette.text.secondary,
						fontSize: "0.65rem",
						textTransform: "uppercase",
					}}
				>
					<th
						style={{
							padding: "8px 12px",
							fontWeight: 800,
							borderBottom: `1px solid ${theme.palette.divider}`,
						}}
					>
						Partner
					</th>
					<th
						style={{
							padding: "8px 12px",
							fontWeight: 800,
							textAlign: "right",
							borderBottom: `1px solid ${theme.palette.divider}`,
						}}
					>
						Volume
					</th>
					<th
						style={{
							padding: "8px 12px",
							fontWeight: 800,
							textAlign: "right",
							borderBottom: `1px solid ${theme.palette.divider}`,
						}}
					>
						Net
					</th>
				</tr>
			</thead>
			<tbody>
				{partners.map((partner, i) => (
					<tr
						key={i}
						onClick={() => onRowClick(partner.code, partner.name)}
						style={{
							borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
							cursor: "pointer",
							transition: "background-color 0.15s ease",
						}}
						onMouseEnter={(e) =>
							(e.currentTarget.style.backgroundColor = alpha(
								theme.palette.primary.main,
								0.1,
							))
						}
						onMouseLeave={(e) =>
							(e.currentTarget.style.backgroundColor = "transparent")
						}
					>
						<td style={{ padding: "8px 12px" }}>
							<Typography
								sx={{
									fontWeight: 700,
									color: "text.primary",
									fontSize: "0.8rem",
								}}
							>
								{partner.code}
							</Typography>
							{partner.name !== partner.code && (
								<Typography
									sx={{
										color: "text.secondary",
										fontSize: "0.7rem",
										whiteSpace: "nowrap",
										overflow: "hidden",
										textOverflow: "ellipsis",
										maxWidth: "120px",
									}}
								>
									{partner.name}
								</Typography>
							)}
						</td>
						<td
							style={{
								padding: "8px 12px",
								textAlign: "right",
								fontFamily: "monospace",
								fontSize: "0.8rem",
								color: theme.palette.text.primary,
							}}
						>
							{formatCurrency(partner.volume)}
						</td>
						<td
							style={{
								padding: "8px 12px",
								textAlign: "right",
								fontFamily: "monospace",
								fontSize: "0.8rem",
								color:
									partner.net >= 0
										? theme.palette.success.main
										: theme.palette.error.main,
							}}
						>
							{partner.net > 0 ? "+" : ""}
							{formatCurrency(partner.net)}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};
