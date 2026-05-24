import { API_BASE_URL } from "../../../../config/api";
import { useState, useEffect, useMemo, useCallback } from "react";
import { CARGO_BAYS } from "./utils";
import { useGlobalData } from "../../../../context/GlobalDataContext";
import { calculateCargoPlan, type LogisticsRow } from "./cargoplannerlogic";

export const useSiteInfrastructure = (siteId?: string) => {
	const [platforms, setPlatforms] = useState<any[]>([]);
	const [repairs, setRepairs] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!siteId) return;
		let isMounted = true;

		const fetchDetails = async () => {
			setLoading(true);
			try {
				const res = await fetch(
					`${API_BASE_URL}user_site_platforms/${siteId}`,
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("authToken")}`,
						},
					},
				);
				if (!res.ok) throw new Error("Failed to fetch");
				const json = await res.json();
				if (isMounted && json) {
					setRepairs(json.platform_repair_list || []);
					const buildings =
						json.site_building_tickers?.map((t: string, i: number) => ({
							ticker: t,
							condition: json.site_platform_conditions?.[i] || 0,
						})) || [];
					setPlatforms(buildings);
				}
			} catch (e) {
				console.error("Failed to fetch platform details", e);
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		fetchDetails();
		return () => {
			isMounted = false;
		};
	}, [siteId]);

	return { platforms, repairs, loading };
};

export const useLogisticsManager = (
	site: any,
	richFlows: Record<string, any>,
	globalTargetDays: number,
) => {
	const siteId = site?.siteid;

	const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(
		new Set(),
	);
	const [materialTargets, setMaterialTargets] = useState<
		Record<string, number>
	>({});
	const [materialPriorities, setMaterialPriorities] = useState<
		Record<string, number>
	>({});
	const [allowedShipTypes, setAllowedShipTypes] = useState<string[]>(
		CARGO_BAYS.map((b) => b.id),
	);
	const [allocationStrategy, setAllocationStrategy] = useState<
		"together" | "balance" | "categorized"
	>("together");
	const [assumeOptimal, setAssumeOptimal] = useState<boolean>(false);
	const [maxShips, setMaxShips] = useState<number>(0);
	const [flightBufferDays, setFlightBufferDays] = useState<number>(0);
	const [manualFleet, setManualFleet] = useState<
		{ id: string; bayId: string }[]
	>([]);

	useEffect(() => {
		if (!siteId) return;
		try {
			const savedTargets = localStorage.getItem(`site_logistics_${siteId}`);
			if (savedTargets) setMaterialTargets(JSON.parse(savedTargets));
			const savedPriorities = localStorage.getItem(
				`site_logistics_prio_${siteId}`,
			);
			if (savedPriorities) setMaterialPriorities(JSON.parse(savedPriorities));
			const savedShips = localStorage.getItem(`site_logistics_ships_${siteId}`);
			if (savedShips) setAllowedShipTypes(JSON.parse(savedShips));
			const savedStrat = localStorage.getItem(`site_logistics_strat_${siteId}`);
			if (savedStrat) setAllocationStrategy(savedStrat as any);
			const savedOpt = localStorage.getItem(`site_logistics_opt_${siteId}`);
			if (savedOpt) setAssumeOptimal(savedOpt === "true");
			const savedMaxShips = localStorage.getItem(
				`site_logistics_max_ships_${siteId}`,
			);
			if (savedMaxShips) setMaxShips(parseInt(savedMaxShips) || 0);
			const savedBuffer = localStorage.getItem(
				`site_logistics_buffer_${siteId}`,
			);
			if (savedBuffer) setFlightBufferDays(parseInt(savedBuffer) || 0);
			const savedManual = localStorage.getItem(
				`site_logistics_manual_${siteId}`,
			);
			if (savedManual) setManualFleet(JSON.parse(savedManual));
		} catch {}

		const initialSelection = new Set<string>();
		Object.entries(richFlows).forEach(([ticker, data]) => {
			if (data.flow < 0 && !data.isProduction) initialSelection.add(ticker);
		});
		setSelectedMaterials(initialSelection);
	}, [siteId, richFlows]);

	const logisticsRows = useMemo(() => {
		// Calculate the average efficiency of all running lines to upscale inputs
		let avgEfficiency = 1;
		if (assumeOptimal && site?.production_lines) {
			const activeLines = site.production_lines.filter(
				(l: any) => l.efficiency > 0,
			);
			if (activeLines.length > 0) {
				const totalEff = activeLines.reduce(
					(acc: number, l: any) => acc + l.efficiency,
					0,
				);
				avgEfficiency = totalEff / activeLines.length;
			}
		}

		// First, compile all materials from richFlows
		const combinedFlows: Record<string, any> = { ...richFlows };
		const requiredInputs = new Set<string>();

		// If assumeOptimal is true, we should also inject any missing inputs from queued/template orders that currently have 0 flow
		if (assumeOptimal && site?.production_lines) {
			site.production_lines.forEach((line: any) => {
				if (line.production_orders && line.production_orders.length > 0) {
					line.production_orders.forEach((order: any) => {
						if (order.production_recipe && order.production_recipe.inputs) {
							order.production_recipe.inputs.forEach((input: any) => {
								requiredInputs.add(input.ticker);
								if (!combinedFlows[input.ticker]) {
									combinedFlows[input.ticker] = {
										flow: 0,
										currentAmount: 0,
										workforceFlow: 0,
										isProduction: false,
									};
								}
							});
						}
					});
				}
			});
		}

		const baseRows = Object.entries(combinedFlows)
			.filter(([ticker, data]) => {
				// Only include active consumption OR if we are explicitly injecting a required idle input
				return data.flow < 0 || (data.flow === 0 && requiredInputs.has(ticker));
			})
			.map(([ticker, data]) => {
				// Upscale input burn rate if we are assuming optimal conditions and it's not a workforce flow
				let dailyBurn = Math.abs(data.flow);
				const isWorkforce = (data.workforceFlow || 0) < 0;

				if (
					assumeOptimal &&
					!isWorkforce &&
					avgEfficiency > 0 &&
					avgEfficiency < 1
				) {
					dailyBurn = dailyBurn / avgEfficiency;
				}

				const target =
					(materialTargets[ticker] ?? globalTargetDays) + flightBufferDays;
				const currentFullDays =
					dailyBurn > 0 ? data.currentAmount / dailyBurn : 0;
				const missingDays = Math.max(0, target - currentFullDays);
				const missing = missingDays * (dailyBurn > 0 ? dailyBurn : 1); // fallback to 1 if burn is 0 just to allow sending raw amounts

				return {
					ticker,
					dailyBurn,
					current: data.currentAmount || 0,
					target,
					missing: dailyBurn > 0 ? missing : target, // if burn is 0, target IS the missing amount
					currentFullDays,
					isWorkforce,
				};
			})
			.filter((r) => r.dailyBurn > 0 || r.target > 0); // Hide completely empty ones unless targeted

		// Dynamic Prioritization Logic
		const workforceRows = baseRows.filter(
			(r) => r.isWorkforce && r.dailyBurn > 0,
		);
		const inputRows = baseRows.filter((r) => !r.isWorkforce && r.dailyBurn > 0);

		const minWorkforceDays =
			workforceRows.length > 0
				? Math.min(...workforceRows.map((r) => r.currentFullDays))
				: Infinity;
		const minInputDays =
			inputRows.length > 0
				? Math.min(...inputRows.map((r) => r.currentFullDays))
				: Infinity;

		const workforceIsCritical = minWorkforceDays <= minInputDays;

		return baseRows
			.map((r) => {
				let autoPriority = 3;

				if (r.dailyBurn === 0) {
					autoPriority = 3; // Default for manually added things
				} else if (r.isWorkforce) {
					if (workforceIsCritical) {
						autoPriority = r.currentFullDays <= minWorkforceDays + 2 ? 1 : 2;
					} else {
						autoPriority = r.currentFullDays <= minWorkforceDays + 2 ? 3 : 4;
					}
				} else {
					if (!workforceIsCritical) {
						autoPriority = r.currentFullDays <= minInputDays + 2 ? 1 : 2;
					} else {
						autoPriority = r.currentFullDays <= minInputDays + 2 ? 3 : 4;
					}
				}

				if (r.missing <= 0) autoPriority = 5;

				return {
					...r,
					autoPriority,
				};
			})
			.sort((a, b) => a.ticker.localeCompare(b.ticker));
	}, [
		richFlows,
		materialTargets,
		globalTargetDays,
		assumeOptimal,
		site,
		flightBufferDays,
	]);

	const handleTargetChange = (ticker: string, val: string) => {
		const num = parseInt(val);
		if (!isNaN(num) && num >= 0) {
			const next = { ...materialTargets, [ticker]: num };
			setMaterialTargets(next);
			localStorage.setItem(`site_logistics_${siteId}`, JSON.stringify(next));
		}
	};

	const handleFlightBufferChange = (val: string) => {
		const num = parseInt(val) || 0;
		setFlightBufferDays(num);
		localStorage.setItem(`site_logistics_buffer_${siteId}`, String(num));
	};

	const handleAddDaysToAll = (days: number) => {
		const next = { ...materialTargets };
		logisticsRows.forEach((r) => {
			const currentTarget = next[r.ticker] ?? globalTargetDays;
			next[r.ticker] = Math.max(0, currentTarget + days);
		});
		setMaterialTargets(next);
		localStorage.setItem(`site_logistics_${siteId}`, JSON.stringify(next));
	};

	const handleSyncAllTargets = (targetDays: number) => {
		const next = { ...materialTargets };
		logisticsRows.forEach((r) => {
			next[r.ticker] = targetDays;
		});
		setMaterialTargets(next);
		localStorage.setItem(`site_logistics_${siteId}`, JSON.stringify(next));
	};

	const handlePriorityChange = (ticker: string, p: number) => {
		const next = { ...materialPriorities, [ticker]: p };
		setMaterialPriorities(next);
		localStorage.setItem(`site_logistics_prio_${siteId}`, JSON.stringify(next));
	};

	const handleAllowedShipsChange = (ships: string[]) => {
		setAllowedShipTypes(ships);
		localStorage.setItem(
			`site_logistics_ships_${siteId}`,
			JSON.stringify(ships),
		);
	};

	const handleStrategyChange = (
		strat: "together" | "balance" | "categorized",
	) => {
		setAllocationStrategy(strat);
		localStorage.setItem(`site_logistics_strat_${siteId}`, strat);
	};

	const toggleMaterial = (ticker: string) => {
		const next = new Set(selectedMaterials);
		if (next.has(ticker)) next.delete(ticker);
		else next.add(ticker);
		setSelectedMaterials(next);
	};

	const toggleAllLogistics = () => {
		if (selectedMaterials.size === logisticsRows.length)
			setSelectedMaterials(new Set());
		else setSelectedMaterials(new Set(logisticsRows.map((r) => r.ticker)));
	};

	const toggleAssumeOptimal = () => {
		const next = !assumeOptimal;
		setAssumeOptimal(next);
		localStorage.setItem(`site_logistics_opt_${siteId}`, String(next));
	};

	const handleMaxShipsChange = (val: string) => {
		const num = parseInt(val) || 0;
		setMaxShips(num);
		localStorage.setItem(`site_logistics_max_ships_${siteId}`, String(num));
	};

	return {
		logisticsRows,
		selectedMaterials,
		materialTargets,
		materialPriorities,
		allowedShipTypes,
		allocationStrategy,
		assumeOptimal,
		maxShips,
		flightBufferDays,
		handleTargetChange,
		handlePriorityChange,
		handleAllowedShipsChange,
		handleStrategyChange,
		toggleMaterial,
		toggleAllLogistics,
		toggleAssumeOptimal,
		handleMaxShipsChange,
		handleFlightBufferChange,
		handleAddDaysToAll,
		handleSyncAllTargets,
		manualFleet,
		setManualFleet,
	};
};

export const useCargoPlanner = (
	logisticsRows: any[],
	selectedMaterials: Set<string>,
	materialPriorities: Record<string, number>,
	shipOverride: string,
	allowedShipTypes: string[],
	allocationStrategy: "together" | "balance" | "categorized",
	maxShips: number,
	manualFleet: { id: string; bayId: string }[] = [],
) => {
	const { materialData } = useGlobalData();

	const getMatProps = useCallback(
		(ticker: string) => {
			if (!materialData) return { weight: 1, volume: 1, category: "General" };

			const mat = Array.isArray(materialData)
				? materialData.find((m: any) => m.ticker === ticker)
				: materialData[ticker];

			if (mat) {
				return {
					weight: Number(mat.weight || mat.mass || 1),
					volume: Number(mat.volume || 1),
					category: mat.category || "General",
				};
			}
			return { weight: 1, volume: 1, category: "General" };
		},
		[materialData],
	);

	return useMemo(() => {
		const selected: LogisticsRow[] = logisticsRows
			.filter((r) => selectedMaterials.has(r.ticker) && r.missing > 0)
			.map((r) => ({
				ticker: r.ticker,
				missing: r.missing,
				priority: materialPriorities[r.ticker] || r.autoPriority || 3,
			}));

		const result = calculateCargoPlan(
			selected,
			materialPriorities,
			shipOverride,
			allowedShipTypes,
			allocationStrategy,
			getMatProps,
			maxShips,
			manualFleet,
		);

		return {
			...result,
			getMatProps,
		};
	}, [
		logisticsRows,
		selectedMaterials,
		shipOverride,
		materialPriorities,
		allowedShipTypes,
		allocationStrategy,
		getMatProps,
		maxShips,
		manualFleet,
	]);
};
