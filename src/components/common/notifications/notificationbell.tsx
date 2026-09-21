import React from "react";
import {
	Box,
	IconButton,
	Badge,
	Popover,
	Typography,
	Chip,
	Stack,
	List,
	CircularProgress,
	Tooltip,
} from "@mui/material";
import {
	Notifications,
	NotificationsNone,
	NotificationsActive,
	NotificationsOff,
	DoneAll,
	DeleteSweep,
	VolumeUp,
	VolumeOff,
	Close,
} from "@mui/icons-material";
import { NotificationCard } from "./components/notificationcard";
import { useNotificationBell } from "./hooks/usenotificationbell";

export const NotificationBell: React.FC = () => {
	const {
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
	} = useNotificationBell();

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

						<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
							<IconButton
								size="small"
								onClick={requestBrowserPushPermission}
								title={
									browserPushEnabled
										? "Desktop push notifications active"
										: "Enable desktop push notifications"
								}
							>
								{browserPushEnabled ? (
									<NotificationsActive
										sx={{ fontSize: "0.95rem", color: "#64FFDA" }}
									/>
								) : (
									<NotificationsOff
										sx={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.4)" }}
									/>
								)}
							</IconButton>
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
							{notifications.map((n) => (
								<NotificationCard
									key={n.id}
									notification={n}
									isExpanded={!!expandedIds[n.id]}
									onCardClick={handleCardClick}
									onToggleExpand={toggleExpand}
									onDeleteSingle={handleDeleteSingle}
								/>
							))}
						</List>
					)}
				</Box>
			</Popover>
		</>
	);
};

