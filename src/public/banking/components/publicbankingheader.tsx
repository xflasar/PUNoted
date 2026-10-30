import React from "react";
import { Box, Paper, Typography, Button, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export const PublicBankingHeader: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();

	return (
		<Paper
			elevation={0}
			sx={{
				px: { xs: 2, md: 3 },
				py: 1.25,
				bgcolor: alpha(theme.palette.background.paper, 0.4),
				borderBottom: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-start",
				gap: 2,
				position: "sticky",
				top: 0,
				zIndex: 10,
				backdropFilter: "blur(12px)",
			}}
		>
			<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, zIndex: 1 }}>
				<Button
					variant="text"
					size="small"
					startIcon={<ArrowBackIcon sx={{ fontSize: "16px !important" }} />}
					onClick={() => navigate("/")}
					sx={{
						color: "text.secondary",
						textTransform: "none",
						fontWeight: 600,
						fontSize: "0.8rem",
						"&:hover": { color: "text.primary" },
					}}
				>
					Home
				</Button>
			</Box>
			<Box
				sx={{
					position: { xs: "static", md: "absolute" },
					left: { md: "50%" },
					transform: { md: "translateX(-50%)" },
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: { xs: "100%", md: "auto" },
					pointerEvents: "none",
				}}
			>
				<Typography
					variant="h6"
					sx={{
						fontWeight: 900,
						letterSpacing: 0.5,
						fontSize: { xs: "0.95rem", md: "1.1rem" },
					}}
				>
					BANKING DIRECTORY
				</Typography>
			</Box>
		</Paper>
	);
};
