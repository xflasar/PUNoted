// src/Dashboard/CX/components/TopMaterials.tsx
import { Paper, Skeleton, Typography, Box } from '@mui/material';
import {
    ResponsiveContainer,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Bar,
} from 'recharts';
import { TopMaterial } from '../types';

interface TopMaterialsProps {
    topMaterials?: TopMaterial[];
    isLoading: boolean;
}

export const TopMaterials = ({ topMaterials, isLoading }: TopMaterialsProps) => {
    if (isLoading) {
        return (
            <Paper>
                <Box p={3}>
                    <Typography variant="h6" gutterBottom>
                        Top 5 Materials by Revenue
                    </Typography>
                    <Skeleton variant="rectangular" height={300} />
                </Box>
            </Paper>
        );
    }
    
    if (!topMaterials || topMaterials.length === 0) {
        return (
            <Paper>
                <Box p={3} style={{ height: 380, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>Top 5 Materials by Revenue</Typography>
                    <Typography>No data available.</Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box p={1} sx={{ flexShrink: 0 }}>
                <Typography variant="h6" gutterBottom>
                    Top 5 Materials by Revenue
                </Typography>
            </Box>
            <ResponsiveContainer width="100%" height="100%" style={{ flexGrow: 1 }}>
                <BarChart data={topMaterials} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                                            <YAxis dataKey="ticker" type="category" width={120} />
                                            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                                            <Legend verticalAlign="bottom" align="center" />
                                            <Bar dataKey="total_revenue" name="Total Revenue" fill="#8884d8" />                </BarChart>
            </ResponsiveContainer>
        </Paper>
    );
};
