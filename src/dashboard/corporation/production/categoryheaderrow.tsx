import React from "react";
import {
	TableRow,
	TableCell,
	Box,
	Typography,
	Chip,
	Tooltip,
	IconButton,
	alpha,
	useTheme,
} from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
	category: string;
	count: number;
	onHide: (cat: string) => void;
	isDrilldown?: boolean;
	colSpan?: number;
	noWrapper?: boolean;
}

/**
 * Renders a table row acting as a header for a specific category of items.
 * Used primarily within the list view of the production dashboard.
 */
export const CategoryHeaderRow = React.memo(
	({
		category,
		count,
		onHide,
		isDrilldown = false,
		colSpan = 5,
		noWrapper = false,
	}: Props) => {
		const theme = useTheme();

		const content = (
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					px: 1,
					height: "100%",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Typography
						variant="caption"
						sx={{
							fontWeight: "bold",
							color: isDrilldown
								? theme.palette.secondary.main
								: theme.palette.primary.main,
							fontSize: "0.8rem",
							letterSpacing: 0.5,
						}}
					>
						{category.toUpperCase()}
					</Typography>
					<Chip
						label={count}
						size="small"
						sx={{
							height: 18,
							fontSize: "0.7rem",
							fontWeight: "bold",
							bgcolor: alpha(theme.palette.background.default, 0.3),
						}}
					/>
				</Box>
				<Tooltip title={isDrilldown ? "Close List" : "Hide Category"}>
					<IconButton
						size="small"
						onClick={() => onHide(category)}
						sx={{ color: "text.secondary", p: 0.5 }}
					>
						{isDrilldown ? (
							<CloseIcon fontSize="small" />
						) : (
							<VisibilityOffIcon fontSize="small" />
						)}
					</IconButton>
				</Tooltip>
			</Box>
		);

		if (noWrapper) {
			return (
				<TableCell
					colSpan={colSpan}
					sx={{
						p: 0,
						py: 1,
						borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						bgcolor: isDrilldown
							? alpha(theme.palette.secondary.main, 0.15)
							: alpha(theme.palette.background.default, 0.15),
					}}
				>
					{content}
				</TableCell>
			);
		}

		return (
			<TableRow
				sx={{
					bgcolor: isDrilldown
						? alpha(theme.palette.secondary.main, 0.15)
						: alpha(theme.palette.background.default, 0.15),
				}}
			>
				<TableCell
					colSpan={colSpan}
					sx={{
						py: 1,
						borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
					}}
				>
					{content}
				</TableCell>
			</TableRow>
		);
	},
);
