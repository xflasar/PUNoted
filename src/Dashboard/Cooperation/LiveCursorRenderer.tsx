import React, { useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useStore } from "reactflow"; // <-- REMOVED 'shallow'
//import type { CursorMovePayload } from './types';

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

	// CRITICAL FIX: Simplify useStore to only select the transform array.
	// React Flow handles the dependency check for the state value itself.
	const [panX, panY, zoom] = useStore(
		useCallback((state) => state.transform, []),
		// REMOVED 'shallow' argument here, which was causing the TypeError.
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
							// FIX 1: Apply screen position via translate and scale by zoom
							transform: `translate(${screenX}px, ${screenY}px) scale(${zoom})`,
							transformOrigin: "top left", // Scale from the correct origin
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
								// FIX 2: Inverse scale the text so it appears fixed-size (readable)
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
