import { TableCell, TableHead, TableRow, Tooltip } from "@mui/material";
import type { SortField } from "../types";

// --- Desktop Table Header ---
export const CorpSummaryTableHead: React.FC<{
	activeCurrencyCode: string;
	sortField: SortField | null;
	sortDirection: "asc" | "desc" | "neutral";
	onHeaderClick: (field: SortField) => void;
	renderSortIcon: (field: SortField) => React.ReactNode;
}> = ({
	activeCurrencyCode,
	sortField,
	sortDirection,
	onHeaderClick,
	renderSortIcon,
}) => {
	const headerCellSx = {
		bgcolor: "#0a0a14",
		color: "rgba(255, 255, 255, 0.6)",
		fontWeight: 600,
		fontSize: "0.65rem",
		letterSpacing: "0.04em",
		py: 0.75,
		px: 0.75,
		cursor: "pointer",
		userSelect: "none",
		whiteSpace: "nowrap",
		borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
		"&:hover": { color: "#FFFFFF" },
	};

	return (
		<TableHead sx={{ bgcolor: "#0a0a14" }}>
			<TableRow>
				<TableCell
					onClick={() => onHeaderClick("ticker")}
					sx={{ ...headerCellSx, minWidth: 90 }}
				>
					<Tooltip title="Material Ticker & Symbol" arrow placement="top">
						<span>MAT {renderSortIcon("ticker")}</span>
					</Tooltip>
				</TableCell>
				<TableCell
					align="right"
					onClick={() => onHeaderClick("prod")}
					sx={{ ...headerCellSx, minWidth: 85 }}
				>
					<Tooltip
						title="Daily Production Rate (Units / Day)"
						arrow
						placement="top"
					>
						<span>PROD / D {renderSortIcon("prod")}</span>
					</Tooltip>
				</TableCell>
				<TableCell
					align="right"
					onClick={() => onHeaderClick("cons")}
					sx={{ ...headerCellSx, minWidth: 85 }}
				>
					<Tooltip
						title="Daily Consumption Rate (Units / Day)"
						arrow
						placement="top"
					>
						<span>CONS / D {renderSortIcon("cons")}</span>
					</Tooltip>
				</TableCell>
				<TableCell
					align="right"
					onClick={() => onHeaderClick("net")}
					sx={{ ...headerCellSx, minWidth: 85 }}
				>
					<Tooltip
						title="Daily Net Flow Rate (Production minus Consumption)"
						arrow
						placement="top"
					>
						<span>NET / D {renderSortIcon("net")}</span>
					</Tooltip>
				</TableCell>
				<TableCell
					align="right"
					onClick={() => onHeaderClick("price")}
					sx={{ ...headerCellSx, minWidth: 90 }}
				>
					<Tooltip
						title={`Effective Material Unit Price (${activeCurrencyCode})`}
						arrow
						placement="top"
					>
						<span>
							PRICE ({activeCurrencyCode}) {renderSortIcon("price")}
						</span>
					</Tooltip>
				</TableCell>
				<TableCell
					align="right"
					onClick={() => onHeaderClick("estIncome")}
					sx={{ ...headerCellSx, minWidth: 95 }}
				>
					<Tooltip
						title="Estimated Daily Revenue (Production × Unit Price)"
						arrow
						placement="top"
					>
						<span>EST. REV {renderSortIcon("estIncome")}</span>
					</Tooltip>
				</TableCell>
				<TableCell
					align="right"
					onClick={() => onHeaderClick("recipeUnitCost")}
					sx={{ ...headerCellSx, minWidth: 100 }}
				>
					<Tooltip
						title="Unit Recipe Input Cost (Crafting expense per output unit)"
						arrow
						placement="top"
					>
						<span>RECIPE COST {renderSortIcon("recipeUnitCost")}</span>
					</Tooltip>
				</TableCell>
				<TableCell
					align="right"
					onClick={() => onHeaderClick("estExpense")}
					sx={{ ...headerCellSx, minWidth: 95 }}
				>
					<Tooltip
						title="Estimated Daily Expense (Production Input Costs + Consumption Value)"
						arrow
						placement="top"
					>
						<span>EST. EXP {renderSortIcon("estExpense")}</span>
					</Tooltip>
				</TableCell>
				<TableCell
					align="right"
					onClick={() => onHeaderClick("netValue")}
					sx={{ ...headerCellSx, minWidth: 95 }}
				>
					<Tooltip
						title="Estimated Daily Net Value (Estimated Revenue minus Estimated Expense)"
						arrow
						placement="top"
					>
						<span>NET VAL {renderSortIcon("netValue")}</span>
					</Tooltip>
				</TableCell>
				<TableCell
					align="right"
					onClick={() => onHeaderClick("storageQty")}
					sx={{ ...headerCellSx, minWidth: 85 }}
				>
					<Tooltip
						title="Total Corporation Inventory Stock Quantity"
						arrow
						placement="top"
					>
						<span>STOCK {renderSortIcon("storageQty")}</span>
					</Tooltip>
				</TableCell>
				<TableCell
					align="right"
					onClick={() => onHeaderClick("sharePct")}
					sx={{ ...headerCellSx, minWidth: 75 }}
				>
					<Tooltip
						title="Material Share Percentage (Based on active share basis filter)"
						arrow
						placement="top"
					>
						<span>SHARE % {renderSortIcon("sharePct")}</span>
					</Tooltip>
				</TableCell>
			</TableRow>
		</TableHead>
	);
};
