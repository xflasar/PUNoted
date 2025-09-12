import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  List,
  ListItem,
  Divider,
  useTheme,
  Paper,
  //useMediaQuery,
  keyframes,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Search, PlusCircle, CheckCircle } from 'lucide-react';

interface VendorItem {
  companyName: string;
  username: string;
  companyCode: string;
  active: boolean;
  products: number;
  categories: number;
  buyList: {
    material: string;
    ticker: string;
    price: string;
    quantity: number;
  }[];
  sellList: {
    material: string;
    ticker: string;
    price: string;
    quantity: number;
  }[];
}

const mockVendors: VendorItem[] = [
  {
    companyName: 'Nova Supply Corp - A Very Long Company Name That Might Overflow And Needs Scrolling',
    username: 'NovaTrader',
    companyCode: 'NSC-001',
    active: true,
    products: 15,
    categories: 5,
    buyList: [
      { material: 'Steel Ingots', ticker: 'STLI', price: 'Negotiable (5000000 ICA)', quantity: 1500 },
      { material: 'Copper Wire', ticker: 'COP', price: '50.25 ICA', quantity: 200 },
      { material: 'Hydrocarbon Plant', ticker: 'HYD', price: '$176.39', quantity: 10 },
    ],
    sellList: [
      { material: 'Titanium Plates', ticker: 'TPL', price: '$250.75', quantity: 50 },
      { material: 'Carbon Fiber', ticker: 'CARF', price: '$1200.00', quantity: 5 },
      { material: 'Aluminium Sheets', ticker: 'ALUS', price: '$150.00', quantity: 500 },
      { material: 'Steel Cables', ticker: 'STLC', price: '$85.00', quantity: 700 },
    ],
  },
  {
    companyName: 'Aero Dynamics Inc. - Global Aerospace Solutions Provider',
    username: 'AeroParts',
    companyCode: 'ADI-005',
    active: false,
    products: 8,
    categories: 3,
    buyList: [
      { material: 'Polymers', ticker: 'POL', price: 'Range: $20-30', quantity: 5000 },
      { material: 'Alloys', ticker: 'ALL', price: '$150.00', quantity: 250 },
    ],
    sellList: [
      { material: 'Rocket Fuel', ticker: 'ROCKF', price: 'Negotiable', quantity: 100 },
      { material: 'Flavored Meal', ticker: 'FLA', price: '$1,273.12', quantity: 50 },
      { material: 'Sensor Arrays', ticker: 'SENS', price: '$5000.00', quantity: 10 },
      { material: 'Navigation Systems', ticker: 'NAVS', price: '$9500.00', quantity: 3 },
      { material: 'Fuel Injectors', ticker: 'FINJ', price: '$350.00', quantity: 25 },
      { material: 'Rare Earth Elements', ticker: 'REE', price: 'Negotiable', quantity: 50 },
      { material: 'Microchips', ticker: 'MIC', price: '$15.00', quantity: 10000 },
    ],
  },
  {
    companyName: 'Quantum Tech Solutions',
    username: 'QuantumTrader',
    companyCode: 'QTS-012',
    active: true,
    products: 25,
    categories: 8,
    buyList: [
      { material: 'Rare Earth Elements', ticker: 'REE', price: 'Negotiable', quantity: 50 },
      { material: 'Microchips', ticker: 'MIC', price: '$15.00', quantity: 10000 },
    ],
    sellList: [
      { material: 'Circuit Boards', ticker: 'CB', price: '$50.00', quantity: 500 },
      { material: 'Nutrient Solution', ticker: 'NTS', price: '$221.52', quantity: 100 },
    ],
  },
  {
    companyName: 'Global Commodities Hub - International Trading & Logistics',
    username: 'CommodityKing',
    companyCode: 'GCH-022',
    active: true,
    products: 12,
    categories: 4,
    buyList: [
      { material: 'Crude Oil', ticker: 'CRO', price: '$80.00', quantity: 50000 },
      { material: 'Iron Ore', ticker: 'IRON', price: '$120.00', quantity: 10000 },
      { material: 'Natural Gas', ticker: 'NG', price: '$5.00', quantity: 20000 },
    ],
    sellList: [
      { material: 'Wheat', ticker: 'WHT', price: 'Negotiable', quantity: 5000 },
    ],
  },
  {
    companyName: 'Global Commodities Hub',
    username: 'CommodityKing',
    companyCode: 'GCH-022',
    active: true,
    products: 12,
    categories: 4,
    buyList: [
      { material: 'Crude Oil', ticker: 'CRO', price: '$80.00', quantity: 50000 },
      { material: 'Iron Ore', ticker: 'IRON', price: '$120.00', quantity: 10000 },
      { material: 'Natural Gas', ticker: 'NG', price: '$5.00', quantity: 20000 },
    ],
    sellList: [
      { material: 'Wheat', ticker: 'WHT', price: 'Negotiable', quantity: 5000 },
    ],
  },
  {
    companyName: 'Global Commodities Hub',
    username: 'CommodityKing',
    companyCode: 'GCH-022',
    active: true,
    products: 12,
    categories: 4,
    buyList: [
      { material: 'Crude Oil', ticker: 'CRO', price: '$80.00', quantity: 50000 },
      { material: 'Iron Ore', ticker: 'IRON', price: '$120.00', quantity: 10000 },
      { material: 'Natural Gas', ticker: 'NG', price: '$5.00', quantity: 20000 },
    ],
    sellList: [
      { material: 'Wheat', ticker: 'WHT', price: 'Negotiable', quantity: 5000 },
    ],
  },
  {
    companyName: 'Global Commodities Hub',
    username: 'CommodityKing',
    companyCode: 'GCH-022',
    active: true,
    products: 12,
    categories: 4,
    buyList: [
      { material: 'Crude Oil', ticker: 'CRO', price: '$80.00', quantity: 50000 },
      { material: 'Iron Ore', ticker: 'IRON', price: '$120.00', quantity: 10000 },
      { material: 'Natural Gas', ticker: 'NG', price: '$5.00', quantity: 20000 },
    ],
    sellList: [
      { material: 'Wheat', ticker: 'WHT', price: 'Negotiable', quantity: 5000 },
    ],
  },
  {
    companyName: 'Global Commodities Hub',
    username: 'CommodityKing',
    companyCode: 'GCH-022',
    active: true,
    products: 12,
    categories: 4,
    buyList: [
      { material: 'Crude Oil', ticker: 'CRO', price: '$80.00', quantity: 50000 },
      { material: 'Iron Ore', ticker: 'IRON', price: '$120.00', quantity: 10000 },
      { material: 'Natural Gas', ticker: 'NG', price: '$5.00', quantity: 20000 },
    ],
    sellList: [
      { material: 'Wheat', ticker: 'WHT', price: 'Negotiable', quantity: 5000 },
    ],
  },
  {
    companyName: 'Global Commodities Hub',
    username: 'CommodityKing',
    companyCode: 'GCH-022',
    active: true,
    products: 12,
    categories: 4,
    buyList: [
      { material: 'Crude Oil', ticker: 'CRO', price: '$80.00', quantity: 50000 },
      { material: 'Iron Ore', ticker: 'IRON', price: '$120.00', quantity: 10000 },
      { material: 'Natural Gas', ticker: 'NG', price: '$5.00', quantity: 20000 },
    ],
    sellList: [
      { material: 'Wheat', ticker: 'WHT', price: 'Negotiable', quantity: 5000 },
    ],
  },
  {
    companyName: 'Global Commodities Hub',
    username: 'CommodityKing',
    companyCode: 'GCH-022',
    active: true,
    products: 12,
    categories: 4,
    buyList: [
      { material: 'Crude Oil', ticker: 'CRO', price: '$80.00', quantity: 50000 },
      { material: 'Iron Ore', ticker: 'IRON', price: '$120.00', quantity: 10000 },
      { material: 'Natural Gas', ticker: 'NG', price: '$5.00', quantity: 20000 },
    ],
    sellList: [
      { material: 'Wheat', ticker: 'WHT', price: 'Negotiable', quantity: 5000 },
    ],
  },
];

const scroll = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-100%); }
  75% { transform: translateX(-100%); }
  100% { transform: translateX(0); }
`;

const ScrollingText: React.FC<{ text: string; variant: any; sx?: any }> = ({ text, variant, sx }) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        setOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  return (
    <Box sx={{
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      display: 'inline-block',
      maxWidth: '100%',
      verticalAlign: 'middle',
    }}>
      <Typography
        ref={textRef}
        variant={variant}
        component="div"
        sx={{
          ...sx,
          display: 'inline-block',
          whiteSpace: 'nowrap',
          pr: overflowing ? '16px' : 0,
          animation: overflowing ? `${scroll} 10s linear infinite alternate` : 'none',
        }}
      >
        {text}
      </Typography>
    </Box>
  );
};


const VendorsList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [hasVendorStore, setHasVendorStore] = useState<boolean | null>(null);
  const [isCheckingStore, setIsCheckingStore] = useState<boolean>(true);
  const [isCreatingStore, setIsCreatingStore] = useState<boolean>(false);
  const [vendorData, setVendorData] = useState({
    company_name: '',
    game_name: '',
    company_code: '',
    corp_name: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const theme = useTheme();
  //const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const checkVendorStore = async () => {
      try {
        // Assume you have an endpoint like this.
        const response = await fetch('https://punoted.ddns.net/dev/api/user_vendor_store');
        if (response.ok) {
          const data = await response.json();
          setHasVendorStore(data.success);
        } else {
          setHasVendorStore(false);
        }
      } catch (error) {
        setHasVendorStore(false);
        console.error("Failed to check for vendor store:", error);
      } finally {
        setIsCheckingStore(false);
      }
    };

    checkVendorStore();
  }, []);

  const handleOpenModal = () => {
    setFormError(null);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);

  const handleCreateVendorStore = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCreatingStore(true);
    setFormError(null);

    if (!vendorData.company_name) {
      setFormError("Company name is required.");
      setIsCreatingStore(false);
      return;
    }

    try {
      const response = await fetch('dev/api/create_vendor_store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor: vendorData, orders: [] }),
      });

      const data = await response.json();
      if (response.ok) {
        setHasVendorStore(true);
        handleCloseModal();
      } else {
        setFormError(data.message || "An unexpected error occurred.");
      }
    } catch (error) {
      setFormError("Failed to connect to the server.");
      console.error("Vendor creation failed:", error);
    } finally {
      setIsCreatingStore(false);
    }
  };

  const filteredVendors = useMemo(() => {
    if (!searchQuery) {
      return mockVendors;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return mockVendors.filter(
      (vendor) =>
        vendor.companyName.toLowerCase().includes(lowerCaseQuery) ||
        vendor.username.toLowerCase().includes(lowerCaseQuery) ||
        vendor.companyCode.toLowerCase().includes(lowerCaseQuery) ||
        vendor.buyList.find((buy) => buy.ticker.toLowerCase().includes(lowerCaseQuery)) !== undefined ||
        vendor.sellList.find((sell) => sell.ticker.toLowerCase().includes(lowerCaseQuery)) !== undefined
    );
  }, [searchQuery]);

  const renderProductList = (list: { material: string; ticker: string; price: string; quantity: number }[], title: string) => (
    <Box sx={{ my: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="body2" sx={{ mb: 1, color: theme.palette.primary.light, fontWeight: 'bold', textAlign: 'center' }}>
        {title.toUpperCase()}
      </Typography>
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {list.length > 0 ? (
          <List dense disablePadding sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {list.map((item, index) => (
              <ListItem
                key={index}
                sx={{
                  py: 0.5,
                  px: 0,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {item.ticker}
                </Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Qty: {item.quantity}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                    {item.price}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.6)' }}>
            No items listed.
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{
      boxSizing: 'border-box',
      width: '95%',
      margin: '0 auto',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Paper sx={{ width: '100%' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by Company Name, Code, Username or Material Ticker"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover fieldset': { borderColor: theme.palette.primary.main },
                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '2px' },
                color: 'white',
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.7)',
                opacity: 1,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search style={{ color: 'rgba(123, 104, 238, 1)' }} />
                </InputAdornment>
              ),
            }}
          />
        </Paper>
        <Paper>
          <Box sx={{ textAlign: 'center' }}>
            {isCheckingStore ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <Typography>Checking for your vendor store...</Typography>
              </Box>
            ) : hasVendorStore ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.success.main, gap: 1 }}>
                <CheckCircle />
                <Typography>You already have a vendor store.</Typography>
              </Box>
            ) : (
              <Button
                variant="contained"
                onClick={handleOpenModal}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  },
                }}
                startIcon={<PlusCircle />}
              >
                Create New Vendor Store
              </Button>
            )}
          </Box>
        </Paper>
      </Grid>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: '20px',
          overflowX: 'visible',
        }}
      >
        {filteredVendors.length > 0 ? (
          <Grid container
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: theme.spacing(4),
              margin: 0,
              width: '100%',
              padding: '20px 0 60px 0',
              alignItems: 'stretch',
            }}
          >
            {filteredVendors.map((vendor) => (
              <Paper key={vendor.companyCode}
                sx={{
                  flexGrow: 1,
                  flexBasis: 'min(350px, 100%)',
                  maxWidth: 'calc(50% - 16px)',
                  [theme.breakpoints.down('sm')]: {
                    maxWidth: '100%',
                  },
                  overflow: 'visible',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Card sx={{
                  background: 'linear-gradient(135deg, rgba(20, 20, 50, 0.8), rgba(10, 10, 30, 0.8))',
                  color: 'white',
                  borderRadius: '16px',
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 0 16px rgba(123, 104, 238, 0.8)',
                    zIndex: 10,
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <ScrollingText
                        text={vendor.companyName}
                        variant="h5"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Username: {vendor.username}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Code: {vendor.companyCode}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2, bgcolor: theme.palette.primary.main, height: '2px' }} />

                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Grid container spacing={2} sx={{ flexGrow: 1, width: '100%' }}>
                        <Paper  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
                          {renderProductList(vendor.buyList, 'Buying')}
                        </Paper>
                        <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
                          {renderProductList(vendor.sellList, 'Selling')}
                        </Paper>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Paper>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4, flexGrow: 1, overflowY: 'auto'}}>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              No vendors found matching your search.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Vendor Creation Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal}>
        <DialogTitle sx={{ bgcolor: theme.palette.grey[900], color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlusCircle />
            Create Vendor Store
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.palette.grey[900], color: 'white', py: 2 }}>
          <form onSubmit={handleCreateVendorStore}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Paper>
                <TextField
                  fullWidth
                  required
                  label="Company Name"
                  name="company_name"
                  value={vendorData.company_name}
                  onChange={(e) => setVendorData({ ...vendorData, company_name: e.target.value })}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  }}
                />
              </Paper>
              <Paper>
                <TextField
                  fullWidth
                  label="Game Name (Optional)"
                  name="game_name"
                  value={vendorData.game_name}
                  onChange={(e) => setVendorData({ ...vendorData, game_name: e.target.value })}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  }}
                />
              </Paper>
              <Paper>
                <TextField
                  fullWidth
                  label="Company Code (Optional)"
                  name="company_code"
                  value={vendorData.company_code}
                  onChange={(e) => setVendorData({ ...vendorData, company_code: e.target.value })}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  }}
                />
              </Paper>
              <Paper>
                <TextField
                  fullWidth
                  label="Corp Name (Optional)"
                  name="corp_name"
                  value={vendorData.corp_name}
                  onChange={(e) => setVendorData({ ...vendorData, corp_name: e.target.value })}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  }}
                />
              </Paper>
            </Grid>
            {formError && (
              <Box sx={{ color: theme.palette.error.main, mt: 2, textAlign: 'center' }}>
                <Typography variant="body2">{formError}</Typography>
              </Box>
            )}
            <DialogActions sx={{ bgcolor: theme.palette.grey[900], mt: 2, justifyContent: 'center' }}>
              <Button onClick={handleCloseModal} disabled={isCreatingStore} color="inherit" sx={{ color: 'white' }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isCreatingStore}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  '&:hover': { bgcolor: theme.palette.primary.dark },
                }}
              >
                {isCreatingStore ? <CircularProgress size={24} color="inherit" /> : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default VendorsList;