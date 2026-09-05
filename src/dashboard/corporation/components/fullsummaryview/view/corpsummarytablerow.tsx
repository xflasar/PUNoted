import {
	TableCell,
	TableRow,
	Typography,
	Chip,
	IconButton,
} from "@mui/material";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import MaterialBadge from "../../../../../cosm/components/materialbadge";
import type { CorpMember } from "../../../types";
import { SmartVal } from "../helpers/smartval";
import TuneIcon from "@mui/icons-material/Tune";
import { DetailTooltip } from "../../../production/detailtooltip";
import { RecipeTooltipContent } from "../helpers/recipetooltipcontent";
import { ExpenseTooltipContent } from "../helpers/expensetooltipcontent";

// --- Desktop Table Row ---
export const CorpSummaryTableRow: React.FC<{
	row: any;
	members: CorpMember[];
	getEffectivePrice: (t: string, fallback?: number) => number;
	onRecipeSettingsOpen?: (row: any) => void;
}> = ({ row, members, getEffectivePrice, onRecipeSettingsOpen }) => {
	const cellSx = {
		borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
		py: 0.5,
		px: 0.75,
	};

	return (
		<TableRow
			sx={{
				"&:nth-of-type(even)": { bgcolor: "rgba(255, 255, 255, 0.015)" },
				"&:hover": { bgcolor: "rgba(100, 255, 218, 0.04)" },
				transition: "background-color 0.15s ease",
			}}
		>
			<TableCell sx={cellSx}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<MaterialBadge ticker={row.ticker} />
				</Box>
			</TableCell>
			<TableCell align="right" sx={cellSx}>
				<Box
					sx={{
						display: "inline-flex",
						alignItems: "center",
						gap: 0.3,
						justifyContent: "flex-end",
					}}
				>
					{row.producers.length > 0 ? (
						<DetailTooltip
							item={row}
							items={row.producers}
							title="Producers"
							color="success"
							totalRaw={row.prod}
							accurateRaw={row.prod}
							estimatedRaw={0}
							members={members}
						>
							<Box sx={{ cursor: "pointer", display: "inline-block" }}>
								<SmartVal
									val={row.prod}
									color={row.prod > 0 ? "#66BB6A" : "rgba(255,255,255,0.25)"}
								/>
							</Box>
						</DetailTooltip>
					) : (
						<Typography
							variant="caption"
							sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}
						>
							-
						</Typography>
					)}
					{(row.batchProdActive > 0 || row.batchProdQueued > 0) && (
						<Tooltip
							title={`One-Time Orders: ${row.batchProdActive} crafting now, ${row.batchProdQueued} queued`}
							arrow
						>
							<Chip
								size="small"
								label={`+${row.batchProdActive > 0 ? Math.round(row.batchProdActive) : 0}${row.batchProdQueued > 0 ? ` (${Math.round(row.batchProdQueued)})` : ""}`}
								sx={{
									height: 16,
									fontSize: "0.58rem",
									fontWeight: 600,
									bgcolor: "rgba(102, 187, 106, 0.12)",
									color: "#66BB6A",
									border: "1px solid rgba(102, 187, 106, 0.25)",
								}}
							/>
						</Tooltip>
					)}
				</Box>
			</TableCell>
			<TableCell align="right" sx={cellSx}>
				<Box
					sx={{
						display: "inline-flex",
						alignItems: "center",
						gap: 0.3,
						justifyContent: "flex-end",
					}}
				>
					{row.consumers.length > 0 ? (
						<DetailTooltip
							item={row}
							items={row.consumers}
							title="Consumers"
							color="error"
							totalRaw={row.cons}
							accurateRaw={row.cons}
							estimatedRaw={0}
							members={members}
						>
							<Box sx={{ cursor: "pointer", display: "inline-block" }}>
								<SmartVal
									val={row.cons}
									color={row.cons > 0 ? "#EF5350" : "rgba(255,255,255,0.25)"}
								/>
							</Box>
						</DetailTooltip>
					) : (
						<Typography
							variant="caption"
							sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}
						>
							-
						</Typography>
					)}
					{(row.batchConsActive > 0 || row.batchConsQueued > 0) && (
						<Tooltip
							title={`One-Time Batch Inputs: ${row.batchConsActive} being consumed, ${row.batchConsQueued} queued`}
							arrow
						>
							<Chip
								size="small"
								label={`-${row.batchConsActive > 0 ? Math.round(row.batchConsActive) : 0}${row.batchConsQueued > 0 ? ` (${Math.round(row.batchConsQueued)})` : ""}`}
								sx={{
									height: 16,
									fontSize: "0.58rem",
									fontWeight: 600,
									bgcolor: "rgba(239, 83, 80, 0.12)",
									color: "#EF5350",
									border: "1px solid rgba(239, 83, 80, 0.25)",
								}}
							/>
						</Tooltip>
					)}
				</Box>
			</TableCell>
			<TableCell align="right" sx={cellSx}>
				{row.net !== 0 ? (
					<SmartVal
						val={row.net}
						isFlow
						color={row.net > 0 ? "#66BB6A" : "#EF5350"}
						fontWeight={600}
					/>
				) : (
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}
					>
						0
					</Typography>
				)}
			</TableCell>
			<TableCell align="right" sx={cellSx}>
				{row.price > 0 ? (
					<SmartVal
						val={row.price}
						isCurrency
						color="rgba(255,255,255,0.85)"
						fontWeight={500}
					/>
				) : (
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}
					>
						-
					</Typography>
				)}
			</TableCell>
			<TableCell align="right" sx={cellSx}>
				{row.estIncome > 0 ? (
					<SmartVal
						val={row.estIncome}
						isCurrency
						color="#66BB6A"
						fontWeight={600}
					/>
				) : (
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}
					>
						-
					</Typography>
				)}
			</TableCell>
			<TableCell align="right" sx={cellSx}>
				<Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.3 }}>
					{row.recipeUnitCost > 0 ? (
						<Tooltip
							title={
								<RecipeTooltipContent
									targetTicker={row.ticker}
									recipe={row.selectedRecipe}
									userRecipesUsed={row.userRecipesUsed}
									getPriceFn={getEffectivePrice}
								/>
							}
							arrow
						>
							<Box sx={{ cursor: "pointer", display: "inline-block" }}>
								<SmartVal
									val={row.recipeUnitCost}
									isCurrency
									color="#AB47BC"
									fontWeight={500}
								/>
							</Box>
						</Tooltip>
					) : (
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.25)",
								fontStyle: "italic",
								fontSize: "0.7rem",
							}}
						>
							Raw
						</Typography>
					)}

					{row.recipeCount > 1 && onRecipeSettingsOpen && (
						<Tooltip
							title={`Select Recipe Variant (${row.selectedRecipeIdx + 1}/${row.recipeCount})`}
							arrow
						>
							<IconButton
								size="small"
								onClick={() => onRecipeSettingsOpen(row)}
								sx={{
									p: 0.1,
									color: "#AB47BC",
									"&:hover": { bgcolor: "rgba(171,71,188,0.15)" },
								}}
							>
								<TuneIcon sx={{ fontSize: 12 }} />
							</IconButton>
						</Tooltip>
					)}
				</Box>
			</TableCell>
			<TableCell align="right" sx={cellSx}>
				{row.estExpense > 0 ? (
					<Tooltip
						title={
							<ExpenseTooltipContent
								ticker={row.ticker}
								prod={row.prod}
								cons={row.cons}
								price={row.price}
								recipeUnitCost={row.recipeUnitCost}
								prodExpense={row.prodExpense}
								consExpense={row.consExpense}
								totalExpense={row.estExpense}
							/>
						}
						arrow
					>
						<Box sx={{ cursor: "pointer", display: "inline-block" }}>
							<SmartVal
								val={row.estExpense}
								isCurrency
								color="#EF5350"
								fontWeight={600}
							/>
						</Box>
					</Tooltip>
				) : (
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}
					>
						-
					</Typography>
				)}
			</TableCell>
			<TableCell align="right" sx={cellSx}>
				{row.netValue !== 0 ? (
					<SmartVal
						val={row.netValue}
						isCurrency
						isFlow
						color={row.netValue > 0 ? "#66BB6A" : "#EF5350"}
						fontWeight={600}
					/>
				) : (
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}
					>
						0
					</Typography>
				)}
			</TableCell>
			<TableCell align="right" sx={cellSx}>
				{row.storageQty > 0 ? (
					<Typography
						variant="caption"
						sx={{
							color: "#4DD0E1",
							fontWeight: 600,
							fontSize: "0.75rem",
							fontVariantNumeric: "tabular-nums",
						}}
					>
						{row.storageQty >= 1000000
							? `${(row.storageQty / 1000000).toFixed(1)}M`
							: row.storageQty >= 10000
								? `${Math.round(row.storageQty / 1000)}K`
								: row.storageQty.toLocaleString()}
					</Typography>
				) : (
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}
					>
						-
					</Typography>
				)}
			</TableCell>
			<TableCell align="right" sx={cellSx}>
				{row.sharePct > 0 ? (
					<Typography
						variant="caption"
						sx={{
							color: "#9FA8DA",
							fontWeight: 600,
							fontSize: "0.75rem",
							fontVariantNumeric: "tabular-nums",
						}}
					>
						{row.sharePct}%
					</Typography>
				) : (
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}
					>
						-
					</Typography>
				)}
			</TableCell>
		</TableRow>
	);
};
