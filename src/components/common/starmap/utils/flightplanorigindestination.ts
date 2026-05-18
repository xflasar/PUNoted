import { useCallback } from "react";
import type {
	WorkerFlightPlan,
	MapPoint,
	PlanetData,
	StationData,
	AnimatedShipData,
} from "../types/maptypes";

export const findSystemById =
	(systemsPoints: MapPoint[]) => (systemId: string) => {
		return systemsPoints.find((p: MapPoint) => p.originalSystemId === systemId);
	};

export const findPlanetById =
	(allPlanetsData: Record<string, PlanetData[]>) =>
	(systemId: string, planetId: string) => {
		const planetsInSystem = allPlanetsData[systemId];
		const planet = planetsInSystem?.find(
			(p: PlanetData) => p.planetid === planetId,
		);
		return planet ? planet.planetname : null;
	};

export const findStationById =
	(allStationsData: Record<string, StationData[]>) =>
	(systemId: string, stationId: string) => {
		const stationsInSystem = allStationsData[systemId];
		const station = stationsInSystem?.find(
			(s: StationData) => s.stationid === stationId,
		);
		return station ? station.name : null;
	};

export const getOriginDestinationLabel =
	(
		systemPoints: MapPoint[],
		allPlanetsData: Record<string, PlanetData[]>,
		allStationsData: Record<string, StationData[]>,
	) =>
	(flightPlan: WorkerFlightPlan, isOrigin = true) => {
		// Use Optional Chaining (?. ) to safely access properties on flightPlan.
		// If flightPlan is null/undefined, the result will be undefined, not a crash.
		const planetId = isOrigin
			? flightPlan?.originplanetid
			: flightPlan?.destinationplanetid;

		const stationId = isOrigin
			? flightPlan?.originstationid
			: flightPlan?.destinationstationid;

		const systemId = isOrigin
			? flightPlan?.originsystemid
			: flightPlan?.destinationsystemid;

		// Note: systemId might be the only non-null one if the calling logic guarantees a system.
		// You can now proceed with your lookup logic:

		let specificLabel = null;
		if (planetId && systemId)
			specificLabel = findPlanetById(allPlanetsData)(systemId, planetId);
		else if (stationId && systemId)
			specificLabel = findStationById(allStationsData)(systemId, stationId);

		const systemLabel = systemId
			? findSystemById(systemPoints)(systemId)?.label
			: undefined;

		if (specificLabel && systemLabel)
			return `${specificLabel} (${systemLabel})`;
		if (specificLabel) return specificLabel;
		if (systemLabel) return systemLabel;

		// This acts as the final guard if flightPlan was null and systemId was undefined.
		return "Unknown Location";
	};

export const formatLocation = (ship: AnimatedShipData) => {
	if (ship.addressplanetid) {
		return `Docked at Planet (ID: ${ship.addressplanetid})`;
	}
	if (ship.addressstationid) {
		return `Docked at Station (ID: ${ship.addressstationid})`;
	}
	if (ship.addresssystemid) {
		return `In System (ID: ${ship.addresssystemid})`;
	}
	return "Location Unknown";
};
