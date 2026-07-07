import React from "react";
import {
	Paper,
	Typography,
	Box,
	Stack,
	Divider,
	Tooltip,
	IconButton,
} from "@mui/material";
import {
	Done as CompleteIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
} from "@mui/icons-material";
import type { ShipOrder } from "../shiporders";

export interface OrderCardProps {
	order: ShipOrder;
	isAdmin: boolean;
	isUser: boolean;
	isGuest: boolean;
	onDetailsClick: (order: ShipOrder) => void;
	onCompleteClick: (e: React.MouseEvent, orderId: number) => void;
	onEditClick: (e: React.MouseEvent, orderId: number) => void;
	onDeleteClick: (e: React.MouseEvent, orderId: number) => void;
	getStatusChip: (status?: string) => React.ReactNode;
}

export const OrderCard: React.FC<OrderCardProps> = ({
	order,
	isAdmin,
	isUser,
	isGuest,
	onDetailsClick,
	onCompleteClick,
	onEditClick,
	onDeleteClick,
	getStatusChip,
}) => {
	const isOwner =
		isAdmin ||
		(isUser && (order.ownerType === "USER" || order.ownerType === "API"));

	return (
		<Paper
			onClick={() => onDetailsClick(order)}
			sx={{
				p: 1.5,
				borderRadius: "16px",
				background: "rgba(30, 29, 45, 0.45)",
				backdropFilter: "blur(12px)",
				border: "1px solid rgba(25, 24, 35, 0.8)",
				boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
				cursor: "pointer",
				transition:
					"transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
				"&:hover": {
					transform: "scale(1.02)",
					borderColor: "#7b68ee",
					boxShadow: "0 12px 40px 0 rgba(123, 104, 238, 0.25)",
				},
				color: "white",
			}}
		>
			<Stack spacing={1.2}>
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
				>
					<Typography
						variant="body2"
						fontWeight="bold"
						color="#7b68ee"
						sx={{ fontSize: "13px" }}
					>
						#{order.id.toString().slice(-6)}
					</Typography>
					<Stack direction="row" spacing={0.8} alignItems="center">
						<Typography
							variant="caption"
							fontWeight="bold"
							sx={{ color: "#7b68ee", fontSize: "12px" }}
						>
							{order.shipType.name}
						</Typography>
						{getStatusChip(order.status)}
					</Stack>
				</Stack>

				<Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

				<Box>
					<Typography
						variant="caption"
						color="rgba(255,255,255,0.4)"
						sx={{
							fontSize: "12px",
							display: "block",
							textTransform: "uppercase",
							fontWeight: "bold",
						}}
					>
						Customer
					</Typography>
					<Typography
						variant="body1"
						sx={{
							fontWeight: "bold",
							fontSize: "13px",
							color: "#ffffff",
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{order.customer}
					</Typography>
				</Box>

				<Box>
					{order.notes ? (
						<>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{
									fontSize: "12px",
									display: "block",
									textTransform: "uppercase",
									fontWeight: "bold",
								}}
							>
								Special Instructions
							</Typography>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255, 255, 255, 0.45)",
									display: "block",
									fontSize: "12px",
									fontStyle: "italic",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								"{order.notes}"
							</Typography>
						</>
					) : (
						<Box sx={{ height: 16 }} />
					)}
				</Box>

				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					sx={{ pt: 0.5 }}
				>
					<Box sx={{ flexGrow: 1 }}>
						<Typography
							variant="caption"
							color="rgba(255,255,255,0.4)"
							sx={{
								fontSize: "12px",
								display: "block",
								textTransform: "uppercase",
								fontWeight: "bold",
							}}
						>
							Price & Wait
						</Typography>
						<Typography
							variant="body2"
							fontWeight="bold"
							color="#4caf50"
							sx={{ fontSize: "12.5px" }}
						>
							${order.price.toLocaleString()} | {order.waitTimeDays}d
						</Typography>
					</Box>

					{/* Glassy Action Pills */}
					{!isGuest && (
						<Stack
							direction="row"
							spacing={0.5}
							onClick={(e) => e.stopPropagation()}
							sx={{
								bgcolor: "rgba(255,255,255,0.03)",
								p: 0.3,
								borderRadius: "8px",
								border: "1px solid rgba(255,255,255,0.05)",
							}}
						>
							{isAdmin && order.status !== "COMPLETED" && (
								<Tooltip title="Complete Order">
									<IconButton
										color="success"
										size="small"
										sx={{
											p: 0.4,
											"&:hover": { bgcolor: "rgba(76, 175, 80, 0.15)" },
										}}
										onClick={(e) => onCompleteClick(e, order.id)}
									>
										<CompleteIcon sx={{ fontSize: 16 }} />
									</IconButton>
								</Tooltip>
							)}

							{isOwner && (
								<>
									<Tooltip title="Edit Config">
										<IconButton
											color="warning"
											size="small"
											sx={{
												p: 0.4,
												"&:hover": { bgcolor: "rgba(255, 152, 0, 0.15)" },
											}}
											onClick={(e) => onEditClick(e, order.id)}
										>
											<EditIcon sx={{ fontSize: 16 }} />
										</IconButton>
									</Tooltip>

									<Tooltip title="Delete Order">
										<IconButton
											color="error"
											size="small"
											sx={{
												p: 0.4,
												"&:hover": { bgcolor: "rgba(244, 67, 54, 0.15)" },
											}}
											onClick={(e) => onDeleteClick(e, order.id)}
										>
											<DeleteIcon sx={{ fontSize: 16 }} />
										</IconButton>
									</Tooltip>
								</>
							)}
						</Stack>
					)}
				</Stack>
			</Stack>
		</Paper>
	);
};
