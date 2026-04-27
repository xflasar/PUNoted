import { useEffect, useCallback } from "react";
import { useGlobalWsContext } from "./GlobalWsContext";

/**
 * Connects a component to a specific WebSocket channel.
 * @param channel The channel ID to subscribe to (e.g., "dashboard", "group:123").
 * @param onMessage Optional callback when ANY message arrives.
 */
export const useGlobalWs = (
	channel?: string,
	onMessage?: (data: any) => void,
) => {
	const {
		subscribe,
		unsubscribe,
		addMessageListener,
		removeMessageListener,
		sendJson,
		status,
	} = useGlobalWsContext();

	// 1. Handle Subscription Lifecycle
	useEffect(() => {
		if (!channel) return;

		// Subscribe when component mounts
		subscribe(channel);

		// Unsubscribe when component unmounts
		return () => {
			unsubscribe(channel);
		};
	}, [channel, subscribe, unsubscribe]);

	// 2. Handle Message Listening
	useEffect(() => {
		if (!onMessage) return;

		// Wrap the callback to ensure it's stable
		const handleMsg = (data: any) => {
			// OPTIONAL: You could filter here if your backend envelopes messages
			// e.g. if (data.channel === channel) onMessage(data)
			// But since your backend currently sends raw payloads ("type": "DASHBOARD_UPDATE"),
			// we pass everything and let the component decide (or the backend needs to send channel IDs).
			onMessage(data);
		};

		addMessageListener(handleMsg);
		return () => removeMessageListener(handleMsg);
	}, [onMessage, addMessageListener, removeMessageListener]);

	return {
		send: sendJson,
		status,
	};
};
