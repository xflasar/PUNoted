import React from 'react';
import { Card, Typography, Grid, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StoreIcon from '@mui/icons-material/Store';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

export const OverviewCards: React.FC = () => {
  const stats = [
    {
      title: 'Total Profit (24h)',
      value: '$1,234,567',
      icon: <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />,
      description: 'Up 15% from yesterday',
    },
    {
      title: 'Active Trades',
      value: '25',
      icon: <StoreIcon color="secondary" sx={{ fontSize: 40 }} />,
      description: 'Across 5 exchanges',
    },
    {
      title: 'Ships In Transit',
      value: '7',
      icon: <LocalShippingIcon color="success" sx={{ fontSize: 40 }} />,
      description: 'Delivering 3 contracts',
    },
  ];

  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid xs={12} sm={6} md={4} key={index}>
          <Card raised sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
            <Box sx={{ mr: 2 }}>{stat.icon}</Box>
            <Box>
              <Typography variant="h6" component="div">
                {stat.title}
              </Typography>
              <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.description}
              </Typography>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};