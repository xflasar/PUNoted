import React from "react";
import { Box, Typography } from "@mui/material";

interface ShipTooltipProps {
	tooltip: {
		object: any;
		x: number;
		y: number;
		isLocked: boolean;
	};
	onClose: () => void;
	onSelectShip: (shipId: string) => void;
}

/**
 * Renders radar tooltip overlay for individual ships or clustered fleets.
 */
export const ShipTooltip: React.FC<ShipTooltipProps> = ({
	tooltip,
	onClose,
	onSelectShip,
}) => {
	const { object, x, y, isLocked } = tooltip;
	const isCluster = Array.isArray(object.ships);

	return (
		<Box
			sx={{
				position: "absolute",
				left: x,
				top: y - 10,
				transform: "translate(-50%, -100%)",
				bgcolor: "rgba(10, 15, 30, 0.92)",
				backdropFilter: "blur(10px)",
				border: isLocked
					? "1px solid #00e5ff"
					: "1px solid rgba(255,255,255,0.15)",
				boxShadow: isLocked
					? "0 0 15px rgba(0,229,255,0.3)"
					: "0 4px 20px rgba(0,0,0,0.5)",
				borderRadius: "8px",
				p: 1.5,
				zIndex: 9999,
				pointerEvents: isLocked ? "auto" : "none",
				color: "white",
				minWidth: 260,
				maxWidth: 320,
			}}
		>
			{isLocked && (
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 1,
						borderBottom: "1px solid rgba(255,255,255,0.1)",
						pb: 0.5,
					}}
				>
					<Typography
						variant="caption"
						sx={{ color: "#00e5ff", fontWeight: 700, letterSpacing: "0.05em" }}
					>
						{isCluster ? "FLEET CLUSTER (LOCKED)" : "SHIP RADAR (LOCKED)"}
					</Typography>
					<Box
						onClick={(e) => {
							e.stopPropagation();
							onClose();
						}}
						sx={{
							cursor: "pointer",
							color: "rgba(255,255,255,0.5)",
							"&:hover": { color: "#ff1744" },
							fontSize: "0.8rem",
							fontWeight: 800,
							px: 0.5,
						}}
					>
						✕
					</Box>
				</Box>
			)}

			{isCluster ? (
				<Box>
					<Typography
						variant="subtitle2"
						sx={{ fontWeight: 800, color: "#fff" }}
					>
						Cluster of {object.ships.length} Ships
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.6)", display: "block", mb: 1 }}
					>
						Coords: {object.position[0].toFixed(1)},{" "}
						{object.position[1].toFixed(1)}
					</Typography>

					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 0.5,
							maxHeight: 180,
							overflowY: "auto",
							pr: 0.5,
						}}
					>
						{object.ships.map((s: any) => {
							const reg =
								s.registration || s.ship_id || s.shipid || s.id || "Unknown";
							const type = s.ship_type || s.type || "LCB";
							const owner = s.isOwn ? "You" : s.display_name || "Unknown";
							const status = s.plan ? "In Transit" : "Stationary";
							const shipKey = s.id || s.ship_id || s.shipid;
							return (
								<Box
									key={shipKey}
									onClick={(e) => {
										if (isLocked) {
											e.stopPropagation();
											onSelectShip(shipKey);
										}
									}}
									sx={{
										p: 0.5,
										borderRadius: "4px",
										cursor: isLocked ? "pointer" : "default",
										border: "1px solid rgba(255,255,255,0.05)",
										bgcolor: "rgba(255,255,255,0.02)",
										"&:hover": isLocked
											? {
													bgcolor: "rgba(0, 229, 255, 0.1)",
													borderColor: "rgba(0, 229, 255, 0.3)",
												}
											: {},
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
									}}
								>
									<Box>
										<Typography
											variant="caption"
											sx={{
												fontWeight: 700,
												color: "#00e5ff",
												display: "block",
											}}
										>
											[{type}] {reg}
										</Typography>
										<Typography
											sx={{
												fontSize: "0.6rem",
												color: "rgba(255,255,255,0.5)",
											}}
										>
											Owner: {owner}
										</Typography>
									</Box>
									<Typography
										sx={{
											fontSize: "0.6rem",
											color: s.plan ? "#ffb300" : "#00e676",
											fontWeight: 600,
										}}
									>
										{status}
									</Typography>
								</Box>
							);
						})}
					</Box>
				</Box>
			) : (
				<Box>
					<Typography
						variant="subtitle2"
						sx={{ fontWeight: 800, color: "#fff" }}
					>
						{object.registration || "Ship"}
					</Typography>
					{object.name && (
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.7)",
								display: "block",
								mt: -0.5,
								mb: 0.5,
							}}
						>
							{object.name}
						</Typography>
					)}
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 0.25,
							fontSize: "0.7rem",
							color: "rgba(255,255,255,0.7)",
						}}
					>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<span>Type:</span>{" "}
							<strong style={{ color: "#00e5ff" }}>
								{object.ship_type || object.type || "LCB"}
							</strong>
						</Box>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<span>Owner:</span>{" "}
							<strong>
								{object.isOwn ? "You" : object.display_name || "Unknown"}
							</strong>
						</Box>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<span>Status:</span>{" "}
							<strong style={{ color: object.plan ? "#ffb300" : "#00e676" }}>
								{object.plan ? "In Transit" : "Stationary"}
							</strong>
						</Box>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<span>Coords:</span>{" "}
							<strong>
								{object.position[0].toFixed(1)}, {object.position[1].toFixed(1)}
							</strong>
						</Box>
					</Box>
					{isLocked && (
						<Box
							onClick={(e) => {
								e.stopPropagation();
								onSelectShip(object.id || object.ship_id || object.shipid);
							}}
							sx={{
								mt: 1,
								p: "4px 8px",
								bgcolor: "rgba(0, 229, 255, 0.2)",
								border: "1px solid rgba(0, 229, 255, 0.4)",
								borderRadius: "4px",
								cursor: "pointer",
								textAlign: "center",
								fontSize: "0.7rem",
								fontWeight: 700,
								color: "#00e5ff",
								"&:hover": {
									bgcolor: "rgba(0, 229, 255, 0.3)",
								},
							}}
						>
							SELECT IN FLEET RADAR
						</Box>
					)}
				</Box>
			)}
		</Box>
	);
};

export default ShipTooltip;
