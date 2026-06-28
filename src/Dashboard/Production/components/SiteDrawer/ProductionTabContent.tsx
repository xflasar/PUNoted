import React, { useMemo } from "react";
import {
	Box,
	Typography,
	Paper,
	Stack,
	useTheme,
	alpha,
	Divider,
} from "@mui/material";
import {
	Factory,
	TrendingUp,
	DollarSign,
	ArrowDownCircle,
	ArrowUpCircle,
	Activity,
} from "lucide-react";
import { useGlobalData } from "../../../../context/globaldatacontext";
import { formatNumber } from "./utils";
import MaterialBadge from "../../../../COSM/components/MaterialBadge";
import type { SiteSummary } from "../types";

const Metric = ({
	label,
	value,
	icon: Icon,
	color = "text.primary",
	subValue,
}: any) => (
	<Box
		sx={{
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			gap: 0.25,
			minWidth: 60,
		}}
	>
		<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, opacity: 0.6 }}>
			<Icon size={10} color={color} />
			<Typography
				variant="caption"
				sx={{ fontSize: "0.6rem", fontWeight: 800 }}
			>
				{label}
			</Typography>
		</Box>
		<Typography
			variant="caption"
			sx={{ fontWeight: 900, fontSize: "0.75rem", color, lineHeight: 1.1 }}
		>
			{value}
		</Typography>
		{subValue && (
			<Typography
				variant="caption"
				sx={{
					fontWeight: 700,
					fontSize: "0.65rem",
					color: "text.secondary",
					lineHeight: 1,
				}}
			>
				{subValue}
			</Typography>
		)}
	</Box>
);

export const ProductionTabContent = ({ site }: { site: SiteSummary }) => {
	const theme = useTheme();
	const { marketData, getMatProps } = useGlobalData();
	const marketId = "IC1";

	const priceMap = useMemo(() => {
		const map: Record<string, number> = {};
		if (Array.isArray(marketData)) {
			marketData.forEach((d) => {
				map[d.Ticker] =
					(d[`${marketId}-AskPrice`] || 0) > 0
						? d[`${marketId}-AskPrice`] || 0
						: d[`${marketId}-Average`] || 0;
			});
		}
		return map;
	}, [marketData, marketId]);

	return (
		<Stack spacing={1.5} sx={{ p: { xs: 0, sm: 1 } }}>
			{(site.production_lines || []).map((line: any, idx: number) => {
				// 1. Aggregate Material Data for the Line
				const aggregated = useMemo(() => {
					const map: Record<
						string,
						{ flow: number; weight: number; volume: number }
					> = {};
					Object.entries(line.line_daily_flow).forEach(
						([ticker, flow]: any) => {
							const matProps = getMatProps(ticker);
							const weight = matProps ? matProps.weight : 1;
							const volume = matProps ? matProps.volume : 1;
							if (!map[ticker]) {
								map[ticker] = { flow: 0, weight: 0, volume: 0 };
							}
							map[ticker].flow += flow;
							map[ticker].weight += flow * weight;
							map[ticker].volume += flow * volume;
						},
					);
					return map;
				}, [line, getMatProps]);

				let totalCost = 0;
				let totalRevenue = 0;
				let massIn = 0,
					massOut = 0;
				let volIn = 0,
					volOut = 0;

				return (
					<Paper
						key={idx}
						variant="outlined"
						sx={{
							borderRadius: 1.5,
							overflow: "hidden",
							bgcolor: alpha(theme.palette.background.default, 0.4),
						}}
					>
						{/* --- HEADER --- */}
						<Box
							sx={{
								p: 1,
								px: 1.5,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								bgcolor: alpha(theme.palette.background.default, 0.6),
								borderBottom: `1px solid ${theme.palette.divider}`,
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Factory size={14} color={theme.palette.primary.main} />
								<Typography
									variant="subtitle2"
									fontWeight={900}
									sx={{ textTransform: "uppercase", fontSize: "0.8rem" }}
								>
									{line.type}
								</Typography>
							</Box>
							<Typography
								variant="caption"
								fontWeight={800}
								sx={{ opacity: 0.8, fontSize: "0.7rem" }}
							>
								Eff: {(line.efficiency * 100).toFixed(0)}%
							</Typography>
						</Box>

						{/* --- BODY (Container Query Flexbox) --- */}
						<Box
							sx={{
								p: 1.5,
								display: "flex",
								flexWrap: "wrap",
								gap: 3,
								alignItems: "flex-start",
							}}
						>
							{/* LEFT: Order Pipeline */}
							<Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
								{line.production_orders && line.production_orders.length > 0 ? (
									<Box
										sx={{
											display: "grid",
											gridTemplateColumns:
												"repeat(auto-fit, minmax(180px, 1fr))",
											gap: 0.75,
										}}
									>
										{line.production_orders.map((order: any, i: number) => {
											const isRunning = order.started !== null;
											return (
												<Box
													key={order.order_id || i}
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.5,
														opacity: isRunning ? 1 : 0.5,
														bgcolor: alpha(theme.palette.action.hover, 0.05),
														px: 1,
														py: 0.5,
														borderRadius: 1,
														borderLeft: isRunning
															? `2px solid ${theme.palette.primary.main}`
															: "2px solid transparent",
													}}
												>
													<Typography
														variant="caption"
														sx={{
															color: "text.disabled",
															fontWeight: 900,
															width: 18,
															textAlign: "right",
															fontSize: "0.65rem",
															mr: 0.5,
														}}
													>
														{i + 1}.
													</Typography>

													{/* Inputs */}
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 0.25,
															flexWrap: "wrap",
														}}
													>
														{order.production_recipe.inputs.length > 0 ? (
															order.production_recipe.inputs.map(
																(input: any, k: number) => (
																	<React.Fragment key={input.ticker}>
																		<Box
																			sx={{
																				transform: "scale(0.85)",
																				transformOrigin: "left center",
																				mr: -0.5,
																			}}
																		>
																			<MaterialBadge ticker={input.ticker} />
																		</Box>
																		{k <
																			order.production_recipe.inputs.length -
																				1 && (
																			<Typography
																				variant="caption"
																				color="text.disabled"
																				fontWeight={700}
																				sx={{ fontSize: "0.65rem", mx: 0.25 }}
																			>
																				+
																			</Typography>
																		)}
																	</React.Fragment>
																),
															)
														) : (
															<Typography
																variant="caption"
																color="text.disabled"
																fontWeight={600}
																sx={{ fontSize: "0.65rem" }}
															>
																None
															</Typography>
														)}
													</Box>

													<Typography
														variant="caption"
														color="text.disabled"
														sx={{ mx: 0.5, fontSize: "0.65rem" }}
													>
														→
													</Typography>

													{/* Outputs */}
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 0.25,
															flexWrap: "wrap",
														}}
													>
														{order.production_recipe.outputs.map(
															(output: any, k: number) => (
																<React.Fragment key={output.ticker}>
																	<Box
																		sx={{
																			transform: "scale(0.85)",
																			transformOrigin: "left center",
																			mr: -0.5,
																		}}
																	>
																		<MaterialBadge ticker={output.ticker} />
																	</Box>
																	{k <
																		order.production_recipe.outputs.length -
																			1 && (
																		<Typography
																			variant="caption"
																			color="text.disabled"
																			fontWeight={700}
																			sx={{ fontSize: "0.65rem", mx: 0.25 }}
																		>
																			,
																		</Typography>
																	)}
																</React.Fragment>
															),
														)}
													</Box>
												</Box>
											);
										})}
									</Box>
								) : (
									<Typography
										variant="caption"
										sx={{
											fontStyle: "italic",
											color: "text.disabled",
											fontSize: "0.65rem",
										}}
									>
										Line is currently idle.
									</Typography>
								)}
							</Box>

							{/* RIGHT: Material Ledger */}
							<Box sx={{ flex: "1 1 250px", minWidth: 0 }}>
								{/* Table Header */}
								<Box
									sx={{
										display: "flex",
										borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
										pb: 0.5,
										mb: 0.5,
										px: 0.5,
									}}
								>
									<Typography
										variant="caption"
										sx={{
											width: "20%",
											fontWeight: 800,
											color: "text.secondary",
											fontSize: "0.55rem",
										}}
									>
										TICKER
									</Typography>
									<Typography
										variant="caption"
										sx={{
											width: "26%",
											textAlign: "right",
											fontWeight: 800,
											color: "text.secondary",
											fontSize: "0.55rem",
										}}
									>
										NET FLOW
									</Typography>
									<Typography
										variant="caption"
										sx={{
											width: "28%",
											textAlign: "right",
											fontWeight: 800,
											color: "text.secondary",
											fontSize: "0.55rem",
										}}
									>
										MASS / VOL
									</Typography>
									<Typography
										variant="caption"
										sx={{
											width: "26%",
											textAlign: "right",
											fontWeight: 800,
											color: "text.secondary",
											fontSize: "0.55rem",
										}}
									>
										PROFIT / EXP
									</Typography>
								</Box>

								{/* Table Rows */}
								<Stack spacing={0}>
									{Object.keys(aggregated).length > 0 ? (
										Object.entries(aggregated).map(([ticker, data]: any) => {
											const price = priceMap[ticker] || 0;
											const val = data.flow * price;

											// Accumulate totals
											if (data.flow < 0) {
												totalCost += Math.abs(val);
												massIn += Math.abs(data.weight);
												volIn += Math.abs(data.volume);
											} else {
												totalRevenue += val;
												massOut += data.weight;
												volOut += data.volume;
											}

											const isPositive = data.flow > 0;

											return (
												<Box
													key={ticker}
													sx={{
														display: "flex",
														alignItems: "center",
														px: 0.5,
														py: 0.25,
														"&:hover": {
															bgcolor: alpha(theme.palette.action.hover, 0.1),
															borderRadius: 1,
														},
													}}
												>
													{/* 1. Ticker */}
													<Box
														sx={{
															width: "20%",
															display: "flex",
															alignItems: "center",
															gap: 0.5,
														}}
													>
														<Box
															sx={{
																transform: "scale(0.85)",
																transformOrigin: "left center",
																mr: -0.5,
															}}
														>
															<MaterialBadge ticker={ticker} />
														</Box>
													</Box>

													{/* 2. Flow */}
													<Typography
														variant="caption"
														sx={{
															width: "26%",
															textAlign: "right",
															fontWeight: 600,
															fontSize: "0.7rem",
															color: isPositive
																? "success.main"
																: "text.secondary",
														}}
													>
														{isPositive ? "+" : ""}
														{formatNumber(data.flow)}/d
													</Typography>

													{/* 3. Mass & Vol */}
													<Box
														sx={{
															width: "28%",
															textAlign: "right",
															display: "flex",
															flexDirection: "column",
														}}
													>
														<Typography
															variant="caption"
															sx={{
																fontWeight: 600,
																fontSize: "0.7rem",
																lineHeight: 1,
																opacity: 0.8,
															}}
														>
															{formatNumber(Math.abs(data.weight))} t
														</Typography>
														<Typography
															variant="caption"
															sx={{
																fontWeight: 600,
																fontSize: "0.6rem",
																lineHeight: 1,
																opacity: 0.5,
															}}
														>
															{formatNumber(Math.abs(data.volume))} m³
														</Typography>
													</Box>

													{/* 4. Value */}
													<Typography
														variant="caption"
														sx={{
															width: "26%",
															textAlign: "right",
															fontWeight: 600,
															fontSize: "0.7rem",
															color: isPositive ? "success.main" : "error.main",
														}}
													>
														{val.toFixed(0)}
													</Typography>
												</Box>
											);
										})
									) : (
										<Typography
											variant="caption"
											color="text.disabled"
											sx={{ fontStyle: "italic", px: 0.5, fontSize: "0.65rem" }}
										>
											No flow data available.
										</Typography>
									)}
								</Stack>
							</Box>
						</Box>

						<Divider />

						{/* --- ANALYTICS FOOTER --- */}
						<Box
							sx={{
								p: 1.5,
								bgcolor: alpha(theme.palette.background.default, 0.4),
								display: "flex",
								flexWrap: "wrap",
								justifyContent: "center",
								alignItems: "flex-start",
								gap: 3,
							}}
						>
							{/* Financial Group */}
							<Box
								sx={{
									display: "flex",
									gap: 3,
									flexWrap: "wrap",
									justifyContent: "center",
								}}
							>
								<Metric
									label="EARNINGS"
									value={totalRevenue.toFixed(0)}
									icon={DollarSign}
								/>
								<Metric
									label="EXPENSES"
									value={totalCost.toFixed(0)}
									icon={DollarSign}
									color="error.main"
								/>
								<Metric
									label="NET PROFIT"
									value={(totalRevenue - totalCost).toFixed(0)}
									icon={TrendingUp}
									color={
										totalRevenue - totalCost >= 0
											? "success.main"
											: "error.main"
									}
								/>
							</Box>

							{/* Visual Divider (Hidden on mobile) */}
							<Divider
								orientation="vertical"
								flexItem
								sx={{ display: { xs: "none", sm: "block" } }}
							/>

							{/* Logistics Group */}
							<Box
								sx={{
									display: "flex",
									gap: 3,
									flexWrap: "wrap",
									justifyContent: "center",
								}}
							>
								<Metric
									label="IMPORT (CONS)"
									value={`${formatNumber(massIn)} t`}
									subValue={`${formatNumber(volIn)} m³`}
									icon={ArrowDownCircle}
									color="warning.main"
								/>
								<Metric
									label="EXPORT (PROD)"
									value={`${formatNumber(massOut)} t`}
									subValue={`${formatNumber(volOut)} m³`}
									icon={ArrowUpCircle}
									color="success.main"
								/>
								<Metric
									label="STATUS"
									value={line.efficiency > 0.99 ? "Perfect" : "Needs Repairs"}
									icon={Activity}
									color={
										line.efficiency > 0.99 ? "success.main" : "text.secondary"
									}
								/>
							</Box>
						</Box>
					</Paper>
				);
			})}
		</Stack>
	);
};
