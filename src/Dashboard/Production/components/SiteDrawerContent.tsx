import React, { useEffect, useState, useMemo } from "react";
import {
	Box,
	Typography,
	Paper,
	IconButton,
	Grid,
	useTheme,
	alpha,
	Divider,
	Stack,
	Snackbar,
	Tabs,
	Tab,
	Button,
	Chip,
	CircularProgress,
	Checkbox,
	TextField,
	Alert,
} from "@mui/material";
import {
	Factory,
	ArrowRight,
	ArrowDown,
	X,
	Globe,
	Cpu,
	Activity,
	Zap,
	Wrench,
	Copy,
	AlertTriangle,
	Layers,
	Calculator,
	CheckSquare,
	Square,
} from "lucide-react";
import type { SiteSummary } from "../types";

// --- HELPERS ---
const copyToClipboard = (text: string) => {
	if (navigator.clipboard && window.isSecureContext) {
		navigator.clipboard.writeText(text);
	} else {
		const ta = document.createElement("textarea");
		ta.value = text;
		ta.style.position = "fixed";
		ta.style.left = "-9999px";
		document.body.appendChild(ta);
		ta.select();
		document.execCommand("copy");
		document.body.removeChild(ta);
	}
};

const formatNumber = (val: number) =>
	val >= 1000
		? `${(val / 1000).toFixed(1)}k`
		: val.toLocaleString(undefined, { maximumFractionDigits: 0 });

const smartFormat = (val: number) => {
	if (val >= 1000000) {
		return {
			text: `${(val / 1000000).toFixed(1)}M`,
			full: val.toLocaleString("en-US", { maximumFractionDigits: 0 }),
			isAbbreviated: true,
		};
	}
	return {
		text: val.toLocaleString("en-US", { maximumFractionDigits: 0 }),
		full: "",
		isAbbreviated: false,
	};
};

// --- SUB-COMPONENT: REPAIR ROW ---
const RepairRow = ({
	label,
	value,
	ticker,
}: {
	label: string;
	value: string;
	ticker?: string;
}) => (
	<Box
		sx={{
			display: "flex",
			justifyContent: "space-between",
			fontSize: "0.85rem",
			py: 0.5,
			borderBottom: "1px dashed rgba(255,255,255,0.1)",
		}}
	>
		<Typography color="text.secondary">{label}</Typography>
		<Typography fontWeight={600} color="text.primary">
			{value}{" "}
			{ticker && (
				<Typography component="span" fontSize="0.75rem" color="text.secondary">
					{ticker}
				</Typography>
			)}
		</Typography>
	</Box>
);

// --- MAIN COMPONENT ---
export const SiteDrawerContent = ({
	siteFlow,
	globalTargetDays,
	onClose,
}: {
	siteFlow?: SiteSummary;
	globalTargetDays: number;
	onClose: () => void;
}) => {
	const theme = useTheme();
	const [tabValue, setTabValue] = useState(0);

	// Infrastructure State
	const [platforms, setPlatforms] = useState<any[]>([]);
	const [repairs, setRepairs] = useState<any[]>([]);
	const [loadingDetails, setLoadingDetails] = useState(false);

	// Logistics State
	const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(
		new Set(),
	);
	const [materialTargets, setMaterialTargets] = useState<
		Record<string, number>
	>({});

	// UI State
	const [snackbar, setSnackbar] = useState({ open: false, message: "" });

	const richFlows = siteFlow?.richFlows || {};
	const site = siteFlow?.site;

	// 1. Initialize Logistics Data (Load from LS + Set Defaults)
	useEffect(() => {
		if (!site?.siteid) return;
		// Load saved targets
		try {
			const saved = localStorage.getItem(`site_logistics_${site.siteid}`);
			if (saved) {
				const parsed = JSON.parse(saved);
				setMaterialTargets(parsed);
			}
		} catch {}

		// Initialize selections (Select all deficits by default)
		const initialSelection = new Set<string>();
		Object.entries(richFlows).forEach(([ticker, data]: [string, any]) => {
			if (data.flow < 0 && !data.isProduction) initialSelection.add(ticker);
		});
		setSelectedMaterials(initialSelection);
	}, [site?.siteid, richFlows]);

	// 2. Fetch Deep Platform Details (On Mount)
	useEffect(() => {
		const fetchDetails = async () => {
			if (!site?.siteid) return;
			setLoadingDetails(true);
			try {
				const res = await fetch(
					`https://api.punoted.net/user_site_platforms/${site.siteid}`,
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("authToken")}`,
						},
					},
				);
				const json = await res.json();
				if (json) {
					setRepairs(json.platform_repair_list || []);
					const buildings =
						json.site_building_tickers?.map((t: string, i: number) => ({
							ticker: t,
							condition: json.site_platform_conditions?.[i] || 0,
						})) || [];
					setPlatforms(buildings);
				}
			} catch (e) {
				console.error("Failed to fetch platform details", e);
			} finally {
				setLoadingDetails(false);
			}
		};
		fetchDetails();
	}, [site?.siteid]);

	// --- CALCULATIONS ---
	const avgEff = useMemo(() => {
		if (!site?.production_lines?.length) return 0;
		return (
			site.production_lines.reduce(
				(acc: number, l: any) => acc + l.efficiency,
				0,
			) / site.production_lines.length
		);
	}, [site]);

	const logisticsRows = useMemo(() => {
		return Object.entries(richFlows)
			.filter(([_, data]: [string, any]) => data.flow < 0) // Only Consumption
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([ticker, data]: [string, any]) => {
				const dailyBurn = Math.abs(data.flow);
				const target = materialTargets[ticker] ?? globalTargetDays;
				const required = dailyBurn * target;
				const missing = Math.max(0, required - data.currentAmount);
				return {
					ticker,
					dailyBurn,
					current: data.currentAmount,
					target,
					missing,
				};
			});
	}, [richFlows, materialTargets, globalTargetDays]);

	// --- HANDLERS ---

	const handleTargetChange = (ticker: string, val: string) => {
		const num = parseInt(val);
		if (!isNaN(num) && num >= 0) {
			const newTargets = { ...materialTargets, [ticker]: num };
			setMaterialTargets(newTargets);
			localStorage.setItem(
				`site_logistics_${site.siteid}`,
				JSON.stringify(newTargets),
			);
		}
	};

	const toggleMaterial = (ticker: string) => {
		const next = new Set(selectedMaterials);
		if (next.has(ticker)) next.delete(ticker);
		else next.add(ticker);
		setSelectedMaterials(next);
	};

	const toggleAllLogistics = () => {
		if (selectedMaterials.size === logisticsRows.length)
			setSelectedMaterials(new Set());
		else setSelectedMaterials(new Set(logisticsRows.map((r) => r.ticker)));
	};

	const handleCopyLogistics = () => {
		const materials: Record<string, number> = {};
		logisticsRows.forEach((row) => {
			if (selectedMaterials.has(row.ticker) && row.missing > 0) {
				materials[row.ticker] = Math.ceil(row.missing);
			}
		});

		if (Object.keys(materials).length === 0) {
			setSnackbar({
				open: true,
				message: "No materials selected or no deficit found.",
			});
			return;
		}

		const xit = {
			actions: [
				{
					type: "CX Buy",
					name: "Supply Buy",
					group: "S1",
					origin: "Configure on Execution",
					exchange: "IC1",
					priceLimits: {},
					buyPartial: false,
					useCXInv: true,
				},
			],
			global: { name: `${site.planet_name} Supply` },
			groups: [{ type: "Manual", name: "S1", materials }],
		};

		copyToClipboard(JSON.stringify(xit));
		setSnackbar({ open: true, message: "Supply XIT Copied!" });
	};

	const handleCopyRepairs = (mode: "transfer" | "buy") => {
		if (!repairs.length) return;
		const materials: Record<string, number> = {};
		repairs.forEach((r) => (materials[r.ticker] = r.total_amount));

		const action =
			mode === "transfer"
				? {
						type: "MTRA",
						name: "Repair Transfer",
						group: "A1",
						origin: "Configure on Execution",
						dest: "Configure on Execution",
					}
				: {
						type: "CX Buy",
						name: "Repair Buy",
						group: "A1",
						origin: "Configure on Execution",
						exchange: "IC1",
						priceLimits: {},
						buyPartial: false,
						useCXInv: true,
					};

		const xit = {
			actions: [action],
			global: { name: `${site.planet_name} Repair` },
			groups: [{ type: "Manual", name: "A1", materials }],
		};
		copyToClipboard(JSON.stringify(xit));
		setSnackbar({
			open: true,
			message: `Copied ${mode === "transfer" ? "MTRA" : "CX Buy"} XIT`,
		});
	};

	if (!site) return null;

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				bgcolor: "background.default",
			}}
		>
			{/* 1. STICKY HEADER */}
			<Paper
				square
				elevation={4}
				sx={{
					p: { xs: 2, sm: 3 }, // Responsive padding
					borderBottom: `1px solid ${theme.palette.divider}`,
					bgcolor: alpha(theme.palette.background.default, 0.95),
					backdropFilter: "blur(10px)",
					zIndex: 10,
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
					<Box>
						<Typography
							variant="overline"
							color="text.secondary"
							fontWeight={700}
							letterSpacing={1}
						>
							PLANET COMMAND
						</Typography>
						<Typography
							variant="h5"
							fontWeight={900}
							sx={{ letterSpacing: -0.5, lineHeight: 1 }}
						>
							{site.planet_name}
						</Typography>
					</Box>
					<IconButton
						onClick={onClose}
						sx={{ bgcolor: alpha(theme.palette.text.primary, 0.05) }}
					>
						<X />
					</IconButton>
				</Box>

				{/* Vitals Grid - Vertical on Mobile, Horizontal on Desktop */}
				<Grid container spacing={1}>
					<Grid item xs={12} sm={4}>
						<Box
							sx={{
								p: 1,
								borderRadius: 1,
								bgcolor: alpha(theme.palette.primary.main, 0.1),
								border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<Cpu size={14} color={theme.palette.primary.main} />
								<Typography variant="caption" fontWeight={700} color="primary">
									EFFICIENCY
								</Typography>
							</Box>
							<Typography variant="body1" fontWeight={800}>
								{(avgEff * 100).toFixed(0)}%
							</Typography>
						</Box>
					</Grid>
					<Grid item xs={6} sm={4}>
						<Box
							sx={{
								p: 1,
								borderRadius: 1,
								bgcolor: alpha(theme.palette.warning.main, 0.1),
								border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 0.5,
									mb: 0.25,
								}}
							>
								<Zap size={12} color={theme.palette.warning.main} />
								<Typography
									variant="caption"
									fontWeight={700}
									color="warning.main"
								>
									PERMITS
								</Typography>
							</Box>
							<Typography variant="body1" fontWeight={800}>
								{site.invested_permits}/{site.maximum_permits}
							</Typography>
						</Box>
					</Grid>
					<Grid item xs={6} sm={4}>
						<Box
							sx={{
								p: 1,
								borderRadius: 1,
								bgcolor: alpha(theme.palette.success.main, 0.1),
								border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 0.5,
									mb: 0.25,
								}}
							>
								<Activity size={12} color={theme.palette.success.main} />
								<Typography
									variant="caption"
									fontWeight={700}
									color="success.main"
								>
									HEALTH
								</Typography>
							</Box>
							<Typography variant="body1" fontWeight={800}>
								{(site.overall_platform_condition * 100).toFixed(1)}%
							</Typography>
						</Box>
					</Grid>
				</Grid>
			</Paper>

			{/* 2. TABS - Scrollable for mobile safety */}
			<Tabs
				value={tabValue}
				onChange={(_, v) => setTabValue(v)}
				variant="scrollable"
				scrollButtons="auto"
				allowScrollButtonsMobile
				sx={{
					minHeight: 40,
					borderBottom: 1,
					borderColor: "divider",
					bgcolor: "background.paper",
					"& .MuiTab-root": {
						fontWeight: 700,
						fontSize: "0.8rem",
						minHeight: 40,
						p: 1,
					},
				}}
			>
				<Tab
					icon={<Factory size={14} />}
					iconPosition="start"
					label="Production"
				/>
				<Tab
					icon={<Globe size={14} />}
					iconPosition="start"
					label="Logistics"
				/>
				<Tab icon={<Wrench size={14} />} iconPosition="start" label="Infra" />
			</Tabs>

			{/* 3. CONTENT AREA */}
			<Box
				sx={{
					flex: 1,
					overflowY: "auto",
					p: { xs: 1.5, sm: 2 },
					bgcolor: alpha(theme.palette.background.default, 0.5),
				}}
			>
				{/* --- TAB 0: PRODUCTION LINES --- */}
				{tabValue === 0 && (
					<Stack spacing={1.5}>
						{site.production_lines.length > 0 ? (
							site.production_lines.map((line: any, idx: number) => {
								const effColor =
									line.efficiency > 0.9
										? "success.main"
										: line.efficiency > 0.5
											? "warning.main"
											: "error.main";
								return (
									<Paper
										key={`${line.line_id}-${idx}`}
										variant="outlined"
										sx={{
											p: 0,
											overflow: "hidden",
											bgcolor: alpha(theme.palette.background.default, 0.4),
										}}
									>
										{/* Line Header */}
										<Box
											sx={{
												p: 1,
												px: 1.5,
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												borderBottom: `1px solid ${theme.palette.divider}`,
												bgcolor: alpha(theme.palette.text.primary, 0.03),
											}}
										>
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												<Factory
													size={16}
													color={theme.palette.text.secondary}
												/>
												<Typography variant="subtitle2" fontWeight={800}>
													{line.type}
												</Typography>
											</Box>
											<Chip
												label={`${(line.efficiency * 100).toFixed(0)}%`}
												size="small"
												sx={{
													height: 18,
													fontWeight: 800,
													fontSize: "0.65rem",
													bgcolor: alpha(
														theme.palette[effColor.split(".")[0] as any].main,
														0.15,
													),
													color: effColor,
												}}
											/>
										</Box>

										{/* Orders */}
										<Box sx={{ p: 1.5 }}>
											{line.production_orders.length > 0 ? (
												<Stack spacing={1}>
													{line.production_orders.map(
														(order: any, i: number) => (
															<Box
																key={order.order_id}
																sx={{
																	display: { xs: "flex", sm: "grid" },
																	flexDirection: { xs: "column", sm: "row" },
																	// Desktop Grid: Index | Inputs | Arrow | Outputs
																	gridTemplateColumns: {
																		sm: "20px 1fr 20px 1fr",
																	},
																	alignItems: {
																		xs: "flex-start",
																		sm: "center",
																	},
																	gap: { xs: 0.5, sm: 1 },
																	p: 0.5,
																	borderRadius: 1,
																	bgcolor: alpha(
																		theme.palette.background.default,
																		0.5,
																	),
																}}
															>
																{/* Index */}
																<Typography
																	variant="caption"
																	color="text.disabled"
																	fontWeight={700}
																	sx={{ display: { xs: "none", sm: "block" } }}
																>
																	{i + 1}.
																</Typography>

																{/* Inputs */}
																<Box
																	sx={{
																		display: "flex",
																		flexWrap: "wrap",
																		gap: 0.5,
																		width: "100%",
																	}}
																>
																	{order.production_recipe.inputs.map(
																		(inMat: any, k: number) => (
																			<Typography
																				key={k}
																				variant="caption"
																				sx={{
																					bgcolor: alpha(
																						theme.palette.text.secondary,
																						0.1,
																					),
																					px: 0.5,
																					borderRadius: 0.5,
																					fontWeight: 600,
																				}}
																			>
																				{inMat.ticker}
																			</Typography>
																		),
																	)}
																</Box>

																{/* Arrow - Down on Mobile, Right on Desktop */}
																<Box
																	sx={{
																		display: "flex",
																		justifyContent: "center",
																		width: { xs: "100%", sm: "auto" },
																		opacity: 0.5,
																	}}
																>
																	<Box
																		sx={{
																			display: { xs: "block", sm: "none" },
																		}}
																	>
																		<ArrowDown size={12} />
																	</Box>
																	<Box
																		sx={{
																			display: { xs: "none", sm: "block" },
																		}}
																	>
																		<ArrowRight size={12} />
																	</Box>
																</Box>

																{/* Outputs */}
																<Box
																	sx={{
																		display: "flex",
																		flexWrap: "wrap",
																		gap: 0.5,
																		width: "100%",
																	}}
																>
																	{order.production_recipe.outputs.map(
																		(outMat: any, k: number) => (
																			<Typography
																				key={k}
																				variant="caption"
																				sx={{
																					bgcolor: alpha(
																						theme.palette.primary.main,
																						0.1,
																					),
																					color: "primary.main",
																					px: 0.5,
																					borderRadius: 0.5,
																					fontWeight: 800,
																				}}
																			>
																				{outMat.ticker}
																			</Typography>
																		),
																	)}
																</Box>
															</Box>
														),
													)}
												</Stack>
											) : (
												<Typography
													variant="caption"
													fontStyle="italic"
													color="text.disabled"
												>
													Idle
												</Typography>
											)}
										</Box>
									</Paper>
								);
							})
						) : (
							<Box sx={{ textAlign: "center", py: 5, opacity: 0.5 }}>
								<Factory size={48} />
								<Typography variant="h6" mt={2}>
									No Production Lines
								</Typography>
							</Box>
						)}
					</Stack>
				)}

				{/* --- TAB 1: LOGISTICS --- */}
				{tabValue === 1 && (
					<Box>
						{/* Control Bar */}
						<Paper
							variant="outlined"
							sx={{
								p: 1.5,
								mb: 2,
								display: "flex",
								flexWrap: "wrap",
								gap: 1,
								justifyContent: "space-between",
								alignItems: "center",
								bgcolor: alpha(theme.palette.primary.main, 0.05),
							}}
						>
							<Button
								size="small"
								startIcon={
									selectedMaterials.size === logisticsRows.length ? (
										<CheckSquare size={16} />
									) : (
										<Square size={16} />
									)
								}
								onClick={toggleAllLogistics}
								sx={{ color: "text.secondary" }}
							>
								{selectedMaterials.size === logisticsRows.length
									? "Deselect All"
									: "Select All"}
							</Button>
							<Button
								variant="contained"
								size="small"
								startIcon={<Calculator size={16} />}
								onClick={handleCopyLogistics}
								disabled={selectedMaterials.size === 0}
							>
								Copy Supply XIT
							</Button>
						</Paper>

						{/* Materials Table */}
						<Stack spacing={1}>
							{logisticsRows.length > 0 ? (
								logisticsRows.map((row) => (
									<Paper
										key={row.ticker}
										variant="outlined"
										sx={{
											p: { xs: 1, sm: 0.5 },
											display: "grid",
											// Mobile (<450px): Compact Stacked Grid
											// Desktop (sm+): Single Line
											gridTemplateColumns: {
												xs: "40px 1fr 1fr",
												sm: "40px 1fr 1fr 100px 50px 1fr",
											},
											alignItems: "center",
											gap: 1,
											bgcolor: selectedMaterials.has(row.ticker)
												? alpha(theme.palette.primary.main, 0.05)
												: "transparent",
											borderColor: selectedMaterials.has(row.ticker)
												? "primary.main"
												: "divider",
										}}
									>
										{/* 1. Checkbox (Spans 2 rows on mobile) */}
										<Box
											sx={{
												display: "flex",
												justifyContent: "center",
												gridRow: { xs: "1 / span 2", sm: "1" },
											}}
										>
											<Checkbox
												size="small"
												checked={selectedMaterials.has(row.ticker)}
												onChange={() => toggleMaterial(row.ticker)}
												sx={{ p: 0 }}
											/>
										</Box>

										{/* 2. Ticker & Burn */}
										<Box
											sx={{
												gridColumn: { xs: "auto", sm: "2" },
												gridRow: { xs: "auto", sm: "1" },
											}}
										>
											<Typography variant="body2" fontWeight={700}>
												{row.ticker}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												Burn: {row.dailyBurn.toFixed(1)}/d
											</Typography>
										</Box>

										{/* 3. Target Input (Mobile: Row 2, Col 2) */}
										<Box
											sx={{
												gridColumn: { xs: "2", sm: "auto" },
												gridRow: { xs: "2", sm: "1" },
											}}
										>
											<TextField
												label="Days"
												type="number"
												size="medium"
												value={row.target}
												onChange={(e) =>
													handleTargetChange(row.ticker, e.target.value)
												}
												InputProps={{ sx: { fontSize: "0.8rem", height: 30 } }}
												InputLabelProps={{ sx: { fontSize: "1rem" } }}
												fullWidth
											/>
										</Box>

										{/* 4. Stock */}
										<Box
											sx={{
												textAlign: { xs: "center", sm: "center" },
												gridColumn: { xs: "4", sm: "4" },
												gridRow: { xs: "1", sm: "1" },
											}}
										>
											<Typography
												variant="caption"
												display="block"
												color="text.secondary"
											>
												Stock
											</Typography>
											<Typography variant="body2">
												{smartFormat(row.current).text}
											</Typography>
										</Box>

										{/* 5. Supply */}
										<Box
											sx={{
												textAlign: { xs: "center", sm: "center" },
												gridColumn: { xs: "5", sm: "5" },
												gridRow: { xs: "1", sm: "1" },
											}}
										>
											<Typography
												variant="caption"
												display="block"
												color="text.secondary"
											>
												Supply
											</Typography>
											<Typography variant="body2">{`${formatNumber(row.current / row.dailyBurn)} d`}</Typography>
										</Box>

										{/* 6. Need / Status (Mobile: Row 2, Col 3) */}
										<Box
											sx={{
												textAlign: "right",
												gridColumn: { xs: "5", sm: "auto" },
												gridRow: { xs: "2", sm: "1" },
											}}
										>
											<Typography
												variant="caption"
												display="block"
												color="text.secondary"
											>
												Need
											</Typography>
											{row.missing > 0 ? (
												<Typography
													variant="body2"
													fontWeight={700}
													color="error.main"
												>
													{smartFormat(row.missing).text}
												</Typography>
											) : (
												<Typography variant="caption" color="success.main">
													OK
												</Typography>
											)}
										</Box>
									</Paper>
								))
							) : (
								<Typography
									textAlign="center"
									color="text.secondary"
									sx={{ py: 4 }}
								>
									No consumption detected.
								</Typography>
							)}
						</Stack>
					</Box>
				)}

				{/* --- TAB 2: INFRASTRUCTURE --- */}
				{tabValue === 2 && (
					<Box>
						{loadingDetails ? (
							<Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
								<CircularProgress />
							</Box>
						) : (
							<Stack spacing={3}>
								{/* Repair Actions */}
								{repairs.length > 0 ? (
									<Paper
										variant="outlined"
										sx={{
											p: 2,
											borderColor: "warning.main",
											bgcolor: alpha(theme.palette.warning.main, 0.05),
										}}
									>
										<Box
											sx={{
												display: "flex",
												flexDirection: { xs: "column", sm: "row" },
												justifyContent: "space-between",
												alignItems: { xs: "flex-start", sm: "center" },
												gap: 2,
												mb: 2,
											}}
										>
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												<AlertTriangle color={theme.palette.warning.main} />
												<Typography
													variant="subtitle2"
													fontWeight={800}
													color="warning.main"
												>
													REPAIRS REQUIRED
												</Typography>
											</Box>
											<Box
												sx={{
													display: "flex",
													gap: 1,
													width: { xs: "100%", sm: "auto" },
												}}
											>
												<Button
													size="small"
													fullWidth
													sx={{ flex: 1 }}
													onClick={() => handleCopyRepairs("transfer")}
												>
													Transfer
												</Button>
												<Button
													size="small"
													variant="contained"
													color="warning"
													fullWidth
													sx={{ flex: 1 }}
													onClick={() => handleCopyRepairs("buy")}
												>
													Buy
												</Button>
											</Box>
										</Box>
										<Stack spacing={0.5}>
											{repairs.map((r: any, i: number) => (
												<RepairRow
													key={i}
													label={r.ticker}
													value={r.total_amount.toLocaleString()}
												/>
											))}
										</Stack>
									</Paper>
								) : (
									<Alert
										severity="success"
										variant="outlined"
										icon={<Activity />}
									>
										All platforms operational.
									</Alert>
								)}

								{/* Platform List */}
								<Box>
									<Typography
										variant="caption"
										fontWeight={700}
										color="text.secondary"
										sx={{ mb: 1, display: "block" }}
									>
										INSTALLED PLATFORMS
									</Typography>
									<Grid container spacing={1}>
										{platforms.map((p: any, i: number) => (
											<Grid item xs={12} sm={6} key={i}>
												<Paper
													variant="outlined"
													sx={{
														p: 1,
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
													}}
												>
													<Typography
														variant="body2"
														fontWeight={600}
														fontSize="0.8rem"
													>
														{p.ticker}
													</Typography>
													<Chip
														label={`${(p.condition * 100).toFixed(0)}%`}
														size="small"
														sx={{
															height: 18,
															fontSize: "0.65rem",
															fontWeight: 800,
															bgcolor:
																p.condition < 0.8
																	? theme.palette.error.main
																	: theme.palette.success.main,
															color: "white",
														}}
													/>
												</Paper>
											</Grid>
										))}
									</Grid>
								</Box>
							</Stack>
						)}
					</Box>
				)}
			</Box>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				message={snackbar.message}
			/>
		</Box>
	);
};
