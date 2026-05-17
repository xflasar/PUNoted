import { API_BASE_URL } from "../../config/api";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
	Box,
	Typography,
	CircularProgress,
	Paper,
	TextField,
	InputAdornment,
	Drawer,
	useTheme,
	alpha,
	Divider,
	Collapse,
	Button,
	ToggleButtonGroup,
	ToggleButton,
	Autocomplete,
	Chip,
} from "@mui/material";
import { Masonry } from "@mui/lab";
import {
	Search,
	Factory,
	ChevronDown,
	ChevronUp,
	Globe,
	Handshake,
} from "lucide-react";

import { ProductionCard } from "./ProductionCard";
import type {
	SiteSummary,
	ApiResponse,
	ApiResponseWorkforce,
	GroupedWorkforceData,
	FlowData,
	SiteWithFlows,
} from "./types";
import { SiteDrawerContent } from "./components/SiteDrawerContent";

const LOCAL_STORAGE_KEY = "siteTargetSupplyDays";
const DEFAULT_DAYS = 30;

const ProductionDashboard: React.FC = () => {
	const theme = useTheme();

	// --- STATE ---
	const [data, setData] = useState<Record<string, SiteSummary>>({});
	const [workforce, setWorkforce] = useState<GroupedWorkforceData | null>(null);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedSite, setSelectedSite] = useState<SiteWithFlows | null>(null);
	const [siteTargets, setSiteTargets] = useState<Record<string, number>>({});
	const [summaryOpen, setSummaryOpen] = useState(false);

	// --- FILTER STATE ---
	const [leaseFilter, setLeaseFilter] = useState<"all" | "owned" | "leased">(
		"all",
	);
	const [selectedTenants, setSelectedTenants] = useState<string[]>([]);

	// --- LOAD DATA ---
	useEffect(() => {
		const fetchData = async () => {
			try {
				const token = localStorage.getItem("authToken");
				const headers = { Authorization: `Bearer ${token}` };
				const [prodRes, workRes] = await Promise.all([
					fetch(
						`${API_BASE_URL}internal/production/user_production`,
						{
							headers,
						},
					),
					fetch(`${API_BASE_URL}user_workforce_with_needs`, {
						headers,
					}),
				]);
				const prodJson: ApiResponse = await prodRes.json();
				const workJson: ApiResponseWorkforce = await workRes.json();
				if (prodJson.success) setData(prodJson.data);
				if (workJson.success) setWorkforce(workJson.data);

				try {
					const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
					if (stored) setSiteTargets(JSON.parse(stored));
				} catch {}
			} catch (e) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	// --- PROCESSING ---
	const processedSites = useMemo(() => {
		if (Object.keys(data).length === 0) return [];

		return Object.entries(data).map(([siteId, site]) => {
			const richFlows: Record<string, FlowData> = {};

			Object.entries(site.site_daily_flow).forEach(([ticker, val]) => {
				richFlows[ticker] = {
					ticker,
					flow: val.flow,
					baseFlow: val.flow,
					workforceFlow: 0,
					currentAmount: val.currentAmount,
					daysRemaining: 0,
					missing: 0,
					isProduction: val.flow > 0,
				};
			});

			const siteWorkforce = workforce ? workforce[siteId] : null;
			if (siteWorkforce) {
				siteWorkforce.forEach((level) => {
					level.needs.forEach((need) => {
						if (!richFlows[need.ticker]) {
							richFlows[need.ticker] = {
								ticker: need.ticker,
								flow: 0,
								baseFlow: 0,
								workforceFlow: 0,
								currentAmount: need.currentamount,
								daysRemaining: 0,
								missing: 0,
								isProduction: false,
							};
						}
						const consumption = -(need.unitsperinterval || 0);
						richFlows[need.ticker].workforceFlow += consumption;
						richFlows[need.ticker].flow += consumption;
					});
				});
			}

			// NO MORE MOCKING. The backend now passes `isLeased` and `tenant` natively!
			return { site: { ...site, siteid: siteId }, richFlows };
		});
	}, [data, workforce]);

	// Extract unique tenants for the filter dropdown
	const availableTenants = useMemo(() => {
		const tenants = new Set<string>();
		processedSites.forEach((s) => {
			if (s.site.tenant) tenants.add(s.site.tenant);
		});
		return Array.from(tenants).sort();
	}, [processedSites]);

	// --- GLOBAL SUMMARY ---
	const globalSummary = useMemo(() => {
		const summary: Record<string, { prod: number; cons: number; net: number }> =
			{};
		processedSites.forEach(({ richFlows }) => {
			Object.values(richFlows).forEach((f) => {
				if (!summary[f.ticker])
					summary[f.ticker] = { prod: 0, cons: 0, net: 0 };
				if (f.flow > 0) summary[f.ticker].prod += f.flow;
				else summary[f.ticker].cons += f.flow;
				summary[f.ticker].net += f.flow;
			});
		});
		return Object.entries(summary)
			.filter(([_, s]) => Math.abs(s.net) > 0.1)
			.sort((a, b) => a[1].net - b[1].net);
	}, [processedSites]);

	// --- FILTERING ---
	const filteredSites = useMemo(() => {
		let result = processedSites;

		// 1. Lease Filter
		if (leaseFilter === "owned") {
			result = result.filter((s) => !s.site.isLeased);
		} else if (leaseFilter === "leased") {
			result = result.filter((s) => s.site.isLeased);
			if (selectedTenants.length > 0) {
				result = result.filter(
					(s) => s.site.tenant && selectedTenants.includes(s.site.tenant),
				);
			}
		}

		// 2. Search Filter
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			result = result.filter(
				({ site }) =>
					site.planet_name.toLowerCase().includes(term) ||
					(site.tenant && site.tenant.toLowerCase().includes(term)),
			);
		}

		return result;
	}, [processedSites, searchTerm, leaseFilter, selectedTenants]);

	const handleTargetChange = useCallback((siteId: string, val: string) => {
		const num = parseInt(val, 10);
		if (!isNaN(num) && num >= 0) {
			setSiteTargets((prev) => {
				const next = { ...prev, [siteId]: num };
				localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
				return next;
			});
		}
	}, []);

	const handleSelectSite = useCallback(
		(siteId: string) => {
			setSelectedSite(
				processedSites.find(({ site }) => site.siteid === siteId) || null,
			);
		},
		[processedSites],
	);

	// --- RENDERING ---

	if (loading)
		return (
			<Box
				sx={{
					height: "100vh",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<CircularProgress color="primary" />
			</Box>
		);

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100vh",
				bgcolor: theme.palette.background.default,
				overflow: "hidden",
			}}
		>
			{/* HEADER */}
			<Paper
				elevation={0}
				sx={{
					zIndex: 10,
					borderBottom: `1px solid ${theme.palette.divider}`,
					bgcolor: alpha(theme.palette.background.default, 0.8),
					backdropFilter: "blur(10px)",
				}}
			>
				<Box
					sx={{
						px: 3,
						py: 2,
						display: "flex",
						flexDirection: "column",
						gap: 2,
					}}
				>
					{/* Top Row: Title & Stats */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							flexWrap: "wrap",
							gap: 2,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Factory color={theme.palette.primary.main} size={28} />
								<Typography
									variant="h5"
									fontWeight={800}
									sx={{ letterSpacing: -0.5 }}
								>
									PRODUCTION
								</Typography>
							</Box>

							<Button
								onClick={() => setSummaryOpen(!summaryOpen)}
								variant={summaryOpen ? "tonal" : "text"}
								startIcon={<Globe size={18} />}
								endIcon={
									summaryOpen ? (
										<ChevronUp size={18} />
									) : (
										<ChevronDown size={18} />
									)
								}
								sx={{ fontWeight: 700, color: "text.primary", borderRadius: 2 }}
							>
								GLOBAL SUMMARY
							</Button>

							<Divider
								orientation="vertical"
								flexItem
								sx={{ height: 24, alignSelf: "center" }}
							/>

							<Typography
								variant="body2"
								color="text.secondary"
								fontWeight={600}
							>
								{filteredSites.length} Sites &nbsp;•&nbsp;{" "}
								{filteredSites.reduce(
									(acc, s) => acc + s.site.production_lines.length,
									0,
								)}{" "}
								Lines
							</Typography>
						</Box>

						{/* Bottom Row / Right Side: Filters */}
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 2,
								flexWrap: "wrap",
							}}
						>
							<ToggleButtonGroup
								size="small"
								value={leaseFilter}
								exclusive
								onChange={(_, newVal) => {
									if (newVal !== null) {
										setLeaseFilter(newVal);
										if (newVal !== "leased") setSelectedTenants([]); // Clear tenants if not looking at leased
									}
								}}
								sx={{
									height: 36,
									bgcolor: alpha(theme.palette.background.default, 0.5),
								}}
							>
								<ToggleButton
									value="all"
									sx={{ px: 2, fontWeight: 600, fontSize: "0.75rem" }}
								>
									All
								</ToggleButton>
								<ToggleButton
									value="owned"
									sx={{ px: 2, fontWeight: 600, fontSize: "0.75rem" }}
								>
									Owned
								</ToggleButton>
								<ToggleButton
									value="leased"
									sx={{ px: 2, fontWeight: 600, fontSize: "0.75rem", gap: 1 }}
								>
									<Handshake size={14} /> Loaned
								</ToggleButton>
							</ToggleButtonGroup>

							{leaseFilter === "leased" && (
								<Autocomplete
									multiple
									limitTags={2}
									size="small"
									options={availableTenants}
									value={selectedTenants}
									onChange={(_, newValue) => setSelectedTenants(newValue)}
									renderInput={(params) => (
										<TextField
											{...params}
											placeholder="Filter Tenants..."
											sx={{
												minWidth: 200,
												"& .MuiOutlinedInput-root": { borderRadius: 2 },
											}}
										/>
									)}
								/>
							)}

							<TextField
								size="small"
								placeholder="Search planets..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<Search size={18} />
										</InputAdornment>
									),
								}}
								sx={{
									width: 250,
									"& .MuiOutlinedInput-root": { borderRadius: 2 },
								}}
							/>
						</Box>
					</Box>
				</Box>

				{/* COLLAPSIBLE SUMMARY (REWORKED) */}
				<Collapse in={summaryOpen}>
					<Box
						sx={{
							p: 2,
							borderTop: `1px solid ${theme.palette.divider}`,
							bgcolor: alpha(theme.palette.background.default, 0.95),
							maxHeight: "40vh",
							overflowY: "auto",
						}}
					>
						<Typography
							variant="overline"
							fontWeight={800}
							color="text.secondary"
							sx={{ mb: 1.5, display: "block", lineHeight: 1 }}
						>
							AGGREGATED FLOWS / DAY
						</Typography>

						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
								gap: 1,
							}}
						>
							{globalSummary.map(([ticker, s]) => {
								const isDeficit = s.net < 0;
								return (
									<Paper
										key={ticker}
										variant="outlined"
										sx={{
											p: 1,
											display: "flex",
											flexDirection: "column",
											gap: 0.5,
											borderColor: isDeficit
												? alpha(theme.palette.error.main, 0.3)
												: "divider",
											bgcolor: isDeficit
												? alpha(theme.palette.error.main, 0.04)
												: "transparent",
											position: "relative",
											transition: "all 0.1s",
											"&:hover": {
												borderColor: isDeficit ? "error.main" : "text.disabled",
											},
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
												fontWeight={800}
												color="text.primary"
												fontSize="0.8rem"
											>
												{ticker}
											</Typography>
											<Typography
												variant="caption"
												fontWeight={800}
												color={isDeficit ? "error.main" : "success.main"}
												fontSize="0.8rem"
											>
												{s.net > 0 ? "+" : ""}
												{s.net.toFixed(1)}
											</Typography>
										</Box>
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												opacity: 0.8,
											}}
										>
											<Typography
												variant="caption"
												sx={{
													fontSize: "0.7rem",
													color: "success.main",
													fontWeight: 600,
												}}
											>
												P: {s.prod.toFixed(1)}
											</Typography>
											<Typography
												variant="caption"
												sx={{
													fontSize: "0.7rem",
													color: "warning.main",
													fontWeight: 600,
												}}
											>
												C: {s.cons.toFixed(1)}
											</Typography>
										</Box>
									</Paper>
								);
							})}
						</Box>
					</Box>
				</Collapse>
			</Paper>

			{/* --- MAIN CONTENT --- */}
			<Box
				sx={{
					flex: 1,
					overflowY: "auto",
					p: 3,
					width: "100%",
					overflowX: "hidden",
				}}
			>
				<Masonry columns={{ xs: 1, sm: 1, md: 2, lg: 3, xl: 4 }} spacing={2}>
					{filteredSites.map(({ site, richFlows }) => (
						<ProductionCard
							key={site.siteid || site.planet_name}
							siteId={site.siteid || ""}
							site={site}
							richFlows={richFlows}
							targetDays={siteTargets[site.siteid || ""] || DEFAULT_DAYS}
							onTargetDaysChange={(val) =>
								handleTargetChange(site.siteid || "", val)
							}
							onSelect={(s) => handleSelectSite(s)}
						/>
					))}
				</Masonry>
			</Box>

			{/* --- DRAWER --- */}
			<Drawer
				anchor="right"
				open={!!selectedSite}
				onClose={() => setSelectedSite(null)}
				PaperProps={{
					sx: {
						width: { xs: "100%", md: 600 },
						bgcolor: "background.default",
						borderLeft: `1px solid ${theme.palette.divider}`,
						backgroundImage: "none",
					},
				}}
			>
				{selectedSite && (
					<SiteDrawerContent
						siteFlow={selectedSite}
						globalTargetDays={
							siteTargets[selectedSite.siteid || ""] || DEFAULT_DAYS
						}
						onClose={() => setSelectedSite(null)}
					/>
				)}
			</Drawer>
		</Box>
	);
};

export default ProductionDashboard;
