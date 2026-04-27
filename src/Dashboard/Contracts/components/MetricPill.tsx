import React, { memo } from "react";
import { Paper, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { formatCurrency } from "../helpers/helper";

interface MetricPillProps {
	label: string;
	value: number | string;
	sub?: string;
	color: "success" | "error" | "primary" | "warning" | "info";
}

const MetricPill = memo(({ label, value, sub, color }: MetricPillProps) => {
	const theme = useTheme();
	return (
		<Paper
			elevation={0}
			sx={{
				flex: "1 1 auto",
				p: 2, // Increased padding
				pl: 2.5, // Increased left padding
				minHeight: 90, // Explicit taller height
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				bgcolor: alpha(theme.palette[color].main, 0.08),
				borderLeft: `5px solid ${theme.palette[color].main}`, // Thicker border
				borderRadius: 2,
				minWidth: 140,
				transition: "transform 0.2s",
				"&:hover": { transform: "translateY(-2px)" },
			}}
		>
			<Typography
				variant="caption"
				color="text.secondary"
				fontWeight={800}
				fontSize="0.75rem"
				letterSpacing={1}
				display="block"
				sx={{ mb: 0.5, textTransform: "uppercase" }}
			>
				{label}
			</Typography>
			<Typography
				variant="h5"
				fontWeight={800}
				lineHeight={1.2}
				color="text.primary"
			>
				{typeof value === "number" ? formatCurrency(value, "ICA") : value}
			</Typography>
			{sub && (
				<Typography
					variant="caption"
					fontSize="0.7rem"
					color="text.secondary"
					sx={{ mt: 0.5, display: "block" }}
				>
					{sub}
				</Typography>
			)}
		</Paper>
	);
});

export default MetricPill;
