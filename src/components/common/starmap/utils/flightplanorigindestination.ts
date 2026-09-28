import { useCallback } from "react";
import type {
	WorkerFlightPlan,
	MapPoint,
	PlanetData,
	StationData,
	AnimatedShipData,
} from "../types/maptypes";

export const findSystemById =
	(systemsPoints?: MapPoint[]) => (systemId: string) => {
		if (!systemsPoints || !systemId) return null;
		return systemsPoints.find((p: MapPoint) => p.originalSystemId === systemId);
	};

export const findPlanetById =
	(allPlanetsData?: Record<string, PlanetData[]>) =>
	(systemId: string, planetId: string) => {
		if (!allPlanetsData || !systemId) return null;
		const planetsInSystem = allPlanetsData[systemId];
		const planet = planetsInSystem?.find(
			(p: PlanetData) => p.planetid === planetId,
		);
		return planet ? planet.planetname : null;
	};

export const findStationById =
	(allStationsData?: Record<string, StationData[]>) =>
	(systemId: string, stationId: string) => {
		if (!allStationsData || !systemId) return null;
		const stationsInSystem = allStationsData[systemId];
		const station = stationsInSystem?.find(
			(s: StationData) => s.stationid === stationId,
		);
		return station ? station.name : null;
	};

export const getOriginDestinationLabel =
	(
		systemPoints?: MapPoint[],
		allPlanetsData?: Record<string, PlanetData[]>,
		allStationsData?: Record<string, StationData[]>,
	) =>
	(flightPlan?: WorkerFlightPlan, isOrigin = true) => {
		if (!flightPlan) return "Unknown Location";

		const planetId = isOrigin
			? flightPlan?.originplanetid
			: flightPlan?.destinationplanetid;

		const stationId = isOrigin
			? flightPlan?.originstationid
			: flightPlan?.destinationstationid;

		const systemId = isOrigin
			? flightPlan?.originsystemid
			: flightPlan?.destinationsystemid;

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
