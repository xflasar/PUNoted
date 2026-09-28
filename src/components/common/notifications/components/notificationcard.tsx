import React from "react";
import {
	Box,
	IconButton,
	ListItem,
	ListItemIcon,
	ListItemText,
	Typography,
} from "@mui/material";
import {
	Circle,
	DeleteOutlineOutlined as DeleteOutline,
	DirectionsBoat,
	Inventory2,
	ShowChart,
	PrecisionManufacturing,
	Description,
	AccountBalanceWallet,
	Notifications,
} from "@mui/icons-material";
import { parseNotifData } from "../utils/parsenotifdata";
import { NotificationContentFactory } from "./notificationcontentfactory";
import type { UserNotification } from "../types";

interface NotificationCardProps {
	notification: UserNotification;
	isExpanded: boolean;
	onCardClick: (notif: UserNotification) => void;
	onToggleExpand: (id: string, e: React.MouseEvent) => void;
	onDeleteSingle: (id: string, e: React.MouseEvent) => void;
}

const getCategoryIcon = (category: string) => {
	const iconSx = { fontSize: "1.1rem" };
	switch (category) {
		case "fleet":
			return <DirectionsBoat sx={{ ...iconSx, color: "#64FFDA" }} />;
		case "storage":
			return <Inventory2 sx={{ ...iconSx, color: "#FFD54F" }} />;
		case "cx":
			return <ShowChart sx={{ ...iconSx, color: "#4FC3F7" }} />;
		case "production":
			return <PrecisionManufacturing sx={{ ...iconSx, color: "#FF8A65" }} />;
		case "contracts":
			return <Description sx={{ ...iconSx, color: "#BA68C8" }} />;
		case "financial":
			return <AccountBalanceWallet sx={{ ...iconSx, color: "#81C784" }} />;
		default:
			return <Notifications sx={{ ...iconSx, color: "#A594FF" }} />;
	}
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
	notification: n,
	isExpanded,
	onCardClick,
	onToggleExpand,
	onDeleteSingle,
}) => {
	const parsedData = parseNotifData(n.data);
	const hasDetails = parsedData !== null;

	return (
		<ListItem
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
			onClick={() => onCardClick(n)}
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
					slotProps={{
						primary: { component: "div" },
						secondary: { component: "div" },
					}}
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
									color: n.is_read ? "rgba(255,255,255,0.75)" : "#FFFFFF",
									fontSize: "0.78rem",
								}}
							>
								{n.title}
							</Typography>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								{!n.is_read && (
									<Circle sx={{ color: "#7B68EE", fontSize: "0.45rem" }} />
								)}
								<IconButton
									size="small"
									onClick={(e) => onDeleteSingle(n.id, e)}
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
									sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.65rem" }}
								>
									{new Date(n.created_at).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</Typography>
								{hasDetails && (
									<Typography
										variant="caption"
										onClick={(e) => onToggleExpand(n.id, e)}
										sx={{
											color: "#A594FF",
											fontSize: "0.65rem",
											fontWeight: 700,
											"&:hover": { textDecoration: "underline" },
										}}
									>
										{isExpanded ? "Hide Details ▲" : "View Details ▼"}
									</Typography>
								)}
							</Box>
						</Box>
					}
				/>
			</Box>

			{/* Render Inner Content via NotificationContentFactory */}
			{isExpanded && hasDetails && (
				<Box
					sx={{
						mt: 0.75,
						pt: 0.75,
						borderTop: "1px dashed rgba(255, 255, 255, 0.1)",
						width: "100%",
						transition: "height ease-in-out 1s",
					}}
				>
					<NotificationContentFactory
						category={n.category}
						type={n.type}
						data={parsedData}
					/>
				</Box>
			)}
		</ListItem>
	);
};
