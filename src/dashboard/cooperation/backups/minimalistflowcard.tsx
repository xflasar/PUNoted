import React, { useState, useMemo, useContext, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import {
	Box,
	Typography,
	Card,
	CardContent,
	List,
	ListItem,
	IconButton,
	Tooltip,
	LinearProgress,
	Tabs,
	Tab,
	Icon,
} from "@mui/material";
import {
	Factory,
	Storage as StorageIcon,
	FormatListNumbered,
	ExpandLess,
	ExpandMore,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Close as CloseIcon,
	Check,
	WarningAmberSharp,
} from "@mui/icons-material";
import { Handle, Position } from "reactflow";
import { getTickerColor, ConnectionToolContext } from "./helpers";
import type { ChainNodeData, MaterialMetrics } from "./types";
import { fetchNodeLiveData } from "./api_client"; // NEW: Live data fetcher
import {
	COLOR_CONSTANTS,
	MIN_NODE_CARD_WIDTH,
	MIN_NODE_HEIGHT,
} from "./consts";

// --- Sub-Component for Production List (Memoized) ---
const UserProductionList = React.memo(
	({
		nodeData,
		theme,
		isLoading,
	}: {
		nodeData: ChainNodeData;
		theme: any;
		isLoading?: boolean;
	}) => {
		const getFlowIcon = (type: string) => {
			if (type === "Produce")
				return (
					<Factory
						fontSize="inherit"
						sx={{ color: theme.palette.secondary.light }}
					/>
				);
			if (type === "Consume")
				return (
					<Factory
						fontSize="inherit"
						sx={{ color: theme.palette.error.light }}
					/>
				);
			return (
				<Factory
					fontSize="inherit"
					sx={{ color: theme.palette.secondary.light }}
				/>
			);
		};

		const getRateColor = (_rate: number, type: string) => {
			if (type === "Consume") return theme.palette.error.main;
			return theme.palette.success.light;
		};

		const getRateDisplay = (rate: number, type: string) => {
			if (type === "Consume") return `-${Math.abs(rate).toFixed(1)}`;
			return `+${Math.abs(rate).toFixed(1)}`;
		};

		return (
			<List
				dense
				disablePadding
				sx={{ overflowY: "auto", position: "relative" }}
			>
				{isLoading && (
					<LinearProgress
						color="secondary"
						sx={{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							height: 2,
							zIndex: 2,
						}}
					/>
				)}
				<Box
					sx={{
						display: "flex",
						width: "100%",
						justifyContent: "space-between",
						borderBottom: `1px solid ${theme.palette.divider}`,
						mb: 0.5,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: theme.palette.text.secondary,
							fontWeight: "bold",
							width: "35%",
						}}
					>
						User
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: theme.palette.text.secondary,
							fontWeight: "bold",
							width: "25%",
							textAlign: "center",
						}}
					>
						Type
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: theme.palette.text.secondary,
							fontWeight: "bold",
							width: "40%",
							textAlign: "right",
						}}
					>
						Rate
					</Typography>
				</Box>
				{!nodeData.userFlows || nodeData.userFlows.length === 0 ? (
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ fontStyle: "italic", display: "block", mt: 0.5 }}
					>
						No flow data.
					</Typography>
				) : (
					nodeData.userFlows.map((flow: any, index: number) => (
						<ListItem key={index} disableGutters sx={{ py: 0, minHeight: 15 }}>
							<Box
								sx={{
									display: "flex",
									width: "100%",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										width: "35%",
										overflow: "hidden",
									}}
								>
									{flow.username}
								</Box>
								<Typography
									variant="caption"
									sx={{
										fontWeight: "bold",
										width: "25%",
										textAlign: "center",
										color: theme.palette.text.secondary,
									}}
								>
									{flow.type.substring(0, 4)} {getFlowIcon(flow.type)}
								</Typography>
								<Typography
									variant="caption"
									sx={{
										fontWeight: "bold",
										fontFamily: "monospace",
										width: "40%",
										textAlign: "right",
										color: getRateColor(flow.rate, flow.type),
									}}
								>
									{getRateDisplay(flow.rate, flow.type)}
								</Typography>
							</Box>
						</ListItem>
					))
				)}
			</List>
		);
	},
);

// --- Sub-Component for Storage List (Memoized) ---
const UserStorageList = React.memo(
	({
		nodeData,
		theme,
		isLoading,
	}: {
		nodeData: ChainNodeData;
		theme: any;
		isLoading?: boolean;
	}) => {
		const [expandedUser, setExpandedUser] = useState<string | null>(null);

		const toggleExpand = (username: string) => {
			setExpandedUser(expandedUser === username ? null : username);
		};

		return (
			<List
				dense
				disablePadding
				sx={{ overflowY: "auto", position: "relative" }}
			>
				{isLoading && (
					<LinearProgress
						color="secondary"
						sx={{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							height: 2,
							zIndex: 2,
						}}
					/>
				)}
				<Box
					sx={{
						display: "flex",
						width: "100%",
						justifyContent: "space-between",
						borderBottom: `1px solid ${theme.palette.divider}`,
						mb: 0.5,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: theme.palette.text.secondary,
							fontWeight: "bold",
							width: "35%",
						}}
					>
						User
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: theme.palette.text.secondary,
							fontWeight: "bold",
							width: "65%",
							textAlign: "right",
						}}
					>
						{nodeData.materialTicker} Stock / Cap.
					</Typography>
				</Box>
				{!nodeData.userStorage || nodeData.userStorage.length === 0 ? (
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ fontStyle: "italic", display: "block", mt: 0.5 }}
					>
						No storage data.
					</Typography>
				) : (
					nodeData.userStorage.map((item: any, index: number) => {
						const capacity = item.capacity || 1; // Prevent division by zero
						const percentage = (item.current / capacity) * 100;
						const progressColor =
							percentage >= 95
								? "error"
								: percentage > 70
									? "warning"
									: "secondary";
						const isExpanded = expandedUser === item.username;

						return (
							<Box
								key={index}
								sx={{
									mb: 0.5,
									border: isExpanded
										? `1px solid ${theme.palette.divider}`
										: "none",
									borderRadius: 1,
									bgcolor: isExpanded ? theme.palette.grey[900] : "transparent",
								}}
							>
								<ListItem
									disableGutters
									onClick={() => toggleExpand(item.username)}
									sx={{
										py: 0,
										minHeight: 15,
										cursor: "pointer",
										"&:hover": { bgcolor: theme.palette.action.hover },
									}}
								>
									<Box
										sx={{
											display: "flex",
											width: "100%",
											justifyContent: "space-between",
											alignItems: "center",
										}}
									>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												width: "35%",
												overflow: "hidden",
												marginLeft: 1,
											}}
										>
											<StorageIcon
												fontSize="inherit"
												sx={{ color: theme.palette.info.light }}
											/>
											{item.username}
										</Box>
										<Box sx={{ width: "65%", textAlign: "right" }}>
											<Typography
												variant="caption"
												sx={{
													fontWeight: "bold",
													fontFamily: "monospace",
													mr: 1,
												}}
											>
												{item.current} / {item.capacity}
											</Typography>
											{isExpanded ? (
												<ExpandLess fontSize="small" />
											) : (
												<ExpandMore fontSize="small" />
											)}
										</Box>
									</Box>
								</ListItem>
								<LinearProgress
									variant="determinate"
									value={percentage}
									color={progressColor as "error" | "warning" | "secondary"}
									sx={{ height: 4, mb: 0.5, mx: 1, borderRadius: 2 }}
								/>
								{isExpanded && (
									<Box
										sx={{
											p: 1,
											pt: 0.5,
											borderTop: `1px dashed ${theme.palette.divider}`,
										}}
									>
										<Typography
											variant="caption"
											sx={{
												fontWeight: "bold",
												color: theme.palette.text.secondary,
											}}
										>
											Other Stored Materials:
										</Typography>
										{item.otherMaterials && item.otherMaterials.length > 0 ? (
											<List dense disablePadding sx={{ pl: 1, mt: 0.5 }}>
												{item.otherMaterials.map(
													(other: any, oIndex: number) => (
														<ListItem
															key={oIndex}
															disableGutters
															sx={{ py: 0 }}
														>
															<Typography variant="caption" sx={{ mr: 1 }}>
																{other.ticker}:
															</Typography>
															<Typography
																variant="caption"
																color="text.secondary"
															>
																{other.current} / {other.capacity}
															</Typography>
														</ListItem>
													),
												)}
											</List>
										) : (
											<Typography
												variant="caption"
												color="text.secondary"
												sx={{ fontStyle: "italic", display: "block", mt: 0.5 }}
											>
												None.
											</Typography>
										)}
									</Box>
								)}
							</Box>
						);
					})
				)}
			</List>
		);
	},
);

// --- Sub-Component for Input Materials (Memoized) ---
const InputMaterialsFlowList = React.memo(
	({ nodeData, theme }: { nodeData: any; theme: any }) => {
		const getDeficitColor = (deficit: number) => {
			if (deficit > 0) return theme.palette.error.main;
			if (deficit < 0) return theme.palette.success.main;
			return theme.palette.text.primary;
		};

		const materialEntries: [string, MaterialMetrics][] = Object.entries(
			nodeData.inputStatus || {},
		);

		return (
			<List dense disablePadding sx={{ overflowY: "auto" }}>
				<Box
					sx={{
						display: "flex",
						width: "100%",
						justifyContent: "space-between",
						borderBottom: `1px solid ${theme.palette.divider}`,
						mb: 0.5,
						px: 1,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: theme.palette.text.secondary,
							fontWeight: "bold",
							width: "15%",
							textAlign: "left",
						}}
					>
						Ticker
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: theme.palette.text.secondary,
							fontWeight: "bold",
							width: "25%",
							textAlign: "right",
						}}
					>
						Need
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: theme.palette.text.secondary,
							fontWeight: "bold",
							width: "25%",
							textAlign: "right",
						}}
					>
						Input
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: theme.palette.text.secondary,
							fontWeight: "bold",
							width: "25%",
							textAlign: "right",
						}}
					>
						Deficit
					</Typography>
				</Box>
				{materialEntries.length === 0 ? (
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ fontStyle: "italic", display: "block", mt: 0.5, px: 1 }}
					>
						No material data.
					</Typography>
				) : (
					materialEntries.map(
						([ticker, { need, input, deficit }], _index: number) => (
							<ListItem
								key={ticker}
								disableGutters
								sx={{ py: 0, minHeight: 15 }}
							>
								<Box
									sx={{
										display: "flex",
										width: "100%",
										justifyContent: "space-between",
										alignItems: "center",
										px: 1,
									}}
								>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											width: "15%",
											overflow: "hidden",
											fontSize: "0.85rem",
										}}
									>
										<Typography sx={{ fontWeight: 500 }}>{ticker}</Typography>
									</Box>
									<Typography
										variant="caption"
										sx={{
											fontWeight: "bold",
											fontFamily: "monospace",
											width: "25%",
											textAlign: "right",
											color: theme.palette.text.primary,
										}}
									>
										{need.toFixed(1)}
									</Typography>
									<Typography
										variant="caption"
										sx={{
											fontWeight: "bold",
											fontFamily: "monospace",
											width: "25%",
											textAlign: "right",
											color: theme.palette.text.primary,
										}}
									>
										{input.toFixed(1)}
									</Typography>
									<Typography
										variant="caption"
										sx={{
											fontWeight: "bold",
											fontFamily: "monospace",
											width: "25%",
											textAlign: "right",
											color: getDeficitColor(deficit),
										}}
									>
										{deficit.toFixed(1)}
									</Typography>
								</Box>
							</ListItem>
						),
					)
				)}
			</List>
		);
	},
);

const MinimalistFlowCard = React.memo(({ data, selected, isDragging }: any) => {
	const theme = useTheme();
	const nodeData: ChainNodeData = data;
	const { onEditNode, onDeleteNode, validationData, activeGroupId } =
		useContext(ConnectionToolContext);

	// --- NEW: Granular Live Data State ---
	const [liveFlows, setLiveFlows] = useState<any[] | null>(null);
	const [liveStorage, setLiveStorage] = useState<any[] | null>(null);
	const [isLoadingLive, setIsLoadingLive] = useState(false);

	// Fetch live data for this specific node
	useEffect(() => {
		let isMounted = true;
		const planetId = nodeData.planet?.planetid;

		if (activeGroupId && planetId && nodeData.materialTicker) {
			setIsLoadingLive(true);
			fetchNodeLiveData(activeGroupId, planetId, nodeData.materialTicker)
				.then((liveData) => {
					if (isMounted) {
						setLiveFlows(liveData.userFlows || []);
						setLiveStorage(liveData.userStorage || []);
						setIsLoadingLive(false);
					}
				})
				.catch((err) => {
					console.error(
						`Failed to fetch live node data for ${nodeData.materialTicker}:`,
						err,
					);
					if (isMounted) setIsLoadingLive(false);
				});
		}
		return () => {
			isMounted = false;
		};
	}, [activeGroupId, nodeData.planet?.planetid, nodeData.materialTicker]);

	// Combine live data with static data
	const displayNodeData = useMemo(
		() => ({
			...nodeData,
			userFlows: liveFlows ?? nodeData.userFlows,
			userStorage: liveStorage ?? nodeData.userStorage,
		}),
		[nodeData, liveFlows, liveStorage],
	);

	const tickerColor = getTickerColor(nodeData.materialTicker);
	const [activeListTab, setActiveListTab] = useState("Production");

	const sourceHandleId = `${data.materialTicker}-output`;
	const targetHandleId = `${data.materialTicker}-input`;

	const netFlowColor =
		nodeData.netFlow >= 0
			? theme.palette.secondary.main
			: theme.palette.error.main;
	const consumptionRateColor =
		nodeData.consumptionRatio >= 0
			? theme.palette.warning.main
			: theme.palette.error.main;

	// --- CONNECTION TOOL HIGHLIGHTING LOGIC ---
	const isSource = validationData.sourceNodeId === nodeData.nodeId;
	const isTargetCandidate = validationData.sourceNodeId && !isSource;
	const isValidTarget =
		isTargetCandidate && validationData.validTargetNodeIds.has(nodeData.nodeId);

	const borderColor = useMemo(() => {
		if (isSource) return COLOR_CONSTANTS.WARNING;
		if (isTargetCandidate) {
			return isValidTarget ? COLOR_CONSTANTS.SUCCESS : COLOR_CONSTANTS.ERROR;
		}
		if (nodeData.locked) {
			return COLOR_CONSTANTS.ERROR;
		}
		return theme.palette.divider;
	}, [
		isSource,
		isTargetCandidate,
		isValidTarget,
		theme.palette.divider,
		data.locked,
	]);

	// --- DRAGGING OPTIMIZATION ---
	if (isDragging) {
		return (
			<Box
				sx={{
					width: data.width || MIN_NODE_CARD_WIDTH,
					height: data.height || MIN_NODE_HEIGHT,
					minWidth: MIN_NODE_CARD_WIDTH,
					minHeight: MIN_NODE_HEIGHT,
					borderRadius: 4,
					border: `2px dashed ${theme.palette.secondary.main}`,
					backgroundColor: theme.palette.background.paper,
					opacity: 0.7,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					boxShadow: "0 0 10px rgba(0,0,0,0.5)",
					p: 2,
					pointerEvents: "none",
				}}
			>
				<Typography variant="body1" sx={{ fontWeight: "bold", mb: 0.5 }}>
					Dragging Node...
				</Typography>
				<Typography variant="h6" color="primary.main">
					{nodeData.materialTicker}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					{nodeData.siteName}
				</Typography>

				<Handle
					type="source"
					position={Position.Right}
					isConnectable={true}
					style={{ opacity: 0 }}
				/>
				<Handle
					type="target"
					position={Position.Left}
					isConnectable={true}
					style={{ opacity: 0 }}
				/>
			</Box>
		);
	}

	const nodeStyle = {
		minWidth: MIN_NODE_CARD_WIDTH,
		minHeight: MIN_NODE_HEIGHT,
		borderRadius: 4,
		border: `2px solid ${borderColor}`,
		boxShadow: selected
			? `0 0 15px ${theme.palette.secondary.dark}`
			: isSource || (isTargetCandidate && isValidTarget)
				? `0 0 8px ${borderColor}`
				: "none",
		background: theme.palette.background.paper,
		color: theme.palette.text.primary,
		display: "flex",
		flexDirection: "column",
		position: "relative",
		overflow: "hidden",
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		onDeleteNode?.(data);
	};

	return (
		<Card sx={nodeStyle}>
			{/* Top Bar */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					p: 1,
					borderBottom: `1px solid ${theme.palette.divider}`,
					backgroundColor: tickerColor,
					color: "#fff",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
					<Typography
						variant="body1"
						sx={{ fontWeight: "bold", mr: 1, textShadow: "0 0 2px #000" }}
					>
						{displayNodeData.materialTicker}
					</Typography>
					<Typography
						variant="caption"
						sx={{
							opacity: 0.8,
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
							maxWidth: "100%",
							textShadow: "0 0 2px #000",
						}}
					>
						{displayNodeData.siteName}
					</Typography>
				</Box>

				<Box sx={{ display: "flex", gap: 1 }}>
					{!displayNodeData.locked ? (
						<>
							<Tooltip title="Edit Node" placement="top">
								<IconButton
									size="small"
									sx={{
										color: "primary.main",
										backgroundColor: "white",
										borderRadius: "50%",
										boxShadow: 1,
										"&:hover": { backgroundColor: "grey.100" },
										zIndex: 10,
									}}
									draggable={false}
									disableRipple
									disableFocusRipple
									disabled={displayNodeData.locked}
									onPointerDown={(e) => {
										e.stopPropagation();
										e.preventDefault();
									}}
									onMouseDown={(e) => {
										e.stopPropagation();
										e.preventDefault();
									}}
									onClick={(e) => {
										e.stopPropagation();
										onEditNode?.(data);
									}}
								>
									<EditIcon fontSize="small" />
								</IconButton>
							</Tooltip>

							<Tooltip title="Delete Node" placement="top">
								<IconButton
									size="small"
									sx={{
										color: "error.main",
										backgroundColor: "white",
										borderRadius: "50%",
										boxShadow: 1,
										"&:hover": { backgroundColor: "grey.100" },
										zIndex: 10,
									}}
									draggable={false}
									disableRipple
									disableFocusRipple
									disabled={displayNodeData.locked}
									onPointerDown={(e) => {
										e.stopPropagation();
										e.preventDefault();
									}}
									onMouseDown={(e) => {
										e.stopPropagation();
										e.preventDefault();
									}}
									onClick={(e) => {
										e.stopPropagation();
										handleDelete(e);
									}}
								>
									<DeleteIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						</>
					) : (
						<Tooltip title="Node locked by user editing." placement="top">
							<Icon sx={{ ml: 2 }}>
								<WarningAmberSharp sx={{ color: COLOR_CONSTANTS.ERROR }} />
							</Icon>
						</Tooltip>
					)}
				</Box>
			</Box>

			{/* Metrics */}
			<CardContent
				sx={{
					p: 1,
					"&:last-child": { pb: 1 },
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
					<Box sx={{ textAlign: "center" }}>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ fontWeight: "bold", lineHeight: 1.2 }}
						>
							Prod. Rate
						</Typography>
						<Typography
							variant="body2"
							sx={{
								fontWeight: "bold",
								color: theme.palette.primary.main,
								fontFamily: "monospace",
								lineHeight: 1.2,
							}}
						>
							{displayNodeData.productionRate.toFixed(1)}{" "}
							{displayNodeData.productionUnit}
						</Typography>
					</Box>

					<Box sx={{ textAlign: "center" }}>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ fontWeight: "bold", lineHeight: 1.2 }}
						>
							Cons. Rate
						</Typography>
						<Typography
							variant="body2"
							sx={{
								fontWeight: "bold",
								color: consumptionRateColor,
								fontFamily: "monospace",
								lineHeight: 1.2,
							}}
						>
							{displayNodeData.consumptionRatio >= 0 ? "+" : ""}
							{displayNodeData.consumptionRatio?.toFixed(1)}
						</Typography>
					</Box>

					<Box sx={{ textAlign: "center" }}>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ fontWeight: "bold", lineHeight: 1.2 }}
						>
							Net Flow
						</Typography>
						<Typography
							variant="body2"
							sx={{
								fontWeight: "bold",
								color: netFlowColor,
								fontFamily: "monospace",
								lineHeight: 1.2,
							}}
						>
							{displayNodeData.netFlow >= 0 ? "+" : ""}
							{displayNodeData.netFlow.toFixed(1)}
						</Typography>
					</Box>
				</Box>
			</CardContent>

			{/* Split Layout: Input Materials (left) + Tabs + Content (right) */}
			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					gap: 1,
					flexGrow: 1,
					minHeight: 130,
					minWidth:
						displayNodeData.inputStatus &&
						Object.keys(displayNodeData.inputStatus).length > 0
							? 500
							: 300,
					p: 1,
				}}
			>
				{displayNodeData.inputStatus &&
				Object.keys(displayNodeData.inputStatus).length > 0 ? (
					<Box
						sx={{
							width: "50%",
							minWidth: 120,
							borderRight: `1px solid ${theme.palette.divider}`,
							pr: 1,
							overflowY: "auto",
						}}
					>
						<Typography
							variant="caption"
							sx={{
								fontWeight: "bold",
								color: theme.palette.text.secondary,
								display: "block",
								textAlign: "center",
								mb: 0.5,
							}}
						>
							Input Materials
						</Typography>
						<InputMaterialsFlowList nodeData={displayNodeData} theme={theme} />
					</Box>
				) : null}

				<Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
					<Tabs
						value={activeListTab}
						onChange={(_e, newValue) => {
							setActiveListTab(newValue);
						}}
						sx={{
							minHeight: 30,
							"& .MuiTabs-indicator": {
								backgroundColor: theme.palette.secondary.main,
							},
						}}
						variant="fullWidth"
					>
						<Tab
							label="Production"
							value="Production"
							icon={<FormatListNumbered />}
							iconPosition="start"
							sx={{
								minHeight: 30,
								p: 0,
								"& .MuiTab-iconWrapper": { mr: 0.5 },
								fontSize: "0.7rem",
							}}
						/>
						<Tab
							label="Storage"
							value="Storage"
							icon={<StorageIcon />}
							iconPosition="start"
							sx={{
								minHeight: 30,
								p: 0,
								"& .MuiTab-iconWrapper": { mr: 0.5 },
								fontSize: "0.7rem",
							}}
						/>
					</Tabs>

					<Box sx={{ flexGrow: 1, p: 1, minHeight: 130, overflowY: "auto" }}>
						{activeListTab === "Production" && (
							<UserProductionList
								nodeData={displayNodeData}
								theme={theme}
								isLoading={isLoadingLive}
							/>
						)}
						{activeListTab === "Storage" && (
							<UserStorageList
								nodeData={displayNodeData}
								theme={theme}
								isLoading={isLoadingLive}
							/>
						)}
					</Box>
				</Box>
			</Box>

			<Handle
				type="target"
				position={Position.Left}
				isConnectable={true}
				id={targetHandleId}
				hidden={displayNodeData.isResource}
				style={{
					width: 10,
					height: 10,
					background: isValidTarget
						? COLOR_CONSTANTS.SUCCESS
						: isTargetCandidate
							? COLOR_CONSTANTS.ERROR
							: theme.palette.primary.main,
				}}
			/>

			<Handle
				type="source"
				position={Position.Right}
				isConnectable={true}
				id={sourceHandleId}
				hidden={displayNodeData.isEndMaterial}
				style={{
					width: 10,
					height: 10,
					background: isSource
						? COLOR_CONSTANTS.WARNING
						: theme.palette.secondary.main,
				}}
			/>

			{isTargetCandidate && (
				<Box
					sx={{
						position: "absolute",
						top: 2,
						left: 2,
						width: 15,
						height: 15,
						borderRadius: "50%",
						backgroundColor: isValidTarget
							? COLOR_CONSTANTS.SUCCESS
							: COLOR_CONSTANTS.ERROR,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 100,
						border: "1px solid #fff",
					}}
				>
					{isValidTarget ? (
						<Check sx={{ fontSize: 10, color: "#fff" }} />
					) : (
						<CloseIcon sx={{ fontSize: 10, color: "#fff" }} />
					)}
				</Box>
			)}
		</Card>
	);
});

export default MinimalistFlowCard;
