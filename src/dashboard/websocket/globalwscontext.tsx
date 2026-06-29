import React, {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
	useCallback,
} from "react";
import type { ReactNode } from "react";

import { baseURL } from "../../utils/apiclient";

type WsStatus = "connecting" | "connected" | "disconnected";

interface GlobalWsContextState {
	status: WsStatus;
	sendJson: (data: any) => void;
	subscribe: (channel: string) => void;
	unsubscribe: (channel: string) => void;
	addMessageListener: (callback: (msg: any) => void) => void;
	removeMessageListener: (callback: (msg: any) => void) => void;
}

const GlobalWsContext = createContext<GlobalWsContextState | null>(null);

export const GlobalWsProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [status, setStatus] = useState<WsStatus>("disconnected");

	const wsRef = useRef<WebSocket | null>(null);
	const listenersRef = useRef<Set<(msg: any) => void>>(new Set());
	const activeChannels = useRef<Set<string>>(new Set());
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const intentionalClose = useRef(false);

	const connect = useCallback(() => {
		// 1. Force cleanup of any ghost timers or existing sockets
		if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

		if (wsRef.current) {
			console.log("WS: Cleaning up previous instance before new connection");
			const oldWs = wsRef.current;
			oldWs.onopen = null;
			oldWs.onmessage = null;
			oldWs.onerror = null;
			oldWs.onclose = null;
			oldWs.close();
			wsRef.current = null;
		}

		const token = localStorage.getItem("authToken");
		if (!token) {
			// No token at all -> send to landing page
			window.location.href = "/";
			return;
		}

		// --- DEFENSE LAYER 1: Decode JWT locally before connecting ---
		try {
			const tokenParts = token.split(".");
			if (tokenParts.length === 3) {
				const payload = JSON.parse(atob(tokenParts[1]));
				const now = Math.floor(Date.now() / 1000);
				if (payload.exp && payload.exp < now) {
					console.warn(
						"WS: Token expired locally. Proceeding to trigger server-side refresh...",
					);
				}
			}
		} catch (e) {
			console.error("WS: Token parse error", e);
		}

		intentionalClose.current = false;

		const isDev =
			process.env.NODE_ENV === "development" || (import.meta as any).env?.DEV;
		const wsBaseURL = baseURL.replace(/^http/, isDev ? "ws" : "wss");

		const path = "/ws/global";
		const url = `${wsBaseURL}${path}?token=${token}`;

		console.log("WS: Attempting single connection...");
		setStatus("connecting");

		const ws = new WebSocket(url);
		wsRef.current = ws;

		ws.onopen = () => {
			if (wsRef.current !== ws) {
				ws.close();
				return;
			}
			console.log("WS: Connected");
			setStatus("connected");

			activeChannels.current.forEach((channel) => {
				ws.send(JSON.stringify({ action: "SUBSCRIBE", channel }));
			});
		};

		ws.onmessage = (event) => {
			if (wsRef.current !== ws) return;
			try {
				const data = JSON.parse(event.data);

				// --- DEFENSE LAYER 2: Backend sends an error JSON payload before disconnecting ---
				if (data.error && data.error.toLowerCase().includes("expire")) {
					console.warn(
						"WS: Server reported token expiry via message. Triggering refresh...",
					);
					ws.close(4001, "expire");
					return;
				}

				if (data.type === "PONG") return;
				listenersRef.current.forEach((listener) => listener(data));
			} catch (e) {
				console.error("WS: Parse error", e);
			}
		};

		ws.onclose = async (event) => {
			if (wsRef.current === ws) {
				console.log(
					`WS: Socket Closed (Code: ${event.code}, Reason: ${event.reason})`,
				);
				setStatus("disconnected");
				wsRef.current = null;

				// --- DEFENSE LAYER 3: Backend closes connection with specific auth-failure code ---
				const isAuthError =
					event.code === 1008 ||
					event.code === 4001 ||
					event.code === 4003 ||
					(event.reason && event.reason.toLowerCase().includes("expire"));

				if (isAuthError) {
					console.warn(
						"WS: Server rejected auth. Attempting silent refresh...",
					);
					try {
						const refreshUrl = `${baseURL}/auth/refresh`;

						// Execute the native fetch request to get a new token
						const refreshRes = await fetch(refreshUrl, {
							method: "POST",
							credentials: "include",
							headers: { "Content-Type": "application/json" },
						});

						if (!refreshRes.ok) {
							throw new Error("Refresh token expired or invalid");
						}

						const refreshData = await refreshRes.json();
						console.log("WS: Token refreshed successfully! Reconnecting...");

						localStorage.setItem("authToken", refreshData.token);

						setTimeout(connect, 500);
						return;
					} catch (e) {
						console.warn("WS: Refresh cookie invalid/expired. Forcing logout.");
						localStorage.removeItem("authToken");
						intentionalClose.current = true;
						window.location.href = "/";
						return;
					}
				}

				if (!intentionalClose.current) {
					console.log("WS: Scheduling auto-reconnect...");
					reconnectTimeoutRef.current = setTimeout(connect, 3000);
				}
			}
		};

		ws.onerror = () => {
			if (wsRef.current === ws) ws.close();
		};
	}, []);

	useEffect(() => {
		// Use a small delay for the initial connection to let Strict Mode
		// finish its double-mount cycle peacefully.
		const mountDelay = setTimeout(connect, 50);

		return () => {
			clearTimeout(mountDelay);
			intentionalClose.current = true;
			setStatus("disconnected");

			if (reconnectTimeoutRef.current)
				clearTimeout(reconnectTimeoutRef.current);

			if (wsRef.current) {
				const socket = wsRef.current;
				wsRef.current = null;
				socket.onopen = null;
				socket.onmessage = null;
				socket.onerror = null;
				socket.onclose = null;
				socket.close();
			}
		};
	}, [connect]);

	// Helpers (unchanged)
	const sendJson = useCallback((data: any) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(data));
		}
	}, []);

	const subscribe = useCallback(
		(channel: string) => {
			if (!activeChannels.current.has(channel)) {
				activeChannels.current.add(channel);
				sendJson({ action: "SUBSCRIBE", channel });
			}
		},
		[sendJson],
	);

	const unsubscribe = useCallback(
		(channel: string) => {
			if (activeChannels.current.has(channel)) {
				activeChannels.current.delete(channel);
				sendJson({ action: "UNSUBSCRIBE", channel });
			}
		},
		[sendJson],
	);

	const addMessageListener = useCallback((cb: (msg: any) => void) => {
		listenersRef.current.add(cb);
	}, []);

	const removeMessageListener = useCallback((cb: (msg: any) => void) => {
		listenersRef.current.delete(cb);
	}, []);

	return (
		<GlobalWsContext.Provider
			value={{
				status,
				sendJson,
				subscribe,
				unsubscribe,
				addMessageListener,
				removeMessageListener,
			}}
		>
			{children}
		</GlobalWsContext.Provider>
	);
};

export const useGlobalWsContext = () => {
	const ctx = useContext(GlobalWsContext);

	// Fallback for Public Mode / Missing Provider
	if (!ctx) {
		return {
			status: "disconnected",
			lastMessage: null,
			sendJson: () => {}, // No-op
			addMessageListener: () => {},
			removeMessageListener: () => {},
			readyState: 3, // CLOSED
		};
	}

	return ctx;
};
