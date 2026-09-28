import { useMemo } from "react";
import type { AnimatedShipData } from "../types/maptypes";
import { parseFlightTimestamp } from "../utils/timestamputils";

export const useShipDataProcessor = (
	ownerShips: AnimatedShipData[],
	otherShips: AnimatedShipData[],
	visibleCorpGroups: Record<string, boolean>,
	ownShipsVisible: boolean,
	visiblePathShipIds: Set<string>,
) => {
	return useMemo(() => {
		const now = Date.now();

		const own: AnimatedShipData[] = [];
		const allVisible: AnimatedShipData[] = [];
		const corpGroupsMap = new Map<
			string,
			{ name: string; ships: AnimatedShipData[] }
		>();
		const otherGroupsMap = new Map<
			string,
			{ name: string; ships: AnimatedShipData[] }
		>();

		// Dynamic UI states
		const staticShips: AnimatedShipData[] = [];
		const inFlightShips: AnimatedShipData[] = [];

		const processShip = (ship: AnimatedShipData, isOwnedByData: boolean) => {
			const idVal = ship.id || (ship as any).shipid || (ship as any).ship_id;
			const mapShip = {
				...ship,
				id: idVal,
				shipid: idVal,
				ship_id: idVal,
				visible: true,
				isOwn: isOwnedByData,
				addresssystemid:
					(ship as any).addresssystemid || (ship as any).address_system_id,
				addressplanetid:
					(ship as any).addressplanetid || (ship as any).address_planet_id,
				addressstationid:
					(ship as any).addressstationid || (ship as any).address_station_id,
			};

			// 1. Determine Dynamic State based on time (Is it flying or landed?)
			let isFlying = false;
			let arrivalMs = 0;
			if (
				mapShip.plan &&
				mapShip.plan.segments &&
				mapShip.plan.segments.length > 0
			) {
				const segments = mapShip.plan.segments;
				arrivalMs = segments[segments.length - 1].arrival;
				if (now < arrivalMs) isFlying = true;
			} else if (mapShip.plan && mapShip.plan.arrivaltimestamp) {
				// Fallback if segments are missing
				const t1 = parseFlightTimestamp(mapShip.plan.arrivaltimestamp);
				const t2 = mapShip.plan.departuretimestamp
					? parseFlightTimestamp(mapShip.plan.departuretimestamp)
					: 0;
				arrivalMs = Math.max(t1, t2);
				if (now < arrivalMs) isFlying = true;
			}

			if (isFlying) inFlightShips.push(mapShip);
			else staticShips.push(mapShip); // Catches docked ships AND arrived ships waiting for WS sync

			// 2. Visibility and Categorization
			if (isOwnedByData) {
				own.push(mapShip);
				(mapShip as any).color = [0, 255, 127];
				if (ownShipsVisible) allVisible.push(mapShip);
			} else {
				const compCode = (
					ship.company_code ||
					ship.companycode ||
					ship.company_name ||
					ship.companyname ||
					ship.code ||
					""
				).trim();

				const ownerName = (
					ship.ownername ||
					ship.owner_name ||
					ship.owner ||
					ship.username ||
					ship.user_name ||
					ship.display_name ||
					ship.displayname ||
					""
				).trim();

				let displayName = "Corporation Member";
				if (compCode && ownerName) {
					if (ownerName.toUpperCase().includes(compCode.toUpperCase())) {
						displayName = ownerName;
					} else {
						displayName = `[${compCode}] ${ownerName}`;
					}
				} else if (compCode) {
					displayName = `[${compCode}]`;
				} else if (ownerName) {
					displayName = ownerName;
				}

				const isCorpShip = (ship as any).is_other !== true;

				if (isCorpShip) {
					if (!corpGroupsMap.has(displayName)) {
						corpGroupsMap.set(displayName, { name: displayName, ships: [] });
					}
					corpGroupsMap.get(displayName)!.ships.push(mapShip);
					(mapShip as any).color = [0, 100, 255]; // Corporate blue
				} else {
					if (!otherGroupsMap.has(displayName)) {
						otherGroupsMap.set(displayName, { name: displayName, ships: [] });
					}
					otherGroupsMap.get(displayName)!.ships.push(mapShip);
					(mapShip as any).color = [255, 128, 0]; // Other ships orange
				}

				if (visibleCorpGroups[displayName] === true) {
					allVisible.push(mapShip);
				}
			}
		};

		ownerShips.forEach((s) => processShip(s, true));
		otherShips.forEach((s) => processShip(s, false));

		const finalCorpGroups: Record<string, AnimatedShipData[]> = {};
		Array.from(corpGroupsMap.entries())
			.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
			.forEach(([_, group]) => {
				finalCorpGroups[group.name] = group.ships;
			});

		const finalOtherGroups: Record<string, AnimatedShipData[]> = {};
		Array.from(otherGroupsMap.entries())
			.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
			.forEach(([_, group]) => {
				finalOtherGroups[group.name] = group.ships;
			});

		// Derive active flight plans for the map lines
		const isPlanActive = (s: AnimatedShipData) => {
			if (!s.plan) return false;
			if (s.plan.segments && s.plan.segments.length > 0) {
				return s.plan.segments[s.plan.segments.length - 1].arrival > now;
			}
			if (s.plan.arrivaltimestamp) {
				const t1 = parseFlightTimestamp(s.plan.arrivaltimestamp);
				const t2 = s.plan.departuretimestamp
					? parseFlightTimestamp(s.plan.departuretimestamp)
					: 0;
				return Math.max(t1, t2) > now;
			}
			return false;
		};

		const allCorpShips = otherShips;
		const myPlans = own
			.filter((s) => visiblePathShipIds.has(s.id) && isPlanActive(s))
			.map((s) => ({
				...s.plan!,
				isOwn: true,
				shipid: s.id,
			}));

		const corpPlans = allCorpShips
			.filter((s) => visiblePathShipIds.has(s.id) && isPlanActive(s))
			.map((s) => ({
				...s.plan!,
				isOwn: false,
				shipid: s.id,
			}));

		return {
			ownShips: own,
			corpShipsGrouped: finalCorpGroups,
			otherShipsGrouped: finalOtherGroups,
			visibleAnimatedShipData: allVisible,
			effectiveFlightPlans: [...myPlans, ...corpPlans],
			staticShips,
			inFlightShips,
		};
	}, [
		ownerShips,
		otherShips,
		visibleCorpGroups,
		ownShipsVisible,
		visiblePathShipIds,
	]);
};
