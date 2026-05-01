import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Box, Typography, Button, AppBar, Toolbar, alpha } from "@mui/material";
import {
	Build as BuildIcon,
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
import type { BaseManagerProps } from "./types";
import { formatDuration, calculateBaseMetrics } from "./helpers";
import { useBaseManagerData } from "./api";
import { TopMetricsGrid } from "./TopMetricsGrid";
import { ProductionGrid } from "./ProductionGrid";
import { SettingsDialog, AddRecipeDialog } from "./Dialogs";

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
	currentUserId,
	isGroupOwner,
	planetName = "Unknown Planet",
	staticData,
	standalone = false,
	planName,
	planDescription,
	onClose,
	cx = "IC1",
	isGuestMode = false,
	suggestions = [],
	onSaveSuggestion,
	onSetPrimarySuggestion,
	onDeleteSuggestion,
	primarySuggestionId = null,
	readOnly = false,
}) => {
	// Determines if the user has initialized a base on this planet yet
	const isUninitialized = user.baseData.status === "uninitialized";

	// UI State: Controls whether the planner view is visible
	const [isPlannerOpen, setIsPlannerOpen] = useState(standalone);
	// Ref to the DOM element where the planner portal will be injected
	const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

	const [viewingSuggestionId, setViewingSuggestionId] = useState<string | null>(
		primarySuggestionId,
	);
	const [showDiff, setShowDiff] = useState(false);
	const [diffAgainstId, setDiffAgainstId] = useState<string | null>(null);

	useEffect(() => {
		// Default diff behavior:
		// - Viewing Original: compare against Primary suggestion (if any)
		// - Viewing Suggestion: compare against Original by default
		if (!viewingSuggestionId) setDiffAgainstId(primarySuggestionId || null);
		else setDiffAgainstId("__original__");
		setShowDiff(false);
	}, [viewingSuggestionId, primarySuggestionId]);

	const comparisonData = useMemo(() => {
		if (!showDiff) return null;
		if (!viewingSuggestionId) {
			const baselineId = diffAgainstId || primarySuggestionId;
			if (!baselineId) return null;
			return suggestions.find((s) => s.id === baselineId)?.baseData || null;
		}
		if (diffAgainstId === "__original__" || !diffAgainstId)
			return user.baseData;
		if (diffAgainstId === viewingSuggestionId) return null;
		return suggestions.find((s) => s.id === diffAgainstId)?.baseData || null;
		return null;
	}, [
		showDiff,
		viewingSuggestionId,
		primarySuggestionId,
		diffAgainstId,
		suggestions,
		user.baseData,
	]);

	const getInitialData = () => {
		if (viewingSuggestionId) {
			const s = suggestions.find((x) => x.id === viewingSuggestionId);
			if (s) return s.baseData;
		}
		return user.baseData;
	};

	// State for the "draft" base data, allowing edits without immediately saving
	const [draftBaseData, setDraftBaseData] = useState(getInitialData());

	// The current data being used to calculate metrics.
	// If the planner is open, we use the draft; otherwise, we use the saved user data.
	const activeData = isPlannerOpen ? draftBaseData : getInitialData();

	const { data: baseManagerData } = useBaseManagerData(cx);

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
	const [autoHabEnabled, setAutoHabEnabled] = useState(false);
	const [autoHabStrategy, setAutoHabStrategy] = useState<"area" | "cost">(
		"area",
	);

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
	const activePrices = useMemo(() => {
		if (baseManagerData) {
			const pricesRecord: Record<string, { market: number; corp: number }> = {
				...FALLBACK_PRICES,
			};
			baseManagerData.cxPrices?.forEach((p) => {
				if (!pricesRecord[p.ticker])
					pricesRecord[p.ticker] = { market: p.price, corp: p.price };
				else
					pricesRecord[p.ticker].market =
						p.price > 0 && !isNaN(p.price)
							? p.price
							: pricesRecord[p.ticker].market;
			});
			baseManagerData.corpPrices?.forEach((p) => {
				if (pricesRecord[p.ticker])
					pricesRecord[p.ticker].corp =
						p.price > 0 && !isNaN(p.price)
							? p.price
							: pricesRecord[p.ticker].corp;
			});
			return pricesRecord;
		}
		return FALLBACK_PRICES;
	}, [baseManagerData]);
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
		if (isPlannerOpen) setDraftBaseData(getInitialData());
	}, [isPlannerOpen, user.baseData, standalone, viewingSuggestionId]);

	// --- Handlers ---

	const handleAutoManageHabitation = useCallback(
		(strategy: "area" | "cost") => {
			if (readOnly) return;
			const infraBuildings = activeBuildings.filter(
				(b: any) => b.type === "infrastructure" && b.supply,
			);
			const byWorker: Record<string, any[]> = {};
			infraBuildings.forEach((b: any) => {
				Object.entries(b.supply || {}).forEach(([worker]) => {
					const w = String(worker);
					if (!byWorker[w]) byWorker[w] = [];
					byWorker[w].push(b);
				});
			});

			const desired: Record<
				string,
				{ buildingTicker: string; amount: number }
			> = {};
			Object.entries(metrics.workforce || {}).forEach(([worker, d]: any) => {
				const demand = Number(d?.demand || 0);
				if (demand <= 0) return;
				const options = byWorker[worker] || [];
				if (options.length === 0) return;
				const pick = [...options].sort((a, b) => {
					const aSupply = Number((a.supply || {})[worker] || 0) || 1;
					const bSupply = Number((b.supply || {})[worker] || 0) || 1;
					const aAreaPer = Number(a.area || 0) / aSupply;
					const bAreaPer = Number(b.area || 0) / bSupply;
					const aCostPer = getBuildingCost(a.ticker) / aSupply;
					const bCostPer = getBuildingCost(b.ticker) / bSupply;
					return strategy === "cost"
						? aCostPer - bCostPer
						: aAreaPer - bAreaPer;
				})[0];
				const supplyPer = Number((pick.supply || {})[worker] || 0) || 1;
				desired[worker] = {
					buildingTicker: pick.ticker,
					amount: Math.ceil(demand / supplyPer),
				};
			});

			setDraftBaseData((prev: any) => {
				const infra = [...(prev.infrastructure || [])];
				const tickers = new Set(
					Object.values(desired).map((x) => x.buildingTicker),
				);
				// If nothing changes, avoid churn.
				const existingMap: Record<string, number> = {};
				infra.forEach((x: any) => {
					existingMap[x.buildingTicker] = Number(x.amount) || 0;
				});
				const desiredTickers = Object.values(desired).map(
					(x) => x.buildingTicker,
				);
				const noChange = desiredTickers.every(
					(t) =>
						existingMap[t] ===
						(Object.values(desired).find((x) => x.buildingTicker === t)
							?.amount || 0),
				);
				if (noChange) return prev;

				const nextInfra = infra
					.filter((x: any) => !tickers.has(x.buildingTicker))
					.concat(
						Object.values(desired).map((x) => ({
							id: uuidv4(),
							buildingTicker: x.buildingTicker,
							amount: x.amount,
						})),
					);
				return { ...prev, infrastructure: nextInfra };
			});
		},
		[readOnly, activeBuildings, metrics.workforce, getBuildingCost],
	);

	useEffect(() => {
		if (!autoHabEnabled) return;
		handleAutoManageHabitation(autoHabStrategy);
	}, [
		autoHabEnabled,
		autoHabStrategy,
		handleAutoManageHabitation,
		// re-run when workforce demand changes due to platform edits
		JSON.stringify(
			Object.fromEntries(
				Object.entries(metrics.workforce || {}).map(([k, v]: any) => [
					k,
					v?.demand || 0,
				]),
			),
		),
	]);

	/**
	 * Helper function to update the draft base state with new platforms, infra, or permits.
	 */
	const saveEdits = (
		platforms: any[],
		infra: any[],
		permitLevel: 1 | 2 | 3,
	) => {
		if (readOnly) return;
		setDraftBaseData((p: any) => ({
			...p,
			platforms,
			infrastructure: infra,
			permitLevel,
		}));
	};

	/**
	 * Persists the drafted plan to the user's profile and closes the planner.
	 */
	const handleSavePlan = () => {
		if (readOnly) {
			if (!standalone) setIsPlannerOpen(false);
			onClose?.();
			return;
		}
		if (isGuestMode) {
			if (onSaveSuggestion) {
				const currentSuggestion = suggestions?.find(
					(s) => s.id === viewingSuggestionId,
				);
				const isOwnSuggestion =
					currentSuggestion &&
					!!currentUserId &&
					currentSuggestion.authorId === currentUserId;
				const suggestionId = isOwnSuggestion ? viewingSuggestionId : uuidv4();

				onSaveSuggestion({
					id: suggestionId,
					authorId: currentUserId,
					authorName: isOwnSuggestion
						? currentSuggestion.authorName
						: localStorage.getItem("displayName") || "Guest User",
					name: isOwnSuggestion ? currentSuggestion.name : "Suggested Changes",
					baseData: draftBaseData,
					activeNeeds,
					experts,
					planetFactor,
					activeCogc,
					faction: activeFaction,
					usedPermits,
					totalPermits,
				});
			}
			if (!standalone) setIsPlannerOpen(false);
			onClose?.();
			return;
		}

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
		onClose?.();
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
					disabled={readOnly}
					onClick={() => {
						if (readOnly) return;
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
				<Toolbar
					variant="dense"
					sx={{ overflowX: "auto", display: "flex", alignItems: "center" }}
				>
					<Button
						color="inherit"
						onClick={() => {
							if (!readOnly) setDraftBaseData(user.baseData); // Revert drafts
							if (!standalone) setIsPlannerOpen(false);
							onClose?.();
						}}
						size="small"
						variant="outlined"
						sx={{ mr: 2 }}
					>
						{readOnly ? "Close View" : "Cancel"}
					</Button>

					<Box sx={{ display: "flex", flexDirection: "column", mr: "auto" }}>
						<Typography
							variant="subtitle1"
							color="text.primary"
							sx={{ fontWeight: "bold" }}
						>
							{planName
								? `${planetName} • ${planName}`
								: `${user.displayName} • ${planetName} Planner`}
							{readOnly && " (View Only)"}
							{!readOnly && isGuestMode && " (Guest Mode)"}
						</Typography>
						{planDescription && (
							<Typography variant="caption" color="text.secondary">
								{planDescription}
							</Typography>
						)}
					</Box>

					{suggestions && suggestions.length > 0 && (
						<Box sx={{ mr: 2, display: "flex", alignItems: "center", gap: 1 }}>
							<Typography variant="caption" color="text.secondary">
								Viewing:
							</Typography>
							<select
								value={viewingSuggestionId || ""}
								onChange={(e) => {
									setViewingSuggestionId(e.target.value || null);
									setShowDiff(false);
								}}
								style={{
									padding: "4px",
									borderRadius: "4px",
									backgroundColor: "#1e1e1e",
									color: "white",
									border: "1px solid #555",
								}}
							>
								<option value="">Original Plan</option>
								{suggestions.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name} (by {s.authorName})
									</option>
								))}
							</select>
							{((!viewingSuggestionId &&
								(diffAgainstId || primarySuggestionId)) ||
								viewingSuggestionId) && (
								<Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
									<Typography
										variant="caption"
										sx={{ cursor: "pointer", opacity: showDiff ? 1 : 0.6 }}
										onClick={() => setShowDiff(!showDiff)}
									>
										Show Diff
									</Typography>
									<input
										type="checkbox"
										checked={showDiff}
										onChange={(e) => setShowDiff(e.target.checked)}
										style={{ marginLeft: 4 }}
									/>
								</Box>
							)}
							{showDiff && viewingSuggestionId && (
								<Box
									sx={{ display: "flex", alignItems: "center", ml: 1, gap: 1 }}
								>
									<Typography variant="caption" color="text.secondary">
										Diff vs:
									</Typography>
									<select
										value={diffAgainstId || "__original__"}
										onChange={(e) => setDiffAgainstId(e.target.value)}
										style={{
											padding: "4px",
											borderRadius: "4px",
											backgroundColor: "#1e1e1e",
											color: "white",
											border: "1px solid #555",
										}}
									>
										<option value="__original__">Original Plan</option>
										{suggestions
											.filter((s) => s.id !== viewingSuggestionId)
											.map((s) => (
												<option key={s.id} value={s.id}>
													{s.name}
												</option>
											))}
									</select>
								</Box>
							)}
							{!readOnly &&
								!isGuestMode &&
								viewingSuggestionId &&
								onSetPrimarySuggestion && (
									<Button
										size="small"
										variant={
											primarySuggestionId === viewingSuggestionId
												? "contained"
												: "outlined"
										}
										color={
											primarySuggestionId === viewingSuggestionId
												? "success"
												: "primary"
										}
										onClick={() =>
											onSetPrimarySuggestion(
												primarySuggestionId === viewingSuggestionId
													? null
													: viewingSuggestionId,
											)
										}
										sx={{
											ml: 1,
											minWidth: "max-content",
											height: 28,
											fontSize: "0.7rem",
										}}
									>
										{primarySuggestionId === viewingSuggestionId
											? "Primary"
											: "Set Primary"}
									</Button>
								)}
							{!readOnly &&
								!isGuestMode &&
								viewingSuggestionId &&
								onDeleteSuggestion && (
									<Button
										size="small"
										variant="outlined"
										color="error"
										onClick={() => {
											if (
												window.confirm(
													"Are you sure you want to delete this suggestion?",
												)
											) {
												onDeleteSuggestion(viewingSuggestionId);
												setViewingSuggestionId(null);
												setShowDiff(false);
											}
										}}
										sx={{
											ml: 1,
											minWidth: "max-content",
											height: 28,
											fontSize: "0.7rem",
										}}
									>
										Delete
									</Button>
								)}
						</Box>
					)}

					{!readOnly && (
						<>
							<Button
								color="inherit"
								onClick={() => setIsSettingsOpen(true)}
								startIcon={<SettingsIcon />}
								sx={{ mr: 2, bgcolor: alpha("#8B949E", 0.1) }}
							>
								Settings
							</Button>
							{(!isGuestMode || !!currentUserId) && (
								<Button
									color={isGuestMode ? "primary" : "secondary"}
									onClick={handleSavePlan}
									size="small"
									variant="contained"
									startIcon={<SaveIcon />}
								>
									{isGuestMode
										? viewingSuggestionId
											? "Update Suggestion"
											: "Submit Suggestion"
										: viewingSuggestionId
											? "Apply to Original Plan"
											: "Save Plan"}
								</Button>
							)}
						</>
					)}
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
						setActiveNeeds={(next) => {
							if (readOnly) return;
							setActiveNeeds(next as any);
						}}
						getBuildingCost={getBuildingCost}
						activeCogc={activeCogc}
						setActiveCogc={(next) => {
							if (readOnly) return;
							setActiveCogc(next);
						}}
						planetFactor={planetFactor}
						setPlanetFactor={(next) => {
							if (readOnly) return;
							setPlanetFactor(next);
						}}
						materialIO={metrics.materialIO}
						ioDisplayMode={ioDisplayMode}
						setIoDisplayMode={(next) => {
							if (readOnly) return;
							setIoDisplayMode(next);
						}}
						totalDailyProfit={metrics.totalDailyProfit}
						totalVolumeImport={metrics.totalVolumeImport}
						totalVolumeExport={metrics.totalVolumeExport}
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
						comparisonData={comparisonData}
						activeBuildings={activeBuildings}
						activeRecipes={activeRecipes}
						getPrice={getPrice}
						getBuildingCost={getBuildingCost}
						onAddPlatform={(ticker: string, amount: number) => {
							if (readOnly) return;
							const p = [...activeData.platforms];
							const ex = p.find((x: any) => x.buildingTicker === ticker);
							if (ex) ex.amount += amount;
							else
								p.push({
									id: uuidv4(),
									buildingTicker: ticker,
									amount,
									activeRecipes: [],
								});
							saveEdits(p, activeData.infrastructure, activeData.permitLevel);
						}}
						setIsAddingRecipe={(id) => {
							if (readOnly) return;
							setIsAddingRecipe(id);
						}}
						setSelectedRecipe={(id) => {
							if (readOnly) return;
							setSelectedRecipe(id);
						}}
						buildMaterials={metrics.buildMaterials}
						totalCapEx={metrics.totalCapEx}
						handleAdjustPlatformAmount={(id: string, change: number) => {
							if (readOnly) return;
							const p = [...activeData.platforms];
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
							if (readOnly) return;
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
							if (readOnly) return;
							const i = [...activeData.infrastructure];
							const ex = i.findIndex((x) => x.buildingTicker === t);
							if (ex > -1) {
								i[ex].amount = Math.max(0, i[ex].amount + change);
								if (i[ex].amount === 0) i.splice(ex, 1); // Remove if amount goes to 0
							} else if (change > 0)
								i.push({ id: uuidv4(), buildingTicker: t, amount: change });
							saveEdits(activeData.platforms, i, activeData.permitLevel);
						}}
						autoHabEnabled={autoHabEnabled}
						autoHabStrategy={autoHabStrategy}
						onToggleAutoHab={(enabled) => {
							if (readOnly) return;
							setAutoHabEnabled(enabled);
							if (enabled) handleAutoManageHabitation(autoHabStrategy);
						}}
						onChangeAutoHabStrategy={(strategy) => {
							if (readOnly) return;
							setAutoHabStrategy(strategy);
							if (autoHabEnabled) handleAutoManageHabitation(strategy);
						}}
						onAutoManageHabitation={handleAutoManageHabitation}
						{...metrics}
					/>
				</Box>
			</Box>

			{/* Configuration Dialogs */}
			<SettingsDialog
				open={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
				syncMode={syncMode}
				setSyncMode={(next) => {
					if (readOnly) return;
					setSyncMode(next);
				}}
				setDraftBaseData={(next) => {
					if (readOnly) return;
					setDraftBaseData(next);
				}}
				planDefaultPricing={planDefaultPricing}
				setPlanDefaultPricing={(next) => {
					if (readOnly) return;
					setPlanDefaultPricing(next);
				}}
				allUniqueMaterials={metrics.allUniqueMaterials}
				globalMatPrices={globalMatPrices}
				setGlobalMatPrices={(next) => {
					if (readOnly) return;
					setGlobalMatPrices(next as any);
				}}
				activeFaction={activeFaction}
				setActiveFaction={(next) => {
					if (readOnly) return;
					setActiveFaction(next);
				}}
				usedPermits={usedPermits}
				setUsedPermits={(next) => {
					if (readOnly) return;
					setUsedPermits(next);
				}}
				totalPermits={totalPermits}
				setTotalPermits={(next) => {
					if (readOnly) return;
					setTotalPermits(next);
				}}
				experts={experts}
				setExperts={(next) => {
					if (readOnly) return;
					setExperts(next as any);
				}}
			/>
			<AddRecipeDialog
				open={!!isAddingRecipe}
				onClose={() => setIsAddingRecipe(null)}
				selected={selectedRecipe}
				setSelected={(next) => {
					if (readOnly) return;
					setSelectedRecipe(next);
				}}
				available={availableRecipesForPlatform}
				onAdd={() => {
					if (readOnly) return;
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
