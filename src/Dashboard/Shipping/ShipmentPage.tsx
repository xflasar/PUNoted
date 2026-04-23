import React, { useMemo, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import BaseStarMap from '../../components/common/StarMap/BaseStarMap';
import { ShipmentListWidget } from './components/ShipmentListWidget';
import { ShipmentDetailWidget, LocationFocusTarget } from './components/ShipmentDetailWidget';
import { useGlobalData } from '../../context/GlobalDataContext';
import type { ShipmentShip } from './types';

const ShipmentPage: React.FC = () => {
    const { shipmentState } = useGlobalData();
    
    // CHANGE: Track 'contractparty' (unique per view) instead of 'contract_id' (shared)
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [cameraFocus, setCameraFocus] = useState<LocationFocusTarget | null>(null);

    // 1. Find the Selected Contract
    const selectedContract = useMemo(() => {
        // Safety: Check if contracts array exists before trying to find
        if (!selectedId || !shipmentState?.contracts) return null;
        
        // CHANGE: Match on the unique 'contractparty' (or 'id_party' depending on your types.ts)
        // Ensure your ShipmentContract type has 'contractparty' or 'id_party' defined!
        return shipmentState.contracts.find(c => (c as any).contract_id === selectedId) || null;
    }, [shipmentState, selectedId]);

    // 2. Filter Ships
    const visibleShips = useMemo(() => {
        // Safety: Handle loading state
        if (!shipmentState?.ships) return {};

        if (!selectedContract) return shipmentState.ships; 
        
        const contractShipIds = new Set<string>();
        selectedContract.items.forEach(item => {
            if (item.shipid) contractShipIds.add(item.shipid);
        });

        const filtered: Record<string, ShipmentShip> = {};
        contractShipIds.forEach(id => {
            if (shipmentState.ships[id]) {
                filtered[id] = shipmentState.ships[id];
            }
        });
        return filtered;
    }, [shipmentState, selectedContract]);

    // 3. Map Config
    const memoizedStarMap = useMemo(
        () => (
            <BaseStarMap 
                mode="shipping"
                overrideShips={visibleShips}
                focusTarget={cameraFocus}
            />
        ),
        [visibleShips, cameraFocus]
    );

    // LOADING STATE
    if (!shipmentState) {
        return (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            <Box id="map" sx={{ display: "flex", position: "absolute", inset: 0, zIndex: 1, width: "100%", height: "100%" }}>
                {memoizedStarMap}
            </Box>

            {/* LIST WIDGET */}
            <ShipmentListWidget 
                contracts={shipmentState.contracts || []} // Pass empty array if null
                onSelect={(id) => {
                    // 'id' here comes from the list widget, ensure it passes the 'contractparty'
                    setSelectedId(id);
                    setCameraFocus(null); 
                }} 
            />

            {/* DETAIL WIDGET */}
            {selectedContract && (
                <ShipmentDetailWidget 
                    contract={selectedContract}
                    ships={shipmentState.ships || {}}
                    onClose={() => {
                        setSelectedId(null);
                        setCameraFocus(null);
                    }}
                    onFocusLocation={(target) => setCameraFocus(target)}
                />
            )}
        </Box>
    );
};

export default ShipmentPage;