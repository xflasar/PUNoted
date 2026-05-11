import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Chip,
	IconButton,
	Tooltip,
	ToggleButtonGroup,
	ToggleButton,
	Stack,
	TextField,
	Button,
	Card,
	CardContent,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";

// --- Types ---
enum OrderStatus {
	PENDING_APPROVAL = "PENDING_APPROVAL",
	APPROVED = "APPROVED",
	IN_PRODUCTION = "IN_PRODUCTION",
	COMPLETED = "COMPLETED",
}

interface Order {
	id: string;
	config: { shipType: string; engine: string; weapon: string };
	status: OrderStatus;
	ownerType: "USER" | "GUEST";
	ownerId?: string;
	guestPin?: string;
	createdAt: string;
}

export default function ShipProductionDashboard() {
	// Application State
	const [allOrders, setAllOrders] = useState<Order[]>([]);
	const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);

	// Dev Mock State
	const [mockRole, setMockRole] = useState<"ADMIN" | "USER" | "GUEST">("ADMIN");
	const [guestPinInput, setGuestPinInput] = useState("");
	const [guestError, setGuestError] = useState("");

	const MOCK_USER_ID = "USR-999"; // Matches the ID used in OrderBuilder

	// 1. Load Data on Mount
	useEffect(() => {
		const loadOrders = () => {
			const saved = localStorage.getItem("mock_ship_orders");
			if (saved) {
				setAllOrders(JSON.parse(saved));
			}
		};
		loadOrders();

		// Listen for custom event if testing in same browser window without refresh
		window.addEventListener("storage", loadOrders);
		return () => window.removeEventListener("storage", loadOrders);
	}, []);

	// 2. Filter Data based on Role
	useEffect(() => {
		if (mockRole === "ADMIN") {
			setDisplayedOrders(allOrders); // Admins see everything
		} else if (mockRole === "USER") {
			setDisplayedOrders(allOrders.filter((o) => o.ownerId === MOCK_USER_ID)); // Users see only their orders
		} else if (mockRole === "GUEST") {
			setDisplayedOrders([]); // Guests start with empty view until PIN is entered
			setGuestPinInput("");
			setGuestError("");
		}
	}, [mockRole, allOrders]);

	// 3. Guest Tracking Logic
	const handleGuestSearch = () => {
		const foundOrder = allOrders.find(
			(o) => o.guestPin === guestPinInput && o.ownerType === "GUEST",
		);
		if (foundOrder) {
			setDisplayedOrders([foundOrder]);
			setGuestError("");
		} else {
			setDisplayedOrders([]);
			setGuestError("Invalid PIN or Order not found.");
		}
	};

	// 4. Admin Action Logic
	const handleApprove = (id: string) => {
		const updatedOrders = allOrders.map((order) =>
			order.id === id ? { ...order, status: OrderStatus.APPROVED } : order,
		);
		setAllOrders(updatedOrders);
		localStorage.setItem("mock_ship_orders", JSON.stringify(updatedOrders));
	};

	// --- UI Helpers ---
	const getStatusChip = (status: OrderStatus) => {
		switch (status) {
			case OrderStatus.PENDING_APPROVAL:
				return <Chip label="Needs Approval" color="warning" size="small" />;
			case OrderStatus.APPROVED:
				return <Chip label="Approved / Queued" color="info" size="small" />;
			case OrderStatus.IN_PRODUCTION:
				return <Chip label="Building..." color="primary" size="small" />;
			case OrderStatus.COMPLETED:
				return <Chip label="Completed" color="success" size="small" />;
			default:
				return <Chip label="Unknown" size="small" />;
		}
	};

	return (
		<Box sx={{ maxWidth: 1200, mx: "auto", mt: 4, p: 2 }}>
			{/* DEV TOOLS: Toggle Perspectives */}
			<Box
				sx={{
					mb: 4,
					display: "flex",
					alignItems: "center",
					gap: 2,
					p: 2,
					bgcolor: "background.paper",
					borderRadius: 1,
				}}
			>
				<Typography variant="body2" color="text.secondary" fontWeight="bold">
					DEV: View Dashboard As:
				</Typography>
				<ToggleButtonGroup
					color="primary"
					value={mockRole}
					exclusive
					onChange={(_, newRole) => newRole && setMockRole(newRole)}
					size="small"
				>
					<ToggleButton value="ADMIN">Administrator</ToggleButton>
					<ToggleButton value="USER">Logged In User</ToggleButton>
					<ToggleButton value="GUEST">Guest Tracker</ToggleButton>
				</ToggleButtonGroup>
			</Box>

			{/* Header */}
			<Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
				{mockRole === "GUEST" ? "Track Your Order" : "Ship Production Facility"}
			</Typography>

			{/* Guest PIN Input View */}
			{mockRole === "GUEST" && displayedOrders.length === 0 && (
				<Card elevation={3} sx={{ maxWidth: 500, mb: 4 }}>
					<CardContent>
						<Typography variant="body1" sx={{ mb: 2 }}>
							Enter the Tracking PIN you received during checkout to view your
							order status.
						</Typography>
						<Stack direction="row" spacing={2}>
							<TextField
								size="small"
								label="Tracking PIN"
								variant="outlined"
								fullWidth
								value={guestPinInput}
								onChange={(e) => setGuestPinInput(e.target.value)}
								error={!!guestError}
								helperText={guestError}
							/>
							<Button
								variant="contained"
								startIcon={<SearchIcon />}
								onClick={handleGuestSearch}
								sx={{ minWidth: 120 }}
							>
								Track
							</Button>
						</Stack>
					</CardContent>
				</Card>
			)}

			{/* Main Data Table */}
			{(displayedOrders.length > 0 || mockRole !== "GUEST") && (
				<TableContainer component={Paper} elevation={3}>
					<Table sx={{ minWidth: 650 }}>
						<TableHead sx={{ bgcolor: "grey.900" }}>
							<TableRow>
								<TableCell>Order ID</TableCell>
								{mockRole === "ADMIN" && <TableCell>Owner Type</TableCell>}
								<TableCell>Configuration</TableCell>
								<TableCell>Status</TableCell>
								<TableCell>Date Placed</TableCell>
								<TableCell align="right">Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{displayedOrders.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} align="center" sx={{ py: 4 }}>
										<Typography color="text.secondary">
											No active orders found.
										</Typography>
									</TableCell>
								</TableRow>
							) : (
								displayedOrders.map((order) => (
									<TableRow
										key={order.id}
										sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
									>
										<TableCell sx={{ fontWeight: "bold" }}>
											{order.id}
										</TableCell>

										{mockRole === "ADMIN" && (
											<TableCell>
												<Chip
													label={order.ownerType}
													size="small"
													variant="outlined"
												/>
											</TableCell>
										)}

										<TableCell>
											<Typography variant="body2" fontWeight="bold">
												{order.config.shipType}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{order.config.engine} • {order.config.weapon}
											</Typography>
										</TableCell>

										<TableCell>{getStatusChip(order.status)}</TableCell>

										<TableCell>
											<Typography variant="body2">
												{new Date(order.createdAt).toLocaleDateString()}
											</Typography>
										</TableCell>

										<TableCell align="right">
											{/* Admin View Actions */}
											{mockRole === "ADMIN" &&
											order.status === OrderStatus.PENDING_APPROVAL ? (
												<Tooltip title="Approve Custom Build">
													<IconButton
														color="success"
														onClick={() => handleApprove(order.id)}
													>
														<CheckCircleIcon />
													</IconButton>
												</Tooltip>
											) : (
												/* User/Guest/Admin general action */
												<Tooltip title="Manage Order Details">
													<IconButton>
														<EditIcon />
													</IconButton>
												</Tooltip>
											)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Box>
	);
}
