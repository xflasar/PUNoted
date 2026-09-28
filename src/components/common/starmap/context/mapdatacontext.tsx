import React, { createContext, useContext } from "react";
import { useGlobalData } from "../../../../context/globaldatacontext";
import { useMapDataInternal } from "../hooks/usemapdata";
import type {
	MapPoint,
	Sector,
	PlanetData,
	StationData,
	GatewayData,
} from "../types/maptypes";

export interface MapDataContextType {
	isLoading: boolean;
	fetchError: string | null;
	systemsPoints: MapPoint[];
	sectors: Sector[];
	empireLegend: Record<string, string>;
	systemConnections: { sourcePosition: number[]; targetPosition: number[] }[];
	gatewayConnections: {
		sourcePosition: number[];
		targetPosition: number[];
		type: string;
	}[];
	allPlanetsData: Record<string, PlanetData[]>;
	allStationsData: Record<string, StationData[]>;
	allGatewaysData: Record<string, GatewayData[]>;
	maxSystemPopulation: number;
	contentBounds: {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
	} | null;
	rawConnections: any[];
}

const MapDataContext = createContext<MapDataContextType | null>(null);

export const MapDataProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { mapData } = useGlobalData();
	const value = useMapDataInternal(mapData);

	return (
		<MapDataContext.Provider value={value}>{children}</MapDataContext.Provider>
	);
};

/**
 * Hook to consume processed map data from the MapDataProvider context.
 * Falls back to internal hook computation if used outside MapDataProvider.
 */
export const useMapData = (
	mapDataFromContext: any = null,
): MapDataContextType => {
	const ctx = useContext(MapDataContext);
	if (ctx) return ctx;
	// eslint-disable-next-line react-hooks/rules-of-hooks
	return useMapDataInternal(mapDataFromContext);
};
