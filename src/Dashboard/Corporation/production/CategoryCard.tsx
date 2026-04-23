import React from "react";
import { Paper, Box, Typography, Chip, Tooltip, IconButton, Table, TableHead, TableRow, TableCell, TableBody, alpha, useTheme } from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpIcon from "@mui/icons-material/Help";
import { ProductionSummaryItem, CorpMember, ProducerConsumerItem } from "../types";
import { CompactProductionRow } from "./CompactProductionRow";
import { formatSmartNumber, isUserStale } from "../utils";

interface Props {
    category: string;
    items: ProductionSummaryItem[];
    isMobile: boolean;
    onHide: (cat: string) => void;
    isDrilldown?: boolean;
    drillType?: 'prod' | 'cons';
    onDrilldown: (row: ProductionSummaryItem, type: 'prod' | 'cons') => void;
    members?: CorpMember[];
}

export const CategoryCard = React.memo(({ category, items, isMobile, onHide, isDrilldown = false, drillType, onDrilldown, members }: Props) => {
    const theme = useTheme();

    // --- RENDER DRILLDOWN VIEW (List of Users) ---
    if (isDrilldown && items.length > 0 && drillType) {
        const item = items[0]; // Drilldown categories always contain exactly 1 summary item
        const subItems: ProducerConsumerItem[] = drillType === 'prod' ? item.producers : item.consumers;
        const color = drillType === 'prod' ? "success" : "error";

        return (
            <Paper sx={{ bgcolor: alpha(theme.palette.background.default, 0.4), backdropFilter: 'blur(12px)', border: `1px solid ${alpha(theme.palette[color].main, 0.3)}`, borderRadius: 2, overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ p: 1, px: 2, bgcolor: alpha(theme.palette[color].main, 0.1), borderBottom: `1px solid ${alpha(theme.palette[color].main, 0.2)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" fontWeight="bold" fontSize="0.85rem" color={`${color}.light`}>
                            {category}
                        </Typography>
                        <Chip label={subItems.length} size="small" sx={{ height: 18, fontSize: '0.7rem', bgcolor: alpha(theme.palette.background.default, 0.5), fontWeight: 'bold' }} />
                    </Box>
                    <Tooltip title="Close Card">
                        <IconButton size="small" onClick={() => onHide(category)} sx={{ color: 'text.secondary', p: 0.5 }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Breakdown Table */}
                <Table size="small" sx={{ width: '100%' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'text.secondary', py: 0.5 }}>MEMBER</TableCell>
                            <TableCell sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'text.secondary', py: 0.5 }}>LOC</TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'text.secondary', py: 0.5 }}>AMT</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {subItems.length > 0 ? subItems.map((sub, idx) => {
                            // Check Staleness
                            const memberInfo = members?.find(m => m.companyName === sub.player || m.companyCode === sub.player);
                            const stale = memberInfo ? isUserStale(memberInfo.lastActive) : false;

                            return (
                                <TableRow key={idx} hover sx={{ '& td': { borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}` } }}>
                                    <TableCell sx={{ py: 0.75 }}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {sub.isAccurate ? 
                                                <CheckCircleIcon sx={{ fontSize: 12, color: 'success.main', opacity: 0.7 }} /> : 
                                                <HelpIcon sx={{ fontSize: 12, color: 'text.disabled', opacity: 0.7 }} />
                                            }
                                            <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: stale ? 'warning.main' : 'text.primary' }}>
                                                {sub.player}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ py: 0.75 }}>
                                        <Chip label={sub.loc} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', borderRadius: 1, borderColor: alpha(theme.palette.divider, 0.2) }} />
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 0.75 }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 700, color: stale ? 'warning.main' : (sub.isAccurate ? theme.palette[color].light : 'text.secondary') }}>
                                            {formatSmartNumber(sub.amount)}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            );
                        }) : (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ fontStyle: 'italic', color: 'text.disabled', py: 2 }}>
                                    No {drillType === 'prod' ? 'producers' : 'consumers'} found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>
        );
    }

    // --- RENDER STANDARD SUMMARY VIEW ---
    return (
        <Paper sx={{ bgcolor: alpha(theme.palette.background.default, 0.4), backdropFilter: 'blur(12px)', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: 2, overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, px: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2" fontWeight="bold" fontSize="0.85rem" color="primary.light">{category}</Typography>
                    <Chip label={items.length} size="small" sx={{ height: 18, fontSize: '0.7rem', bgcolor: alpha(theme.palette.background.default, 0.5), fontWeight: 'bold' }} />
                </Box>
                <Tooltip title="Hide Category">
                    <IconButton size="small" onClick={() => onHide(category)} sx={{ color: 'text.secondary', p: 0.5 }}>
                        <VisibilityOffIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                    <col style={{ width: '60px' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: '40px' }} />
                </colgroup>
                <TableHead>
                    <TableRow>
                        <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'text.secondary', px: 0.5 }}>TCK</TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'text.secondary', px: 0.5 }}>PROD</TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'text.secondary', px: 0.5 }}>CONS</TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'text.secondary', px: 0.5 }}>NET</TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'text.secondary', px: 0.5 }}>%</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((row, i) => (
                        <CompactProductionRow 
                            key={row.ticker + i} 
                            row={row} 
                            theme={theme} 
                            isMobile={isMobile} 
                            useFullNumbers={false} 
                            isGridMode={true} 
                            isDrilldown={false} 
                            onDrilldown={onDrilldown} 
                            members={members} 
                        />
                    ))}
                </TableBody>
            </Table>
        </Paper>
    );
});