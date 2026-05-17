import { API_BASE_URL } from "../../../config/api";
import type { Chain, FullGroupData, Group } from "./types";

// Helper to handle standard fetch responses and throw errors
const handleResponse = async (response: Response) => {
	const data = response.status === 204 ? {} : await response.json();
	if (!response.ok) {
		const detail = data.detail || "An unknown error occurred.";
		throw new Error(detail);
	}
	return data;
};

// --- Group Data Fetching and Sync (loadGroupData omitted for brevity, assuming it exists) ---
/**
 * Fetches all groups the user is a member of.
 * Corresponds to GET /api/groups
 */
export const fetchAllGroups = async (): Promise<FullGroupData[]> => {
	// NOTE: If your backend uses the user ID from a token, you can omit the query param.
	// If your backend relies on the query param (as per the code shown), use it:
	const response = await fetch(`${API_BASE_URL}groups`, {
		method: "GET",
		headers: {
			// Include Authorization header if using token-based auth
			Authorization: `Bearer ${localStorage.getItem("authToken")}`,
		},
	});

	// Expects a 200 OK response with List<FullGroupData>
	// Handles error responses (like 404/empty list)
	const data = await handleResponse(response);

	// Since the backend returns an empty list [] on 404/no groups,
	// the frontend will treat this as an empty array, matching FullGroupData[]
	return data as FullGroupData[];
};

/**
 * [NEW FUNCTION] Sends a request to the backend to change a user's role in a group.
 * @param groupId The ID of the group.
 * @param memberId The UID of the user whose role is being changed.
 * @param newRole The new role ('editor' or 'viewer').
 */
export const changeUserRole = async (
	groupId: string,
	memberId: string,
	newRole: "editor" | "viewer",
) => {
	const response = await fetch(
		`${API_BASE_URL}groups/${groupId}/members/${memberId}/role`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Crucial for auth
			},
			body: JSON.stringify({ new_role: newRole }), // Match Pydantic RoleUpdateModel
		},
	);

	if (!response.ok) {
		const data = await response.json();
		throw new Error(data.detail || "Failed to update user role.");
	}

	// Return success message or null/void
	return;
};

// --- Group Creation ---

/**
 * Creates a new group owned by the current user.
 * Corresponds to POST /api/groups
 */
export const createGroup = async (group: Group): Promise<Group> => {
	const response = await fetch(`${API_BASE_URL}groups`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${localStorage.getItem("authToken")}`,
		},
		body: JSON.stringify(group),
	});

	const data = await handleResponse(response);

	// NOTE: Backend returns a minimal response, frontend needs to handle the full structure creation
	// For now, we return the minimal API response.
	return data.group;
};

// --- Group Data Saving ---
/**
 * Saves the current production chain state to the database.
 * Corresponds to POST /api/groups/{groupId}/save_chain
 * * NOTE: The signature is simplified as user_id is no longer needed in the payload.
 * It now returns the CRITICAL new updated_at timestamp.
 */
export const saveChainData = async (
	groupId: string,
	chainData: Chain,
): Promise<{ newUpdatedDate: string }> => {
	const payload = {
		chain_data: chainData, // Only send the chain data
	};

	const response = await fetch(`${API_BASE_URL}groups/${groupId}/save_chain`, {
		// Updated endpoint
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Added Auth header
		},
		body: JSON.stringify(payload),
	});

	const data = await handleResponse(response);

	// Backend returns { message: string, new_updated_at: string }
	return { newUpdatedDate: data.new_updated_at };
};

/**
 * Sends a synchronous final save request using navigator.sendBeacon.
 * Used when the browser tab is closing to bypass debounce.
 */
export const sendBeaconFinalSave = (groupId: string, chainData: Chain) => {
	const payload = { chain_data: chainData };
	const blob = new Blob([JSON.stringify(payload)], {
		type: "application/json",
	});

	// NOTE: sendBeacon may require the backend to use cookie/session auth
	// as custom headers (like Authorization) are often stripped during unload.
	navigator.sendBeacon(`${API_BASE_URL}groups/${groupId}/save_chain`, blob);
};

// --- Group Deletion ---

/**
 * Deletes a group. Only possible for the owner.
 * Corresponds to DELETE /api/groups/{groupId}
 */
export const deleteGroup = async (
	groupId: string,
	userId: string,
): Promise<void> => {
	const payload = {
		user_id: userId,
	};

	const response = await fetch(`${API_BASE_URL}groups/${groupId}`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	await handleResponse(response); // Expects 204 No Content
};

/**
 * Accepts a pending group invitation.
 */
export const acceptGroupInvite = async (groupId: string): Promise<void> => {
	const response = await fetch(
		`${API_BASE_URL}groups/${groupId}/invite/accept`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("authToken")}`,
			},
		},
	);
	await handleResponse(response);
};

/**
 * Rejects a pending group invitation.
 */
export const rejectGroupInvite = async (groupId: string): Promise<void> => {
	const response = await fetch(
		`${API_BASE_URL}groups/${groupId}/invite/reject`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("authToken")}`,
			},
		},
	);
	await handleResponse(response);
};

/**
 * Fetches the live storage and production data for a specific material on a specific planet.
 */
export const fetchNodeLiveData = async (
	groupId: string,
	planetId: string,
	materialTicker: string,
): Promise<{ userFlows: any[]; userStorage: any[] }> => {
	const url = new URL(`${API_BASE_URL}groups/${groupId}/live-node-data`);
	url.searchParams.append("planet_id", planetId);
	url.searchParams.append("material", materialTicker);

	const response = await fetch(url.toString(), {
		method: "GET",
		headers: {
			Authorization: `Bearer ${localStorage.getItem("authToken")}`,
		},
	});
	return await handleResponse(response);
};
