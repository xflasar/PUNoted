import React from 'react';
import { Box, Typography, Link, List, ListItem, ListItemText, Button, useMediaQuery } from '@mui/material';
import { styled, useTheme } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

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
  background: 'rgba(25, 25, 50, 0.8)',
  backdropFilter: 'blur(10px)',
  padding: theme.spacing(6),
  borderRadius: 16,
  boxShadow: '0 0 50px rgba(123, 104, 238, 0.3)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  zIndex: 2,
  maxWidth: 800,
  margin: theme.spacing(4),
  textAlign: 'left',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    margin: theme.spacing(2),
    maxWidth: '95%',
    width: '100%',
    maxHeight: 'calc(100vh - 48px)',
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
      width: '0.4em',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(123,104,238,0.5)',
      borderRadius: '20px',
    },
  },
}));

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <BackgroundBox>
      <ContentBox>
        <Button
          variant="outlined"
          sx={{
            mb: 3,
            color: '#aaa',
            borderColor: '#555',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderColor: '#7b68ee',
              color: 'white',
            },
            [theme.breakpoints.down('sm')]: {
              width: '100%',
            },
          }}
          onClick={() => navigate('/')}
        >
          <FaArrowLeft style={{ marginRight: '0.5rem' }} /> Back to Home
        </Button>

        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Privacy Policy
        </Typography>
        <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ color: '#aaa' }}>
          This privacy policy provides information on how PUNoted (not a legal name or entity) uses and protects any information you provide using this website, the browser extension, and the API.
        </Typography>

        <Typography variant={isMobile ? 'h6' : 'h5'} component="h2" sx={{ mt: 4, mb: 2, color: 'white' }}>
          Why I collect information
        </Typography>
        <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ color: '#aaa' }}>
          All information I collect is either to provide data back to you and others you allow to, or to help identify problems with my services.
        </Typography>
        <List sx={{ color: '#aaa' }}>
          <ListItem disablePadding>
            <ListItemText primary="I do not sell your information." primaryTypographyProps={{ variant: isMobile ? 'body2' : 'body1' }} />
          </ListItem>
          <ListItem disablePadding>
            <ListItemText primary="I will not share your information unless you request me to (via Token with permissions)." primaryTypographyProps={{ variant: isMobile ? 'body2' : 'body1' }} />
          </ListItem>
        </List>

        <Typography variant={isMobile ? 'h6' : 'h5'} component="h2" sx={{ mt: 4, mb: 2, color: 'white' }}>
          What I collect
        </Typography>
        <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ color: '#aaa' }}>
          For all users, I collect for logging purposes (and later periodically delete):
        </Typography>
        <List sx={{ color: '#aaa' }}>
          <ListItem disablePadding>
            <ListItemText primary="Your IP Address" primaryTypographyProps={{ variant: isMobile ? 'body2' : 'body1' }} />
          </ListItem>
          <ListItem disablePadding>
            <ListItemText primary="Your browser version (User agent)" primaryTypographyProps={{ variant: isMobile ? 'body2' : 'body1' }} />
          </ListItem>
        </List>
        <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ color: '#aaa' }}>
          For users who submit data and authentication restricted parts of the API, I collect and save (until asked to delete):
        </Typography>
        <List sx={{ color: '#aaa' }}>
          <ListItem disablePadding>
            <ListItemText primary="Your username & password" primaryTypographyProps={{ variant: isMobile ? 'body2' : 'body1' }} />
          </ListItem>
          <ListItem disablePadding>
            <ListItemText primary="A token-equivalent of a username/password" primaryTypographyProps={{ variant: isMobile ? 'body2' : 'body1' }} />
          </ListItem>
          <ListItem disablePadding>
            <ListItemText primary="Your Prosperous Universe display name" primaryTypographyProps={{ variant: isMobile ? 'body2' : 'body1' }} />
          </ListItem>
          <ListItem disablePadding>
            <ListItemText primary="Information specific your Prosperous Universe game (base data, users data, etc)" primaryTypographyProps={{ variant: isMobile ? 'body2' : 'body1' }} />
          </ListItem>
        </List>

        <Typography variant={isMobile ? 'h6' : 'h5'} component="h2" sx={{ mt: 4, mb: 2, color: 'white' }}>
          Security
        </Typography>
        <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ color: '#aaa' }}>
          I am committed to keeping your information safe. I use strong security measures to prevent unauthorized access and protect the data I collect.
        </Typography>

        <Typography variant={isMobile ? 'h6' : 'h5'} component="h2" sx={{ mt: 4, mb: 2, color: 'white' }}>
          Controlling your information
        </Typography>
        <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ color: '#aaa' }}>
          My public services are available with minimal data collection. When you choose to create an account and access more functionality, I will then ask for additional information to secure your data.
        </Typography>
        <Typography variant={isMobile ? 'body2' : 'body1'} paragraph sx={{ color: '#aaa' }}>
          If you wish to have your data deleted, or have additional questions about the data I collect (including your data), please email me at <Link href="mailto:xflasar@gmail.com" sx={{ color: '#7b68ee' }}>xflasar@gmail.com</Link>.
        </Typography>
      </ContentBox>
    </BackgroundBox>
  );
};

export default PrivacyPolicy;
