import React, { useState, useCallback, useMemo } from "react";
import { Box, Tooltip, Typography, Stack, alpha } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpIcon from "@mui/icons-material/Help";
import { ProducerConsumerItem, CorpMember } from "../types";
import { formatExactNumber, formatSmartNumber, isUserStale } from "../utils";

export const DetailTooltip = React.memo(({
    children,
    items,
    title,
    color,
    totalRaw,
    accurateRaw,
    estimatedRaw,
    theme,
    members
}: any) => {
    // LAZY LOADING STATE
    const [isOpen, setIsOpen] = useState(false);

    const isMemberStale = useCallback((name: string) => {
        return members?.some(
            (m: CorpMember) =>
                (m.companyName === name || m.companyCode === name) &&
                isUserStale(m.lastActive)
        );
    }, [members]);

    // Only generate this heavy content when the tooltip is actually open
    const content = useMemo(() => {
        if (!isOpen) return null; // Return null if not open to save resources

        return (
            <Box sx={{ p: 0.5, minWidth: 220, maxHeight: 300, overflowY: 'auto' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block', color: 'text.secondary', borderBottom: 1, borderColor: 'divider' }}>
                    {title} ({items.length})
                </Typography>
                <Stack spacing={0.5}>
                    <Box sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, pb: 1, mb: 0.5 }}>
                        <Box display="flex" justifyContent="space-between" gap={2}>
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 'bold' }}>TOTAL</Typography>
                            <Typography variant="caption" sx={{ color: theme.palette[color].light, fontWeight: 'bold', fontSize: '0.8rem' }}>{formatExactNumber(totalRaw)}</Typography>
                        </Box>
                        {estimatedRaw > 0 && (
                            <>
                            <Box display="flex" justifyContent="space-between" gap={2} mt={0.25}>
                                <Typography variant="caption" sx={{ color: 'text.disabled', pl: 1, fontSize: '0.7rem' }}>↳ Accurate</Typography>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{formatExactNumber(accurateRaw)}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" gap={2}>
                                <Typography variant="caption" sx={{ color: 'text.disabled', pl: 1, fontSize: '0.7rem' }}>↳ Estimated</Typography>
                                <Typography variant="caption" sx={{ color: theme.palette.secondary.main, fontStyle: 'italic' }}>~{formatExactNumber(estimatedRaw)}</Typography>
                            </Box>
                            </>
                        )}
                    </Box>
                    {items.length > 0 ? items.map((i: ProducerConsumerItem, idx: number) => {
                        const stale = isMemberStale(i.player);
                        return (
                            <Box key={idx} display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    {i.isAccurate ? <CheckCircleIcon sx={{ fontSize: 12, color: theme.palette.success.main, opacity: 0.8 }} /> : <HelpIcon sx={{ fontSize: 12, color: theme.palette.secondary.main, opacity: 0.8 }} />}
                                    <Box>
                                        <Typography variant="caption" sx={{ color: stale ? 'warning.main' : 'white', display: 'block', lineHeight: 1 }}>{i.player}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>{i.loc}</Typography>
                                    </Box>
                                </Stack>
                                <Typography variant="caption" sx={{ color: stale ? 'warning.main' : (i.isAccurate ? theme.palette[color].light : theme.palette.secondary.light), fontWeight: 'bold' }}>{formatSmartNumber(i.amount)}</Typography>
                            </Box>
                        );
                    }) : <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>None</Typography>}
                </Stack>
            </Box>
        );
    }, [isOpen, items, title, color, totalRaw, accurateRaw, estimatedRaw, theme, members, isMemberStale]);

    return (
        <Tooltip 
            arrow 
            placement="top" 
            title={content || ""} // Pass empty string if not open
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            componentsProps={{ tooltip: { sx: { bgcolor: alpha(theme.palette.background.default, 0.95), backdropFilter: 'blur(10px)', border: `1px solid ${alpha(theme.palette.divider, 0.2)}` } } }}
        >
            <Box sx={{ cursor: 'help', width: '100%' }}>{children}</Box>
        </Tooltip>
    );
});