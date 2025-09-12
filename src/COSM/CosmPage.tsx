import React from 'react';
import {
  Typography, Box, Paper, Button, Tabs, Tab, Container, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/system';
import ProductionDashboard from './ShipProduction/ProductionDashboard';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import VendorsList from './Vendors/VendorList';
import { DollarSign, Rocket, Store, Truck } from 'lucide-react';
import MainDashboard from './PriceList/MainDashboard';
//import ShippingBoard from './Shipping/ShippingBoard';

const TabPanel = (props: any) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" style={{ height: '100%'}} hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ height: '100%'}}>{children}</Box>}
    </div>
  );
};

const VendorsTab = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  if (!isLoggedIn) {
    return <Typography sx={{ color: 'text.secondary', textAlign: 'center' }}>Please log in to view the vendors.</Typography>;
  }
  return (
    <VendorsList />
  );
};

const ShipProductionTab = ({ isMobile }: { isMobile: boolean }) => {
  return (
    <Container id='Container' sx={{ p: { xs: 0, sm: 2 }, minWidth: "100%", maxHeight: '100%', height: '100%'}}>
      <ProductionDashboard isMobile={isMobile}/>
    </Container>
  );
};

const CosmPage = ({ isLoggedIn = true }: { isLoggedIn?: boolean }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Get the current tab value from the URL or set a default
  const tabValue = searchParams.get('tab') || (isLoggedIn ? 'vendors' : 'production');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'homepage') {
      navigate('/');
    } else {
      setSearchParams({ tab: newValue });
    }
  };

  return (
    <Container
      sx={{
        width: '100vw',
        minWidth: '100%',
        height: '100vh',
        overflow: 'hidden',
        padding: 2,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}>
      {/* Back to landing page button - Desktop Only */}
      {!isMobile && (
        <Box sx={{ mb: { xs: 2, sm: 4 }, display: 'flex', position: 'absolute', justifyContent: 'flex-start' }}>
          <Button
            variant="outlined"
            startIcon={<FaArrowLeft style={{ color: '#7B68EE'}} />}
            onClick={() => navigate('/')}
            sx={{ color: 'white', borderColor: '#7B68EE', fontSize: { xs: '0.75rem', sm: '1rem' } }}
          >
            Back to Homepage
          </Button>
        </Box>
      )}
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{
        mb: { xs: 4, sm: 6 }, fontWeight: 'bold', letterSpacing: '0.05em',
        background: 'linear-gradient(90deg, #5D80F7, #7B68EE)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text', textFillColor: 'transparent',
        fontSize: { xs: '2rem', sm: '3rem' } // Responsive font size
      }}>
        COSM Corporation
      </Typography>
      <Paper square sx={{ bgcolor: 'rgba(25, 25, 50, 0.8)', border: 'none', boxShadow: 'none' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          textColor="primary"
          indicatorColor="primary"
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons="auto"
          aria-label="cosm page tabs"
        >
          {/* Back to Homepage tab - Mobile Only */}
          {isMobile && <Tab label="Homepage" icon={<FaArrowLeft />} value="homepage" />}
          {isLoggedIn && <Tab label="Vendors" icon={<Store />} iconPosition="start" value="vendors" />}
          <Tab label="Price List" icon={<DollarSign />} iconPosition="start" value="priceList" />
          <Tab label="Shipping" icon={<Truck />} iconPosition="start" value="shipping" />
          <Tab label="Ship Production" icon={<Rocket />} iconPosition="start" value="production" />
        </Tabs>
      </Paper>
      <Box id="Table" sx={{ flexGrow: 1, background: 'rgba(123, 104, 238, 0.03)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(5px)', p: 2, overflowY: 'hidden' }}>
        <TabPanel value={tabValue} index="vendors">
          <VendorsTab isLoggedIn={isLoggedIn} />
        </TabPanel>
        <TabPanel value={tabValue} index="priceList">
          <MainDashboard isLoggedIn={isLoggedIn} />
        </TabPanel>
        <TabPanel value={tabValue} index="production">
          <ShipProductionTab isMobile={isMobile} />
        </TabPanel>
        <TabPanel value={tabValue} index="shipping">
            <>
              <Typography>WIP</Typography>
            </>
        </TabPanel>
      </Box>
    </Container>
  );
};

export default CosmPage;