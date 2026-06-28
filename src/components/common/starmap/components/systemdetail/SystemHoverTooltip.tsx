import React, { useMemo } from "react";
import { Box, Paper, Typography, useTheme, alpha } from "@mui/material";
import {
	Sailing,
	Business,
	LocationCity,
	TravelExplore,
} from "@mui/icons-material";
import type {
	MapPoint,
	PlanetData,
	StationData,
	ShipData,
} from "../../types/maptypes";
import MaterialBadge from "../../../../../cosm/components/materialbadge";

interface SystemHoverTooltipProps {
	object: any;
	x: number;
	y: number;
	allPlanetsData: Record<string, PlanetData[]>;
	allStationsData: Record<string, StationData[]>;
	ownerShips: ShipData[];
	otherShips: ShipData[];
}

const SystemHoverTooltip: React.FC<SystemHoverTooltipProps> = ({
	object,
	x,
	y,
	allPlanetsData,
	allStationsData,
	ownerShips,
	otherShips,
}) => {
	const theme = useTheme();

	const isStation = object.type === "station" || !!object.stationid;
	if (isStation) {
		const stationId = object.stationid || object.id;
		const stationName = object.name || object.stationname || stationId;
		const comexId = object.comexid || object.comex_code || null;

		// Count docked ships
		const ownDockedCount = ownerShips.filter(
			(s) =>
				s.addressstationid === stationId || s.address_station_id === stationId,
		).length;
		const otherDockedCount = otherShips.filter(
			(s) =>
				s.addressstationid === stationId || s.address_station_id === stationId,
		).length;

		return (
			<Paper
				elevation={12}
				sx={{
					position: "absolute",
					left: x,
					top: y,
					transform: "translate(-50%, -115%)",
					pointerEvents: "none",
					zIndex: 9999,
					p: 1.5,
					borderRadius: "8px",
					background:
						"linear-gradient(135deg, rgba(10, 14, 26, 0.95) 0%, rgba(5, 7, 12, 0.98) 100%)",
					backdropFilter: "blur(12px)",
					border: "1px solid rgba(0, 229, 255, 0.3)",
					boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.25)}`,
					display: "flex",
					flexDirection: "column",
					gap: 1,
					minWidth: 180,
					maxWidth: 240,
				}}
			>
				<Box
					sx={{ borderBottom: "1px solid rgba(255,255,255,0.08)", pb: 0.75 }}
				>
					<Typography
						variant="subtitle2"
						sx={{
							fontWeight: 800,
							color: "#00ff00",
							fontSize: "0.85rem",
							letterSpacing: "0.05em",
							display: "flex",
							alignItems: "center",
							gap: 0.5,
						}}
					>
						<Business sx={{ fontSize: 16 }} />
						{stationName}
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: theme.palette.text.secondary, fontSize: "0.65rem" }}
					>
						Space Station • ID: {stationId}
					</Typography>
				</Box>

				<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
					{comexId && (
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Typography
								variant="caption"
								sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}
							>
								Commodity Exchange
							</Typography>
							<Typography
								variant="caption"
								sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#00e5ff" }}
							>
								{comexId}
							</Typography>
						</Box>
					)}

					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.5)",
								fontSize: "0.7rem",
								display: "flex",
								alignItems: "center",
								gap: 0.5,
							}}
						>
							<Sailing sx={{ fontSize: 12, opacity: 0.6 }} /> Docked Ships
						</Typography>
						<Typography
							variant="caption"
							sx={{
								fontWeight: 700,
								fontSize: "0.7rem",
								color: theme.palette.text.primary,
							}}
						>
							{ownDockedCount + otherDockedCount > 0
								? `${ownDockedCount} Mine • ${otherDockedCount} Other`
								: "None"}
						</Typography>
					</Box>
				</Box>
			</Paper>
		);
	}

	// Only render for systems
	const isSystem =
		object.type === "system" || (!object.type && object.originalSystemId);
	if (!isSystem) return null;

	const systemId = object.originalSystemId || object.id || object.systemId;
	if (!systemId) return null;

	const systemName = object.label || object.name || systemId;
	const planets = allPlanetsData[systemId] || [];
	const stations = allStationsData[systemId] || [];

	// Count ships in this system
	const ownShipsCount = ownerShips.filter(
		(s) => s.address_system_id === systemId || s.addresssystemid === systemId,
	).length;
	const otherShipsCount = otherShips.filter(
		(s) => s.address_system_id === systemId || s.addresssystemid === systemId,
	).length;

	// Aggregate unique resources from all planets
	const systemResources = useMemo(() => {
		const resSet = new Set<string>();
		planets.forEach((p) => {
			p.resources?.forEach((r: any) => {
				const ticker = r.material || r.name;
				if (ticker) resSet.add(ticker.toUpperCase());
			});
		});
		return Array.from(resSet);
	}, [planets]);

	return (
		<Paper
			elevation={12}
			sx={{
				position: "absolute",
				left: x,
				top: y,
				transform: "translate(-50%, -115%)",
				pointerEvents: "none",
				zIndex: 9999,
				p: 1.5,
				borderRadius: "8px",
				background:
					"linear-gradient(135deg, rgba(10, 14, 26, 0.95) 0%, rgba(5, 7, 12, 0.98) 100%)",
				backdropFilter: "blur(12px)",
				border: "1px solid rgba(0, 229, 255, 0.3)",
				boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.25)}`,
				display: "flex",
				flexDirection: "column",
				gap: 1,
				minWidth: 180,
				maxWidth: 240,
			}}
		>
			{/* System Header */}
			<Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.08)", pb: 0.75 }}>
				<Typography
					variant="subtitle2"
					sx={{
						fontWeight: 800,
						color: "#00e5ff",
						fontSize: "0.85rem",
						letterSpacing: "0.05em",
						display: "flex",
						alignItems: "center",
						gap: 0.5,
					}}
				>
					<TravelExplore sx={{ fontSize: 16 }} />
					{systemName}
				</Typography>
				<Typography
					variant="caption"
					sx={{ color: theme.palette.text.secondary, fontSize: "0.65rem" }}
				>
					Class {object.systemtype || "Unknown"} Star • ID: {systemId}
				</Typography>
			</Box>

			{/* System Stats grid */}
			<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255,255,255,0.5)",
							fontSize: "0.7rem",
							display: "flex",
							alignItems: "center",
							gap: 0.5,
						}}
					>
						<LocationCity sx={{ fontSize: 12, opacity: 0.6 }} /> Planets
					</Typography>
					<Typography
						variant="caption"
						sx={{
							fontWeight: 700,
							fontSize: "0.7rem",
							color: theme.palette.text.primary,
						}}
					>
						{planets.length}
					</Typography>
				</Box>

				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255,255,255,0.5)",
							fontSize: "0.7rem",
							display: "flex",
							alignItems: "center",
							gap: 0.5,
						}}
					>
						<Business sx={{ fontSize: 12, opacity: 0.6 }} /> Stations
					</Typography>
					<Typography
						variant="caption"
						sx={{
							fontWeight: 700,
							fontSize: "0.7rem",
							color: theme.palette.text.primary,
						}}
					>
						{stations.length}
					</Typography>
				</Box>

				{(ownShipsCount > 0 || otherShipsCount > 0) && (
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							borderTop: "1px dashed rgba(255,255,255,0.06)",
							pt: 0.5,
							mt: 0.25,
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.5)",
								fontSize: "0.7rem",
								display: "flex",
								alignItems: "center",
								gap: 0.5,
							}}
						>
							<Sailing sx={{ fontSize: 12, opacity: 0.6 }} /> Present Ships
						</Typography>
						<Typography
							variant="caption"
							sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#00e5ff" }}
						>
							{ownShipsCount} Mine{" "}
							{otherShipsCount > 0 && `• ${otherShipsCount} Other`}
						</Typography>
					</Box>
				)}

				{systemResources.length > 0 && (
					<Box
						sx={{
							borderTop: "1px dashed rgba(255,255,255,0.06)",
							pt: 0.75,
							mt: 0.25,
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.4)",
								display: "block",
								fontSize: "0.6rem",
								fontWeight: 700,
								mb: 0.5,
							}}
						>
							SYSTEM RESOURCES
						</Typography>
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
							{systemResources.map((ticker) => (
								<Box
									key={ticker}
									sx={{ fontSize: "0.65rem", display: "inline-flex" }}
								>
									<MaterialBadge ticker={ticker} />
								</Box>
							))}
						</Box>
					</Box>
				)}
			</Box>
		</Paper>
	);
};

export default React.memo(SystemHoverTooltip);
