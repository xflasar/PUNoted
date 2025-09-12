// src/App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import AppShell from './AppShell';
import LandingPage from './LandingPage/LandingPage';
import PrivacyPolicy from './PrivacyPolicy/PrivacyPolicy';
import DashboardPage from './Dashboard/DashboardPage';
import CosmPage from './COSM/CosmPage';
import ApiStatus from './components/common/ApiStatus';
import './App.css';
import CorpPricesTab from './COSM/PriceList/CorpPricesTab';
import { getApiStatus } from './components/common/ApiStatusService';

const isTokenValid = () => {
  const token = localStorage.getItem('authToken');
  const expiresAt = localStorage.getItem('expiresAt');
  if (!token || !expiresAt) {
    return false;
  }
  const currentTime = Math.floor(Date.now() / 1000);
  return parseInt(expiresAt, 10) > currentTime;
};


const ProtectedRoute = ({ isLoggedIn }: {isLoggedIn: boolean}) => {
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const ProtectedLayout = () => {
  return (
    <AppShell>
    </AppShell>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('online');
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      const status = await getApiStatus();
      setApiStatus(status);
    };
    checkStatus();

    const intervalId = setInterval(checkStatus, 30000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isTokenValid()) {
      setIsLoggedIn(true);
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('expiresAt');
      localStorage.removeItem('username');
      setIsLoggedIn(false);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate(0);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('expiresAt');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <Box sx={{ maxHeight: '100%', width: '100%' }}>
      <Routes>
        <Route
          path="/"
          element={<LandingPage onLoginSuccess={handleLoginSuccess} isLoggedIn={isLoggedIn}  onLogout={handleLogout}/>}
        />

        <Route path="/privacy" element={<PrivacyPolicy />} />

        <Route path="/cosm" element={<CosmPage isLoggedIn={isLoggedIn} />}>
          <Route path="corp-prices" element={<CorpPricesTab/>}/>
        </Route>

        <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
          <Route path="/app" element={<ProtectedLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="market" element={<div>Market Page</div>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ApiStatus apiStatus={apiStatus} />
    </Box>
  );
}

export default App;
