import React, { useMemo, useState, useRef, useCallback } from "react";
import {
	Box,
	Paper,
	Typography,
	IconButton,
	InputBase,
	ListItem,
	ListItemText,
	Tooltip,
	useTheme,
	alpha,
	useMediaQuery,
	Tabs,
	Tab,
	GlobalStyles,
} from "@mui/material";
import {
	Search as SearchIcon,
	ExpandLess,
	ExpandMore,
	MyLocation,
	Visibility,
	VisibilityOff,
	Timeline,
	Inventory2,
	ArrowForward,
	LocalShipping,
	Business,
	Sailing,
	Close,
} from "@mui/icons-material";
import { Virtuoso } from "react-virtuoso";
import type { AnimatedShipData } from "../types/mapTypes";
import { formatDistanceToNowStrict } from "date-fns";

// --- ASSETS ---
import lcb from "../../../../assets/ships/LCB.png";
import wcb from "../../../../assets/ships/WCB.png";
import vcb from "../../../../assets/ships/VCB.png";
import hcb from "../../../../assets/ships/HCB.png";

// --- TYPES ---
interface ShipListComponentProps {
	ownShips: AnimatedShipData[];
	corpShips: Record<string, AnimatedShipData[]>;
	onSelectPosition: (id: string) => void;
	visibleCorpGroups: Record<string, boolean>;
	onGroupVisibilityChange: (group: string) => void;
	expandedCorpGroups: Record<string, boolean>;
	onToggleCorpGroup: (group: string) => void;
	searchResultsVisible: boolean;
	visiblePathShipIds: Set<string>;
	onTogglePath: (id: string) => void;
	onToggleAllPaths: (ids: string[], visible: boolean) => void;
	onToggleAllCorpVisibility: (groups: string[], visible: boolean) => void;
	selectedShipId: string | null;
	ownShipsVisible: boolean; // NEW
	onToggleOwnVisibility: () => void; // NEW
}

type CorpListItem =
	| {
			type: "GROUP_HEADER";
			name: string;
			count: number;
			expanded: boolean;
			visible: boolean;
			shipIds: string[];
	  }
	| { type: "SHIP"; data: AnimatedShipData };

// --- ICON HELPER (Cached) ---
const iconStyle: React.CSSProperties = {
	width: "100%",
	height: "100%",
	objectFit: "contain",
	imageRendering: "-webkit-optimize-contrast" as any,
};
const getShipIcon = (type: string | undefined) => {
	if (!type) return <LocalShipping sx={{ fontSize: 24 }} />;
	const t = type.toUpperCase();
	if (t === "LCB") return <img src={lcb} alt="LCB" style={iconStyle} />;
	if (t === "WCB") return <img src={wcb} alt="WCB" style={iconStyle} />;
	if (t === "VCB") return <img src={vcb} alt="VCB" style={iconStyle} />;
	if (t === "HCB") return <img src={hcb} alt="HCB" style={iconStyle} />;
	return <LocalShipping sx={{ fontSize: 24 }} />;
};

// --- CSS KEYFRAMES FOR GPU ANIMATION ---
const GlobalProgressKeyframes = () => (
	<GlobalStyles
		styles={{
			"@keyframes growProgress": {
				"0%": { transform: "scaleX(0)" },
				"100%": { transform: "scaleX(1)" },
			},
		}}
	/>
);

// --- ZERO-CPU FLIGHT STATUS ---
const ShipFlightStatus = React.memo(
	({ ship, isMine }: { ship: AnimatedShipData; isMine: boolean }) => {
		const theme = useTheme();
		const activeFlight: any = ship.plan || (ship as any).flight;

		// Logic: Calculate purely static values.
		// We let CSS handle the movement via 'animation-delay' (negative value = fast forward)
		const start = activeFlight?.arrivaltimestamp;
		const end = activeFlight?.departuretimestamp;

		if (!start || !end) return null;

		const now = Date.now();
		const totalDuration = end - start;
		const elapsed = now - start;
		const isArrived = now >= end;

		const originName = activeFlight.origin || "Unknown";
		const destName =
			activeFlight.departure || activeFlight.destination || "Unknown";
		const etaText = isArrived
			? "Arrived"
			: formatDistanceToNowStrict(end, { addSuffix: true });

		// CSS GPU Animation Config
		const barStyle = isArrived
			? {
					transform: "scaleX(1)", // Static full
					backgroundColor: isMine
						? theme.palette.primary.main
						: theme.palette.secondary.main,
				}
			: {
					animationName: "growProgress",
					animationDuration: `${totalDuration}ms`,
					animationTimingFunction: "linear",
					animationFillMode: "forwards",
					animationDelay: `-${elapsed}ms`, // Fast forward to current time
					backgroundColor: isMine
						? theme.palette.primary.main
						: theme.palette.secondary.main,
				};

		return (
			<Box sx={{ width: "100%", mt: 0.5 }}>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						mb: 0.2,
					}}
				>
					<Typography
						variant="caption"
						noWrap
						sx={{
							color: theme.palette.text.secondary,
							fontSize: "0.7rem",
							maxWidth: "45%",
						}}
					>
						{originName}
					</Typography>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							flex: 1,
							justifyContent: "center",
							px: 0.5,
						}}
					>
						<ArrowForward
							sx={{ fontSize: 10, color: theme.palette.text.disabled }}
						/>
					</Box>
					<Typography
						variant="caption"
						noWrap
						sx={{
							color: theme.palette.text.secondary,
							fontSize: "0.7rem",
							textAlign: "right",
							maxWidth: "45%",
						}}
					>
						{destName}
					</Typography>
				</Box>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Box
						sx={{
							flex: 1,
							height: 3,
							borderRadius: 1.5,
							bgcolor: alpha(theme.palette.common.white, 0.1),
							overflow: "hidden",
							position: "relative",
						}}
					>
						<div
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								height: "100%",
								width: "100%",
								transformOrigin: "left center",
								willChange: "transform",
								...barStyle,
							}}
						/>
					</Box>
					<Typography
						variant="caption"
						sx={{
							color: theme.palette.success.main,
							fontWeight: 700,
							fontSize: "0.65rem",
							minWidth: "40px",
							textAlign: "right",
						}}
					>
						{etaText}
					</Typography>
				</Box>
			</Box>
		);
	},
	(prev, next) => {
		// Only re-render if flight object identity changes (new plan)
		// We ignore 'progress' updates because CSS handles it
		return prev.ship.plan === next.ship.plan && prev.isMine === next.isMine;
	},
);

// --- SHIP ROW ---
const ShipRow = React.memo(
	({
		ship,
		onSelect,
		isMine,
		isPathVisible,
		onTogglePath,
		isSelected,
		indentation = 0,
	}: any) => {
		const theme = useTheme();
		const hasPlan = !!(ship.plan || ship.flight);
		const cargo = (ship as any).cargo;

		const getCargoColor = (current: number, max: number) => {
			const ratio = current / (max || 1);
			if (ratio > 0.9) return theme.palette.error.main;
			if (ratio > 0.7) return theme.palette.warning.main;
			return theme.palette.text.secondary;
		};

		return (
			<ListItem
				component="div"
				disablePadding
				button
				onClick={() => onSelect(ship.id)}
				sx={{
					flexDirection: "column",
					alignItems: "stretch",
					borderBottom: `1px solid ${theme.palette.divider}`,
					background: alpha(theme.palette.background.default, 0.4),
					backdropFilter: "blur(4px)",
					py: 0.75,
					px: 1.5,
					minHeight: 48,
					bgcolor: isSelected
						? alpha(theme.palette.primary.main, 0.25)
						: alpha(theme.palette.background.default, 0.4),
					borderLeft: isSelected
						? `4px solid ${theme.palette.secondary.main}`
						: `4px solid transparent`,
					"&:hover": {
						bgcolor: isSelected
							? alpha(theme.palette.primary.main, 0.35)
							: alpha(theme.palette.action.hover, 0.1),
					},
					pl: 1.5 + indentation,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
					<Box
						sx={{
							mr: 1.5,
							p: 0,
							borderRadius: 1,
							bgcolor: isMine
								? alpha(theme.palette.primary.main, 0.1)
								: alpha(theme.palette.secondary.main, 0.1),
							color: isMine
								? theme.palette.primary.main
								: theme.palette.secondary.main,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: 40,
							height: 40,
							flexShrink: 0,
						}}
					>
						{getShipIcon(ship.type)}
					</Box>
					<Box sx={{ flex: 1, overflow: "hidden", mr: 1 }}>
						<Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
							<Tooltip
								title={ship.name || ship.registration}
								placement="top"
								arrow
							>
								<Typography
									variant="body2"
									noWrap
									sx={{
										fontWeight: 600,
										color: theme.palette.text.primary,
										fontSize: "0.8rem",
										mr: 1,
									}}
								>
									{ship.name || ship.registration}
								</Typography>
							</Tooltip>
							<Typography
								variant="caption"
								sx={{
									color: theme.palette.text.secondary,
									fontSize: "0.65rem",
									opacity: 0.8,
								}}
							>
								{ship.type}
							</Typography>
						</Box>
						{!isMine && (
							<Typography
								variant="caption"
								noWrap
								sx={{
									color: theme.palette.secondary.main,
									fontSize: "0.65rem",
									display: "block",
								}}
							>
								{ship.ship_owner_display_name}
							</Typography>
						)}
					</Box>
					<Box
						onClick={(e) => e.stopPropagation()}
						sx={{ display: "flex", alignItems: "center" }}
					>
						{hasPlan && (
							<Tooltip title={isPathVisible ? "Hide Path" : "Show Path"}>
								<IconButton
									size="small"
									onClick={() => onTogglePath(ship.id)}
									sx={{
										p: 0.5,
										color: isPathVisible
											? theme.palette.secondary.main
											: theme.palette.action.disabled,
									}}
								>
									<Timeline sx={{ fontSize: 16 }} />
								</IconButton>
							</Tooltip>
						)}
						<Tooltip title="Locate">
							<IconButton
								size="small"
								onClick={() => onSelect(ship.id)}
								sx={{ p: 0.5 }}
							>
								<MyLocation sx={{ fontSize: 16, opacity: 0.7 }} />
							</IconButton>
						</Tooltip>
					</Box>
				</Box>
				<ShipFlightStatus ship={ship} isMine={isMine} />
				{isMine && cargo && (
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							mt: 0.5,
							width: "100%",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center" }}>
							<Inventory2
								sx={{
									fontSize: 10,
									color: theme.palette.action.disabled,
									mr: 0.5,
								}}
							/>
							<Typography
								variant="caption"
								sx={{
									color: getCargoColor(cargo.currentvolume, cargo.maxvolume),
									fontSize: "0.65rem",
								}}
							>
								{cargo.currentvolume}{" "}
								<span style={{ color: theme.palette.text.disabled }}>/</span>{" "}
								{cargo.maxvolume} m³
							</Typography>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center" }}>
							<Typography
								variant="caption"
								sx={{
									color: getCargoColor(cargo.currentweight, cargo.maxweight),
									fontSize: "0.65rem",
								}}
							>
								{cargo.currentweight}{" "}
								<span style={{ color: theme.palette.text.disabled }}>/</span>{" "}
								{cargo.maxweight} t
							</Typography>
						</Box>
					</Box>
				)}
			</ListItem>
		);
	},
	(prev, next) => {
		return (
			prev.ship.id === next.ship.id &&
			prev.isSelected === next.isSelected &&
			prev.isPathVisible === next.isPathVisible &&
			prev.ship.plan === next.ship.plan
		);
	},
);

// --- MAIN LIST COMPONENT ---
const ShipListComponent: React.FC<ShipListComponentProps> = ({
	ownShips,
	corpShips,
	onSelectPosition,
	visibleCorpGroups,
	onGroupVisibilityChange,
	expandedCorpGroups,
	onToggleCorpGroup,
	searchResultsVisible,
	visiblePathShipIds,
	onTogglePath,
	onToggleAllPaths,
	onToggleAllCorpVisibility,
	selectedShipId,
	ownShipsVisible,
	onToggleOwnVisibility,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const [searchTerm, setSearchTerm] = useState("");
	const [isMinimized, setIsMinimized] = useState(false);

	// Toggle States
	const [myShipsExpanded, setMyShipsExpanded] = useState(true);
	const [corpFleetsExpanded, setCorpFleetsExpanded] = useState(true);
	const [mobileTab, setMobileTab] = useState(0);

	// --- DATA PREP ---
	const lowerSearch = searchTerm.toLowerCase();

	const filteredOwn = useMemo(() => {
		if (!lowerSearch) return ownShips;
		return ownShips.filter(
			(s) =>
				s.name?.toLowerCase().includes(lowerSearch) ||
				s.registration?.toLowerCase().includes(lowerSearch),
		);
	}, [ownShips, lowerSearch]);

	const flattenedCorpData = useMemo(() => {
		const data: CorpListItem[] = [];
		Object.entries(corpShips).forEach(([groupName, ships]) => {
			const matches = lowerSearch
				? ships.filter(
						(s) =>
							s.name?.toLowerCase().includes(lowerSearch) ||
							s.registration?.toLowerCase().includes(lowerSearch) ||
							groupName.toLowerCase().includes(lowerSearch),
					)
				: ships;

			if (matches.length > 0) {
				const isExpanded = isMobile ? true : !!expandedCorpGroups[groupName];
				data.push({
					type: "GROUP_HEADER",
					name: groupName,
					count: matches.length,
					expanded: isExpanded,
					visible: !!visibleCorpGroups[groupName],
					shipIds: matches.map((s) => s.id),
				});
				if (isExpanded) {
					for (const ship of matches) data.push({ type: "SHIP", data: ship });
				}
			}
		});
		return data;
	}, [corpShips, lowerSearch, expandedCorpGroups, visibleCorpGroups, isMobile]);

	// Counts
	const corpMemberCount = Object.keys(corpShips).length;
	const corpTotalShips = Object.values(corpShips).flat().length;

	// Derived States
	const allOwnPathsVisible = useMemo(
		() =>
			filteredOwn.length > 0 &&
			filteredOwn.every((s) => visiblePathShipIds.has(s.id)),
		[filteredOwn, visiblePathShipIds],
	);
	const allCorpVisible = useMemo(() => {
		const groups = Object.keys(corpShips);
		return (
			groups.length > 0 && groups.every((g) => visibleCorpGroups[g] === true)
		);
	}, [corpShips, visibleCorpGroups]);
	const allCorpPathsVisible = useMemo(() => {
		const allCorpShips = Object.values(corpShips).flat();
		return (
			allCorpShips.length > 0 &&
			allCorpShips.every((s) => visiblePathShipIds.has(s.id))
		);
	}, [corpShips, visiblePathShipIds]);

	// --- RENDERERS ---
	const renderOwnShipRow = useCallback(
		(index: number, ship: AnimatedShipData) => (
			<ShipRow
				ship={ship}
				onSelect={onSelectPosition}
				isMine={true}
				isPathVisible={visiblePathShipIds.has(ship.id)}
				onTogglePath={onTogglePath}
				isSelected={ship.id === selectedShipId}
			/>
		),
		[onSelectPosition, visiblePathShipIds, onTogglePath, selectedShipId],
	);

	const renderCorpRow = useCallback(
		(index: number, item: CorpListItem) => {
			if (item.type === "GROUP_HEADER") {
				const allGroupPaths = item.shipIds.every((id) =>
					visiblePathShipIds.has(id),
				);
				return (
					<ListItem
						button
						onClick={() => onToggleCorpGroup(item.name)}
						sx={{
							bgcolor: alpha(theme.palette.background.default, 0.6),
							py: 0.5,
							px: 1.5,
							minHeight: 36,
						}}
					>
						<IconButton
							size="small"
							onClick={(e) => {
								e.stopPropagation();
								onGroupVisibilityChange(item.name);
							}}
							sx={{
								mr: 1,
								p: 0.2,
								color: item.visible
									? theme.palette.primary.main
									: theme.palette.action.disabled,
							}}
						>
							{item.visible ? (
								<Visibility sx={{ fontSize: 16 }} />
							) : (
								<VisibilityOff sx={{ fontSize: 16 }} />
							)}
						</IconButton>
						<ListItemText
							primary={item.name}
							secondary={`${item.count} ships`}
							primaryTypographyProps={{
								variant: "body2",
								noWrap: true,
								fontSize: "0.75rem",
							}}
							secondaryTypographyProps={{
								variant: "caption",
								fontSize: "0.7rem",
							}}
							sx={{ my: 0 }}
						/>
						<Box
							onClick={(e) => e.stopPropagation()}
							sx={{ display: "flex", alignItems: "center" }}
						>
							<Tooltip
								title={allGroupPaths ? "Hide Group Paths" : "Show Group Paths"}
							>
								<IconButton
									size="small"
									onClick={() => onToggleAllPaths(item.shipIds, !allGroupPaths)}
									sx={{
										color: allGroupPaths
											? theme.palette.secondary.main
											: theme.palette.action.disabled,
										mr: 1,
										p: 0.2,
									}}
								>
									<Timeline sx={{ fontSize: 16 }} />
								</IconButton>
							</Tooltip>
							{item.expanded ? (
								<ExpandLess sx={{ color: theme.palette.action.disabled }} />
							) : (
								<ExpandMore sx={{ color: theme.palette.action.disabled }} />
							)}
						</Box>
					</ListItem>
				);
			} else {
				return (
					<ShipRow
						ship={item.data}
						onSelect={onSelectPosition}
						isMine={false}
						isPathVisible={visiblePathShipIds.has(item.data.id)}
						onTogglePath={onTogglePath}
						isSelected={item.data.id === selectedShipId}
						indentation={2}
					/>
				);
			}
		},
		[
			theme,
			visiblePathShipIds,
			selectedShipId,
			onToggleCorpGroup,
			onGroupVisibilityChange,
			onToggleAllPaths,
			onTogglePath,
			onSelectPosition,
		],
	);

	if (searchResultsVisible) return null;

	if (isMinimized) {
		return (
			<Paper
				elevation={6}
				sx={{
					position: isMobile ? "fixed" : "absolute",
					top: isMobile ? "auto" : "10vh",
					bottom: isMobile ? 80 : "auto",
					right: isMobile ? 20 : "auto",
					left: isMobile ? "auto" : 20,
					zIndex: 10,
					bgcolor: alpha(theme.palette.background.default, 0.9),
					borderRadius: "50%",
					width: 56,
					height: 56,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<IconButton onClick={() => setIsMinimized(false)} color="primary">
					<Sailing />
				</IconButton>
			</Paper>
		);
	}

	const containerStyle = isMobile
		? {
				position: "fixed",
				bottom: 0,
				left: 0,
				right: 0,
				width: "100%",
				maxHeight: "50dvh",
				borderRadius: "16px 16px 0 0",
			}
		: {
				position: "absolute",
				top: "10vh",
				left: 20,
				width: 320,
				height: "80vh",
				borderRadius: 2,
			};

	return (
		<>
			<GlobalProgressKeyframes />
			<Paper
				elevation={6}
				sx={{
					...containerStyle,
					display: "flex",
					flexDirection: "column",
					bgcolor: alpha(theme.palette.background.default, 0.85),
					backdropFilter: "blur(16px)",
					border: `1px solid ${theme.palette.divider}`,
					color: theme.palette.text.primary,
					zIndex: 10,
					overflow: "hidden",
				}}
			>
				{/* HEADER */}
				<Box
					sx={{
						p: 1.5,
						borderBottom: `1px solid ${theme.palette.divider}`,
						bgcolor: alpha(theme.palette.background.default, 0.4),
						flexShrink: 0,
					}}
				>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 1,
						}}
					>
						{!isMobile && (
							<Typography
								variant="overline"
								sx={{ fontWeight: 700, color: theme.palette.primary.main }}
							>
								FLEET
							</Typography>
						)}
						<IconButton
							size="small"
							onClick={() => setIsMinimized(true)}
							sx={{ ml: "auto" }}
						>
							<Close fontSize="small" />
						</IconButton>
					</Box>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							bgcolor: alpha(theme.palette.background.default, 0.3),
							borderRadius: 1,
							px: 1,
							py: 0.25,
						}}
					>
						<SearchIcon
							sx={{ color: theme.palette.text.disabled, mr: 1, fontSize: 18 }}
						/>
						<InputBase
							placeholder="Search fleets..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							sx={{
								color: theme.palette.text.primary,
								flex: 1,
								fontSize: "0.8rem",
							}}
						/>
					</Box>
				</Box>

				{isMobile && (
					<Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
						<Tabs
							value={mobileTab}
							onChange={(_, v) => setMobileTab(v)}
							variant="fullWidth"
							indicatorColor="primary"
							textColor="primary"
							sx={{ minHeight: 40 }}
						>
							<Tab
								icon={<Sailing fontSize="small" />}
								iconPosition="start"
								label={`MY SHIPS`}
								sx={{ minHeight: 40, py: 0 }}
							/>
							<Tab
								icon={<Business fontSize="small" />}
								iconPosition="start"
								label={`CORP`}
								sx={{ minHeight: 40, py: 0 }}
							/>
						</Tabs>
					</Box>
				)}

				{/* CONTENT AREA - FLEXBOX LAYOUT (AUTO HANDLES SIZING) */}
				<Box
					sx={{
						flex: 1,
						overflow: "hidden",
						display: "flex",
						flexDirection: "column",
					}}
				>
					{/* 1. MY SHIPS */}
					{(!isMobile || mobileTab === 0) && (
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								flex: myShipsExpanded ? 1 : 0,
								minHeight: "48px",
								transition: "flex 0.3s ease",
								borderBottom: isMobile
									? "none"
									: `1px solid ${theme.palette.divider}`,
								overflow: "hidden",
							}}
						>
							<ListItem
								button
								onClick={() => setMyShipsExpanded(!myShipsExpanded)}
								sx={{
									bgcolor: alpha(theme.palette.primary.main, 0.08),
									py: 0.5,
									px: 1.5,
									height: "48px",
									flexShrink: 0,
								}}
							>
								<ListItemText
									primary="MY SHIPS"
									secondary={`${filteredOwn.length} ships`}
									primaryTypographyProps={{
										variant: "subtitle2",
										color: theme.palette.primary.main,
										fontWeight: 600,
										fontSize: "0.8rem",
									}}
									secondaryTypographyProps={{
										variant: "caption",
										color: alpha(theme.palette.primary.main, 0.7),
									}}
									sx={{ my: 0 }}
								/>

								<Box
									onClick={(e) => e.stopPropagation()}
									sx={{ display: "flex", alignItems: "center" }}
								>
									<Tooltip
										title={
											allOwnPathsVisible ? "Hide All Paths" : "Show All Paths"
										}
									>
										<IconButton
											size="small"
											onClick={() =>
												onToggleAllPaths(
													ownShips.map((s) => s.id),
													!allOwnPathsVisible,
												)
											}
											sx={{
												color: allOwnPathsVisible
													? theme.palette.primary.main
													: theme.palette.action.disabled,
												mr: 1,
												p: 0.5,
											}}
										>
											<Timeline sx={{ fontSize: 16 }} />
										</IconButton>
									</Tooltip>
									<IconButton
										size="small"
										onClick={(e) => {
											e.stopPropagation();
											onToggleOwnVisibility();
										}}
										sx={{
											mr: 1,
											p: 0.2,
											color: ownShipsVisible
												? theme.palette.primary.main
												: theme.palette.action.disabled,
										}}
									>
										{ownShipsVisible ? (
											<Visibility sx={{ fontSize: 16 }} />
										) : (
											<VisibilityOff sx={{ fontSize: 16 }} />
										)}
									</IconButton>
									{myShipsExpanded ? (
										<ExpandLess sx={{ color: theme.palette.primary.main }} />
									) : (
										<ExpandMore sx={{ color: theme.palette.primary.main }} />
									)}
								</Box>
							</ListItem>

							{myShipsExpanded && (
								<Box
									sx={{
										flex: 1,
										bgcolor: alpha(theme.palette.common.black, 0.1),
										opacity: ownShipsVisible ? 1 : 0.5,
									}}
								>
									<Virtuoso
										data={filteredOwn}
										itemContent={renderOwnShipRow}
										style={{ height: "100%" }}
									/>
								</Box>
							)}
						</Box>
					)}

					{/* 2. CORP SHIPS */}
					{(!isMobile || mobileTab === 1) && (
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								flex: corpFleetsExpanded ? 1 : 0, // Auto-expand / shrink
								minHeight: "48px",
								transition: "flex 0.3s ease",
								overflow: "hidden",
							}}
						>
							{!isMobile && (
								<ListItem
									button
									onClick={() => setCorpFleetsExpanded(!corpFleetsExpanded)}
									sx={{
										bgcolor: alpha(theme.palette.secondary.main, 0.08),
										py: 0.5,
										px: 1.5,
										borderBottom: `1px solid ${theme.palette.divider}`,
										height: "48px",
										flexShrink: 0,
									}}
								>
									<ListItemText
										primary="CORPORATION"
										secondary={`${corpMemberCount} members • ${corpTotalShips} ships`}
										primaryTypographyProps={{
											variant: "subtitle2",
											color: theme.palette.secondary.dark,
											fontWeight: 600,
											fontSize: "0.8rem",
										}}
										secondaryTypographyProps={{
											variant: "caption",
											color: alpha(theme.palette.secondary.main, 0.7),
										}}
										sx={{ my: 0 }}
									/>
									<Box
										onClick={(e) => e.stopPropagation()}
										sx={{ display: "flex", alignItems: "center" }}
									>
										<Tooltip
											title={
												allCorpPathsVisible
													? "Hide All Paths"
													: "Show All Paths"
											}
										>
											<IconButton
												size="small"
												onClick={() =>
													onToggleAllPaths(
														Object.values(corpShips)
															.flat()
															.map((s) => s.id),
														!allCorpPathsVisible,
													)
												}
												sx={{
													color: allCorpPathsVisible
														? theme.palette.secondary.main
														: theme.palette.action.disabled,
													mr: 1,
													p: 0.5,
												}}
											>
												<Timeline sx={{ fontSize: 16 }} />
											</IconButton>
										</Tooltip>
										<Tooltip title={allCorpVisible ? "Hide All" : "Show All"}>
											<IconButton
												size="small"
												onClick={() =>
													onToggleAllCorpVisibility(
														Object.keys(corpShips),
														!allCorpVisible,
													)
												}
												sx={{
													color: allCorpVisible
														? theme.palette.secondary.main
														: theme.palette.action.disabled,
													mr: 1,
													p: 0.5,
												}}
											>
												<Visibility sx={{ fontSize: 16 }} />
											</IconButton>
										</Tooltip>
										{corpFleetsExpanded ? (
											<ExpandLess
												sx={{ color: theme.palette.secondary.main }}
											/>
										) : (
											<ExpandMore
												sx={{ color: theme.palette.secondary.main }}
											/>
										)}
									</Box>
								</ListItem>
							)}

							{corpFleetsExpanded && (
								<Box
									sx={{
										flex: 1,
										bgcolor: alpha(theme.palette.common.black, 0.05),
									}}
								>
									<Virtuoso
										data={flattenedCorpData}
										itemContent={renderCorpRow}
										style={{ height: "100%" }}
									/>
								</Box>
							)}
						</Box>
					)}
				</Box>
			</Paper>
		</>
	);
};

export default React.memo(ShipListComponent);
