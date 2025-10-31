import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider, Grid, Paper } from '@mui/material';
import { Site } from './types';

interface SiteStatsProps {
    site: Site;
}

const SiteStats: React.FC<SiteStatsProps> = ({ site }) => {
    const netChange: Record<string, number> = {};

    Object.keys(site.dailyProduction).forEach(material => {
        netChange[material] = (netChange[material] || 0) + site.dailyProduction[material];
    });

    Object.keys(site.dailyConsumption).forEach(material => {
        netChange[material] = (netChange[material] || 0) - site.dailyConsumption[material];
    });

    const StatList: React.FC<{title: string, data: Record<string, number>, colorize?: boolean}> = ({ title, data, colorize }) => (
        <Box>
            <Typography variant="subtitle1" gutterBottom>{title}</Typography>
            <List dense disablePadding>
                {Object.entries(data).map(([material, amount]) => (
                    <ListItem key={material} disableGutters>
                        <ListItemText 
                            primary={material} 
                            secondary={amount} 
                            secondaryTypographyProps={{ 
                                component: 'span',
                                color: colorize ? (amount > 0 ? 'success.main' : 'error.main') : 'text.secondary'
                            }}
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'action.hover' }}>
            <Typography variant="h6" gutterBottom>{site.name} Daily Material Flow</Typography>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <StatList title="Production" data={site.dailyProduction} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatList title="Consumption" data={site.dailyConsumption} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatList title="Net Change" data={netChange} colorize />
                </Grid>
            </Grid>
        </Paper>
    );
};

export default SiteStats;
