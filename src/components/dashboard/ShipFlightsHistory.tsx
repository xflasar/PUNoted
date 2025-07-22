import React from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardHeader,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

import { DashboardData, ShipFlightEntry } from '../../app/dashboard/page';

interface ShipFlightsHistoryProps {
  backendData: DashboardData | null;
}

const ShipFlightsHistory: React.FC<ShipFlightsHistoryProps> = ({ backendData }) => {
  return (
    <Grid item xs={12} sx={{ mb: 3 }}>
      <Card elevation={3} sx={{ borderRadius: '12px', bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader
          title={
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Recent Ship Flights (PUCExt Data)
            </Typography>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0, maxHeight: '500px', overflowY: 'auto' }}> {/* Scrollable content */}
          {backendData?.history_data?.ship_flights && Object.keys(backendData.history_data.ship_flights).length > 0 ? (
            <TableContainer component={Paper} elevation={1} sx={{ borderRadius: '8px', overflowX: 'auto', bgcolor: 'background.paper' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'primary.dark' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Flight ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Origin</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Destination</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Departure</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Arrival</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(backendData.history_data.ship_flights).map(([flightId, flights]) => (
                    flights.slice(0, 5).map((flight: ShipFlightEntry, index: number) => ( // Show only first 5 flights per ID
                      <TableRow key={`${flightId}-${index}`} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell><Typography variant="body2" color="text.secondary">{flight.flightId || 'N/A'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{flight.status || 'N/A'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">
                          {flight.origin_planet_name || flight.origin_station_name || flight.origin_system_name || 'N/A'}
                        </Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">
                          {flight.destination_planet_name || flight.destination_station_name || flight.destination_system_name || 'N/A'}
                        </Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{flight.departure_timestamp ? new Date(flight.departure_timestamp).toLocaleString() : 'N/A'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{flight.arrival_timestamp ? new Date(flight.arrival_timestamp).toLocaleString() : 'N/A'}</Typography></TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>No ship flight data found from PUCExt Data.</Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};

export default ShipFlightsHistory;
