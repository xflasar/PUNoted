import { useEffect, useMemo, useState, useCallback } from "react";
import { Box } from "@mui/material";
import { addDays } from "date-fns";
import MaterialBalanceTable, { BalanceItem } from "./MaterialBalanceTable";
import ShipProductionTabs from "./ShipProductionTabs";
import { ShipOrder, ShipType, Part } from "./ShipOrders";
import { SummaryDataItem } from "./ShipProductionTable";

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

/**
 * Represents the structure of a ship order received from the API.
 */
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

/**
 * Represents the structure of a storage item received from the API.
 */
interface ApiStorageItem {
	ticker: string;
	quantity: number;
}

/**
 * Calculates the total quantities of each tracked part required across all orders.
 * Only parts included in the PartsFilter are tallied.
 *
 * @param orders - The list of all ship orders.
 * @returns An array of objects detailing the total required quantity per part name.
 */
const calculateTotalParts = (orders: ShipOrder[]) => {
	const totalParts: { [key: string]: number } = {};
	orders.forEach((order) => {
		order.shipType.parts.forEach((part) => {
			if (PartsFilter.includes(part.name)) {
				totalParts[part.name] = (totalParts[part.name] || 0) + part.quantity;
			}
		});
	});
	return Object.entries(totalParts).map(([name, quantity]) => ({
		name,
		quantity,
	}));
};

/**
 * Evaluates the parts required for a given list of orders against the available storage inventory.
 * Deducts quantities from the available pool as it processes each order sequentially.
 *
 * @param orders - The list of ship orders to process.
 * @param currentStorageItems - The current inventory of parts.
 * @returns A new list of orders with part availabilities evaluated.
 */
const processOrdersAndParts = (
	orders: ShipOrder[],
	currentStorageItems: Part[],
): ShipOrder[] => {
	const availableParts = new Map<string, number>(
		currentStorageItems.map((p) => [p.name, p.quantity]),
	);

	return orders.map((order) => {
		const processedOrder = { ...order, processedParts: [] as Part[] };
		const partsStatus = order.shipType.parts
			.filter((part) => PartsFilter.includes(part.name))
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

/**
 * Generates the summarized data matrix for the production table.
 * Evaluates part availability across orders, prioritizing earlier orders.
 *
 * @param orders - The list of filtered ship orders to summarize.
 * @param currentStorageItems - The current inventory of parts.
 * @returns An object containing the unique part names and the row data for the table.
 */
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
		order.shipType.parts
			.filter((part) => PartsFilter.includes(part.name))
			.forEach((part) => allParts.add(part.name));
	});
	const partNames = Array.from(allParts).sort();

	const summaryData: SummaryDataItem[] = inProgressOrders.map((order) => {
		const partsMap = new Map<string, number>(
			order.shipType.parts.map((p) => [p.name, p.quantity]),
		);
		const row: SummaryDataItem = {
			combinedHeader: `${order.shipType.name} (${order.customer})`,
		};

		partNames.forEach((partName) => {
			const requiredQuantity = partsMap.get(partName) || 0;
			const availableQuantity = availableParts.get(partName) || 0;
			let isAvailable = false;

			if (availableQuantity >= requiredQuantity) {
				if (availableQuantity === 0) {
					isAvailable = false;
				} else {
					isAvailable = true;
				}
			}

			if (isAvailable) {
				availableParts.set(partName, availableQuantity - requiredQuantity);
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

/**
 * Props for the ProductionDashboard component.
 */
interface ProductionDashboardProps {
	/** Indicates whether the application is viewed on a mobile device. */
	isMobile: boolean;
}

/**
 * Main dashboard component for managing and viewing ship production.
 * Fetches order and inventory data, calculates material balances, and provides filtering.
 *
 * @param props - The component props.
 * @returns The rendered dashboard component.
 */
const ProductionDashboard: React.FC<ProductionDashboardProps> = ({
	isMobile,
}) => {
	const [shipOrders, setShipOrders] = useState<ShipOrder[]>([]);
	const [storageItems, setStorageItems] = useState<Part[]>([]);
	const [selectedShipTypes, setSelectedShipTypes] = useState<string[]>(["all"]);

	/**
	 * Fetches the current ship orders and available storage items from the API.
	 *
	 * @param useFio - Boolean flag indicating if external FIO data should be used.
	 */
	const fetchShipProduction = useCallback(async (useFio: boolean) => {
		try {
			const response = await fetch(
				"https://api.punoted.net/get_ship_production",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ fio: useFio }),
				},
			);
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
							console.warn(
								`ShipType "${item.shiptype}" not found in MOCK_SHIP_TYPES. Using "all" as default.`,
							);
							return {
								id: item.orderid,
								customer: item.username,
								shipType: MOCK_SHIP_TYPES[0],
								price: item.price,
								waitTimeDays: item.orderwaittime,
								completionDate: addDays(new Date(), item.orderwaittime),
								processedParts: [],
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
				setShipOrders(fetchedOrders);
				setStorageItems(fetchedStorageItems);
			} else {
				console.error(
					"API response indicates failure or data is not an array:",
					apiResponse,
				);
			}
		} catch (error) {
			console.error("Failed to fetch ship production data:", error);
		}
	}, []);

	useEffect(() => {
		fetchShipProduction(true);
	}, [fetchShipProduction]);

	/**
	 * Toggles the selection state of a ship type filter.
	 * Ensures that selecting a specific type unselects "all", and vice versa.
	 *
	 * @param shipIdRaw - The identifier of the ship type to toggle.
	 */
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

	return (
		<Box
			id="Container-Box"
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				color: "white",
				background: "transparent",
			}}
		>
			<Box sx={{ height: "15%", minHeight: 0 }}>
				<MaterialBalanceTable data={materialBalance} />
			</Box>

			<Box sx={{ height: "85%", minHeight: 0 }}>
				<ShipProductionTabs
					MOCK_SHIP_TYPES={MOCK_SHIP_TYPES}
					handleFilterClick={handleFilterClick}
					selectedShipTypes={selectedShipTypes}
					partNames={partNames}
					summaryData={summaryData}
					isMobile={isMobile}
					processedOrders={processedOrders}
				/>
			</Box>
		</Box>
	);
};

export default ProductionDashboard;
