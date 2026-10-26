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
	Tooltip,
	useMediaQuery,
} from "@mui/material";
import {
	Close,
	GpsFixed,
	LocalShipping,
	FlightTakeoff,
	FlightLand,
	WarningAmber,
	CheckCircle,
	Inventory,
	AttachMoney,
	Warehouse,
	Place,
	ExpandLess,
	ExpandMore,
	ShoppingCart,
	ExitToApp,
	Handshake,
	AccessTime,
	Refresh,
} from "@mui/icons-material";
import { useTheme, alpha } from "@mui/material/styles";
import { formatDistanceToNowStrict, isBefore } from "date-fns";
import type { ShipmentContract, ShipmentShip, ShipmentItem } from "../types";

import {
	parseFlightTimestamp,
	getFlightArrivalMs,
} from "../../../components/common/starmap/utils/timestamputils";

export interface LocationFocusTarget {
	type: "SHIP" | "SYSTEM" | "STATION" | "PLANET";
	id: string;
	systemId?: string;
	nonce?: number;
}

interface Props {
	contract: ShipmentContract;
	ships: Record<string, ShipmentShip>;
	onClose: () => void;
	onFocusLocation: (target: LocationFocusTarget) => void;
	onRefresh?: () => void;
	isRefreshing?: boolean;
}

// --- HELPER: TIME FORMATTER ---
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

// --- HELPER: EXPECTED DELIVERY LOGIC ---
export interface ExpectedDeliveryInfo {
	label: string;
	detail?: string;
	state: "DELIVERED" | "SOON" | "IN_FLIGHT" | "DEADLINE" | "PENDING_PICKUP" | "UNKNOWN";
	colorType: "success" | "warning" | "info" | "primary" | "default";
	arrivalMs?: number;
}

const cleanLocation = (s?: string | null): string => {
	if (!s) return "";
	return s.toLowerCase().replace(/[^a-z0-9]/g, "");
};

/**
 * Checks whether the package is at the destination:
 * 1) Ship is docked at destination (or completed flight arriving at destination)
 * 2) Package has been unloaded/stored in warehouse/station/site at destination
 */
export const checkIsAtDestination = (
	item: ShipmentItem,
	assignedShip: ShipmentShip | null,
	isPickupDone: boolean,
): boolean => {
	if (!isPickupDone) return false;
	if (item.status === "FULFILLED") return true;

	const destLabel = item.destination_label || item.target_name || "";
	const cleanDest = cleanLocation(destLabel);
	if (!cleanDest) return false;

	// 1. If assigned ship is docked (or completed flight)
	if (assignedShip) {
		const flight = assignedShip.flight;
		const flightArrivalMs = flight ? getFlightArrivalMs(flight) : 0;
		const isFlying = flightArrivalMs > Date.now();

		if (!isFlying) {
			// Check ship docked label
			if (assignedShip.docked_label) {
				const cleanDocked = cleanLocation(assignedShip.docked_label);
				if (
					cleanDocked &&
					(cleanDest.includes(cleanDocked) || cleanDocked.includes(cleanDest))
				) {
					return true;
				}
			}

			// Check flight destination when flight has concluded
			if (flight) {
				const flightDest =
					flight.destinationstationid ||
					flight.destinationplanetid ||
					flight.destinationsystemid ||
					flight.destination;
				if (flightDest) {
					const cleanFlightDest = cleanLocation(flightDest);
					if (
						cleanFlightDest &&
						(cleanDest.includes(cleanFlightDest) || cleanFlightDest.includes(cleanDest))
					) {
						return true;
					}
				}
			}
		}
	}

	// 2. If package was transferred into storage at destination (e.g. location_type !== 'SHIP')
	if (item.location_type !== "SHIP" && item.location_name) {
		const cleanLocName = cleanLocation(item.location_name);
		const cleanSysName = cleanLocation(item.system_name);
		const cleanOrigin = cleanLocation(item.origin_label);

		// If it's still at origin, it is not at destination
		if (cleanOrigin && (cleanOrigin.includes(cleanLocName) || cleanLocName.includes(cleanOrigin))) {
			return false;
		}

		if (cleanLocName && (cleanDest.includes(cleanLocName) || cleanLocName.includes(cleanDest))) {
			return true;
		}
		if (cleanSysName && cleanDest.includes(cleanSysName)) {
			return true;
		}
	}

	return false;
};

/**
 * Calculates Expected Delivery info for a specific cargo package item.
 */
export const getPackageExpectedDelivery = (
	contract: ShipmentContract,
	item: ShipmentItem,
	relatedItems: ShipmentItem[],
	ships: Record<string, ShipmentShip>,
): ExpectedDeliveryInfo => {
	const isDeliveryDone = item.status === "FULFILLED";
	if (isDeliveryDone) {
		return {
			label: "Delivered",
			detail: "Item delivered",
			state: "DELIVERED",
			colorType: "success",
		};
	}

	const pickupStep = relatedItems.find((i) => i.type === "PICKUP_SHIPMENT");
	const isPickupDone = pickupStep ? pickupStep.status === "FULFILLED" : true;

	const assignedShip = item.shipid ? ships[item.shipid] : null;

	// Check if already at destination (docked or in storage) -> "Soon"
	const isAtDest = checkIsAtDestination(item, assignedShip, isPickupDone);
	if (isAtDest) {
		const isDocked = assignedShip && !assignedShip.flight;
		return {
			label: "Soon",
			detail: isDocked
				? `Docked at ${assignedShip.docked_label || "destination"}`
				: `In storage at ${item.location_name || "destination"}`,
			state: "SOON",
			colorType: "warning",
		};
	}

	// Check if assigned ship is in flight -> Arrival timestamp of ship flight
	if (assignedShip?.flight) {
		const arrivalMs = getFlightArrivalMs(assignedShip.flight);
		const now = Date.now();
		if (arrivalMs > now) {
			const remainingMs = arrivalMs - now;
			const arrivalDate = new Date(arrivalMs);
			const timeStr = formatRemainingTime(remainingMs);
			const dateStr = arrivalDate.toLocaleDateString([], {
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});

			return {
				label: `in ${timeStr}`,
				detail: `Flight arrival: ${dateStr}`,
				state: "IN_FLIGHT",
				colorType: "info",
				arrivalMs,
			};
		}
	}

	// Shipment is picked up (or waiting): Show remaining due date of contract
	if (contract.deadline) {
		const deadlineDate = new Date(contract.deadline);
		const isLate = isBefore(deadlineDate, new Date());
		const distanceStr = formatDistanceToNowStrict(deadlineDate, { addSuffix: true });
		const deadlineFormatted = deadlineDate.toLocaleDateString([], {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

		if (!isPickupDone) {
			return {
				label: isLate ? `Overdue ${distanceStr}` : distanceStr,
				detail: `Awaiting pickup (Due ${deadlineFormatted})`,
				state: "PENDING_PICKUP",
				colorType: isLate ? "warning" : "default",
			};
		}

		return {
			label: isLate ? `Overdue ${distanceStr}` : distanceStr,
			detail: `Contract due: ${deadlineFormatted}`,
			state: "DEADLINE",
			colorType: isLate ? "warning" : "primary",
		};
	}

	return {
		label: "--",
		state: "UNKNOWN",
		colorType: "default",
	};
};

/**
 * Calculates overall Expected Delivery info for the entire shipment contract.
 * Accurately handles multiple packages in a single contract:
 * - If all packages are delivered -> "Delivered"
 * - If some packages are delivered, tracks progress (e.g. "1/3 delivered")
 * - If multiple packages are in flight, contract completion is determined by the latest flight arrival
 * - If all pending packages reached destination -> "Soon"
 * - If any pending package is waiting on pickup / deadline -> contract due date
 */
export const getContractExpectedDelivery = (
	contract: ShipmentContract,
	ships: Record<string, ShipmentShip>,
): ExpectedDeliveryInfo => {
	const deliveryItems = contract.items.filter(
		(i) => i.type === "DELIVERY" || i.type === "DELIVERY_SHIPMENT",
	);

	if (deliveryItems.length === 0) {
		if (contract.status === "FULFILLED") {
			return { label: "Fulfilled", state: "DELIVERED", colorType: "success" };
		}
		if (contract.deadline) {
			const d = new Date(contract.deadline);
			const isLate = isBefore(d, new Date());
			const text = formatDistanceToNowStrict(d, { addSuffix: true });
			return {
				label: isLate ? `Overdue ${text}` : text,
				detail: `Deadline: ${d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
				state: "DEADLINE",
				colorType: isLate ? "warning" : "default",
			};
		}
		return { label: "--", state: "UNKNOWN", colorType: "default" };
	}

	const itemDeliveries = deliveryItems.map((item) => {
		const related = contract.items.filter(
			(r) =>
				((r.item_id && item.item_id && r.item_id === item.item_id) ||
					r.material_ticker === item.material_ticker) &&
				r.type !== "DELIVERY" &&
				r.type !== "DELIVERY_SHIPMENT",
		);
		return getPackageExpectedDelivery(contract, item, related, ships);
	});

	// Filter out packages that are already completed
	const pendingDeliveries = itemDeliveries.filter((d) => d.state !== "DELIVERED");
	const isMulti = itemDeliveries.length > 1;
	const deliveredCount = itemDeliveries.length - pendingDeliveries.length;
	const progressSuffix =
		isMulti && deliveredCount > 0
			? ` (${deliveredCount}/${itemDeliveries.length} delivered)`
			: "";

	// 1. If all items delivered
	if (pendingDeliveries.length === 0) {
		return {
			label: "Delivered",
			detail: isMulti ? `All ${itemDeliveries.length} packages delivered` : "Package delivered",
			state: "DELIVERED",
			colorType: "success",
		};
	}

	// 2. If all pending items are at destination -> "Soon"
	if (pendingDeliveries.every((d) => d.state === "SOON")) {
		return {
			label: "Soon",
			detail: isMulti
				? `All pending packages at destination${progressSuffix}`
				: `${pendingDeliveries[0].detail}${progressSuffix}`,
			state: "SOON",
			colorType: "warning",
		};
	}

	// 3. If any pending items are in flight:
	// For multiple in-flight packages, the shipment completes when the final ship lands.
	const inFlightItems = pendingDeliveries.filter((d) => d.state === "IN_FLIGHT");
	const hasUnscheduled = pendingDeliveries.some(
		(d) => d.state === "DEADLINE" || d.state === "PENDING_PICKUP",
	);

	// If everything pending is in flight or already docked at destination
	if (inFlightItems.length > 0 && !hasUnscheduled) {
		// Sort by arrivalMs descending to get the latest arrival
		inFlightItems.sort((a, b) => (b.arrivalMs || 0) - (a.arrivalMs || 0));
		const latestFlight = inFlightItems[0];
		return {
			...latestFlight,
			detail: `${latestFlight.detail}${progressSuffix}`,
		};
	}

	// 4. If any pending items are awaiting pickup or pending departure
	const deadlineItem = pendingDeliveries.find((d) => d.state === "DEADLINE");
	if (deadlineItem) {
		return {
			...deadlineItem,
			detail: `${deadlineItem.detail}${progressSuffix}`,
		};
	}

	const pendingPickup = pendingDeliveries.find((d) => d.state === "PENDING_PICKUP");
	if (pendingPickup) {
		return {
			...pendingPickup,
			detail: `${pendingPickup.detail}${progressSuffix}`,
		};
	}

	// 5. If some items are soon
	const soonItem = pendingDeliveries.find((d) => d.state === "SOON");
	if (soonItem) {
		return {
			...soonItem,
			detail: `${soonItem.detail}${progressSuffix}`,
		};
	}

	return {
		...pendingDeliveries[0],
		detail: `${pendingDeliveries[0].detail || ""}${progressSuffix}`.trim(),
	};
};

const getDeliveryColorAndIcon = (
	info: ExpectedDeliveryInfo,
	theme: any,
	accentColor: string,
) => {
	switch (info.state) {
		case "DELIVERED":
			return {
				color: theme.palette.success.main,
				icon: <CheckCircle sx={{ fontSize: 15 }} />,
			};
		case "SOON":
			return {
				color: theme.palette.warning.main,
				icon: <AccessTime sx={{ fontSize: 15 }} />,
			};
		case "IN_FLIGHT":
			return {
				color: theme.palette.info?.main || "#00b4d8",
				icon: <FlightLand sx={{ fontSize: 15 }} />,
			};
		case "DEADLINE":
		case "PENDING_PICKUP":
		default:
			return {
				color: info.colorType === "warning" ? theme.palette.warning.main : accentColor,
				icon: <AccessTime sx={{ fontSize: 15 }} />,
			};
	}
};


// --- OPTIMIZED FLIGHT PROGRESS BAR ---
const OptimizedFlightProgressBar = React.memo(
	({
		startTime,
		endTime,
		color,
	}: {
		startTime?: number | string;
		endTime?: number | string;
		color: string;
	}) => {
		const barRef = useRef<HTMLDivElement>(null);
		const labelRef = useRef<HTMLSpanElement>(null);
		const reqRef = useRef<number>(0);

		useEffect(() => {
			if (!startTime || !endTime) return;
			const start = parseFlightTimestamp(startTime);
			const end = parseFlightTimestamp(endTime);
			if (!start || !end || isNaN(start) || isNaN(end) || end <= start) return;
			const animate = () => {
				const now = Date.now();
				const total = end - start;
				const elapsed = now - start;
				const remaining = end - now;

				let percent = (elapsed / total) * 100;
				if (percent < 0) percent = 0;
				if (percent > 100) percent = 100;

				if (barRef.current)
					barRef.current.style.transform = `scaleX(${percent / 100})`;

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
			<Box sx={{ width: "100%", mt: 0.8 }}>
				{/* Progress Track */}
				<Box
					sx={{
						height: 4,
						bgcolor: alpha("#000", 0.4),
						borderRadius: 1,
						overflow: "hidden",
						border: `1px solid ${alpha(color, 0.25)}`,
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
							boxShadow: `0 0 8px ${color}`,
						}}
					/>
				</Box>

				{/* ETA Label */}
				<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.4 }}>
					<Typography
						variant="caption"
						sx={{
							color: alpha(color, 0.85),
							fontSize: "0.68rem",
							fontWeight: 700,
							letterSpacing: 0.5,
						}}
					>
						ETA:{" "}
						<span
							ref={labelRef}
							style={{ fontFamily: "monospace", color: color, fontWeight: 800 }}
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
	accentColor,
}: {
	icon: any;
	label: string;
	subLabel?: string;
	isDone: boolean;
	isLast?: boolean;
	extraContent?: React.ReactNode;
	accentColor: string;
}) => {
	const theme = useTheme();
	const lineColor = isDone
		? theme.palette.success.main
		: alpha(theme.palette.divider, 0.15);

	return (
		<Box sx={{ display: "flex", position: "relative" }}>
			{!isLast && (
				<Box
					sx={{
						position: "absolute",
						left: 10,
						top: 22,
						bottom: -4,
						width: 2,
						bgcolor: lineColor,
						opacity: 0.6,
						zIndex: 0,
					}}
				/>
			)}

			<Box
				sx={{
					width: 22,
					height: 22,
					borderRadius: 1,
					bgcolor: isDone
						? alpha(theme.palette.success.main, 0.2)
						: alpha(accentColor, 0.12),
					border: `1px solid ${isDone ? theme.palette.success.main : alpha(accentColor, 0.4)}`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					zIndex: 1,
					mr: 1.5,
					flexShrink: 0,
					mt: 0.4,
				}}
			>
				<Icon
					sx={{
						fontSize: 13,
						color: isDone ? theme.palette.success.main : accentColor,
					}}
				/>
			</Box>

			<Box sx={{ flex: 1, pb: 1.8 }}>
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
								fontSize: "0.72rem",
								letterSpacing: 0.5,
							}}
						>
							{label}
						</Typography>
						{subLabel && (
							<Typography
								variant="caption"
								sx={{
									display: "block",
									color: theme.palette.text.secondary,
									fontSize: "0.68rem",
									lineHeight: 1.2,
									mt: 0.2,
								}}
							>
								{subLabel}
							</Typography>
						)}
					</Box>
					{isDone && (
						<CheckCircle
							sx={{ fontSize: 14, color: theme.palette.success.main, mt: 0.2 }}
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
	accentColor,
	contract,
}: {
	item: ShipmentItem;
	relatedItems: ShipmentItem[];
	ships: Record<string, ShipmentShip>;
	onFocusLocation: (t: LocationFocusTarget) => void;
	accentColor: string;
	contract: ShipmentContract;
}) => {
	const theme = useTheme();
	const [expanded, setExpanded] = useState(false);

	const provisionStep = relatedItems.find(
		(i) => i.type === "PROVISION_SHIPMENT",
	);
	const pickupStep = relatedItems.find((i) => i.type === "PICKUP_SHIPMENT");

	const isProvisionDone = provisionStep
		? provisionStep.status === "FULFILLED"
		: true;
	const isPickupDone = pickupStep ? pickupStep.status === "FULFILLED" : true;
	const isDeliveryDone = item.status === "FULFILLED";

	const assignedShip = item.shipid ? ships[item.shipid] : null;
	const flight = assignedShip?.flight;
	const destinationStatus =
		flight?.destination === item.target_name ? "MATCH" : "MISMATCH";

	const packageDelivery = useMemo(
		() => getPackageExpectedDelivery(contract, item, relatedItems, ships),
		[contract, item, relatedItems, ships],
	);
	const packageDeliveryVisual = getDeliveryColorAndIcon(
		packageDelivery,
		theme,
		accentColor,
	);

	const cardBorder = isDeliveryDone
		? theme.palette.success.main
		: expanded
			? accentColor
			: theme.palette.divider;

	return (
		<Box
			sx={{
				mb: 1.2,
				borderRadius: 1.5,
				overflow: "hidden",
				border: `1px solid ${alpha(cardBorder, expanded ? 0.6 : 0.2)}`,
				bgcolor: alpha(theme.palette.background.default, 0.5),
				transition: "all 0.2s ease-in-out",
				"&:hover": { borderColor: alpha(cardBorder, 0.7) },
			}}
		>
			<ButtonBase
				onClick={() => setExpanded(!expanded)}
				sx={{
					width: "100%",
					p: 1.2,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					bgcolor: expanded
						? alpha(accentColor, 0.12)
						: alpha(theme.palette.background.default, 0.3),
					borderBottom: expanded ? `1px solid ${alpha(cardBorder, 0.2)}` : "none",
					textAlign: "left",
				}}
			>
				<Stack direction="row" spacing={1.2} alignItems="center">
					<Box
						sx={{
							width: 30,
							height: 30,
							borderRadius: 1,
							bgcolor: alpha(isDeliveryDone ? theme.palette.success.main : accentColor, 0.15),
							border: `1px solid ${alpha(isDeliveryDone ? theme.palette.success.main : accentColor, 0.35)}`,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: isDeliveryDone ? theme.palette.success.main : accentColor,
						}}
					>
						<Inventory sx={{ fontSize: 16 }} />
					</Box>
					<Box>
						<Typography
							variant="subtitle2"
							sx={{
								fontWeight: 700,
								fontSize: "0.78rem",
								color: theme.palette.text.primary,
								lineHeight: 1.2,
							}}
						>
							{item.material_ticker || "Cargo Package"}
							{item.quantity ? ` × ${item.quantity}` : ""}
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: theme.palette.text.secondary,
								fontSize: "0.68rem",
								display: "block",
							}}
						>
							{isDeliveryDone
								? "Delivered"
								: item.destination_label
									? `To: ${item.destination_label}`
									: "Pending Delivery"}
						</Typography>
					</Box>
				</Stack>

				<Stack direction="row" spacing={1} alignItems="center">
					<Chip
						label={packageDelivery.label}
						size="small"
						sx={{
							height: 18,
							fontSize: "0.6rem",
							fontWeight: 700,
							bgcolor: alpha(packageDeliveryVisual.color, 0.12),
							color: packageDeliveryVisual.color,
							border: `1px solid ${alpha(packageDeliveryVisual.color, 0.3)}`,
						}}
					/>
					<Stack direction="row" spacing={0.5}>
						{[isProvisionDone, isPickupDone, isDeliveryDone].map((done, idx) => (
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
						))}
					</Stack>
					{expanded ? (
						<ExpandLess sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
					) : (
						<ExpandMore sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
					)}
				</Stack>
			</ButtonBase>

			<Collapse in={expanded}>
				<Box
					sx={{
						p: 1.5,
						pt: 1.2,
						bgcolor: alpha(theme.palette.common.black, 0.2),
					}}
				>
					{provisionStep && (
						<FlowStep
							icon={ShoppingCart}
							label="PROVISION"
							subLabel={provisionStep.origin_label || undefined}
							isDone={isProvisionDone}
							accentColor={accentColor}
						/>
					)}

					<FlowStep
						icon={ExitToApp}
						label="PICKUP"
						subLabel={provisionStep ? provisionStep.origin_label : (item.origin_label || "Origin")}
						isDone={isPickupDone}
						accentColor={accentColor}
					/>

					<FlowStep
						icon={LocalShipping}
						label="TRANSIT"
						isDone={isDeliveryDone}
						accentColor={accentColor}
						extraContent={
							!isDeliveryDone && isPickupDone ? (
								assignedShip ? (
									<Box
										sx={{
											p: 1.2,
											borderRadius: 1,
											bgcolor: alpha(theme.palette.background.default, 0.5),
											border: `1px solid ${alpha(accentColor, 0.3)}`,
										}}
									>
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												mb: 0.6,
											}}
										>
											<Typography
												variant="caption"
												sx={{ fontWeight: 800, color: accentColor, fontSize: "0.75rem" }}
											>
												{assignedShip.name}
											</Typography>
											<Tooltip title="Focus ship on map">
												<IconButton
													size="small"
													onClick={() =>
														onFocusLocation({ type: "SHIP", id: assignedShip.id, nonce: Date.now() })
													}
													sx={{
														p: 0.3,
														bgcolor: alpha(accentColor, 0.15),
														"&:hover": { bgcolor: alpha(accentColor, 0.3) },
													}}
												>
													<GpsFixed sx={{ fontSize: 12, color: accentColor }} />
												</IconButton>
											</Tooltip>
										</Box>

										{assignedShip.flight ? (
											<>
												<Box
													sx={{
														display: "flex",
														justifyContent: "space-between",
														fontSize: "0.68rem",
														color: theme.palette.text.secondary,
														fontWeight: 600,
													}}
												>
													<Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
														<FlightTakeoff sx={{ fontSize: 12 }} />
														{assignedShip.flight.originplanetid ||
															assignedShip.flight.originstationid ||
															assignedShip.flight.originsystemid}
													</Box>
													<Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
														{assignedShip.flight.destinationplanetid ||
															assignedShip.flight.destinationstationid ||
															assignedShip.flight.destinationsystemid}
														<FlightLand sx={{ fontSize: 12 }} />
													</Box>
												</Box>

												<OptimizedFlightProgressBar
													startTime={assignedShip.flight.departuretimestamp}
													endTime={assignedShip.flight.arrivaltimestamp}
													color={accentColor}
												/>

												{destinationStatus === "MISMATCH" && (
													<Stack
														direction="row"
														spacing={0.5}
														sx={{ alignItems: "center", mt: 0.6 }}
													>
														<WarningAmber
															sx={{
																fontSize: 12,
																color: theme.palette.warning.main,
															}}
														/>
														<Typography
															variant="caption"
															sx={{
																fontSize: "0.65rem",
																color: theme.palette.warning.main,
																fontWeight: 600,
															}}
														>
															Stopover:{" "}
															{assignedShip.flight.destinationplanetid ||
																assignedShip.flight.destinationstationid ||
																assignedShip.flight.destinationsystemid}
														</Typography>
													</Stack>
												)}
											</>
										) : (
											<Typography
												variant="caption"
												sx={{
													fontStyle: "italic",
													color:
														packageDelivery.state === "SOON"
															? theme.palette.warning.main
															: theme.palette.text.secondary,
													fontSize: "0.7rem",
													fontWeight: packageDelivery.state === "SOON" ? 700 : 400,
												}}
											>
												{packageDelivery.state === "SOON"
													? `Docked at destination (${assignedShip.docked_label || "Station/Base"}) • Soon`
													: `Docked (${assignedShip.docked_label || "Station/Base"})`}
											</Typography>
										)}
									</Box>
								) : (
									<Box
										sx={{
											p: 1.2,
											borderRadius: 1,
											bgcolor: alpha(theme.palette.background.default, 0.5),
											border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
										}}
									>
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
											}}
										>
											<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
												<Warehouse
													sx={{ fontSize: 14, color: theme.palette.warning.main }}
												/>
												<Typography
													variant="caption"
													sx={{
														fontWeight: 700,
														fontSize: "0.72rem",
														color: theme.palette.warning.main,
													}}
												>
													Stored in {item.location_name || item.location_type || "Warehouse"}
													{packageDelivery.state === "SOON" ? " (At Destination - Soon)" : ""}
												</Typography>
											</Box>
											<Tooltip title="Locate on map">
												<IconButton
													size="small"
													onClick={() => {
														if (item.location_type === "STATION" && item.location_name) {
															onFocusLocation({
																type: "STATION",
																id: item.location_name,
																systemId: item.systemid || undefined,
															});
														} else if (item.planetid || item.location_type === "SITE") {
															onFocusLocation({
																type: "PLANET",
																id: item.planetid || item.location_name,
																systemId: item.systemid || undefined,
															});
														} else if (item.systemid) {
															onFocusLocation({
																type: "SYSTEM",
																id: item.systemid,
															});
														}
													}}
													sx={{
														p: 0.3,
														bgcolor: alpha(theme.palette.warning.main, 0.15),
														"&:hover": { bgcolor: alpha(theme.palette.warning.main, 0.3) },
													}}
												>
													<GpsFixed
														sx={{
															fontSize: 12,
															color: theme.palette.warning.main,
														}}
													/>
												</IconButton>
											</Tooltip>
										</Box>
										{item.system_name && (
											<Typography
												variant="caption"
												sx={{
													fontSize: "0.65rem",
													color: theme.palette.text.secondary,
													display: "block",
													mt: 0.3,
												}}
											>
												System: {item.system_name}
											</Typography>
										)}
									</Box>
								)
							) : null
						}
					/>

					<FlowStep
						icon={Place}
						label="DELIVERY"
						subLabel={item.destination_label}
						extraContent={
							!isDeliveryDone && (
								<Box
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: 0.6,
										px: 0.8,
										py: 0.3,
										borderRadius: 1,
										bgcolor: alpha(packageDeliveryVisual.color, 0.08),
										border: `1px solid ${alpha(packageDeliveryVisual.color, 0.25)}`,
										mt: 0.4,
									}}
								>
									{packageDeliveryVisual.icon}
									<Typography
										variant="caption"
										sx={{
											fontSize: "0.68rem",
											fontWeight: 700,
											color: packageDeliveryVisual.color,
										}}
									>
										Expected: {packageDelivery.label}
									</Typography>
									{packageDelivery.detail && (
										<Typography
											variant="caption"
											sx={{
												fontSize: "0.62rem",
												color: theme.palette.text.secondary,
											}}
										>
											• {packageDelivery.detail}
										</Typography>
									)}
								</Box>
							)
						}
						isDone={isDeliveryDone}
						isLast={true}
						accentColor={accentColor}
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
	onRefresh,
	isRefreshing = false,
}) => {
	const theme = useTheme();

	const isCarrier = (contract as any).party === "CARRIER" || (contract as any).role === "CARRIER";
	const accentColor = isCarrier
		? theme.palette.primary.main
		: theme.palette.secondary.main;

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

	const { totalPayout, paymentStatus } = useMemo(() => {
		const total = paymentItems.reduce(
			(sum, item) => sum + (item.price || 0),
			0,
		);
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

	const deadlineText = useMemo(() => {
		if (!contract.deadline) return null;
		const d = new Date(contract.deadline);
		const isLate = isBefore(d, new Date());
		const text = formatDistanceToNowStrict(d, { addSuffix: true });
		return isLate ? `Overdue ${text}` : text;
	}, [contract.deadline]);

	// Periodic timer so ETA and live flight countdowns refresh
	const [, setTick] = useState(0);
	useEffect(() => {
		const interval = setInterval(() => setTick((t) => t + 1), 10000);
		return () => clearInterval(interval);
	}, []);

	const expectedDelivery = useMemo(
		() => getContractExpectedDelivery(contract, ships),
		[contract, ships],
	);
	const expectedDeliveryVisual = getDeliveryColorAndIcon(
		expectedDelivery,
		theme,
		accentColor,
	);

	const isMobile = useMediaQuery(theme.breakpoints.down("md"));


	return (
		<Paper
			elevation={isMobile ? 12 : 6}
			sx={{
				position: "absolute",
				...(isMobile
					? {
							bottom: 12,
							left: 12,
							right: 12,
							width: "auto",
							maxHeight: { xs: "50vh", sm: "45vh" },
						}
					: {
							top: "10vh",
							right: 20,
							width: 340,
							maxHeight: "80vh",
						}),
				display: "flex",
				flexDirection: "column",
				bgcolor: alpha(theme.palette.background.default, 0.9),
				backdropFilter: "blur(16px)",
				border: `1px solid ${theme.palette.divider}`,
				color: theme.palette.text.primary,
				borderRadius: 2,
				zIndex: 25,
				overflow: "hidden",
				boxShadow: isMobile ? "0 -8px 32px rgba(0,0,0,0.6)" : "0 8px 32px rgba(0,0,0,0.5)",
			}}
		>
			{/* Top Accent Strip */}
			<Box sx={{ height: 3, bgcolor: accentColor, width: "100%", flexShrink: 0 }} />

			{/* HEADER */}
			<Box
				sx={{
					p: 1.5,
					borderBottom: `1px solid ${theme.palette.divider}`,
					bgcolor: alpha(theme.palette.background.default, 0.4),
					flexShrink: 0,
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 0.8,
					}}
				>
					<Typography
						variant="overline"
						sx={{
							fontWeight: 800,
							color: accentColor,
							letterSpacing: 2,
							lineHeight: 1,
						}}
					>
						{isCarrier ? "OUTBOUND SHIPMENT" : "INBOUND SHIPMENT"}
					</Typography>
					<Stack direction="row" spacing={0.5} alignItems="center">
						{onRefresh && (
							<Tooltip title="Refresh tracking data">
								<IconButton
									size="small"
									onClick={onRefresh}
									disabled={isRefreshing}
									sx={{
										color: theme.palette.text.secondary,
										"&:hover": { color: theme.palette.primary.main },
									}}
								>
									<Refresh
										fontSize="small"
										sx={{
											animation: isRefreshing ? "spin 1s linear infinite" : "none",
											"@keyframes spin": {
												"0%": { transform: "rotate(0deg)" },
												"100%": { transform: "rotate(360deg)" },
											},
										}}
									/>
								</IconButton>
							</Tooltip>
						)}
						<IconButton
							size="small"
							onClick={onClose}
							sx={{ color: theme.palette.text.secondary }}
						>
							<Close fontSize="small" />
						</IconButton>
					</Stack>
				</Box>

				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "baseline",
					}}
				>
					<Stack direction="row" spacing={1} alignItems="center">
						<Typography
							variant="subtitle1"
							sx={{
								fontFamily: "monospace",
								fontWeight: 800,
								fontSize: "1.1rem",
								color: theme.palette.text.primary,
								letterSpacing: -0.5,
								lineHeight: 1,
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
								fontWeight: 700,
								bgcolor: alpha(accentColor, 0.15),
								color: accentColor,
								border: "none",
							}}
						/>
					</Stack>

					{deadlineText && (
						<Stack direction="row" spacing={0.4} alignItems="center">
							<AccessTime sx={{ fontSize: 13, color: theme.palette.text.secondary }} />
							<Typography
								variant="caption"
								sx={{
									fontSize: "0.68rem",
									color: theme.palette.text.secondary,
									fontWeight: 600,
								}}
							>
								{deadlineText}
							</Typography>
						</Stack>
					)}
				</Box>

				{contract.partner_name && (
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.6,
							mt: 0.8,
						}}
					>
						<Handshake sx={{ fontSize: 14, color: theme.palette.text.disabled }} />
						<Typography
							variant="body2"
							sx={{
								fontWeight: 500,
								fontSize: "0.75rem",
								color: theme.palette.text.secondary,
							}}
						>
							{contract.partner_name}
						</Typography>
					</Box>
				)}

				{/* EXPECTED DELIVERY CARD */}
				<Box
					sx={{
						mt: 1.2,
						p: 1,
						borderRadius: 1.2,
						bgcolor: alpha(expectedDeliveryVisual.color, 0.08),
						border: `1px solid ${alpha(expectedDeliveryVisual.color, 0.25)}`,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
						<Box
							sx={{
								width: 24,
								height: 24,
								borderRadius: 1,
								bgcolor: alpha(expectedDeliveryVisual.color, 0.15),
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: expectedDeliveryVisual.color,
								flexShrink: 0,
							}}
						>
							{expectedDeliveryVisual.icon}
						</Box>
						<Box>
							<Typography
								variant="caption"
								sx={{
									fontSize: "0.6rem",
									fontWeight: 800,
									color: theme.palette.text.secondary,
									letterSpacing: 0.5,
									textTransform: "uppercase",
									display: "block",
									lineHeight: 1,
									mb: 0.2,
								}}
							>
								Expected Delivery
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 800,
									fontSize: "0.78rem",
									color: expectedDeliveryVisual.color,
									lineHeight: 1.1,
								}}
							>
								{expectedDelivery.label}
							</Typography>
						</Box>
					</Box>
					{expectedDelivery.detail && (
						<Typography
							variant="caption"
							sx={{
								fontSize: "0.65rem",
								color: theme.palette.text.secondary,
								fontWeight: 600,
								textAlign: "right",
								maxWidth: "50%",
								lineHeight: 1.2,
							}}
						>
							{expectedDelivery.detail}
						</Typography>
					)}
				</Box>
			</Box>

			{/* BODY / MANIFEST */}
			<Box
				sx={{
					p: 1.5,
					overflowY: "auto",
					flex: 1,
					bgcolor: alpha(theme.palette.background.default, 0.2),
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
							color: theme.palette.text.secondary,
							fontWeight: 700,
							fontSize: "0.7rem",
							letterSpacing: 1,
						}}
					>
						CARGO MANIFEST
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: theme.palette.text.secondary, fontSize: "0.68rem" }}
					>
						{deliveryItems.length} PACKAGE{deliveryItems.length !== 1 ? "S" : ""}
					</Typography>
				</Box>

				{deliveryItems.length > 0 ? (
					deliveryItems.map((item, i) => (
						<PackageCard
							key={i}
							item={item}
							relatedItems={contract.items.filter(
								(r) =>
									((r.item_id && item.item_id && r.item_id === item.item_id) ||
										r.material_ticker === item.material_ticker) &&
									r.type !== "DELIVERY" &&
									r.type !== "DELIVERY_SHIPMENT",
							)}
							ships={ships}
							onFocusLocation={onFocusLocation}
							accentColor={accentColor}
							contract={contract}
						/>
					))

				) : (
					<Box
						sx={{
							p: 3,
							textAlign: "center",
							border: `1px dashed ${theme.palette.divider}`,
							borderRadius: 1.5,
						}}
					>
						<Typography variant="caption" color="text.secondary">
							No physical cargo items found
						</Typography>
					</Box>
				)}
			</Box>

			{/* FOOTER */}
			<Box
				sx={{
					p: 1.5,
					bgcolor: alpha(theme.palette.background.default, 0.5),
					borderTop: `1px solid ${theme.palette.divider}`,
					flexShrink: 0,
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Stack direction="row" spacing={1} alignItems="center">
						<Box
							sx={{
								width: 28,
								height: 28,
								borderRadius: 1,
								bgcolor: alpha(theme.palette.warning.main, 0.15),
								border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
								color: theme.palette.warning.main,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<AttachMoney sx={{ fontSize: 16 }} />
						</Box>
						<Box>
							<Typography
								variant="caption"
								sx={{
									display: "block",
									color: theme.palette.text.secondary,
									lineHeight: 1,
									fontSize: "0.62rem",
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
										fontSize: "0.85em",
										color: theme.palette.warning.main,
									}}
								>
									AIC
								</span>
							</Typography>
						</Box>
					</Stack>

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
