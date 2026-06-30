import React, { useMemo, useState } from "react";
import {
	Box,
	Typography,
	Paper,
	LinearProgress,
	Tooltip,
	Divider,
	Chip,
	useTheme,
	alpha,
	TextField,
	InputAdornment,
	Tabs,
	Tab,
} from "@mui/material";
import {
	MapPin,
	Flame,
	Factory,
	Archive,
	ArrowUpCircle,
	ArrowDownCircle,
	Package,
	Handshake,
	Layers,
	Warehouse,
	ChevronRight,
} from "lucide-react";
import MaterialBadge from "../../cosm/components/materialbadge";
import type { SiteSummary, FlowData } from "./types";

const formatFlow = (val: number) => {
	const sign = val > 0 ? "+" : "";
	return `${sign}${val.toLocaleString("en-US", { maximumFractionDigits: 1 })}`;
};

const smartFormat = (val: number, isFlow: boolean = false) => {
	const absVal = Math.abs(val);
	const sign = isFlow && val > 0 ? "+" : "";
	const fullStr = isFlow
		? formatFlow(val)
		: val.toLocaleString("en-US", { maximumFractionDigits: 0 });

	if (absVal >= 1000000) {
		return {
			text: `${sign}${(val / 1000000).toFixed(1)}M`,
			full: fullStr,
			isAbbreviated: true,
		};
	}

	const formatted = isFlow
		? formatFlow(val)
		: val.toLocaleString("en-US", { maximumFractionDigits: 0 });
	return {
		text: formatted,
		full: fullStr,
		isAbbreviated: false,
	};
};

interface ProductionCardProps {
	site: SiteSummary;
	richFlows: Record<string, FlowData>;
	siteId: string;
	targetDays: number;
	onTargetDaysChange: (val: string) => void;
	onSelect: (siteId: string) => void;
}

export const ProductionCard = React.memo(
	({
		site,
		richFlows,
		siteId,
		targetDays,
		onTargetDaysChange,
		onSelect,
	}: ProductionCardProps) => {
		const theme = useTheme();
		const [tab, setTab] = useState<"production" | "storage" | "both">("both");

		const {
			productionList,
			consumptionList,
			statusColor,
			activeLines,
			activeProducts,
			storageList,
		} = useMemo(() => {
			const prod: FlowData[] = [];
			const cons: FlowData[] = [];
			let minDays = 999;
			const products = new Set<string>();

			Object.values(richFlows)
				.sort((a, b) => a.ticker.localeCompare(b.ticker))
				.forEach((f) => {
					if (f.flow > 0) {
						prod.push(f);
					} else if (f.flow < 0) {
						const dailyBurn = Math.abs(f.flow);
						const siteAvailable =
							f.siteAmount !== undefined ? f.siteAmount : f.currentAmount;
						const daysLeft = siteAvailable / dailyBurn;
						const targetAmount = dailyBurn * targetDays;
						const missing = Math.max(0, targetAmount - siteAvailable);
						if (daysLeft < minDays) minDays = daysLeft;
						cons.push({ ...f, daysRemaining: daysLeft, missing });
					}
				});

			let color = theme.palette.success.main;
			if (minDays < targetDays / 5) color = theme.palette.error.main;
			else if (minDays < targetDays) color = theme.palette.warning.main;

			let linesCount = 0;
			site.production_lines?.forEach((l) => {
				if (l.queue && l.queue.length > 0) {
					linesCount++;
					for (const f of l.queue) {
						if (f.production_recipe) {
							f.production_recipe.outputs?.forEach((out) => {
								products.add(out.ticker);
							});
						}
					}
				}
			});

			const storage = [...(site.storage_items || [])].sort((a, b) =>
				a.ticker.localeCompare(b.ticker),
			);

			return {
				productionList: prod,
				consumptionList: cons,
				statusColor: color,
				activeLines: linesCount,
				activeProducts: Array.from(products).slice(0, 5),
				storageList: storage,
			};
		}, [
			richFlows,
			site.production_lines,
			site.storage_items,
			targetDays,
			theme,
		]);

		const siteOverallCondition =
			site.production_lines
				.map((line) => line.condition || 0)
				.reduce((a, b) => a + b, 0) / (site.production_lines.length || 1);

		const conditionColor =
			siteOverallCondition > 0.99
				? theme.palette.success.main
				: siteOverallCondition > 0.8
					? theme.palette.warning.main
					: theme.palette.error.main;

		// Make leased cards visually distinct with a dashed border
		const borderStyle =
			site.isLeased && site.type === "Inbound" ? "dashed" : "solid";
		const borderWidth =
			site.isLeased && site.type === "Inbound" ? "2px" : "1px";
		const isDark = theme.palette.mode === "dark";

		// Prevent click on text selection
		const handleClick = (e: React.MouseEvent) => {
			const selection = window.getSelection();
			if (selection && selection.toString().length > 0) {
				return; // Don't trigger if user is copying text
			}
			onSelect(siteId);
		};

		const renderProductionFlows = () => (
			<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
				{productionList.length > 0 && (
					<Box>
						<Typography
							variant="subtitle2"
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								mb: 0.25,
								color: theme.palette.success.main,
								fontWeight: 700,
								fontSize: "0.65rem",
							}}
						>
							<ArrowUpCircle size={12} /> PROD
						</Typography>
						<Box sx={{ display: "grid", gap: 0.25 }}>
							{productionList.map((p) => (
								<Box
									key={p.ticker}
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										gap: 1,
										py: 0.15,
										borderBottom: `1px dashed ${alpha(theme.palette.divider, 0.05)}`,
									}}
								>
									<Box
										sx={{
											fontSize: "0.75em",
											display: "flex",
											alignItems: "center",
										}}
									>
										<MaterialBadge ticker={p.ticker} />
									</Box>
									<Tooltip
										title={
											smartFormat(p.flow, true).isAbbreviated
												? smartFormat(p.flow, true).full
												: ""
										}
										disableHoverListener={
											!smartFormat(p.flow, true).isAbbreviated
										}
									>
										<Typography
											variant="caption"
											fontWeight={500}
											color="success.main"
											textAlign="right"
											fontSize="0.75rem"
											sx={{
												fontFamily: "monospace",
												fontVariantNumeric: "tabular-nums",
												textDecoration: smartFormat(p.flow, true).isAbbreviated
													? "underline dotted"
													: "none",
												textUnderlineOffset: "2px",
												cursor: smartFormat(p.flow, true).isAbbreviated
													? "help"
													: "text",
											}}
										>
											{smartFormat(p.flow, true).text}/d
										</Typography>
									</Tooltip>
								</Box>
							))}
						</Box>
					</Box>
				)}

				{consumptionList.length > 0 && (
					<Box sx={{ mt: productionList.length ? 0.5 : 0 }}>
						<Typography
							variant="subtitle2"
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								mb: 0.25,
								color: theme.palette.warning.main,
								fontWeight: 700,
								fontSize: "0.65rem",
							}}
						>
							<ArrowDownCircle size={12} /> CONS
						</Typography>
						<Box sx={{ display: "grid", gap: 0.25 }}>
							{consumptionList.map((c) => {
								const isCritical = c.daysRemaining < targetDays / 5;
								const isWarning = c.daysRemaining < targetDays;
								const daysColor = isCritical
									? "error.main"
									: isWarning
										? "warning.main"
										: "success.main";
								const {
									text: needText,
									full: needFull,
									isAbbreviated,
								} = smartFormat(c.missing);

								return (
									<Box
										key={c.ticker}
										sx={{
											display: "grid",
											gridTemplateColumns:
												"min-content 1fr min-content min-content",
											alignItems: "center",
											gap: 0.5,
											py: 0.15,
											borderBottom: `1px dashed ${alpha(theme.palette.divider, 0.05)}`,
										}}
									>
										<Box
											sx={{
												fontSize: "0.75em",
												display: "flex",
												alignItems: "center",
											}}
										>
											<MaterialBadge ticker={c.ticker} />
										</Box>
										<Tooltip
											title={
												smartFormat(c.flow, true).isAbbreviated
													? smartFormat(c.flow, true).full
													: ""
											}
											disableHoverListener={
												!smartFormat(c.flow, true).isAbbreviated
											}
										>
											<Typography
												variant="caption"
												color="text.secondary"
												textAlign="right"
												fontSize="0.75rem"
												sx={{
													fontFamily: "monospace",
													fontVariantNumeric: "tabular-nums",
													opacity: 0.9,
													textDecoration: smartFormat(c.flow, true)
														.isAbbreviated
														? "underline dotted"
														: "none",
													textUnderlineOffset: "2px",
													cursor: smartFormat(c.flow, true).isAbbreviated
														? "help"
														: "text",
												}}
											>
												{smartFormat(c.flow, true).text}/d
											</Typography>
										</Tooltip>
										<Tooltip title="Days remaining in Site (and Warehouse equivalent)">
											<Typography
												variant="caption"
												fontWeight={500}
												sx={{
													color: daysColor,
													cursor: "help",
													whiteSpace: "nowrap",
													fontFamily: "monospace",
													fontVariantNumeric: "tabular-nums",
													pr: 3,
												}}
												textAlign="right"
												fontSize="0.75rem"
											>
												{c.daysRemaining > 999
													? "∞"
													: `${c.daysRemaining.toFixed(1)}d`}
												{c.warehouseAmount &&
												c.warehouseAmount > 0 &&
												Math.abs(c.flow) > 0 ? (
													<Typography
														component="span"
														variant="caption"
														color="text.secondary"
														sx={{ fontSize: "0.65rem", ml: 0.5 }}
													>
														(+
														{(c.warehouseAmount / Math.abs(c.flow)).toFixed(1)}
														d)
													</Typography>
												) : null}
											</Typography>
										</Tooltip>
										<Box
											sx={{
												display: "flex",
												justifyContent: "flex-end",
												width: 36,
											}}
										>
											{c.missing > 0 && (
												<Tooltip
													title={isAbbreviated ? `Need ${needFull}` : ""}
													disableHoverListener={!isAbbreviated}
												>
													<Typography
														variant="caption"
														fontWeight={500}
														color={daysColor}
														sx={{
															fontSize: "0.75rem",
															textAlign: "right",
															cursor: isAbbreviated ? "help" : "text",
															textDecoration: isAbbreviated
																? "underline dotted"
																: "none",
															textUnderlineOffset: "2px",
															fontFamily: "monospace",
															fontVariantNumeric: "tabular-nums",
														}}
													>
														{needText}
													</Typography>
												</Tooltip>
											)}
										</Box>
									</Box>
								);
							})}
						</Box>
					</Box>
				)}

				{!productionList.length && !consumptionList.length && (
					<Typography
						variant="caption"
						color="text.disabled"
						fontStyle="italic"
						textAlign="center"
						sx={{ py: 1, fontSize: "0.7rem" }}
					>
						No active flow
					</Typography>
				)}
			</Box>
		);

		const renderStorage = () => {
			const siteStorage = storageList.filter(
				(s) => !s.type || s.type === "site",
			);
			const warehouseStorage = storageList.filter(
				(s) => s.type && s.type.includes("warehouse"),
			);

			const renderStorageSection = (
				title: string,
				icon: React.ReactNode,
				list: typeof storageList,
				color: string,
			) => (
				<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
					<Typography
						variant="subtitle2"
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.5,
							mb: 0.25,
							color: color,
							fontWeight: 700,
							fontSize: "0.65rem",
						}}
					>
						{icon} {title}
					</Typography>
					{list.length > 0 ? (
						<Box sx={{ display: "grid", gap: 0.25 }}>
							{list.map((s) => (
								<Box
									key={s.ticker}
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										gap: 1,
										py: 0.15,
										borderBottom: `1px dashed ${alpha(theme.palette.divider, 0.05)}`,
									}}
								>
									<Box
										sx={{
											fontSize: "0.75em",
											display: "flex",
											alignItems: "center",
										}}
									>
										<MaterialBadge ticker={s.ticker} />
									</Box>
									<Tooltip
										title={
											smartFormat(s.amount).isAbbreviated
												? smartFormat(s.amount).full
												: ""
										}
										disableHoverListener={!smartFormat(s.amount).isAbbreviated}
									>
										<Typography
											variant="caption"
											fontWeight={500}
											color="text.primary"
											textAlign="right"
											fontSize="0.75rem"
											sx={{
												fontFamily: "monospace",
												fontVariantNumeric: "tabular-nums",
												textDecoration: smartFormat(s.amount).isAbbreviated
													? "underline dotted"
													: "none",
												textUnderlineOffset: "2px",
												cursor: smartFormat(s.amount).isAbbreviated
													? "help"
													: "default",
											}}
										>
											{smartFormat(s.amount).text}
										</Typography>
									</Tooltip>
								</Box>
							))}
						</Box>
					) : (
						<Typography
							variant="caption"
							color="text.disabled"
							fontStyle="italic"
							textAlign="center"
							sx={{ py: 1, fontSize: "0.7rem" }}
						>
							Empty storage
						</Typography>
					)}
				</Box>
			);

			return (
				<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
					{renderStorageSection(
						"SITE",
						<Layers size={12} />,
						siteStorage,
						theme.palette.info.main,
					)}
					{renderStorageSection(
						"WAREHOUSE",
						<Warehouse size={12} />,
						warehouseStorage,
						theme.palette.warning.main,
					)}
				</Box>
			);
		};

		return (
			<Paper
				onClick={handleClick}
				elevation={2}
				sx={{
					display: "flex",
					flexDirection: "column",
					borderRadius: 2,
					overflow: "hidden",
					border: `${borderWidth} ${borderStyle} ${alpha(statusColor, site.isLeased ? 0.6 : 0.3)}`,
					bgcolor: isDark
						? alpha("#000000", 0.4)
						: alpha(theme.palette.background.paper, 0.9),
					backdropFilter: "blur(12px)",
					transition: "all 0.1s ease",
					cursor: "pointer",
					width: "100%",
					"&:hover": {
						boxShadow: `0 4px 12px -2px ${alpha(statusColor, 0.3)}`,
						borderColor: statusColor,
					},
				}}
			>
				{/* --- HEADER --- */}
				<Box
					sx={{
						px: 1.5,
						py: 0.75,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						bgcolor: alpha(statusColor, 0.1),
						borderBottom: `1px solid ${alpha(statusColor, 0.15)}`,
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							overflow: "hidden",
							flexWrap: "wrap",
						}}
					>
						<Typography
							variant="body1"
							fontWeight={700}
							color="text.primary"
							noWrap
							sx={{ fontSize: "0.9rem" }}
						>
							{site.planet_name_alt === site.planet_name
								? site.planet_name
								: `${site.planet_name_alt} (${site.planet_name})`}
						</Typography>
					</Box>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Chip
							icon={<Flame size={10} />}
							label={`${(siteOverallCondition * 100).toFixed(0)}%`}
							size="small"
							sx={{
								height: 18,
								fontSize: "0.65rem",
								fontWeight: 600,
								bgcolor: alpha(conditionColor, 0.1),
								color: conditionColor,
								border: `1px solid ${alpha(conditionColor, 0.25)}`,
								"& .MuiChip-icon": { color: conditionColor },
							}}
						/>
						<ChevronRight
							size={14}
							color={theme.palette.text.secondary}
							style={{ opacity: 0.5 }}
						/>
					</Box>
				</Box>

				{/* --- BODY --- */}
				<Box
					sx={{
						p: 1,
						flex: 1,
						display: "flex",
						flexDirection: "column",
						gap: 0.75,
					}}
				>
					{/* Permits & Target Input */}
					<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
						<Box sx={{ flex: 1 }}>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 0.5,
										opacity: 0.7,
									}}
								>
									<Archive size={10} />
									<Typography
										variant="caption"
										fontWeight={600}
										fontSize="0.6rem"
									>
										PERMITS
									</Typography>
								</Box>
								<Typography
									variant="caption"
									fontWeight={600}
									color="text.primary"
									fontSize="0.7rem"
								>
									{site.invested_permits} / {site.maximum_permits}
								</Typography>
							</Box>
						</Box>

						<TextField
							label="Target"
							type="number"
							variant="outlined"
							size="small"
							value={targetDays}
							onChange={(e) => onTargetDaysChange(e.target.value)}
							onClick={(e) => e.stopPropagation()}
							slotProps={{
								input: {
									endAdornment: (
										<InputAdornment position="end">
											<Typography
												variant="subtitle2"
												color="text.secondary"
												sx={{ fontSize: "0.7rem", marginRight: 0.5 }}
											>
												d
											</Typography>
										</InputAdornment>
									),
								},
							}}
							sx={{
								width: 60,
								flexShrink: 0,
								"& .MuiInputBase-root": {
									fontSize: "0.75rem",
									borderRadius: 1,
									height: 24,
									paddingRight: 0,
								},
								"& .MuiInputLabel-root": {
									fontSize: "0.7rem",
									transform: "translate(6px, 4px) scale(1)",
								},
								"& .MuiInputLabel-shrink": {
									transform: "translate(6px, -6px) scale(0.85)",
								},
							}}
						/>
					</Box>

					<Divider sx={{ opacity: 0.2, my: 0.25 }} />

					<Box
						sx={{ borderBottom: 1, borderColor: "divider" }}
						onClick={(e) => e.stopPropagation()}
					>
						<Tabs
							value={tab}
							onChange={(_, newValue) => setTab(newValue)}
							centered
							aria-label="site data tabs"
							sx={{
								minHeight: 24,
								"& .MuiTab-root": {
									minHeight: 24,
									py: 0,
									px: 1,
									fontSize: "0.65rem",
									fontWeight: 600,
									transition: "0.2s",
									"&:hover": {
										bgcolor: alpha(theme.palette.primary.main, 0.1),
										borderRadius: 1,
									},
								},
							}}
						>
							<Tab label="Both" value="both" />
							<Tab label="Production" value="production" />
							<Tab label="Storage" value="storage" />
						</Tabs>
					</Box>

					{/* --- DATA SECTION --- */}
					<Box sx={{ flex: 1, minHeight: 60, mt: 0.5 }}>
						{tab === "production" && renderProductionFlows()}
						{tab === "storage" && renderStorage()}
						{tab === "both" && (
							<Box
								sx={{
									display: "flex",
									flexDirection: { xs: "column", sm: "row" },
									gap: 1,
								}}
							>
								<Box
									sx={{
										flex: 1.8,
										minWidth: 0,
										borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
										pr: 1,
									}}
								>
									{renderProductionFlows()}
								</Box>
								<Box sx={{ flex: 1, minWidth: 0 }}>{renderStorage()}</Box>
							</Box>
						)}
					</Box>
				</Box>

				{/* --- FOOTER: ACTIVE LINES --- */}
				<Box
					sx={{
						px: 1,
						py: 0.5,
						bgcolor: alpha(theme.palette.action.hover, 0.05),
						borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
						<Factory size={10} color={theme.palette.text.secondary} />
						<Typography
							variant="caption"
							fontWeight={600}
							color="text.secondary"
							fontSize="0.65rem"
						>
							{site.production_lines?.length || 0} Lines
						</Typography>
					</Box>
					{activeLines > 0 ? (
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<Box
								sx={{
									display: "flex",
									gap: 0.25,
									flexWrap: "wrap",
									justifyContent: "flex-end",
								}}
							>
								{activeProducts.map((ticker) => (
									<Chip
										key={ticker}
										label={ticker}
										size="small"
										variant="outlined"
										sx={{
											height: 14,
											fontSize: "0.55rem",
											fontWeight: 600,
											borderColor: alpha(theme.palette.info.main, 0.3),
											color: theme.palette.text.primary,
											px: 0,
											"& .MuiChip-label": { px: 0.5 },
										}}
									/>
								))}
							</Box>
							<Package size={10} color={theme.palette.info.main} />
						</Box>
					) : (
						<Typography
							variant="caption"
							color="text.disabled"
							fontSize="0.65rem"
						>
							Idle
						</Typography>
					)}
				</Box>
			</Paper>
		);
	},
);
