import React from "react";
import {
	Box,
	Paper,
	Typography,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
} from "@mui/material";
import type { HistoryPoint } from "./types";

export interface HistoryLogProps {
	history: HistoryPoint[];
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ history }) => {
	// Sort newest first for the history log table, limit to 10 entries
	const recentHistory = [...history].reverse().slice(0, 10);

	return (
		<Paper
			elevation={3}
			sx={{
				p: 2,
				background: "rgba(16, 16, 32, 0.5)",
				border: "1px solid rgba(123, 104, 238, 0.35)",
				boxShadow:
					"0 0 35px rgba(123, 104, 238, 0.18), inset 0 0 20px rgba(123, 104, 238, 0.06)",
				backdropFilter: "blur(25px)",
				borderRadius: "16px",
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				flex: 1,
			}}
		>
			<Typography
				variant="subtitle2"
				sx={{
					fontWeight: 800,
					color: "#7B68EE",
					textTransform: "uppercase",
					fontSize: "0.75rem",
					letterSpacing: "0.15em",
					mb: 1.5,
				}}
			>
				Price & Volume History Log
			</Typography>

			<Box
				sx={{
					flex: 1,
					width: "100%",
					overflowY: "auto",
					"&::-webkit-scrollbar": { width: "4px" },
					"&::-webkit-scrollbar-track": { background: "transparent" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: "rgba(123, 104, 238, 0.4)",
						borderRadius: "2px",
					},
				}}
			>
				<Table
					size="small"
					stickyHeader
					sx={{ bgcolor: "transparent", width: "100%" }}
				>
					<TableHead>
						<TableRow
							sx={{
								"& th": {
									bgcolor: "rgba(16, 16, 32, 0.95)",
									color: "rgba(255,255,255,0.5)",
									fontSize: "0.65rem",
									fontWeight: 700,
									borderBottom: "1px solid rgba(255,255,255,0.08)",
									py: 0.75,
								},
							}}
						>
							<TableCell>DATE</TableCell>
							<TableCell align="right">ASK</TableCell>
							<TableCell align="right">BID</TableCell>
							<TableCell align="right">SPREAD</TableCell>
							<TableCell align="right">SUPPLY</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{recentHistory.map((row, idx) => {
							const ask = row.askprice || 0;
							const bid = row.bidprice || 0;
							const spread = ask && bid ? ask - bid : 0;
							const dateStr = row.timestamp
								? new Date(row.timestamp).toLocaleDateString(undefined, {
										month: "short",
										day: "numeric",
									})
								: "-";

							return (
								<TableRow
									key={idx}
									sx={{
										"&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
										"& td": {
											borderBottom: "1px solid rgba(255,255,255,0.04)",
											py: 0.75,
											fontSize: "0.75rem",
											fontVariantNumeric: "tabular-nums",
										},
									}}
								>
									<TableCell
										sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}
									>
										{dateStr}
									</TableCell>
									<TableCell
										align="right"
										sx={{ color: "#ff5252", fontWeight: 600 }}
									>
										{ask ? ask.toLocaleString() : "-"}
									</TableCell>
									<TableCell
										align="right"
										sx={{ color: "#69f0ae", fontWeight: 600 }}
									>
										{bid ? bid.toLocaleString() : "-"}
									</TableCell>
									<TableCell
										align="right"
										sx={{
											color: spread > 0 ? "#00e5ff" : "rgba(255,255,255,0.4)",
										}}
									>
										{spread ? spread.toLocaleString() : "-"}
									</TableCell>
									<TableCell
										align="right"
										sx={{ color: "rgba(255,255,255,0.8)" }}
									>
										{row.supply ? row.supply.toLocaleString() : "-"}
									</TableCell>
								</TableRow>
							);
						})}

						{recentHistory.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={5}
									align="center"
									sx={{ color: "rgba(255,255,255,0.3)", py: 3 }}
								>
									No history log recorded
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</Box>
		</Paper>
	);
};
