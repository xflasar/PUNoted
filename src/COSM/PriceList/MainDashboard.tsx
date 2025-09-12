import { Box, Tabs, Tab, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PriceListTab from './PriceList';
import CorpPricesTab from './CorpPricesTab';
import { useSearchParams } from 'react-router-dom';

const MainDashboard = ({isLoggedIn}: {isLoggedIn: boolean}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams, setSearchParams] = useSearchParams();

  const subtabValue = searchParams.get('subtab') || 'market-prices';

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSearchParams({ tab: 'priceList', subtab: newValue });
  };

  return (
    <Box id='box' sx={{
      width: '100%',
      height: '100%',
      maxHeight: '100%',
      color: 'white',
      boxSizing: 'border-box'
    }}>
      <Box sx={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <Box sx={{ flexGrow: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={subtabValue}
            onChange={handleChange}
            aria-label="market data tabs"
            textColor="inherit"
            indicatorColor="primary"
            variant={isMobile ? 'scrollable' : 'fullWidth'}
            scrollButtons="auto"
            centered
            sx={{
              '& .MuiTabs-indicator': {
                height: '3px',
                borderRadius: '2px',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.6)',
                '&.Mui-selected': {
                  color: 'white',
                },
              },
              justifyContent: 'center',
            }}
          >
            <Tab label="Market Prices" value="market-prices" />
            <Tab label="CORP Prices" value="corp-prices"  /> {/*disabled={!isLoggedIn}*/}
          </Tabs>
        </Box>
        {
          subtabValue === 'market-prices' && <PriceListTab isLoggedIn={isLoggedIn} />
        }
        {
          subtabValue === 'corp-prices' && <CorpPricesTab />
        }
      </Box>
    </Box>
  );
};

export default MainDashboard;