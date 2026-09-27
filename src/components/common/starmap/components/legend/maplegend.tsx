import React from "react";
import { Box, Typography } from "@mui/material";
import type { MapPoint } from "../../types/maptypes";

interface MapLegendProps {
	currentViewMode: "galaxy" | "system";
	isSystemPanelOpen: boolean;
	centeredSystem: MapPoint | null;
	isMobile: boolean;
	mode: "public" | "dashboard" | "shipping";
}

/**
 * Floating map legend overlay indicating star classes, jump lanes, planets, and base sites.
 */
export const MapLegend: React.FC<MapLegendProps> = ({
	currentViewMode,
	isSystemPanelOpen,
	centeredSystem,
	isMobile,
	mode,
}) => {
	return (
		<Box
			sx={{
				position: "absolute",
				bottom: currentViewMode === "system" ? 110 : 20,
				right: isSystemPanelOpen && !isMobile ? 400 : 20,
				zIndex: 1000,
				bgcolor: "rgba(10, 15, 30, 0.85)",
				backdropFilter: "blur(8px)",
				border: "1px solid rgba(255, 255, 255, 0.1)",
				borderRadius: "8px",
				p: 1.5,
				display:
					isMobile && isSystemPanelOpen && centeredSystem ? "none" : "flex",
				flexDirection: "column",
				gap: 1,
				color: "white",
				pointerEvents: "none",
				transition: "right 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
			}}
		>
			<Typography
				sx={{
					fontSize: "0.65rem",
					fontWeight: 800,
					textTransform: "uppercase",
					letterSpacing: "0.1em",
					color: "#00e5ff",
					mb: 0.5,
				}}
			>
				Map Legend ({currentViewMode === "galaxy" ? "Galaxy" : "System"})
			</Typography>
			{currentViewMode === "galaxy" ? (
				<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Box
							sx={{
								width: 8,
								height: 8,
								borderRadius: "50%",
								bgcolor: "#ffffff",
							}}
						/>
						<Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
							Star Systems (O-M Class)
						</Typography>
					</Box>
					{mode !== "public" && (
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Box
								sx={{
									width: 12,
									height: 12,
									borderRadius: "50%",
									border: "2px solid #00e5ff",
									bgcolor: "rgba(0, 229, 255, 0.2)",
								}}
							/>
							<Typography
								variant="caption"
								sx={{ fontSize: "0.6rem", color: "#00e5ff" }}
							>
								Your Sites / Bases
							</Typography>
						</Box>
					)}
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Box
							sx={{
								width: 14,
								height: 2,
								bgcolor: "rgba(180, 0, 255, 0.6)",
							}}
						/>
						<Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
							Jump Lanes / Gateways
						</Typography>
					</Box>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Box
							sx={{
								width: 14,
								height: 2,
								bgcolor: "rgba(255, 255, 255, 0.15)",
							}}
						/>
						<Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
							Sector Boundaries
						</Typography>
					</Box>
				</Box>
			) : (
				<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Box
							sx={{
								width: 10,
								height: 10,
								borderRadius: "50%",
								bgcolor: "#00e5ff",
							}}
						/>
						<Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
							Planets
						</Typography>
					</Box>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Box
							sx={{
								width: 14,
								height: 14,
								borderRadius: "50%",
								border: "2px solid #00e5ff",
							}}
						/>
						<Typography
							variant="caption"
							sx={{ fontSize: "0.6rem", color: "#00e5ff" }}
						>
							Planets with Your Sites
						</Typography>
					</Box>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Box sx={{ width: 8, height: 8, bgcolor: "#00ff00" }} />
						<Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
							Space Stations
						</Typography>
					</Box>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Box
							sx={{
								width: 12,
								height: 12,
								border: "2px solid rgba(255, 255, 255, 0.3)",
								borderRadius: "50%",
							}}
						/>
						<Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
							Orbits & Trails
						</Typography>
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default MapLegend;
