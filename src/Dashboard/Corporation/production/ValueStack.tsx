import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { formatSmartNumber } from "../utils";

export const ValueStack = React.memo(({
    displayTotal,
    accurate,
    estimated,
    isCompact,
    colorBase,
    isGridMode,
    isMobile,
    theme,
    stale
}: any) => {
    // Priority: Stale (Yellow) > Base Color (Green/Red)
    const mainColor = stale ? theme.palette.warning.main : 
                      (colorBase === "success" ? theme.palette.success.light : 
                       colorBase === "error" ? theme.palette.error.light : 
                       theme.palette.text.disabled);

    const totalFontSize = isMobile || isGridMode ? '0.75rem' : '0.85rem';
    const subFontSize = '0.65rem'; 
    const breakdownThreshold = (isCompact || isGridMode) ? 0 : 9999999;
    
    const displayAccurate = formatSmartNumber(accurate, breakdownThreshold);
    const displayEstimated = formatSmartNumber(estimated, breakdownThreshold);

    return (
        <Box display="flex" flexDirection="column" alignItems="flex-end" sx={{ width: '100%', overflow: 'hidden' }}>
            {/* TOTAL */}
            <Typography variant="body2" noWrap sx={{ fontSize: totalFontSize, fontWeight: 700, color: mainColor, lineHeight: 1.1, textShadow: '0px 0px 5px rgba(0,0,0,0.3)', mb: 0.25, textAlign: 'right', width: '100%' }}>
                {displayTotal}
            </Typography>
            
            {/* BREAKDOWN - Vertical Stack */}
            {estimated > 0 && (
                <Stack direction="column" alignItems="flex-end" spacing={0} sx={{ width: '100%' }}>
                    {accurate > 0 && (
                        <Typography variant="caption" noWrap sx={{ fontSize: subFontSize, color: theme.palette.text.secondary, lineHeight: 1.1 }}>
                            <span style={{ opacity: 0.5, marginRight: 2 }}>A:</span>{displayAccurate}
                        </Typography>
                    )}
                    <Typography variant="caption" noWrap sx={{ fontSize: subFontSize, color: theme.palette.secondary.main, fontStyle: 'italic', lineHeight: 1.1 }}>
                         <span style={{ opacity: 0.5, marginRight: 2 }}>E:</span>{displayEstimated}
                    </Typography>
                </Stack>
            )}
        </Box>
    );
});