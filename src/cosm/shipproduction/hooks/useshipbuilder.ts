import { useState, useEffect, useMemo } from "react";
import { STATIC_PRESETS, MOCK_CORP_COMPANIES, MOCK_CORP_USERNAMES } from "../utils/constants";
import { calculateDynamicStats, calculateBOM } from "../utils/formulas";

export interface UseShipBuilderProps {
	mockRole: "ADMIN" | "USER" | "GUEST";
	onOrderCreated: (guestPin?: string) => void;
	editingOrderId?: string | null;
}

export function useShipBuilder({ mockRole, onOrderCreated, editingOrderId }: UseShipBuilderProps) {
	const [mobileActiveTab, setMobileActiveTab] = useState(0);
	const [testMode, setTestMode] = useState<boolean>(false);
	const isAdmin = mockRole === "ADMIN" || testMode;

	const [shipClass, setShipClass] = useState<"REGULAR" | "COLONY_SHIP">("REGULAR");
	const [selectedPresetId, setSelectedPresetId] = useState<string>(isAdmin ? "custom" : "lcbftl");

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
		setSelectedPresetId(isAdmin ? "custom" : "lcbftl");
		setSelections(isAdmin ? {
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
		} : { ...STATIC_PRESETS[0].selections });
	}, [isAdmin]);

	// Prefill logged-in user details
	useEffect(() => {
		if ((mockRole === "ADMIN" || mockRole === "USER") && !isForSomeoneElse && !editingOrderId) {
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
		const matchesCorpCompany = MOCK_CORP_COMPANIES.some((name) => coNameLower.includes(name));
		const matchesCorpUser = MOCK_CORP_USERNAMES.some((name) => userLower.includes(name));

		if (matchesCorpCompany || matchesCorpUser) {
			setIsCorpMember(true);
		}
	}, [companyCode, username]);

	// Load editing order if present
	useEffect(() => {
		if (editingOrderId) {
			const saved = localStorage.getItem("mock_ship_orders");
			if (saved) {
				const orders = JSON.parse(saved);
				const editingOrder = orders.find((o: any) => o.id.toString() === editingOrderId.toString());
				if (editingOrder) {
					const customerStr = editingOrder.customer || "";
					const parts = customerStr.split(" | ");
					let coName = customerStr;
					let usrName = "";

					parts.forEach((p: string) => {
						if (p.startsWith("User: ")) usrName = p.replace("User: ", "");
						else coName = p;
					});

					setCompanyCode(coName);
					setUsername(usrName);
					setPrice(editingOrder.price);
					setWaitTime(editingOrder.waitTimeDays);
					setSpecialNeeds(editingOrder.notes || "");
					setIsCorpMember(editingOrder.shipType.isCorpMember || false);
					if (editingOrder.shipType.systemSelections) {
						setSelections(editingOrder.shipType.systemSelections);
					}
					if (editingOrder.shipType.shipClass) {
						setShipClass(editingOrder.shipType.shipClass);
					}
					setIsCustomPrice(editingOrder.shipType.isCustomPrice || false);
					setSelectedPresetId(editingOrder.shipType.presetId || (isAdmin ? "custom" : "lcbftl"));
				}
			}
		}
	}, [editingOrderId, isAdmin]);

	// Preset config handler
	const handlePresetChange = (presetId: string) => {
		setSelectedPresetId(presetId);
		if (presetId === "custom") {
			setIsCustomPrice(false);
		} else {
			const preset = STATIC_PRESETS.find((p) => p.id === presetId);
			if (preset) {
				setShipClass(preset.shipClass);
				setSelections({ ...preset.selections });
				setPrice(preset.price);
				setIsCustomPrice(false);
			}
		}
	};

	// Detect if selections differ from preset
	const presetDiffs = useMemo(() => {
		if (selectedPresetId === "custom") return [];
		const preset = STATIC_PRESETS.find((p) => p.id === selectedPresetId);
		if (!preset) return [];

		const diffs: { key: string; presetVal: string; currentVal: string; isAdded: boolean }[] = [];
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
	}, [selections, selectedPresetId]);

	// Calculate Stats and BOM
	const dynamicStats = useMemo(() => {
		return calculateDynamicStats({ selections, shipClass });
	}, [selections, shipClass]);

	const { partsList, performanceSum, cxTotalPrice } = useMemo(() => {
		return calculateBOM(selections, dynamicStats, shipClass);
	}, [selections, dynamicStats, shipClass]);

	// Price calculations
	const suggestedPrice = useMemo(() => {
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
	}, [partsList, selectedPresetId, isCorpMember, testMode, cxTotalPrice]);

	// Correlation effect
	useEffect(() => {
		if (!isCustomPrice) {
			setPrice(suggestedPrice);
		}
		const massVal = performanceSum.weight;
		const hours = Math.round(massVal / 50);
		setWaitTime(Math.max(1, Math.round(hours / 24)));
	}, [suggestedPrice, isCustomPrice, performanceSum.weight]);

	const handleSaveOrder = () => {
		if (testMode) {
			alert("Simulated test builds cannot create pending orders.");
			return;
		}
		if (!companyCode.trim()) {
			alert("Please enter a customer company code.");
			return;
		}

		const pin = Math.floor(100000 + Math.random() * 900000).toString();
		setCreatedPin(pin);
	};

	const handleConfirmOrder = () => {
		if (!companyCode.trim()) return;

		const saved = localStorage.getItem("mock_ship_orders");
		let currentOrders = saved ? JSON.parse(saved) : [];

		const pin = createdPin || Math.floor(100000 + Math.random() * 900000).toString();
		const formattedCustomerName = `${companyCode}${username ? ` | User: ${username}` : ""}${pin ? ` | Code: ${pin}` : ""}`;

		const orderObj = {
			id: editingOrderId ? Number(editingOrderId) : Date.now(),
			customer: formattedCustomerName,
			status: editingOrderId ? undefined : (mockRole === "ADMIN" ? "APPROVED" : "PENDING_APPROVAL"),
			ownerType: editingOrderId ? undefined : (mockRole === "GUEST" ? "GUEST" : "USER"),
			ownerId: editingOrderId ? undefined : (mockRole === "USER" ? "USR-999" : undefined),
			guestPin: pin,
			price: price,
			waitTimeDays: waitTime,
			completionDate: new Date(Date.now() + waitTime * 24 * 60 * 60 * 1000).toISOString(),
			createdAt: new Date().toISOString(),
			notes: specialNeeds,
			shipType: {
				id: selectedPresetId,
				presetId: selectedPresetId,
				name: selectedPresetId === "custom"
					? (shipClass === "COLONY_SHIP" ? "Colony Build (Custom)" : "Custom Modular Build")
					: STATIC_PRESETS.find(p => p.id === selectedPresetId)?.name || "Preset Build",
				parts: partsList,
				systemSelections: selections,
				shipClass: shipClass,
				isCustomPrice: isCustomPrice,
				isCorpMember: isCorpMember,
				price: price,
				priceCorp: Math.round(price * 0.7),
			},
		};

		if (editingOrderId) {
			currentOrders = currentOrders.map((o: any) => {
				if (o.id.toString() === editingOrderId.toString()) {
					return {
						...o,
						customer: orderObj.customer,
						price: orderObj.price,
						waitTimeDays: orderObj.waitTimeDays,
						notes: orderObj.notes,
						shipType: orderObj.shipType,
					};
				}
				return o;
			});
		} else {
			currentOrders.push(orderObj);
		}

		localStorage.setItem("mock_ship_orders", JSON.stringify(currentOrders));

		setSelections(isAdmin ? {
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
		} : { ...STATIC_PRESETS[0].selections });

		setCompanyCode("");
		setUsername("");
		setSpecialNeeds("");
		setIsCorpMember(false);
		setIsForSomeoneElse(false);
		setCreatedPin(null);

		onOrderCreated();
	};

	const handleSystemOptionChange = (key: string, value: string) => {
		if (!isAdmin) return;
		setSelections((prev) => ({
			...prev,
			[key]: value,
		}));
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
		handleConfirmOrder,
	};
}
