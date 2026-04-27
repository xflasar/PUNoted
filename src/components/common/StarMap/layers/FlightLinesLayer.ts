import { LineLayer, PathLayer } from "@deck.gl/layers";
import type { FlightPlan, MapPoint } from "../types/mapTypes";
import { alpha } from "@mui/material";
import { useMemo } from "react";

// --- PROPS INTERFACE ---
interface FlightLinesLayerProps {
	id: string;
	data: FlightPlan[];
	visibleShipIds: Set<string>;
	systemIdToCoordinates: Map<string, [number, number]>; // Fast lookup map
	theme: any; // Material UI Theme
}

interface FlightData {
	path: [number, number][];
	isOwn: boolean;
}

/**
 * Creates a DeckGL LineLayer for drawing active flight paths.
 * Optimized for performance by using simple lines and minimizing prop updates.
 */
/* export const createFlightLinesLayer = ({
    id,
    data,
    visibleShipIds,
    systemIdToCoordinates,
    theme
}: FlightLinesLayerProps) => {

    // 1. FILTER: Only show flight plans for ships that are "toggled on"
    // We filter here to save the GPU from processing invisible lines.
    const filteredData = useMemo(() => {
         return data.filter(plan => visibleShipIds.has(plan.shipid || plan.id));
    }, [data, visibleShipIds]);

    const flightData: FlightData[] = filteredData.map(plan => ({


    return new LineLayer({
        id: `flight-lines-${id}`,
        data: filteredData,
        
        // --- COORDINATE RESOLUTION ---
        // We look up the system coordinates using the ID from the flight plan.
        getSourcePosition: (d: FlightPlan) => {
            const sysId = d.originsystemid || d.origin_location_id; // Handle varied data keys
            return systemIdToCoordinates.get(sysId) || [0, 0];
        },
        
        getTargetPosition: (d: FlightPlan) => {
            const sysId = d.destinationsystemid || d.destination_location_id;
            return systemIdToCoordinates.get(sysId) || [0, 0];
        },

        // --- STYLING ---
        getWidth: 2,
        
        // Color Logic: [R, G, B, Alpha]
        // My Ships (isOwn) -> Primary Color
        // Corp Ships -> Secondary Color
        getColor: (d: FlightPlan) => {
            if (d.isOwn) {
                // Convert theme hex to RGB, or use hardcoded optimized values
                // Example: Cyan/Green for own ships
                return [0, 255, 200, 150]; 
            } else {
                // Example: Blue for Corp ships
                return [0, 100, 255, 100];
            }
        },

        // --- INTERACTION & OPTIMIZATION ---
        pickable: false,
        autoHighlight: false,
        
        // Update Triggers: React to changes in the filter set efficiently
        updateTriggers: {
            getSourcePosition: [systemIdToCoordinates],
            getTargetPosition: [systemIdToCoordinates],
            getColor: [theme.palette.mode] 
        }
    });
}; */

/**
 * HELPER: Fast Lookup Map Generator
 * Call this in your main component (useMemo) to create the coordinate map once.
 */
/* export const useSystemCoordinateMap = (systems: MapPoint[]) => {
    return useMemo(() => {
        const map = new Map<string, [number, number]>();
        if (!systems) return map;
        
        for (const sys of systems) {
            // Map both original ID and standard ID if needed
            if (sys.originalSystemId) map.set(sys.originalSystemId, [sys.x, sys.y]);
            if (sys.id) map.set(sys.id, [sys.x, sys.y]);
        }
        return map;
    }, [systems]);
}; */

/* export const memoFlightPathLayers = useMemo(() => {
    const corpPlans = (mode === 'dashboard' || mode === 'shipping') ? (corpFlightPlans || []) : [];
    const allFlightPlans = [
      ...(ownFlightPlans || []).map(p => ({ ...p, color: [0, 255, 255, 255], isOwn: true })),
      ...corpPlans.map(p => ({ ...p, isOwn: false }))
    ];

    const paths: { path: [number, number][], id: string, color: number[], isOwn: boolean }[] = [];
    for (let i = 0; i < allFlightPlans.length; i++) {
      const plan = allFlightPlans[i];
      if (!plan || !plan.segments) continue;
      for (let j = 0; j < plan.segments.length; j++) {
        const seg = plan.segments[j];
        const start = findLocationPosition(seg.origin_system_id);
        const end = findLocationPosition(seg.destination_system_id);
        if (start && end) {
            paths.push({
                path: [start, end],
                id: `${plan.id}-${seg.segment_index ?? j}`,
                color: plan.color || [255, 255, 0, 150],
                isOwn: plan.isOwn
            });
        }
      }
    }
    
    if (!isGalaxyView) return [];

    let corpWidth = 1.5, ownWidth = 2.5;
    const zoomBucket = Math.floor(props.galaxyViewState.zoom / 2) * 2;
    if (zoomBucket < -8) { corpWidth = 4; ownWidth = 5; }
    else if (zoomBucket < -6) { corpWidth = 3; ownWidth = 4; }
    else if (zoomBucket < -4) { corpWidth = 2; ownWidth = 3; }

    return [
        new PathLayer({
            id: 'own-flight-path',
            data: paths.filter(p => p.isOwn),
            getPath: (d: any) => d.path,
            getColor: (d: any) => d.color,
            getWidth: ownWidth,
            visible: true,
            pickable: false,
        }),
        new PathLayer({
            id: 'corp-flight-path',
            data: paths.filter(p => !p.isOwn),
            getPath: (d: any) => d.path,
            getColor: (d: any) => d.color,
            getWidth: corpWidth,
            visible: (mode === 'dashboard' || mode === 'shipping'),
            pickable: false,
        })
    ];
  }, [ownFlightPlans, corpFlightPlans, findLocationPosition, mode, isGalaxyView, props.galaxyViewState.zoom]); 
 */

/*   const memoSystemFlightPathLayer = useMemo(() => {
      if (!isPlanetModeActive || !currentSystem || typeof currentSystem.x !== 'number' || !activeFlightPlans || !animatedShipData || !updatedShips) {
          return [];
      }
      const paths: any[] = [];
      const systemCenter = { x: currentSystem.x, y: currentSystem.y };
      const now = Date.now();
  
      animatedShipData
          .filter(s => updatedShips.some(us => us.id === s.id))
          .forEach(ship => {
              const segments = ship.plan?.segments;
              if (!segments) return;
              const activeSegment = segments.find((s: any) => now >= s.departure && now < s.arrival);
              if (!activeSegment) return;
              if (activeSegment.origin_system_id !== currentSystem.originalSystemId) return;
              if (!activeSegment.transferellipse) return;
  
              const pathCoordinates = calculateTransferPath(activeSegment.transferellipse, systemCenter);
              if (pathCoordinates.length === 0) return;
  
              paths.push({
                  path: pathCoordinates,
                  color: [255, 255, 0, 200],
                  width: 2
              });
          });
  
      if (paths.length === 0) return [];
      return new PathLayer({
          id: `system-flight-paths-${currentSystem.originalSystemId}`,
          data: paths,
          getPath: d => d.path,
          getColor: d => d.color,
          getWidth: d => d.width,
          widthUnits: 'pixels',
          visible: true,
          pickable: false,
          updateTriggers: { getPath: [activeFlightPlans, animatedShipData, updatedShips, currentSystem] }
      });
    }, [isPlanetModeActive, currentSystem, activeFlightPlans, animatedShipData, updatedShips, calculateTransferPath]);

    // --- PLANETS (BINARY + HYBRID LOOKUP) ---
        // We use the binary buffer for positions (fast updates), but 'data' has length N
        // DeckGL passes { index } to getIcon, allowing us to look up the static type.
        if (planetPos && planetCount > 0) {
            layers.push(new IconLayer({
                id: 'planets-layer-binary',
                data: { length: planetCount, attributes: { getPosition: { value: planetPos, size: 2 } } },
                iconAtlas: planetAtlas,
                iconMapping: planetMapping,
                
                // HYBRID LOOKUP: Use index to find static PlanetData for the correct icon
                getIcon: (d: any, { index }: any) => {
                  const p = systemPlanets[index];
                  if (!p) return 'EARTH'; // Fallback
                  const seed = p.planetname || p.planetid || 'default'; 
                  
                  if (p.type === 'ROCKY_LIKE_ROCK') return ROCKY_LIKE_PLANETS[1];
                  if (p.type === 'EARTH_LIKE') { const idx = getStableIndex(seed, 3); return EARTH_LIKE_PLANETS[idx]; }
                  if (p.type === 'ROCKY_LIKE_LAVA') return ROCKY_LIKE_PLANETS[0];
                  if (p.type === 'ROCKY_LIKE_ICE') return ROCKY_LIKE_PLANETS[2];
                  if (p.type === 'GAS_LIKE_HOT') { const idx = getStableIndex(seed, 2); return GAS_LIKE_PLANETS[idx]; }
                  if (p.type === 'GAS_LIKE_COLD') { const idx = getStableIndex(seed, 2); return GAS_LIKE_PLANETS[idx + 2]; }
                  return 'EARTH';
                },
                
                getSize: (d: any, { index }: any) => {
                   const p = systemPlanets[index];
                   const massFactor = p?.mass ? Math.log10(p.mass / 1e22) : 1; 
                   const safeMassFactor = Math.max(0.5, massFactor * 0.5);
                   return (SYSTEM_BASE_RADIUS * 0.06) * safeMassFactor; 
                },
                sizeUnits: 'meters', 
                sizeScale: 1, 
                sizeMinPixels: 35,   
                sizeMaxPixels: 400,  
                pickable: true,
                visible: isPlanetModeActive,
                textureParameters: {
                    [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
                    [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
                    [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
                    [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
                },
                
                // Interaction: Map index back to object
                onHover: (info: any) => {
                    if (info.index !== -1 && systemPlanets[info.index]) {
                        const p = systemPlanets[info.index];
                        setTooltip({ x: info.x, y: info.y, content: `${p.planetname}\nPopulation:${p.planetPopulation?.toLocaleString() ?? 'N/A'}` });
                    } else {
                        setTooltip(null);
                    }
                },
                onClick: (info: any) => {
                    if (info.index !== -1 && systemPlanets[info.index]) {
                        setSelectedPlanet(systemPlanets[info.index]);
                    }
                },
                updateTriggers: {
                  getPosition: [frameTick], // Only update positions when tick changes
                },
            }));
        } */
