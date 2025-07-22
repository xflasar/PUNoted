import React from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardHeader, Tooltip
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';

import { FioWorkforceResponse, Workforce, WorkforceNeed } from '../../app/dashboard/page';

interface ProcessedWorkforceSite {
  siteId: string;
  planetName: string;
  workforces: {
    workforceLevel: string;
    population: number;
    required: number;
    capacity: number;
    satisfaction: number;
    needs: { materialTicker: string; needed: number; satisfaction: number; essential: boolean }[];
  }[];
}

interface WorkforceOverviewProps {
  processedWorkforceData: ProcessedWorkforceSite[];
  dataSource: 'fio' | 'pucext';
  getMaterialName: (ticker: string) => string;
}

const WorkforceOverview: React.FC<WorkforceOverviewProps> = ({ processedWorkforceData, dataSource, getMaterialName }) => {
  return (
    <Grid item xs={12} sx={{ mb: 3 }}>
      <Card elevation={3} sx={{ borderRadius: '12px', bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader
          title={
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Workforce Overview ({dataSource === 'fio' ? 'FIO Data' : 'PUCExt Data'})
            </Typography>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0, maxHeight: '500px', overflowY: 'auto' }}> {/* Scrollable content */}
          {processedWorkforceData.length > 0 ? (
            <Box
              sx={{
                columnCount: { xs: 1, sm: 2, md: 3 },
                columnGap: '16px',
              }}
            >
              {processedWorkforceData.map((siteSummary, siteIndex) => (
                <Card
                  key={siteIndex}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    display: 'inline-block',
                    width: '100%',
                    breakInside: 'avoid',
                    bgcolor: 'background.paper',
                    borderColor: 'divider',
                    color: 'text.primary'
                  }}
                >
                  <CardHeader
                    title={
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Base: {siteSummary.siteId}
                      </Typography>
                    }
                    subheader={
                      <Typography variant="caption" color="text.secondary">
                        Planet: {siteSummary.planetName}
                      </Typography>
                    }
                    sx={{ bgcolor: 'primary.dark', p: 1.5, borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary' }}
                  />
                  <CardContent sx={{ p: 1.5 }}>
                    {siteSummary.workforces.map((wf, wfIndex) => (
                      <Box key={wfIndex} sx={{ mb: wfIndex < siteSummary.workforces.length - 1 ? 2 : 0, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: '6px', bgcolor: '#2c2c2c' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5, color: 'text.primary' }}>
                          Level: {wf.workforceLevel}
                        </Typography>
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Population: {wf.population.toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Required: {wf.required.toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Capacity: {wf.capacity.toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ mr: 0.5, color: 'text.secondary' }}>Satisfaction:</Typography>
                            {wf.satisfaction >= 0.95 ? (
                              <Tooltip title="High Satisfaction">
                                <CheckCircleOutlineIcon color="success" sx={{ fontSize: 18 }} />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Low Satisfaction">
                                <WarningAmberIcon color="warning" sx={{ fontSize: 18 }} />
                              </Tooltip>
                            )}
                            <Typography variant="body2" component="span" sx={{ ml: 0.5, color: 'text.secondary' }}>
                              {(wf.satisfaction * 100).toFixed(0)}%
                            </Typography>
                          </Grid>
                        </Grid>
                        {wf.needs.filter(need => need.needed > 0).length > 0 && (
                          <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>Needs:</Typography>
                            {wf.needs.filter(need => need.needed > 0).map((need, i) => (
                              <Box key={i} sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {getMaterialName(need.materialTicker)}: {need.needed.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </Typography>
                                {need.essential && (
                                  <Tooltip title="Essential Material">
                                    <InfoIcon sx={{ fontSize: 14, ml: 0.5, color: 'info.main' }} />
                                  </Tooltip>
                                )}
                                {need.satisfaction < 1 && (
                                  <Tooltip title={`Satisfaction: ${(need.satisfaction * 100).toFixed(0)}%`}>
                                    <WarningAmberIcon color="error" sx={{ fontSize: 14, ml: 0.5 }} />
                                  </Tooltip>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                    {siteSummary.workforces.length === 0 && (
                      <Typography variant="body2" color="text.secondary">No workforce details for this base.</Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>No workforce data found for this user from {dataSource.toUpperCase()}.</Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};

export default WorkforceOverview;
