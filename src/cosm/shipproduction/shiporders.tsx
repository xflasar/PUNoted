import React, { useState, useMemo } from "react";
import { fetchClient } from "../../utils/apiclient";
import {
	Box,
	Paper,
	Typography,
	Button,
	Chip,
	Stack,
	IconButton,
	Tooltip,
	Grid,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Divider,
	TextField,
	InputAdornment,
	Table,
	TableContainer,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import {
	CheckCircle as ApproveIcon,
	PlayArrow as StartIcon,
	Done as CompleteIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	Search as SearchIcon,
} from "@mui/icons-material";

import { StatsBar } from "./components/statsbar";
import { OrderCard } from "./components/ordercard";
import { OrderDetailsModal } from "./components/orderdetailsmodal";

export interface Part {
	isAvailable: boolean;
	name: string;
	quantity: number;
}

export interface ShipType {
	id: string;
	name: string;
	parts: Part[];
	price: number;
	priceCorp: number;
}

export interface ShipOrder {
	id: number;
	customer: string;
	shipType: ShipType;
	price: number;
	waitTimeDays: number;
	completionDate: string | Date;
	processedParts: Part[];
	status?: "QUEUED" | "COMPLETED";
	ownerType?: "USER" | "GUEST";
	ownerId?: string;
	guestPin?: string;
	notes?: string;
	isOwner?: boolean;
	isAdmin?: boolean;
}

export interface ShipOrdersProps {
	isMobile: boolean;
	processedOrders: ShipOrder[];
	mockRole: "ADMIN" | "USER" | "GUEST";
	onEditOrder: (orderId: string) => void;
	onDeleteOrder: (orderId: number) => void;
	onUpdateStatus: (orderId: number, status: "QUEUED" | "COMPLETED") => void;
	disableActions?: boolean;
	onNavigateToBuilder?: () => void;
}

export const ShipOrders: React.FC<ShipOrdersProps> = ({
	isMobile,
	processedOrders,
	mockRole,
	onEditOrder,
	onDeleteOrder,
	onUpdateStatus,
	disableActions = false,
	onNavigateToBuilder,
}) => {
	const theme = useTheme();
	const isMobileOrTablet = useMediaQuery("(max-width:840px)");
	const isAdmin = mockRole === "ADMIN";
	const isUser = mockRole === "USER";
	const isGuest = mockRole === "GUEST";
	const showActions = !isGuest && !disableActions;

	const [pinInput, setPinInput] = useState("");

	const handlePinUnlock = async () => {
		if (!pinInput.trim()) {
			alert("Please enter a guest PIN");
			return;
		}
		try {
			const res = await fetchClient(
				`v1/corporation/ship-orders/by-pin?corporation_id=COSM&pin=${pinInput}`,
			);
			if (!res.ok) {
				throw new Error("Invalid PIN or order not found");
			}
			const order = await res.json();

			// Save PIN to guest_ship_orders in localStorage
			const guestOrdersSaved = localStorage.getItem("guest_ship_orders");
			const guestOrders = guestOrdersSaved ? JSON.parse(guestOrdersSaved) : [];
			if (
				!guestOrders.some((o: any) => o.id.toString() === order.id.toString())
			) {
				guestOrders.push({ id: order.id.toString(), pin: pinInput });
				localStorage.setItem("guest_ship_orders", JSON.stringify(guestOrders));
			}
			onEditOrder(order.id.toString());
			alert(
				`Order #${order.id.toString().slice(-6)} successfully unlocked and loaded for edit!`,
			);
		} catch (e) {
			alert(e instanceof Error ? e.message : "Error unlocking order");
		}
	};

	// Search & Filter state
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedConfigFilter, setSelectedConfigFilter] =
		useState<string>("all");

	// Modal states
	const [detailsOrder, setDetailsOrder] = useState<ShipOrder | null>(null);
	const [confirmCompleteId, setConfirmCompleteId] = useState<number | null>(
		null,
	);

	// Extract unique configurations for filter chips
	const uniqueConfigs = useMemo(() => {
		const configs = new Set<string>();
		processedOrders.forEach((o) => {
			if (o.shipType && o.shipType.name) {
				configs.add(o.shipType.name);
			}
		});
		return Array.from(configs);
	}, [processedOrders]);

	// Filter and search logic
	const filteredOrders = useMemo(() => {
		return processedOrders
			.filter((order) => {
				const matchesSearch =
					order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
					(order.notes &&
						order.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
					order.id.toString().includes(searchQuery);

				const matchesConfig =
					selectedConfigFilter === "all" ||
					order.shipType.name === selectedConfigFilter;

				return matchesSearch && matchesConfig;
			})
			.sort((a, b) => a.waitTimeDays - b.waitTimeDays);
	}, [processedOrders, searchQuery, selectedConfigFilter]);

	// Statistics based on current filtered orders
	const stats = React.useMemo(() => {
		const total = filteredOrders.length;
		const completed = filteredOrders.filter(
			(o) => o.status === "COMPLETED",
		).length;
		const pending = filteredOrders.filter(
			(o) => o.status === "QUEUED" || !o.status,
		).length;
		const inProduction = filteredOrders.filter(
			(o) => o.status === "IN_PRODUCTION",
		).length;
		const totalValue = filteredOrders.reduce(
			(sum, order) => sum + order.price,
			0,
		);

		return { total, completed, pending, inProduction, totalValue };
	}, [filteredOrders]);

	const getStatusChip = (status?: string) => {
		const currentStatus = status || "QUEUED";
		switch (currentStatus) {
			case "QUEUED":
				return (
					<Chip
						label="Queued"
						color="warning"
						size="small"
						variant="outlined"
						sx={{ height: 20, fontSize: "10px", fontWeight: "bold" }}
					/>
				);
			case "APPROVED":
				return (
					<Chip
						label="Approved"
						color="info"
						size="small"
						variant="outlined"
						sx={{ height: 20, fontSize: "10px", fontWeight: "bold" }}
					/>
				);
			case "IN_PRODUCTION":
				return (
					<Chip
						label="Building"
						color="primary"
						size="small"
						sx={{ height: 20, fontSize: "10px", fontWeight: "bold" }}
					/>
				);
			case "COMPLETED":
				return (
					<Chip
						label="Completed"
						color="success"
						size="small"
						sx={{ height: 20, fontSize: "10px", fontWeight: "bold" }}
					/>
				);
			default:
				return (
					<Chip
						label="Queued"
						color="warning"
						size="small"
						variant="outlined"
						sx={{ height: 20, fontSize: "10px", fontWeight: "bold" }}
					/>
				);
		}
	};

	const handleCompleteClick = (e: React.MouseEvent, orderId: number) => {
		e.stopPropagation();
		setConfirmCompleteId(orderId);
	};

	const handleConfirmComplete = () => {
		if (confirmCompleteId !== null) {
			onUpdateStatus(confirmCompleteId, "COMPLETED");
			setConfirmCompleteId(null);
		}
	};

	const handleEditClick = (e: React.MouseEvent, orderId: number) => {
		e.stopPropagation();
		onEditOrder(orderId.toString());
	};

	const handleDeleteClick = (e: React.MouseEvent, orderId: number) => {
		e.stopPropagation();
		if (window.confirm("Are you sure you want to delete this order?")) {
			onDeleteOrder(orderId);
		}
	};

	return (
		<Box
			sx={{
				width: "100%",
				display: "flex",
				flexDirection: "column",
				gap: 1.2,
				height: "100%",
			}}
		>
			{/* Centered Stats Bar */}
			<StatsBar
				total={stats.total}
				pending={stats.pending}
				inProduction={stats.inProduction}
				totalValue={stats.totalValue}
			/>

			{/* Big Builder Shortcut Button */}
			{onNavigateToBuilder && (
				<Button
					variant="contained"
					onClick={onNavigateToBuilder}
					sx={{
						mx: 0.5,
						mt: 0.5,
						mb: 0.5,
						py: 1.2,
						borderRadius: "12px",
						fontWeight: "bold",
						background: "linear-gradient(135deg, #7b68ee 0%, #6a5acd 100%)",
						boxShadow: "0 4px 15px rgba(123, 104, 238, 0.35)",
						color: "white",
						"&:hover": {
							background: "linear-gradient(135deg, #8a78f0 0%, #7b68ee 100%)",
							boxShadow: "0 6px 20px rgba(123, 104, 238, 0.5)",
						},
						fontSize: "13px",
						textTransform: "none",
					}}
				>
					🚀 Design & Order a New Ship (Open Ship Builder)
				</Button>
			)}

			{/* Search & Filter Controls */}
			<Stack spacing={1} sx={{ px: 0.5, mb: 0.5 }}>
				<TextField
					size="small"
					placeholder="Search by customer name, order code or notes..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon
										sx={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }}
									/>
								</InputAdornment>
							),
							style: {
								fontSize: "11.5px",
								color: "white",
								background: "rgba(255,255,255,0.02)",
							},
						},
					}}
					sx={{
						"& .MuiOutlinedInput-root": {
							"& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
							"&:hover fieldset": { borderColor: "#7b68ee" },
						},
					}}
				/>

				{isGuest && (
					<Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
						<TextField
							size="small"
							placeholder="Enter guest PIN to edit..."
							value={pinInput}
							onChange={(e) => setPinInput(e.target.value)}
							sx={{
								flexGrow: 1,
								"& .MuiOutlinedInput-root": {
									"& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
									"&:hover fieldset": { borderColor: "#7b68ee" },
								},
							}}
							slotProps={{
								input: {
									style: {
										fontSize: "11.5px",
										color: "white",
										background: "rgba(255,255,255,0.02)",
									},
								},
							}}
						/>
						<Button
							variant="contained"
							onClick={handlePinUnlock}
							sx={{
								bgcolor: "#7b68ee",
								color: "white",
								fontWeight: "bold",
								fontSize: "11px",
								textTransform: "none",
								"&:hover": { bgcolor: "#6a5acd" },
							}}
						>
							Edit by PIN
						</Button>
					</Stack>
				)}

				{/* Horizontal Scrollable Filter Chips */}
				<Box
					sx={{
						display: "flex",
						gap: 0.8,
						overflowX: "auto",
						py: 0.4,
						pb: 0.8,
						"&::-webkit-scrollbar": { height: 4 },
					}}
				>
					<Chip
						label="All Configurations"
						size="small"
						onClick={() => setSelectedConfigFilter("all")}
						variant={selectedConfigFilter === "all" ? "filled" : "outlined"}
						sx={{
							fontSize: "10.5px",
							color: "white",
							borderColor: "#7b68ee",
							backgroundColor:
								selectedConfigFilter === "all" ? "#7b68ee" : "transparent",
							"&:hover": {
								backgroundColor:
									selectedConfigFilter === "all"
										? "#6a5acd"
										: "rgba(123, 104, 238, 0.1)",
							},
						}}
					/>
					{uniqueConfigs.map((config) => (
						<Chip
							key={config}
							label={config}
							size="small"
							onClick={() => setSelectedConfigFilter(config)}
							variant={selectedConfigFilter === config ? "filled" : "outlined"}
							sx={{
								fontSize: "10.5px",
								color: "white",
								borderColor: "#7b68ee",
								backgroundColor:
									selectedConfigFilter === config ? "#7b68ee" : "transparent",
								"&:hover": {
									backgroundColor:
										selectedConfigFilter === config
											? "#6a5acd"
											: "rgba(123, 104, 238, 0.1)",
								},
							}}
						/>
					))}
				</Box>
			</Stack>

			{/* Main Orders Content Area */}
			<Box sx={{ flexGrow: 1, overflowY: "auto", px: 0.5, py: 0.5 }}>
				{filteredOrders.length === 0 ? (
					<Typography
						variant="body1"
						color="rgba(255,255,255,0.4)"
						align="center"
						sx={{ py: 6, fontSize: "13px" }}
					>
						No matching orders found.
					</Typography>
				) : isMobileOrTablet ? (
					/* Mobile 100% Card Layout */
					<Grid container spacing={1.5} justifyContent="center">
						{filteredOrders.map((order) => (
							<Grid
								item
								xs={12}
								sm={6}
								md={4}
								key={order.id}
								sx={{ width: "100%" }}
							>
								<OrderCard
									order={order}
									isAdmin={isAdmin}
									isUser={isUser}
									isGuest={isGuest}
									onDetailsClick={setDetailsOrder}
									onCompleteClick={handleCompleteClick}
									onEditClick={handleEditClick}
									onDeleteClick={handleDeleteClick}
									getStatusChip={getStatusChip}
									disableActions={disableActions}
								/>
							</Grid>
						))}
					</Grid>
				) : (
					/* Desktop & Tablet Table Layout */
					<TableContainer
						sx={{
							background: "rgba(30, 29, 45, 0.4)",
							backdropFilter: "blur(12px)",
							borderRadius: "12px",
							border: "1px solid rgba(255,255,255,0.08)",
						}}
					>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell sx={headerStyle}>ID</TableCell>
									<TableCell sx={headerStyle}>Customer</TableCell>
									<TableCell sx={headerStyle}>Ship Configuration</TableCell>
									<TableCell sx={headerStyle}>Price</TableCell>
									<TableCell sx={headerStyle}>Wait Time</TableCell>
									<TableCell sx={headerStyle}>Status</TableCell>
									{showActions && (
										<TableCell sx={headerStyle}>Actions</TableCell>
									)}
								</TableRow>
							</TableHead>
							<TableBody>
								{filteredOrders.map((order) => {
									const isOwner = isAdmin || order.isOwner || order.isAdmin;

									return (
										<TableRow
											key={order.id}
											onClick={() => setDetailsOrder(order)}
											sx={{
												cursor: "pointer",
												"&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
												transition: "background-color 0.15s ease",
											}}
										>
											<TableCell
												sx={{
													color: "white",
													fontWeight: "bold",
													fontSize: "12.5px",
												}}
											>
												#{order.id.toString().slice(-6)}
											</TableCell>
											<TableCell
												sx={{
													color: "white",
													fontSize: "12.5px",
													fontWeight: "medium",
												}}
											>
												{order.customer}
											</TableCell>
											<TableCell sx={{ color: "white" }}>
												<Typography
													variant="body2"
													fontWeight="bold"
													sx={{ fontSize: "12.5px" }}
												>
													{order.shipType.name}
												</Typography>
												{order.notes && (
													<Typography
														variant="caption"
														sx={{
															color: "rgba(255,255,255,0.5)",
															fontSize: "10.5px",
														}}
													>
														Note: {order.notes}
													</Typography>
												)}
											</TableCell>
											<TableCell
												sx={{
													color: "#4caf50",
													fontWeight: "bold",
													fontSize: "12.5px",
												}}
											>
												${order.price.toLocaleString()}
											</TableCell>
											<TableCell sx={{ color: "white", fontSize: "12.5px" }}>
												{order.waitTimeDays} days
											</TableCell>
											<TableCell>{getStatusChip(order.status)}</TableCell>
											{showActions && (
												<TableCell onClick={(e) => e.stopPropagation()}>
													<Stack direction="row" spacing={0.5}>
														{isAdmin && order.status !== "COMPLETED" && (
															<Tooltip title="Complete Order">
																<IconButton
																	color="success"
																	size="small"
																	onClick={(e) =>
																		handleCompleteClick(e, order.id)
																	}
																>
																	<CompleteIcon fontSize="small" />
																</IconButton>
															</Tooltip>
														)}

														{isOwner && (
															<>
																<Tooltip title="Edit Config">
																	<IconButton
																		color="warning"
																		size="small"
																		onClick={(e) =>
																			handleEditClick(e, order.id)
																		}
																	>
																		<EditIcon fontSize="small" />
																	</IconButton>
																</Tooltip>

																<Tooltip title="Delete Order">
																	<IconButton
																		color="error"
																		size="small"
																		onClick={(e) =>
																			handleDeleteClick(e, order.id)
																		}
																	>
																		<DeleteIcon fontSize="small" />
																	</IconButton>
																</Tooltip>
															</>
														)}
													</Stack>
												</TableCell>
											)}
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Box>

			{/* Detailed Specifications Modal */}
			<OrderDetailsModal
				order={detailsOrder}
				onClose={() => setDetailsOrder(null)}
				getStatusChip={getStatusChip}
			/>

			{/* Order Completion Confirmation Dialog */}
			<Dialog
				open={confirmCompleteId !== null}
				onClose={() => setConfirmCompleteId(null)}
				slotProps={{
					paper: {
						sx: {
							background: "#191823",
							color: "white",
							borderRadius: "16px",
							border: "1px solid rgba(255,255,255,0.08)",
							minWidth: 280,
						},
					},
				}}
			>
				<DialogTitle sx={{ fontWeight: "bold", fontSize: "15px" }}>
					Complete Ship Order
				</DialogTitle>
				<DialogContent>
					<Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
						Are you sure you want to mark this ship order as completed? This
						will set its status to Completed.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setConfirmCompleteId(null)}
						sx={{ color: "white", fontSize: "12px" }}
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmComplete}
						sx={{ color: "#7b68ee", fontWeight: "bold", fontSize: "12px" }}
					>
						Confirm Complete
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

const headerStyle = {
	fontWeight: "bold",
	p: 1.2,
	borderBottom: "1px solid rgba(255,255,255,0.08)",
	backgroundColor: "#1c1b27",
	color: "#7B68EE",
	textAlign: "left",
};
