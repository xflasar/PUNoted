import { useState } from "react";
import { Box, Button, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BaseStarMap from "../components/common/starmap/basestarmap";

const GalaxyMap = () => {
	const navigate = useNavigate();
	const theme = useTheme();
	const [isExiting, setIsExiting] = useState(false);

	const handleBack = () => {
		setIsExiting(true);
		setTimeout(() => {
			navigate("/");
		}, 10);
	};

	return (
		<Box
			component="main"
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "calc(var(--vh, 1vh) * 100)",
			}}
		>
			{!isExiting && <BaseStarMap mode="public" />}
			<Box
				sx={{
					position: "absolute",
					top: 16,
					left: 16,
					zIndex: 100,
				}}
			>
				<Button
					variant="contained"
					size="large"
					startIcon={<ArrowBackIcon />}
					onClick={handleBack}
					sx={{
						boxShadow: `0 0 15px ${theme.palette.primary.main}`,
						textTransform: "none",
						fontWeight: "bold",
						background: theme.palette.background.paper,
					}}
				>
					Back to Main Page
				</Button>
			</Box>
		</Box>
	);
};

export default GalaxyMap;
