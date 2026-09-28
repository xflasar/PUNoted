import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

export interface GlobalLoadingOverlayProps {
	loading: boolean;
	statusText?: string;
	subText?: string;
	zIndex?: number;
	blurAmount?: string;
	backdropColor?: string;
}

export const GlobalLoadingOverlay: React.FC<GlobalLoadingOverlayProps> = ({
	loading,
	statusText = "CALCULATING & SYNCING DATA...",
	subText,
	zIndex = 100,
	blurAmount = "12px",
	backdropColor = "rgba(2, 2, 8, 0.75)",
}) => {
	if (!loading) return null;

	return (
		<Box
			sx={{
				position: "absolute",
				inset: 0,
				bgcolor: backdropColor,
				backdropFilter: blurAmount ? `blur(${blurAmount})` : "none",
				zIndex: zIndex,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Box
				sx={{
					position: "relative",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					borderRadius: "14px",
					overflow: "hidden",
					boxShadow:
						"0 0 40px rgba(123, 104, 238, 0.4), 0 0 20px rgba(100, 255, 218, 0.25)",
					minWidth: 320,
					p: "2.5px", // 2.5px border gap for glowing perimeter beam
					// Animated Clockwise Perimeter Border Beam with intense glow
					"&::before": {
						content: '""',
						position: "absolute",
						inset: "-150%",
						background: `conic-gradient(from 0deg, transparent 0%, transparent 40%, rgba(123, 104, 238, 0.3) 70%, #7b68ee 88%, #64FFDA 100%)`,
						animation: "clockwiseBorder 2s linear infinite",
						filter:
							"drop-shadow(0 0 10px #64FFDA) drop-shadow(0 0 20px #7b68ee)",
						zIndex: 0,
					},
					"&::after": {
						content: '""',
						position: "absolute",
						inset: "2px",
						bgcolor: "#080816",
						borderRadius: "12px",
						zIndex: 1,
					},
					"@keyframes clockwiseBorder": {
						"0%": { transform: "rotate(0deg)" },
						"100%": { transform: "rotate(360deg)" },
					},
				}}
			>
				<Box
					sx={{
						position: "relative",
						zIndex: 2,
						px: 3.5,
						py: 2.5,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 1.5,
						width: "100%",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
						<CircularProgress
							size={20}
							thickness={5}
							sx={{ color: "#7b68ee" }}
						/>
						<Typography
							sx={{
								fontSize: "0.85rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: "#ffffff",
								letterSpacing: "0.05em",
							}}
						>
							{statusText}
						</Typography>
					</Box>

					{subText && (
						<Typography
							sx={{
								fontSize: "0.72rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: "#64FFDA",
								letterSpacing: "0.08em",
							}}
						>
							{subText}
						</Typography>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default GlobalLoadingOverlay;
