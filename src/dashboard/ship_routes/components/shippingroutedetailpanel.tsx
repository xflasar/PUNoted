import React from "react";
import {
	Box,
	Paper,
	Typography,
	IconButton,
	Stack,
	Chip,
	Button,
	Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RocketIcon from "@mui/icons-material/Rocket";
import LoopIcon from "@mui/icons-material/Loop";
import type { ShipRoute } from "../../../types/ship_routes";
import { WaypointCard } from "./waypointcard";

interface ShippingRouteDetailPanelProps {
	route: ShipRoute;
	onClose: () => void;
	onFocusSystem: (systemId: string) => void;
}

export const ShippingRouteDetailPanel: React.FC<
	ShippingRouteDetailPanelProps
> = ({ route, onClose, onFocusSystem }) => {
	const [copied, setCopied] = React.useState(false);

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
		setTimeout(() => setCopied(false), 2000);
	};

	const uniqueSystemsCount = React.useMemo(() => {
		return new Set(route.waypoints.map((w) => w.system_id)).size;
	}, [route.waypoints]);

	return (
		<Paper
			sx={{
				width: 360,
				maxHeight: "calc(100vh - 120px)",
				display: "flex",
				flexDirection: "column",
				bgcolor: "rgba(12, 14, 24, 0.94)",
				backdropFilter: "blur(18px)",
				border: "1px solid rgba(255, 255, 255, 0.08)",
				borderRadius: 2,
				boxShadow: "0 8px 32px rgba(0, 0, 0, 0.7)",
				zIndex: 10,
				overflow: "hidden",
			}}
		>
			{/* Top Accent Line */}
			<Box
				sx={{
					height: 2,
					background: "linear-gradient(90deg, #7b68ee, #00e5ff)",
					width: "100%",
					flexShrink: 0,
				}}
			/>

			{/* Clean Compact Header - 100% Spread */}
			<Box
				sx={{
					p: 1.2,
					pb: 0.8,
					borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						width: "100%",
						boxSizing: "border-box",
					}}
				>
					<Box sx={{ minWidth: 0, flex: 1 }}>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
							<Typography
								variant="body1"
								sx={{
									color: "#fff",
									fontWeight: 500,
									fontSize: "0.85rem",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{route.name || "Unnamed Route"}
							</Typography>

							<Chip
								icon={
									route.repeats ? (
										<LoopIcon
											sx={{
												fontSize: "10px !important",
												color: "#66bb6a !important",
											}}
										/>
									) : undefined
								}
								label={route.repeats ? "Loop" : "One-way"}
								size="small"
								sx={{
									height: 16,
									fontSize: "0.58rem",
									bgcolor: route.repeats
										? "rgba(102, 187, 106, 0.12)"
										: "rgba(255, 255, 255, 0.05)",
									color: route.repeats ? "#66bb6a" : "text.secondary",
									border: route.repeats
										? "1px solid rgba(102, 187, 106, 0.25)"
										: "1px solid rgba(255, 255, 255, 0.08)",
									px: 0.1,
									flexShrink: 0,
								}}
							/>
						</Box>

						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontSize: "0.66rem",
								fontFamily: "monospace",
								display: "block",
								mt: 0.2,
							}}
						>
							{route.naturalid}
						</Typography>
					</Box>

					<Stack
						direction="row"
						spacing={0.3}
						alignItems="center"
						flexShrink={0}
					>
						<Tooltip
							title={copied ? "Copied to clipboard!" : "Copy blueprint JSON"}
						>
							<IconButton
								size="small"
								onClick={handleCopyBlueprint}
								sx={{
									p: 0.35,
									color: copied ? "#00e676" : "text.secondary",
									"&:hover": { color: "#fff" },
								}}
							>
								{copied ? (
									<CheckCircleIcon sx={{ fontSize: 15 }} />
								) : (
									<ContentCopyIcon sx={{ fontSize: 14 }} />
								)}
							</IconButton>
						</Tooltip>

						<IconButton
							size="small"
							onClick={onClose}
							sx={{
								p: 0.35,
								color: "text.secondary",
								"&:hover": { color: "#fff" },
							}}
						>
							<CloseIcon sx={{ fontSize: 16 }} />
						</IconButton>
					</Stack>
				</Box>

				{/* Quick Metrics Bar - 3 Equal Columns */}
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr 1fr",
						mt: 0.8,
						px: 0.8,
						py: 0.4,
						borderRadius: 1,
						bgcolor: "rgba(255, 255, 255, 0.02)",
						border: "1px solid rgba(255, 255, 255, 0.04)",
						textAlign: "center",
					}}
				>
					<Box>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontSize: "0.6rem",
								display: "block",
							}}
						>
							STOPS
						</Typography>
						<Typography
							variant="body2"
							sx={{ color: "#d1c4e9", fontSize: "0.76rem", fontWeight: 500 }}
						>
							{route.waypoints.length}
						</Typography>
					</Box>

					<Box
						sx={{
							borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
							borderRight: "1px solid rgba(255, 255, 255, 0.06)",
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontSize: "0.6rem",
								display: "block",
							}}
						>
							SYSTEMS
						</Typography>
						<Typography
							variant="body2"
							sx={{ color: "#00e5ff", fontSize: "0.76rem", fontWeight: 500 }}
						>
							{uniqueSystemsCount}
						</Typography>
					</Box>

					<Box>
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontSize: "0.6rem",
								display: "block",
							}}
						>
							SHIPS
						</Typography>
						<Typography
							variant="body2"
							sx={{
								color:
									route.assigned_ships.length > 0
										? "#00e676"
										: "text.secondary",
								fontSize: "0.76rem",
								fontWeight: 500,
							}}
						>
							{route.assigned_ships.length}
						</Typography>
					</Box>
				</Box>
			</Box>

			{/* Assigned Ships - Compact 100% Horizontal Spread */}
			<Box
				sx={{
					px: 1.2,
					py: 0.5,
					bgcolor: "rgba(0, 0, 0, 0.15)",
					borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Typography
					variant="caption"
					sx={{
						color: "text.secondary",
						fontSize: "0.64rem",
						letterSpacing: 0.5,
					}}
				>
					ASSIGNED SHIPS
				</Typography>
				{route.assigned_ships.length === 0 ? (
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontStyle: "italic",
							fontSize: "0.65rem",
						}}
					>
						None
					</Typography>
				) : (
					<Stack direction="row" spacing={0.4} flexWrap="wrap" useFlexGap>
						{route.assigned_ships.map((s) => (
							<Chip
								key={s.shipid}
								icon={
									<RocketIcon
										sx={{
											fontSize: "10px !important",
											color: "#00e5ff !important",
										}}
									/>
								}
								label={`${s.name || s.registration} · ${s.status}`}
								size="small"
								sx={{
									height: 18,
									fontSize: "0.6rem",
									bgcolor: "rgba(0, 229, 255, 0.08)",
									color: "#00e5ff",
									border: "1px solid rgba(0, 229, 255, 0.2)",
									px: 0.2,
								}}
							/>
						))}
					</Stack>
				)}
			</Box>

			{/* Waypoints Sequence - 100% Width Utilized */}
			<Box sx={{ flexGrow: 1, overflowY: "auto", p: 1 }}>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						width: "100%",
						boxSizing: "border-box",
						mb: 0.8,
						px: 0.2,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontSize: "0.64rem",
							letterSpacing: 0.6,
							textTransform: "uppercase",
							fontWeight: 500,
						}}
					>
						WAYPOINTS TIMELINE
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: "primary.light",
							fontSize: "0.64rem",
							fontWeight: 500,
						}}
					>
						{route.waypoints.length}{" "}
						{route.waypoints.length === 1 ? "stop" : "stops"}
					</Typography>
				</Box>

				{route.waypoints.map((wp, idx) => (
					<WaypointCard
						key={wp.waypointid}
						waypoint={wp}
						isLast={idx === route.waypoints.length - 1}
						allWaypointsInRoute={route.waypoints}
						onFocusSystem={onFocusSystem}
					/>
				))}
			</Box>
		</Paper>
	);
};
