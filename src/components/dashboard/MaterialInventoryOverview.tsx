import React from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardHeader,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

interface ProcessedStorageSummaryItem {
  materialTicker: string;
  materialName: string;
  totalAmount: number;
  totalWeight: number;
  totalVolume: number;
  totalValue: number;
}

interface MaterialInventoryOverviewProps {
  processedStorageSummary: ProcessedStorageSummaryItem[];
  dataSource: 'fio' | 'pucext';
}

const MaterialInventoryOverview: React.FC<MaterialInventoryOverviewProps> = ({ processedStorageSummary, dataSource }) => {
  return (
    <Grid item xs={12} sx={{ mb: 3 }}>
      <Card elevation={3} sx={{ borderRadius: '12px', bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader
          title={
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Overall Material Inventory in Storage ({dataSource === 'fio' ? 'FIO Data' : 'PUCExt Data'})
            </Typography>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0, maxHeight: '500px', overflowY: 'auto' }}> {/* Scrollable content */}
          {processedStorageSummary.length > 0 ? (
            <TableContainer component={Paper} elevation={1} sx={{ borderRadius: '8px', overflowX: 'auto', bgcolor: 'background.paper' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'primary.dark' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Material</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Total Amount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Total Value (ICA)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Total Weight</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Total Volume</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processedStorageSummary.map((data, index) => (
                    <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{data.materialName} ({data.materialTicker})</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {data.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {data.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {data.totalWeight.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {data.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>No material inventory data found in storage from {dataSource.toUpperCase()}.</Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};

export default MaterialInventoryOverview;
