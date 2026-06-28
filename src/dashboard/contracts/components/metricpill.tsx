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
				p: 1,
				pl: 1.5,
				minHeight: 50,
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				bgcolor: alpha(theme.palette[color].main, 0.08),
				borderLeft: `4px solid ${theme.palette[color].main}`,
				borderRadius: 1.5,
				minWidth: 120,
				transition: "transform 0.15s ease",
				"&:hover": { transform: "translateY(-1px)" },
			}}
		>
			<Typography
				variant="caption"
				color="text.secondary"
				fontWeight={800}
				fontSize="0.65rem"
				letterSpacing={0.5}
				display="block"
				sx={{ mb: 0.25, textTransform: "uppercase" }}
			>
				{label}
			</Typography>
			<Typography
				variant="subtitle1"
				fontWeight={800}
				lineHeight={1.1}
				color="text.primary"
				sx={{ fontSize: "0.95rem" }}
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
