import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ReactFlowProvider } from "reactflow";
import { useTheme } from "@mui/material/styles";
import {
	Box,
	Typography,
	Button,
	Card,
	Tabs,
	Tab,
	CircularProgress,
	Tooltip,
} from "@mui/material";
import {
	Factory,
	Settings,
	HelpOutline,
	ErrorOutline,
	Sync as SyncIcon,
} from "@mui/icons-material";

import type {
	Group,
	Chain,
	ChainNodeData,
	ProductionChainViewerHandle,
	GroupMember,
	NodeUpdatePayload,
	NodeRemovePayload,
} from "./Cooperation/types";
import { getOrCreateUserId } from "./Cooperation/helpers";

import ProductionChainViewer from "./Cooperation/ProductionChainViewer";
import GroupManager from "./Cooperation/GroupManager";
import { SettingsManager } from "./Cooperation/GroupManager";
import { NodeAdditionModal, NodeEditModal } from "./Cooperation/NodeModals";
import { useGroupSync } from "./Cooperation/hooks/useGroupSync";
import { createGroup, deleteGroup } from "./Cooperation/api_client";
import { useGlobalWsContext } from "./websocket/GlobalWsContext";
import WsReconnectionOverlay from "./websocket/WebsocketReconnectOverlay";

// --- NEW: Import the static data hook ---
import { useStaticData } from "./Cooperation/hooks/useStaticData";

const FlowManagerApp: React.FC = () => {
	const theme = useTheme();
	// Use the auth token for the user ID, but keep currentUserId for internal use
	const currentUserId = useMemo(() => getOrCreateUserId(), []);
	const flowViewerRef = React.useRef<ProductionChainViewerHandle>(null);

	// Global State for all groups
	const [allGroups, setAllGroups] = useState<Group[]>([]);
	const [loading, setLoading] = useState(true);

	// --- NEW: Fetch Static Data ---
	const { staticData, isStaticDataLoading, staticDataError, forceRefetch } =
		useStaticData();
	const materials = staticData?.materials || [];

	// Modals state
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [nodeToEdit, setNodeToEdit] = useState<ChainNodeData | null>(null);

	// --- Computed State ---
	// activeGroupId is used to link GroupManager to the selected group's state/persistence
	const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

	const [showGroups, setShowGroups] = useState(true);

	// Derive selectedGroup from the activeGroupId and allGroups list
	const selectedGroup = useMemo(() => {
		return allGroups.find((g) => g.id === activeGroupId) || null;
	}, [allGroups, activeGroupId]);

	const isOwner = useMemo(
		() => selectedGroup?.ownerId === currentUserId,
		[selectedGroup, currentUserId],
	);
	const [activeTab, setActiveTab] = useState("Flow");

	const [isSaving, setIsSaving] = useState(false); // Global flag to indicate an API save is in progress
	const [isGroupManagerVisible, setIsGroupManagerVisible] = useState(true);

	// Create a uid -> username lookup map
	const membersArray: GroupMember[] = useMemo(() => {
		return selectedGroup?.members || [];
	}, [selectedGroup]);

	const checkPerms = useMemo(() => {
		const allowedRoles = ["owner", "editor"];

		if (!membersArray || membersArray.length === 0) {
			return false;
		}

		const currentUserMember = membersArray.find((m) => m.uid === currentUserId);

		if (!currentUserMember || !currentUserMember.role) {
			return false;
		}
		return allowedRoles.includes(currentUserMember.role);
	}, [currentUserId, membersArray]);

	// --- Handlers for Group State Management (Passed to GroupManager) ---

	// 1. Master handler to update the list of all groups (called by GroupManager after API fetch/save success)
	const handleGroupListUpdate = useCallback(
		(updatedGroups: Group[]) => {
			setAllGroups(updatedGroups);

			// If the current active group was deleted, reset the active group ID
			if (activeGroupId && !updatedGroups.some((g) => g.id === activeGroupId)) {
				setActiveGroupId(updatedGroups.length > 0 ? updatedGroups[0].id : null);
			}

			// Stop loading once the initial data is here
			setLoading(false);
		},
		[activeGroupId],
	);

	// 2. Select a group (Called by GroupManager on click or initial load)
	const handleGroupSelect = useCallback((group: Group | null): void => {
		if (group) {
			setActiveGroupId(group.id);
		} else {
			setActiveGroupId(null);
		}
	}, []);

	// 3. API Handlers for Group CRUD (Passed to GroupManager to execute)
	const handleGroupCreate = useCallback(
		async (name: string): Promise<Group> => {
			// Assume API call returns the full Group object, including the chain
			const newGroup = await createGroup({
				id: "",
				name: name,
				ownerId: localStorage.getItem("currentUserId") || "",
				ownerDisplayName: localStorage.getItem("displayName")!,
				chain: { nodes: [], links: [] },
				isActive: true,
				members: [],
				created_at: "",
				updated_at: "",
			});

			// Add the new group to the list and select it
			setAllGroups((prev) => [...prev, newGroup]);
			//setActiveGroupId(newGroup.id);

			return newGroup;
		},
		[],
	);

	const handleGroupDelete = useCallback(
		async (groupId: string, ownerId: string): Promise<void> => {
			// Execute API delete
			await deleteGroup(groupId, ownerId);

			// Update local state by removing the deleted group
			setAllGroups((prev) => prev.filter((g) => g.id !== groupId));

			// Select a new group if the active one was deleted
			if (activeGroupId === groupId) {
				setActiveGroupId(null);
			}
		},
		[activeGroupId],
	);

	// --- Initial Load Effect ---
	useEffect(() => {
		// We no longer manually fetch materials here.
		// The useStaticData hook handles it. We just end the local loading state.
		setLoading(false);
	}, []);

	// 1. Get the local group state management

	// 2. Get the global WebSocket connection
	const { globalUserWs } = useGlobalWsContext();

	// 3. LISTEN TO THE GLOBAL WS FOR INVITES
	useEffect(() => {
		if (!globalUserWs) return;

		// Define the handler to interpret the incoming raw message
		const handleGlobalMessage = (event: MessageEvent) => {
			try {
				const message = JSON.parse(event.data);

				if (
					message.type === "GROUP_INVITE" &&
					message.payload &&
					message.payload.group
				) {
					const newGroup: Group = message.payload.group;

					setAllGroups((prevGroups) => {
						if (prevGroups.some((g) => g.id === newGroup.id)) {
							return prevGroups.map((g) =>
								g.id === newGroup.id ? newGroup : g,
							);
						}
						return [...prevGroups, newGroup];
					});

					console.log(
						`[Cooperation] Redirected Group Invite for: ${newGroup.name}`,
					);
				} else if (
					message.type === "GROUP_REMOVE" &&
					message.payload &&
					message.payload.groupId
				) {
					const groupIdToRemove: string = message.payload.groupId;
					setAllGroups((prev) => {
						const filteredGroups = prev.filter((g) => g.id !== groupIdToRemove);

						if (filteredGroups.length !== prev.length) {
							console.log(`Group ID ${groupIdToRemove} removed from list.`);
						} else {
							console.warn(
								`Attempted to remove Group ID ${groupIdToRemove}, but it was not found.`,
							);
						}

						return filteredGroups;
					});

					if (selectedGroup && selectedGroup.id === groupIdToRemove) {
						setActiveGroupId(null);
					}

					console.log(
						`[Cooperation] Redirected Group Remove for Group ID: ${groupIdToRemove}`,
					);
				}
			} catch (e) {
				console.error("Failed to parse WS message in Cooperation:", e);
			}
		};

		globalUserWs.addEventListener("message", handleGlobalMessage);

		return () => {
			globalUserWs.removeEventListener("message", handleGlobalMessage);
		};
	}, [globalUserWs, selectedGroup]);

	// --- Handlers for Chain Manipulation ---

	const handleChainUpdate = useCallback(
		(newChain: Chain) => {
			if (!activeGroupId) return;

			setAllGroups((prevGroups) =>
				prevGroups.map((group) =>
					group.id === activeGroupId ? { ...group, chain: newChain } : group,
				),
			);
		},
		[activeGroupId],
	);

	const handleNodeChanges = () => {};

	const handleGroupInviteUpdate = useCallback((newGroup: Group) => {
		setAllGroups((prevGroups) => {
			if (prevGroups.some((g) => g.id === newGroup.id)) {
				return prevGroups.map((g) => (g.id === newGroup.id ? newGroup : g));
			}
			return [...prevGroups, newGroup];
		});
	}, []);

	const applyGroupMemberUpdate = useCallback(
		(payload: any) => {
			if (!payload.groupId || !Array.isArray(payload.members)) {
				console.error("Invalid GROUP_MEMBER_UPDATE payload received:", payload);
				return;
			}

			setAllGroups((prevGroups) => {
				const groupIndex = prevGroups.findIndex(
					(g) => g.id === payload.groupId,
				);

				if (groupIndex === -1) {
					console.warn(`Group ID ${payload.groupId} not found in local state.`);
					return prevGroups;
				}

				const updatedGroup = {
					...prevGroups[groupIndex],
					members: payload.members,
				};

				const newGroups = [...prevGroups];
				newGroups[groupIndex] = updatedGroup;

				return newGroups;
			});
		},
		[setAllGroups],
	);

	const {
		isConnected,
		sendSyncMessage,
		remoteCursors,
		lockedNode,
		setLockedNode,
		reconnect,
		hasEverBeenConnected,
	} = useGroupSync({
		groupId: selectedGroup?.id || "",
		userId: currentUserId,
		currentChain: selectedGroup?.chain || null,
		onChainUpdate: handleChainUpdate,
		onRemoteNodeMove: handleNodeChanges,
		onGroupInvite: handleGroupInviteUpdate,
		onGroupMemberUpdate: applyGroupMemberUpdate,
	});

	// --- Handlers for Node Modals ---

	const handleAddNode = useCallback(
		(newNodeData: ChainNodeData) => {
			if (!selectedGroup) return;

			const newNode: ChainNodeData = {
				...newNodeData,
				position: newNodeData.position || { x: 50, y: 50 },
			};

			const newChain: Chain = {
				...selectedGroup.chain,
				nodes: [...selectedGroup.chain.nodes!, newNode],
			};

			setAllGroups((prevGroups) =>
				prevGroups.map((group) =>
					group.id === selectedGroup.id ? { ...group, chain: newChain } : group,
				),
			);

			sendSyncMessage({
				type: "NODE_ADD",
				payload: { data: newNode } as NodeUpdatePayload,
			});

			setIsAddModalOpen(false);
		},
		[selectedGroup, setAllGroups, sendSyncMessage, setIsAddModalOpen],
	);

	const handleEditNode = useCallback(
		(nodeData: ChainNodeData) => {
			const lockInfo = lockedNode?.find(
				(lock) => lock.nodeId === nodeData.nodeId,
			);
			const isLocked = !!lockInfo;
			const isLockedByOther = isLocked && lockInfo!.userId !== currentUserId;
			if (isLockedByOther) {
				alert(`Node is locked by ${lockInfo.userId}`);
			}

			sendSyncMessage({
				type: "NODE_LOCKED",
				payload: { nodeId: nodeData.nodeId, userId: currentUserId },
			});

			if (setLockedNode) {
				setLockedNode((prevLockedNodes) => {
					const newLock = { nodeId: nodeData.nodeId, userId: currentUserId };

					if (!prevLockedNodes) {
						return [newLock];
					}

					if (prevLockedNodes.some((lock) => lock.nodeId === nodeData.nodeId)) {
						return prevLockedNodes;
					}

					return [...prevLockedNodes, newLock];
				});
			}

			setNodeToEdit(nodeData);
			setIsEditModalOpen(true);
		},
		[currentUserId, lockedNode, sendSyncMessage, setLockedNode],
	);

	const handleSaveEdit = (editedChainNodeData: ChainNodeData) => {
		if (!selectedGroup || !nodeToEdit) return;
		setIsSaving(true);

		const currentRFNodes = selectedGroup.chain.nodes ?? [];

		const newRFNodes = currentRFNodes.map((n) =>
			n.nodeId === editedChainNodeData.nodeId ? editedChainNodeData : n,
		);

		const newChain: Chain = {
			...selectedGroup.chain,
			nodes: newRFNodes,
		};

		sendSyncMessage({
			type: "NODE_UPDATE",
			payload: { node: editedChainNodeData },
		});

		handleChainUpdate(newChain);

		setNodeToEdit(null);
		setIsSaving(false);
		setIsEditModalOpen(false);
	};

	const handleDeleteNode = useCallback(
		(nodeData: ChainNodeData) => {
			if (
				!selectedGroup ||
				!window.confirm(
					`Are you sure you want to delete the node for ${nodeData.materialTicker} at ${nodeData.siteName}? This will also remove all connected links.`,
				)
			) {
				return;
			}

			const nodeIdToDelete = nodeData.nodeId;

			const newChain: Chain = {
				...selectedGroup.chain,
				nodes: selectedGroup.chain.nodes!.filter((n) => {
					const nodeId = n.materialTicker && n.siteName ? n.nodeId : null;
					return nodeId !== nodeIdToDelete;
				}),

				links: selectedGroup.chain.links!.filter((l) => {
					const linkSourceId = l.source;
					const linkTargetId = l.target;

					return (
						linkSourceId !== nodeIdToDelete && linkTargetId !== nodeIdToDelete
					);
				}),
			};

			sendSyncMessage({
				type: "NODE_REMOVE",
				payload: { nodeId: nodeIdToDelete } as NodeRemovePayload,
			});

			handleChainUpdate(newChain);
		},
		[selectedGroup, handleChainUpdate, sendSyncMessage],
	);

	const handleGroupMemberUpdate = useCallback(
		(updatedGroup: Group) => {
			const groupsToPersist: Group[] = allGroups.map((group) => {
				if (group.id === updatedGroup.id) {
					return updatedGroup;
				}
				return group;
			});

			sendSyncMessage({
				type: "GROUP_MEMBER_UPDATE",
				payload: { groupId: activeGroupId, members: updatedGroup.members },
			});

			setAllGroups(groupsToPersist);
		},
		[allGroups, activeGroupId, sendSyncMessage],
	);

	const handleGroupUpdate = useCallback(
		(updatedGroup: Group) => {
			const groupsToPersist: Group[] = allGroups.map((group) => {
				if (group.id === updatedGroup.id) {
					return updatedGroup;
				}
				return group;
			});

			setAllGroups(groupsToPersist);
		},
		[allGroups],
	);

	const handleHideGroupManager = () => {
		setShowGroups(false);
		setIsGroupManagerVisible(false);
	};

	const handleShowGroupManager = () => {
		setShowGroups(true);
		setIsGroupManagerVisible(true);
	};

	const handleCloseEditModal = useCallback(() => {
		const nodeIdToUnlock = nodeToEdit?.nodeId;

		if (nodeIdToUnlock) {
			sendSyncMessage({
				type: "NODE_UNLOCK",
				payload: { nodeId: nodeIdToUnlock },
			});

			if (setLockedNode) {
				setLockedNode((prevLockedNodes) => {
					if (!prevLockedNodes) return null;

					const filteredNodes = prevLockedNodes.filter(
						(lock) => lock.nodeId !== nodeIdToUnlock,
					);

					return filteredNodes.length > 0 ? filteredNodes : null;
				});
			}
		}

		setIsEditModalOpen(false);
		setNodeToEdit(null);
	}, [nodeToEdit, sendSyncMessage, setLockedNode]);

	// COMBINED LOADING STATE
	const isAppLoading = loading || isStaticDataLoading;

	return (
		<ReactFlowProvider>
			<Box
				sx={{
					display: "flex",
					height: "100vh",
					width: "100%",
					p: 2,
					color: theme.palette.primary.dark,
					backgroundColor: theme.palette.background.paper,
				}}
			>
				{/* Left Panel: Group Manager */}
				<Card
					sx={{
						width: 300,
						overflowX: "hidden",
						maxWidth: showGroups ? 300 : 0,
						flexShrink: 0,
						mr: showGroups ? 2 : 0,
						transition:
							"max-width 0.2s ease-in-out, margin-right 0.2s ease-in-out",
						color: theme.palette.primary.dark,
						background: "transparent",
						height: "100%",
					}}
				>
					<GroupManager
						groups={allGroups}
						currentUserId={currentUserId}
						onGroupListUpdate={handleGroupListUpdate}
						onGroupSelect={handleGroupSelect}
						activeGroupId={activeGroupId || ""}
						onChainUpdate={handleChainUpdate}
						onGroupCreate={handleGroupCreate}
						onGroupDelete={handleGroupDelete}
						isSaving={isSaving}
						onSaveCurrentGroup={function (): Promise<void> {
							throw new Error("Function not implemented.");
						}}
						onMinimize={handleHideGroupManager}
						canSave={false}
						remoteCursors={remoteCursors}
					/>
				</Card>

				{/* Right Panel: Flow Viewer / Settings */}
				<Card
					sx={{
						flexGrow: 1,
						display: "flex",
						flexDirection: "column",
						overflow: "hidden",
						color: theme.palette.primary.dark,
						background: "transparent",
						position: "relative",
					}}
				>
					{/* Header */}
					<Box
						sx={{
							p: 1,
							borderBottom: `1px solid ${theme.palette.divider}`,
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							color: theme.palette.primary.dark,
							background: "transparent",
						}}
					>
						<Box
							sx={{
								display: "flex",
								flexDirection: "row",
							}}
						>
							{!isGroupManagerVisible ? (
								<Button
									onClick={handleShowGroupManager}
									variant="outlined"
									size="small"
									sx={{
										position: "relative",
										zIndex: 1000,
										mr: 1,
									}}
								>
									{"Show Groups"}
								</Button>
							) : null}
							<Box>
								<Typography
									variant="h5"
									sx={{
										fontWeight: "bold",
										color: theme.palette.primary.light,
									}}
								>
									{selectedGroup?.name || "No Group Selected"}
								</Typography>
								{selectedGroup && (
									<Typography variant="caption" color="text.secondary">
										Owner:{" "}
										{selectedGroup.ownerId === currentUserId
											? "You"
											: selectedGroup.members.find(
													(m) => m.uid === selectedGroup.ownerId,
												)?.displayName}{" "}
										| Members: {selectedGroup.members?.length || 0}
									</Typography>
								)}
							</Box>
						</Box>

						<Tabs
							value={activeTab}
							onChange={(_e, newValue) => setActiveTab(newValue)}
							sx={{
								minHeight: 30,
								"& .MuiTabs-indicator": {
									backgroundColor: theme.palette.secondary.main,
								},
							}}
						>
							<Tab
								label="Flow View"
								value="Flow"
								icon={<Factory />}
								iconPosition="start"
								sx={{ minHeight: 30, p: 0, px: 2 }}
							/>
							{selectedGroup && (
								<Tab
									label="Settings"
									value="Settings"
									icon={<Settings />}
									iconPosition="start"
									sx={{ minHeight: 30, p: 0, px: 2 }}
								/>
							)}
						</Tabs>

						<Box display="flex" gap={1}>
							{/* --- NEW: Force Sync Button --- */}
							<Tooltip title="Force Sync Static Database">
								<Button
									variant="outlined"
									color="warning"
									onClick={forceRefetch}
									startIcon={<SyncIcon />}
								>
									Sync DB
								</Button>
							</Tooltip>

							<Tooltip title="Reset View">
								<Button
									variant="outlined"
									onClick={() => flowViewerRef.current?.fitView()}
									disabled={activeTab !== "Flow" || !selectedGroup}
									startIcon={<HelpOutline />}
								>
									Fit View
								</Button>
							</Tooltip>
						</Box>
					</Box>

					{/* Error State for Static Data */}
					{staticDataError && !staticData && !isStaticDataLoading ? (
						<Box
							sx={{
								p: 4,
								textAlign: "center",
								height: "100%",
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								alignItems: "center",
							}}
						>
							<ErrorOutline color="error" sx={{ fontSize: 60, mb: 2 }} />
							<Typography
								variant="h6"
								color="error"
								sx={{ fontWeight: "bold" }}
							>
								Database Connection Failed
							</Typography>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ mt: 1, mb: 3 }}
							>
								{staticDataError}
							</Typography>
							<Button
								variant="contained"
								color="primary"
								onClick={forceRefetch}
							>
								Retry Connection
							</Button>
						</Box>
					) : isAppLoading ? (
						<Box
							sx={{
								p: 4,
								textAlign: "center",
								height: "100%",
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								alignItems: "center",
							}}
						>
							<CircularProgress size={40} sx={{ mb: 2 }} />
							<Typography variant="h6" color="text.secondary">
								{isStaticDataLoading
									? "Loading Game Database..."
									: "Loading groups..."}
							</Typography>
						</Box>
					) : selectedGroup ? (
						<Box
							sx={{
								flexGrow: 1,
								position: "relative",
								overflow: "hidden",
								background: "transparent",
							}}
						>
							{activeTab === "Flow" && (
								<ProductionChainViewer
									ref={flowViewerRef}
									initialChain={selectedGroup.chain}
									onChainUpdate={handleChainUpdate}
									// Injecting static data!
									materials={materials}
									staticData={staticData}
									onEditNode={handleEditNode}
									onDeleteNode={handleDeleteNode}
									onAddNodeClick={() => setIsAddModalOpen(true)}
									onSendSyncMessage={sendSyncMessage}
									canEdit={checkPerms}
									currentChain={selectedGroup.chain}
									remoteCursors={remoteCursors}
									onRemoteNodeMove={handleNodeChanges}
									lockedNode={lockedNode}
									userId={currentUserId}
								/>
							)}
							{activeTab === "Settings" && (
								<SettingsManager
									activeGroup={selectedGroup}
									currentUserId={currentUserId}
									onGroupListUpdate={handleGroupListUpdate}
									onGroupMemberUpdate={handleGroupMemberUpdate}
									onGroupDelete={handleGroupDelete}
									onGroupUpdate={handleGroupUpdate}
									isOwner={isOwner}
								/>
							)}
						</Box>
					) : (
						<Box
							sx={{
								p: 4,
								textAlign: "center",
								height: "100%",
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								alignItems: "center",
								bgcolor: theme.palette.background.paper,
							}}
						>
							<ErrorOutline color="error" sx={{ fontSize: 60, mb: 2 }} />
							<Typography
								variant="h6"
								sx={{ fontWeight: "bold", color: theme.palette.text.primary }}
							>
								No Active Group Selected
							</Typography>
							<Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
								Please **create a new group** or **select a group** to view the
								production flow.
							</Typography>
						</Box>
					)}
					{activeGroupId && hasEverBeenConnected && !isConnected ? (
						<WsReconnectionOverlay
							isConnected={false}
							onReconnectAttempt={reconnect}
						/>
					) : null}

					{/* Modals moved inside relative container */}
					<Box
						sx={{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							pointerEvents: "none",
							zIndex: 1200,
						}}
					>
						{staticData && (
							<>
								<NodeAdditionModal
									open={isAddModalOpen}
									onClose={() => setIsAddModalOpen(false)}
									onAddNode={handleAddNode}
									materials={materials}
									staticData={staticData}
									groupMembers={membersArray}
								/>
								<NodeEditModal
									open={isEditModalOpen}
									onClose={handleCloseEditModal}
									onSaveEdit={handleSaveEdit}
									nodeData={nodeToEdit}
									materials={materials}
									staticData={staticData}
									groupMembers={membersArray}
									initialData={nodeToEdit}
								/>
							</>
						)}
					</Box>
				</Card>
			</Box>
		</ReactFlowProvider>
	);
};

export default FlowManagerApp;
