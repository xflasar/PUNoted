/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
	Box,
	Typography,
	Button,
	Card,
	CardContent,
	TextField,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton,
	Paper,
	Select,
	MenuItem,
	InputLabel,
	FormControl,
	useTheme,
	Autocomplete,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material";
import {
	Add,
	Delete,
	PrecisionManufacturing,
	AssignmentTurnedIn,
} from "@mui/icons-material";
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

import { BaseManager } from "../../components/basemanager/basemanager";
import { useStaticData } from "../Cooperation/hooks/usestaticdata";
import type { NodeAssignedUser } from "../cooperation/types";
import { calculateBaseMetrics } from "../../components/basemanager/helpers";
import {
	FALLBACK_BUILDINGS,
	FALLBACK_NEEDS,
	FALLBACK_RECIPES,
	FALLBACK_PRICES,
} from "../../components/basemanager/constants";
import { useBaseManagerData } from "../../components/basemanager/api";

const COLORS = [
	"#0088FE",
	"#00C49F",
	"#FFBB28",
	"#FF8042",
	"#8884d8",
	"#82ca9d",
	"#ffc658",
	"#e57373",
	"#f06292",
	"#ba68c8",
	"#9575cd",
	"#7986cb",
];

interface SuggestedPlan {
	id: string;
	authorId?: string;
	authorName: string;
	name: string;
	description?: string;
	baseData: any;
	activeNeeds?: Record<string, Record<string, boolean>>;
	experts?: Record<string, number>;
	activeCogc?: string | null;
	planetFactor?: number;
	faction?: string;
	usedPermits?: number;
	totalPermits?: number;
}

interface Plan {
	id: string;
	name: string;
	planetName: string;
	description?: string;
	user: NodeAssignedUser;
	suggestedPlans?: SuggestedPlan[];
	primarySuggestionId?: string | null;
}

interface Company {
	id: string;
	name: string;
	primaryStation: string;
	cxSettings: "market" | "corp";
	plans: Plan[];
}

const flattenRecipes = (materials: any[]) => {
	const ext: any[] = [];
	materials.forEach((m) => {
		m.inputRecipes?.forEach((r: any) => {
			const durSecs = r.durationmillis ? r.durationmillis / 1000 : 0;
			const actualOutputs =
				r.outputs?.length > 0 ? r.outputs : [{ ticker: m.ticker, amount: 1 }];
			ext.push({
				id: r.processid || r.id,
				name: `${r.inputs?.length ? r.inputs.map((i: any) => `${i.amount}${i.ticker}`).join(" + ") : "Ext"} ➔ ${actualOutputs.map((i: any) => `${i.amount}${i.ticker}`).join(" + ")} | ${durSecs}`,
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
	return ext.length > 0 ? ext : FALLBACK_RECIPES;
};

export const BasePlanner: React.FC = () => {
	const theme = useTheme();
	const { staticData, isStaticDataLoading, staticDataError } = useStaticData();

	const [companies, setCompanies] = useState<Company[]>(() => {
		const stored = localStorage.getItem("base-planner-companies");
		if (stored) {
			try {
				return JSON.parse(stored);
			} catch (e) {
				console.error("Failed to parse companies from local storage", e);
			}
		}
		return [];
	});
	const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
		() => {
			const stored = localStorage.getItem("base-planner-companies");
			if (stored) {
				try {
					const parsed = JSON.parse(stored);
					if (parsed.length > 0) return parsed[0].id;
				} catch {
					// ignore
				}
			}
			return null;
		},
	);

	const selectedCompanyStation = useMemo(() => {
		return (
			companies.find((c) => c.id === selectedCompanyId)?.primaryStation || "IC1"
		);
	}, [companies, selectedCompanyId]);

	const { data: baseManagerData } = useBaseManagerData(selectedCompanyStation);

	const { planId: urlPlanId } = useParams<{ planId: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const isPublicView = location.pathname.startsWith("/planner/");

	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [devPersona, setDevPersona] = useState<
		"owner" | "registered" | "guest"
	>("owner");

	// Handle direct link to plan
	useEffect(() => {
		if (urlPlanId && urlPlanId !== selectedPlanId) {
			let foundCompanyId: string | null = null;
			for (const company of companies) {
				const plan = company.plans.find((p) => p.id === urlPlanId);
				if (plan) {
					foundCompanyId = company.id;
					break;
				}
			}
			if (foundCompanyId) {
				setSelectedCompanyId(foundCompanyId);
				setSelectedPlanId(urlPlanId);
			}
		} else if (!urlPlanId && selectedPlanId) {
			setSelectedPlanId(null);
		}
	}, [urlPlanId, companies, selectedPlanId]);

	const realCurrentUserId = localStorage.getItem("currentUserId");
	const currentUserId = realCurrentUserId;
	const devRegisteredUserId = useMemo(() => {
		const key = "dev-registered-user-id";
		const existing = localStorage.getItem(key);
		if (existing) return existing;
		const created = uuidv4();
		localStorage.setItem(key, created);
		return created;
	}, []);

	// Dialogs
	const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
	const [newCompanyName, setNewCompanyName] = useState("");
	const [newPrimaryStation, setNewPrimaryStation] = useState("");
	const [newCxSettings, setNewCxSettings] = useState<"market" | "corp">(
		"market",
	);

	const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
	const [newPlanName, setNewPlanName] = useState("");
	const [newPlanetName, setNewPlanetName] = useState("");
	const [newPlanDescription, setNewPlanDescription] = useState("");

	useEffect(() => {
		localStorage.setItem("base-planner-companies", JSON.stringify(companies));
	}, [companies]);

	const getPrice = useCallback(
		(ticker: string, cxSetting: "market" | "corp") => {
			if (baseManagerData) {
				const arr =
					cxSetting === "corp"
						? baseManagerData.corpPrices
						: baseManagerData.cxPrices;
				const found = arr?.find((p) => p.ticker === ticker);
				if (found && found.price > 0 && !isNaN(found.price)) return found.price;
			}
			const f = FALLBACK_PRICES[ticker];
			if (f) return f[cxSetting];
			return 0;
		},
		[baseManagerData],
	);

	const handleCreateCompany = () => {
		if (!newCompanyName.trim()) return;
		const newCompany: Company = {
			id: uuidv4(),
			name: newCompanyName.trim(),
			primaryStation: newPrimaryStation.trim() || "Unspecified",
			cxSettings: newCxSettings,
			plans: [],
		};
		setCompanies([...companies, newCompany]);
		setSelectedCompanyId(newCompany.id);
		setNewCompanyName("");
		setNewPrimaryStation("");
		setNewCxSettings("market");
		setIsCompanyDialogOpen(false);
	};

	const handleDeleteCompany = (id: string) => {
		if (
			window.confirm(
				"Are you sure you want to delete this company and all its plans?",
			)
		) {
			setCompanies(companies.filter((c) => c.id !== id));
			if (selectedCompanyId === id) setSelectedCompanyId(null);
		}
	};

	const handleCreatePlan = () => {
		if (!newPlanName.trim() || !newPlanetName.trim() || !selectedCompanyId)
			return;

		const newPlan: Plan = {
			id: uuidv4(),
			name: newPlanName.trim(),
			planetName: newPlanetName.trim(),
			description: newPlanDescription.trim(),
			user: {
				uid: currentUserId || uuidv4(),
				username: "PlannerUser",
				displayName: localStorage.getItem("displayName") || "Planner User",
				isRegistered: true,
				baseData: {
					status: "uninitialized",
					permitLevel: 1,
					platforms: [],
					infrastructure: [],
					orderQueue: [],
				},
			},
		};

		setCompanies(
			companies.map((c) =>
				c.id === selectedCompanyId ? { ...c, plans: [...c.plans, newPlan] } : c,
			),
		);
		setNewPlanName("");
		setNewPlanetName("");
		setNewPlanDescription("");
		setIsPlanDialogOpen(false);
	};

	const handleDeletePlan = (planId: string) => {
		if (window.confirm("Are you sure you want to delete this plan?")) {
			setCompanies(
				companies.map((c) =>
					c.id === selectedCompanyId
						? { ...c, plans: c.plans.filter((p) => p.id !== planId) }
						: c,
				),
			);
		}
	};

	const handleUpdatePlanUser = useCallback(
		(updatedUser: NodeAssignedUser) => {
			setCompanies((prev) =>
				prev.map((c) => {
					if (c.id === selectedCompanyId) {
						return {
							...c,
							plans: c.plans.map((p) =>
								p.id === selectedPlanId ? { ...p, user: updatedUser } : p,
							),
						};
					}
					return c;
				}),
			);
		},
		[selectedCompanyId, selectedPlanId],
	);

	const selectedCompany = useMemo(
		() => companies.find((c) => c.id === selectedCompanyId),
		[companies, selectedCompanyId],
	);
	const selectedPlan = useMemo(
		() => selectedCompany?.plans.find((p) => p.id === selectedPlanId),
		[selectedCompany, selectedPlanId],
	);

	const activeBuildings = staticData?.buildings?.length
		? staticData.buildings
		: FALLBACK_BUILDINGS;
	const activeWorkerNeeds = staticData?.needs
		? staticData.needs
		: FALLBACK_NEEDS;
	const activeRecipes = staticData?.materials
		? flattenRecipes(staticData.materials)
		: FALLBACK_RECIPES;

	// Metrics Calculation for Company Dashboard
	const companyMetrics = useMemo(() => {
		if (!selectedCompany) return null;

		let totalBuildings = 0,
			totalCost = 0,
			totalRevenue = 0,
			totalConsumptionCost = 0,
			dailyExport = 0,
			dailyImport = 0;
		let suggestedTotalBuildings = 0,
			suggestedTotalCost = 0,
			suggestedTotalRevenue = 0,
			suggestedTotalConsumptionCost = 0,
			suggestedDailyExport = 0,
			suggestedDailyImport = 0;
		const planets = new Set<string>();

		const netMaterialIO: Record<
			string,
			{ delta: number; prod: number; cons: number }
		> = {};
		const suggestedNetMaterialIO: Record<
			string,
			{ delta: number; prod: number; cons: number }
		> = {};
		const planDetails: any[] = [];

		selectedCompany.plans.forEach((plan) => {
			if (plan.user.baseData.status === "uninitialized") {
				planDetails.push({
					id: plan.id,
					name: plan.name,
					planetName: plan.planetName,
					description: plan.description,
					profit: 0,
					suggestedProfit: 0,
					buildings: 0,
					suggestedBuildings: 0,
					cost: 0,
					suggestedCost: 0,
					export: 0,
					suggestedExport: 0,
					import: 0,
					suggestedImport: 0,
				});
				return;
			}

			const m = calculateBaseMetrics({
				activeData: plan.user.baseData,
				activeBuildings,
				activeWorkerNeeds,
				activeRecipes,
				activeNeeds: plan.user.activeNeeds || {},
				experts: plan.user.experts || {},
				activeCogc: plan.user.activeCogc || null,
				planetFactor:
					plan.user.planetFactor !== undefined ? plan.user.planetFactor : 100,
				getPrice: (ticker) => getPrice(ticker, selectedCompany.cxSettings),
				faction: plan.user.faction || "No faction",
				usedPermits: plan.user.usedPermits || 1,
				totalPermits: plan.user.totalPermits || 1,
			});

			const primarySug = plan.primarySuggestionId
				? plan.suggestedPlans?.find((s) => s.id === plan.primarySuggestionId)
				: null;
			const sm = primarySug
				? calculateBaseMetrics({
						activeData: primarySug.baseData,
						activeBuildings,
						activeWorkerNeeds,
						activeRecipes,
						activeNeeds: primarySug.activeNeeds || plan.user.activeNeeds || {},
						experts: primarySug.experts || plan.user.experts || {},
						activeCogc:
							primarySug.activeCogc !== undefined
								? primarySug.activeCogc
								: plan.user.activeCogc || null,
						planetFactor:
							primarySug.planetFactor !== undefined
								? primarySug.planetFactor
								: plan.user.planetFactor !== undefined
									? plan.user.planetFactor
									: 100,
						getPrice: (ticker) => getPrice(ticker, selectedCompany.cxSettings),
						faction: primarySug.faction || plan.user.faction || "No faction",
						usedPermits:
							primarySug.usedPermits !== undefined
								? primarySug.usedPermits
								: plan.user.usedPermits || 1,
						totalPermits:
							primarySug.totalPermits !== undefined
								? primarySug.totalPermits
								: plan.user.totalPermits || 1,
					})
				: m;

			let planBuildings = 0,
				planSuggestedBuildings = 0;
			plan.user.baseData.platforms?.forEach((p: any) => {
				totalBuildings += p.amount;
				planBuildings += p.amount;
			});
			if (primarySug) {
				primarySug.baseData.platforms?.forEach((p: any) => {
					suggestedTotalBuildings += p.amount;
					planSuggestedBuildings += p.amount;
				});
			} else {
				suggestedTotalBuildings += planBuildings;
				planSuggestedBuildings = planBuildings;
			}

			planets.add(plan.planetName);
			totalCost += m.totalCapEx;
			totalRevenue += m.totalDailyProfit;
			dailyExport += m.totalVolumeExport;
			dailyImport += m.totalVolumeImport;
			suggestedTotalCost += sm.totalCapEx;
			suggestedTotalRevenue += sm.totalDailyProfit;
			suggestedDailyExport += sm.totalVolumeExport;
			suggestedDailyImport += sm.totalVolumeImport;

			Object.entries(m.materialIO).forEach(([ticker, io]: [string, any]) => {
				if (!netMaterialIO[ticker])
					netMaterialIO[ticker] = { delta: 0, prod: 0, cons: 0 };
				netMaterialIO[ticker].delta += io.delta;
				netMaterialIO[ticker].prod += io.prod;
				netMaterialIO[ticker].cons += io.cons;
				totalConsumptionCost +=
					io.cons * getPrice(ticker, selectedCompany.cxSettings);
			});

			Object.entries(sm.materialIO).forEach(([ticker, io]: [string, any]) => {
				if (!suggestedNetMaterialIO[ticker])
					suggestedNetMaterialIO[ticker] = { delta: 0, prod: 0, cons: 0 };
				suggestedNetMaterialIO[ticker].delta += io.delta;
				suggestedNetMaterialIO[ticker].prod += io.prod;
				suggestedNetMaterialIO[ticker].cons += io.cons;
				suggestedTotalConsumptionCost +=
					io.cons * getPrice(ticker, selectedCompany.cxSettings);
			});

			planDetails.push({
				id: plan.id,
				name: plan.name,
				planetName: plan.planetName,
				description: plan.description,
				profit: m.totalDailyProfit,
				suggestedProfit: sm.totalDailyProfit,
				buildings: planBuildings,
				suggestedBuildings: planSuggestedBuildings,
				cost: m.totalCapEx,
				suggestedCost: sm.totalCapEx,
				export: m.totalVolumeExport,
				suggestedExport: sm.totalVolumeExport,
				import: m.totalVolumeImport,
				suggestedImport: sm.totalVolumeImport,
			});
		});

		const materialProfits: any[] = [];
		const materialCosts: any[] = [];
		const netProduction: any[] = [];
		const netConsumption: any[] = [];

		Object.entries(netMaterialIO).forEach(([ticker, io]) => {
			const price = getPrice(ticker, selectedCompany.cxSettings);
			if (io.delta > 0) {
				materialProfits.push({ name: ticker, value: io.delta * price });
				netProduction.push({ name: ticker, amount: io.delta });
			} else if (io.delta < 0) {
				materialCosts.push({ name: ticker, value: Math.abs(io.delta) * price });
				netConsumption.push({ name: ticker, amount: Math.abs(io.delta) });
			}
		});

		// Sort arrays for better charts
		planDetails.sort((a, b) => b.profit - a.profit);
		materialProfits.sort((a, b) => b.value - a.value);
		materialCosts.sort((a, b) => b.value - a.value);
		netProduction.sort((a, b) => b.amount - a.amount);
		netConsumption.sort((a, b) => b.amount - a.amount);

		return {
			totalBuildings,
			totalCost,
			totalRevenue,
			totalConsumptionCost,
			dailyExport,
			dailyImport,
			totalPlanets: planets.size,
			suggestedTotalBuildings,
			suggestedTotalCost,
			suggestedTotalRevenue,
			suggestedTotalConsumptionCost,
			suggestedDailyExport,
			suggestedDailyImport,
			planDetails,
			materialProfits,
			materialCosts,
			netProduction,
			netConsumption,
			netMaterialIO,
			suggestedNetMaterialIO,
		};
	}, [
		selectedCompany,
		activeBuildings,
		activeWorkerNeeds,
		activeRecipes,
		getPrice,
	]);

	const opportunities = useMemo(() => {
		if (!companyMetrics) return [];
		const opps: any[] = [];
		activeRecipes.forEach((r) => {
			if (!r.inputs || r.inputs.length === 0) return;
			let availableInputsCount = 0;
			let totalExcessAvailable = 0;

			r.inputs.forEach((inp: any) => {
				const excess = companyMetrics.netMaterialIO[inp.ticker]?.delta || 0;
				if (excess > 0) {
					availableInputsCount++;
					totalExcessAvailable += excess;
				}
			});

			if (availableInputsCount > 0) {
				opps.push({
					recipe: r,
					availableInputsCount,
					totalExcessAvailable,
					matchRatio: availableInputsCount / r.inputs.length,
				});
			}
		});
		return opps
			.sort(
				(a, b) =>
					b.matchRatio - a.matchRatio ||
					b.totalExcessAvailable - a.totalExcessAvailable,
			)
			.slice(0, 8);
	}, [activeRecipes, companyMetrics]);

	if (selectedPlan) {
		return (
			<Box
				sx={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
				}}
			>
				{isStaticDataLoading && (
					<Typography sx={{ p: 2 }}>Loading static data...</Typography>
				)}
				{staticDataError && (
					<Typography color="error" sx={{ p: 2 }}>
						Error loading static data: {staticDataError}
					</Typography>
				)}
				{!isStaticDataLoading && staticData && (
					<Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
						<Box
							sx={{
								p: 1,
								bgcolor: "background.paper",
								borderBottom: "1px solid",
								borderColor: "divider",
								display: "flex",
								justifyContent: "flex-end",
								alignItems: "center",
							}}
						>
							<Typography variant="caption" sx={{ mr: 2 }}>
								Dev Testing:
							</Typography>
							<Select
								size="small"
								value={devPersona}
								onChange={(e) => setDevPersona(e.target.value as any)}
								sx={{ mr: 2, height: 32, minWidth: 220 }}
							>
								<MenuItem value="owner">User owner</MenuItem>
								<MenuItem value="registered">
									User registered (not owner)
								</MenuItem>
								<MenuItem value="guest">Unregistered guest</MenuItem>
							</Select>
							<Button
								size="small"
								variant="outlined"
								color="primary"
								onClick={() => {
									const link = `${window.location.origin}/planner/${selectedPlan.id}`;
									navigator.clipboard.writeText(link);
									alert("Shareable link copied to clipboard!");
								}}
							>
								Copy Shareable Link
							</Button>
						</Box>
						<BaseManager
							user={selectedPlan.user}
							onUpdateUser={handleUpdatePlanUser}
							currentUserId={
								devPersona === "guest"
									? null
									: devPersona === "registered"
										? devRegisteredUserId
										: selectedPlan.user.uid
							}
							isGroupOwner={true}
							planetName={selectedPlan.planetName}
							staticData={staticData}
							standalone={true}
							planName={selectedPlan.name}
							planDescription={selectedPlan.description}
							onClose={() =>
								isPublicView ? navigate("/") : navigate("/dashboard/planner")
							}
							cx={selectedCompanyStation}
							isGuestMode={devPersona === "registered"}
							readOnly={isPublicView || devPersona === "guest"}
							suggestions={selectedPlan.suggestedPlans || []}
							primarySuggestionId={selectedPlan.primarySuggestionId}
							onSaveSuggestion={(suggestion) => {
								setCompanies((prev) =>
									prev.map((c) => {
										if (c.id === selectedCompanyId) {
											return {
												...c,
												plans: c.plans.map((p) => {
													if (p.id === selectedPlanId) {
														const existingIndex = (
															p.suggestedPlans || []
														).findIndex((s) => s.id === suggestion.id);
														const newSuggestions = [
															...(p.suggestedPlans || []),
														];
														if (existingIndex > -1) {
															newSuggestions[existingIndex] = suggestion;
														} else {
															newSuggestions.push(suggestion);
														}
														return { ...p, suggestedPlans: newSuggestions };
													}
													return p;
												}),
											};
										}
										return c;
									}),
								);
								alert("Suggestion saved!");
							}}
							onSetPrimarySuggestion={(sId) => {
								setCompanies((prev) =>
									prev.map((c) => {
										if (c.id === selectedCompanyId) {
											return {
												...c,
												plans: c.plans.map((p) =>
													p.id === selectedPlanId
														? { ...p, primarySuggestionId: sId }
														: p,
												),
											};
										}
										return c;
									}),
								);
							}}
							onDeleteSuggestion={(sId) => {
								setCompanies((prev) =>
									prev.map((c) => {
										if (c.id === selectedCompanyId) {
											return {
												...c,
												plans: c.plans.map((p) => {
													if (p.id === selectedPlanId) {
														const newSuggestions = (
															p.suggestedPlans || []
														).filter((s) => s.id !== sId);
														const newPrimary =
															p.primarySuggestionId === sId
																? null
																: p.primarySuggestionId;
														return {
															...p,
															suggestedPlans: newSuggestions,
															primarySuggestionId: newPrimary,
														};
													}
													return p;
												}),
											};
										}
										return c;
									}),
								);
							}}
						/>
					</Box>
				)}
			</Box>
		);
	}

	const renderPieChart = (
		title: string,
		data: any[],
		dataKey: string,
		formatter: (val: number) => string,
	) => (
		<Paper
			variant="outlined"
			sx={{
				p: 1.5,
				height: 260,
				display: "flex",
				flexDirection: "column",
				bgcolor: "background.paper",
			}}
		>
			<Typography
				variant="subtitle2"
				align="center"
				sx={{ mb: 1 }}
				noWrap
				title={title}
			>
				{title}
			</Typography>
			<Box sx={{ flexGrow: 1, minHeight: 0 }}>
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={data.slice(0, 10)}
							dataKey={dataKey}
							nameKey="name"
							cx="50%"
							cy="50%"
							innerRadius={40}
							outerRadius={70}
							paddingAngle={2}
						>
							{data.slice(0, 10).map((_, index) => (
								<Cell
									key={`cell-${index}`}
									fill={COLORS[index % COLORS.length]}
								/>
							))}
						</Pie>
						<Tooltip
							formatter={(value) =>
								formatter(
									typeof value === "number" ? value : Number(value) || 0,
								)
							}
							contentStyle={{
								backgroundColor: theme.palette.background.paper,
								borderRadius: 8,
								padding: 8,
							}}
							itemStyle={{ fontSize: "0.85rem" }}
						/>
						<Legend
							iconType="circle"
							wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
						/>
					</PieChart>
				</ResponsiveContainer>
			</Box>
		</Paper>
	);

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				width: "100%",
				bgcolor: "background.default",
				overflow: "hidden",
			}}
		>
			{/* Top Bar with Autocomplete Selector */}
			<Box
				sx={{
					p: 2,
					display: "flex",
					gap: 2,
					alignItems: "center",
					borderBottom: "1px solid",
					borderColor: "divider",
					bgcolor: "background.paper",
					zIndex: 10,
				}}
			>
				<Autocomplete
					options={companies}
					getOptionLabel={(option) => option.name}
					value={selectedCompany ?? undefined}
					onChange={(_, newValue) => setSelectedCompanyId(newValue?.id || null)}
					renderInput={(params) => (
						<TextField
							{...params}
							label="Select Company"
							size="small"
							variant="outlined"
						/>
					)}
					sx={{ width: 300 }}
					disableClearable
				/>

				<Button
					variant="contained"
					startIcon={<Add />}
					onClick={() => setIsCompanyDialogOpen(true)}
					size="small"
					sx={{ ml: "auto" }}
				>
					New Company
				</Button>

				{selectedCompany && (
					<IconButton
						color="error"
						onClick={() => handleDeleteCompany(selectedCompany.id)}
						size="small"
						sx={{ ml: 1 }}
					>
						<Delete />
					</IconButton>
				)}
			</Box>

			{/* Main Scrollable Content */}
			<Box sx={{ p: 3, flexGrow: 1, overflowY: "auto" }}>
				{!selectedCompany ? (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
						}}
					>
						<Typography color="text.secondary">
							Select or create a company to view the dashboard.
						</Typography>
					</Box>
				) : (
					companyMetrics && (
						<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
							{/* Top Metrics Row */}
							<Box
								sx={{
									display: "grid",
									gridTemplateColumns: {
										xs: "repeat(2, 1fr)",
										sm: "repeat(3, 1fr)",
										md: "repeat(6, 1fr)",
									},
									gap: 2,
								}}
							>
								<Paper
									variant="outlined"
									sx={{
										p: 1.5,
										textAlign: "center",
										display: "flex",
										flexDirection: "column",
										justifyContent: "center",
									}}
								>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ fontWeight: "bold" }}
									>
										TOTAL BASES
									</Typography>
									<Typography variant="h6">
										{companyMetrics.totalPlanets}
									</Typography>
								</Paper>
								<Paper
									variant="outlined"
									sx={{
										p: 1.5,
										textAlign: "center",
										display: "flex",
										flexDirection: "column",
										justifyContent: "center",
									}}
								>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ fontWeight: "bold" }}
									>
										TOTAL BUILDINGS
									</Typography>
									<Typography variant="h6">
										{companyMetrics.totalBuildings}
										{companyMetrics.suggestedTotalBuildings !==
											companyMetrics.totalBuildings && (
											<Typography
												component="span"
												variant="body2"
												sx={{ color: "warning.main", ml: 1 }}
											>
												({companyMetrics.suggestedTotalBuildings})
											</Typography>
										)}
									</Typography>
								</Paper>
								<Paper
									variant="outlined"
									sx={{
										p: 1.5,
										textAlign: "center",
										display: "flex",
										flexDirection: "column",
										justifyContent: "center",
									}}
								>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ fontWeight: "bold" }}
									>
										CAPEX (COST)
									</Typography>
									<Typography variant="h6" color="error.main">
										-{companyMetrics.totalCost.toLocaleString()} ₡
										{companyMetrics.suggestedTotalCost !==
											companyMetrics.totalCost && (
											<Typography
												component="span"
												variant="body2"
												sx={{ color: "warning.main", ml: 1 }}
											>
												(-{companyMetrics.suggestedTotalCost.toLocaleString()}{" "}
												₡)
											</Typography>
										)}
									</Typography>
								</Paper>
								<Paper
									variant="outlined"
									sx={{
										p: 1.5,
										textAlign: "center",
										display: "flex",
										flexDirection: "column",
										justifyContent: "center",
									}}
								>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ fontWeight: "bold" }}
									>
										DAILY PROFIT
									</Typography>
									<Typography
										variant="h6"
										color={
											companyMetrics.totalRevenue >= 0
												? "success.main"
												: "error.main"
										}
									>
										{companyMetrics.totalRevenue >= 0 ? "+" : ""}
										{companyMetrics.totalRevenue.toLocaleString(undefined, {
											maximumFractionDigits: 0,
										})}{" "}
										₡
										{companyMetrics.suggestedTotalRevenue !==
											companyMetrics.totalRevenue && (
											<Typography
												component="span"
												variant="body2"
												sx={{ color: "warning.main", ml: 1 }}
											>
												({companyMetrics.suggestedTotalRevenue >= 0 ? "+" : ""}
												{companyMetrics.suggestedTotalRevenue.toLocaleString(
													undefined,
													{ maximumFractionDigits: 0 },
												)}{" "}
												₡)
											</Typography>
										)}
									</Typography>
								</Paper>
								<Paper
									variant="outlined"
									sx={{
										p: 1.5,
										textAlign: "center",
										display: "flex",
										flexDirection: "column",
										justifyContent: "center",
									}}
								>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ fontWeight: "bold" }}
									>
										DAILY CONS. COST
									</Typography>
									<Typography variant="h6" color="error.main">
										-
										{companyMetrics.totalConsumptionCost.toLocaleString(
											undefined,
											{ maximumFractionDigits: 0 },
										)}{" "}
										₡
										{companyMetrics.suggestedTotalConsumptionCost !==
											companyMetrics.totalConsumptionCost && (
											<Typography
												component="span"
												variant="body2"
												sx={{ color: "warning.main", ml: 1 }}
											>
												(-
												{companyMetrics.suggestedTotalConsumptionCost.toLocaleString(
													undefined,
													{ maximumFractionDigits: 0 },
												)}{" "}
												₡)
											</Typography>
										)}
									</Typography>
								</Paper>
								<Paper
									variant="outlined"
									sx={{
										p: 1.5,
										textAlign: "center",
										display: "flex",
										flexDirection: "column",
										justifyContent: "center",
									}}
								>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ fontWeight: "bold" }}
									>
										DAILY FREIGHT
									</Typography>
									<Typography
										variant="body2"
										color="success.main"
										sx={{ fontWeight: "bold" }}
									>
										Exp:{" "}
										{companyMetrics.dailyExport.toLocaleString(undefined, {
											maximumFractionDigits: 0,
										})}{" "}
										m³
										{companyMetrics.suggestedDailyExport !==
											companyMetrics.dailyExport && (
											<Typography
												component="span"
												variant="caption"
												sx={{ color: "warning.main", ml: 0.5 }}
											>
												(
												{companyMetrics.suggestedDailyExport.toLocaleString(
													undefined,
													{ maximumFractionDigits: 0 },
												)}
												)
											</Typography>
										)}
									</Typography>
									<Typography
										variant="body2"
										color="warning.main"
										sx={{ fontWeight: "bold" }}
									>
										Imp:{" "}
										{companyMetrics.dailyImport.toLocaleString(undefined, {
											maximumFractionDigits: 0,
										})}{" "}
										m³
										{companyMetrics.suggestedDailyImport !==
											companyMetrics.dailyImport && (
											<Typography
												component="span"
												variant="caption"
												sx={{ color: "warning.main", ml: 0.5 }}
											>
												(
												{companyMetrics.suggestedDailyImport.toLocaleString(
													undefined,
													{ maximumFractionDigits: 0 },
												)}
												)
											</Typography>
										)}
									</Typography>
								</Paper>
							</Box>

							{/* Compact Pie Charts Grid */}
							<Box
								sx={{
									display: "grid",
									gridTemplateColumns: {
										xs: "1fr",
										sm: "repeat(2, 1fr)",
										lg: "repeat(5, 1fr)",
									},
									gap: 2,
								}}
							>
								{renderPieChart(
									"Profits By Plan",
									companyMetrics.planDetails,
									"profit",
									(val: number) =>
										`${val.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₡`,
								)}
								{renderPieChart(
									"Material Profits",
									companyMetrics.materialProfits,
									"value",
									(val: number) =>
										`${val.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₡`,
								)}
								{renderPieChart(
									"Material Costs",
									companyMetrics.materialCosts,
									"value",
									(val: number) =>
										`-${val.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₡`,
								)}
								{renderPieChart(
									"Net Production (Surplus)",
									companyMetrics.netProduction,
									"amount",
									(val: number) =>
										`${val.toLocaleString(undefined, { maximumFractionDigits: 0 })} unit(s)`,
								)}
								{renderPieChart(
									"Net Consumption (Deficit)",
									companyMetrics.netConsumption,
									"amount",
									(val: number) =>
										`${val.toLocaleString(undefined, { maximumFractionDigits: 0 })} unit(s)`,
								)}
							</Box>

							{/* Production Opportunities */}
							<Box>
								<Typography
									variant="subtitle1"
									sx={{
										mb: 1.5,
										display: "flex",
										alignItems: "center",
										gap: 1,
										fontWeight: "bold",
									}}
								>
									<PrecisionManufacturing color="secondary" fontSize="small" />{" "}
									Production Opportunities
								</Typography>
								{opportunities.length === 0 ? (
									<Typography color="text.secondary" variant="body2">
										No immediate opportunities found based on current surplus.
									</Typography>
								) : (
									<Box
										sx={{
											display: "grid",
											gridTemplateColumns: {
												xs: "1fr",
												sm: "repeat(2, 1fr)",
												md: "repeat(4, 1fr)",
											},
											gap: 1.5,
										}}
									>
										{opportunities.map((opp, idx) => (
											<Card
												key={idx}
												variant="outlined"
												sx={{ bgcolor: "background.default" }}
											>
												<CardContent
													sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}
												>
													<Typography
														variant="body2"
														sx={{ fontWeight: "bold" }}
														noWrap
													>
														{opp.recipe.inStr} ➔ {opp.recipe.outStr}
													</Typography>
													<Typography
														variant="caption"
														sx={{ display: "block" }}
														color="text.secondary"
													>
														Facility: {opp.recipe.madeIn}
													</Typography>
													<Box
														sx={{
															display: "flex",
															justifyContent: "space-between",
															mt: 1,
															alignItems: "center",
														}}
													>
														<Typography variant="caption">Match:</Typography>
														<Typography
															variant="caption"
															sx={{ fontWeight: "bold" }}
															color="success.main"
														>
															{Math.round(opp.matchRatio * 100)}% (
															{opp.availableInputsCount}/
															{opp.recipe.inputs.length})
														</Typography>
													</Box>
												</CardContent>
											</Card>
										))}
									</Box>
								)}
							</Box>

							{/* Material IO Aggregation Table */}
							<Box sx={{ mt: 1 }}>
								<Typography
									variant="subtitle1"
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										fontWeight: "bold",
										mb: 1.5,
									}}
								>
									<AssignmentTurnedIn color="primary" fontSize="small" />{" "}
									Aggregated Material I/O
								</Typography>
								<TableContainer
									component={Paper}
									variant="outlined"
									sx={{ maxHeight: 300 }}
								>
									<Table size="small" stickyHeader>
										<TableHead>
											<TableRow>
												<TableCell
													sx={{
														fontWeight: "bold",
														bgcolor: "background.default",
													}}
												>
													Material
												</TableCell>
												<TableCell
													align="right"
													sx={{
														fontWeight: "bold",
														bgcolor: "background.default",
													}}
												>
													Produced
												</TableCell>
												<TableCell
													align="right"
													sx={{
														fontWeight: "bold",
														bgcolor: "background.default",
													}}
												>
													Consumed
												</TableCell>
												<TableCell
													align="right"
													sx={{
														fontWeight: "bold",
														bgcolor: "background.default",
													}}
												>
													Net Delta
												</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{Object.entries(companyMetrics.suggestedNetMaterialIO)
												.sort((a, b) => b[1].delta - a[1].delta)
												.map(([ticker, io]) => {
													const origIo = companyMetrics.netMaterialIO[
														ticker
													] || { prod: 0, cons: 0, delta: 0 };
													return (
														<TableRow key={ticker} hover>
															<TableCell>
																<Typography
																	variant="body2"
																	sx={{ fontWeight: "bold" }}
																>
																	{ticker}
																</Typography>
															</TableCell>
															<TableCell align="right">
																<Typography
																	variant="body2"
																	color="success.main"
																>
																	+
																	{origIo.prod.toLocaleString(undefined, {
																		maximumFractionDigits: 1,
																	})}
																</Typography>
																{io.prod !== origIo.prod && (
																	<Typography
																		variant="caption"
																		sx={{
																			color: "warning.main",
																			display: "block",
																		}}
																	>
																		(+
																		{io.prod.toLocaleString(undefined, {
																			maximumFractionDigits: 1,
																		})}
																		)
																	</Typography>
																)}
															</TableCell>
															<TableCell align="right">
																<Typography variant="body2" color="error.main">
																	-
																	{origIo.cons.toLocaleString(undefined, {
																		maximumFractionDigits: 1,
																	})}
																</Typography>
																{io.cons !== origIo.cons && (
																	<Typography
																		variant="caption"
																		sx={{
																			color: "warning.main",
																			display: "block",
																		}}
																	>
																		(-
																		{io.cons.toLocaleString(undefined, {
																			maximumFractionDigits: 1,
																		})}
																		)
																	</Typography>
																)}
															</TableCell>
															<TableCell align="right">
																<Typography
																	variant="body2"
																	sx={{ fontWeight: "bold" }}
																	color={
																		origIo.delta >= 0
																			? "success.main"
																			: "error.main"
																	}
																>
																	{origIo.delta >= 0 ? "+" : ""}
																	{origIo.delta.toLocaleString(undefined, {
																		maximumFractionDigits: 1,
																	})}
																</Typography>
																{io.delta !== origIo.delta && (
																	<Typography
																		variant="caption"
																		sx={{
																			color: "warning.main",
																			display: "block",
																			fontWeight: "bold",
																		}}
																	>
																		({io.delta >= 0 ? "+" : ""}
																		{io.delta.toLocaleString(undefined, {
																			maximumFractionDigits: 1,
																		})}
																		)
																	</Typography>
																)}
															</TableCell>
														</TableRow>
													);
												})}
										</TableBody>
									</Table>
								</TableContainer>
							</Box>

							{/* Plan List Table */}
							<Box sx={{ mt: 1 }}>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										mb: 1.5,
									}}
								>
									<Typography
										variant="subtitle1"
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
											fontWeight: "bold",
										}}
									>
										<AssignmentTurnedIn color="primary" fontSize="small" />{" "}
										Plans in {selectedCompany.name}
									</Typography>
									<Button
										size="small"
										variant="contained"
										startIcon={<Add />}
										onClick={() => setIsPlanDialogOpen(true)}
									>
										Add Plan
									</Button>
								</Box>
								{selectedCompany.plans.length === 0 ? (
									<Paper
										variant="outlined"
										sx={{
											p: 3,
											textAlign: "center",
											bgcolor: "background.default",
										}}
									>
										<Typography variant="body2" color="text.secondary">
											No plans in this company.
										</Typography>
									</Paper>
								) : (
									<TableContainer component={Paper} variant="outlined">
										<Table size="small">
											<TableHead sx={{ bgcolor: "background.default" }}>
												<TableRow>
													<TableCell sx={{ fontWeight: "bold" }}>
														Plan Name
													</TableCell>
													<TableCell sx={{ fontWeight: "bold" }}>
														Planet
													</TableCell>
													<TableCell align="right" sx={{ fontWeight: "bold" }}>
														Buildings
													</TableCell>
													<TableCell align="right" sx={{ fontWeight: "bold" }}>
														Cost (CapEx)
													</TableCell>
													<TableCell align="right" sx={{ fontWeight: "bold" }}>
														Daily Profit
													</TableCell>
													<TableCell align="right" sx={{ fontWeight: "bold" }}>
														Export (m³)
													</TableCell>
													<TableCell align="right" sx={{ fontWeight: "bold" }}>
														Import (m³)
													</TableCell>
													<TableCell align="center" sx={{ fontWeight: "bold" }}>
														Actions
													</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{companyMetrics.planDetails.map((plan) => (
													<TableRow key={plan.id} hover>
														<TableCell>
															<Typography
																variant="body2"
																sx={{ fontWeight: "bold" }}
															>
																{plan.name}
															</Typography>
															{plan.description && (
																<Typography
																	variant="caption"
																	color="text.secondary"
																>
																	{plan.description}
																</Typography>
															)}
														</TableCell>
														<TableCell>
															<Typography variant="body2">
																{plan.planetName}
															</Typography>
														</TableCell>
														<TableCell align="right">
															<Typography variant="body2">
																{plan.buildings}
															</Typography>
															{plan.suggestedBuildings !== plan.buildings && (
																<Typography
																	variant="caption"
																	sx={{
																		color: "warning.main",
																		display: "block",
																	}}
																>
																	({plan.suggestedBuildings})
																</Typography>
															)}
														</TableCell>
														<TableCell align="right">
															<Typography variant="body2" color="error.main">
																-{plan.cost.toLocaleString()} ₡
															</Typography>
															{plan.suggestedCost !== plan.cost && (
																<Typography
																	variant="caption"
																	sx={{
																		color: "warning.main",
																		display: "block",
																	}}
																>
																	(-{plan.suggestedCost.toLocaleString()} ₡)
																</Typography>
															)}
														</TableCell>
														<TableCell align="right">
															<Typography
																variant="body2"
																color={
																	plan.profit >= 0
																		? "success.main"
																		: "error.main"
																}
																sx={{ fontWeight: "bold" }}
															>
																{plan.profit >= 0 ? "+" : ""}
																{plan.profit.toLocaleString(undefined, {
																	maximumFractionDigits: 0,
																})}{" "}
																₡
															</Typography>
															{plan.suggestedProfit !== plan.profit && (
																<Typography
																	variant="caption"
																	sx={{
																		color: "warning.main",
																		display: "block",
																		fontWeight: "bold",
																	}}
																>
																	({plan.suggestedProfit >= 0 ? "+" : ""}
																	{plan.suggestedProfit.toLocaleString(
																		undefined,
																		{ maximumFractionDigits: 0 },
																	)}{" "}
																	₡)
																</Typography>
															)}
														</TableCell>
														<TableCell align="right">
															<Typography variant="body2">
																{plan.export.toLocaleString(undefined, {
																	maximumFractionDigits: 0,
																})}
															</Typography>
															{plan.suggestedExport !== plan.export && (
																<Typography
																	variant="caption"
																	sx={{
																		color: "warning.main",
																		display: "block",
																	}}
																>
																	(
																	{plan.suggestedExport.toLocaleString(
																		undefined,
																		{ maximumFractionDigits: 0 },
																	)}
																	)
																</Typography>
															)}
														</TableCell>
														<TableCell align="right">
															<Typography variant="body2">
																{plan.import.toLocaleString(undefined, {
																	maximumFractionDigits: 0,
																})}
															</Typography>
															{plan.suggestedImport !== plan.import && (
																<Typography
																	variant="caption"
																	sx={{
																		color: "warning.main",
																		display: "block",
																	}}
																>
																	(
																	{plan.suggestedImport.toLocaleString(
																		undefined,
																		{ maximumFractionDigits: 0 },
																	)}
																	)
																</Typography>
															)}
														</TableCell>
														<TableCell align="center">
															<Button
																size="small"
																onClick={() =>
																	navigate(`/dashboard/planner/${plan.id}`)
																}
																sx={{ minWidth: "auto", mr: 1 }}
															>
																Open
															</Button>
															<IconButton
																size="small"
																color="error"
																onClick={() => handleDeletePlan(plan.id)}
															>
																<Delete fontSize="small" />
															</IconButton>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								)}
							</Box>
						</Box>
					)
				)}
			</Box>

			{/* Company Dialog */}
			<Dialog
				open={isCompanyDialogOpen}
				onClose={() => setIsCompanyDialogOpen(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>Create New Company</DialogTitle>
				<DialogContent sx={{ pt: 1 }}>
					<TextField
						autoFocus
						margin="dense"
						label="Company Name"
						fullWidth
						variant="outlined"
						size="small"
						value={newCompanyName}
						onChange={(e) => setNewCompanyName(e.target.value)}
						sx={{ mb: 2, mt: 1 }}
					/>
					<TextField
						margin="dense"
						label="Primary Station"
						fullWidth
						variant="outlined"
						size="small"
						value={newPrimaryStation}
						onChange={(e) => setNewPrimaryStation(e.target.value)}
						sx={{ mb: 2 }}
					/>
					<FormControl fullWidth size="small">
						<InputLabel>CX Pricing Setup</InputLabel>
						<Select
							value={newCxSettings}
							label="CX Pricing Setup"
							onChange={(e) => setNewCxSettings(e.target.value as any)}
						>
							<MenuItem value="market">Market Maker (Normal)</MenuItem>
							<MenuItem value="corp">Corporation Maker (Discounted)</MenuItem>
						</Select>
					</FormControl>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setIsCompanyDialogOpen(false)}>Cancel</Button>
					<Button
						onClick={handleCreateCompany}
						variant="contained"
						disabled={!newCompanyName.trim()}
					>
						Create
					</Button>
				</DialogActions>
			</Dialog>

			{/* Plan Dialog */}
			<Dialog
				open={isPlanDialogOpen}
				onClose={() => setIsPlanDialogOpen(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>Create New Plan</DialogTitle>
				<DialogContent sx={{ pt: 1 }}>
					<TextField
						autoFocus
						margin="dense"
						label="Plan Name"
						fullWidth
						variant="outlined"
						size="small"
						value={newPlanName}
						onChange={(e) => setNewPlanName(e.target.value)}
						sx={{ mb: 2, mt: 1 }}
					/>
					<TextField
						margin="dense"
						label="Planet Name"
						fullWidth
						variant="outlined"
						size="small"
						value={newPlanetName}
						onChange={(e) => setNewPlanetName(e.target.value)}
						sx={{ mb: 2 }}
					/>
					<TextField
						margin="dense"
						label="Description (optional)"
						fullWidth
						variant="outlined"
						size="small"
						value={newPlanDescription}
						onChange={(e) => setNewPlanDescription(e.target.value)}
						multiline
						rows={2}
					/>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setIsPlanDialogOpen(false)}>Cancel</Button>
					<Button
						onClick={handleCreatePlan}
						variant="contained"
						disabled={!newPlanName.trim() || !newPlanetName.trim()}
					>
						Create
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};
