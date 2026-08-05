import { Box, Button } from "@mui/material";
import { styled } from "@mui/system";

export const BackgroundBox = styled(Box)(() => ({
	width: "100vw",
	minHeight: "100vh",
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	textAlign: "center",
	color: "white",
	background: "#020205",
	backgroundImage:
		"radial-gradient(circle at 50% 20%, #080816 0%, #030308 60%, #000000 100%)",
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
	zIndex: 1,
	[theme.breakpoints.down("sm")]: {
		padding: theme.spacing(3),
		minHeight: "100vh",
		alignItems: "center",
	},
}));

export const AuthPanel = styled(Box)(({ theme }) => ({
	width: "100%",
	maxWidth: 480,
	padding: theme.spacing(5),
	background: "rgba(16, 16, 32, 0.5)",
	border: "1px solid rgba(123, 104, 238, 0.35)",
	borderRadius: 20,
	boxShadow:
		"0 0 40px rgba(123, 104, 238, 0.18), inset 0 0 20px rgba(123, 104, 238, 0.06)",
	backdropFilter: "blur(25px)",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(3),
	position: "relative",

	"& .MuiOutlinedInput-input:-webkit-autofill": {
		WebkitBoxShadow: "0 0 0 1000px rgba(16, 16, 32, 0.5) inset !important",
		WebkitTextFillColor: "white !important",
	},
	"& input:-webkit-autofill, textarea:-webkit-autofill": {
		WebkitBoxShadow: "0 0 0 1000px rgba(16, 16, 32, 0.5) inset !important",
		WebkitTextFillColor: "white !important",
	},
}));

export const PrimaryButton = styled(Button)(() => ({
	backgroundColor: "#7b68ee",
	color: "#fff",
	padding: "12px",
	borderRadius: "10px",
	fontWeight: "bold",
	textTransform: "none",
	boxShadow: "0 0 20px rgba(123, 104, 238, 0.4)",
	"&:hover": {
		backgroundColor: "#6a5acd",
		boxShadow: "0 0 25px rgba(123, 104, 238, 0.6)",
	},
}));

export const SecondaryButton = styled(Button)(() => ({
	backgroundColor: "rgba(255, 255, 255, 0.05)",
	color: "white",
	border: "1px solid rgba(255, 255, 255, 0.1)",
	padding: "10px 20px",
	borderRadius: "8px",
	fontWeight: 600,
	textTransform: "none",
	"&:hover": {
		backgroundColor: "rgba(255, 255, 255, 0.1)",
	},
}));

export const LinkButton = styled(Button)(() => ({
	color: "#7B68EE",
	textTransform: "none",
	fontWeight: 600,
	"&:hover": {
		backgroundColor: "rgba(123, 104, 238, 0.1)",
	},
}));

export const textFieldStyles = {
	"& .MuiOutlinedInput-root": {
		bgcolor: "rgba(0, 0, 0, 0.4)",
		color: "white",
		borderRadius: "10px",
		"& fieldset": { borderColor: "rgba(123, 104, 238, 0.25)" },
		"&:hover fieldset": { borderColor: "rgba(123, 104, 238, 0.6)" },
		"&.Mui-focused fieldset": {
			borderColor: "#7B68EE",
			boxShadow: "0 0 10px rgba(123, 104, 238, 0.4)",
		},
	},
	"& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.6)" },
	"& .MuiInputLabel-root.Mui-focused": { color: "#7B68EE" },
};
