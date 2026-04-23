import React, { useEffect, useState, useCallback } from 'react';
import { 
    Box, Table, TableBody, TableCell, TableHead, TableRow, 
    InputBase, IconButton, Typography, Chip, alpha, useTheme 
} from '@mui/material';
import { Add, Delete, Refresh, CheckCircle, Edit } from '@mui/icons-material';
import { WatcherItem } from '../types';
import { formatCompactNumber } from '../helpers/formatNumber';
import { getBulkPrices } from '../api';
import { format } from 'date-fns';

const smartFormat = (num: number) => {
    if (num === 0 || !num) return '0';
    if (Math.abs(num) >= 1000000 || (Math.abs(num) < 0.01 && Math.abs(num) > 0)) {
        return formatCompactNumber(num);
    }
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export const PriceWatcher = ({ exchange }: { exchange: string }) => {
    const theme = useTheme();
    const [watchers, setWatchers] = useState<WatcherItem[]>(() => {
        try { return JSON.parse(localStorage.getItem('cx_price_watchers') || '[]'); } catch { return []; }
    });
    const [newTicker, setNewTicker] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => { localStorage.setItem('cx_price_watchers', JSON.stringify(watchers)); }, [watchers]);
    
    useEffect(() => { 
        if (Notification.permission !== 'granted') Notification.requestPermission(); 
    }, []);

    const checkPrices = useCallback(async () => {
        if (watchers.length === 0) return;
        const tickers = Array.from(new Set(watchers.map(w => w.ticker)));
        const prices = await getBulkPrices(tickers, exchange);
        
        setWatchers(prev => prev.map(w => {
            const pData = prices.find(p => p.ticker === w.ticker);
            if (!pData) return w;
            const currentPrice = pData.ask; 
            const triggered = currentPrice > 0 && currentPrice <= w.targetPrice;
            
            if (triggered && !w.triggered && Notification.permission === 'granted') {
                new Notification(`CX Alert: ${w.ticker}`, { 
                    body: `Buy Opportunity! Price ${currentPrice} reached target ${w.targetPrice}.`,
                    icon: '/favicon.ico'
                });
            }
            return { ...w, lastPrice: currentPrice, triggered };
        }));
        setLastUpdated(new Date());
    }, [watchers.length, exchange]); 

    useEffect(() => {
        checkPrices();
        const interval = setInterval(checkPrices, 300000); 
        return () => clearInterval(interval);
    }, [checkPrices]);

    const handleAdd = () => {
        if (!newTicker || !newPrice) return;
        const newItem: WatcherItem = {
            id: Date.now().toString(),
            ticker: newTicker.toUpperCase(),
            targetPrice: parseFloat(newPrice),
            type: 'BUY',
            triggered: false
        };
        setWatchers([...watchers, newItem]);
        setNewTicker('');
        setNewPrice('');
        setTimeout(checkPrices, 500); 
    };

    const handleDelete = (id: string) => {
        setWatchers(prev => prev.filter(w => w.id !== id));
    };

    const startEdit = (w: WatcherItem) => {
        setEditingId(w.id);
        setEditValue(w.targetPrice.toString());
    };

    const saveEdit = (id: string) => {
        const val = parseFloat(editValue);
        if (!isNaN(val)) {
            // Update target AND immediately recalculate trigger status based on known lastPrice
            setWatchers(prev => prev.map(w => {
                if (w.id === id) {
                    const newTriggered = w.lastPrice ? (w.lastPrice > 0 && w.lastPrice <= val) : false;
                    return { ...w, targetPrice: val, triggered: newTriggered };
                }
                return w;
            }));
        }
        setEditingId(null);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Input Bar */}
            <Box sx={{ p: 0.5, display: 'flex', gap: 0.5, alignItems: 'center', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <InputBase 
                    placeholder="Ticker" 
                    value={newTicker} 
                    onChange={(e) => setNewTicker(e.target.value.toUpperCase())} 
                    sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), px: 1, borderRadius: 1, fontSize: '0.8rem', width: 70 }} 
                />
                <Chip 
                    label="BUY @" 
                    size="small" 
                    sx={{ borderRadius: 1, height: 28, fontSize: '0.75rem', fontWeight: 'bold', bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }} 
                />
                <InputBase 
                    placeholder="Target" 
                    type="number" 
                    value={newPrice} 
                    onChange={(e) => setNewPrice(e.target.value)} 
                    sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), px: 1, borderRadius: 1, fontSize: '0.8rem', flex: 1 }} 
                />
                <IconButton size="small" onClick={handleAdd} color="primary" sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, borderRadius: 1, p: 0.5 }}>
                    <Add fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={checkPrices} sx={{ p: 0.5 }}><Refresh fontSize="small" /></IconButton>
            </Box>

            {/* Watcher List */}
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <Table size="small" stickyHeader padding="none">
                    <TableHead>
                        <TableRow sx={{ '& th': { fontSize: '0.75rem', py: 0.75, bgcolor: alpha(theme.palette.background.default, 0.9) } }}>
                            <TableCell align="center">TICKER</TableCell>
                            <TableCell align="center">TARGET</TableCell>
                            <TableCell align="center">ASK</TableCell>
                            <TableCell align="right"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {watchers.length === 0 && (
                            <TableRow><TableCell colSpan={4} align="center" sx={{ color: 'text.disabled', py: 2, fontSize: '0.8rem' }}>No active watchers</TableCell></TableRow>
                        )}
                        {watchers.map(w => (
                            <TableRow key={w.id} sx={{ bgcolor: w.triggered ? alpha(theme.palette.success.main, 0.15) : 'transparent' }}>
                                <TableCell align="center">
                                    <Chip label={w.ticker} size="small" sx={{ height: 20, fontSize: '0.75rem', fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.light }} />
                                </TableCell>
                                
                                {/* Editable Target */}
                                <TableCell align="center" sx={{ fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => startEdit(w)}>
                                    {editingId === w.id ? (
                                        <InputBase 
                                            autoFocus
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={() => saveEdit(w.id)}
                                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(w.id)}
                                            sx={{ fontSize: '0.8rem', textAlign: 'center', width: 60, bgcolor: 'background.paper', px: 0.5, borderRadius: 0.5 }}
                                        />
                                    ) : (
                                        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                            ≤ {smartFormat(w.targetPrice)}
                                            <Edit sx={{ fontSize: 12, opacity: 0.3 }} />
                                        </Box>
                                    )}
                                </TableCell>

                                <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: w.triggered ? 'bold' : 'normal', color: w.triggered ? 'success.main' : 'text.secondary' }}>
                                    {w.triggered 
                                        ? <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}><CheckCircle fontSize="inherit"/>{smartFormat(w.lastPrice || 0)}</Box> 
                                        : smartFormat(w.lastPrice || 0)}
                                </TableCell>
                                <TableCell align="right" sx={{ pr: 1 }}>
                                    <IconButton size="small" onClick={() => handleDelete(w.id)} sx={{ p: 0.25 }}>
                                        <Delete fontSize="small" sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
            
            <Box sx={{ p: 0.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                    Last: {lastUpdated ? format(lastUpdated, 'HH:mm:ss') : 'Never'}
                </Typography>
            </Box>
        </Box>
    );
};