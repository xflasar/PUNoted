import React, { useMemo } from "react";
import {
	Box,
	Typography,
	Paper,
	useTheme,
	TableContainer,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
	type Theme,
} from "@mui/material";
import MaterialBadge from "../components/materialbadge";

/**
 * Represents the balance of a specific material required for production.
 */
export interface BalanceItem {
	/** The unique identifier or ticker symbol for the material. */
	ticker: string;
	/** The quantity of the material currently available in storage. */
	available: number;
	/** The total quantity of the material needed for all in-progress orders. */
	need: number;
	/** The difference between needed and available quantities (need - available). */
	deficit: number;
}

/**
 * Props for the MaterialBalanceTable component.
 */
export interface MaterialBalanceTableProps {
	/** Array of balance items to be displayed in the table. */
	data: BalanceItem[];
}

/**
 * Formats a numerical amount into a string with thousands separators.
 * Handles null, undefined, and NaN values by returning "N/A".
 *
 * @param amount - The numerical amount to format.
 * @returns The formatted number string or "N/A" if invalid.
 */
const formatAmount = (amount: number): string => {
	if (amount === null || amount === undefined || isNaN(amount)) {
		return "N/A";
	}
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
};

/**
 * Props for the BalanceColumn component.
 */
export interface BalanceColumnProps {
	/** The data to be displayed in this specific column. */
	columnData: BalanceItem[];
	/** The Material UI theme object for styling. */
	theme: Theme;
	/** Indicates if this is the last column to adjust border styling. */
	isLastColumn: boolean;
}

/**
 * Renders a single vertical column of material balances.
 * Used to split a long list of materials into multiple columns for better horizontal screen utilization.
 *
 * @param props - The component props.
 * @returns The rendered column component.
 */
const BalanceColumn: React.FC<BalanceColumnProps> = ({
	columnData,
	theme,
	isLastColumn,
}) => {
	const compactCellStyle = {
		textAlign: "right",
		color: theme.palette.text.primary,
		padding: "2px 4px",
		fontSize: "0.75rem",
		borderBottom: `1px solid ${theme.palette.divider}`,
		height: "24px",
	};

	const compactHeaderCellStyle = {
		...compactCellStyle,
		fontWeight: "bold",
		color: theme.palette.primary.main,
		background: "transparent",
		borderBottom: `2px solid ${theme.palette.divider}`,
		padding: "4px 4px",
	};

	return (
		<TableContainer
			sx={{
				flex: "1 1 20%",
				overflowX: "hidden",
				borderRight: isLastColumn
					? "none"
					: `1px solid ${theme.palette.divider}`,
				minWidth: "200px",
			}}
		>
			<Table
				stickyHeader
				size="small"
				sx={{
					width: "100%",
					borderCollapse: "collapse",
				}}
			>
				<TableHead>
					<TableRow>
						<TableCell
							sx={{ ...compactHeaderCellStyle, textAlign: "left", width: "5%" }}
						>
							Part
						</TableCell>
						<TableCell sx={{ ...compactHeaderCellStyle, width: "30%" }}>
							Available
						</TableCell>
						<TableCell sx={{ ...compactHeaderCellStyle, width: "30%" }}>
							Need
						</TableCell>
						<TableCell sx={{ ...compactHeaderCellStyle, width: "30%" }}>
							Deficit
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{columnData.map((item) => {
						const deficitColor =
							item.deficit > 0
								? theme.palette.error.main
								: item.deficit < 0
									? theme.palette.success.main
									: theme.palette.text.primary;

						return (
							<TableRow
								key={item.ticker}
								sx={{ "&:last-child td, &:last-child th": { borderBottom: 0 } }}
							>
								<TableCell
									sx={{
										...compactCellStyle,
										textAlign: "left",
										fontWeight: "bold",
									}}
								>
									<MaterialBadge ticker={item.ticker} />
								</TableCell>
								<TableCell sx={compactCellStyle}>
									{formatAmount(item.available)}
								</TableCell>
								<TableCell sx={compactCellStyle}>
									{formatAmount(item.need)}
								</TableCell>
								<TableCell
									sx={{
										...compactCellStyle,
										color: deficitColor,
										fontWeight: "bold",
									}}
								>
									{item.deficit > 0
										? `-${formatAmount(item.deficit)}`
										: `+${formatAmount(item.deficit * -1)}`}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

/**
 * Displays a comprehensive table of material balances, dynamically splitting
 * the list into multiple columns based on the available space and data length.
 *
 * @param props - The component props.
 * @returns The rendered balance table.
 */
const MaterialBalanceTable: React.FC<MaterialBalanceTableProps> = ({
	data,
}) => {
	const theme = useTheme();
	const NUM_COLUMNS = 5;

	const columns = useMemo(() => {
		if (!data.length) return [];

		const columnLength = Math.ceil(data.length / NUM_COLUMNS);
		const columnArrays: BalanceItem[][] = [];

		const actualColumns = Math.min(
			NUM_COLUMNS,
			Math.ceil(data.length / columnLength),
		);

		for (let i = 0; i < actualColumns; i++) {
			const start = i * columnLength;
			const columnData = data.slice(start, start + columnLength);

			if (columnData.length > 0) {
				columnArrays.push(columnData);
			}
		}
		return columnArrays;
	}, [data]);

	return (
		<Paper
			sx={{
				p: 0,
				background: "transparent",
				borderRadius: "15px",
				display: "flex",
				flexDirection: "column",
				minHeight: "100px",
			}}
		>
			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					overflowX: "auto",
					maxHeight: "calc(100vh - 300px)",
					flexGrow: 1,
				}}
			>
				{columns.length === 0 ? (
					<Box sx={{ p: 2, width: "100%", textAlign: "center" }}>
						<Typography variant="body2" color="text.secondary">
							No materials tracked or needed.
						</Typography>
					</Box>
				) : (
					columns.map((columnData, index) => (
						<BalanceColumn
							key={index}
							columnData={columnData}
							theme={theme}
							isLastColumn={index === columns.length - 1}
						/>
					))
				)}
			</Box>
		</Paper>
	);
};

export default MaterialBalanceTable;
