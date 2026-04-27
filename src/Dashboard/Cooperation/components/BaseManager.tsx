import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
	Box,
	Typography,
	Button,
	Card,
	CardContent,
	TextField,
	IconButton,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	MenuItem,
	Select,
	InputLabel,
	FormControl,
	AppBar,
	Toolbar,
	Switch,
	FormControlLabel,
	alpha,
	useTheme,
	ToggleButton,
	ToggleButtonGroup,
	Divider,
	Tooltip,
} from "@mui/material";
import {
	Add as AddIcon,
	Remove as RemoveIcon,
	Delete as DeleteIcon,
	Build as BuildIcon,
	ArrowBack as ArrowBackIcon,
	RequestQuote as PriceIcon,
	Settings as SettingsIcon,
	CloudSync as SyncIcon,
	Save as SaveIcon,
	Loop as LoopIcon,
	School as ExpertIcon,
} from "@mui/icons-material";
import type {
	NodeAssignedUser,
	BasePlatform,
	BaseInfrastructure,
	StaticData,
} from "../types";
import { v4 as uuidv4 } from "uuid";

// ==========================================
// CONSTANTS & GAME DATA
// ==========================================

const EXPERT_BONUS = [0, 0.0306, 0.0696, 0.1248, 0.1974, 0.284];
const EXPERT_CATEGORIES = [
	"Agriculture",
	"Chemistry",
	"Construction",
	"Electronics",
	"Food Industries",
	"Fuel Refining",
	"Manufacturing",
	"Metallurgy",
	"Resource Extraction",
];

const LUXURY_MULTIPLIERS: Record<number, number[]> = {
	0: [1.0],
	1: [0.8667, 1.0],
	2: [0.7944, 0.8667, 1.0],
	3: [0.7445, 0.7944, 0.8667, 1.0],
	4: [0.708, 0.7445, 0.7944, 0.8667, 1.0],
};

const WORKER_NEEDS: Record<
	string,
	{ essentials: string[]; luxuries: string[] }
> = {
	Pioneer: { essentials: ["RAT", "DW", "O2"], luxuries: [] },
	Settler: { essentials: ["RAT", "DW", "O2"], luxuries: ["REP"] },
	Technician: { essentials: ["RAT", "DW", "O2"], luxuries: ["REP", "COF"] },
	Engineer: { essentials: ["RAT", "DW", "O2"], luxuries: ["REP", "COF", "SN"] },
	Scientist: {
		essentials: ["RAT", "DW", "O2"],
		luxuries: ["REP", "COF", "SN", "SC"],
	},
};

const PERMIT_AREAS = { 1: 500, 2: 750, 3: 1000 };

const FALLBACK_PRICES: Record<string, { market: number; corp: number }> = {
	BSE: { market: 1500, corp: 1200 },
	BBH: { market: 2000, corp: 1600 },
	TRU: { market: 5000, corp: 4500 },
	H2O: { market: 10, corp: 8 },
	ENG: { market: 120, corp: 100 },
	BIO: { market: 35, corp: 30 },
	GAS: { market: 85, corp: 75 },
	ORE: { market: 25, corp: 20 },
	MTL: { market: 210, corp: 180 },
	FEO: { market: 10, corp: 8 },
	FE: { market: 120, corp: 100 },
	STL: { market: 800, corp: 700 },
	AIR: { market: 10000, corp: 9000 },
};

const FALLBACK_BUILDINGS = [
	{
		ticker: "FRM",
		name: "Farm",
		type: "production",
		area: 150,
		buildReq: [
			{ ticker: "BSE", amount: 20 },
			{ ticker: "TRU", amount: 2 },
		],
		workers: { Pioneer: 50, Settler: 20 },
		category: "Agriculture",
	},
	{
		ticker: "RIG",
		name: "Rig",
		type: "production",
		area: 100,
		buildReq: [
			{ ticker: "BSE", amount: 15 },
			{ ticker: "TRU", amount: 5 },
		],
		workers: { Pioneer: 40, Technician: 10 },
		category: "Resource Extraction",
	},
	{
		ticker: "SME",
		name: "Smelter",
		type: "production",
		area: 200,
		buildReq: [
			{ ticker: "BSE", amount: 30 },
			{ ticker: "TRU", amount: 8 },
		],
		workers: { Settler: 40, Technician: 20 },
		category: "Metallurgy",
	},
	{
		ticker: "HB1",
		name: "Pioneer Hab",
		type: "infrastructure",
		area: 50,
		buildReq: [{ ticker: "BBH", amount: 10 }],
		supply: { Pioneer: 100 },
	},
	{
		ticker: "STO",
		name: "Storage",
		type: "infrastructure",
		area: 100,
		buildReq: [{ ticker: "BSE", amount: 15 }],
		storageWeight: 1000,
		storageVolume: 1000,
	},
] as any[];

const FALLBACK_RECIPES = [
	{
		id: "R-FEO",
		name: "Extract FEO",
		shortName: "FEO [Ext]",
		duration: 1000,
		madeIn: "EXT",
		ticker: "FEO",
		inputs: [],
		outputs: [{ ticker: "FEO", amount: 1 }],
	},
	{
		id: "R-FE",
		name: "Smelt FE",
		shortName: "FE [FEO]",
		duration: 1000,
		madeIn: "SME",
		ticker: "FE",
		inputs: [{ ticker: "FEO", amount: 10 }],
		outputs: [{ ticker: "FE", amount: 1 }],
	},
];

// ==========================================
// HELPERS & SUBCOMPONENTS
// ==========================================

const formatCurrency = (val: number) =>
	new Intl.NumberFormat("en-US", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(val);
const formatDuration = (seconds: number) => {
	const d = Math.floor(seconds / 86400);
	const h = Math.floor((seconds % 86400) / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	let parts = [];
	if (d > 0) parts.push(`${d}d`);
	if (h > 0) parts.push(`${h}h`);
	if (m > 0) parts.push(`${m}m`);
	return parts.length > 0 ? parts.join(" ") : `${Math.floor(seconds)}s`;
};

const StorageProgressBar = ({
	label,
	current,
	dailyImport,
	dailyExport,
	max,
	unit,
}: any) => {
	const netDaily = dailyExport - dailyImport;
	const currentPct = Math.min(100, (current / max) * 100);
	const dailyPct = (Math.abs(netDaily) / max) * 100;
	const isOverCap = current + netDaily > max;
	const isNegative = netDaily < 0;

	let timeText = "Stable";
	if (netDaily > 0 && !isOverCap)
		timeText = `${((max - current) / netDaily).toFixed(1)}d`;
	else if (netDaily < 0)
		timeText = `${(current / Math.abs(netDaily)).toFixed(1)}d`;
	else if (isOverCap) timeText = "Full!";

	return (
		<Box sx={{ mb: 1.5 }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					mb: 0.5,
					alignItems: "flex-end",
				}}
			>
				<Box>
					<Typography
						variant="caption"
						fontWeight="bold"
						display="block"
						fontSize="0.75rem"
					>
						{label}
					</Typography>
					<Typography
						variant="caption"
						color="textSecondary"
						sx={{ fontSize: "0.7rem" }}
					>
						<span style={{ color: "#4CAF50" }}>+{dailyExport.toFixed(0)}</span>{" "}
						/{" "}
						<span style={{ color: "#E53935" }}>-{dailyImport.toFixed(0)}</span>{" "}
						/d
					</Typography>
				</Box>
				<Typography variant="caption" color="textSecondary" fontSize="0.75rem">
					{current.toFixed(0)}/{max} {unit} ({timeText})
				</Typography>
			</Box>
			<Box
				sx={{
					width: "100%",
					height: 10,
					bgcolor: "action.hover",
					borderRadius: 1,
					overflow: "hidden",
					display: "flex",
					position: "relative",
				}}
			>
				<Box
					sx={{
						width: `${isNegative ? Math.max(0, currentPct - dailyPct) : currentPct}%`,
						bgcolor: "info.main",
						height: "100%",
						transition: "width 0.3s",
					}}
				/>
				{netDaily > 0 && (
					<Box
						sx={{
							width: `${Math.min(100 - currentPct, dailyPct)}%`,
							bgcolor: isOverCap ? "error.main" : "warning.main",
							height: "100%",
						}}
					/>
				)}
				{netDaily < 0 && (
					<Box
						sx={{
							position: "absolute",
							right: `${100 - currentPct}%`,
							width: `${Math.min(currentPct, dailyPct)}%`,
							bgcolor: "error.main",
							height: "100%",
							opacity: 0.6,
						}}
					/>
				)}
			</Box>
		</Box>
	);
};

const ExpertsDialog = ({ open, onClose, experts, setExperts }: any) => (
	<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
		<DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
			Assign Experts
		</DialogTitle>
		<DialogContent sx={{ pt: 2 }}>
			<Box
				sx={{
					p: 1.5,
					mb: 2,
					bgcolor: "error.light",
					borderRadius: 1,
					color: "error.dark",
				}}
			>
				<Typography variant="body2" fontWeight="bold">
					Maximum number of experts on a base is 6. Assigned:{" "}
					{Object.values(experts).reduce((a: any, b: any) => a + b, 0)}
				</Typography>
			</Box>
			<Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
				{EXPERT_CATEGORIES.map((cat) => {
					const val = experts[cat] || 0;
					const pct = EXPERT_BONUS[val] * 100;
					return (
						<Box
							key={cat}
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
							}}
						>
							<Typography variant="body2" sx={{ width: 120 }}>
								{cat}
							</Typography>
							<Box
								display="flex"
								alignItems="center"
								border="1px solid"
								borderColor="divider"
								borderRadius={1}
							>
								<IconButton
									size="small"
									onClick={() =>
										setExperts((p: any) => ({
											...p,
											[cat]: Math.max(0, val - 1),
										}))
									}
									sx={{ p: 0.25 }}
								>
									<RemoveIcon sx={{ fontSize: "0.8rem" }} />
								</IconButton>
								<Typography
									variant="body2"
									sx={{ minWidth: 20, textAlign: "center" }}
								>
									{val}
								</Typography>
								<IconButton
									size="small"
									onClick={() => {
										const total = Object.values(experts).reduce(
											(a: any, b: any) => a + b,
											0,
										);
										if (total < 6 && val < 5)
											setExperts((p: any) => ({ ...p, [cat]: val + 1 }));
									}}
									sx={{ p: 0.25 }}
								>
									<AddIcon sx={{ fontSize: "0.8rem" }} />
								</IconButton>
							</Box>
							<Typography
								variant="caption"
								sx={{ width: 40, textAlign: "right", color: "text.secondary" }}
							>
								{pct.toFixed(2)}%
							</Typography>
						</Box>
					);
				})}
			</Box>
		</DialogContent>
		<DialogActions
			sx={{ borderTop: "1px solid", borderColor: "divider", p: 1.5 }}
		>
			<Button variant="contained" color="primary" onClick={onClose}>
				Done
			</Button>
		</DialogActions>
	</Dialog>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

export const BaseManager: React.FC<BaseManagerProps> = ({
	user,
	onUpdateUser,
	planetName = "Unknown Planet",
	staticData,
}) => {
	const isUninitialized = user.baseData.status === "uninitialized";
	const theme = useTheme();

	const [isPlannerOpen, setIsPlannerOpen] = useState(false);
	const [isEditingPlatform, setIsEditingPlatform] = useState(false);
	const [newPlatformTicker, setNewPlatformTicker] = useState("FRM");
	const [newPlatformAmount, setNewPlatformAmount] = useState(1);
	const [isAddingRecipe, setIsAddingRecipe] = useState<string | null>(null);
	const [selectedRecipe, setSelectedRecipe] = useState("");
	const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

	// Advanced PrUn State
	const [activeNeeds, setActiveNeeds] = useState<
		Record<string, Record<string, boolean>>
	>({});
	const [platformFactors, setPlatformFactors] = useState<
		Record<string, number>
	>({});
	const [experts, setExperts] = useState<Record<string, number>>({});
	const [activeCogc, setActiveCogc] = useState<string | null>(null);

	// SAFE INITIALIZATION FIX: Data must be declared BEFORE derived states like syncMode
	const [draftBaseData, setDraftBaseData] = useState(user.baseData);
	const activeData = isPlannerOpen ? draftBaseData : user.baseData;

	// Config State
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isExpertsOpen, setIsExpertsOpen] = useState(false);
	const [syncMode, setSyncMode] = useState<"manual" | "sync">(
		activeData?.status === "actual" ? "sync" : "manual",
	);
	const [planDefaultPricing, setPlanDefaultPricing] = useState<
		"market" | "corp"
	>("market");
	const [globalMatPrices, setGlobalMatPrices] = useState<
		Record<string, "market" | "corp">
	>({});
	const [ioDisplayMode, setIoDisplayMode] = useState<"profit" | "importExport">(
		"profit",
	);

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

	const activeRecipes = useMemo(() => {
		if (staticData?.materials?.length) {
			const extracted: any[] = [];
			staticData.materials.forEach((m) => {
				m.inputRecipes?.forEach((r: any) => {
					const durationSecs = r.durationmillis ? r.durationmillis / 1000 : 0;
					const inText =
						r.inputs?.length > 0
							? r.inputs.map((i: any) => `${i.amount}${i.ticker}`).join(" + ")
							: "Ext";
					const outText =
						r.outputs?.length > 0
							? r.outputs.map((i: any) => `${i.amount}${i.ticker}`).join(" + ")
							: `1${m.ticker}`;
					extracted.push({
						id: r.processid || r.id,
						name: `${inText} ➔ ${outText} | ${formatDuration(durationSecs)}`,
						duration: durationSecs,
						madeIn: r.madeIn,
						ticker: m.ticker,
						inputs: r.inputs || [],
						outputs: r.outputs || [],
						inStr: inText,
						outStr: outText,
					});
				});
			});
			if (extracted.length > 0) return extracted;
		}
		return FALLBACK_RECIPES;
	}, [staticData]);

	useEffect(() => {
		if (isPlannerOpen) {
			setModalRoot(document.getElementById("node-modal-root"));
			setDraftBaseData(user.baseData);
		}
	}, [isPlannerOpen, user.baseData]);

	const availableRecipesForPlatform = useMemo(() => {
		if (!isAddingRecipe) return [];
		const platform = activeData.platforms.find((p) => p.id === isAddingRecipe);
		if (!platform) return [];
		return activeRecipes.filter(
			(r) =>
				String(r.madeIn || "")
					.trim()
					.toUpperCase() ===
				String(platform.buildingTicker || "")
					.trim()
					.toUpperCase(),
		);
	}, [isAddingRecipe, activeData.platforms, activeRecipes]);

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

	const getPrice = (ticker: string) =>
		activePrices[ticker]
			? activePrices[ticker][globalMatPrices[ticker] || planDefaultPricing]
			: 0;

	const getBuildingCost = (ticker: string) => {
		const b = activeBuildings.find((mb) => mb.ticker === ticker);
		return b?.buildReq
			? b.buildReq.reduce(
					(acc: number, req: any) => acc + req.amount * getPrice(req.ticker),
					0,
				)
			: 0;
	};

	// ==========================================
	// MATHEMATICS ENGINE
	// ==========================================

	const permitArea = PERMIT_AREAS[activeData.permitLevel] || 500;
	let usedArea = 25; // Base Core Module Area
	let storageMaxWeight = 0,
		storageMaxVolume = 0,
		totalCapEx = 0;

	const workforce: Record<
		string,
		{ demand: number; supply: number; open: number; efficiency: number }
	> = {
		Pioneer: { demand: 0, supply: 0, open: 0, efficiency: 0 },
		Settler: { demand: 0, supply: 0, open: 0, efficiency: 0 },
		Technician: { demand: 0, supply: 0, open: 0, efficiency: 0 },
		Engineer: { demand: 0, supply: 0, open: 0, efficiency: 0 },
		Scientist: { demand: 0, supply: 0, open: 0, efficiency: 0 },
	};

	const buildMaterials: Record<string, number> = {};
	const addBuildReq = (ticker: string, count: number) => {
		const bInfo = activeBuildings.find((b) => b.ticker === ticker);
		if (bInfo?.buildReq)
			bInfo.buildReq.forEach(
				(req: any) =>
					(buildMaterials[req.ticker] =
						(buildMaterials[req.ticker] || 0) + req.amount * count),
			);
	};

	const normalizeWorker = (w: string) =>
		w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

	// Sum Demands/Supplies
	activeData.platforms.forEach((p) => {
		const b = activeBuildings.find((mb) => mb.ticker === p.buildingTicker);
		if (b) {
			usedArea += b.area * p.amount;
			addBuildReq(b.ticker, p.amount);
			if (b.workers)
				Object.keys(b.workers).forEach(
					(w) =>
						(workforce[normalizeWorker(w)].demand +=
							(b.workers as any)[w] * p.amount),
				);
		}
	});

	activeData.infrastructure.forEach((i) => {
		const b = activeBuildings.find((mb) => mb.ticker === i.buildingTicker);
		if (b) {
			usedArea += b.area * i.amount;
			addBuildReq(b.ticker, i.amount);
			if (b.supply)
				Object.keys(b.supply).forEach(
					(w) =>
						(workforce[normalizeWorker(w)].supply +=
							(b.supply as any)[w] * i.amount),
				);
			if (b.storageWeight) storageMaxWeight += b.storageWeight * i.amount;
			if (b.storageVolume) storageMaxVolume += b.storageVolume * i.amount;
		}
	});

	Object.entries(buildMaterials).forEach(
		([ticker, amt]) => (totalCapEx += amt * getPrice(ticker)),
	);

	// Calculate Workforce Efficiencies using proper curve
	Object.keys(workforce).forEach((w) => {
		workforce[w].open = Math.max(0, workforce[w].supply - workforce[w].demand);
		const needs = WORKER_NEEDS[w];
		if (!needs) {
			workforce[w].efficiency = 100;
			return;
		}

		let allEssentialsMet = true;
		needs.essentials.forEach((e) => {
			if (!activeNeeds[w]?.[e]) allEssentialsMet = false;
		});

		if (!allEssentialsMet) {
			workforce[w].efficiency = 0;
		} else {
			let activeLux = 0;
			needs.luxuries.forEach((l) => {
				if (activeNeeds[w]?.[l]) activeLux++;
			});
			const multiplierTable = LUXURY_MULTIPLIERS[needs.luxuries.length];
			workforce[w].efficiency = multiplierTable
				? multiplierTable[activeLux] * 100
				: 100;
		}
	});

	const materialIO: Record<
		string,
		{ prod: number; cons: number; delta: number }
	> = {};
	const platformEfficiencies: Record<string, number> = {};
	const platformBuildingQueues: Record<string, any[][]> = {};

	// CONTINUOUS FRACTIONAL ENGINE
	activeData.platforms.forEach((p) => {
		const bInfo = activeBuildings.find((mb) => mb.ticker === p.buildingTicker);
		const bCategory = bInfo?.category || "Unknown";

		// Determine Base Workforce Bottleneck
		let buildingWorkforceEff = 100;
		if (bInfo?.workers) {
			Object.keys(bInfo.workers).forEach((w) => {
				const eff = workforce[normalizeWorker(w)]?.efficiency || 100;
				if (eff < buildingWorkforceEff) buildingWorkforceEff = eff;
			});
		}

		// Apply Math: W * (1 + E) * C * R
		const expertBonus = EXPERT_BONUS[experts[bCategory] || 0] || 0;
		const cogcBonus = activeCogc === bCategory ? 1.25 : 1.0;
		const resourceFactor =
			(platformFactors[p.id] !== undefined ? platformFactors[p.id] : 100) / 100;

		const rawEfficiency =
			(buildingWorkforceEff / 100) *
			(1 + expertBonus) *
			cogcBonus *
			resourceFactor;
		platformEfficiencies[p.id] = rawEfficiency * 100;

		// Distribute recipes into individual building queues chronologically
		let bOrders: any[][] = Array.from({ length: p.amount }, () => []);
		(p.activeRecipes || []).forEach((recipeId, idx) => {
			const bIdx = idx % p.amount;
			const recipe = activeRecipes.find((r) => r.id === recipeId);
			if (recipe) bOrders[bIdx].push(recipe);
		});

		platformBuildingQueues[p.id] = bOrders;

		// Execute precise fractional queue mapping
		if (rawEfficiency > 0) {
			bOrders.forEach((buildingQueue) => {
				if (buildingQueue.length === 0) return;

				let totalQueueDurationBase = 0;
				buildingQueue.forEach(
					(r) => (totalQueueDurationBase += r.duration || 1),
				);

				const totalQueueDurationActual = totalQueueDurationBase / rawEfficiency;
				const loopsPerDay = 86400 / totalQueueDurationActual;

				buildingQueue.forEach((recipe) => {
					recipe.inputs?.forEach((input: any) => {
						if (!materialIO[input.ticker])
							materialIO[input.ticker] = { prod: 0, cons: 0, delta: 0 };
						materialIO[input.ticker].cons += input.amount * loopsPerDay;
						materialIO[input.ticker].delta -= input.amount * loopsPerDay;
					});
					recipe.outputs?.forEach((output: any) => {
						if (!materialIO[output.ticker])
							materialIO[output.ticker] = { prod: 0, cons: 0, delta: 0 };
						materialIO[output.ticker].prod += output.amount * loopsPerDay;
						materialIO[output.ticker].delta += output.amount * loopsPerDay;
					});
				});
			});
		}
	});

	let totalWeightImport = 0,
		totalWeightExport = 0,
		totalVolumeImport = 0,
		totalVolumeExport = 0,
		totalDailyProfit = 0;
	Object.entries(materialIO).forEach(([ticker, m]) => {
		const delta = m.delta * 0.5;
		totalDailyProfit += m.delta * getPrice(ticker);
		if (delta < 0) {
			totalWeightImport += Math.abs(delta);
			totalVolumeImport += Math.abs(delta);
		} else {
			totalWeightExport += delta;
			totalVolumeExport += delta;
		}
	});

	const allUniqueMaterials = Array.from(
		new Set([...Object.keys(materialIO), ...Object.keys(buildMaterials)]),
	).sort();

	// ==========================================
	// ACTION HANDLERS
	// ==========================================

	const handleToggleNeed = (workerType: string, needTicker: string) =>
		setActiveNeeds((prev) => ({
			...prev,
			[workerType]: {
				...prev[workerType],
				[needTicker]: !prev[workerType]?.[needTicker],
			},
		}));

	const saveEdits = (
		newPlatforms: BasePlatform[],
		newInfra: BaseInfrastructure[],
		newPermitLevel: 1 | 2 | 3,
	) => {
		setDraftBaseData((prev) => ({
			...prev,
			platforms: newPlatforms,
			infrastructure: newInfra,
			permitLevel: newPermitLevel,
		}));
	};

	const handleAdjustPermit = (change: number) =>
		saveEdits(
			activeData.platforms,
			activeData.infrastructure,
			Math.max(1, Math.min(3, activeData.permitLevel + change)) as 1 | 2 | 3,
		);

	const handleAddPlatform = () => {
		let newPlatforms = [...activeData.platforms];
		const existing = newPlatforms.find(
			(p) => p.buildingTicker === newPlatformTicker,
		);
		if (existing) existing.amount += newPlatformAmount;
		else
			newPlatforms.push({
				id: uuidv4(),
				buildingTicker: newPlatformTicker,
				amount: newPlatformAmount,
				activeRecipes: [],
			});
		saveEdits(newPlatforms, activeData.infrastructure, activeData.permitLevel);
		setIsEditingPlatform(false);
		setNewPlatformAmount(1);
	};

	const handleAdjustPlatformAmount = (platformId: string, change: number) => {
		let newPlatforms = [...activeData.platforms];
		const index = newPlatforms.findIndex((p) => p.id === platformId);
		if (index > -1)
			newPlatforms[index].amount = Math.max(
				1,
				newPlatforms[index].amount + change,
			);
		saveEdits(newPlatforms, activeData.infrastructure, activeData.permitLevel);
	};

	const handleRemovePlatform = (id: string) =>
		saveEdits(
			activeData.platforms.filter((p) => p.id !== id),
			activeData.infrastructure,
			activeData.permitLevel,
		);

	const handleAddRecipeToQueue = () => {
		if (!isAddingRecipe) return;
		saveEdits(
			activeData.platforms.map((p) =>
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
	};

	const handleRemoveSpecificRecipe = (platformId: string, recipeId: string) => {
		const platform = activeData.platforms.find((p) => p.id === platformId);
		if (!platform) return;
		const index = platform.activeRecipes.indexOf(recipeId);
		if (index > -1) {
			const updatedQueue = [...platform.activeRecipes];
			updatedQueue.splice(index, 1);
			saveEdits(
				activeData.platforms.map((p) =>
					p.id === platformId ? { ...p, activeRecipes: updatedQueue } : p,
				),
				activeData.infrastructure,
				activeData.permitLevel,
			);
		}
	};

	const handleAddSpecificRecipe = (platformId: string, recipeId: string) =>
		saveEdits(
			activeData.platforms.map((p) =>
				p.id === platformId
					? { ...p, activeRecipes: [...(p.activeRecipes || []), recipeId] }
					: p,
			),
			activeData.infrastructure,
			activeData.permitLevel,
		);

	const handleAdjustInfra = (ticker: string, change: number) => {
		let newInfra = [...activeData.infrastructure];
		const existingIndex = newInfra.findIndex(
			(i) => i.buildingTicker === ticker,
		);
		if (existingIndex > -1) {
			newInfra[existingIndex].amount = Math.max(
				0,
				newInfra[existingIndex].amount + change,
			);
			if (newInfra[existingIndex].amount === 0)
				newInfra.splice(existingIndex, 1);
		} else if (change > 0)
			newInfra.push({ id: uuidv4(), buildingTicker: ticker, amount: change });
		saveEdits(activeData.platforms, newInfra, activeData.permitLevel);
	};

	const handleSavePlan = () => {
		onUpdateUser({ ...user, baseData: draftBaseData });
		setIsPlannerOpen(false);
	};

	// ==========================================
	// RENDER UI
	// ==========================================

	const PlannerOverlay = (
		<Box
			sx={{
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				zIndex: 1350,
				bgcolor: "background.default",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
			}}
		>
			<AppBar sx={{ position: "relative" }} color="primary" elevation={0}>
				<Toolbar variant="dense">
					<IconButton
						edge="start"
						color="inherit"
						onClick={() => {
							setDraftBaseData(user.baseData);
							setIsPlannerOpen(false);
						}}
						aria-label="close"
					>
						<ArrowBackIcon />
					</IconButton>
					<Typography
						sx={{ ml: 2, flex: 1 }}
						variant="subtitle1"
						component="div"
					>
						{user.displayName} • {planetName} Planner
					</Typography>

					<FormControl size="small" sx={{ mr: 2, minWidth: 120 }}>
						<Select
							value={activeCogc || ""}
							displayEmpty
							sx={{
								height: 32,
								bgcolor: alpha(theme.palette.background.default, 0.1),
							}}
							onChange={(e) => setActiveCogc(e.target.value || null)}
						>
							<MenuItem value="">
								<em>No COGC</em>
							</MenuItem>
							{EXPERT_CATEGORIES.map((c) => (
								<MenuItem key={c} value={c}>
									{c}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<Button
						color="inherit"
						onClick={() => setIsExpertsOpen(true)}
						startIcon={<ExpertIcon />}
						sx={{
							mr: 2,
							bgcolor: alpha(theme.palette.background.default, 0.1),
							height: 32,
						}}
					>
						Experts
					</Button>

					<FormControlLabel
						control={
							<Switch
								size="small"
								color="secondary"
								checked={planDefaultPricing === "corp"}
								onChange={(e) =>
									setPlanDefaultPricing(e.target.checked ? "corp" : "market")
								}
							/>
						}
						label={
							<Typography variant="body2" fontWeight="bold">
								{planDefaultPricing === "corp"
									? "Corp Prices"
									: "Market Prices"}
							</Typography>
						}
						sx={{
							m: 0,
							bgcolor: alpha(theme.palette.background.default, 0.1),
							px: 1.5,
							py: 0.5,
							borderRadius: 1,
							mr: 2,
						}}
					/>

					<Button
						color="inherit"
						onClick={() => setIsSettingsOpen(true)}
						startIcon={<SettingsIcon />}
						sx={{
							mr: 2,
							bgcolor: alpha(theme.palette.background.default, 0.1),
						}}
					>
						Settings
					</Button>

					<Button
						color="inherit"
						onClick={() => {
							setDraftBaseData(user.baseData);
							setIsPlannerOpen(false);
						}}
						size="small"
						variant="outlined"
						sx={{ mr: 1 }}
					>
						Cancel
					</Button>
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

			<Box
				sx={{
					p: 2,
					flexGrow: 1,
					overflowY: "auto",
					display: "flex",
					flexDirection: "column",
					gap: 2,
				}}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: { xs: "column", md: "row" },
						gap: 2,
						height: { xs: "auto", lg: "35%" },
						minHeight: { lg: 280 },
						flexShrink: 0,
					}}
				>
					<Box
						sx={{ flex: 1.2, display: "flex", flexDirection: "column", gap: 2 }}
					>
						<Card
							variant="outlined"
							sx={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
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
									flexWrap: "nowrap",
								}}
							>
								<Typography
									variant="subtitle2"
									fontWeight="bold"
									sx={{ whiteSpace: "nowrap" }}
								>
									Site Data
								</Typography>
								<Box
									display="flex"
									alignItems="center"
									bgcolor="action.hover"
									borderRadius={1}
									px={0.5}
									ml={1}
								>
									<IconButton
										size="small"
										onClick={() => handleAdjustPermit(-1)}
										disabled={activeData.permitLevel <= 1}
										sx={{ p: 0.25 }}
									>
										<RemoveIcon fontSize="small" />
									</IconButton>
									<Typography
										variant="caption"
										fontWeight="bold"
										sx={{ px: 0.5, whiteSpace: "nowrap", fontSize: "0.75rem" }}
									>
										Permit {activeData.permitLevel}
									</Typography>
									<IconButton
										size="small"
										onClick={() => handleAdjustPermit(1)}
										disabled={activeData.permitLevel >= 3}
										sx={{ p: 0.25 }}
									>
										<AddIcon fontSize="small" />
									</IconButton>
								</Box>
							</Box>
							<CardContent
								sx={{
									p: 1.5,
									flexGrow: 1,
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
								}}
							>
								<Box
									display="flex"
									justifyContent="space-between"
									alignItems="center"
									mb={1}
								>
									<Typography
										variant="caption"
										color="textSecondary"
										display="block"
										fontSize="0.75rem"
									>
										Area Usage (inc. 25 CM)
									</Typography>
									{usedArea > permitArea ? (
										<Typography
											variant="caption"
											color="error"
											fontWeight="bold"
											fontSize="0.75rem"
										>
											Exceeds Permit!
										</Typography>
									) : (
										<Typography
											variant="caption"
											color="textSecondary"
											fontSize="0.75rem"
										>
											{usedArea}/{permitArea}
										</Typography>
									)}
								</Box>
								<Box
									sx={{
										flexGrow: 1,
										height: 8,
										bgcolor: "action.hover",
										borderRadius: 1,
										overflow: "hidden",
										mb: 2,
									}}
								>
									<Box
										sx={{
											width: `${Math.min(100, (usedArea / permitArea) * 100)}%`,
											height: "100%",
											bgcolor:
												usedArea > permitArea ? "error.main" : "primary.main",
										}}
									/>
								</Box>
								<Box
									display="flex"
									justifyContent="space-between"
									alignItems="center"
									p={1}
									bgcolor="action.hover"
									borderRadius={1}
								>
									<Typography
										variant="caption"
										fontWeight="bold"
										fontSize="0.75rem"
									>
										<PriceIcon
											sx={{
												fontSize: "1rem",
												verticalAlign: "middle",
												mr: 0.5,
											}}
										/>{" "}
										Total CapEx
									</Typography>
									<Typography
										variant="caption"
										color="success.main"
										fontWeight="bold"
										fontSize="0.75rem"
									>
										${formatCurrency(totalCapEx)}
									</Typography>
								</Box>
							</CardContent>
						</Card>

						<Card
							variant="outlined"
							sx={{
								flex: 1.5,
								display: "flex",
								flexDirection: "column",
								bgcolor: "background.default",
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
								<Typography variant="subtitle2" fontWeight="bold">
									Storage
								</Typography>
							</Box>
							<CardContent sx={{ p: 1.5, flexGrow: 1, overflowY: "auto" }}>
								<StorageProgressBar
									label="Weight"
									current={500}
									dailyImport={totalWeightImport}
									dailyExport={totalWeightExport}
									max={storageMaxWeight}
									unit="t"
								/>
								<StorageProgressBar
									label="Volume"
									current={500}
									dailyImport={totalVolumeImport}
									dailyExport={totalVolumeExport}
									max={storageMaxVolume}
									unit="m³"
								/>
							</CardContent>
						</Card>
					</Box>

					<Card
						variant="outlined"
						sx={{
							flex: 1.2,
							display: "flex",
							flexDirection: "column",
							bgcolor: "background.default",
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
							<Typography variant="subtitle2" fontWeight="bold">
								Workforce & Needs
							</Typography>
						</Box>
						<Box sx={{ overflowY: "auto", flexGrow: 1 }}>
							<Table size="small" padding="none" stickyHeader>
								<TableHead>
									<TableRow
										sx={{
											"& th": {
												px: 1,
												py: 1,
												bgcolor: "background.default",
												fontSize: "0.75rem",
											},
										}}
									>
										<TableCell>Type</TableCell>
										<TableCell align="center">Eff.</TableCell>
										<TableCell align="center">D/S</TableCell>
										<TableCell>Needs</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{Object.entries(workforce)
										.filter(([_, data]) => data.demand > 0 || data.supply > 0)
										.map(([name, data]) => (
											<TableRow
												key={name}
												sx={{
													"& td": {
														px: 1,
														py: 1,
														borderBottom: "1px solid",
														borderColor: "divider",
													},
												}}
											>
												<TableCell>
													<Typography
														variant="caption"
														fontWeight="bold"
														fontSize="0.75rem"
													>
														{name.substring(0, 3)}
													</Typography>
												</TableCell>
												<TableCell align="center">
													<Typography
														variant="caption"
														color={
															data.efficiency < 100
																? "warning.main"
																: "success.main"
														}
														fontWeight="bold"
														fontSize="0.75rem"
													>
														{data.efficiency.toFixed(0)}%
													</Typography>
												</TableCell>
												<TableCell align="center">
													<Typography
														variant="caption"
														color={
															data.supply < data.demand
																? "error.main"
																: "success.main"
														}
														fontSize="0.75rem"
													>
														{data.demand}/{data.supply}
													</Typography>
												</TableCell>
												<TableCell>
													<Box
														sx={{
															display: "flex",
															flexWrap: "wrap",
															gap: 0.5,
															py: 0.5,
														}}
													>
														{WORKER_NEEDS[name]?.essentials
															.concat(WORKER_NEEDS[name]?.luxuries)
															.map((need: string) => {
																const isActive = activeNeeds[name]?.[need];
																const isLux =
																	WORKER_NEEDS[name].luxuries.includes(need);
																return (
																	<Chip
																		key={need}
																		label={need}
																		size="small"
																		variant={isActive ? "filled" : "outlined"}
																		color={
																			isActive
																				? isLux
																					? "secondary"
																					: "success"
																				: "default"
																		}
																		onClick={() => handleToggleNeed(name, need)}
																		sx={{
																			height: 20,
																			fontSize: "0.65rem",
																			".MuiChip-label": { px: 0.5 },
																			cursor: "pointer",
																		}}
																	/>
																);
															})}
													</Box>
												</TableCell>
											</TableRow>
										))}
								</TableBody>
							</Table>
						</Box>
					</Card>

					<Card
						variant="outlined"
						sx={{
							flex: 1.6,
							display: "flex",
							flexDirection: "column",
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
							<Typography variant="subtitle2" fontWeight="bold">
								Infrastructure
							</Typography>
						</Box>
						<Box sx={{ overflowY: "auto", flexGrow: 1, p: 0.5 }}>
							<Box
								sx={{
									display: "grid",
									gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
									gap: 1,
								}}
							>
								{activeBuildings
									.filter((b) => b.type === "infrastructure")
									.map((infra) => {
										const currentCount =
											activeData.infrastructure.find(
												(i) => i.buildingTicker === infra.ticker,
											)?.amount || 0;
										const totalCost =
											getBuildingCost(infra.ticker) * currentCount;
										let benefits = [];
										if (infra.supply)
											Object.entries(infra.supply).forEach(([k, v]) =>
												benefits.push(`+${v as number} ${k.substring(0, 3)}`),
											);
										if (infra.storageWeight || infra.storageVolume)
											benefits.push(
												`+${infra.storageWeight || 0}t / +${infra.storageVolume || 0}m³`,
											);

										return (
											<Card
												key={infra.ticker}
												variant="outlined"
												sx={{
													p: 1,
													display: "flex",
													flexDirection: "column",
													justifyContent: "space-between",
													bgcolor:
														currentCount > 0
															? alpha(theme.palette.primary.main, 0.05)
															: "transparent",
													borderColor:
														currentCount > 0 ? "primary.main" : "divider",
												}}
											>
												<Box
													display="flex"
													justifyContent="space-between"
													alignItems="center"
													mb={0.5}
												>
													<Typography
														variant="subtitle2"
														fontWeight="bold"
														lineHeight={1}
														fontSize="0.85rem"
													>
														{infra.ticker}
													</Typography>
													<Typography
														variant="caption"
														color={
															currentCount > 0
																? "success.main"
																: "textSecondary"
														}
														fontSize="0.7rem"
														fontWeight="bold"
													>
														${formatCurrency(totalCost)}
													</Typography>
												</Box>
												<Typography
													variant="caption"
													color="textSecondary"
													sx={{
														fontSize: "0.7rem",
														display: "block",
														mb: 1,
														lineHeight: 1.2,
													}}
												>
													{benefits.length > 0
														? benefits.join(", ")
														: infra.name}
												</Typography>
												<Box
													display="flex"
													justifyContent="space-between"
													alignItems="center"
													mt="auto"
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
																handleAdjustInfra(infra.ticker, -1)
															}
															disabled={currentCount === 0}
															sx={{ p: 0.25 }}
														>
															<RemoveIcon sx={{ fontSize: "0.85rem" }} />
														</IconButton>
														<Typography
															variant="caption"
															fontWeight="bold"
															sx={{
																minWidth: 20,
																textAlign: "center",
																fontSize: "0.75rem",
															}}
														>
															{currentCount}
														</Typography>
														<IconButton
															size="small"
															onClick={() => handleAdjustInfra(infra.ticker, 1)}
															sx={{ p: 0.25 }}
														>
															<AddIcon sx={{ fontSize: "0.85rem" }} />
														</IconButton>
													</Box>
												</Box>
											</Card>
										);
									})}
							</Box>
						</Box>
					</Card>
				</Box>

				<Box
					sx={{
						display: "flex",
						flexDirection: { xs: "column", lg: "row" },
						gap: 2,
						flexGrow: 1,
						minHeight: 0,
					}}
				>
					{/* PRODUCTION LINES */}
					<Card
						variant="outlined"
						sx={{
							flex: { xs: "1 1 auto", lg: 1.4 },
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
								onClick={() => setIsEditingPlatform(true)}
								sx={{ py: 0.5, px: 1.5, fontSize: "0.75rem" }}
							>
								Add Line
							</Button>
						</Box>
						<Box
							sx={{
								flexGrow: 1,
								overflowY: "auto",
								p: 1.5,
								display: "flex",
								flexDirection: "column",
								gap: 2,
							}}
						>
							{activeData.platforms.map((p) => {
								const bInfo = activeBuildings.find(
									(b) => b.ticker === p.buildingTicker,
								);
								const totalCost =
									getBuildingCost(bInfo?.ticker || "") * p.amount;

								const recipeCounts = (p.activeRecipes || []).reduce(
									(acc, id) => {
										acc[id] = (acc[id] || 0) + 1;
										return acc;
									},
									{} as Record<string, number>,
								);

								const bOrders = platformBuildingQueues[p.id] || [];

								return (
									<Box
										key={p.id}
										sx={{
											bgcolor: alpha(theme.palette.action.hover, 0.2),
											border: "1px solid",
											borderColor: "divider",
											borderRadius: 1,
											p: 1,
										}}
									>
										{/* Header Row */}
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												pb: 1,
												mb: 1,
												borderBottom: "1px solid",
												borderColor: "divider",
											}}
										>
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 2 }}
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
														onClick={() => handleAdjustPlatformAmount(p.id, -1)}
														disabled={p.amount <= 1}
														sx={{ p: 0.25 }}
													>
														<RemoveIcon sx={{ fontSize: "0.9rem" }} />
													</IconButton>
													<Typography
														variant="body2"
														fontWeight="bold"
														sx={{ minWidth: 20, textAlign: "center" }}
													>
														{p.amount}
													</Typography>
													<IconButton
														size="small"
														onClick={() => handleAdjustPlatformAmount(p.id, 1)}
														sx={{ p: 0.25 }}
													>
														<AddIcon sx={{ fontSize: "0.9rem" }} />
													</IconButton>
												</Box>
												<Typography
													variant="h6"
													fontWeight="bold"
													lineHeight={1}
												>
													{bInfo?.ticker}
												</Typography>
												<Typography
													variant="caption"
													color="textSecondary"
													sx={{ display: { xs: "none", sm: "block" } }}
												>
													Eff: {(platformEfficiencies[p.id] || 100).toFixed(2)}%
													| CapEx: ${formatCurrency(totalCost)}
												</Typography>
											</Box>

											<Box
												sx={{ display: "flex", gap: 1, alignItems: "center" }}
											>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														border: "1px solid",
														borderColor: "divider",
														borderRadius: 1,
														px: 1,
														height: 28,
													}}
												>
													<Typography
														variant="caption"
														color="textSecondary"
														sx={{ mr: 1 }}
													>
														Bonus %
													</Typography>
													<input
														type="number"
														value={
															platformFactors[p.id] !== undefined
																? platformFactors[p.id]
																: 100
														}
														onChange={(e) =>
															setPlatformFactors((pr) => ({
																...pr,
																[p.id]: parseFloat(e.target.value) || 0,
															}))
														}
														style={{
															width: 45,
															background: "transparent",
															border: "none",
															color: "inherit",
															outline: "none",
															textAlign: "right",
															fontWeight: "bold",
														}}
													/>
												</Box>
												<Button
													size="small"
													variant="contained"
													color="primary"
													sx={{ fontSize: "0.7rem", py: 0.25 }}
													onClick={() => {
														const validRecipes = activeRecipes.filter(
															(r) =>
																String(r.madeIn || "")
																	.trim()
																	.toUpperCase() ===
																String(p.buildingTicker || "")
																	.trim()
																	.toUpperCase(),
														);
														setSelectedRecipe(
															validRecipes.length > 0 ? validRecipes[0].id : "",
														);
														setIsAddingRecipe(p.id);
													}}
												>
													+ RECIPE
												</Button>
												<IconButton
													size="small"
													color="error"
													onClick={() => handleRemovePlatform(p.id)}
													sx={{ p: 0.25 }}
												>
													<DeleteIcon fontSize="small" />
												</IconButton>
											</Box>
										</Box>

										{/* Recipe Queue List (Aggregated) */}
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												gap: 0.5,
											}}
										>
											{Object.entries(recipeCounts).length === 0 ? (
												<Typography
													variant="caption"
													color="textSecondary"
													sx={{ fontStyle: "italic", pl: 1 }}
												>
													No recipes configured.
												</Typography>
											) : (
												Object.entries(recipeCounts).map(
													([recipeId, count]) => {
														const rInfo = activeRecipes.find(
															(r) => r.id === recipeId,
														);
														if (!rInfo) return null;
														return (
															<Box
																key={recipeId}
																sx={{
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "space-between",
																	bgcolor: alpha(
																		theme.palette.background.default,
																		0.6,
																	),
																	border: "1px solid",
																	borderColor: "divider",
																	px: 1,
																	py: 0.5,
																	borderRadius: 1,
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
																			sx={{ p: 0.1 }}
																		>
																			<RemoveIcon sx={{ fontSize: "0.7rem" }} />
																		</IconButton>
																		<Typography
																			variant="caption"
																			fontWeight="bold"
																			sx={{
																				minWidth: 20,
																				textAlign: "center",
																				fontSize: "0.75rem",
																			}}
																		>
																			{count as number}
																		</Typography>
																		<IconButton
																			size="small"
																			onClick={() =>
																				handleAddSpecificRecipe(p.id, recipeId)
																			}
																			sx={{ p: 0.1 }}
																		>
																			<AddIcon sx={{ fontSize: "0.7rem" }} />
																		</IconButton>
																	</Box>
																	<Typography
																		variant="caption"
																		fontFamily="monospace"
																		fontWeight="bold"
																		fontSize="0.75rem"
																	>
																		{rInfo.inStr} ➔ {rInfo.outStr}
																	</Typography>
																</Box>
																<Typography
																	variant="caption"
																	color="textSecondary"
																>
																	{formatDuration(rInfo.duration || 0)}
																</Typography>
															</Box>
														);
													},
												)
											)}
										</Box>

										{/* Building Slots / Queues (B1, B2...) */}
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
											{bOrders.map((buildingQueue, bIdx) => {
												const active = buildingQueue[0];
												const label = `B${bIdx + 1}: ${active ? active.outStr : "Idle"}`;
												return (
													<Tooltip
														key={bIdx}
														title={buildingQueue
															.map((r: any) => r.name)
															.join(" -> ")}
														arrow
													>
														<Chip
															size="small"
															variant={active ? "filled" : "outlined"}
															color={active ? "success" : "default"}
															label={label}
															icon={
																active ? (
																	<LoopIcon style={{ fontSize: "0.8rem" }} />
																) : undefined
															}
															sx={{
																height: 20,
																fontSize: "0.65rem",
																fontWeight: "bold",
																borderRadius: 1,
															}}
														/>
													</Tooltip>
												);
											})}
										</Box>
									</Box>
								);
							})}
						</Box>
					</Card>

					<Box
						sx={{
							flex: { xs: "1 1 auto", lg: 1 },
							display: "flex",
							flexDirection: "column",
							gap: 2,
							minWidth: 0,
							height: "100%",
						}}
					>
						<Card
							variant="outlined"
							sx={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
								minHeight: 0,
								overflowX: "hidden",
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
									bgcolor: alpha(theme.palette.success.main, 0.05),
								}}
							>
								<Typography
									variant="subtitle2"
									fontWeight="bold"
									whiteSpace="nowrap"
								>
									Material I/O
								</Typography>
								<Box display="flex" alignItems="center" gap={1.5}>
									<FormControlLabel
										control={
											<Switch
												size="small"
												checked={ioDisplayMode === "importExport"}
												onChange={(e) =>
													setIoDisplayMode(
														e.target.checked ? "importExport" : "profit",
													)
												}
											/>
										}
										label={
											<Typography variant="caption" fontWeight="bold">
												{ioDisplayMode === "profit" ? "Profit/Day" : "Actions"}
											</Typography>
										}
										sx={{ m: 0 }}
									/>
									<Typography
										variant="subtitle2"
										color={
											totalDailyProfit >= 0 ? "success.main" : "error.main"
										}
										fontWeight="bold"
										whiteSpace="nowrap"
									>
										{totalDailyProfit >= 0 ? "+" : ""}$
										{formatCurrency(totalDailyProfit)}/d
									</Typography>
								</Box>
							</Box>
							<Box sx={{ overflowY: "auto", flexGrow: 1, overflowX: "hidden" }}>
								<Table
									size="small"
									stickyHeader
									sx={{ width: "100%", tableLayout: "fixed" }}
								>
									<TableHead>
										<TableRow
											sx={{
												"& th": {
													px: 1,
													py: 1,
													fontSize: "0.7rem",
													bgcolor: "background.default",
												},
											}}
										>
											<TableCell sx={{ width: "20%" }}>Ticker</TableCell>
											<TableCell align="right" sx={{ width: "15%" }}>
												P/C
											</TableCell>
											<TableCell align="right" sx={{ width: "20%" }}>
												Delta
											</TableCell>
											<TableCell align="right" sx={{ width: "45%" }}>
												{ioDisplayMode === "profit"
													? "Price/u & Profit"
													: "Action"}
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{Object.keys(materialIO).length === 0 ? (
											<TableRow>
												<TableCell colSpan={4} align="center">
													<Typography
														variant="body2"
														color="textSecondary"
														sx={{ py: 2 }}
													>
														No active production.
													</Typography>
												</TableCell>
											</TableRow>
										) : (
											Object.entries(materialIO).map(([ticker, data]) => (
												<TableRow
													key={ticker}
													sx={{
														"& td": {
															px: 1,
															py: 1,
															borderBottom: "none",
															whiteSpace: "nowrap",
															overflow: "hidden",
															textOverflow: "ellipsis",
														},
													}}
												>
													<TableCell>
														<Typography variant="body2" fontWeight="bold">
															{ticker}
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography
															variant="caption"
															color="success.main"
															display="block"
															lineHeight={1}
														>
															+{data.prod.toFixed(2)}
														</Typography>
														<Typography
															variant="caption"
															color="error.main"
															display="block"
															lineHeight={1}
														>
															-{data.cons.toFixed(2)}
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography
															variant="body2"
															fontWeight="bold"
															color={
																data.delta > 0
																	? "success.main"
																	: data.delta < 0
																		? "error.main"
																		: "inherit"
															}
														>
															{data.delta > 0 ? "+" : ""}
															{data.delta.toFixed(2)}
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Box
															display="flex"
															justifyContent="flex-end"
															alignItems="center"
															gap={1}
														>
															<Typography
																variant="caption"
																color="textSecondary"
																sx={{ minWidth: 30 }}
															>
																${formatCurrency(getPrice(ticker))}
															</Typography>
															{ioDisplayMode === "profit" ? (
																<Typography
																	variant="body2"
																	fontWeight="bold"
																	sx={{ minWidth: 40 }}
																>
																	$
																	{formatCurrency(
																		data.delta * getPrice(ticker),
																	)}
																</Typography>
															) : (
																<Chip
																	size="small"
																	label={
																		data.delta > 0
																			? `Exp ${data.delta.toFixed(1)}`
																			: data.delta < 0
																				? `Imp ${Math.abs(data.delta).toFixed(1)}`
																				: "Bal"
																	}
																	color={
																		data.delta > 0
																			? "success"
																			: data.delta < 0
																				? "error"
																				: "default"
																	}
																	variant={
																		data.delta === 0 ? "outlined" : "filled"
																	}
																	sx={{
																		height: 20,
																		fontSize: "0.65rem",
																		fontWeight: "bold",
																		minWidth: 50,
																	}}
																/>
															)}
														</Box>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</Box>
						</Card>

						<Card
							variant="outlined"
							sx={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
								minHeight: 0,
								overflowX: "hidden",
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
								<Typography
									variant="subtitle2"
									fontWeight="bold"
									whiteSpace="nowrap"
								>
									Construction (CapEx)
								</Typography>
								<Typography
									variant="subtitle2"
									color="success.main"
									fontWeight="bold"
									whiteSpace="nowrap"
								>
									${formatCurrency(totalCapEx)}
								</Typography>
							</Box>
							<Box sx={{ overflowY: "auto", flexGrow: 1, overflowX: "hidden" }}>
								<Table
									size="small"
									stickyHeader
									sx={{ width: "100%", tableLayout: "fixed" }}
								>
									<TableHead>
										<TableRow
											sx={{
												"& th": {
													px: 1,
													py: 1,
													fontSize: "0.7rem",
													bgcolor: "background.default",
												},
											}}
										>
											<TableCell sx={{ width: "20%" }}>Ticker</TableCell>
											<TableCell align="right" sx={{ width: "20%" }}>
												Amount
											</TableCell>
											<TableCell align="right" sx={{ width: "60%" }}>
												Price/u & Total
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{Object.keys(buildMaterials).length === 0 ? (
											<TableRow>
												<TableCell colSpan={3} align="center">
													<Typography
														variant="body2"
														color="textSecondary"
														sx={{ py: 2 }}
													>
														No buildings placed.
													</Typography>
												</TableCell>
											</TableRow>
										) : (
											Object.entries(buildMaterials).map(([ticker, amt]) => {
												const total = amt * getPrice(ticker);
												return (
													<TableRow
														key={ticker}
														sx={{
															"& td": {
																px: 1,
																py: 1,
																borderBottom: "none",
																whiteSpace: "nowrap",
																overflow: "hidden",
																textOverflow: "ellipsis",
															},
														}}
													>
														<TableCell>
															<Typography variant="body2" fontWeight="bold">
																{ticker}
															</Typography>
														</TableCell>
														<TableCell align="right">
															<Typography variant="body2" fontWeight="bold">
																{amt}
															</Typography>
														</TableCell>
														<TableCell align="right">
															<Box
																display="flex"
																justifyContent="flex-end"
																alignItems="center"
																gap={1}
															>
																<Typography
																	variant="caption"
																	color="textSecondary"
																	sx={{ minWidth: 30 }}
																>
																	${formatCurrency(getPrice(ticker))}
																</Typography>
																<Typography
																	variant="body2"
																	fontWeight="bold"
																	sx={{ minWidth: 40 }}
																>
																	${formatCurrency(total)}
																</Typography>
															</Box>
														</TableCell>
													</TableRow>
												);
											})
										)}
									</TableBody>
								</Table>
							</Box>
						</Card>
					</Box>
				</Box>
			</Box>

			<ExpertsDialog
				open={isExpertsOpen}
				onClose={() => setIsExpertsOpen(false)}
				experts={experts}
				setExperts={setExperts}
			/>

			<Dialog
				open={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
				disablePortal
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle sx={{ py: 1.5 }}>
					<Box display="flex" alignItems="center" gap={1}>
						<SettingsIcon color="primary" /> Base Plan Settings
					</Box>
				</DialogTitle>
				<DialogContent sx={{ pt: 1 }}>
					<Box sx={{ mb: 3 }}>
						<Typography variant="subtitle2" color="textSecondary" mb={1}>
							Operation Mode
						</Typography>
						<Card
							variant="outlined"
							sx={{
								p: 2,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								bgcolor:
									syncMode === "sync"
										? alpha(theme.palette.primary.main, 0.05)
										: "background.default",
							}}
						>
							<Box>
								<Typography variant="subtitle1" fontWeight="bold">
									{syncMode === "sync" ? "Synced to PU API" : "Manual Plan"}
								</Typography>
								{syncMode === "sync" ? (
									<Typography
										variant="caption"
										color="success.main"
										display="flex"
										alignItems="center"
										gap={0.5}
									>
										<SyncIcon fontSize="small" /> Last sync: Just now
									</Typography>
								) : (
									<Typography variant="caption" color="textSecondary">
										Plan is isolated and managed manually.
									</Typography>
								)}
							</Box>
							<FormControlLabel
								control={
									<Switch
										checked={syncMode === "sync"}
										onChange={(e) => {
											setSyncMode(e.target.checked ? "sync" : "manual");
											setDraftBaseData((prev) => ({
												...prev,
												status: e.target.checked ? "actual" : "manual",
											}));
										}}
									/>
								}
								label={syncMode === "sync" ? "Sync On" : "Manual"}
							/>
						</Card>
					</Box>
					<Box sx={{ mb: 3 }}>
						<Typography variant="subtitle2" color="textSecondary" mb={1}>
							Plan Default Pricing
						</Typography>
						<Card
							variant="outlined"
							sx={{
								p: 2,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								bgcolor: "background.default",
							}}
						>
							<Box>
								<Typography variant="subtitle1" fontWeight="bold">
									Default Pricing Tier
								</Typography>
								<Typography variant="caption" color="textSecondary">
									Applies to all materials unless overridden below.
								</Typography>
							</Box>
							<ToggleButtonGroup
								size="small"
								value={planDefaultPricing}
								exclusive
								onChange={(_, val) => val && setPlanDefaultPricing(val)}
								sx={{ height: 30 }}
							>
								<ToggleButton value="market" sx={{ px: 2 }}>
									<Typography variant="body2" fontWeight="bold">
										Market
									</Typography>
								</ToggleButton>
								<ToggleButton value="corp" sx={{ px: 2 }}>
									<Typography variant="body2" fontWeight="bold">
										Corp
									</Typography>
								</ToggleButton>
							</ToggleButtonGroup>
						</Card>
					</Box>
					<Divider sx={{ mb: 3 }} />
					<Box>
						<Typography variant="subtitle2" color="textSecondary" mb={1}>
							Material Specific Overrides
						</Typography>
						<Typography
							variant="caption"
							color="textSecondary"
							display="block"
							mb={2}
						>
							Select a specific pricing tier for materials used in your base
							(affects CapEx and Material I/O).
						</Typography>
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
								gap: 1,
							}}
						>
							{allUniqueMaterials.map((ticker) => (
								<Card
									key={ticker}
									variant="outlined"
									sx={{
										p: 1,
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										bgcolor: "background.default",
									}}
								>
									<Typography variant="body2" fontWeight="bold">
										{ticker}
									</Typography>
									<ToggleButtonGroup
										size="small"
										value={globalMatPrices[ticker] || planDefaultPricing}
										exclusive
										onChange={(_, val) =>
											val &&
											setGlobalMatPrices((p) => ({ ...p, [ticker]: val }))
										}
										sx={{ height: 24 }}
									>
										<ToggleButton value="market" sx={{ px: 1, py: 0 }}>
											<Typography variant="caption">M</Typography>
										</ToggleButton>
										<ToggleButton value="corp" sx={{ px: 1, py: 0 }}>
											<Typography variant="caption">C</Typography>
										</ToggleButton>
									</ToggleButtonGroup>
								</Card>
							))}
						</Box>
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 2, bgcolor: "background.default" }}>
					<Button onClick={() => setIsSettingsOpen(false)} variant="contained">
						Close
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={isEditingPlatform}
				onClose={() => setIsEditingPlatform(false)}
				disablePortal
			>
				<DialogTitle sx={{ py: 1.5, bgcolor: "background.default" }}>
					Add Production Building
				</DialogTitle>
				<DialogContent
					sx={{ pt: 1, minWidth: 250, bgcolor: "background.default" }}
				>
					<FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}>
						<InputLabel>Building</InputLabel>
						<Select
							value={newPlatformTicker}
							label="Building"
							onChange={(e) => setNewPlatformTicker(e.target.value)}
						>
							{activeBuildings
								.filter((b) => b.type === "production")
								.map((b) => (
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
						fullWidth
						value={newPlatformAmount}
						onChange={(e) =>
							setNewPlatformAmount(parseInt(e.target.value) || 1)
						}
					/>
				</DialogContent>
				<DialogActions sx={{ p: 1.5, bgcolor: "background.default" }}>
					<Button onClick={() => setIsEditingPlatform(false)} size="small">
						Cancel
					</Button>
					<Button onClick={handleAddPlatform} variant="contained" size="small">
						Add
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={!!isAddingRecipe}
				onClose={() => setIsAddingRecipe(null)}
				disablePortal
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle sx={{ py: 1.5, bgcolor: "background.default" }}>
					Add Recipe to Queue
				</DialogTitle>
				<DialogContent
					sx={{ pt: 1, minWidth: 250, bgcolor: "background.default" }}
				>
					<FormControl fullWidth size="small" sx={{ mt: 1 }}>
						<InputLabel>Recipe</InputLabel>
						<Select
							value={selectedRecipe || ""}
							label="Recipe"
							onChange={(e) => setSelectedRecipe(e.target.value)}
							sx={{ "& .MuiSelect-select": { whiteSpace: "normal", pr: 4 } }}
						>
							{availableRecipesForPlatform.length === 0 ? (
								<MenuItem value="" disabled>
									No recipes available for this building
								</MenuItem>
							) : (
								availableRecipesForPlatform.map((r) => (
									<MenuItem key={r.id} value={r.id}>
										{r.name}
									</MenuItem>
								))
							)}
						</Select>
					</FormControl>
				</DialogContent>
				<DialogActions sx={{ p: 1.5, bgcolor: "background.default" }}>
					<Button onClick={() => setIsAddingRecipe(null)} size="small">
						Cancel
					</Button>
					<Button
						onClick={handleAddRecipeToQueue}
						variant="contained"
						color="secondary"
						size="small"
						disabled={!selectedRecipe}
					>
						Add to Queue
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);

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
			{isPlannerOpen && modalRoot
				? createPortal(PlannerOverlay, modalRoot)
				: null}
		</>
	);
};
