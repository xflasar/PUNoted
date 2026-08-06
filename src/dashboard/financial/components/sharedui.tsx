import React from "react";
import { Box, Typography, Tooltip, alpha, useTheme } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export const FlexCard = ({
	children,
	sx = {},
}: {
	children: React.ReactNode;
	sx?: object;
}) => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				backgroundColor: "rgba(4, 4, 10, 0.75)",
				border: "1px solid rgba(123, 104, 238, 0.2)",
				borderRadius: "16px",
				boxShadow: "0 0 40px rgba(123, 104, 238, 0.08)",
				overflow: "hidden",
				backdropFilter: "blur(25px)",
				transition: "all 0.25s ease-in-out",
				"&:hover": {
					borderColor: "rgba(123, 104, 238, 0.45)",
					boxShadow: "0 4px 20px rgba(123, 104, 238, 0.15)",
				},
				...sx,
			}}
		>
			{children}
		</Box>
	);
};

export const Guide = ({ text }: { text: string }) => {
	const theme = useTheme();
	return (
		<Tooltip title={text} arrow placement="top">
			<InfoOutlinedIcon
				sx={{
					fontSize: "0.85rem",
					color: "rgba(255, 255, 255, 0.5)",
					cursor: "help",
					transition: "color 0.2s",
					"&:hover": { color: "#7b68ee" },
				}}
			/>
		</Tooltip>
	);
};

export const DrawerRow = ({
	label,
	value,
	valueColor = "text.primary",
	isMonospace = false,
	noBorder = false,
	children,
	isTopBorder = false,
}: any) => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				px: 2.5,
				py: 1.25,
				borderBottom: noBorder ? "none" : "1px solid rgba(255, 255, 255, 0.06)",
				borderTop: isTopBorder ? "1px solid rgba(255, 255, 255, 0.06)" : "none",
			}}
		>
			<Typography
				sx={{
					fontSize: "0.7rem",
					color: "rgba(255, 255, 255, 0.5)",
					fontWeight: 700,
					textTransform: "uppercase",
					letterSpacing: "0.08em",
					flexShrink: 0,
				}}
			>
				{label}
			</Typography>
			{children ? (
				children
			) : (
				<Typography
					sx={{
						fontSize: "0.8rem",
						color: valueColor,
						fontWeight: 700,
						fontFamily: isMonospace ? "monospace" : "inherit",
						textAlign: "right",
						wordBreak: "break-word",
						pl: 2,
					}}
				>
					{value}
				</Typography>
			)}
		</Box>
	);
};
