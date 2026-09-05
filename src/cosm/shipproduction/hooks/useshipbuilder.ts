import { useState, useEffect, useMemo } from "react";
import {
	STATIC_PRESETS,
	MOCK_CORP_COMPANIES,
	MOCK_CORP_USERNAMES,
} from "../utils/constants";
import { calculateDynamicStats, calculateBOM } from "../utils/formulas";
import { fetchClient } from "../../../utils/apiclient";

export interface UseShipBuilderProps {
	mockRole: "ADMIN" | "USER" | "GUEST";
	onOrderCreated: (guestPin?: string) => void;
	editingOrderId?: string | null;
}

export function useShipBuilder({
	mockRole,
	onOrderCreated,
	editingOrderId,
}: UseShipBuilderProps) {
	const [mobileActiveTab, setMobileActiveTab] = useState(0);
	const [testMode, setTestMode] = useState<boolean>(false);
	const isAdmin = mockRole === "ADMIN" || testMode;

	const [shipClass, setShipClass] = useState<"REGULAR" | "COLONY_SHIP">(
		"REGULAR",
	);
	const [selectedPresetId, setSelectedPresetId] = useState<string>(
		isAdmin ? "custom" : "lcbftl",
	);

	// DB presets state
	const [dbPresets, setDbPresets] = useState<any[]>([]);

	// Fetch DB presets when not in test mode
	useEffect(() => {
		if (!testMode) {
			const fetchDbPresets = async () => {
				const headers = mockRole === "GUEST" ? { Authorization: "none" } : {};
				try {
					const res = await fetchClient(
						"internal/corporation/ship-presets?corporation_id=COSM",
						{ headers },
					);
					let data = [];
					if (res.ok) {
						data = await res.json();
					}
					if (mockRole === "GUEST") {
						const localSaved = localStorage.getItem("local_ship_presets");
						const localPresets = localSaved ? JSON.parse(localSaved) : [];
						data = [...data, ...localPresets];
					}
					setDbPresets(data);
				} catch (e) {
					console.error("Error fetching db presets:", e);
				}
			};
			fetchDbPresets();
		} else {
			setDbPresets([]);
		}
	}, [testMode, mockRole]);

	const availablePresets = useMemo(() => {
		return testMode ? STATIC_PRESETS : dbPresets;
	}, [testMode, dbPresets]);

	// Top 14 Selectable Component States
	const [selections, setSelections] = useState<Record<string, string>>(() => {
		if (mockRole === "ADMIN") {
			return {
				STL_ENGINE: "STL_ENGINE_STANDARD",
				STL_FUEL_TANK: "STL_FUEL_TANK_SMALL",
				FTL_REACTOR: "FTL_REACTOR_STANDARD",
				FTL_FUEL_TANK: "FTL_FUEL_TANK_SMALL",
				VORTEX_REACTOR: "NONE",
				VORTEX_FUEL_TANK: "NONE",
				CARGO_BAY: "CARGO_BAY_SMALL",
				HULL_TYPE: "HULL_PLATES_BASIC",
				HEAT_SHIELD: "NONE",
				WHIPPLE_SHIELD: "NONE",
				GRAVITY_SHIELD: "NONE",
				RADIATION_SHIELD: "NONE",
				REPAIR_DRONES: "NONE",
				HIGH_G_SEATS: "NONE",
			};
		} else {
			return { ...STATIC_PRESETS[0].selections };
		}
	});

	// Metadata inputs
	const [companyCode, setCompanyCode] = useState("");
	const [username, setUsername] = useState("");
	const [specialNeeds, setSpecialNeeds] = useState("");
	const [isCorpMember, setIsCorpMember] = useState(false);
	const [isForSomeoneElse, setIsForSomeoneElse] = useState(false);

	// Price, Wait, and Pin states
	const [price, setPrice] = useState<number>(0);
	const [isCustomPrice, setIsCustomPrice] = useState<boolean>(false);
	const [waitTime, setWaitTime] = useState<number>(5);
	const [createdPin, setCreatedPin] = useState<string | null>(null);

	// Reset state if role changes or test mode toggles
	useEffect(() => {
		const defaultId = testMode
			? "lcbftl"
			: dbPresets[0]?.id?.toString() || "custom";
		setSelectedPresetId(isAdmin ? "custom" : defaultId);
		setSelections(
			isAdmin
				? {
						STL_ENGINE: "STL_ENGINE_STANDARD",
						STL_FUEL_TANK: "STL_FUEL_TANK_SMALL",
						FTL_REACTOR: "FTL_REACTOR_STANDARD",
						FTL_FUEL_TANK: "FTL_FUEL_TANK_SMALL",
						VORTEX_REACTOR: "NONE",
						VORTEX_FUEL_TANK: "NONE",
						CARGO_BAY: "CARGO_BAY_SMALL",
						HULL_TYPE: "HULL_PLATES_BASIC",
						HEAT_SHIELD: "NONE",
						WHIPPLE_SHIELD: "NONE",
						GRAVITY_SHIELD: "NONE",
						RADIATION_SHIELD: "NONE",
						REPAIR_DRONES: "NONE",
						HIGH_G_SEATS: "NONE",
					}
				: { ...STATIC_PRESETS[0].selections },
		);
	}, [isAdmin, testMode, dbPresets]);

	// Prefill logged-in user details
	useEffect(() => {
		if (
			(mockRole === "ADMIN" || mockRole === "USER") &&
			!isForSomeoneElse &&
			!editingOrderId
		) {
			setUsername("");
			setCompanyCode("");
			setIsCorpMember(true);
		} else if (isForSomeoneElse && !editingOrderId) {
			setUsername("");
			setCompanyCode("");
			setIsCorpMember(false);
		}
	}, [mockRole, isForSomeoneElse, editingOrderId]);

	// Auto correlate corporate status from typing
	useEffect(() => {
		const coNameLower = companyCode.toLowerCase();
		const userLower = username.toLowerCase();
		const matchesCorpCompany = MOCK_CORP_COMPANIES.some((name) =>
			coNameLower.includes(name),
		);
		const matchesCorpUser = MOCK_CORP_USERNAMES.some((name) =>
			userLower.includes(name),
		);

		if (matchesCorpCompany || matchesCorpUser) {
			setIsCorpMember(true);
		}
	}, [companyCode, username]);

	// Load editing order if present
	useEffect(() => {
		if (editingOrderId) {
			setTestMode(false);
			const loadEditingOrder = async () => {
				const headers = mockRole === "GUEST" ? { Authorization: "none" } : {};
				try {
					const res = await fetchClient(
						"internal/corporation/ship-orders?corporation_id=COSM",
						{ headers },
					);
					if (!res.ok) throw new Error("Failed to load orders");
					const orders = await res.json();
					const editingOrder = orders.find(
						(o: any) => o.id.toString() === editingOrderId.toString(),
					);
					if (editingOrder) {
						setCompanyCode(editingOrder.customer_company_code || "");
						setUsername(editingOrder.customer || "");
						setPrice(editingOrder.price);
						setWaitTime(editingOrder.waitTimeDays);
						setSpecialNeeds(editingOrder.notes || "");

						const shipConfig = editingOrder.shipType;
						setIsCorpMember(shipConfig.isCorpMember || false);
						if (shipConfig.systemSelections) {
							setSelections(shipConfig.systemSelections);
						}
						if (shipConfig.shipClass) {
							setShipClass(shipConfig.shipClass);
						}
						setIsCustomPrice(shipConfig.isCustomPrice || false);

						// Link preset by matching names since DB orders might not have presetId stored
						const defaultId = testMode
							? "lcbftl"
							: dbPresets[0]?.id?.toString() || "custom";
						const matchedPreset = availablePresets.find(
							(p) => p.name === shipConfig.name,
						);
						setSelectedPresetId(
							matchedPreset?.id?.toString() ||
								shipConfig.presetId ||
								(isAdmin ? "custom" : defaultId),
						);
					}
				} catch (e) {
					console.error("Error loading order for edit:", e);
				}
			};
			loadEditingOrder();
		}
	}, [editingOrderId, isAdmin, mockRole, dbPresets, availablePresets]);

	// Preset config handler
	const handlePresetChange = (presetId: string) => {
		setSelectedPresetId(presetId);
		if (presetId === "custom") {
			setIsCustomPrice(false);
		} else {
			const preset = availablePresets.find(
				(p) => p.id?.toString() === presetId?.toString(),
			);
			if (preset) {
				setShipClass(preset.shipClass || "REGULAR");
				if (preset.selections) {
					setSelections({ ...preset.selections });
				}
				setPrice(
					isCorpMember ? preset.priceCorp || preset.price : preset.price,
				);
				setIsCustomPrice(false);
			}
		}
	};

	const selectedDbPreset = useMemo(() => {
		if (testMode) return null;
		return dbPresets.find(
			(p) => p.id?.toString() === selectedPresetId?.toString(),
		);
	}, [selectedPresetId, dbPresets, testMode]);

	// Detect if selections differ from preset
	const presetDiffs = useMemo(() => {
		if (selectedPresetId === "custom" || !testMode) return [];
		const preset = STATIC_PRESETS.find((p) => p.id === selectedPresetId);
		if (!preset) return [];

		const diffs: {
			key: string;
			presetVal: string;
			currentVal: string;
			isAdded: boolean;
		}[] = [];
		Object.keys(preset.selections).forEach((k) => {
			if (selections[k] !== preset.selections[k]) {
				diffs.push({
					key: k,
					presetVal: preset.selections[k],
					currentVal: selections[k],
					isAdded: preset.selections[k] === "NONE" && selections[k] !== "NONE",
				});
			}
		});
		return diffs;
	}, [selections, selectedPresetId, testMode]);

	// Calculate Stats and BOM
	const dynamicStats = useMemo(() => {
		return calculateDynamicStats({ selections, shipClass });
	}, [selections, shipClass]);

	const {
		partsList: calculatedPartsList,
		performanceSum,
		cxTotalPrice,
	} = useMemo(() => {
		return calculateBOM(selections, dynamicStats, shipClass);
	}, [selections, dynamicStats, shipClass]);

	const partsList = useMemo(() => {
		if (selectedDbPreset) {
			return selectedDbPreset.parts;
		}
		return calculatedPartsList;
	}, [selectedDbPreset, calculatedPartsList]);

	// Price calculations
	const suggestedPrice = useMemo(() => {
		if (selectedDbPreset) {
			return isCorpMember ? selectedDbPreset.priceCorp : selectedDbPreset.price;
		}
		if (testMode) {
			return cxTotalPrice;
		}

		let baseCost = 450000;
		if (selectedPresetId !== "custom") {
			const preset = STATIC_PRESETS.find((p) => p.id === selectedPresetId);
			if (preset) baseCost = preset.price;
		} else {
			partsList.forEach((part) => {
				baseCost += 15000 * part.quantity;
			});
		}

		if (isCorpMember) {
			return Math.round(baseCost * 0.7);
		}
		return baseCost;
	}, [
		partsList,
		selectedPresetId,
		isCorpMember,
		testMode,
		cxTotalPrice,
		selectedDbPreset,
	]);

	// Correlation effect
	useEffect(() => {
		if (!isCustomPrice) {
			setPrice(suggestedPrice);
		}
		const massVal = performanceSum.weight;
		const hours = Math.round(massVal / 50);
		setWaitTime(Math.max(1, Math.round(hours / 24)));
	}, [suggestedPrice, isCustomPrice, performanceSum.weight]);

	const handleSaveOrder = async () => {
		if (testMode) {
			alert("Simulated test builds cannot create pending orders.");
			return;
		}
		if (!companyCode.trim()) {
			alert("Please enter a customer company code.");
			return;
		}

		const pin = Math.floor(100000 + Math.random() * 900000).toString();
		const headers = mockRole === "GUEST" ? { Authorization: "none" } : {};

		if (editingOrderId) {
			const isGuestOrder = mockRole === "GUEST";
			const url = isGuestOrder
				? `internal/corporation/guest/ship-orders/${editingOrderId}`
				: `internal/corporation/ship-orders/${editingOrderId}`;

			let guestPin = "";
			if (isGuestOrder) {
				const guestOrdersSaved = localStorage.getItem("guest_ship_orders");
				const guestOrders = guestOrdersSaved
					? JSON.parse(guestOrdersSaved)
					: [];
				const match = guestOrders.find(
					(o: any) => o.id.toString() === editingOrderId.toString(),
				);
				guestPin = match ? match.pin : "";
			}

			const body = {
				guestPin: guestPin || undefined,
				notes: specialNeeds,
				price: mockRole === "ADMIN" ? price : undefined,
			};

			try {
				const res = await fetchClient(url, {
					method: "PUT",
					headers,
					body: JSON.stringify(body),
				});
				if (!res.ok) throw new Error("Failed to update order");
				onOrderCreated();
			} catch (err) {
				alert(err instanceof Error ? err.message : "Error updating order");
			}
			return;
		}

		const currentPreset = availablePresets.find(
			(p) => p.id?.toString() === selectedPresetId?.toString(),
		);

		const shipTypeData = {
			id: currentPreset?.id || null,
			presetId: selectedPresetId,
			name:
				selectedPresetId === "custom"
					? shipClass === "COLONY_SHIP"
						? "Colony Build (Custom)"
						: "Custom Modular Build"
					: currentPreset?.name || "Preset Build",
			price: price,
			priceCorp: Math.round(price * 0.7),
			parts: partsList.map((p: any) => ({
				isAvailable: !!p.isAvailable,
				name: p.name,
				quantity: p.quantity,
			})),
			is_admin_preset: currentPreset?.is_admin_preset || false,
			created_by: currentPreset?.created_by || null,
			created_at: currentPreset?.created_at || null,
		};

		const url =
			mockRole === "GUEST"
				? `internal/corporation/guest/ship-orders`
				: `internal/corporation/ship-orders`;

		const body = {
			corporation_id: "COSM",
			customer: username || "Guest Customer",
			customer_company_code: companyCode,
			ownerType: mockRole === "GUEST" ? "GUEST" : "USER",
			guestPin: pin,
			shipType: shipTypeData,
			price: price,
			waitTimeDays: waitTime,
			notes: specialNeeds,
		};

		try {
			const res = await fetchClient(url, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});
			if (!res.ok) throw new Error("Failed to save order on backend");
			const resData = await res.json();

			if (mockRole === "GUEST") {
				const guestOrdersSaved = localStorage.getItem("guest_ship_orders");
				const guestOrders = guestOrdersSaved
					? JSON.parse(guestOrdersSaved)
					: [];
				guestOrders.push({ id: resData.id, pin });
				localStorage.setItem("guest_ship_orders", JSON.stringify(guestOrders));
			}

			setSelections(
				isAdmin
					? {
							STL_ENGINE: "STL_ENGINE_STANDARD",
							STL_FUEL_TANK: "STL_FUEL_TANK_SMALL",
							FTL_REACTOR: "FTL_REACTOR_STANDARD",
							FTL_FUEL_TANK: "FTL_FUEL_TANK_SMALL",
							VORTEX_REACTOR: "NONE",
							VORTEX_FUEL_TANK: "NONE",
							CARGO_BAY: "CARGO_BAY_SMALL",
							HULL_TYPE: "HULL_PLATES_BASIC",
							HEAT_SHIELD: "NONE",
							WHIPPLE_SHIELD: "NONE",
							GRAVITY_SHIELD: "NONE",
							RADIATION_SHIELD: "NONE",
							REPAIR_DRONES: "NONE",
							HIGH_G_SEATS: "NONE",
						}
					: { ...STATIC_PRESETS[0].selections },
			);

			setCompanyCode("");
			setUsername("");
			setSpecialNeeds("");
			setIsCorpMember(false);
			setIsForSomeoneElse(false);

			setCreatedPin(resData.guestPin || pin);
		} catch (err) {
			alert(err instanceof Error ? err.message : "Error saving order");
		}
	};

	const handleDeleteOrder = async () => {
		if (!editingOrderId) return;

		const confirmDelete = window.confirm(
			"Are you sure you want to delete this order?",
		);
		if (!confirmDelete) return;

		const isGuestOrder = mockRole === "GUEST";
		const url = isGuestOrder
			? `internal/corporation/guest/ship-orders/${editingOrderId}`
			: `internal/corporation/ship-orders/${editingOrderId}`;

		const headers = isGuestOrder ? { Authorization: "none" } : {};
		let body: any = undefined;
		if (isGuestOrder) {
			const guestOrdersSaved = localStorage.getItem("guest_ship_orders");
			const guestOrders = guestOrdersSaved ? JSON.parse(guestOrdersSaved) : [];
			const match = guestOrders.find(
				(o: any) => o.id.toString() === editingOrderId.toString(),
			);
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
			if (isGuestOrder) {
				const guestOrdersSaved = localStorage.getItem("guest_ship_orders");
				const guestOrders = guestOrdersSaved
					? JSON.parse(guestOrdersSaved)
					: [];
				const filtered = guestOrders.filter(
					(o: any) => o.id.toString() !== editingOrderId.toString(),
				);
				localStorage.setItem("guest_ship_orders", JSON.stringify(filtered));
			}

			alert("Order deleted successfully!");
			onOrderCreated(); // Redirect/refresh
		} catch (err) {
			alert(err instanceof Error ? err.message : "Error deleting order");
		}
	};

	const handleSystemOptionChange = (key: string, value: string) => {
		if (!isAdmin) return;
		setSelections((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	// Automatically transition presetId to "custom" if selections differ from active preset
	useEffect(() => {
		if (selectedPresetId && selectedPresetId !== "custom") {
			const preset = availablePresets.find(
				(p) => p.id?.toString() === selectedPresetId?.toString(),
			);
			if (preset && preset.selections) {
				let differs = false;
				for (const k of Object.keys(preset.selections)) {
					if (selections[k] !== preset.selections[k]) {
						differs = true;
						break;
					}
				}
				if (differs) {
					setSelectedPresetId("custom");
				}
			}
		}
	}, [selections, selectedPresetId, availablePresets]);

	const handleSavePreset = async (
		presetName: string,
		customPrice: number,
		customPriceCorp: number,
		isCorpPreset: boolean,
	) => {
		const headers = mockRole === "GUEST" ? { Authorization: "none" } : {};
		const partsMapped = partsList.map((p: any) => ({
			isAvailable: !!p.isAvailable,
			name: p.name,
			quantity: p.quantity,
		}));

		if (mockRole === "GUEST") {
			const savedPresets = localStorage.getItem("local_ship_presets");
			const guestPresets = savedPresets ? JSON.parse(savedPresets) : [];
			const newPreset = {
				id: `guest-${Date.now()}`,
				name: presetName,
				price: customPrice,
				priceCorp: customPriceCorp,
				parts: partsMapped,
				is_admin_preset: false,
			};
			guestPresets.push(newPreset);
			localStorage.setItem("local_ship_presets", JSON.stringify(guestPresets));
			alert("Preset saved locally!");
			if (!testMode) {
				setDbPresets((prev) => [...prev, newPreset]);
			}
			return;
		}

		const body = {
			corporation_id: "COSM",
			name: presetName,
			price: customPrice,
			priceCorp: customPriceCorp,
			parts: partsMapped,
			is_admin_preset: isCorpPreset,
		};

		try {
			const res = await fetchClient("internal/corporation/ship-presets", {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});
			if (!res.ok) throw new Error("Failed to save preset");
			alert("Preset saved successfully!");

			// Refresh DB presets list
			if (!testMode) {
				const fetchDbPresets = async () => {
					const headers = mockRole === "GUEST" ? { Authorization: "none" } : {};
					try {
						const res = await fetchClient(
							"internal/corporation/ship-presets?corporation_id=COSM",
							{ headers },
						);
						if (res.ok) {
							const data = await res.json();
							setDbPresets(data);
						}
					} catch (e) {
						console.error("Error fetching db presets:", e);
					}
				};
				fetchDbPresets();
			}
		} catch (err) {
			alert(err instanceof Error ? err.message : "Error saving preset");
		}
	};

	return {
		mobileActiveTab,
		setMobileActiveTab,
		testMode,
		setTestMode,
		isAdmin,
		shipClass,
		setShipClass,
		selectedPresetId,
		handlePresetChange,
		selections,
		handleSystemOptionChange,
		companyCode,
		setCompanyCode,
		username,
		setUsername,
		specialNeeds,
		setSpecialNeeds,
		isCorpMember,
		setIsCorpMember,
		isForSomeoneElse,
		setIsForSomeoneElse,
		price,
		setPrice,
		isCustomPrice,
		setIsCustomPrice,
		waitTime,
		createdPin,
		setCreatedPin,
		presetDiffs,
		dynamicStats,
		partsList,
		performanceSum,
		cxTotalPrice,
		handleSaveOrder,
		handleDeleteOrder,
		availablePresets,
		handleSavePreset,
	};
}
