import React, { useState } from "react";
import {
	Box,
	IconButton,
	Paper,
	Typography,
	useTheme,
	useMediaQuery,
} from "@mui/material";
import { animated, useSpring } from "@react-spring/web";
import CloseIcon from "@mui/icons-material/Close";

interface CollapsiblePanelProps {
	icon: React.ReactNode;
	children: React.ReactNode;
	position: {
		top?: number | string;
		right?: number | string;
		bottom?: number | string;
		left?: number | string;
	};
	title: string;
	width?: number;
	height?: string | number;
}

const AnimatedPaper = animated(Paper);

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
	icon,
	children,
	position,
	title,
	width = 350,
	height = "auto",
}) => {
	const theme = useTheme();
	const [isExpanded, setIsExpanded] = useState(false);
	const isSmallScreen = useMediaQuery("(max-width:1304px)");

	const { top, left, bottom, right } = position;

	const animation = useSpring({
		width: isExpanded ? width : 48,
		height: isExpanded ? height : 48,
		background: isExpanded
			? theme.palette.background.paper
			: theme.palette.background.default,
		borderRadius: isExpanded ? 8 : 24,
		top: isExpanded && isSmallScreen ? 72 : top,
		left: left,
		bottom: bottom,
		right: right,
	});

	return (
		<AnimatedPaper
			style={animation}
			elevation={isExpanded ? 10 : 0}
			sx={{
				position: "absolute",
				zIndex: 11,
				overflow: "hidden",
				border: isExpanded
					? `1px solid ${theme.palette.primary.main}`
					: `1px solid ${theme.palette.divider}`,
				boxShadow: isExpanded
					? `0 0 15px ${theme.palette.primary.main}`
					: "none",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<IconButton
				onClick={() => setIsExpanded(!isExpanded)}
				sx={
					!isExpanded
						? { position: "absolute", zIndex: 12, p: 0.5 }
						: { position: "absolute", zIndex: 12, p: 0, top: 16, right: 16 }
				}
			>
				{isExpanded ? <CloseIcon /> : icon}
			</IconButton>
			{isExpanded && (
				<Box
					sx={{
						opacity: isExpanded ? 1 : 0,
						transition: "opacity 0.3s",
						p: 2,
						width: "100%",
						height: "100%",
						overflow: "hidden",
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Typography variant="h6" sx={{ mb: 1, mt: 0, flexShrink: 0 }}>
						{title}
					</Typography>
					<Box sx={{ flexGrow: 1, overflowY: "auto", overflowX: "hidden" }}>
						{children}
					</Box>
				</Box>
			)}
		</AnimatedPaper>
	);
};

export default CollapsiblePanel;
