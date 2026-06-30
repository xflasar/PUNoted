import { useState, useEffect, useCallback } from "react";
import { fetchClient } from "../../../../../utils/apiclient";
import type { Group, GroupMember } from "../../../types";

export const useGroupDetails = (
	group: Group | null,
	currentUserId: string,
	onLeaveCb: () => void,
	showSnackbar: (msg: string, type: any) => void,
) => {
	const [members, setMembers] = useState<GroupMember[]>([]);
	const [myPerms, setMyPerms] = useState<string[]>([]);

	const loadMembers = useCallback(async () => {
		if (!group) return;
		try {
			const res = await fetchClient(`/internal/datagroup/${group.id}/members`);
			if (res.ok) {
				const data = await res.json();
				setMembers(data);
				const me = data.find(
					(m: any) =>
						m.user_id === currentUserId || m.username === currentUserId,
				);
				if (me) setMyPerms(me.granted_permissions || []);
			}
		} catch {
			showSnackbar("Failed to load members", "error");
		}
	}, [group, currentUserId, showSnackbar]);

	useEffect(() => {
		loadMembers();
	}, [loadMembers]);

	const searchUsers = useCallback(async (query: string): Promise<string[]> => {
		try {
			const res = await fetchClient(
				`/internal/datagroup/users/search?q=${query}`,
			);
			if (res.ok) return await res.json();
			return [];
		} catch {
			return [];
		}
	}, []);

	const inviteUser = useCallback(
		async (username: string, onSuccess: () => void) => {
			if (!group) return;
			try {
				const res = await fetchClient(
					`/internal/datagroup/${group.id}/invite`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ username }),
					},
				);
				if (res.ok) {
					showSnackbar(`Invited ${username}`, "success");
					onSuccess();
				} else {
					const err = await res.json();
					showSnackbar(err.detail || "Failed to invite", "error");
				}
			} catch {
				showSnackbar("Failed to invite", "error");
			}
		},
		[group, showSnackbar],
	);

	const updateMyPerms = useCallback(
		async (newPerms: string[], onSuccess: () => void) => {
			if (!group) return;
			try {
				const res = await fetchClient(
					`/internal/datagroup/${group.id}/shares`,
					{
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ granted_permissions: newPerms }),
					},
				);
				if (res.ok) {
					setMyPerms(newPerms);
					showSnackbar("Permissions updated", "success");
					onSuccess();
					loadMembers();
				} else {
					showSnackbar("Failed to update permissions", "error");
				}
			} catch {
				showSnackbar("Update failed", "error");
			}
		},
		[group, showSnackbar, loadMembers],
	);

	const toggleReadAccess = useCallback(
		async (targetId: string, currentStatus: boolean) => {
			if (!group) return;
			try {
				await fetchClient(`/internal/datagroup/${group.id}/permissions`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						username: targetId,
						can_read_data: !currentStatus,
					}),
				});
				setMembers((prev) =>
					prev.map((m) =>
						m.user_id === targetId
							? { ...m, can_read_data: !currentStatus }
							: m,
					),
				);
			} catch {
				showSnackbar("Failed to update user status", "error");
			}
		},
		[group, showSnackbar],
	);

	const kickMember = useCallback(
		async (targetId: string) => {
			if (!group || !window.confirm("Remove this user?")) return;
			try {
				const res = await fetchClient(
					`/internal/datagroup/${group.id}/members/${targetId}`,
					{
						method: "DELETE",
					},
				);
				if (res.ok) {
					setMembers((prev) => prev.filter((m) => m.user_id !== targetId));
					showSnackbar("User removed", "info");
				}
			} catch {
				showSnackbar("Error removing user", "error");
			}
		},
		[group, showSnackbar],
	);

	const leaveGroup = useCallback(async () => {
		if (!group || !window.confirm("Leave this group?")) return;
		try {
			const res = await fetchClient(`/internal/datagroup/${group.id}/leave`, {
				method: "DELETE",
			});
			if (res.ok) {
				showSnackbar("Left group", "info");
				onLeaveCb();
			}
		} catch {
			showSnackbar("Error leaving group", "error");
		}
	}, [group, showSnackbar, onLeaveCb]);

	const deleteGroup = useCallback(async () => {
		if (!group || !window.confirm("Delete group?")) return;
		try {
			const res = await fetchClient(`/internal/datagroup/${group.id}`, {
				method: "DELETE",
			});
			if (res.ok) {
				showSnackbar("Group deleted", "info");
				onLeaveCb();
			}
		} catch {
			showSnackbar("Error deleting group", "error");
		}
	}, [group, showSnackbar, onLeaveCb]);

	return {
		members,
		myPerms,
		searchUsers,
		inviteUser,
		updateMyPerms,
		toggleReadAccess,
		kickMember,
		leaveGroup,
		deleteGroup,
	};
};
