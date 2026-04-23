import React, { useMemo, useCallback } from "react";
import {
	TableRow,
	TableCell,
	Typography,
	Tooltip,
	alpha,
	useTheme,
} from "@mui/material";
import type { ProductionSummaryItem, CorpMember } from "../types";
import { SmartNumberCell } from "./SmartNumberCell";
import { ValueStack } from "./ValueStack";
import { DetailTooltip } from "./DetailTooltip";
import { getNetColor, formatSmartNumber, isUserStale } from "../utils";

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
				text: percentage.toFixed(0) + "%",
				color,
				hasTooltip: false,
				tooltipText: "",
			};
		}, [row.productionTotal, row.consumptionTotal, theme, isDrilldown]);

		const renderProducers = useCallback(
			(displayValue: string, isCompact: boolean) => (
				<DetailTooltip
					items={row.producers}
					title="Producers"
					color="success"
					totalRaw={row.productionTotal}
					accurateRaw={row.productionAccurate}
					estimatedRaw={row.productionEstimated}
					theme={theme}
					members={members}
				>
					<ValueStack
						displayTotal={displayValue}
						accurate={row.productionAccurate}
						estimated={row.productionEstimated}
						isCompact={isCompact}
						colorBase="success"
						isGridMode={isGridMode}
						isMobile={isMobile}
						theme={theme}
						stale={isRowStale}
					/>
				</DetailTooltip>
			),
			[row, theme, isGridMode, isMobile, members, isRowStale],
		);

		const renderConsumers = useCallback(
			(displayValue: string, isCompact: boolean) => (
				<DetailTooltip
					items={row.consumers}
					title="Consumers"
					color="error"
					totalRaw={row.consumptionTotal}
					accurateRaw={row.consumptionAccurate}
					estimatedRaw={row.consumptionEstimated}
					theme={theme}
					members={members}
				>
					<ValueStack
						displayTotal={displayValue}
						accurate={row.consumptionAccurate}
						estimated={row.consumptionEstimated}
						isCompact={isCompact}
						colorBase="error"
						isGridMode={isGridMode}
						isMobile={isMobile}
						theme={theme}
						stale={isRowStale}
					/>
				</DetailTooltip>
			),
			[row, theme, isGridMode, isMobile, members, isRowStale],
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
		const tickerWidth = isGridMode ? "60px" : isDrilldown ? "140px" : "60px";

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
					<Tooltip title={row.ticker} arrow>
						<Typography
							variant="body2"
							noWrap
							sx={{
								fontSize: isMobile || isGridMode ? "0.75rem" : "0.85rem",
								fontWeight: 700,
								color: isRowStale ? "warning.main" : "primary.light",
							}}
						>
							{row.ticker}
						</Typography>
					</Tooltip>
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
