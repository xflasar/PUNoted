import React, { useState } from "react";
import {
	AppBar,
	Toolbar,
	IconButton,
	Typography,
	Box,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Divider,
	ListSubheader,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

import { navCategories } from "../../../navitems";
import { NotificationBell } from "../notifications/notificationbell";

const TopNavbar: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const theme = useTheme();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleNavigate = (path: string) => {
		navigate(path);
		handleClose();
	};

	return (
		<AppBar
			position="fixed"
			sx={{
				background: "rgba(10, 10, 20, 0.9)",
				boxShadow: "0px 0px 20px rgba(123, 104, 238, 0.2)",
			}}
		>
			<Toolbar>
				<Box
					component="img"
					src="/icon128.png"
					alt="PUNoted Icon"
					sx={{
						width: 40,
						height: 40,
						cursor: "pointer",
						mr: 2,
					}}
					onClick={() => navigate("/")}
				/>
				<Typography
					variant="h6"
					component="div"
					sx={{ flexGrow: 1, cursor: "pointer", fontWeight: 700 }}
					onClick={() => navigate("/")}
				>
					PUNoted
				</Typography>
				<NotificationBell />
				<IconButton
					size="large"
					edge="end"
					color="inherit"
					aria-label="menu"
					onClick={handleMenu}
				>
					<MenuIcon />
				</IconButton>
				<Menu
					id="menu-appbar"
					anchorEl={anchorEl}
					anchorOrigin={{
						vertical: "top",
						horizontal: "right",
					}}
					keepMounted
					transformOrigin={{
						vertical: "top",
						horizontal: "right",
					}}
					open={open}
					onClose={handleClose}
					slotProps={{
						paper: {
							sx: {
								background: "rgba(22, 22, 38, 0.98)",
								color: "white",
								boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.6)",
								border: `1px solid rgba(123, 104, 238, 0.3)`,
								backdropFilter: "blur(12px)",
								mt: 6,
								maxHeight: "85vh",
								width: 290,
								py: 1,
							},
						},
					}}
				>
					{navCategories.map((cat, idx) => [
						<ListSubheader
							key={`cat-${cat.category}`}
							sx={{
								bgcolor: "transparent",
								color: theme.palette.primary.light,
								fontWeight: 700,
								fontSize: "0.72rem",
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								lineHeight: "28px",
								px: 2,
								mt: idx > 0 ? 1 : 0,
								pointerEvents: "none",
							}}
						>
							{cat.category}
						</ListSubheader>,
						...cat.items.map((item) => {
							const isActive = location.pathname === item.href;
							return (
								<MenuItem
									key={item.text}
									onClick={() => !item.disabled && handleNavigate(item.href)}
									selected={isActive && !item.disabled}
									disabled={item.disabled}
									sx={{
										py: 0.8,
										px: 2,
										borderRadius: 1,
										mx: 0.8,
										opacity: item.disabled ? 0.45 : 1,
										cursor: item.disabled ? "not-allowed" : "pointer",
										bgcolor:
											isActive && !item.disabled
												? "rgba(123, 104, 238, 0.25) !important"
												: "transparent",
										borderLeft:
											isActive && !item.disabled
												? `3px solid ${theme.palette.primary.main}`
												: "3px solid transparent",
										"&:hover": {
											backgroundColor: item.disabled
												? "transparent"
												: "rgba(123, 104, 238, 0.15)",
										},
									}}
								>
									<ListItemIcon
										sx={{
											color: item.disabled
												? "rgba(255, 255, 255, 0.3)"
												: isActive
													? theme.palette.primary.light
													: "rgba(255, 255, 255, 0.75)",
											minWidth: 34,
										}}
									>
										{item.icon}
									</ListItemIcon>
									<ListItemText
										primary={item.text}
										primaryTypographyProps={{
											fontSize: "0.88rem",
											fontWeight: isActive && !item.disabled ? 600 : 400,
											color: item.disabled
												? "rgba(255, 255, 255, 0.35)"
												: isActive
													? "#ffffff"
													: "rgba(255, 255, 255, 0.9)",
										}}
									/>
								</MenuItem>
							);
						}),
						idx < navCategories.length - 1 && (
							<Divider
								key={`div-${cat.category}`}
								sx={{ my: 0.8, borderColor: "rgba(255, 255, 255, 0.08)" }}
							/>
						),
					])}
				</Menu>
			</Toolbar>
		</AppBar>
	);
};

export default TopNavbar;
