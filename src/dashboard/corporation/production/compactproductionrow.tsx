import React, { useMemo, useCallback } from "react";
import {
	TableRow,
	TableCell,
	Typography,
	Tooltip,
	alpha,
	useTheme,
	Box,
	Chip,
} from "@mui/material";
import type { ProductionSummaryItem, CorpMember } from "../types";
import { SmartNumberCell } from "./smartnumbercell";
import { ValueStack } from "./valuestack";
import { DetailTooltip } from "./detailtooltip";
import { getNetColor, formatSmartNumber, isUserStale } from "../utils";
import MaterialBadge from "../../../cosm/components/materialbadge";

interface Props {
	row: ProductionSummaryItem;
	isGridMode?: boolean;
	isMobile: boolean;
	useFullNumbers?: boolean;
	isDrilldown?: boolean;
	drillType?: "prod" | "cons";
	onDrilldown?: (item: ProductionSummaryItem, type: "prod" | "cons") => void;
	members?: CorpMember[];
	noWrapper?: boolean;
}

export const CompactProductionRow = React.memo(
	({
		row,
		isGridMode = false,
		isMobile,
		isDrilldown = false,
		drillType,
		onDrilldown,
		members,
		noWrapper = false,
	}: Props) => {
		const theme = useTheme();

		const isRowStale = useMemo(() => {
			if (!isDrilldown || !members) return false;
			const m = members.find(
				(mem) => mem.companyName === row.name || mem.companyCode === row.ticker,
			);
			return m ? isUserStale(m.lastActive) : false;
		}, [isDrilldown, row.name, row.ticker, members]);

		const ratioData = useMemo(() => {
			if (isDrilldown) return null;
			const p = row.productionTotal;
			const c = row.consumptionTotal;

			// 1. Handle cases where there is no consumption
			if (c === 0)
				return p > 0
					? {
							text: "MAX",
							color: theme.palette.success.main,
							hasTooltip: true,
							tooltipText: "Infinite",
						}
					: {
							text: "-",
							color: theme.palette.text.disabled,
							hasTooltip: false,
							tooltipText: "",
						};

			// 2. Calculate ratio and format for display based on magnitude
			const ratio = (p - c) / c;
			const percentage = Math.abs(ratio * 100);
			const color =
				ratio >= 0 ? theme.palette.success.main : theme.palette.error.main;
			if (percentage > 999)
				return {
					text: ">1k",
					color,
					hasTooltip: true,
					tooltipText: formatSmartNumber(percentage) + "%",
				};
			if (percentage > 100)
				return {
					text: ">100",
					color,
					hasTooltip: true,
					tooltipText: formatSmartNumber(percentage) + "%",
				};
			return {
				text: (ratio >= 0 ? "+" : "-") + Math.round(percentage) + "%",
				color,
				hasTooltip: false,
				tooltipText: "",
			};
		}, [row.productionTotal, row.consumptionTotal, theme, isDrilldown]);

		const renderProducers = useCallback(
			(displayValue: string) => (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-end",
						gap: 0.25,
						width: "100%",
					}}
				>
					<DetailTooltip
						item={row}
						type="prod"
						isMobile={isMobile}
						isGridMode={isGridMode}
						members={members}
					>
						<Typography
							variant="body2"
							noWrap
							sx={{
								fontSize: isMobile || isGridMode ? "0.75rem" : "0.85rem",
								fontWeight: 500,
								color: isRowStale ? "warning.main" : "text.primary",
								cursor: "pointer",
							}}
						>
							{displayValue}
						</Typography>
					</DetailTooltip>
					{((row.batchProdActive || 0) > 0 ||
						(row.batchProdQueued || 0) > 0) && (
						<Tooltip
							title={`One-Time Orders: ${row.batchProdActive || 0} crafting now, ${row.batchProdQueued || 0} queued`}
							arrow
						>
							<Chip
								size="small"
								label={`+${(row.batchProdActive || 0) > 0 ? Math.round(row.batchProdActive || 0) : 0}${(row.batchProdQueued || 0) > 0 ? ` (${Math.round(row.batchProdQueued || 0)})` : ""}`}
								sx={{
									height: 15,
									fontSize: "0.55rem",
									fontWeight: 700,
									bgcolor: "rgba(129, 199, 132, 0.15)",
									color: "#81C784",
									border: "1px solid rgba(129, 199, 132, 0.3)",
									cursor: "default",
								}}
							/>
						</Tooltip>
					)}
				</Box>
			),
			[row, isMobile, isGridMode, members, isRowStale],
		);

		const renderConsumers = useCallback(
			(displayValue: string) => (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-end",
						gap: 0.25,
						width: "100%",
					}}
				>
					<DetailTooltip
						item={row}
						type="cons"
						isMobile={isMobile}
						isGridMode={isGridMode}
						members={members}
					>
						<Typography
							variant="body2"
							noWrap
							sx={{
								fontSize: isMobile || isGridMode ? "0.75rem" : "0.85rem",
								fontWeight: 500,
								color: isRowStale ? "warning.main" : "text.secondary",
								cursor: "pointer",
							}}
						>
							{displayValue}
						</Typography>
					</DetailTooltip>
					{((row.batchConsActive || 0) > 0 ||
						(row.batchConsQueued || 0) > 0) && (
						<Tooltip
							title={`One-Time Batch Inputs: ${row.batchConsActive || 0} being consumed, ${row.batchConsQueued || 0} queued`}
							arrow
						>
							<Chip
								size="small"
								label={`-${(row.batchConsActive || 0) > 0 ? Math.round(row.batchConsActive || 0) : 0}${(row.batchConsQueued || 0) > 0 ? ` (${Math.round(row.batchConsQueued || 0)})` : ""}`}
								sx={{
									height: 15,
									fontSize: "0.55rem",
									fontWeight: 700,
									bgcolor: "rgba(255, 138, 128, 0.15)",
									color: "#FF8A80",
									border: "1px solid rgba(255, 138, 128, 0.3)",
									cursor: "default",
								}}
							/>
						</Tooltip>
					)}
				</Box>
			),
			[row, isMobile, isGridMode, members, isRowStale],
		);

		const renderNet = useCallback(
			(displayValue: string) => {
				const net = row.net;
				const color = getNetColor(net, theme);
				return (
					<Tooltip title={formatSmartNumber(net)} arrow placement="top">
						<Typography
							variant="body2"
							noWrap
							sx={{
								fontSize: isMobile || isGridMode ? "0.75rem" : "0.85rem",
								fontWeight: 700,
								color: color,
								cursor: "help",
								textShadow: `0px 0px 8px ${alpha(color, 0.3)}`,
							}}
						>
							{net > 0 ? "+" : ""}
							{displayValue}
						</Typography>
					</Tooltip>
				);
			},
			[row.net, theme, isGridMode, isMobile],
		);

		// Ticker Width: 60px (Grid/List), 140px (Drilldown)
		const tickerWidth = isGridMode ? "60px" : isDrilldown ? "140px" : "80px";

		const content = (
			<>
				<TableCell
					sx={{
						py: 0.75,
						width: tickerWidth,
						maxWidth: tickerWidth,
						px: isGridMode ? 0.25 : 1,
					}}
				>
					<MaterialBadge ticker={row.ticker} />
				</TableCell>

				{/* FIXED: Removed wrapper TableCells */}
				{!isDrilldown || drillType === "prod" ? (
					<SmartNumberCell
						value={row.productionTotal}
						renderFn={renderProducers}
						onClick={
							!isDrilldown && onDrilldown
								? () => onDrilldown(row, "prod")
								: undefined
						}
						stale={isRowStale}
						isGridMode={isGridMode}
						isMobile={isMobile}
						colSpan={isDrilldown && !isGridMode ? 4 : undefined}
						sx={
							isDrilldown && !isGridMode ? { borderBottom: "none" } : undefined
						}
					/>
				) : (
					!isGridMode && <TableCell />
				)}

				{!isDrilldown || drillType === "cons" ? (
					<SmartNumberCell
						value={row.consumptionTotal}
						renderFn={renderConsumers}
						onClick={
							!isDrilldown && onDrilldown
								? () => onDrilldown(row, "cons")
								: undefined
						}
						stale={isRowStale}
						isGridMode={isGridMode}
						isMobile={isMobile}
						colSpan={isDrilldown && !isGridMode ? 4 : undefined}
						sx={
							isDrilldown && !isGridMode ? { borderBottom: "none" } : undefined
						}
					/>
				) : (
					!isGridMode && !isDrilldown && <TableCell />
				)}

				{!isDrilldown && (
					<SmartNumberCell
						value={row.net}
						renderFn={renderNet}
						isGridMode={isGridMode}
						isMobile={isMobile}
					/>
				)}
				{isDrilldown &&
					!isGridMode &&
					drillType !== "prod" &&
					drillType !== "cons" && <TableCell />}

				{!isDrilldown && (
					<TableCell align="center" sx={{ py: 0.75, px: 0 }}>
						{ratioData?.hasTooltip ? (
							<Tooltip title={ratioData.tooltipText} arrow placement="top">
								<Typography
									variant="body2"
									sx={{
										fontSize: isGridMode ? "0.7rem" : "0.85rem",
										fontWeight: 700,
										color: ratioData.color,
										whiteSpace: "nowrap",
										cursor: "help",
										borderBottom: "1px dotted",
										width: "fit-content",
										mx: "auto",
									}}
								>
									{ratioData.text}
								</Typography>
							</Tooltip>
						) : (
							<Typography
								variant="body2"
								sx={{
									fontSize: isGridMode ? "0.7rem" : "0.85rem",
									fontWeight: 700,
									color: ratioData?.color,
									whiteSpace: "nowrap",
								}}
							>
								{ratioData?.text}
							</Typography>
						)}
					</TableCell>
				)}

				{/* Extra Corp Stats: Est Price, Est Net Value, Corp Storage, Share % */}
				{!isDrilldown && !isGridMode && (
					<>
						<TableCell align="right" sx={{ py: 0.75, px: 1 }}>
							<Typography
								variant="body2"
								sx={{
									fontSize: "0.8rem",
									color: "rgba(255,255,255,0.7)",
									fontWeight: 600,
								}}
							>
								{row.price ? `$${row.price.toLocaleString()}` : "-"}
							</Typography>
						</TableCell>
						<TableCell align="right" sx={{ py: 0.75, px: 1 }}>
							<Typography
								variant="body2"
								sx={{
									fontSize: "0.8rem",
									fontWeight: 700,
									color: (row.net || 0) >= 0 ? "#81C784" : "#FF8A80",
								}}
							>
								{row.price
									? `${(row.net || 0) >= 0 ? "+" : ""}$${Math.round((row.net || 0) * row.price).toLocaleString()}`
									: "-"}
							</Typography>
						</TableCell>
						<TableCell align="right" sx={{ py: 0.75, px: 1 }}>
							<Typography
								variant="body2"
								sx={{ fontSize: "0.8rem", color: "#64FFDA", fontWeight: 700 }}
							>
								{row.storageQty
									? Math.round(row.storageQty).toLocaleString()
									: "0"}
							</Typography>
						</TableCell>
						<TableCell align="right" sx={{ py: 0.75, px: 1 }}>
							<Typography
								variant="body2"
								sx={{ fontSize: "0.8rem", color: "#A594FF", fontWeight: 700 }}
							>
								{row.marketSharePct ? `${row.marketSharePct}%` : "0%"}
							</Typography>
						</TableCell>
					</>
				)}
			</>
		);

		if (noWrapper) return content;

		return (
			<TableRow
				hover
				sx={{
					"& td": {
						borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
						px: isGridMode ? 0.25 : isMobile ? 0.25 : 1,
						verticalAlign: "top",
						py: 0.75,
					},
				}}
			>
				{content}
			</TableRow>
		);
	},
);
