import { Box, Button } from "@mui/material";
import { styled, keyframes, alpha } from "@mui/system";

export const glowPulse = (theme: any) => keyframes`
  0% { box-shadow: 0 0 40px ${alpha(theme.palette.primary.main, 0.12)}; }
  50% { box-shadow: 0 0 60px ${alpha(theme.palette.primary.main, 0.22)}; }
  100% { box-shadow: 0 0 40px ${alpha(theme.palette.primary.main, 0.12)}; }
`;

export const BackgroundBox = styled(Box)(({ theme }) => ({
	width: "100%",
	maxWidth: "100vw",
	height: "100vh",
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	color: theme.palette.text.primary,
	background: theme.palette.background.default,
	backgroundImage: `radial-gradient(circle at 50% 20%, ${alpha(
		theme.palette.primary.dark || "#080816",
		0.4,
	)} 0%, #030308 60%, #000000 100%)`,
	position: "relative",
	boxSizing: "border-box",
	overflow: "hidden",
}));

export const ConsoleWrapper = styled(Box)(({ theme }) => ({
	background: theme.palette.background.paper,
	backdropFilter: "blur(15px)",
	border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
	borderRadius: theme.spacing(3),
	boxShadow: `0 0 50px ${alpha(theme.palette.primary.main, 0.15)}`,
	maxWidth: 860,
	width: "92%",
	maxHeight: "94vh",
	overflowY: "auto",
	overflowX: "hidden",
	boxSizing: "border-box",
	display: "flex",
	flexDirection: "column",
	alignItems: "stretch",
	margin: "auto",
	animation: `${glowPulse(theme)} 6s infinite ease-in-out`,
	position: "relative",
	padding: theme.spacing(3.5),
	WebkitOverflowScrolling: "touch",
	"&::-webkit-scrollbar": { width: "4px" },
	"&::-webkit-scrollbar-thumb": {
		backgroundColor: alpha(theme.palette.primary.main, 0.3),
		borderRadius: "4px",
	},
	[theme.breakpoints.down("sm")]: {
		width: "calc(100% - 16px)",
		maxHeight: "96vh",
		borderRadius: theme.spacing(2),
		padding: theme.spacing(2),
	},
}));

export const SectionCard = styled(Box)(({ theme }) => ({
	backgroundColor: alpha(theme.palette.background.default, 0.6),
	border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
	borderRadius: theme.spacing(2),
	padding: theme.spacing(2.5),
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
	transition: "all 0.2s ease-in-out",
	"&:hover": {
		borderColor: alpha(theme.palette.primary.main, 0.35),
	},
	[theme.breakpoints.down("sm")]: {
		padding: theme.spacing(2),
	},
}));

export const Badge = styled(Box)(({ theme }) => ({
	display: "inline-block",
	padding: theme.spacing(0.3, 1.2),
	borderRadius: theme.spacing(1),
	backgroundColor: alpha(theme.palette.common.white, 0.04),
	border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
	color: theme.palette.text.secondary,
	fontSize: "0.7rem",
	fontFamily: "monospace",
	letterSpacing: "0.05em",
}));

export const BackButton = styled(Button)(({ theme }) => ({
	backgroundColor: alpha(theme.palette.common.white, 0.02),
	border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
	borderRadius: theme.spacing(1.5),
	padding: theme.spacing(0.7, 2),
	color: theme.palette.text.secondary,
	textTransform: "none",
	fontWeight: 600,
	fontSize: "0.8rem",
	transition: "all 0.2s ease-in-out",
	"&:hover": {
		backgroundColor: alpha(theme.palette.primary.main, 0.1),
		borderColor: alpha(theme.palette.primary.main, 0.4),
		color: theme.palette.text.primary,
	},
}));
