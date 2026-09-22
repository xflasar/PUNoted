import React from "react";
import { Box, Chip, Paper, Typography } from "@mui/material";
import { DirectionsBoat, NearMe } from "@mui/icons-material";

interface FlightCompletedContentProps {
	data: {
		ship?: string;
		ship_name?: string;
		destination?: string;
		origin?: string;
		status?: string;
	};
}

export const FlightCompletedContent: React.FC<FlightCompletedContentProps> = ({
	data,
}) => {
	if (!data || typeof data !== "object") return null;

	const shipName = data.ship || data.ship_name || "Unknown Ship";
	const destination = data.destination || "Destination";
	const origin = data.origin;

	return (
		<Paper
			sx={{
				display: "flex",
				flexDirection: "row",
				width: "100%",
				gap: 1,
				alignItems: "center",
				justifyContent: "space-between",
				p: 0.75,
				bgcolor: "rgba(0, 0, 0, 0.3)",
				borderRadius: 1.5,
				border: "1px solid rgba(100, 255, 218, 0.3)",
			}}
		>
			<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
				<Box
					sx={{
						p: 0.5,
						borderRadius: 1,
						bgcolor: "rgba(100, 255, 218, 0.1)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<DirectionsBoat sx={{ fontSize: "1.2rem", color: "#64FFDA" }} />
				</Box>
				<Box sx={{ display: "flex", flexDirection: "column" }}>
					<Typography
						variant="caption"
						sx={{ fontWeight: 700, color: "#FFFFFF", fontSize: "0.72rem" }}
					>
						{shipName}
					</Typography>
					{origin ? (
						<Typography
							variant="caption"
							sx={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.6)" }}
						>
							From: {origin}
						</Typography>
					) : (
						<Chip
							size="small"
							label="Flight Completed"
							sx={{
								height: 16,
								fontSize: "0.55rem",
								fontWeight: 700,
								bgcolor: "rgba(100, 255, 218, 0.15)",
								color: "#64FFDA",
								mt: 0.2,
							}}
						/>
					)}
				</Box>
			</Box>

			<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
				<NearMe sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }} />
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-end",
					}}
				>
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.6rem" }}
					>
						Arrived At
					</Typography>
					<Typography
						variant="caption"
						sx={{ fontWeight: 700, color: "#64FFDA", fontSize: "0.7rem" }}
					>
						{destination}
					</Typography>
				</Box>
			</Box>
		</Paper>
	);
};

export default FlightCompletedContent;
