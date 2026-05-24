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
	Collapse,
	Select,
	MenuItem,
	TextField,
	FormControl,
	InputLabel,
	Tabs,
	Tab,
	Divider,
	ToggleButtonGroup,
	ToggleButton,
} from "@mui/material";
import {
	Add as AddIcon,
	Remove as RemoveIcon,
	Delete as DeleteIcon,
	Loop as LoopIcon,
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
	Close as CloseIcon,
} from "@mui/icons-material";
import { formatCurrency, formatDuration } from "./helpers";

/**
 * Properties for the ProductionGrid component.
 */
export interface ProductionGridProps {
	/** The active base data including platforms and infrastructure */
	activeData: any;
	/** Optional comparison base data to show a diff */
	comparisonData?: any;
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
	/** Handler to add a new platform */
	onAddPlatform: (ticker: string, amount: number) => void;
	/** Function to fetch the active price for a given material ticker */
	getPrice: (ticker: string) => number;
	/** Aggregated list of materials required to construct the entire base */
	buildMaterials: Record<string, number>;
	/** The total capital expenditure required to build the base */
	totalCapEx: number;
	/** Handler to adjust the amount of a specific infrastructure building */
	handleAdjustInfra: (ticker: string, change: number) => void;
	/** Optional helper to auto-manage habitation to meet workforce demand */
	autoHabEnabled?: boolean;
	autoHabStrategy?: "area" | "cost";
	onToggleAutoHab?: (enabled: boolean) => void;
	onChangeAutoHabStrategy?: (strategy: "area" | "cost") => void;
	onAutoManageHabitation?: (strategy: "area" | "cost") => void;
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
	comparisonData,
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
	onAddPlatform,
	getPrice,
	buildMaterials,
	totalCapEx,
	handleAdjustInfra,
	autoHabEnabled = false,
	autoHabStrategy = "area",
	onToggleAutoHab,
	onChangeAutoHabStrategy,
	onAutoManageHabitation,
}) => {
	const theme = useTheme();
	const [rightTab, setRightTab] = useState<"infra" | "capex">("infra");

	// Add Platform state
	const [isAddingPlatform, setIsAddingPlatform] = useState(false);
	const [newTicker, setNewTicker] = useState("");
	const [newAmount, setNewAmount] = useState(1);

	const productionBuildings = React.useMemo(
		() => activeBuildings.filter((b: any) => b.type === "production"),
		[activeBuildings],
	);

	const categories = React.useMemo(
		() =>
			Array.from(
				new Set(productionBuildings.map((b: any) => b.category || "Other")),
			).sort(),
		[productionBuildings],
	);

	const [selectedCategory, setSelectedCategory] = useState<string>(
		categories[0] || "Other",
	);

	React.useEffect(() => {
		if (categories.length > 0 && !categories.includes(selectedCategory)) {
			setSelectedCategory(categories[0]);
		}
	}, [categories, selectedCategory]);

	const filteredBuildings = React.useMemo(
		() =>
			productionBuildings.filter(
				(b: any) => (b.category || "Other") === selectedCategory,
			),
		[productionBuildings, selectedCategory],
	);

	React.useEffect(() => {
		if (
			isAddingPlatform &&
			filteredBuildings.length > 0 &&
			!filteredBuildings.find((b: any) => b.ticker === newTicker)
		) {
			setNewTicker(filteredBuildings[0].ticker);
		}
	}, [isAddingPlatform, filteredBuildings, newTicker]);

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

	const sumMaterials = (m: Record<string, number>) =>
		Object.values(m).reduce((acc, v) => acc + (Number(v) || 0), 0);

	const addBuildReq = (
		ticker: string,
		count: number,
		target: Record<string, number>,
	) => {
		const bInfo = activeBuildings.find((b: any) => b.ticker === ticker);
		if (!bInfo?.buildReq) return;
		bInfo.buildReq.forEach((req: any) => {
			target[req.ticker] =
				(target[req.ticker] || 0) + Number(req.amount) * count;
		});
	};

	const categorizedMaterials = React.useMemo(() => {
		const production: Record<string, number> = {};
		const infraHab: Record<string, number> = {};
		const infraStorage: Record<string, number> = {};
		const infraOther: Record<string, number> = {};
		const baseCM: Record<string, number> = {};

		activeData.platforms.forEach((p: any) => {
			const amount = Number(p.amount) || 1;
			addBuildReq(p.buildingTicker, amount, production);
		});

		activeData.infrastructure.forEach((i: any) => {
			const amount = Number(i.amount) || 1;
			const b = activeBuildings.find((x: any) => x.ticker === i.buildingTicker);
			const isHab = String(i.buildingTicker || "")
				.toUpperCase()
				.startsWith("HB");
			const isStorage =
				!!b?.storageWeight ||
				!!b?.storageVolume ||
				["STO", "STA"].includes(String(i.buildingTicker || "").toUpperCase());
			if (isHab) addBuildReq(i.buildingTicker, amount, infraHab);
			else if (isStorage) addBuildReq(i.buildingTicker, amount, infraStorage);
			else addBuildReq(i.buildingTicker, amount, infraOther);
		});

		// TODO: Base/CM materials should be populated from backend "Site command module" data.
		// Keeping a separate bucket allows a drop-in swap when CM buildReq are available.

		const finalAll = { ...production };
		[infraHab, infraStorage, infraOther, baseCM].forEach((m) => {
			Object.entries(m).forEach(([t, a]) => {
				finalAll[t] = (finalAll[t] || 0) + a;
			});
		});

		return { production, infraHab, infraStorage, infraOther, baseCM, finalAll };
	}, [activeData.platforms, activeData.infrastructure, activeBuildings]);

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
					<Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
						Production Lines
					</Typography>
					<Button
						size="small"
						variant={isAddingPlatform ? "outlined" : "contained"}
						color={isAddingPlatform ? "inherit" : "secondary"}
						startIcon={isAddingPlatform ? <CloseIcon /> : <AddIcon />}
						sx={{ py: 0.5, px: 1.5, fontSize: "0.8rem" }}
						onClick={() => setIsAddingPlatform(!isAddingPlatform)}
					>
						{isAddingPlatform ? "Cancel" : "Add Line"}
					</Button>
				</Box>
				<Collapse in={isAddingPlatform}>
					<Box
						sx={{
							p: 1.5,
							borderBottom: "1px solid",
							borderColor: "divider",
							bgcolor: alpha(theme.palette.secondary.main, 0.05),
							display: "flex",
							flexDirection: "column",
							gap: 1.5,
						}}
					>
						<Typography
							variant="subtitle2"
							color="secondary"
							sx={{ fontWeight: "bold" }}
						>
							Add New Production Line
						</Typography>
						<Box
							sx={{
								display: "flex",
								gap: 1,
								flexWrap: "wrap",
								alignItems: "flex-end",
							}}
						>
							<FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
								<InputLabel>Category</InputLabel>
								<Select
									value={selectedCategory}
									label="Category"
									onChange={(e) =>
										setSelectedCategory(e.target.value as string)
									}
									MenuProps={{
										slotProps: {
											paper: {
												sx: {
													bgcolor: "background.default",
													backgroundImage: "none",
												},
											},
										},
									}}
								>
									{categories.map((cat: string) => (
										<MenuItem key={cat} value={cat}>
											{cat}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FormControl size="small" sx={{ flex: 1, minWidth: 150 }}>
								<InputLabel>Building</InputLabel>
								<Select
									value={newTicker}
									label="Building"
									onChange={(e) => setNewTicker(e.target.value)}
									MenuProps={{
										slotProps: {
											paper: {
												sx: {
													bgcolor: "background.default",
													backgroundImage: "none",
												},
											},
										},
									}}
								>
									{filteredBuildings.map((b: any) => (
										<MenuItem key={b.ticker} value={b.ticker}>
											{b.name} ({b.ticker})
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<TextField
								label="Amount"
								type="number"
								size="small"
								value={newAmount}
								onChange={(e) => setNewAmount(parseInt(e.target.value) || 1)}
								slotProps={{ htmlInput: { style: { textAlign: "center" } } }}
								sx={{ width: 80 }}
							/>
							<Button
								variant="contained"
								color="secondary"
								onClick={() => {
									onAddPlatform(newTicker, newAmount);
									setIsAddingPlatform(false);
									setNewAmount(1);
								}}
							>
								Build
							</Button>
						</Box>
					</Box>
				</Collapse>
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
						const compPlatformAmount = comparisonData
							? comparisonData.platforms?.find(
									(cp: any) => cp.buildingTicker === p.buildingTicker,
								)?.amount || 0
							: null;
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
											sx={{
												display: "flex",
												alignItems: "center",
												border: "1px solid",
												borderColor: "divider",
												borderRadius: 1,
												bgcolor: "background.default",
											}}
										>
											<IconButton
												size="small"
												sx={{ p: 0.25 }}
												onClick={() => handleAdjustPlatformAmount(p.id, -1)}
												disabled={p.amount <= 1}
											>
												<RemoveIcon sx={{ fontSize: "0.9rem" }} />
											</IconButton>
											<Box
												sx={{
													display: "flex",
													flexDirection: "column",
													alignItems: "center",
													minWidth: 24,
													px: 0.5,
												}}
											>
												<Typography
													variant="body2"
													sx={{
														textAlign: "center",
														fontWeight: "bold",
														color:
															compPlatformAmount !== null &&
															compPlatformAmount !== p.amount
																? "warning.main"
																: "inherit",
													}}
												>
													{p.amount}
												</Typography>
												{compPlatformAmount !== null &&
													compPlatformAmount !== p.amount && (
														<Typography
															variant="caption"
															sx={{
																fontSize: "0.6rem",
																color: "text.secondary",
																mt: -0.5,
															}}
														>
															vs {compPlatformAmount}
														</Typography>
													)}
											</Box>
											<IconButton
												size="small"
												sx={{ p: 0.25 }}
												onClick={() => handleAdjustPlatformAmount(p.id, 1)}
											>
												<AddIcon sx={{ fontSize: "0.9rem" }} />
											</IconButton>
										</Box>
										<Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
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
																		sx={{
																			display: "flex",
																			alignItems: "center",
																			bgcolor: "background.default",
																			border: "1px solid",
																			borderColor: "divider",
																			borderRadius: 1,
																		}}
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
																			sx={{
																				minWidth: 24,
																				textAlign: "center",
																				fontWeight: "bold",
																			}}
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
																		sx={{
																			fontFamily: "monospace",
																			fontWeight: "bold",
																		}}
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
					minHeight: 0,
				}}
			>
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
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<Tabs
							value={rightTab}
							onChange={(_, v) => setRightTab(v)}
							variant="fullWidth"
							sx={{
								minHeight: 36,
								"& .MuiTab-root": { minHeight: 36, fontSize: "0.8rem" },
							}}
						>
							<Tab value="infra" label="Infrastructure" />
							<Tab
								value="capex"
								label={`Construction (${formatCurrency(totalCapEx)})`}
							/>
						</Tabs>
					</Box>
					{rightTab === "infra" && (
						<Box
							sx={{
								overflowY: "auto",
								p: 1.5,
								display: "flex",
								flexDirection: "column",
								gap: 1.25,
							}}
						>
							{onAutoManageHabitation && (
								<Box
									sx={{
										display: "flex",
										gap: 1,
										alignItems: "center",
										flexWrap: "wrap",
									}}
								>
									<Typography variant="caption" color="text.secondary">
										Auto habs:
									</Typography>
									<ToggleButtonGroup
										size="small"
										value={autoHabStrategy}
										exclusive
										onChange={(_, v) => v && onChangeAutoHabStrategy?.(v)}
									>
										<ToggleButton value="area">Min area</ToggleButton>
										<ToggleButton value="cost">Min cost</ToggleButton>
									</ToggleButtonGroup>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
											ml: "auto",
										}}
									>
										<Typography variant="caption" color="text.secondary">
											Enabled
										</Typography>
										<input
											type="checkbox"
											checked={autoHabEnabled}
											onChange={(e) => onToggleAutoHab?.(e.target.checked)}
										/>
									</Box>
									<Divider flexItem sx={{ width: "100%" }} />
								</Box>
							)}
							<Box
								sx={{
									display: "grid",
									gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
									gap: 1,
								}}
							>
								{sortedInfra.map((infra: any) => {
									const currentCount =
										activeData.infrastructure.find(
											(i: any) => i.buildingTicker === infra.ticker,
										)?.amount || 0;
									const compCount = comparisonData
										? comparisonData.infrastructure?.find(
												(ci: any) => ci.buildingTicker === infra.ticker,
											)?.amount || 0
										: null;
									const benefits = [];
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
												sx={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
												}}
											>
												<Typography variant="body2" sx={{ fontWeight: "bold" }}>
													{infra.ticker}
												</Typography>
												<Typography variant="caption" color="text.secondary">
													{benefits.join(", ")}
												</Typography>
											</Box>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
													mt: 1,
												}}
											>
												<Typography
													variant="body2"
													color={
														currentCount > 0 ? "success.main" : "text.secondary"
													}
													sx={{ fontWeight: "bold" }}
												>
													$
													{formatCurrency(
														getBuildingCost(infra.ticker) * currentCount,
													)}
												</Typography>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														bgcolor: "background.default",
														border: "1px solid",
														borderColor: "divider",
														borderRadius: 1,
													}}
												>
													<IconButton
														size="small"
														onClick={() => handleAdjustInfra(infra.ticker, -1)}
														disabled={currentCount === 0}
														sx={{ p: 0.15 }}
													>
														<RemoveIcon sx={{ fontSize: "0.8rem" }} />
													</IconButton>
													<Box
														sx={{
															display: "flex",
															flexDirection: "column",
															alignItems: "center",
															minWidth: 24,
															px: 0.5,
														}}
													>
														<Typography
															variant="body2"
															sx={{
																textAlign: "center",
																fontWeight: "bold",
																color:
																	compCount !== null &&
																	compCount !== currentCount
																		? "warning.main"
																		: "inherit",
															}}
														>
															{currentCount}
														</Typography>
														{compCount !== null &&
															compCount !== currentCount && (
																<Typography
																	variant="caption"
																	sx={{
																		fontSize: "0.6rem",
																		color: "text.secondary",
																		mt: -0.5,
																	}}
																>
																	vs {compCount}
																</Typography>
															)}
													</Box>
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
					)}

					{rightTab === "capex" && (
						<Box
							sx={{
								overflowY: "auto",
								flexGrow: 1,
								display: "flex",
								flexDirection: "column",
							}}
						>
							<Box
								sx={{
									p: 1.25,
									pb: 0.75,
									borderBottom: "1px solid",
									borderColor: "divider",
								}}
							>
								<Box
									sx={{
										display: "grid",
										gridTemplateColumns: "1fr 1fr",
										gap: 1,
									}}
								>
									<Box
										sx={{
											bgcolor: "background.paper",
											border: "1px solid",
											borderColor: "divider",
											borderRadius: 1,
											p: 1,
										}}
									>
										<Typography variant="caption" color="text.secondary">
											Production lines
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: "bold" }}>
											{formatCurrency(
												Object.entries(categorizedMaterials.production).reduce(
													(acc, [t, a]) => acc + (Number(a) || 0) * getPrice(t),
													0,
												),
											)}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{Object.keys(categorizedMaterials.production).length} mats
										</Typography>
									</Box>
									<Box
										sx={{
											bgcolor: "background.paper",
											border: "1px solid",
											borderColor: "divider",
											borderRadius: 1,
											p: 1,
										}}
									>
										<Typography variant="caption" color="text.secondary">
											Infrastructure
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: "bold" }}>
											{formatCurrency(
												[
													categorizedMaterials.infraHab,
													categorizedMaterials.infraStorage,
													categorizedMaterials.infraOther,
												]
													.flatMap((m) => Object.entries(m))
													.reduce(
														(acc, [t, a]) =>
															acc + (Number(a) || 0) * getPrice(t),
														0,
													),
											)}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											Hab {Object.keys(categorizedMaterials.infraHab).length} •
											Sto{" "}
											{Object.keys(categorizedMaterials.infraStorage).length}
										</Typography>
									</Box>
								</Box>
								<Box
									sx={{
										mt: 1,
										display: "flex",
										justifyContent: "space-between",
										alignItems: "baseline",
									}}
								>
									<Typography variant="caption" color="text.secondary">
										Total (CapEx)
									</Typography>
									<Typography
										variant="subtitle2"
										sx={{ fontWeight: "bold" }}
										color="info.main"
									>
										${formatCurrency(totalCapEx)}
									</Typography>
								</Box>
							</Box>
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
									{Object.keys(categorizedMaterials.finalAll || {}).length ===
									0 ? (
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
										Object.entries(categorizedMaterials.finalAll)
											.map(([ticker, amt]: any) => ({
												ticker,
												amt,
												unit: getPrice(ticker),
												total: amt * getPrice(ticker),
											}))
											.sort((a, b) => b.total - a.total)
											.map(({ ticker, amt, unit, total }) => (
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
														<Typography
															variant="body2"
															sx={{ fontWeight: "bold" }}
														>
															{ticker}
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography variant="body2">{amt}</Typography>
													</TableCell>
													<TableCell align="right">
														<Box
															sx={{
																display: "flex",
																justifyContent: "flex-end",
																alignItems: "center",
																gap: 1.5,
															}}
														>
															<Typography
																variant="caption"
																color="text.secondary"
																sx={{ minWidth: 35 }}
															>
																${formatCurrency(unit)}
															</Typography>
															<Typography
																variant="body2"
																sx={{ minWidth: 45, fontWeight: "bold" }}
															>
																${formatCurrency(total)}
															</Typography>
														</Box>
													</TableCell>
												</TableRow>
											))
									)}
								</TableBody>
							</Table>
						</Box>
					)}
				</Card>
			</Box>
		</Box>
	);
};
