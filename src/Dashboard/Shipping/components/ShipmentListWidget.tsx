import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
    Box, Typography, IconButton, InputBase, Paper, ListItem, ListItemText, 
    useTheme, alpha, Tooltip, Stack, Chip
} from '@mui/material';
import { 
    Search, ArrowDownward, ArrowUpward, ExpandLess, ExpandMore,
    Inventory, CheckCircle, Handshake, Close, Schedule, Warning
} from '@mui/icons-material';
import { formatDistanceToNowStrict, addDays, isBefore, differenceInHours } from 'date-fns';
import { Virtuoso } from 'react-virtuoso';
import type { ShipmentContract, ShipmentItem } from '../types';

interface Props {
    contracts: ShipmentContract[];
    onSelect: (id: string) => void;
}

// --- HELPER: Deadline Logic ---
const getDeadlineInfo = (contract: ShipmentContract) => {
    const deadline = contract.deadline ? new Date(contract.deadline) : addDays(new Date(contract.created_at), 7);
    const now = new Date();
    const isLate = isBefore(deadline, now);
    const hoursLeft = differenceInHours(deadline, now);
    const text = formatDistanceToNowStrict(deadline, { addSuffix: true });
    
    return { 
        text: isLate ? `Overdue ${text}` : text,
        isUrgent: !isLate && hoursLeft < 1,
        isLate
    };
};

// --- COMPONENT: CONDITION BADGE ---
const ConditionBadge = React.memo(({ item }: { item: ShipmentItem }) => {
    const theme = useTheme();
    const isDone = item.status === 'FULFILLED';
    const color = isDone ? theme.palette.success.main : item.type === 'DELIVERY_SHIPMENT' ? theme.palette.primary.dark : theme.palette.text.secondary;
    const bg = isDone ? alpha(theme.palette.success.main, 0.15) : item.type === 'DELIVERY_SHIPMENT' ? alpha(theme.palette.primary.dark, 0.15) : alpha(theme.palette.background.default, 0.3);
    const border = isDone ? alpha(theme.palette.success.main, 0.3) : item.type === 'DELIVERY_SHIPMENT' ? alpha(theme.palette.primary.dark, 0.3) : alpha(theme.palette.divider, 0.1);

    return (
        <Tooltip title={`${item.type}`}>
            <Box sx={{ 
                display: 'flex', alignItems: 'center', gap: 0.5, 
                bgcolor: bg, borderRadius: 1, px: 0.8, py: 0.25,
                border: `1px solid ${border}`, transition: 'all 0.2s'
            }}>
                {isDone ? <CheckCircle sx={{ fontSize: 12, color }} /> : <Inventory sx={{ fontSize: 12, color, opacity: 0.7 }} />}
                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color }}>
                    {item.quantity} {item.material_ticker}
                </Typography>
            </Box>
        </Tooltip>
    );
});

// --- COMPONENT: CONTRACT ROW ---
const ContractRow = React.memo(({ contract, accentColor, onClick }: { contract: ShipmentContract, accentColor: string, onClick: () => void }) => {
    const theme = useTheme();
    const { text: deadlineText, isUrgent, isLate } = getDeadlineInfo(contract);

    // Dynamic Time Color
    let timeColor = theme.palette.text.secondary;
    if (isUrgent) timeColor = theme.palette.error.main; // < 1h
    if (isLate) timeColor = theme.palette.error.dark;

    return (
        <ListItem 
            button 
            onClick={onClick}
            sx={{ 
                flexDirection: 'column', alignItems: 'stretch', 
                p: 1.5, mb: 0.75, borderRadius: 2,
                bgcolor: alpha(theme.palette.background.default, 0.6), // Fixed alpha issue
                border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                transition: 'all 0.2s',
                '&:hover': { 
                    bgcolor: alpha(accentColor, 0.1), 
                    borderColor: alpha(accentColor, 0.3),
                    transform: 'translateX(2px)'
                },
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Left Accent Bar */}
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: accentColor, opacity: 0.8 }} />

            {/* Header Row: ID & Deadline */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5, pl: 1 }}>
                <Typography variant="subtitle1" sx={{ 
                    fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', 
                    color: theme.palette.text.primary, letterSpacing: -0.5 
                }}>
                    {contract.local_id}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {(isUrgent || isLate) && <Warning sx={{ fontSize: 14, color: timeColor }} />}
                    <Typography variant="caption" sx={{ 
                        color: timeColor, fontWeight: (isUrgent || isLate) ? 800 : 500, fontSize: '0.7rem' 
                    }}>
                        {deadlineText}
                    </Typography>
                </Box>
            </Box>

            {/* Partner Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, pl: 1, opacity: 0.8 }}>
                <Handshake sx={{ fontSize: 14, color: theme.palette.text.disabled }} />
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                    {contract.partner_name}
                </Typography>
                <Chip 
                    label={contract.status} 
                    size="small" 
                    sx={{ 
                        height: 16, fontSize: '0.6rem', fontWeight: 700, ml: 'auto',
                        bgcolor: alpha(accentColor, 0.1), color: accentColor, 
                        border: 'none'
                    }} 
                />
            </Box>

            {/* Conditions (Show ALL) */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, pl: 1 }}>
                {contract.items.map((item, i) => (
                    <ConditionBadge key={i} item={item} />
                ))}
            </Box>
        </ListItem>
    );
});

// --- MAIN WIDGET ---
export const ShipmentListWidget: React.FC<Props> = ({ contracts, onSelect }) => {
    const theme = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [outboundExpanded, setOutboundExpanded] = useState(true);
    const [inboundExpanded, setInboundExpanded] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);

    // --- 1. Filter Data ---
    const { outbound, inbound } = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        const filtered = contracts.filter(c => 
            !lower || 
            c.local_id.toLowerCase().includes(lower) || 
            c.partner_name.toLowerCase().includes(lower)
        );
        return {
            // Using 'role' as requested
            outbound: filtered.filter(c => (c as any).role === 'CARRIER'), 
            inbound: filtered.filter(c => (c as any).role === 'CLIENT')
        };
    }, [contracts, searchTerm]);

    // --- 2. Auto-Collapse Logic ---
    useEffect(() => {
        setOutboundExpanded(outbound.length > 0);
    }, [outbound.length]);

    useEffect(() => {
        setInboundExpanded(inbound.length > 0);
    }, [inbound.length]);

    // --- 3. Dynamic Styles ---
    const outboundColor = theme.palette.primary.dark;
    const inboundColor = theme.palette.secondary.light;

    // --- 4. Renderers ---
    const renderOutboundRow = useCallback((index: number, c: ShipmentContract) => (
        <Box sx={{ px: 1, pt: 0.5 }}><ContractRow contract={c} accentColor={outboundColor} onClick={() => onSelect(c.contract_id)} /></Box>
    ), [onSelect, outboundColor]);

    const renderInboundRow = useCallback((index: number, c: ShipmentContract) => (
        <Box sx={{ px: 1, pt: 0.5 }}><ContractRow contract={c} accentColor={inboundColor} onClick={() => onSelect(c.contract_id)} /></Box>
    ), [onSelect, inboundColor]);

    if (isMinimized) {
        return (
            <Paper elevation={6} sx={{ 
                position: 'absolute', top: '10vh', left: 20, 
                zIndex: 20, bgcolor: alpha(theme.palette.background.default, 0.9), 
                borderRadius: '50%', width: 56, height: 56, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${theme.palette.divider}`, cursor: 'pointer'
            }}>
                <IconButton onClick={() => setIsMinimized(false)} color="primary"><Inventory /></IconButton>
            </Paper>
        );
    }

    return (
        <Paper elevation={6} sx={{ 
            position: 'absolute', top: '10vh', left: 20, width: 320, height: '80vh', 
            display: 'flex', flexDirection: 'column', 
            bgcolor: alpha(theme.palette.background.default, 0.85), // Fixed: background.default
            backdropFilter: 'blur(16px)', border: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary, zIndex: 20, overflow: 'hidden', borderRadius: 2
        }}>
            {/* Header */}
            <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.default, 0.4), flexShrink: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: theme.palette.primary.main, letterSpacing: 2 }}>LOGISTICS</Typography>
                    <IconButton size="small" onClick={() => setIsMinimized(true)} sx={{ ml: 'auto', color: theme.palette.text.secondary }}><Close fontSize="small" /></IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 1, px: 1, py: 0.25 }}>
                    <Search sx={{ fontSize: 16, color: theme.palette.text.disabled, mr: 1 }} />
                    <InputBase 
                        placeholder="Search contracts..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ ml: 1, flex: 1, fontSize: '0.8rem', color: theme.palette.text.primary }}
                    />
                </Box>
            </Box>

            {/* Split Content Area (Flexbox Logic) */}
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                
                {/* 1. OUTBOUND */}
                <Box sx={{ 
                    display: 'flex', flexDirection: 'column', flexShrink: 0, 
                    flex: outboundExpanded ? 1 : 0, 
                    minHeight: '48px',
                    transition: 'flex 0.3s ease', 
                    bgcolor: alpha(theme.palette.background.default, 0.7),
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden' 
                }}>
                    <ListItem 
                        button 
                        onClick={() => setOutboundExpanded(!outboundExpanded)} 
                        sx={{ 
                            bgcolor: alpha(outboundColor, 0.15), 
                            py: 0.5, px: 1.5, height: '48px', flexShrink: 0 
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                            <ArrowUpward sx={{ fontSize: 16, color: outboundColor }} />
                            <ListItemText 
                                primary="OUTBOUND" 
                                secondary={`${outbound.length} active`} 
                                primaryTypographyProps={{ variant: 'subtitle2', color: theme.palette.primary.main, fontWeight: 700, fontSize: '0.8rem' }} 
                                secondaryTypographyProps={{ variant: 'caption', color: alpha(theme.palette.primary.main, 0.7) }} 
                                sx={{ my: 0 }} 
                            />
                        </Stack>
                        {outboundExpanded ? <ExpandLess sx={{ color: outboundColor }} /> : <ExpandMore sx={{ color: outboundColor }} />}
                    </ListItem>
                    
                    {outboundExpanded && (
                        <Box sx={{ flex: 1, minHeight: 0, bgcolor: alpha(theme.palette.common.black, 0.1) }}>
                            {outbound.length > 0 ? (
                                <Virtuoso data={outbound} itemContent={renderOutboundRow} style={{ height: '100%' }} />
                            ) : (
                                <Box sx={{ p: 3, textAlign: 'center', opacity: 0.5 }}>
                                    <Typography variant="caption">No active outbound contracts</Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>

                {/* 2. INBOUND */}
                <Box sx={{ 
                    display: 'flex', flexDirection: 'column', 
                    flex: inboundExpanded ? 1 : 0, 
                    minHeight: '48px',
                    transition: 'flex 0.3s ease',
                    overflow: 'hidden'
                }}>
                    <ListItem 
                        button 
                        onClick={() => setInboundExpanded(!inboundExpanded)} 
                        sx={{ 
                            bgcolor: alpha(inboundColor, 0.15), 
                            py: 0.5, px: 1.5, height: '48px', flexShrink: 0 
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                            <ArrowDownward sx={{ fontSize: 16, color: inboundColor }} />
                            <ListItemText 
                                primary="INBOUND" 
                                secondary={`${inbound.length} active`} 
                                primaryTypographyProps={{ variant: 'subtitle2', color: inboundColor, fontWeight: 700, fontSize: '0.8rem' }} 
                                secondaryTypographyProps={{ variant: 'caption', color: alpha(inboundColor, 0.7) }} 
                                sx={{ my: 0 }} 
                            />
                        </Stack>
                        {inboundExpanded ? <ExpandLess sx={{ color: inboundColor }} /> : <ExpandMore sx={{ color: inboundColor }} />}
                    </ListItem>

                    {inboundExpanded && (
                        <Box sx={{ flex: 1, minHeight: 0, bgcolor: alpha(theme.palette.common.black, 0.05) }}>
                            {inbound.length > 0 ? (
                                <Virtuoso data={inbound} itemContent={renderInboundRow} style={{ height: '100%' }} />
                            ) : (
                                <Box sx={{ p: 3, textAlign: 'center', opacity: 0.5 }}>
                                    <Typography variant="caption">No active inbound contracts</Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>
        </Paper>
    );
};