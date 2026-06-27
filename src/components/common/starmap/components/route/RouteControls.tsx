import React, { useState, useMemo } from "react";
import { Box, Button, TextField, Autocomplete } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useFilter } from "./FilterContext";
import { findShortestPath } from "../utils/pathfinder";

interface RouteControlsProps {
	systems: { originalSystemId: string; label: string; x: number; y: number }[];
	onPathCalculated: (pathSystemIds: string[]) => void;
}

const RouteControls: React.FC<RouteControlsProps> = ({
	systems,
	onPathCalculated,
}) => {
	const theme = useTheme();
	const [origin, setOrigin] = useState<string | null>(null);
	const [destination, setDestination] = useState<string | null>(null);

	const handleCalculate = () => {
		if (!origin || !destination) return;
		// Build nodes map for pathfinder
		const nodes: Record<string, any> = {};
		systems.forEach((s) => {
			nodes[s.originalSystemId] = { x: s.x, y: s.y };
		});
		// We don't use segments right now just to get path between stars
		const segments: any[] = [];
		const result = findShortestPath(
			origin,
			destination,
			nodes,
			segments,
			false,
		);
		if (result.path.length > 0) {
			onPathCalculated(result.path);
		}
	};

	return (
		<Box
			sx={{
				position: "absolute",
				top: "1rem",
				left: "1rem",
				background: "rgba(0,0,0,0.5)",
				backdropFilter: "blur(6px)",
				borderRadius: 2,
				p: 2,
				display: "flex",
				flexDirection: "column",
				gap: 1,
				zIndex: 10,
			}}
		>
			<Autocomplete
				options={systems}
				getOptionLabel={(opt) => opt.label ?? opt.originalSystemId}
				renderInput={(params) => (
					<TextField
						{...params}
						label="Origin System"
						variant="outlined"
						size="small"
					/>
				)}
				onChange={(_, val) => setOrigin(val?.originalSystemId ?? null)}
			/>
			<Autocomplete
				options={systems}
				getOptionLabel={(opt) => opt.label ?? opt.originalSystemId}
				renderInput={(params) => (
					<TextField
						{...params}
						label="Destination System"
						variant="outlined"
						size="small"
					/>
				)}
				onChange={(_, val) => setDestination(val?.originalSystemId ?? null)}
			/>
			<Button
				variant="contained"
				color="primary"
				onClick={handleCalculate}
				disabled={!origin || !destination}
			>
				Calculate Route
			</Button>
		</Box>
	);
};

export default RouteControls;
