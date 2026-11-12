import React from "react";
import { Box, Typography, Chip, Tooltip, IconButton } from "@mui/material";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import type { RouteWaypoint } from "../../../types/ship_routes";
import { StepItem } from "./stepitem";

interface WaypointCardProps {
	waypoint: RouteWaypoint;
	isLast: boolean;
	allWaypointsInRoute?: RouteWaypoint[];
	onFocusSystem?: (systemId: string) => void;
}

export const WaypointCard: React.FC<WaypointCardProps> = ({
	waypoint,
	allWaypointsInRoute = [],
	onFocusSystem,
}) => {
	const thisIndex = waypoint.position || waypoint.waypoint_index + 1;

	// Calculate additive waypoint numbers if this location is visited multiple times
	const sameLocationStops = allWaypointsInRoute
		.filter((w) => {
			if (w.location_id && waypoint.location_id) {
				return w.location_id === waypoint.location_id;
			}
			return (
				w.location_name &&
				waypoint.location_name &&
				w.location_name.toLowerCase() === waypoint.location_name.toLowerCase()
			);
		})
		.map((w) => w.position || w.waypoint_index + 1)
		.sort((a, b) => a - b);

	const hasMultipleVisits = sameLocationStops.length > 1;
	const additiveText = hasMultipleVisits ? sameLocationStops.join(", ") : null;

	const stepsCount = waypoint.steps.length;

	return (
		<Box
			sx={{
				mb: 0.6,
				p: 0.9,
				borderRadius: 1.2,
				bgcolor: "rgba(18, 20, 32, 0.65)",
				border: "1px solid rgba(255, 255, 255, 0.05)",
				borderLeft: "2px solid rgba(123, 104, 238, 0.6)",
				transition: "border-color 0.15s ease, background 0.15s ease",
				"&:hover": {
					borderColor: "rgba(123, 104, 238, 0.4)",
					bgcolor: "rgba(22, 25, 40, 0.85)",
				},
			}}
		>
			{/* Waypoint Header - 100% Horizontal Spread */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: 1,
					width: "100%",
					boxSizing: "border-box",
					mb: stepsCount > 0 ? 0.6 : 0,
				}}
			>
				{/* Left: Identity (Index, Additive Badge, Location Name) */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 0.6,
						minWidth: 0,
						flex: 1,
					}}
				>
					<Box
						sx={{
							width: 18,
							height: 18,
							borderRadius: "50%",
							bgcolor: "rgba(123, 104, 238, 0.25)",
							border: "1px solid rgba(123, 104, 238, 0.6)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "0.66rem",
							color: "#d1c4e9",
							flexShrink: 0,
						}}
					>
						{thisIndex}
					</Box>

					{additiveText && (
						<Tooltip
							title={`Stops in this route visiting this location: ${additiveText}`}
						>
							<Chip
								label={additiveText}
								size="small"
								sx={{
									height: 16,
									fontSize: "0.6rem",
									fontFamily: "monospace",
									fontWeight: 500,
									bgcolor: "rgba(123, 104, 238, 0.15)",
									color: "#b39ddb",
									border: "1px solid rgba(123, 104, 238, 0.4)",
									px: 0.1,
									cursor: "help",
									flexShrink: 0,
								}}
							/>
						</Tooltip>
					)}

					<Typography
						variant="body2"
						sx={{
							color: "#fff",
							fontSize: "0.78rem",
							fontWeight: 500,
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{waypoint.location_name || waypoint.system_name}
					</Typography>
				</Box>

				{/* Right: Location Context & Actions (System, Type, Landing, GPS) */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 0.5,
						flexShrink: 0,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontSize: "0.66rem",
							whiteSpace: "nowrap",
						}}
					>
						{waypoint.system_name} · {waypoint.location_type.toLowerCase()}
					</Typography>

					{waypoint.landing && (
						<Chip
							label="landing"
							size="small"
							sx={{
								height: 16,
								fontSize: "0.58rem",
								bgcolor: "rgba(255, 171, 0, 0.1)",
								color: "#ffb74d",
								border: "1px solid rgba(255, 171, 0, 0.25)",
								px: 0.1,
							}}
						/>
					)}

					{onFocusSystem && (
						<Tooltip title="Focus system on map">
							<IconButton
								size="small"
								onClick={() => onFocusSystem(waypoint.system_id)}
								sx={{
									p: 0.2,
									color: "text.secondary",
									"&:hover": { color: "#7b68ee" },
								}}
							>
								<GpsFixedIcon sx={{ fontSize: 13 }} />
							</IconButton>
						</Tooltip>
					)}
				</Box>
			</Box>

			{/* Steps List - Chronological sequential order with step index badges */}
			{stepsCount === 0 ? (
				<Typography
					variant="caption"
					sx={{
						color: "text.secondary",
						fontStyle: "italic",
						fontSize: "0.66rem",
						pl: 0.2,
					}}
				>
					No cargo operations
				</Typography>
			) : (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 0.35,
						width: "100%",
					}}
				>
					{waypoint.steps.map((step, idx) => (
						<StepItem
							key={step.stepid}
							step={step}
							stepNumber={
								step.step_index != null ? step.step_index + 1 : idx + 1
							}
						/>
					))}
				</Box>
			)}
		</Box>
	);
};
