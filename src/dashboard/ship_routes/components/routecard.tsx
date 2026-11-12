import React from "react";
import {
	Box,
	Card,
	CardActionArea,
	CardContent,
	Typography,
	Chip,
	Stack,
	Tooltip,
} from "@mui/material";
import LoopIcon from "@mui/icons-material/Loop";
import NavigationIcon from "@mui/icons-material/Navigation";
import RocketIcon from "@mui/icons-material/Rocket";
import type { ShipRoute } from "../../../types/ship_routes";

interface RouteCardProps {
	route: ShipRoute;
	isSelected: boolean;
	onSelect: (routeId: string) => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
	route,
	isSelected,
	onSelect,
}) => {
	const waypointCount = route.waypoints.length;
	const shipCount = route.assigned_ships.length;

	return (
		<Card
			sx={{
				mb: 1.5,
				borderRadius: 2,
				background: isSelected
					? "linear-gradient(135deg, rgba(123, 104, 238, 0.25) 0%, rgba(30, 30, 50, 0.95) 100%)"
					: "rgba(22, 22, 38, 0.85)",
				border: isSelected
					? "1px solid #7b68ee"
					: "1px solid rgba(255, 255, 255, 0.08)",
				boxShadow: isSelected ? "0 0 15px rgba(123, 104, 238, 0.35)" : "none",
				transition: "all 0.2s ease-in-out",
				"&:hover": {
					borderColor: "#7b68ee88",
					background: "rgba(30, 30, 52, 0.95)",
				},
			}}
		>
			<CardActionArea onClick={() => onSelect(route.routeid)} sx={{ p: 1.5 }}>
				<CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "flex-start",
							mb: 0.8,
						}}
					>
						<Box>
							<Typography variant="subtitle1" fontWeight={700} color="white">
								{route.name || "Unnamed Route"}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								ID: {route.naturalid}
							</Typography>
						</Box>
						{route.repeats ? (
							<Tooltip title="Looping Route (Repeats indefinitely)">
								<Chip
									icon={
										<LoopIcon
											sx={{
												fontSize: "14px !important",
												color: "#4caf50 !important",
											}}
										/>
									}
									label="Loop"
									size="small"
									sx={{
										bgcolor: "rgba(76, 175, 80, 0.15)",
										color: "#4caf50",
										border: "1px solid rgba(76, 175, 80, 0.4)",
										fontWeight: 600,
										fontSize: "0.7rem",
									}}
								/>
							</Tooltip>
						) : (
							<Chip
								label="Single run"
								size="small"
								sx={{
									bgcolor: "rgba(255, 255, 255, 0.05)",
									color: "text.secondary",
									fontSize: "0.7rem",
								}}
							/>
						)}
					</Box>

					{/* Summary Chips */}
					<Stack direction="row" spacing={1} mt={1}>
						<Chip
							icon={<NavigationIcon sx={{ fontSize: "13px !important" }} />}
							label={`${waypointCount} ${waypointCount === 1 ? "Waypoint" : "Waypoints"}`}
							size="small"
							variant="outlined"
							sx={{
								color: "primary.light",
								borderColor: "rgba(123, 104, 238, 0.4)",
								fontSize: "0.72rem",
							}}
						/>
						<Chip
							icon={<RocketIcon sx={{ fontSize: "13px !important" }} />}
							label={`${shipCount} ${shipCount === 1 ? "Ship" : "Ships"}`}
							size="small"
							variant="outlined"
							sx={{
								color: shipCount > 0 ? "#00e5ff" : "text.secondary",
								borderColor:
									shipCount > 0
										? "rgba(0, 229, 255, 0.4)"
										: "rgba(255,255,255,0.1)",
								fontSize: "0.72rem",
							}}
						/>
					</Stack>

					{/* Waypoint preview summary */}
					{waypointCount > 0 && (
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{
								mt: 1,
								display: "block",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{route.waypoints
								.map((w) => w.location_name || w.system_name)
								.join(" ➔ ")}
						</Typography>
					)}
				</CardContent>
			</CardActionArea>
		</Card>
	);
};
