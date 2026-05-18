import React, {
	useState,
	useEffect,
	useCallback,
	useImperativeHandle,
	useMemo,
	forwardRef,
} from "react";
import ReactFlow, {
	useNodesState,
	useEdgesState,
	Background,
	Controls,
	useReactFlow,
	addEdge,
	applyNodeChanges,
	applyEdgeChanges,
	MarkerType,
} from "reactflow";
import type {
	OnNodesChange,
	OnEdgesChange,
	Viewport,
	Connection,
	Edge,
	Node,
	NodeDragHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { Box, Button, Tooltip, useTheme } from "@mui/material";
import {
	Add as Plus,
	BugReport,
	DashboardCustomize,
} from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";

import type {
	Chain,
	ChainLinkData,
	ProductionChainViewerHandle,
	ProductionChainViewerProps,
	ChainNodeData,
	CursorMovePayload,
	SyncMessage,
	NodeValidationData,
	InputStatus,
} from "./types";
import {
	transformChainToRF,
	createNodeId,
	ConnectionToolContext,
	transformRFToChain,
	validateConnection,
	getTickerColor,
	shallowEqual,
} from "./helpers";

import { aggregateNodeProduction } from "../../components/basemanager/helpers";

import LiveCursorRenderer from "./livecursorrenderer";
import { NODE_TYPES } from "./nodetypes";
import TransshipmentEdge from "./edgestypes";

const useMouseSync = (
	onSendSyncMessage: ProductionChainViewerProps["onSendSyncMessage"],
	displayName: string,
	viewport: Viewport,
) => {
	const { screenToFlowPosition } = useReactFlow();
	const lastSentRef = React.useRef(0);
	const THROTTLE_MS = 50;

	const handleMouseMove = useCallback(
		(event: React.MouseEvent) => {
			if (Date.now() - lastSentRef.current < THROTTLE_MS) return;

			const flowPosition = screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			const message: Omit<SyncMessage, "userId"> = {
				type: "CURSOR_MOVE",
				payload: {
					x: flowPosition.x,
					y: flowPosition.y,
					viewportZoom: viewport.zoom,
					userDisplayName: displayName,
				} as CursorMovePayload,
			};

			onSendSyncMessage(message);
			lastSentRef.current = Date.now();
		},
		[onSendSyncMessage, screenToFlowPosition, viewport.zoom, displayName],
	);

	return handleMouseMove;
};

const edgeTypes = {
	transshipment: TransshipmentEdge,
};

const ProductionChainViewer = forwardRef<
	ProductionChainViewerHandle,
	ProductionChainViewerProps
>(
	(
		{
			initialChain,
			onChainUpdate,
			materials,
			onEditNode,
			onDeleteNode,
			onAddNodeClick,
			onSendSyncMessage,
			canEdit,
			remoteCursors,
			lockedNode,
			userId,
			activeGroupId,
			staticData,
		},
		ref,
	) => {
		const { fitView, getViewport } = useReactFlow();
		const [nodes, setNodes] = useNodesState([]);
		const [edges, setEdges] = useEdgesState([]);
		const [connectionMode, _setConnectionMode] = useState(false);
		const [sourceRFNode, _setSourceRFNode] =
			useState<Node<ChainNodeData> | null>(null);
		const [viewport, setLocalViewport] = useState(getViewport());
		const [validationData, setValidationData] = useState<NodeValidationData>({
			sourceNodeId: null,
			validTargetNodeIds: new Set(),
		});
		const theme = useTheme();

		useEffect(() => {
			if (!initialChain) return;

			const chainWithLockStatus = initialChain.nodes?.map((n) => {
				const isLocked = lockedNode?.some(
					(lock: any) => lock.nodeId === n.nodeId,
				);
				return { ...n, locked: isLocked };
			});

			const { rfNodes: newRFNodes, rfEdges: newRFEdges } = transformChainToRF(
				{
					nodes: chainWithLockStatus,
					links: initialChain.links,
				},
				materials,
			);

			const restoredNodes = newRFNodes.map((n) => {
				if (n.data?.materialTicker === "GROUP") {
					return {
						...n,
						type: "groupNode",
						style: {
							width: (n.data as any).width || 600,
							height: (n.data as any).height || 400,
						},
						zIndex: -1,
					};
				}
				if ((n.data as any).parentNode) {
					return { ...n, parentNode: (n.data as any).parentNode };
				}
				return n;
			});

			setNodes((prevNodes) => {
				if (prevNodes.length !== restoredNodes.length) return restoredNodes;

				const nodeIsDifferent = restoredNodes.some((newNode, index) => {
					const prevNode = prevNodes[index];
					if (
						!prevNode ||
						prevNode.id !== newNode.id ||
						prevNode.position.x !== newNode.position.x ||
						prevNode.position.y !== newNode.position.y
					)
						return true;

					if (!shallowEqual(prevNode.data, newNode.data)) return true;
					return false;
				});

				if (nodeIsDifferent) return restoredNodes;
				return prevNodes;
			});

			setEdges((prevEdges) => {
				if (prevEdges.length !== newRFEdges.length) return newRFEdges;
				return prevEdges;
			});
		}, [initialChain, setNodes, setEdges, lockedNode]);

		const getNewChainState = useCallback(
			(
				latestNodes: Node<ChainNodeData>[],
				latestEdges: Edge<ChainLinkData>[],
			): Chain => {
				const preparedNodes = latestNodes.map((n) => {
					if (n.type === "groupNode") {
						return {
							...n,
							data: {
								...n.data,
								width: n.style?.width || (n.data as any).width || 600,
								height: n.style?.height || (n.data as any).height || 400,
							},
						};
					}
					if (n.parentNode) {
						return { ...n, data: { ...n.data, parentNode: n.parentNode } };
					} else if ((n.data as any).parentNode) {
						const { parentNode, ...cleanData } = n.data as any;
						return { ...n, data: cleanData };
					}
					return n;
				});
				return transformRFToChain(preparedNodes, latestEdges);
			},
			[],
		);

		const handleNodeChanges: OnNodesChange = useCallback(
			(changes) => {
				if (!canEdit) return;

				const nextNodes = applyNodeChanges(changes, nodes);
				setNodes(nextNodes);

				const syncChanges = changes.filter(
					(c) => c.type === "position" || c.type === "remove",
				);

				if (syncChanges.length > 0) {
					const syncMessage: Omit<SyncMessage, "userId"> = {
						type: "NODE_MOVE",
						payload: syncChanges[0],
					};
					onSendSyncMessage(syncMessage);
				}

				const dragEndChange = changes.some(
					(c) => c.type === "position" && c.dragging === false,
				);
				const resizeChange = changes.some((c) => c.type === "dimensions");
				const removeChange = changes.some((c) => c.type === "remove");

				if (dragEndChange || removeChange || resizeChange) {
					const newChain = getNewChainState(nextNodes, edges);
					onChainUpdate(newChain);
				}
			},
			[
				nodes,
				edges,
				canEdit,
				setNodes,
				getNewChainState,
				onChainUpdate,
				onSendSyncMessage,
			],
		);

		const handleEdgeChanges: OnEdgesChange = useCallback(
			(changes) => {
				if (!canEdit) return;

				const nextEdges = applyEdgeChanges(changes, edges);
				setEdges(nextEdges);

				const removeChanges = changes.filter((c) => c.type === "remove");
				if (removeChanges.length > 0) {
					const syncMessage: Omit<SyncMessage, "userId"> = {
						type: "EDGE_UPDATE",
						payload: removeChanges[0],
					};
					onSendSyncMessage(syncMessage);
				}

				const newChain = getNewChainState(nodes, nextEdges);
				onChainUpdate(newChain);
			},
			[
				nodes,
				edges,
				canEdit,
				setEdges,
				getNewChainState,
				onChainUpdate,
				onSendSyncMessage,
			],
		);

		const isValidConnection = useCallback(
			(connection: Connection): boolean => {
				const sourceRFNode = nodes.find((n) => n.id === connection.source);
				const targetRFNode = nodes.find((n) => n.id === connection.target);

				if (!sourceRFNode || !targetRFNode) return false;

				const sourceChainNodeData = sourceRFNode.data as ChainNodeData;
				const targetChainNodeData = targetRFNode.data as ChainNodeData;

				if (
					sourceChainNodeData.siteName.includes("Mock") ||
					targetChainNodeData.siteName.includes("Mock")
				)
					return true;

				return validateConnection(
					sourceChainNodeData,
					targetChainNodeData,
					materials,
				);
			},
			[nodes, materials],
		);

		const onConnect = useCallback(
			(connection: Connection) => {
				if (!canEdit) return;

				const newEdges = addEdge(
					{
						...connection,
						markerEnd: {
							type: MarkerType.ArrowClosed,
							color: getTickerColor(connection.sourceHandle!.split("-")[0]),
						},
						type: "default",
						id: `${connection.source}-${connection.target}`,

						style: {
							strokeWidth: 2,
							stroke: getTickerColor(connection.sourceHandle!.split("-")[0]),
						},
						data: {
							source: connection.source,
							sourceHandle: connection.sourceHandle,
							target: connection.target,
							targetHandle: connection.targetHandle,
						} as unknown as ChainLinkData,
					},
					edges,
				);
				setEdges(newEdges);

				const syncMessage: Omit<SyncMessage, "userId"> = {
					type: "EDGE_UPDATE",
					payload: { type: "add", item: newEdges.at(-1) },
				};
				onSendSyncMessage(syncMessage);

				const newChain = getNewChainState(nodes, newEdges);
				onChainUpdate(newChain);
			},
			[
				edges,
				nodes,
				canEdit,
				getNewChainState,
				onChainUpdate,
				onSendSyncMessage,
				setEdges,
			],
		);

		const onDrop = useCallback(
			(event: React.DragEvent) => {
				event.preventDefault();
				if (!canEdit) return;

				const newId = createNodeId("NEW", uuidv4());
				const newNode: Node<ChainNodeData> = {
					id: newId,
					type: "minimalistNode",
					position: { x: 0, y: 0 },
					data: {
						nodeId: newId,
						materialTicker: "NEW",
						siteName: "Site-A",
						productionRate: 0,
					} as ChainNodeData,
				};
				const newNodes = [...nodes, newNode];
				setNodes(newNodes);

				const syncMessage: Omit<SyncMessage, "userId"> = {
					type: "NODE_UPDATE",
					payload: { type: "add", item: newNode },
				};
				onSendSyncMessage(syncMessage);

				const newChain = getNewChainState(newNodes, edges);
				onChainUpdate(newChain);
			},
			[
				nodes,
				edges,
				canEdit,
				getNewChainState,
				onChainUpdate,
				onSendSyncMessage,
				setNodes,
			],
		);

		const onConnectStart = useCallback(
			(_: any, { nodeId }: { nodeId: string | null }) => {
				if (!nodeId) {
					setValidationData({
						sourceNodeId: null,
						validTargetNodeIds: new Set(),
					});
					return;
				}

				const sourceRFNode = nodes.find((n) => n.id === nodeId);
				if (!sourceRFNode) return;
				const sourceChainNodeData = sourceRFNode.data as ChainNodeData;

				const allTargetNodes = initialChain?.nodes?.filter(
					(n) => n.nodeId !== nodeId,
				);
				const validIds = new Set<string>();

				allTargetNodes?.forEach((targetNodeData) => {
					if (
						targetNodeData.siteName.includes("Mock") ||
						sourceChainNodeData.siteName.includes("Mock")
					) {
						validIds.add(targetNodeData.nodeId);
					} else {
						const isForwardValid = validateConnection(
							sourceChainNodeData,
							targetNodeData,
							materials,
						);
						const isReverseValid = validateConnection(
							targetNodeData,
							sourceChainNodeData,
							materials,
						);

						if (isForwardValid || isReverseValid) {
							validIds.add(targetNodeData.nodeId);
						}
					}
				});

				setValidationData({
					sourceNodeId: nodeId,
					validTargetNodeIds: validIds,
				});
			},
			[initialChain.nodes, nodes, materials, setValidationData],
		);

		const onConnectEnd = useCallback(() => {
			setValidationData({ sourceNodeId: null, validTargetNodeIds: new Set() });
		}, []);

		const onMoveEnd = useCallback(
			(_: any, viewport: React.SetStateAction<Viewport>) => {
				setLocalViewport(viewport);
			},
			[],
		);

		const handleMouseMove = useMouseSync(
			onSendSyncMessage,
			localStorage.getItem("displayName") || "",
			viewport,
		);

		interface LockedNodeState {
			nodeId: string;
			userId: string;
		}

		const isNodeLockedByOther = useCallback(
			(
				nodeId: string,
				lockedNode: LockedNodeState[] | null,
				currentUserId: string,
			): boolean => {
				if (!lockedNode) return false;
				return lockedNode.some(
					(lock) => lock.nodeId === nodeId && lock.userId !== currentUserId,
				);
			},
			[],
		);

		const handleNodeDragStart: NodeDragHandler = useCallback(
			(event, node: Node, _nodes: Node[]) => {
				const isLocked = isNodeLockedByOther(node.id, lockedNode, userId);
				if (isLocked) {
					event.preventDefault();
					return;
				}
				onSendSyncMessage({
					type: "NODE_LOCKED",
					payload: { nodeId: node.id, userId: userId },
				});
			},
			[isNodeLockedByOther, lockedNode, userId, onSendSyncMessage],
		);

		const handleNodeDragStop: NodeDragHandler = useCallback(
			(_event, node: Node, currentNodes: Node[]) => {
				onSendSyncMessage({
					type: "NODE_UNLOCK",
					payload: { nodeId: node.id, userId: userId },
				});

				if (node.type === "groupNode") return;

				setNodes((prevNodes) => {
					const draggedNode = prevNodes.find((n) => n.id === node.id);
					if (!draggedNode) return prevNodes;

					const nodeAbsX = node.positionAbsolute?.x ?? node.position.x;
					const nodeAbsY = node.positionAbsolute?.y ?? node.position.y;
					const nodeW = node.width || 300;
					const nodeH = node.height || 150;
					const centerX = nodeAbsX + nodeW / 2;
					const centerY = nodeAbsY + nodeH / 2;

					let targetGroup = null;

					for (let i = prevNodes.length - 1; i >= 0; i--) {
						const n = prevNodes[i];
						if (n.type === "groupNode" && n.id !== node.id) {
							const gx = n.positionAbsolute?.x ?? n.position.x;
							const gy = n.positionAbsolute?.y ?? n.position.y;
							const gw = n.width || parseInt(n.style?.width as string) || 600;
							const gh = n.height || parseInt(n.style?.height as string) || 400;

							if (
								centerX >= gx &&
								centerX <= gx + gw &&
								centerY >= gy &&
								centerY <= gy + gh
							) {
								targetGroup = n;
								break;
							}
						}
					}

					let nextNodes = [...prevNodes];
					let needsSave = false;

					if (targetGroup) {
						const groupAbsX =
							targetGroup.positionAbsolute?.x ?? targetGroup.position.x;
						const groupAbsY =
							targetGroup.positionAbsolute?.y ?? targetGroup.position.y;
						let groupW =
							targetGroup.width ||
							parseInt(targetGroup.style?.width as string) ||
							600;
						let groupH =
							targetGroup.height ||
							parseInt(targetGroup.style?.height as string) ||
							400;

						const relX = nodeAbsX - groupAbsX;
						const relY = nodeAbsY - groupAbsY;

						const PADDING = 20;
						let expanded = false;
						if (relX + nodeW + PADDING > groupW) {
							groupW = relX + nodeW + PADDING;
							expanded = true;
						}
						if (relY + nodeH + PADDING > groupH) {
							groupH = relY + nodeH + PADDING;
							expanded = true;
						}

						nextNodes = nextNodes.map((n) => {
							if (n.id === node.id) {
								if (n.parentNode !== targetGroup.id) needsSave = true;
								return {
									...n,
									parentNode: targetGroup.id,
									position: { x: relX, y: relY },
								};
							}
							if (expanded && n.id === targetGroup.id) {
								needsSave = true;
								return {
									...n,
									style: { ...n.style, width: groupW, height: groupH },
									data: { ...n.data, width: groupW, height: groupH },
								};
							}
							return n;
						});
					} else if (draggedNode.parentNode) {
						needsSave = true;
						nextNodes = nextNodes.map((n) => {
							if (n.id === node.id) {
								return {
									...n,
									parentNode: undefined,
									position: { x: nodeAbsX, y: nodeAbsY },
								};
							}
							return n;
						});
					}

					if (needsSave) {
						setTimeout(() => {
							onChainUpdate(getNewChainState(nextNodes, edges));
						}, 0);
					}

					return nextNodes;
				});
			},
			[
				onSendSyncMessage,
				userId,
				setNodes,
				edges,
				getNewChainState,
				onChainUpdate,
			],
		);

		const getPrice = useCallback(
			(ticker: string) => {
				if (!staticData || !staticData.prices) return 0;
				return staticData.prices[ticker]?.market || 0;
			},
			[staticData],
		);

		// ✅ REBUILT: Fully parses Node Net Flows dynamically across edges!
		const computeFlows = (nodes: Node[], edges: Edge[]) => {
			const inputStatusMap: Record<string, InputStatus> = {};
			const nodeNetFlows: Record<string, number> = {};
			const edgeFlows: Record<string, number> = {};

			nodes.forEach((node) => {
				if (node.type === "groupNode") return;

				const agg = aggregateNodeProduction(
					node.data?.assignedUsers || [],
					node.data?.materialTicker || "UNK",
					staticData,
					getPrice,
				);

				nodeNetFlows[node.id] = agg.netFlow;

				const inputStatus: InputStatus = {};
				Object.entries(agg.aggregatedInputs).forEach(([ticker, need]) => {
					inputStatus[ticker] = { need, input: 0, deficit: need };
				});

				if (Object.keys(inputStatus).length > 0) {
					inputStatusMap[node.id] = inputStatus;
				}
			});

			const edgesBySource: Record<string, Edge[]> = {};
			edges.forEach((edge) => {
				if (!edgesBySource[edge.source]) edgesBySource[edge.source] = [];
				edgesBySource[edge.source].push(edge);
			});

			Object.entries(edgesBySource).forEach(([sourceId, sourceEdges]) => {
				const sourceNode = nodes.find((n) => n.id === sourceId);
				if (!sourceNode) return;

				const sourceTicker = sourceNode.data?.materialTicker;
				const availableFlow = nodeNetFlows[sourceId] || 0;

				if (availableFlow <= 0 || !sourceTicker) return;

				let totalDemand = 0;
				const targetDemands: {
					targetId: string;
					demand: number;
					edgeId: string;
				}[] = [];

				sourceEdges.forEach((edge) => {
					const targetNode = nodes.find((n) => n.id === edge.target);
					if (!targetNode) return;

					const targetStatus = inputStatusMap[targetNode.id]?.[sourceTicker];
					const demand = targetStatus ? targetStatus.need : 0;
					totalDemand += demand;
					targetDemands.push({
						targetId: targetNode.id,
						demand,
						edgeId: edge.id,
					});
				});

				targetDemands.forEach(({ targetId, demand, edgeId }) => {
					let allocatedFlow = 0;
					if (totalDemand > 0) {
						allocatedFlow = availableFlow * (demand / totalDemand);
					} else {
						allocatedFlow = availableFlow / targetDemands.length;
					}

					edgeFlows[edgeId] = allocatedFlow;

					const targetStatus = inputStatusMap[targetId]?.[sourceTicker];
					if (targetStatus) {
						targetStatus.input += allocatedFlow;
						targetStatus.deficit = targetStatus.need - targetStatus.input;
					}
				});
			});

			return { inputStatusMap, nodeNetFlows, edgeFlows };
		};

		const flows = useMemo(() => {
			return computeFlows(nodes, edges);
		}, [nodes, edges, staticData, getPrice]);

		// INJECT LIVE MATH INTO REACT FLOW NODES & EDGES!
		const enrichedNodes = useMemo(() => {
			return nodes.map((n) => ({
				...n,
				data: {
					...n.data,
					inputStatus: flows.inputStatusMap[n.id] || {},
					netFlow: flows.nodeNetFlows[n.id] || 0,
				},
			}));
		}, [nodes, flows]);

		const enrichedEdges = useMemo(() => {
			return edges.map((e) => ({
				...e,
				data: {
					...e.data,
					flowRate: flows.edgeFlows[e.id] || 0,
				},
			}));
		}, [edges, flows]);

		useImperativeHandle(ref, () => ({
			getNodes: () => nodes,
			getEdges: () => edges,
			fitView: fitView,
		}));

		const connectionToolContextValue = useMemo(
			() => ({
				connectionMode,
				sourceNodeData: sourceRFNode,
				materials,
				onEditNode,
				onDeleteNode,
				validationData,
				activeGroupId,
				staticData,
			}),
			[
				connectionMode,
				sourceRFNode,
				materials,
				onEditNode,
				onDeleteNode,
				validationData,
				activeGroupId,
				staticData,
			],
		);
		const nodeTypes = useMemo(() => NODE_TYPES, []);

		const handleLoadTestChain = () => {
			// ... MOCK DATA OMITTED ...
		};

		const handleAddGroupArea = () => {
			if (!canEdit) return;
			const groupId = `group-${uuidv4()}`;

			const newNode: Node<ChainNodeData> = {
				id: groupId,
				type: "groupNode",
				position: { x: viewport.x * -1 + 100, y: viewport.y * -1 + 100 },
				style: { width: 600, height: 400 },
				zIndex: -1,
				data: {
					nodeId: groupId,
					nodeType: "Normal",
					materialTicker: "GROUP",
					siteName: "New Sector / System",
					description: "",
					locked: false,
					productionRate: 0,
					consumptionRatio: 0,
					netFlow: 0,
					productionUnit: "",
					statusColor: "",
					productionBuilding: "",
					userFlows: [],
					userStorage: [],
					assignedUsers: [],
					isResource: false,
					isEndMaterial: false,
					width: 600,
					height: 400,
				} as any,
			};
			const newNodes = [...nodes, newNode];
			setNodes(newNodes);
			onChainUpdate(getNewChainState(newNodes, edges));
		};

		return (
			<ConnectionToolContext.Provider value={connectionToolContextValue}>
				<Box
					className="production-chain-viewer"
					sx={{ width: "100%", height: "100%", position: "relative" }}
					onMouseMove={handleMouseMove}
				>
					<ReactFlow
						nodes={enrichedNodes}
						edges={enrichedEdges} // <--- USING ENRICHED EDGES HERE!
						edgeTypes={edgeTypes}
						onNodesChange={handleNodeChanges}
						onEdgesChange={handleEdgeChanges}
						onConnect={onConnect}
						onDrop={onDrop}
						onDragOver={(event) => event.preventDefault()}
						onNodeDragStart={handleNodeDragStart}
						onNodeDragStop={handleNodeDragStop}
						onMoveEnd={onMoveEnd}
						nodeTypes={nodeTypes}
						onConnectStart={onConnectStart}
						onConnectEnd={onConnectEnd}
						nodesDraggable={canEdit}
						nodesConnectable={canEdit && !connectionMode}
						elementsSelectable={canEdit}
						deleteKeyCode={["Delete", "Backspace"]}
						isValidConnection={isValidConnection}
						fitView
					>
						<Controls
							showZoom={true}
							showFitView={true}
							showInteractive={canEdit}
						/>
						<Background
							style={{ background: theme.palette.background.default }}
							gap={12}
							size={1}
						/>
						<LiveCursorRenderer remoteCursors={remoteCursors} />
					</ReactFlow>

					<Box
						sx={{
							position: "absolute",
							top: 10,
							right: 10,
							zIndex: 10,
							display: "flex",
							gap: 1,
						}}
					>
						<Tooltip title="Spawn Full Test Chain">
							<Button
								variant="outlined"
								onClick={handleLoadTestChain}
								startIcon={<BugReport />}
								color="warning"
								sx={{ bgcolor: "background.paper" }}
							>
								Load Chain Test
							</Button>
						</Tooltip>
						<Tooltip title="Add Location Boundary Box">
							<Button
								variant="outlined"
								onClick={handleAddGroupArea}
								startIcon={<DashboardCustomize />}
								color="info"
								sx={{ bgcolor: "background.paper" }}
							>
								Add Group Area
							</Button>
						</Tooltip>
						<Tooltip title="Add New Node">
							<Button
								variant="contained"
								onClick={onAddNodeClick}
								startIcon={<Plus />}
								color="secondary"
							>
								Add Node
							</Button>
						</Tooltip>
					</Box>
				</Box>
			</ConnectionToolContext.Provider>
		);
	},
);

export default ProductionChainViewer;
