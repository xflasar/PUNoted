import React from "react";
import {
	Paper,
	Typography,
	Box,
	Grid,
	Chip,
	Stack,
	Divider,
	Button,
	Tooltip,
} from "@mui/material";
import TimerIcon from "@mui/icons-material/Timer";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { ShipRoute } from "../../../types/ship_routes";

interface RouteOptimizerMetricsProps {
	route: ShipRoute;
}

export const RouteOptimizerMetrics: React.FC<RouteOptimizerMetricsProps> = ({
	route,
}) => {
	const [copied, setCopied] = React.useState(false);

	// Count wait times
	let totalWaitMinutes = 0;
	let totalLoadSteps = 0;
	let totalUnloadSteps = 0;
	let totalRefuelSteps = 0;

	for (const wp of route.waypoints) {
		for (const step of wp.steps) {
			if (step.type === "WAIT") {
				const amt = step.wait_amount || 0;
				if (step.wait_unit === "HOURS") {
					totalWaitMinutes += amt * 60;
				} else if (step.wait_unit === "DAYS") {
					totalWaitMinutes += amt * 1440;
				} else {
					totalWaitMinutes += amt;
				}
			} else if (step.type === "LOAD") {
				totalLoadSteps++;
			} else if (step.type === "UNLOAD") {
				totalUnloadSteps++;
			} else if (step.type === "REFUEL") {
				totalRefuelSteps++;
			}
		}
	}

	const handleCopyBlueprint = () => {
		const blueprint = {
			format: "PUNoted-Route-v1",
			name: route.name,
			repeats: route.repeats,
			waypoints: route.waypoints.map((wp) => ({
				system: wp.system_name,
				location: wp.location_name,
				type: wp.location_type,
				landing: wp.landing,
				steps: wp.steps.map((s) => ({
					type: s.type,
					material: s.material_ticker,
					min: s.min_units,
					max: s.max_units,
					retain: s.retain,
					fuel: s.fuel_type,
					wait: s.wait_amount ? `${s.wait_amount} ${s.wait_unit}` : null,
				})),
			})),
		};

		navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
		setCopied(true);
		setTimeout(() => setCopied(false), 2500);
	};

	return (
		<Paper
			sx={{
				p: 2,
				borderRadius: 2,
				background:
					"linear-gradient(135deg, rgba(30, 25, 50, 0.9) 0%, rgba(20, 20, 35, 0.95) 100%)",
				border: "1px solid rgba(123, 104, 238, 0.3)",
			}}
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 1.5,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<LocalShippingIcon sx={{ color: "#7b68ee" }} />
					<Typography variant="h6" fontWeight={700} color="white">
						Loop Diagnostics & Blueprint
					</Typography>
				</Box>
				<Button
					variant="outlined"
					size="small"
					startIcon={
						copied ? (
							<CheckCircleIcon sx={{ color: "#00e676" }} />
						) : (
							<ContentCopyIcon />
						)
					}
					onClick={handleCopyBlueprint}
					sx={{
						borderColor: copied ? "#00e676" : "rgba(123, 104, 238, 0.5)",
						color: copied ? "#00e676" : "primary.light",
						"&:hover": {
							borderColor: copied ? "#00e676" : "#7b68ee",
						},
					}}
				>
					{copied ? "Copied!" : "Export Blueprint"}
				</Button>
			</Box>

			<Grid container spacing={2}>
				<Grid item xs={6} md={3}>
					<Typography variant="caption" color="text.secondary">
						Configured Wait Time
					</Typography>
					<Typography variant="subtitle1" fontWeight={700} color="#e040fb">
						{totalWaitMinutes >= 60
							? `${(totalWaitMinutes / 60).toFixed(1)} hrs`
							: `${totalWaitMinutes} min`}
					</Typography>
				</Grid>

				<Grid item xs={6} md={3}>
					<Typography variant="caption" color="text.secondary">
						Assigned Ships
					</Typography>
					<Typography variant="subtitle1" fontWeight={700} color="#00e5ff">
						{route.assigned_ships.length}{" "}
						{route.assigned_ships.length === 1 ? "ship" : "ships"}
					</Typography>
				</Grid>

				<Grid item xs={6} md={3}>
					<Typography variant="caption" color="text.secondary">
						Load / Unload Steps
					</Typography>
					<Typography variant="subtitle1" fontWeight={700} color="white">
						{totalLoadSteps} loads / {totalUnloadSteps} unloads
					</Typography>
				</Grid>

				<Grid item xs={6} md={3}>
					<Typography variant="caption" color="text.secondary">
						Refuel Checkpoints
					</Typography>
					<Typography variant="subtitle1" fontWeight={700} color="#ffab00">
						{totalRefuelSteps} stops
					</Typography>
				</Grid>
			</Grid>

			{/* Assigned Ships Details */}
			{route.assigned_ships.length > 0 && (
				<Box mt={2}>
					<Typography
						variant="caption"
						color="text.secondary"
						fontWeight={600}
						display="block"
						mb={0.8}
					>
						ASSIGNED FLEET
					</Typography>
					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
						{route.assigned_ships.map((s) => (
							<Chip
								key={s.shipid}
								label={`${s.name} (${s.registration}) • ${s.status}`}
								size="small"
								variant="outlined"
								sx={{
									color: s.status === "TRANSIT" ? "#00e5ff" : "white",
									borderColor:
										s.status === "TRANSIT"
											? "rgba(0, 229, 255, 0.4)"
											: "rgba(255, 255, 255, 0.15)",
									bgcolor: "rgba(0, 0, 0, 0.2)",
								}}
							/>
						))}
					</Stack>
				</Box>
			)}
		</Paper>
	);
};
