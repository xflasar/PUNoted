// src/app/production/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Grid, Paper, CircularProgress, Alert, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { fetchPlanetProductionDetails, fetchUserProductionOverview } from '@/lib/api/fio';
import { FioProductionLine, FioProductionResponse, FioPlanetProduction, ProductionLineOrder } from '@/lib/types';
import { LinearProgress } from '@mui/material';
import { useProductionOrderProgress, formatDurationMs } from '@/lib/hooks/useProductionOrderProgress';
import RefreshIcon from '@mui/icons-material/Refresh'

// Define page states
type ProductionPageStage = 'initialChoice' | 'loading' | 'planetList' | 'planetDetails' | 'notFound';

// TODO: Problem with completed orders not disappearing and requeuing new once by a cycle to active orders ( In case FIO breaks import )

export default function ProductionPage() {
  const [stage, setStage] = useState<ProductionPageStage>('initialChoice');
  const [otherPlayerName, setOtherPlayerName] = useState('');
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [planetsForUser, setPlanetsForUser] = useState<FioPlanetProduction[]>([]);
  const [selectedPlanet, setSelectedPlanet] = useState<FioPlanetProduction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State for dynamic polling interval and countdown
  const [nextInterval, setNextInterval] = useState<number | null>(null);
  const [countdownTime, setCountdownTime] = useState<number | null>(null);

  const [fioApiKey] = useLocalStorage('fioApiKey', '');

  // Function to fetch the initial list of all planets' production for a user
  const fetchOverview = async (userName: string | null) => {
    if (!userName) return;
    if (!fioApiKey) {
      setErrorMessage('FIO API Key is not set. Please go to Settings to configure it.');
      setStage('initialChoice');
      return;
    }

    setStage('loading');
    setErrorMessage(null);

    try {
      const rawProductionData: FioProductionResponse = await fetchUserProductionOverview(userName, fioApiKey);

      // Group production lines by planet
      const planetsMap = new Map<string, FioPlanetProduction>();
      rawProductionData.forEach(line => {
        if (!planetsMap.has(line.PlanetId)) {
          planetsMap.set(line.PlanetId, {
            id: line.PlanetId,
            name: line.PlanetName,
            naturalId: line.PlanetNaturalId,
            productionLines: [],
          });
        }
        planetsMap.get(line.PlanetId)?.productionLines.push(line);
      });

      const groupedPlanets = Array.from(planetsMap.values());

      if (groupedPlanets.length === 0) {
        setErrorMessage(`No production found for user "${userName}".`);
        setStage('notFound');
        return;
      }

      setPlanetsForUser(groupedPlanets);
      setStage('planetList');
    } catch (error) {
      console.error('Error fetching production overview:', error);
      setErrorMessage(`Failed to fetch production overview: ${error instanceof Error ? error.message : String(error)}`);
      setStage('initialChoice');
    }
  };

  // Function to fetch details for a specific planet's production
  const fetchDetailsForSelectedPlanet = useCallback(async (userName: string | null, planetId: string) => {
    if (!userName || !planetId) return;
    if (!fioApiKey) {
      setErrorMessage('FIO API Key is not set. Please go to Settings to configure it.');
      setStage('initialChoice');
      return;
    }

    setStage('loading');
    setErrorMessage(null);

    try {
      const data = await fetchPlanetProductionDetails(userName, fioApiKey, planetId);
      if (data.length > 0) {
        console.log(data)
        planetsForUser.map( planet => {
          if (planet.id === planetId) {
            planet.productionLines = data
            return planet
          }
        })
        if(selectedPlanet) {
          const planetCurr = selectedPlanet
          planetCurr.productionLines = data
          
          setSelectedPlanet(planetCurr)
        }
        setStage('planetDetails');
      } else {
        setErrorMessage(`No production data found for planet ID: ${planetId}. It might have been deleted or renamed.`);
        setSelectedPlanet(null);
        setStage('planetList');
      }
    } catch (error) {
      console.error('Error fetching planet production details:', error);
      setErrorMessage(`Failed to refresh planet details: ${error instanceof Error ? error.message : String(error)}`);
      // For now, go back to the planet list if details refresh fails
      setStage('planetList');
    }
  }, [fioApiKey]);

  // *** Dynamic Polling Logic ***
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    const setupPolling = async () => {
      if (selectedUserName && selectedPlanet && stage === 'planetDetails') {
        console.log('Initiating immediate fetch for planet details.');

        // Calculate the next optimal polling interval
        let nextPollInterval = 30000;

        // If we have details, calculate the smallest remaining time and apply batching logic
        if (selectedPlanet) {
            const activeRemainingTimes: number[] = [];

            // Helper to calculate remaining time for a single order
            const calculateRemainingTime = (order: ProductionLineOrder): number => {
                if (!order.CompletionEpochMs) return Infinity; // No completion time means it's not active/scheduled
                const now = Date.now();
                return Math.max(0, order.CompletionEpochMs - now);
            };

            // Collect all positive remaining times from all orders
            for (const line of selectedPlanet.productionLines) {
                for (const order of line.Orders) {
                    const remaining = calculateRemainingTime(order);
                    if (remaining > 0 && remaining !== Infinity) {
                        activeRemainingTimes.push(remaining);
                    }
                }
            }

            activeRemainingTimes.sort((a, b) => a - b); // Sort times in ascending order

            if (activeRemainingTimes.length > 0) {
                let targetCompletionTimeMs = activeRemainingTimes[0]; // Start with the absolute earliest completion

                // Check for other completions within a 1-minute window of the current target
                const batchWindowMs = 60 * 1000;

                for (let i = 1; i < activeRemainingTimes.length; i++) {
                    // If the current time is within the batch window relative to the *initial* target,
                    // update the target to this later time within the batch.
                    if (activeRemainingTimes[i] - activeRemainingTimes[0] <= batchWindowMs) {
                        targetCompletionTimeMs = activeRemainingTimes[i]; // Take the latest time within this 1-minute "batch"
                    } else {
                        // This completion is outside the current 1-minute window, so we've found our batch
                        break;
                    }
                }
                nextPollInterval = targetCompletionTimeMs + 5000
            }
        }
        
        console.log(`Setting up polling interval: ${nextPollInterval / 1000}s`);
        setNextInterval(nextPollInterval); 

        if (intervalId) {
            clearInterval(intervalId);
        }
        intervalId = setInterval(() => {
            console.log(`Polling for planet details (dynamic interval: ${nextPollInterval / 1000}s)...`);
            fetchDetailsForSelectedPlanet(selectedUserName, selectedPlanet.name);
        }, nextPollInterval);

      } else {
        console.log('Skipping planet details logic. Conditions not met:', { selectedUserName, selectedPlanet, stage });
      }
    };

    setupPolling(); // Call the async function to setup polling

    // Cleanup function for the interval
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('Polling interval cleared during cleanup.');
      }
    };
  }, [selectedUserName, selectedPlanet, stage,]);


  // useEffect for the countdown timer display
  useEffect(() => {
    let countdownTimerId: NodeJS.Timeout | undefined;

    if (nextInterval === null || nextInterval <= 0) {
      setCountdownTime(0);
      return;
    }

    const initialCountdownSeconds = Math.ceil(nextInterval / 1000);
    setCountdownTime(initialCountdownSeconds);

    countdownTimerId = setInterval(() => {
      setCountdownTime(prevTime => {
        if (prevTime === null || prevTime <= 1) {
          clearInterval(countdownTimerId);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerId) {
        clearInterval(countdownTimerId);
      }
    };
  }, [nextInterval]);

  // Effect to trigger initial overview fetch when selectedUserName is set or stage changes to planetList
  useEffect(() => {
    if (selectedUserName && stage === 'planetList' && planetsForUser.length === 0) {
      fetchOverview(selectedUserName);
    }
  }, [selectedUserName, stage]);

  const handleMyProduction = () => {
    setSelectedUserName('XSUPEFLY')
    fetchOverview('XSUPEFLY');
  };

  const handleOtherPlayerProduction = () => {
    if (otherPlayerName.trim()) {
      setSelectedUserName(otherPlayerName)
      fetchOverview(otherPlayerName.trim());
    } else {
      setErrorMessage('Please enter a player name.');
      setStage('notFound');
    }
  };

  const handleSelectPlanet = (planet: FioPlanetProduction) => {
    setSelectedPlanet(planet);
    setStage('planetDetails');
  };

  const handleBackToPlanetList = () => {
    setSelectedPlanet(null);
    setStage('planetList');
  };

  const getProductionLineStatus = (line: FioProductionLine) => {
    if (line.Orders.length === 0) {
      return 'Idle';
    }
    const activeOrders = line.Orders.filter(order => order.IsHalted === false && order.CompletedPercentage !== 1);
    if (activeOrders.length > 0) {
      return 'Running';
    }
    return 'Completed/Halted';
  };

  // Render Logic based on stage
  const renderContent = () => {
    switch (stage) {
      case 'initialChoice':
        return (
          <Box id="prod-initial-choice-root" sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 3,
            minWidth: '100%',
            minHeight: '100%'
          }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
              View Production Data
            </Typography>

            <Grid
              container
              id="prod-initial-choice-grid"
              spacing={4}
              alignItems="stretch"
              sx={{
                flexGrow: 1,
                width: '100%',
                height: '100%',
              }}
            >
              <Grid item xs={12} md={6} sx={{ flexGrow: 1 }}>
                <Paper
                  elevation={3}
                  id="prod-my-production-box"
                  sx={{
                    p: 4,
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(5, 5, 5, 1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(150, 150, 150, 0.3)',
                    borderRadius: '8px',
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    My Production
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleMyProduction}
                    sx={{ mt: 2 }}
                  >
                    Show My Production
                  </Button>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6} sx={{ flexGrow: 1 }}>
                <Paper
                  elevation={3}
                  id="prod-other-player-box"
                  sx={{
                    p: 4,
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(5, 5, 5, 1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(150, 150, 150, 0.3)',
                    borderRadius: '8px',
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    View Other Player's Production
                  </Typography>
                  <TextField
                    label="Player Name"
                    variant="outlined"
                    fullWidth
                    value={otherPlayerName}
                    onChange={(e) => setOtherPlayerName(e.target.value)}
                    sx={{ mt: 2, mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={handleOtherPlayerProduction}
                    disabled={!otherPlayerName.trim()}
                  >
                    Show Production
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );

      case 'loading':
        return (
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>Loading Production Data...</Typography>
          </Box>
        );

      case 'notFound':
        return (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3 }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage || 'Production data not found.'}
            </Alert>
            <Button variant="contained" onClick={() => setStage('initialChoice')}>
              Go Back
            </Button>
          </Box>
        );

      case 'planetList':
        return (
          <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
              Production for {selectedUserName}
            </Typography>
            <Grid container spacing={3}>
              {planetsForUser.map(planet => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={planet.id}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      // Glassmorphism styles for planet cards
                      backgroundColor: 'rgba(5, 5, 5, 1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(150, 150, 150, 0.3)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      }
                    }}
                    onClick={() => handleSelectPlanet(planet)}
                  >
                    <Box>
                      <Typography variant="h6" gutterBottom>{planet.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Natural ID: {planet.naturalId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Production Lines: {planet.productionLines.length}
                      </Typography>
                      {planet.productionLines.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Active Production:
                          </Typography>
                          {planet.productionLines.slice(0, 2).map((line, index) => ( // Show first 2 lines
                            <Typography key={index} variant="body2" color="text.secondary">
                              - {line.Type} ({getProductionLineStatus(line)})
                            </Typography>
                          ))}
                          {planet.productionLines.length > 2 && (
                            <Typography variant="body2" color="text.secondary">
                              ...and {planet.productionLines.length - 2} more
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                    <Button variant="outlined" size="small" sx={{ mt: 2 }}>
                      View Details
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button variant="outlined" onClick={() => setStage('initialChoice')}>
                Choose Another User
              </Button>
            </Box>
          </Box>
        );

      case 'planetDetails':
        if (!selectedPlanet) return null;

        // Collect all unique recipe names from active orders across all lines on THIS specific selected planet
        const activeRecipeNamesOnPlanet = new Set<string>();
        selectedPlanet.productionLines.forEach(line => {
          (line.Orders ?? []).filter(
            order =>
              order.StartedEpochMs !== null &&
              !order.IsHalted &&
              order.CompletedPercentage! < 1 &&
              (order.CompletionEpochMs === null || order.CompletionEpochMs > Date.now())
          ).forEach(order => {
            activeRecipeNamesOnPlanet.add(order.StandardRecipeName);
          });
        });


        return (
          <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <IconButton onClick={handleBackToPlanetList} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                Production on {selectedPlanet.name} ({selectedPlanet.naturalId})
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column'}}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  // Call the new specific fetch function for refreshing planet details
                  onClick={() => fetchDetailsForSelectedPlanet(selectedUserName, selectedPlanet.id)}
                  sx={{ ml: 2 }}
                  >
                  Refresh
                </Button>
                <Typography component='span' sx={{ flexGrow: 1}}>
                  Refresh in {formatDurationMs(countdownTime!*1000)}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {selectedPlanet.productionLines.length === 0 ? (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
                    No active production lines found on this planet.
                  </Typography>
                </Grid>
              ) : (
                selectedPlanet.productionLines.map((line, index) => {
                  // Defensive check: Ensure line.Orders is an array before filtering
                  const safeOrders = line.Orders ?? [];

                  // Filter orders for Active and Queued lists
                  const activeOrders = safeOrders.filter(
                    order =>
                      order.StartedEpochMs !== null && // Has started
                      !order.IsHalted && // Not halted
                      order.CompletedPercentage! < 1 && // Not 100% completed
                      (order.CompletionEpochMs !== null || order.CompletionEpochMs! > Date.now()) // Completion time has not passed
                  )

                  const queuedOrders = safeOrders.filter(
                    order => order.StartedEpochMs === null && !order.IsHalted // Has not started AND not halted
                  ).sort((a, b) => (a.CreatedEpochMs || 0) - (b.CreatedEpochMs || 0)); // Sort queued by creation time


                  return (
                    <Grid item xs={12} sm={6} md={4} key={line.ProductionLineId || index}>
                      <Paper
                        elevation={2}
                        sx={{
                          p: 2,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          backgroundColor: 'rgba(5, 5, 5, 1)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(150, 150, 150, 0.3)',
                          borderRadius: '8px',
                        }}
                      >
                        <Typography variant="h6" gutterBottom>{line.Type}</Typography>
                        <Typography variant="body1">
                          **Status:** {getProductionLineStatus(line)}
                        </Typography>
                        <Typography variant="body1">
                          **Capacity:** {line.Capacity}
                        </Typography>
                        <Typography variant="body1">
                          **Efficiency:** {(line.Efficiency * 100).toFixed(2)}%
                        </Typography>
                        <Typography variant="body1">
                          **Condition:** {(line.Condition * 100).toFixed(2)}%
                        </Typography>

                        {/* Scrollable area for orders */}
                        <Box sx={{
                          mt: 2,
                          flexGrow: 1,
                          overflowY: 'auto',
                          pr: 1,
                        }}>
                          {/* Active Orders Section */}
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                            Active Orders ({activeOrders.length}):
                          </Typography>
                          {activeOrders.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No active orders.</Typography>
                          ) : (
                            activeOrders.map((order, orderIndex) => (
                              <ProductionOrderDetails key={order.ProductionLineOrderId || orderIndex} order={order} />
                            ))
                          )}

                          {/* Queued Orders Section */}
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, mt: 2, color: 'text.primary' }}>
                            Queue ({queuedOrders.length}):
                          </Typography>
                          {queuedOrders.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">No queued orders.</Typography>
                          ) : (
                            queuedOrders.map((order, orderIndex) => {
                              // Highlight if this queued order's recipe is NOT active anywhere on this planet
                              const isPotentiallyStuck = !activeRecipeNamesOnPlanet.has(order.StandardRecipeName);
                              return (
                                <ProductionOrderDetails
                                  key={order.ProductionLineOrderId || orderIndex}
                                  order={order}
                                  isPotentiallyStuck={isPotentiallyStuck}
                                />
                              );
                            })
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })
              )}
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {renderContent()}
    </Box>
  );
}

// ProductionOrderDetails component
interface ProductionOrderDetailsProps {
  order: ProductionLineOrder;
  isPotentiallyStuck?: boolean;
}

const ProductionOrderDetails: React.FC<ProductionOrderDetailsProps> = ({ order, isPotentiallyStuck }) => {
  const { percentage, timeRemainingMs, status } = useProductionOrderProgress(order);

  let progressColor: "primary" | "secondary" | "error" | "success" | "info" | "warning" = "primary";
  if (status === 'completed') {
    progressColor = "success";
  } else if (status === 'halted') {
    progressColor = "error";
  } else if (percentage >= 0.95 && status === 'running') {
    progressColor = "warning";
  } else if (status === 'not_started') {
    progressColor = "info";
  }



  return (
    <Box sx={{
      mt: 1,
      mb: 2,
      p: 1.5,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '6px',
      backgroundColor: isPotentiallyStuck && status === 'not_started'
        ? 'rgba(255, 165, 0, 0.1)'
        : 'rgba(255, 255, 255, 0.05)',
      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
      borderColor: isPotentiallyStuck && status === 'not_started' ? 'orange' : 'rgba(255, 255, 255, 0.1)',
    }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        Recipe: {order.StandardRecipeName} ({order.Recurring ? 'Recurring' : 'One-time'})
      </Typography>
      {isPotentiallyStuck && status === 'not_started' && (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 0.5 }}>
          No active order of this recipe on this planet. Missing materials?
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary">
        Status: {status.charAt(0).toUpperCase() + status.slice(1)}
      </Typography>

      <Typography variant="body2" sx={{ mt: 0.5 }}>
        Inputs: {order.Inputs.map(i => `${i.MaterialAmount} ${i.MaterialTicker}`).join(', ')}
      </Typography>
      <Typography variant="body2">
        Outputs: {order.Outputs.map(o => `${o.MaterialAmount} ${o.MaterialTicker}`).join(', ')}
      </Typography>

      {/* Progress Bar */}
      <Box sx={{ width: '100%', mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          Progress: {(percentage * 100).toFixed(2)}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={percentage * 100}
          color={progressColor}
          sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Time Remaining: {formatDurationMs(timeRemainingMs)}
        </Typography>
      </Box>

      {order.ProductionFee > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Fee: {order.ProductionFee} {order.ProductionFeeCurrency}
          </Typography>
      )}
    </Box>
  );
};