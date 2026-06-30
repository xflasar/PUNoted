import { useState, useEffect, useCallback } from "react";
import type { Group } from "../../../types";
import { fetchClient } from "../../../../../utils/apiclient";

export const useGroupsData = (
	wsTrigger: number,
	showSnackbar: (msg: string, type: any) => void,
) => {
	const [groups, setGroups] = useState<Group[]>([]);
	const [invites, setInvites] = useState<Group[]>([]);

	const fetchGroups = useCallback(async () => {
		try {
			const res = await fetchClient(`/internal/datagroup/`);
			if (res.ok) {
				const data: Group[] = await res.json();
				setGroups(data.filter((g) => g.my_status === "ACCEPTED"));
				setInvites(data.filter((g) => g.my_status === "INVITED"));
			}
		} catch {
			// Background fails silently to avoid spamming UI
		}
	}, []);

	useEffect(() => {
		fetchGroups();
	}, [wsTrigger, fetchGroups]);

	const createGroup = async (
		name: string,
		desc: string,
		onSuccess: () => void,
	) => {
		try {
			const res = await fetchClient(`/internal/datagroup/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, description: desc }),
			});
			if (res.ok) {
				showSnackbar("Group Created!", "success");
				onSuccess();
				fetchGroups();
			} else {
				showSnackbar("Failed to create group", "error");
			}
		} catch {
			showSnackbar("Error communicating with server", "error");
		}
	};

	const acceptInvite = async (
		group: Group,
		perms: string[],
		onSuccess: (suffix: string) => void,
	) => {
		try {
			const res = await fetchClient(`/internal/datagroup/${group.id}/accept`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ granted_permissions: perms }),
			});
			const data = await res.json();
			if (res.ok) {
				showSnackbar("Joined Group", "success");
				onSuccess(data.personal_suffix);
				fetchGroups();
			} else {
				showSnackbar(data.detail || "Error accepting", "error");
			}
		} catch {
			showSnackbar("Error accepting invite", "error");
		}
	};

	return { groups, invites, fetchGroups, createGroup, acceptInvite };
};
