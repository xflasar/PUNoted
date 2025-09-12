// src/DashboardPage.tsx
import React from 'react';
import { Typography, Box } from '@mui/material';

const DashboardPage: React.FC = () => {
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to PUNoted Dashboard!
      </Typography>
      <Typography variant="body1">
        This is your main dashboard. You can access various features using the navigation on the left.
      </Typography>
    </Box>
  );
};

export default DashboardPage;