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
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpIcon from "@mui/icons-material/Help";
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
		const [drillExpandedUsers, setDrillExpandedUsers] = React.useState<
			Record<string, boolean>
		>({});

		if (isDrilldown && items.length > 0 && drillType) {
			const item = items[0];
			const subItems: ProducerConsumerItem[] =
				drillType === "prod" ? item.producers : item.consumers;
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

			const userRecipes = item?.userRecipesUsed || [];

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
					.filter((rec) => {
						const userMatches = rec.users?.some(
							(u) => u.player === i.player && u.loc === i.loc,
						);
						if (!userMatches) return false;

						// For PRODUCERS: Check if item.ticker is an OUTPUT of the recipe
						if (drillType === "prod") {
							if (rec.outputs && Object.keys(rec.outputs).length > 0) {
								return Boolean(rec.outputs[item.ticker]);
							}
							// Fallback if outputs map is absent: check recipeKey (format: building:inputs=>outputs)
							const arrowIdx = rec.recipeKey.indexOf("=>");
							if (arrowIdx !== -1) {
								const outPart = rec.recipeKey.slice(arrowIdx + 2);
								return outPart
									.split("-")
									.some(
										(part) =>
											part.split("x")[1] === item.ticker ||
											part === item.ticker,
									);
							}
							return true;
						}
						// For CONSUMERS: Check if item.ticker is an INPUT of the recipe
						if (drillType === "cons") {
							if (rec.inputs && Object.keys(rec.inputs).length > 0) {
								return Boolean(rec.inputs[item.ticker]);
							}
							// Fallback if inputs map is absent: check recipeKey (format: building:inputs=>outputs)
							const colonIdx = rec.recipeKey.indexOf(":");
							const arrowIdx = rec.recipeKey.indexOf("=>");
							if (colonIdx !== -1 && arrowIdx !== -1) {
								const inPart = rec.recipeKey.slice(colonIdx + 1, arrowIdx);
								return inPart
									.split("-")
									.some(
										(part) =>
											part.split("x")[1] === item.ticker ||
											part === item.ticker,
									);
							}
							return true;
						}
						return true;
					})
					.map((rec) => {
						const uEntry = rec.users?.find(
							(u) => u.player === i.player && u.loc === i.loc,
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

				if (process.env.NODE_ENV !== "production") {
					console.log(
						`[CorpProd Debug] Player: ${i.player} | Loc: ${i.loc} | Matched Recipes:`,
						matchedRecipes,
						{
							totalUserRecipes: userRecipes.length,
							availableRecipes: userRecipes.map((r) => ({
								key: r.recipeKey,
								users: r.users,
							})),
						},
					);
				}

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
						bgcolor: "#06060e",
						backdropFilter: "blur(16px)",
						WebkitBackdropFilter: "blur(16px)",
						border: "1px solid rgba(123, 104, 238, 0.25)",
						p: 1.25,
						borderRadius: 2,
						height: "100%",
						display: "flex",
						flexDirection: "column",
						width: "100%",
						boxSizing: "border-box",
						"& ::-webkit-scrollbar": {
							width: "4px",
						},
						"& ::-webkit-scrollbar-track": {
							background: "rgba(0, 0, 0, 0.2)",
						},
						"& ::-webkit-scrollbar-thumb": {
							background: "rgba(123, 104, 238, 0.4)",
							borderRadius: "4px",
							"&:hover": {
								background: "rgba(123, 104, 238, 0.7)",
							},
						},
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							mb: 1,
							pb: 0.6,
							borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							{item && <MaterialBadge ticker={item.ticker} />}
							<Typography
								variant="subtitle2"
								noWrap
								sx={{
									fontWeight: 800,
									fontSize: "0.85rem",
									color: accentColor,
									textTransform: "uppercase",
									letterSpacing: "0.06em",
								}}
							>
								{drillType === "prod" ? "PRODUCERS" : "CONSUMERS"}
							</Typography>
							<Chip
								label={userGroups.length}
								size="small"
								sx={{
									height: 18,
									fontSize: "0.7rem",
									bgcolor: alpha(theme.palette[color].main, 0.15),
									color: accentColor,
									fontWeight: "bold",
									border: `1px solid ${alpha(theme.palette[color].main, 0.3)}`,
									flexShrink: 0,
								}}
							/>
						</Box>

						<Stack direction="row" spacing={0.5} alignItems="center">
							<Chip
								size="small"
								label={
									drillSortDir === "desc"
										? "Sort: High ➔ Low"
										: "Sort: Low ➔ High"
								}
								onClick={() =>
									setDrillSortDir((prev) => (prev === "desc" ? "asc" : "desc"))
								}
								sx={{
									height: 20,
									fontSize: "0.6rem",
									fontWeight: 700,
									bgcolor: "rgba(255,255,255,0.06)",
									color: "rgba(255,255,255,0.8)",
									cursor: "pointer",
									border: "1px solid rgba(255,255,255,0.12)",
									"&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
								}}
							/>
							<Tooltip title="Close Card">
								<IconButton
									size="small"
									onClick={() => onHide(category)}
									sx={{ color: "text.secondary", p: 0.5, flexShrink: 0 }}
								>
									<CloseIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						</Stack>
					</Box>

					{/* Expandable Categories per User */}
					<Stack
						spacing={0.75}
						sx={{ overflowY: "auto", flexGrow: 1, pr: 0.5 }}
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
								const isExpanded = drillExpandedUsers[uGroup.player] !== false;

								return (
									<Box
										key={uGroup.player}
										sx={{
											borderRadius: 1.5,
											bgcolor: "rgba(20, 20, 36, 0.6)",
											border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
											overflow: "hidden",
										}}
									>
										{/* User Category Header */}
										<Box
											onClick={() =>
												setDrillExpandedUsers((prev) => ({
													...prev,
													[uGroup.player]:
														prev[uGroup.player] !== undefined
															? !prev[uGroup.player]
															: false,
												}))
											}
											sx={{
												p: 0.75,
												px: 1,
												bgcolor: "rgba(255, 255, 255, 0.03)",
												cursor: "pointer",
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												userSelect: "none",
												"&:hover": { bgcolor: "rgba(255, 255, 255, 0.06)" },
											}}
										>
											<Stack
												direction="row"
												spacing={1}
												alignItems="center"
												sx={{ minWidth: 0 }}
											>
												{uGroup.isAccurate ? (
													<CheckCircleIcon
														sx={{ fontSize: 13, color: "success.main" }}
													/>
												) : (
													<HelpIcon
														sx={{ fontSize: 13, color: "text.disabled" }}
													/>
												)}
												<Typography
													variant="caption"
													noWrap
													sx={{
														color: stale ? "warning.main" : "text.primary",
														fontWeight: 800,
														fontSize: "0.78rem",
													}}
												>
													{uGroup.player}
												</Typography>
												<Chip
													size="small"
													label={`${uGroup.planets.length} site${uGroup.planets.length > 1 ? "s" : ""}`}
													sx={{
														height: 16,
														fontSize: "0.58rem",
														fontWeight: 700,
														bgcolor: "rgba(255,255,255,0.08)",
														color: "text.secondary",
													}}
												/>
											</Stack>

											<Stack direction="row" spacing={0.75} alignItems="center">
												{(uGroup.batchActive > 0 || uGroup.batchQueued > 0) && (
													<Chip
														size="small"
														label={`+${Math.round(uGroup.batchActive)}${uGroup.batchQueued > 0 ? ` (${Math.round(uGroup.batchQueued)})` : ""}`}
														sx={{
															height: 16,
															fontSize: "0.58rem",
															fontWeight: 800,
															bgcolor: alpha("#FFB74D", 0.15),
															color: "#FFB74D",
															border: "1px solid rgba(255, 183, 77, 0.3)",
															px: 0.2,
														}}
													/>
												)}
												<Typography
													variant="caption"
													sx={{
														color: accentColor,
														fontWeight: 800,
														fontSize: "0.8rem",
													}}
												>
													{formatSmartNumber(uGroup.totalAmount)}
												</Typography>
												<Typography
													variant="caption"
													sx={{
														color: "text.secondary",
														fontSize: "0.7rem",
														ml: 0.25,
													}}
												>
													{isExpanded ? "▲" : "▼"}
												</Typography>
											</Stack>
										</Box>

										{/* Collapsible Sites List */}
										{isExpanded && (
											<Stack
												spacing={0.5}
												sx={{
													p: 0.75,
													pt: 0.5,
													borderTop: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
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
																	p: 0.6,
																	borderRadius: 1,
																	bgcolor: "rgba(13, 13, 25, 0.4)",
																	border: "1px solid rgba(255, 255, 255, 0.03)",
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
																			fontWeight: 700,
																			color: "primary.light",
																			fontSize: "0.68rem",
																		}}
																	>
																		📍 {pItem.loc}
																	</Typography>
																	<Stack
																		direction="row"
																		spacing={0.5}
																		alignItems="center"
																	>
																		{(bActive > 0 || bQueued > 0) && (
																			<Chip
																				size="small"
																				label={`+${Math.round(bActive)}${bQueued > 0 ? ` (${Math.round(bQueued)})` : ""}`}
																				sx={{
																					height: 14,
																					fontSize: "0.55rem",
																					fontWeight: 800,
																					bgcolor: alpha("#FFB74D", 0.12),
																					color: "#FFB74D",
																					border:
																						"1px solid rgba(255, 183, 77, 0.25)",
																					px: 0.15,
																				}}
																			/>
																		)}
																		<Typography
																			variant="caption"
																			sx={{
																				fontWeight: 800,
																				color: accentColor,
																				fontSize: "0.74rem",
																			}}
																		>
																			{formatSmartNumber(pItem.amount)}
																		</Typography>
																	</Stack>
																</Box>

																{recipes.length > 0 && (
																	<Stack
																		spacing={0.2}
																		sx={{
																			mt: 0.35,
																			pt: 0.3,
																			borderTop:
																				"1px dashed rgba(255,255,255,0.06)",
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
																						py: 0.2,
																						px: 0.5,
																						borderRadius: 0.5,
																						bgcolor:
																							"rgba(186, 104, 200, 0.05)",
																						display: "flex",
																						alignItems: "center",
																						justifyContent: "space-between",
																						gap: 0.5,
																						flexWrap: "wrap",
																					}}
																				>
																					{/* Left side: Building label + Formula */}
																					<Box
																						sx={{
																							display: "flex",
																							alignItems: "center",
																							gap: 0.4,
																							flexWrap: "wrap",
																							minWidth: 0,
																						}}
																					>
																						{rec.building && (
																							<Typography
																								variant="caption"
																								sx={{
																									fontWeight: 800,
																									color: "#BA68C8",
																									fontSize: "0.58rem",
																									mr: 0.25,
																								}}
																							>
																								{rec.building}:
																							</Typography>
																						)}

																						<Box
																							sx={{
																								display: "flex",
																								alignItems: "center",
																								gap: 0.2,
																								flexWrap: "wrap",
																								transform: "scale(0.88)",
																								transformOrigin: "left center",
																							}}
																						>
																							{inputMaterials.map(
																								(inp, idx) => (
																									<Box
																										key={inp.ticker}
																										sx={{
																											display: "inline-flex",
																											alignItems: "center",
																											gap: 0.15,
																										}}
																									>
																										{idx > 0 && (
																											<Typography
																												variant="caption"
																												sx={{
																													color:
																														"rgba(186, 104, 200, 0.7)",
																													fontWeight: 800,
																													fontSize: "0.55rem",
																													px: 0.05,
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
																												color:
																													"rgba(255,255,255,0.65)",
																												fontSize: "0.55rem",
																												fontWeight: 700,
																											}}
																										>
																											{inp.factor < 1
																												? inp.factor.toFixed(1)
																												: Math.round(
																														inp.factor,
																													)}
																											/d
																										</Typography>
																									</Box>
																								),
																							)}

																							{outputMaterials.length > 0 && (
																								<>
																									<Typography
																										variant="caption"
																										sx={{
																											color: "#BA68C8",
																											fontWeight: 800,
																											fontSize: "0.55rem",
																											px: 0.15,
																										}}
																									>
																										➔
																									</Typography>
																									{outputMaterials.map(
																										(out, idx) => (
																											<Box
																												key={out.ticker}
																												sx={{
																													display:
																														"inline-flex",
																													alignItems: "center",
																													gap: 0.15,
																												}}
																											>
																												{idx > 0 && (
																													<Typography
																														variant="caption"
																														sx={{
																															color:
																																"rgba(186, 104, 200, 0.7)",
																															fontWeight: 800,
																															fontSize:
																																"0.55rem",
																															px: 0.05,
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
																														color: "#64FFDA",
																														fontSize: "0.55rem",
																														fontWeight: 700,
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
																					</Box>

																					{/* Right side: Cycles & output info */}
																					<Typography
																						variant="caption"
																						sx={{
																							color: "rgba(255,255,255,0.5)",
																							fontSize: "0.55rem",
																							ml: "auto",
																							whiteSpace: "nowrap",
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
									fontStyle: "italic",
									color: "text.disabled",
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
						<col style={{ width: "54px" }} />
						<col style={{ width: "23%" }} />
						<col style={{ width: "23%" }} />
						<col style={{ width: "auto" }} />
						<col style={{ width: "36px" }} />
					</colgroup>
					<TableHead>
						<TableRow>
							<TableCell
								align="center"
								sx={{
									fontSize: "0.7rem",
									fontWeight: "bold",
									color: "text.secondary",
									px: 0.5,
								}}
							>
								TCK
							</TableCell>
							<TableCell
								align="center"
								sx={{
									fontSize: "0.7rem",
									fontWeight: "bold",
									color: "text.secondary",
									px: 0.5,
								}}
							>
								PROD
							</TableCell>
							<TableCell
								align="center"
								sx={{
									fontSize: "0.7rem",
									fontWeight: "bold",
									color: "text.secondary",
									px: 0.5,
								}}
							>
								CONS
							</TableCell>
							<TableCell
								align="center"
								sx={{
									fontSize: "0.7rem",
									fontWeight: "bold",
									color: "text.secondary",
									px: 0.5,
								}}
							>
								NET
							</TableCell>
							<TableCell
								align="center"
								sx={{
									fontSize: "0.7rem",
									fontWeight: "bold",
									color: "text.secondary",
									px: 0.5,
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
