import React, { useState, useEffect, useRef, useMemo } from "react";
import {
	Box,
	Typography,
	IconButton,
	Paper,
	Divider,
	Chip,
	Collapse,
	ButtonBase,
	Stack,
} from "@mui/material";
import {
	Close,
	GpsFixed,
	LocalShipping,
	FlightTakeoff,
	FlightLand,
	Map,
	WarningAmber,
	CheckCircle,
	Inventory,
	AttachMoney,
	Warehouse,
	Place,
	ArrowDownward,
	KeyboardArrowDown,
	KeyboardArrowUp,
	ShoppingCart,
	ExitToApp,
} from "@mui/icons-material";
import { useTheme, alpha } from "@mui/material/styles";
import type { ShipmentContract, ShipmentShip, ShipmentItem } from "../types";

export interface LocationFocusTarget {
	type: "SHIP" | "SYSTEM" | "STATION" | "PLANET";
	id: string;
	systemId?: string;
}

interface Props {
	contract: ShipmentContract;
	ships: Record<string, ShipmentShip>;
	onClose: () => void;
	onFocusLocation: (target: LocationFocusTarget) => void;
}

// --- HELPER: TIME FORMATTER ---
// Pure JS function for use inside Animation Loop (No React overhead)
const formatRemainingTime = (ms: number): string => {
	if (ms <= 0) return "ARRIVED";

	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);
	const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
	const days = Math.floor(ms / (1000 * 60 * 60 * 24));

	if (days > 0) return `${days}d ${hours}h`;
	if (hours > 0) return `${hours}h ${minutes}m`;
	if (minutes > 0) return `${minutes}min ${seconds}s`;
	return `${seconds}s`;
};

// --- ZERO-CPU FLIGHT BAR WITH ETA ---
const OptimizedFlightProgressBar = React.memo(
	({
		startTime,
		endTime,
		color,
	}: {
		startTime: number;
		endTime: number;
		color: string;
	}) => {
		const barRef = useRef<HTMLDivElement>(null);
		const labelRef = useRef<HTMLSpanElement>(null); // Ref for text update
		const reqRef = useRef<number>(0);

		useEffect(() => {
			const start = new Date(startTime).getTime();
			const end = new Date(endTime).getTime();
			const animate = () => {
				const now = Date.now();
				const total = end - start;
				const elapsed = now - start;
				const remaining = end - now;

				// 1. Update Bar Width
				let percent = (elapsed / total) * 100;
				if (percent < 0) percent = 0;
				if (percent > 100) percent = 100;

				if (barRef.current)
					barRef.current.style.transform = `scaleX(${percent / 100})`;

				// 2. Update ETA Text (Direct DOM, No Re-render)
				if (labelRef.current) {
					if (remaining <= 0) {
						labelRef.current.innerText = "ARRIVED";
					} else {
						labelRef.current.innerText = formatRemainingTime(remaining);
					}
				}

				if (percent < 100) reqRef.current = requestAnimationFrame(animate);
			};

			reqRef.current = requestAnimationFrame(animate);
			return () => {
				if (reqRef.current) cancelAnimationFrame(reqRef.current);
			};
		}, [startTime, endTime]);

		return (
			<Box sx={{ width: "100%", mt: 0.5 }}>
				{/* Progress Track */}
				<Box
					sx={{
						height: 3,
						bgcolor: alpha("#fff", 0.1),
						borderRadius: 1.5,
						overflow: "hidden",
						position: "relative",
					}}
				>
					<div
						ref={barRef}
						style={{
							height: "100%",
							width: "100%",
							backgroundColor: color,
							transformOrigin: "left",
							transform: "scaleX(0)",
							willChange: "transform",
							boxShadow: `0 0 6px ${color}`,
						}}
					/>
				</Box>

				{/* ETA Label */}
				<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.2 }}>
					<Typography
						variant="caption"
						sx={{
							color: alpha(color, 0.7),
							fontSize: "0.75rem",
							fontWeight: 700,
							letterSpacing: 0.5,
						}}
					>
						ETA:{" "}
						<span
							ref={labelRef}
							style={{ fontFamily: "monospace", color: color }}
						>
							--
						</span>
					</Typography>
				</Box>
			</Box>
		);
	},
	(prev, next) =>
		prev.startTime === next.startTime && prev.endTime === next.endTime,
);

// --- COMPONENT: FLOW STEP ROW ---
const FlowStep = ({
	icon: Icon,
	label,
	subLabel,
	isDone,
	isLast,
	extraContent,
	color,
}: {
	icon: any;
	label: string;
	subLabel?: string;
	isDone: boolean;
	isLast?: boolean;
	extraContent?: React.ReactNode;
	color: string;
}) => {
	const theme = useTheme();
	const lineColor = isDone
		? theme.palette.success.main
		: alpha(theme.palette.divider, 0.1);

	return (
		<Box sx={{ display: "flex", position: "relative" }}>
			{/* Timeline Line */}
			{!isLast && (
				<Box
					sx={{
						position: "absolute",
						left: 9,
						top: 20,
						bottom: -4,
						width: 2,
						bgcolor: lineColor,
						opacity: 0.5,
						zIndex: 0,
					}}
				/>
			)}

			{/* Icon Bubble */}
			<Box
				sx={{
					width: 20,
					height: 20,
					borderRadius: "50%",
					bgcolor: isDone
						? theme.palette.success.main
						: color === "blue"
							? theme.palette.primary.main
							: alpha(theme.palette.background.default, 0.5),
					border: `1px solid ${isDone ? theme.palette.success.main : alpha(theme.palette.text.disabled, 0.3)}`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					zIndex: 1,
					mr: 1.5,
					flexShrink: 0,
					mt: 0.5,
				}}
			>
				<Icon
					sx={{
						fontSize: 12,
						color: isDone ? "#fff" : theme.palette.text.disabled,
					}}
				/>
			</Box>

			{/* Content */}
			<Box sx={{ flex: 1, pb: 2 }}>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
					}}
				>
					<Box>
						<Typography
							variant="caption"
							sx={{
								fontWeight: 700,
								color: isDone
									? theme.palette.text.primary
									: theme.palette.text.secondary,
								fontSize: "0.7rem",
							}}
						>
							{label}
						</Typography>
						{subLabel && (
							<Typography
								variant="caption"
								sx={{
									display: "block",
									color: theme.palette.text.disabled,
									fontSize: "0.65rem",
									lineHeight: 1.1,
								}}
							>
								{subLabel}
							</Typography>
						)}
					</Box>
					{isDone && (
						<CheckCircle
							sx={{ fontSize: 14, color: theme.palette.success.main }}
						/>
					)}
				</Box>
				{extraContent && <Box sx={{ mt: 1 }}>{extraContent}</Box>}
			</Box>
		</Box>
	);
};

// --- COMPONENT: PACKAGE CARD ---
const PackageCard = ({
	item,
	relatedItems,
	ships,
	onFocusLocation,
	statusColor,
}: {
	item: ShipmentItem;
	relatedItems: ShipmentItem[];
	ships: Record<string, ShipmentShip>;
	onFocusLocation: (t: LocationFocusTarget) => void;
	statusColor: string;
}) => {
	const theme = useTheme();
	const [expanded, setExpanded] = useState(false); // Default collapsed

	// 1. Data Parsing
	const provisionStep = relatedItems.find(
		(i) => i.type === "PROVISION_SHIPMENT",
	);
	const pickupStep = relatedItems.find((i) => i.type === "PICKUP_SHIPMENT");

	const isProvisionDone = provisionStep
		? provisionStep.status === "FULFILLED"
		: true;
	const isPickupDone = pickupStep ? pickupStep.status === "FULFILLED" : true;
	const isDeliveryDone = item.status === "FULFILLED";

	// 2. Ship Logic
	const assignedShip = item.shipid ? ships[item.shipid] : null;
	const flight = assignedShip?.flight;
	const destinationStatus =
		flight?.destination === item.target_name ? "MATCH" : "MISMATCH";

	// 3. Dynamic Styles
	const borderColor = isDeliveryDone
		? theme.palette.success.main
		: expanded
			? statusColor
			: alpha(theme.palette.divider, 0.1);
	const bgGradient = isDeliveryDone
		? `linear-gradient(90deg, ${alpha(theme.palette.success.main, 0.15)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`
		: `linear-gradient(90deg, ${alpha(statusColor, 0.1)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`;

	return (
		<Box
			sx={{
				mb: 1,
				borderRadius: 2,
				overflow: "hidden",
				border: `1px solid ${alpha(borderColor, 0.3)}`,
				bgcolor: alpha(theme.palette.background.default, 0.4),
				transition: "all 0.2s ease-in-out",
				"&:hover": { borderColor: alpha(borderColor, 0.6) },
			}}
		>
			{/* HEADER (Always Visible) */}
			<ButtonBase
				onClick={() => setExpanded(!expanded)}
				sx={{
					width: "100%",
					p: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					background: bgGradient,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					<Box
						sx={{
							width: 28,
							height: 28,
							borderRadius: 1,
							bgcolor: alpha(theme.palette.background.default, 0.5),
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: isDeliveryDone
								? theme.palette.success.main
								: theme.palette.text.primary,
						}}
					>
						<Inventory sx={{ fontSize: 16 }} />
					</Box>
					<Box sx={{ textAlign: "left" }}>
						<Typography
							variant="caption"
							sx={{ color: theme.palette.text.secondary, fontSize: "0.65rem" }}
						>
							Package{" "}
							{isDeliveryDone ? "DELIVERED" : `to: ${item.destination_label}`}
						</Typography>
					</Box>
				</Box>

				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Box sx={{ display: "flex", gap: 0.5 }}>
						{[isProvisionDone, isPickupDone, isDeliveryDone].map(
							(done, idx) => (
								<Box
									key={idx}
									sx={{
										width: 6,
										height: 6,
										borderRadius: "50%",
										bgcolor: done
											? theme.palette.success.main
											: alpha(theme.palette.text.disabled, 0.3),
									}}
								/>
							),
						)}
					</Box>
					{expanded ? (
						<KeyboardArrowUp
							sx={{ fontSize: 16, color: theme.palette.text.disabled }}
						/>
					) : (
						<KeyboardArrowDown
							sx={{ fontSize: 16, color: theme.palette.text.disabled }}
						/>
					)}
				</Box>
			</ButtonBase>

			{/* EXPANDABLE FLOW DETAILS */}
			<Collapse in={expanded}>
				<Box
					sx={{
						p: 1.5,
						pt: 1,
						bgcolor: alpha(theme.palette.common.black, 0.2),
					}}
				>
					{provisionStep && (
						<FlowStep
							icon={ShoppingCart}
							label="PROVISION"
							isDone={isProvisionDone}
							color={statusColor}
						/>
					)}

					<FlowStep
						icon={ExitToApp}
						label="PICKUP"
						subLabel={provisionStep ? provisionStep.origin_label : "Origin"}
						isDone={isPickupDone}
						color={statusColor}
					/>

					<FlowStep
						icon={LocalShipping}
						label="TRANSIT"
						isDone={isDeliveryDone}
						color={"blue"}
						extraContent={
							!isDeliveryDone && isPickupDone ? (
								assignedShip ? (
									<Box
										sx={{
											p: 1,
											borderRadius: 1,
											bgcolor: alpha(theme.palette.background.default, 0.1),
											border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
										}}
									>
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												mb: 0.5,
											}}
										>
											<Typography
												variant="caption"
												sx={{ fontWeight: 700, color: statusColor }}
											>
												{assignedShip.name}
											</Typography>
											<IconButton
												size="small"
												onClick={() =>
													onFocusLocation({ type: "SHIP", id: assignedShip.id })
												}
												sx={{ p: 0.2 }}
											>
												<GpsFixed
													sx={{
														fontSize: 12,
														color: theme.palette.text.secondary,
													}}
												/>
											</IconButton>
										</Box>

										{assignedShip.flight ? (
											<>
												<Box
													sx={{
														display: "flex",
														justifyContent: "space-between",
														fontSize: "0.6rem",
														color: theme.palette.text.disabled,
													}}
												>
													<Box sx={{ display: "flex", gap: 0.5 }}>
														<FlightTakeoff sx={{ fontSize: 10 }} />{" "}
														{assignedShip.flight.originplanetid
															? assignedShip.flight.originplanetid
															: assignedShip.flight.originstationid}{" "}
														({assignedShip.flight.originsystemid})
													</Box>
													<Box sx={{ display: "flex", gap: 0.5 }}>
														{assignedShip.flight.destinationplanetid
															? assignedShip.flight.destinationplanetid
															: assignedShip.flight.destinationstationid}{" "}
														({assignedShip.flight.destinationsystemid}){" "}
														<FlightLand sx={{ fontSize: 10 }} />
													</Box>
												</Box>

												<OptimizedFlightProgressBar
													startTime={assignedShip.flight.arrivaltimestamp}
													endTime={assignedShip.flight.departuretimestamp}
													color={theme.palette.primary.main}
												/>

												{destinationStatus === "MISMATCH" && (
													<Stack
														direction="row"
														alignItems="center"
														spacing={0.5}
														sx={{ mt: 0.5 }}
													>
														<WarningAmber
															sx={{
																fontSize: 10,
																color: theme.palette.warning.main,
															}}
														/>
														<Typography
															variant="caption"
															sx={{
																fontSize: "0.6rem",
																color: theme.palette.warning.main,
															}}
														>
															Stopover:{" "}
															{assignedShip.flight.destinationplanetid
																? assignedShip.flight.destinationplanetid
																: assignedShip.flight.destinationstationid}{" "}
															({assignedShip.flight.destinationsystemid})
														</Typography>
													</Stack>
												)}
											</>
										) : (
											<Typography
												variant="caption"
												sx={{
													fontStyle: "italic",
													color: theme.palette.text.disabled,
												}}
											>
												Docked ({assignedShip.docked_label})
											</Typography>
										)}
									</Box>
								) : (
									<Typography
										variant="caption"
										sx={{ color: theme.palette.warning.main }}
									>
										Waiting for Carrier Assignment
									</Typography>
								)
							) : null
						}
					/>

					<FlowStep
						icon={Place}
						label="DELIVERY"
						subLabel={item.destination_label}
						isDone={isDeliveryDone}
						isLast={true}
						color={statusColor}
					/>
				</Box>
			</Collapse>
		</Box>
	);
};

// --- MAIN WIDGET ---
export const ShipmentDetailWidget: React.FC<Props> = ({
	contract,
	ships,
	onClose,
	onFocusLocation,
}) => {
	const theme = useTheme();

	// 1. Setup
	const isCarrier = (contract as any).role === "CARRIER";
	const statusColor = isCarrier
		? theme.palette.primary.main
		: theme.palette.secondary.main;

	// 2. Data Grouping
	const deliveryItems = useMemo(
		() =>
			contract.items.filter(
				(i) => i.type === "DELIVERY" || i.type === "DELIVERY_SHIPMENT",
			),
		[contract.items],
	);
	const paymentItems = useMemo(
		() => contract.items.filter((i) => i.type === "PAYMENT"),
		[contract.items],
	);

	// 3. Financials
	const { totalPayout, paymentStatus } = useMemo(() => {
		const total = paymentItems.reduce((sum, item) => sum + item.price, 0);
		const fulfilledCount = paymentItems.filter(
			(i) => i.status === "FULFILLED",
		).length;
		let status = "PENDING";
		if (paymentItems.length > 0) {
			if (fulfilledCount === paymentItems.length) status = "PAID";
			else if (fulfilledCount > 0) status = "PARTIAL";
		} else if ((contract as any).payout) {
			status = (contract as any).payment_status || "PENDING";
		}
		return {
			totalPayout: total || (contract as any).payout || 0,
			paymentStatus: status,
		};
	}, [paymentItems, contract]);

	return (
		<Paper
			elevation={24}
			sx={{
				position: "absolute",
				top: "10vh",
				right: 20,
				width: 340,
				bgcolor: alpha(theme.palette.background.default, 0.8),
				backdropFilter: "blur(24px) saturate(180%)",
				border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
				borderTop: `2px solid ${statusColor}`,
				borderRadius: 3,
				boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
				overflow: "hidden",
				zIndex: 100,
				display: "flex",
				flexDirection: "column",
				maxHeight: "70vh",
			}}
		>
			{/* HEADER */}
			<Box
				sx={{
					px: 2,
					py: 1.5,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					background: `linear-gradient(180deg, ${alpha(statusColor, 0.15)} 0%, ${alpha(theme.palette.background.default, 0.6)} 100%)`,
				}}
			>
				<Box>
					<Typography
						variant="overline"
						sx={{
							color: statusColor,
							fontWeight: 900,
							letterSpacing: 1,
							lineHeight: 1,
							fontSize: "0.65rem",
						}}
					>
						{isCarrier ? "OUTBOUND SHIPMENT" : "INBOUND SHIPMENT"}
					</Typography>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Typography
							variant="h6"
							sx={{
								fontFamily: "monospace",
								fontWeight: 700,
								color: theme.palette.text.primary,
								lineHeight: 1,
								letterSpacing: -0.5,
							}}
						>
							#{contract.local_id}
						</Typography>
						<Chip
							label={contract.status}
							size="small"
							sx={{
								height: 18,
								fontSize: "0.6rem",
								fontWeight: 800,
								bgcolor: alpha(statusColor, 0.2),
								color: statusColor,
								border: "none",
							}}
						/>
					</Box>
				</Box>
				<IconButton
					size="small"
					onClick={onClose}
					sx={{
						color: theme.palette.text.secondary,
						bgcolor: alpha(theme.palette.background.default, 0.2),
						"&:hover": { color: "#fff", bgcolor: theme.palette.error.main },
					}}
				>
					<Close fontSize="small" />
				</IconButton>
			</Box>

			<Divider sx={{ borderColor: alpha(theme.palette.divider, 0.05) }} />

			{/* BODY */}
			<Box
				sx={{
					p: 1.5,
					overflowY: "auto",
					flex: 1,
					bgcolor: alpha(theme.palette.background.default, 0.7),
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 1,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: theme.palette.text.disabled,
							fontWeight: 700,
							fontSize: "0.65rem",
							letterSpacing: 1,
						}}
					>
						CARGO MANIFEST
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: theme.palette.text.disabled }}
					>
						{deliveryItems.length} PACKAGE
						{deliveryItems.length !== 1 ? "S" : ""}
					</Typography>
				</Box>

				{deliveryItems.length > 0 ? (
					deliveryItems.map((item, i) => (
						<PackageCard
							key={i}
							item={item}
							relatedItems={contract.items.filter(
								(r) =>
									r.material_ticker === item.material_ticker &&
									r.type !== "DELIVERY" &&
									r.type !== "DELIVERY_SHIPMENT",
							)}
							ships={ships}
							onFocusLocation={onFocusLocation}
							statusColor={statusColor}
						/>
					))
				) : (
					<Box
						sx={{
							p: 2,
							textAlign: "center",
							border: `1px dashed ${theme.palette.divider}`,
							borderRadius: 2,
						}}
					>
						<Typography variant="caption" color="text.secondary">
							No physical cargo.
						</Typography>
					</Box>
				)}
			</Box>

			{/* FOOTER */}
			<Box
				sx={{
					px: 2,
					py: 1.5,
					bgcolor: alpha(theme.palette.background.default, 0.8),
					borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
					backdropFilter: "blur(10px)",
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
						<Box
							sx={{
								p: 0.8,
								borderRadius: 1.5,
								bgcolor: alpha(theme.palette.warning.main, 0.15),
								color: theme.palette.warning.main,
								display: "flex",
							}}
						>
							<AttachMoney sx={{ fontSize: 18 }} />
						</Box>
						<Box>
							<Typography
								variant="caption"
								sx={{
									display: "block",
									color: theme.palette.text.secondary,
									lineHeight: 1,
									fontSize: "0.6rem",
									fontWeight: 700,
									mb: 0.2,
								}}
							>
								TOTAL PAYOUT
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 800,
									color: theme.palette.text.primary,
									lineHeight: 1,
								}}
							>
								{totalPayout.toLocaleString()}{" "}
								<span
									style={{
										fontSize: "0.8em",
										color: theme.palette.warning.main,
									}}
								>
									AIC
								</span>
							</Typography>
						</Box>
					</Box>

					<Chip
						label={paymentStatus}
						size="small"
						variant={paymentStatus === "PAID" ? "filled" : "outlined"}
						color={
							paymentStatus === "PAID"
								? "success"
								: paymentStatus === "PARTIAL"
									? "warning"
									: "default"
						}
						sx={{
							fontWeight: 800,
							fontSize: "0.65rem",
							borderRadius: 1,
							height: 22,
							borderColor: alpha(theme.palette.divider, 0.3),
						}}
					/>
				</Box>
			</Box>
		</Paper>
	);
};
