// src/settings/styles.tsx
import React from "react";
import { Box, Typography, Badge } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { SectionGuide, type GuideStep } from "../../helpers/GlobalGuide"; // Adjust path

export const transparentCardStyle = (theme: any) => ({
	p: 1.5,
	display: "flex",
	flexDirection: "column",
	backgroundColor: alpha(theme.palette.background.default, 0.4),
	backdropFilter: "blur(12px)",
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: 2,
	height: "100%",
	transition: "all 0.2s ease-in-out",
	"&:hover": {
		borderColor: theme.palette.primary.main,
		boxShadow: theme.shadows[4],
	},
});

export const SectionHeader: React.FC<{
	icon: React.ReactNode;
	title: string;
	color: string;
	badge?: number;
	guideSteps?: GuideStep[]; // New prop for passing steps
}> = ({ icon, title, color, badge, guideSteps }) => (
	<Box
		sx={{
			display: "flex",
			alignItems: "center",
			mb: 1.5,
			pb: 0.5,
			borderBottom: `1px solid ${alpha(color, 0.3)}`,
		}}
	>
		<Box
			sx={{ color: color, mr: 1, display: "flex", "& svg": { fontSize: 20 } }}
		>
			{badge ? (
				<Badge badgeContent={badge} color="error">
					{icon}
				</Badge>
			) : (
				icon
			)}
		</Box>
		<Typography
			variant="subtitle2"
			fontWeight={700}
			sx={{
				textTransform: "uppercase",
				letterSpacing: "0.5px",
				color: color,
				flexGrow: 1,
			}}
		>
			{title}
		</Typography>

		{/* Conditionally render Guide if steps are provided */}
		{guideSteps && guideSteps.length > 0 && (
			<Box sx={{ ml: 1 }}>
				<SectionGuide title={title} steps={guideSteps} />
			</Box>
		)}
	</Box>
);
