import React, { useState, useMemo, useContext, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import {
	Box, Typography, Card, CardContent, List, ListItem, IconButton,
	Tooltip, LinearProgress, Tabs, Tab, Icon
} from "@mui/material";
import {
	Storage as StorageIcon, FormatListNumbered, ExpandLess,
	ExpandMore, Delete as DeleteIcon, Edit as EditIcon, Close as CloseIcon,
	Check, WarningAmberSharp, LocalShipping
} from "@mui/icons-material";
import { Handle, Position } from "reactflow";
import { getTickerColor, ConnectionToolContext } from "./helpers";
import type { ChainNodeData } from "./types";
import { fetchNodeLiveData } from "./api_client";
import { COLOR_CONSTANTS, MIN_NODE_CARD_WIDTH, MIN_NODE_HEIGHT } from "./consts";
import { aggregateNodeProduction, formatCurrency } from "../../components/BaseManager/helpers";

const UserProductionList = React.memo(({ aggregatedData, theme }: { aggregatedData: any[]; theme: any }) => {
    return (
        <List dense disablePadding sx={{ overflowY: "auto", position: 'relative', height: '100%' }}>
            <Box sx={{ display: "flex", width: "100%", justifyContent: "space-between", borderBottom: `1px solid ${theme.palette.divider}`, mb: 0.5, px: 0.5 }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: "bold", width: "35%" }}>User</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: "bold", width: "20%", textAlign: "center" }}>Prod.</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: "bold", width: "20%", textAlign: "center" }}>Cons.</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: "bold", width: "25%", textAlign: "right" }}>Net</Typography>
            </Box>
            
            {aggregatedData.length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", display: "block", mt: 0.5, textAlign: 'center' }}>
                    No bases assigned.
                </Typography>
            ) : (
                aggregatedData.map((data, index) => (
                    <ListItem key={index} disableGutters sx={{ py: 0.5, px: 0.5, borderBottom: `1px dashed ${theme.palette.divider}` }}>
                        <Box sx={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="caption" sx={{ width: "35%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: data.isRegistered ? "bold" : "normal", color: data.isRegistered ? theme.palette.primary.light : theme.palette.text.secondary }}>
                                {data.username}
                            </Typography>
                            <Typography variant="caption" sx={{ width: "20%", textAlign: "center", color: theme.palette.success.main, fontFamily: "monospace", fontWeight: 'bold' }}>
                                {Number(data.prod) > 0 ? `+${Number(data.prod).toFixed(1)}` : '-'}
                            </Typography>
                            <Typography variant="caption" sx={{ width: "20%", textAlign: "center", color: theme.palette.error.main, fontFamily: "monospace", fontWeight: 'bold' }}>
                                {Number(data.cons) > 0 ? `-${Number(data.cons).toFixed(1)}` : '-'}
                            </Typography>
                            <Typography variant="caption" sx={{ width: "25%", textAlign: "right", color: Number(data.net) >= 0 ? theme.palette.success.main : theme.palette.error.main, fontFamily: "monospace", fontWeight: 'bold' }}>
                                {Number(data.net) > 0 ? '+' : ''}{Number(data.net).toFixed(1)}
                            </Typography>
                        </Box>
                    </ListItem>
                ))
            )}
        </List>
    );
});

const TransportList = React.memo(({ nodeData, theme }: { nodeData: ChainNodeData; theme: any }) => {
    const trans = nodeData.transport || { manualTons: 0, manualVolume: 0, userShips: [] };
    
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', px: 0.5 }}>
            <Box sx={{ bgcolor: theme.palette.background.default, p: 1, borderRadius: 1, border: `1px dashed ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">Global Assigned Shipping</Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: theme.palette.primary.light }}>{Number(trans.manualTons || 0).toFixed(0)} t</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: theme.palette.primary.light }}>{Number(trans.manualVolume || 0).toFixed(0)} m³</Typography>
                </Box>
            </Box>
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">User Assigned Ships</Typography>
                <List dense disablePadding>
                    {trans.userShips && trans.userShips.length > 0 ? trans.userShips.map((ship: any, i: number) => (
                        <ListItem key={i} disableGutters sx={{ py: 0.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" fontWeight="bold" display="block" lineHeight={1.2}>{ship.shipName}</Typography>
                                    <Typography variant="caption" color="text.secondary" fontSize="0.65rem">{ship.username}</Typography>
                                </Box>
                                <Typography variant="caption" fontFamily="monospace" fontWeight="bold">{Number(ship.tons).toFixed(0)}t / {Number(ship.volume).toFixed(0)}m³</Typography>
                            </Box>
                        </ListItem>
                    )) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                            No ships assigned.
                        </Typography>
                    )}
                </List>
            </Box>
        </Box>
    );
});

const UserStorageList = React.memo(({ nodeData, theme, isLoading }: { nodeData: ChainNodeData; theme: any; isLoading?: boolean }) => {
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const toggleExpand = (username: string) => setExpandedUser(expandedUser === username ? null : username);

    return (
        <List dense disablePadding sx={{ overflowY: "auto", position: 'relative', height: '100%' }}>
            {isLoading && <LinearProgress color="secondary" sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 2 }} />}
            <Box sx={{ display: "flex", width: "100%", justifyContent: "space-between", borderBottom: `1px solid ${theme.palette.divider}`, mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: "bold", width: "35%" }}>User</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: "bold", width: "65%", textAlign: "right" }}>Stock / Cap.</Typography>
            </Box>
            {!nodeData.userStorage || nodeData.userStorage.length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", display: "block", mt: 0.5 }}>No storage data.</Typography>
            ) : (
                nodeData.userStorage.map((item: any, index: number) => {
                    const capacity = Number(item.capacity) || 1; 
                    const current = Number(item.current) || 0;
                    const percentage = (current / capacity) * 100;
                    const progressColor = percentage >= 95 ? "error" : percentage > 70 ? "warning" : "secondary";
                    const isExpanded = expandedUser === item.username;

                    return (
                        <Box key={index} sx={{ mb: 0.5, border: isExpanded ? `1px solid ${theme.palette.divider}` : "none", borderRadius: 1, bgcolor: isExpanded ? theme.palette.action.hover : "transparent" }}>
                            <ListItem disableGutters onClick={() => toggleExpand(item.username)} sx={{ py: 0, minHeight: 15, cursor: "pointer", "&:hover": { bgcolor: theme.palette.action.hover } }}>
                                <Box sx={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", width: "35%", overflow: "hidden", marginLeft: 1 }}>
                                        <StorageIcon fontSize="inherit" sx={{ color: theme.palette.info.light, mr: 0.5 }} />
                                        <Typography variant="caption">{item.username}</Typography>
                                    </Box>
                                    <Box sx={{ width: "65%", textAlign: "right", display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        <Typography variant="caption" sx={{ fontWeight: "bold", fontFamily: "monospace", mr: 1 }}>{current.toFixed(0)} / {capacity.toFixed(0)}</Typography>
                                        {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                    </Box>
                                </Box>
                            </ListItem>
                            <LinearProgress variant="determinate" value={percentage} color={progressColor as "error" | "warning" | "secondary"} sx={{ height: 4, mb: 0.5, mx: 1, borderRadius: 2 }} />
                        </Box>
                    );
                })
            )}
        </List>
    );
});

// ✅ UPDATED: Balance = Input - Need. Positive is Surplus (Green), Negative is Deficit (Red)
const NodeInputsList = React.memo(({ inputStatus, theme }: { inputStatus: Record<string, any>, theme: any }) => {
    const entries = Object.entries(inputStatus).sort((a, b) => b[1].need - a[1].need);

    const getBalanceColor = (balance: number) => {
        if (balance < 0) return theme.palette.error.main;   // Starving
        if (balance > 0) return theme.palette.success.main; // Oversupplied
        return theme.palette.text.primary;                  // Perfect
    };

    return (
        <List dense disablePadding sx={{ overflowY: "auto", height: '100%' }}>
            <Box sx={{ display: "flex", width: "100%", justifyContent: "space-between", borderBottom: `1px solid ${theme.palette.divider}`, mb: 0.5, px: 1 }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: "bold", width: "20%", textAlign: "left" }}>Ticker</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: "bold", width: "25%", textAlign: "right" }}>Need/d</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: "bold", width: "25%", textAlign: "right" }}>In/d</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: "bold", width: "30%", textAlign: "right" }}>Balance</Typography>
            </Box>
            {entries.length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", display: "block", mt: 0.5, px: 1 }}>No inputs required.</Typography>
            ) : (
                entries.map(([ticker, data]) => {
                    const balance = data.input - data.need;
                    return (
                        <ListItem key={ticker} disableGutters sx={{ py: 0, minHeight: 15 }}>
                            <Box sx={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", px: 1 }}>
                                <Typography sx={{ fontWeight: 500, width: "20%", fontSize: '0.85rem' }}>{ticker}</Typography>
                                <Typography variant="caption" sx={{ fontWeight: "bold", fontFamily: "monospace", width: "25%", textAlign: "right", color: theme.palette.text.primary }}>{Number(data.need).toFixed(1)}</Typography>
                                <Typography variant="caption" sx={{ fontWeight: "bold", fontFamily: "monospace", width: "25%", textAlign: "right", color: theme.palette.info.main }}>{Number(data.input).toFixed(1)}</Typography>
                                <Typography variant="caption" sx={{ fontWeight: "bold", fontFamily: "monospace", width: "30%", textAlign: "right", color: getBalanceColor(balance) }}>{balance > 0 ? '+' : ''}{balance.toFixed(1)}</Typography>
                            </Box>
                        </ListItem>
                    );
                })
            )}
        </List>
    );
});

const MinimalistFlowCard = React.memo(({ data, selected, isDragging }: any) => {
	const theme = useTheme();
	const nodeData: ChainNodeData = data;
	const { onEditNode, onDeleteNode, validationData, activeGroupId, staticData } = useContext(ConnectionToolContext);

	const [liveStorage, setLiveStorage] = useState<any[] | null>(null);
	const [isLoadingLive, setIsLoadingLive] = useState(false);

	useEffect(() => {
		let isMounted = true;
		const planetId = nodeData.planet?.planetid;

		if (activeGroupId && planetId && nodeData.materialTicker) {
			setIsLoadingLive(true);
			fetchNodeLiveData(activeGroupId, planetId, nodeData.materialTicker)
				.then(liveData => { if (isMounted) { setLiveStorage(liveData.userStorage || []); setIsLoadingLive(false); } })
				.catch(err => { console.error(`Failed to fetch live node data:`, err); if (isMounted) setIsLoadingLive(false); });
		}
		return () => { isMounted = false; };
	}, [activeGroupId, nodeData.planet?.planetid, nodeData.materialTicker]);

	const displayNodeData = useMemo(() => ({ ...nodeData, userStorage: liveStorage ?? nodeData.userStorage }), [nodeData, liveStorage]);

    const getPrice = (ticker: string) => {
        if (!staticData || !staticData.prices) return 0;
        return staticData.prices[ticker]?.market || 0; 
    };

    const nodeAggregation = useMemo(() => {
        return aggregateNodeProduction(displayNodeData.assignedUsers || [], displayNodeData.materialTicker || "UNK", staticData, getPrice);
    }, [displayNodeData.assignedUsers, displayNodeData.materialTicker, staticData]);

	const tickerColor = getTickerColor(nodeData.materialTicker || "UNK");
	const [activeListTab, setActiveListTab] = useState("Production");

	const sourceHandleId = `${data.materialTicker}-output`;
	const targetHandleId = `${data.materialTicker}-input`;

    const realProd = nodeAggregation.totalOutput;
    const realCons = nodeAggregation.totalConsumption;
    const realNet = nodeAggregation.netFlow;

	const netFlowColor = realNet >= 0 ? theme.palette.secondary.main : theme.palette.error.main;

	const isSource = validationData.sourceNodeId === nodeData.nodeId; 
	const isTargetCandidate = validationData.sourceNodeId && !isSource; 
	const isValidTarget = isTargetCandidate && validationData.validTargetNodeIds.has(nodeData.nodeId); 

	const borderColor = useMemo(() => {
		if (isSource) return COLOR_CONSTANTS.WARNING; 
		if (isTargetCandidate) return isValidTarget ? COLOR_CONSTANTS.SUCCESS : COLOR_CONSTANTS.ERROR;
		if (nodeData.locked) return COLOR_CONSTANTS.ERROR;
		return theme.palette.divider; 
	}, [isSource, isTargetCandidate, isValidTarget, theme.palette.divider, data.locked]);

	if (isDragging) {
		return (
			<Box sx={{ width: data.width || MIN_NODE_CARD_WIDTH, height: data.height || MIN_NODE_HEIGHT, minWidth: MIN_NODE_CARD_WIDTH, minHeight: MIN_NODE_HEIGHT, borderRadius: 4, border: `2px dashed ${theme.palette.secondary.main}`, backgroundColor: theme.palette.background.default, opacity: 0.7, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 0 10px rgba(0,0,0,0.5)", p: 2, pointerEvents: "none" }}>
				<Typography variant="body1" sx={{ fontWeight: "bold", mb: 0.5 }}>Dragging Node...</Typography>
				<Typography variant="h6" color="primary.main">{nodeData.materialTicker}</Typography>
				<Typography variant="caption" color="text.secondary">{nodeData.siteName}</Typography>
			</Box>
		);
	}

	const nodeStyle = {
		minWidth: MIN_NODE_CARD_WIDTH, maxWidth: 450,
        minHeight: MIN_NODE_HEIGHT, maxHeight: 500,
        borderRadius: 4, border: `2px solid ${borderColor}`,
		boxShadow: selected ? `0 0 15px ${theme.palette.secondary.dark}` : isSource || (isTargetCandidate && isValidTarget) ? `0 0 8px ${borderColor}` : "none",
		background: theme.palette.background.default, color: theme.palette.text.primary, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden",
	};

	return (
		<Card sx={nodeStyle}>
			<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, borderBottom: `1px solid ${theme.palette.divider}`, backgroundColor: tickerColor, color: "#fff" }}>
				<Box sx={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
					<Typography variant="body1" sx={{ fontWeight: "bold", mr: 1, textShadow: "0 0 2px #000" }}>{displayNodeData.materialTicker || "Group"}</Typography>
					<Typography variant="caption" sx={{ opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textShadow: "0 0 2px #000" }}>{displayNodeData.siteName}</Typography>
				</Box>

				<Box sx={{ display: "flex", gap: 1 }}>
					{!displayNodeData.locked ? (
						<>
							<Tooltip title="Edit Node" placement="top">
								<IconButton size="small" sx={{ color: "primary.main", backgroundColor: "white", borderRadius: "50%", boxShadow: 1, "&:hover": { backgroundColor: "grey.100" }, zIndex: 10 }} draggable={false} disableRipple disableFocusRipple disabled={displayNodeData.locked} onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }} onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }} onClick={(e) => { e.stopPropagation(); onEditNode?.(data); }}>
									<EditIcon fontSize="small" />
								</IconButton>
							</Tooltip>

							<Tooltip title="Delete Node" placement="top">
								<IconButton size="small" sx={{ color: "error.main", backgroundColor: "white", borderRadius: "50%", boxShadow: 1, "&:hover": { backgroundColor: "grey.100" }, zIndex: 10 }} draggable={false} disableRipple disableFocusRipple disabled={displayNodeData.locked} onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }} onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }} onClick={(e) => { e.stopPropagation(); onDeleteNode?.(data); }}>
									<DeleteIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						</>
					) : (
						<Tooltip title="Node locked by user editing." placement="top">
							<Icon sx={{ ml: 2 }}><WarningAmberSharp sx={{ color: COLOR_CONSTANTS.ERROR }} /></Icon>
						</Tooltip>
					)}
				</Box>
			</Box>

			<CardContent sx={{ p: 1, "&:last-child": { pb: 1 }, borderBottom: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
				<Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
					<Box sx={{ textAlign: "center" }}>
						<Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>Total Prod</Typography>
						<Typography variant="body2" sx={{ fontWeight: "bold", color: theme.palette.success.main, fontFamily: "monospace", lineHeight: 1.2 }}>+{realProd.toFixed(1)}</Typography>
					</Box>
					<Box sx={{ textAlign: "center" }}>
						<Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>Total Cons</Typography>
						<Typography variant="body2" sx={{ fontWeight: "bold", color: theme.palette.error.main, fontFamily: "monospace", lineHeight: 1.2 }}>-{realCons.toFixed(1)}</Typography>
					</Box>
					<Box sx={{ textAlign: "center" }}>
						<Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>Net Flow</Typography>
						<Typography variant="body2" sx={{ fontWeight: "bold", color: netFlowColor, fontFamily: "monospace", lineHeight: 1.2 }}>{realNet >= 0 ? "+" : ""}{realNet.toFixed(1)}</Typography>
					</Box>
				</Box>
			</CardContent>

			<Box sx={{ display: "flex", flexDirection: "row", gap: 1, flexGrow: 1, minHeight: 130, overflow: 'hidden', p: 1 }}>
				
                {displayNodeData.inputStatus && Object.keys(displayNodeData.inputStatus).length > 0 && (
					<Box sx={{ flex: '0 0 40%', minWidth: 0, borderRight: `1px solid ${theme.palette.divider}`, pr: 1, display: "flex", flexDirection: "column" }}>
						<Typography variant="caption" sx={{ fontWeight: "bold", color: theme.palette.text.secondary, display: "block", textAlign: 'center', mb: 0.5, flexShrink: 0 }}>Required Inputs</Typography>
                        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
						    <NodeInputsList inputStatus={displayNodeData.inputStatus} theme={theme}/>
                        </Box>
					</Box>
				)}
				
				<Box sx={{ flex: '1 1 auto', minWidth: 0, display: "flex", flexDirection: "column", overflow: 'hidden' }}>
					<Tabs
						value={activeListTab}
						onChange={(_e, newValue) => { setActiveListTab(newValue); }}
						sx={{ minHeight: 30, width: '100%', "& .MuiTabs-indicator": { backgroundColor: theme.palette.secondary.main } }}
						variant="fullWidth"
					>
						<Tab label="Production" value="Production" icon={<FormatListNumbered />} iconPosition="start" sx={{ minHeight: 30, p: 0, px: 1, "& .MuiTab-iconWrapper": { mr: 0.5 }, fontSize: "0.7rem" }} />
						<Tab label="Storage" value="Storage" icon={<StorageIcon />} iconPosition="start" sx={{ minHeight: 30, p: 0, px: 1, "& .MuiTab-iconWrapper": { mr: 0.5 }, fontSize: "0.7rem" }} />
						<Tab label="Transport" value="Transport" icon={<LocalShipping />} iconPosition="start" sx={{ minHeight: 30, p: 0, px: 1, "& .MuiTab-iconWrapper": { mr: 0.5 }, fontSize: "0.7rem" }} />
					</Tabs>

					<Box sx={{ flexGrow: 1, p: 0.5, overflowY: "auto" }}>
						{activeListTab === "Production" && <UserProductionList aggregatedData={nodeAggregation.userProd} theme={theme} />}
						{activeListTab === "Storage" && <UserStorageList nodeData={displayNodeData} theme={theme} isLoading={isLoadingLive} />}
						{activeListTab === "Transport" && <TransportList nodeData={displayNodeData} theme={theme} />}
					</Box>
				</Box>
			</Box>

			<Handle type="target" position={Position.Left} isConnectable={true} id={targetHandleId} hidden={displayNodeData.nodeType === 'Starter' || displayNodeData.isResource} style={{ width: 10, height: 10, background: isValidTarget ? COLOR_CONSTANTS.SUCCESS : isTargetCandidate ? COLOR_CONSTANTS.ERROR : theme.palette.primary.main }} />
			<Handle type="source" position={Position.Right} isConnectable={true} id={sourceHandleId} hidden={displayNodeData.nodeType === 'End' || displayNodeData.isEndMaterial} style={{ width: 10, height: 10, background: isSource ? COLOR_CONSTANTS.WARNING : theme.palette.secondary.main }} />

			{isTargetCandidate && (
				<Box sx={{ position: "absolute", top: 2, left: 2, width: 15, height: 15, borderRadius: "50%", backgroundColor: isValidTarget ? COLOR_CONSTANTS.SUCCESS : COLOR_CONSTANTS.ERROR, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, border: "1px solid #fff" }}>
					{isValidTarget ? <Check sx={{ fontSize: 10, color: "#fff" }} /> : <CloseIcon sx={{ fontSize: 10, color: "#fff" }} />}
				</Box>
			)}
		</Card>
	);
});

export default MinimalistFlowCard;