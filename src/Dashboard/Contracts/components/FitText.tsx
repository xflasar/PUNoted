import React, { useRef, useLayoutEffect, useState } from "react";
import { Box, Typography, TypographyProps } from "@mui/material";

interface Props extends TypographyProps {
	children: React.ReactNode;
}

export const FitText: React.FC<Props> = ({ children, sx, ...props }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLSpanElement>(null);
	const [scale, setScale] = useState(1);

	useLayoutEffect(() => {
		const container = containerRef.current;
		const text = textRef.current;

		if (container && text) {
			// Reset scale to measure natural width
			text.style.transform = "none";

			const containerWidth = container.offsetWidth;
			const textWidth = text.offsetWidth;

			if (textWidth > containerWidth) {
				// Calculate exact scale needed to fit
				const newScale = containerWidth / textWidth;
				// Cap scale at 1 (don't stretch small text) and min 0.6 (don't make it microscopic)
				setScale(Math.max(newScale, 0.6));
			} else {
				setScale(1);
			}
		}
	}, [children, props.fontSize, props.variant]);

	return (
		<Box ref={containerRef} sx={{ width: "100%", overflow: "hidden", ...sx }}>
			<Typography
				component="div"
				ref={textRef}
				{...props}
				sx={{
					display: "inline-block",
					whiteSpace: "nowrap",
					transform: `scale(${scale})`,
					transformOrigin: "left center",
					width: "fit-content",
					transition: "transform 0.1s ease-out",
				}}
			>
				{children}
			</Typography>
		</Box>
	);
};
