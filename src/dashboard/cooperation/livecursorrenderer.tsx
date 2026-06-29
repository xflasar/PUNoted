import React, { useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useStore } from "reactflow";

interface RemoteCursor {
	id: string; // userId
	x: number;
	y: number;
	username: string; // Or display name
}

interface LiveCursorRendererProps {
	remoteCursors: Map<string, RemoteCursor> | undefined;
}

const LiveCursorRenderer: React.FC<LiveCursorRendererProps> = ({
	remoteCursors = new Map(),
}) => {
	const theme = useTheme();

	const [panX, panY, zoom] = useStore(
		useCallback((state) => state.transform, []),
	);

	return (
		<>
			{Array.from(remoteCursors.entries()).map(([userId, cursorData]) => {
				// 1. Calculate the final screen position
				// ScreenX = FlowX * Zoom + PanX
				const screenX = cursorData.x * zoom + panX;
				const screenY = cursorData.y * zoom + panY;

				return (
					// Position the cursor on the screen using the calculated coordinates
					<Box
						key={userId}
						sx={{
							position: "absolute",
							transform: `translate(${screenX}px, ${screenY}px) scale(${zoom})`,
							transformOrigin: "top left",
							pointerEvents: "none",
							zIndex: 9999,
							transition: "transform 0.05s linear",
						}}
					>
						{/* Render a simple triangle/cursor icon */}
						<Box
							sx={{
								width: 0,
								height: 0,
								borderLeft: "7px solid transparent",
								borderRight: "7px solid transparent",
								borderBottom: `10px solid ${theme.palette.secondary.main}`,
								transform: "rotate(45deg)",
							}}
						/>

						{/* Render the user's name/tag */}
						<Box
							sx={{
								position: "absolute",
								top: 10,
								left: 10,
								transform: `scale(${1 / zoom})`,
								transformOrigin: "top left",
								bgcolor: theme.palette.secondary.main,
								color: theme.palette.secondary.contrastText,
								px: 1,
								py: 0.5,
								borderRadius: 1,
								whiteSpace: "nowrap",
							}}
						>
							<Typography variant="caption" sx={{ fontWeight: "bold" }}>
								{cursorData.username || `User ${userId.slice(-4)}`}
							</Typography>
						</Box>
					</Box>
				);
			})}
		</>
	);
};

export default LiveCursorRenderer;
