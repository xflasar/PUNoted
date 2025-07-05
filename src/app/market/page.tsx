// src/app/market/page.tsx
'use client';

import { Box, Typography } from '@mui/material';
import { MarketTable } from '@/components/dashboard/MarketTable';

export default function MarketPage() {
  return (
    <Box sx={{
      py: 4,
      px: { xs: 2, sm: 3, md: 4 },
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
        Market Overview
      </Typography>
      <MarketTable />
    </Box>
  );
}