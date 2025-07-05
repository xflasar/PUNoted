// src/components/dashboard/MarketTable.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { MarketDataRow } from '@/lib/types';

export const MarketTable: React.FC = () => {
  const [data, setData] = useState<MarketDataRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [selectedExchange, setSelectedExchange] = useState<string>('All');
  const [uniqueExchanges, setUniqueExchanges] = useState<string[]>([]);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/fio/market');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch market data');
        }
        const result = await response.json();
        setData(result.data);
        setLastUpdated(result.lastUpdated);

        const exchanges = new Set<string>();
        result.data.forEach((row: MarketDataRow) => {
          exchanges.add(row.exchangeCode);
        });
        setUniqueExchanges(['All', ...Array.from(exchanges).sort()]);

      } catch (err: any) {
        console.error('Error fetching market data:', err);
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = useMemo(() => {
    if (selectedExchange === 'All') {
      return data;
    }
    return data.filter(row => row.exchangeCode === selectedExchange);
  }, [data, selectedExchange]);

  // Define table columns matching MarketDataRow
  const columns = useMemo(() => [
    { id: 'materialTicker', label: 'Ticker' },
    { id: 'materialName', label: 'Material' },
    { id: 'exchangeCode', label: 'Exchange' },
    { id: 'ask', label: 'Ask', format: (value: number | null) => (value !== null ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00') },
    { id: 'bid', label: 'Bid', format: (value: number | null) => (value !== null ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00') },
    { id: 'priceAverage', label: 'Avg Price', format: (value: number | null) => (value !== null ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00') },
    { id: 'supply', label: 'Supply', format: (value: number | null) => (value !== null ? value.toLocaleString() : '0') },
    { id: 'demand', label: 'Demand', format: (value: number | null) => (value !== null ? value.toLocaleString() : '0') },
    { id: 'mmBuy', label: 'MM Buy', format: (value: number | null) => (value !== null ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0') },
    { id: 'mmSell', label: 'MM Sell', format: (value: number | null) => (value !== null ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0') },
  ], []);


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'error.main' }}>
        <Typography variant="h6">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Market Data
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {lastUpdated && (
            <Typography variant="body2" color="text.secondary" suppressHydrationWarning>
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </Typography>
          )}
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="exchange-select-label">Exchange</InputLabel>
            <Select
              labelId="exchange-select-label"
              id="exchange-select"
              value={selectedExchange}
              label="Exchange"
              onChange={(e) => setSelectedExchange(e.target.value as string)}
            >
              {uniqueExchanges.map((exchange) => (
                <MenuItem key={exchange} value={exchange}>
                  {exchange}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="FIO Market Data Table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ textAlign: 'center' }}>
                  No market data available for the selected exchange.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <TableRow key={`${row.materialTicker}-${row.exchangeCode}`}>
                  {columns.map((column) => {
                    const value = row[column.id as keyof MarketDataRow];
                    return (
                      <TableCell key={column.id}>
                        {column.format ? column.format(value as any) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};