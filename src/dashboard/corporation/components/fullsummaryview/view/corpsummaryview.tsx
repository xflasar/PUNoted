import React, { useMemo } from "react";
import {
	TableContainer,
	Table,
	TableBody,
	Paper,
	Box,
	TableRow,
	TableCell,
	useTheme,
} from "@mui/material";
import type { CorpMember } from "../types";
import type { SortField } from "../types";
import { CorpSummaryTableHead } from "./corpsummarytableheader";
import { MobileMaterialCard } from "./corpsummarytablemobile";
import { CorpSummaryTableRow } from "./corpsummarytablerow";
import { groupRowsByCategory } from "../../fullsummary/utils";

// --- Unified Summary View Component (Renders Desktop Table or Mobile List) ---
export const CorpSummaryView: React.FC<{
	isMobile: boolean;
	rows: any[];
	members: CorpMember[];
	activeCurrencyCode: string;
	sortField: SortField | null;
	sortDirection: "asc" | "desc" | "neutral";
	groupByCategory: boolean;
	onHeaderClick: (field: SortField) => void;
	renderSortIcon: (field: SortField) => React.ReactNode;
	getEffectivePrice: (t: string, fallback?: number) => number;
	onRecipeSettingsOpen?: (row: any) => void;
}> = ({
	isMobile,
	rows,
	members,
	activeCurrencyCode,
	sortField,
	sortDirection,
	groupByCategory,
	onHeaderClick,
	renderSortIcon,
	getEffectivePrice,
	onRecipeSettingsOpen,
}) => {
	const theme = useTheme();
	const groupedCategories = useMemo(() => {
		if (!groupByCategory) return null;
		return groupRowsByCategory(rows);
	}, [rows, groupByCategory]);

	if (isMobile) {
		return (
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: 1.5,
					width: "100%",
					flex: 1,
					minHeight: 0,
					overflowY: "auto",
					WebkitOverflowScrolling: "touch",
				}}
			>
				{rows.map((row) => (
					<MobileMaterialCard
						key={row.ticker}
						row={row}
						members={members}
						activeCurrencyCode={activeCurrencyCode}
						getEffectivePrice={getEffectivePrice}
					/>
				))}
			</Box>
		);
	}

	return (
		<TableContainer
			component={Paper}
			elevation={0}
			sx={{
				flex: 1,
				minHeight: 0,
				maxHeight: "100%",
				overflowX: "auto",
				overflowY: "auto",
				bgcolor: "transparent",
				border: "none",
			}}
		>
			<Table size="small" stickyHeader>
				<CorpSummaryTableHead
					activeCurrencyCode={activeCurrencyCode}
					sortField={sortField}
					sortDirection={sortDirection}
					onHeaderClick={onHeaderClick}
					renderSortIcon={renderSortIcon}
				/>
				<TableBody>
					{groupByCategory && groupedCategories
						? Array.from(groupedCategories.entries()).map(
								([catName, catRows]) => (
									<React.Fragment key={catName}>
										{/* Category Header Row */}
										<TableRow
											sx={{ bgcolor: theme.palette.background.default }}
										>
											<TableCell
												colSpan={11}
												sx={{
													color: theme.palette.primary.light,
													fontWeight: 700,
													py: 0.6,
													px: 1.25,
													letterSpacing: "0.04em",
													fontSize: "0.72rem",
												}}
											>
												{catName.toUpperCase()} ({catRows.length})
											</TableCell>
										</TableRow>

										{/* Rows belonging to this category */}
										{catRows.map((row) => (
											<CorpSummaryTableRow
												key={row.ticker}
												row={row}
												members={members}
												getEffectivePrice={getEffectivePrice}
												onRecipeSettingsOpen={onRecipeSettingsOpen}
											/>
										))}
									</React.Fragment>
								),
							)
						: // Standard ungoverned flat rendering when groupByCategory is false
							rows.map((row) => (
								<CorpSummaryTableRow
									key={row.ticker}
									row={row}
									members={members}
									getEffectivePrice={getEffectivePrice}
									onRecipeSettingsOpen={onRecipeSettingsOpen}
								/>
							))}
				</TableBody>
			</Table>
		</TableContainer>
	);
};
