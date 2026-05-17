import { API_BASE_URL } from "../config/api";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
	Box,
	Typography,
	CircularProgress,
	Paper,
	LinearProgress,
	Tooltip,
	Divider,
	IconButton,
	Chip,
	Drawer,
	TextField,
	InputAdornment,
	Snackbar,
	Alert,
	Tab,
	Tabs,
	Button,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Menu,
	Grid,
	useTheme,
	alpha,
	AlertColor,
	Stack,
} from "@mui/material";
import {
	Archive,
	Search,
	Factory as FactoryIcon,
	Layers,
	ContentCopy as ContentCopyIcon,
	FilterList,
	Warning,
	CheckCircle,
	Inventory2,
} from "@mui/icons-material";
import {
	Clock as ClockLucide,
	Archive as ArchiveLucide,
	MapPin,
	Flame,
} from "lucide-react";
import { Masonry } from "@mui/lab";
import { styled } from "@mui/material/styles";
// Assuming this component exists in your project structure
import ConsumptionFlowDetail from "./Production/FlowDetail";

// --- TYPES & INTERFACES ---

export interface SnackbarState {
	open: boolean;
	message: string;
	severity: "success" | "error" | "warning" | "info";
}

interface ProductionOrder {
	order_id: string;
	production_recipe: {
		name: string;
		inputs: { ticker: string; factor: number }[];
		outputs: { ticker: string; factor: number }[];
	};
}

interface ProductionLine {
	line_id: string;
	type: string;
	capacity: number;
	efficiency: number;
	condition: number;
	queue: ProductionOrder[];
}

interface StorageItem {
	ticker: string;
	amount: number;
	material_id: string;
}

interface Site_daily_flow {
	flow: number;
	currentAmount: number;
}

export interface SiteSummary {
	planet_name: string;
	area: number;
	invested_permits: number;
	maximum_permits: number;
	site_daily_flow: Record<string, Site_daily_flow>;
	production_lines: ProductionLine[];
	storage_items: StorageItem[];
	overall_platform_condition: number;
	warning_level: number;
}

interface Platform_repair_item {
	ticker: string;
	materialtype: string;
	total_amount: number;
	market_supply: number;
	market_price: number;
	corp_supply: number;
	corp_price: number;
}

interface SelectedSite extends SiteSummary {
	name: string;
	platform_repair_list: Platform_repair_item[];
	siteid: string;
	site_building_tickers: string[];
	site_platform_conditions: number[];
}

interface ApiResponse {
	success: boolean;
	data: Record<string, SiteSummary>;
}

// Workforce Interfaces
interface Needs {
	ticker: string;
	category: string;
	essential: boolean;
	unitsper100: number;
	unitsperinterval: number;
	satisfaction: number;
	currentamount: number;
}

interface Workforce {
	level: string;
	population: number;
	reserve: number;
	capacity: number;
	required: number;
	satisfaction: number;
	needs: Needs[];
}

interface GroupedWorkforceData {
	[siteId: string]: Workforce[];
}

interface ApiResponseWorkforce {
	success: boolean;
	data: GroupedWorkforceData;
}

// --- CONSTANTS ---
const StationExchangeMap: Record<string, string> = {
	"Hortus Station Warehouse": "IC1",
	"Antares Station Warehouse": "AI1",
	"Benten Station Warehouse": "CI1",
	"Hubur Station Warehouse": "NC2",
	"Moria Station Warehouse": "NC1",
	"Arclight Station Warehouse": "CI2",
	"Configure on Execution": "IC1",
};

const LOCAL_STORAGE_KEY = "siteTargetSupplyDays";
const DEFAULT_DAYS = 30;

// --- UTILITIES ---

const formatFlow = (flow: number) => {
	const sign = flow > 0 ? "+" : "";
	return `${sign}${flow.toFixed(2)}`;
};

const formatCurrency = (val: number) => {
	const prefix = "$";
	if (val >= 1000000) return `${prefix}${(val / 1000000).toFixed(2)}M`;
	if (val >= 1000) return `${prefix}${(val / 1000).toFixed(0)}k`;
	return `${prefix}${val.toLocaleString()}`;
};

const getConditionColor = (condition: number, theme: any) => {
	if (condition >= 0.95) return theme.palette.success.main;
	if (condition >= 0.8) return theme.palette.warning.main;
	return theme.palette.error.main;
};

// Compact Orders Logic
const compactOrders = (
	orders: ProductionOrder[],
): { ticker: string; count: number }[] => {
	if (!orders || orders.length === 0) return [];
	const counts: Record<string, number> = {};

	orders.forEach((order) => {
		if (order.production_recipe?.outputs) {
			order.production_recipe.outputs.forEach((out) => {
				counts[out.ticker] = (counts[out.ticker] || 0) + 1;
			});
		} else {
			counts["Unknown"] = (counts["Unknown"] || 0) + 1;
		}
	});

	return Object.entries(counts)
		.map(([ticker, count]) => ({ ticker, count }))
		.sort((a, b) => a.ticker.localeCompare(b.ticker));
};

// Map & Chunk Platforms Logic
interface AlignedPlatformItem {
	building_ticker: string;
	platform_condition: number;
}

const mapAndChunkPlatforms = (tickers: string[], conditions: number[]) => {
	if (!tickers.length) return [];

	const aligned: AlignedPlatformItem[] = tickers.map((t, i) => ({
		building_ticker: t,
		platform_condition: conditions[i] || 0,
	}));

	const grouped = aligned.reduce(
		(acc, item) => {
			(acc[item.building_ticker] = acc[item.building_ticker] || []).push(item);
			return acc;
		},
		{} as Record<string, AlignedPlatformItem[]>,
	);

	return Object.entries(grouped)
		.map(([ticker, items]) => {
			const chunks = [];
			for (let i = 0; i < items.length; i += 5)
				chunks.push(items.slice(i, i + 5));
			return { ticker, chunks, totalCount: items.length };
		})
		.sort((a, b) => a.ticker.localeCompare(b.ticker));
};

// Clipboard Logic
async function copyToClipboard(text: string) {
	if (navigator.clipboard && window.isSecureContext) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {}
	}
	// Fallback
	const ta = document.createElement("textarea");
	ta.value = text;
	ta.style.position = "fixed";
	ta.style.left = "-9999px";
	document.body.appendChild(ta);
	ta.select();
	const success = document.execCommand("copy");
	document.body.removeChild(ta);
	return success;
}

// --- CUSTOM HOOKS ---

const useSiteTargetDays = (siteId: string) => {
	const [targetDaysValue, setTargetDaysValue] = useState<number>(DEFAULT_DAYS);
	const [targetDaysInput, setTargetDaysInput] = useState<string>(
		DEFAULT_DAYS.toString(),
	);

	useEffect(() => {
		if (!siteId) return;
		try {
			const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (stored) {
				const data = JSON.parse(stored);
				if (typeof data[siteId] === "number") {
					setTargetDaysValue(data[siteId]);
					setTargetDaysInput(data[siteId].toString());
				}
			}
		} catch {}
	}, [siteId]);

	const handleChange = (val: string) => {
		setTargetDaysInput(val);
		const parsed = parseInt(val, 10);
		if (!isNaN(parsed) && parsed >= 0) {
			setTargetDaysValue(parsed);
			try {
				const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
				const data = stored ? JSON.parse(stored) : {};
				data[siteId] = parsed;
				localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
			} catch {}
		}
	};

	return {
		targetDaysValue,
		targetDaysInput,
		handleTargetDaysChange: handleChange,
	};
};

// --- SUB-COMPONENTS ---

// 1. Site Card
const SiteCard = React.memo(
	({
		site,
		siteId,
		onSelect,
	}: {
		site: SiteSummary;
		siteId: string;
		onSelect: (s: SiteSummary, id: string) => void;
	}) => {
		const theme = useTheme();
		const { targetDaysValue, targetDaysInput, handleTargetDaysChange } =
			useSiteTargetDays(siteId);

		// Memoize Flow Calculations
		const { positiveFlows, negativeFlows, warningLevel } = useMemo(() => {
			const flows = Object.entries(site.site_daily_flow).sort((a, b) =>
				a[0].localeCompare(b[0]),
			);
			const pos = flows.filter(([, f]) => f.flow > 0);
			const neg = flows.filter(([, f]) => f.flow < 0);

			let lvl = 3;
			neg.forEach(([, f]) => {
				const remaining = f.currentAmount / Math.abs(f.flow);
				if (remaining < targetDaysValue / 5) lvl = Math.min(lvl, 1);
				else if (remaining < targetDaysValue) lvl = Math.min(lvl, 2);
			});

			return { positiveFlows: pos, negativeFlows: neg, warningLevel: lvl };
		}, [site.site_daily_flow, targetDaysValue]);

		// Dynamic Styles based on Status
		const statusColor =
			warningLevel === 1
				? theme.palette.error.main
				: warningLevel === 2
					? theme.palette.warning.main
					: theme.palette.primary.main;
		const conditionColor = getConditionColor(
			site.overall_platform_condition || 0,
			theme,
		);
		const activeOrders = site.production_lines
			? site.production_lines.flatMap((l) => l.queue).length
			: 0;

		return (
			<Paper
				elevation={4}
				onClick={() => onSelect(site, siteId)}
				sx={{
					borderRadius: 2,
					overflow: "hidden",
					border: `1px solid ${alpha(statusColor, 0.5)}`,
					bgcolor: alpha(theme.palette.background.default, 0.7),
					backdropFilter: "blur(8px)",
					transition: "all 0.2s",
					"&:hover": {
						transform: "translateY(-4px)",
						boxShadow: `0 8px 24px -4px ${alpha(statusColor, 0.3)}`,
						borderColor: statusColor,
					},
					display: "flex",
					flexDirection: "column",
					minHeight: 280,
					minWidth: 320, // Fix: Enforce minimum width
				}}
			>
				{/* HEADER */}
				<Box
					sx={{
						p: 1.5,
						borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						bgcolor: alpha(statusColor, 0.08),
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<MapPin style={{ fontSize: 18, color: statusColor }} />
						<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
							{site.planet_name}
						</Typography>
					</Box>
					<Chip
						icon={<Flame size={12} />}
						label={`${(site.overall_platform_condition * 100).toFixed(0)}%`}
						size="small"
						sx={{
							height: 20,
							fontSize: "0.7rem",
							fontWeight: 700,
							bgcolor: alpha(conditionColor, 0.1),
							color: conditionColor,
							border: `1px solid ${alpha(conditionColor, 0.3)}`,
						}}
					/>
				</Box>

				{/* BODY */}
				<Box
					sx={{
						p: 1.5,
						flex: 1,
						display: "flex",
						flexDirection: "column",
						gap: 2,
					}}
				>
					{/* Permits & Config */}
					<Box>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								mb: 0.5,
								alignItems: "center",
							}}
						>
							<Typography
								variant="caption"
								fontWeight={700}
								color="text.secondary"
								sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
							>
								<ArchiveLucide size={12} /> PERMITS
							</Typography>
							<Typography variant="caption" fontWeight={700}>
								{site.invested_permits}/{site.maximum_permits}
							</Typography>
						</Box>
						<LinearProgress
							variant="determinate"
							value={(site.invested_permits / site.maximum_permits) * 100}
							sx={{ height: 4, borderRadius: 2, mb: 1.5 }}
						/>

						{/* Fix: Clean UI for Target Supply Input */}
						<TextField
							label="Target Supply (Days)"
							type="number"
							size="small"
							variant="outlined"
							value={targetDaysInput}
							onChange={(e) => handleTargetDaysChange(e.target.value)}
							onClick={(e) => e.stopPropagation()}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<ClockLucide size={14} />
									</InputAdornment>
								),
							}}
							sx={{
								width: "100%",
								"& .MuiOutlinedInput-root": {
									borderRadius: 1,
									backgroundColor: alpha(theme.palette.background.default, 0.3),
								},
								"& .MuiInputLabel-root": { fontSize: "0.8rem" },
							}}
						/>
					</Box>

					<Divider sx={{ opacity: 0.5 }} />

					{/* Flows Grid */}
					<Box sx={{ display: "flex", gap: 1.5 }}>
						{/* Prod */}
						<Box sx={{ flex: 1, minWidth: 0 }}>
							<Typography
								variant="caption"
								sx={{
									display: "block",
									mb: 0.5,
									color: theme.palette.text.secondary,
									fontWeight: 700,
								}}
							>
								PROD /d
							</Typography>
							{positiveFlows.length > 0 ? (
								positiveFlows.map(([t, f]) => (
									<Box
										key={t}
										sx={{
											display: "flex",
											justifyContent: "space-between",
											fontSize: "0.75rem",
											mb: 0.5,
										}}
									>
										<span style={{ fontWeight: 600 }}>{t}</span>
										<span
											style={{
												color: theme.palette.success.main,
												fontWeight: 700,
											}}
										>
											{formatFlow(f.flow)}
										</span>
									</Box>
								))
							) : (
								<Typography
									variant="caption"
									sx={{ fontStyle: "italic", color: "text.disabled" }}
								>
									None
								</Typography>
							)}
						</Box>

						<Divider orientation="vertical" flexItem />

						{/* Cons - RESTORED RICH UI */}
						<Box sx={{ flex: 1.5, minWidth: 0 }}>
							<Typography
								variant="caption"
								sx={{
									display: "block",
									mb: 0.5,
									color: theme.palette.text.secondary,
									fontWeight: 700,
								}}
							>
								CONS /d
							</Typography>
							{negativeFlows.length > 0 ? (
								negativeFlows.map(([t, f]) => {
									const consumption = Math.abs(f.flow);
									const daysLeft = f.currentAmount / consumption;
									const targetAmount = consumption * targetDaysValue;
									const missingAmount = Math.max(
										0,
										targetAmount - f.currentAmount,
									);

									const daysColor =
										daysLeft < targetDaysValue / 5
											? theme.palette.error.main
											: daysLeft < targetDaysValue
												? theme.palette.warning.main
												: theme.palette.success.main;

									return (
										<Box key={t} sx={{ mb: 0.5 }}>
											{/* Top Row: Ticker | Flow | Days */}
											<Box
												sx={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													fontSize: "0.75rem",
												}}
											>
												<span style={{ fontWeight: 600 }}>{t}</span>
												<Box sx={{ display: "flex", gap: 1 }}>
													<span>{formatFlow(f.flow)}</span>
													<Tooltip
														title={`${daysLeft.toFixed(1)} days remaining`}
													>
														<span
															style={{
																color: daysColor,
																fontWeight: 700,
																cursor: "help",
															}}
														>
															{daysLeft > 999 ? "∞" : daysLeft.toFixed(1)}d
														</span>
													</Tooltip>
												</Box>
											</Box>
											{/* Bottom Row: Need Chip (If Missing) */}
											{missingAmount > 0 && (
												<Box
													sx={{
														display: "flex",
														justifyContent: "flex-end",
														mt: 0.25,
													}}
												>
													<Tooltip
														title={`Need ${missingAmount.toLocaleString()} to reach ${targetDaysValue} days`}
													>
														<Chip
															label={`Need ${missingAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
															size="small"
															color="error"
															sx={{
																height: 16,
																fontSize: "0.65rem",
																fontWeight: 700,
																px: 0.5,
															}}
														/>
													</Tooltip>
												</Box>
											)}
										</Box>
									);
								})
							) : (
								<Typography
									variant="caption"
									sx={{ fontStyle: "italic", color: "text.disabled" }}
								>
									None
								</Typography>
							)}
						</Box>
					</Box>
				</Box>

				{/* Footer */}
				<Box
					sx={{
						px: 1.5,
						py: 1,
						bgcolor: alpha(theme.palette.action.hover, 0.1),
						borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						display: "flex",
						justifyContent: "space-between",
					}}
				>
					<Typography
						variant="caption"
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.5,
							color: theme.palette.text.secondary,
						}}
					>
						<FactoryIcon style={{ fontSize: 14 }} />{" "}
						<b>{site.production_lines.length}</b> Lines
					</Typography>
					{activeOrders > 0 && (
						<Typography
							variant="caption"
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								color: theme.palette.info.main,
							}}
						>
							<ClockLucide size={14} /> <b>{activeOrders}</b> Active
						</Typography>
					)}
				</Box>
			</Paper>
		);
	},
);

// 2. Production Line Item
const ProductionLineItem = ({
	line,
	conditionColor,
}: {
	line: ProductionLine;
	conditionColor: string;
}) => {
	const theme = useTheme();
	const compacted = compactOrders(line.queue);

	return (
		<Paper
			variant="outlined"
			sx={{
				p: 1.5,
				mb: 1.5,
				borderLeft: `4px solid ${conditionColor}`,
				bgcolor: alpha(theme.palette.background.default, 0.4),
			}}
		>
			<Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
				<Typography
					variant="subtitle2"
					fontWeight={800}
					sx={{ display: "flex", alignItems: "center", gap: 1 }}
				>
					{line.type}{" "}
					<span style={{ opacity: 0.5, fontSize: "0.75em" }}>
						#{line.line_id.slice(-4)}
					</span>
				</Typography>
				<Chip
					label={`${(line.efficiency * 100).toFixed(0)}%`}
					size="small"
					sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
				/>
			</Box>

			<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
				{compacted.length > 0 ? (
					compacted.map((co) => (
						<Chip
							key={co.ticker}
							label={`${co.count}x ${co.ticker}`}
							size="small"
							variant="outlined"
							color="primary"
							sx={{ height: 20, fontSize: "0.65rem" }}
						/>
					))
				) : (
					<Typography
						variant="caption"
						color="text.disabled"
						fontStyle="italic"
					>
						Queue Empty
					</Typography>
				)}
			</Box>
		</Paper>
	);
};

// --- MAIN PAGE ---

const ProductionDashboard: React.FC = () => {
	const theme = useTheme();

	// State
	const [data, setData] = useState<Record<string, SiteSummary>>({});
	const [workforce, setWorkforce] = useState<GroupedWorkforceData | null>(null);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	// Selection & Details
	const [selectedSite, setSelectedSite] = useState<SelectedSite | null>(null);
	const [isDetailLoading, setIsDetailLoading] = useState(false);
	const [tabValue, setTabValue] = useState(0);

	// Copy Menu State
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedOrigin, setSelectedOrigin] = useState(
		"Configure on Execution",
	);
	const [snackbar, setSnackbar] = useState<SnackbarState>({
		open: false,
		message: "",
		severity: "info",
	});

	// 1. Fetch Data
	useEffect(() => {
		const load = async () => {
			try {
				const token = localStorage.getItem("authToken");
				const headers = { Authorization: `Bearer ${token}` };

				const [prodRes, workRes] = await Promise.all([
					fetch(`${API_BASE_URL}user_production`, { headers }),
					fetch(`${API_BASE_URL}user_workforce_with_needs`, {
						headers,
					}),
				]);

				const prodJson: ApiResponse = await prodRes.json();
				const workJson: ApiResponseWorkforce = await workRes.json();

				if (prodJson.success) setData(prodJson.data);
				if (workJson.success) setWorkforce(workJson.data);
			} catch (e) {
				console.error("Load error:", e);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	// 2. Efficiently Merge Workforce Data (Memoized)
	const displayData = useMemo(() => {
		if (!workforce || Object.keys(data).length === 0) return data;

		const merged: Record<string, SiteSummary> = {};

		Object.entries(data).forEach(([siteId, site]) => {
			const newSite = { ...site, site_daily_flow: { ...site.site_daily_flow } };
			const wf = workforce[siteId];

			if (wf) {
				wf.forEach((level) => {
					level.needs.forEach((need) => {
						const existing = newSite.site_daily_flow[need.ticker];
						const flowVal = -(need.unitsperinterval || 0);

						if (existing) {
							newSite.site_daily_flow[need.ticker] = {
								flow: existing.flow + flowVal,
								currentAmount: need.currentamount,
							};
						} else {
							newSite.site_daily_flow[need.ticker] = {
								flow: flowVal,
								currentAmount: need.currentamount,
							};
						}
					});
				});
			}
			merged[siteId] = newSite;
		});
		return merged;
	}, [data, workforce]);

	// 3. Filtering
	const filteredSites = useMemo(() => {
		const arr = Object.entries(displayData);
		if (!searchTerm) return arr;
		const lower = searchTerm.toLowerCase();
		return arr.filter(([, s]) => s.planet_name.toLowerCase().includes(lower));
	}, [displayData, searchTerm]);

	// 4. Global Stats
	const globalStats = useMemo(() => {
		let totalSites = 0,
			activeLines = 0,
			warnings = 0;
		Object.values(displayData).forEach((s) => {
			totalSites++;
			if (s.production_lines)
				activeLines += s.production_lines.filter(
					(l) => l.queue.length > 0,
				).length;
			// Rough check for warnings (simplistic)
			if (s.overall_platform_condition < 0.8) warnings++;
		});
		return { totalSites, activeLines, warnings };
	}, [displayData]);

	// 5. Detail Fetching
	const handleSiteSelect = useCallback(
		async (summary: SiteSummary, siteId: string) => {
			const initial: SelectedSite = {
				...summary,
				siteid: siteId,
				name: "",
				site_building_tickers: [],
				site_platform_conditions: [],
				platform_repair_list: [],
			};
			setSelectedSite(initial);
			setIsDetailLoading(true);

			try {
				const res = await fetch(
					`${API_BASE_URL}user_site_platforms/${siteId}`,
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("authToken")}`,
						},
					},
				);
				if (res.ok) {
					const details: SelectedSite = await res.json();
					setSelectedSite((prev) => (prev ? { ...prev, ...details } : null));
				}
			} catch (e) {
				console.error("Detail fetch failed", e);
			} finally {
				setIsDetailLoading(false);
			}
		},
		[],
	);

	// 6. Copy Actions
	const handleCopy = (mode: "transfer" | "buy") => {
		setAnchorEl(null);
		if (!selectedSite?.platform_repair_list?.length) return;

		const materials: Record<string, number> = {};
		selectedSite.platform_repair_list.forEach(
			(i) => (materials[i.ticker] = i.total_amount),
		);

		const action =
			mode === "transfer"
				? {
						type: "MTRA",
						name: "Repair Transfer",
						group: "A1",
						origin: selectedOrigin,
						dest: "Configure on Execution",
					}
				: {
						type: "CX Buy",
						name: "Repair Buy",
						group: "A1",
						origin: selectedOrigin,
						exchange: StationExchangeMap[selectedOrigin] || "IC1",
						priceLimits: {},
						buyPartial: false,
						useCXInv: true,
					};

		const xit = {
			actions: [action],
			global: { name: `${selectedSite.planet_name} Repair` },
			groups: [{ type: "Manual", name: "A1", materials }],
		};

		copyToClipboard(JSON.stringify(xit)).then((ok) => {
			setSnackbar({
				open: true,
				message: ok ? "XIT Copied!" : "Copy failed",
				severity: ok ? "success" : "error",
			});
		});
	};

	const chunkedPlatforms = useMemo(() => {
		if (!selectedSite?.site_building_tickers) return [];
		return mapAndChunkPlatforms(
			selectedSite.site_building_tickers,
			selectedSite.site_platform_conditions || [],
		);
	}, [selectedSite]);

	if (loading)
		return (
			<Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
				<CircularProgress />
			</Box>
		);

	return (
		<Box
			sx={{
				height: "100vh",
				display: "flex",
				flexDirection: "column",
				bgcolor: theme.palette.background.default,
				overflow: "hidden",
			}}
		>
			{/* HEADER */}
			<Paper
				square
				elevation={4}
				sx={{
					zIndex: 20,
					bgcolor: theme.palette.background.default,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Box
					sx={{
						px: 2,
						py: 1.5,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 2,
						flexWrap: "wrap",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<FactoryIcon color="primary" />
						<Typography
							variant="h6"
							fontWeight={900}
							sx={{ letterSpacing: -0.5 }}
						>
							PRODUCTION
						</Typography>
					</Box>

					<Stack
						direction="row"
						spacing={3}
						divider={
							<Divider
								orientation="vertical"
								flexItem
								sx={{ height: 16, alignSelf: "center" }}
							/>
						}
					>
						<Box sx={{ textAlign: "center" }}>
							<Typography
								variant="caption"
								sx={{
									display: "block",
									fontWeight: 700,
									color: "text.secondary",
								}}
							>
								SITES
							</Typography>
							<Typography variant="body2" fontWeight={800}>
								{globalStats.totalSites}
							</Typography>
						</Box>
						<Box sx={{ textAlign: "center" }}>
							<Typography
								variant="caption"
								sx={{
									display: "block",
									fontWeight: 700,
									color: "text.secondary",
								}}
							>
								ACTIVE LINES
							</Typography>
							<Typography variant="body2" fontWeight={800} color="primary">
								{globalStats.activeLines}
							</Typography>
						</Box>
						<Box sx={{ textAlign: "center" }}>
							<Typography
								variant="caption"
								sx={{
									display: "block",
									fontWeight: 700,
									color: "text.secondary",
								}}
							>
								ALERTS
							</Typography>
							<Typography
								variant="body2"
								fontWeight={800}
								color={globalStats.warnings > 0 ? "error" : "success"}
							>
								{globalStats.warnings}
							</Typography>
						</Box>
					</Stack>

					<TextField
						size="small"
						placeholder="Search..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Search fontSize="small" />
								</InputAdornment>
							),
						}}
						sx={{
							width: 220,
							"& .MuiOutlinedInput-root": {
								fontSize: "0.85rem",
								borderRadius: 1.5,
							},
						}}
					/>
				</Box>
			</Paper>

			{/* MASONRY GRID */}
			<Box
				sx={{
					flex: 1,
					overflowY: "auto",
					p: 3,
					bgcolor: theme.palette.background.default,
				}}
			>
				<Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={2}>
					{filteredSites.map(([id, site]) => (
						<SiteCard
							key={id}
							siteId={id}
							site={site}
							onSelect={handleSiteSelect}
						/>
					))}
				</Masonry>
			</Box>

			{/* DETAILS DRAWER */}
			<Drawer
				anchor="right"
				open={!!selectedSite}
				onClose={() => setSelectedSite(null)}
				PaperProps={{
					sx: {
						width: { xs: "100%", md: 600 },
						bgcolor: "background.default",
						backgroundImage: "none",
						borderLeft: `1px solid ${theme.palette.divider}`,
					},
				}}
			>
				{selectedSite && (
					<Box
						sx={{ display: "flex", flexDirection: "column", height: "100%" }}
					>
						{/* Drawer Header */}
						<Box
							sx={{
								p: 3,
								borderBottom: `1px solid ${theme.palette.divider}`,
								bgcolor: alpha(theme.palette.background.default, 0.5),
							}}
						>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "flex-start",
									mb: 2,
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
									<MapPin
										style={{ fontSize: 32, color: theme.palette.primary.main }}
									/>
									<Box>
										<Typography
											variant="h5"
											fontWeight={800}
											sx={{ lineHeight: 1 }}
										>
											{selectedSite.planet_name}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{selectedSite.area} m² •{" "}
											{selectedSite.site_building_tickers?.length || 0}{" "}
											Platforms
										</Typography>
									</Box>
								</Box>
								<IconButton onClick={() => setSelectedSite(null)}>
									<FilterList />
								</IconButton>
							</Box>

							{/* Drawer Quick Stats */}
							<Grid container spacing={2}>
								<Grid item xs={6}>
									<Paper
										variant="outlined"
										sx={{
											p: 1,
											bgcolor: alpha(theme.palette.action.hover, 0.1),
										}}
									>
										<Typography
											variant="caption"
											fontWeight={700}
											color="text.secondary"
										>
											PERMITS
										</Typography>
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											<Archive fontSize="small" />
											<Typography fontWeight={700}>
												{selectedSite.invested_permits} /{" "}
												{selectedSite.maximum_permits}
											</Typography>
										</Box>
									</Paper>
								</Grid>
								<Grid item xs={6}>
									<Paper
										variant="outlined"
										sx={{
											p: 1,
											bgcolor: alpha(theme.palette.action.hover, 0.1),
										}}
									>
										<Typography
											variant="caption"
											fontWeight={700}
											color="text.secondary"
										>
											HEALTH
										</Typography>
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											<Flame
												fontSize="small"
												color={
													getConditionColor(
														selectedSite.overall_platform_condition || 1,
														theme,
													) as any
												}
											/>
											<Typography fontWeight={700}>
												{(
													selectedSite.overall_platform_condition * 100
												).toFixed(1)}
												%
											</Typography>
										</Box>
									</Paper>
								</Grid>
							</Grid>
						</Box>

						{/* Tabs */}
						<Tabs
							value={tabValue}
							onChange={(_, v) => setTabValue(v)}
							variant="fullWidth"
							sx={{
								borderBottom: 1,
								borderColor: "divider",
								bgcolor: "background.default",
							}}
						>
							<Tab label="Flows" />
							<Tab label="Infrastructure" />
							<Tab
								label={`Production (${selectedSite.production_lines.length})`}
							/>
						</Tabs>

						{/* Content */}
						<Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
							{/* TAB 0: FLOWS */}
							{tabValue === 0 && (
								<ConsumptionFlowDetail
									site={selectedSite}
									targetDaysValue={(() => {
										try {
											const s = localStorage.getItem(LOCAL_STORAGE_KEY);
											return s ? JSON.parse(s)[selectedSite.siteid] || 30 : 30;
										} catch {
											return 30;
										}
									})()}
									formatAmount={formatFlow}
									setSnackbar={setSnackbar}
								/>
							)}

							{/* TAB 1: INFRASTRUCTURE */}
							{tabValue === 1 && (
								<Stack spacing={3}>
									{/* Platform Conditions */}
									<Paper variant="outlined" sx={{ p: 2 }}>
										<Typography
											variant="subtitle2"
											fontWeight={700}
											sx={{ mb: 2 }}
										>
											PLATFORM HEALTH
										</Typography>
										{chunkedPlatforms.length > 0 ? (
											<Grid container spacing={2}>
												{chunkedPlatforms.map(({ ticker, chunks }) =>
													chunks.map((chunk, i) => (
														<Grid item xs={6} key={`${ticker}-${i}`}>
															<Typography
																variant="caption"
																fontWeight={800}
																color="primary"
																sx={{ mb: 0.5, display: "block" }}
															>
																{ticker}
															</Typography>
															{chunk.map((p, idx) => (
																<Box key={idx} sx={{ mb: 1 }}>
																	<Box
																		sx={{
																			display: "flex",
																			justifyContent: "space-between",
																		}}
																	>
																		<Typography
																			variant="caption"
																			color="text.secondary"
																		>
																			{p.building_ticker}
																		</Typography>
																		<Typography
																			variant="caption"
																			fontWeight={700}
																		>
																			{(p.platform_condition * 100).toFixed(0)}%
																		</Typography>
																	</Box>
																	<LinearProgress
																		variant="determinate"
																		value={p.platform_condition * 100}
																		color={
																			getConditionColor(
																				p.platform_condition,
																				theme,
																			) as any
																		}
																		sx={{ height: 4, borderRadius: 2 }}
																	/>
																</Box>
															))}
														</Grid>
													)),
												)}
											</Grid>
										) : (
											<Typography variant="caption" fontStyle="italic">
												No data available.
											</Typography>
										)}
									</Paper>

									{/* Repair Materials */}
									<Paper variant="outlined" sx={{ p: 0, overflow: "hidden" }}>
										<Box
											sx={{
												p: 2,
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												bgcolor: alpha(theme.palette.warning.main, 0.05),
											}}
										>
											<Typography
												variant="subtitle2"
												fontWeight={700}
												color="warning.main"
											>
												REPAIR COSTS
											</Typography>
											<Button
												size="small"
												variant="outlined"
												color="warning"
												startIcon={<ContentCopyIcon />}
												onClick={(e) => setAnchorEl(e.currentTarget)}
											>
												Create XIT
											</Button>
										</Box>

										<Menu
											anchorEl={anchorEl}
											open={Boolean(anchorEl)}
											onClose={() => setAnchorEl(null)}
										>
											<Box sx={{ p: 2, minWidth: 200 }}>
												<FormControl fullWidth size="small" sx={{ mb: 2 }}>
													<InputLabel>Origin</InputLabel>
													<Select
														value={selectedOrigin}
														label="Origin"
														onChange={(e) => setSelectedOrigin(e.target.value)}
													>
														{Object.keys(StationExchangeMap).map((k) => (
															<MenuItem key={k} value={k}>
																{k}
															</MenuItem>
														))}
													</Select>
												</FormControl>
												<Button
													fullWidth
													onClick={() => handleCopy("transfer")}
													sx={{ mb: 1 }}
												>
													Copy Transfer
												</Button>
												<Button fullWidth onClick={() => handleCopy("buy")}>
													Copy CX Buy
												</Button>
											</Box>
										</Menu>

										{selectedSite.platform_repair_list.length > 0 ? (
											<List dense disablePadding>
												{selectedSite.platform_repair_list.map((item, i) => (
													<ListItem
														key={i}
														divider={
															i < selectedSite.platform_repair_list.length - 1
														}
														sx={{
															display: "flex",
															justifyContent: "space-between",
														}}
													>
														<Box>
															<Typography variant="body2" fontWeight={600}>
																{item.ticker}
															</Typography>
															<Typography
																variant="caption"
																color="text.secondary"
															>
																Amt: {item.total_amount.toLocaleString()}
															</Typography>
														</Box>
														<Box sx={{ textAlign: "right" }}>
															<Typography variant="body2" fontWeight={600}>
																{formatCurrency(item.market_price)}
															</Typography>
															<Typography
																variant="caption"
																color="text.secondary"
															>
																Global Supply: {item.market_supply}
															</Typography>
														</Box>
													</ListItem>
												))}
											</List>
										) : (
											<Box sx={{ p: 3, textAlign: "center" }}>
												<CheckCircle color="success" sx={{ mb: 1 }} />
												<Typography variant="body2">
													No repairs needed.
												</Typography>
											</Box>
										)}
									</Paper>
								</Stack>
							)}

							{/* TAB 2: PRODUCTION */}
							{tabValue === 2 &&
								(isDetailLoading ? (
									<CircularProgress
										sx={{ display: "block", mx: "auto", mt: 4 }}
									/>
								) : (
									<Box>
										{selectedSite.production_lines.length > 0 ? (
											selectedSite.production_lines.map((line) => (
												<ProductionLineItem
													key={line.line_id}
													line={line}
													conditionColor={getConditionColor(
														selectedSite.overall_platform_condition || 1,
														theme,
													)}
												/>
											))
										) : (
											<Typography
												align="center"
												color="text.secondary"
												sx={{ mt: 4 }}
											>
												No production lines configured.
											</Typography>
										)}
									</Box>
								))}
						</Box>
					</Box>
				)}
			</Drawer>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
			>
				<Alert severity={snackbar.severity as AlertColor} variant="filled">
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default ProductionDashboard;
