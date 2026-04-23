import React from 'react';
import { Paper, Typography, Box, type Theme } from '@mui/material';

interface PopulationLegendProps {
    popFilterSetting: string;
    isGalaxyView: boolean;
    POPULATION_TYPE_COLORS: Record<string, string>;
    theme: Theme;
}

export const PopulationLegend: React.FC<PopulationLegendProps> = ({ popFilterSetting, isGalaxyView, POPULATION_TYPE_COLORS, theme }) => {
    const isVisible = popFilterSetting !== 'Off' && isGalaxyView;

    if (!isVisible) {
        return null;
    }

    return (
        <Paper
            sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                p: 1,
                zIndex: 10,
                background: theme.palette.background.paper,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                minWidth: 160,
                alignItems: 'center',
            }}
        >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Population Legend
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
                {Object.entries(POPULATION_TYPE_COLORS).map(([type, color]) => (
                    <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: '3px', background: color, border: '1px solid #555' }} />
                        <Typography variant="body2" sx={{ fontSize: 12, textTransform: 'capitalize' }}>
                            {type.toLowerCase()}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};