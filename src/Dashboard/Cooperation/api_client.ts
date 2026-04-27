import type { Chain, FullGroupData, Group } from "./types";
import { v4 as uuidv4 } from "uuid";

// --- MOCK DATA ---
const MOCK_STORAGE_KEY = "MOCK_PUNOTED_GROUPS";

const getMockGroups = (): FullGroupData[] => {
	const data = localStorage.getItem(MOCK_STORAGE_KEY);
	if (data) {
		return JSON.parse(data);
	}
	// Default mock data
	const currentUserId = localStorage.getItem("currentUserId") || "mock-user-id";
	const defaultGroup: FullGroupData = {
		id: "mock-group-1",
		name: "My Dev Group",
		ownerId: currentUserId,
		members: [
			{
				uid: currentUserId,
				username: "DevUser",
				displayName: "Dev User",
				role: "owner",
			},
		],
		updated_at: new Date().toISOString(),
		isPending: false,
		chain: { nodes: [], links: [] },
	};
	localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify([defaultGroup]));
	return [defaultGroup];
};

const saveMockGroups = (groups: FullGroupData[]) => {
	localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(groups));
};

// Helper to simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- API MOCKS ---

export const fetchAllGroups = async (): Promise<FullGroupData[]> => {
	await delay(500); // Simulate network latency
	return getMockGroups();
};

export const changeUserRole = async (
	groupId: string,
	memberId: string,
	newRole: "editor" | "viewer",
) => {
	await delay(300);
	const groups = getMockGroups();
	const groupIndex = groups.findIndex((g) => g.id === groupId);
	if (groupIndex > -1) {
		const memberIndex = groups[groupIndex].members.findIndex(
			(m) => m.uid === memberId,
		);
		if (memberIndex > -1) {
			groups[groupIndex].members[memberIndex].role = newRole;
			saveMockGroups(groups);
		}
	}
};

export const createGroup = async (group: Group): Promise<Group> => {
	await delay(500);
	const groups = getMockGroups();

	const newGroup: FullGroupData = {
		...group,
		id: `mock-group-${uuidv4()}`,
		updated_at: new Date().toISOString(),
		isPending: false,
		chain: { nodes: [], links: [] },
		members: [
			{
				uid: group.ownerId,
				username: localStorage.getItem("displayName") || "DevUser",
				displayName: localStorage.getItem("displayName") || "DevUser",
				role: "owner",
			},
		],
	};

	groups.push(newGroup);
	saveMockGroups(groups);

	return newGroup;
};

export const saveChainData = async (
	groupId: string,
	chainData: Chain,
): Promise<{ newUpdatedDate: string }> => {
	await delay(200);
	const groups = getMockGroups();
	const groupIndex = groups.findIndex((g) => g.id === groupId);

	const newUpdatedDate = new Date().toISOString();

	if (groupIndex > -1) {
		groups[groupIndex].chain = chainData;
		groups[groupIndex].updated_at = newUpdatedDate;
		saveMockGroups(groups);
	}

	return { newUpdatedDate };
};

export const sendBeaconFinalSave = (groupId: string, chainData: Chain) => {
	// navigator.sendBeacon mock
	const groups = getMockGroups();
	const groupIndex = groups.findIndex((g) => g.id === groupId);

	if (groupIndex > -1) {
		groups[groupIndex].chain = chainData;
		groups[groupIndex].updated_at = new Date().toISOString();
		saveMockGroups(groups);
	}
};

export const deleteGroup = async (
	groupId: string,
	userId: string,
): Promise<void> => {
	await delay(400);
	let groups = getMockGroups();
	groups = groups.filter((g) => g.id !== groupId);
	saveMockGroups(groups);
};

export const acceptGroupInvite = async (groupId: string): Promise<void> => {
	await delay(400);
	const groups = getMockGroups();
	const groupIndex = groups.findIndex((g) => g.id === groupId);
	if (groupIndex > -1) {
		groups[groupIndex].isPending = false;
		saveMockGroups(groups);
	}
};

export const rejectGroupInvite = async (groupId: string): Promise<void> => {
	await delay(400);
	let groups = getMockGroups();
	groups = groups.filter((g) => g.id !== groupId);
	saveMockGroups(groups);
};

export const fetchNodeLiveData = async (
	groupId: string,
	planetId: string,
	materialTicker: string,
): Promise<{ userFlows: any[]; userStorage: any[] }> => {
	await delay(300);
	// Mock live node data returning some empty or static arrays
	return { userFlows: [], userStorage: [] };
};
