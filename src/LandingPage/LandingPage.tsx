import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, Link, useMediaQuery, Snackbar, Alert } from '@mui/material';
import { styled, useTheme } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaUsers, FaChartLine } from 'react-icons/fa';
import AuthenticationBox from './AuthenticationBox.tsx';
import ApiStatus from '../components/common/ApiStatus.tsx';

interface LandingPageProps {
  onLoginSuccess: () => void;
  onLogout: () => void;
  isLoggedIn: boolean;
}

const BackgroundBox = styled(Box)(({ theme }) => ({
  width: '100vw',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  color: theme.palette.common.white,
  background: 'radial-gradient(at 50% 0%, rgba(20, 20, 40, 0.8) 0%, rgba(10, 10, 20, 0.9) 70%, rgba(0, 0, 0, 1) 100%)',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: -1,
  animation: 'none',
  backgroundSize: '100% 100%',
}));

const ContentBox = styled(Box)(({ theme }) => ({
  background: 'transparent',
  padding: theme.spacing(6),
  borderRadius: 16,
  boxShadow: '0 0 50px rgba(123, 104, 238, 0.3)',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  border: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 2,
  maxWidth: 600,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    borderRadius: 0,
    maxWidth: '100%',
    width: '100%',
    minHeight: '100vh',
    justifyContent: 'center',
    paddingTop: theme.spacing(8),
    paddingBottom: theme.spacing(8),
    boxShadow: 'none',
  },
}));

const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess, onLogout, isLoggedIn }) => {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (isLoggedIn) {
      setLoggedInUsername(localStorage.getItem('username'));
    } else {
      setLoggedInUsername(null);
    }
  }, [isLoggedIn]);

  const handleAuthButton = (type: 'cosm' | 'account' | 'dashboard') => {
    if (type === 'cosm') {
      navigate('/cosm');
    } else if (type === 'account') {
      setShowAuth(true);
    } else if (type === 'dashboard') {
      navigate('/'); // app/dashboard
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('sessionToken');
    onLogout();
    setSnackbar({
      open: true,
      message: 'Logged out successfully!',
      severity: 'success',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (showAuth) {
    return <AuthenticationBox onLoginSuccess={onLoginSuccess} onBackToLanding={() => setShowAuth(false)} />;
  }

  return (
    <BackgroundBox>
      <ContentBox>
        <Typography
          variant={isMobile ? 'h4' : 'h2'}
          component="h1"
          gutterBottom
          sx={{
            mb: 1.5,
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            lineHeight: 1.1,
            background: 'linear-gradient(90deg, #5D80F7, #7B68EE)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            [theme.breakpoints.down('sm')]: {
              fontSize: '2rem',
              mt: 0,
              textAlign: 'center',
            },
          }}
        >
          PUNOTED
        </Typography>

        {isLoggedIn && loggedInUsername && (
          <Typography
            variant={isMobile ? 'subtitle2' : 'h6'}
            sx={{
              color: '#90ee90',
              mb: 2,
              letterSpacing: '0.03em',
              fontWeight: 'medium',
            }}
          >
            Logged in as {loggedInUsername}
          </Typography>
        )}

        <Typography
          variant={isMobile ? 'body1' : 'h6'}
          sx={{
            color: '#aaa',
            lineHeight: 1.6,
            mb: 4,
            maxWidth: 600,
            [theme.breakpoints.down('sm')]: {
              maxWidth: '90%',
              fontSize: '0.9rem',
              textAlign: 'center',
            },
          }}
        >
          PUNoted is a Website app for exploring PU data extracted from players with their permission and for COSM Corporation.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 4,
            [theme.breakpoints.down('sm')]: {
              flexDirection: 'column',
              width: '90%',
              gap: theme.spacing(1.5),
              alignItems: 'center',
            },
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => handleAuthButton('cosm')}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 'bold',
              letterSpacing: '0.05em',
              bgcolor: '#7b68ee',
              boxShadow: '0 4px 15px rgba(123, 104, 238, 0.4)',
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s ease-in-out',
                bgcolor: '#6a5acd',
                boxShadow: '0 6px 20px rgba(123, 104, 238, 0.6)',
              },
              [theme.breakpoints.down('sm')]: {
                width: '100%',
              },
            }}
          >
            <FaArrowRight style={{ marginRight: '0.75rem' }} /> COSM
          </Button>

          {isLoggedIn ? (
            <>
              <Button
                variant="outlined"
                size="large"
                onClick={() => handleAuthButton('dashboard')}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  letterSpacing: '0.05em',
                  color: '#a0a0a0',
                  borderColor: '#555',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transform: 'scale(1.05)',
                    transition: 'transform 0.2s ease-in-out',
                    color: 'white',
                    borderColor: '#7b68ee',
                  },
                  [theme.breakpoints.down('sm')]: {
                    width: '100%',
                  },
                }}
              >
                <FaChartLine style={{ marginRight: '0.75rem' }} /> DASHBOARD
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleLogout}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  letterSpacing: '0.05em',
                  color: '#a0a0a0',
                  borderColor: '#555',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transform: 'scale(1.05)',
                    transition: 'transform 0.2s ease-in-out',
                    color: 'white',
                    borderColor: '#7b68ee',
                  },
                  [theme.breakpoints.down('sm')]: {
                    width: '100%',
                  },
                }}
              >
                <FaUsers style={{ marginRight: '0.75rem' }} /> LOGOUT
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              size="large"
              onClick={() => handleAuthButton('account')}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold',
                letterSpacing: '0.05em',
                color: '#a0a0a0',
                borderColor: '#555',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transform: 'scale(1.05)',
                  transition: 'transform 0.2s ease-in-out',
                  color: 'white',
                  borderColor: '#7b68ee',
                },
                [theme.breakpoints.down('sm')]: {
                  width: '100%',
                },
              }}
            >
              <FaUsers style={{ marginRight: '0.75rem' }} /> ACCOUNT
            </Button>
          )}
        </Box>
        <Link
          component="button"
          variant="body2"
          color="inherit"
          onClick={() => navigate('/privacy')}
          sx={{
            mt: 2,
            opacity: 0.8,
            '&:hover': {
              opacity: 1,
              textDecoration: 'underline',
            },
            [theme.breakpoints.down('sm')]: {
              fontSize: '0.8rem',
            },
          }}
        >
          Privacy Policy
        </Link>
      </ContentBox>
      <ApiStatus />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity as any} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </BackgroundBox>
  );
};

export default LandingPage;