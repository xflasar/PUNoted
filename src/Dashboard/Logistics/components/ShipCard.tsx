import React, { useState, useEffect } from "react";
import {
	Paper,
	Box,
	Typography,
	Chip,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	useTheme,
	SelectChangeEvent,
	LinearProgress,
	Tooltip,
	Divider,
} from "@mui/material";
import { Rocket, ArrowRight, MapPin, Package } from "lucide-react";
import { Ship, Site, CX, type FlightPlan } from "../types";

interface ShipCardProps {
	ship: Ship;
	sites: (Site | CX)[];
	assignedSiteName?: string;
	onAssignShip: (shipId: string, siteId: string | null) => void;
}

const ShipCard: React.FC<ShipCardProps> = ({
	ship,
	sites,
	assignedSiteName,
	onAssignShip,
}) => {
	const theme = useTheme();
	const [flightProgress, setFlightProgress] = useState(0);

	useEffect(() => {
		if (ship.status === "in-transit" && ship.currentFlight) {
			const interval = setInterval(() => {
				const start = new Date(
					ship.currentFlight!.departuretimestamp,
				).getTime();
				const end = new Date(ship.currentFlight!.arrivaltimestamp).getTime();
				const now = Date.now();
				const progress = Math.min(100, ((now - start) / (end - start)) * 100);
				setFlightProgress(progress);
			}, 1000);
			return () => clearInterval(interval);
		}
	}, [ship.status, ship.currentFlight]);

	const handleAssign = (e: SelectChangeEvent<string>) => {
		e.stopPropagation();
		onAssignShip(ship.id, e.target.value === "" ? null : e.target.value);
	};

	const getStatusColor = (
		status: Ship["status"],
	): "success" | "info" | "warning" => {
		return status === "idle"
			? "success"
			: status === "in-transit"
				? "info"
				: "warning";
	};

	const getLocationName = (flight: FlightPlan | null, origin: boolean) => {
		if (!flight) return "Unknown";

		if (origin) {
			return flight.originplanet || flight.originstation || flight.originsystem;
		} else {
			return (
				flight.destinationplanet ||
				flight.destinationstation ||
				flight.destinationsystem
			);
		}
	};

	const flight = ship.currentFlight;

	return (
		<Paper
			elevation={2}
			sx={{
				p: 1,
				display: "flex",
				flexDirection: "column",
				background: "rgba(255, 255, 255, 0.02)",
				borderRadius: 1,
				border: "1px solid",
				borderColor: "divider",
			}}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<Rocket size={16} color={theme.palette.primary.main} />
					<Typography variant="body2" fontWeight="bold">
						{ship.name}
					</Typography>
				</Box>
				<Chip
					label={ship.status}
					color={getStatusColor(ship.status)}
					size="small"
					sx={{
						textTransform: "capitalize",
						height: "20px",
						fontSize: "0.7rem",
					}}
				/>
			</Box>

			<Divider sx={{ my: 0.5 }} />

			{ship.status === "in-transit" && flight ? (
				<Box sx={{ my: 0.5 }}>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<Typography variant="caption" noWrap sx={{ maxWidth: "40%" }}>
							{getLocationName(flight, true)}
						</Typography>
						<ArrowRight size={12} />
						<Typography variant="caption" noWrap sx={{ maxWidth: "40%" }}>
							{getLocationName(flight, false)}
						</Typography>
					</Box>
					<Tooltip
						title={`ETA: ${new Date(flight.arrivaltimestamp).toLocaleTimeString()}`}
					>
						<LinearProgress
							variant="determinate"
							value={flightProgress}
							sx={{ height: 4, borderRadius: 2 }}
						/>
					</Tooltip>
				</Box>
			) : (
				<Box sx={{ my: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
					<MapPin size={12} />
					<Typography variant="caption" color="text.secondary">
						Loc: <strong>{ship.locationId}</strong>
					</Typography>
				</Box>
			)}

			<Box sx={{ display: "flex", gap: 1, my: 0.5 }}>
				<Tooltip
					title={`Tonnage: ${Math.round((ship.shipStorage.currentTonnage / ship.shipStorage.maxTonnage) * 100)}%`}
				>
					<Box
						sx={{
							flex: 1,
							position: "relative",
							p: 0.5,
							borderRadius: 1,
							overflow: "hidden",
							border: "1px solid",
							borderColor: "divider",
						}}
					>
						<LinearProgress
							variant="determinate"
							value={
								(ship.shipStorage.currentTonnage /
									ship.shipStorage.maxTonnage) *
								100
							}
							sx={{
								position: "absolute",
								width: "100%",
								height: "100%",
								top: 0,
								left: 0,
								zIndex: 0,
								"& .MuiLinearProgress-bar": {
									backgroundColor: "primary.dark",
									opacity: 0.6,
								},
								backgroundColor: "action.hover",
							}}
						/>
						<Box
							sx={{
								position: "relative",
								zIndex: 1,
								display: "flex",
								alignItems: "center",
								gap: 0.5,
							}}
						>
							<Package size={12} />
							<Typography variant="caption" color="text.secondary">
								<strong>
									{ship.shipStorage.currentTonnage} /{" "}
									{ship.shipStorage.maxTonnage} t
								</strong>
							</Typography>
						</Box>
					</Box>
				</Tooltip>
				<Tooltip
					title={`Volume: ${Math.round((ship.shipStorage.currentVolume / ship.shipStorage.maxVolume) * 100)}%`}
				>
					<Box
						sx={{
							flex: 1,
							position: "relative",
							p: 0.5,
							borderRadius: 1,
							overflow: "hidden",
							border: "1px solid",
							borderColor: "divider",
						}}
					>
						<LinearProgress
							variant="determinate"
							value={
								(ship.shipStorage.currentVolume / ship.shipStorage.maxVolume) *
								100
							}
							sx={{
								position: "absolute",
								width: "100%",
								height: "100%",
								top: 0,
								left: 0,
								zIndex: 0,
								"& .MuiLinearProgress-bar": {
									backgroundColor: "secondary.dark",
									opacity: 0.6,
								},
								backgroundColor: "action.hover",
							}}
						/>
						<Box
							sx={{
								position: "relative",
								zIndex: 1,
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								width: "100%",
							}}
						>
							<Typography variant="caption" color="text.secondary">
								<strong>
									{ship.shipStorage.currentVolume} /{" "}
									{ship.shipStorage.maxVolume} m³
								</strong>
							</Typography>
						</Box>
					</Box>
				</Tooltip>
			</Box>

			<Box sx={{ mt: "auto" }}>
				<FormControl
					fullWidth
					size="small"
					onClick={(e) => e.stopPropagation()}
					disabled={ship.status === "in-transit"}
					sx={{ mt: 0.5 }}
				>
					<InputLabel sx={{ fontSize: "0.8rem" }}>Assigned</InputLabel>
					<Select
						label="Assigned"
						value={ship.assignedSiteId || ""}
						onChange={handleAssign}
						sx={{ fontSize: "0.8rem" }}
						renderValue={(selectedValue) => {
							if (!selectedValue) return <em>None</em>;
							return assignedSiteName || "Unknown";
						}}
					>
						<MenuItem value="">
							<em>None</em>
						</MenuItem>
						{sites
							.filter((s) => "planetName" in s)
							.map((site) => (
								<MenuItem key={site.id} value={site.id}>
									{site.name}
								</MenuItem>
							))}
					</Select>
				</FormControl>
			</Box>
		</Paper>
	);
};

export default ShipCard;
