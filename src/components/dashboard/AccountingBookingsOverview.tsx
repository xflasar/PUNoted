import React from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardHeader,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

import { DashboardData, AccountingBookingEntry } from '../../app/dashboard/page';

interface AccountingBookingsOverviewProps {
  backendData: DashboardData | null;
}

const AccountingBookingsOverview: React.FC<AccountingBookingsOverviewProps> = ({ backendData }) => {
  return (
    <Grid item xs={12} sx={{ mb: 3 }}>
      <Card elevation={3} sx={{ borderRadius: '12px', bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader
          title={
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Recent Accounting Bookings (PUCExt Data)
            </Typography>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0, maxHeight: '500px', overflowY: 'auto' }}> {/* Scrollable content */}
          {backendData?.history_data?.accounting_bookings && Object.keys(backendData.history_data.accounting_bookings).length > 0 ? (
            <TableContainer component={Paper} elevation={1} sx={{ borderRadius: '8px', overflowX: 'auto', bgcolor: 'background.paper' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'primary.dark' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Account Category</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Balance Amount</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Debit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(backendData.history_data.accounting_bookings).map(([type, bookings]) => (
                    bookings.slice(0, 5).map((booking: AccountingBookingEntry, index: number) => ( // Show only first 5 bookings per type for brevity
                      <TableRow key={`${type}-${index}`} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell><Typography variant="body2" color="text.secondary">{type}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{booking.booking_timestamp ? new Date(booking.booking_timestamp).toLocaleString() : 'N/A'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{booking.accountCategory || 'N/A'}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" color="text.secondary">{booking.balance_amount?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 'N/A'}</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2" color="text.secondary">{booking.debit ? 'Yes' : 'No'}</Typography></TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>No accounting booking data found from PUCExt Data.</Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};

export default AccountingBookingsOverview;
