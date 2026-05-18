import React from "react";
import {
	Paper,
	Box,
	Typography,
	Grid,
	Divider,
	Chip,
	Tooltip,
} from "@mui/material";
import type { LogisticsSummary } from "./types";
import {
	Warning,
	CheckCircle,
	ErrorOutlineOutlined,
} from "@mui/icons-material";

interface LogisticsOverviewProps {
	summary: LogisticsSummary | null;
}

const LogisticsOverview: React.FC<LogisticsOverviewProps> = ({ summary }) => {
	if (!summary) {
		return null; // Or a loading/placeholder state
	}

	const { transportAnalysis, bottlenecks } = summary.data;
	if (!transportAnalysis || !bottlenecks) {
		return null;
	}

	const isInsufficient =
		transportAnalysis?.sufficiencyStatus === "insufficient";

	return (
		<Paper elevation={2} sx={{ p: 2, background: "transparent" }}>
			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
						<ErrorOutlineOutlined color="error" />
						<Typography variant="h6" component="h3" sx={{ ml: 1 }}>
							Active Bottlenecks
						</Typography>
					</Box>
					<Divider />
					<Box sx={{ mt: 1, maxHeight: 150, overflowY: "auto" }}>
						{bottlenecks.length > 0 ? (
							<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, pt: 1 }}>
								{bottlenecks.map((b, index) => (
									<Tooltip key={index} title={b.details}>
										<Chip
											size="small"
											label={`${b.siteName}: ${b.materialTicker}`}
											color={
												b.type === "material_shortage" ? "error" : "warning"
											}
										/>
									</Tooltip>
								))}
							</Box>
						) : (
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ pt: 2, textAlign: "center" }}
							>
								No active bottlenecks detected.
							</Typography>
						)}
					</Box>
				</Grid>
				<Grid item xs={12} md={6}>
					<Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
						{isInsufficient ? (
							<Warning color="error" />
						) : (
							<CheckCircle color="success" />
						)}
						<Typography variant="h6" component="h3" sx={{ ml: 1 }}>
							Transport Status (Daily)
						</Typography>
					</Box>
					<Divider />
					<Box sx={{ mt: 1, maxHeight: 150, overflowY: "auto" }}>
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, pt: 1 }}>
							<Chip
								size="small"
								variant="outlined"
								label={`Tonnage Capacity: ${transportAnalysis.totalShipCapacityTonnage.toLocaleString()} t`}
							/>
							<Chip
								size="small"
								variant="outlined"
								label={`Volume Capacity: ${transportAnalysis.totalShipCapacityVolume.toLocaleString()} m³`}
							/>
							<Chip
								size="small"
								variant="outlined"
								label={`Tonnage Required: ${transportAnalysis.requiredTransportTonnage.toLocaleString()} t`}
							/>
							<Chip
								size="small"
								variant="outlined"
								label={`Volume Required: ${transportAnalysis.requiredTransportVolume.toLocaleString()} m³`}
							/>
							<Chip
								size="small"
								variant="filled"
								label={
									isInsufficient
										? `Tonnage Shortfall: ${(transportAnalysis.requiredTransportTonnage - transportAnalysis.totalShipCapacityTonnage).toLocaleString()} t`
										: `Tonnage Surplus: ${(transportAnalysis.totalShipCapacityTonnage - transportAnalysis.requiredTransportTonnage).toLocaleString()} t`
								}
								color={isInsufficient ? "error" : "success"}
							/>
							<Chip
								size="small"
								variant="filled"
								label={
									isInsufficient
										? `Volume Shortfall: ${(transportAnalysis.requiredTransportVolume - transportAnalysis.totalShipCapacityVolume).toLocaleString()} m³`
										: `Volume Surplus: ${(transportAnalysis.totalShipCapacityVolume - transportAnalysis.requiredTransportVolume).toLocaleString()} m³`
								}
								color={isInsufficient ? "error" : "success"}
							/>
						</Box>
					</Box>
				</Grid>
			</Grid>
		</Paper>
	);
};

export default LogisticsOverview;
