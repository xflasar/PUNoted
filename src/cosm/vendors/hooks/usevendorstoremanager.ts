import { useState, useMemo, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { VendorStore, OrderItem, Location } from "../types";
import { pickPrice } from "../utils/pickprice";

const DEFAULT_LOCATION_BY_CX: Record<string, Location> = {
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

/**
 * Custom hook to manage the state of a vendor store, including its details, buy orders, and sell orders.
 * Provides handlers for adding, editing, and removing materials, as well as tracking deletions.
 *
 * @param {VendorStore | null} initialVendorStore - The initial vendor store data loaded from the server or local storage.
 * @returns {object} An object containing the managed state and updater functions.
 */
export function useVendorStoreManager(initialVendorStore: VendorStore | null) {
	const mapOrders = useCallback(
		(orders: OrderItem[]) =>
			orders.map((o) => {
				const isPriceLocked = o.price?.fixedprice === -1;
				const resolvedPrice = pickPrice({
					fixedprice: o.price?.fixedprice,
					corpprice: o.price?.corpprice,
					cxprice: o.price?.cxprice,
				}).price;
				const available =
					typeof o.available === "number"
						? o.available
						: typeof o.instore === "number"
							? o.instore
							: o.quantity;
				return {
					...o,
					frontendId: o.orderid || uuidv4(),
					isPriceLocked,
					available,
					instore: typeof o.instore === "number" ? o.instore : available,
					locationSource: o.locationSource,
					price: {
						...o.price,
						fixedprice: resolvedPrice,
					},
					fixedprice: resolvedPrice,
				};
			}),
		[],
	);

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

	const [ordersToDelete, setOrdersToDelete] = useState<string[]>([]);

	/* eslint-disable react-hooks/set-state-in-effect */
	useEffect(() => {
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
		setOrdersToDelete([]);
	}, [initialVendorStore, mapOrders]);
	/* eslint-enable react-hooks/set-state-in-effect */

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

			const defaultLocation =
				DEFAULT_LOCATION_BY_CX[localVendorDetails.cx] ||
				(material.locations || []).find(
					(loc) =>
						loc.location_code === "HRT" ||
						loc.location_name === "Hortus Station",
				) ||
				null;
			const sourceLocation = defaultLocation
				? (material.locations || []).find(
						(loc) => loc.id === defaultLocation.id,
					)
				: null;
			const copiedLocations = defaultLocation
				? [sourceLocation || defaultLocation].map((location) => {
						const stock =
							location.available ??
							location.storage_amount ??
							location.amount ??
							0;
						return {
							...location,
							amount: 0,
							available: stock,
							storage_amount: stock,
						};
					})
				: [];
			const totalAvailable = copiedLocations.reduce(
				(sum, loc) => sum + (loc.available ?? loc.storage_amount ?? 0),
				0,
			);
			const defaultPrice = pickPrice({
				fixedprice: -1,
				corpprice: material.price?.corpprice,
				cxprice: material.price?.cxprice,
			}).price;

			const newOrder: OrderItem = {
				...material,
				ordertype: type,
				frontendId: uuidv4(),
				isPriceLocked: true,
				available: totalAvailable,
				instore: totalAvailable,
				locationSource: material.locations,
				price: {
					fixedprice: defaultPrice,
					corpprice: material.price?.corpprice || 0,
					cxprice: material.price?.cxprice || 0,
				},
				fixedprice: defaultPrice,
				reserved: 0,
				orderid: undefined,
				locations: copiedLocations,
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
			field:
				| "ordertype"
				| "fixedprice"
				| "reserved"
				| "locations"
				| "priceLock",
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
						const nextFixedPrice = isLocked
							? pickPrice({
									fixedprice: -1,
									corpprice: o.price?.corpprice,
									cxprice: o.price?.cxprice,
								}).price
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
				// Handle other fields like 'reserved' or 'locations'
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

	const hydrateAvailableMaterials = useCallback((materials: OrderItem[]) => {
		const sourceByMaterialId = new Map(
			materials.map((material) => [material.materialid, material.locations]),
		);
		const quantityByMaterialId = new Map(
			materials.map((material) => [material.materialid, material.quantity]),
		);

		const hydrate = (orders: OrderItem[]) =>
			orders.map((order) => {
				const sourceLocations = sourceByMaterialId.get(order.materialid);
				const quantity = quantityByMaterialId.get(order.materialid);
				if (!sourceLocations?.length && typeof quantity !== "number")
					return order;
				return {
					...order,
					...(sourceLocations?.length
						? { locationSource: sourceLocations }
						: {}),
					...(typeof quantity === "number"
						? { available: quantity, instore: quantity }
						: {}),
				};
			});

		setBuyOrders(hydrate);
		setSellOrders(hydrate);
	}, []);

	const normalizeVendorStore = useCallback(
		(vendorStore: VendorStore) => ({
			...vendorStore,
			orders: vendorStore.orders.map((order) => {
				const sourceOrder = allOrders.find(
					(item) =>
						item.orderid === order.orderid ||
						(!item.orderid &&
							item.materialid === order.materialid &&
							item.ordertype === order.ordertype),
				);
				const sourceLocations =
					sourceOrder?.locationSource || sourceOrder?.locations;
				if (!sourceLocations?.length) return order;

				return {
					...order,
					locationSource: sourceLocations,
					locations: (order.locations || order.location || []).map(
						(location) => {
							const sourceLocation = sourceLocations.find(
								(source) => source.id === location.id,
							);
							const stock =
								sourceLocation?.available ??
								sourceLocation?.storage_amount ??
								sourceLocation?.amount ??
								location.available ??
								location.storage_amount ??
								location.amount ??
								0;
							return {
								...location,
								available: stock,
								storage_amount: stock,
							};
						},
					),
				};
			}),
		}),
		[allOrders],
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
		hydrateAvailableMaterials,
		normalizeVendorStore,
	};
}
