import React from "react";
import { Box, Typography, Slider } from "@mui/material";

interface MapZoomControlsProps {
	currentViewMode: "galaxy" | "system";
	activeZoom: number;
	sliderMin: number;
	sliderMax: number;
	sliderMarks: Array<{ value: number; label: string }>;
	onChange: (event: Event, newValue: number | number[]) => void;
}

/**
 * Floating bottom zoom level slider control.
 */
export const MapZoomControls: React.FC<MapZoomControlsProps> = ({
	currentViewMode,
	activeZoom,
	sliderMin,
	sliderMax,
	sliderMarks,
	onChange,
}) => {
	return (
		<Box
			sx={{
				position: "absolute",
				bottom: 24,
				left: "50%",
				transform: "translateX(-50%)",
				width: 320,
				zIndex: 1000,
				bgcolor: "rgba(10, 15, 30, 0.85)",
				backdropFilter: "blur(8px)",
				border: "1px solid rgba(255, 255, 255, 0.1)",
				borderRadius: "8px",
				p: "10px 20px",
				display: "flex",
				flexDirection: "column",
				gap: 0.5,
				boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
			}}
		>
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
						fontSize: "0.6rem",
						fontWeight: 700,
						color: "rgba(255,255,255,0.6)",
					}}
				>
					ZOOM LEVEL
				</Typography>
				<Typography
					variant="caption"
					sx={{ fontSize: "0.65rem", fontWeight: 800, color: "#00e5ff" }}
				>
					{currentViewMode === "galaxy" ? "GALAXY MODE" : "SYSTEM MODE"} (
					{activeZoom.toFixed(1)})
				</Typography>
			</Box>
			<Slider
				value={activeZoom}
				min={sliderMin}
				max={sliderMax}
				step={0.1}
				onChange={onChange as any}
				sx={{
					color: "#00e5ff",
					py: 1,
					"& .MuiSlider-thumb": {
						width: 12,
						height: 12,
						backgroundColor: "#ffffff",
						border: "2px solid #00e5ff",
						"&:hover, &.Mui-focusVisible, &.Mui-active": {
							boxShadow: "0 0 10px #00e5ff",
						},
					},
					"& .MuiSlider-rail": {
						bgcolor: "rgba(255,255,255,0.2)",
					},
					"& .MuiSlider-track": {
						bgcolor: "#00e5ff",
					},
					"& .MuiSlider-mark": {
						bgcolor: "rgba(255,255,255,0.4)",
						height: 6,
						width: 2,
					},
					"& .MuiSlider-markLabel": {
						color: "rgba(255,255,255,0.4)",
						fontSize: "0.55rem",
						fontWeight: 600,
					},
				}}
				marks={sliderMarks}
			/>
		</Box>
	);
};

export default MapZoomControls;
