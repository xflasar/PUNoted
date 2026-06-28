import React from "react";
import { Box, CircularProgress, Skeleton, Typography } from "@mui/material";

interface MapLoadingOverlayProps {
	isVisible: boolean;
	isLoadingFromCache?: boolean;
}

const MapLoadingOverlay: React.FC<MapLoadingOverlayProps> = ({
	isVisible,
	isLoadingFromCache = false,
}) => {
	if (!isVisible) {
		return null;
	}

	return (
		<Box
			sx={{
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				background: "rgba(10, 10, 20, 0.85)",
				backdropFilter: "blur(4px)",
				zIndex: 1000,
				gap: 2,
				animation: "fadeIn 0.3s ease-in-out",
				"@keyframes fadeIn": {
					from: {
						opacity: 0,
					},
					to: {
						opacity: 1,
					},
				},
			}}
		>
			<CircularProgress
				sx={{
					color: "primary.main",
					animation: isLoadingFromCache
						? "pulse 2s ease-in-out infinite"
						: undefined,
					"@keyframes pulse": {
						"0%, 100%": {
							opacity: 1,
						},
						"50%": {
							opacity: 0.5,
						},
					},
				}}
			/>
			<Typography
				variant="body1"
				sx={{
					color: "#b0b0b0",
					textAlign: "center",
					maxWidth: "300px",
				}}
			>
				{isLoadingFromCache
					? "Loading cached map data..."
					: "Fetching map data..."}
			</Typography>

			{/* Skeleton loaders for visual feedback */}
			<Box sx={{ display: "flex", gap: 1, mt: 1 }}>
				<Skeleton
					variant="rectangular"
					width={60}
					height={8}
					sx={{ borderRadius: 1 }}
				/>
				<Skeleton
					variant="rectangular"
					width={60}
					height={8}
					sx={{ borderRadius: 1 }}
				/>
				<Skeleton
					variant="rectangular"
					width={60}
					height={8}
					sx={{ borderRadius: 1 }}
				/>
			</Box>
		</Box>
	);
};

export default MapLoadingOverlay;
