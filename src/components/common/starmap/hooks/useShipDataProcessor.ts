import { useMemo } from "react";
import { AnimatedShipData } from "../types/maptypes";

export const useShipDataProcessor = (
	ownerShips: AnimatedShipData[],
	otherShips: AnimatedShipData[],
	visibleCorpGroups: Record<string, boolean>,
	ownShipsVisible: boolean,
	visiblePathShipIds: Set<string>,
) => {
	return useMemo(() => {
		const currentUserId =
			typeof window !== "undefined"
				? localStorage.getItem("currentUserId")
				: null;
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
			const isMine =
				isOwnedByData ||
				(currentUserId && String(ship.user_id) === String(currentUserId));
			const mapShip = {
				...ship,
				visible: true,
				isOwn: isMine,
				addresssystemid:
					ship.addresssystemid || (ship as any).address_system_id,
				addressplanetid:
					ship.addressplanetid || (ship as any).address_planet_id,
				addressstationid:
					ship.addressstationid || (ship as any).address_station_id,
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
				const t1 = new Date(mapShip.plan.arrivaltimestamp).getTime();
				const t2 = mapShip.plan.departuretimestamp
					? new Date(mapShip.plan.departuretimestamp).getTime()
					: 0;
				arrivalMs = Math.max(t1, t2);
				if (now < arrivalMs) isFlying = true;
			}

			if (isFlying) inFlightShips.push(mapShip);
			else staticShips.push(mapShip); // Catches docked ships AND arrived ships waiting for WS sync

			// 2. Visibility and Categorization
			if (isMine) {
				own.push(mapShip);
				(mapShip as any).color = [0, 255, 127];
				if (ownShipsVisible) allVisible.push(mapShip);
			} else {
				const ownerId = String(ship.user_id || "unknown");
				const displayName = ship.display_name || "Unknown Owner";
				const isCorpShip = !!ship.is_corp || !!ship.iscorp;

				if (isCorpShip) {
					if (!corpGroupsMap.has(ownerId)) {
						corpGroupsMap.set(ownerId, { name: displayName, ships: [] });
					}
					corpGroupsMap.get(ownerId)!.ships.push(mapShip);
					(mapShip as any).color = [0, 100, 255]; // Corporate blue
				} else {
					if (!otherGroupsMap.has(ownerId)) {
						otherGroupsMap.set(ownerId, { name: displayName, ships: [] });
					}
					otherGroupsMap.get(ownerId)!.ships.push(mapShip);
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
			.sort()
			.forEach(([_, group]) => {
				finalCorpGroups[group.name] = group.ships;
			});

		const finalOtherGroups: Record<string, AnimatedShipData[]> = {};
		Array.from(otherGroupsMap.entries())
			.sort()
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
				const t1 = new Date(s.plan.arrivaltimestamp).getTime();
				const t2 = s.plan.departuretimestamp
					? new Date(s.plan.departuretimestamp).getTime()
					: 0;
				return Math.max(t1, t2) > now;
			}
			return false;
		};

		const allCorpShips = otherShips;
		const myPlans = own
			.filter(
				(s) =>
					visiblePathShipIds.has(s.ship_id || (s as any).id) && isPlanActive(s),
			)
			.map((s) => ({
				...s.plan!,
				isOwn: true,
				shipid: s.ship_id || (s as any).id,
			}));

		const corpPlans = allCorpShips
			.filter(
				(s) =>
					visiblePathShipIds.has(s.ship_id || (s as any).id) && isPlanActive(s),
			)
			.map((s) => ({
				...s.plan!,
				isOwn: false,
				shipid: s.ship_id || (s as any).id,
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
