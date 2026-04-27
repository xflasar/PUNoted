import React from "react";
import { Typography, Button, Box, type Theme } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import MapIcon from "@mui/icons-material/Map";
import CollapsiblePanel from "../CollapsiblePanel/CollapsiblePanel";

interface MapControlsProps {
	isPlanetModeActive: boolean;
	setIsFilterPanelOpen: (isOpen: boolean) => void;
	empireLegend: Record<string, string>;
	theme: Theme;
}

export const MapControls: React.FC<MapControlsProps> = ({
	isPlanetModeActive,
	setIsFilterPanelOpen,
	empireLegend,
	theme,
}) => {
	if (isPlanetModeActive) {
		return null;
	}

	return (
		<CollapsiblePanel
			icon={<MapIcon />}
			title="Map Controls"
			position={{ top: 8, right: 8 }}
			width={200}
		>
			<Button
				variant="contained"
				color="primary"
				fullWidth
				size="small"
				onClick={() => setIsFilterPanelOpen(true)}
				sx={{ mb: 1.5, textTransform: "none" }}
			>
				<FilterListIcon sx={{ mr: 1 }} /> Advanced Filters
			</Button>

			<Typography
				variant="subtitle2"
				sx={{ mt: 1, mb: 0.5, textAlign: "center" }}
			>
				Empire Legend
			</Typography>
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 1,
					justifyItems: "center",
				}}
			>
				{Object.entries(empireLegend).map(([code, color]) => (
					<Box
						key={code}
						sx={{ display: "flex", alignItems: "center", gap: 1 }}
					>
						<Box
							sx={{
								width: 14,
								height: 14,
								borderRadius: "3px",
								background: color,
							}}
						/>
						<Typography variant="body2" sx={{ fontSize: 12 }}>
							{code}
						</Typography>
					</Box>
				))}
			</Box>
		</CollapsiblePanel>
	);
};
