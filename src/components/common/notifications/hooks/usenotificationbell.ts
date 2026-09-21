import { useState, useEffect, useCallback, useRef } from "react";
import { fetchClient } from "../../../../utils/apiclient";
import { audioAlerts } from "../../../../utils/audioalerts";
import { useGlobalWsContext } from "../../../../dashboard/websocket/globalwscontext";
import type { UserNotification } from "../types";
import { parseNotifData } from "../utils/parsenotifdata";

export const useNotificationBell = () => {
	const wsContext = useGlobalWsContext();
	const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
	const [notifications, setNotifications] = useState<UserNotification[]>([]);
	const [unreadCount, setUnreadCount] = useState<number>(0);
	const [loading, setLoading] = useState<boolean>(false);
	const [activeCategory, setActiveCategory] = useState<string>("all");
	const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
	const [browserPushEnabled, setBrowserPushEnabled] = useState<boolean>(false);
	const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

	const lastChimeTime = useRef<number>(0);
	const pendingPushNotifs = useRef<UserNotification[]>([]);
	const pushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Auto-request browser notification permission on mount if undecided
	useEffect(() => {
		if (typeof window !== "undefined" && "Notification" in window) {
			if (window.Notification.permission === "granted") {
				setBrowserPushEnabled(true);
			} else if (window.Notification.permission === "default") {
				window.Notification.requestPermission().then((perm) => {
					setBrowserPushEnabled(perm === "granted");
				});
			}
		}
	}, []);


	// Listen to real-time WebSocket USER_NOTIFICATION messages with throttling
	useEffect(() => {
		if (!wsContext) return;
		const handleMessage = (msg: any) => {
			const isNotif =
				msg &&
				(msg.messageType === "USER_NOTIFICATION" ||
					msg.type === "USER_NOTIFICATION");
			if (isNotif) {
				const notif: UserNotification = msg.data || msg.payload;
				if (!notif) return;
				console.log(
					"🔔 [NotificationBell] Real-time WS notification received:",
					notif,
				);

				setNotifications((prev) => [
					notif,
					...prev.filter((n) => n.id !== notif.id),
				]);
				setUnreadCount((prev) => prev + 1);

				// 1. Throttle audio chime to at most once per 2 seconds
				const now = Date.now();
				if (soundEnabled && now - lastChimeTime.current > 2000) {
					lastChimeTime.current = now;
					audioAlerts.playChime("info");
				}

				// 2. Batch Desktop Push Notifications to avoid overloading browser
				if (
					"Notification" in window &&
					window.Notification.permission === "granted"
				) {
					pendingPushNotifs.current.push(notif);
					if (pushTimeoutRef.current) clearTimeout(pushTimeoutRef.current);

					pushTimeoutRef.current = setTimeout(() => {
						const batch = pendingPushNotifs.current;
						if (batch.length === 1) {
							new window.Notification(`PUNoted: ${batch[0].title}`, {
								body: batch[0].message,
								icon: "/icon128.png",
							});
						} else if (batch.length > 1) {
							new window.Notification(`PUNoted: ${batch.length} New Alerts`, {
								body: `${batch[0].title} and ${batch.length - 1} other new alert(s).`,
								icon: "/icon128.png",
							});
						}
						pendingPushNotifs.current = [];
					}, 1200);
				}
			}
		};

		wsContext.addMessageListener(handleMessage);
		return () => {
			wsContext.removeMessageListener(handleMessage);
		};
	}, [wsContext, soundEnabled]);

	const fetchInitialUnread = useCallback(async () => {
		try {
			const res = await fetchClient(
				"/internal/notifications/list?unread_only=true&limit=50",
			);
			if (res.ok) {
				const json = await res.json();
				if (json.notifications) {
					setNotifications(json.notifications);
				}
				if (json.unreadCount !== undefined) {
					setUnreadCount(json.unreadCount);
				}
			}
		} catch {
			// Silent catch
		}
	}, []);

	const fetchNotificationsList = useCallback(async () => {
		setLoading(true);
		try {
			const catParam =
				activeCategory !== "all" ? `?category=${activeCategory}` : "";
			const res = await fetchClient(`/internal/notifications/list${catParam}`);
			if (res.ok) {
				const json = await res.json();
				if (json.notifications) {
					setNotifications(json.notifications);
				}
				if (json.unreadCount !== undefined) {
					setUnreadCount(json.unreadCount);
				}
			}
		} catch {
			// Silent catch
		} finally {
			setLoading(false);
		}
	}, [activeCategory]);

	useEffect(() => {
		fetchInitialUnread();
	}, [fetchInitialUnread]);

	useEffect(() => {
		if (anchorEl) {
			fetchNotificationsList();
		}
	}, [anchorEl, fetchNotificationsList]);

	const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(e.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleMarkAllRead = async () => {
		try {
			const res = await fetchClient("/internal/notifications/mark-read", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ markAll: true }),
			});
			if (res.ok) {
				setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
				setUnreadCount(0);
			}
		} catch {
			// Silent catch
		}
	};

	const handleClearAll = async () => {
		try {
			const res = await fetchClient("/internal/notifications/clear", {
				method: "DELETE",
			});
			if (res.ok) {
				setNotifications([]);
				setUnreadCount(0);
			}
		} catch {
			// Silent catch
		}
	};

	const handleCardClick = async (notif: UserNotification) => {
		// Toggle expansion
		setExpandedIds((prev) => ({ ...prev, [notif.id]: !prev[notif.id] }));

		// Mark read in DB and UI state if unread
		if (!notif.is_read) {
			try {
				const res = await fetchClient("/internal/notifications/mark-read", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ notificationIds: [notif.id] }),
				});
				if (res.ok) {
					setNotifications((prev) =>
						prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
					);
				}
			} catch {
				// Silent catch
			}
		}
	};

	const handleDeleteSingle = async (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			const res = await fetchClient(`/internal/notifications/${id}`, {
				method: "DELETE",
			});
			if (res.ok) {
				const target = notifications.find((n) => n.id === id);
				setNotifications((prev) => prev.filter((n) => n.id !== id));
				if (target && !target.is_read) {
					setUnreadCount((prev) => Math.max(0, prev - 1));
				}
			}
		} catch {
			// Silent catch
		}
	};

	const requestBrowserPushPermission = async () => {
		if (typeof window !== "undefined" && "Notification" in window) {
			const perm = await window.Notification.requestPermission();
			setBrowserPushEnabled(perm === "granted");
		}
	};

	const toggleExpand = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	const openPopover = Boolean(anchorEl);

	return {
		anchorEl,
		notifications,
		unreadCount,
		loading,
		activeCategory,
		soundEnabled,
		browserPushEnabled,
		expandedIds,
		openPopover,
		setActiveCategory,
		setSoundEnabled,
		parseNotifData,
		handleOpen,
		handleClose,
		handleMarkAllRead,
		handleClearAll,
		handleCardClick,
		handleDeleteSingle,
		requestBrowserPushPermission,
		toggleExpand,
	};
};
