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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

import { navItems } from "../../../navItems.tsx";

const TopNavbar: React.FC = () => {
	const navigate = useNavigate();
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
					sx={{ flexGrow: 1, cursor: "pointer" }}
					onClick={() => navigate("/")}
				>
					PUNoted
				</Typography>
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
					PaperProps={{
						sx: {
							background: "rgba(25, 25, 40, 0.95)",
							color: "white",
							boxShadow: "0px 0px 20px rgba(123, 104, 238, 0.3)",
							border: `1px solid ${theme.palette.primary.main}80`,
							mt: 6,
						},
					}}
				>
					{navItems.map((item) => (
						<MenuItem
							key={item.text}
							onClick={() => handleNavigate(item.href)}
							sx={{
								"&:hover": {
									backgroundColor: theme.palette.primary.main + "4D",
								},
							}}
						>
							<ListItemIcon sx={{ color: "inherit" }}>
								{item.icon}
							</ListItemIcon>
							<ListItemText primary={item.text} />
						</MenuItem>
					))}
				</Menu>
			</Toolbar>
		</AppBar>
	);
};

export default TopNavbar;
