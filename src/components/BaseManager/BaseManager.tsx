import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
	Box,
	Typography,
	Button,
	AppBar,
	Toolbar,
	IconButton,
	alpha,
} from "@mui/material";
import {
	Build as BuildIcon,
	ArrowBack as ArrowBackIcon,
	Settings as SettingsIcon,
	Save as SaveIcon,
} from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";

import {
	FALLBACK_BUILDINGS,
	FALLBACK_PRICES,
	FALLBACK_NEEDS,
	FALLBACK_RECIPES,
} from "./constants";
import { BaseManagerProps } from "./types";
import { formatDuration, calculateBaseMetrics } from "./helpers";
import { TopMetricsGrid } from "./TopMetricsGrid";
import { ProductionGrid } from "./ProductionGrid";
import { SettingsDialog, AddPlatformDialog, AddRecipeDialog } from "./Dialogs";

/**
 * BaseManager Component
 *
 * This is the main orchestrator for planning and managing a player's base on a specific planet.
 * It handles the state for production platforms, infrastructure, recipes, and material pricing.
 * It allows the user to draft changes (in a planner mode) before saving them to the user profile.
 */
export const BaseManager: React.FC<BaseManagerProps> = ({
	user,
	onUpdateUser,
	planetName = "Unknown Planet",
	staticData,
	standalone = false,
}) => {
	// Determines if the user has initialized a base on this planet yet
	const isUninitialized = user.baseData.status === "uninitialized";

	// UI State: Controls whether the planner view is visible
	const [isPlannerOpen, setIsPlannerOpen] = useState(standalone);
	// Ref to the DOM element where the planner portal will be injected
	const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

	// State for the "draft" base data, allowing edits without immediately saving
	const [draftBaseData, setDraftBaseData] = useState(user.baseData);

	// The current data being used to calculate metrics.
	// If the planner is open, we use the draft; otherwise, we use the saved user data.
	const activeData = isPlannerOpen ? draftBaseData : user.baseData;

	// User Preferences and Settings State
	const [activeNeeds, setActiveNeeds] = useState<
		Record<string, Record<string, boolean>>
	>(user.activeNeeds || {});
	const [experts, setExperts] = useState<Record<string, number>>(
		user.experts || {},
	);
	const [planetFactor, setPlanetFactor] = useState<number>(
		user.planetFactor !== undefined ? user.planetFactor : 100,
	);
	const [activeCogc, setActiveCogc] = useState<string | null>(
		user.activeCogc || null,
	);
	const [activeFaction, setActiveFaction] = useState<string>(
		user.faction || "No faction",
	);
	const [usedPermits, setUsedPermits] = useState<number>(user.usedPermits || 1);
	const [totalPermits, setTotalPermits] = useState<number>(
		user.totalPermits || 1,
	);

	// Pricing and Economy State
	const [planDefaultPricing, setPlanDefaultPricing] = useState<
		"market" | "corp"
	>(user.planDefaultPricing || "market");
	const [globalMatPrices, setGlobalMatPrices] = useState<
		Record<string, "market" | "corp">
	>(user.globalMatPrices || {});
	const [ioDisplayMode, setIoDisplayMode] = useState<"profit" | "importExport">(
		user.ioDisplayMode || "profit",
	);

	// Dialog Visibility State
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isEditingPlatform, setIsEditingPlatform] = useState(false);

	// Temporary state for adding a new platform
	const [newPlatformTicker, setNewPlatformTicker] = useState("FRM");
	const [newPlatformAmount, setNewPlatformAmount] = useState(1);

	// Temporary state for adding recipes to a specific platform (holds platform ID)
	const [isAddingRecipe, setIsAddingRecipe] = useState<string | null>(null);
	const [selectedRecipe, setSelectedRecipe] = useState("");

	// Determines if we are manually editing or syncing from an actual game state
	const [syncMode, setSyncMode] = useState<"manual" | "sync">(
		activeData?.status === "actual" ? "sync" : "manual",
	);

	// --- Derived Data (Memoized for performance) ---

	// Fallback to static data or constants if the static data is missing
	const activeBuildings = useMemo(
		() =>
			staticData?.buildings?.length ? staticData.buildings : FALLBACK_BUILDINGS,
		[staticData],
	);
	const activePrices = useMemo(
		() => (staticData?.prices ? staticData.prices : FALLBACK_PRICES),
		[staticData],
	);
	const activeWorkerNeeds = useMemo(
		() => (staticData?.needs ? staticData.needs : FALLBACK_NEEDS),
		[staticData],
	);

	/**
	 * Parses static data materials to extract and format all available recipes.
	 * This flattened list makes it easier to filter and display recipes.
	 */
	const activeRecipes = useMemo(() => {
		if (staticData?.materials?.length) {
			const ext: any[] = [];
			staticData.materials.forEach((m) => {
				m.inputRecipes?.forEach((r: any) => {
					// Convert duration to seconds
					const durSecs = r.durationmillis ? r.durationmillis / 1000 : 0;

					// Determine outputs (some recipes might just output the material itself)
					const actualOutputs =
						r.outputs?.length > 0
							? r.outputs
							: [{ ticker: m.ticker, amount: 1 }];

					ext.push({
						id: r.processid || r.id,
						name: `${r.inputs?.length ? r.inputs.map((i: any) => `${i.amount}${i.ticker}`).join(" + ") : "Ext"} ➔ ${actualOutputs.map((i: any) => `${i.amount}${i.ticker}`).join(" + ")} | ${formatDuration(durSecs)}`,
						duration: durSecs,
						madeIn: r.madeIn,
						ticker: m.ticker,
						inputs: r.inputs || [],
						outputs: actualOutputs,
						inStr: r.inputs?.length
							? r.inputs.map((i: any) => `${i.amount}${i.ticker}`).join(" + ")
							: "Ext",
						outStr: actualOutputs
							.map((i: any) => `${i.amount}${i.ticker}`)
							.join(" + "),
					});
				});
			});
			if (ext.length > 0) return ext;
		}
		return FALLBACK_RECIPES;
	}, [staticData]);

	/**
	 * Calculates the price of a given material ticker based on user settings
	 * (e.g., market price vs corp price).
	 * Wrapped in useCallback to prevent unnecessary recalculations in child components.
	 */
	const getPrice = useCallback(
		(ticker: string) =>
			activePrices[ticker]
				? activePrices[ticker][globalMatPrices[ticker] || planDefaultPricing]
				: 0,
		[activePrices, globalMatPrices, planDefaultPricing],
	);

	/**
	 * Calculates the total cost of constructing a building by summing the costs
	 * of all its required materials.
	 */
	const getBuildingCost = useCallback(
		(ticker: string) => {
			const b = activeBuildings.find((mb) => mb.ticker === ticker);
			return b?.buildReq
				? b.buildReq.reduce(
						(acc: number, req: any) =>
							acc + Number(req.amount) * getPrice(req.ticker),
						0,
					)
				: 0;
		},
		[activeBuildings, getPrice],
	);

	/**
	 * Central metric calculation for the base.
	 * Includes profits, material inputs/outputs, platform efficiencies, and worker needs.
	 */
	const metrics = useMemo(
		() =>
			calculateBaseMetrics({
				activeData,
				activeBuildings,
				activeRecipes,
				activeWorkerNeeds,
				activeNeeds,
				experts,
				activeCogc,
				planetFactor,
				getPrice,
				faction: activeFaction,
				usedPermits,
				totalPermits,
			}),
		[
			activeData,
			activeBuildings,
			activeRecipes,
			activeWorkerNeeds,
			activeNeeds,
			experts,
			activeCogc,
			planetFactor,
			getPrice,
			activeFaction,
			usedPermits,
			totalPermits,
		],
	);

	/**
	 * Filters recipes to only show those that can be produced in the currently
	 * selected platform when adding a new recipe.
	 */
	const availableRecipesForPlatform = useMemo(() => {
		if (!isAddingRecipe) return [];
		const platform = activeData.platforms.find(
			(p: any) => p.id === isAddingRecipe,
		);
		if (!platform) return [];

		const effData = metrics.platformEfficiencies[isAddingRecipe] || {
			total: 100,
		};
		const speedEff = effData.total || 100;

		return activeRecipes
			.filter(
				(r) =>
					String(r.madeIn || "")
						.trim()
						.toUpperCase() ===
					String(platform.buildingTicker || "")
						.trim()
						.toUpperCase(),
			)
			.map((r) => ({
				...r,
				// Adjust duration based on platform efficiency
				modifiedDuration: r.duration / Math.max(0.0001, speedEff / 100),
			}));
	}, [
		isAddingRecipe,
		activeData.platforms,
		activeRecipes,
		metrics.platformEfficiencies,
	]);

	// Initialize planner portal root and copy data to draft when opened
	useEffect(() => {
		if (isPlannerOpen && !standalone)
			setModalRoot(document.getElementById("node-modal-root"));
		if (isPlannerOpen) setDraftBaseData(user.baseData);
	}, [isPlannerOpen, user.baseData, standalone]);

	// --- Handlers ---

	/**
	 * Helper function to update the draft base state with new platforms, infra, or permits.
	 */
	const saveEdits = (platforms: any[], infra: any[], permitLevel: 1 | 2 | 3) =>
		setDraftBaseData((p) => ({
			...p,
			platforms,
			infrastructure: infra,
			permitLevel,
		}));

	/**
	 * Persists the drafted plan to the user's profile and closes the planner.
	 */
	const handleSavePlan = () => {
		onUpdateUser({
			...user,
			baseData: draftBaseData,
			activeNeeds,
			experts,
			planetFactor,
			activeCogc,
			faction: activeFaction,
			usedPermits,
			totalPermits,
			planDefaultPricing,
			globalMatPrices,
			ioDisplayMode,
		});
		if (!standalone) setIsPlannerOpen(false);
	};

	// --- Render Methods ---

	if (isUninitialized) {
		return (
			<Box
				sx={{
					mt: 1,
					p: 2,
					textAlign: "center",
					border: "1px dashed",
					borderColor: "divider",
					borderRadius: 1,
				}}
			>
				<Typography variant="subtitle2" color="warning.main" gutterBottom>
					Base Not Found on {planetName}
				</Typography>
				<Button
					variant="contained"
					color="primary"
					size="small"
					startIcon={<BuildIcon />}
					onClick={() => {
						// Initialize a default empty base for the user
						onUpdateUser({
							...user,
							baseData: {
								...user.baseData,
								status: "manual",
								platforms: [],
								infrastructure: [],
								orderQueue: [],
								permitLevel: 1,
							},
						});
						setIsPlannerOpen(true);
					}}
				>
					Create Manual Base
				</Button>
			</Box>
		);
	}

	// UI Definition for the Planner interface
	const PlannerUI = (
		<Box
			sx={{
				position: standalone ? "relative" : "absolute",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				zIndex: standalone ? 1 : 1350,
				bgcolor: "background.default",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				height: standalone ? "100vh" : "auto",
			}}
		>
			{/* Top Navigation Bar within Planner */}
			<AppBar
				sx={{
					position: "relative",
					bgcolor: "background.paper",
					borderBottom: "1px solid",
					borderColor: "divider",
				}}
				elevation={0}
			>
				<Toolbar variant="dense" sx={{ overflowX: "auto" }}>
					{!standalone && (
						<IconButton
							edge="start"
							color="inherit"
							onClick={() => {
								setDraftBaseData(user.baseData); // Revert drafts
								setIsPlannerOpen(false);
							}}
						>
							<ArrowBackIcon />
						</IconButton>
					)}
					<Typography
						sx={{
							ml: standalone ? 0 : 2,
							mr: "auto",
							flexShrink: 0,
							fontWeight: "bold",
						}}
						variant="subtitle1"
						color="text.primary"
					>
						{user.displayName} • {planetName} Planner
					</Typography>

					<Button
						color="inherit"
						onClick={() => setIsSettingsOpen(true)}
						startIcon={<SettingsIcon />}
						sx={{ mr: 2, bgcolor: alpha("#8B949E", 0.1) }}
					>
						Settings
					</Button>
					{!standalone && (
						<Button
							color="inherit"
							onClick={() => {
								setDraftBaseData(user.baseData); // Revert drafts
								setIsPlannerOpen(false);
							}}
							size="small"
							variant="outlined"
							sx={{ mr: 1 }}
						>
							Cancel
						</Button>
					)}
					<Button
						color="secondary"
						onClick={handleSavePlan}
						size="small"
						variant="contained"
						startIcon={<SaveIcon />}
					>
						Save Plan
					</Button>
				</Toolbar>
			</AppBar>

			{/* Main Grid Content Area */}
			<Box
				sx={{
					p: 2,
					flexGrow: 1,
					display: "flex",
					flexDirection: "column",
					gap: 2,
					overflow: "hidden",
					minHeight: 0,
				}}
			>
				{/* Top Metrics Section (Costs, Needs, Efficiency) */}
				<Box
					sx={{
						display: "flex",
						flexShrink: 0,
						height: { xs: "auto", lg: "40%" },
						minHeight: { lg: 280 },
					}}
				>
					<TopMetricsGrid
						activeData={activeData}
						activeBuildings={activeBuildings}
						activeNeeds={activeNeeds}
						setActiveNeeds={setActiveNeeds}
						getBuildingCost={getBuildingCost}
						activeCogc={activeCogc}
						setActiveCogc={setActiveCogc}
						planetFactor={planetFactor}
						setPlanetFactor={setPlanetFactor}
						materialIO={metrics.materialIO}
						ioDisplayMode={ioDisplayMode}
						setIoDisplayMode={setIoDisplayMode}
						totalDailyProfit={metrics.totalDailyProfit}
						getPrice={getPrice}
						handleAdjustPermit={(change: number) =>
							saveEdits(
								activeData.platforms,
								activeData.infrastructure,
								Math.max(1, Math.min(3, activeData.permitLevel + change)) as
									| 1
									| 2
									| 3,
							)
						}
						{...metrics}
					/>
				</Box>

				{/* Production and Platform Grid */}
				<Box sx={{ display: "flex", flexGrow: 1, minHeight: 0 }}>
					<ProductionGrid
						activeData={activeData}
						activeBuildings={activeBuildings}
						activeRecipes={activeRecipes}
						getPrice={getPrice}
						getBuildingCost={getBuildingCost}
						setIsEditingPlatform={setIsEditingPlatform}
						setIsAddingRecipe={setIsAddingRecipe}
						setSelectedRecipe={setSelectedRecipe}
						buildMaterials={metrics.buildMaterials}
						totalCapEx={metrics.totalCapEx}
						handleAdjustPlatformAmount={(id: string, change: number) => {
							let p = [...activeData.platforms];
							const ex = p.findIndex((x) => x.id === id);
							if (ex > -1) p[ex].amount = Math.max(1, p[ex].amount + change);
							saveEdits(p, activeData.infrastructure, activeData.permitLevel);
						}}
						handleRemovePlatform={(id: string) =>
							saveEdits(
								activeData.platforms.filter((p: any) => p.id !== id),
								activeData.infrastructure,
								activeData.permitLevel,
							)
						}
						handleAddSpecificRecipe={(id: string, rId: string) =>
							saveEdits(
								activeData.platforms.map((p: any) =>
									p.id === id
										? { ...p, activeRecipes: [...(p.activeRecipes || []), rId] }
										: p,
								),
								activeData.infrastructure,
								activeData.permitLevel,
							)
						}
						handleRemoveSpecificRecipe={(id: string, rId: string) => {
							const p = activeData.platforms.find((x: any) => x.id === id);
							if (!p) return;
							const i = p.activeRecipes.indexOf(rId);
							if (i > -1) {
								const nQ = [...p.activeRecipes];
								nQ.splice(i, 1);
								saveEdits(
									activeData.platforms.map((x: any) =>
										x.id === id ? { ...x, activeRecipes: nQ } : x,
									),
									activeData.infrastructure,
									activeData.permitLevel,
								);
							}
						}}
						handleAdjustInfra={(t: string, change: number) => {
							let i = [...activeData.infrastructure];
							const ex = i.findIndex((x) => x.buildingTicker === t);
							if (ex > -1) {
								i[ex].amount = Math.max(0, i[ex].amount + change);
								if (i[ex].amount === 0) i.splice(ex, 1); // Remove if amount goes to 0
							} else if (change > 0)
								i.push({ id: uuidv4(), buildingTicker: t, amount: change });
							saveEdits(activeData.platforms, i, activeData.permitLevel);
						}}
						{...metrics}
					/>
				</Box>
			</Box>

			{/* Configuration Dialogs */}
			<SettingsDialog
				open={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
				syncMode={syncMode}
				setSyncMode={setSyncMode}
				setDraftBaseData={setDraftBaseData}
				planDefaultPricing={planDefaultPricing}
				setPlanDefaultPricing={setPlanDefaultPricing}
				allUniqueMaterials={metrics.allUniqueMaterials}
				globalMatPrices={globalMatPrices}
				setGlobalMatPrices={setGlobalMatPrices}
				activeFaction={activeFaction}
				setActiveFaction={setActiveFaction}
				usedPermits={usedPermits}
				setUsedPermits={setUsedPermits}
				totalPermits={totalPermits}
				setTotalPermits={setTotalPermits}
				experts={experts}
				setExperts={setExperts}
			/>
			<AddPlatformDialog
				open={isEditingPlatform}
				onClose={() => setIsEditingPlatform(false)}
				newTicker={newPlatformTicker}
				setNewTicker={setNewPlatformTicker}
				newAmount={newPlatformAmount}
				setNewAmount={setNewPlatformAmount}
				activeBuildings={activeBuildings}
				onAdd={() => {
					let p = [...activeData.platforms];
					const ex = p.find((x: any) => x.buildingTicker === newPlatformTicker);
					if (ex)
						ex.amount += newPlatformAmount; // Increase amount if platform already exists
					else
						p.push({
							id: uuidv4(),
							buildingTicker: newPlatformTicker,
							amount: newPlatformAmount,
							activeRecipes: [],
						});
					saveEdits(p, activeData.infrastructure, activeData.permitLevel);
					setIsEditingPlatform(false);
					setNewPlatformAmount(1); // Reset form state
				}}
			/>
			<AddRecipeDialog
				open={!!isAddingRecipe}
				onClose={() => setIsAddingRecipe(null)}
				selected={selectedRecipe}
				setSelected={setSelectedRecipe}
				available={availableRecipesForPlatform}
				onAdd={() => {
					saveEdits(
						activeData.platforms.map((p: any) =>
							p.id === isAddingRecipe
								? {
										...p,
										activeRecipes: [...(p.activeRecipes || []), selectedRecipe],
									}
								: p,
						),
						activeData.infrastructure,
						activeData.permitLevel,
					);
					setIsAddingRecipe(null);
				}}
			/>
		</Box>
	);

	if (standalone) return PlannerUI;

	// In non-standalone mode, render a button to open the planner using a React Portal
	return (
		<>
			<Button
				variant="outlined"
				size="small"
				onClick={() => setIsPlannerOpen(true)}
				startIcon={<BuildIcon />}
				sx={{ mt: 1, width: "100%" }}
			>
				Open Site Planner
			</Button>
			{isPlannerOpen && modalRoot ? createPortal(PlannerUI, modalRoot) : null}
		</>
	);
};
