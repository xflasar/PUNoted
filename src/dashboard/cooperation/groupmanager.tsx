import { API_BASE_URL } from "../../config/api";
import React, { useState, useEffect, useMemo } from "react";
import {
	Box,
	Typography,
	Button,
	Card,
	Divider,
	List,
	ListItem,
	IconButton,
	Alert,
	Modal,
	TextField,
	Tooltip,
	CircularProgress,
	FormControl,
	Select,
	MenuItem,
	Avatar,
	Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
	Add as Plus,
	Close as CloseIcon,
	AccountCircle,
	Delete as DeleteIcon,
	CheckCircleOutline,
	PersonAdd as PersonAddIcon,
} from "@mui/icons-material";

import type {
	GroupManagerProps,
	Group,
	SettingsManagerProps,
	GroupMembersListProps,
	Chain,
} from "./types";
import InviteUserModal from "./inviteusermodal";
import {
	changeUserRole,
	fetchAllGroups,
	acceptGroupInvite,
	rejectGroupInvite,
} from "./api_client";
import { ChevronLeftIcon } from "lucide-react";

// --- Sub-Component: Group Members List ---
const GroupMembersList: React.FC<GroupMembersListProps> = ({
	members,
	ownerId,
	isOwner,
	onRemoveMember,
	onChangeRole,
}) => {
	const theme = useTheme();
	const editableRoles: Array<"editor" | "viewer"> = ["editor", "viewer"];

	const handleRoleChange = (event: any, memberUid: string) => {
		const newRole = event.target.value as "editor" | "viewer";
		onChangeRole(memberUid, newRole);
	};

	return (
		<List
			dense
			sx={{
				maxHeight: 200,
				overflowY: "auto",
				background: "transparent",
				borderRadius: 1,
			}}
		>
			{members.map((member) => {
				const isGroupOwner = member.uid === ownerId;
				const isEditable = isOwner && !isGroupOwner;

				return (
					<ListItem
						key={member.uid}
						sx={{ py: 0.5 }}
						secondaryAction={
							<Box sx={{ display: "flex", alignItems: "center" }}>
								{isEditable ? (
									<FormControl
										variant="standard"
										size="small"
										sx={{ minWidth: 100, mr: 0 }}
									>
										<Select
											value={member.role}
											onChange={(e) => handleRoleChange(e, member.uid)}
											disableUnderline
											inputProps={{ "aria-label": "Change member role" }}
											sx={{ fontWeight: "bold" }}
										>
											{editableRoles.map((role) => (
												<MenuItem key={role} value={role}>
													{role.charAt(0).toUpperCase() + role.slice(1)}
												</MenuItem>
											))}
										</Select>
									</FormControl>
								) : (
									<Typography
										variant="caption"
										sx={{
											mr: 0,
											fontWeight: isGroupOwner ? "bold" : "normal",
											color: isGroupOwner
												? theme.palette.primary.dark
												: theme.palette.text.secondary,
										}}
									>
										(
										{member.role.charAt(0).toUpperCase() + member.role.slice(1)}
										)
									</Typography>
								)}

								{isEditable ? (
									<Tooltip
										title={`Remove ${member.displayName || member.username}`}
									>
										<IconButton
											edge="end"
											aria-label="remove"
											size="small"
											onClick={() => onRemoveMember(member.uid)}
										>
											<DeleteIcon fontSize="inherit" color="error" />
										</IconButton>
									</Tooltip>
								) : null}
							</Box>
						}
					>
						<AccountCircle
							sx={{ mr: 1, color: theme.palette.text.secondary }}
						/>
						<Typography variant="body2">
							{member.displayName || member.username}
						</Typography>
					</ListItem>
				);
			})}
		</List>
	);
};

// --- Sub-Component: Group Settings Manager ---
export const SettingsManager: React.FC<SettingsManagerProps> = ({
	activeGroup,
	onGroupMemberUpdate,
	onGroupDelete,
}) => {
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
	const theme = useTheme();

	const isOwner =
		activeGroup!.members!.find(
			(m: { uid: any }) => m.uid === activeGroup.ownerId,
		)?.uid === localStorage.getItem("currentUserId");

	const handleDelete = async () => {
		await onGroupDelete(activeGroup.id, activeGroup.ownerId);
		setIsDeleteModalOpen(false);
	};

	const handleRemoveMember = async (memberId: string) => {
		try {
			// --- MOCK API CALL ---
			// Simulate a delay
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Always succeed in mock mode
			activeGroup.members = activeGroup.members.filter(
				(m) => m.uid !== memberId,
			);
			await onGroupMemberUpdate(activeGroup);
			/*
			const response = await fetch(
				`${API_BASE_URL}groups/${activeGroup.id}/member`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
					body: JSON.stringify({
						member_uid: memberId,
					}),
				}
			);

			if (response.ok) {
				activeGroup.members = activeGroup.members.filter(
					(m) => m.uid !== memberId
				);
				await onGroupMemberUpdate(activeGroup);
			} else {
				const errorDetail = await response
					.json()
					.catch(() => ({ detail: "Unknown error occurred." }));
				throw new Error(
					errorDetail.detail ||
						`Failed to remove member. Status: ${response.status}`
				);
			}
			*/
		} catch (error) {
			console.error(error);
		}
	};

	const handleChangeMemberRole = async (memberUid: string, role: string) => {
		const newRole = role as "editor" | "viewer";

		if (!isOwner) {
			console.error("Permission denied: Current user is not the group owner.");
			return;
		}

		try {
			await changeUserRole(activeGroup.id, memberUid, newRole);

			const updatedMembers = activeGroup.members.map((m) =>
				m.uid === memberUid ? { ...m, role: newRole } : m,
			);

			const updatedGroup = { ...activeGroup, members: updatedMembers };
			await onGroupMemberUpdate(updatedGroup);
		} catch (error: any) {
			console.error("Failed to change user role:", error);
			alert(`Error changing role: ${error.message}`);
		}
	};

	return (
		<Box sx={{ p: 2 }}>
			<Box sx={{ mb: 1 }}>
				<Typography
					variant="subtitle1"
					sx={{ fontWeight: "bold", color: theme.palette.primary.light }}
				>
					Members
				</Typography>
				<GroupMembersList
					members={activeGroup.members!}
					ownerId={activeGroup.ownerId}
					isOwner={isOwner}
					onRemoveMember={handleRemoveMember}
					onChangeRole={handleChangeMemberRole}
				/>
			</Box>

			<Divider sx={{ mb: 2 }} />
			<Typography variant="subtitle1" color="error" sx={{ fontWeight: "bold" }}>
				Danger Zone
			</Typography>
			<Box
				sx={{
					display: "flex",
					mb: 2,
					minWidth: 300,
				}}
			>
				<Button
					variant="outlined"
					color="error"
					onClick={() => setIsDeleteModalOpen(true)}
					disabled={!isOwner}
					startIcon={<DeleteIcon />}
					sx={{
						flexGrow: 1,
						mr: 1,
					}}
				>
					Delete Group
				</Button>

				<Button
					variant="contained"
					color="primary"
					onClick={() => setIsInviteModalOpen(true)}
					startIcon={<PersonAddIcon />}
					sx={{
						flexGrow: 1,
					}}
				>
					Invite
				</Button>
			</Box>

			<InviteUserModal
				open={isInviteModalOpen}
				onClose={() => setIsInviteModalOpen(false)}
				group={activeGroup}
				currentUserId={localStorage.getItem("currentUserId") || ""}
			/>

			<Modal
				open={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
			>
				<Box
					sx={{
						position: "absolute" as const,
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: 400,
						background: theme.palette.background.paper,
						borderRadius: 2,
						boxShadow: 24,
						p: 4,
					}}
				>
					<Typography variant="h6">Confirm Deletion</Typography>
					<Typography sx={{ mt: 2 }}>
						Are you sure you want to delete the group **{activeGroup.name}**?
						This action is irreversible.
					</Typography>
					<Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
						<Button onClick={() => setIsDeleteModalOpen(false)} sx={{ mr: 2 }}>
							Cancel
						</Button>
						<Button onClick={handleDelete} color="error" variant="contained">
							Delete
						</Button>
					</Box>
				</Box>
			</Modal>
		</Box>
	);
};

// --- GroupManager Component ---
const GroupManager: React.FC<
	GroupManagerProps & {
		onChainUpdate: (chain: Chain) => void;
		activeGroupId: string | null;
	}
> = (props) => {
	const {
		groups,
		currentUserId,
		onGroupSelect,
		onGroupListUpdate,
		onGroupCreate,
		activeGroupId,
		onMinimize,
		remoteCursors,
	} = props;

	const theme = useTheme();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [newGroupName, setNewGroupName] = useState("");
	const [newGroupError, setNewGroupError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isProcessingInvite, setIsProcessingInvite] = useState<string | null>(
		null,
	);

	const liveUserIds = useMemo(
		() => Array.from(remoteCursors.keys()).map(String),
		[remoteCursors],
	);

	// Separate groups into pending and active
	const activeGroups = useMemo(
		() => (groups || []).filter((g) => !g.isPending),
		[groups],
	);
	const pendingGroups = useMemo(
		() => (groups || []).filter((g) => g.isPending),
		[groups],
	);

	useEffect(() => {
		const loadGroups = async () => {
			setIsLoading(true);
			try {
				const fetchedGroups = await fetchAllGroups();
				onGroupListUpdate(fetchedGroups as Group[]);
			} catch (e) {
				console.error("Failed to load groups from server:", e);
			} finally {
				setIsLoading(false);
			}
		};
		if (groups.length === 0) {
			loadGroups();
		}
	}, [onGroupListUpdate, groups.length]);

	const handleCreateGroup = () => {
		if (!newGroupName.trim()) {
			setNewGroupError("Group name cannot be empty.");
			return;
		}

		if (
			!localStorage.getItem("displayName") ||
			localStorage.getItem("displayName") === "null"
		) {
			setNewGroupError(
				"Please set your displayName in Settings. 'displayName' should reflect ingame displayName not your company name.",
			);
			return;
		}

		onGroupCreate(newGroupName, currentUserId)
			.then(() => {
				setNewGroupName("");
				setIsModalOpen(false);
			})
			.catch((err) => setNewGroupError("Failed to create group." + err));
	};

	const handleModalClose = () => {
		setIsModalOpen(false);
		setNewGroupName("");
		setNewGroupError("");
	};

	const handleMinimize = () => {
		onMinimize();
	};

	// --- Invitation Handlers ---
	const handleAcceptInvite = async (e: React.MouseEvent, groupId: string) => {
		e.stopPropagation();
		setIsProcessingInvite(groupId);
		try {
			await acceptGroupInvite(groupId);
			const fetchedGroups = await fetchAllGroups();
			onGroupListUpdate(fetchedGroups as Group[]);
		} catch (err) {
			console.error("Failed to accept invite:", err);
		} finally {
			setIsProcessingInvite(null);
		}
	};

	const handleRejectInvite = async (e: React.MouseEvent, groupId: string) => {
		e.stopPropagation();
		setIsProcessingInvite(groupId);
		try {
			await rejectGroupInvite(groupId);
			const fetchedGroups = await fetchAllGroups();
			onGroupListUpdate(fetchedGroups as Group[]);
		} catch (err) {
			console.error("Failed to reject invite:", err);
		} finally {
			setIsProcessingInvite(null);
		}
	};

	return (
		<Box
			sx={{
				p: 2,
				minWidth: 300,
				width: 300,
			}}
		>
			<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
				<Typography
					variant="h5"
					sx={{ fontWeight: "bold", color: theme.palette.primary.light }}
				>
					Production Groups
				</Typography>

				<Tooltip title="Hide Groups">
					<IconButton
						size="small"
						onClick={handleMinimize}
						sx={{
							ml: "auto",
							transition: "transform 0.2s ease-in-out",
						}}
					>
						<ChevronLeftIcon />
					</IconButton>
				</Tooltip>
			</Box>

			<Button
				variant="contained"
				onClick={() => setIsModalOpen(true)}
				fullWidth
				startIcon={<Plus />}
				sx={{ mb: 3, background: theme.palette.primary.dark }}
			>
				Create New Group
			</Button>

			{isLoading ? (
				<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
					<CircularProgress />
				</Box>
			) : (
				<List sx={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
					{/* --- PENDING INVITATIONS --- */}
					{pendingGroups.length > 0 && (
						<Box sx={{ mb: 2 }}>
							<Typography
								variant="subtitle2"
								color="warning.main"
								sx={{ mb: 1, fontWeight: "bold" }}
							>
								Pending Invitations ({pendingGroups.length})
							</Typography>
							{pendingGroups.map((group) => (
								<Card
									key={group.id}
									sx={{
										mb: 1,
										p: 1.5,
										border: `1px dashed ${theme.palette.warning.main}`,
										background: theme.palette.background.paper,
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
									}}
								>
									<Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
										{group.name}
									</Typography>
									<Box>
										{isProcessingInvite === group.id ? (
											<CircularProgress size={20} />
										) : (
											<>
												<Tooltip title="Accept">
													<IconButton
														color="success"
														size="small"
														onClick={(e) => handleAcceptInvite(e, group.id)}
													>
														<CheckCircleOutline fontSize="small" />
													</IconButton>
												</Tooltip>
												<Tooltip title="Reject">
													<IconButton
														color="error"
														size="small"
														onClick={(e) => handleRejectInvite(e, group.id)}
													>
														<CloseIcon fontSize="small" />
													</IconButton>
												</Tooltip>
											</>
										)}
									</Box>
								</Card>
							))}
							<Divider sx={{ my: 2 }} />
						</Box>
					)}

					{/* --- ACTIVE GROUPS --- */}
					{(groups || []).length === 0 ? (
						<Alert severity="info">No groups found. Create one above!</Alert>
					) : activeGroups.length === 0 ? (
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{ textAlign: "center", mt: 2 }}
						>
							No active groups.
						</Typography>
					) : (
						activeGroups.map((group) => {
							const liveMembersArray = (group.members || []).filter((member) =>
								liveUserIds.includes(member.uid),
							);
							const usersToShow = liveMembersArray.slice(0, 3);
							const totalLiveMembers = liveMembersArray.length;
							const otherUsersCount = totalLiveMembers - usersToShow.length;

							return (
								<Card
									key={group.id}
									onClick={() => onGroupSelect(group)}
									sx={{
										mb: 1.5,
										p: 2,
										cursor: "pointer",
										borderRadius: 2,
										transition: "box-shadow 0.2s, border 0.2s, transform 0.1s",
										background: theme.palette.background.paper,
										border:
											group.id === activeGroupId
												? `2px solid ${theme.palette.primary.main}`
												: `1px solid ${theme.palette.divider}`,
										"&:hover": {
											boxShadow: 4,
											transform: "translateY(-1px)",
										},
										display: "flex",
										flexDirection: "column",
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
										<Typography
											variant="subtitle1"
											sx={{
												fontWeight: "bold",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
												mr: 1,
											}}
										>
											{group.name}
										</Typography>

										{group.id === activeGroupId ? (
											<Chip
												label="Active Flow"
												color="success"
												size="small"
												icon={<CheckCircleOutline />}
												sx={{ height: 20, flexShrink: 0, fontWeight: "bold" }}
											/>
										) : (
											<Chip
												label={`Members: ${group.members?.length || 0}`}
												size="small"
												variant="outlined"
												sx={{ height: 20, flexShrink: 0 }}
											/>
										)}
									</Box>

									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											pt: 1,
											borderTop: `1px solid ${theme.palette.divider}60`,
										}}
									>
										{group.id === activeGroupId ? (
											<Box sx={{ display: "flex", alignItems: "center" }}>
												{totalLiveMembers > 0 && (
													<Typography
														variant="caption"
														color="text.secondary"
														sx={{ mr: 1, fontWeight: "medium" }}
													>
														LIVE ({totalLiveMembers}):
													</Typography>
												)}

												<Box sx={{ display: "flex" }}>
													{usersToShow.map((member, index) => (
														<Tooltip key={member.uid} title={member.username}>
															<Avatar
																alt={member.username}
																sx={{
																	width: 24,
																	height: 24,
																	fontSize: 12,
																	ml: index > 0 ? -1.5 : 0,
																	border: `1px solid ${theme.palette.background.paper}`,
																	bgcolor: theme.palette.info.main,
																	color: theme.palette.getContrastText(
																		theme.palette.info.main,
																	),
																	zIndex: 10 + index,
																}}
															>
																{member.username.charAt(0).toUpperCase()}
															</Avatar>
														</Tooltip>
													))}
												</Box>

												{otherUsersCount > 0 && (
													<Typography
														variant="caption"
														color="text.secondary"
														sx={{ ml: 0.5, fontWeight: "bold" }}
													>
														+{otherUsersCount}
													</Typography>
												)}
											</Box>
										) : (
											<Box sx={{ flexGrow: 1 }} />
										)}

										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ flexShrink: 0 }}
										>
											Updated:{" "}
											<Box component="span" sx={{ fontWeight: "bold" }}>
												{new Date(group.updated_at).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</Box>
										</Typography>
									</Box>
								</Card>
							);
						})
					)}
				</List>
			)}

			<Modal open={isModalOpen} onClose={handleModalClose}>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: 300,
						background: theme.palette.background.paper,
						borderRadius: 2,
						boxShadow: 24,
						p: 4,
					}}
				>
					<Typography variant="h6" component="h2" sx={{ mb: 2 }}>
						Create New Flow Group
					</Typography>
					<TextField
						label="Group Name"
						variant="outlined"
						fullWidth
						margin="normal"
						value={newGroupName}
						onChange={(e) => {
							setNewGroupName(e.target.value);
							setNewGroupError("");
						}}
						error={!!newGroupError}
						helperText={newGroupError}
						sx={{ mb: 3 }}
					/>
					<Button
						variant="contained"
						color="secondary"
						onClick={handleCreateGroup}
						fullWidth
						startIcon={<Plus />}
						sx={{ mb: 1 }}
					>
						Create Group
					</Button>
					<Button
						variant="outlined"
						onClick={handleModalClose}
						fullWidth
						startIcon={<CloseIcon />}
					>
						Cancel
					</Button>
				</Box>
			</Modal>
		</Box>
	);
};

export default GroupManager;
