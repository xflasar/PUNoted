import { useState, useEffect, useCallback, useRef } from "react";
import type {
	UseGroupSyncProps,
	SyncMessage,
	Chain,
	CursorMovePayload,
	NodeMovePayload,
	NodeUpdatePayload,
	GroupDataResponse,
	NodeRemovePayload,
} from "../types";

interface RemoteCursor {
	id: string;
	x: number;
	y: number;
	username: string;
}

interface LockedNodeState {
	nodeId: string;
	userId: string;
}

export const useGroupSync = ({
	groupId,
	userId,
	currentChain,
	onChainUpdate,
	onGroupInvite,
	onRemoteNodeMove,
	onGroupMemberUpdate,
}: UseGroupSyncProps) => {
	// --- Mock State ---
	const [isConnected, setIsConnected] = useState(false);
	const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(
		new Map(),
	);
	const [lockedNode, setLockedNode] = useState<LockedNodeState[] | null>(null);
	const [hasEverBeenConnected, setHasEverBeenConnected] = useState(false);

	// --- Mock Exposed Send Function ---
	const sendMessage = useCallback((message: Omit<SyncMessage, "userId">) => {
		// Do nothing in mock mode.
		// The chain updates are still captured locally by the UI.
		console.log("Mock WS message sent:", message.type);
	}, []);

	// --- Mock Reconnect ---
	const reconnect = useCallback(() => {
		setIsConnected(true);
		setHasEverBeenConnected(true);
	}, []);

	// --- Mock Setup Effect ---
	useEffect(() => {
		if (!groupId) return;

		// Simulate connecting immediately
		setIsConnected(true);
		setHasEverBeenConnected(true);

		return () => {
			setIsConnected(false);
		};
	}, [groupId]);

	return {
		isConnected,
		sendSyncMessage: sendMessage,
		remoteCursors,
		lockedNode,
		setLockedNode,
		reconnect,
		hasEverBeenConnected,
	};
};
