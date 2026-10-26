import React, { useState } from "react";
import {
	Box,
	Typography,
	IconButton,
	Popover,
	Paper,
	Tooltip,
	Collapse,
	useTheme,
} from "@mui/material";
import {
	LayersOutlined,
	Close,
	ExpandMore,
	ExpandLess,
} from "@mui/icons-material";
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
 * - Mobile (<600px): Sleek floating FAB at bottom-right that opens a compact glassmorphism popover.
 * - Desktop (>=600px): Docked card at bottom-right with smooth collapse/expand toggle.
 */
export const MapLegend: React.FC<MapLegendProps> = ({
	currentViewMode,
	isSystemPanelOpen,
	centeredSystem,
	isMobile,
	mode,
}) => {
	const theme = useTheme();
	const [mobileAnchorEl, setMobileAnchorEl] = useState<HTMLElement | null>(null);
	const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
	const isMobileOpen = Boolean(mobileAnchorEl);

	const renderLegendContent = () => {
		if (currentViewMode === "galaxy") {
			return (
				<Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Box
							sx={{
								width: 8,
								height: 8,
								borderRadius: "50%",
								bgcolor: "#ffffff",
								boxShadow: "0 0 6px rgba(255,255,255,0.8)",
							}}
						/>
						<Typography variant="caption" sx={{ fontSize: "0.65rem" }}>
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
								sx={{ fontSize: "0.65rem", color: "#00e5ff" }}
							>
								{mode === "shipping"
									? "Shipment Locations"
									: "Your Sites / Bases"}
							</Typography>
						</Box>
					)}
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Box
							sx={{
								width: 14,
								height: 2,
								bgcolor: "rgba(180, 0, 255, 0.8)",
							}}
						/>
						<Typography variant="caption" sx={{ fontSize: "0.65rem" }}>
							Jump Lanes / Gateways
						</Typography>
					</Box>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Box
							sx={{
								width: 14,
								height: 2,
								bgcolor: "rgba(255, 255, 255, 0.25)",
							}}
						/>
						<Typography variant="caption" sx={{ fontSize: "0.65rem" }}>
							Sector Boundaries
						</Typography>
					</Box>
				</Box>
			);
		}

		return (
			<Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Box
						sx={{
							width: 10,
							height: 10,
							borderRadius: "50%",
							bgcolor: "#00e5ff",
							boxShadow: "0 0 6px #00e5ff",
						}}
					/>
					<Typography variant="caption" sx={{ fontSize: "0.65rem" }}>
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
						sx={{ fontSize: "0.65rem", color: "#00e5ff" }}
					>
						{mode === "shipping"
							? "Shipment Storage / Locations"
							: "Planets with Your Sites"}
					</Typography>
				</Box>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Box
						sx={{
							width: 8,
							height: 8,
							bgcolor: "#00ff00",
							boxShadow: "0 0 6px #00ff00",
						}}
					/>
					<Typography variant="caption" sx={{ fontSize: "0.65rem" }}>
						Space Stations
					</Typography>
				</Box>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Box
						sx={{
							width: 12,
							height: 12,
							border: "2px solid rgba(255, 255, 255, 0.4)",
							borderRadius: "50%",
						}}
					/>
					<Typography variant="caption" sx={{ fontSize: "0.65rem" }}>
						Orbits & Trails
					</Typography>
				</Box>
			</Box>
		);
	};

	if (isMobile) {
		if (isSystemPanelOpen && centeredSystem) return null;

		return (
			<>
				<Paper
					elevation={8}
					sx={{
						position: "absolute",
						bottom: 16,
						right: 16,
						zIndex: 1000,
						bgcolor: "rgba(16, 16, 32, 0.85)",
						backdropFilter: "blur(15px)",
						border: "1px solid rgba(123, 104, 238, 0.35)",
						borderRadius: "50%",
						boxShadow:
							"0 4px 20px rgba(0, 0, 0, 0.5), 0 0 12px rgba(123, 104, 238, 0.2)",
						transition: "all 0.3s ease",
						"&:hover": {
							transform: "scale(1.08)",
							borderColor: theme.palette.primary.light,
							boxShadow:
								"0 4px 20px rgba(0, 0, 0, 0.6), 0 0 16px rgba(123, 104, 238, 0.45)",
						},
					}}
				>
					<Tooltip title="Map Legend">
						<IconButton
							size="medium"
							onClick={(e) => setMobileAnchorEl(e.currentTarget)}
							sx={{
								color: theme.palette.secondary.main,
								p: 1.1,
								"&:hover": { bgcolor: "rgba(123, 104, 238, 0.15)" },
							}}
						>
							<LayersOutlined sx={{ fontSize: 20 }} />
						</IconButton>
					</Tooltip>
				</Paper>

				<Popover
					open={isMobileOpen}
					anchorEl={mobileAnchorEl}
					onClose={() => setMobileAnchorEl(null)}
					anchorOrigin={{ vertical: "top", horizontal: "right" }}
					transformOrigin={{ vertical: "bottom", horizontal: "right" }}
					PaperProps={{
						sx: {
							mb: 1.5,
							bgcolor: "rgba(16, 16, 32, 0.95)",
							backdropFilter: "blur(20px)",
							border: "1px solid rgba(123, 104, 238, 0.35)",
							borderRadius: "12px",
							p: 1.5,
							color: "white",
							minWidth: 200,
							maxWidth: 260,
							boxShadow:
								"0 8px 32px rgba(0, 0, 0, 0.7), 0 0 16px rgba(123, 104, 238, 0.2)",
						},
					}}
				>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 1,
						}}
					>
						<Typography
							sx={{
								fontSize: "0.65rem",
								fontWeight: 800,
								textTransform: "uppercase",
								letterSpacing: "0.1em",
								color: "#00e5ff",
							}}
						>
							Map Legend ({currentViewMode === "galaxy" ? "Galaxy" : "System"})
						</Typography>
						<IconButton
							size="small"
							onClick={() => setMobileAnchorEl(null)}
							sx={{ color: "rgba(255,255,255,0.5)", p: 0.25, ml: 1 }}
						>
							<Close sx={{ fontSize: 16 }} />
						</IconButton>
					</Box>
					{renderLegendContent()}
				</Popover>
			</>
		);
	}

	return (
		<Box
			sx={{
				position: "absolute",
				bottom: 20,
				right: isSystemPanelOpen ? 400 : 20,
				zIndex: 1000,
				bgcolor: "rgba(16, 16, 32, 0.85)",
				backdropFilter: "blur(15px)",
				border: "1px solid rgba(123, 104, 238, 0.25)",
				borderRadius: "10px",
				p: isDesktopCollapsed ? "6px 12px" : 1.5,
				display: "flex",
				flexDirection: "column",
				gap: 1,
				color: "white",
				transition: "right 0.3s cubic-bezier(0.4, 0, 0.2, 1), all 0.2s ease",
				boxShadow:
					"0 4px 20px rgba(0, 0, 0, 0.5), 0 0 12px rgba(123, 104, 238, 0.15)",
			}}
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					cursor: "pointer",
					gap: 1,
				}}
				onClick={() => setIsDesktopCollapsed((p) => !p)}
			>
				<Typography
					sx={{
						fontSize: "0.65rem",
						fontWeight: 800,
						textTransform: "uppercase",
						letterSpacing: "0.1em",
						color: "#00e5ff",
						userSelect: "none",
					}}
				>
					Map Legend ({currentViewMode === "galaxy" ? "Galaxy" : "System"})
				</Typography>
				<IconButton
					size="small"
					sx={{ color: "rgba(255, 255, 255, 0.6)", p: 0.25 }}
				>
					{isDesktopCollapsed ? (
						<ExpandLess sx={{ fontSize: 16 }} />
					) : (
						<ExpandMore sx={{ fontSize: 16 }} />
					)}
				</IconButton>
			</Box>
			<Collapse in={!isDesktopCollapsed}>{renderLegendContent()}</Collapse>
		</Box>
	);
};

export default MapLegend;
