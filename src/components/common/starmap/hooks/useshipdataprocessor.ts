import { useMemo } from "react";
import type { AnimatedShipData } from "../types/maptypes";
import { parseFlightTimestamp, getFlightArrivalMs } from "../utils/timestamputils";

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
			const idVal = ship.shipid || ship.id;
			const mapShip: AnimatedShipData = {
				...ship,
				id: idVal,
				shipid: idVal,
				visible: true,
				is_owner: isOwnedByData,
				addresssystemid: ship.addresssystemid,
				addressplanetid: ship.addressplanetid,
				addressstationid: ship.addressstationid,
			};

			// 1. Determine Dynamic State based on time (Is it flying or landed?)
			let isFlying = false;
			let arrivalMs = 0;
			if (mapShip.plan) {
				arrivalMs = getFlightArrivalMs(mapShip.plan);
				if (arrivalMs > 0 && now < arrivalMs) {
					isFlying = true;
				}
			}

			if (isFlying) {
				inFlightShips.push(mapShip);
			} else {
				// Ship has arrived or is stationary: adopt destination location if flight completed
				if (arrivalMs > 0 && now >= arrivalMs && mapShip.plan?.segments?.length) {
					const lastSeg = mapShip.plan.segments[mapShip.plan.segments.length - 1];
					if (lastSeg.destination_system_id) {
						mapShip.addresssystemid = lastSeg.destination_system_id;
					}
					if (lastSeg.destination_station_id) {
						mapShip.addressstationid = lastSeg.destination_station_id;
					}
					if (lastSeg.destination_planet_id) {
						mapShip.addressplanetid = lastSeg.destination_planet_id;
					}
					if (lastSeg.destination_location_id) {
						if (!mapShip.addressstationid && !mapShip.addressplanetid) {
							mapShip.addressstationid = lastSeg.destination_location_id;
						}
					}
				}
				staticShips.push(mapShip); // Catches docked ships AND arrived ships waiting for WS sync
			}

			// 2. Visibility and Categorization
			if (isOwnedByData) {
				own.push(mapShip);
				(mapShip as any).color = [0, 255, 127];
				if (ownShipsVisible) allVisible.push(mapShip);
			} else {
				const compCode = (ship.companycode || "").trim();
				const ownerName = (ship.displayname || "").trim();

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
			const arrival = getFlightArrivalMs(s.plan);
			return arrival > 0 && arrival > now;
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
