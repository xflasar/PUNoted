import React, { useState, useMemo } from "react";
import {
	Box,
	Typography,
	Paper,
	TextField,
	InputAdornment,
	CircularProgress,
	useTheme,
	alpha,
	LinearProgress,
	Chip,
	Stack,
	Divider,
	Collapse,
	IconButton,
	Tooltip,
} from "@mui/material";
import { Masonry } from "@mui/lab";
import {
	Search,
	Inventory2,
	LocalShipping,
	Factory,
	Place,
	LocalGasStation,
	RocketLaunch,
	Propane,
	Store as StoreIcon,
	ExpandMore,
	ExpandLess,
	AttachMoney,
	Public,
	FilterList,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useGlobalData } from "../context/globaldatacontext";

// --- TYPES ---
export interface StorageItem {
	id?: string;
	name: string;
	quantity: number;
	type?: string;
}

export interface StorageUnit {
	storageid: string;
	name: string;
	type: string;
	storagelocation: string | null;
	volumecapacity: number;
	volumeload: number;
	weightcapacity: number;
	weightload: number;
	total_worth?: number;
	items: StorageItem[];
}

interface AggregatedItem {
	name: string;
	totalQuantity: number;
	locations: number;
}

// --- GROUPING INTERFACES ---
interface CombinedGroup {
	id: string;
	name: string;
	category: "LOCATION" | "SHIP";
	typeLabel: string;

	mainUnit?: StorageUnit;
	subUnit?: StorageUnit;
	extraUnit?: StorageUnit;

	totalVolLoad: number;
	totalVolCap: number;
	totalWgtLoad: number;
	totalWgtCap: number;
	totalItems: number;
	totalValue: number;
}

// --- HELPERS ---
const chunkArray = <T,>(array: T[], size: number): T[][] => {
	const result: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		result.push(array.slice(i, i + size));
	}
	return result;
};

const formatCurrency = (val: number) => {
	const prefix = "$";
	if (val >= 1000000) return `${prefix}${(val / 1000000).toFixed(2)}M`;
	if (val >= 1000) return `${prefix}${(val / 1000).toFixed(0)}k`;
	return `${prefix}${val.toLocaleString()}`;
};

// --- STYLED COMPONENTS ---

// Ultra-compact Grid for Items
const InventoryGrid = styled(Box, {
	shouldForwardProp: (prop) => prop !== "isSingle",
})<{ isSingle?: boolean }>(({ theme, isSingle }) => ({
	display: "grid",
	// AUTO-FIT: Packs as many 90px columns as possible. If single, full width.
	gridTemplateColumns: isSingle
		? "1fr"
		: "repeat(auto-fill, minmax(90px, 1fr))",
	gap: "2px 8px",
	maxHeight: 180,
	overflowY: "auto",
	padding: theme.spacing(0.5),
	"&::-webkit-scrollbar": { width: "4px" },
	"&::-webkit-scrollbar-track": { background: "transparent" },
	"&::-webkit-scrollbar-thumb": {
		backgroundColor: alpha(theme.palette.text.secondary, 0.2),
		borderRadius: "2px",
	},
}));

const InventoryBatchCard = styled(Paper)(({ theme }) => ({
	minWidth: 180,
	flex: "1 0 auto",
	padding: theme.spacing(0.5),
	backgroundColor: alpha(theme.palette.background.default, 0.6),
	border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
	borderRadius: theme.spacing(1),
	display: "flex",
	flexDirection: "column",
}));

// --- SUB-COMPONENT: INVENTORY SECTION ---
const InventorySection = ({
	title,
	icon: Icon,
	items,
	color,
}: {
	title: string;
	icon: any;
	items?: StorageItem[];
	color: string;
}) => {
	const theme = useTheme();
	const hasItems = items && items.length > 0;
	if (!hasItems) return null;

	const isSingle = items!.length === 1;

	return (
		<Box
			sx={{
				mt: 0.5,
				p: 0.25,
				bgcolor: alpha(color, 0.05),
				borderRadius: 1,
				border: `1px solid ${alpha(color, 0.08)}`,
			}}
		>
			{/* Header for the section (e.g. CARGO) - Slightly Larger */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 0.5,
					mb: 0.25,
					px: 0.5,
				}}
			>
				<Icon sx={{ fontSize: 13, color: color }} />
				<Typography
					variant="caption"
					sx={{ fontWeight: 800, color: color, fontSize: "0.7rem" }}
				>
					{title.toUpperCase()}
				</Typography>
			</Box>

			{/* ITEMS - Kept Small/Compact as requested */}
			<InventoryGrid isSingle={isSingle}>
				{items!.map((item, i) => (
					<Box
						key={i}
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							borderRight: isSingle
								? "none"
								: `1px dashed ${alpha(theme.palette.divider, 0.05)}`,
							pr: 1,
						}}
					>
						<Typography
							variant="body2"
							sx={{
								fontSize: "0.75rem",
								color: theme.palette.text.secondary,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
								maxWidth: "65%",
							}}
						>
							{item.name}
						</Typography>
						<Typography
							variant="body2"
							sx={{
								fontSize: "0.75rem",
								fontWeight: 700,
								fontFamily: "monospace",
								color: theme.palette.text.primary,
							}}
						>
							{item.quantity.toLocaleString()}
						</Typography>
					</Box>
				))}
			</InventoryGrid>
		</Box>
	);
};

// --- UNIFIED CARD COMPONENT ---
const UnifiedStorageCard = React.memo(({ group }: { group: CombinedGroup }) => {
	const theme = useTheme();

	// Theme selection based on Category
	const isShip = group.category === "SHIP";
	const color = isShip
		? theme.palette.secondary.main
		: theme.palette.primary.main;
	const MainIcon = isShip ? LocalShipping : Place;

	const vRatio = Math.min(
		(group.totalVolLoad / (group.totalVolCap || 1)) * 100,
		100,
	);
	const wRatio = Math.min(
		(group.totalWgtLoad / (group.totalWgtCap || 1)) * 100,
		100,
	);

	return (
		<Paper
			elevation={2}
			sx={{
				display: "flex",
				flexDirection: "column",
				borderRadius: 2,
				overflow: "hidden",
				minWidth: 300,
				border: `1px solid ${alpha(color, 0.3)}`,
				bgcolor:
					theme.palette.mode === "dark"
						? alpha("#000000", 0.4)
						: alpha(theme.palette.background.paper, 0.9),
				backdropFilter: "blur(12px)",
				transition: "all 0.1s ease",
				width: "100%",
				"&:hover": {
					boxShadow: `0 4px 12px -2px ${alpha(color, 0.3)}`,
					borderColor: color,
				},
			}}
		>
			{/* HEADER - Increased Font Sizes */}
			<Box
				sx={{
					px: 1.5,
					py: 0.75,
					borderBottom: `1px solid ${alpha(color, 0.15)}`,
					bgcolor: alpha(color, 0.1),
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 0.75,
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							overflow: "hidden",
						}}
					>
						<MainIcon sx={{ fontSize: 15, color: color }} />
						<Typography
							variant="subtitle1"
							sx={{
								fontWeight: 600,
								fontSize: "1rem",
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
							}}
						>
							{group.name}
						</Typography>
					</Box>
					<Chip
						label={formatCurrency(group.totalValue)}
						size="small"
						color={isShip ? "secondary" : "primary"}
						variant="outlined"
						sx={{
							height: 20,
							fontSize: "0.75rem",
							fontWeight: 700,
							borderRadius: 0.5,
						}}
					/>
				</Box>

				{/* METRICS - Increased Font Size */}
				<Stack spacing={0.5}>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<Box />
						<Typography
							variant="caption"
							sx={{
								fontSize: "0.75rem",
								fontWeight: 600,
								color: theme.palette.text.secondary,
							}}
						>
							{group.totalVolLoad.toLocaleString()} /{" "}
							{group.totalVolCap.toLocaleString()} m³
						</Typography>
					</Box>
					<LinearProgress
						variant="determinate"
						value={vRatio}
						sx={{
							height: 4,
							borderRadius: 2,
							bgcolor: alpha(color, 0.1),
							"& .MuiLinearProgress-bar": { bgcolor: color },
						}}
					/>

					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<Box />
						<Typography
							variant="caption"
							sx={{
								fontSize: "0.75rem",
								fontWeight: 600,
								color: theme.palette.text.secondary,
							}}
						>
							{group.totalWgtLoad.toLocaleString()} /{" "}
							{group.totalWgtCap.toLocaleString()} t
						</Typography>
					</Box>
					<LinearProgress
						variant="determinate"
						value={wRatio}
						sx={{
							height: 4,
							borderRadius: 2,
							bgcolor: alpha(color, 0.1),
							"& .MuiLinearProgress-bar": { bgcolor: color },
						}}
					/>
				</Stack>
			</Box>

			{/* BODY - Minimal Padding */}
			<Box sx={{ px: 0.5, pb: 0.5 }}>
				{isShip ? (
					<>
						<InventorySection
							title="Cargo"
							icon={Inventory2}
							items={group.mainUnit?.items}
							color={theme.palette.info.main}
						/>
						{(group.subUnit || group.extraUnit) && (
							<Stack direction="row" spacing={0.5}>
								{group.subUnit && (
									<Box sx={{ flex: 1 }}>
										<InventorySection
											title="STL"
											icon={Propane}
											items={group.subUnit.items}
											color={theme.palette.warning.main}
										/>
									</Box>
								)}
								{group.extraUnit && (
									<Box sx={{ flex: 1 }}>
										<InventorySection
											title="FTL"
											icon={RocketLaunch}
											items={group.extraUnit.items}
											color={theme.palette.error.main}
										/>
									</Box>
								)}
							</Stack>
						)}
					</>
				) : (
					<>
						<InventorySection
							title="Site"
							icon={Factory}
							items={group.mainUnit?.items}
							color={color}
						/>
						<InventorySection
							title="Warehouse"
							icon={StoreIcon}
							items={group.subUnit?.items}
							color={theme.palette.warning.main}
						/>
					</>
				)}

				{!group.mainUnit && !group.subUnit && !group.extraUnit && (
					<Typography
						variant="caption"
						sx={{
							display: "block",
							p: 2,
							textAlign: "center",
							color: theme.palette.text.disabled,
							fontStyle: "italic",
							fontSize: "0.8rem",
						}}
					>
						Empty {group.typeLabel}
					</Typography>
				)}
			</Box>
		</Paper>
	);
});

// --- MAIN COMPONENT ---
const StorageDashboard: React.FC = () => {
	const theme = useTheme();
	const { storageState } = useGlobalData();
	const [searchTerm, setSearchTerm] = useState("");
	const [summaryOpen, setSummaryOpen] = useState(false);

	const allUnits = useMemo(() => {
		if (!storageState || !storageState.units) return [];
		return Array.isArray(storageState.units)
			? storageState.units
			: Object.values(storageState.units);
	}, [storageState]);

	// --- UNIFIED PROCESSING LOGIC ---
	const { combinedGroups, globalStats } = useMemo(() => {
		const groupMap: Record<string, CombinedGroup> = {};
		let totalValue = 0,
			totalWarehouses = 0,
			totalSites = 0,
			totalShips = 0;

		allUnits.forEach((unit) => {
			const uValue = unit.total_worth || 0;
			totalValue += uValue;
			const type = unit.type;

			// SHIP LOGIC
			if (["SHIP_STORE", "STL_FUEL_STORE", "FTL_FUEL_STORE"].includes(type)) {
				const name = unit.name !== "null" ? unit.name : "Unknown";
				if (!groupMap[name]) {
					groupMap[name] = {
						id: name,
						name,
						category: "SHIP",
						typeLabel: "FLEET",
						totalVolLoad: 0,
						totalVolCap: 0,
						totalWgtLoad: 0,
						totalWgtCap: 0,
						totalItems: 0,
						totalValue: 0,
					};
					totalShips++;
				}
				const g = groupMap[name];
				if (type === "STL_FUEL_STORE") g.subUnit = unit;
				else if (type === "FTL_FUEL_STORE") g.extraUnit = unit;
				else g.mainUnit = unit;

				g.totalVolLoad += unit.volumeload;
				g.totalVolCap += unit.volumecapacity;
				g.totalWgtLoad += unit.weightload;
				g.totalWgtCap += unit.weightcapacity;
				g.totalValue += uValue;
				if (unit.items) g.totalItems += unit.items.length;

				// PLANET LOGIC
			} else {
				const loc = unit.storagelocation || "Unassigned";
				if (!groupMap[loc]) {
					groupMap[loc] = {
						id: loc,
						name: loc,
						category: "LOCATION",
						typeLabel: type,
						totalVolLoad: 0,
						totalVolCap: 0,
						totalWgtLoad: 0,
						totalWgtCap: 0,
						totalItems: 0,
						totalValue: 0,
					};
				}
				const g = groupMap[loc];
				if (type === "WAREHOUSE_STORE") {
					g.subUnit = unit;
					totalWarehouses++;
				} else {
					g.mainUnit = unit;
					totalSites++;
				}

				g.totalVolLoad += unit.volumeload;
				g.totalVolCap += unit.volumecapacity;
				g.totalWgtLoad += unit.weightload;
				g.totalWgtCap += unit.weightcapacity;
				g.totalValue += uValue;
				if (unit.items) g.totalItems += unit.items.length;
			}
		});

		const sortedGroups = Object.values(groupMap).sort((a, b) => {
			if (a.category !== b.category) return a.category === "LOCATION" ? -1 : 1;
			return a.name.localeCompare(b.name);
		});

		return {
			combinedGroups: sortedGroups,
			globalStats: { totalValue, totalWarehouses, totalSites, totalShips },
		};
	}, [allUnits]);

	// Filtering
	const filteredGroups = useMemo(() => {
		const lower = searchTerm.toLowerCase();
		return combinedGroups.filter(
			(g) =>
				!searchTerm ||
				g.name.toLowerCase().includes(lower) ||
				g.mainUnit?.items.some((i) => i.name.toLowerCase().includes(lower)) ||
				g.subUnit?.items.some((i) => i.name.toLowerCase().includes(lower)) ||
				g.extraUnit?.items.some((i) => i.name.toLowerCase().includes(lower)),
		);
	}, [combinedGroups, searchTerm]);

	// Global Inventory Batches
	const globalInventoryBatches = useMemo(() => {
		const agg: Record<string, AggregatedItem> = {};
		allUnits.forEach((unit) => {
			if (!unit.items) return;
			unit.items.forEach((item) => {
				if (!agg[item.name])
					agg[item.name] = { name: item.name, totalQuantity: 0, locations: 0 };
				agg[item.name].totalQuantity += item.quantity;
				agg[item.name].locations += 1;
			});
		});
		const sorted = Object.values(agg)
			.sort((a, b) => b.totalQuantity - a.totalQuantity)
			.filter(
				(i) =>
					!searchTerm ||
					i.name.toLowerCase().includes(searchTerm.toLowerCase()),
			);
		return chunkArray(sorted, 5);
	}, [allUnits, searchTerm]);

	if (!storageState)
		return (
			<Box
				sx={{
					display: "flex",
					height: "100vh",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
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
			{/* --- HEADER --- */}
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
						px: 2,
						py: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						flexWrap: "wrap",
						gap: 2,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<IconButton
							onClick={() => setSummaryOpen(!summaryOpen)}
							size="small"
							sx={{ bgcolor: alpha(theme.palette.divider, 0.1) }}
						>
							{summaryOpen ? <ExpandLess /> : <ExpandMore />}
						</IconButton>
						<Typography
							variant="h6"
							sx={{
								fontWeight: 900,
								lineHeight: 1,
								letterSpacing: -0.5,
								fontSize: "1.25rem",
							}}
						>
							GLOBAL STORAGE
						</Typography>
					</Box>

					<Stack
						direction="row"
						spacing={3}
						sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}
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
									lineHeight: 1,
									color: theme.palette.text.secondary,
									fontWeight: 700,
									fontSize: "0.7rem",
								}}
							>
								NET WORTH
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 800,
									color: theme.palette.success.main,
									fontSize: "0.9rem",
								}}
							>
								{formatCurrency(globalStats.totalValue)}
							</Typography>
						</Box>
						<Box sx={{ textAlign: "center" }}>
							<Typography
								variant="caption"
								sx={{
									display: "block",
									lineHeight: 1,
									color: theme.palette.text.secondary,
									fontWeight: 700,
									fontSize: "0.7rem",
								}}
							>
								BASES
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 800,
									color: theme.palette.primary.main,
									fontSize: "0.9rem",
								}}
							>
								{globalStats.totalSites}
							</Typography>
						</Box>
						<Box sx={{ textAlign: "center" }}>
							<Typography
								variant="caption"
								sx={{
									display: "block",
									lineHeight: 1,
									color: theme.palette.text.secondary,
									fontWeight: 700,
									fontSize: "0.7rem",
								}}
							>
								FLEET
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 800,
									color: theme.palette.secondary.main,
									fontSize: "0.9rem",
								}}
							>
								{globalStats.totalShips}
							</Typography>
						</Box>
					</Stack>

					<TextField
						placeholder="Search..."
						variant="outlined"
						size="small"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						sx={{
							width: 220,
							"& .MuiOutlinedInput-root": {
								fontSize: "0.9rem",
								borderRadius: 1.5,
							},
						}}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Search fontSize="small" />
								</InputAdornment>
							),
						}}
					/>
				</Box>

				<Collapse in={summaryOpen}>
					<Box
						sx={{
							p: 2,
							bgcolor: alpha(theme.palette.background.default, 0.5),
							borderTop: `1px solid ${theme.palette.divider}`,
						}}
					>
						<Box
							sx={{
								maxHeight: "25vh",
								overflowY: "auto",
								display: "flex",
								flexWrap: "wrap",
								gap: 1,
							}}
						>
							{globalInventoryBatches.map((batch, idx) => (
								<InventoryBatchCard key={idx} elevation={0}>
									{batch.map((item) => (
										<Box
											key={item.name}
											sx={{
												display: "flex",
												justifyContent: "space-between",
												py: 0.2,
												borderBottom: `1px dashed ${alpha(theme.palette.divider, 0.05)}`,
											}}
										>
											<Typography
												variant="caption"
												sx={{
													fontWeight: 600,
													color: theme.palette.text.secondary,
													maxWidth: 80,
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
													fontSize: "0.75rem",
												}}
											>
												{item.name}
											</Typography>
											<Typography
												variant="caption"
												sx={{
													fontWeight: 700,
													fontFamily: "monospace",
													color: theme.palette.text.primary,
													fontSize: "0.75rem",
												}}
											>
												{item.totalQuantity.toLocaleString()}
											</Typography>
										</Box>
									))}
								</InventoryBatchCard>
							))}
						</Box>
					</Box>
				</Collapse>
			</Paper>

			{/* --- UNIFIED GRID (NO WASTED SPACE) --- */}
			<Box
				sx={{
					flex: 1,
					overflowY: "auto",
					p: 2,
					bgcolor: theme.palette.background.default,
				}}
			>
				{filteredGroups.length > 0 ? (
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
							gap: 2,
							alignItems: "start",
						}}
					>
						{filteredGroups.map((group) => (
							<UnifiedStorageCard key={group.id} group={group} />
						))}
					</Box>
				) : (
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							mt: 8,
							opacity: 0.5,
						}}
					>
						<FilterList sx={{ fontSize: 64, mb: 1 }} />
						<Typography variant="h6">No results found</Typography>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default StorageDashboard;
