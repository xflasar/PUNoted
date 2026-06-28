import { CARGO_BAYS } from "./utils";
import type {
	CargoPlanResult,
	LogisticsRow,
	MaterialProps,
	ShipState,
} from "./types";

export const calculateCargoPlan = (
	selectedRows: LogisticsRow[],
	materialPriorities: Record<string, number>,
	shipOverride: string,
	allowedShipTypes: string[],
	allocationStrategy: "together" | "balance" | "categorized",
	getMatProps: (ticker: string) => MaterialProps,
	maxShips: number = 0, // 0 means unlimited
	manualFleet: { id: string; bayId: string }[] = [],
): CargoPlanResult => {
	let idealW = 0;
	let idealV = 0;

	const queue = selectedRows.map((r) => {
		const props = getMatProps(r.ticker);
		idealW += r.missing * props.weight;
		idealV += r.missing * props.volume;
		return {
			...r,
			priority: materialPriorities[r.ticker] || 3,
			props,
		};
	});

	// Sort by priority (1 is highest), then by ticker for consistent packing
	queue.sort((a, b) => {
		if (a.priority !== b.priority) return a.priority - b.priority;
		return a.ticker.localeCompare(b.ticker);
	});

	const fleet: ShipState[] = [];
	let shipCounter = 1;

	// Sort allowed bays descending by capacity (largest first)
	const allowedBaysDescending = CARGO_BAYS.filter((b) =>
		(allowedShipTypes || []).includes(b.id),
	).sort((a, b) => b.weight + b.volume - (a.weight + a.volume));

	// Sort allowed bays ascending by capacity (smallest first)
	const allowedBaysAscending = [...allowedBaysDescending].reverse();

	const spawnShip = (
		neededW: number = 0,
		neededV: number = 0,
	): ShipState | null => {
		if (allowedBaysAscending.length === 0) return null;
		if (maxShips > 0 && fleet.length >= maxShips) return null;

		// Find the SMALLEST ship that can hold the needed amount
		let bestFit = allowedBaysAscending.find(
			(b) => b.weight >= neededW && b.volume >= neededV,
		);

		// If no single ship is large enough, we pick the LARGEST available to chunk it down efficiently
		if (!bestFit) bestFit = allowedBaysDescending[0];

		const newShip: ShipState = {
			...bestFit,
			fleetId: `ship-${shipCounter++}`,
			loadedW: 0,
			loadedV: 0,
			inventory: {},
			primaryCategory: null,
		};
		fleet.push(newShip);
		return newShip;
	};

	// 1. Initial Fleet Setup
	if (shipOverride === "manual") {
		manualFleet.forEach((mShip) => {
			let manualShipInfo = CARGO_BAYS.find((s) => s.id === mShip.bayId);
			if (!manualShipInfo) manualShipInfo = CARGO_BAYS[0]; // fallback
			fleet.push({
				...manualShipInfo,
				fleetId: mShip.id,
				loadedW: 0,
				loadedV: 0,
				inventory: {},
				primaryCategory: null,
			});
		});
	} else if (shipOverride !== "auto") {
		const manualShip = CARGO_BAYS.find((s) => s.id === shipOverride);
		if (manualShip) {
			const count = maxShips > 0 ? maxShips : 1;
			for (let i = 0; i < count; i++) {
				fleet.push({
					...manualShip,
					fleetId: `ship-${shipCounter++}`,
					loadedW: 0,
					loadedV: 0,
					inventory: {},
					primaryCategory: null,
				});
			}
		}
	} else if (allowedBaysDescending.length > 0) {
		let rw = idealW;
		let rv = idealV;
		while (rw > 0.01 || rv > 0.01) {
			const newShip = spawnShip(rw, rv);
			if (!newShip) break;
			rw -= newShip.weight;
			rv -= newShip.volume;
		}
		if (fleet.length === 0 && queue.length > 0) {
			spawnShip(idealW, idealV);
		}
	}

	const allocatedResults: Record<string, number> = {};
	queue.forEach((r) => (allocatedResults[r.ticker] = 0));

	const findTargetShip = (mat: {
		ticker: string;
		props: MaterialProps;
	}): ShipState | null => {
		const matCat = mat.props.category || "General";
		const eligible = fleet.filter(
			(s) =>
				(s.weight - s.loadedW) / mat.props.weight > 0.001 &&
				(s.volume - s.loadedV) / mat.props.volume > 0.001,
		);

		if (eligible.length === 0) return null;

		if (allocationStrategy === "categorized") {
			const catMatch = eligible.find((s) => s.primaryCategory === matCat);
			if (catMatch) return catMatch;

			const empty = eligible.find((s) => s.loadedW === 0 && s.loadedV === 0);
			if (empty) {
				empty.primaryCategory = matCat;
				return empty;
			}
			if (shipOverride === "auto") return null;
			return eligible[0]; // fallback
		} else if (allocationStrategy === "balance") {
			return eligible.sort((a, b) => {
				const aPct =
					(a.weight > 0 ? a.loadedW / a.weight : 0) +
					(a.volume > 0 ? a.loadedV / a.volume : 0);
				const bPct =
					(b.weight > 0 ? b.loadedW / b.weight : 0) +
					(b.volume > 0 ? b.loadedV / b.volume : 0);
				return aPct - bPct;
			})[0];
		} else {
			// "together" (Sequential fill)
			const hasMat = eligible.find((s) => (s.inventory[mat.ticker] || 0) > 0);
			if (hasMat) return hasMat;
			return eligible[0]; // Always sequential (first available ship)
		}
	};

	// 2. Packing
	const priorities = Array.from(new Set(queue.map((m) => m.priority))).sort(
		(a, b) => a - b,
	);

	for (const p of priorities) {
		const group = queue
			.filter((m) => m.priority === p)
			.map((m) => ({ ...m, amtRemaining: m.missing }));

		let progress = true;
		let failsafe = 0;
		while (progress && failsafe++ < 5000) {
			progress = false;

			if (shipOverride === "auto") {
				let needMoreSpace = false;
				for (const mat of group) {
					if (mat.amtRemaining > 0.001) {
						if (!findTargetShip(mat)) {
							needMoreSpace = true;
							break;
						}
					}
				}
				if (needMoreSpace) {
					let reqW = 0,
						reqV = 0;
					group.forEach((m) => {
						if (m.amtRemaining > 0.001) {
							reqW += m.amtRemaining * m.props.weight;
							reqV += m.amtRemaining * m.props.volume;
						}
					});
					if (spawnShip(reqW, reqV)) progress = true;
				}
			}

			let groupReqW = 0,
				groupReqV = 0;
			group.forEach((m) => {
				groupReqW += m.amtRemaining * m.props.weight;
				groupReqV += m.amtRemaining * m.props.volume;
			});

			const groupAvailW = fleet.reduce(
				(acc, s) => acc + (s.weight - s.loadedW),
				0,
			);
			const groupAvailV = fleet.reduce(
				(acc, s) => acc + (s.volume - s.loadedV),
				0,
			);

			if (groupReqW <= 0.001 && groupReqV <= 0.001) break;
			if (groupAvailW <= 0.001 && groupAvailV <= 0.001) {
				if (shipOverride === "auto" && progress) continue;
				break;
			}

			const scaleW = groupReqW > 0 ? groupAvailW / groupReqW : 1;
			const scaleV = groupReqV > 0 ? groupAvailV / groupReqV : 1;
			const scale = Math.min(scaleW, scaleV, 1);

			for (const mat of group) {
				if (mat.amtRemaining <= 0.001) continue;

				const targetShip = findTargetShip(mat);
				if (!targetShip) continue;

				const availW = targetShip.weight - targetShip.loadedW;
				const availV = targetShip.volume - targetShip.loadedV;

				let chunk = mat.amtRemaining;
				if (scale < 1) {
					chunk = Math.max(0.1, mat.missing * 0.05);
					chunk = Math.min(chunk, mat.amtRemaining);
				} else if (allocationStrategy === "balance" && fleet.length > 1) {
					chunk = Math.max(0.1, mat.missing * 0.1);
					chunk = Math.min(chunk, mat.amtRemaining);
				}

				const canFit = Math.min(
					chunk,
					availW / mat.props.weight,
					availV / mat.props.volume,
				);

				if (canFit > 0.001) {
					targetShip.loadedW += canFit * mat.props.weight;
					targetShip.loadedV += canFit * mat.props.volume;
					targetShip.inventory[mat.ticker] =
						(targetShip.inventory[mat.ticker] || 0) + canFit;
					allocatedResults[mat.ticker] += canFit;
					mat.amtRemaining -= canFit;
					progress = true;
				}
			}
		}
	}

	const finalFleet = fleet.filter(
		(s) => s.loadedW > 0 || s.loadedV > 0 || shipOverride !== "auto",
	);

	const finalMaxW = finalFleet.reduce((acc, s) => acc + s.weight, 0);
	const finalMaxV = finalFleet.reduce((acc, s) => acc + s.volume, 0);
	const finalLoadedW = finalFleet.reduce((acc, s) => acc + s.loadedW, 0);
	const finalLoadedV = finalFleet.reduce((acc, s) => acc + s.loadedV, 0);

	return {
		fleet: finalFleet,
		fleetMaxW: finalMaxW,
		fleetMaxV: finalMaxV,
		idealW,
		idealV,
		loadedW: finalLoadedW,
		loadedV: finalLoadedV,
		allocatedResults,
	};
};
