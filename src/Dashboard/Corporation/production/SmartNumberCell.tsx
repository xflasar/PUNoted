import React, { useState, useRef, useLayoutEffect } from "react";
import {
	Box,
	TableCell,
	Typography,
	type SxProps,
	type Theme,
} from "@mui/material";
import { formatSmartNumber } from "../utils";

/**
 * A responsive table cell that automatically switches between full and compact
 * number formatting based on the available container width.
 */
export const SmartNumberCell = React.memo(
	({
		value,
		renderFn,
		onClick,
		stale,
		isGridMode,
		isMobile,
		colSpan,
		sx,
	}: {
		value: number;
		renderFn: (val: string, isCompact: boolean) => React.ReactNode;
		onClick?: (e: React.MouseEvent) => void;
		stale?: boolean;
		isGridMode?: boolean;
		isMobile?: boolean;
		colSpan?: number;
		sx?: SxProps<Theme>;
	}) => {
		// 1. Generate versions
		const fullText = formatSmartNumber(value, Infinity);
		const compactText = formatSmartNumber(value, 0);

		// 2. State
		const [isCompact, setIsCompact] = useState(false);

		// 3. Refs
		const containerRef = useRef<HTMLDivElement>(null);
		const ghostRef = useRef<HTMLSpanElement>(null);

		const fontSize = isMobile || isGridMode ? "0.75rem" : "0.85rem";

		useLayoutEffect(() => {
			const container = containerRef.current;
			const ghost = ghostRef.current;
			if (!container || !ghost) return;

			// Check if the full text width exceeds the available container width
			const checkFit = () => {
				if (container.offsetWidth === 0) return;
				const availableWidth = container.offsetWidth;
				const requiredWidth = ghost.offsetWidth;
				const shouldBeCompact = requiredWidth > availableWidth - 4;
				setIsCompact((prev) =>
					prev !== shouldBeCompact ? shouldBeCompact : prev,
				);
			};

			const observer = new ResizeObserver(checkFit);
			observer.observe(container);
			checkFit();

			return () => observer.disconnect();
		}, [value, fullText]);

		return (
			<TableCell
				align="right"
				onClick={onClick}
				colSpan={colSpan}
				sx={{
					py: 0.75,
					px: 1,
					position: "relative",
					overflow: "hidden",
					cursor: onClick ? "pointer" : "default",
					"&:hover": onClick
						? { backgroundColor: "rgba(255, 255, 255, 0.05)" }
						: {},
					color: stale ? "warning.main" : undefined,
					verticalAlign: "top",
					...sx,
				}}
			>
				<Typography
					ref={ghostRef}
					variant="body2"
					sx={{
						position: "absolute",
						visibility: "hidden",
						whiteSpace: "nowrap",
						fontSize: fontSize,
						fontWeight: 700,
						pointerEvents: "none",
					}}
				>
					{fullText}
				</Typography>

				<Box
					ref={containerRef}
					sx={{
						width: "100%",
						display: "flex",
						justifyContent: "flex-end",
						overflow: "hidden",
					}}
				>
					{renderFn(isCompact ? compactText : fullText, isCompact)}
				</Box>
			</TableCell>
		);
	},
);
