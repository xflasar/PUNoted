import React from "react";
import { Box, Button, Link, Typography } from "@mui/material";
import {
	FaArrowRight,
	FaChartLine,
	FaChrome,
	FaFirefoxBrowser,
	FaHistory,
	FaMap,
	FaSignOutAlt,
	FaStore,
	FaUsers,
} from "react-icons/fa";
import { DownloadGrid, ExtensionButton, NavButton } from "../styles";
import { FeatureCarousel } from "./featurecarousel";
import { useNavigate } from "react-router-dom";

interface LandingPageHeaderProps {
	isLoggedIn: boolean;
	loggedInUsername?: string | null;
	handleLogout: () => void;
	handleAuthButton: (type: "cosm" | "account" | "dashboard") => void;
	handleExtensionClick: (url: string) => void;
	handleOpenChangelog: () => void;
	apiStatus: "online" | "offline" | "maintenance";
}

export const LandingPageHeader: React.FC<LandingPageHeaderProps> = ({
	isLoggedIn,
	loggedInUsername,
	handleLogout,
	handleAuthButton,
	handleExtensionClick,
	handleOpenChangelog,
	apiStatus,
}) => {
	const navigate = useNavigate();
	return (
		<Box sx={{ width: "100%" }}>
			<Box
				sx={{
					position: "sticky",
					top: 0,
					zIndex: 50,
					width: "100%",
					bgcolor: "#06060e",
					boxSizing: "border-box",
					pt: { xs: 1.5, sm: 2 },
					pb: { xs: 1.25, sm: 1.75 },
					px: { xs: 2, sm: 3.5 },
					borderBottom: "1px solid rgba(123, 104, 238, 0.2)",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				{/* Top Header Row */}
				<Box
					sx={{
						width: "100%",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 0.75,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							fontFamily: "monospace",
							letterSpacing: "0.1em",
							fontSize: "0.7rem",
							fontWeight: 700,
						}}
					>
						SYS.
						<Typography
							variant="caption"
							sx={{
								fontFamily: "monospace",
								letterSpacing: "0.1em",
								fontSize: "0.7rem",
								fontWeight: 700,
								color: apiStatus === "online" ? "#4ade80" : "#f87171",
							}}
						>
							{apiStatus.toUpperCase()}
						</Typography>
					</Typography>
					<Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
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

				{/* Brand Name - Space Grade Title */}
				<Typography
					variant="h1"
					sx={{
						fontSize: { xs: "2.25rem", sm: "3.5rem", md: "4rem" },
						fontWeight: 900,
						letterSpacing: "0.12em",
						textAlign: "center",
						background: "linear-gradient(90deg, #60a5fa, #7b68ee, #c084fc)",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
						textShadow: "0 0 30px rgba(123,104,238,0.25)",
						lineHeight: 1,
					}}
				>
					PUNOTED
				</Typography>
			</Box>

			{/* Scrollable Main Content Container */}
			<Box
				sx={{
					width: "100%",
					px: { xs: 2, sm: 3.5 },
					pt: 2.5,
					pb: 3.5,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					boxSizing: "border-box",
				}}
			>
				{/* Application Subtext */}
				<Typography
					variant="body2"
					sx={{
						color: "rgba(255, 255, 255, 0.65)",
						mb: 3,
						textAlign: "center",
						maxWidth: 520,
						fontSize: { xs: "0.82rem", sm: "0.88rem" },
						lineHeight: 1.55,
						px: 1,
					}}
				>
					PUNoted is built from scratch to support <b>COSM Corporation</b>{" "}
					operations. Securely synchronize in-game APEX data to monitor market
					exchanges, sector navigation, production burn rates, and financial
					ledgers.
				</Typography>

				{/* 1. PRIMARY NAVIGATION BUTTONS FIRST */}
				<Box
					sx={{
						width: "100%",
						display: "flex",
						flexDirection: { xs: "column", sm: "row" },
						justifyContent: "center",
						gap: 1.5,
						mb: 3.5,
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
							width: { xs: "100%", sm: "auto" },
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
							width: { xs: "100%", sm: "auto" },
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
							width: { xs: "100%", sm: "auto" },
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
								width: { xs: "100%", sm: "auto" },
							}}
						>
							<FaChartLine style={{ marginRight: "0.5rem" }} /> Dashboard
						</NavButton>
					)}
				</Box>

				{/* 2. HORIZONTALLY SCROLLABLE & SWIPABLE FEATURE CAROUSEL */}
				<FeatureCarousel />

				{/* 3. BROWSER EXTENSION DOWNLOADS AT BOTTOM (ABOVE CHANGELOG) */}
				<Box sx={{ width: "100%", mb: 3 }}>
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255,255,255,0.4)",
							fontSize: "0.64rem",
							fontWeight: 800,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							mb: 1.25,
							display: "block",
							textAlign: "center",
						}}
					>
						DATA FORWARDER EXTENSION DOWNLOADS
					</Typography>
					<DownloadGrid>
						<ExtensionButton
							onClick={() =>
								handleExtensionClick(
									"https://addons.mozilla.org/en-US/firefox/addon/punoted-data-forwarder/",
								)
							}
						>
							<FaFirefoxBrowser color="#ff7139" size={24} />
							<Box sx={{ textAlign: "left" }}>
								<Typography
									variant="caption"
									sx={{
										display: "block",
										color: "rgba(255,255,255,0.4)",
										fontSize: "0.56rem",
										letterSpacing: "0.05em",
										textTransform: "uppercase",
									}}
								>
									Firefox Add-on
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontWeight: "bold",
										color: "white",
										fontSize: "0.82rem",
									}}
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
							<FaChrome color="#4285f4" size={24} />
							<Box sx={{ textAlign: "left" }}>
								<Typography
									variant="caption"
									sx={{
										display: "block",
										color: "rgba(255,255,255,0.4)",
										fontSize: "0.56rem",
										letterSpacing: "0.05em",
										textTransform: "uppercase",
									}}
								>
									Chrome Store
								</Typography>
								<Typography
									variant="body2"
									sx={{
										fontWeight: "bold",
										color: "white",
										fontSize: "0.82rem",
									}}
								>
									Forward Data
								</Typography>
							</Box>
						</ExtensionButton>
					</DownloadGrid>
				</Box>

				{/* Footer Options - Changelog */}
				<Box
					sx={{
						width: "100%",
						borderTop: "1px solid rgba(255,255,255,0.05)",
						pt: 2.5,
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
					sx={{ mt: 2, color: "rgba(255,255,255,0.3)", textAlign: "center" }}
				>
					Developed by <b>Martin Flasar (xsupefly)</b> with contributions from{" "}
					<b>lumivient</b> and <b>raylu</b>.
				</Typography>

				<Link
					component="button"
					variant="caption"
					color="inherit"
					onClick={() => navigate("/privacy")}
					sx={{
						mt: 1.5,
						opacity: 0.4,
						"&:hover": { opacity: 0.8, textDecoration: "underline" },
					}}
				>
					Privacy Policy
				</Link>
			</Box>
		</Box>
	);
};
