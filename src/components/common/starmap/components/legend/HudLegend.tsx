import React from "react";
import { Box, Typography, Avatar } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ownedSiteIcon from "../../../../../assets/sites/owned_site.png";
import leasedSiteIcon from "../../../../../assets/sites/leased_site.png";

const HudLegend: React.FC = () => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				position: "absolute",
				right: "1rem",
				bottom: "1rem",
				background: "rgba(0,0,0,0.4)",
				backdropFilter: "blur(8px)",
				borderRadius: "8px",
				padding: "8px 12px",
				color: theme.palette.text.primary,
				fontSize: "0.75rem",
				zIndex: 10,
			}}
		>
			<Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5 }}>
				HUD Legend
			</Typography>
			<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
				<Avatar
					src={ownedSiteIcon}
					sx={{
						width: 12,
						height: 12,
						border: "2px solid rgba(0, 229, 255, 0.9)",
					}}
				/>
				<Typography variant="caption">Owned Sites</Typography>
				<Avatar
					src={leasedSiteIcon}
					sx={{
						width: 12,
						height: 12,
						border: "2px solid rgba(255, 165, 0, 0.9)",
					}}
				/>
				<Typography variant="caption">Leased Sites</Typography>
			</Box>
		</Box>
	);
};

export default HudLegend;
