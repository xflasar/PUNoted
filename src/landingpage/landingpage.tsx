import React, { useState } from "react";
import {
	Button,
	Typography,
	Box,
	Link,
	Snackbar,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	LinearProgress,
} from "@mui/material";
import { styled, useTheme, keyframes } from "@mui/system";
import { useNavigate } from "react-router-dom";
import {
	FaArrowRight,
	FaUsers,
	FaChartLine,
	FaChrome,
	FaFirefoxBrowser,
	FaMap,
	FaStore,
	FaHistory,
	FaSignOutAlt,
} from "react-icons/fa";
import AuthenticationBox from "./auth/authenticationbox";

interface GitCommit {
	hash: string;
	message: string;
	date: string;
	author: string;
	type: "frontend" | "backend";
}

interface GroupedCommits {
	dateStr: string;
	relativeStr: string;
	items: GitCommit[];
}

interface LandingPageProps {
	onLoginSuccess: () => void;
	onLogout: () => void;
	isLoggedIn: boolean;
}

const glowPulse = keyframes`
  0% { box-shadow: 0 0 40px rgba(123, 104, 238, 0.12); }
  50% { box-shadow: 0 0 60px rgba(123, 104, 238, 0.22); }
  100% { box-shadow: 0 0 40px rgba(123, 104, 238, 0.12); }
`;

const BackgroundBox = styled(Box)(() => ({
	width: "100vw",
	minHeight: "100vh",
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	color: "white",
	background: "#020205",
	backgroundImage:
		"radial-gradient(circle at 50% 20%, #080816 0%, #030308 60%, #000000 100%)",
	position: "relative",
}));

const TimelineContainer = styled(Box)(({ theme }) => ({
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

const TimelineItem = styled(Box)(() => ({
	position: "relative",
}));

const TimelineNode = styled(Box)(() => ({
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

const TimelineBadge = styled(Box)(({ theme }) => ({
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

const ConsoleWrapper = styled(Box)(({ theme }) => ({
	background: "rgba(4, 4, 10, 0.85)",
	border: "1px solid rgba(123, 104, 238, 0.2)",
	borderRadius: theme.spacing(3),
	boxShadow: "0 0 50px rgba(123, 104, 238, 0.12)",
	backdropFilter: "blur(25px)",
	padding: theme.spacing(5),
	maxWidth: 680,
	width: "92%",
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	margin: theme.spacing(4, 0),
	animation: `${glowPulse} 6s infinite ease-in-out`,
	[theme.breakpoints.down("sm")]: {
		padding: theme.spacing(3),
		margin: theme.spacing(2, 0),
	},
}));

const DownloadGrid = styled(Box)(({ theme }) => ({
	width: "100%",
	display: "grid",
	gridTemplateColumns: "1fr 1fr",
	gap: theme.spacing(2),
	marginBottom: theme.spacing(4.5),
	[theme.breakpoints.down("xs")]: {
		gridTemplateColumns: "1fr",
	},
}));

const ExtensionButton = styled(Button)(({ theme }) => ({
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

const NavButton = styled(Button)(({ theme }) => ({
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

const PreviewTabButton = styled(Button)<{ active: boolean }>(({ active }) => ({
	color: active ? "white" : "rgba(255, 255, 255, 0.4)",
	fontWeight: "bold",
	fontSize: "0.75rem",
	padding: "6px 16px",
	borderRadius: "12px",
	backgroundColor: active ? "rgba(123, 104, 238, 0.15)" : "transparent",
	border: active
		? "1px solid rgba(123, 104, 238, 0.25)"
		: "1px solid transparent",
	textTransform: "none",
	transition: "all 0.2s",
	"&:hover": {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		color: "white",
	},
}));

const LandingPage: React.FC<LandingPageProps> = ({
	onLoginSuccess,
	onLogout,
	isLoggedIn,
}) => {
	const navigate = useNavigate();
	const [showAuth, setShowAuth] = useState(false);
	const loggedInUsername = isLoggedIn ? localStorage.getItem("username") : null;
	const [activePreview, setActivePreview] = useState<"map" | "cx" | "corp">(
		"map",
	);
	const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
	const [targetExtensionUrl, setTargetExtensionUrl] = useState("");
	const [showChangelog, setShowChangelog] = useState(false);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "success",
	});
	const theme = useTheme();

	const [changelog, setChangelog] = useState<GitCommit[]>([]);
	const [loadingChangelog, setLoadingChangelog] = useState(false);

	const fetchCommits = async (repo: string, type: "frontend" | "backend") => {
		try {
			const res = await fetch(
				`https://api.github.com/repos/xflasar/${repo}/commits?sha=main`,
			);
			if (!res.ok) return [];
			const data = await res.json();
			if (!Array.isArray(data)) return [];
			return data.map((item: any) => ({
				hash: item.sha.substring(0, 7),
				message: item.commit.message.split("\n")[0],
				date: item.commit.author.date,
				author: item.commit.author.name,
				type,
			}));
		} catch (e) {
			console.error(`Failed to fetch commits for ${repo}:`, e);
			return [];
		}
	};

	const handleOpenChangelog = async () => {
		setShowChangelog(true);
		setLoadingChangelog(true);
		try {
			const [feCommits, beCommits] = await Promise.all([
				fetchCommits("PUNoted", "frontend"),
				fetchCommits("PUNoted-API", "backend"),
			]);
			const combined = [...feCommits, ...beCommits];
			combined.sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			);
			setChangelog(combined.slice(0, 100));
		} catch (error) {
			console.error("Failed to fetch changelog:", error);
		} finally {
			setLoadingChangelog(false);
		}
	};

	const groupCommitsByDay = (commitsList: GitCommit[]): GroupedCommits[] => {
		const groups: { [key: string]: GroupedCommits } = {};

		commitsList.forEach((commit) => {
			const d = new Date(commit.date);
			const dateKey = d.toDateString();

			if (!groups[dateKey]) {
				const dateStr = d.toLocaleDateString(undefined, {
					month: "long",
					day: "numeric",
					year: "numeric",
				});

				const diffTime = Math.abs(new Date().getTime() - d.getTime());
				const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
				let relativeStr = `${diffDays} days ago`;
				if (diffDays === 0) relativeStr = "Today";
				else if (diffDays === 1) relativeStr = "Yesterday";
				else if (diffDays > 30) {
					const months = Math.floor(diffDays / 30);
					relativeStr = `${months} month${months > 1 ? "s" : ""} ago`;
				}

				groups[dateKey] = {
					dateStr,
					relativeStr,
					items: [],
				};
			}

			groups[dateKey].items.push(commit);
		});

		return Object.values(groups);
	};

	const handleAuthButton = (type: "cosm" | "account" | "dashboard") => {
		if (type === "cosm") {
			navigate("/cosm");
		} else if (type === "account") {
			setShowAuth(true);
		} else if (type === "dashboard") {
			navigate("/dashboard/galaxy-map");
		}
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

	const handleExtensionClick = (url: string) => {
		setTargetExtensionUrl(url);
		setShowInstructionsDialog(true);
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
			<ConsoleWrapper>
				{/* Top Header Row */}
				<Box
					sx={{
						width: "100%",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 4,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255,255,255,0.3)",
							fontFamily: "monospace",
							letterSpacing: "0.1em",
						}}
					>
						SYS.ONLINE
					</Typography>
					<Box display="flex" gap={2} alignItems="center">
						{isLoggedIn ? (
							<>
								<Typography
									variant="caption"
									sx={{
										color: "#4ade80",
										background: "rgba(74, 222, 128, 0.08)",
										px: 1.5,
										py: 0.5,
										borderRadius: 1.5,
									}}
								>
									● {loggedInUsername}
								</Typography>
								<Button
									variant="text"
									onClick={handleLogout}
									size="small"
									startIcon={<FaSignOutAlt />}
									sx={{
										color: "#f87171",
										textTransform: "none",
										fontSize: "0.85rem",
										"&:hover": { color: "#ef4444" },
									}}
								>
									Logout
								</Button>
							</>
						) : (
							<Button
								variant="text"
								onClick={() => handleAuthButton("account")}
								size="small"
								startIcon={<FaUsers />}
								sx={{
									color: "#7b68ee",
									textTransform: "none",
									fontSize: "0.85rem",
									fontWeight: "bold",
								}}
							>
								Log In
							</Button>
						)}
					</Box>
				</Box>

				{/* Brand Name - Huge Space Grade Title */}
				<Typography
					variant="h1"
					sx={{
						fontSize: { xs: "3.5rem", sm: "5rem" },
						fontWeight: 900,
						letterSpacing: "0.15em",
						textAlign: "center",
						mb: 2.5,
						background: "linear-gradient(90deg, #60a5fa, #7b68ee, #c084fc)",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
						textShadow: "0 0 40px rgba(123,104,238,0.25)",
						lineHeight: 1,
					}}
				>
					PUNOTED
				</Typography>

				{/* Application Subtext - Built from scratch for COSM */}
				<Typography
					variant="body2"
					sx={{
						color: "rgba(255, 255, 255, 0.6)",
						mb: 4,
						textAlign: "center",
						maxWidth: 520,
						lineHeight: 1.6,
					}}
				>
					PUNoted is built from scratch to support <b>COSM Corporation</b>{" "}
					operations. It allows players to securely synchronize in-game APEX
					data to track markets, flight sectors, and production lines.
				</Typography>

				{/* Extension Download Capsules */}
				<DownloadGrid>
					<ExtensionButton
						onClick={() =>
							handleExtensionClick(
								"https://addons.mozilla.org/en-US/firefox/addon/punoted-data-forwarder/",
							)
						}
					>
						<FaFirefoxBrowser color="#ff7139" size={28} />
						<Box textAlign="left">
							<Typography
								variant="caption"
								display="block"
								sx={{
									color: "rgba(255,255,255,0.4)",
									fontSize: "0.6rem",
									letterSpacing: "0.05em",
									textTransform: "uppercase",
								}}
							>
								Firefox Add-on
							</Typography>
							<Typography
								variant="body2"
								sx={{ fontWeight: "bold", color: "white" }}
							>
								Forward Data
							</Typography>
						</Box>
					</ExtensionButton>
					<ExtensionButton
						onClick={() =>
							handleExtensionClick(
								"https://chromewebstore.google.com/detail/ihaegkcnjjhofhplcjlcbbkeekbllfcc?utm_source=item-share-cb",
							)
						}
					>
						<FaChrome color="#4285f4" size={28} />
						<Box textAlign="left">
							<Typography
								variant="caption"
								display="block"
								sx={{
									color: "rgba(255,255,255,0.4)",
									fontSize: "0.6rem",
									letterSpacing: "0.05em",
									textTransform: "uppercase",
								}}
							>
								Chrome Store
							</Typography>
							<Typography
								variant="body2"
								sx={{ fontWeight: "bold", color: "white" }}
							>
								Forward Data
							</Typography>
						</Box>
					</ExtensionButton>
				</DownloadGrid>

				{/* Interactive Feature Mockup Console */}
				<Box
					sx={{
						width: "100%",
						backgroundColor: "rgba(0,0,0,0.5)",
						border: "1px solid rgba(255,255,255,0.06)",
						borderRadius: 2.5,
						p: 3,
						mb: 4.5,
					}}
				>
					<Box
						display="flex"
						justifyContent="center"
						gap={1.5}
						mb={3}
						borderBottom="1px solid rgba(255,255,255,0.04)"
						pb={2}
					>
						<PreviewTabButton
							active={activePreview === "map"}
							onClick={() => setActivePreview("map")}
						>
							Galaxy Map
						</PreviewTabButton>
						<PreviewTabButton
							active={activePreview === "cx"}
							onClick={() => setActivePreview("cx")}
						>
							CX Pricing
						</PreviewTabButton>
						<PreviewTabButton
							active={activePreview === "corp"}
							onClick={() => setActivePreview("corp")}
						>
							COSM Corp
						</PreviewTabButton>
					</Box>

					{/* High-tech Visual Representations */}
					<Box
						sx={{
							minHeight: 120,
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
						}}
					>
						{activePreview === "map" && (
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
								}}
							>
								<Box
									component="img"
									src="/galaxy_map_preview.png"
									sx={{
										width: "100%",
										maxHeight: 220,
										borderRadius: 2,
										objectFit: "cover",
										border: "1px solid rgba(255,255,255,0.08)",
										mb: 1.5,
									}}
								/>
								<Typography
									variant="caption"
									sx={{ color: "rgba(255,255,255,0.5)", textAlign: "center" }}
								>
									Real-time interactive starmaps, jump segments, and system
									nodes.
								</Typography>
							</Box>
						)}
						{activePreview === "cx" && (
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
								}}
							>
								<Box
									component="img"
									src="/cx_pricing_preview.png"
									sx={{
										width: "100%",
										maxHeight: 220,
										borderRadius: 2,
										objectFit: "cover",
										border: "1px solid rgba(255,255,255,0.08)",
										mb: 1.5,
									}}
								/>
								<Typography
									variant="caption"
									sx={{ color: "rgba(255,255,255,0.5)", textAlign: "center" }}
								>
									Dynamic order books, candlestick trend lines, and commodity
									exchange price feeds.
								</Typography>
							</Box>
						)}
						{activePreview === "corp" && (
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
								}}
							>
								<Box
									component="img"
									src="/cosm_corp_preview.png"
									sx={{
										width: "100%",
										maxHeight: 220,
										borderRadius: 2,
										objectFit: "cover",
										border: "1px solid rgba(255,255,255,0.08)",
										mb: 1.5,
									}}
								/>
								<Typography
									variant="caption"
									sx={{ color: "rgba(255,255,255,0.5)", textAlign: "center" }}
								>
									Corporate queue telemetry, workforce reserves, and production
									logs.
								</Typography>
							</Box>
						)}
					</Box>
				</Box>

				{/* Primary Navigation Actions */}
				<Box
					sx={{
						width: "100%",
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "center",
						gap: 2,
						mb: 4.5,
					}}
				>
					<NavButton
						variant="contained"
						onClick={() => handleAuthButton("cosm")}
						sx={{
							bgcolor: "#7b68ee",
							color: "white",
							boxShadow: "0 4px 15px rgba(123, 104, 238, 0.3)",
							"&:hover": {
								bgcolor: "#6a5acd",
								boxShadow: "0 6px 20px rgba(123, 104, 238, 0.4)",
							},
							minWidth: { xs: "100%", sm: "auto" },
							flexGrow: { xs: 1, sm: 0 },
						}}
					>
						COSM Portal <FaArrowRight style={{ marginLeft: "0.5rem" }} />
					</NavButton>

					<NavButton
						variant="outlined"
						onClick={() => navigate("/cx")}
						sx={{
							color: "white",
							borderColor: "rgba(255,255,255,0.15)",
							"&:hover": {
								borderColor: "#7b68ee",
								bgcolor: "rgba(123,104,238,0.05)",
							},
							minWidth: { xs: "100%", sm: "auto" },
							flexGrow: { xs: 1, sm: 0 },
						}}
					>
						<FaStore style={{ marginRight: "0.5rem" }} /> CX Prices
					</NavButton>

					<NavButton
						variant="outlined"
						onClick={() => navigate("/galaxy-map")}
						sx={{
							color: "white",
							borderColor: "rgba(255,255,255,0.15)",
							"&:hover": {
								borderColor: "#7b68ee",
								bgcolor: "rgba(123,104,238,0.05)",
							},
							minWidth: { xs: "100%", sm: "auto" },
							flexGrow: { xs: 1, sm: 0 },
						}}
					>
						<FaMap style={{ marginRight: "0.5rem" }} /> Galaxy Map
					</NavButton>

					{isLoggedIn && (
						<NavButton
							variant="outlined"
							onClick={() => handleAuthButton("dashboard")}
							sx={{
								color: "white",
								borderColor: "rgba(255,255,255,0.15)",
								"&:hover": {
									borderColor: "#7b68ee",
									bgcolor: "rgba(123,104,238,0.05)",
								},
								minWidth: { xs: "100%", sm: "auto" },
								flexGrow: { xs: 1, sm: 0 },
							}}
						>
							<FaChartLine style={{ marginRight: "0.5rem" }} /> Dashboard
						</NavButton>
					)}
				</Box>

				{/* Footer Options - Changelog */}
				<Box
					sx={{
						width: "100%",
						borderTop: "1px solid rgba(255,255,255,0.05)",
						pt: 3.5,
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Button
						startIcon={<FaHistory />}
						size="small"
						onClick={handleOpenChangelog}
						sx={{ color: "rgba(255,255,255,0.4)", textTransform: "none" }}
					>
						Changelog
					</Button>
				</Box>

				<Typography
					variant="caption"
					sx={{ mt: 3, color: "rgba(255,255,255,0.3)", textAlign: "center" }}
				>
					Developed by Martin Flasar (xsupefly) with contributions from Rich
					Jenks and raylu.
				</Typography>

				<Link
					component="button"
					variant="caption"
					color="inherit"
					onClick={() => navigate("/privacy")}
					sx={{
						mt: 2,
						opacity: 0.4,
						"&:hover": { opacity: 0.8, textDecoration: "underline" },
					}}
				>
					Privacy Policy
				</Link>
			</ConsoleWrapper>

			{/* Notifications Snackbar */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					onClose={() => setSnackbar({ ...snackbar, open: false })}
					severity={
						snackbar.severity as "success" | "info" | "warning" | "error"
					}
					sx={{ width: "100%" }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>

			{/* Instructions Setup Dialog */}
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
					<Typography
						gutterBottom
						sx={{ fontSize: "1.75rem", fontWeight: "bold", color: "#f87171" }}
					>
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
					<Typography
						gutterBottom
						variant="subtitle1"
						sx={{ textAlign: "center", mb: 2 }}
					>
						⚠️ Please Read Before Installing!
					</Typography>
					<Typography
						gutterBottom
						variant="body2"
						sx={{ color: "rgba(255,255,255,0.8)", mb: 2 }}
					>
						To ensure the <b>PUNoted Data Forwarder</b> extension securely
						captures your in-game APEX dashboard data, you must follow these
						steps:
					</Typography>
					<Box
						component="ul"
						sx={{
							pl: 3,
							mt: 1,
							mb: 3,
							listStyleType: "decimal",
							fontSize: "0.85rem",
							color: "rgba(255,255,255,0.9)",
						}}
					>
						<Box component="li" sx={{ mb: 1 }}>
							Add the extension from your browser's store.
						</Box>
						<Box component="li" sx={{ mb: 1 }}>
							<b>Register an account:</b> Create a PUNoted account on this
							website using the "Account" button.
						</Box>
						<Box component="li" sx={{ mb: 1 }}>
							Open the <b>PUNoted Data Forwarder</b> from your browser's
							extension list and log in with your PUNoted details.
						</Box>
						<Box component="li" sx={{ mb: 1 }}>
							Navigate to your active in-game character tab on{" "}
							<b>apex.prosperousuniverse.com</b> and refresh (F5).
						</Box>
						<Box component="li" sx={{ mb: 1 }}>
							<b>Keep the tab open:</b> Keep the game tab open (even in the
							background) for the extension to continuously capture and forward
							metrics.
						</Box>
					</Box>
					<Box
						sx={{
							p: 2,
							borderRadius: 1,
							background: "rgba(245, 158, 11, 0.1)",
							border: "1px solid rgba(245, 158, 11, 0.3)",
							mb: 2,
						}}
					>
						<Typography
							variant="body2"
							sx={{
								color: "#fbbf24",
								fontWeight: "medium",
								fontSize: "0.8rem",
							}}
						>
							Note for Firefox users: You may need to right-click the extension
							icon in the toolbar and select "Always Allow on
							apex.prosperousuniverse.com".
						</Typography>
					</Box>
				</DialogContent>
				<DialogActions
					sx={{
						background: theme.palette.background.paper,
						color: theme.palette.common.white,
						px: 3,
						py: 2,
					}}
				>
					<Button
						onClick={() => setShowInstructionsDialog(false)}
						sx={{ color: "rgba(255,255,255,0.6)" }}
					>
						Cancel
					</Button>
					<Button
						onClick={() => {
							if (targetExtensionUrl) {
								window.open(targetExtensionUrl, "_blank");
								setTargetExtensionUrl("");
							}
							setShowInstructionsDialog(false);
						}}
						color="primary"
						variant="contained"
						sx={{ bgcolor: "#7b68ee", "&:hover": { bgcolor: "#6a5acd" } }}
					>
						Proceed to Store
					</Button>
				</DialogActions>
			</Dialog>

			{/* Changelog Dialog */}
			<Dialog
				open={showChangelog}
				onClose={() => setShowChangelog(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle sx={{ bgcolor: "#0f0f1b", color: "white", pb: 2 }}>
					<Typography variant="h6" sx={{ fontWeight: "bold" }}>
						System Changelog
					</Typography>
				</DialogTitle>
				<DialogContent
					dividers
					sx={{
						bgcolor: "#06060e",
						color: "rgba(255,255,255,0.85)",
						py: 3,
						maxHeight: "60vh",
						overflowY: "auto",
					}}
				>
					{loadingChangelog ? (
						<Typography
							variant="body2"
							sx={{
								color: "rgba(255,255,255,0.5)",
								textAlign: "center",
								my: 4,
							}}
						>
							Loading commits from git...
						</Typography>
					) : changelog.length === 0 ? (
						<Typography
							variant="body2"
							sx={{
								color: "rgba(255,255,255,0.5)",
								textAlign: "center",
								my: 4,
							}}
						>
							No commits found.
						</Typography>
					) : (
						<TimelineContainer>
							{groupCommitsByDay(changelog).map((group, groupIdx) => (
								<TimelineItem key={groupIdx}>
									<TimelineNode />
									<Box
										display="flex"
										justifyContent="space-between"
										alignItems="center"
										mb={1.5}
									>
										<Typography
											variant="body2"
											sx={{
												color: "white",
												fontWeight: "bold",
												fontSize: "0.9rem",
											}}
										>
											{group.dateStr}
										</Typography>
										<TimelineBadge>{group.relativeStr}</TimelineBadge>
									</Box>
									<Box
										display="flex"
										flexDirection="column"
										gap={1.5}
										sx={{ pl: 0.5 }}
									>
										{group.items.map((item, itemIdx) => (
											<Box
												key={itemIdx}
												display="flex"
												alignItems="flex-start"
												gap={1.5}
											>
												<Box
													sx={{
														px: 1,
														py: 0.2,
														borderRadius: 1,
														fontSize: "0.6rem",
														fontWeight: "bold",
														border: "1px solid",
														textTransform: "uppercase",
														lineHeight: 1,
														mt: 0.3,
														borderColor:
															item.type === "frontend"
																? "rgba(96, 165, 250, 0.4)"
																: "rgba(167, 139, 250, 0.4)",
														color:
															item.type === "frontend" ? "#60a5fa" : "#a78bfa",
														bgcolor:
															item.type === "frontend"
																? "rgba(96, 165, 250, 0.05)"
																: "rgba(167, 139, 250, 0.05)",
														minWidth: 65,
														textAlign: "center",
													}}
												>
													{item.type}
												</Box>

												<Typography
													variant="body2"
													sx={{
														color: "rgba(255,255,255,0.7)",
														fontSize: "0.8rem",
														lineHeight: 1.4,
													}}
												>
													{item.hash && (
														<Link
															href={
																item.type === "frontend"
																	? `https://github.com/xflasar/PUNoted/commit/${item.hash}`
																	: `https://github.com/xflasar/PUNoted-API/commit/${item.hash}`
															}
															target="_blank"
															sx={{
																color: "#7b68ee",
																fontFamily: "monospace",
																fontWeight: "bold",
																textDecoration: "none",
																mr: 1,
																"&:hover": { textDecoration: "underline" },
															}}
														>
															[{item.hash}]
														</Link>
													)}
													{item.message}
													<Typography
														component="span"
														variant="caption"
														sx={{
															color: "rgba(255,255,255,0.35)",
															fontSize: "0.7rem",
															fontStyle: "italic",
															display: "block",
															mt: 0.5,
														}}
													>
														— by {item.author}
													</Typography>
												</Typography>
											</Box>
										))}
									</Box>
								</TimelineItem>
							))}
						</TimelineContainer>
					)}
				</DialogContent>
				<DialogActions sx={{ bgcolor: "#0f0f1b" }}>
					<Button
						onClick={() => setShowChangelog(false)}
						variant="contained"
						sx={{ bgcolor: "#7b68ee", "&:hover": { bgcolor: "#6a5acd" } }}
					>
						Close
					</Button>
				</DialogActions>
			</Dialog>
		</BackgroundBox>
	);
};

export default LandingPage;
