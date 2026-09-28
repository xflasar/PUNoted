import { useEffect, useMemo, useState, useCallback } from "react";
import {
	Box,
	Typography,
	ToggleButtonGroup,
	ToggleButton,
	Stack,
} from "@mui/material";
import { fetchClient } from "../../utils/apiclient";
import { addDays } from "date-fns";
import type { BalanceItem } from "./materialbalancetable";
import ShipProductionTabs from "./shipproductiontabs";
import type { ShipOrder, ShipType, Part } from "./shiporders";
import type { SummaryDataItem } from "./shipproductiontable";

/**
 * Array of part tickers that are explicitly filtered and tracked for production.
 */
const PartsFilter = [
	"MSL",
	"FFC",
	"LHP",
	"CQL",
	"QCR",
	"WCB",
	"LFL",
	"HCB",
	"BR1",
	"SFE",
	"MFE",
	"SSC",
	"LFE",
	"FSE",
	"CQM",
	"LCB",
	"VCB",
	"CQS",
	"BRS",
	"SSL",
];

/**
 * Pre-defined mock data representing the various types of ships available for order
 * and their required part compositions.
 */
const MOCK_SHIP_TYPES: ShipType[] = [
	{
		id: "all",
		name: "All Ship Types",
		parts: [] as Part[],
		price: 0,
		priceCorp: 0,
	},
	{
		id: "lcbftl",
		name: "LCB FTL",
		parts: [
			{ name: "BR1", quantity: 1, isAvailable: false },
			{ name: "CQM", quantity: 1, isAvailable: false },
			{ name: "FFC", quantity: 1, isAvailable: false },
			{ name: "FSE", quantity: 1, isAvailable: false },
			{ name: "LCB", quantity: 1, isAvailable: false },
			{ name: "LFE", quantity: 2, isAvailable: false },
			{ name: "LFL", quantity: 1, isAvailable: false },
			{ name: "LHP", quantity: 94, isAvailable: false },
			{ name: "MFE", quantity: 2, isAvailable: false },
			{ name: "MSL", quantity: 1, isAvailable: false },
			{ name: "QCR", quantity: 1, isAvailable: false },
			{ name: "SFE", quantity: 1, isAvailable: false },
			{ name: "SSC", quantity: 128, isAvailable: false },
		],
		price: 4900000,
		priceCorp: 3049837,
	},
	{
		id: "lcbstl",
		name: "LCB STL",
		parts: [
			{ name: "BRS", quantity: 1, isAvailable: false },
			{ name: "CQM", quantity: 1, isAvailable: false },
			{ name: "FSE", quantity: 1, isAvailable: false },
			{ name: "LCB", quantity: 1, isAvailable: false },
			{ name: "LHP", quantity: 87, isAvailable: false },
			{ name: "SSC", quantity: 115, isAvailable: false },
			{ name: "SSL", quantity: 1, isAvailable: false },
		],
		price: 2800000,
		priceCorp: 1878140,
	},
	{
		id: "wcbftl",
		name: "WCB FTL",
		parts: [
			{ name: "BR1", quantity: 1, isAvailable: false },
			{ name: "CQS", quantity: 1, isAvailable: false },
			{ name: "FFC", quantity: 1, isAvailable: false },
			{ name: "FSE", quantity: 1, isAvailable: false },
			{ name: "WCB", quantity: 1, isAvailable: false },
			{ name: "LFE", quantity: 1, isAvailable: false },
			{ name: "LFL", quantity: 1, isAvailable: false },
			{ name: "LHP", quantity: 68, isAvailable: false },
			{ name: "MFE", quantity: 2, isAvailable: false },
			{ name: "MSL", quantity: 1, isAvailable: false },
			{ name: "QCR", quantity: 1, isAvailable: false },
			{ name: "SFE", quantity: 1, isAvailable: false },
			{ name: "SSC", quantity: 78, isAvailable: false },
		],
		price: 4450000,
		priceCorp: 2763265,
	},
	{
		id: "wcbstl",
		name: "WCB STL",
		parts: [
			{ name: "BRS", quantity: 1, isAvailable: false },
			{ name: "CQS", quantity: 1, isAvailable: false },
			{ name: "FSE", quantity: 1, isAvailable: false },
			{ name: "WCB", quantity: 1, isAvailable: false },
			{ name: "LHP", quantity: 60, isAvailable: false },
			{ name: "SSC", quantity: 65, isAvailable: false },
			{ name: "SSL", quantity: 1, isAvailable: false },
		],
		price: 2500000,
		priceCorp: 1667444,
	},
	{
		id: "vcbftl",
		name: "VCB FTL",
		parts: [
			{ name: "BR1", quantity: 1, isAvailable: false },
			{ name: "CQL", quantity: 1, isAvailable: false },
			{ name: "FFC", quantity: 1, isAvailable: false },
			{ name: "FSE", quantity: 1, isAvailable: false },
			{ name: "VCB", quantity: 1, isAvailable: false },
			{ name: "LFE", quantity: 3, isAvailable: false },
			{ name: "LFL", quantity: 1, isAvailable: false },
			{ name: "LHP", quantity: 117, isAvailable: false },
			{ name: "MFE", quantity: 2, isAvailable: false },
			{ name: "MSL", quantity: 1, isAvailable: false },
			{ name: "QCR", quantity: 1, isAvailable: false },
			{ name: "SFE", quantity: 1, isAvailable: false },
			{ name: "SSC", quantity: 178, isAvailable: false },
		],
		price: 5400000,
		priceCorp: 3361006,
	},
	{
		id: "hcbftl",
		name: "HCB FTL",
		parts: [
			{ name: "BR1", quantity: 1, isAvailable: false },
			{ name: "CQL", quantity: 1, isAvailable: false },
			{ name: "FFC", quantity: 1, isAvailable: false },
			{ name: "FSE", quantity: 1, isAvailable: false },
			{ name: "HCB", quantity: 1, isAvailable: false },
			{ name: "LFE", quantity: 5, isAvailable: false },
			{ name: "LFL", quantity: 1, isAvailable: false },
			{ name: "LHP", quantity: 157, isAvailable: false },
			{ name: "MFE", quantity: 2, isAvailable: false },
			{ name: "MSL", quantity: 1, isAvailable: false },
			{ name: "QCR", quantity: 1, isAvailable: false },
			{ name: "SFE", quantity: 1, isAvailable: false },
			{ name: "SSC", quantity: 278, isAvailable: false },
		],
		price: 9000000,
		priceCorp: 4735092,
	},
	{
		id: "starterupgrade",
		name: "WCB Starter Upgrade",
		parts: [
			{ name: "BR1", quantity: 1, isAvailable: false },
			{ name: "CQS", quantity: 1, isAvailable: false },
			{ name: "FFC", quantity: 1, isAvailable: false },
			{ name: "LFE", quantity: 1, isAvailable: false },
			{ name: "LHP", quantity: 68, isAvailable: false },
			{ name: "MFE", quantity: 2, isAvailable: false },
			{ name: "MSL", quantity: 1, isAvailable: false },
			{ name: "RCT", quantity: 1, isAvailable: false },
			{ name: "SFE", quantity: 1, isAvailable: false },
			{ name: "SSC", quantity: 78, isAvailable: false },
			{ name: "WCB", quantity: 1, isAvailable: false },
		],
		price: 950000,
		priceCorp: 708616,
	},
];

interface ApiShipOrder {
	orderid: number;
	username: string;
	shiptype: string;
	price: number;
	orderwaittime: number;
	completed: boolean;
	notes?: string;
	orderdate: string;
}

interface ApiStorageItem {
	ticker: string;
	quantity: number;
}

const calculateTotalParts = (orders: ShipOrder[]) => {
	const totalParts: { [key: string]: number } = {};
	orders.forEach((order) => {
		(order.shipType?.parts || []).forEach((part) => {
			if (part && part.name && PartsFilter.includes(part.name)) {
				totalParts[part.name] = (totalParts[part.name] || 0) + part.quantity;
			}
		});
	});
	return Object.entries(totalParts).map(([name, quantity]) => ({
		name,
		quantity,
	}));
};

const processOrdersAndParts = (
	orders: ShipOrder[],
	currentStorageItems: Part[],
): ShipOrder[] => {
	const availableParts = new Map<string, number>(
		(currentStorageItems || []).map((p) => [p.name, p.quantity]),
	);

	return orders.map((order) => {
		const processedOrder = { ...order, processedParts: [] as Part[] };
		const partsStatus = (order.shipType?.parts || [])
			.filter((part) => part && part.name && PartsFilter.includes(part.name))
			.map((part) => {
				const available = availableParts.get(part.name) || 0;
				const hasEnough = available >= part.quantity;

				if (hasEnough) {
					availableParts.set(part.name, available - part.quantity);
				}

				return {
					...part,
					isAvailable: hasEnough,
				};
			});
		processedOrder.processedParts = partsStatus;
		return processedOrder;
	});
};

const getSummaryDataWithAvailability = (
	orders: ShipOrder[],
	currentStorageItems: Part[],
): { partNames: string[]; summaryData: SummaryDataItem[] } => {
	const inProgressOrders = [...orders].sort(
		(a: ShipOrder, b: ShipOrder) => Number(a.id) - Number(b.id),
	);

	const availableParts = new Map<string, number>(
		currentStorageItems.map((p) => [p.name, p.quantity]),
	);

	const allParts = new Set<string>();
	inProgressOrders.forEach((order) => {
		(order.shipType?.parts || [])
			.filter((part) => part && part.name && PartsFilter.includes(part.name))
			.forEach((part) => allParts.add(part.name));
	});
	const partNames = Array.from(allParts).sort();

	const summaryData: SummaryDataItem[] = inProgressOrders.map((order) => {
		const partsMap = new Map<string, number>(
			(order.shipType?.parts || []).map((p) => [p.name, p.quantity]),
		);
		const row: SummaryDataItem = {
			combinedHeader: `${order.shipType?.name || "Unknown"} (${order.customer})`,
			rowSatisfied: true,
		};

		partNames.forEach((partName) => {
			const requiredQuantity = partsMap.get(partName) || 0;
			const availableQuantity = availableParts.get(partName) || 0;
			const isAvailable =
				requiredQuantity === 0 || availableQuantity >= requiredQuantity;

			if (isAvailable) {
				availableParts.set(partName, availableQuantity - requiredQuantity);
			} else {
				row.rowSatisfied = false;
			}

			row[partName] = {
				value: requiredQuantity,
				isAvailable: isAvailable,
			};
		});
		return row;
	});

	return { partNames, summaryData };
};

interface ProductionDashboardProps {
	isMobile: boolean;
}

const ProductionDashboard: React.FC<ProductionDashboardProps> = ({
	isMobile,
}) => {
	const [apiShipOrders, setApiShipOrders] = useState<ShipOrder[]>([]);
	const [storageItems, setStorageItems] = useState<Part[]>([]);
	const [selectedShipTypes, setSelectedShipTypes] = useState<string[]>(["all"]);
	const [mockRole, setMockRole] = useState<"ADMIN" | "USER" | "GUEST">("GUEST");
	const [viewMode, setViewMode] = useState<"MAIN" | "DEMO">("MAIN");
	const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

	// Local storage orders state
	const [localOrders, setLocalOrders] = useState<ShipOrder[]>([]);

	// Resolve actual role dynamically on mount
	useEffect(() => {
		const resolveUserRole = async () => {
			try {
				const res = await fetchClient(
					"internal/corporation/user-role?corporation_id=COSM",
				);
				if (res.ok) {
					const data = await res.json();
					setMockRole(data.role || "GUEST");
				} else {
					setMockRole("GUEST");
				}
			} catch (err) {
				console.error("Error resolving user role:", err);
				setMockRole("GUEST");
			}
		};
		resolveUserRole();
	}, []);

	const loadLocalOrders = useCallback(async () => {
		const headers = mockRole === "GUEST" ? { Authorization: "none" } : {};
		try {
			const res = await fetchClient(
				"internal/corporation/ship-orders?corporation_id=COSM",
				{ headers },
			);
			if (!res.ok) throw new Error("Failed to load orders");
			const data = await res.json();
			setLocalOrders(
				data.map((o: any) => ({
					...o,
					completionDate: o.completionDate
						? new Date(o.completionDate)
						: undefined,
				})),
			);
		} catch (e) {
			console.error("Error loading orders from backend:", e);
		}
	}, [mockRole]);

	const fetchShipProduction = useCallback(async (useFio: boolean) => {
		try {
			const response = await fetchClient("get_ship_production", {
				method: "POST",
				body: JSON.stringify({ fio: useFio }),
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const apiResponse = await response.json();

			if (
				apiResponse.success &&
				Array.isArray(apiResponse.data.shiporders) &&
				Array.isArray(apiResponse.data.storageitems)
			) {
				const fetchedOrders: ShipOrder[] = apiResponse.data.shiporders.map(
					(item: ApiShipOrder) => {
						const shipType = MOCK_SHIP_TYPES.find(
							(st) => st.id === item.shiptype,
						);

						if (!shipType) {
							return {
								id: item.orderid,
								customer: item.username,
								shipType: MOCK_SHIP_TYPES[0],
								price: item.price,
								waitTimeDays: item.orderwaittime,
								completionDate: addDays(new Date(), item.orderwaittime),
								processedParts: [],
								status: item.completed ? "COMPLETED" : "APPROVED",
								ownerType: "API",
							};
						}

						return {
							id: item.orderid,
							customer: item.username,
							shipType: shipType,
							price: item.price,
							waitTimeDays: item.orderwaittime,
							completionDate: addDays(new Date(), item.orderwaittime),
							processedParts: [],
							status: item.completed ? "COMPLETED" : "APPROVED",
							ownerType: "API",
						};
					},
				);
				const fetchedStorageItems: Part[] = apiResponse.data.storageitems.map(
					(item: ApiStorageItem) => {
						return {
							name: item.ticker,
							quantity: item.quantity,
							isAvailable: true,
						};
					},
				);
				setApiShipOrders(fetchedOrders);
				setStorageItems(fetchedStorageItems);
			}
		} catch (error) {
			console.error("Failed to fetch ship production data:", error);
		}
	}, []);

	useEffect(() => {
		fetchShipProduction(true);
		loadLocalOrders();
	}, [fetchShipProduction, loadLocalOrders]);

	// Combined orders: API orders (for MAIN) vs Local database orders (for DEMO)
	const shipOrders = useMemo(() => {
		return viewMode === "MAIN" ? apiShipOrders : localOrders;
	}, [viewMode, apiShipOrders, localOrders]);

	const handleFilterClick = useCallback((shipIdRaw: string | number) => {
		const shipId = shipIdRaw.toString();
		setSelectedShipTypes((prevSelected) => {
			if (shipId === "all") {
				return ["all"];
			}
			const isCurrentlyAll = prevSelected.includes("all");
			const isCurrentlySelected = prevSelected.includes(shipId);

			if (isCurrentlySelected) {
				const newSelection = prevSelected.filter((id) => id !== shipId);
				return newSelection.length === 0 ? ["all"] : newSelection;
			} else {
				return isCurrentlyAll ? [shipId] : [...prevSelected, shipId];
			}
		});
	}, []);

	const sortedOrders = useMemo(() => {
		return [...shipOrders].sort((a, b) => b.id - a.id);
	}, [shipOrders]);

	const processedOrders: ShipOrder[] = useMemo(() => {
		return processOrdersAndParts(sortedOrders, storageItems);
	}, [sortedOrders, storageItems]);

	const summaryOrders = useMemo(() => {
		return selectedShipTypes.includes("all")
			? shipOrders
			: shipOrders.filter((order) =>
					selectedShipTypes.includes(order.shipType.id),
				);
	}, [shipOrders, selectedShipTypes]);

	const { partNames, summaryData } = useMemo(() => {
		return getSummaryDataWithAvailability(summaryOrders, storageItems);
	}, [summaryOrders, storageItems]);

	const totalParts = useMemo(
		() => calculateTotalParts(shipOrders),
		[shipOrders],
	);

	const materialBalance: BalanceItem[] = useMemo(() => {
		const combinedData = totalParts.reduce(
			(acc, part) => {
				acc[part.name] = {
					ticker: part.name,
					need: part.quantity,
					available: 0,
					deficit: 0,
				};
				return acc;
			},
			{} as { [key: string]: BalanceItem },
		);

		storageItems.forEach((material) => {
			const ticker = material.name;
			if (!combinedData[ticker]) {
				combinedData[ticker] = {
					ticker: ticker,
					need: 0,
					available: 0,
					deficit: 0,
				};
			}
			combinedData[ticker].available = material.quantity;
		});

		const balance = Object.values(combinedData)
			.map((item) => ({
				...item,
				deficit: item.need - item.available,
			}))
			.filter((item) => item.need !== 0 || item.available !== 0);

		balance.sort((a, b) => b.deficit - a.deficit);
		return balance;
	}, [totalParts, storageItems]);

	// Order Actions callbacks
	const handleEditOrder = (orderId: string) => {
		setEditingOrderId(orderId);
	};

	const handleCancelEdit = () => {
		setEditingOrderId(null);
	};

	const handleOrderCreated = (guestPin?: string) => {
		setEditingOrderId(null);
		loadLocalOrders();
	};

	const handleDeleteOrder = async (orderId: number) => {
		const headers = mockRole === "GUEST" ? { Authorization: "none" } : {};
		const isGuest = mockRole === "GUEST";
		const url = isGuest
			? `internal/corporation/guest/ship-orders/${orderId}`
			: `internal/corporation/ship-orders/${orderId}`;

		let body: any = undefined;
		if (isGuest) {
			const guestOrdersSaved = localStorage.getItem("guest_ship_orders");
			const guestOrders = guestOrdersSaved ? JSON.parse(guestOrdersSaved) : [];
			const match = guestOrders.find((o: any) => o.id === orderId);
			body = JSON.stringify({ guestPin: match ? match.pin : "" });
		}

		try {
			const res = await fetchClient(url, {
				method: "DELETE",
				headers,
				body,
			});
			if (!res.ok) throw new Error("Failed to delete order");

			// Clean up cached PIN on successful deletion
			if (isGuest) {
				const guestOrdersSaved = localStorage.getItem("guest_ship_orders");
				const guestOrders = guestOrdersSaved
					? JSON.parse(guestOrdersSaved)
					: [];
				const filtered = guestOrders.filter(
					(o: any) =>
						o.id !== orderId && o.id.toString() !== orderId.toString(),
				);
				localStorage.setItem("guest_ship_orders", JSON.stringify(filtered));
			}

			loadLocalOrders();
		} catch (e) {
			alert(e instanceof Error ? e.message : "Error deleting order");
		}
	};

	const handleUpdateStatus = async (
		orderId: number,
		status: "QUEUED" | "APPROVED" | "IN_PRODUCTION" | "COMPLETED",
	) => {
		const headers = mockRole === "GUEST" ? { Authorization: "none" } : {};
		const url = `internal/corporation/ship-orders/${orderId}`;

		try {
			const res = await fetchClient(url, {
				method: "PUT",
				headers,
				body: JSON.stringify({ status }),
			});
			if (!res.ok) throw new Error("Failed to update status on backend");
			loadLocalOrders();
		} catch (e) {
			alert(e instanceof Error ? e.message : "Error updating status");
		}
	};

	return (
		<Box
			id="Container-Box"
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				color: "white",
				background: "transparent",
				gap: 2,
			}}
		>
			<Stack
				direction="row"
				justifyContent="flex-end"
				alignItems="center"
				spacing={2}
				sx={{
					p: 0.5,
					flexShrink: 0,
				}}
			>
				<Stack direction="row" alignItems="center" spacing={1}>
					<Typography
						variant="caption"
						sx={{ fontWeight: "bold", color: "rgba(255,255,255,0.4)" }}
					>
						Release Mode:
					</Typography>
					<ToggleButtonGroup
						color="primary"
						value={viewMode}
						exclusive
						onChange={(_, mode) => mode && setViewMode(mode)}
						size="small"
						sx={{
							height: 24,
							background: "rgba(255,255,255,0.05)",
							"& .MuiToggleButton-root": {
								color: "rgba(255,255,255,0.5)",
								borderColor: "rgba(255,255,255,0.1)",
								fontWeight: "bold",
								fontSize: "10px",
								py: 0,
								px: 1.5,
								"&.Mui-selected": {
									color: "#7b68ee",
									backgroundColor: "rgba(123, 104, 238, 0.15)",
								},
							},
						}}
					>
						<ToggleButton value="MAIN">Main</ToggleButton>
						<ToggleButton value="DEMO">Demo</ToggleButton>
					</ToggleButtonGroup>
				</Stack>
			</Stack>

			{/* Main Workspace Tabs */}
			<Box sx={{ flexGrow: 1, minHeight: 0 }}>
				<ShipProductionTabs
					MOCK_SHIP_TYPES={MOCK_SHIP_TYPES}
					handleFilterClick={handleFilterClick}
					selectedShipTypes={selectedShipTypes}
					partNames={partNames}
					summaryData={summaryData}
					isMobile={isMobile}
					processedOrders={processedOrders}
					mockRole={mockRole}
					editingOrderId={editingOrderId}
					onEditOrder={handleEditOrder}
					onCancelEdit={handleCancelEdit}
					onOrderCreated={handleOrderCreated}
					onDeleteOrder={handleDeleteOrder}
					onUpdateStatus={handleUpdateStatus}
					materialBalance={materialBalance}
					disableActions={viewMode === "MAIN"}
				/>
			</Box>
		</Box>
	);
};

export default ProductionDashboard;
