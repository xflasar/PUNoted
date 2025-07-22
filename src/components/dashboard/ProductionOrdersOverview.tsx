import React from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardHeader,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

import { DashboardData, ProductionOrderEntry } from '../../app/dashboard/page';

interface ProductionOrdersOverviewProps {
  backendData: DashboardData | null;
}

const ProductionOrdersOverview: React.FC<ProductionOrdersOverviewProps> = ({ backendData }) => {
  return (
    <Grid item xs={12} sx={{ mb: 3 }}>
      <Card elevation={3} sx={{ borderRadius: '12px', bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader
          title={
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Recent Production Orders (PUCExt Data)
            </Typography>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0, maxHeight: '500px', overflowY: 'auto' }}> {/* Scrollable content */}
          {backendData?.history_data?.production_orders && Object.keys(backendData.history_data.production_orders).length > 0 ? (
            <TableContainer component={Paper} elevation={1} sx={{ borderRadius: '8px', overflowX: 'auto', bgcolor: 'background.paper' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'primary.dark' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Production Line ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Recipe ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Inputs</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Outputs</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(backendData.history_data.production_orders).map(([lineId, orders]) => (
                    orders.slice(0, 5).map((order: ProductionOrderEntry, index: number) => ( // Show only first 5 orders per line
                      <TableRow key={`${lineId}-${index}`} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell><Typography variant="body2" color="text.secondary">{order.productionLineId || 'N/A'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{order.status || 'N/A'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{order.recipeId || 'N/A'}</Typography></TableCell>
                        <TableCell>
                          {order.inputs_summary.map((input, i) => (
                            <Typography key={i} variant="body2" color="text.secondary">
                              {input.ticker || 'N/A'}: {input.amount?.toLocaleString() || 'N/A'}
                            </Typography>
                          ))}
                        </TableCell>
                        <TableCell>
                          {order.outputs_summary.map((output, i) => (
                            <Typography key={i} variant="body2" color="text.secondary">
                              {output.ticker || 'N/A'}: {output.amount?.toLocaleString() || 'N/A'}
                            </Typography>
                          ))}
                        </TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{order.created_timestamp ? new Date(order.created_timestamp).toLocaleString() : 'N/A'}</Typography></TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>No production order data found from PUCExt Data.</Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};

export default ProductionOrdersOverview;
