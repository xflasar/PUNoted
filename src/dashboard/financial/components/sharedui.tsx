import React from "react";
import { Box, Typography, Tooltip, alpha, useTheme } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export const FlexCard = ({ children, sx = {} }: any) => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				backgroundColor: theme.palette.background.default,
				borderRadius: "8px",
				border: `1px solid ${theme.palette.divider}`,
				overflow: "hidden",
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
					ml: 1,
					fontSize: "0.9rem",
					color: theme.palette.text.secondary,
					cursor: "help",
				}}
			/>
		</Tooltip>
	);
};

export const SectionHeader = ({ title, icon, color }: any) => (
	<Box display="flex" alignItems="center" gap={1} mb={1.5} mt={3}>
		{React.cloneElement(icon, { sx: { color, fontSize: "1.1rem" } })}
		<Typography
			variant="caption"
			fontWeight={800}
			color="text.secondary"
			textTransform="uppercase"
			letterSpacing={1}
		>
			{title}
		</Typography>
	</Box>
);

export const InfoRow = ({
	label,
	value,
	valueColor = "text.primary",
	isMonospace = false,
	isBold = true,
	noBorder = false,
}: any) => {
	const theme = useTheme();
	return (
		<Box
			display="flex"
			justifyContent="space-between"
			alignItems="center"
			py={1}
			borderBottom={
				noBorder ? "none" : `1px solid ${alpha(theme.palette.divider, 0.4)}`
			}
		>
			<Typography
				variant="caption"
				color="text.secondary"
				fontWeight={700}
				textTransform="uppercase"
				letterSpacing={0.5}
			>
				{label}
			</Typography>
			<Typography
				variant="body2"
				color={valueColor}
				fontWeight={isBold ? 800 : 600}
				fontFamily={isMonospace ? "monospace" : "inherit"}
				textAlign="right"
				sx={{ pl: 2, wordBreak: "break-word" }}
			>
				{value}
			</Typography>
		</Box>
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
			display="flex"
			justifyContent="space-between"
			alignItems="center"
			px={2}
			py={1.5}
			borderBottom={
				noBorder ? "none" : `1px solid ${alpha(theme.palette.divider, 0.5)}`
			}
			borderTop={
				isTopBorder ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : "none"
			}
		>
			<Typography
				sx={{
					fontSize: "0.7rem",
					color: "text.secondary",
					fontWeight: 800,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
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
