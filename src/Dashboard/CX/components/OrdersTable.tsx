import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, LinearProgress, Typography, Chip, useTheme, alpha, useMediaQuery } from '@mui/material';
import { CxOrder } from '../types';

export const ActiveOrdersTable = ({ orders }: { orders: CxOrder[] }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); 

    // --- 1. DESKTOP SPECIFIC COLUMNS---
    const tickerCol: GridColDef<CxOrder> = { 
        field: 'ticker', 
        headerName: 'TICKER', 
        flex: 0.8,
        headerAlign: 'center',
        align: 'center',
        renderCell: (p) => (
            <Box sx={{ 
                bgcolor: alpha(theme.palette.background.default, 0.5), 
                px: 1, py: 0.5, borderRadius: 1, 
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
            }}>
                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>{p.value}</Typography>
            </Box>
        ) 
    };

    const sideCol: GridColDef<CxOrder> = { 
        field: 'type', 
        headerName: 'SIDE', 
        flex: 0.8,
        headerAlign: 'center',
        align: 'center',
        renderCell: (p) => (
            <Chip 
                label={p.value === 'SELLING' ? 'SELL' : 'BUY'} 
                size="small" 
                sx={{ 
                    height: 20, 
                    width: 60,
                    fontSize: '0.65rem', 
                    fontWeight: 'bold',
                    bgcolor: p.value === 'SELLING' ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.error.main, 0.15),
                    color: p.value === 'SELLING' ? theme.palette.success.main : theme.palette.error.main,
                    border: '1px solid',
                    borderColor: p.value === 'SELLING' ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.error.main, 0.3)
                }}
            />
        )
    };

    const progressCol: GridColDef<CxOrder> = { 
        field: 'fill_percent', 
        headerName: 'PROGRESS', 
        flex: 1.5, 
        minWidth: 120,
        headerAlign: 'center',
        align: 'center',
        renderCell: (p) => (
            <Box sx={{ width: '90%', display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress 
                    variant="determinate" 
                    value={p.value} 
                    sx={{ 
                        flexGrow: 1, 
                        height: 6, 
                        borderRadius: 5,
                        bgcolor: alpha(theme.palette.grey[500], 0.2),
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            bgcolor: p.value >= 99 ? theme.palette.success.main : theme.palette.primary.main
                        }
                    }} 
                />
                <Typography variant="caption" sx={{ minWidth: 30, fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {Math.round(p.value)}%
                </Typography>
            </Box>
        )
    };

    // --- 2. MOBILE SPECIFIC COLUMNS (Compact UI) ---
    const mobileAssetCol: GridColDef<CxOrder> = {
        field: 'mobile_asset', 
        headerName: 'ASSET',
        flex: 0.9,
        headerAlign: 'center',
        align: 'center',
        renderCell: (p) => (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.75rem', lineHeight: 1 }}>
                    {p.row.ticker}
                </Typography>
                <Typography 
                    variant="caption" 
                    sx={{ 
                        fontSize: '0.6rem', 
                        fontWeight: 'bold', 
                        color: p.row.type === 'SELLING' ? theme.palette.success.main : theme.palette.error.main,
                        lineHeight: 1.2,
                        mt: 0.2
                    }}
                >
                    {p.row.type === 'SELLING' ? 'SELL' : 'BUY'}
                </Typography>
            </Box>
        )
    };

    // --- 3. SHARED COLUMNS ---
    const priceCol: GridColDef<CxOrder> = { 
        field: 'price', 
        headerName: isMobile ? 'PRICE' : 'PRICE (ICA)',
        flex: 1,
        minWidth: isMobile ? 70 : 100,
        headerAlign: 'center',
        align: 'center',
        type: 'number',
        renderCell: (p) => (
            <Typography variant="body2" sx={{ 
                fontSize: '0.8rem', 
                fontWeight: 'bold',
                fontFamily: 'monospace', 
                color: theme.palette.info.main 
            }}>
                {p.value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Typography>
        )
    };

    const amountCol: GridColDef<CxOrder> = {
        field: 'amount_info', 
        headerName: isMobile ? 'FILLED' : 'FILLED / TOTAL',
        flex: 1.2,
        minWidth: isMobile ? 80 : 120,
        headerAlign: 'center',
        align: 'center',
        valueGetter: (_, row) => `${row.filled_amount} / ${row.initial_amount}`,
        renderCell: (p) => (
            <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {p.value}
            </Typography>
        )
    };

    const columns = isMobile 
        ? [mobileAssetCol, priceCol, amountCol] 
        : [tickerCol, sideCol, priceCol, amountCol, progressCol];

    return (
        <Box sx={{ height: '100%', width: '100%' }}>
            <DataGrid
                rows={orders}
                columns={columns}
                getRowId={(row) => row.orderid}
                density="compact"
                hideFooter
                disableRowSelectionOnClick
                sx={{ 
                    border: 'none',
                    // Row Styling
                    '& .MuiDataGrid-row': {
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        },
                        display: 'flex',
                        alignItems: 'center'
                    },
                    '& .MuiDataGrid-cell': {
                        borderBottom: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: isMobile ? '0 2px' : '0 8px'
                    },
                    // Header Styling
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: theme.palette.background.default, 
                        color: theme.palette.primary.contrastText,
                        fontSize: isMobile ? '0.65rem' : '0.7rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: 'none',
                        minHeight: '40px !important',
                        maxHeight: '40px !important'
                    },
                    '& .MuiDataGrid-columnHeader': {
                        padding: isMobile ? '0 4px' : '0 10px',
                        '&:focus': { outline: 'none' },
                        '&:focus-within': { outline: 'none' },
                    },
                    '& .MuiDataGrid-columnSeparator': {
                        display: 'none',
                    },
                    '& .MuiDataGrid-virtualScroller': {
                        marginTop: '0 !important'
                    }
                }}
            />
        </Box>
    );
};