import React, {
	useEffect,
	useState,
	useMemo,
	useCallback,
	memo,
	useRef,
} from "react";
import {
	Box,
	Button,
	TextField,
	CircularProgress,
	Typography,
	Paper,
	IconButton,
	Collapse,
	Chip,
	Stack,
	Divider,
	Alert,
} from "@mui/material";
import {
	Wifi,
	ChevronDown,
	ChevronUp,
	Box as BoxIcon,
	Warehouse,
	Rocket,
} from "lucide-react";
import BaseStarMap from "../../components/common/StarMap/BaseStarMap";
import { ProgressDisplay } from "../../components/common/StarMap/components/progressDisplay";
import type { AnimatedShipData } from "../../components/common/StarMap/types/mapTypes";

// --- TYPE DEFINITIONS ---

/**
 * Represents basic location information for an origin or destination.
 */
export interface LocationInfo {
	system_id: string | null;
	system_name: string | null;
	planet_id: string | null;
	planet_name: string | null;
	station_id: string | null;
	station_name: string | null;
}

/**
 * Represents a delivery box associated with a shipment.
 */
export interface DeliveryBox {
	conditionId: string;
	flightId: string | null;
	index: number;
	planet: string;
	shipId: string | null;
	shipmentItemId: string;
	station: string;
	status: string;
	system: string;
}

/**
 * Represents the complete shipment details for a specific contract.
 */
export interface ContractShipmentResult {
	localid: string;
	contractid: string;
	origin: LocationInfo;
	destination: LocationInfo;
	provision_boxes_list: Record<string, unknown>[];
	delivery_boxes_list: DeliveryBox[];
	condition_summary: Record<string, unknown>;
	ships: AnimatedShipData[];
}

/**
 * Connection status for the live WebSocket updates.
 */
export type WsStatus = "CONNECTED" | "CONNECTING" | "DISCONNECTED";

// --- CHILD COMPONENTS ---

/**
 * Displays information for boxes currently held in planetary or station storage.
 *
 * @param props - Component props containing the array of boxes.
 * @returns The rendered StorageInfo component.
 */
const StorageInfo = memo(({ boxes }: { boxes: DeliveryBox[] }) => {
	const location = boxes[0];
	const locationName =
		location.station ||
		location.planet ||
		location.system ||
		"Unknown Location";

	return (
		<Paper
			elevation={3}
			sx={(theme) => ({
				p: 1,
				mb: 1.5,
				borderRadius: 1.5,
				background:
					theme.palette.mode === "dark"
						? "rgba(25, 28, 30, 0.4)"
						: "rgba(255, 255, 255, 0.8)",
				border: `1px solid ${theme.palette.divider}`,
				backdropFilter: "blur(5px)",
			})}
		>
			<Stack spacing={1}>
				<Stack direction="row" alignItems="center" spacing={1}>
					<Warehouse size={16} />
					<Typography variant="body1" sx={{ fontWeight: 600 }}>
						In Storage @ {locationName}
					</Typography>
				</Stack>
				<Divider />
				<Stack spacing={0.5}>
					{boxes.map((box) => (
						<Paper
							key={box.conditionId}
							variant="outlined"
							sx={{ p: 0.5, borderRadius: 1, bgcolor: "action.hover" }}
						>
							<Typography
								sx={{
									fontSize: "0.75rem",
									fontWeight: 500,
									display: "flex",
									justifyContent: "space-between",
								}}
							>
								<span>Box #{box.index}</span>
								<Chip
									label={box.status}
									size="small"
									sx={{ height: 18, fontSize: "0.65rem" }}
									color={box.status === "DELIVERED" ? "success" : "default"}
								/>
							</Typography>
						</Paper>
					))}
				</Stack>
			</Stack>
		</Paper>
	);
});

StorageInfo.displayName = "StorageInfo";

/**
 * Displays information for a specific ship and the boxes it is currently carrying.
 *
 * @param props - Component props containing the ship and its boxes.
 * @returns The rendered ShipGroup component.
 */
const ShipGroup = memo(
	({ ship, boxes }: { ship: AnimatedShipData; boxes: DeliveryBox[] }) => {
		return (
			<Paper
				elevation={3}
				sx={(theme) => ({
					p: 1,
					mb: 1.5,
					borderRadius: 1.5,
					background:
						theme.palette.mode === "dark"
							? "rgba(25, 28, 30, 0.4)"
							: "rgba(255, 255, 255, 0.8)",
					border: `1px solid ${theme.palette.divider}`,
					backdropFilter: "blur(5px)",
				})}
			>
				<Stack spacing={1}>
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="space-between"
					>
						<Stack direction="row" alignItems="center" spacing={1}>
							<Rocket size={16} />
							<Typography variant="body1" sx={{ fontWeight: 600 }}>
								{ship.shipname}
							</Typography>
						</Stack>
						<Chip
							size="small"
							label={ship.flight ? "In Flight" : ship.currentsystem || "Docked"}
							color={ship.flight ? "primary" : "default"}
							sx={{ height: 22, fontSize: "0.7rem" }}
						/>
					</Stack>
					<Divider />
					{ship.flight && <ProgressDisplay plan={ship.flight} />}
					<Stack spacing={0.5}>
						<Typography
							variant="caption"
							sx={{
								fontWeight: 500,
								opacity: 0.7,
								display: "flex",
								alignItems: "center",
								gap: 0.5,
							}}
						>
							<BoxIcon size={12} /> Boxes ({boxes.length})
						</Typography>
						{boxes.map((box) => (
							<Paper
								key={box.conditionId}
								variant="outlined"
								sx={{ p: 0.5, borderRadius: 1, bgcolor: "action.hover" }}
							>
								<Typography
									sx={{
										fontSize: "0.75rem",
										fontWeight: 500,
										display: "flex",
										justifyContent: "space-between",
									}}
								>
									<span>Box #{box.index}</span>
									<Chip
										label={box.status}
										size="small"
										sx={{ height: 18, fontSize: "0.65rem" }}
										color={box.status === "DELIVERED" ? "success" : "default"}
									/>
								</Typography>
							</Paper>
						))}
					</Stack>
				</Stack>
			</Paper>
		);
	},
);

ShipGroup.displayName = "ShipGroup";

/**
 * Displays the high-level details of a contract and categorizes its boxes by location or ship.
 *
 * @param props - Component props containing the contract data.
 * @returns The rendered ContractDetails component.
 */
const ContractDetails = memo(
	({ contract }: { contract: ContractShipmentResult }) => {
		const [isOpen, setIsOpen] = useState(true);

		const groupedByShip = useMemo(() => {
			return contract.delivery_boxes_list.reduce(
				(acc: Record<string, DeliveryBox[]>, box) => {
					const key =
						box.shipId || `storage-${box.system}-${box.planet || box.station}`;
					if (!acc[key]) acc[key] = [];
					acc[key].push(box);
					return acc;
				},
				{},
			);
		}, [contract.delivery_boxes_list]);

		return (
			<Paper
				elevation={2}
				sx={(theme) => ({
					mb: 2,
					p: 1,
					borderRadius: 2,
					background: "transparent",
					border: `1px solid ${theme.palette.divider}`,
					backdropFilter: "blur(2px)",
				})}
			>
				<Box
					sx={{ cursor: "pointer" }}
					onClick={() => setIsOpen((prev) => !prev)}
				>
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
					>
						<Box>
							<Typography variant="body2" sx={{ fontWeight: 600 }}>
								{contract.localid}
							</Typography>
							<Typography
								variant="caption"
								sx={{ opacity: 0.8, display: "block" }}
							>
								{contract.origin.planet_name || contract.origin.station_name} →{" "}
								{contract.destination.planet_name ||
									contract.destination.station_name}
							</Typography>
						</Box>
						<IconButton size="small">
							{isOpen ? <ChevronUp /> : <ChevronDown />}
						</IconButton>
					</Stack>
				</Box>
				<Collapse in={isOpen}>
					<Divider sx={{ my: 1 }} />
					<Stack spacing={1}>
						{Object.entries(groupedByShip).map(([key, boxes]) => {
							if (key.startsWith("storage")) {
								return <StorageInfo key={key} boxes={boxes} />;
							}
							const ship = contract.ships.find((s) => s.shipid === key);
							return ship ? (
								<ShipGroup key={key} ship={ship} boxes={boxes} />
							) : null;
						})}
					</Stack>
				</Collapse>
			</Paper>
		);
	},
);

ContractDetails.displayName = "ContractDetails";

// --- WEBSOCKET HOOK ---

/**
 * Custom hook to manage WebSocket connections for live shipment updates.
 * Dynamically adds or removes connections based on the active list of contract IDs.
 *
 * @param contractIds - Array of active contract IDs to subscribe to.
 * @param setShipments - State setter function for the shipments.
 * @param setWsStatus - State setter function to track the overall WebSocket connection status.
 */
const useShipmentWebSocket = (
	contractIds: string[],
	setShipments: React.Dispatch<React.SetStateAction<ContractShipmentResult[]>>,
	setWsStatus: React.Dispatch<React.SetStateAction<WsStatus>>,
) => {
	const websockets = useRef<Record<string, WebSocket>>({});
	const setShipmentsRef = useRef(setShipments);
	setShipmentsRef.current = setShipments;

	const stableContractIdsKey = useMemo(
		() => contractIds.sort().join(","),
		[contractIds],
	);

	useEffect(() => {
		const currentSockets = websockets.current;
		const activeIds = new Set(contractIds);

		Object.keys(currentSockets).forEach((id) => {
			if (!activeIds.has(id)) {
				currentSockets[id].close();
				delete currentSockets[id];
			}
		});

		const updateStatus = () => {
			let connecting = 0;
			let open = 0;
			const sockets = Object.values(websockets.current);

			sockets.forEach((ws) => {
				if (ws.readyState === WebSocket.CONNECTING) connecting++;
				else if (ws.readyState === WebSocket.OPEN) open++;
			});

			if (sockets.length === 0) setWsStatus("DISCONNECTED");
			else if (open === sockets.length) setWsStatus("CONNECTED");
			else if (connecting > 0) setWsStatus("CONNECTING");
			else setWsStatus("DISCONNECTED");
		};

		contractIds.forEach((id) => {
			if (!currentSockets[id] || currentSockets[id].readyState > 1) {
				const ws = new WebSocket(
					`wss://api.punoted.net/ws/contracts/shipments/${id}`,
				);

				ws.onopen = () => updateStatus();
				ws.onclose = () => updateStatus();
				ws.onerror = () => updateStatus();

				ws.onmessage = (event) => {
					try {
						const data: ContractShipmentResult = JSON.parse(event.data);
						if (data && data.contractid) {
							setShipmentsRef.current((prev) =>
								prev.map((s) => (s.contractid === data.contractid ? data : s)),
							);
						}
					} catch (error) {
						console.error("Failed to parse WebSocket message:", error);
					}
				};

				currentSockets[id] = ws;
			}
		});

		updateStatus();
	}, [stableContractIdsKey, contractIds, setWsStatus]);

	useEffect(() => {
		return () => {
			const currentSockets = websockets.current;
			Object.values(currentSockets).forEach((ws) => {
				if (
					ws.readyState === WebSocket.OPEN ||
					ws.readyState === WebSocket.CONNECTING
				) {
					ws.close();
				}
			});
			websockets.current = {};
			setWsStatus("DISCONNECTED");
		};
	}, [setWsStatus]);
};

// --- MAIN COMPONENT ---

/**
 * Main Shipping Map view.
 * Allows searching for shipments by ID, rendering them on a star map, and displaying real-time live data via WebSockets.
 */
const ShippingMap: React.FC = () => {
	const [searchCode, setSearchCode] = useState("");
	const [shipments, setShipments] = useState<ContractShipmentResult[]>([]);
	const [errors, setErrors] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [wsStatus, setWsStatus] = useState<WsStatus>("DISCONNECTED");
	const [panelOpen, setPanelOpen] = useState(false);

	const contractIds = useMemo(
		() => shipments.map((s) => s.contractid),
		[shipments],
	);

	useShipmentWebSocket(contractIds, setShipments, setWsStatus);

	/**
	 * Fetches shipment data for the entered contract IDs.
	 */
	const handleFetch = useCallback(async () => {
		const ids = searchCode
			.split(",")
			.map((id) => id.trim().toUpperCase())
			.filter(Boolean);
		if (ids.length === 0) return;

		setLoading(true);
		setShipments([]);
		setErrors([]);

		const results = await Promise.allSettled(
			ids.map((id) =>
				fetch(`https://api.punoted.net/contracts/shipments/${id}`).then(
					(res) => {
						if (!res.ok)
							throw new Error(`Contract ${id} not found or failed to load.`);
						return res.json();
					},
				),
			),
		);

		const successful: ContractShipmentResult[] = [];
		const failed: string[] = [];

		results.forEach((result, index) => {
			if (result.status === "fulfilled") {
				successful.push(result.value);
			} else {
				failed.push(ids[index]);
			}
		});

		setShipments(successful);
		setErrors(failed);
		setLoading(false);
		if (successful.length > 0) setPanelOpen(true);
	}, [searchCode]);

	const allShips = useMemo(
		() => shipments.flatMap((s) => s.ships),
		[shipments],
	);

	const searchBar = useMemo(
		() => (
			<Paper
				sx={(theme) => ({
					position: "absolute",
					top: 12,
					left: "50%",
					transform: "translateX(-50%)",
					p: 0.5,
					px: 1,
					borderRadius: 1,
					display: "flex",
					alignItems: "center",
					gap: 1,
					zIndex: 5,
					background: theme.palette.background.paper,
					backdropFilter: "blur(6px)",
				})}
			>
				<TextField
					size="small"
					variant="filled"
					label="Contract ID(s)"
					value={searchCode}
					onChange={(e) => setSearchCode(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && handleFetch()}
					placeholder="ID1,ID2,..."
					InputLabelProps={{
						sx: {
							fontSize: "0.8rem",
							"&.MuiInputLabel-shrink": {
								transform: "translate(12px, 8px) scale(0.75)",
							},
						},
					}}
					InputProps={{
						disableUnderline: true,
						sx: (theme) => ({
							fontSize: "0.8rem",
							py: 0.2,
							"& .MuiFilledInput-input": {
								paddingTop: "18px",
								paddingBottom: "6px",
							},
							backgroundColor: theme.palette.action.hover,
							"&:hover": { backgroundColor: theme.palette.action.focus },
						}),
					}}
					sx={{ width: 200 }}
				/>
				<Button
					variant="contained"
					size="small"
					onClick={handleFetch}
					sx={{ height: 32 }}
				>
					{loading ? <CircularProgress size={16} /> : "Search"}
				</Button>
				<Chip
					icon={<Wifi size={14} />}
					label={wsStatus}
					size="small"
					sx={{ height: 26, fontSize: "0.7rem", ml: 1 }}
					color={
						wsStatus === "CONNECTED"
							? "success"
							: wsStatus === "CONNECTING"
								? "warning"
								: "error"
					}
				/>
			</Paper>
		),
		[searchCode, handleFetch, loading, wsStatus],
	);

	const panelHeader = useMemo(
		() => (
			<Paper
				sx={(theme) => ({
					p: 0.5,
					background: theme.palette.background.paper,
					borderRadius: "8px 8px 0 0",
					cursor: "pointer",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				})}
				onClick={() => setPanelOpen((v) => !v)}
			>
				<Typography sx={{ fontSize: "0.85rem", fontWeight: 500, ml: 1 }}>
					Contract Details
				</Typography>
				<IconButton size="small" sx={{ p: 0.2 }}>
					{panelOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
				</IconButton>
			</Paper>
		),
		[panelOpen],
	);

	const memoizedStarMap = useMemo(
		() => <BaseStarMap mode="shipping" shipments={allShips} />,
		[allShips],
	);

	return (
		<Box sx={{ width: "100%", height: "100%", position: "relative" }}>
			<Box
				id="map"
				sx={{
					display: "flex",
					position: "absolute",
					inset: 0,
					zIndex: 1,
					width: "100%",
					height: "100%",
				}}
			>
				{memoizedStarMap}
			</Box>
			{searchBar}
			<Box
				sx={{ position: "absolute", right: 12, top: 60, width: 320, zIndex: 4 }}
			>
				{panelHeader}
				<Collapse in={panelOpen}>
					<Paper
						sx={(theme) => ({
							p: 1,
							background: theme.palette.background.paper,
							backdropFilter: "blur(8px)",
							maxHeight: "calc(100vh - 100px)",
							overflowY: "auto",
							borderRadius: "0 0 8px 8px",
						})}
					>
						{errors.length > 0 && (
							<Alert severity="error" sx={{ mb: 1 }}>
								Failed to load: {errors.join(", ")}
							</Alert>
						)}
						{shipments.length === 0 && !loading && (
							<Typography
								sx={{ fontSize: "0.75rem", opacity: 0.7, textAlign: "center" }}
							>
								Enter contract ID(s) to load data.
							</Typography>
						)}
						<Stack spacing={1}>
							{shipments.map((contract) => (
								<ContractDetails
									key={contract.contractid}
									contract={contract}
								/>
							))}
						</Stack>
					</Paper>
				</Collapse>
			</Box>
		</Box>
	);
};

export default ShippingMap;
