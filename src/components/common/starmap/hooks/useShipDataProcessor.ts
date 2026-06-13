import { useMemo } from 'react';
import { AnimatedShipData, FlightPlan } from '../types/maptypes';

export const useShipDataProcessor = (
  ownerShips: AnimatedShipData[],
  otherShips: AnimatedShipData[],
  visibleCorpGroups: Record<string, boolean>,
  ownShipsVisible: boolean,
  visiblePathShipIds: Set<string>
) => {
  return useMemo(() => {
    const currentUserId = typeof window !== "undefined" ? localStorage.getItem("currentUserId") : null;
    
    const allShips = [...ownerShips, ...otherShips];
    const own: AnimatedShipData[] = [];
    const allVisible: AnimatedShipData[] = [];
    const corpGroupsMap = new Map<string, { name: string; ships: AnimatedShipData[] }>();

    for (const ship of allShips) {
      const isMine = ship.is_owner || (currentUserId && String(ship.user_id) === String(currentUserId));
      let shouldRender = true;
      const mapShip = { ...ship, visible: true };

      if (isMine) {
        own.push(ship);
        (mapShip as any).color = [0, 255, 127];
        if (!ownShipsVisible) shouldRender = false;
      } else {
        const ownerId = String(ship.user_id || "unknown");
        const displayName = ship.display_name || "Unknown Owner";
        if (!corpGroupsMap.has(ownerId)) {
          corpGroupsMap.set(ownerId, { name: displayName, ships: [] });
        }
        corpGroupsMap.get(ownerId)!.ships.push(ship);
        (mapShip as any).color = [0, 100, 255];
        if (visibleCorpGroups[displayName] !== true) shouldRender = false;
      }

      if (shouldRender) allVisible.push(mapShip);
    }

    // Finalize Corp Groups
    const finalCorpGroups: Record<string, AnimatedShipData[]> = {};
    Array.from(corpGroupsMap.entries()).sort().forEach(([_, group]) => {
      finalCorpGroups[group.name] = group.ships;
    });

    // Derive Flight Plans
    const allCorpShips = Object.values(finalCorpGroups).flat();
    const myPlans = own.filter(s => visiblePathShipIds.has(s.id)).map(s => ({ ...(s.plan || s.plan), isOwn: true, shipid: s.id }));
    const corpPlans = allCorpShips.filter(s => visiblePathShipIds.has(s.id)).map(s => ({ ...(s.plan || s.plan), isOwn: false, shipid: s.id }));

    return {
      ownShips: own,
      corpShipsGrouped: finalCorpGroups,
      visibleAnimatedShipData: allVisible,
      effectiveFlightPlans: [...myPlans, ...corpPlans].filter(p => p !== null)
    };
  }, [ownerShips, otherShips, visibleCorpGroups, ownShipsVisible, visiblePathShipIds]);
};