import React from "react";
import {
	Box,
	Typography,
	Slider,
	IconButton,
	useTheme,
	useMediaQuery,
} from "@mui/material";
import { AddRounded, RemoveRounded } from "@mui/icons-material";

interface MapZoomControlsProps {
	currentViewMode: "galaxy" | "system";
	activeZoom: number;
	sliderMin: number;
	sliderMax: number;
	sliderMarks: Array<{ value: number; label: string }>;
	onChange: (event: Event, newValue: number | number[]) => void;
	onZoomIn?: () => void;
	onZoomOut?: () => void;
	isSystemPanelOpen?: boolean;
}

/**
 * Floating bottom zoom level controls.
 * - Mobile (<600px): Sleek, compact capsule pill ([-], Mode/Zoom, [+]) centered at bottom.
 * - Desktop (>=600px): Full slider with continuous scrubbing & discrete step buttons.
 */
export const MapZoomControls: React.FC<MapZoomControlsProps> = ({
	currentViewMode,
	activeZoom,
	sliderMin,
	sliderMax,
	sliderMarks,
	onChange,
	onZoomIn,
	onZoomOut,
	isSystemPanelOpen = false,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	if (isMobile) {
		if (isSystemPanelOpen) return null;

		return (
			<Box
				sx={{
					position: "absolute",
					bottom: 16,
					left: "50%",
					transform: "translateX(-50%)",
					zIndex: 1000,
					bgcolor: "rgba(16, 16, 32, 0.85)",
					backdropFilter: "blur(15px)",
					border: "1px solid rgba(123, 104, 238, 0.35)",
					borderRadius: "24px",
					px: 1,
					py: 0.5,
					display: "flex",
					alignItems: "center",
					gap: 0.75,
					boxShadow:
						"0 4px 20px rgba(0, 0, 0, 0.5), 0 0 12px rgba(123, 104, 238, 0.2)",
					userSelect: "none",
				}}
			>
				<IconButton
					size="small"
					onClick={onZoomOut}
					disabled={activeZoom <= sliderMin}
					sx={{
						color: theme.palette.secondary.main,
						p: 0.5,
						"&.Mui-disabled": { color: "rgba(255,255,255,0.2)" },
					}}
				>
					<RemoveRounded sx={{ fontSize: 18 }} />
				</IconButton>

				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						px: 0.5,
						minWidth: 70,
					}}
				>
					<Typography
						sx={{
							fontSize: "0.55rem",
							fontWeight: 800,
							letterSpacing: "0.08em",
							color: "rgba(255,255,255,0.6)",
							textTransform: "uppercase",
							lineHeight: 1,
						}}
					>
						{currentViewMode === "galaxy" ? "GALAXY" : "SYSTEM"}
					</Typography>
					<Typography
						sx={{
							fontSize: "0.75rem",
							fontWeight: 800,
							color: theme.palette.secondary.main,
							lineHeight: 1.2,
						}}
					>
						{activeZoom.toFixed(1)}x
					</Typography>
				</Box>

				<IconButton
					size="small"
					onClick={onZoomIn}
					disabled={activeZoom >= sliderMax}
					sx={{
						color: theme.palette.secondary.main,
						p: 0.5,
						"&.Mui-disabled": { color: "rgba(255,255,255,0.2)" },
					}}
				>
					<AddRounded sx={{ fontSize: 18 }} />
				</IconButton>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				position: "absolute",
				bottom: { sm: 20, md: 24 },
				left: "50%",
				transform: "translateX(-50%)",
				width: { sm: 280, md: 320 },
				maxWidth: 320,
				zIndex: 1000,
				bgcolor: "rgba(16, 16, 32, 0.85)",
				backdropFilter: "blur(15px)",
				border: "1px solid rgba(123, 104, 238, 0.25)",
				borderRadius: "10px",
				p: "8px 16px",
				display: "flex",
				flexDirection: "column",
				gap: 0.5,
				boxShadow:
					"0 4px 20px rgba(0, 0, 0, 0.5), 0 0 12px rgba(123, 104, 238, 0.15)",
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
			<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
				{onZoomOut && (
					<IconButton
						size="small"
						onClick={onZoomOut}
						disabled={activeZoom <= sliderMin}
						sx={{
							color: "rgba(255, 255, 255, 0.7)",
							p: 0.25,
							"&:hover": { color: "#00e5ff" },
							"&.Mui-disabled": { color: "rgba(255,255,255,0.2)" },
						}}
					>
						<RemoveRounded sx={{ fontSize: 16 }} />
					</IconButton>
				)}
				<Slider
					value={activeZoom}
					min={sliderMin}
					max={sliderMax}
					step={0.1}
					onChange={onChange as any}
					sx={{
						color: "#00e5ff",
						py: 1,
						flex: 1,
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
				{onZoomIn && (
					<IconButton
						size="small"
						onClick={onZoomIn}
						disabled={activeZoom >= sliderMax}
						sx={{
							color: "rgba(255, 255, 255, 0.7)",
							p: 0.25,
							"&:hover": { color: "#00e5ff" },
							"&.Mui-disabled": { color: "rgba(255,255,255,0.2)" },
						}}
					>
						<AddRounded sx={{ fontSize: 16 }} />
					</IconButton>
				)}
			</Box>
		</Box>
	);
};

export default MapZoomControls;
