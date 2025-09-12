import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Search } from 'lucide-react';

interface MarketItem {
  [key: string]: string | number;
}

interface MarketPricesTabProps {
  isLoggedIn: boolean;
}

const allMarketCodes = ['AI1', 'IC1', 'CI1', 'CI2', 'NC1', 'NC2'];
const allColumnTypes = ['Average', 'AskAmt', 'AskPrice', 'AskAvail', 'BidAmt', 'BidPrice', 'BidAvail'];
const baseHeaders = ['ticker', 'last_update', 'mmbuy', 'mmsell'];

const MarketPricesTab: React.FC<MarketPricesTabProps> = () => {
  const [marketData, setMarketData] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  
  // New state variables for two-tiered selection
  const [selectedMarketCodes, setSelectedMarketCodes] = useState<string[]>(['AI1', 'IC1', 'CI1', 'CI2', 'NC1', 'NC2']);
  const [selectedColumnTypes, setSelectedColumnTypes] = useState<string[]>(['Average', 'AskPrice']);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://punoted.ddns.net/api/market_price_all');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const textData = await response.text();
      const parsedData = parseCsv(textData);
      setMarketData(parsedData);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      console.error("Failed to fetch market data:", e);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const parseCsv = (csv: string) => {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(header => header.trim());
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim());
      if (values.length === headers.length) {
        const obj: { [key: string]: string | number } = {};
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          let value: string | number = values[j];
          if(header === 'last_update') {
            value = values[j].substring(0,16);
          } else {
            value = isNaN(Number(value)) || value === '' ? value : Number(value);
          }
          obj[header] = value;
        }
        result.push(obj);
      }
    }
    return result;
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    fetchMarketData();
    const intervalId = setInterval(() => {
      fetchMarketData();
    }, 300000); // 5 minutes
    return () => clearInterval(intervalId);
  }, []);
  
  // Toggle market code selection
  const handleMarketCodeSelection = (code: string) => {
    setSelectedMarketCodes(prevSelected => {
      if (prevSelected.includes(code)) {
        return prevSelected.filter(item => item !== code);
      } else {
        return [...prevSelected, code];
      }
    });
  };

  // Toggle column type selection
  const handleColumnTypeSelection = (type: string) => {
    setSelectedColumnTypes(prevSelected => {
      if (prevSelected.includes(type)) {
        return prevSelected.filter(item => item !== type);
      } else {
        return [...prevSelected, type];
      }
    });
  };

  const filteredHeaders = useMemo(() => {
    const dynamicHeaders = selectedMarketCodes.flatMap(marketCode => 
      selectedColumnTypes.map(columnType => `${marketCode}-${columnType}`)
    );
    return [...baseHeaders, ...dynamicHeaders];
  }, [selectedMarketCodes, selectedColumnTypes]);

  const filteredData = useMemo(() => {
    return marketData
      .filter(row => {
        const tickerValue = row['ticker'] || row['TIC'];
        return typeof tickerValue === 'string' && tickerValue.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      })
      .map(row => {
        const newRow: MarketItem = {};
        for (const header of filteredHeaders) {
          if (row.hasOwnProperty(header)) {
            newRow[header] = row[header];
          }
        }
        return newRow;
      });
  }, [marketData, debouncedSearchQuery, filteredHeaders]);

  const formatValue = (header: string, value: string | number | undefined) => {
    if (value === undefined || value === null || value === '') {
      return '-';
    }
    if (typeof value === 'number' && (header.includes('Price') || header.includes('mmbuy') || header.includes('mmsell') || header.includes('Average') || header.includes('AskPrice') || header.includes('BidPrice'))) {
      return `${value.toLocaleString()} ICA`;
    }
    return value;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 1, sm: 3 }, minHeight: '100vh' }}>
        <Alert severity="error">
          Failed to load market data. Error: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Box sx={{
        borderRadius: '12px',
        overflow: 'hidden',
        color: 'white',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Box sx={{display: 'flex', flexDirection: 'column', p: { xs: 1, sm: 2 } }}>
          <Grid container alignItems="center" spacing={1}>
            <Box sx={{display: 'flex', flexDirection: 'row', width: '100%', flexWrap: 'wrap', justifyContent: 'space-around' }}>
              <Paper>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 0.5, textAlign: 'center' }}>Select Market Codes:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                    {allMarketCodes.map((code) => (
                      <Chip
                        key={code}
                        label={code}
                        onClick={() => handleMarketCodeSelection(code)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: selectedMarketCodes.includes(code) ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.1)',
                          color: selectedMarketCodes.includes(code) ? 'white' : 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            bgcolor: selectedMarketCodes.includes(code) ? theme.palette.primary.dark : 'rgba(255, 255, 255, 0.2)',
                          },
                        }}
                      />
                    ))}
                  </Box>
              </Paper>
            <Paper>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 0.5, textAlign: 'center' }}>Select Column Types:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {allColumnTypes.map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    onClick={() => handleColumnTypeSelection(type)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: selectedColumnTypes.includes(type) ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.1)',
                      color: selectedColumnTypes.includes(type) ? 'white' : 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        bgcolor: selectedColumnTypes.includes(type) ? theme.palette.primary.dark : 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  />
                ))}
              </Box>
            </Paper>
            </Box>
          </Grid>
        </Box>
        <Box sx={{display: 'flex', flexDirection: 'row', width: '100%', flexWrap: 'wrap', justifyContent: 'space-around' }}>
            <Paper>
              <TextField
                fullWidth
                label="Search by Ticker"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{minWidth: '100%',
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.7)' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                    color: 'white',
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiInputBase-input': { color: 'white' }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Paper>
            <Paper sx={{ display: 'flex',alignSelf: 'center', justifySelf: 'center'}}>
              {lastUpdated && (
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)'}}>
                  Last Updated: {lastUpdated.toLocaleTimeString()}
                </Typography>
              )}
          </Paper>
        </Box>
        
        {isSmallScreen ? (
          <Box sx={{ 
            p: 1,
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 250px)'
          }}>
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <Paper key={index} elevation={2} sx={{ 
                  p: 1.5,
                  mb: 1.5,
                  bgcolor: 'rgba(30, 30, 60, 0.9)',
                  color: 'white',
                  borderRadius: '8px'
                }}>
                  {filteredHeaders.map((header) => (
                    <Box key={header} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', py: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.7)' }}>{header.replace('-', ' ')}</Typography>
                      <Typography variant="body2">{formatValue(header, row[header])}</Typography>
                    </Box>
                  ))}
                </Paper>
              ))
            ) : (
              <Typography variant="body1" align="center" color="white" sx={{ mt: 2 }}>
                No results found.
              </Typography>
            )}
          </Box>
        ) : (
          <TableContainer sx={{ 
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 250px)',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.1)',
            },
          }}>
            <Table size="small" stickyHeader aria-label="sticky table" sx={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <TableHead>
                <TableRow>
                  {filteredHeaders.map((header) => (
                    <TableCell key={header} sx={{ 
                      bgcolor: 'rgba(30, 30, 60, 0.9)',
                      color: 'white',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                      '&:first-of-type': {
                        borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
                      }
                    }}>
                      {header.replace('-', ' ')}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <TableRow 
                      key={index} 
                      hover 
                      sx={{ 
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        },
                      }}
                    >
                      {filteredHeaders.map((header) => (
                        <TableCell 
                          key={header} 
                          sx={{ 
                            color: 'white', 
                            whiteSpace: 'nowrap', 
                            bgcolor: 'rgba(30, 30, 60, 0.9)',
                            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            '&:first-of-type': {
                              borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
                            },
                          }}
                        >
                          {formatValue(header, row[header])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell 
                      colSpan={filteredHeaders.length} 
                      align="center" 
                      sx={{ 
                        color: 'white',
                        bgcolor: 'rgba(30, 30, 60, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default MarketPricesTab;