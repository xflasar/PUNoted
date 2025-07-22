import React from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardHeader,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

import { DashboardData, StorageChangeEntry } from '../../app/dashboard/page';

interface StorageChangesHistoryProps {
  backendData: DashboardData | null;
}

const StorageChangesHistory: React.FC<StorageChangesHistoryProps> = ({ backendData }) => {
  return (
    <Grid item xs={12} sx={{ mb: 3 }}>
      <Card elevation={3} sx={{ borderRadius: '12px', bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader
          title={
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Recent Storage Changes (PUCExt Data)
            </Typography>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0, maxHeight: '500px', overflowY: 'auto' }}> {/* Scrollable content */}
          {backendData?.history_data?.storage_changes && Object.keys(backendData.history_data.storage_changes).length > 0 ? (
            <TableContainer component={Paper} elevation={1} sx={{ borderRadius: '8px', overflowX: 'auto', bgcolor: 'background.paper' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'primary.dark' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Timestamp</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Weight Load</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Volume Load</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Items Summary</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(backendData.history_data.storage_changes).map(([storageName, changes]) => (
                    changes.slice(0, 5).map((change: StorageChangeEntry, index: number) => ( // Show only first 5 changes per storage
                      <TableRow key={`${storageName}-${index}`} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell><Typography variant="body2" color="text.secondary">{change.name || 'N/A'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{change.overall_timestamp ? new Date(change.overall_timestamp).toLocaleString() : 'N/A'}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" color="text.secondary">{change.weightLoad?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 'N/A'}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" color="text.secondary">{change.volumeLoad?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 'N/A'}</Typography></TableCell>
                        <TableCell>
                          {change.items_summary.map((item, i) => (
                            <Typography key={i} variant="body2" color="text.secondary">
                              {item.material_ticker || 'N/A'}: {item.amount?.toLocaleString() || 'N/A'} ({item.value_amount?.toLocaleString() || 'N/A'} {item.value_currency || ''})
                            </Typography>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>No storage change data found from PUCExt Data.</Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};

export default StorageChangesHistory;
