import React from "react";
import {
	Paper,
	Box,
	Typography,
	Chip,
	Tooltip,
	IconButton,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	alpha,
	useTheme,
	Stack,
} from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import type {
	ProductionSummaryItem,
	CorpMember,
	ProducerConsumerItem,
} from "../types";
import { CompactProductionRow } from "./compactproductionrow";
import {
	formatSmartNumber,
	isUserStale,
	extractRecipeMaterials,
	getBuildingTicker,
} from "../utils";

import MaterialBadge from "../../../cosm/components/materialbadge";

interface Props {
	category: string;
	items: ProductionSummaryItem[];
	isMobile: boolean;
	onHide: (cat: string) => void;
	isDrilldown?: boolean;
	drillType?: "prod" | "cons";
	onDrilldown: (row: ProductionSummaryItem, type: "prod" | "cons") => void;
	members?: CorpMember[];
}

export const CategoryCard = React.memo(
	({
		category,
		items,
		isMobile,
		onHide,
		isDrilldown = false,
		drillType,
		onDrilldown,
		members,
	}: Props) => {
		const theme = useTheme();
		const [drillSortDir, setDrillSortDir] = React.useState<"desc" | "asc">(
			"desc",
		);
		const [drillDefaultExpanded, setDrillDefaultExpanded] =
			React.useState<boolean>(
				() =>
					localStorage.getItem("corp_drilldown_default_expanded") === "true",
			);
		const [drillExpandedUsers, setDrillExpandedUsers] = React.useState<
			Record<string, boolean>
		>({});

		if (isDrilldown && items.length > 0 && drillType) {
			const subItems: ProducerConsumerItem[] = items.flatMap((it) =>
				drillType === "prod" ? it.producers || [] : it.consumers || [],
			);
			const materialTicker =
				(items[0] as any)?.materialTicker || category.split(" ")[0];
			const color = drillType === "prod" ? "success" : "error";
			const isProd = drillType === "prod" || color === "success";
			const accentColor = isProd ? "#81C784" : "#FF8A80";

			// Group subItems by User (player) and correlate recipes per site
			const userMap = new Map<
				string,
				{
					player: string;
					totalAmount: number;
					batchActive: number;
					batchQueued: number;
					isAccurate: boolean;
					planets: Array<{
						item: ProducerConsumerItem;
						recipes: Array<{
							recipeKey: string;
							building?: string;
							dailyOutput: number;
							dailyCycles: number;
							inputs?: Record<string, number>;
						}>;
					}>;
				}
			>();

			const userRecipes = (items[0] as any)?.userRecipesUsed || [];

			subItems.forEach((i) => {
				if (!userMap.has(i.player)) {
					userMap.set(i.player, {
						player: i.player,
						totalAmount: 0,
						batchActive: 0,
						batchQueued: 0,
						isAccurate: i.isAccurate,
						planets: [],
					});
				}
				const uGroup = userMap.get(i.player)!;
				uGroup.totalAmount += i.amount;
				const activeBatch = isProd
					? i.batchProdActive || 0
					: i.batchConsActive || 0;
				const queuedBatch = isProd
					? i.batchProdQueued || 0
					: i.batchConsQueued || 0;
				uGroup.batchActive += activeBatch;
				uGroup.batchQueued += queuedBatch;

				const matchedRecipes = userRecipes
					.filter((rec: any) => {
						const userMatches = rec.users?.some(
							(u: any) => u.player === i.player && u.loc === i.loc,
						);
						if (!userMatches) return false;

						// For PRODUCERS: Check if materialTicker is an OUTPUT of the recipe
						if (drillType === "prod") {
							if (rec.outputs && Object.keys(rec.outputs).length > 0) {
								return Boolean(rec.outputs[materialTicker]);
							}
							// Fallback if outputs map is absent: check recipeKey (format: building:inputs=>outputs)
							const arrowIdx = rec.recipeKey.indexOf("=>");
							if (arrowIdx !== -1) {
								const outPart = rec.recipeKey.slice(arrowIdx + 2);
								return outPart
									.split("-")
									.some(
										(part: string) =>
											part.split("x")[1] === materialTicker ||
											part === materialTicker,
									);
							}
							return true;
						}
						// For CONSUMERS: Check if materialTicker is an INPUT of the recipe
						if (drillType === "cons") {
							if (rec.inputs && Object.keys(rec.inputs).length > 0) {
								return Boolean(rec.inputs[materialTicker]);
							}
							// Fallback if inputs map is absent: check recipeKey (format: building:inputs=>outputs)
							const colonIdx = rec.recipeKey.indexOf(":");
							const arrowIdx = rec.recipeKey.indexOf("=>");
							if (colonIdx !== -1 && arrowIdx !== -1) {
								const inPart = rec.recipeKey.slice(colonIdx + 1, arrowIdx);
								return inPart
									.split("-")
									.some(
										(part: string) =>
											part.split("x")[1] === materialTicker ||
											part === materialTicker,
									);
							}
							return true;
						}
						return true;
					})
					.map((rec: any) => {
						const uEntry = rec.users?.find(
							(u: any) => u.player === i.player && u.loc === i.loc,
						);
						return {
							recipeKey: rec.recipeKey,
							building: rec.building,
							dailyOutput: uEntry ? uEntry.dailyOutput : rec.dailyOutput,
							dailyCycles: uEntry ? uEntry.dailyCycles : rec.dailyCycles,
							inputs: rec.inputs,
							outputs:
								(rec as any).outputs ||
								(rec.outputTicker
									? { [rec.outputTicker]: rec.outputAmount }
									: undefined),
						};
					});

				uGroup.planets.push({
					item: i,
					recipes: matchedRecipes,
				});
			});

			const userGroups = Array.from(userMap.values()).sort(
				(a, b) => b.totalAmount - a.totalAmount,
			);
			userGroups.forEach((g) => {
				g.planets.sort((a, b) =>
					drillSortDir === "desc"
						? b.item.amount - a.item.amount
						: a.item.amount - b.item.amount,
				);
			});

			return (
				<Paper
					elevation={0}
					sx={{
						bgcolor: "rgba(10, 12, 20, 0.95)",
						border: "1px solid rgba(255, 255, 255, 0.08)",
						p: 1,
						borderRadius: 1.5,
						height: "100%",
						display: "flex",
						flexDirection: "column",
						width: "100%",
						boxSizing: "border-box",
						"& .mat": {
							fontSize: "0.72rem",
							minWidth: "2.4em",
							lineHeight: "1.3em",
							px: "3px",
							borderRadius: "2px",
						},
					}}
				>
					{/* Header */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							pb: 0.75,
							mb: 0.75,
							borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
							gap: 1,
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.75,
								minWidth: 0,
							}}
						>
							<MaterialBadge ticker={materialTicker} />
							<Typography
								variant="caption"
								sx={{
									fontSize: "0.75rem",
									color: accentColor,
									textTransform: "uppercase",
									letterSpacing: "0.05em",
									fontWeight: 500,
								}}
							>
								{drillType === "prod" ? "Producers" : "Consumers"}
							</Typography>
							<Typography
								variant="caption"
								sx={{
									fontSize: "0.7rem",
									color: "text.secondary",
									px: 0.6,
									py: 0.1,
									borderRadius: 1,
									bgcolor: "rgba(255, 255, 255, 0.05)",
								}}
							>
								{userGroups.length}
							</Typography>
						</Box>

						{/* Action Buttons */}
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								flexShrink: 0,
							}}
						>
							<Box
								component="button"
								onClick={() => {
									const anyExpanded = userGroups.some(
										(g) => drillExpandedUsers[g.player] ?? drillDefaultExpanded,
									);
									const nextState = !anyExpanded;
									const updated: Record<string, boolean> = {};
									userGroups.forEach((g) => {
										updated[g.player] = nextState;
									});
									setDrillExpandedUsers(updated);
								}}
								sx={{
									background: "none",
									border: "1px solid rgba(255, 255, 255, 0.1)",
									borderRadius: 1,
									color: "text.secondary",
									fontSize: "0.65rem",
									px: 0.6,
									py: 0.2,
									cursor: "pointer",
									"&:hover": {
										color: "text.primary",
										bgcolor: "rgba(255,255,255,0.05)",
									},
								}}
							>
								{userGroups.some(
									(g) => drillExpandedUsers[g.player] ?? drillDefaultExpanded,
								)
									? "Collapse all"
									: "Expand all"}
							</Box>

							<Box
								component="button"
								onClick={() =>
									setDrillSortDir((prev) => (prev === "desc" ? "asc" : "desc"))
								}
								sx={{
									background: "none",
									border: "1px solid rgba(255, 255, 255, 0.1)",
									borderRadius: 1,
									color: "text.secondary",
									fontSize: "0.65rem",
									px: 0.6,
									py: 0.2,
									cursor: "pointer",
									"&:hover": {
										color: "text.primary",
										bgcolor: "rgba(255,255,255,0.05)",
									},
								}}
							>
								{drillSortDir === "desc" ? "Highest" : "Lowest"}
							</Box>

							<Box
								component="button"
								onClick={() => onHide(category)}
								sx={{
									background: "none",
									border: "1px solid rgba(255, 255, 255, 0.1)",
									borderRadius: 1,
									color: "text.secondary",
									fontSize: "0.7rem",
									px: 0.6,
									py: 0.15,
									cursor: "pointer",
									lineHeight: 1,
									"&:hover": {
										color: "error.main",
										borderColor: "rgba(255, 100, 100, 0.3)",
									},
								}}
								title="Close"
							>
								✕
							</Box>
						</Box>
					</Box>

					{/* Users List */}
					<Stack
						spacing={0.4}
						sx={{ overflowY: "auto", flexGrow: 1, pr: 0.25 }}
					>
						{userGroups.length > 0 ? (
							userGroups.map((uGroup) => {
								const memberInfo = members?.find(
									(m) =>
										m.companyName === uGroup.player ||
										m.companyCode === uGroup.player,
								);
								const stale = memberInfo
									? isUserStale(memberInfo.lastActive)
									: false;
								const isExpanded =
									drillExpandedUsers[uGroup.player] ?? drillDefaultExpanded;

								return (
									<Box
										key={uGroup.player}
										sx={{
											borderRadius: 1,
											bgcolor: "rgba(255, 255, 255, 0.02)",
											border: "1px solid rgba(255, 255, 255, 0.05)",
											overflow: "hidden",
										}}
									>
										{/* User Accordion Header */}
										<Box
											onClick={() =>
												setDrillExpandedUsers((prev) => ({
													...prev,
													[uGroup.player]: !(
														prev[uGroup.player] ?? drillDefaultExpanded
													),
												}))
											}
											sx={{
												py: 0.4,
												px: 0.75,
												bgcolor: isExpanded
													? "rgba(255, 255, 255, 0.04)"
													: "transparent",
												cursor: "pointer",
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												userSelect: "none",
												"&:hover": { bgcolor: "rgba(255, 255, 255, 0.06)" },
											}}
										>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 0.75,
													minWidth: 0,
												}}
											>
												<Typography
													variant="caption"
													noWrap
													sx={{
														color: stale ? "warning.main" : "text.primary",
														fontSize: "0.75rem",
														fontWeight: 500,
													}}
												>
													{uGroup.player}
												</Typography>
												<Typography
													variant="caption"
													sx={{
														fontSize: "0.65rem",
														color: "text.secondary",
													}}
												>
													{uGroup.planets.length} site
													{uGroup.planets.length > 1 ? "s" : ""}
												</Typography>
											</Box>

											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 0.75,
												}}
											>
												{(uGroup.batchActive > 0 || uGroup.batchQueued > 0) && (
													<Typography
														variant="caption"
														sx={{
															fontSize: "0.65rem",
															color: "#FFB74D",
														}}
													>
														+{Math.round(uGroup.batchActive)}
														{uGroup.batchQueued > 0
															? ` (${Math.round(uGroup.batchQueued)})`
															: ""}
													</Typography>
												)}
												<Typography
													variant="caption"
													sx={{
														color: accentColor,
														fontSize: "0.75rem",
														fontWeight: 500,
													}}
												>
													{formatSmartNumber(uGroup.totalAmount)}
												</Typography>
												<Typography
													variant="caption"
													sx={{
														color: "text.secondary",
														fontSize: "0.6rem",
														width: 10,
														textAlign: "center",
													}}
												>
													{isExpanded ? "▲" : "▼"}
												</Typography>
											</Box>
										</Box>

										{/* Sites Details */}
										{isExpanded && (
											<Stack
												spacing={0.3}
												sx={{
													p: 0.5,
													pt: 0.3,
													borderTop: "1px solid rgba(255, 255, 255, 0.04)",
												}}
											>
												{uGroup.planets.map(
													({ item: pItem, recipes }, pIdx) => {
														const bActive = isProd
															? pItem.batchProdActive || 0
															: pItem.batchConsActive || 0;
														const bQueued = isProd
															? pItem.batchProdQueued || 0
															: pItem.batchConsQueued || 0;

														return (
															<Box
																key={pIdx}
																sx={{
																	p: 0.4,
																	px: 0.6,
																	borderRadius: 0.75,
																	bgcolor: "rgba(0, 0, 0, 0.25)",
																}}
															>
																<Box
																	sx={{
																		display: "flex",
																		justifyContent: "space-between",
																		alignItems: "center",
																	}}
																>
																	<Typography
																		variant="caption"
																		sx={{
																			color: "text.secondary",
																			fontSize: "0.7rem",
																		}}
																	>
																		{pItem.loc}
																	</Typography>
																	<Box
																		sx={{
																			display: "flex",
																			alignItems: "center",
																			gap: 0.5,
																		}}
																	>
																		{(bActive > 0 || bQueued > 0) && (
																			<Typography
																				variant="caption"
																				sx={{
																					fontSize: "0.62rem",
																					color: "#FFB74D",
																				}}
																			>
																				+{Math.round(bActive)}
																				{bQueued > 0
																					? ` (${Math.round(bQueued)})`
																					: ""}
																			</Typography>
																		)}
																		<Typography
																			variant="caption"
																			sx={{
																				color: accentColor,
																				fontSize: "0.72rem",
																			}}
																		>
																			{formatSmartNumber(pItem.amount)}
																		</Typography>
																	</Box>
																</Box>

																{recipes.length > 0 && (
																	<Stack
																		spacing={0.2}
																		sx={{
																			mt: 0.25,
																			pt: 0.25,
																			borderTop:
																				"1px solid rgba(255, 255, 255, 0.03)",
																		}}
																	>
																		{recipes.map((rec, rIdx) => {
																			const {
																				inputMaterials,
																				outputMaterials,
																			} = extractRecipeMaterials(
																				rec.inputs,
																				(rec as any).outputs,
																			);

																			return (
																				<Box
																					key={rIdx}
																					sx={{
																						display: "flex",
																						alignItems: "center",
																						justifyContent: "space-between",
																						gap: 0.5,
																						py: 0.15,
																					}}
																				>
																					{/* Building + Formula */}
																					<Box
																						sx={{
																							display: "flex",
																							alignItems: "center",
																							gap: 0.35,
																							flexWrap: "wrap",
																							minWidth: 0,
																						}}
																					>
																						{rec.building && (
																							<Typography
																								variant="caption"
																								sx={{
																									color: "text.secondary",
																									fontSize: "0.62rem",
																									fontWeight: 500,
																									letterSpacing: "0.04em",
																								}}
																							>
																								{getBuildingTicker(
																									rec.building,
																								)}
																								:
																							</Typography>
																						)}

																						{inputMaterials.map((inp, idx) => (
																							<Box
																								key={inp.ticker}
																								sx={{
																									display: "inline-flex",
																									alignItems: "center",
																									gap: 0.2,
																								}}
																							>
																								{idx > 0 && (
																									<Typography
																										variant="caption"
																										sx={{
																											color: "text.disabled",
																											fontSize: "0.6rem",
																										}}
																									>
																										+
																									</Typography>
																								)}
																								<MaterialBadge
																									ticker={inp.ticker}
																								/>
																								<Typography
																									variant="caption"
																									sx={{
																										color: "text.secondary",
																										fontSize: "0.62rem",
																									}}
																								>
																									{inp.factor < 1
																										? inp.factor.toFixed(1)
																										: Math.round(inp.factor)}
																									/d
																								</Typography>
																							</Box>
																						))}

																						{outputMaterials.length > 0 && (
																							<>
																								<Typography
																									variant="caption"
																									sx={{
																										color: "text.disabled",
																										fontSize: "0.6rem",
																										px: 0.1,
																									}}
																								>
																									➔
																								</Typography>
																								{outputMaterials.map(
																									(out, idx) => (
																										<Box
																											key={out.ticker}
																											sx={{
																												display: "inline-flex",
																												alignItems: "center",
																												gap: 0.2,
																											}}
																										>
																											{idx > 0 && (
																												<Typography
																													variant="caption"
																													sx={{
																														color:
																															"text.disabled",
																														fontSize: "0.6rem",
																													}}
																												>
																													+
																												</Typography>
																											)}
																											<MaterialBadge
																												ticker={out.ticker}
																											/>
																											<Typography
																												variant="caption"
																												sx={{
																													color:
																														"text.secondary",
																													fontSize: "0.62rem",
																												}}
																											>
																												{out.factor < 1
																													? out.factor.toFixed(
																															1,
																														)
																													: Math.round(
																															out.factor,
																														)}
																												/d
																											</Typography>
																										</Box>
																									),
																								)}
																							</>
																						)}
																					</Box>

																					{/* Daily Output / Cycles */}
																					<Typography
																						variant="caption"
																						sx={{
																							color: "text.disabled",
																							fontSize: "0.6rem",
																							whiteSpace: "nowrap",
																							ml: "auto",
																						}}
																					>
																						{formatSmartNumber(rec.dailyOutput)}
																						/d ({rec.dailyCycles.toFixed(
																							1,
																						)}{" "}
																						cyc)
																					</Typography>
																				</Box>
																			);
																		})}
																	</Stack>
																)}
															</Box>
														);
													},
												)}
											</Stack>
										)}
									</Box>
								);
							})
						) : (
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									textAlign: "center",
									py: 2,
								}}
							>
								No {drillType === "prod" ? "producers" : "consumers"} found.
							</Typography>
						)}
					</Stack>
				</Paper>
			);
		}

		return (
			<Paper
				elevation={0}
				sx={{
					bgcolor: "rgba(10, 10, 20, 0.45)",
					backdropFilter: "blur(12px)",
					WebkitBackdropFilter: "blur(12px)",
					border: "1px solid rgba(123, 104, 238, 0.15)",
					borderRadius: 2,
					overflowX: "hidden",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Box
					sx={{
						p: 0.75,
						px: 1.5,
						bgcolor: "rgba(123, 104, 238, 0.08)",
						borderBottom: "1px solid rgba(123, 104, 238, 0.15)",
						display: "flex",
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "nowrap",
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							gap: 1,
							flexWrap: "nowrap",
							minWidth: 0,
							overflow: "hidden",
						}}
					>
						<Typography
							variant="subtitle2"
							noWrap
							sx={{
								fontWeight: "bold",
								fontSize: "0.85rem",
								color: "primary.light",
							}}
						>
							{category}
						</Typography>
						<Chip
							label={items.length}
							size="small"
							sx={{
								height: 18,
								fontSize: "0.7rem",
								bgcolor: alpha(theme.palette.background.default, 0.5),
								fontWeight: "bold",
								flexShrink: 0,
							}}
						/>
					</Box>
					<Tooltip title="Hide Category">
						<IconButton
							size="small"
							onClick={() => onHide(category)}
							sx={{ color: "text.secondary", p: 0.5, flexShrink: 0 }}
						>
							<VisibilityOffIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				</Box>
				<Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
					<colgroup>
						<col style={{ width: "56px" }} />
						<col style={{ width: "23%" }} />
						<col style={{ width: "23%" }} />
						<col style={{ width: "30%" }} />
						<col style={{ width: "14%" }} />
					</colgroup>
					<TableHead>
						<TableRow>
							<TableCell
								align="center"
								sx={{
									fontSize: "0.68rem",
									fontWeight: "bold",
									color: "text.secondary",
									px: 0.25,
									py: 0.5,
								}}
							>
								TCK
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontSize: "0.68rem",
									fontWeight: "bold",
									color: "text.secondary",
									px: 0.25,
									py: 0.5,
								}}
							>
								PROD
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontSize: "0.68rem",
									fontWeight: "bold",
									color: "text.secondary",
									px: 0.25,
									py: 0.5,
								}}
							>
								CONS
							</TableCell>
							<TableCell
								align="right"
								sx={{
									fontSize: "0.68rem",
									fontWeight: "bold",
									color: "text.secondary",
									px: 0.25,
									py: 0.5,
								}}
							>
								NET
							</TableCell>
							<TableCell
								align="center"
								sx={{
									fontSize: "0.68rem",
									fontWeight: "bold",
									color: "text.secondary",
									px: 0.25,
									py: 0.5,
								}}
							>
								%
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{items.map((row, i) => (
							<CompactProductionRow
								key={row.ticker + i}
								row={row}
								theme={theme}
								isMobile={isMobile}
								useFullNumbers={false}
								isGridMode={true}
								isDrilldown={false}
								onDrilldown={onDrilldown}
								members={members}
							/>
						))}
					</TableBody>
				</Table>
			</Paper>
		);
	},
);
