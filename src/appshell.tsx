import { useState, useCallback, useEffect } from "react";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { GlobalWsProvider } from "./dashboard/websocket/globalwscontext";
import { navItems } from "./navitems.tsx";
import TopNavbar from "./components/common/topnavbar/topnavbar";
import WsReconnectionOverlay from "./dashboard/websocket/websocketreconnectoverlay.tsx";
import {
	GlobalDataProvider,
	useGlobalData,
} from "./context/globaldatacontext.tsx";

const drawerWidth = 240;

/**
 * Inner content component that can use GlobalDataContext
 */
const AppShellMainContent = ({
	isMobile,
	isDrawerOpen,
	currentDrawerWidth,
	drawerContent,
	handleDrawerToggle,
}: any) => {
	const location = useLocation();
	const { fetchMapData } = useGlobalData();

	// Trigger map fetch when entering any dashboard route
	useEffect(() => {
		const isDashboardRoute = location.pathname.startsWith("/dashboard");

		if (isDashboardRoute) {
			// Create a session ID based on the route and current timestamp
			// This resets when user leaves and comes back to dashboard
			const sessionId = "dashboard-session";
			console.log("Dashboard route detected, fetching map data...");
			fetchMapData(sessionId);
		}
	}, [location.pathname, fetchMapData]);

	return (
		<Box
			sx={{
				display: "flex",
				minHeight: "calc(var(--vh, 1vh) * 100)",
				width: "100vw",
			}}
		>
			{isMobile ? (
				<TopNavbar />
			) : (
				<MuiDrawer
					variant="permanent"
					sx={{
						width: currentDrawerWidth,
						flexShrink: 0,
						"& .MuiDrawer-paper": {
							width: currentDrawerWidth,
							boxSizing: "border-box",
							transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
							background: "rgba(10, 10, 20, 0.9)",
							color: "white",
							boxShadow: "0px 0px 20px rgba(123, 104, 238, 0.2)",
							overflowX: "hidden",
						},
					}}
				>
					{drawerContent}
				</MuiDrawer>
			)}

			<WsReconnectionOverlay />
			<Box
				component="main"
				sx={{
					flexGrow: 1,
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
					width: { md: `calc(100% - ${currentDrawerWidth}px)` },
					height: "calc(var(--vh, 1vh) * 100)",
					transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
					p: 1,
					paddingTop: { xs: "72px", md: 1 },
					overflow: "hidden",
				}}
			>
				<Outlet />
			</Box>
		</Box>
	);
};

export default function AppShell() {
	const [isDrawerOpen, setIsDrawerOpen] = useState(true);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const handleResize = () => {
			document.documentElement.style.setProperty(
				"--vh",
				`${window.innerHeight * 0.01}px`,
			);
		};

		window.addEventListener("resize", handleResize);
		handleResize();

		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const handleDrawerToggle = useCallback(() => {
		setIsDrawerOpen((prev) => !prev);
	}, []);

	const handleNavigation = (path: string) => {
		navigate(path);
	};

	const currentDrawerWidth = isMobile ? 0 : isDrawerOpen ? drawerWidth : 80;

	const drawerContent = (
		<Box
			sx={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Toolbar
				sx={{
					justifyContent: isDrawerOpen ? "space-between" : "center",
					alignItems: "center",
					px: isDrawerOpen ? 2 : 1,
				}}
			>
				{isDrawerOpen && (
					<Typography
						variant="h6"
						noWrap
						sx={{
							color: theme.palette.primary.main,
							cursor: "pointer",
						}}
						onClick={() => navigate("/")}
					>
						PUNoted
					</Typography>
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
			<List sx={{ flexGrow: 1, overflowY: "auto" }}>
				{navItems.map((item) => {
					const isActive =
						location.pathname.startsWith(item.href) && item.href !== "/";
					const isDashboardActive =
						location.pathname === "/" || location.pathname === "/dashboard";
					const finalIsActive =
						item.href === "/dashboard" ? isDashboardActive : isActive;

					return (
						<ListItem key={item.text} disablePadding>
							<ListItemButton
								onClick={() => handleNavigation(item.href)}
								title={item.text}
								sx={{
									bgcolor: finalIsActive
										? theme.palette.primary.main + "33"
										: "transparent",
									"&:hover": {
										bgcolor: theme.palette.primary.main + "4D",
									},
									color: finalIsActive ? theme.palette.primary.main : "inherit",
									justifyContent: isDrawerOpen ? "initial" : "center",
									px: 2.5,
								}}
							>
								<ListItemIcon
									sx={{
										minWidth: 0,
										mr: isDrawerOpen ? 3 : "auto",
										justifyContent: "center",
										color: "inherit",
									}}
								>
									{item.icon}
								</ListItemIcon>
								{isDrawerOpen && <ListItemText primary={item.text} />}
							</ListItemButton>
						</ListItem>
					);
				})}
			</List>
		</Box>
	);

	return (
		<GlobalWsProvider>
			<GlobalDataProvider>
				<AppShellMainContent
					isMobile={isMobile}
					isDrawerOpen={isDrawerOpen}
					currentDrawerWidth={currentDrawerWidth}
					drawerContent={drawerContent}
					handleDrawerToggle={handleDrawerToggle}
				/>
			</GlobalDataProvider>
		</GlobalWsProvider>
	);
}
