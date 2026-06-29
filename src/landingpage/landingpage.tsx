import React, { useState, useEffect } from "react";
import {
	Button,
	Typography,
	Box,
	Link,
	useMediaQuery,
	Snackbar,
	Alert,
	Tooltip,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from "@mui/material";
import { styled, useTheme } from "@mui/system";
import { useNavigate } from "react-router-dom";
import {
	FaArrowRight,
	FaUsers,
	FaChartLine,
	FaChrome,
	FaFirefoxBrowser,
	FaDiscord,
	FaMap,
	FaStore,
} from "react-icons/fa";
import AuthenticationBox from "./auth/authenticationbox";
import DiscordWidget from "./discordwidget.tsx";

interface LandingPageProps {
	onLoginSuccess: () => void;
	onLogout: () => void;
	isLoggedIn: boolean;
}

const BackgroundBox = styled(Box)(({ theme }) => ({
	width: "100vw",
	minHeight: "100vh",
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	textAlign: "center",
	color: theme.palette.common.white,
	background:
		"radial-gradient(at 50% 0%, rgba(20, 20, 40, 0.8) 0%, rgba(10, 10, 20, 0.9) 70%, rgba(0, 0, 0, 1) 100%)",
	position: "fixed",
	top: 0,
	left: 0,
	zIndex: 99,
	animation: "none",
	backgroundSize: "100% 100%",
}));

const ContentContainer = styled(Box)(({ theme }) => ({
	background: "transparent",
	padding: theme.spacing(6),
	borderRadius: 0,
	boxShadow: "none",
	backdropFilter: "none",
	WebkitBackdropFilter: "none",
	border: "none",
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	zIndex: 2,
	maxWidth: 600,
	[theme.breakpoints.down("sm")]: {
		padding: theme.spacing(3),
		maxWidth: "100%",
		width: "100%",
		minHeight: "100vh",
		justifyContent: "center",
		paddingTop: theme.spacing(8),
		paddingBottom: theme.spacing(8),
	},
}));

const ActionButton = styled(Button)(({ theme }) => ({
	px: 4,
	py: 1.5,
	borderRadius: 9999,
	fontWeight: "bold",
	letterSpacing: "0.05em",
	[theme.breakpoints.down("sm")]: {
		width: "100%",
	},
	"&:hover": {
		transform: "scale(1.05)",
		transition: "transform 0.2s ease-in-out",
	},
}));

const LandingPage: React.FC<LandingPageProps> = ({
	onLoginSuccess,
	onLogout,
	isLoggedIn,
}) => {
	const navigate = useNavigate();
	const [showAuth, setShowAuth] = useState(false);
	const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);

	const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
	const [targetExtensionUrl, setTargetExtensionUrl] = useState("");
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "success",
	});
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const [discordAnchor, setDiscordAnchor] = useState<HTMLElement | null>(null);

	useEffect(() => {
		if (isLoggedIn) {
			setLoggedInUsername(localStorage.getItem("username"));
		} else {
			setLoggedInUsername(null);
		}
	}, [isLoggedIn]);

	const handleAuthButton = (type: "cosm" | "account" | "dashboard") => {
		if (type === "cosm") {
			navigate("/cosm");
		} else if (type === "account") {
			setShowAuth(true);
		} else if (type === "dashboard") {
			navigate("/dashboard/galaxy-map");
		}
	};

	const handleMapButton = () => {
		navigate("/galaxy-map");
	};

	const handleCXButton = () => {
		navigate("/cx");
	};

	const handleLogout = () => {
		localStorage.clear();
		onLogout();
		setSnackbar({
			open: true,
			message: "Logged out successfully!",
			severity: "success",
		});
	};

	const handleCloseSnackbar = () => {
		setSnackbar({ ...snackbar, open: false });
	};

	const handleExtensionClick = (url: string) => {
		setTargetExtensionUrl(url);
		setShowInstructionsDialog(true);
	};

	const handleProceedToExtension = () => {
		//setShowInstructionsDialog(false);
		if (targetExtensionUrl) {
			window.open(targetExtensionUrl, "_blank");
			setTargetExtensionUrl("");
		}
	};

	if (showAuth) {
		return (
			<AuthenticationBox
				onLoginSuccess={onLoginSuccess}
				onBackToLanding={() => setShowAuth(false)}
			/>
		);
	}

	return (
		<BackgroundBox>
			<ContentContainer>
				<Typography
					variant={isMobile ? "h4" : "h2"}
					component="h1"
					gutterBottom
					sx={{
						mb: 1.5,
						fontWeight: "bold",
						letterSpacing: "0.05em",
						lineHeight: 1.1,
						background: "linear-gradient(90deg, #5D80F7, #7B68EE)",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
						backgroundClip: "text",
						textFillColor: "transparent",
						[theme.breakpoints.down("sm")]: {
							fontSize: "2rem",
							mt: 0,
							textAlign: "center",
						},
					}}
				>
					PUNOTED
				</Typography>

				{isLoggedIn && loggedInUsername && (
					<Typography
						variant={isMobile ? "subtitle2" : "h6"}
						sx={{
							color: "#90ee90",
							mb: 2,
							letterSpacing: "0.03em",
							fontWeight: "medium",
						}}
					>
						Logged in as {loggedInUsername}
					</Typography>
				)}

				<Typography
					variant={isMobile ? "body1" : "h6"}
					sx={{
						color: "#aaa",
						lineHeight: 1.6,
						mb: 4,
						maxWidth: 600,
						[theme.breakpoints.down("sm")]: {
							maxWidth: "90%",
							fontSize: "0.9rem",
							textAlign: "center",
						},
					}}
				>
					PUNoted is a Website app for exploring PU data extracted from players
					with their permission and for COSM Corporation.
				</Typography>

				<Box
					sx={{
						display: "flex",
						flexDirection: isMobile ? "column" : "row",
						gap: isMobile ? 2 : 3,
						mb: 4,
						alignItems: "center",
						justifyContent: "center",
						width: "100%",
						maxWidth: "900px",
						flexWrap: "wrap",
					}}
				>
					<ActionButton
						variant="contained"
						onClick={() => handleAuthButton("cosm")}
						sx={{
							bgcolor: "#7b68ee",
							boxShadow: "0 4px 15px rgba(123, 104, 238, 0.4)",
							"&:hover": {
								bgcolor: "#6a5acd",
								boxShadow: "0 6px 20px rgba(123, 104, 238, 0.6)",
							},
						}}
					>
						<FaArrowRight style={{ marginRight: "0.75rem" }} /> COSM
					</ActionButton>

					<ActionButton
						variant="outlined"
						onClick={() => handleCXButton()}
						sx={{
							color: "#a0a0a0",
							borderColor: "#555",
							"&:hover": {
								backgroundColor: "rgba(255,255,255,0.1)",
								color: "white",
								borderColor: "#7b68ee",
							},
						}}
					>
						<FaStore style={{ marginRight: "0.75rem" }} /> CX
					</ActionButton>
				</Box>

				<Box
					sx={{
						display: "flex",
						flexDirection: isMobile ? "column" : "row",
						gap: isMobile ? 2 : 3,
						mb: 4,
						alignItems: "center",
						justifyContent: "center",
						width: "100%",
						maxWidth: "600px",
						flexWrap: "wrap",
					}}
				>
					{isLoggedIn ? (
						<>
							<ActionButton
								variant="outlined"
								onClick={() => handleAuthButton("dashboard")}
								sx={{
									color: "#a0a0a0",
									borderColor: "#555",
									"&:hover": {
										backgroundColor: "rgba(255,255,255,0.1)",
										color: "white",
										borderColor: "#7b68ee",
									},
								}}
							>
								<FaChartLine style={{ marginRight: "0.75rem" }} /> DASHBOARD
							</ActionButton>
							<ActionButton
								variant="outlined"
								onClick={handleLogout}
								sx={{
									color: "#a0a0a0",
									borderColor: "#555",
									"&:hover": {
										backgroundColor: "rgba(255,255,255,0.1)",
										color: "white",
										borderColor: "#7b68ee",
									},
								}}
							>
								<FaUsers style={{ marginRight: "0.75rem" }} /> LOGOUT
							</ActionButton>
						</>
					) : (
						<ActionButton
							variant="outlined"
							onClick={() => handleAuthButton("account")}
							sx={{
								color: "#a0a0a0",
								borderColor: "#555",
								"&:hover": {
									backgroundColor: "rgba(255,255,255,0.1)",
									color: "white",
									borderColor: "#7b68ee",
								},
							}}
						>
							<FaUsers style={{ marginRight: "0.75rem" }} /> ACCOUNT
						</ActionButton>
					)}
				</Box>

				<Box
					sx={{
						display: "flex",
						flexDirection: isMobile ? "column" : "row",
						gap: isMobile ? 2 : 3,
						mb: 4,
						alignItems: "center",
						justifyContent: "center",
						width: "100%",
						maxWidth: "200px",
						flexWrap: "wrap",
					}}
				>
					<ActionButton
						variant="outlined"
						onClick={() => handleMapButton()}
						sx={{
							color: "#a0a0a0",
							borderColor: "#555",
							"&:hover": {
								backgroundColor: "rgba(255,255,255,0.1)",
								color: "white",
								borderColor: "#7b68ee",
							},
						}}
						fullWidth
					>
						<FaMap style={{ marginRight: "0.75rem" }} /> MAP
					</ActionButton>
				</Box>

				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						mt: 4,
						gap: 2,
					}}
				>
					<Typography
						variant="subtitle2"
						sx={{ fontWeight: "bold", color: theme.palette.text.secondary }}
					>
						Get the extension and join us
					</Typography>
					<Box display="flex" justifyContent="center" gap={theme.spacing(2)}>
						<Tooltip title="Get our Firefox Extension" placement="bottom">
							<IconButton
								onClick={() =>
									handleExtensionClick(
										"https://addons.mozilla.org/en-US/firefox/addon/punoted-data-forwarder/",
									)
								}
								sx={{ color: "#ff7139", "&:hover": { color: "#ff7139d0" } }}
							>
								<FaFirefoxBrowser size={28} />
							</IconButton>
						</Tooltip>
						<Tooltip title="Get our Chrome Extension" placement="bottom">
							<IconButton
								onClick={() =>
									handleExtensionClick(
										"https://chromewebstore.google.com/detail/ihaegkcnjjhofhplcjlcbbkeekbllfcc?utm_source=item-share-cb",
									)
								}
								sx={{ color: "#4285f4", "&:hover": { color: "#4285f4d0" } }}
							>
								<FaChrome size={28} />
							</IconButton>
						</Tooltip>
						<Tooltip title="Join our Discord" placement="bottom">
							<IconButton
								onClick={(e) => setDiscordAnchor(e.currentTarget)}
								sx={{ color: "#7b68ee", "&:hover": { color: "#7b68eed0" } }}
								aria-haspopup="true"
								aria-expanded={!!discordAnchor}
							>
								<FaDiscord size={28} />
							</IconButton>
						</Tooltip>

						<DiscordWidget
							serverId="1420401384141881388"
							anchorEl={discordAnchor}
							open={!!discordAnchor}
							onClose={() => setDiscordAnchor(null)}
						/>
					</Box>
				</Box>

				<Link
					component="button"
					variant="body2"
					color="inherit"
					onClick={() => navigate("/privacy")}
					sx={{
						mt: 2,
						opacity: 0.8,
						"&:hover": {
							opacity: 1,
							textDecoration: "underline",
						},
						[theme.breakpoints.down("sm")]: {
							fontSize: "0.8rem",
						},
					}}
				>
					Privacy Policy
				</Link>
			</ContentContainer>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity={snackbar.severity as any}
					sx={{ width: "100%" }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>

			<Dialog
				open={showInstructionsDialog}
				onClose={() => setShowInstructionsDialog(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle
					sx={{
						background: theme.palette.background.paper,
						color: theme.palette.common.white,
						textAlign: "center",
					}}
				>
					<Typography gutterBottom color="red" sx={{ fontSize: "2.5rem" }}>
						Extension Setup Instructions
					</Typography>
				</DialogTitle>
				<DialogContent
					dividers
					sx={{
						background: theme.palette.background.paper,
						color: theme.palette.common.white,
					}}
				>
					<Typography gutterBottom variant="h5" sx={{ textAlign: "center" }}>
						⚠️ Please Read Before Installing!
					</Typography>
					<Typography gutterBottom>
						To ensure the <b>PUNoted Data Forwarder</b> extension works and
						securely captures your data, you must follow these steps:
					</Typography>
					<Box component="ul" sx={{ pl: 2, mt: 1, listStyleType: "decimal" }}>
						<li>Add Extension to your browser.</li>
						<li>
							<b>Register to PUNoted (If already have account skip this!):</b>{" "}
							Register on this website (PUNoted) via account button.
						</li>
						<li>
							<b>
								Open PUNoted Data Forwarder extension (From extension list - Top
								browser bar) and login with your account details (PUNoted
								account).
							</b>
						</li>
						<li>
							After successful login proceed to <b>refresh (F5) page</b> --{" "}
							<b>
								YOU MUST BE ON A GAME TAB PAGE (The page where you can play the
								game!)
							</b>
							.
						</li>
						<li>
							<b>Keep Tab Open:</b> Keep the game tab open for the extension to
							continuously capture and forward data{" "}
							<b>(Having the browser & tab in background works too!)</b>.
						</li>
					</Box>
					<Typography
						variant="body2"
						sx={{
							mt: 0.5,
							color: theme.palette.warning.main,
							fontWeight: "medium",
						}}
					>
						Note: Firefox might need extra setup - After adding extension right
						click the extension and select (Click) "Always Allow on
						apex.prosperousuniverse.com".
					</Typography>
					<Typography
						variant="body2"
						sx={{ mt: 2, color: "text.secondary", fontStyle: "italic" }}
					>
						Click "Proceed to Store" only after you understand these steps.
					</Typography>
				</DialogContent>
				<DialogActions
					sx={{
						background: theme.palette.background.paper,
						color: theme.palette.common.white,
					}}
				>
					<Button onClick={() => setShowInstructionsDialog(false)}>
						Cancel / Go Back
					</Button>
					<Button
						onClick={handleProceedToExtension}
						color="primary"
						variant="contained"
					>
						Proceed to Store
					</Button>
				</DialogActions>
			</Dialog>
		</BackgroundBox>
	);
};

export default LandingPage;
