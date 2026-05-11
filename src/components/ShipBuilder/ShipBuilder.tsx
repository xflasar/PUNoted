import React, { useState, useEffect, useMemo } from "react";
import {
	Box,
	Typography,
	Button,
	IconButton,
	Select,
	MenuItem,
	Table,
	TableBody,
	TableRow,
	TableCell,
	TableContainer,
	Paper,
	Tooltip,
	TextField,
	Alert,
	TableHead,
	Stack,
	Grid,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import MaterialBadge from "../../COSM/components/MaterialBadge";
import OrderHeader from "./components/OrderHeader";

import { useShipPrices } from "./hooks/useApi";

const CORP_TICKER = "PUN";

// --- Core Options & Parts Data ---
const OPTIONS = {
	stlEngine: {
		Standard: {
			name: "Standard STL Engine",
			stat: "0.015 fuel units / second",
			ticker: "ENG",
			volDelta: 0,
		},
		FuelSaving: {
			name: "Fuel-saving STL Engine",
			stat: "0.0075 fuel units / second",
			ticker: "FSE",
			volDelta: -1,
		},
		Advanced: {
			name: "Advanced STL Engine",
			stat: "0.02 fuel units / second",
			ticker: "AEN",
			volDelta: 3,
		},
		Hyperthrust: {
			name: "Hyperthrust STL Engine",
			stat: "0.03 fuel units / second",
			ticker: "HTE",
			volDelta: 7,
		},
		GlassBased: {
			name: "Glass-based STL Engine",
			stat: "0.015 fuel units / second",
			ticker: "GEN",
			volDelta: -1,
		},
	},
	stlFuelTank: {
		Small: {
			name: "Small STL Fuel Tank Kit",
			stat: "Capacity: 1500 units",
			ticker: "SSL",
			volDelta: 0,
		},
		Medium: {
			name: "Medium STL Fuel Tank Kit",
			stat: "Capacity: 3500 units",
			ticker: "MSL",
			volDelta: 126,
		},
		Large: {
			name: "Large STL Fuel Tank Kit",
			stat: "Capacity: 8000 units",
			ticker: "LSL",
			volDelta: 410,
		},
	},
	ftlReactor: {
		None: {
			name: "--",
			stat: "0GW, charge factor 0",
			ticker: null,
			volDelta: 0,
		},
		Standard: {
			name: "Standard FTL Reactor",
			stat: "2400GW, charge factor 2",
			ticker: "RCT",
			volDelta: 0,
		},
		QuickCharge: {
			name: "Quick-charge FTL Reactor",
			stat: "2000GW, charge factor 10",
			ticker: "QCR",
			volDelta: 7,
		},
		HighPower: {
			name: "High-power FTL Reactor",
			stat: "4800GW, charge factor 15",
			ticker: "HPR",
			volDelta: 117,
		},
		HyperPower: {
			name: "Hyper-power FTL Reactor",
			stat: "7200GW, charge factor 30",
			ticker: "HYR",
			volDelta: 127,
		},
	},
	ftlFuelTank: {
		None: { name: "--", stat: "Capacity: 0 units", ticker: null, volDelta: 0 },
		Small: {
			name: "Small FTL Fuel Tank Kit",
			stat: "Capacity: 300 units",
			ticker: "SFL",
			volDelta: 0,
		},
		Medium: {
			name: "Medium FTL Fuel Tank Kit",
			stat: "Capacity: 800 units",
			ticker: "MFL",
			volDelta: 6,
		},
		Large: {
			name: "Large FTL Fuel Tank Kit",
			stat: "Capacity: 2000 units",
			ticker: "LFL",
			volDelta: 18,
		},
	},
	cargoBay: {
		Tiny: {
			name: "Tiny Cargo Bay Kit",
			stat: "Hold: 100t / 100m³",
			mapTo: "TINY",
			ticker: "TCB",
			volDelta: -420,
		},
		VerySmall: {
			name: "Very Small Cargo Bay Kit",
			stat: "Hold: 250t / 250m³",
			mapTo: "VSCB",
			ticker: "VSC",
			volDelta: -262,
		},
		Small: {
			name: "Small Cargo Bay Kit",
			stat: "Hold: 500t / 500m³",
			mapTo: "SCB",
			ticker: "SCB",
			volDelta: 0,
		},
		Medium: {
			name: "Medium Cargo Bay Kit",
			stat: "Hold: 1000t / 1000m³",
			mapTo: "MCB",
			ticker: "MCB",
			volDelta: 525,
		},
		Large: {
			name: "Large Cargo Bay Kit",
			stat: "Hold: 2000t / 2000m³",
			mapTo: "LCB",
			ticker: "LCB",
			volDelta: 1575,
		},
		Huge: {
			name: "Huge Cargo Bay Kit",
			stat: "Hold: 5000t / 5000m³",
			mapTo: "HCB",
			ticker: "HCB",
			volDelta: 4725,
		},
		HighVolume: {
			name: "High-volume Cargo Bay Kit",
			stat: "Hold: 1500t / 3000m³",
			mapTo: "VCB",
			ticker: "VCB",
			volDelta: 2625,
		},
		HighLoad: {
			name: "High-load Cargo Bay Kit",
			stat: "Hold: 3000t / 1000m³",
			mapTo: "WCB",
			ticker: "WCB",
			volDelta: 525,
		},
	},
	hullPlates: {
		Basic: {
			name: "Basic Hull Plate",
			stat: "0% damage reduction",
			ticker: "BHP",
		},
		Lightweight: {
			name: "Lightweight Hull Plate",
			stat: "-10% damage reduction",
			ticker: "LHP",
		},
		Reinforced: {
			name: "Reinforced Hull Plate",
			stat: "+10% damage reduction",
			ticker: "RHP",
		},
		Hardened: {
			name: "Hardened Hull Plate",
			stat: "+15% damage reduction",
			ticker: "HHP",
		},
		Advanced: {
			name: "Advanced Hull Plate",
			stat: "+30% damage reduction",
			ticker: "AHP",
		},
	},
	heatShielding: {
		None: { name: "--", stat: "0% damage reduction", ticker: null },
		Basic: {
			name: "Basic Thermal Protection Tile",
			stat: "+50% damage reduction",
			ticker: "BTP",
		},
		Advanced: {
			name: "Advanced Thermal Protection Tile",
			stat: "+100% damage reduction",
			ticker: "ATP",
		},
	},
	whippleShielding: {
		None: { name: "--", stat: "0% damage reduction", ticker: null },
		Basic: {
			name: "Basic Whipple Shielding",
			stat: "+50% damage reduction",
			ticker: "BWS",
		},
		Advanced: {
			name: "Advanced Whipple Shielding",
			stat: "+100% damage reduction",
			ticker: "AWS",
		},
	},
	stabilitySystem: {
		None: { name: "--", stat: "not protected", ticker: null },
		StabilitySupport: {
			name: "Stability Support System",
			stat: "protected",
			ticker: "STS",
		},
	},
	radiationShielding: {
		None: { name: "--", stat: "0% damage reduction", ticker: null },
		Basic: {
			name: "Basic Anti-rad Plate",
			stat: "+15% damage reduction",
			ticker: "BAP",
		},
		Advanced: {
			name: "Advanced Anti-rad Plate",
			stat: "+35% damage reduction",
			ticker: "AAP",
		},
		Specialized: {
			name: "Specialized Anti-rad Plate",
			stat: "+70% damage reduction",
			ticker: "SAP",
		},
	},
	selfRepairDroneHub: {
		None: { name: "--", stat: "0% damage reduction", ticker: null },
		Small: {
			name: "Small Ship-Repair Drone Operations Unit",
			stat: "+5% damage reduction",
			ticker: "SDR",
		},
		Large: {
			name: "Large Ship-Repair Drone Operations Unit",
			stat: "+10% damage reduction",
			ticker: "LDR",
		},
	},
	highGSeats: {
		None: { name: "--", stat: "--", ticker: null },
		Basic: {
			name: "Basic High-G Seats",
			stat: "+5 max g-factor",
			ticker: "BGS",
		},
		Advanced: {
			name: "Advanced High-G Seats",
			stat: "+12 max g-factor",
			ticker: "AGS",
		},
	},
};

const DEFAULT_EXTRAS = {
	heatShielding: "--",
	whippleShielding: "--",
	stabilitySystem: "--",
	radiationShielding: "--",
	selfRepairDroneHub: "--",
	highGSeats: "--",
};

// FIXME: This will be backend data eventually, but hardcoding for now to focus on frontend
const PRESETS = {
	WCB_STL: {
		name: "WCB (STL only)",
		basePrice: 2800000,
		corpPrice: 1878140,
		config: {
			stlEngine: "Fuel-saving STL Engine",
			stlFuelTank: "Small STL Fuel Tank Kit",
			ftlReactor: "--",
			ftlFuelTank: "--",
			cargoBay: "High-load Cargo Bay Kit",
			hullPlates: "Lightweight Hull Plate",
			...DEFAULT_EXTRAS,
		},
	},
	LCB_STL: {
		name: "LCB (STL only)",
		basePrice: 3100000,
		corpPrice: 2100000,
		config: {
			stlEngine: "Fuel-saving STL Engine",
			stlFuelTank: "Medium STL Fuel Tank Kit",
			ftlReactor: "--",
			ftlFuelTank: "--",
			cargoBay: "Large Cargo Bay Kit",
			hullPlates: "Basic Hull Plate",
			...DEFAULT_EXTRAS,
		},
	},
	VCB_STL: {
		name: "VCB (STL only)",
		basePrice: 3500000,
		corpPrice: 2450000,
		config: {
			stlEngine: "Advanced STL Engine",
			stlFuelTank: "Medium STL Fuel Tank Kit",
			ftlReactor: "--",
			ftlFuelTank: "--",
			cargoBay: "High-volume Cargo Bay Kit",
			hullPlates: "Basic Hull Plate",
			...DEFAULT_EXTRAS,
		},
	},
	WCB_FTL: {
		name: "WCB (FTL-equipped)",
		basePrice: 4600000,
		corpPrice: 3049837,
		config: {
			stlEngine: "Standard STL Engine",
			stlFuelTank: "Small STL Fuel Tank Kit",
			ftlReactor: "Standard FTL Reactor",
			ftlFuelTank: "Small FTL Fuel Tank Kit",
			cargoBay: "Medium Cargo Bay Kit",
			hullPlates: "Lightweight Hull Plate",
			...DEFAULT_EXTRAS,
		},
	},
	LCB_FTL: {
		name: "LCB (FTL-equipped)",
		basePrice: 5100000,
		corpPrice: 3450000,
		config: {
			stlEngine: "Standard STL Engine",
			stlFuelTank: "Small STL Fuel Tank Kit",
			ftlReactor: "Standard FTL Reactor",
			ftlFuelTank: "Small FTL Fuel Tank Kit",
			cargoBay: "Large Cargo Bay Kit",
			hullPlates: "Basic Hull Plate",
			...DEFAULT_EXTRAS,
		},
	},
	VCB_FTL: {
		name: "VCB (FTL-equipped)",
		basePrice: 5600000,
		corpPrice: 3850000,
		config: {
			stlEngine: "Advanced STL Engine",
			stlFuelTank: "Small STL Fuel Tank Kit",
			ftlReactor: "Standard FTL Reactor",
			ftlFuelTank: "Small FTL Fuel Tank Kit",
			cargoBay: "High-volume Cargo Bay Kit",
			hullPlates: "Basic Hull Plate",
			...DEFAULT_EXTRAS,
		},
	},
	HCB_FTL: {
		name: "HCB (FTL-equipped)",
		basePrice: 9000000,
		corpPrice: 4735092,
		config: {
			stlEngine: "Standard STL Engine",
			stlFuelTank: "Small STL Fuel Tank Kit",
			ftlReactor: "Quick-charge FTL Reactor",
			ftlFuelTank: "Large FTL Fuel Tank Kit",
			cargoBay: "High-load Cargo Bay Kit",
			hullPlates: "Basic Hull Plate",
			...DEFAULT_EXTRAS,
		},
	},
};

const ShipVisualizer: React.FC<{ cargoType: string }> = ({ cargoType }) => {
	const renderHull = () => {
		switch (cargoType) {
			case "WCB":
				return (
					<rect
						x="100"
						y="100"
						width="200"
						height="250"
						rx="20"
						fill="#b45309"
						stroke="#78350f"
						strokeWidth="4"
					/>
				);
			case "HCB":
				return (
					<polygon
						points="80,100 320,100 300,350 100,350"
						fill="#334155"
						stroke="#0f172a"
						strokeWidth="6"
					/>
				);
			case "LCB":
				return (
					<circle
						cx="200"
						cy="225"
						r="120"
						fill="#0284c7"
						stroke="#0369a1"
						strokeWidth="4"
					/>
				);
			case "VCB":
				return (
					<rect
						x="120"
						y="80"
						width="160"
						height="280"
						rx="10"
						fill="#7e22ce"
						stroke="#581c87"
						strokeWidth="4"
					/>
				);
			default:
				return (
					<rect
						x="150"
						y="100"
						width="100"
						height="200"
						fill="transparent"
						stroke="#334155"
						strokeWidth="2"
						strokeDasharray="10,10"
					/>
				);
		}
	};
	return (
		<Box
			sx={{
				width: "100%",
				height: 300,
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				bgcolor: "#0a0f1a",
				borderRadius: 1,
				border: "1px solid #2a2a35",
				flexShrink: 0,
			}}
		>
			<svg
				width="100%"
				height="100%"
				viewBox="0 0 400 400"
				xmlns="http://www.w3.org/2000/svg"
			>
				{renderHull()}
				<g>
					<rect x="160" y="340" width="30" height="40" fill="#1e293b" />
					<rect x="210" y="340" width="30" height="40" fill="#1e293b" />
					<polygon
						points="160,380 190,380 175,420"
						fill="#06b6d4"
						opacity="0.8"
					/>
					<polygon
						points="210,380 240,380 225,420"
						fill="#06b6d4"
						opacity="0.8"
					/>
				</g>
			</svg>
		</Box>
	);
};

// --- Main Component ---
export default function ShipBuilder({ onBack }: { onBack: () => void }) {
	const [identity, setIdentity] = useState({ username: "", company: "" });
	const [selectedPresetId, setSelectedPresetId] =
		useState<keyof typeof PRESETS>("WCB_STL");
	const [config, setConfig] = useState(PRESETS["WCB_STL"].config);
	const [orderCount, setOrderCount] = useState(0);

	const { cxPrices, corpPrices, isFetchingPrices } = useShipPrices();

	const isCorpMember = identity.company.toUpperCase() === CORP_TICKER;
	const isLimitReached = orderCount >= 5;

	const isCustomBuild = useMemo(() => {
		const presetConfig = PRESETS[selectedPresetId]?.config as any;
		const currentConfig = config as any;
		if (!presetConfig || !currentConfig) return true;
		return Object.keys(presetConfig).some(
			(key) => presetConfig[key] !== currentConfig[key],
		);
	}, [selectedPresetId, config]);

	const currentPrice = isCorpMember
		? PRESETS[selectedPresetId]?.corpPrice
		: PRESETS[selectedPresetId]?.basePrice;

	const handlePresetChange = (presetId: keyof typeof PRESETS) => {
		setSelectedPresetId(presetId);
		setConfig(PRESETS[presetId].config);
	};

	const handleUpdateConfig = (key: keyof typeof config, value: string) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
	};

	// --- PHYSICS ENGINE ---
	const shipBOM = useMemo(() => {
		const getOpt = (cat: keyof typeof OPTIONS, name: string) =>
			Object.values(OPTIONS[cat]).find((o: any) => o.name === name) as any;

		const stlEngine = getOpt("stlEngine", config.stlEngine);
		const stlFuelTank = getOpt("stlFuelTank", config.stlFuelTank);
		const ftlReactor = getOpt("ftlReactor", config.ftlReactor);
		const ftlFuelTank = getOpt("ftlFuelTank", config.ftlFuelTank);
		const cargoBay = getOpt("cargoBay", config.cargoBay);
		const hullPlates = getOpt("hullPlates", config.hullPlates);

		const heatShielding = getOpt("heatShielding", config.heatShielding);
		const whippleShielding = getOpt(
			"whippleShielding",
			config.whippleShielding,
		);
		const radiationShielding = getOpt(
			"radiationShielding",
			config.radiationShielding,
		);
		const stabilitySystem = getOpt("stabilitySystem", config.stabilitySystem);
		const selfRepairDroneHub = getOpt(
			"selfRepairDroneHub",
			config.selfRepairDroneHub,
		);
		const highGSeats = getOpt("highGSeats", config.highGSeats);

		const isFtl = ftlReactor?.ticker && ftlFuelTank?.ticker;

		let volume = 963;
		volume += (stlEngine?.volDelta || 0) + (stlFuelTank?.volDelta || 0);
		volume += (ftlReactor?.volDelta || 0) + (ftlFuelTank?.volDelta || 0);
		volume += cargoBay?.volDelta || 0;
		if (!isFtl) volume -= 129;

		const sscCount = Math.ceil(volume / 21);
		const plateCount = Math.ceil(Math.pow(volume, 2 / 3) / 2.07);

		let cqTicker = "CQL";
		if (volume < 1000) cqTicker = "CQT";
		else if (volume < 1750) cqTicker = "CQS";
		else if (volume < 2750) cqTicker = "CQM";

		let bridgeTicker = "BRS";
		if (isFtl) {
			if (ftlReactor.ticker === "RCT" || ftlReactor.ticker === "QCR")
				bridgeTicker = "BR1";
			else bridgeTicker = "BR2";
		}

		let lfe = 0,
			mfe = 0,
			sfe = 0;
		if (isFtl) {
			lfe = Math.floor(volume / 1000);
			const remainder = volume % 1000;
			if (remainder > 0) {
				const working = (remainder * 20) / (10 + lfe);
				mfe = Math.floor(working / 500);
				const leftover = working - mfe * 500;
				sfe = leftover > 0 ? Math.ceil(leftover / 250) : 0;
			}
		}

		const rawBom = [
			{ ticker: stlEngine?.ticker, qty: 1 },
			{ ticker: stlFuelTank?.ticker, qty: 1 },
			{ ticker: ftlReactor?.ticker, qty: 1 },
			{ ticker: ftlFuelTank?.ticker, qty: 1 },
			{ ticker: cargoBay?.ticker, qty: 1 },
			{ ticker: hullPlates?.ticker, qty: plateCount },
			{ ticker: heatShielding?.ticker, qty: plateCount },
			{ ticker: whippleShielding?.ticker, qty: plateCount },
			{ ticker: radiationShielding?.ticker, qty: plateCount },
			{ ticker: stabilitySystem?.ticker, qty: 1 },
			{ ticker: selfRepairDroneHub?.ticker, qty: 1 },
			{ ticker: highGSeats?.ticker, qty: 1 },
			{ ticker: "SSC", qty: sscCount },
			{ ticker: bridgeTicker, qty: 1 },
			{ ticker: cqTicker, qty: 1 },
		];

		if (isFtl) {
			rawBom.push(
				{ ticker: "FFC", qty: 1 },
				{ ticker: "LFE", qty: lfe },
				{ ticker: "MFE", qty: mfe },
				{ ticker: "SFE", qty: sfe },
			);
		}

		return {
			bom: rawBom
				.filter((p) => p.ticker && p.qty > 0)
				.map((p) => ({ ticker: p.ticker as string, quantity: p.qty })),
			volume,
			sscCount,
			plateCount,
		};
	}, [config]);

	const activeCargoData =
		Object.values(OPTIONS.cargoBay).find(
			(c: any) => c.name === config.cargoBay,
		) || Object.values(OPTIONS.cargoBay)[0];
	const activeVisualizerClass = (activeCargoData as any).mapTo;

	useEffect(() => {
		if (identity.username.length > 2) {
			const allOrders = JSON.parse(
				localStorage.getItem("mock_ship_orders") || "[]",
			);
			const userOrders = allOrders.filter(
				(o: any) =>
					o.ownerId === identity.username || o.company === identity.company,
			);
			setOrderCount(userOrders.length);
		} else {
			setOrderCount(0);
		}
	}, [identity]);

	const handleSubmitOrder = () => {
		if (isLimitReached || !identity.username) return;

		const newOrder = {
			id: `ORD-${Math.floor(Math.random() * 10000)}`,
			config,
			bom: shipBOM.bom,
			ownerId: identity.username,
			company: identity.company,
			price: isCustomBuild ? null : currentPrice,
			isCorpOrder: isCorpMember,
			status: isCustomBuild ? "PENDING_APPROVAL" : "APPROVED",
			createdAt: new Date().toISOString(),
		};

		const existing = JSON.parse(
			localStorage.getItem("mock_ship_orders") || "[]",
		);
		existing.push(newOrder);
		localStorage.setItem("mock_ship_orders", JSON.stringify(existing));
		window.dispatchEvent(new Event("storage"));
		onBack();
	};

	const LayoutRow = ({
		label,
		configKey,
		options,
	}: {
		label: string;
		configKey: keyof typeof config;
		options: Record<string, any>;
	}) => {
		const currentValue = config[configKey] || "";
		const currentStat =
			Object.values(options).find((o: any) => o.name === currentValue)?.stat ||
			"";

		return (
			<TableRow
				sx={{ "& td": { borderBottom: "1px solid #2a2a35", py: 0.5, px: 1 } }}
			>
				<TableCell
					sx={{
						width: "30%",
						bgcolor: "#1c1b27",
						color: "#66b2ff",
						fontWeight: "bold",
					}}
				>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography
							variant="body2"
							sx={{
								fontWeight: "bold",
								fontSize: "0.875rem",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{label}
						</Typography>
						<Tooltip title={`Select ${label}`}>
							<InfoOutlinedIcon
								sx={{ fontSize: 16, color: "text.secondary", ml: 1 }}
							/>
						</Tooltip>
					</Box>
				</TableCell>
				<TableCell sx={{ width: "40%", bgcolor: "#242333" }}>
					<Select
						value={currentValue}
						onChange={(e) => handleUpdateConfig(configKey, e.target.value)}
						size="small"
						fullWidth
						variant="standard"
						disableUnderline
						MenuProps={{
							PaperProps: {
								sx: {
									bgcolor: "#1c1b27",
									border: "1px solid #2a2a35",
									color: "white",
								},
							},
						}}
						sx={{
							color: "white",
							fontSize: "0.875rem",
							"& .MuiSelect-select": {
								py: 0.5,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							},
							"& .MuiSvgIcon-root": { color: "#f59e0b" },
						}}
					>
						{Object.values(options).map((opt: any) => (
							<MenuItem
								key={opt.name}
								value={opt.name}
								sx={{ fontSize: "0.875rem", "&:hover": { bgcolor: "#2a2a35" } }}
							>
								{opt.name}
							</MenuItem>
						))}
					</Select>
				</TableCell>
				<TableCell
					sx={{
						width: "30%",
						bgcolor: "#1c1b27",
						color: "text.secondary",
						textAlign: "right",
						fontSize: "0.875rem",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{currentStat}
				</TableCell>
			</TableRow>
		);
	};

	return (
		<Box
			sx={{
				width: "100%",
				height: "100%",
				p: 2,
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* HEADER ROW */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					mb: 3,
					gap: 2,
					flexShrink: 0,
				}}
			>
				<IconButton
					onClick={onBack}
					color="primary"
					sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
				>
					<ArrowBackIcon />
				</IconButton>
				<Typography variant="h5" fontWeight="bold">
					Shipyard Blueprint Editor
				</Typography>
			</Box>

			{/* FLEXBOX: Left and Right Columns */}
			<Box
				sx={{
					display: "flex",
					flexDirection: { xs: "column", lg: "row" },
					gap: 3,
					flexGrow: 1,
					alignItems: "stretch",
				}}
			>
				{/* LEFT COLUMN: Red (Visualizer), Purple (Identity), Yellow (BOM) */}
				<Box
					sx={{
						flex: 1,
						minWidth: 0,
						display: "flex",
						flexDirection: "column",
						gap: 3,
					}}
				>
					<OrderHeader
						identity={identity}
						isCorpMember={isCorpMember}
						setIdentity={setIdentity}
					/>

					{/* Visualizer */}
					<ShipVisualizer cargoType={activeVisualizerClass} />

					{/* Bill of Parts & Pricing */}
					<Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
						<TableContainer
							component={Paper}
							sx={{
								bgcolor: "transparent",
								borderRadius: 0,
								border: "1px solid #2a2a35",
								maxHeight: 300,
								overflowY: "auto",
							}}
						>
							<Table size="small" stickyHeader sx={{ tableLayout: "fixed" }}>
								<TableHead>
									<TableRow
										sx={{
											"& th": {
												borderBottom: "1px solid #2a2a35",
												bgcolor: "#1c1b27",
												color: "text.secondary",
												py: 0.5,
											},
										}}
									>
										<TableCell sx={{ width: "20%" }}>Part</TableCell>
										<TableCell sx={{ width: "15%" }} align="right">
											Qty
										</TableCell>
										<TableCell sx={{ width: "30%" }} align="right">
											Est. CX
										</TableCell>
										{isCorpMember && (
											<TableCell
												sx={{ width: "30%", color: "success.light" }}
												align="right"
											>
												Corp Unit
											</TableCell>
										)}
										<TableCell sx={{ width: "35%" }} align="right">
											Total
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{shipBOM.bom.map((part) => {
										const cxPriceMat = cxPrices.find(
											(c) => c.ticker.replace(".IC1", "") === part.ticker,
										);
										console.log(cxPriceMat);

										const cxPrice = cxPriceMat
											? cxPriceMat.askprice || cxPriceMat.bidprice || 0
											: 0;

										console.log(
											`Part ${part.ticker}: CX Price = ${cxPrice}, Corp Price = ${corpPrices[part.ticker]}`,
										);

										const corpPrice = corpPrices[part.ticker];
										const activeUnitPrice =
											isCorpMember && corpPrice ? corpPrice : cxPrice;
										const rowTotal = activeUnitPrice * part.quantity;

										return (
											<TableRow
												key={part.ticker}
												sx={{
													"& td": {
														borderBottom: "1px solid #2a2a35",
														py: 0.5,
														px: 2,
													},
												}}
											>
												<TableCell sx={{ color: "white", fontWeight: "bold" }}>
													<MaterialBadge ticker={part.ticker} />
												</TableCell>
												<TableCell
													align="right"
													sx={{ color: "text.secondary" }}
												>
													{part.quantity}
												</TableCell>

												<TableCell
													align="right"
													sx={{
														color:
															isCorpMember && corpPrice
																? "text.disabled"
																: "text.secondary",
														textDecoration:
															isCorpMember && corpPrice
																? "line-through"
																: "none",
													}}
												>
													₡{cxPrice.toLocaleString()}
												</TableCell>

												{isCorpMember && (
													<TableCell
														align="right"
														sx={{
															color: corpPrice
																? "success.main"
																: "text.secondary",
														}}
													>
														{corpPrice
															? `₡${corpPrice.toLocaleString()}`
															: "--"}
													</TableCell>
												)}

												<TableCell
													align="right"
													sx={{ color: "#66b2ff", fontWeight: "bold" }}
												>
													₡{rowTotal.toLocaleString()}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</TableContainer>
					</Box>
				</Box>

				{/* RIGHT COLUMN: Presets & Layout, Checkout */}
				<Box
					sx={{
						flex: 1,
						minWidth: 0,
						display: "flex",
						flexDirection: "column",
						gap: 3,
					}}
				>
					{/* Presets + Layout Blueprint */}
					<Box sx={{ display: "flex", flexDirection: "column" }}>
						<Box
							sx={{
								bgcolor: "#1c1b27",
								border: "1px solid #2a2a35",
								p: 2,
								mb: 2,
							}}
						>
							<Typography
								variant="subtitle2"
								color="primary.light"
								sx={{
									mb: 1,
									display: "flex",
									alignItems: "center",
									gap: 1,
									fontWeight: "bold",
								}}
							>
								<ArchitectureIcon fontSize="small" /> Load Approved Baseline
							</Typography>
							<Select
								value={selectedPresetId}
								onChange={(e) =>
									handlePresetChange(e.target.value as keyof typeof PRESETS)
								}
								fullWidth
								variant="outlined"
								size="small"
								MenuProps={{
									PaperProps: {
										sx: {
											bgcolor: "#1c1b27",
											border: "1px solid #2a2a35",
											color: "white",
										},
									},
								}}
								sx={{
									color: "white",
									bgcolor: "#242333",
									"& .MuiOutlinedInput-notchedOutline": {
										borderColor: "#2a2a35",
									},
									"&:hover .MuiOutlinedInput-notchedOutline": {
										borderColor: "#66b2ff",
									},
								}}
							>
								{Object.entries(PRESETS).map(([id, data]) => (
									<MenuItem
										key={id}
										value={id}
										sx={{ "&:hover": { bgcolor: "#2a2a35" } }}
									>
										{data.name} - ₡
										{isCorpMember
											? data.corpPrice.toLocaleString()
											: data.basePrice.toLocaleString()}
									</MenuItem>
								))}
							</Select>
						</Box>
						<TableContainer
							component={Paper}
							sx={{
								bgcolor: "transparent",
								borderRadius: 0,
								border: "1px solid #2a2a35",
							}}
						>
							<Table size="small" sx={{ tableLayout: "fixed" }}>
								<TableBody>
									<LayoutRow
										label="STL Engine"
										configKey="stlEngine"
										options={OPTIONS.stlEngine}
									/>
									<LayoutRow
										label="STL fuel tank"
										configKey="stlFuelTank"
										options={OPTIONS.stlFuelTank}
									/>
									<LayoutRow
										label="FTL Reactor"
										configKey="ftlReactor"
										options={OPTIONS.ftlReactor}
									/>
									<LayoutRow
										label="FTL fuel tank"
										configKey="ftlFuelTank"
										options={OPTIONS.ftlFuelTank}
									/>
									<LayoutRow
										label="Cargo bay"
										configKey="cargoBay"
										options={OPTIONS.cargoBay}
									/>
									<LayoutRow
										label="Hull plates"
										configKey="hullPlates"
										options={OPTIONS.hullPlates}
									/>
									<LayoutRow
										label="Heat shielding"
										configKey="heatShielding"
										options={OPTIONS.heatShielding}
									/>
									<LayoutRow
										label="Whipple Shielding"
										configKey="whippleShielding"
										options={OPTIONS.whippleShielding}
									/>
									<LayoutRow
										label="Stability System"
										configKey="stabilitySystem"
										options={OPTIONS.stabilitySystem}
									/>
									<LayoutRow
										label="Radiation Shielding"
										configKey="radiationShielding"
										options={OPTIONS.radiationShielding}
									/>
									<LayoutRow
										label="Self-repair Hub"
										configKey="selfRepairDroneHub"
										options={OPTIONS.selfRepairDroneHub}
									/>
									<LayoutRow
										label="High-G Seats"
										configKey="highGSeats"
										options={OPTIONS.highGSeats}
									/>
								</TableBody>
							</Table>
						</TableContainer>
					</Box>

					{/* Spacer to push checkout block to the bottom */}
					<Box sx={{ flexGrow: 1 }} />

					{/* Alerts and Checkout Block */}
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
						{isCustomBuild && (
							<Alert
								severity="warning"
								sx={{
									border: "1px solid",
									borderColor: "warning.main",
									bgcolor: "rgba(237, 108, 2, 0.1)",
									color: "warning.light",
								}}
							>
								<strong>Custom Configuration:</strong> You modified the baseline
								blueprint. Final cost will be evaluated by Admin.
							</Alert>
						)}

						{isLimitReached && (
							<Alert
								severity="error"
								sx={{
									border: "1px solid",
									borderColor: "error.main",
									bgcolor: "rgba(211, 47, 47, 0.1)",
									color: "error.light",
								}}
							>
								<strong>Limit Reached:</strong> Maximum active orders (5)
								reached. Please wait for current orders to complete.
							</Alert>
						)}

						<Paper
							sx={{
								bgcolor: "#1c1b27",
								border: "1px solid #2a2a35",
								p: 3,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Box>
								<Typography variant="body2" color="text.secondary">
									Total Order Cost:
								</Typography>
								<Typography
									variant="h5"
									fontWeight="bold"
									color={
										isCustomBuild
											? "warning.main"
											: isCorpMember
												? "success.light"
												: "white"
									}
								>
									{isCustomBuild
										? "TBD by Admin"
										: `₡ ${currentPrice?.toLocaleString()}`}
								</Typography>
							</Box>

							<Button
								variant="contained"
								size="large"
								onClick={handleSubmitOrder}
								disabled={
									!identity.username || !identity.company || isLimitReached
								}
								sx={{
									bgcolor: isCustomBuild ? "warning.dark" : "#2e3b32",
									color: isCustomBuild ? "white" : "#4ade80",
									px: 4,
									"&:hover": {
										bgcolor: isCustomBuild ? "warning.main" : "#22c55e",
										color: "black",
									},
									"&.Mui-disabled": {
										bgcolor: "#2a2a35",
										color: "text.secondary",
									},
								}}
							>
								{isCustomBuild
									? "SUBMIT FOR APPROVAL"
									: "PLACE AUTO-APPROVED ORDER"}
							</Button>
						</Paper>
					</Box>
				</Box>
			</Box>
		</Box>
	);
}
