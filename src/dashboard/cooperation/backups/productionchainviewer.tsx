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
//import { useTheme } from '@mui/material/styles';
import { Add as Plus } from "@mui/icons-material";

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
	Material,
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

import LiveCursorRenderer from "./livecursorrenderer";
import { NODE_TYPES } from "./nodetypes";
import TransshipmentEdge from "./edgestypes";

// --- Custom Hook for Mouse Movement Sync ---
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
	// Register your custom edge type
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
		},
		ref,
	) => {
		//const theme = useTheme();
		const { fitView, getViewport } = useReactFlow();
		const [nodes, setNodes] = useNodesState([]);
		const [edges, setEdges] = useEdgesState([]);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [connectionMode, _setConnectionMode] = useState(false);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

				return {
					...n,
					locked: isLocked,
				};
			});

			const { rfNodes: newRFNodes, rfEdges: newRFEdges } = transformChainToRF(
				{
					nodes: chainWithLockStatus,
					links: initialChain.links,
				},
				materials,
			);

			setNodes((prevNodes) => {
				if (prevNodes.length !== newRFNodes.length) {
					return newRFNodes;
				}

				const nodeIsDifferent = newRFNodes.some((newNode, index) => {
					const prevNode = prevNodes[index];

					if (
						!prevNode ||
						prevNode.id !== newNode.id ||
						prevNode.position.x !== newNode.position.x ||
						prevNode.position.y !== newNode.position.y
					) {
						return true;
					}

					if (!shallowEqual(prevNode.data, newNode.data)) {
						return true;
					}

					return false;
				});

				if (nodeIsDifferent) {
					return newRFNodes;
				}

				return prevNodes;
			});

			setEdges((prevEdges) => {
				if (prevEdges.length !== newRFEdges.length) {
					return newRFEdges;
				}
				return prevEdges;
			});
		}, [initialChain, setNodes, setEdges, lockedNode]);

		// 3. Transformation Helpers (Assume transformRFToChain exists in helpers.ts)
		const getNewChainState = useCallback(
			(
				latestNodes: Node<ChainNodeData>[],
				latestEdges: Edge<ChainLinkData>[],
			): Chain => {
				// MOCK: This function MUST be implemented in your helpers.ts
				return transformRFToChain(latestNodes, latestEdges);
			},
			[],
		);

		// 4. Custom Node/Edge Change Handlers (CRITICAL: SEND SYNC MESSAGE HERE)

		// Handler for Node changes (Move, Delete)
		const handleNodeChanges: OnNodesChange = useCallback(
			(changes) => {
				if (!canEdit) return;

				// Apply changes to local state immediately for smooth UI
				const nextNodes = applyNodeChanges(changes, nodes);
				setNodes(nextNodes);

				// 1. Filter for sync messages (Position/Remove)
				// NOTE: We do NOT need to check if it's the end of a drag for real-time sync.
				// We want collaborators to see the drag in real-time.
				const syncChanges = changes.filter(
					(c) => c.type === "position" || c.type === "remove",
				);

				if (syncChanges.length > 0) {
					const syncMessage: Omit<SyncMessage, "userId"> = {
						// Keep the type as NODE_MOVE for the minimal update on the backend
						type: "NODE_MOVE",
						payload: syncChanges[0], // Send the minimal change set
					};
					onSendSyncMessage(syncMessage);
				}

				// 2. Identify the END of a drag operation to trigger the full, heavy save.
				// This is the CRITICAL change to fix lag.
				const dragEndChange = changes.some(
					(c) => c.type === "position" && c.dragging === false,
				);

				// Also trigger a save for NODE_REMOVE operations, which is always final.
				const removeChange = changes.some((c) => c.type === "remove");

				if (dragEndChange || removeChange) {
					// Only perform the expensive full chain transformation and save once
					// after the drag is complete or a node is removed.
					const newChain = getNewChainState(nextNodes, edges);

					// This call should be debounced on the backend (as previously implemented)
					onChainUpdate(newChain);
				}
			},
			[
				nodes,
				edges,
				canEdit,
				setNodes,
				getNewChainState,
				onChainUpdate, // This function should now only be called once per drag end
				onSendSyncMessage,
			],
		);

		// Handler for Edge changes (Delete)
		const handleEdgeChanges: OnEdgesChange = useCallback(
			(changes) => {
				if (!canEdit) return;

				const nextEdges = applyEdgeChanges(changes, edges);
				setEdges(nextEdges);

				// 1. Send sync message for real-time collaborator view
				const removeChanges = changes.filter((c) => c.type === "remove");
				if (removeChanges.length > 0) {
					const syncMessage: Omit<SyncMessage, "userId"> = {
						type: "EDGE_UPDATE", // Re-using type for delete
						payload: removeChanges[0], // Send the minimal change set
					};
					onSendSyncMessage(syncMessage);
				}

				// 2. Trigger the debounced full save
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
				// 1. Get the source and target node objects from the nodes state
				const sourceRFNode = nodes.find((n) => n.id === connection.source);
				const targetRFNode = nodes.find((n) => n.id === connection.target);

				if (!sourceRFNode || !targetRFNode) {
					// Should not happen, but safe check
					return false;
				}

				// 2. Extract the underlying ChainNodeData
				const sourceChainNodeData = sourceRFNode.data as ChainNodeData;
				const targetChainNodeData = targetRFNode.data as ChainNodeData;

				// 3. Run the validation logic. If this returns false, the connection cannot be completed.
				const isConnectionValid = validateConnection(
					sourceChainNodeData,
					targetChainNodeData,
					materials,
				);

				// Note: The drag direction is irrelevant here; we only check if the connection (Source -> Target) is valid.
				return isConnectionValid;
			},
			[nodes, materials],
		);

		// Handler for New Edge Connection
		const onConnect = useCallback(
			(connection: Connection) => {
				if (!canEdit) return;
				console.log(connection);

				// 1. Add the edge locally
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
				console.log(newEdges);

				// 2. Send sync message for real-time collaborator view
				const syncMessage: Omit<SyncMessage, "userId"> = {
					type: "EDGE_UPDATE",
					payload: { type: "add", item: newEdges.at(-1) }, // Send the new edge object
				};
				onSendSyncMessage(syncMessage);

				// 3. Trigger the debounced save with the new state
				const newChain = getNewChainState(nodes, newEdges);
				console.log(newChain);
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

		// Handler for Dropping a new node (e.g., from a sidebar) not used for now
		const onDrop = useCallback(
			(event: React.DragEvent) => {
				// ... (existing onDrop logic) ...
				event.preventDefault();

				if (!canEdit) return;

				// MOCK: Assuming the newNode is created and added to `newNodes`
				const newNode: Node<ChainNodeData> = {
					// ... (newNode data remains the same)
					id: createNodeId("NEW", Date.now().toString()),
					type: "minimalistNode",
					position: { x: 0, y: 0 }, // Simplified
					data: {
						materialTicker: "NEW",
						siteName: "Site-A",
						productionRate: 0,
					} as ChainNodeData,
				};
				const newNodes = [...nodes, newNode];
				setNodes(newNodes);

				// 1. Send sync message for real-time collaborator view
				const syncMessage: Omit<SyncMessage, "userId"> = {
					type: "NODE_UPDATE", // Using update for add (type: 'add' implied by payload)
					payload: { type: "add", item: newNode },
				};
				onSendSyncMessage(syncMessage);

				// 2. Trigger the debounced save
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

		// Handler for when a user starts dragging a connection line
		const onConnectStart = useCallback(
			(_: any, { nodeId }: { nodeId: string | null }) => {
				// 1. Reset or set the source node ID
				if (!nodeId) {
					setValidationData({
						sourceNodeId: null,
						validTargetNodeIds: new Set(),
					});
					return;
				}

				// 2. Find the actual ChainNodeData object for the source
				const sourceRFNode = nodes.find((n) => n.id === nodeId);
				if (!sourceRFNode) return;
				const sourceChainNodeData = sourceRFNode.data as ChainNodeData;

				// 3. Find all potential target nodes (excluding the source node itself)
				// Note: Using `initialChain.nodes` which is the full list from your data model
				const allTargetNodes = initialChain?.nodes?.filter(
					(n) => n.nodeId !== nodeId,
				);

				// 4. Determine valid targets by checking BOTH forward and reverse flow
				const validIds = new Set<string>();

				allTargetNodes?.forEach((targetNodeData) => {
					// Check 1: Forward Flow (SourceNode's output -> TargetNode's input)
					// This is the standard data flow direction.
					const isForwardValid = validateConnection(
						sourceChainNodeData, // Source
						targetNodeData, // Target
						materials,
					);

					// Check 2: Reverse Flow (TargetNode's output -> SourceNode's input)
					// This enables the visual cue if the user drags the mouse from the destination node's handle.
					const isReverseValid = validateConnection(
						targetNodeData, // Source
						sourceChainNodeData, // Target
						materials,
					);

					// If EITHER direction is valid, we highlight the target node.
					if (isForwardValid || isReverseValid) {
						validIds.add(targetNodeData.nodeId);
					}
				});

				console.log(validIds);

				// 5. Update state to trigger re-render of nodes
				setValidationData({
					sourceNodeId: nodeId,
					validTargetNodeIds: validIds,
				});
			},
			// Added setValidationData to dependencies for correctness
			[initialChain.nodes, nodes, materials, setValidationData],
		);

		// Handler for when a connection drag ends (or is cancelled)
		const onConnectEnd = useCallback(() => {
			// Reset validation state when the connection process ends
			setValidationData({ sourceNodeId: null, validTargetNodeIds: new Set() });
		}, []);

		// --- Viewport/Mouse Sync Logic ---
		const onMoveEnd = useCallback(
			(_: any, viewport: React.SetStateAction<Viewport>) => {
				setLocalViewport(viewport); // Update local viewport state
			},
			[],
		);

		// Hook to handle sending mouse movements
		const handleMouseMove = useMouseSync(
			onSendSyncMessage,
			localStorage.getItem("displayName") || "",
			viewport,
		);

		interface LockedNodeState {
			nodeId: string;
			userId: string;
		}
		// 1. Check if the node is locked by another user
		const isNodeLockedByOther = useCallback(
			(
				nodeId: string,
				lockedNode: LockedNodeState[] | null,
				currentUserId: string,
			): boolean => {
				if (!lockedNode) return false;
				// Returns true if the node is locked AND the locking user is NOT the current user
				return lockedNode.some(
					(lock) => lock.nodeId === nodeId && lock.userId !== currentUserId,
				);
			},
			[],
		);

		// 2. Define the drag start handler
		const handleNodeDragStart: NodeDragHandler = useCallback(
			(event, node: Node, _nodes: Node[]) => {
				const isLocked = isNodeLockedByOther(node.id, lockedNode, userId);

				if (isLocked) {
					// Prevent the drag
					event.preventDefault();
					console.warn(`Node ${node.id} is locked by another user.`);
					return;
				}

				// If not locked, send a message to lock the node for the current user
				onSendSyncMessage({
					type: "NODE_LOCKED",
					payload: { nodeId: node.id, userId: userId },
				});
			},
			[isNodeLockedByOther, lockedNode, userId, onSendSyncMessage],
		);
		// 2. Define the drag start handler
		const handleNodeDragStop: NodeDragHandler = useCallback(
			(_event, node: Node, _nodes: Node[]) => {
				// If not locked, send a message to lock the node for the current user
				onSendSyncMessage({
					type: "NODE_UNLOCK",
					payload: { nodeId: node.id, userId: userId },
				});
			},
			[onSendSyncMessage, userId],
		);

		/**
		 * Computes per-node material input status (need, input, deficit)
		 * based on material recipes, connected edges, and production rate.
		 * * FIX: Calculates the required inputs based on the recipe's output amount
		 * and the node's desired productionRate.
		 */
		const computeNodeInputStatus = (
			nodes: Node[],
			edges: Edge[],
			materials: Material[],
		): Record<string, InputStatus> => {
			const inputStatusMap: Record<string, InputStatus> = {};

			// Step 1: For each node, calculate NEED based on its material recipe
			nodes.forEach((node) => {
				const material = materials.find(
					(m) => m.ticker === node.data.materialTicker,
				);
				if (!material) return;

				const productionRate = node.data.productionRate || 0;
				const inputStatus: InputStatus = {};

				if (material.resource) {
					// If the material is a resource, the node needs no inputs.
					return;
				} else {
					// Iterate through all possible recipes for this material
					material.inputRecipes.forEach((recipe) => {
						// Find the amount of the final material (node.data.materialTicker)
						// that this specific recipe produces.
						const recipeOutputEntry = recipe.outputs.find(
							(output) => output.ticker === material.ticker,
						);

						// If the recipe doesn't output the node's material or the amount is 0, skip.
						if (!recipeOutputEntry || recipeOutputEntry.amount === 0) return;

						const recipeOutputAmount = recipeOutputEntry.amount; // e.g., 50 (for 50 MCG)

						if (productionRate > 0) {
							// CRITICAL FIX: Calculate the multiplier (how many times the recipe must run).
							// Example: 9765 (desired rate) / 50 (recipe output)
							const recipeMultiplier = productionRate / recipeOutputAmount;

							// Now, calculate the need for each input material
							recipe.inputs.forEach((input) => {
								const ticker = input.ticker;
								const amountPerRecipe = input.amount;

								// Total need = Multiplier * Input amount per recipe run
								const need = recipeMultiplier * amountPerRecipe;

								if (!inputStatus[ticker]) {
									// First time encountering this input ticker
									inputStatus[ticker] = { need, input: 0, deficit: need };
								} else {
									// Aggregate need from multiple recipes if applicable
									inputStatus[ticker].need += need;
									// Deficit is updated automatically in Step 3, but update here for accuracy
									inputStatus[ticker].deficit =
										inputStatus[ticker].need - inputStatus[ticker].input;
								}
							});
						}
					});
				}

				// Only set inputStatusMap entry if there is actual input data
				if (Object.keys(inputStatus).length > 0) {
					inputStatusMap[node.id] = inputStatus;
				}
			});

			// Step 2: For each edge, add INPUT from source node’s production (UNCHANGED)
			edges.forEach((edge) => {
				const sourceNode = nodes.find((n) => n.id === edge.source);
				const targetNode = nodes.find((n) => n.id === edge.target);
				if (!sourceNode || !targetNode) return;

				const sourceTicker = sourceNode.data.materialTicker;
				const targetInputStatus = inputStatusMap[targetNode.id];
				if (!targetInputStatus) return;

				// Check if the target node actually needs this material as an input
				if (targetInputStatus[sourceTicker]) {
					targetInputStatus[sourceTicker].input += sourceNode.data.netFlow || 0;
				}
			});

			// Step 3: Compute final DEFICIT (need - input) (UNCHANGED)
			Object.values(inputStatusMap).forEach((status) =>
				Object.values(status).forEach((s) => {
					s.deficit = s.need - s.input;
				}),
			);

			return inputStatusMap;
		};

		const inputStatusMap = useMemo(() => {
			return computeNodeInputStatus(nodes, edges, materials);
		}, [nodes, edges, materials]);

		const enrichedNodes = useMemo(() => {
			return nodes.map((n) => ({
				...n,
				data: {
					...n.data,
					inputStatus: inputStatusMap[n.id] || {},
				},
			}));
		}, [nodes, inputStatusMap]);

		// --- Compute inputList for each node based on connected sources ---
		useEffect(() => {
			if (!nodes.length) return;

			// Build a quick lookup for all node data by ID
			const nodeMap = new Map(nodes.map((n) => [n.id, n]));

			// Build adjacency list: targetId -> [sourceIds]
			const incomingMap = new Map<string, string[]>();
			edges.forEach((edge) => {
				const { source, target } = edge;
				if (!incomingMap.has(target)) incomingMap.set(target, []);
				incomingMap.get(target)!.push(source);
			});

			// Rebuild nodes with computed inputList
			setNodes((prevNodes) =>
				prevNodes.map((node) => {
					const sourceIds = incomingMap.get(node.id) || [];
					const inputList: Record<string, number> = {};

					for (const srcId of sourceIds) {
						const srcNode = nodeMap.get(srcId);
						if (!srcNode) continue;

						const ticker = srcNode.data.materialTicker;
						const flow = srcNode.data.netFlow ?? 0;
						inputList[ticker] = (inputList[ticker] || 0) + flow;
					}

					// If nothing changed, avoid useless re-render
					if (
						JSON.stringify(node.data.inputList) === JSON.stringify(inputList)
					) {
						return node;
					}

					return {
						...node,
						data: {
							...node.data,
							inputList, // ✅ computed dynamically
						},
					};
				}),
			);
		}, [edges, nodes.map((n) => n.data.netFlow).join(",")]);

		// Provide methods to the parent component (GroupManager)
		useImperativeHandle(ref, () => ({
			getNodes: () => nodes,
			getEdges: () => edges,
			fitView: fitView,
		}));

		// 5. Context Value for custom nodes
		// 2. Add it to the Context Value Memo
		const connectionToolContextValue = useMemo(
			() => ({
				connectionMode,
				sourceNodeData: sourceRFNode,
				materials,
				onEditNode,
				onDeleteNode,
				validationData,
				activeGroupId, // ✅ NEW
			}),
			[
				connectionMode,
				sourceRFNode,
				materials,
				onEditNode,
				onDeleteNode,
				validationData,
				activeGroupId, // ✅ NEW
			],
		);
		const nodeTypes = useMemo(() => NODE_TYPES, []);

		return (
			<ConnectionToolContext.Provider value={connectionToolContextValue}>
				<Box
					className="production-chain-viewer"
					sx={{ width: "100%", height: "100%", position: "relative" }}
					onMouseMove={handleMouseMove}
				>
					<ReactFlow
						nodes={enrichedNodes}
						edges={edges}
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

						{/* NEW: Render remote cursors */}
						<LiveCursorRenderer remoteCursors={remoteCursors} />
					</ReactFlow>

					{/* Local UI Controls */}
					<Box sx={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}>
						<Tooltip title="Add New Node">
							<Button
								variant="contained"
								onClick={onAddNodeClick}
								startIcon={<Plus />}
								color="secondary"
								sx={{ mr: 1 }}
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
