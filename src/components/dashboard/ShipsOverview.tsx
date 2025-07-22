import React from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardHeader,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

import { DashboardData, ShipData } from '../../app/dashboard/page';

interface ShipsOverviewProps {
  backendData: DashboardData | null;
}

const ShipsOverview: React.FC<ShipsOverviewProps> = ({ backendData }) => {
  return (
    <Grid item xs={12} sx={{ mb: 3 }}>
      <Card elevation={3} sx={{ borderRadius: '12px', bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader
          title={
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Ships Overview (PUCExt Data)
            </Typography>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0, maxHeight: '500px', overflowY: 'auto' }}> {/* Scrollable content */}
          {backendData?.current_state?.ships && Object.keys(backendData.current_state.ships).length > 0 ? (
            <TableContainer component={Paper} elevation={1} sx={{ borderRadius: '8px', overflowX: 'auto', bgcolor: 'background.paper' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'primary.dark' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Registration</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Blueprint</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Current Flight</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Mass</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Volume</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.values(backendData.current_state.ships).map((ship: ShipData, index: number) => (
                    <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell><Typography variant="body2" color="text.secondary">{ship.registration}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{ship.blueprintNaturalId}</Typography></TableCell>
                      <TableCell>
                        {ship.current_flight ? (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              From: {ship.current_flight.origin?.planet_name || 'N/A'} ({ship.current_flight.origin?.system_name || 'N/A'})
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              To: {ship.current_flight.destination?.planet_name || 'N/A'} ({ship.current_flight.destination?.system_name || 'N/A'})
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Departure: (
                              {ship.current_flight.departure?.timestamp ? new Date(ship.current_flight.departure.timestamp).toLocaleString() : 'N/A'}
                              )
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Arrival: (
                              {ship.current_flight.arrival?.timestamp ? new Date(ship.current_flight.arrival.timestamp).toLocaleString() : 'N/A'}
                              )
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">Docked</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right"><Typography variant="body2" color="text.secondary">{ship.mass.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" color="text.secondary">{ship.volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>No ship data found from PUCExt Data.</Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};

export default ShipsOverview;
