import React, { useState, useMemo, useEffect } from "react";
import {
	Box,
	Paper,
	Typography,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	TablePagination,
	TableSortLabel,
	TextField,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Stack,
	Chip,
	Tooltip,
	Grid,
	InputAdornment,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	ToggleButtonGroup,
	ToggleButton,
	Autocomplete,
	Slider,
} from "@mui/material";
import {
	Search,
	TrendingUp,
	Award,
	Layers,
	Plus,
	ExternalLink,
	ShieldCheck,
	ShieldAlert,
	Zap,
	BarChart2,
	ArrowRight,
	Grid as GridIcon,
	List as ListIcon,
	Sparkles,
	Sliders,
} from "lucide-react";
import MaterialBadge from "../cosm/components/materialbadge";
import { fetchClient } from "../utils/apiclient";
import { useNavigate } from "react-router-dom";

export interface ArbitrageFinderProps {
	marketData: Record<string, any>[];
}

export interface CustomShipPreset {
	id: string;
	name: string;
	volume: number; // m³
	mass: number; // tons
	hullType: "SMALL" | "MEDIUM" | "HEAVY" | "SUPER";
}

const DEFAULT_PRESETS: CustomShipPreset[] = [
	{
		id: "PIONEER",
		name: "Pioneer (Small Freighter)",
		volume: 500,
		mass: 100,
		hullType: "SMALL",
	},
	{
		id: "HERCULES",
		name: "Hercules (Medium Transport)",
		volume: 2000,
		mass: 500,
		hullType: "MEDIUM",
	},
	{
		id: "PROMETHEUS",
		name: "Prometheus (Heavy Hauler)",
		volume: 5000,
		mass: 1500,
		hullType: "HEAVY",
	},
	{
		id: "ENTERPRISE",
		name: "Enterprise (Super Transport)",
		volume: 12000,
		mass: 4000,
		hullType: "SUPER",
	},
];

const STANDARD_CARGO_BAYS = [
	{ label: "Tiny Cargo Bay", volume: 100, mass: 100 },
	{ label: "Very Small Cargo Bay", volume: 250, mass: 250 },
	{ label: "Small Cargo Bay", volume: 500, mass: 500 },
	{ label: "Medium Cargo Bay", volume: 1000, mass: 1000 },
	{ label: "Large Cargo Bay", volume: 2000, mass: 2000 },
	{ label: "High-Volume Cargo Bay", volume: 3000, mass: 1000 },
	{ label: "High-Load Cargo Bay", volume: 1000, mass: 3000 },
	{ label: "Huge Cargo Bay", volume: 5000, mass: 5000 },
];

const EXCHANGES = ["IC1", "AI1", "CI1", "CI2", "NC1", "NC2"];

const ROUTE_DISTANCES: Record<string, number> = {
	"IC1-AI1": 12.5,
	"IC1-CI1": 18.2,
	"IC1-CI2": 15.0,
	"IC1-NC1": 22.4,
	"IC1-NC2": 26.0,
	"AI1-CI1": 9.8,
	"AI1-CI2": 14.2,
	"AI1-NC1": 20.1,
	"AI1-NC2": 24.5,
	"CI1-CI2": 8.5,
	"CI1-NC1": 25.0,
	"CI1-NC2": 28.2,
	"CI2-NC1": 21.0,
	"CI2-NC2": 23.8,
	"NC1-NC2": 11.0,
};

const getRouteDistance = (src: string, dst: string): number => {
	const k1 = `${src}-${dst}`;
	const k2 = `${dst}-${src}`;
	return ROUTE_DISTANCES[k1] || ROUTE_DISTANCES[k2] || 15.0;
};

const HULL_MULTIPLIERS: Record<string, number> = {
	SMALL: 1.5,
	MEDIUM: 3.0,
	HEAVY: 7.5,
	SUPER: 15.0,
};

type SortField =
	| "ticker"
	| "estHours"
	| "historyWeight"
	| "buyPrice"
	| "instantNetProfit"
	| "expectedNetProfit";
type SortOrder = "asc" | "desc" | "none";

function useDebouncedValue<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = useState<T>(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);
	return debounced;
}

export const ArbitrageFinder: React.FC<ArbitrageFinderProps> = ({
	marketData,
}) => {
	const navigate = useNavigate();

	// Sub-Tab Switcher: 'list' vs 'matrix'
	const [subTab, setSubTab] = useState<"list" | "matrix">("list");
	const [selectedMatrixTicker, setSelectedMatrixTicker] =
		useState<string>("AUR");

	// Timeframe Selector: 1D, 7D, 30D, CUSTOM
	const [timeframe, setTimeframe] = useState<"1" | "7" | "30" | "custom">("30");
	const [customDaysRaw, setCustomDaysRaw] = useState<number>(14);

	// Real Backend Time-Series Stability Map
	const [stabilityMap, setStabilityMap] = useState<
		Record<
			string,
			{ avg_price: number; avg_supply: number; stability_score: number }
		>
	>({});

	// Presets & User Ships
	const [presets, setPresets] = useState<CustomShipPreset[]>(() => {
		try {
			const saved = localStorage.getItem("cx_user_ship_presets");
			if (saved) return JSON.parse(saved);
		} catch (e) {
			console.error("Failed to load local ship presets", e);
		}
		return DEFAULT_PRESETS;
	});

	const [userShips, setUserShips] = useState<any[]>([]);
	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
	const [selectedShipId, setSelectedShipId] = useState<string>("HERCULES");

	// Cargo Capacity Controls (% Load Slider & Direct m³ / t inputs)
	const [cargoLoadPercent, setCargoLoadPercent] = useState<number>(100);
	const [cargoVolumeRaw, setCargoVolumeRaw] = useState<number>(2000);
	const [cargoMassRaw, setCargoMassRaw] = useState<number>(500);

	// Raw filter inputs
	const [searchRaw, setSearchRaw] = useState<string>("");
	const [srcFilter, setSrcFilter] = useState<string>("ALL");
	const [dstFilter, setDstFilter] = useState<string>("ALL");
	const [fuelPriceRaw, setFuelPriceRaw] = useState<number>(18.0);
	const [minMarginRaw, setMinMarginRaw] = useState<number>(-999);
	const [minProfitRaw, setMinProfitRaw] = useState<number>(-999999);

	// Custom Buy Simulator inputs (by ticker)
	const [customBuyPrices, setCustomBuyPrices] = useState<
		Record<string, number>
	>({});
	const [customBuyQtys, setCustomBuyQtys] = useState<Record<string, number>>(
		{},
	);

	// Debounced filter values
	const searchQuery = useDebouncedValue(searchRaw, 300);
	const fuelPrice = useDebouncedValue(fuelPriceRaw, 300);
	const minMargin = useDebouncedValue(minMarginRaw, 300);
	const minProfit = useDebouncedValue(minProfitRaw, 300);
	const customDays = useDebouncedValue(customDaysRaw, 300);

	// Pagination & 3-State Sorting State
	const [page, setPage] = useState<number>(0);
	const [rowsPerPage, setRowsPerPage] = useState<number>(25);
	const [sortField, setSortField] = useState<SortField>("expectedNetProfit");
	const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

	// Preset Modal Builder state
	const [builderOpen, setBuilderOpen] = useState<boolean>(false);
	const [newShipName, setNewShipName] = useState<string>("");
	const [newShipVol, setNewShipVol] = useState<number>(1500);
	const [newShipMass, setNewShipMass] = useState<number>(400);
	const [newShipHull, setNewShipHull] = useState<
		"SMALL" | "MEDIUM" | "HEAVY" | "SUPER"
	>("MEDIUM");

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (token) {
			setIsLoggedIn(true);
			fetchClient("internal/ships/")
				.then((res) => res.json())
				.then((data) => Array.isArray(data) && setUserShips(data))
				.catch(() => {
					fetchClient("ships/user")
						.then((r) => r.json())
						.then((d) => Array.isArray(d) && setUserShips(d))
						.catch(() => {});
				});
		}
	}, []);

	// Update cargo inputs when a ship or preset is selected
	useEffect(() => {
		const uShip = userShips.find(
			(s) =>
				(s.ShipRegistration || s.registration || s.shipname || s.id) ===
				selectedShipId,
		);
		if (uShip) {
			const vol =
				uShip.CargoVolume || uShip.volumecapacity || uShip.volume || 2000;
			const mass =
				uShip.CargoWeight || uShip.weightcapacity || uShip.mass || 500;
			setCargoVolumeRaw(vol);
			setCargoMassRaw(mass);
			return;
		}
		const p = presets.find((pr) => pr.id === selectedShipId);
		if (p) {
			setCargoVolumeRaw(p.volume);
			setCargoMassRaw(p.mass);
		}
	}, [selectedShipId, userShips, presets]);

	// Effective ship capacity based on load % slider and m³/t inputs
	const activeShip = useMemo(() => {
		const mult = cargoLoadPercent / 100;
		const effectiveVol = Math.round((cargoVolumeRaw || 2000) * mult);
		const effectiveMass = Math.round((cargoMassRaw || 500) * mult);

		const uShip = userShips.find(
			(s) =>
				(s.ShipRegistration || s.registration || s.shipname || s.id) ===
				selectedShipId,
		);
		const shipName = uShip
			? `${uShip.ShipName || uShip.shipname || "Ship"} (${uShip.ShipRegistration || uShip.registration || "REG"})`
			: presets.find((p) => p.id === selectedShipId)?.name || "User Ship";

		const hullType =
			effectiveVol > 5000
				? "SUPER"
				: effectiveVol > 2500
					? "HEAVY"
					: effectiveVol > 800
						? "MEDIUM"
						: "SMALL";

		return {
			name: shipName,
			volume: effectiveVol,
			mass: effectiveMass,
			maxVolume: cargoVolumeRaw,
			maxMass: cargoMassRaw,
			hullType: hullType as "SMALL" | "MEDIUM" | "HEAVY" | "SUPER",
		};
	}, [
		selectedShipId,
		userShips,
		presets,
		cargoVolumeRaw,
		cargoMassRaw,
		cargoLoadPercent,
	]);

	// Effective days for timeframe averaging
	const timeframeDays = useMemo(() => {
		if (timeframe === "custom") return Math.max(1, customDays);
		return parseInt(timeframe, 10);
	}, [timeframe, customDays]);

	// Fetch backend stability & average price time-series matrix when timeframe changes
	useEffect(() => {
		fetchClient(`cx/stability-matrix?days=${timeframeDays}`)
			.then((res) => res.json())
			.then((data) => {
				if (data && typeof data === "object") {
					setStabilityMap(data);
				}
			})
			.catch(() => {});
	}, [timeframeDays]);

	// Unique Commodities List for Matrix Dropdown
	const commodityTickers = useMemo(() => {
		const set = new Set<string>();
		marketData.forEach((row) => {
			const t = row.Ticker || row.ticker;
			if (t) set.add(t);
		});
		return Array.from(set).sort();
	}, [marketData]);

	useEffect(() => {
		if (
			commodityTickers.length > 0 &&
			!commodityTickers.includes(selectedMatrixTicker)
		) {
			setSelectedMatrixTicker(commodityTickers[0]);
		}
	}, [commodityTickers, selectedMatrixTicker]);

	const handleAddPreset = () => {
		if (!newShipName.trim()) return;
		const newPreset: CustomShipPreset = {
			id: `CUSTOM_${Date.now()}`,
			name: newShipName.trim(),
			volume: newShipVol,
			mass: newShipMass,
			hullType: newShipHull,
		};
		const updated = [...presets, newPreset];
		setPresets(updated);
		localStorage.setItem("cx_user_ship_presets", JSON.stringify(updated));
		setSelectedShipId(newPreset.id);
		setBuilderOpen(false);
		setNewShipName("");
	};

	const handleHeaderSort = (field: SortField) => {
		if (sortField !== field) {
			setSortField(field);
			setSortOrder("desc");
		} else {
			if (sortOrder === "desc") {
				setSortOrder("asc");
			} else if (sortOrder === "asc") {
				setSortOrder("none");
			} else {
				setSortOrder("desc");
			}
		}
	};

	// Calculate Trade Matrix & Strictly Bound by Origin Supply (srcAskQty) and Cargo Controls
	const opportunities = useMemo(() => {
		const list: Array<{
			ticker: string;
			srcEx: string;
			dstEx: string;

			// Src Market Metrics (Origin Supply)
			srcAskPrice: number;
			srcAskQty: number;
			srcAvgPrice: number;
			srcTraded: number;
			srcDailyTradedAvg: number;
			buyPriceRangeStr: string;
			buyPriceRangeQty: number;

			// Dst Market Metrics
			dstAskPrice: number;
			dstBidPrice: number;
			dstAskQty: number;
			dstBidQty: number;
			dstAvgPrice: number;
			dstTraded: number;
			dstDailyTradedAvg: number;
			effectiveNonLossPrice: number;

			// Instant Fill (Instant BIDs, Capped by Origin Supply & Dest BIDs)
			buyPrice: number;
			instantBidPrice: number;
			instantUnits: number;
			instantNetProfit: number;
			instantMarginPct: number;
			hasInstantData: boolean;

			// Expected 24H Market Velocity (Capped by Origin Supply & Timeframe Velocity)
			expectedTargetPrice: number;
			expectedUnits: number;
			expectedNetProfit: number;
			expectedMarginPct: number;
			hasExpectedData: boolean;

			// Route & Fuel
			estFuelUnits: number;
			fuelCost: number;
			estHours: number;

			// History Stability & Timeframe Averaging
			historyWeight: number;
			stabilityRank: "HIGH" | "MODERATE" | "LOW";
		}> = [];

		const hullMult = HULL_MULTIPLIERS[activeShip.hullType] || 3.0;

		marketData.forEach((row) => {
			const ticker = (row.Ticker || row.ticker || "").toUpperCase();
			if (!ticker) return;

			EXCHANGES.forEach((srcEx) => {
				const srcAsk = row[`${srcEx}-AskPrice`] || 0;
				const srcAskQty = row[`${srcEx}-AskAmt`] || 0;

				const srcKey = `${ticker}.${srcEx.toUpperCase()}`;
				const srcHist = stabilityMap[srcKey];
				const srcAvg = srcHist?.avg_price || row[`${srcEx}-Average`] || srcAsk;
				const srcRawTraded = row[`${srcEx}-Traded`] || srcAskQty;
				const srcDailyTradedAvg = Math.round(
					srcHist?.avg_supply || srcRawTraded / timeframeDays,
				);

				const userBuyPrice = customBuyPrices[ticker] || srcAsk;
				const userBuyQty =
					customBuyQtys[ticker] || (srcAskQty > 0 ? srcAskQty : 100);
				const rangeUpper = roundNum(
					userBuyPrice > 0 ? userBuyPrice * 1.15 : 0,
					1,
				);
				const buyPriceRangeStr =
					userBuyPrice > 0
						? `${userBuyPrice.toLocaleString()} - ${rangeUpper.toLocaleString()}`
						: "-";

				EXCHANGES.forEach((dstEx) => {
					if (srcEx === dstEx) return;

					const dstAsk = row[`${dstEx}-AskPrice`] || 0;
					const dstBid = row[`${dstEx}-BidPrice`] || 0;
					const dstAskQty = row[`${dstEx}-AskAmt`] || 0;
					const dstBidQty = row[`${dstEx}-BidAmt`] || 0;

					const dstKey = `${ticker}.${dstEx.toUpperCase()}`;
					const dstHist = stabilityMap[dstKey];
					const dstAvg =
						dstHist?.avg_price || row[`${dstEx}-Average`] || dstAsk || dstBid;
					const dstRawTraded = row[`${dstEx}-Traded`] || dstBidQty;
					const dstDailyTradedAvg = Math.round(
						dstHist?.avg_supply || dstRawTraded / timeframeDays,
					);

					const dist = getRouteDistance(srcEx, dstEx);
					const estFuelUnits = roundNum(dist * hullMult, 1);
					const estHours = roundNum(dist * 0.4 + 1.2, 1);
					const fuelCost = estFuelUnits * fuelPrice;

					const maxShipUnits = Math.floor(
						Math.min(activeShip.volume, activeShip.mass),
					);

					// STRICT ORIGIN SUPPLY BOUNDING:
					const originAvailableSupply = srcAskQty > 0 ? srcAskQty : 0;
					const purchasableUnits = Math.min(
						originAvailableSupply > 0 ? originAvailableSupply : maxShipUnits,
						userBuyQty > 0 ? userBuyQty : maxShipUnits,
						maxShipUnits,
					);

					// 1. Instant Fill Calculations
					const hasInstantData = dstBid > 0 && userBuyPrice > 0;
					const instantUnits = hasInstantData
						? Math.min(
								purchasableUnits,
								dstBidQty > 0 ? dstBidQty : purchasableUnits,
							)
						: 0;
					const instantSpread = dstBid - userBuyPrice;
					const instantGrossProfit = instantSpread * instantUnits;
					const instantNetProfit = hasInstantData
						? instantGrossProfit - fuelCost
						: 0;
					const instantMarginPct =
						userBuyPrice > 0 ? (instantSpread / userBuyPrice) * 100 : 0;

					// 2. Expected Velocity Calculations
					const expectedTargetPrice =
						dstAvg > 0 ? dstAvg : dstAsk > 0 ? dstAsk : dstBid;
					const hasExpectedData = expectedTargetPrice > 0 && userBuyPrice > 0;
					const expectedUnits = hasExpectedData
						? Math.min(
								purchasableUnits,
								dstDailyTradedAvg > 0
									? dstDailyTradedAvg
									: dstBidQty || purchasableUnits,
							)
						: 0;
					const expectedSpread = expectedTargetPrice - userBuyPrice;
					const expectedGrossProfit = expectedSpread * expectedUnits;
					const expectedNetProfit = hasExpectedData
						? expectedGrossProfit - fuelCost
						: 0;
					const expectedMarginPct =
						userBuyPrice > 0 ? (expectedSpread / userBuyPrice) * 100 : 0;

					const fuelPerUnit = expectedUnits > 0 ? fuelCost / expectedUnits : 0;
					const effectiveNonLossPrice = roundNum(userBuyPrice + fuelPerUnit, 1);

					// Apply user filters
					if (
						minMargin > -900 &&
						instantMarginPct < minMargin &&
						expectedMarginPct < minMargin
					)
						return;
					if (
						minProfit > -900000 &&
						instantNetProfit < minProfit &&
						expectedNetProfit < minProfit
					)
						return;

					// Stability Score Calculation
					let historyWeight = dstHist?.stability_score;
					if (historyWeight === undefined || historyWeight === null) {
						const priceSpread = Math.abs(
							dstAsk > 0 && dstBid > 0
								? dstAsk - dstBid
								: (dstAsk || dstAvg || 100) * 0.08,
						);
						const spreadRatio = dstAvg > 0 ? priceSpread / dstAvg : 0.08;
						const volBonus = Math.min(
							12,
							(dstDailyTradedAvg + dstBidQty) / 250,
						);
						historyWeight = roundNum(
							Math.max(30, Math.min(99, 96 - spreadRatio * 85 + volBonus)),
							1,
						);
					}

					const stabilityRank: "HIGH" | "MODERATE" | "LOW" =
						historyWeight >= 85
							? "HIGH"
							: historyWeight >= 65
								? "MODERATE"
								: "LOW";

					list.push({
						ticker,
						srcEx,
						dstEx,
						srcAskPrice: srcAsk,
						srcAskQty,
						srcAvgPrice: srcAvg,
						srcTraded: srcRawTraded,
						srcDailyTradedAvg,
						buyPriceRangeStr,
						buyPriceRangeQty: purchasableUnits,
						dstAskPrice: dstAsk,
						dstBidPrice: dstBid,
						dstAskQty,
						dstBidQty,
						dstAvgPrice: dstAvg,
						dstTraded: dstRawTraded,
						dstDailyTradedAvg,
						effectiveNonLossPrice,
						buyPrice: userBuyPrice,
						instantBidPrice: dstBid,
						instantUnits,
						instantNetProfit,
						instantMarginPct,
						hasInstantData,
						expectedTargetPrice,
						expectedUnits,
						expectedNetProfit,
						expectedMarginPct,
						hasExpectedData,
						estFuelUnits,
						fuelCost,
						estHours,
						historyWeight,
						stabilityRank,
					});
				});
			});
		});

		return list;
	}, [
		marketData,
		activeShip,
		fuelPrice,
		minMargin,
		minProfit,
		timeframeDays,
		stabilityMap,
		customBuyPrices,
		customBuyQtys,
	]);

	// Calculate Best Green Commodity (Highest Positive Matrix Routes & Profit)
	const bestGreenCommodity = useMemo(() => {
		if (opportunities.length === 0) return null;

		const statsByTicker: Record<
			string,
			{ totalProfit: number; greenCount: number }
		> = {};

		opportunities.forEach((op) => {
			if (!statsByTicker[op.ticker]) {
				statsByTicker[op.ticker] = { totalProfit: 0, greenCount: 0 };
			}
			if (op.hasExpectedData && op.expectedNetProfit > 0) {
				statsByTicker[op.ticker].totalProfit += op.expectedNetProfit;
				statsByTicker[op.ticker].greenCount += 1;
			}
		});

		let bestTicker: string | null = null;
		let maxProfit = -1;
		let maxGreen = -1;

		Object.entries(statsByTicker).forEach(([ticker, stat]) => {
			if (
				stat.greenCount > maxGreen ||
				(stat.greenCount === maxGreen && stat.totalProfit > maxProfit)
			) {
				maxGreen = stat.greenCount;
				maxProfit = stat.totalProfit;
				bestTicker = ticker;
			}
		});

		if (!bestTicker) return null;

		return {
			ticker: bestTicker,
			totalProfit: maxProfit,
			greenCount: maxGreen,
		};
	}, [opportunities]);

	// Filter & Sort
	const filteredAndSortedOpportunities = useMemo(() => {
		let res = opportunities.filter((op) => {
			if (
				searchQuery.trim() &&
				!op.ticker.toLowerCase().includes(searchQuery.toLowerCase())
			)
				return false;
			if (srcFilter !== "ALL" && op.srcEx !== srcFilter) return false;
			if (dstFilter !== "ALL" && op.dstEx !== dstFilter) return false;
			return true;
		});

		if (sortOrder !== "none") {
			res.sort((a, b) => {
				let valA = a[sortField] as any;
				let valB = b[sortField] as any;
				if (typeof valA === "string") valA = valA.toLowerCase();
				if (typeof valB === "string") valB = valB.toLowerCase();

				if (valA < valB) return sortOrder === "asc" ? -1 : 1;
				if (valA > valB) return sortOrder === "asc" ? 1 : -1;
				return 0;
			});
		} else {
			res.sort((a, b) => b.expectedNetProfit - a.expectedNetProfit);
		}

		return res;
	}, [opportunities, searchQuery, srcFilter, dstFilter, sortField, sortOrder]);

	// Paginated List
	const paginatedOpportunities = useMemo(() => {
		const start = page * rowsPerPage;
		return filteredAndSortedOpportunities.slice(start, start + rowsPerPage);
	}, [filteredAndSortedOpportunities, page, rowsPerPage]);

	// Build 6x6 Interconnection Matrix for Sub-Tab
	const dedicatedMatrix = useMemo(() => {
		if (!selectedMatrixTicker) return null;
		const matrix: Record<string, Record<string, any>> = {};

		EXCHANGES.forEach((src) => {
			matrix[src] = {};
			EXCHANGES.forEach((dst) => {
				if (src === dst) {
					matrix[src][dst] = null;
				} else {
					const op = opportunities.find(
						(o) =>
							o.ticker === selectedMatrixTicker &&
							o.srcEx === src &&
							o.dstEx === dst,
					);
					matrix[src][dst] = op || { noData: true, src, dst };
				}
			});
		});

		return matrix;
	}, [selectedMatrixTicker, opportunities]);

	const topInstant = [...filteredAndSortedOpportunities].sort(
		(a, b) => b.instantNetProfit - a.instantNetProfit,
	)[0];
	const topExpected = filteredAndSortedOpportunities[0];

	return (
		<Box
			sx={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				gap: 2,
				overflow: "hidden",
			}}
		>
			{/* Controls & Preset Panel */}
			<Paper
				elevation={3}
				sx={{
					p: 2,
					background: "rgba(16, 16, 32, 0.5)",
					border: "1px solid rgba(123, 104, 238, 0.35)",
					boxShadow:
						"0 0 35px rgba(123, 104, 238, 0.18), inset 0 0 20px rgba(123, 104, 238, 0.06)",
					backdropFilter: "blur(25px)",
					borderRadius: "16px",
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 1.5,
						flexWrap: "wrap",
						gap: 1.5,
					}}
				>
					<Typography
						variant="subtitle2"
						sx={{
							fontWeight: 800,
							color: "#7B68EE",
							textTransform: "uppercase",
							fontSize: "0.75rem",
							letterSpacing: "0.15em",
						}}
					>
						Cross-CX Arbitrage & Trade Finder
					</Typography>

					{/* View Sub-Tab Toggle Switcher */}
					<Stack direction="row" spacing={2} alignItems="center">
						<ToggleButtonGroup
							value={subTab}
							exclusive
							onChange={(_, val) => val && setSubTab(val)}
							size="small"
							sx={{
								bgcolor: "rgba(0, 0, 0, 0.4)",
								border: "1px solid rgba(123, 104, 238, 0.3)",
								borderRadius: "8px",
								"& .MuiToggleButton-root": {
									color: "rgba(255, 255, 255, 0.6)",
									fontSize: "0.75rem",
									px: 1.5,
									py: 0.5,
									gap: 0.75,
									fontWeight: 700,
									border: "none",
									"&.Mui-selected": {
										color: "white",
										bgcolor: "#7B68EE",
										boxShadow: "0 0 12px rgba(123, 104, 238, 0.5)",
									},
								},
							}}
						>
							<ToggleButton value="list">
								<ListIcon size={14} /> Arbitrage List (
								{filteredAndSortedOpportunities.length})
							</ToggleButton>
							<ToggleButton value="matrix">
								<GridIcon size={14} /> 6x6 Interconnection Matrix
							</ToggleButton>
						</ToggleButtonGroup>

						<Button
							size="small"
							variant="outlined"
							startIcon={<Plus size={14} />}
							onClick={() => setBuilderOpen(true)}
							sx={{
								color: "#7B68EE",
								borderColor: "rgba(123, 104, 238, 0.4)",
								fontSize: "0.7rem",
								fontWeight: 700,
								textTransform: "none",
								"&:hover": { bgcolor: "rgba(123, 104, 238, 0.12)" },
							}}
						>
							New Custom Ship Preset
						</Button>

						<Button
							size="small"
							variant="text"
							startIcon={<ExternalLink size={14} />}
							onClick={() => navigate("/dashboard/shipping")}
							sx={{
								color: "rgba(255, 255, 255, 0.6)",
								fontSize: "0.7rem",
								fontWeight: 600,
								textTransform: "none",
								"&:hover": { color: "white" },
							}}
						>
							Ship Builder
						</Button>
					</Stack>
				</Box>

				{/* Filters & Ship Cargo Controls Panel */}
				<Box
					sx={{
						display: "flex",
						flexWrap: "wrap",
						gap: 1.5,
						alignItems: "center",
					}}
				>
					{/* Search Ticker */}
					<Box sx={{ flex: "1 1 160px" }}>
						<TextField
							placeholder="Search Ticker..."
							size="small"
							fullWidth
							value={searchRaw}
							onChange={(e) => {
								setSearchRaw(e.target.value);
								setPage(0);
							}}
							sx={{
								"& .MuiOutlinedInput-root": {
									bgcolor: "rgba(0,0,0,0.4)",
									color: "white",
									fontSize: "0.8rem",
									"& fieldset": { borderColor: "rgba(123, 104, 238, 0.25)" },
								},
							}}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start">
											<Search size={14} color="rgba(255,255,255,0.5)" />
										</InputAdornment>
									),
								},
							}}
						/>
					</Box>

					{/* Timeframe Selector (1D, 7D, 30D, CUSTOM) */}
					<Box sx={{ flex: "1 1 140px" }}>
						<FormControl size="small" fullWidth>
							<InputLabel
								sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}
							>
								Volume Timeframe
							</InputLabel>
							<Select
								value={timeframe}
								label="Volume Timeframe"
								onChange={(e: any) => {
									setTimeframe(e.target.value);
									setPage(0);
								}}
								sx={{
									bgcolor: "rgba(0,0,0,0.4)",
									color: "white",
									fontSize: "0.8rem",
								}}
							>
								<MenuItem value="1">1 Day (24 Hours)</MenuItem>
								<MenuItem value="7">7 Days Avg</MenuItem>
								<MenuItem value="30">30 Days Avg</MenuItem>
								<MenuItem value="custom">Custom Days</MenuItem>
							</Select>
						</FormControl>
					</Box>

					{/* Source CX */}
					<Box sx={{ flex: "1 1 100px" }}>
						<FormControl size="small" fullWidth>
							<InputLabel
								sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}
							>
								Buy At (Src)
							</InputLabel>
							<Select
								value={srcFilter}
								label="Buy At (Src)"
								onChange={(e) => {
									setSrcFilter(e.target.value);
									setPage(0);
								}}
								sx={{
									bgcolor: "rgba(0,0,0,0.4)",
									color: "white",
									fontSize: "0.8rem",
								}}
							>
								<MenuItem value="ALL">All CXes</MenuItem>
								{EXCHANGES.map((ex) => (
									<MenuItem key={ex} value={ex}>
										{ex}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>

					{/* Destination CX */}
					<Box sx={{ flex: "1 1 100px" }}>
						<FormControl size="small" fullWidth>
							<InputLabel
								sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}
							>
								Sell At (Dst)
							</InputLabel>
							<Select
								value={dstFilter}
								label="Sell At (Dst)"
								onChange={(e) => {
									setDstFilter(e.target.value);
									setPage(0);
								}}
								sx={{
									bgcolor: "rgba(0,0,0,0.4)",
									color: "white",
									fontSize: "0.8rem",
								}}
							>
								<MenuItem value="ALL">All CXes</MenuItem>
								{EXCHANGES.map((ex) => (
									<MenuItem key={ex} value={ex}>
										{ex}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>

					{/* Active Ship / Fleet Dropdown (Clean Name + Registration + Cargo Specs) */}
					<Box sx={{ flex: "2 1 240px" }}>
						<FormControl size="small" fullWidth>
							<InputLabel
								sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}
							>
								Active Ship Fleet / Preset
							</InputLabel>
							<Select
								value={selectedShipId}
								label="Active Ship Fleet / Preset"
								onChange={(e) => setSelectedShipId(e.target.value)}
								sx={{
									bgcolor: "rgba(0,0,0,0.4)",
									color: "white",
									fontSize: "0.8rem",
								}}
							>
								{isLoggedIn && userShips.length > 0 && (
									<MenuItem
										disabled
										sx={{
											fontWeight: 800,
											fontSize: "0.7rem",
											color: "#7B68EE",
										}}
									>
										--- YOUR USER FLEET SHIPS ---
									</MenuItem>
								)}
								{userShips.map((s) => {
									const reg =
										s.ShipRegistration || s.registration || s.id || "REG";
									const name = s.ShipName || s.shipname || "User Ship";
									const vol =
										s.CargoVolume || s.volumecapacity || s.volume || 2000;
									const mass =
										s.CargoWeight || s.weightcapacity || s.mass || 500;
									return (
										<MenuItem key={reg} value={reg}>
											🚢 {name} ({reg}) — {vol.toLocaleString()} m³ /{" "}
											{mass.toLocaleString()} t
										</MenuItem>
									);
								})}

								<MenuItem
									disabled
									sx={{ fontWeight: 800, fontSize: "0.7rem", color: "#7B68EE" }}
								>
									--- SAVED & DEFAULT PRESET SHIPS ---
								</MenuItem>
								{presets.map((p) => (
									<MenuItem key={p.id} value={p.id}>
										🚢 {p.name} — {p.volume.toLocaleString()} m³ /{" "}
										{p.mass.toLocaleString()} t
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>

					{/* Cargo Vol (m³) Input */}
					<Box sx={{ flex: "1 1 110px" }}>
						<TextField
							label="Cargo Vol (m³)"
							size="small"
							type="number"
							fullWidth
							value={cargoVolumeRaw}
							onChange={(e) =>
								setCargoVolumeRaw(parseFloat(e.target.value) || 0)
							}
							sx={{
								"& .MuiOutlinedInput-root": {
									bgcolor: "rgba(0,0,0,0.4)",
									color: "white",
									fontSize: "0.8rem",
								},
								"& .MuiInputLabel-root": {
									color: "rgba(255,255,255,0.5)",
									fontSize: "0.8rem",
								},
							}}
						/>
					</Box>

					{/* Cargo Mass (t) Input */}
					<Box sx={{ flex: "1 1 110px" }}>
						<TextField
							label="Cargo Mass (t)"
							size="small"
							type="number"
							fullWidth
							value={cargoMassRaw}
							onChange={(e) => setCargoMassRaw(parseFloat(e.target.value) || 0)}
							sx={{
								"& .MuiOutlinedInput-root": {
									bgcolor: "rgba(0,0,0,0.4)",
									color: "white",
									fontSize: "0.8rem",
								},
								"& .MuiInputLabel-root": {
									color: "rgba(255,255,255,0.5)",
									fontSize: "0.8rem",
								},
							}}
						/>
					</Box>

					{/* Min Net Profit Filter (ICA) */}
					<Box sx={{ flex: "1 1 120px" }}>
						<TextField
							label="Min Net Profit (ICA)"
							size="small"
							type="number"
							fullWidth
							value={minProfitRaw <= -90000 ? "" : minProfitRaw}
							placeholder="All Profits & Losses"
							onChange={(e) => {
								const val =
									e.target.value === "" ? -999999 : parseFloat(e.target.value);
								setMinProfitRaw(isNaN(val) ? -999999 : val);
								setPage(0);
							}}
							sx={{
								"& .MuiOutlinedInput-root": {
									bgcolor: "rgba(0,0,0,0.4)",
									color: "white",
									fontSize: "0.8rem",
								},
								"& .MuiInputLabel-root": {
									color: "rgba(255,255,255,0.5)",
									fontSize: "0.8rem",
								},
							}}
						/>
					</Box>

					{/* Fuel Cost Input */}
					<Box sx={{ flex: "1 1 110px" }}>
						<TextField
							label="Fuel Price (ICA/u)"
							size="small"
							type="number"
							fullWidth
							value={fuelPriceRaw}
							onChange={(e) => setFuelPriceRaw(parseFloat(e.target.value) || 0)}
							sx={{
								"& .MuiOutlinedInput-root": {
									bgcolor: "rgba(0,0,0,0.4)",
									color: "white",
									fontSize: "0.8rem",
								},
								"& .MuiInputLabel-root": {
									color: "rgba(255,255,255,0.5)",
									fontSize: "0.8rem",
								},
							}}
						/>
					</Box>
				</Box>

				{/* Cargo Capacity Load % Slider Bar */}
				<Box
					sx={{
						mt: 1.5,
						pt: 1,
						borderTop: "1px dashed rgba(123, 104, 238, 0.2)",
						display: "flex",
						alignItems: "center",
						gap: 2,
						flexWrap: "wrap",
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							minWidth: 180,
						}}
					>
						<Sliders size={16} color="#7B68EE" />
						<Typography
							variant="caption"
							sx={{ color: "#7B68EE", fontWeight: 700, fontSize: "0.75rem" }}
						>
							Cargo Load % Slider:
						</Typography>
						<Chip
							label={`${cargoLoadPercent}% Capacity`}
							size="small"
							sx={{
								height: 20,
								bgcolor: "rgba(123, 104, 238, 0.2)",
								color: "white",
								fontWeight: 800,
								fontSize: "0.7rem",
							}}
						/>
					</Box>

					<Box sx={{ flex: 1, minWidth: 200, px: 1 }}>
						<Slider
							value={cargoLoadPercent}
							min={5}
							max={100}
							step={5}
							onChange={(_, val) => setCargoLoadPercent(val as number)}
							valueLabelDisplay="auto"
							valueLabelFormat={(v) => `${v}%`}
							sx={{
								color: "#7B68EE",
								"& .MuiSlider-thumb": {
									boxShadow: "0 0 10px rgba(123, 104, 238, 0.8)",
								},
								"& .MuiSlider-rail": {
									bgcolor: "rgba(255, 255, 255, 0.15)",
								},
							}}
						/>
					</Box>

					<Typography
						variant="caption"
						sx={{
							color: "rgba(255, 255, 255, 0.6)",
							fontSize: "0.7rem",
							fontWeight: 600,
						}}
					>
						Effective Payload:{" "}
						<span style={{ color: "#69f0ae", fontWeight: 800 }}>
							{activeShip.volume.toLocaleString()} m³
						</span>{" "}
						/{" "}
						<span style={{ color: "#ffd54f", fontWeight: 800 }}>
							{activeShip.mass.toLocaleString()} t
						</span>
					</Typography>
				</Box>
			</Paper>

			{/* KPI Summary Cards */}
			<Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
				<Box sx={{ flex: "1 1 280px" }}>
					<Paper
						elevation={2}
						sx={{
							p: 1.5,
							bgcolor: "rgba(16, 16, 32, 0.5)",
							border: "1px solid rgba(255, 215, 0, 0.4)",
							borderRadius: "12px",
							display: "flex",
							alignItems: "center",
							gap: 1.5,
						}}
					>
						<Box
							sx={{
								p: 1,
								bgcolor: "rgba(255, 215, 0, 0.15)",
								borderRadius: "8px",
							}}
						>
							<Zap size={22} color="#ffd700" />
						</Box>
						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.5)",
									fontSize: "0.65rem",
									display: "block",
								}}
							>
								⚡ TOP INSTANT BID PROFIT
							</Typography>
							<Typography
								variant="body1"
								sx={{ color: "#ffd700", fontWeight: 700 }}
							>
								{topInstant
									? `${topInstant.ticker} (${topInstant.srcEx} → ${topInstant.dstEx})`
									: "-"}
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: "white", fontWeight: 600 }}
							>
								{topInstant && topInstant.hasInstantData
									? `${topInstant.instantNetProfit > 0 ? "+" : ""}${topInstant.instantNetProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} ICA`
									: "-"}
							</Typography>
						</Box>
					</Paper>
				</Box>

				<Box sx={{ flex: "1 1 280px" }}>
					<Paper
						elevation={2}
						sx={{
							p: 1.5,
							bgcolor: "rgba(16, 16, 32, 0.5)",
							border: "1px solid rgba(105, 240, 174, 0.4)",
							borderRadius: "12px",
							display: "flex",
							alignItems: "center",
							gap: 1.5,
						}}
					>
						<Box
							sx={{
								p: 1,
								bgcolor: "rgba(105, 240, 174, 0.15)",
								borderRadius: "8px",
							}}
						>
							<BarChart2 size={22} color="#69f0ae" />
						</Box>
						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.5)",
									fontSize: "0.65rem",
									display: "block",
								}}
							>
								📈 TOP EXPECTED PROFIT (
								{timeframe === "custom" ? `${customDays}D` : `${timeframe}D`}{" "}
								AVG)
							</Typography>
							<Typography
								variant="body1"
								sx={{ color: "#69f0ae", fontWeight: 700 }}
							>
								{topExpected
									? `${topExpected.ticker} (${topExpected.srcEx} → ${topExpected.dstEx})`
									: "-"}
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: "white", fontWeight: 600 }}
							>
								{topExpected && topExpected.hasExpectedData
									? `${topExpected.expectedNetProfit > 0 ? "+" : ""}${topExpected.expectedNetProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} ICA`
									: "-"}
							</Typography>
						</Box>
					</Paper>
				</Box>

				<Box sx={{ flex: "1 1 280px" }}>
					<Paper
						elevation={2}
						sx={{
							p: 1.5,
							bgcolor: "rgba(16, 16, 32, 0.5)",
							border: "1px solid rgba(123, 104, 238, 0.3)",
							borderRadius: "12px",
							display: "flex",
							alignItems: "center",
							gap: 1.5,
						}}
					>
						<Box
							sx={{
								p: 1,
								bgcolor: "rgba(123, 104, 238, 0.15)",
								borderRadius: "8px",
							}}
						>
							<Award size={22} color="#7B68EE" />
						</Box>
						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.5)",
									fontSize: "0.65rem",
									display: "block",
								}}
							>
								ACTIVE CARGO PROFILE ({cargoLoadPercent}%)
							</Typography>
							<Typography
								variant="body1"
								sx={{ color: "#7B68EE", fontWeight: 700 }}
							>
								{activeShip.name}
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}
							>
								Cap: {activeShip.volume.toLocaleString()} m³ |{" "}
								{activeShip.mass.toLocaleString()} t
							</Typography>
						</Box>
					</Paper>
				</Box>
			</Box>

			{/* Sub-Tab Content: Arbitrage List vs 6x6 Dedicated Matrix */}
			{subTab === "matrix" ? (
				<Paper
					elevation={3}
					sx={{
						flex: 1,
						p: 3,
						display: "flex",
						flexDirection: "column",
						background: "rgba(16, 16, 32, 0.5)",
						border: "1px solid rgba(123, 104, 238, 0.35)",
						boxShadow:
							"0 0 35px rgba(123, 104, 238, 0.18), inset 0 0 20px rgba(123, 104, 238, 0.06)",
						backdropFilter: "blur(25px)",
						borderRadius: "16px",
						overflowY: "auto",
					}}
				>
					{/* Commodity Select Bar + Best Green Commodity Finder */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							mb: 2.5,
							flexWrap: "wrap",
							gap: 2,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
							<MaterialBadge ticker={selectedMatrixTicker} />
							<Typography variant="h6" sx={{ fontWeight: 800, color: "white" }}>
								{selectedMatrixTicker} — 6x6 Interconnection Route Matrix (30
								Routes)
							</Typography>
						</Box>

						<Stack direction="row" spacing={1.5} alignItems="center">
							{bestGreenCommodity && (
								<Tooltip
									title={`Auto-select ${bestGreenCommodity.ticker} with ${bestGreenCommodity.greenCount} positive profit routes`}
								>
									<Button
										size="small"
										variant="contained"
										startIcon={<Sparkles size={14} color="#ffd700" />}
										onClick={() =>
											setSelectedMatrixTicker(bestGreenCommodity.ticker)
										}
										sx={{
											bgcolor: "rgba(105, 240, 174, 0.15)",
											color: "#69f0ae",
											border: "1px solid rgba(105, 240, 174, 0.4)",
											fontSize: "0.75rem",
											fontWeight: 800,
											textTransform: "none",
											"&:hover": { bgcolor: "rgba(105, 240, 174, 0.25)" },
										}}
									>
										✨ Best Green: {bestGreenCommodity.ticker} (
										{bestGreenCommodity.greenCount} Routes | +
										{bestGreenCommodity.totalProfit.toLocaleString(undefined, {
											maximumFractionDigits: 0,
										})}{" "}
										ICA)
									</Button>
								</Tooltip>
							)}

							<Autocomplete
								options={commodityTickers}
								value={selectedMatrixTicker}
								onChange={(_, val) => val && setSelectedMatrixTicker(val)}
								size="small"
								sx={{
									width: 220,
									"& .MuiOutlinedInput-root": {
										bgcolor: "rgba(0,0,0,0.4)",
										color: "white",
									},
								}}
								renderInput={(params) => (
									<TextField {...params} label="Select Commodity" />
								)}
							/>
						</Stack>
					</Box>

					{/* 6x6 Matrix Table */}
					<Box sx={{ flex: 1, overflowX: "auto" }}>
						<Table size="small" sx={{ minWidth: 800 }}>
							<TableHead>
								<TableRow
									sx={{
										"& th": {
											bgcolor: "rgba(123, 104, 238, 0.15)",
											color: "#7B68EE",
											fontSize: "0.85rem",
											fontWeight: 800,
											py: 1.5,
										},
									}}
								>
									<TableCell>SOURCE \ DESTINATION</TableCell>
									{EXCHANGES.map((ex) => (
										<TableCell key={ex} align="center">
											{ex}
										</TableCell>
									))}
								</TableRow>
							</TableHead>
							<TableBody>
								{EXCHANGES.map((src) => (
									<TableRow
										key={src}
										sx={{
											"& td": {
												py: 1.5,
												borderBottom: "1px solid rgba(255,255,255,0.06)",
											},
										}}
									>
										<TableCell
											sx={{
												color: "#7B68EE",
												fontWeight: 800,
												fontSize: "0.85rem",
												bgcolor: "rgba(255,255,255,0.02)",
											}}
										>
											{src}
										</TableCell>
										{EXCHANGES.map((dst) => {
											if (src === dst) {
												return (
													<TableCell
														key={dst}
														align="center"
														sx={{
															color: "rgba(255,255,255,0.2)",
															fontSize: "0.85rem",
														}}
													>
														—
													</TableCell>
												);
											}
											const cellOp = dedicatedMatrix?.[src]?.[dst];
											if (
												!cellOp ||
												cellOp.noData ||
												(!cellOp.hasExpectedData && !cellOp.hasInstantData)
											) {
												return (
													<TableCell
														key={dst}
														align="center"
														sx={{
															color: "rgba(255,255,255,0.25)",
															fontSize: "0.75rem",
														}}
													>
														—
													</TableCell>
												);
											}
											const cellProfit = cellOp.expectedNetProfit || 0;
											const instantProfit = cellOp.instantNetProfit || 0;
											const cellSpread =
												cellOp.expectedTargetPrice && cellOp.buyPrice
													? cellOp.expectedTargetPrice - cellOp.buyPrice
													: 0;
											const isLoss = cellProfit < 0;
											return (
												<TableCell key={dst} align="center">
													<Box
														sx={{
															bgcolor: !isLoss
																? "rgba(105, 240, 174, 0.08)"
																: "rgba(255, 82, 82, 0.12)",
															border: !isLoss
																? "1px solid rgba(105, 240, 174, 0.25)"
																: "1px solid rgba(255, 82, 82, 0.35)",
															p: 1,
															borderRadius: "8px",
														}}
													>
														<Typography
															variant="body2"
															sx={{
																color: !isLoss ? "#69f0ae" : "#ff5252",
																fontWeight: 800,
																fontSize: "0.85rem",
															}}
														>
															{!isLoss
																? `+${cellProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
																: cellProfit.toLocaleString(undefined, {
																		maximumFractionDigits: 0,
																	})}{" "}
															ICA
														</Typography>
														{cellOp.hasInstantData && (
															<Typography
																variant="caption"
																sx={{
																	color:
																		instantProfit >= 0 ? "#ffd700" : "#ff8a80",
																	fontWeight: 700,
																	display: "block",
																	fontSize: "0.65rem",
																}}
															>
																⚡ Instant: {instantProfit >= 0 ? "+" : ""}
																{instantProfit.toLocaleString(undefined, {
																	maximumFractionDigits: 0,
																})}
															</Typography>
														)}
														<Typography
															variant="caption"
															sx={{
																color: "rgba(255,255,255,0.5)",
																fontSize: "0.65rem",
																display: "block",
															}}
														>
															Spread: {cellSpread >= 0 ? "+" : ""}
															{cellSpread.toLocaleString()} ICA
														</Typography>
													</Box>
												</TableCell>
											);
										})}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Box>
				</Paper>
			) : (
				<Paper
					elevation={3}
					sx={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						background: "rgba(16, 16, 32, 0.5)",
						border: "1px solid rgba(123, 104, 238, 0.35)",
						boxShadow:
							"0 0 35px rgba(123, 104, 238, 0.18), inset 0 0 20px rgba(123, 104, 238, 0.06)",
						backdropFilter: "blur(25px)",
						borderRadius: "16px",
						overflow: "hidden",
					}}
				>
					<Box
						sx={{
							flex: 1,
							overflowY: "auto",
							"&::-webkit-scrollbar": { width: "4px" },
							"&::-webkit-scrollbar-track": { background: "transparent" },
							"&::-webkit-scrollbar-thumb": {
								backgroundColor: "rgba(123, 104, 238, 0.4)",
								borderRadius: "2px",
							},
						}}
					>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow
									sx={{
										"& th": {
											bgcolor: "rgba(16, 16, 32, 0.95)",
											color: "rgba(255,255,255,0.6)",
											fontSize: "0.7rem",
											fontWeight: 700,
											borderBottom: "1px solid rgba(255,255,255,0.08)",
											py: 1,
										},
									}}
								>
									<TableCell>
										<TableSortLabel
											active={sortField === "ticker"}
											direction={sortOrder === "asc" ? "asc" : "desc"}
											onClick={() => handleHeaderSort("ticker")}
											sx={{ color: "rgba(255,255,255,0.7) !important" }}
										>
											COMMODITY
										</TableSortLabel>
									</TableCell>
									<TableCell>
										<TableSortLabel
											active={sortField === "estHours"}
											direction={sortOrder === "asc" ? "asc" : "desc"}
											onClick={() => handleHeaderSort("estHours")}
											sx={{ color: "rgba(255,255,255,0.7) !important" }}
										>
											ROUTE (A → B) & FUEL
										</TableSortLabel>
									</TableCell>
									<TableCell align="center">
										<TableSortLabel
											active={sortField === "historyWeight"}
											direction={sortOrder === "asc" ? "asc" : "desc"}
											onClick={() => handleHeaderSort("historyWeight")}
											sx={{ color: "rgba(255,255,255,0.7) !important" }}
										>
											STABILITY & TRADED VOLUME (
											{timeframe === "custom"
												? `${customDays}D`
												: `${timeframe}D`}
											)
										</TableSortLabel>
									</TableCell>
									<TableCell align="right">
										<TableSortLabel
											active={sortField === "buyPrice"}
											direction={sortOrder === "asc" ? "asc" : "desc"}
											onClick={() => handleHeaderSort("buyPrice")}
											sx={{ color: "rgba(255,255,255,0.7) !important" }}
										>
											A BUY PRICE & ORIGIN SUPPLY
										</TableSortLabel>
									</TableCell>
									<TableCell align="right">B SELL / BUY DEPTH</TableCell>
									<TableCell align="right">
										<TableSortLabel
											active={sortField === "instantNetProfit"}
											direction={sortOrder === "asc" ? "asc" : "desc"}
											onClick={() => handleHeaderSort("instantNetProfit")}
											sx={{ color: "#ffd700 !important" }}
										>
											⚡ INSTANT BID FILL
										</TableSortLabel>
									</TableCell>
									<TableCell align="right">
										<TableSortLabel
											active={sortField === "expectedNetProfit"}
											direction={sortOrder === "asc" ? "asc" : "desc"}
											onClick={() => handleHeaderSort("expectedNetProfit")}
											sx={{ color: "#69f0ae !important" }}
										>
											📈 EXPECTED VELOCITY (
											{timeframe === "custom"
												? `${customDays}D`
												: `${timeframe}D`}
											)
										</TableSortLabel>
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{paginatedOpportunities.map((row, idx) => (
									<TableRow
										key={`${row.ticker}-${row.srcEx}-${row.dstEx}-${idx}`}
										sx={{
											"&:hover": { bgcolor: "rgba(123, 104, 238, 0.12)" },
											"& td": {
												borderBottom: "1px solid rgba(255,255,255,0.04)",
												py: 1.25,
												fontSize: "0.8rem",
												fontVariantNumeric: "tabular-nums",
											},
										}}
									>
										{/* Commodity */}
										<TableCell>
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												<MaterialBadge ticker={row.ticker} />
												<Typography
													variant="body2"
													sx={{ fontWeight: 700, color: "white" }}
												>
													{row.ticker}
												</Typography>
											</Box>
										</TableCell>

										{/* Route & Fuel */}
										<TableCell>
											<Stack direction="row" spacing={0.75} alignItems="center">
												<Chip
													label={row.srcEx}
													size="small"
													sx={{
														height: 20,
														bgcolor: "rgba(255,82,82,0.2)",
														color: "#ff5252",
														fontWeight: 700,
														fontSize: "0.65rem",
													}}
												/>
												<ArrowRight size={14} color="rgba(255,255,255,0.4)" />
												<Chip
													label={row.dstEx}
													size="small"
													sx={{
														height: 20,
														bgcolor: "rgba(105,240,174,0.2)",
														color: "#69f0ae",
														fontWeight: 700,
														fontSize: "0.65rem",
													}}
												/>
											</Stack>
											<Typography
												variant="caption"
												sx={{
													color: "rgba(255,255,255,0.4)",
													fontSize: "0.65rem",
													display: "block",
												}}
											>
												~{row.estHours}h Flight | Fuel: -
												{row.fuelCost.toLocaleString()} ICA
											</Typography>
										</TableCell>

										{/* Stability & Time-Series History Averaged Vol */}
										<TableCell align="center">
											<Tooltip
												title={`Daily Avg (${timeframeDays}D): Src ${row.srcDailyTradedAvg.toLocaleString()} u | Dst ${row.dstDailyTradedAvg.toLocaleString()} u`}
											>
												<Chip
													icon={
														row.stabilityRank === "HIGH" ? (
															<ShieldCheck size={12} color="#69f0ae" />
														) : (
															<ShieldAlert size={12} color="#ffd54f" />
														)
													}
													label={`${row.historyWeight}% Stability`}
													size="small"
													sx={{
														height: 20,
														fontSize: "0.65rem",
														fontWeight: 700,
														bgcolor:
															row.stabilityRank === "HIGH"
																? "rgba(105,240,174,0.15)"
																: row.stabilityRank === "MODERATE"
																	? "rgba(255,213,79,0.15)"
																	: "rgba(255,82,82,0.15)",
														color:
															row.stabilityRank === "HIGH"
																? "#69f0ae"
																: row.stabilityRank === "MODERATE"
																	? "#ffd54f"
																	: "#ff5252",
													}}
												/>
											</Tooltip>
											<Typography
												variant="caption"
												sx={{
													color: "#00e5ff",
													fontSize: "0.65rem",
													display: "block",
													fontWeight: 600,
													mt: 0.25,
												}}
											>
												Avg Vol ({timeframeDays}D): A:{" "}
												{row.srcDailyTradedAvg.toLocaleString()} u | B:{" "}
												{row.dstDailyTradedAvg.toLocaleString()} u
											</Typography>
											<Typography
												variant="caption"
												sx={{
													color: "rgba(255,255,255,0.4)",
													fontSize: "0.65rem",
													display: "block",
												}}
											>
												Avg Price ({timeframeDays}D): A:{" "}
												{row.srcAvgPrice > 0
													? row.srcAvgPrice.toLocaleString()
													: "-"}{" "}
												| B:{" "}
												{row.dstAvgPrice > 0
													? row.dstAvgPrice.toLocaleString()
													: "-"}
											</Typography>
										</TableCell>

										{/* A Buy Price & Origin Supply */}
										<TableCell align="right">
											{row.buyPrice > 0 ? (
												<>
													<Typography
														variant="body2"
														sx={{ color: "#ff5252", fontWeight: 700 }}
													>
														{row.buyPrice.toLocaleString()} ICA
													</Typography>
													<Typography
														variant="caption"
														sx={{
															color: "#ffd54f",
															fontSize: "0.65rem",
															display: "block",
															fontWeight: 600,
														}}
													>
														Origin Supply:{" "}
														{row.srcAskQty > 0
															? `${row.srcAskQty.toLocaleString()} u`
															: "Unlimited"}
													</Typography>
													<Typography
														variant="caption"
														sx={{
															color: "rgba(255,255,255,0.5)",
															fontSize: "0.65rem",
															display: "block",
														}}
													>
														Range: {row.buyPriceRangeStr}
													</Typography>
												</>
											) : (
												<Typography
													variant="body2"
													sx={{ color: "rgba(255,255,255,0.3)" }}
												>
													—
												</Typography>
											)}
										</TableCell>

										{/* B Sell / Buy Depth */}
										<TableCell align="right">
											{row.dstBidPrice > 0 || row.dstAskPrice > 0 ? (
												<>
													<Typography
														variant="caption"
														sx={{
															color: "#69f0ae",
															display: "block",
															fontWeight: 600,
														}}
													>
														Bid B:{" "}
														{row.dstBidPrice > 0
															? `${row.dstBidPrice.toLocaleString()} (${row.dstBidQty.toLocaleString()} u)`
															: "-"}
													</Typography>
													<Typography
														variant="caption"
														sx={{
															color: "rgba(255,255,255,0.5)",
															display: "block",
														}}
													>
														Non-Loss Min:{" "}
														{row.effectiveNonLossPrice > 0
															? `>${row.effectiveNonLossPrice.toLocaleString()} ICA`
															: "-"}
													</Typography>
												</>
											) : (
												<Typography
													variant="body2"
													sx={{ color: "rgba(255,255,255,0.3)" }}
												>
													—
												</Typography>
											)}
										</TableCell>

										{/* ⚡ INSTANT BID FILL (Strictly Capped by Origin Supply & Dest BIDs) */}
										<TableCell align="right">
											{row.hasInstantData ? (
												<>
													<Typography
														variant="body2"
														sx={{
															color:
																row.instantNetProfit >= 0
																	? "#ffd700"
																	: "#ff5252",
															fontWeight: 800,
															fontSize: "0.85rem",
														}}
													>
														{row.instantNetProfit >= 0
															? `+${row.instantNetProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
															: row.instantNetProfit.toLocaleString(undefined, {
																	maximumFractionDigits: 0,
																})}{" "}
														ICA
													</Typography>
													<Typography
														variant="caption"
														sx={{
															color:
																row.instantNetProfit >= 0
																	? "rgba(255, 215, 0, 0.7)"
																	: "rgba(255, 82, 82, 0.7)",
															fontSize: "0.65rem",
															display: "block",
														}}
													>
														@ {row.instantBidPrice.toLocaleString()} ICA (
														{row.instantUnits.toLocaleString()} u)
													</Typography>
												</>
											) : (
												<Typography
													variant="body2"
													sx={{ color: "rgba(255,255,255,0.3)" }}
												>
													—
												</Typography>
											)}
										</TableCell>

										{/* 📈 EXPECTED VELOCITY (Strictly Capped by Origin Supply & Timeframe Velocity) */}
										<TableCell align="right">
											{row.hasExpectedData ? (
												<>
													<Typography
														variant="body2"
														sx={{
															color:
																row.expectedNetProfit >= 0
																	? "#69f0ae"
																	: "#ff5252",
															fontWeight: 800,
															fontSize: "0.85rem",
														}}
													>
														{row.expectedNetProfit >= 0
															? `+${row.expectedNetProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
															: row.expectedNetProfit.toLocaleString(
																	undefined,
																	{ maximumFractionDigits: 0 },
																)}{" "}
														ICA
													</Typography>
													<Typography
														variant="caption"
														sx={{
															color:
																row.expectedNetProfit >= 0
																	? "rgba(105, 240, 174, 0.7)"
																	: "rgba(255, 82, 82, 0.7)",
															fontSize: "0.65rem",
															display: "block",
														}}
													>
														Target @ {row.expectedTargetPrice.toLocaleString()}{" "}
														ICA ({row.expectedUnits.toLocaleString()} u)
													</Typography>
												</>
											) : (
												<Typography
													variant="body2"
													sx={{ color: "rgba(255,255,255,0.3)" }}
												>
													—
												</Typography>
											)}
										</TableCell>
									</TableRow>
								))}

								{paginatedOpportunities.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={7}
											align="center"
											sx={{ color: "rgba(255,255,255,0.3)", py: 6 }}
										>
											No cross-CX arbitrage opportunities match the selected
											filters.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</Box>

					{/* Table Pagination Controls */}
					<TablePagination
						component="div"
						count={filteredAndSortedOpportunities.length}
						page={page}
						onPageChange={(_, newPage) => setPage(newPage)}
						rowsPerPage={rowsPerPage}
						onRowsPerPageChange={(e) => {
							setRowsPerPage(parseInt(e.target.value, 10));
							setPage(0);
						}}
						rowsPerPageOptions={[10, 25, 50, 100]}
						sx={{
							color: "rgba(255,255,255,0.7)",
							borderTop: "1px solid rgba(255,255,255,0.08)",
							bgcolor: "rgba(16, 16, 32, 0.95)",
						}}
					/>
				</Paper>
			)}

			{/* Modal Dialog: Create Custom Ship Preset */}
			<Dialog
				open={builderOpen}
				onClose={() => setBuilderOpen(false)}
				PaperProps={{
					sx: {
						bgcolor: "rgba(16, 16, 32, 0.95)",
						border: "1px solid rgba(123, 104, 238, 0.4)",
						borderRadius: "16px",
						color: "white",
						minWidth: 360,
					},
				}}
			>
				<DialogTitle
					sx={{
						fontWeight: 800,
						color: "#7B68EE",
						borderBottom: "1px solid rgba(255,255,255,0.1)",
					}}
				>
					Create Custom Ship Preset
				</DialogTitle>
				<DialogContent
					sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2.5 }}
				>
					<TextField
						label="Ship Name / Preset Title"
						fullWidth
						size="small"
						value={newShipName}
						onChange={(e) => setNewShipName(e.target.value)}
						sx={{
							"& .MuiOutlinedInput-root": {
								bgcolor: "rgba(0,0,0,0.4)",
								color: "white",
							},
							"& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
						}}
					/>
					<TextField
						label="Cargo Volume Capacity (m³)"
						type="number"
						fullWidth
						size="small"
						value={newShipVol}
						onChange={(e) => setNewShipVol(parseFloat(e.target.value) || 0)}
						sx={{
							"& .MuiOutlinedInput-root": {
								bgcolor: "rgba(0,0,0,0.4)",
								color: "white",
							},
							"& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
						}}
					/>
					<TextField
						label="Cargo Mass Capacity (t)"
						type="number"
						fullWidth
						size="small"
						value={newShipMass}
						onChange={(e) => setNewShipMass(parseFloat(e.target.value) || 0)}
						sx={{
							"& .MuiOutlinedInput-root": {
								bgcolor: "rgba(0,0,0,0.4)",
								color: "white",
							},
							"& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
						}}
					/>
					<FormControl size="small" fullWidth>
						<InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>
							Hull Size Class
						</InputLabel>
						<Select
							value={newShipHull}
							label="Hull Size Class"
							onChange={(e: any) => setNewShipHull(e.target.value)}
							sx={{ bgcolor: "rgba(0,0,0,0.4)", color: "white" }}
						>
							<MenuItem value="SMALL">Small (Tiny / Scout)</MenuItem>
							<MenuItem value="MEDIUM">Medium (Freighter)</MenuItem>
							<MenuItem value="HEAVY">Heavy (Hauler)</MenuItem>
							<MenuItem value="SUPER">Super (Transport Mega)</MenuItem>
						</Select>
					</FormControl>
				</DialogContent>
				<DialogActions
					sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}
				>
					<Button
						onClick={() => setBuilderOpen(false)}
						sx={{ color: "rgba(255,255,255,0.6)" }}
					>
						Cancel
					</Button>
					<Button
						onClick={handleAddPreset}
						variant="contained"
						sx={{ bgcolor: "#7B68EE", fontWeight: 700 }}
					>
						Save Preset
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

const optimalUnitsCount = (
	buyQty: number,
	tradedQty: number,
	shipCap: number,
): number => {
	return Math.min(buyQty, tradedQty, shipCap);
};

const roundNum = (val: number, dec: number) => {
	const p = Math.pow(10, dec);
	return Math.round(val * p) / p;
};
