import React from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardHeader,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

import { DashboardData, ComexTraderOrderEntry } from '../../app/dashboard/page';

interface ComexTraderOrdersOverviewProps {
  backendData: DashboardData | null;
}

const ComexTraderOrdersOverview: React.FC<ComexTraderOrdersOverviewProps> = ({ backendData }) => {
  return (
    <Grid item xs={12} sx={{ mb: 3 }}>
      <Card elevation={3} sx={{ borderRadius: '12px', bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader
          title={
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Recent COMEX Trader Orders (PUCExt Data)
            </Typography>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0, maxHeight: '500px', overflowY: 'auto' }}> {/* Scrollable content */}
          {backendData?.history_data?.comex_trader_orders && Object.keys(backendData.history_data.comex_trader_orders).length > 0 ? (
            <TableContainer component={Paper} elevation={1} sx={{ borderRadius: '8px', overflowX: 'auto', bgcolor: 'background.paper' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'primary.dark' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Order Type</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Amount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Limit Price</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(backendData.history_data.comex_trader_orders).map(([orderId, orders]) => (
                    orders.slice(0, 5).map((order: ComexTraderOrderEntry, index: number) => ( // Show only first 5 orders per ID
                      <TableRow key={`${orderId}-${index}`} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell><Typography variant="body2" color="text.secondary">{order.material_ticker || 'N/A'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{order.order_type || 'N/A'}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" color="text.secondary">{order.amount?.toLocaleString() || 'N/A'}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" color="text.secondary">{order.limit_amount?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 'N/A'} {order.limit_currency || ''}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{order.status || 'N/A'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{order.created_timestamp ? new Date(order.created_timestamp).toLocaleString() : 'N/A'}</Typography></TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>No COMEX trader order data found from PUCExt Data.</Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};

export default ComexTraderOrdersOverview;
