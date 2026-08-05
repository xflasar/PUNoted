import React, { useState, useMemo, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Box,
	Typography,
	Button,
	Checkbox,
	TextField,
	Select,
	MenuItem,
	ListSubheader,
	FormControl,
	Chip,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	IconButton,
	Switch,
	FormControlLabel,
	useTheme,
	ToggleButtonGroup,
	ToggleButton,
	Tabs,
	Tab,
} from "@mui/material";
import { Copy, X, TrendingUp, Truck } from "lucide-react";
import MaterialBadge from "../../../../cosm/components/materialbadge";
import {
	getMatProps,
	CARGO_BAYS,
	copyToClipboard,
} from "../../../production/components/sitedrawer/utils";
import {
	generateSupplyXit,
	generateExportXit,
} from "../../../../utils/xitgenerator";
import { useGlobalData } from "../../../../context/globaldatacontext";
import { CONSUMABLE_TICKERS } from "./utils";
import type { FastLogisticsModalProps } from "./types";

export const FastLogisticsModal: React.FC<FastLogisticsModalProps> = ({
	open,
	onClose,
	initialTab = "resupply",
	siteName,
	consumptionList = [],
	productionList = [],
	storageList = [],
	targetDays = 30,
	siteStorageCapacity = 1500,
	warehouseStorageCapacity = 5000,
	onShowSnackbar,
}) => {
	const theme = useTheme();
	const globalData = useGlobalData();
	const globalGetMatProps = globalData?.getMatProps || getMatProps;

	// Active Tab State ("resupply" | "export")
	const [activeTab, setActiveTab] = useState<"resupply" | "export">(initialTab);

	useEffect(() => {
		if (open) {
			setActiveTab(initialTab);
		}
	}, [open, initialTab]);

	// Common Ship Selection State
	const [selectedShipId, setSelectedShipId] = useState<string>("LCB");
	const [shipSearchTerm, setShipSearchTerm] = useState<string>("");

	// Active Fleet Ships sourced exclusively from Global Data Context (WebSocket updated)
	const fleetShips = useMemo(() => {
		if (globalData?.ownerShips && globalData.ownerShips.length > 0) {
			return globalData.ownerShips;
		}
		if (globalData?.allShips && globalData.allShips.size > 0) {
			return Array.from(globalData.allShips.values());
		}
		return [];
	}, [globalData?.ownerShips, globalData?.allShips]);

	// Filtered Fleet Ships for Search Input
	const filteredFleetShips = useMemo(() => {
		if (!shipSearchTerm.trim()) return fleetShips;
		const term = shipSearchTerm.toLowerCase();
		return fleetShips.filter(
			(s: any) =>
				(s.name || "").toLowerCase().includes(term) ||
				(s.registration || "").toLowerCase().includes(term) ||
				(s.id || "").toLowerCase().includes(term),
		);
	}, [fleetShips, shipSearchTerm]);

	// All Storage Units from Global Context
	const storageUnits = useMemo(() => {
		if (globalData?.storageState?.units) {
			return Object.values(globalData.storageState.units);
		}
		return [];
	}, [globalData?.storageState]);

	// Selected Ship Profile + Matching Storage Unit Capacity & Current Load
	const { selectedShip, existingCargoVol, existingCargoMass } = useMemo(() => {
		const foundUserShip = fleetShips.find(
			(s: any) =>
				s.id === selectedShipId ||
				s.registration === selectedShipId ||
				s.name === selectedShipId,
		);

		if (foundUserShip) {
			const shipStoreId =
				(foundUserShip as any).id_ship_store ||
				(foundUserShip as any).shipstoreid ||
				foundUserShip.id ||
				foundUserShip.registration;

			const shipStorageUnit: any = storageUnits.find((u: any) => {
				const isShipStoreType = u.type === "SHIP_STORE" || u.type === "SHIP";
				const matchesId =
					u.addressableid === shipStoreId ||
					u.storageid === shipStoreId ||
					u.id === shipStoreId;
				const matchesName =
					u.name === foundUserShip.registration ||
					u.name === foundUserShip.name;
				return (isShipStoreType && (matchesId || matchesName)) || matchesId;
			});

			const vol =
				shipStorageUnit?.volumecapacity ||
				(foundUserShip as any).volumecapacity ||
				(foundUserShip as any).volume ||
				1500;
			const weight =
				shipStorageUnit?.weightcapacity ||
				(foundUserShip as any).weightcapacity ||
				(foundUserShip as any).weight ||
				1500;

			let existingVol = Number(
				shipStorageUnit?.volumeload || (foundUserShip as any).volumeload || 0,
			);
			let existingMass = Number(
				shipStorageUnit?.weightload || (foundUserShip as any).weightload || 0,
			);

			if ((!existingVol || !existingMass) && shipStorageUnit?.items) {
				let calcVol = 0;
				let calcMass = 0;
				shipStorageUnit.items.forEach((item: any) => {
					const ticker = item.materialTicker || item.ticker || item.name;
					const qty = Number(item.amount || item.quantity || 0);
					const props = globalGetMatProps(ticker);
					calcVol += qty * props.volume;
					calcMass += qty * props.weight;
				});
				if (calcVol > 0 && !existingVol) existingVol = calcVol;
				if (calcMass > 0 && !existingMass) existingMass = calcMass;
			}

			return {
				selectedShip: {
					name: foundUserShip.name || foundUserShip.registration,
					volCap: Number(vol) || 1500,
					weightCap: Number(weight) || 1500,
					reg: foundUserShip.registration || foundUserShip.name,
					shipId: foundUserShip.id,
				},
				existingCargoVol: existingVol,
				existingCargoMass: existingMass,
			};
		}

		const preset =
			CARGO_BAYS.find((b) => b.id === selectedShipId) || CARGO_BAYS[0];
		const vol = preset?.volume || (preset as any)?.capacity || 2000;
		const weight = preset?.weight || (preset as any)?.weightCapacity || 2000;

		return {
			selectedShip: {
				name: preset?.name || "Cargo Ship",
				volCap: Number(vol) || 2000,
				weightCap: Number(weight) || 2000,
				reg: preset?.id || "LCB",
				shipId: preset?.id,
			},
			existingCargoVol: 0,
			existingCargoMass: 0,
		};
	}, [selectedShipId, fleetShips, storageUnits, globalGetMatProps]);

	// Storage breakdown
	const { siteVol, siteMass, whVol, whMass } = useMemo(() => {
		let sv = 0,
			sm = 0,
			wv = 0,
			wm = 0;
		(storageList || []).forEach((s) => {
			const props = globalGetMatProps(s.ticker);
			const v = (s.amount || 0) * props.volume;
			const m = (s.amount || 0) * props.weight;
			if (s.type === "warehouse") {
				wv += v;
				wm += m;
			} else {
				sv += v;
				sm += m;
			}
		});
		return { siteVol: sv, siteMass: sm, whVol: wv, whMass: wm };
	}, [storageList, globalGetMatProps]);

	const siteCapVol = siteStorageCapacity || 1500;
	const siteCapMass = siteStorageCapacity || 1500;
	const whCapVol = warehouseStorageCapacity || 0;
	const whCapMass = warehouseStorageCapacity || 0;

	const totalCapVol = siteCapVol + whCapVol;
	const totalCapMass = siteCapMass + whCapMass;

	const siteVolPct = Math.min(100, Math.round((siteVol / siteCapVol) * 100));
	const siteMassPct = Math.min(100, Math.round((siteMass / siteCapMass) * 100));

	const whVolPct =
		whCapVol > 0 ? Math.min(100, Math.round((whVol / whCapVol) * 100)) : 0;
	const whMassPct =
		whCapMass > 0 ? Math.min(100, Math.round((whMass / whCapMass) * 100)) : 0;

	const totalStoredVol = siteVol + whVol;
	const totalStoredMass = siteMass + whMass;

	const totalVolPct = Math.min(
		100,
		Math.round((totalStoredVol / totalCapVol) * 100),
	);
	const totalMassPct = Math.min(
		100,
		Math.round((totalStoredMass / totalCapMass) * 100),
	);

	// --- RESUPPLY TAB LOGIC ---
	const [resupplyMode, setResupplyMode] = useState<
		"consumables" | "production" | "all"
	>("consumables");
	const [supplyDays, setSupplyDays] = useState<number>(targetDays || 30);
	const [resupplySelectedMap, setResupplySelectedMap] = useState<
		Record<string, boolean>
	>({});
	const [resupplyCustomQtys, setResupplyCustomQtys] = useState<
		Record<string, number>
	>({});

	const resupplyCandidates = useMemo(() => {
		return consumptionList.filter((c) => {
			const isConsumable = CONSUMABLE_TICKERS.has(c.ticker.toUpperCase());
			if (resupplyMode === "consumables") return isConsumable;
			if (resupplyMode === "production") return !isConsumable;
			return true;
		});
	}, [consumptionList, resupplyMode]);

	useEffect(() => {
		const newSel: Record<string, boolean> = {};
		const newQtys: Record<string, number> = {};

		resupplyCandidates.forEach((c) => {
			newSel[c.ticker] = true;
			const dailyBurn = Math.abs(c.flow);
			const needed = Math.max(
				0,
				Math.round(dailyBurn * supplyDays - (c.siteAmount || 0)),
			);
			newQtys[c.ticker] =
				needed > 0 ? needed : Math.round(dailyBurn * supplyDays);
		});

		setResupplySelectedMap(newSel);
		setResupplyCustomQtys(newQtys);
	}, [resupplyCandidates, supplyDays]);

	const { resupplyVol, resupplyMass } = useMemo(() => {
		let v = 0,
			m = 0;
		resupplyCandidates.forEach((c) => {
			if (resupplySelectedMap[c.ticker]) {
				const qty = resupplyCustomQtys[c.ticker] || 0;
				const props = globalGetMatProps(c.ticker);
				v += qty * props.volume;
				m += qty * props.weight;
			}
		});
		return { resupplyVol: v, resupplyMass: m };
	}, [
		resupplyCandidates,
		resupplySelectedMap,
		resupplyCustomQtys,
		globalGetMatProps,
	]);

	const handleCopyResupplyXit = () => {
		const mats: Record<string, number> = {};
		resupplyCandidates.forEach((c) => {
			if (
				resupplySelectedMap[c.ticker] &&
				(resupplyCustomQtys[c.ticker] || 0) > 0
			) {
				mats[c.ticker] = resupplyCustomQtys[c.ticker];
			}
		});

		if (Object.keys(mats).length === 0) {
			if (onShowSnackbar) onShowSnackbar("No items selected for resupply.");
			return;
		}

		const xit = generateSupplyXit({
			siteName,
			materials: mats,
			shipReg: selectedShip.reg,
		});

		copyToClipboard(xit);
		if (onShowSnackbar)
			onShowSnackbar("Copied XIT Resupply payload to clipboard!");
	};

	// --- EXPORT TAB LOGIC ---
	const [includeCons, setIncludeCons] = useState<boolean>(false);
	const [exportSelectedMap, setExportSelectedMap] = useState<
		Record<string, boolean>
	>({});
	const [exportQtys, setExportQtys] = useState<Record<string, number>>({});

	const exportCandidates = useMemo(() => {
		const itemsMap = new Map<
			string,
			{ ticker: string; storedQty: number; flow: number }
		>();

		(productionList || []).forEach((p) => {
			itemsMap.set(p.ticker, {
				ticker: p.ticker,
				storedQty: 0,
				flow: p.flow,
			});
		});

		(storageList || []).forEach((s) => {
			if (!s.type || s.type === "site") {
				if (itemsMap.has(s.ticker)) {
					itemsMap.get(s.ticker)!.storedQty = s.amount || 0;
				} else if (includeCons) {
					itemsMap.set(s.ticker, {
						ticker: s.ticker,
						storedQty: s.amount || 0,
						flow: 0,
					});
				}
			}
		});

		return Array.from(itemsMap.values());
	}, [productionList, storageList, includeCons]);

	useEffect(() => {
		const newSel: Record<string, boolean> = {};
		const newQtys: Record<string, number> = {};

		exportCandidates.forEach((c) => {
			newSel[c.ticker] = true;
			newQtys[c.ticker] =
				c.storedQty > 0 ? c.storedQty : Math.round(c.flow * 3);
		});

		setExportSelectedMap(newSel);
		setExportQtys(newQtys);
	}, [exportCandidates]);

	const { exportVol, exportMass } = useMemo(() => {
		let v = 0,
			m = 0;
		exportCandidates.forEach((c) => {
			if (exportSelectedMap[c.ticker]) {
				const qty = exportQtys[c.ticker] || 0;
				const props = globalGetMatProps(c.ticker);
				v += qty * props.volume;
				m += qty * props.weight;
			}
		});
		return { exportVol: v, exportMass: m };
	}, [exportCandidates, exportSelectedMap, exportQtys, globalGetMatProps]);

	const activeBatchVol = activeTab === "resupply" ? resupplyVol : exportVol;
	const activeBatchMass = activeTab === "resupply" ? resupplyMass : exportMass;

	const totalCargoVol = existingCargoVol + activeBatchVol;
	const totalCargoMass = existingCargoMass + activeBatchMass;

	const shipVolPct =
		selectedShip.volCap > 0
			? Math.min(100, Math.round((totalCargoVol / selectedShip.volCap) * 100))
			: 0;
	const shipMassPct =
		selectedShip.weightCap > 0
			? Math.min(
					100,
					Math.round((totalCargoMass / selectedShip.weightCap) * 100),
				)
			: 0;

	const netDailyProdVol = useMemo(() => {
		let v = 0;
		(productionList || []).forEach((p) => {
			const props = globalGetMatProps(p.ticker);
			v += (p.flow || 0) * props.volume;
		});
		return Math.max(0, v);
	}, [productionList, globalGetMatProps]);

	const { selectedExportVolRate, selectedExportMassRate } = useMemo(() => {
		let vol = 0,
			mass = 0;
		exportCandidates.forEach((c) => {
			if (exportSelectedMap[c.ticker] && c.flow > 0) {
				const props = globalGetMatProps(c.ticker);
				vol += c.flow * props.volume;
				mass += c.flow * props.weight;
			}
		});
		return { selectedExportVolRate: vol, selectedExportMassRate: mass };
	}, [exportCandidates, exportSelectedMap, globalGetMatProps]);

	const shipFlightEtaDays = useMemo(() => {
		if (!globalData?.activeFlightPlans || !selectedShip.shipId) return 0;
		const plan = globalData.activeFlightPlans.find(
			(p: any) =>
				p.shipid === selectedShip.shipId || p.id === selectedShip.shipId,
		);
		if (plan && plan.end) {
			const now = Date.now();
			const msLeft = plan.end - now;
			if (msLeft > 0) {
				return msLeft / (1000 * 60 * 60 * 24);
			}
		}
		return 0;
	}, [globalData?.activeFlightPlans, selectedShip.shipId]);

	const shipLoadStatus = useMemo(() => {
		const rateVol =
			selectedExportVolRate > 0 ? selectedExportVolRate : netDailyProdVol;
		const capVol = selectedShip.volCap || 2000;
		const capMass = selectedShip.weightCap || 2000;

		const currentVol = totalCargoVol;
		const currentMass = totalCargoMass;

		if (currentVol >= capVol || currentMass >= capMass) {
			return {
				isReady: true,
				daysLeft: 0,
				text: "1 Full Ship Load ready now! (100% full)",
			};
		}

		if (rateVol <= 0) {
			return {
				isReady: false,
				daysLeft: null,
				text: "No active production flow to fill ship load",
			};
		}

		const remVol = capVol - currentVol;
		const remMass = capMass - currentMass;

		const daysVol = remVol / rateVol;
		const daysMass =
			selectedExportMassRate > 0 ? remMass / selectedExportMassRate : Infinity;
		const rawDaysLeft = Math.min(daysVol, daysMass);

		const daysLeft = Math.max(0, rawDaysLeft - shipFlightEtaDays);
		const flightNote =
			shipFlightEtaDays > 0
				? ` (Flight ETA: ${(shipFlightEtaDays * 24).toFixed(1)}h)`
				: "";

		return {
			isReady: daysLeft <= 0,
			daysLeft: daysLeft > 0 ? daysLeft : 0,
			text:
				daysLeft <= 0
					? `Full Ship Load ready upon arrival!${flightNote}`
					: `Full Ship Load ready in ${daysLeft.toFixed(1)} days (${currentVol.toLocaleString()} / ${capVol.toLocaleString()} m³ loaded)${flightNote}`,
		};
	}, [
		selectedShip,
		totalCargoVol,
		totalCargoMass,
		selectedExportVolRate,
		selectedExportMassRate,
		netDailyProdVol,
		shipFlightEtaDays,
	]);

	const handleCopyExportXit = () => {
		const mats: Record<string, number> = {};
		exportCandidates.forEach((c) => {
			if (exportSelectedMap[c.ticker] && (exportQtys[c.ticker] || 0) > 0) {
				mats[c.ticker] = exportQtys[c.ticker];
			}
		});

		if (Object.keys(mats).length === 0) {
			if (onShowSnackbar) onShowSnackbar("No items selected for export.");
			return;
		}

		const xit = generateExportXit({
			siteName,
			materials: mats,
			shipReg: selectedShip.reg,
		});

		copyToClipboard(xit);
		if (onShowSnackbar)
			onShowSnackbar("Copied XIT Transport payload to clipboard!");
	};

	const renderStackedBar = (
		existingVal: number,
		batchVal: number,
		maxCap: number,
	) => {
		const safeCap = maxCap > 0 ? maxCap : 1;
		const existPct = Math.min(100, (existingVal / safeCap) * 100);
		const batchPct = Math.min(100 - existPct, (batchVal / safeCap) * 100);
		const isOverflow = existingVal + batchVal > safeCap;

		return (
			<Box
				sx={{
					height: 6,
					borderRadius: 3,
					bgcolor: "rgba(255,255,255,0.1)",
					overflow: "hidden",
					display: "flex",
					position: "relative",
				}}
			>
				{existPct > 0 && (
					<Box
						sx={{ width: `${existPct}%`, bgcolor: "#ffd700", height: "100%" }}
					/>
				)}
				{batchPct > 0 && (
					<Box
						sx={{
							width: `${batchPct}%`,
							bgcolor: theme.palette.primary.main,
							height: "100%",
						}}
					/>
				)}
				{isOverflow && (
					<Box
						sx={{ flex: 1, bgcolor: theme.palette.error.main, height: "100%" }}
					/>
				)}
			</Box>
		);
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			slotProps={{
				paper: {
					sx: {
						bgcolor: "rgba(16, 16, 32, 0.96)",
						backdropFilter: "blur(20px)",
						border: `1px solid ${theme.palette.primary.main}`,
						borderRadius: "14px",
						boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
						color: "white",
					},
				},
			}}
		>
			<DialogTitle
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					py: 1,
					px: 2.5,
					borderBottom: "1px solid rgba(255,255,255,0.08)",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
					<Typography
						variant="h6"
						sx={{ fontWeight: 800, fontSize: "1.1rem", color: "white" }}
					>
						Logistics Planner &nbsp;•&nbsp; {siteName}
					</Typography>

					<Tabs
						value={activeTab}
						onChange={(_, v) => setActiveTab(v)}
						sx={{
							minHeight: 34,
							"& .MuiTabs-indicator": {
								bgcolor: theme.palette.primary.main,
								height: 3,
							},
							"& .MuiTab-root": {
								minHeight: 34,
								py: 0.5,
								px: 2,
								fontSize: "0.8rem",
								fontWeight: 800,
								color: "rgba(255,255,255,0.6)",
								"&.Mui-selected": { color: theme.palette.primary.main },
							},
						}}
					>
						<Tab
							label="Quick Resupply"
							value="resupply"
							icon={<Truck size={14} />}
							iconPosition="start"
						/>
						<Tab
							label="Export Planner"
							value="export"
							icon={<TrendingUp size={14} />}
							iconPosition="start"
						/>
					</Tabs>
				</Box>

				<IconButton
					size="small"
					onClick={onClose}
					sx={{ color: "rgba(255,255,255,0.6)" }}
				>
					<X size={18} />
				</IconButton>
			</DialogTitle>

			<DialogContent
				sx={{
					px: 2.5,
					py: 2,
					display: "flex",
					flexDirection: "column",
					gap: 2,
				}}
			>
				<Box
					sx={{
						p: 1.5,
						borderRadius: "10px",
						bgcolor: "rgba(0, 0, 0, 0.35)",
						border: `1px solid ${theme.palette.primary.main}33`,
						display: "grid",
						gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
						gap: 2,
					}}
				>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Typography
								variant="caption"
								sx={{
									color: theme.palette.primary.main,
									fontWeight: 800,
									fontSize: "0.75rem",
								}}
							>
								FLEET SHIP & CARGO CAPACITY
							</Typography>
							<FormControl size="small" sx={{ minWidth: 190 }}>
								<Select
									value={selectedShipId}
									onChange={(e) => setSelectedShipId(e.target.value)}
									onClose={() => setShipSearchTerm("")}
									MenuProps={{
										autoFocus: false,
										PaperProps: {
											sx: { bgcolor: "rgba(16, 16, 32, 0.98)", maxHeight: 360 },
										},
									}}
									sx={{
										height: 26,
										fontSize: "0.7rem",
										fontWeight: 700,
										bgcolor: "rgba(0,0,0,0.4)",
										color: "white",
										"& .MuiOutlinedInput-notchedOutline": {
											borderColor: `${theme.palette.primary.main}44`,
										},
									}}
								>
									<ListSubheader
										disableSticky={false}
										sx={{ bgcolor: "rgba(16,16,32,0.98)", p: 1, zIndex: 10 }}
									>
										<TextField
											size="small"
											placeholder="Search ships..."
											value={shipSearchTerm}
											onChange={(e) => setShipSearchTerm(e.target.value)}
											onKeyDown={(e) => e.stopPropagation()}
											fullWidth
											sx={{
												"& .MuiOutlinedInput-input": {
													py: 0.3,
													px: 0.75,
													fontSize: "0.72rem",
													color: "white",
												},
												"& .MuiOutlinedInput-notchedOutline": {
													borderColor: `${theme.palette.primary.main}44`,
												},
											}}
										/>
									</ListSubheader>

									{filteredFleetShips.length > 0 && [
										<ListSubheader
											key="header-fleet"
											sx={{
												bgcolor: "rgba(16,16,32,0.95)",
												color: theme.palette.primary.main,
												fontWeight: 800,
												fontSize: "0.68rem",
												lineHeight: "24px",
											}}
										>
											YOUR FLEET SHIPS ({filteredFleetShips.length})
										</ListSubheader>,
										...filteredFleetShips.map((s: any) => {
											const shipStoreId =
												(s as any).id_ship_store ||
												(s as any).shipstoreid ||
												s.id ||
												s.registration;
											const shipStorageUnit: any = storageUnits.find(
												(u: any) => {
													const isShipStoreType =
														u.type === "SHIP_STORE" || u.type === "SHIP";
													const matchesId =
														u.addressableid === shipStoreId ||
														u.storageid === shipStoreId ||
														u.id === shipStoreId;
													const matchesName =
														u.name === s.registration || u.name === s.name;
													return (
														(isShipStoreType && (matchesId || matchesName)) ||
														matchesId
													);
												},
											);

											const vCap =
												shipStorageUnit?.volumecapacity ||
												(s as any).volumecapacity ||
												(s as any).volume ||
												1500;
											const wCap =
												shipStorageUnit?.weightcapacity ||
												(s as any).weightcapacity ||
												(s as any).weight ||
												1500;
											return (
												<MenuItem
													key={s.id || s.registration}
													value={s.id || s.registration}
													style={{ fontSize: "0.75rem", paddingLeft: 16 }}
												>
													{s.name || s.registration} (
													{Number(vCap).toLocaleString()} m³ /{" "}
													{Number(wCap).toLocaleString()} t)
												</MenuItem>
											);
										}),
									]}
									<ListSubheader
										key="header-presets"
										sx={{
											bgcolor: "rgba(16,16,32,0.95)",
											color: "rgba(255,255,255,0.6)",
											fontWeight: 800,
											fontSize: "0.68rem",
											lineHeight: "24px",
										}}
									>
										STANDARD CARGO BAYS
									</ListSubheader>
									{CARGO_BAYS.map((b) => (
										<MenuItem
											key={b.id}
											value={b.id}
											style={{ fontSize: "0.75rem", paddingLeft: 16 }}
										>
											{b.name} (
											{(
												b.volume ||
												(b as any).capacity ||
												2000
											).toLocaleString()}{" "}
											m³)
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Box>

						<Box>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									mb: 0.2,
								}}
							>
								<Typography
									variant="caption"
									sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.7)" }}
								>
									Volume:{" "}
									{(totalCargoVol || 0).toLocaleString(undefined, {
										maximumFractionDigits: 1,
									})}{" "}
									/ {(selectedShip.volCap || 0).toLocaleString()} m³
									{existingCargoVol > 0 &&
										` (${Math.round(existingCargoVol)} m³ pre-existing)`}
								</Typography>
								<Typography
									variant="caption"
									sx={{
										fontSize: "0.68rem",
										fontWeight: 700,
										color:
											shipVolPct > 100
												? theme.palette.error.main
												: theme.palette.primary.main,
									}}
								>
									{shipVolPct}%
								</Typography>
							</Box>
							{renderStackedBar(
								existingCargoVol,
								activeBatchVol,
								selectedShip.volCap,
							)}
						</Box>

						<Box>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									mb: 0.2,
								}}
							>
								<Typography
									variant="caption"
									sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.7)" }}
								>
									Mass:{" "}
									{(totalCargoMass || 0).toLocaleString(undefined, {
										maximumFractionDigits: 1,
									})}{" "}
									/ {(selectedShip.weightCap || 0).toLocaleString()} t
									{existingCargoMass > 0 &&
										` (${Math.round(existingCargoMass)} t pre-existing)`}
								</Typography>
								<Typography
									variant="caption"
									sx={{
										fontSize: "0.68rem",
										fontWeight: 700,
										color:
											shipMassPct > 100
												? theme.palette.error.main
												: theme.palette.primary.main,
									}}
								>
									{shipMassPct}%
								</Typography>
							</Box>
							{renderStackedBar(
								existingCargoMass,
								activeBatchMass,
								selectedShip.weightCap,
							)}
						</Box>
					</Box>

					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 0.75,
							justifyContent: "center",
						}}
					>
						<Typography
							variant="caption"
							sx={{
								fontWeight: 800,
								fontSize: "0.75rem",
								color: theme.palette.primary.main,
							}}
						>
							STORAGE BREAKDOWN
						</Typography>

						<Typography
							variant="caption"
							sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.72rem" }}
						>
							Site Storage (Primary):{" "}
							<strong
								style={{
									color:
										siteVolPct > 80
											? theme.palette.warning.main
											: theme.palette.primary.main,
								}}
							>
								{siteVolPct}% Vol
							</strong>{" "}
							({Math.round(siteVol).toLocaleString()} /{" "}
							{siteCapVol.toLocaleString()} m³) &nbsp;|&nbsp;{" "}
							<strong
								style={{
									color:
										siteMassPct > 80
											? theme.palette.warning.main
											: theme.palette.primary.main,
								}}
							>
								{siteMassPct}% Mass
							</strong>{" "}
							({Math.round(siteMass).toLocaleString()} /{" "}
							{siteCapMass.toLocaleString()} t)
						</Typography>

						{whCapVol > 0 && (
							<Typography
								variant="caption"
								sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.72rem" }}
							>
								Warehouse (Backup):{" "}
								<strong
									style={{
										color:
											whVolPct > 80
												? theme.palette.warning.main
												: theme.palette.primary.main,
									}}
								>
									{whVolPct}% Vol
								</strong>{" "}
								({Math.round(whVol).toLocaleString()} /{" "}
								{whCapVol.toLocaleString()} m³) &nbsp;|&nbsp;{" "}
								<strong
									style={{
										color:
											whMassPct > 80
												? theme.palette.warning.main
												: theme.palette.primary.main,
									}}
								>
									{whMassPct}% Mass
								</strong>{" "}
								({Math.round(whMass).toLocaleString()} /{" "}
								{whCapMass.toLocaleString()} t)
							</Typography>
						)}

						<Typography
							variant="caption"
							sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.68rem" }}
						>
							Combined Total: {Math.round(totalStoredVol).toLocaleString()} /{" "}
							{totalCapVol.toLocaleString()} m³ ({totalVolPct}% Vol)
							&nbsp;|&nbsp; {Math.round(totalStoredMass).toLocaleString()} /{" "}
							{totalCapMass.toLocaleString()} t ({totalMassPct}% Mass)
						</Typography>

						{activeTab === "export" && (
							<Chip
								label={shipLoadStatus.text}
								size="small"
								sx={{
									height: 20,
									fontSize: "0.68rem",
									fontWeight: 700,
									bgcolor: shipLoadStatus.isReady
										? `${theme.palette.success.main}22`
										: `${theme.palette.primary.main}22`,
									color: shipLoadStatus.isReady
										? theme.palette.success.main
										: theme.palette.primary.main,
									border: `1px solid ${shipLoadStatus.isReady ? theme.palette.success.main : theme.palette.primary.main}44`,
									mt: 0.25,
								}}
							/>
						)}
					</Box>
				</Box>

				{activeTab === "resupply" && (
					<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
								<ToggleButtonGroup
									size="small"
									value={resupplyMode}
									exclusive
									onChange={(_, v) => v && setResupplyMode(v)}
									sx={{
										height: 24,
										bgcolor: "rgba(0,0,0,0.4)",
										"& .MuiToggleButton-root": {
											py: 0,
											px: 1,
											fontSize: "0.68rem",
											fontWeight: 700,
											color: "rgba(255,255,255,0.6)",
											border: "none",
											"&.Mui-selected": {
												color: "white",
												bgcolor: theme.palette.primary.main,
											},
										},
									}}
								>
									<ToggleButton value="consumables">
										Consumables Only
									</ToggleButton>
									<ToggleButton value="production">Inputs Only</ToggleButton>
									<ToggleButton value="all">All Consumption</ToggleButton>
								</ToggleButtonGroup>
							</Box>

							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Typography
									variant="caption"
									sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)" }}
								>
									Target Days:
								</Typography>
								<TextField
									size="small"
									type="number"
									value={supplyDays}
									onChange={(e) =>
										setSupplyDays(Math.max(1, parseInt(e.target.value) || 1))
									}
									sx={{
										width: 70,
										"& .MuiOutlinedInput-input": {
											py: 0.25,
											px: 0.75,
											fontSize: "0.75rem",
											fontWeight: 700,
											textAlign: "center",
										},
									}}
								/>
							</Box>
						</Box>

						<Table
							size="small"
							sx={{
								bgcolor: "rgba(0,0,0,0.3)",
								borderRadius: "8px",
								overflow: "hidden",
							}}
						>
							<TableHead sx={{ bgcolor: `${theme.palette.primary.main}15` }}>
								<TableRow>
									<TableCell
										sx={{
											color: theme.palette.primary.main,
											fontWeight: 800,
											py: 0.5,
											width: 40,
										}}
									></TableCell>
									<TableCell
										sx={{
											color: theme.palette.primary.main,
											fontWeight: 800,
											py: 0.5,
										}}
									>
										Material
									</TableCell>
									<TableCell
										align="right"
										sx={{
											color: theme.palette.primary.main,
											fontWeight: 800,
											py: 0.5,
										}}
									>
										Daily Burn
									</TableCell>
									<TableCell
										align="right"
										sx={{
											color: theme.palette.primary.main,
											fontWeight: 800,
											py: 0.5,
										}}
									>
										Site Stored
									</TableCell>
									<TableCell
										align="right"
										sx={{
											color: theme.palette.primary.main,
											fontWeight: 800,
											py: 0.5,
											width: 110,
										}}
									>
										Resupply Qty
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{resupplyCandidates.map((c) => {
									const isSel = !!resupplySelectedMap[c.ticker];
									const qty = resupplyCustomQtys[c.ticker] ?? 0;
									const burn = Math.abs(c.flow);

									return (
										<TableRow
											key={c.ticker}
											sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}
										>
											<TableCell sx={{ py: 0.3 }}>
												<Checkbox
													size="small"
													checked={isSel}
													onChange={(e) =>
														setResupplySelectedMap((prev) => ({
															...prev,
															[c.ticker]: e.target.checked,
														}))
													}
													sx={{
														p: 0.2,
														color: "rgba(255,255,255,0.4)",
														"&.Mui-checked": {
															color: theme.palette.primary.main,
														},
													}}
												/>
											</TableCell>
											<TableCell sx={{ py: 0.3 }}>
												<MaterialBadge ticker={c.ticker} />
											</TableCell>
											<TableCell
												align="right"
												sx={{
													py: 0.3,
													fontFamily: "monospace",
													fontSize: "0.75rem",
													color: theme.palette.error.main,
												}}
											>
												-{burn.toFixed(1)}/d
											</TableCell>
											<TableCell
												align="right"
												sx={{
													py: 0.3,
													fontFamily: "monospace",
													fontSize: "0.75rem",
													color: "white",
												}}
											>
												{(c.siteAmount || 0).toLocaleString()}
											</TableCell>
											<TableCell align="right" sx={{ py: 0.3 }}>
												<TextField
													size="small"
													type="number"
													value={qty}
													onChange={(e) => {
														const val = Math.max(
															0,
															parseInt(e.target.value) || 0,
														);
														setResupplyCustomQtys((prev) => ({
															...prev,
															[c.ticker]: val,
														}));
													}}
													sx={{
														width: 90,
														"& .MuiOutlinedInput-input": {
															py: 0.25,
															px: 0.5,
															fontSize: "0.75rem",
															textAlign: "right",
															fontFamily: "monospace",
															fontWeight: 700,
														},
													}}
												/>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</Box>
				)}

				{activeTab === "export" && (
					<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Typography
								variant="subtitle2"
								sx={{
									fontWeight: 800,
									fontSize: "0.8rem",
									color: theme.palette.primary.main,
								}}
							>
								ITEMS TO EXPORT
							</Typography>

							<FormControlLabel
								control={
									<Switch
										size="small"
										checked={includeCons}
										onChange={(e) => setIncludeCons(e.target.checked)}
										sx={{
											"& .MuiSwitch-switchBase.Mui-checked": {
												color: theme.palette.primary.main,
											},
											"& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
												{ bgcolor: theme.palette.primary.main },
										}}
									/>
								}
								label={
									<Typography
										variant="caption"
										sx={{
											fontSize: "0.72rem",
											color: "rgba(255,255,255,0.7)",
											fontWeight: 600,
										}}
									>
										Include Consumables & Surplus
									</Typography>
								}
							/>
						</Box>

						<Table
							size="small"
							sx={{
								bgcolor: "rgba(0,0,0,0.3)",
								borderRadius: "8px",
								overflow: "hidden",
							}}
						>
							<TableHead sx={{ bgcolor: `${theme.palette.primary.main}15` }}>
								<TableRow>
									<TableCell
										sx={{
											color: theme.palette.primary.main,
											fontWeight: 800,
											py: 0.5,
											width: 40,
										}}
									></TableCell>
									<TableCell
										sx={{
											color: theme.palette.primary.main,
											fontWeight: 800,
											py: 0.5,
										}}
									>
										Material
									</TableCell>
									<TableCell
										align="right"
										sx={{
											color: theme.palette.primary.main,
											fontWeight: 800,
											py: 0.5,
										}}
									>
										Flow/day
									</TableCell>
									<TableCell
										align="right"
										sx={{
											color: theme.palette.primary.main,
											fontWeight: 800,
											py: 0.5,
										}}
									>
										Site Stored
									</TableCell>
									<TableCell
										align="right"
										sx={{
											color: theme.palette.primary.main,
											fontWeight: 800,
											py: 0.5,
											width: 110,
										}}
									>
										Export Qty
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{exportCandidates.map((c) => {
									const isSel = !!exportSelectedMap[c.ticker];
									const currentQty = exportQtys[c.ticker] ?? c.storedQty;

									return (
										<TableRow
											key={c.ticker}
											sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}
										>
											<TableCell sx={{ py: 0.3 }}>
												<Checkbox
													size="small"
													checked={isSel}
													onChange={(e) =>
														setExportSelectedMap((prev) => ({
															...prev,
															[c.ticker]: e.target.checked,
														}))
													}
													sx={{
														p: 0.2,
														color: "rgba(255,255,255,0.4)",
														"&.Mui-checked": {
															color: theme.palette.primary.main,
														},
													}}
												/>
											</TableCell>
											<TableCell sx={{ py: 0.3 }}>
												<MaterialBadge ticker={c.ticker} />
											</TableCell>
											<TableCell
												align="right"
												sx={{
													py: 0.3,
													fontFamily: "monospace",
													fontSize: "0.75rem",
													color:
														c.flow > 0
															? theme.palette.success.main
															: "rgba(255,255,255,0.4)",
												}}
											>
												{c.flow > 0 ? `+${c.flow.toFixed(1)}/d` : "-"}
											</TableCell>
											<TableCell
												align="right"
												sx={{
													py: 0.3,
													fontFamily: "monospace",
													fontSize: "0.75rem",
													color: "white",
												}}
											>
												{(c.storedQty || 0).toLocaleString()}
											</TableCell>
											<TableCell align="right" sx={{ py: 0.3 }}>
												<TextField
													size="small"
													type="number"
													value={currentQty}
													onChange={(e) => {
														const val = Math.max(
															0,
															parseInt(e.target.value) || 0,
														);
														setExportQtys((prev) => ({
															...prev,
															[c.ticker]: val,
														}));
													}}
													sx={{
														width: 90,
														"& .MuiOutlinedInput-input": {
															py: 0.25,
															px: 0.5,
															fontSize: "0.75rem",
															textAlign: "right",
															fontFamily: "monospace",
															fontWeight: 700,
														},
													}}
												/>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</Box>
				)}
			</DialogContent>

			<DialogActions
				sx={{
					px: 2.5,
					py: 1.5,
					borderTop: "1px solid rgba(255,255,255,0.08)",
					justifyContent: "space-between",
				}}
			>
				<Typography
					variant="caption"
					sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}
				>
					Generates{" "}
					<strong style={{ color: theme.palette.primary.main }}>
						XIT {activeTab === "resupply" ? "SUPPLY" : "TRANSPORT"}
					</strong>{" "}
					command for loading
				</Typography>

				<Box sx={{ display: "flex", gap: 1 }}>
					<Button
						onClick={onClose}
						variant="outlined"
						color="inherit"
						size="small"
						sx={{ textTransform: "none", fontSize: "0.75rem" }}
					>
						Close
					</Button>
					<Button
						onClick={
							activeTab === "resupply"
								? handleCopyResupplyXit
								: handleCopyExportXit
						}
						variant="contained"
						size="small"
						startIcon={<Copy size={14} />}
						sx={{
							bgcolor: theme.palette.primary.main,
							color: "#fff",
							fontWeight: 800,
							fontSize: "0.75rem",
							textTransform: "none",
							"&:hover": { bgcolor: theme.palette.primary.dark },
						}}
					>
						Copy XIT {activeTab === "resupply" ? "Supply" : "Transport"}
					</Button>
				</Box>
			</DialogActions>
		</Dialog>
	);
};

export const FastResupplyModal: React.FC<any> = (props) => (
	<FastLogisticsModal {...props} initialTab="resupply" />
);
export const FastExportModal: React.FC<any> = (props) => (
	<FastLogisticsModal {...props} initialTab="export" />
);
