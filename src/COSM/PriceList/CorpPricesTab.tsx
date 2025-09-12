import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Grid,
  InputAdornment,
  TableSortLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MaterialViewSwitch from './CustomComponents/SwitchTableGrid';

interface MaterialData {
  ticker: string;
  price: number;
}

interface CartItem {
  ticker: string;
  price: number;
  quantity: number;
  id: number;
}

const MaterialCalculator: React.FC = () => {
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('shoppingCart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
      return [];
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [orderBy, setOrderBy] = useState<keyof MaterialData>('ticker');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const theme = useTheme();

  useEffect(() => {
    try {
      localStorage.setItem('shoppingCart', JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cart]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const cachedData = localStorage.getItem('corpPricesData');
      const cachedTimestamp = localStorage.getItem('corpPricesTimestamp');
      const now = new Date().getTime();
      const cacheDuration = 30 * 60 * 1000;

      if (cachedData && cachedTimestamp && (now - parseInt(cachedTimestamp, 10)) < cacheDuration) {
        setMaterials(JSON.parse(cachedData));
        setLoading(false);
      } else {
        try {
          const response = await fetch('https://punoted.ddns.net/dev/api/corp_prices_all');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            setMaterials(result.data);
            localStorage.setItem('corpPricesData', JSON.stringify(result.data));
            localStorage.setItem('corpPricesTimestamp', now.toString());
          } else {
            setError('Invalid data format received from the server.');
          }
        } catch (e) {
          setError('Failed to fetch data. Please check the server status.');
          console.error('Fetching error:', e);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, []);

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: 'table' | 'grid' | null,
  ) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  const handleAddItem = (ticker: string, price: number) => {
    const existingItem = cart.find(item => item.ticker === ticker);
    if (existingItem) {
      setCart(prevCart =>
        prevCart.map(item =>
          item.ticker === ticker ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      const newItem: CartItem = {
        ticker,
        price,
        quantity: 1,
        id: Date.now(),
      };
      setCart(prevCart => [...prevCart, newItem]);
    }
  };

  const handleRemoveItem = (id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const handleQuantityChange = (id: number, newQuantity: string) => {
    const quantityValue = parseInt(newQuantity, 10);
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, quantity: quantityValue >= 0 ? quantityValue : 0 } : item
      )
    );
  };

  const handleSort = (property: keyof MaterialData) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredAndSortedMaterials = useMemo(() => {
    const searchTerms = searchTerm
      .toLowerCase()
      .split(',')
      .map(term => term.trim())
      .filter(term => term.length > 0);

    if (searchTerms.length === 0) {
      return materials;
    }
    
    const filtered = materials.filter(item => {
      return searchTerms.some(term => item.ticker.toLowerCase().startsWith(term));
    });

    const sorted = filtered.sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [materials, searchTerm, orderBy, order]);

  const totalCost = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'transparent' }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', maxHeight: '100%', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 0 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'row',
      gap: 2,
      bgcolor: 'transparent',
      color: theme.palette.primary.main,
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* Shopping Cart Section */}
      <Box sx={{
        bgcolor: 'transparent',
        color: theme.palette.primary.main,
        borderRadius: '12px',
        width: '50%',
        p: 0,
        mb: 1,
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        height: '100%',
      }}>
        <Typography variant="h4" component="h1" align="center" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, mb: 2 }}>
          Your Shopping Cart
        </Typography>
        {cart.length > 0 ? (
          <>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', backgroundColor: 'transparent', mb: 2 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: 'transparent', color: theme.palette.primary.main, fontWeight: 'bold', textAlign: 'center' }}>Ticker</TableCell>
                      <TableCell sx={{ bgcolor: 'transparent', color: theme.palette.primary.main, fontWeight: 'bold', textAlign: 'center' }}>Price</TableCell>
                      <TableCell sx={{ bgcolor: 'transparent', color: theme.palette.primary.main, fontWeight: 'bold', textAlign: 'center' }}>Quantity</TableCell>
                      <TableCell sx={{ bgcolor: 'transparent', color: theme.palette.primary.main, fontWeight: 'bold', textAlign: 'center' }}>Total</TableCell>
                      <TableCell sx={{ bgcolor: 'transparent', color: theme.palette.primary.main, fontWeight: 'bold', textAlign: 'center' }}>Remove</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map(item => (
                      <TableRow key={item.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: theme.palette.primary.dark }}}>
                        <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 'semibold', textAlign: 'center' }}>{item.ticker}</TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 'medium', textAlign: 'center' }}>{item.price.toLocaleString()} ICA</TableCell>
                        <TableCell align='center'>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            size="small"
                            variant="outlined"
                            sx={{
                              width: 100,
                              '& .MuiInputBase-input': { color: theme.palette.text.primary, textAlign: 'center' },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                              bgcolor: 'transparent',
                            }}
                            inputProps={{ min: 0 }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 'bold', textAlign: 'center' }}>{(item.quantity * item.price).toLocaleString()} ICA</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleRemoveItem(item.id)} sx={{ color: theme.palette.error.main }}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            <Box sx={{ mt: 'auto', pt: 2, borderTop: `2px solid ${theme.palette.grey[700]}`, textAlign: 'right' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                Total Cost: {totalCost.toLocaleString()} ICA
              </Typography>
            </Box>
          </>
        ) : (
          <Typography align="center" sx={{ color: theme.palette.grey[400], py: 4 }}>Your cart is empty. Start adding materials below!</Typography>
        )}
      </Box>

      {/* Available Materials Section */}
      <Box sx={{
        bgcolor: 'transparent',
        color: theme.palette.common.white,
        width: '100%',
        p: 0,
        pb: 1,
        mt: 1,
        flexGrow: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Search Bar and Switch (Fixed Height Header) */}
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, mb: 2, flexShrink: 0 }}>
          <TextField
            label="Search by Tickers (''BBH, SAR, E'' , ''BBH'' etc)"
            variant="outlined"
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
            sx={{
              flexGrow: 1,
              '& .MuiOutlinedInput-root': { color: 'white', borderRadius: '24px', pr: '24px' },
              '& .MuiInputLabel-root': { color: theme.palette.text.primary },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.primary.main }} />
                </InputAdornment>
              ),
            }}
          />
          <MaterialViewSwitch view={view} onChange={handleViewChange} />
        </Box>
        
        {/* Scrollable Content Area */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto'}}>
          {view === 'table' ? (
            <TableContainer sx={{ height: '100%' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: 'rgba(40, 40, 80, 1)', color: 'white', cursor: 'pointer' }}>
                      <TableSortLabel
                        active={orderBy === 'ticker'}
                        direction={orderBy === 'ticker' ? order : 'asc'}
                        onClick={() => handleSort('ticker')}
                        sx={{ '& .MuiTableSortLabel-icon': { color: 'white !important' }, color: 'white' }}
                      >
                        Ticker
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(40, 40, 80, 1)', color: 'white', cursor: 'pointer' }}>
                      <TableSortLabel
                        active={orderBy === 'price'}
                        direction={orderBy === 'price' ? order : 'asc'}
                        onClick={() => handleSort('price')}
                        sx={{ '& .MuiTableSortLabel-icon': { color: 'white !important' }, color: 'white' }}
                      >
                        Price
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(40, 40, 80, 1)', color: 'white', width: '50px' }}>Add</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedMaterials.map((row) => (
                    <TableRow key={row.ticker}>
                      <TableCell sx={{ color: 'white' }}>
                        {row.ticker}
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>{row.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleAddItem(row.ticker, row.price)}>
                          <AddIcon sx={{ color: 'lightgreen' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (

            
            <Grid container spacing={2}>
              {filteredAndSortedMaterials.map(material => (
                <Grid size={{ xs: 6, md: 4, lg: 2 }} key={material.ticker}>
                  <Paper sx={{ p: 2, background: theme.palette.background.paper, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'semibold', color: theme.palette.common.white }}>{material.ticker}</Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.primary.main }}>{material.price.toLocaleString()} ICA</Typography>
                    </Box>
                    <IconButton onClick={() => handleAddItem(material.ticker, material.price)} sx={{ color: theme.palette.success.main }}>
                      <AddIcon />
                    </IconButton>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MaterialCalculator;