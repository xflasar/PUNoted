import { useState, useMemo, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { VendorStore, OrderItem, Location } from "../types";

/**
 * Custom hook to manage the state of a vendor store, including its details, buy orders, and sell orders.
 * Provides handlers for adding, editing, and removing materials, as well as tracking deletions.
 *
 * @param {VendorStore | null} initialVendorStore - The initial vendor store data loaded from the server or local storage.
 * @returns {object} An object containing the managed state and updater functions.
 */
export function useVendorStoreManager(initialVendorStore: VendorStore | null) {
	const mapOrders = (orders: OrderItem[]) =>
		orders.map((o) => {
			const corpPrice = o.price?.corpprice || 0;
			const isPriceLocked = o.price?.fixedprice === -1;
			return {
				...o,
				frontendId: o.orderid || uuidv4(),
				isPriceLocked,
				price: {
					...o.price,
					fixedprice: isPriceLocked ? corpPrice : o.price?.fixedprice || 0,
				},
				fixedprice: isPriceLocked ? corpPrice : o.price?.fixedprice || 0,
			};
		});

	const [prevStore, setPrevStore] = useState(initialVendorStore);

	const [localVendorDetails, setLocalVendorDetails] = useState(() => ({
		companyName: "",
		gameName: "",
		companyCode: "",
		corpName: "",
		cx: "IC1",
	}));

	const [buyOrders, setBuyOrders] = useState<OrderItem[]>(() =>
		initialVendorStore
			? mapOrders(
					initialVendorStore.orders.filter((o) => o.ordertype === "buy"),
				)
			: [],
	);

	const [sellOrders, setSellOrders] = useState<OrderItem[]>(() =>
		initialVendorStore
			? mapOrders(
					initialVendorStore.orders.filter((o) => o.ordertype === "sell"),
				)
			: [],
	);

	if (initialVendorStore !== prevStore) {
		setPrevStore(initialVendorStore);

		setLocalVendorDetails({
			companyName: initialVendorStore?.vendor.companyname || "",
			gameName: initialVendorStore?.vendor.gamename || "",
			companyCode: initialVendorStore?.vendor.companycode || "",
			corpName: initialVendorStore?.vendor.corpname || "",
			cx: initialVendorStore?.vendor.cx || "IC1",
		});

		setBuyOrders(
			initialVendorStore
				? mapOrders(
						initialVendorStore.orders.filter((o) => o.ordertype === "buy"),
					)
				: [],
		);
		setSellOrders(
			initialVendorStore
				? mapOrders(
						initialVendorStore.orders.filter((o) => o.ordertype === "sell"),
					)
				: [],
		);
	}

	const [ordersToDelete, setOrdersToDelete] = useState<string[]>([]);

	const CX_DEFAULT_LOCATIONS: Record<string, Location> = {
		AI1: {
			id: "1deca369a92788b8079e7ac245be66f7",
			location_name: "Antares Station",
			location_code: "ANT",
			amount: 0,
			storage_amount: 0,
		},
		CI1: {
			id: "3cb9c89bfdf03513a91023e07c90dc08",
			location_name: "Benten Station",
			location_code: "BEN",
			amount: 0,
			storage_amount: 0,
		},
		CI2: {
			id: "e072c5af2d942ac7acb5b729d0215289",
			location_name: "Arclight Station",
			location_code: "ARC",
			amount: 0,
			storage_amount: 0,
		},
		IC1: {
			id: "0deca369a92788b8079e7ac245be66f7",
			location_name: "Hortus Station",
			location_code: "HRT",
			amount: 0,
			storage_amount: 0,
		},
		NC1: {
			id: "299e4c9b1d2d9fc0f45340cf7e54e005",
			location_name: "Moria Station",
			location_code: "MOR",
			amount: 0,
			storage_amount: 0,
		},
		NC2: {
			id: "e33bef6d0395b053aaf293fc887acf2b",
			location_name: "Hubur Station",
			location_code: "HUB",
			amount: 0,
			storage_amount: 0,
		},
	};

	const allOrders = useMemo(
		() => [...buyOrders, ...sellOrders],
		[buyOrders, sellOrders],
	);

	const handleAddMaterial = useCallback(
		(material: OrderItem, type: "buy" | "sell" = "buy") => {
			if (
				allOrders.some(
					(mat) =>
						mat.materialticker === material.materialticker &&
						mat.ordertype === type,
				)
			)
				return;

			const defaultLocation = CX_DEFAULT_LOCATIONS[localVendorDetails.cx] || "";

			const newOrder: OrderItem = {
				...material,
				ordertype: type,
				frontendId: uuidv4(),
				isPriceLocked: true,
				price: {
					fixedprice: material.price?.corpprice || 0,
					corpprice: material.price?.corpprice || 0,
					cxprice: material.price?.cxprice || 0,
				},
				fixedprice: material.price?.corpprice || 0,
				reserved: 0,
				orderid: undefined,
				location: defaultLocation ? [defaultLocation] : [],
			};

			if (type === "buy") {
				setBuyOrders((prev) => [...prev, newOrder]);
			} else {
				setSellOrders((prev) => [...prev, newOrder]);
			}
		},
		[allOrders, localVendorDetails.cx],
	);

	const handleEditMaterial = useCallback(
		(
			frontendId: string | undefined,
			field: "ordertype" | "fixedprice" | "reserved" | "location" | "priceLock",
			value: string | number | boolean | null | Location[],
		) => {
			const order = allOrders.find((o) => o.frontendId === frontendId);
			if (!order) return;

			if (field === "ordertype") {
				const newType = value as "buy" | "sell";
				if (order.ordertype === "buy" && newType === "sell") {
					setBuyOrders((prev) =>
						prev.filter((o) => o.frontendId !== frontendId),
					);
					setSellOrders((prev) => [...prev, { ...order, ordertype: newType }]);
				} else if (order.ordertype === "sell" && newType === "buy") {
					setSellOrders((prev) =>
						prev.filter((o) => o.frontendId !== frontendId),
					);
					setBuyOrders((prev) => [...prev, { ...order, ordertype: newType }]);
				}
			} else if (field === "fixedprice") {
				const updateFn = (prev: OrderItem[]) =>
					prev.map((o) =>
						o.frontendId === frontendId
							? {
									...o,
									price: {
										...o.price,
										fixedprice: value as number,
										corpprice: o.price?.corpprice || 0,
										cxprice: o.price?.cxprice || 0,
									},
									fixedprice: value as number,
								}
							: o,
					);

				if (order.ordertype === "buy") {
					setBuyOrders(updateFn);
				} else {
					setSellOrders(updateFn);
				}
			} else if (field === "priceLock") {
				const isLocked = Boolean(value);
				const updateFn = (prev: OrderItem[]) =>
					prev.map((o) => {
						if (o.frontendId !== frontendId) return o;
						const corpPrice = o.price?.corpprice || 0;
						const nextFixedPrice = isLocked
							? corpPrice
							: o.price?.fixedprice || o.fixedprice || 0;
						return {
							...o,
							isPriceLocked: isLocked,
							price: {
								...o.price,
								fixedprice: nextFixedPrice,
							},
							fixedprice: nextFixedPrice,
						};
					});

				if (order.ordertype === "buy") {
					setBuyOrders(updateFn);
				} else {
					setSellOrders(updateFn);
				}
			} else {
				// Handle other fields like 'reserved' or 'location'
				const updateFn = (prev: OrderItem[]) =>
					prev.map((o) =>
						o.frontendId === frontendId ? { ...o, [field]: value } : o,
					);

				if (order.ordertype === "buy") {
					setBuyOrders(updateFn);
				} else {
					setSellOrders(updateFn);
				}
			}
		},
		[allOrders, setBuyOrders, setSellOrders],
	);

	const handleRemoveMaterial = useCallback(
		(frontendId: string | undefined, type: "buy" | "sell" | undefined) => {
			const remover = (prev: OrderItem[]) => {
				const orderToRemove = prev.find((o) => o.frontendId === frontendId);
				if (orderToRemove?.orderid) {
					setOrdersToDelete((p) => [...p, orderToRemove.orderid!]);
				}
				return prev.filter((o) => o.frontendId !== frontendId);
			};

			if (type === "buy") {
				setBuyOrders(remover);
			} else if (type === "sell") {
				setSellOrders(remover);
			}
		},
		[setOrdersToDelete, setBuyOrders, setSellOrders],
	);

	const setStoreInstoreAmounts = useCallback(
		(instoreMap: Map<string, number>) => {
			const updateInstore = (orders: OrderItem[]) =>
				orders.map((order) => ({
					...order,
					instore: instoreMap.get(order.materialid) || order.instore || 0,
				}));
			setBuyOrders(updateInstore);
			setSellOrders(updateInstore);
		},
		[],
	);

	return {
		localVendorDetails,
		buyOrders,
		sellOrders,
		allOrders,
		ordersToDelete,
		handleAddMaterial,
		handleEditMaterial,
		handleRemoveMaterial,
		setOrdersToDelete,
		setStoreInstoreAmounts,
	};
}
