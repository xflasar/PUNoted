import React from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import type { PlanetPosition, MapPoint } from "../types/maptypes";

export const PlanetInfoBox: React.FC<{
	planet: PlanetPosition | null;
	centeredSystem: MapPoint | null;
	onClose: () => void;
}> = ({ planet, centeredSystem, onClose }) => {
	const theme = useTheme();

	if (!planet) {
		return null;
	}

	const dataRows = [
		{ label: "System", value: centeredSystem?.label || "N/A" },
		{
			label: "Population",
			value: planet.planetPopulation?.toLocaleString() ?? "N/A",
		},
		{ label: "Orbit Index", value: planet.orbitindex },
		{
			label: "Semi-major Axis (Vis)",
			value: `${(planet.orbitalRadius || 0).toFixed(2)}`,
		},
		{ label: "Eccentricity", value: (planet.eccentricity ?? 0).toFixed(4) },
		{
			label: "Inclination",
			value: `${((planet.inclination ?? 0) * (180 / Math.PI)).toFixed(2)}°`,
		},
		{ label: "position", value: `${planet.x}, ${planet.y}` },
	];

	return (
		<Paper
			elevation={5}
			sx={{
				position: "absolute",
				top: "40%",
				right: 8,
				transform: "translateY(-50%)",
				padding: 2,
				zIndex: 30,
				opacity: 0.98,
				minWidth: 300,
				maxWidth: 420,
				background: theme.palette.background.paper,
			}}
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 1,
				}}
			>
				<Typography variant="h6">{planet.name} Details</Typography>
				<button
					onClick={onClose}
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						fontSize: "1.2rem",
						color: theme.palette.text.primary,
					}}
					aria-label="close"
				>
					&times;
				</button>
			</Box>
			{dataRows.map((row, i) => (
				<Box
					key={i}
					sx={{ display: "flex", justifyContent: "space-between", py: 0.25 }}
				>
					<Typography variant="body2" color="text.secondary">
						{row.label}:
					</Typography>
					<Typography variant="body2" fontWeight="bold">
						{row.value}
					</Typography>
				</Box>
			))}
		</Paper>
	);
};
