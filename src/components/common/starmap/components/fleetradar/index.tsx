import React, { useMemo, useState, useCallback } from "react";
import {
	Box,
	Paper,
	Typography,
	IconButton,
	InputBase,
	Tooltip,
	useTheme,
	alpha,
	useMediaQuery,
	Tabs,
	Tab,
	GlobalStyles,
	ListItemButton,
} from "@mui/material";
import {
	Search as SearchIcon,
	ExpandLess,
	ExpandMore,
	Visibility,
	VisibilityOff,
	Timeline,
	Business,
	Sailing,
	Close,
	Group as GroupIcon,
} from "@mui/icons-material";
import type { AnimatedShipData } from "../../types/maptypes";
import ShipRow from "./ShipRow";

interface ShipListComponentProps {
	ownShips: AnimatedShipData[];
	corpShips: Record<string, AnimatedShipData[]>;
	otherShips?: Record<string, AnimatedShipData[]>;
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
	ownShipsVisible: boolean;
	onToggleOwnVisibility: () => void;
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

// --- CSS KEYFRAMES FOR GPU ANIMATION ---
const GlobalProgressKeyframes = () => (
	<GlobalStyles
		styles={{
			"@keyframes growProgress": {
				"0%": { transform: "scaleX(0)" },
				"100%": { transform: "scaleX(1)" },
			},
			"@keyframes pulseRadar": {
				"0%": { boxShadow: "0 0 0 0 rgba(0, 229, 255, 0.4)", transform: "scale(1)" },
				"70%": { boxShadow: "0 0 0 10px rgba(0, 229, 255, 0)", transform: "scale(1.05)" },
				"100%": { boxShadow: "0 0 0 0 rgba(0, 229, 255, 0)", transform: "scale(1)" },
			},
		}}
	/>
);

const FleetRadar: React.FC<ShipListComponentProps> = ({
	ownShips,
	corpShips,
	otherShips = {},
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
	const [activeTabId, setActiveTabId] = useState<string>("my_ships");

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
					shipIds: matches.map((s) => s.id || s.ship_id),
				});
				if (isExpanded) {
					for (const ship of matches) data.push({ type: "SHIP", data: ship });
				}
			}
		});
		return data;
	}, [corpShips, lowerSearch, expandedCorpGroups, visibleCorpGroups, isMobile]);

	const flattenedOtherData = useMemo(() => {
		const data: CorpListItem[] = [];
		Object.entries(otherShips).forEach(([groupName, ships]) => {
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
					shipIds: matches.map((s) => s.id || s.ship_id),
				});
				if (isExpanded) {
					for (const ship of matches) data.push({ type: "SHIP", data: ship });
				}
			}
		});
		return data;
	}, [otherShips, lowerSearch, expandedCorpGroups, visibleCorpGroups, isMobile]);

	// Counts
	const corpMemberCount = Object.keys(corpShips).length;
	const corpTotalShips = Object.values(corpShips).flat().length;
	const otherTotalShips = Object.values(otherShips).flat().length;

	// Determine available tabs dynamically
	const availableTabs = useMemo(() => {
		const tabs = [];
		if (ownShips.length > 0) {
			tabs.push({
				id: "my_ships",
				label: "My Ships",
				count: filteredOwn.length,
				icon: <Sailing sx={{ fontSize: 16 }} />,
				color: theme.palette.primary.main,
			});
		}
		if (corpTotalShips > 0) {
			tabs.push({
				id: "corporation",
				label: "Corp",
				count: corpTotalShips,
				icon: <Business sx={{ fontSize: 16 }} />,
				color: theme.palette.secondary.main,
			});
		}
		if (otherTotalShips > 0) {
			tabs.push({
				id: "other_ships",
				label: "Others",
				count: otherTotalShips,
				icon: <GroupIcon sx={{ fontSize: 16 }} />,
				color: theme.palette.info.main,
			});
		}
		return tabs;
	}, [ownShips.length, filteredOwn.length, corpTotalShips, otherTotalShips, theme]);

	// Fallback to first tab if active tab becomes unavailable
	const currentTabId = useMemo(() => {
		if (availableTabs.some((t) => t.id === activeTabId)) {
			return activeTabId;
		}
		return availableTabs[0]?.id || "my_ships";
	}, [availableTabs, activeTabId]);

	// Derived States
	const allOwnPathsVisible = useMemo(
		() =>
			filteredOwn.length > 0 &&
			filteredOwn.every((s) => visiblePathShipIds.has(s.id || s.ship_id)),
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
			allCorpShips.every((s) => visiblePathShipIds.has(s.id || s.ship_id))
		);
	}, [corpShips, visiblePathShipIds]);

	const allOtherVisible = useMemo(() => {
		const groups = Object.keys(otherShips);
		return (
			groups.length > 0 && groups.every((g) => visibleCorpGroups[g] === true)
		);
	}, [otherShips, visibleCorpGroups]);
	const allOtherPathsVisible = useMemo(() => {
		const allOtherShips = Object.values(otherShips).flat();
		return (
			allOtherShips.length > 0 &&
			allOtherShips.every((s) => visiblePathShipIds.has(s.id || s.ship_id))
		);
	}, [otherShips, visiblePathShipIds]);

	// --- RENDERERS ---
	const renderOwnShipRow = useCallback(
		(index: number, ship: AnimatedShipData) => (
			<ShipRow
				key={ship.id || ship.ship_id}
				ship={ship}
				onSelect={onSelectPosition}
				isMine={true}
				isPathVisible={visiblePathShipIds.has(ship.id || ship.ship_id)}
				onTogglePath={onTogglePath}
				isSelected={(ship.id || ship.ship_id) === selectedShipId}
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
					<ListItemButton
						key={`group-header-${item.name}`}
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
									? theme.palette.secondary.main
									: theme.palette.action.disabled,
							}}
						>
							{item.visible ? (
								<Visibility sx={{ fontSize: 16 }} />
							) : (
								<VisibilityOff sx={{ fontSize: 16 }} />
							)}
						</IconButton>
						<Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, mr: 1 }}>
							<Typography
								variant="body2"
								noWrap
								sx={{
									fontSize: "0.75rem",
									fontWeight: 600,
									color: theme.palette.text.primary,
								}}
							>
								{item.name}
							</Typography>
							<Typography
								variant="caption"
								sx={{
									fontSize: "0.7rem",
									color: theme.palette.text.secondary,
								}}
							>
								{item.count} ships
							</Typography>
						</Box>
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
					</ListItemButton>
				);
			} else {
				return (
					<ShipRow
						key={item.data.id || item.data.ship_id}
						ship={item.data}
						onSelect={onSelectPosition}
						isMine={false}
						isPathVisible={visiblePathShipIds.has(
							item.data.id || item.data.ship_id,
						)}
						onTogglePath={onTogglePath}
						isSelected={(item.data.id || item.data.ship_id) === selectedShipId}
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
				elevation={12}
				sx={{
					position: isMobile ? "fixed" : "absolute",
					top: isMobile ? "auto" : "10vh",
					bottom: isMobile ? 80 : "auto",
					right: isMobile ? 20 : "auto",
					left: isMobile ? "auto" : 20,
					zIndex: 10,
					bgcolor: "rgba(10, 12, 18, 0.85)",
					backdropFilter: "blur(20px)",
					border: "1px solid rgba(0, 229, 255, 0.2)",
					borderRadius: "50%",
					width: 56,
					height: 56,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					animation: "pulseRadar 3s infinite",
					cursor: "pointer",
					transition: "all 0.3s ease",
					"&:hover": {
						transform: "scale(1.1)",
						borderColor: "rgba(0, 229, 255, 0.5)",
					}
				}}
				onClick={() => setIsMinimized(false)}
			>
				<IconButton color="primary">
					<Sailing sx={{ color: "#00e5ff" }} />
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
			maxHeight: "60dvh",
			borderRadius: "20px 20px 0 0",
			boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.5)",
		}
		: {
			position: "absolute",
			top: "10vh",
			left: 20,
			width: 340,
			height: "80vh",
			borderRadius: "12px",
			boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
		};

	const currentTab = availableTabs.find((t) => t.id === currentTabId);

	return (
		<>
			<GlobalProgressKeyframes />
			<Paper
				elevation={8}
				sx={{
					...containerStyle,
					display: "flex",
					flexDirection: "column",
					background: "linear-gradient(135deg, rgba(15, 18, 28, 0.85) 0%, rgba(8, 10, 15, 0.95) 100%)",
					backdropFilter: "blur(24px)",
					border: "1px solid rgba(255, 255, 255, 0.08)",
					borderTopColor: isMobile ? "rgba(0, 229, 255, 0.15)" : "rgba(255, 255, 255, 0.08)",
					color: theme.palette.text.primary,
					zIndex: 10,
					overflow: "hidden",
					transition: "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
				}}
			>
				{isMobile && (
					<Box
						sx={{
							width: 36,
							height: 4,
							bgcolor: "rgba(255, 255, 255, 0.25)",
							borderRadius: 2,
							mx: "auto",
							mt: 1.5,
							mb: 0.5,
							cursor: "pointer",
						}}
						onClick={() => setIsMinimized(true)}
					/>
				)}
				{/* HEADER */}
				<Box
					sx={{
						p: 2,
						pb: 1.5,
						borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
						bgcolor: "rgba(0, 0, 0, 0.15)",
						flexShrink: 0,
					}}
				>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 1.5,
						}}
					>
						<Typography
							variant="subtitle2"
							sx={{
								fontWeight: 800,
								color: "#00e5ff",
								letterSpacing: "0.15em",
								textTransform: "uppercase",
								fontSize: "0.75rem"
							}}
						>
							Fleet Radar
						</Typography>
						<IconButton
							size="small"
							onClick={() => setIsMinimized(true)}
							sx={{
								color: "rgba(255, 255, 255, 0.5)",
								"&:hover": { color: "#ff1744", bgcolor: "rgba(255, 23, 68, 0.08)" }
							}}
						>
							<Close fontSize="small" />
						</IconButton>
					</Box>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							bgcolor: "rgba(0, 0, 0, 0.25)",
							borderRadius: "6px",
							border: "1px solid rgba(255, 255, 255, 0.05)",
							px: 1.25,
							py: 0.5,
							transition: "border-color 0.2s ease",
							"&:focus-within": {
								borderColor: "rgba(0, 229, 255, 0.3)",
							}
						}}
					>
						<SearchIcon
							sx={{ color: "rgba(255, 255, 255, 0.3)", mr: 1, fontSize: 16 }}
						/>
						<InputBase
							placeholder="Identify ship or registration..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							sx={{
								color: theme.palette.text.primary,
								flex: 1,
								fontSize: "0.775rem",
								fontWeight: 500,
							}}
						/>
					</Box>
				</Box>

				{/* TABS CONTAINER */}
				{availableTabs.length > 0 && (
					<Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: "rgba(0,0,0,0.1)", flexShrink: 0 }}>
						<Tabs
							value={currentTabId}
							onChange={(_, v) => setActiveTabId(v)}
							variant="fullWidth"
							sx={{
								minHeight: 40,
								"& .MuiTabs-indicator": {
									backgroundColor: currentTab?.color || theme.palette.primary.main,
								}
							}}
						>
							{availableTabs.map((t) => (
								<Tab
									key={t.id}
									value={t.id}
									icon={t.icon}
									iconPosition="start"
									label={t.label}
									sx={{
										minHeight: 40,
										py: 0,
										fontSize: "0.725rem",
										fontWeight: 600,
										color: alpha(theme.palette.text.primary, 0.6),
										"&.Mui-selected": {
											color: t.color || theme.palette.primary.main,
										}
									}}
								/>
							))}
						</Tabs>
					</Box>
				)}

				{/* SUB-HEADER / TOOLBAR */}
				{currentTab && (
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							px: 2,
							py: 0.75,
							bgcolor: alpha(currentTab.color || theme.palette.primary.main, 0.05),
							borderBottom: `1px solid ${alpha(currentTab.color || theme.palette.primary.main, 0.1)}`,
							flexShrink: 0,
						}}
					>
						<Box sx={{ display: "flex", flexDirection: "column" }}>
							<Typography
								variant="caption"
								sx={{
									color: alpha(theme.palette.text.primary, 0.8),
									fontWeight: 600,
									fontSize: "0.725rem",
								}}
							>
								{currentTabId === "my_ships" && `${filteredOwn.length} ships`}
								{currentTabId === "corporation" && `${corpMemberCount} members • ${corpTotalShips} ships`}
								{currentTabId === "other_ships" && `${Object.keys(otherShips).length} players • ${otherTotalShips} ships`}
							</Typography>
						</Box>

						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							{currentTabId === "my_ships" && (
								<>
									<Tooltip title={allOwnPathsVisible ? "Hide All Paths" : "Show All Paths"}>
										<IconButton
											size="small"
											onClick={() =>
												onToggleAllPaths(
													ownShips.map((s) => s.id || s.ship_id),
													!allOwnPathsVisible,
												)
											}
											sx={{
												color: allOwnPathsVisible
													? theme.palette.primary.main
													: theme.palette.action.disabled,
												p: 0.5,
											}}
										>
											<Timeline sx={{ fontSize: 16 }} />
										</IconButton>
									</Tooltip>
									<IconButton
										size="small"
										onClick={() => onToggleOwnVisibility()}
										sx={{
											p: 0.5,
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
								</>
							)}

							{currentTabId === "corporation" && (
								<>
									<Tooltip title={allCorpPathsVisible ? "Hide All Paths" : "Show All Paths"}>
										<IconButton
											size="small"
											onClick={() =>
												onToggleAllPaths(
													Object.values(corpShips)
														.flat()
														.map((s) => s.id || s.ship_id),
													!allCorpPathsVisible,
												)
											}
											sx={{
												color: allCorpPathsVisible
													? theme.palette.secondary.main
													: theme.palette.action.disabled,
												p: 0.5,
											}}
										>
											<Timeline sx={{ fontSize: 16 }} />
										</IconButton>
									</Tooltip>
									<Tooltip title={allCorpVisible ? "Hide All Corp" : "Show All Corp"}>
										<IconButton
											size="small"
											onClick={() =>
												onToggleAllCorpVisibility(
													Object.keys(corpShips),
													!allCorpVisible,
												)
											}
											sx={{
												p: 0.5,
												color: allCorpVisible
													? theme.palette.secondary.main
													: theme.palette.action.disabled,
											}}
										>
											{allCorpVisible ? (
												<Visibility sx={{ fontSize: 16 }} />
											) : (
												<VisibilityOff sx={{ fontSize: 16 }} />
											)}
										</IconButton>
									</Tooltip>
								</>
							)}

							{currentTabId === "other_ships" && (
								<>
									<Tooltip title={allOtherPathsVisible ? "Hide All Paths" : "Show All Paths"}>
										<IconButton
											size="small"
											onClick={() =>
												onToggleAllPaths(
													Object.values(otherShips)
														.flat()
														.map((s) => s.id || s.ship_id),
													!allOtherPathsVisible,
												)
											}
											sx={{
												color: allOtherPathsVisible
													? theme.palette.info.main
													: theme.palette.action.disabled,
												p: 0.5,
											}}
										>
											<Timeline sx={{ fontSize: 16 }} />
										</IconButton>
									</Tooltip>
									<Tooltip title={allOtherVisible ? "Hide All Others" : "Show All Others"}>
										<IconButton
											size="small"
											onClick={() =>
												onToggleAllCorpVisibility(
													Object.keys(otherShips),
													!allOtherVisible,
												)
											}
											sx={{
												p: 0.5,
												color: allOtherVisible
													? theme.palette.info.main
													: theme.palette.action.disabled,
											}}
										>
											{allOtherVisible ? (
												<Visibility sx={{ fontSize: 16 }} />
											) : (
												<VisibilityOff sx={{ fontSize: 16 }} />
											)}
										</IconButton>
									</Tooltip>
								</>
							)}
						</Box>
					</Box>
				)}

				{/* CONTENT AREA */}
				<Box
					sx={{
						flex: 1,
						overflowY: "auto",
						bgcolor: alpha(theme.palette.common.black, 0.1),
						display: "flex",
						flexDirection: "column",
					}}
				>
					{currentTabId === "my_ships" && (
						<Box sx={{ opacity: ownShipsVisible ? 1 : 0.5 }}>
							{filteredOwn.map((ship, index) => renderOwnShipRow(index, ship))}
						</Box>
					)}
					{currentTabId === "corporation" && (
						<Box>
							{flattenedCorpData.map((item, index) => renderCorpRow(index, item))}
						</Box>
					)}
					{currentTabId === "other_ships" && (
						<Box>
							{flattenedOtherData.map((item, index) => renderCorpRow(index, item))}
						</Box>
					)}
				</Box>
			</Paper>
		</>
	);
};

export default React.memo(FleetRadar);
