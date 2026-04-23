import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
	Box,
	Typography,
	Paper,
	Grid,
	CardContent,
	Chip,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableRow,
	Collapse,
	Button,
	alpha,
	useTheme,
	Stack,
	Checkbox,
	Autocomplete,
	TextField,
	CircularProgress,
	Alert,
	Tooltip,
	Popover,
	FormGroup,
	FormControlLabel,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Divider,
	Tabs,
	Tab,
} from "@mui/material";
import Masonry from "@mui/lab/Masonry";
import PublicIcon from "@mui/icons-material/Public";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SettingsIcon from "@mui/icons-material/Settings";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ConstructionIcon from "@mui/icons-material/Construction";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import FilterListIcon from "@mui/icons-material/FilterList";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CloseIcon from "@mui/icons-material/Close";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GroupsIcon from "@mui/icons-material/Groups";
import ScienceIcon from "@mui/icons-material/Science";
import EngineeringIcon from "@mui/icons-material/Engineering";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import HandymanIcon from "@mui/icons-material/Handyman";

// --- CONSTANTS ---
const DAYS_TO_SUPPLY = 7;

// --- TYPES ---
interface PlanetNameItem {
	planetid: string;
	naturalid: string;
	name?: string;
}

interface ResourceItem {
	ticker: string;
	amount: number;
	currentAmount?: number;
	stored?: number;
	capacity?: number;
	nextTick?: string;
	enabled?: boolean;
}

interface ContributionItem {
	contributorName: string;
	contributorCode: string;
	amount: number;
	ticker: string;
	timestamp: string;
}

interface UpgradeCostItem {
	ticker: string;
	amount: number;
	currentAmount: number;
}

interface Building {
	id: string;
	ticker: string;
	name: string;
	upkeep: ResourceItem[];
	upgradeCosts: UpgradeCostItem[];
	contributions: ContributionItem[];
}

interface PopulationDetails {
	pioneers: number;
	settlers: number;
	technicians: number;
	engineers: number;
	scientists: number;
}

interface Population {
	total: number;
	pioneers: number;
	settlers: number;
	technicians: number;
	engineers: number;
	scientists: number;
}

interface PlanetData {
	id: string;
	name: string;
	population: Population;
	buildings: Building[];
	cogc: string;
	cogcUpkeep: ResourceItem[];
	activePrograms?: string[];
}

interface GovernanceResponse {
	status: string;
	data: PlanetData[];
}

// --- HELPER FUNCTIONS ---

const getTickStatus = (nextTickStr?: string) => {
	if (!nextTickStr) return null;
	const nextTick = new Date(nextTickStr);
	const now = new Date();
	const diffMs = nextTick.getTime() - now.getTime();
	const diffHours = diffMs / (1000 * 60 * 60);
	const diffDays = diffHours / 24;

	let color = "text.secondary";
	let text = "";
	let urgentLevel = 0; // 0: None, 1: Warn (<3d), 2: Critical (<1d)

	if (diffMs < 0) {
		text = "Overdue";
		color = "error.main";
		urgentLevel = 2;
	} else if (diffHours < 24) {
		text = `in ${Math.round(diffHours)}h`;
		color = "error.main";
		urgentLevel = 2;
	} else if (diffDays < 3) {
		text = `in ${Math.round(diffDays)}d`;
		color = "warning.main";
		urgentLevel = 1;
	} else {
		text = `in ${Math.round(diffDays)}d`;
		color = "success.main";
		urgentLevel = 0;
	}

	return { text, color, date: nextTick, urgentLevel };
};

const glassyStyle = (theme: any) => ({
	backgroundColor: alpha(theme.palette.background.default, 0.4),
	backdropFilter: "blur(12px)",
	border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
	boxShadow: "none",
});

// --- SUB-COMPONENTS ---

// 1. Resource Toggle Row
const ResourceToggleRow: React.FC<{
	resource: ResourceItem;
	onToggle: () => void;
	theme: any;
}> = React.memo(({ resource, onToggle, theme }) => {
	const stored = resource.stored || 0;
	const capacity = resource.capacity || 1;
	const fillPercent = Math.min((stored / capacity) * 100, 100);
	const isEnabled = resource.enabled !== false;

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: "24px 40px 50px 55px 1fr",
				gap: 1,
				alignItems: "center",
				py: 0.5,
				px: 1,
				borderRadius: 1,
				bgcolor: isEnabled
					? alpha(theme.palette.background.default, 0.4)
					: alpha(theme.palette.action.disabledBackground, 0.05),
				borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
				opacity: isEnabled ? 1 : 0.6,
				"&:hover": { bgcolor: alpha(theme.palette.background.default, 0.6) },
			}}
		>
			<Checkbox
				checked={isEnabled}
				onChange={onToggle}
				size="small"
				sx={{
					p: 0,
					color: theme.palette.text.secondary,
					"& .MuiSvgIcon-root": { fontSize: 16 },
				}}
			/>
			<Typography
				variant="caption"
				fontWeight="bold"
				color={isEnabled ? "primary.light" : "text.secondary"}
				sx={{ fontSize: "0.75rem" }}
			>
				{resource.ticker}
			</Typography>
			<Tooltip title="Daily Consumption">
				<Typography
					variant="caption"
					color="text.primary"
					sx={{
						fontFamily: "monospace",
						fontSize: "0.75rem",
						textAlign: "right",
					}}
				>
					{resource.amount}/d
				</Typography>
			</Tooltip>
			<Tooltip title={`Current Input Buffer: ${resource.currentAmount ?? 0}`}>
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{
						fontFamily: "monospace",
						fontSize: "0.75rem",
						textAlign: "right",
						opacity: 0.8,
					}}
				>
					{resource.currentAmount?.toLocaleString() ?? 0}
				</Typography>
			</Tooltip>
			<Box
				position="relative"
				height={16}
				width="100%"
				bgcolor={alpha(theme.palette.common.black, 0.3)}
				borderRadius={0.5}
				overflow="hidden"
			>
				<Box
					sx={{
						position: "absolute",
						left: 0,
						top: 0,
						bottom: 0,
						width: `${fillPercent}%`,
						bgcolor:
							fillPercent < 10
								? theme.palette.error.main
								: fillPercent > 90
									? theme.palette.success.main
									: theme.palette.info.main,
						opacity: 0.6,
					}}
				/>
				<Box
					position="absolute"
					width="100%"
					height="100%"
					display="flex"
					alignItems="center"
					justifyContent="center"
					px={0.5}
				>
					<Typography
						variant="caption"
						sx={{
							fontSize: "0.65rem",
							fontWeight: "bold",
							color: "white",
							lineHeight: 1,
							textShadow: "0 1px 2px black",
						}}
					>
						{stored.toLocaleString()} / {capacity.toLocaleString()} (
						{Math.round(fillPercent)}%)
					</Typography>
				</Box>
			</Box>
		</Box>
	);
});

// 2. Shopping List Modal Content
const ShoppingListContent: React.FC<{
	totals: Record<string, number>;
	planetBreakdown: Record<string, Record<string, number>>;
	onCopy: () => void;
	theme: any;
}> = React.memo(({ totals, planetBreakdown, onCopy, theme }) => {
	const sortedTickers = Object.keys(totals).sort();
	const [expandedPlanets, setExpandedPlanets] = useState<
		Record<string, boolean>
	>({});

	const renderTableRows = (data: Record<string, number>) =>
		Object.keys(data)
			.sort()
			.map((ticker) => {
				const needed = Math.ceil(data[ticker]);
				if (needed <= 0) return null;
				return (
					<TableRow key={ticker}>
						<TableCell
							component="th"
							scope="row"
							sx={{
								borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
								py: 0.5,
								px: 1,
							}}
						>
							<Chip
								label={ticker}
								size="small"
								sx={{
									borderRadius: 1,
									height: 20,
									fontSize: "0.7rem",
									fontWeight: "bold",
									bgcolor: alpha(theme.palette.primary.main, 0.1),
									color: theme.palette.primary.light,
								}}
							/>
						</TableCell>
						<TableCell
							align="right"
							sx={{
								borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
								fontFamily: "monospace",
								fontWeight: "bold",
								color: theme.palette.success.light,
								fontSize: "0.8rem",
								py: 0.5,
								px: 1,
							}}
						>
							{needed.toLocaleString()}
						</TableCell>
					</TableRow>
				);
			});

	return (
		<Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<Box sx={{ flex: 1, overflowY: "auto" }}>
				<Box
					sx={{
						p: 2,
						bgcolor: alpha(theme.palette.background.default, 0.3),
						borderRadius: 1,
						mb: 2,
					}}
				>
					<Typography
						variant="subtitle2"
						fontWeight="bold"
						color="text.secondary"
						sx={{ mb: 1, display: "block", px: 0.5 }}
					>
						GLOBAL REQUIRED ({DAYS_TO_SUPPLY} Days)
					</Typography>
					<TableContainer
						component={Paper}
						elevation={0}
						sx={{ bgcolor: "transparent" }}
					>
						<Table size="small">
							<TableBody>
								{sortedTickers.length > 0 ? (
									renderTableRows(totals)
								) : (
									<TableRow>
										<TableCell
											align="center"
											sx={{
												border: 0,
												color: "text.disabled",
												fontSize: "0.85rem",
												py: 2,
											}}
										>
											No shortages detected.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</Box>

				<Divider sx={{ my: 1 }} />

				{Object.entries(planetBreakdown).map(([planetName, pTotals]) => {
					const hasNeeds = Object.values(pTotals).some((v) => v > 0);
					if (!hasNeeds) return null;
					const isExp = expandedPlanets[planetName];

					return (
						<Box
							key={planetName}
							borderBottom={`1px solid ${alpha(theme.palette.divider, 0.1)}`}
						>
							<Box
								onClick={() =>
									setExpandedPlanets((prev) => ({
										...prev,
										[planetName]: !prev[planetName],
									}))
								}
								sx={{
									p: 1.5,
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									cursor: "pointer",
									"&:hover": {
										bgcolor: alpha(theme.palette.action.hover, 0.1),
									},
								}}
							>
								<Typography variant="body2" fontWeight="bold">
									{planetName}
								</Typography>
								<IconButton size="small" sx={{ p: 0 }}>
									{isExp ? (
										<ExpandLessIcon fontSize="small" />
									) : (
										<ExpandMoreIcon fontSize="small" />
									)}
								</IconButton>
							</Box>
							<Collapse in={isExp}>
								<Box sx={{ px: 2, pb: 2 }}>
									<Table size="small">
										<TableBody>{renderTableRows(pTotals)}</TableBody>
									</Table>
								</Box>
							</Collapse>
						</Box>
					);
				})}
			</Box>
		</Box>
	);
});

// 3. Infrastructure Card
const BuildingCard: React.FC<{
	building: Building;
	planetId: string;
	onToggleResource: (
		planetId: string,
		buildingId: string | null,
		ticker: string,
	) => void;
	onHideBuilding: (ticker: string) => void;
	theme: any;
}> = React.memo(
	({ building, planetId, onToggleResource, onHideBuilding, theme }) => {
		const [expanded, setExpanded] = useState(true);

		const tickInfo = getTickStatus(building.upkeep[0]?.nextTick);
		const totalStored = building.upkeep.reduce(
			(sum, r) => sum + (r.stored || 0),
			0,
		);
		const totalCap = building.upkeep.reduce(
			(sum, r) => sum + (r.capacity || 0),
			0,
		);
		const fulfillment = totalCap > 0 ? (totalStored / totalCap) * 100 : 0;
		const fulfillColor =
			fulfillment < 10
				? theme.palette.error.main
				: fulfillment > 90
					? theme.palette.success.main
					: theme.palette.warning.main;

		return (
			<Box
				sx={{
					bgcolor: alpha(theme.palette.background.default, 0.3),
					borderRadius: 2,
					border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						bgcolor: alpha(theme.palette.background.default, 0.2),
						p: 1,
						px: 1.5,
						borderBottom: expanded
							? `1px solid ${alpha(theme.palette.divider, 0.05)}`
							: "none",
						"&:hover": {
							bgcolor: alpha(theme.palette.background.default, 0.3),
						},
					}}
				>
					<Box
						display="flex"
						alignItems="center"
						gap={1.5}
						onClick={() => setExpanded(!expanded)}
						sx={{ cursor: "pointer", flexGrow: 1 }}
					>
						<Chip
							label={building.ticker}
							size="small"
							color="primary"
							sx={{
								height: 20,
								fontSize: "0.75rem",
								fontWeight: "bold",
								borderRadius: 1,
							}}
						/>
						{building.name !== building.ticker && (
							<Typography
								variant="body2"
								color="text.primary"
								fontWeight="bold"
								fontSize="0.85rem"
							>
								{building.name}
							</Typography>
						)}
					</Box>

					<Box display="flex" alignItems="center" gap={1}>
						{tickInfo && (
							<Tooltip title={`Next run: ${tickInfo.date.toLocaleString()}`}>
								<Chip
									icon={<AccessTimeIcon sx={{ fontSize: "12px !important" }} />}
									label={tickInfo.text}
									size="small"
									variant="outlined"
									sx={{
										height: 20,
										fontSize: "0.7rem",
										color: tickInfo.color,
										borderColor: alpha(theme.palette.divider, 0.2),
										"& .MuiChip-icon": { color: tickInfo.color },
									}}
								/>
							</Tooltip>
						)}
						{building.upkeep.length > 0 && (
							<Typography
								variant="caption"
								sx={{
									color: fulfillColor,
									fontWeight: "bold",
									fontSize: "0.75rem",
								}}
							>
								{Math.round(fulfillment)}%
							</Typography>
						)}
						<Tooltip title="Hide Infrastructure">
							<Checkbox
								size="small"
								checked={true}
								onChange={(e) => {
									e.stopPropagation();
									onHideBuilding(building.ticker);
								}}
								icon={<VisibilityOffIcon fontSize="small" />}
								checkedIcon={<VisibilityIcon fontSize="small" />}
								sx={{ p: 0.5, color: theme.palette.text.secondary }}
							/>
						</Tooltip>
						<IconButton
							size="small"
							onClick={() => setExpanded(!expanded)}
							sx={{ p: 0 }}
						>
							{expanded ? (
								<KeyboardArrowUpIcon fontSize="small" />
							) : (
								<KeyboardArrowDownIcon fontSize="small" />
							)}
						</IconButton>
					</Box>
				</Box>

				<Collapse in={expanded}>
					<Box
						sx={{ p: 1, display: "flex", flexDirection: "column", gap: 0.5 }}
					>
						{building.upkeep.length > 0 ? (
							<Stack spacing={0.5}>
								{building.upkeep.map((res) => (
									<ResourceToggleRow
										key={res.ticker}
										resource={res}
										theme={theme}
										onToggle={() =>
											onToggleResource(planetId, building.id, res.ticker)
										}
									/>
								))}
							</Stack>
						) : (
							<Typography
								variant="caption"
								color="text.disabled"
								align="center"
								sx={{ py: 1 }}
							>
								No Upkeep
							</Typography>
						)}

						{building.upgradeCosts.length > 0 && (
							<Accordion
								disableGutters
								elevation={0}
								sx={{
									bgcolor: "transparent",
									"&:before": { display: "none" },
									mt: 1,
									borderTop: `1px dotted ${alpha(theme.palette.divider, 0.2)}`,
								}}
							>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
									sx={{
										minHeight: 30,
										p: 0,
										"& .MuiAccordionSummary-content": { m: 0 },
									}}
								>
									<Typography
										variant="caption"
										color="warning.main"
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 0.5,
											fontWeight: "bold",
											fontSize: "0.75rem",
										}}
									>
										<ConstructionIcon sx={{ fontSize: 14 }} /> UPGRADE COSTS
									</Typography>
								</AccordionSummary>
								<AccordionDetails sx={{ p: 0, pb: 1 }}>
									<Grid container spacing={1}>
										{building.upgradeCosts.map((cost) => (
											<Grid item xs={6} key={cost.ticker}>
												<Tooltip
													title={`Needs ${cost.amount - cost.currentAmount} more`}
												>
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															justifyContent: "space-between",
															border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
															borderRadius: 1,
															bgcolor: alpha(theme.palette.warning.main, 0.05),
															px: 1,
															py: 0.5,
														}}
													>
														<Typography
															variant="caption"
															sx={{
																fontSize: "0.75rem",
																color: theme.palette.warning.light,
																fontWeight: "bold",
															}}
														>
															{cost.ticker}
														</Typography>
														<Typography
															variant="caption"
															sx={{
																fontSize: "0.75rem",
																color: "text.secondary",
															}}
														>
															{cost.currentAmount}/{cost.amount}
														</Typography>
													</Box>
												</Tooltip>
											</Grid>
										))}
									</Grid>
								</AccordionDetails>
							</Accordion>
						)}

						{building.contributions.length > 0 && (
							<Box
								mt={1}
								pt={1}
								borderTop={`1px dotted ${alpha(theme.palette.divider, 0.2)}`}
							>
								<Typography
									variant="caption"
									color="info.main"
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 0.5,
										fontWeight: "bold",
										fontSize: "0.75rem",
										mb: 0.5,
									}}
								>
									<VolunteerActivismIcon sx={{ fontSize: 14 }} /> RECENT
									CONTRIBUTIONS
								</Typography>
								<Stack spacing={0.5}>
									{building.contributions.slice(0, 3).map((c, i) => (
										<Box
											key={i}
											display="flex"
											justifyContent="space-between"
											sx={{
												bgcolor: alpha(theme.palette.info.main, 0.05),
												px: 1,
												py: 0.25,
												borderRadius: 0.5,
											}}
										>
											<Typography
												variant="caption"
												sx={{ fontSize: "0.7rem", color: "text.secondary" }}
											>
												{c.contributorCode}
											</Typography>
											<Typography
												variant="caption"
												sx={{
													fontSize: "0.7rem",
													color: theme.palette.info.light,
												}}
											>
												+{c.amount} {c.ticker}
											</Typography>
										</Box>
									))}
								</Stack>
							</Box>
						)}
					</Box>
				</Collapse>
			</Box>
		);
	},
);

// 4. Planet Card
const PlanetCard: React.FC<{
	planet: PlanetData;
	isExpanded: boolean;
	onToggleExpand: (id: string) => void;
	onRemove: (id: string) => void;
	onToggleResource: (
		planetId: string,
		buildingId: string | null,
		ticker: string,
	) => void;
	hiddenInfra: string[];
	onToggleInfra: (ticker: string) => void;
	theme: any;
}> = React.memo(
	({
		planet,
		isExpanded,
		onToggleExpand,
		onRemove,
		onToggleResource,
		hiddenInfra,
		onToggleInfra,
		theme,
	}) => {
		const [tabValue, setTabValue] = useState(0);
		const visibleBuildings = planet.buildings.filter(
			(b) => !hiddenInfra.includes(b.ticker),
		);

		// Urgency Calculation
		let maxUrgency = 0;
		visibleBuildings.forEach((b) => {
			const status = getTickStatus(b.upkeep[0]?.nextTick);
			if (status && status.urgentLevel > maxUrgency)
				maxUrgency = status.urgentLevel;
		});

		const glowColor =
			maxUrgency === 2
				? theme.palette.error.main
				: maxUrgency === 1
					? theme.palette.warning.main
					: "transparent";
		const glowStyle =
			maxUrgency > 0
				? {
						boxShadow: `0 0 10px ${alpha(glowColor, 0.4)}`,
						border: `1px solid ${alpha(glowColor, 0.5)}`,
					}
				: {};

		const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
		const availableTypes = Array.from(
			new Set(planet.buildings.map((b) => b.ticker)),
		).sort();

		// Fallback population details if backend doesn't provide detailed breakdown yet
		const pop = planet.population || {
			pioneers: 0,
			settlers: 0,
			technicians: 0,
			engineers: 0,
			scientists: 0,
		};

		return (
			<Paper
				sx={{
					...glassyStyle(theme),
					borderRadius: 2,
					overflow: "hidden",
					mb: 2,
					...glowStyle,
				}}
			>
				{/* CARD HEADER AREA */}
				<Box sx={{ bgcolor: alpha(theme.palette.background.default, 0.6) }}>
					{/* 1. Title Row */}
					<Box
						sx={{
							p: 1,
							px: 2,
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							cursor: "pointer",
							"&:hover": {
								bgcolor: alpha(theme.palette.background.default, 0.8),
							},
						}}
						onClick={() => onToggleExpand(planet.id)}
					>
						<Box
							display="flex"
							alignItems="center"
							gap={2}
							sx={{ flexGrow: 1, overflow: "hidden" }}
						>
							<IconButton
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									onRemove(planet.id);
								}}
								sx={{ p: 0.5, color: theme.palette.text.secondary }}
							>
								<DeleteIcon fontSize="small" />
							</IconButton>
							<Typography variant="subtitle1" fontWeight="bold" noWrap>
								{planet.name}
							</Typography>
							<Chip
								label={`Pop: ${planet.population.total.toLocaleString()}`}
								size="small"
								variant="outlined"
								sx={{
									height: 20,
									fontSize: "0.7rem",
									borderColor: alpha(theme.palette.divider, 0.3),
								}}
							/>
						</Box>

						<Box display="flex" alignItems="center" gap={1}>
							<Tooltip title="Filter Infrastructure">
								<IconButton
									size="small"
									onClick={(e) => {
										e.stopPropagation();
										setFilterAnchor(e.currentTarget);
									}}
									color={
										visibleBuildings.length < planet.buildings.length
											? "primary"
											: "default"
									}
								>
									<FilterListIcon fontSize="small" />
								</IconButton>
							</Tooltip>
							<IconButton size="small">
								{isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
							</IconButton>
						</Box>
					</Box>

					{/* 2. Info Bar (Visible when Expanded) */}
					{isExpanded && (
						<Box
							sx={{
								px: 2,
								pb: 1,
								display: "flex",
								alignItems: "center",
								gap: 2,
								flexWrap: "wrap",
							}}
						>
							{/* Pop Stats */}
							<Box
								display="flex"
								gap={1}
								alignItems="center"
								sx={{ opacity: 0.8 }}
							>
								<Tooltip title="Pioneers">
									<Box display="flex" alignItems="center" gap={0.5}>
										<AgricultureIcon sx={{ fontSize: 14 }} />
										<Typography variant="caption">{pop.pioneers}</Typography>
									</Box>
								</Tooltip>
								<Tooltip title="Settlers">
									<Box display="flex" alignItems="center" gap={0.5}>
										<GroupsIcon sx={{ fontSize: 14 }} />
										<Typography variant="caption">{pop.settlers}</Typography>
									</Box>
								</Tooltip>
								<Tooltip title="Technicians">
									<Box display="flex" alignItems="center" gap={0.5}>
										<HandymanIcon sx={{ fontSize: 14 }} />
										<Typography variant="caption">{pop.technicians}</Typography>
									</Box>
								</Tooltip>
								<Tooltip title="Engineers">
									<Box display="flex" alignItems="center" gap={0.5}>
										<EngineeringIcon sx={{ fontSize: 14 }} />
										<Typography variant="caption">{pop.engineers}</Typography>
									</Box>
								</Tooltip>
								<Tooltip title="Scientists">
									<Box display="flex" alignItems="center" gap={0.5}>
										<ScienceIcon sx={{ fontSize: 14 }} />
										<Typography variant="caption">{pop.scientists}</Typography>
									</Box>
								</Tooltip>
							</Box>
							<Divider
								orientation="vertical"
								flexItem
								sx={{ height: 16, my: "auto" }}
							/>
							{/* CoGC Status */}
							<Tooltip title="CoGC Status">
								<Box
									display="flex"
									alignItems="center"
									gap={0.5}
									sx={{
										color:
											planet.cogcUpkeep.length > 0
												? theme.palette.success.main
												: theme.palette.text.disabled,
									}}
								>
									<SettingsIcon sx={{ fontSize: 14 }} />
									<Typography variant="caption" fontWeight="bold">
										{planet.cogc}
									</Typography>
								</Box>
							</Tooltip>
							<Divider
								orientation="vertical"
								flexItem
								sx={{ height: 16, my: "auto" }}
							/>
							{/* Programs */}
							<Tooltip title="Active Programs">
								<Box
									display="flex"
									alignItems="center"
									gap={0.5}
									sx={{ color: theme.palette.info.main }}
								>
									<AssignmentIcon sx={{ fontSize: 14 }} />
									<Typography variant="caption" fontWeight="bold">
										{planet.activePrograms?.length || 0}
									</Typography>
								</Box>
							</Tooltip>
						</Box>
					)}

					{/* 3. Tabs (Visible when Expanded) */}
					{isExpanded && (
						<Tabs
							value={tabValue}
							onChange={(_, v) => setTabValue(v)}
							variant="fullWidth"
							textColor="primary"
							indicatorColor="primary"
							sx={{
								minHeight: 36,
								"& .MuiTab-root": {
									minHeight: 36,
									fontSize: "0.75rem",
									py: 0.5,
								},
							}}
						>
							<Tab
								icon={<BusinessIcon sx={{ fontSize: 16 }} />}
								iconPosition="start"
								label="Infra"
							/>
							<Tab
								icon={<PeopleIcon sx={{ fontSize: 16 }} />}
								iconPosition="start"
								label="Pop"
							/>
							<Tab
								icon={<SettingsIcon sx={{ fontSize: 16 }} />}
								iconPosition="start"
								label="CoGC"
							/>
							<Tab
								icon={<AssignmentIcon sx={{ fontSize: 16 }} />}
								iconPosition="start"
								label="Programs"
							/>
						</Tabs>
					)}
				</Box>

				{/* Filter Menu Popover */}
				<Popover
					open={Boolean(filterAnchor)}
					anchorEl={filterAnchor}
					onClose={(e) => {
						e?.stopPropagation();
						setFilterAnchor(null);
					}}
					anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
					transformOrigin={{ vertical: "top", horizontal: "right" }}
					PaperProps={{
						sx: {
							bgcolor: theme.palette.background.default,
							backgroundImage: "none",
							border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						},
					}}
				>
					<Box sx={{ p: 2, minWidth: 200 }}>
						<Typography variant="subtitle2" fontWeight="bold" mb={1}>
							Visible Infrastructure
						</Typography>
						<FormGroup>
							{availableTypes.map((ticker) => (
								<FormControlLabel
									key={ticker}
									control={
										<Checkbox
											size="small"
											checked={!hiddenInfra.includes(ticker)}
											onChange={() => onToggleInfra(ticker)}
										/>
									}
									label={<Typography variant="body2">{ticker}</Typography>}
								/>
							))}
						</FormGroup>
					</Box>
				</Popover>

				<Collapse in={isExpanded}>
					<CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
						{/* TAB CONTENT */}

						{/* 1. Infrastructure Tab */}
						{tabValue === 0 && (
							<Box
								sx={{
									maxHeight: "600px",
									overflowY: "auto",
									pr: 0.5,
									height: "auto",
								}}
							>
								<Box
									sx={{
										display: "grid",
										gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
										gap: 1,
									}}
								>
									{visibleBuildings.map((b) => (
										<BuildingCard
											key={b.id}
											building={b}
											planetId={planet.id}
											onToggleResource={onToggleResource}
											onHideBuilding={onToggleInfra}
											theme={theme}
										/>
									))}
								</Box>
							</Box>
						)}

						{/* 2. Population Tab */}
						{tabValue === 1 && (
							<Box sx={{ p: 2, textAlign: "center" }}>
								<Typography variant="body2" color="text.secondary">
									Detailed population report coming soon.
								</Typography>
							</Box>
						)}

						{/* 3. CoGC Tab */}
						{tabValue === 2 && (
							<Box sx={{ p: 1 }}>
								{planet.cogcUpkeep.length > 0 ? (
									<Box
										sx={{
											p: 1,
											border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
											borderRadius: 2,
											bgcolor: alpha(theme.palette.background.default, 0.3),
										}}
									>
										<Typography
											variant="caption"
											color="secondary"
											sx={{
												mb: 1,
												display: "flex",
												alignItems: "center",
												gap: 0.5,
												fontWeight: "bold",
											}}
										>
											<SettingsIcon sx={{ fontSize: 14 }} /> ACTIVE UPKEEP
										</Typography>
										{planet.cogcUpkeep.map((res) => (
											<ResourceToggleRow
												key={res.ticker}
												resource={res}
												theme={theme}
												onToggle={() =>
													onToggleResource(planet.id, null, res.ticker)
												}
											/>
										))}
									</Box>
								) : (
									<Typography
										variant="body2"
										color="text.secondary"
										align="center"
										sx={{ py: 2 }}
									>
										No Active CoGC
									</Typography>
								)}
							</Box>
						)}

						{/* 4. Programs Tab */}
						{tabValue === 3 && (
							<Box sx={{ p: 2 }}>
								{planet.activePrograms && planet.activePrograms.length > 0 ? (
									<Stack spacing={1}>
										{planet.activePrograms.map((prog, i) => (
											<Chip
												key={i}
												label={prog}
												icon={<AssignmentIcon />}
												size="small"
												sx={{ justifyContent: "flex-start" }}
											/>
										))}
									</Stack>
								) : (
									<Typography
										variant="body2"
										color="text.secondary"
										align="center"
									>
										No Active Programs
									</Typography>
								)}
							</Box>
						)}
					</CardContent>
				</Collapse>
			</Paper>
		);
	},
);

// --- MAIN COMPONENT ---

const Governance = () => {
	const theme = useTheme();

	// State
	const [planetsData, setPlanetsData] = useState<PlanetData[]>([]);
	const [expandedPlanets, setExpandedPlanets] = useState<
		Record<string, boolean>
	>({});
	const [allPlanetsList, setAllPlanetsList] = useState<PlanetNameItem[]>([]);
	const [selectedPlanetIds, setSelectedPlanetIds] = useState<string[]>(() => {
		try {
			return JSON.parse(localStorage.getItem("governance_planet_ids") || "[]");
		} catch {
			return [];
		}
	});

	const [planetFilters, setPlanetFilters] = useState<Record<string, string[]>>(
		() => {
			try {
				return JSON.parse(
					localStorage.getItem("governance_planet_filters") || "{}",
				);
			} catch {
				return {};
			}
		},
	);

	const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
	const [isPlanetsLoading, setIsPlanetsLoading] = useState(false);
	const [isDataLoading, setIsDataLoading] = useState(false);

	useEffect(() => {
		localStorage.setItem(
			"governance_planet_ids",
			JSON.stringify(selectedPlanetIds),
		);
	}, [selectedPlanetIds]);
	useEffect(() => {
		localStorage.setItem(
			"governance_planet_filters",
			JSON.stringify(planetFilters),
		);
	}, [planetFilters]);

	useEffect(() => {
		const fetchPlanetNames = async () => {
			setIsPlanetsLoading(true);
			try {
				const res = await fetch(
					"https://api.punoted.net/planets/planets_names",
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("authToken")}`,
						},
					},
				);
				if (Array.isArray(await res.clone().json()))
					setAllPlanetsList(await res.json());
				else {
					const d = await res.json();
					setAllPlanetsList(d.data || []);
				}
			} catch {
				setAllPlanetsList([]);
			} finally {
				setIsPlanetsLoading(false);
			}
		};
		fetchPlanetNames();
	}, []);

	const fetchGovernanceData = useCallback(
		async (ids: string[]) => {
			if (ids.length === 0) {
				setPlanetsData([]);
				return;
			}
			setIsDataLoading(true);
			try {
				const res = await fetch("https://api.punoted.net/governance/", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
					body: JSON.stringify({ planet_ids: ids }),
				});
				const json = await res.json();
				if (json.status === "success") {
					setPlanetsData((prev) =>
						json.data.map((newP: any) => {
							const oldP = prev.find((p) => p.id === newP.id);
							return {
								...newP,
								buildings: newP.buildings.map((newB: any) => {
									const oldB = oldP?.buildings.find((b) => b.id === newB.id);
									return {
										...newB,
										upkeep: newB.upkeep.map((newU: any) => ({
											...newU,
											enabled:
												oldB?.upkeep.find((u) => u.ticker === newU.ticker)
													?.enabled ?? true,
										})),
									};
								}),
								cogcUpkeep: newP.cogcUpkeep.map((newC: any) => ({
									...newC,
									enabled:
										oldP?.cogcUpkeep.find((c) => c.ticker === newC.ticker)
											?.enabled ?? true,
								})),
							};
						}),
					);
					const newExpands: Record<string, boolean> = {};
					json.data.forEach((p: any) => {
						if (expandedPlanets[p.id] === undefined) newExpands[p.id] = true;
					});
					if (Object.keys(newExpands).length > 0)
						setExpandedPlanets((prev) => ({ ...prev, ...newExpands }));
				}
			} catch {
			} finally {
				setIsDataLoading(false);
			}
		},
		[expandedPlanets],
	);

	useEffect(() => {
		fetchGovernanceData(selectedPlanetIds);
	}, [selectedPlanetIds]);

	const handleAddPlanet = (_: any, val: PlanetNameItem | null) => {
		if (val && !selectedPlanetIds.includes(val.planetid))
			setSelectedPlanetIds((prev) => [...prev, val.planetid]);
	};
	const handleRemovePlanet = (id: string) =>
		setSelectedPlanetIds((prev) => prev.filter((pid) => pid !== id));

	const handleToggleResource = useCallback(
		(pId: string, bId: string | null, ticker: string) => {
			setPlanetsData((prev) =>
				prev.map((p) => {
					if (p.id !== pId) return p;
					if (bId === null)
						return {
							...p,
							cogcUpkeep: p.cogcUpkeep.map((r) =>
								r.ticker === ticker
									? { ...r, enabled: r.enabled === false ? true : false }
									: r,
							),
						};
					return {
						...p,
						buildings: p.buildings.map((b) =>
							b.id !== bId
								? b
								: {
										...b,
										upkeep: b.upkeep.map((r) =>
											r.ticker === ticker
												? { ...r, enabled: r.enabled === false ? true : false }
												: r,
										),
									},
						),
					};
				}),
			);
		},
		[],
	);

	const handleToggleInfraFilter = useCallback(
		(planetId: string, ticker: string) => {
			setPlanetFilters((prev) => {
				const hidden = prev[planetId] || [];
				return {
					...prev,
					[planetId]: hidden.includes(ticker)
						? hidden.filter((t) => t !== ticker)
						: [...hidden, ticker],
				};
			});
		},
		[],
	);

	const { globalTotals, planetBreakdown } = useMemo(() => {
		const gTotals: Record<string, number> = {};
		const pBreakdown: Record<string, Record<string, number>> = {};
		planetsData.forEach((p) => {
			const pTotals: Record<string, number> = {};
			const hidden = planetFilters[p.id] || [];
			p.buildings.forEach((b) => {
				if (!hidden.includes(b.ticker)) {
					b.upkeep.forEach((r) => {
						if (r.enabled !== false) {
							const needed = Math.max(
								0,
								r.amount * DAYS_TO_SUPPLY - (r.stored || 0),
							);
							if (needed > 0) {
								pTotals[r.ticker] = (pTotals[r.ticker] || 0) + needed;
								gTotals[r.ticker] = (gTotals[r.ticker] || 0) + needed;
							}
						}
					});
				}
			});
			p.cogcUpkeep.forEach((r) => {
				if (r.enabled !== false) {
					const needed = Math.max(
						0,
						r.amount * DAYS_TO_SUPPLY - (r.stored || 0),
					);
					if (needed > 0) {
						pTotals[r.ticker] = (pTotals[r.ticker] || 0) + needed;
						gTotals[r.ticker] = (gTotals[r.ticker] || 0) + needed;
					}
				}
			});
			pBreakdown[p.name] = pTotals;
		});
		return { globalTotals: gTotals, planetBreakdown: pBreakdown };
	}, [planetsData, planetFilters]);

	const handleCopy = () => {
		const text = Object.entries(globalTotals)
			.map(([k, v]) => `${k}: ${v}`)
			.join("\n");
		console.log(text);
		alert("Shopping List copied to console (Clipboard API pending HTTPS)");
	};

	return (
		<Box
			sx={{
				height: "100dvh",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				p: 1,
				gap: 1,
			}}
		>
			<Paper
				sx={{ ...glassyStyle(theme), p: 1, flexShrink: 0, borderRadius: 1 }}
			>
				<Grid container spacing={1} alignItems="center">
					<Grid
						item
						xs={12}
						md={4}
						display="flex"
						alignItems="center"
						gap={1.5}
					>
						<PublicIcon color="primary" />
						<Box>
							<Typography
								variant="subtitle1"
								fontWeight="bold"
								lineHeight={1.2}
							>
								Governance
							</Typography>
							<Typography variant="caption" color="text.secondary">
								Upkeep Omnibus
							</Typography>
						</Box>
					</Grid>
					<Grid
						item
						xs={12}
						md={8}
						display="flex"
						gap={1}
						justifyContent="flex-end"
						alignItems="center"
					>
						<Autocomplete
							options={allPlanetsList}
							getOptionLabel={(option) => option.name || option.naturalid}
							loading={isPlanetsLoading}
							onChange={handleAddPlanet}
							style={{ width: 220 }}
							size="small"
							renderInput={(params) => (
								<TextField
									{...params}
									placeholder="Add Planet..."
									variant="outlined"
									InputProps={{
										...params.InputProps,
										style: { fontSize: "0.85rem" },
										startAdornment: (
											<AddCircleOutlineIcon
												color="action"
												fontSize="small"
												sx={{ mr: 0.5 }}
											/>
										),
										endAdornment: (
											<>
												{" "}
												{isPlanetsLoading ? (
													<CircularProgress color="inherit" size={16} />
												) : null}{" "}
												{params.InputProps.endAdornment}{" "}
											</>
										),
									}}
									sx={{ ...glassyStyle(theme), borderRadius: 1 }}
								/>
							)}
						/>
						<Button
							variant="contained"
							size="small"
							color="primary"
							startIcon={<ShoppingCartIcon />}
							onClick={() => setIsShoppingListOpen(true)}
							sx={{ height: 36 }}
						>
							Shopping List
						</Button>
						<Tooltip title="Reset Data">
							<IconButton
								size="small"
								onClick={() => setSelectedPlanetIds([])}
								sx={{
									border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
									borderRadius: 1,
									height: 36,
									width: 36,
								}}
							>
								<RefreshIcon fontSize="small" />
							</IconButton>
						</Tooltip>
					</Grid>
				</Grid>
			</Paper>

			<Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
				{isDataLoading && planetsData.length === 0 ? (
					<Box display="flex" justifyContent="center" p={4}>
						<CircularProgress />
					</Box>
				) : (
					<Masonry columns={{ xs: 1, md: 2, lg: 3 }} spacing={2}>
						{planetsData.map((planet) => (
							<PlanetCard
								key={planet.id}
								planet={planet}
								isExpanded={!!expandedPlanets[planet.id]}
								onToggleExpand={(id) =>
									setExpandedPlanets((prev) => ({ ...prev, [id]: !prev[id] }))
								}
								onRemove={handleRemovePlanet}
								onToggleResource={handleToggleResource}
								hiddenInfra={planetFilters[planet.id] || []}
								onToggleInfra={(ticker) =>
									handleToggleInfraFilter(planet.id, ticker)
								}
								theme={theme}
							/>
						))}
					</Masonry>
				)}
				{planetsData.length === 0 && !isDataLoading && (
					<Alert severity="info" sx={{ mx: "auto", width: "fit-content" }}>
						No planets selected.
					</Alert>
				)}
			</Box>

			<Dialog
				open={isShoppingListOpen}
				onClose={() => setIsShoppingListOpen(false)}
				maxWidth="md"
				fullWidth
				PaperProps={{
					sx: {
						...glassyStyle(theme),
						backdropFilter: "blur(20px)",
						borderRadius: 2,
					},
				}}
			>
				<DialogTitle
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						pb: 1,
					}}
				>
					<Box display="flex" alignItems="center" gap={1}>
						<ShoppingCartIcon />
						<Typography variant="h6" fontWeight="bold">
							Shopping List
						</Typography>
					</Box>
					<IconButton onClick={() => setIsShoppingListOpen(false)}>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent
					dividers
					sx={{
						borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						p: 0,
					}}
				>
					<ShoppingListContent
						totals={globalTotals}
						planetBreakdown={planetBreakdown}
						onCopy={handleCopy}
						theme={theme}
					/>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button onClick={() => setIsShoppingListOpen(false)} color="inherit">
						Close
					</Button>
					<Button
						variant="contained"
						onClick={handleCopy}
						startIcon={<ContentCopyIcon />}
					>
						Copy to Clipboard
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default Governance;
