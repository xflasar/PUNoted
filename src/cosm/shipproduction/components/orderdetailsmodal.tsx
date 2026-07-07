import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Stack,
	Typography,
	Divider,
} from "@mui/material";
import type { ShipOrder } from "../shiporders";
import MaterialBadge from "../../components/materialbadge";

export interface OrderDetailsModalProps {
	order: ShipOrder | null;
	onClose: () => void;
	getStatusChip: (status?: string) => React.ReactNode;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
	order,
	onClose,
	getStatusChip,
}) => {
	if (!order) return null;

	return (
		<Dialog
			open={!!order}
			onClose={onClose}
			slotProps={{
				paper: {
					sx: {
						background: "#191823",
						color: "white",
						borderRadius: "16px",
						border: "1px solid rgba(255,255,255,0.08)",
						minWidth: { xs: 280, sm: 420 },
						maxWidth: 500,
						p: 1,
					},
				},
			}}
		>
			<DialogTitle
				sx={{ fontWeight: "bold", fontSize: "16px", pb: 1, color: "#7b68ee" }}
			>
				Order Specs Detailed View
			</DialogTitle>
			<DialogContent sx={{ pb: 1 }}>
				<Stack spacing={2.5}>
					<Box>
						<Typography
							variant="caption"
							color="rgba(255,255,255,0.4)"
							sx={{ fontSize: "12px", textTransform: "uppercase" }}
						>
							Order Code
						</Typography>
						<Typography
							variant="body1"
							sx={{ fontSize: "13.5px", fontWeight: "bold" }}
						>
							#{order.id}
						</Typography>
					</Box>

					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Box>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px", textTransform: "uppercase" }}
							>
								Status
							</Typography>
							<Box sx={{ mt: 0.5 }}>{getStatusChip(order.status)}</Box>
						</Box>
						{order.guestPin && (
							<Box>
								<Typography
									variant="caption"
									color="rgba(255,255,255,0.4)"
									sx={{ fontSize: "12px", textTransform: "uppercase" }}
								>
									Tracking PIN
								</Typography>
								<Typography
									variant="body1"
									color="#ff9800"
									sx={{ fontSize: "13.5px", mt: 0.5, fontWeight: "bold" }}
								>
									{order.guestPin}
								</Typography>
							</Box>
						)}
					</Box>

					<Box>
						<Typography
							variant="caption"
							color="rgba(255,255,255,0.4)"
							sx={{ fontSize: "12px", textTransform: "uppercase" }}
						>
							Customer Info
						</Typography>
						<Typography variant="body2" sx={{ fontSize: "12.5px" }}>
							{order.customer}
						</Typography>
					</Box>

					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Box>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px", textTransform: "uppercase" }}
							>
								Price
							</Typography>
							<Typography
								variant="body2"
								color="#4caf50"
								sx={{ fontSize: "12.5px", fontWeight: "bold" }}
							>
								${order.price.toLocaleString()}
							</Typography>
						</Box>
						<Box>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px", textTransform: "uppercase" }}
							>
								Lead Time
							</Typography>
							<Typography
								variant="body2"
								sx={{ fontSize: "12.5px", fontWeight: "bold" }}
							>
								{order.waitTimeDays} Days
							</Typography>
						</Box>
					</Box>

					<Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

					<Box>
						<Typography
							variant="caption"
							color="rgba(255,255,255,0.4)"
							sx={{
								fontSize: "12px",
								textTransform: "uppercase",
								display: "block",
								mb: 1,
							}}
						>
							Required Bill of Materials
						</Typography>
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
							{order.shipType.parts.map((p) => (
								<Stack
									key={p.name}
									sx={{
										p: 0.3,
										px: 0.6,
										background: "rgba(255, 255, 255, 0.03)",
										borderRadius: "4px",
										border: "1px solid rgba(255,255,255,0.05)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										flexDirection: "row",
										gap: 0.2,
									}}
								>
									<Typography
										variant="caption"
										sx={{ fontSize: "12px", fontWeight: "bold" }}
									>
										{p.quantity}x
									</Typography>
									<Box
										sx={{
											display: "inline-block",
											transform: "scale(0.7)",
											transformOrigin: "left center",
										}}
									>
										<MaterialBadge ticker={p.name} />
									</Box>
								</Stack>
							))}
						</Box>
					</Box>

					{order.notes && (
						<Box>
							<Typography
								variant="caption"
								color="rgba(255,255,255,0.4)"
								sx={{ fontSize: "12px", textTransform: "uppercase" }}
							>
								Special Instructions
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontSize: "12px",
									color: "rgba(255,255,255,0.7)",
									background: "rgba(0,0,0,0.15)",
									p: 1,
									borderRadius: "6px",
									border: "1px solid rgba(255,255,255,0.02)",
									mt: 0.5,
								}}
							>
								{order.notes}
							</Typography>
						</Box>
					)}
				</Stack>
			</DialogContent>
			<DialogActions sx={{ pt: 1 }}>
				<Button
					onClick={onClose}
					sx={{ color: "#7b68ee", fontWeight: "bold", fontSize: "12px" }}
				>
					Close Specs
				</Button>
			</DialogActions>
		</Dialog>
	);
};
