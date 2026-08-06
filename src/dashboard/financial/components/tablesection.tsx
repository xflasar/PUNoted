import { Box, Typography, CircularProgress } from "@mui/material";
import type { Transaction, PartnerMetrics } from "../types/finances";
import {
	formatCurrency,
	SEMANTIC_COLORS,
	formatCompactTimestamp,
} from "../utils/financeutils";

export const ActivityTableContent = ({
	transactions,
	onRowClick,
	loading,
}: {
	transactions: Transaction[];
	onRowClick: (tx: Transaction) => void;
	loading?: boolean;
}) => {
	if (loading) {
		return (
			<Box
				display="flex"
				flexDirection="column"
				justifyContent="center"
				alignItems="center"
				height="100%"
				width="100%"
				p={4}
			>
				<CircularProgress size={30} thickness={4} sx={{ color: "#7b68ee" }} />
			</Box>
		);
	}

	if (!transactions || transactions.length === 0) {
		return (
			<Box p={3} textAlign="center">
				<Typography variant="body2" color="rgba(255, 255, 255, 0.4)">
					No recent activity matches your filter.
				</Typography>
			</Box>
		);
	}

	return (
		<table
			style={{
				width: "100%",
				borderCollapse: "collapse",
				textAlign: "left",
				tableLayout: "fixed",
			}}
		>
			<thead
				style={{
					position: "sticky",
					top: 0,
					zIndex: 2,
					backgroundColor: "rgba(4, 4, 10, 0.98)",
				}}
			>
				<tr
					style={{
						color: "rgba(255, 255, 255, 0.4)",
						fontSize: "0.62rem",
						textTransform: "uppercase",
					}}
				>
					<th
						style={{
							padding: "6px 12px",
							fontWeight: 800,
							width: "20%",
							borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
						}}
					>
						Timestamp (UTC)
					</th>
					<th
						style={{
							padding: "6px 12px",
							fontWeight: 800,
							width: "28%",
							borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
						}}
					>
						Type
					</th>
					<th
						style={{
							padding: "6px 12px",
							fontWeight: 800,
							width: "32%",
							borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
						}}
					>
						Counterparty
					</th>
					<th
						style={{
							padding: "6px 12px",
							fontWeight: 800,
							textAlign: "right",
							width: "20%",
							borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
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
								borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
								cursor: "pointer",
								transition: "background-color 0.15s ease",
							}}
							onMouseEnter={(e) =>
								(e.currentTarget.style.backgroundColor =
									"rgba(123, 104, 238, 0.08)")
							}
							onMouseLeave={(e) =>
								(e.currentTarget.style.backgroundColor = "transparent")
							}
						>
							<td
								style={{
									padding: "6px 12px",
									color: "rgba(255,255,255,0.4)",
									fontSize: "0.72rem",
									fontFamily: "monospace",
									whiteSpace: "nowrap",
								}}
							>
								{formatCompactTimestamp(tx.Timestamp)}
							</td>
							<td style={{ padding: "6px 12px", whiteSpace: "nowrap" }}>
								<Box
									component="span"
									sx={{
										px: 0.8,
										py: 0.2,
										borderRadius: "4px",
										fontSize: "0.62rem",
										fontWeight: 700,
										display: "inline-block",
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
							</td>
							<td
								style={{
									padding: "6px 12px",
									fontWeight: 600,
									color: isCorpTx ? SEMANTIC_COLORS.neonPurple : "#fff",
									fontSize: "0.75rem",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{tx.PartnerName}{" "}
								<Typography
									component="span"
									fontSize="0.68rem"
									color={
										isCorpTx
											? "rgba(123, 104, 238, 0.7)"
											: "rgba(255, 255, 255, 0.4)"
									}
								>
									({tx.PartnerCode})
								</Typography>
							</td>
							<td
								style={{
									padding: "6px 12px",
									textAlign: "right",
									fontFamily: "monospace",
									fontSize: "0.75rem",
									fontWeight: 700,
									color:
										tx.Amount >= 0
											? SEMANTIC_COLORS.neonGreen
											: SEMANTIC_COLORS.neonRed,
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
	loading,
}: {
	partners: PartnerMetrics[];
	onRowClick: (code: string, name: string) => void;
	loading?: boolean;
}) => {
	if (loading) {
		return (
			<Box
				display="flex"
				flexDirection="column"
				justifyContent="center"
				alignItems="center"
				height="100%"
				width="100%"
				p={4}
			>
				<CircularProgress size={30} thickness={4} sx={{ color: "#7b68ee" }} />
			</Box>
		);
	}

	if (!partners || partners.length === 0) {
		return (
			<Box p={3} textAlign="center">
				<Typography variant="body2" color="rgba(255, 255, 255, 0.4)">
					No partner metrics found.
				</Typography>
			</Box>
		);
	}

	return (
		<table
			style={{
				width: "100%",
				borderCollapse: "collapse",
				textAlign: "left",
				tableLayout: "fixed",
			}}
		>
			<thead
				style={{
					position: "sticky",
					top: 0,
					zIndex: 1,
					backgroundColor: "rgba(4, 4, 10, 0.95)",
					backdropFilter: "blur(20px)",
				}}
			>
				<tr
					style={{
						color: "rgba(255, 255, 255, 0.4)",
						fontSize: "0.62rem",
						textTransform: "uppercase",
					}}
				>
					<th
						style={{
							padding: "6px 12px",
							fontWeight: 800,
							borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
						}}
					>
						Partner
					</th>
					<th
						style={{
							padding: "6px 12px",
							fontWeight: 800,
							textAlign: "right",
							width: "90px",
							borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
						}}
					>
						Volume
					</th>
					<th
						style={{
							padding: "6px 12px",
							fontWeight: 800,
							textAlign: "right",
							width: "90px",
							borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
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
							borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
							cursor: "pointer",
							transition: "background-color 0.15s ease",
						}}
						onMouseEnter={(e) =>
							(e.currentTarget.style.backgroundColor =
								"rgba(123, 104, 238, 0.08)")
						}
						onMouseLeave={(e) =>
							(e.currentTarget.style.backgroundColor = "transparent")
						}
					>
						<td
							style={{
								padding: "6px 12px",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							<Typography
								sx={{ fontWeight: 700, color: "#fff", fontSize: "0.75rem" }}
							>
								{partner.code}
							</Typography>
							{partner.name !== partner.code && (
								<Typography
									sx={{
										color: "rgba(255,255,255,0.4)",
										fontSize: "0.65rem",
										whiteSpace: "nowrap",
										overflow: "hidden",
										textOverflow: "ellipsis",
									}}
								>
									{partner.name}
								</Typography>
							)}
						</td>
						<td
							style={{
								padding: "6px 12px",
								textAlign: "right",
								fontFamily: "monospace",
								fontSize: "0.72rem",
								color: "#fff",
							}}
						>
							{formatCurrency(partner.volume, 0)}
						</td>
						<td
							style={{
								padding: "6px 12px",
								textAlign: "right",
								fontFamily: "monospace",
								fontSize: "0.72rem",
								fontWeight: 700,
								color:
									partner.net >= 0
										? SEMANTIC_COLORS.neonGreen
										: SEMANTIC_COLORS.neonRed,
							}}
						>
							{partner.net > 0 ? "+" : ""}
							{formatCurrency(partner.net, 0)}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};
