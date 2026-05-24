import { Box, Button, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BaseStarMap from "../components/common/starmap/basestarmap";

const GalaxyMap = () => {
	const navigate = useNavigate();
	const theme = useTheme();

	return (
		<Box
			component="main"
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "calc(var(--vh, 1vh) * 100)",
			}}
		>
			<BaseStarMap mode="public" />
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
					onClick={() => navigate("/")}
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
