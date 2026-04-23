import React from 'react';
import { Box } from '@mui/material';

interface TooltipOverlayProps {
    tooltip: {
        x: number;
        y: number;
        content: string;
    } | null;
}

export const TooltipOverlay: React.FC<TooltipOverlayProps> = ({ tooltip }) => {
    if (!tooltip) return null;

    return (
        <Box
            sx={{
                position: "absolute",
                left: tooltip.x,
                top: tooltip.y,
                transform: "translate(-50%,-100%)",
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "white",
                p: "4px 8px",
                borderRadius: 1,
                pointerEvents: "none",
                zIndex: 120,
            }}
        >
            {tooltip.content}
        </Box>
    );
};
