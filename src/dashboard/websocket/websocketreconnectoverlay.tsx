import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	CircularProgress,
	Zoom,
	useTheme,
	Button,
} from "@mui/material";
import { Warning, Refresh } from "@mui/icons-material";
import { useGlobalWsContext } from "./globalwscontext";

const WsReconnectionOverlay: React.FC = () => {
	const theme = useTheme();
	const { status } = useGlobalWsContext();
	const isConnected = status === "connected";
	const [hasConnectedOnce, setHasConnectedOnce] = useState(false);

	useEffect(() => {
		if (isConnected) {
			setHasConnectedOnce(true);
		}
	}, [isConnected]);

	// We can keep a visual countdown for UX, even though the Context handles the actual retrying
	const [countdown, setCountdown] = useState(5);

	useEffect(() => {
		if (hasConnectedOnce && !isConnected) {
			setCountdown(5);
			const timer = setInterval(() => {
				setCountdown((prev) => (prev > 0 ? prev - 1 : 5));
			}, 1000);
			return () => clearInterval(timer);
		}
	}, [hasConnectedOnce, isConnected]);

	// Optional: Allow manual page reload if stuck
	const handleManualReload = () => {
		window.location.reload();
	};

	if (!hasConnectedOnce || isConnected) return null;

	return (
		<Box
			sx={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				backgroundColor: "rgba(0, 0, 0, 0.8)",
				zIndex: 9999,
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				pointerEvents: "auto",
			}}
		>
			<Zoom in={!isConnected}>
				<Box
					sx={{
						p: 4,
						borderRadius: 2,
						textAlign: "center",
						bgcolor: theme.palette.background.paper,
						boxShadow: 24,
						maxWidth: 400,
						border: `2px solid ${theme.palette.error.main}`,
					}}
				>
					<Warning color="error" sx={{ fontSize: 60, mb: 1 }} />
					<Typography variant="h5" color="error" fontWeight="bold" gutterBottom>
						Connection Lost
					</Typography>
					<Typography variant="body1" sx={{ mb: 2 }}>
						We lost contact with the server. <br />
						Please check your internet connection.
					</Typography>

					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 1,
							mb: 3,
						}}
					>
						<CircularProgress size={20} color="error" />
						<Typography variant="body2" color="text.secondary">
							Auto-reconnecting...
						</Typography>
					</Box>

					<Button
						variant="outlined"
						color="primary"
						startIcon={<Refresh />}
						onClick={handleManualReload}
					>
						Reload Page
					</Button>
				</Box>
			</Zoom>
		</Box>
	);
};

export default WsReconnectionOverlay;
