import React from "react";
import { Typography, Tooltip } from "@mui/material";

export const SmartVal: React.FC<{
	val: number;
	isCurrency?: boolean;
	isFlow?: boolean;
	color?: string;
	fontWeight?: number;
	currSymbol?: string;
}> = ({
	val,
	isCurrency = false,
	isFlow = false,
	color = "inherit",
	fontWeight = 500,
	currSymbol = "",
}) => {
	const absVal = Math.abs(val);
	const sign = isFlow && val > 0 ? "+" : val < 0 ? "-" : "";

	let fullText = val.toLocaleString("en-US", { maximumFractionDigits: 2 });
	if (currSymbol) fullText = `${currSymbol}${fullText}`;
	else if (isFlow && val > 0) fullText = `+${fullText}`;

	const commonSx = {
		color,
		fontWeight,
		fontVariantNumeric: "tabular-nums",
		fontSize: "0.75rem",
		lineHeight: 1.2,
	};

	if (absVal >= 1000000) {
		const shortText = `${sign}${currSymbol}${(absVal / 1000000).toFixed(1)}M`;
		return (
			<Tooltip title={`Full: ${fullText}`} arrow>
				<Typography
					variant="body2"
					sx={{
						...commonSx,
						borderBottom: "1px dashed rgba(255, 255, 255, 0.25)",
						display: "inline-block",
						cursor: "help",
					}}
				>
					{shortText}
				</Typography>
			</Tooltip>
		);
	}

	if (absVal >= 100000) {
		const shortText = `${sign}${currSymbol}${Math.round(absVal / 1000)}K`;
		return (
			<Tooltip title={`Full: ${fullText}`} arrow>
				<Typography
					variant="body2"
					sx={{
						...commonSx,
						borderBottom: "1px dashed rgba(255, 255, 255, 0.25)",
						display: "inline-block",
						cursor: "help",
					}}
				>
					{shortText}
				</Typography>
			</Tooltip>
		);
	}

	return (
		<Typography variant="body2" sx={commonSx}>
			{fullText}
		</Typography>
	);
};
