import React, {
	useState,
	useCallback,
	useEffect,
	useRef,
	useMemo,
} from "react";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Divider from "@mui/material/Divider";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import HomeIcon from "@mui/icons-material/Home";
import { navCategories } from "./navitems";
import TopNavbar from "./components/common/topnavbar/topnavbar";
import WsReconnectionOverlay from "./dashboard/websocket/websocketreconnectoverlay.tsx";
import { useGlobalData } from "./context/globaldatacontext.tsx";
import { NotificationBell } from "./components/common/notifications/notificationbell";
import { PublicAnnouncementBanner } from "./components/common/notifications/publicannouncementbanner";

const drawerWidth = 240;

/**
 * Inner content component that can use GlobalDataContext
 */
const AppShellMainContent = React.memo(
	({
		isMobile,
		isDrawerOpen,
		currentDrawerWidth,
		drawerContent,
		handleDrawerToggle,
	}: any) => {
		const location = useLocation();
		const { fetchMapData } = useGlobalData();

		const mapDataFetchedRef = useRef(false);

		// Trigger map fetch ONLY when entering the starmap view
		useEffect(() => {
			const isMapRoute = location.pathname.includes("map");

			if (isMapRoute && !mapDataFetchedRef.current) {
				mapDataFetchedRef.current = true;
				fetchMapData();
			}
		}, [location.pathname, fetchMapData]);

		return (
			<Box sx={{ display: "flex", width: "100%", height: "100%" }}>
				{isMobile && <TopNavbar />}
				<Box
					component="nav"
					sx={{
						width: { sm: currentDrawerWidth },
						flexShrink: { sm: 0 },
						transition: "width 0.3s",
					}}
					aria-label="mailbox folders"
				>
					{isMobile ? (
						<MuiDrawer
							variant="temporary"
							open={isDrawerOpen}
							onClose={handleDrawerToggle}
							ModalProps={{
								keepMounted: true,
							}}
							sx={{
								display: { xs: "block", sm: "none" },
								"& .MuiDrawer-paper": {
									boxSizing: "border-box",
									width: drawerWidth,
									background: "rgba(10, 10, 20, 0.95)",
									color: "white",
									borderRight: "1px solid rgba(123, 104, 238, 0.2)",
								},
							}}
						>
							{drawerContent}
						</MuiDrawer>
					) : (
						<MuiDrawer
							variant="permanent"
							sx={{
								display: { xs: "none", sm: "block" },
								"& .MuiDrawer-paper": {
									boxSizing: "border-box",
									width: currentDrawerWidth,
									background: "rgba(10, 10, 20, 0.95)",
									color: "white",
									borderRight: "1px solid rgba(123, 104, 238, 0.2)",
									transition: "width 0.3s",
									overflowX: "hidden",
								},
							}}
							open
						>
							{drawerContent}
						</MuiDrawer>
					)}
				</Box>
				<Box
					component="main"
					sx={{
						flexGrow: 1,
						p: 0,
						width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
						background: "transparent",
						color: "white",
						transition: "width 0.3s",
						overflowY: "auto",
					}}
				>
					{isMobile && <Toolbar />}
					<PublicAnnouncementBanner />
					<Outlet />
				</Box>
			</Box>
		);
	},
);

const AppShell: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const [isDrawerOpen, setIsDrawerOpen] = useState(!isMobile);
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		setIsDrawerOpen(!isMobile);
	}, [isMobile]);

	const handleDrawerToggle = useCallback(() => {
		setIsDrawerOpen((prev) => !prev);
	}, []);

	const handleNavigation = useCallback(
		(href: string) => {
			navigate(href);
			if (isMobile) {
				setIsDrawerOpen(false);
			}
		},
		[navigate, isMobile],
	);

	const currentDrawerWidth = isDrawerOpen ? drawerWidth : 60;

	const drawerContent = useMemo(
		() => (
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					height: "100%",
					background: "transparent",
				}}
			>
				<Toolbar
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: isDrawerOpen ? "space-between" : "center",
						px: isDrawerOpen ? [1] : 0,
					}}
				>
					{isDrawerOpen && (
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								flexGrow: 1,
								cursor: "pointer",
							}}
						>
							<Box
								component="img"
								src="/icon128.png"
								alt="PUNoted Icon"
								sx={{
									width: 32,
									height: 32,
									cursor: "pointer",
									mr: 1,
								}}
								onClick={() => navigate("/")}
							/>
							<Typography
								variant="h6"
								noWrap
								component="div"
								sx={{
									fontWeight: 700,
									background:
										"linear-gradient(45deg, #7b68ee 30%, #5d47e2 90%)",
									WebkitBackgroundClip: "text",
									WebkitTextFillColor: "transparent",
									cursor: "pointer",
								}}
								onClick={() => navigate("/")}
							>
								PUNoted
							</Typography>
							<NotificationBell />
						</Box>
					)}
					<IconButton onClick={handleDrawerToggle} sx={{ color: "white" }}>
						<ChevronLeftIcon
							sx={{
								transform: isDrawerOpen ? "rotate(0deg)" : "rotate(180deg)",
								transition: "transform 0.3s",
							}}
						/>
					</IconButton>
				</Toolbar>

				<List sx={{ flexGrow: 1, overflowY: "auto", py: 0.5 }}>
					{/* Landing Page */}
					<ListItem disablePadding>
						<ListItemButton
							onClick={() => handleNavigation("/")}
							title="Landing Page"
							sx={{
								bgcolor:
									location.pathname === "/"
										? theme.palette.primary.main + "33"
										: "transparent",
								"&:hover": {
									bgcolor: theme.palette.primary.main + "4D",
								},
								color:
									location.pathname === "/"
										? theme.palette.primary.main
										: "inherit",
								justifyContent: isDrawerOpen ? "initial" : "center",
								px: 2.5,
								py: 1,
							}}
						>
							<ListItemIcon
								sx={{
									minWidth: 0,
									mr: isDrawerOpen ? 2.5 : "auto",
									justifyContent: "center",
									color: "inherit",
								}}
							>
								<HomeIcon />
							</ListItemIcon>
							{isDrawerOpen && (
								<ListItemText
									primary="Landing Page"
									primaryTypographyProps={{
										fontSize: "0.88rem",
										fontWeight: 500,
									}}
								/>
							)}
						</ListItemButton>
					</ListItem>

					{/* Categories */}
					{navCategories.map((cat, idx) => (
						<Box key={cat.category}>
							{isDrawerOpen ? (
								<ListSubheader
									sx={{
										bgcolor: "transparent",
										color: theme.palette.primary.light,
										fontWeight: 700,
										fontSize: "0.68rem",
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										lineHeight: "26px",
										px: 2.5,
										pt: 1.5,
										pb: 0.3,
										pointerEvents: "none",
									}}
								>
									{cat.category}
								</ListSubheader>
							) : (
								<Divider
									sx={{ my: 1, borderColor: "rgba(255, 255, 255, 0.08)" }}
								/>
							)}

							{cat.items.map((item) => {
								const isActive =
									location.pathname.startsWith(item.href) && item.href !== "/";
								const isDashboardActive =
									location.pathname === "/" ||
									location.pathname === "/dashboard";
								const finalIsActive =
									item.href === "/dashboard" ? isDashboardActive : isActive;

								return (
									<ListItem key={item.text} disablePadding>
										<ListItemButton
											onClick={() =>
												!item.disabled && handleNavigation(item.href)
											}
											disabled={item.disabled}
											title={item.text}
											sx={{
												bgcolor:
													finalIsActive && !item.disabled
														? theme.palette.primary.main + "33"
														: "transparent",
												"&:hover": {
													bgcolor: item.disabled
														? "transparent"
														: theme.palette.primary.main + "4D",
												},
												color: item.disabled
													? "rgba(255, 255, 255, 0.3)"
													: finalIsActive
														? theme.palette.primary.main
														: "inherit",
												opacity: item.disabled ? 0.45 : 1,
												cursor: item.disabled ? "not-allowed" : "pointer",
												justifyContent: isDrawerOpen ? "initial" : "center",
												px: 2.5,
												py: 0.7,
											}}
										>
											<ListItemIcon
												sx={{
													minWidth: 0,
													mr: isDrawerOpen ? 2.5 : "auto",
													justifyContent: "center",
													color: item.disabled
														? "rgba(255, 255, 255, 0.3)"
														: "inherit",
												}}
											>
												{item.icon}
											</ListItemIcon>
											{isDrawerOpen && (
												<ListItemText
													primary={item.text}
													primaryTypographyProps={{
														fontSize: "0.85rem",
														fontWeight:
															finalIsActive && !item.disabled ? 600 : 400,
														color: item.disabled
															? "rgba(255, 255, 255, 0.35)"
															: "inherit",
													}}
												/>
											)}
										</ListItemButton>
									</ListItem>
								);
							})}
						</Box>
					))}
				</List>
			</Box>
		),
		[
			isDrawerOpen,
			theme.palette.primary.main,
			theme.palette.primary.light,
			handleDrawerToggle,
			location.pathname,
			handleNavigation,
			navigate,
		],
	);

	return (
		<AppShellMainContent
			isMobile={isMobile}
			isDrawerOpen={isDrawerOpen}
			currentDrawerWidth={currentDrawerWidth}
			drawerContent={drawerContent}
			handleDrawerToggle={handleDrawerToggle}
		/>
	);
};

export default AppShell;
