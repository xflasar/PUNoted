import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../config/api";
import type { OrderItem } from "../types";
import { pickPrice } from "../utils/pickPrice";

/**
 * Parses the FIO inventory CSV based on the fixed column format provided:
 * [0: User], [1: ShortCode], [2: Location], [3: StoreType], [4: Ticker], [5: Amount]
 * and returns a map of Ticker (Col 4) to Quantity (Col 5).
 *
 * @param {string} csvText - The raw CSV text from FIO.
 * @returns {Map<string, number>} A map containing material tickers as keys and quantities as values.
 */
const parseFioInventoryCsv = (csvText: string): Map<string, number> => {
	const lines = csvText.split("\n").filter((line) => line.trim() !== "");
	if (lines.length === 0) return new Map();

	const inventoryMap = new Map<string, number>();
	const shortCodeFilter = "HRT";
	const locationNameFilter = "Hortus Station";

	for (const line of lines) {
		const values = line.split(",");
		if (values.length >= 6) {
			const shortCode = values[1].trim();
			const locationName = values[2].trim();
			const ticker = values[4].trim();
			const amount = parseFloat(values[5].trim());

			const isHortus =
				shortCode === shortCodeFilter || locationName === locationNameFilter;
			if (isHortus && ticker && !isNaN(amount)) {
				inventoryMap.set(ticker, Math.floor(amount));
			}
		}
	}
	return inventoryMap;
};

/**
 * Custom hook to fetch available materials and merge with FIO inventory if applicable.
 *
 * @param {string} cx - The current Commodity Exchange (CX) selected by the user.
 * @param {boolean} isOpen - Indicates whether the modal/context is open (to prevent unnecessary fetching).
 * @param {(map: Map<string, number>) => void} setStoreInstoreAmounts - Callback to update the parent component's in-store amounts.
 * @returns {object} An object containing the list of available materials.
 */
export function useAvailableMaterials(
	cx: string,
	isOpen: boolean,
	setStoreInstoreAmounts: (map: Map<string, number>) => void,
) {
	const [materials, setMaterials] = useState<OrderItem[]>([]);

	useEffect(() => {
		if (!cx || !isOpen) return;

		let isMounted = true;
		const fetchMaterials = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}materials_price_list`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
					body: JSON.stringify({ cx }),
				});

				if (!response.ok) throw new Error("Failed to fetch materials");

				const data = await response.json();

				const instoreMap = new Map<string, number>();
				const availableMaterials: OrderItem[] = data.materials.map(
					(mat: any) => {
						const resolvedCorpPrice = pickPrice({
							fixedprice: -1,
							corpprice: mat.corpprice,
							cxprice: mat.askprice,
						}).price;
						instoreMap.set(mat.materialid, mat.quantity);
						return {
							materialid: mat.materialid,
							materialticker: mat.ticker,
							fixedprice: resolvedCorpPrice,
							corpprice: mat.corpprice || 0,
							frontendId: mat.materialid,
							isDisabled: false,
							instore: mat.quantity,
							reserved: 0,
							quantity: 0,
							price: {
								fixedprice: resolvedCorpPrice,
								cxprice: mat.askprice || 0,
								corpprice: mat.corpprice || 0,
							},
						} as OrderItem;
					},
				);

				const fioApiKey = localStorage.getItem("fioApiKey");
				const displayName = localStorage.getItem("displayName");
				const isSynchronized = localStorage.getItem("isSynchronized");

				let finalInstoreMap = instoreMap;

				if (fioApiKey && displayName && isSynchronized !== "true") {
					const fioUrl = `https://rest.fnar.net/csv/inventory?apikey=${fioApiKey}&username=${displayName}`;
					try {
						const fioResponse = await fetch(fioUrl);
						if (fioResponse.ok) {
							const csvText = await fioResponse.text();
							const fioInventoryMap = parseFioInventoryCsv(csvText);
							finalInstoreMap = new Map(instoreMap);
							fioInventoryMap.forEach((fioQuantity, materialTicker) => {
								const materialToUpdate = availableMaterials.find(
									(m) => m.materialticker === materialTicker,
								);
								if (materialToUpdate) {
									finalInstoreMap.set(materialToUpdate.materialid, fioQuantity);
								}
							});
						}
					} catch (fioErr) {
						console.error("Error fetching or processing FIO data:", fioErr);
					}
				}

				if (isMounted) {
					const finalAvailableMaterials = availableMaterials.map((mat) => ({
						...mat,
						instore: finalInstoreMap.get(mat.materialid) || 0,
					}));
					setMaterials(finalAvailableMaterials);
					setStoreInstoreAmounts(finalInstoreMap);
				}
			} catch (err) {
				console.error("Failed to fetch materials:", err);
				if (isMounted) {
					setMaterials([]);
				}
			}
		};

		fetchMaterials();

		return () => {
			isMounted = false;
		};
	}, [isOpen, cx, setStoreInstoreAmounts]);

	return {
		materials,
	};
}
