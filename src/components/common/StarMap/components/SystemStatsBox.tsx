import React, { useState } from "react"; // ⬅️ IMPORT useState
import { 
    Box, 
    Paper, 
    Typography, 
    useTheme, 
    Divider, 
    IconButton // ⬅️ IMPORT IconButton
} from "@mui/material";
// ⬇️ IMPORT ICONS (You might need to install @mui/icons-material)
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';

import type { SystemStats } from "../types/mapTypes";

// Component to display the population color gradient legend with dynamic min/max numbers
const PopulationLegend: React.FC<{ minPop: number, maxPop: number }> = ({ minPop, maxPop }) => {
    // Color stops used in the getPlanetColorByPopulation function
    const lowColor = 'rgb(100, 255, 255)';
    const midColor = 'rgb(255, 255, 100)';
    const highColor = 'rgb(200, 0, 0)';

    let barStyle = {};
    let title = "Planet Population Intensity (Logarithmic)";

    if (minPop === maxPop) {
        const solidColor = highColor;
        barStyle = { background: solidColor };
        title = "Single Population Value";
    } else {
        const gradient = `linear-gradient(to right, ${lowColor} 0%, ${midColor} 50%, ${highColor} 100%)`;
        barStyle = { background: gradient };
    }

    return (
        <Box sx={{ mt: 1, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>{title}</Typography>
            
            <Box 
                sx={{ 
                    height: 12, 
                    borderRadius: 1, 
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                    mb: 0.5,
                    ...barStyle
                }} 
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                    {minPop.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                    {maxPop.toLocaleString()}
                </Typography>
            </Box>
        </Box>
    );
};

export const SystemStatsBox: React.FC<{ stats: SystemStats | null }> = ({ stats }) => {
    const theme = useTheme();
    
    // 1. STATE FOR MINIMIZATION
    const [isBoxMinimized, setIsBoxMinimized] = useState(false);
    const [isPlanetListMinimized, setIsPlanetListMinimized] = useState(false);

    if (!stats) {
        return null;
    }

    // --- Utility to calculate Min/Max Populations ---
    const getMinMaxPopulations = () => {
        if (!stats.planetDetails || stats.planetDetails.length === 0) {
            return { min: 0, max: 0 };
        }
        
        const populations = stats.planetDetails.map(p => p.population).filter(p => p > 0);
        if (populations.length === 0) return { min: 0, max: 0 };

        const min = Math.min(...populations);
        const max = Math.max(...populations);
        return { min, max };
    };

    const { min: minPop, max: maxPop } = getMinMaxPopulations();
    const shouldShowLegend = stats.planetDetails.length > 0 && maxPop > 0;

    // Utility function to categorize the system based on total population (omitted for brevity, assume it works)
    const getSystemClassification = (population: number) => {
        if (population >= 10000000) return { label: "Core Sector", color: 'success.main' };
        if (population >= 100000) return { label: "Established Colony", color: 'warning.main' };
        if (population > 0) return { label: "Outpost / Frontier", color: 'info.main' };
        return { label: "Unsettled", color: 'text.disabled' };
    };
    const systemClassification = getSystemClassification(stats.totalSystemPopulation);


    const asteoridColorization = (microasteroidCount: number) => {
        const asteroidCount = microasteroidCount ?? 0;
        const colorFactor = Math.min(1, Math.max(0, asteroidCount / 5));
        
        let elementText = "Low concentration (Safe)";
        let color = 'rgba(100, 150, 255, 255)';

        if(colorFactor >= 0.15 && colorFactor < 0.75) {
            elementText = "Medium concentration (Caution)";
            color = 'rgba(255, 100, 0, 255)';
        } else if (colorFactor >= 0.75) {
            elementText = "High concentration (Hazard!)";
            color = 'rgba(255, 0, 0, 255)';
        }
        
        return (
            <Typography variant="body2" fontWeight="bold" sx={{ color: color }}>
                {elementText}
            </Typography>
        );
    }

    return (
        <Paper 
            elevation={5} 
            sx={{ 
                position: "absolute", 
                top: 10, 
                right: 10, 
                padding: isBoxMinimized ? 1 : 2, // Less padding when minimized
                zIndex: 20, 
                opacity: 0.95, 
                minWidth: 280, 
                // Set max height only when not minimized
                maxHeight: isBoxMinimized ? 'auto' : "calc(100% - 20px)", 
                overflowY: isBoxMinimized ? 'hidden' : "auto", 
                pointerEvents: "auto", 
                background: theme.palette.background.paper 
            }}
        >
            {/* --- 3. MAIN BOX HEADER AND MINIMIZE BUTTON --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ mr: 1, whiteSpace: 'nowrap' }}>
                    {stats.name} System
                </Typography>
                <IconButton 
                    size="small" 
                    onClick={() => setIsBoxMinimized(!isBoxMinimized)}
                >
                    {isBoxMinimized ? <AddIcon /> : <RemoveIcon />}
                </IconButton>
            </Box>

            {/* --- CONDITIONAL CONTENT RENDERING --- */}
            {!isBoxMinimized && (
                <>
                    {/* System Overview */}
                    <Typography variant="subtitle1" sx={{ mt: 1, mb: 0.5 }}>System Overview</Typography>
                    <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="body2" color="text.secondary">Classification:</Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: systemClassification.color }}>
                                {systemClassification.label}
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="body2" color="text.secondary">Total Planets:</Typography>
                            <Typography variant="body2" fontWeight="bold">{stats.planetCount}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="body2" color="text.secondary">Total Population:</Typography>
                            <Typography variant="body2" fontWeight="bold">{stats.totalSystemPopulation.toLocaleString()}</Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 1 }}/>

                    {/* Hazard Assessment */}
                    <Typography variant="subtitle1" sx={{ mt: 1, mb: 0.5 }}>Hazard Assessment</Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">Micro-Asteroid Field:</Typography>
                        {asteoridColorization(stats.microasteroidCount)}
                    </Box>

                    <Divider sx={{ my: 1 }}/>
                    
                    {/* Population Legend */}
                    {shouldShowLegend && (
                        <>
                            <PopulationLegend minPop={minPop} maxPop={maxPop} />
                            <Divider sx={{ my: 1 }}/>
                        </>
                    )}

                    {/* --- 4. PLANET LIST HEADER AND MINIMIZE BUTTON --- */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1">Individual Planet Stats:</Typography>
                        <IconButton 
                            size="small" 
                            onClick={() => setIsPlanetListMinimized(!isPlanetListMinimized)}
                        >
                            {isPlanetListMinimized ? <ChevronLeftIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>

                    {/* --- CONDITIONAL PLANET LIST RENDERING --- */}
                    {!isPlanetListMinimized && (
                        <Box key="system-stats-planet-list" sx={{ maxHeight: 240, overflowY: "auto", border: `1px solid ${theme.palette.divider}`, p: 1, borderRadius: 1 }}>
                            {stats.planetDetails.map((planet, index) => (
                                <Box key={index} sx={{ display: "flex", justifyContent: "space-between", borderBottom: index < stats.planetDetails.length - 1 ? `1px dashed ${theme.palette.divider}` : "none", py: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary" noWrap sx={{ flexGrow: 1, textAlign: "left", mr: 1 }}>
                                        {planet.name}
                                    </Typography>
                                    <Typography variant="caption" fontWeight="bold" color="text.primary" sx={{ flexShrink: 0 }}>
                                        {planet.population.toLocaleString()}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </>
            )}
        </Paper>
    );
};
