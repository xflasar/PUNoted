import { Box, Button } from "@mui/material";
import { keyframes, styled } from "@mui/system";

export const glowPulse = keyframes`
  0% { box-shadow: 0 0 40px rgba(123, 104, 238, 0.12); }
  50% { box-shadow: 0 0 60px rgba(123, 104, 238, 0.22); }
  100% { box-shadow: 0 0 40px rgba(123, 104, 238, 0.12); }
`;

export const BackgroundBox = styled(Box)(() => ({
	width: "100%",
	maxWidth: "100vw",
	height: "100vh",
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	color: "white",
	background: "#020205",
	backgroundImage:
		"radial-gradient(circle at 50% 20%, #080816 0%, #030308 60%, #000000 100%)",
	position: "relative",
	boxSizing: "border-box",
	overflow: "hidden",
}));

export const TimelineContainer = styled(Box)(({ theme }) => ({
	position: "relative",
	paddingLeft: theme.spacing(4.5),
	borderLeft: "2px solid rgba(123, 104, 238, 0.15)",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(4),
	marginTop: theme.spacing(3),
	marginBottom: theme.spacing(3),
	textAlign: "left",
}));

export const TimelineItem = styled(Box)(() => ({
	position: "relative",
}));

export const TimelineNode = styled(Box)(() => ({
	position: "absolute",
	left: "calc(-36px - 7px)",
	top: 4,
	width: 12,
	height: 12,
	borderRadius: "50%",
	backgroundColor: "#7b68ee",
	border: "3px solid #06060e",
	boxShadow: "0 0 10px #7b68ee",
}));

export const TimelineBadge = styled(Box)(({ theme }) => ({
	display: "inline-block",
	padding: theme.spacing(0.3, 1.2),
	borderRadius: theme.spacing(1),
	backgroundColor: "rgba(255, 255, 255, 0.04)",
	border: "1px solid rgba(255, 255, 255, 0.08)",
	color: "rgba(255, 255, 255, 0.5)",
	fontSize: "0.7rem",
	marginBottom: theme.spacing(1),
	fontFamily: "monospace",
}));

export const ConsoleWrapper = styled(Box)(({ theme }) => ({
	background: "#06060e",
	border: "1px solid rgba(123, 104, 238, 0.25)",
	borderRadius: theme.spacing(3),
	boxShadow: "0 0 50px rgba(123, 104, 238, 0.15)",
	maxWidth: 680,
	width: "92%",
	maxHeight: "94vh",
	overflowY: "auto",
	overflowX: "hidden",
	boxSizing: "border-box",
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	margin: "auto",
	animation: `${glowPulse} 6s infinite ease-in-out`,
	position: "relative",
	WebkitOverflowScrolling: "touch",
	"&::-webkit-scrollbar": { width: "4px" },
	"&::-webkit-scrollbar-thumb": {
		backgroundColor: "rgba(123,104,238,0.3)",
		borderRadius: "4px",
	},
	[theme.breakpoints.down("sm")]: {
		width: "calc(100% - 16px)",
		maxHeight: "96vh",
		borderRadius: theme.spacing(2),
	},
}));

export const DownloadGrid = styled(Box)(({ theme }) => ({
	width: "100%",
	display: "grid",
	gridTemplateColumns: "1fr 1fr",
	gap: theme.spacing(2),
	marginBottom: theme.spacing(3),
	[theme.breakpoints.down("sm")]: {
		gridTemplateColumns: "1fr",
		gap: theme.spacing(1.5),
	},
}));

export const ExtensionButton = styled(Button)(({ theme }) => ({
	backgroundColor: "rgba(255, 255, 255, 0.02)",
	border: "1px solid rgba(255, 255, 255, 0.06)",
	borderRadius: theme.spacing(2),
	padding: theme.spacing(1.5, 2),
	color: "white",
	textTransform: "none",
	display: "flex",
	justifyContent: "flex-start",
	alignItems: "center",
	gap: theme.spacing(2),
	transition: "all 0.25s ease-in-out",
	"&:hover": {
		backgroundColor: "rgba(123, 104, 238, 0.08)",
		borderColor: "rgba(123, 104, 238, 0.35)",
		transform: "translateY(-2px)",
		boxShadow: "0 4px 15px rgba(123, 104, 238, 0.1)",
	},
}));

export const NavButton = styled(Button)(({ theme }) => ({
	padding: theme.spacing(1.5, 3),
	borderRadius: theme.spacing(2),
	fontWeight: "bold",
	fontSize: "0.85rem",
	letterSpacing: "0.08em",
	textTransform: "uppercase",
	transition: "all 0.2s",
	flex: 1,
	minWidth: 120,
}));
