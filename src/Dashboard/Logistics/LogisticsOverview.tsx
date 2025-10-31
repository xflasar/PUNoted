import React from 'react';
import { Paper, Box, Typography, Grid, Divider, List, ListItem, ListItemText } from '@mui/material';
import { Site, Ship } from './types';
import { ShowChart, LocalShipping, Warning, CheckCircle } from '@mui/icons-material';


interface LogisticsOverviewProps {
    sites: Site[];
    ships: Ship[];
}

const LogisticsOverview: React.FC<LogisticsOverviewProps> = ({ sites, ships }) => {
    const { netMaterialChange, requiredTransportTonnage } = React.useMemo(() => {
        const change: Record<string, number> = {};
        sites.forEach(site => {
            Object.entries(site.dailyProduction).forEach(([mat, val]) => change[mat] = (change[mat] || 0) + val);
            Object.entries(site.dailyConsumption).forEach(([mat, val]) => change[mat] = (change[mat] || 0) - val);
        });
        const requiredTonnage = Object.values(change).filter(v => v < 0).reduce((acc, v) => acc - v, 0);
        return { netMaterialChange: change, requiredTransportTonnage: requiredTonnage };
    }, [sites]);

    const transportCapacity = React.useMemo(() => {
        return ships.reduce((acc, ship) => {
            // Consider all ships available for transport, not just assigned
            acc.tonnage += ship.maxTonnage;
            acc.volume += ship.maxVolume;
            return acc;
        }, { tonnage: 0, volume: 0 });
    }, [ships]);

    const StatCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {icon}
                <Typography variant="h6" component="h3" sx={{ ml: 1 }}>{title}</Typography>
            </Box>
            <Divider />
            <Box sx={{ mt: 1 }}>
                {children}
            </Box>
        </Paper>
    );

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                <StatCard title="Fleet Capacity" icon={<LocalShipping color="primary" />}>
                    <Typography variant="body1">Total Tonnage: <strong>{transportCapacity.tonnage.toLocaleString()}</strong></Typography>
                    <Typography variant="body1">Total Volume: <strong>{transportCapacity.volume.toLocaleString()}</strong> m³</Typography>
                </StatCard>
            </Grid>
            <Grid item xs={12} md={4}>
                <StatCard title="System-wide Flow" icon={<ShowChart color="primary" />}>
                    <List dense>
                        {Object.entries(netMaterialChange).map(([material, amount]) => (
                            <ListItem key={material} disableGutters>
                                <ListItemText
                                    primary={material}
                                    secondary={amount.toLocaleString()}
                                    secondaryTypographyProps={{ color: amount >= 0 ? 'success.main' : 'error.main', fontWeight: 'bold' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </StatCard>
            </Grid>
            <Grid item xs={12} md={4}>
                <StatCard title="Transport Status" icon={requiredTransportTonnage > transportCapacity.tonnage ? <Warning color="error" /> : <CheckCircle color="success" />}>
                    <Typography variant="body1">Required Daily Tonnage: <strong>{requiredTransportTonnage.toLocaleString()}</strong></Typography>
                    {requiredTransportTonnage > transportCapacity.tonnage ? (
                        <Typography variant="body1" color="error.main" sx={{ mt: 1 }}>
                           <strong>Insufficient Capacity!</strong> Shortfall of {(requiredTransportTonnage - transportCapacity.tonnage).toLocaleString()} tons.
                        </Typography>
                    ) : (
                        <Typography variant="body1" color="success.main" sx={{ mt: 1 }}>
                            <strong>Capacity Sufficient.</strong> Surplus of {(transportCapacity.tonnage - requiredTransportTonnage).toLocaleString()} tons.
                        </Typography>
                    )}
                </StatCard>
            </Grid>
        </Grid>
    );
};

export default LogisticsOverview;
