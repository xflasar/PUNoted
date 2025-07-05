// src/app/storage/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, TextField, Grid, Paper, CircularProgress, Alert, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress,
  Accordion, AccordionSummary, AccordionDetails, Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { fetchUserStorage, fetchAllMaterials, fetchUserSites, fetchUserWarehouses } from '@/lib/api/fio';
import { FioStorageUnit, FioStorageItem, FioMaterial, FioSite, FioWarehouse, EnhancedFioStorageUnit } from '@/lib/types';

const MOCK_CURRENT_USER_NAME = 'XSUPEFLY'; // Mocking

type StoragePageStage = 'initialChoice' | 'loading' | 'storageDisplay' | 'notFound';

export default function StoragePage() {
  const [stage, setStage] = useState<StoragePageStage>('initialChoice');
  const [otherPlayerName, setOtherPlayerName] = useState('');
  const [selectedUserName, setSelectedUserName] = useLocalStorage<string | null>('selectedUserName', null);
  const [rawStorageData, setRawStorageData] = useState<FioStorageUnit[] | null>(null);
  const [sitesData, setSitesData] = useState<FioSite[] | null>(null);
  const [warehousesData, setWarehousesData] = useState<FioWarehouse[] | null>(null);
  const [enhancedStorageData, setEnhancedStorageData] = useState<EnhancedFioStorageUnit[] | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [allMaterials, setAllMaterials] = useState<Record<string, FioMaterial> | null>(null);

  const [fioApiKey] = useLocalStorage('fioApiKey', '');

  const [expandedAccordionIds, setExpandedAccordionIds] = useState<string[]>([]);

  const handleAccordionChange = (panelId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordionIds(prev =>
      isExpanded ? [...prev, panelId] : prev.filter(id => id !== panelId)
    );
  };

  useEffect(() => {
    const getMaterials = async () => {
      try {
        const materials = await fetchAllMaterials();
        setAllMaterials(materials);
      } catch (err) {
        console.error('Failed to fetch all materials:', err);
      }
    };
    getMaterials();
  }, []);

  const fetchStorageDataForUser = useCallback(async (userName: string) => {
    setStage('loading');
    setErrorMessage(null);
    const delayBetweenRequests = 150;
    try {
      // Fetch Storage data first
      const storageResponse = await fetchUserStorage(userName, fioApiKey);
      setRawStorageData(storageResponse);
      
      // Wait for a bit before fetching sites
      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
      
      // Fetch Sites data
      const sitesResponse = await fetchUserSites(userName, fioApiKey);
      setSitesData(sitesResponse);
      
      // Wait for a bit before fetching warehouses
      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
      
      // Fetch Warehouses data
      const warehousesResponse = await fetchUserWarehouses(userName, fioApiKey);
      setWarehousesData(warehousesResponse);

      setRawStorageData(storageResponse);
      setSitesData(sitesResponse);
      setWarehousesData(warehousesResponse);

      if (storageResponse && storageResponse.length > 0) {
        // Enhance storage data with linked site/warehouse names
        const enhancedData: EnhancedFioStorageUnit[] = storageResponse.map(unit => {
          let linkedLocationName: string | undefined;
          let linkedLocationType: 'PLANET_BASE' | 'WAREHOUSE_BUILDING' | 'UNKNOWN' = 'UNKNOWN';
          let linkedLocationIdentifier: string | undefined;

          // Attempt to link to a warehouse first using StoreId
          const linkedWarehouse = warehousesResponse.find(wh => wh.StoreId === unit.StorageId);
          if (linkedWarehouse) {
            linkedLocationName = linkedWarehouse.LocationName;
            linkedLocationType = 'WAREHOUSE_BUILDING';
            linkedLocationIdentifier = linkedWarehouse.LocationNaturalId;
          } else {
            // If not a warehouse, attempt to link to a site (e.g., planet base storage) using SiteId
            const linkedSite = sitesResponse.find(s => s.SiteId === unit.AddressableId);
            if (linkedSite) {
              linkedLocationName = linkedSite.PlanetName;
              linkedLocationType = 'PLANET_BASE';
              linkedLocationIdentifier = linkedSite.PlanetIdentifier;
            }
          }

          return {
            ...unit,
            // Fallback to original unit.Name if no specific site/warehouse link is found
            linkedLocationName: linkedLocationName || unit.Name,
            linkedLocationType,
            linkedLocationIdentifier,
          };
        });

        setEnhancedStorageData(enhancedData);
        setStage('storageDisplay');
        setLastUpdated(new Date());
        setExpandedAccordionIds([]);
      } else {
        setErrorMessage(`No storage data found for user: ${userName}`);
        setStage('notFound');
      }
    } catch (error: any) {
      console.error('Error fetching combined storage data:', error);
      setErrorMessage(error.message || 'Failed to fetch combined storage data.');
      setStage('notFound');
    }
  }, []);

  const handleUserSelect = (userName: string) => {
    setSelectedUserName(userName);
    fetchStorageDataForUser(userName);
  };

  const overallInventory = useMemo(() => {
    const inventory: { [ticker: string]: { item: FioStorageItem, totalAmount: number, totalWeight: number, totalVolume: number } } = {};
    if (rawStorageData) {
      rawStorageData.forEach(unit => {
        unit.StorageItems.forEach(item => {
          if (inventory[item.MaterialTicker]) {
            inventory[item.MaterialTicker].totalAmount += item.MaterialAmount;
            inventory[item.MaterialTicker].totalWeight += item.TotalWeight;
            inventory[item.MaterialTicker].totalVolume += item.TotalVolume;
          } else {
            inventory[item.MaterialTicker] = {
              item: item,
              totalAmount: item.MaterialAmount,
              totalWeight: item.TotalWeight,
              totalVolume: item.TotalVolume
            };
          }
        });
      });
    }
    return Object.values(inventory).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [rawStorageData]);

  const handleBackToInitialChoice = () => {
    setStage('initialChoice');
    setSelectedUserName(null);
    setRawStorageData(null);
    setSitesData(null);
    setWarehousesData(null);
    setEnhancedStorageData(null);
    setOtherPlayerName('');
    setLastUpdated(null);
    setExpandedAccordionIds([]);
  };

  const handleRefresh = () => {
    if (selectedUserName) {
      fetchStorageDataForUser(selectedUserName);
    }
  };

  const getMaterialDisplayName = (ticker: string) => {
    return allMaterials?.[ticker]?.Name || ticker;
  };

  const getMaterialIconUrl = (ticker: string) => {
    // `public/icons/materials/*.png`
    // return `/icons/materials/${ticker.toLowerCase()}.png`;
    return ''; // Return empty string if no actual icons are available or path is not set up
  };

  const renderContent = () => {
    switch (stage) {
      case 'initialChoice':
        return (
          <Box sx={{ p: 3, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h5" gutterBottom>View Storage Data</Typography>
            <Button
              variant="contained"
              sx={{ mb: 2, width: '250px' }}
              onClick={() => handleUserSelect(MOCK_CURRENT_USER_NAME)}
            >
              My Storage ({MOCK_CURRENT_USER_NAME})
            </Button>
            <Typography variant="h6" sx={{ mb: 1 }}>Or Enter Other Player Name:</Typography>
            <TextField
              label="Player Name"
              variant="outlined"
              value={otherPlayerName}
              onChange={(e) => setOtherPlayerName(e.target.value)}
              sx={{ mb: 2, width: '250px' }}
            />
            <Button
              variant="contained"
              color="secondary"
              disabled={!otherPlayerName.trim()}
              onClick={() => handleUserSelect(otherPlayerName.trim())}
              sx={{ width: '250px' }}
            >
              View Other Player's Storage
            </Button>
          </Box>
        );

      case 'loading':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>Loading Storage Data...</Typography>
          </Box>
        );

      case 'notFound':
        return (
          <Box sx={{ p: 3, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage || "Storage data not found for the selected user."}
            </Alert>
            <Button variant="contained" onClick={handleBackToInitialChoice}>
              Back to Start
            </Button>
          </Box>
        );

      case 'storageDisplay':
        return (
          <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <IconButton onClick={handleBackToInitialChoice}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h5" component="h2">
                Storage for {selectedUserName}
              </Typography>
              <IconButton onClick={handleRefresh} color="primary" aria-label="refresh">
                <RefreshIcon />
              </IconButton>
            </Box>
            {lastUpdated && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                    Last Updated: {lastUpdated.toLocaleTimeString()}
                </Typography>
            )}
            {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

            {/* Overall Inventory Summary - Grid of small items with Tooltips */}
            <Paper elevation={3} sx={{ p: 2, mb: 4, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>Overall Material Inventory</Typography>
              {overallInventory.length > 0 ? (
                <Box sx={{ maxHeight: '25vh', overflowY: 'auto' }}>
                  <Grid container spacing={1}>
                    {overallInventory.map((data) => (
                      <Grid item xs={6} sm={4} md={3} lg={2} key={data.item.MaterialTicker}>
                        <Tooltip
                          title={
                            <Box sx={{ p: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{getMaterialDisplayName(data.item.MaterialTicker)}</Typography>
                              <Typography variant="caption">Ticker: {data.item.MaterialTicker}</Typography><br/>
                              <Typography variant="caption">Amount: {data.totalAmount.toLocaleString()}</Typography><br/>
                              <Typography variant="caption">Total Volume: {data.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })} m³</Typography><br/>
                              <Typography variant="caption">Total Weight: {(data.totalWeight / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} t</Typography>
                            </Box>
                          }
                          arrow
                          placement="top"
                        >
                          <Paper
                            elevation={1}
                            sx={{
                              p: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              borderRadius: 1,
                              height: '100%',
                              cursor: 'help',
                            }}
                          >
                            <Box sx={{ width: 40, height: 40, mb: 0.5 }}>
                              {getMaterialIconUrl(data.item.MaterialTicker) ? (
                                  <img src={getMaterialIconUrl(data.item.MaterialTicker)} alt={data.item.MaterialTicker} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                              ) : (
                                  <Box sx={{ width: '100%', height: '100%', bgcolor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                                      <Typography variant="caption" sx={{ color: 'grey.700', fontSize: '0.6rem' }}>{data.item.MaterialTicker}</Typography>
                                  </Box>
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                              {data.item.MaterialTicker}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 'medium' }}>
                              {data.totalAmount.toLocaleString()}
                            </Typography>
                          </Paper>
                        </Tooltip>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Typography color="text.secondary">No materials found in storage.</Typography>
              )}
            </Paper>

            {/* Storage Units - Grid */}
            <Typography variant="h6" gutterBottom>Storage Units</Typography>
            {enhancedStorageData && enhancedStorageData.length > 0 ? (
              <Grid container spacing={3}>
                {enhancedStorageData.map((unit) => (
                  <Grid item xs={12} sm={6} md={4} key={unit.StorageId}>
                    <Paper
                      elevation={8}
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backgroundColor: 'rgba(10, 10, 20, 0.8)',
                        backdropFilter: 'blur(5px)',
                        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0px 15px 30px rgba(0, 0, 0, 0.7), inset 0 0 15px rgba(255, 255, 255, 0.2)',
                        },
                      }}
                    >
                      <Accordion
                        expanded={expandedAccordionIds.includes(unit.StorageId)}
                        onChange={handleAccordionChange(unit.StorageId)}
                        sx={{
                          bgcolor: 'transparent',
                          '&:before': { display: 'none' },
                          borderRadius: 'inherit',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
                          sx={{
                            bgcolor: 'rgba(20, 20, 40, 0.7)',
                            borderRadius: 'inherit',
                            '&.Mui-expanded': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
                            flexGrow: 0,
                            minHeight: 'auto !important',
                            '.MuiAccordionSummary-content': { margin: '12px 0 !important' },
                            px: 2, py: 1.5,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <Box sx={{ flexGrow: 1 }}>
                            {/* Display linked location name and identifier */}
                            <Typography variant="h6" sx={{ color: 'primary.light' }}>
                                {unit.linkedLocationName} {unit.linkedLocationIdentifier ? `(${unit.linkedLocationIdentifier})` : ''}
                            </Typography>
                            {unit.linkedLocationType && unit.linkedLocationType !== 'UNKNOWN' && (
                                <Typography variant="body2" color="text.secondary">
                                    Type: {unit.Type} ({unit.linkedLocationType === 'PLANET_BASE' ? 'Planet Base' : 'Warehouse Building'})
                                </Typography>
                            )}
                            {!unit.linkedLocationType || unit.linkedLocationType === 'UNKNOWN' && (
                                <Typography variant="body2" color="text.secondary">
                                    Type: {unit.Type} (Unknown Link)
                                </Typography>
                            )}

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Weight: {unit.WeightLoad.toLocaleString()}/{unit.WeightCapacity.toLocaleString()} kg ({((unit.WeightLoad / unit.WeightCapacity) * 100).toFixed(1)}%)
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(unit.WeightLoad / unit.WeightCapacity) * 100}
                                sx={{ height: 5, borderRadius: 2, mt: 0.5 }}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Volume: {unit.VolumeLoad.toLocaleString()}/{unit.VolumeCapacity.toLocaleString()} m³ ({((unit.VolumeLoad / unit.VolumeCapacity) * 100).toFixed(1)}%)
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(unit.VolumeLoad / unit.VolumeCapacity) * 100}
                                sx={{ height: 5, borderRadius: 2, mt: 0.5 }}
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{
                          bgcolor: 'rgba(5, 5, 15, 0.9)',
                          borderTop: '1px solid',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          flexGrow: 1,
                          overflowY: 'auto',
                          p: 1
                        }}>
                          {unit.StorageItems.length > 0 ? (
                            <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 1 }}>
                              <Table size="small" aria-label={`inventory of ${unit.Name}`}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Material</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                    <TableCell align="right">Weight (t)</TableCell>
                                    <TableCell align="right">Volume (m³)</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {unit.StorageItems.map((item) => (
                                    <TableRow key={item.MaterialId}>
                                      <TableCell>
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                              {getMaterialIconUrl(item.MaterialTicker) ? (
                                                  <img src={getMaterialIconUrl(item.MaterialTicker)} alt={item.MaterialTicker} style={{ width: 20, height: 20, marginRight: 8, objectFit: 'contain' }} />
                                              ) : (
                                                  <Typography variant="caption" sx={{ mr: 0.5 }}>[{item.MaterialTicker}]</Typography>
                                              )}
                                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                  {getMaterialDisplayName(item.MaterialTicker)}
                                              </Typography>
                                          </Box>
                                      </TableCell>
                                      <TableCell align="right">{item.MaterialAmount.toLocaleString()}</TableCell>
                                      <TableCell align="right">{(item.TotalWeight / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                      <TableCell align="right">{item.TotalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Typography color="text.secondary" align="center" sx={{ p: 2 }}>This storage unit is empty.</Typography>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography>No storage units found for this user.</Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {renderContent()}
    </Box>
  );
}