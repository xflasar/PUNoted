import { Box, Button } from "@mui/material";
import { styled } from "@mui/system";

export const BackgroundBox = styled(Box)(({ theme }) => ({
	width: "100vw",
	minHeight: "100vh",
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	textAlign: "center",
	color: theme.palette.common.white,
	background:
		"radial-gradient(at 50% 0%, rgba(20,20,40,0.8) 0%, rgba(10,10,20,0.9) 70%, rgba(0,0,0,1) 100%)",
	position: "fixed",
	top: 0,
	left: 0,
	zIndex: 99,
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
	width: "100%",
	maxWidth: 760,
	padding: theme.spacing(6),
	display: "flex",
	justifyContent: "center",
	[theme.breakpoints.down("sm")]: {
		padding: theme.spacing(3),
		minHeight: "100vh",
		alignItems: "center",
	},
}));

export const AuthPanel = styled(Box)(({ theme }) => ({
	width: "100%",
	maxWidth: 560,
	padding: theme.spacing(4),
	borderRadius: 12,
	background: "rgba(255,255,255,0.02)",
	border: "1px solid rgba(255,255,255,0.06)",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
	position: "relative",

	"& .MuiOutlinedInput-input:-webkit-autofill": {
		WebkitBoxShadow: "0 0 0 1000px rgba(255,255,255,0.02) inset !important",
		WebkitTextFillColor: "white !important",
	},
	"& input:-webkit-autofill, textarea:-webkit-autofill": {
		WebkitBoxShadow: "0 0 0 1000px rgba(255,255,255,0.02) inset !important",
		WebkitTextFillColor: "white !important",
	},
}));

export const PrimaryButton = styled(Button)(() => ({
	backgroundColor: "#7b68ee",
	color: "#fff",
	"&:hover": { backgroundColor: "#6a5acd" },
	textTransform: "none",
}));

export const LinkButton = styled(Button)(() => ({
	color: "#aaa",
	textTransform: "none",
}));

// Shared Text Field Styles for consistent MUI inputs
export const textFieldStyles = {
	input: { color: "white" },
	"& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
	"& .MuiOutlinedInput-root": {
		"& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
		"&:hover fieldset": { borderColor: "#7b68ee" },
		"&.Mui-focused fieldset": { borderColor: "#7b68ee" },
	},
};
