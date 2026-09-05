import { Box, Chip, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { SmartVal } from "../helpers/smartval";
import { RecipeTooltipContent } from "../helpers/recipetooltipcontent";
import { ExpenseTooltipContent } from "../helpers/expensetooltipcontent";
import { DetailTooltip } from "../../../production/detailtooltip";
import MaterialBadge from "../../../../../cosm/components/materialbadge";
import type { CorpMember } from "../../../types";

// --- Mobile Card Row Component ---
export const MobileMaterialCard: React.FC<{
	row: any;
	members: CorpMember[];
	activeCurrencyCode: string;
	getEffectivePrice: (t: string, fallback?: number) => number;
}> = ({ row, members, activeCurrencyCode, getEffectivePrice }) => (
	<Paper
		sx={{
			p: 1.25,
			width: "100%",
			boxSizing: "border-box",
			borderRadius: 2,
			bgcolor: "rgba(20, 20, 36, 0.85)",
			border: "1px solid rgba(255, 255, 255, 0.08)",
			display: "flex",
			flexDirection: "column",
			gap: 1,
			"&:hover": { borderColor: "rgba(100, 255, 218, 0.25)" },
		}}
	>
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
			}}
		>
			<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
				<MaterialBadge ticker={row.ticker} />
			</Box>
			<Stack direction="row" spacing={0.5} alignItems="center">
				{row.storageQty > 0 && (
					<Chip
						size="small"
						label={`Stock: ${row.storageQty >= 1000000 ? `${(row.storageQty / 1000000).toFixed(1)}M` : row.storageQty >= 10000 ? `${Math.round(row.storageQty / 1000)}K` : row.storageQty.toLocaleString()}`}
						sx={{
							height: 22,
							fontSize: "0.68rem",
							fontWeight: 700,
							bgcolor: "rgba(100,255,218,0.12)",
							color: "#64FFDA",
							border: "1px solid rgba(100,255,218,0.3)",
						}}
					/>
				)}
				{row.sharePct > 0 && (
					<Chip
						size="small"
						label={`${row.sharePct}%`}
						sx={{
							height: 22,
							fontSize: "0.68rem",
							fontWeight: 700,
							bgcolor: "rgba(165,148,255,0.15)",
							color: "#A594FF",
							border: "1px solid rgba(165,148,255,0.3)",
						}}
					/>
				)}
			</Stack>
		</Box>

		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: "repeat(4, 1fr)",
				gap: 1,
				p: 1,
				borderRadius: 1.5,
				bgcolor: "rgba(13, 13, 25, 0.6)",
				border: "1px solid rgba(255, 255, 255, 0.05)",
			}}
		>
			<Box>
				<Typography
					variant="caption"
					sx={{
						color: "rgba(255,255,255,0.4)",
						fontSize: "0.6rem",
						display: "block",
						textTransform: "uppercase",
						fontWeight: 700,
						mb: 0.25,
					}}
				>
					PROD / D
				</Typography>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 0.5,
						flexWrap: "wrap",
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
									color={row.prod > 0 ? "#81C784" : "rgba(255,255,255,0.3)"}
								/>
							</Box>
						</DetailTooltip>
					) : (
						<Typography
							variant="caption"
							sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}
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
									fontWeight: 700,
									bgcolor: "rgba(129, 199, 132, 0.15)",
									color: "#81C784",
									border: "1px solid rgba(129, 199, 132, 0.3)",
								}}
							/>
						</Tooltip>
					)}
				</Box>
			</Box>

			<Box>
				<Typography
					variant="caption"
					sx={{
						color: "rgba(255,255,255,0.4)",
						fontSize: "0.6rem",
						display: "block",
						textTransform: "uppercase",
						fontWeight: 700,
						mb: 0.25,
					}}
				>
					CONS / D
				</Typography>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 0.5,
						flexWrap: "wrap",
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
									color={row.cons > 0 ? "#FF8A80" : "rgba(255,255,255,0.3)"}
								/>
							</Box>
						</DetailTooltip>
					) : (
						<Typography
							variant="caption"
							sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}
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
									fontWeight: 700,
									bgcolor: "rgba(255, 138, 128, 0.15)",
									color: "#FF8A80",
									border: "1px solid rgba(255, 138, 128, 0.3)",
								}}
							/>
						</Tooltip>
					)}
				</Box>
			</Box>

			<Box>
				<Typography
					variant="caption"
					sx={{
						color: "rgba(255,255,255,0.4)",
						fontSize: "0.6rem",
						display: "block",
						textTransform: "uppercase",
						fontWeight: 700,
						mb: 0.25,
					}}
				>
					NET / D
				</Typography>
				{row.net !== 0 ? (
					<SmartVal
						val={row.net}
						isFlow
						color={row.net > 0 ? "#81C784" : "#FF8A80"}
						fontWeight={800}
					/>
				) : (
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255,255,255,0.4)",
							fontWeight: 800,
							fontSize: "0.75rem",
						}}
					>
						0
					</Typography>
				)}
			</Box>

			<Box>
				<Typography
					variant="caption"
					sx={{
						color: "rgba(255,255,255,0.4)",
						fontSize: "0.6rem",
						display: "block",
						textTransform: "uppercase",
						fontWeight: 700,
						mb: 0.25,
					}}
				>
					PRICE ({activeCurrencyCode})
				</Typography>
				{row.price > 0 ? (
					<SmartVal
						val={row.price}
						isCurrency
						color="rgba(255,255,255,0.8)"
						fontWeight={600}
					/>
				) : (
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}
					>
						-
					</Typography>
				)}
			</Box>
		</Box>

		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: "repeat(4, 1fr)",
				gap: 1,
				p: 1,
				borderRadius: 1.5,
				bgcolor: "rgba(13, 13, 25, 0.6)",
				border: "1px solid rgba(255, 255, 255, 0.05)",
			}}
		>
			<Box>
				<Typography
					variant="caption"
					sx={{
						color: "rgba(255,255,255,0.4)",
						fontSize: "0.6rem",
						display: "block",
						textTransform: "uppercase",
						fontWeight: 700,
						mb: 0.25,
					}}
				>
					EST. REVENUE
				</Typography>
				{row.estIncome > 0 ? (
					<SmartVal
						val={row.estIncome}
						isCurrency
						color="#81C784"
						fontWeight={700}
					/>
				) : (
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}
					>
						-
					</Typography>
				)}
			</Box>

			<Box>
				<Typography
					variant="caption"
					sx={{
						color: "rgba(255,255,255,0.4)",
						fontSize: "0.6rem",
						display: "block",
						textTransform: "uppercase",
						fontWeight: 700,
						mb: 0.25,
					}}
				>
					RECIPE COST
				</Typography>
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
								color="#BA68C8"
								fontWeight={600}
							/>
						</Box>
					</Tooltip>
				) : (
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255,255,255,0.3)",
							fontStyle: "italic",
							fontSize: "0.7rem",
						}}
					>
						Raw
					</Typography>
				)}
			</Box>

			<Box>
				<Typography
					variant="caption"
					sx={{
						color: "rgba(255,255,255,0.4)",
						fontSize: "0.6rem",
						display: "block",
						textTransform: "uppercase",
						fontWeight: 700,
						mb: 0.25,
					}}
				>
					EST. EXPENSE
				</Typography>
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
								color="#FF8A80"
								fontWeight={700}
							/>
						</Box>
					</Tooltip>
				) : (
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}
					>
						-
					</Typography>
				)}
			</Box>

			<Box>
				<Typography
					variant="caption"
					sx={{
						color: "rgba(255,255,255,0.4)",
						fontSize: "0.6rem",
						display: "block",
						textTransform: "uppercase",
						fontWeight: 700,
						mb: 0.25,
					}}
				>
					NET VALUE
				</Typography>
				{row.netValue !== 0 ? (
					<SmartVal
						val={row.netValue}
						isCurrency
						isFlow
						color={row.netValue > 0 ? "#81C784" : "#FF8A80"}
						fontWeight={800}
					/>
				) : (
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255,255,255,0.4)",
							fontWeight: 800,
							fontSize: "0.75rem",
						}}
					>
						0
					</Typography>
				)}
			</Box>
		</Box>
	</Paper>
);
