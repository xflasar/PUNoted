import React, { useMemo } from "react";
import { Box, Paper, Typography, useTheme, alpha } from "@mui/material";
import { Sailing, LocationCity } from "@mui/icons-material";
import type {
	PlanetPosition,
	PlanetData,
	ShipData,
} from "../../types/maptypes";
import MaterialBadge from "../../../../../cosm/components/materialbadge";

interface PlanetHoverTooltipProps {
	object: any; // PlanetPosition
	x: number;
	y: number;
	allPlanetsData: Record<string, PlanetData[]>;
	ownerShips: ShipData[];
	otherShips: ShipData[];
}

const PlanetHoverTooltip: React.FC<PlanetHoverTooltipProps> = ({
	object,
	x,
	y,
	allPlanetsData,
	ownerShips,
	otherShips,
}) => {
	const theme = useTheme();

	const planetId = object.planetid || object.id;
	const parentSystemId = object.parentSystemId;
	if (!planetId) return null;

	const planetName = object.name || object.planetname || planetId;

	// Find full planet details (type, resources, population) from allPlanetsData
	const fullPlanetData = useMemo(() => {
		if (!parentSystemId) return null;
		const systemPlanets = allPlanetsData[parentSystemId] || [];
		return (
			systemPlanets.find((p) => String(p.planetid) === String(planetId)) || null
		);
	}, [allPlanetsData, parentSystemId, planetId]);

	const planetPopulation =
		fullPlanetData?.planetPopulation ?? object.planetPopulation ?? 0;
	const planetType = fullPlanetData?.type || object.type || "Unknown";

	// Filter ships docked at this planet
	const ownShipsCount = ownerShips.filter(
		(s) =>
			String(s.address_planet_id || s.addressplanetid) === String(planetId),
	).length;
	const otherShipsCount = otherShips.filter(
		(s) =>
			String(s.address_planet_id || s.addressplanetid) === String(planetId),
	).length;

	// Planet resources
	const resources = fullPlanetData?.resources || [];

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
			}}
		>
			{/* Planet Header */}
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
					<LocationCity sx={{ fontSize: 16 }} />
					{planetName}
				</Typography>
				<Typography
					variant="caption"
					sx={{ color: theme.palette.text.secondary, fontSize: "0.65rem" }}
				>
					Type: {planetType} • ID: {planetId}
				</Typography>
			</Box>

			{/* Stats */}
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
						sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}
					>
						Population
					</Typography>
					<Typography
						variant="caption"
						sx={{
							fontWeight: 700,
							fontSize: "0.7rem",
							color: theme.palette.text.primary,
						}}
					>
						{planetPopulation.toLocaleString()}
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
							<Sailing sx={{ fontSize: 12, opacity: 0.6 }} /> Docked Ships
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

				{resources.length > 0 && (
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
							NATURAL RESOURCES
						</Typography>
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
							{resources.map((r, idx) => {
								const ticker = (r as any).material || r.name;
								const factor =
									(r as any).factor !== undefined ? (r as any).factor : r.value;
								return (
									<Box
										key={idx}
										sx={{
											display: "inline-flex",
											alignItems: "center",
											bgcolor: "rgba(0, 0, 0, 0.2)",
											border: "1px solid rgba(255,255,255,0.06)",
											borderRadius: "4px",
											px: 0.5,
											py: 0.15,
											gap: 0.25,
										}}
									>
										<Box sx={{ fontSize: "0.6rem", display: "inline-flex" }}>
											<MaterialBadge ticker={ticker} />
										</Box>
										<Typography
											variant="caption"
											sx={{
												fontSize: "0.6rem",
												fontWeight: 700,
												color: "rgba(255,255,255,0.8)",
											}}
										>
											{Math.round(factor * 100)}%
										</Typography>
									</Box>
								);
							})}
						</Box>
					</Box>
				)}
			</Box>
		</Paper>
	);
};

export default React.memo(PlanetHoverTooltip);
