import React, { useState } from "react";
import {
	Box,
	Typography,
	Button,
	Card,
	IconButton,
	Chip,
	alpha,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	Tooltip,
	useTheme,
} from "@mui/material";
import {
	Add as AddIcon,
	Remove as RemoveIcon,
	Delete as DeleteIcon,
	Loop as LoopIcon,
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { formatCurrency, formatDuration } from "./helpers";

/**
 * Properties for the ProductionGrid component.
 */
export interface ProductionGridProps {
	/** The active base data including platforms and infrastructure */
	activeData: any;
	/** All available game buildings */
	activeBuildings: any[];
	/** All available game recipes */
	activeRecipes: any[];
	/** Mapping of platform IDs to their current active building queue */
	platformBuildingQueues: Record<string, any[]>;
	/** Mapping of platform IDs to their calculated efficiency modifiers */
	platformEfficiencies: Record<string, any>;
	/** Mapping of platform IDs to the recipes assigned to them */
	platformActiveRecipes: Record<string, any[]>;
	/** Function to calculate the build cost of a given building ticker */
	getBuildingCost: (ticker: string) => number;
	/** Handler to set the currently selected recipe in the Add Recipe dialog */
	setSelectedRecipe: (id: string) => void;
	/** Handler to open the Add Recipe dialog for a specific platform */
	setIsAddingRecipe: (id: string | null) => void;
	/** Handler to increment or decrement the amount of a specific platform */
	handleAdjustPlatformAmount: (id: string, change: number) => void;
	/** Handler to completely remove a platform from the base */
	handleRemovePlatform: (id: string) => void;
	/** Handler to remove one instance of a specific recipe from a platform's queue */
	handleRemoveSpecificRecipe: (id: string, recipeId: string) => void;
	/** Handler to add one instance of a specific recipe to a platform's queue */
	handleAddSpecificRecipe: (id: string, recipeId: string) => void;
	/** Handler to toggle the visibility of the Add Platform dialog */
	setIsEditingPlatform: (isEditing: boolean) => void;
	/** Function to fetch the active price for a given material ticker */
	getPrice: (ticker: string) => number;
	/** Aggregated list of materials required to construct the entire base */
	buildMaterials: Record<string, number>;
	/** The total capital expenditure required to build the base */
	totalCapEx: number;
	/** Handler to adjust the amount of a specific infrastructure building */
	handleAdjustInfra: (ticker: string, change: number) => void;
}

/**
 * ProductionGrid Component
 *
 * Displays and manages the primary production lines (platforms) and infrastructure
 * of the base. Users can add/remove platforms, adjust infrastructure levels, and
 * configure the specific production recipes running in each platform.
 */
export const ProductionGrid: React.FC<ProductionGridProps> = ({
	activeData,
	activeBuildings,
	activeRecipes,
	platformBuildingQueues,
	platformEfficiencies,
	platformActiveRecipes,
	getBuildingCost,
	setSelectedRecipe,
	setIsAddingRecipe,
	handleAdjustPlatformAmount,
	handleRemovePlatform,
	handleRemoveSpecificRecipe,
	handleAddSpecificRecipe,
	setIsEditingPlatform,
	getPrice,
	buildMaterials,
	totalCapEx,
	handleAdjustInfra,
}) => {
	const theme = useTheme();
	// Tracks the collapsed state of individual production lines (platforms)
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

	/** Toggles the collapse state of a specific platform card */
	const toggleCollapse = (id: string) =>
		setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

	// Sort infrastructure to prioritize habitats (HB*) and then alphabetically
	const sortedInfra = [
		...activeBuildings.filter((b: any) => b.type === "infrastructure"),
	].sort((a, b) => {
		const aHab = a.ticker.startsWith("HB") ? -1 : 1;
		const bHab = b.ticker.startsWith("HB") ? -1 : 1;
		if (aHab !== bHab) return aHab - bHab;
		return a.ticker.localeCompare(b.ticker);
	});

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: { xs: "column", lg: "row" },
				gap: 2,
				flexGrow: 1,
				minHeight: 0,
			}}
		>
			{/* LEFT COLUMN: PRODUCTION LINES */}
			<Card
				variant="outlined"
				sx={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					minHeight: 0,
					bgcolor: "background.default",
				}}
			>
				<Box
					sx={{
						p: 1,
						px: 1.5,
						borderBottom: "1px solid",
						borderColor: "divider",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Typography variant="subtitle1" fontWeight="bold">
						Production Lines
					</Typography>
					<Button
						size="small"
						variant="contained"
						color="secondary"
						startIcon={<AddIcon />}
						sx={{ py: 0.5, px: 1.5, fontSize: "0.8rem" }}
						onClick={() => setIsEditingPlatform(true)}
					>
						Add Line
					</Button>
				</Box>
				<Box
					sx={{
						p: 1.5,
						overflowY: "auto",
						display: "flex",
						flexDirection: "column",
						gap: 2,
					}}
				>
					{activeData.platforms.map((p: any) => {
						const bInfo = activeBuildings.find(
							(b: any) => b.ticker === p.buildingTicker,
						);
						const bOrders = platformBuildingQueues?.[p.id] || [];

						// Count occurrences of each recipe assigned to this platform
						const recipeCounts = (p.activeRecipes || []).reduce(
							(acc: any, id: string) => {
								acc[id] = (acc[id] || 0) + 1;
								return acc;
							},
							{},
						);
						const effData = platformEfficiencies?.[p.id] || {
							total: 100,
							workforce: 100,
							expert: 0,
							faction: 0,
							cogc: 0,
							planet: 100,
							speed: 1,
						};
						const isCollapsed = collapsed[p.id] || false;

						return (
							<Box
								key={p.id}
								sx={{
									border: "1px solid",
									borderColor: "divider",
									borderRadius: 1,
									bgcolor: "background.paper",
									p: 1,
								}}
							>
								{/* Platform Header and Controls */}
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										pb: isCollapsed ? 0 : 1,
										mb: isCollapsed ? 0 : 1,
										borderBottom: isCollapsed ? "none" : "1px solid",
										borderColor: "divider",
									}}
								>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
										<IconButton
											size="small"
											onClick={() => toggleCollapse(p.id)}
											sx={{ p: 0.25 }}
										>
											{isCollapsed ? (
												<ExpandMoreIcon fontSize="small" />
											) : (
												<ExpandLessIcon fontSize="small" />
											)}
										</IconButton>
										<Box
											display="flex"
											alignItems="center"
											border="1px solid"
											borderColor="divider"
											borderRadius={1}
											bgcolor="background.default"
										>
											<IconButton
												size="small"
												sx={{ p: 0.25 }}
												onClick={() => handleAdjustPlatformAmount(p.id, -1)}
												disabled={p.amount <= 1}
											>
												<RemoveIcon sx={{ fontSize: "0.9rem" }} />
											</IconButton>
											<Typography
												variant="body2"
												sx={{
													minWidth: 24,
													textAlign: "center",
													fontWeight: "bold",
												}}
											>
												{p.amount}
											</Typography>
											<IconButton
												size="small"
												sx={{ p: 0.25 }}
												onClick={() => handleAdjustPlatformAmount(p.id, 1)}
											>
												<AddIcon sx={{ fontSize: "0.9rem" }} />
											</IconButton>
										</Box>
										<Typography variant="subtitle1" fontWeight="bold">
											{bInfo?.ticker}
										</Typography>

										{/* Efficiency Tooltip Breakdown */}
										<Tooltip
											title={`Workforce: ${effData.workforce.toFixed(2)}% | Experts: +${effData.expert.toFixed(2)}% | Faction: +${effData.faction.toFixed(2)}% | COGC: ${effData.cogc > 0 ? "125%" : "0%"} | Planet: ${effData.planet.toFixed(2)}%`}
											arrow
										>
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{
													display: { xs: "none", sm: "block" },
													cursor: "help",
													borderBottom: "1px dotted gray",
												}}
											>
												Eff:{" "}
												<span
													style={{
														color:
															effData.cogc > 0
																? theme.palette.primary.dark
																: theme.palette.info.main,
														fontWeight: "bold",
													}}
												>
													{effData.total.toFixed(2)}%{" "}
													{effData.cogc > 0 && "(COGC)"}
												</span>{" "}
												| CapEx: $
												{formatCurrency(
													getBuildingCost(bInfo?.ticker || "") * p.amount,
												)}
											</Typography>
										</Tooltip>
									</Box>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<Button
											size="small"
											variant="contained"
											color="primary"
											sx={{ fontSize: "0.75rem", py: 0.25, height: 26 }}
											onClick={() => {
												const vR = activeRecipes.filter(
													(r: any) =>
														String(r.madeIn || "")
															.trim()
															.toUpperCase() ===
														String(p.buildingTicker || "")
															.trim()
															.toUpperCase(),
												);
												setSelectedRecipe(vR.length > 0 ? vR[0].id : "");
												setIsAddingRecipe(p.id);
											}}
										>
											+ RECIPE
										</Button>
										<IconButton
											size="small"
											color="error"
											sx={{ p: 0.25 }}
											onClick={() => handleRemovePlatform(p.id)}
										>
											<DeleteIcon fontSize="small" />
										</IconButton>
									</Box>
								</Box>

								{/* Collapsed View: Compact Recipe Chips */}
								{isCollapsed && Object.keys(recipeCounts).length > 0 && (
									<Box
										sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}
									>
										{Object.entries(recipeCounts).map(([recipeId, count]) => {
											const rInfo =
												(platformActiveRecipes?.[p.id] || []).find(
													(r: any) => r.id === recipeId,
												) || activeRecipes.find((r: any) => r.id === recipeId);
											return (
												<Chip
													key={recipeId}
													size="small"
													label={`${count}x ${rInfo ? rInfo.outStr : recipeId}`}
													sx={{
														height: 20,
														fontSize: "0.75rem",
														fontWeight: "bold",
													}}
												/>
											);
										})}
									</Box>
								)}

								{/* Expanded View: Detailed Recipe List and Queue Visualizer */}
								{!isCollapsed && (
									<>
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												gap: 0.5,
											}}
										>
											{Object.entries(recipeCounts).length === 0 ? (
												<Typography
													variant="body2"
													color="text.secondary"
													sx={{ fontStyle: "italic", pl: 1, py: 0.5 }}
												>
													No recipes configured.
												</Typography>
											) : (
												Object.entries(recipeCounts).map(
													([recipeId, count]) => {
														const rInfo =
															(platformActiveRecipes?.[p.id] || []).find(
																(r: any) => r.id === recipeId,
															) ||
															activeRecipes.find((r: any) => r.id === recipeId);
														if (!rInfo) return null;
														return (
															<Box
																key={recipeId}
																sx={{
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "space-between",
																	px: 1,
																	py: 0.5,
																	border: "1px solid",
																	borderColor: "divider",
																	borderRadius: 1,
																	bgcolor: alpha(
																		theme.palette.background.default,
																		0.4,
																	),
																}}
															>
																<Box
																	sx={{
																		display: "flex",
																		alignItems: "center",
																		gap: 2,
																	}}
																>
																	<Box
																		display="flex"
																		alignItems="center"
																		bgcolor="background.default"
																		border="1px solid"
																		borderColor="divider"
																		borderRadius={1}
																	>
																		<IconButton
																			size="small"
																			onClick={() =>
																				handleRemoveSpecificRecipe(
																					p.id,
																					recipeId,
																				)
																			}
																			sx={{ p: 0.15 }}
																		>
																			<RemoveIcon sx={{ fontSize: "0.8rem" }} />
																		</IconButton>
																		<Typography
																			variant="body2"
																			fontWeight="bold"
																			sx={{ minWidth: 24, textAlign: "center" }}
																		>
																			{count as number}
																		</Typography>
																		<IconButton
																			size="small"
																			onClick={() =>
																				handleAddSpecificRecipe(p.id, recipeId)
																			}
																			sx={{ p: 0.15 }}
																		>
																			<AddIcon sx={{ fontSize: "0.8rem" }} />
																		</IconButton>
																	</Box>
																	<Typography
																		variant="body2"
																		fontFamily="monospace"
																		fontWeight="bold"
																	>
																		{rInfo.inStr} ➔ {rInfo.outStr}
																	</Typography>
																</Box>
																<Typography
																	variant="body2"
																	color="text.secondary"
																>
																	{formatDuration(rInfo.duration || 0)}
																</Typography>
															</Box>
														);
													},
												)
											)}
										</Box>

										{/* Visual representation of assigned queues per building instance */}
										<Box
											sx={{
												mt: 1,
												pt: 1,
												borderTop: "1px solid",
												borderColor: "divider",
												display: "flex",
												flexWrap: "wrap",
												gap: 0.5,
											}}
										>
											{bOrders.map((buildingQueue: any, bIdx: number) => {
												const safeQueue = Array.isArray(buildingQueue)
													? buildingQueue
													: buildingQueue
														? [buildingQueue]
														: [];
												const active = safeQueue[0];
												const label = `B${bIdx + 1}: ${active ? active.outStr : "Idle"}`;

												return (
													<Tooltip
														key={bIdx}
														title={
															safeQueue.length > 0
																? safeQueue.map((r: any) => r.name).join(" ➔ ")
																: "No active recipe"
														}
														arrow
													>
														<Chip
															size="small"
															variant={active ? "filled" : "outlined"}
															color={active ? "success" : "default"}
															label={label}
															icon={
																active ? (
																	<LoopIcon style={{ fontSize: "0.85rem" }} />
																) : undefined
															}
															sx={{
																height: 22,
																fontSize: "0.75rem",
																fontWeight: "bold",
																borderRadius: 1,
															}}
														/>
													</Tooltip>
												);
											})}
										</Box>
									</>
								)}
							</Box>
						);
					})}
				</Box>
			</Card>

			{/* RIGHT COLUMN: INFRASTRUCTURE & CAPEX */}
			<Box
				sx={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					gap: 2,
					minHeight: 0,
				}}
			>
				{/* INFRASTRUCTURE CONTROLS */}
				<Card
					variant="outlined"
					sx={{
						flex: 1.5,
						display: "flex",
						flexDirection: "column",
						bgcolor: "background.default",
						minHeight: 0,
					}}
				>
					<Box
						sx={{
							p: 1,
							px: 1.5,
							borderBottom: "1px solid",
							borderColor: "divider",
						}}
					>
						<Typography variant="subtitle1" fontWeight="bold">
							Infrastructure
						</Typography>
					</Box>
					<Box sx={{ overflowY: "auto", p: 1.5 }}>
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
								gap: 1,
							}}
						>
							{sortedInfra.map((infra: any) => {
								const currentCount =
									activeData.infrastructure.find(
										(i: any) => i.buildingTicker === infra.ticker,
									)?.amount || 0;
								let benefits = [];
								if (infra.supply)
									Object.entries(infra.supply).forEach(([k, v]) =>
										benefits.push(`+${v as number} ${k.substring(0, 3)}`),
									);
								if (infra.storageWeight)
									benefits.push(`+${infra.storageWeight}t`);

								return (
									<Box
										key={infra.ticker}
										sx={{
											display: "flex",
											flexDirection: "column",
											justifyContent: "space-between",
											p: 1,
											px: 1.5,
											border: "1px solid",
											borderColor:
												currentCount > 0 ? "primary.main" : "divider",
											bgcolor:
												currentCount > 0
													? alpha(theme.palette.primary.main, 0.05)
													: "background.paper",
											borderRadius: 1,
										}}
									>
										<Box
											display="flex"
											justifyContent="space-between"
											alignItems="center"
										>
											<Typography variant="body2" fontWeight="bold">
												{infra.ticker}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{benefits.join(", ")}
											</Typography>
										</Box>
										<Box
											display="flex"
											alignItems="center"
											justifyContent="space-between"
											mt={1}
										>
											<Typography
												variant="body2"
												color={
													currentCount > 0 ? "success.main" : "text.secondary"
												}
												fontWeight="bold"
											>
												$
												{formatCurrency(
													getBuildingCost(infra.ticker) * currentCount,
												)}
											</Typography>
											<Box
												display="flex"
												alignItems="center"
												bgcolor="background.default"
												border="1px solid"
												borderColor="divider"
												borderRadius={1}
											>
												<IconButton
													size="small"
													onClick={() => handleAdjustInfra(infra.ticker, -1)}
													disabled={currentCount === 0}
													sx={{ p: 0.15 }}
												>
													<RemoveIcon sx={{ fontSize: "0.8rem" }} />
												</IconButton>
												<Typography
													variant="body2"
													fontWeight="bold"
													sx={{ minWidth: 24, textAlign: "center" }}
												>
													{currentCount}
												</Typography>
												<IconButton
													size="small"
													onClick={() => handleAdjustInfra(infra.ticker, 1)}
													sx={{ p: 0.15 }}
												>
													<AddIcon sx={{ fontSize: "0.8rem" }} />
												</IconButton>
											</Box>
										</Box>
									</Box>
								);
							})}
						</Box>
					</Box>
				</Card>

				{/* CONSTRUCTION CAPEX TABLE */}
				<Card
					variant="outlined"
					sx={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						bgcolor: "background.default",
						minHeight: 0,
					}}
				>
					<Box
						sx={{
							p: 1,
							px: 1.5,
							borderBottom: "1px solid",
							borderColor: "divider",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography variant="subtitle1" fontWeight="bold">
							Construction Cost (CapEx)
						</Typography>
						<Typography variant="subtitle1" color="info.main" fontWeight="bold">
							${formatCurrency(totalCapEx)}
						</Typography>
					</Box>
					<Box sx={{ overflowY: "auto", flexGrow: 1 }}>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow
									sx={{
										"& th": {
											bgcolor: "background.default",
											fontSize: "0.8rem",
											borderBottom: "1px solid",
											borderColor: "divider",
											py: 1,
										},
									}}
								>
									<TableCell>Ticker</TableCell>
									<TableCell align="right">Amount</TableCell>
									<TableCell align="right">Price/u & Total</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{Object.keys(buildMaterials || {}).length === 0 ? (
									<TableRow>
										<TableCell colSpan={3} align="center">
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ py: 2 }}
											>
												No buildings placed.
											</Typography>
										</TableCell>
									</TableRow>
								) : (
									Object.entries(buildMaterials).map(([ticker, amt]: any) => (
										<TableRow
											key={ticker}
											sx={{
												"& td": {
													borderBottom: "1px solid",
													borderColor: "divider",
													whiteSpace: "nowrap",
													py: 1,
												},
											}}
										>
											<TableCell>
												<Typography variant="body2" fontWeight="bold">
													{ticker}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2">{amt}</Typography>
											</TableCell>
											<TableCell align="right">
												<Box
													display="flex"
													justifyContent="flex-end"
													alignItems="center"
													gap={1.5}
												>
													<Typography
														variant="caption"
														color="text.secondary"
														sx={{ minWidth: 35 }}
													>
														${formatCurrency(getPrice(ticker))}
													</Typography>
													<Typography
														variant="body2"
														fontWeight="bold"
														sx={{ minWidth: 45 }}
													>
														${formatCurrency(amt * getPrice(ticker))}
													</Typography>
												</Box>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</Box>
				</Card>
			</Box>
		</Box>
	);
};
