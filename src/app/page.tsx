// src/app/page.tsx
'use client';

import { Box, Typography } from '@mui/material';
import { OverviewCards } from '@/components/dashboard/OverviewCards';

export default function HomePage() {
  return (
    <Box sx={{
      py: 4,
      px: { xs: 2, sm: 3, md: 4 },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flexGrow: 1,
    }}>
      {/* Welcome Message - Top Centered */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Your Dashboard!
        </Typography>
      </Box>

      {/* Overview Cards - Top Centered */}
      <Box sx={{ width: '100%', mb: 4, display: 'flex', justifyContent: 'center' }}>
        <OverviewCards />
      </Box>
    </Box>
  );
}