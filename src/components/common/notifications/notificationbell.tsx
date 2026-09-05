import React, { useState, useEffect, useCallback, useRef } from "react";
import {
	Box,
	IconButton,
	Badge,
	Popover,
	Typography,
	Chip,
	Stack,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	CircularProgress,
	Tooltip,
} from "@mui/material";
import {
	Notifications,
	NotificationsNone,
	DoneAll,
	DeleteSweep,
	DirectionsBoat,
	Inventory2,
	ShowChart,
	PrecisionManufacturing,
	Description,
	AccountBalanceWallet,
	VolumeUp,
	VolumeOff,
	Circle,
	Close,
	DeleteOutlineOutlined as DeleteOutline,
} from "@mui/icons-material";
import { fetchClient } from "../../../utils/apiclient";
import { audioAlerts } from "../../../utils/audioalerts";
import { useGlobalWsContext } from "../../../dashboard/websocket/globalwscontext";

export interface UserNotification {
	id: string;
	category: string;
	type: string;
	title: string;
	message: string;
	data?: any;
	is_read: boolean;
	created_at: string;
}

export const NotificationBell: React.FC = () => {
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

	// Safe JSON Parser helper for data payloads
	const parseNotifData = (raw: any): Record<string, any> | null => {
		if (!raw) return null;
		let parsed = raw;
		if (typeof raw === "string") {
			try {
				parsed = JSON.parse(raw);
			} catch {
				return null;
			}
		}
		if (
			typeof parsed === "object" &&
			parsed !== null &&
			Object.keys(parsed).length > 0
		) {
			return parsed;
		}
		return null;
	};

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
					setUnreadCount((prev) => Math.max(0, prev - 1));
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
				if (target && !target.is_read) {
					setUnreadCount((prev) => Math.max(0, prev - 1));
				}
				setNotifications((prev) => prev.filter((n) => n.id !== id));
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

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case "fleet":
				return <DirectionsBoat sx={{ color: "#4FC3F7", fontSize: "1rem" }} />;
			case "storage":
				return <Inventory2 sx={{ color: "#FFB74D", fontSize: "1rem" }} />;
			case "cx":
				return <ShowChart sx={{ color: "#81C784", fontSize: "1rem" }} />;
			case "production":
				return (
					<PrecisionManufacturing sx={{ color: "#BA68C8", fontSize: "1rem" }} />
				);
			case "contract":
				return <Description sx={{ color: "#FFF176", fontSize: "1rem" }} />;
			case "financial":
				return (
					<AccountBalanceWallet sx={{ color: "#64FFDA", fontSize: "1rem" }} />
				);
			case "system":
				return <Notifications sx={{ color: "#64FFDA", fontSize: "1rem" }} />;
			default:
				return <Notifications sx={{ color: "#7B68EE", fontSize: "1rem" }} />;
		}
	};

	const openPopover = Boolean(anchorEl);

	return (
		<>
			<Tooltip title="Notifications">
				<IconButton color="inherit" onClick={handleOpen} size="large">
					<Badge badgeContent={unreadCount} color="error" max={99}>
						{unreadCount > 0 ? (
							<Notifications sx={{ color: "#A594FF" }} />
						) : (
							<NotificationsNone />
						)}
					</Badge>
				</IconButton>
			</Tooltip>

			<Popover
				open={openPopover}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				slotProps={{
					paper: {
						sx: {
							width: { xs: 340, sm: 420 },
							maxWidth: 440,
							maxHeight: "55vh",
							overflowX: "hidden",
							bgcolor: "#141424",
							color: "white",
							borderRadius: 2.5,
							border: "1px solid rgba(255, 255, 255, 0.12)",
							boxShadow: "0px 8px 32px rgba(0,0,0,0.5)",
							display: "flex",
							flexDirection: "column",
						},
					},
				}}
			>
				{/* Top Header with Title and X Close Button */}
				<Box
					sx={{
						p: 1.5,
						pb: 1,
						borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							mb: 1,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Typography
								variant="subtitle2"
								sx={{ fontWeight: 800, fontSize: "0.88rem" }}
							>
								Notifications
							</Typography>
							{unreadCount > 0 && (
								<Chip
									size="small"
									label={`${unreadCount} unread`}
									color="error"
									sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
								/>
							)}
						</Box>

						<Stack direction="row" spacing={0.5} alignItems="center">
							<IconButton
								size="small"
								onClick={() => setSoundEnabled(!soundEnabled)}
								title={soundEnabled ? "Mute alert audio" : "Enable alert audio"}
							>
								{soundEnabled ? (
									<VolumeUp sx={{ fontSize: "0.95rem", color: "#A594FF" }} />
								) : (
									<VolumeOff
										sx={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.4)" }}
									/>
								)}
							</IconButton>
							<IconButton
								size="small"
								onClick={handleMarkAllRead}
								title="Mark all as read"
								disabled={unreadCount === 0}
							>
								<DoneAll
									sx={{
										fontSize: "1rem",
										color:
											unreadCount > 0 ? "#64FFDA" : "rgba(255,255,255,0.3)",
									}}
								/>
							</IconButton>
							<IconButton
								size="small"
								onClick={handleClearAll}
								title="Clear all history"
								disabled={notifications.length === 0}
							>
								<DeleteSweep
									sx={{
										fontSize: "1rem",
										color:
											notifications.length > 0
												? "#FF5252"
												: "rgba(255,255,255,0.3)",
									}}
								/>
							</IconButton>
							<IconButton
								size="small"
								onClick={handleClose}
								title="Close notifications"
								sx={{
									color: "rgba(255,255,255,0.7)",
									"&:hover": { color: "#FFF" },
								}}
							>
								<Close sx={{ fontSize: "1.1rem" }} />
							</IconButton>
						</Stack>
					</Box>

					{/* Category Filter Chips */}
					<Stack
						direction="row"
						spacing={0.5}
						sx={{
							overflowX: "auto",
							pb: 0.25,
							"&::-webkit-scrollbar": { display: "none" },
						}}
					>
						{[
							"all",
							"fleet",
							"storage",
							"cx",
							"production",
							"contract",
							"financial",
							"system",
						].map((cat) => (
							<Chip
								key={cat}
								size="small"
								label={cat.toUpperCase()}
								onClick={() => setActiveCategory(cat)}
								sx={{
									height: 20,
									fontSize: "0.62rem",
									fontWeight: 700,
									bgcolor:
										activeCategory === cat
											? "rgba(123, 104, 238, 0.3)"
											: "rgba(255,255,255,0.05)",
									color:
										activeCategory === cat
											? "#A594FF"
											: "rgba(255,255,255,0.6)",
									border:
										activeCategory === cat
											? "1px solid #7B68EE"
											: "1px solid transparent",
									cursor: "pointer",
								}}
							/>
						))}
					</Stack>
				</Box>

				{/* Notifications List Content */}
				<Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
					{loading ? (
						<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
							<CircularProgress size={20} />
						</Box>
					) : notifications.length === 0 ? (
						<Box sx={{ py: 4, textAlign: "center" }}>
							<NotificationsNone
								sx={{
									fontSize: "2rem",
									color: "rgba(255,255,255,0.2)",
									mb: 0.5,
								}}
							/>
							<Typography
								variant="caption"
								sx={{ color: "rgba(255,255,255,0.5)", display: "block" }}
							>
								No notifications in this category.
							</Typography>
						</Box>
					) : (
						<List disablePadding>
							{notifications.map((n) => {
								const isExpanded = expandedIds[n.id];
								const parsedData = parseNotifData(n.data);
								const hasDetails = parsedData !== null;

								return (
									<ListItem
										key={n.id}
										sx={{
											p: 1,
											mb: 0.5,
											borderRadius: 1.75,
											bgcolor: n.is_read
												? "rgba(0, 0, 0, 0.25)"
												: "rgba(123, 104, 238, 0.08)",
											border: n.is_read
												? "1px solid rgba(255, 255, 255, 0.06)"
												: "1px solid rgba(123, 104, 238, 0.22)",
											opacity: n.is_read ? 0.75 : 1,
											display: "flex",
											flexDirection: "column",
											alignItems: "stretch",
											cursor: "pointer",
											transition: "all 0.15s ease",
											"&:hover": {
												bgcolor: n.is_read
													? "rgba(255, 255, 255, 0.06)"
													: "rgba(123, 104, 238, 0.18)",
												opacity: 1,
											},
										}}
										onClick={() => handleCardClick(n)}
									>
										<Box
											sx={{
												display: "flex",
												alignItems: "flex-start",
												gap: 1,
												width: "100%",
											}}
										>
											<ListItemIcon sx={{ minWidth: "auto", mt: 0.2 }}>
												{getCategoryIcon(n.category)}
											</ListItemIcon>
											<ListItemText
												primaryTypographyProps={{ component: "div" }}
												secondaryTypographyProps={{ component: "div" }}
												primary={
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															justifyContent: "space-between",
															gap: 1,
														}}
													>
														<Typography
															variant="subtitle2"
															sx={{
																fontWeight: n.is_read ? 600 : 700,
																color: n.is_read
																	? "rgba(255,255,255,0.75)"
																	: "#FFFFFF",
																fontSize: "0.78rem",
															}}
														>
															{n.title}
														</Typography>
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																gap: 0.5,
															}}
														>
															{!n.is_read && (
																<Circle
																	sx={{ color: "#7B68EE", fontSize: "0.45rem" }}
																/>
															)}
															<IconButton
																size="small"
																onClick={(e) => handleDeleteSingle(n.id, e)}
																title="Delete notification"
																sx={{
																	p: 0.2,
																	color: "rgba(255,255,255,0.3)",
																	"&:hover": { color: "#FF5252" },
																}}
															>
																<DeleteOutline sx={{ fontSize: "0.85rem" }} />
															</IconButton>
														</Box>
													</Box>
												}
												secondary={
													<Box sx={{ mt: 0.2 }}>
														<Typography
															variant="caption"
															sx={{
																color: n.is_read
																	? "rgba(255,255,255,0.5)"
																	: "rgba(255,255,255,0.7)",
																display: "block",
																lineHeight: 1.25,
																fontSize: "0.72rem",
															}}
														>
															{n.message}
														</Typography>
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																justifyContent: "space-between",
																mt: 0.3,
															}}
														>
															<Typography
																variant="caption"
																sx={{
																	color: "rgba(255,255,255,0.35)",
																	fontSize: "0.65rem",
																}}
															>
																{new Date(n.created_at).toLocaleTimeString([], {
																	hour: "2-digit",
																	minute: "2-digit",
																})}
															</Typography>
															{hasDetails && (
																<Typography
																	variant="caption"
																	onClick={(e) => toggleExpand(n.id, e)}
																	sx={{
																		color: "#A594FF",
																		fontSize: "0.65rem",
																		fontWeight: 700,
																		"&:hover": { textDecoration: "underline" },
																	}}
																>
																	{isExpanded
																		? "Hide Details ▲"
																		: "View Details ▼"}
																</Typography>
															)}
														</Box>
													</Box>
												}
											/>
										</Box>

										{/* Clean UI Expanded Details */}
										{isExpanded && hasDetails && (
											<Box
												sx={{
													mt: 0.75,
													pt: 0.75,
													borderTop: "1px dashed rgba(255, 255, 255, 0.1)",
													width: "100%",
												}}
											>
												{parsedData.balances &&
												Array.isArray(parsedData.balances) ? (
													<Stack
														direction="row"
														spacing={0.75}
														flexWrap="wrap"
														useFlexGap
														sx={{ gap: 0.5 }}
													>
														{parsedData.balances.map((b: any, idx: number) => (
															<Chip
																key={idx}
																size="small"
																label={`${Number(b.balanceamount || 0).toLocaleString()} ${b.balancecurrencycode}`}
																sx={{
																	height: 20,
																	fontSize: "0.65rem",
																	fontWeight: 700,
																	bgcolor: "rgba(100, 255, 218, 0.15)",
																	color: "#64FFDA",
																}}
															/>
														))}
													</Stack>
												) : (
													<Stack
														direction="row"
														spacing={0.75}
														flexWrap="wrap"
														useFlexGap
														sx={{ gap: 0.5 }}
													>
														{Object.entries(parsedData).map(([k, v]) => (
															<Chip
																key={k}
																size="small"
																label={`${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`}
																sx={{
																	height: 18,
																	fontSize: "0.62rem",
																	fontWeight: 600,
																	bgcolor: "rgba(255, 255, 255, 0.08)",
																	color: "rgba(255,255,255,0.8)",
																}}
															/>
														))}
													</Stack>
												)}
											</Box>
										)}
									</ListItem>
								);
							})}
						</List>
					)}
				</Box>
			</Popover>
		</>
	);
};
