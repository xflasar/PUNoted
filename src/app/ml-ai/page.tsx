// src/app/ml-ai/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, Select, InputLabel, FormControl,
  CircularProgress, Alert, Grid, Paper, List
} from '@mui/material';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { backendApiClient } from '@/lib/api/backend'; // For calling your Flask backend
import {
  fetchUserWorkforce,
  fetchUserProductionOverview,
  fetchUserStorage,
  fetchAllMarketOverview,
  fetchUserWarehouses,
  fetchUserSites,
} from '@/lib/api/fio'; // For calling FIO API directly from client
import {
  FioWorkforceWrapper, FioProductionResponse, FioStorageUnit, FioExchangeAllResponse,
  ExpansionRecommendation, OptimizationInsight,
  FioWarehouse,
  FioSite
} from '@/lib/types';


// Define the structure of the bundled FIO dynamic data
interface FioDynamicDataBundle {
  planets: FioWorkforceWrapper[];
  productionOverview: FioProductionResponse;
  storage: FioStorageUnit[];
  warehouses: FioWarehouse[];
  sites: FioSite[];
  exchangeAllAvg: FioExchangeAllResponse;
}

export default function MLAndAIPage() {
  // User credentials from local storage
  const [userName, setUserName] = useLocalStorage<string | null>('userName', null);
  const [fioApiKey, setFioApiKey] = useLocalStorage<string | null>('fioApiKey', null);

  // Expansion Planner State
  const [desiredMaterialTicker, setDesiredMaterialTicker] = useState<string>('');
  const [targetProductionRate, setTargetProductionRate] = useState<number | ''>(100);
  const [expansionOptimizationGoal, setExpansionOptimizationGoal] = useState<string>('cost');
  const [expansionRecommendations, setExpansionRecommendations] = useState<ExpansionRecommendation[] | null>(null);
  const [expansionLoading, setExpansionLoading] = useState<boolean>(false);
  const [expansionError, setExpansionError] = useState<string | null>(null);

  // Company Optimizer State
  const [analysisScope, setAnalysisScope] = useState<string>('all_company');
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>('');
  const [optimizationInsights, setOptimizationInsights] = useState<OptimizationInsight[] | null>(null);
  const [optimizationSummary, setOptimizationSummary] = useState<string | null>(null);
  const [optimizationLoading, setOptimizationLoading] = useState<boolean>(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);

  // FIO Dynamic Data Fetching State
  const [isFetchingFioData, setIsFetchingFioData] = useState<boolean>(false);
  const [fioDataError, setFioDataError] = useState<string | null>(null);
  const [userPlanetsForDropdown, setUserPlanetsForDropdown] = useState<{ id: string; name: string; }[]>([]);


  // Function to fetch and bundle FIO dynamic data
  const fetchAndBundleFioData = useCallback(async (): Promise<FioDynamicDataBundle | null> => {
    if (!userName || !fioApiKey) {
      setFioDataError("Please set your FIO Username and API Key in the settings.");
      return null;
    }

    setIsFetchingFioData(true);
    setFioDataError(null); // Clear previous errors

    try {
      // Use Promise.all to fetch data concurrently
      const [
        workforceData,
        productionOverviewData,
        storageData,
        warehouses,
        sites,
        exchangeAllAvgData
      ] = await Promise.all([
        fetchUserWorkforce(userName, fioApiKey),
        fetchUserProductionOverview(userName, fioApiKey),
        fetchUserStorage(userName, fioApiKey),
        fetchUserWarehouses(userName, fioApiKey),
        fetchUserSites(userName, fioApiKey),
        fetchAllMarketOverview() // No API key needed for this public endpoint
      ]);

      // Populate planets for dropdown from workforce data
      const planetsFromWorkforce = workforceData.map(p => ({
        id: p.PlanetId,
        name: p.PlanetName
      }));
      setUserPlanetsForDropdown(planetsFromWorkforce);

      return {
        planets: workforceData, // Workforce data contains planet info
        productionOverview: productionOverviewData,
        storage: storageData,
        warehouses,
        sites,
        exchangeAllAvg: exchangeAllAvgData,
      };
    } catch (error: any) {
      console.error("Error fetching FIO dynamic data:", error);
      let errorMessage = "Failed to fetch FIO data. ";
      if (error.response && error.response.status === 401) {
        errorMessage += "Unauthorized: Please check your FIO API key.";
      } else if (error.message) {
        errorMessage += error.message;
      }
      setFioDataError(errorMessage);
      return null;
    } finally {
      setIsFetchingFioData(false);
    }
  }, [userName, fioApiKey]); // Dependencies for useCallback


  // Handle Expansion Planner form submission
  const handleExpansionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userName || !fioApiKey) {
      setExpansionError("Please set your FIO Username and API Key in the settings.");
      return;
    }
    if (!desiredMaterialTicker || targetProductionRate === '') {
      setExpansionError("Please fill in all expansion fields.");
      return;
    }

    setExpansionLoading(true);
    setExpansionError(null);
    setExpansionRecommendations(null);

    const fioDynamicData = await fetchAndBundleFioData();
    if (!fioDynamicData) {
      setExpansionLoading(false);
      return; // Error already set by fetchAndBundleFioData
    }

    try {
      const response = await backendApiClient.post('/api/ml/expand', {
        userName,
        fioApiKey, // Still send API key, backend might need it for future dynamic calls or internal validation
        desiredMaterialTicker,
        targetProductionRate: Number(targetProductionRate),
        optimizationGoal: expansionOptimizationGoal,
        // Bundle and send the fetched FIO dynamic data
        fioDynamicData: {
          workforce: fioDynamicData.planets,
          productionOverview: fioDynamicData.productionOverview,
          storage: fioDynamicData.storage,
          warehouses: fioDynamicData.warehouses,
          sites: fioDynamicData.sites,
          exchangeAllAvg: fioDynamicData.exchangeAllAvg
        }
      });
      setExpansionRecommendations(response.data.recommendations);
    } catch (error: any) {
      console.error("Error fetching expansion recommendation:", error);
      let errorMessage = "Failed to get expansion recommendation. ";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage += error.response.data.message;
      } else {
        errorMessage += error.message;
      }
      setExpansionError(errorMessage);
    } finally {
      setExpansionLoading(false);
    }
  };

  // Handle Company Optimizer form submission
  const handleOptimizationSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userName || !fioApiKey) {
      setOptimizationError("Please set your FIO Username and API Key in the settings.");
      return;
    }
    if (analysisScope === 'specific_planet' && !selectedPlanetId) {
      setOptimizationError("Please select a planet for specific analysis.");
      return;
    }

    setOptimizationLoading(true);
    setOptimizationError(null);
    setOptimizationInsights(null);
    setOptimizationSummary(null);

    const fioDynamicData = await fetchAndBundleFioData();
    if (!fioDynamicData) {
      setOptimizationLoading(false);
      return; // Error already set by fetchAndBundleFioData
    }

    try {
      const response = await backendApiClient.post('/api/ml/optimize', {
        userName,
        fioApiKey, // Still send API key
        analysisScope,
        planetId: analysisScope === 'specific_planet' ? selectedPlanetId : undefined,
        // Bundle and send the fetched FIO dynamic data
        fioDynamicData: {
          workforce: fioDynamicData.planets,
          productionOverview: fioDynamicData.productionOverview,
          storage: fioDynamicData.storage,
          exchangeAllAvg: fioDynamicData.exchangeAllAvg
        }
      });
      setOptimizationInsights(response.data.insights);
      setOptimizationSummary(response.data.overallSummary);
    } catch (error: any) {
      console.error("Error fetching optimization insights:", error);
      let errorMessage = "Failed to get optimization insights. ";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage += error.response.data.message;
      } else {
        errorMessage += error.message;
      }
      setOptimizationError(errorMessage);
    } finally {
      setOptimizationLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI-Powered FIO Assistant
      </Typography>

      {(!userName || !fioApiKey) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please set your FIO Username and API Key in the <a href="/settings" style={{ color: 'inherit' }}>Settings</a> page to use these features.
        </Alert>
      )}

      {fioDataError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {fioDataError}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Expansion Planner Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Expansion Planner</Typography>
            <form onSubmit={handleExpansionSubmit}>
              <TextField
                label="Desired Material Ticker (e.g., RAT, MCG)"
                value={desiredMaterialTicker}
                onChange={(e) => setDesiredMaterialTicker(e.target.value)}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Target Production Rate (units/day)"
                type="number"
                value={targetProductionRate}
                onChange={(e) => setTargetProductionRate(Number(e.target.value))}
                fullWidth
                margin="normal"
                required
                inputProps={{ min: 1 }}
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Optimization Goal</InputLabel>
                <Select
                  value={expansionOptimizationGoal}
                  label="Optimization Goal"
                  onChange={(e) => setExpansionOptimizationGoal(e.target.value)}
                >
                  <MenuItem value="cost">Minimize Initial Cost</MenuItem>
                  <MenuItem value="profit">Maximize Long-Term Profit</MenuItem>
                  <MenuItem value="speed">Fastest Setup</MenuItem>
                </Select>
              </FormControl>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                disabled={expansionLoading || optimizationLoading || isFetchingFioData || !userName || !fioApiKey}
              >
                {expansionLoading || isFetchingFioData ? <CircularProgress size={24} /> : "Get Expansion Recommendation"}
              </Button>
              {expansionError && <Alert severity="error" sx={{ mt: 2 }}>{expansionError}</Alert>}
            </form>

            {expansionRecommendations && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6">Recommendations:</Typography>
                {expansionRecommendations.map((rec, index) => (
                  <Box key={index} sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
                    <Typography variant="body1">
                      **Planet:** {rec.planetName} ({rec.planetId})
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      **Reasoning:** {rec.reasoning}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      **Estimated Cost (ICA):** {rec.estimatedCostICA.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      **Buildings to Build:**
                      <List dense>
                        {rec.buildingsToBuild.map((b, bIdx) => (
                          <li key={bIdx}>{b.count} x {b.name} ({b.ticker})</li>
                        ))}
                      </List>
                    </Typography>
                    {rec.requiredInputsDaily && rec.requiredInputsDaily.length > 0 && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        **Estimated Daily Inputs:**
                        <List dense>
                          {rec.requiredInputsDaily.map((input, iIdx) => (
                            <li key={iIdx}>{input.amount.toLocaleString()} {input.name} ({input.ticker})</li>
                          ))}
                        </List>
                      </Typography>
                    )}
                    {rec.estimatedDailyOutput && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        **Estimated Daily Output:** {rec.estimatedDailyOutput.amount.toLocaleString()} {rec.estimatedDailyOutput.ticker}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Company Optimizer Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Company Optimizer</Typography>
            <form onSubmit={handleOptimizationSubmit}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Analysis Scope</InputLabel>
                <Select
                  value={analysisScope}
                  label="Analysis Scope"
                  onChange={(e) => setAnalysisScope(e.target.value)}
                >
                  <MenuItem value="all_company">All Company</MenuItem>
                  <MenuItem value="specific_planet">Specific Planet</MenuItem>
                </Select>
              </FormControl>
              {analysisScope === 'specific_planet' && (
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Select Planet</InputLabel>
                  <Select
                    value={selectedPlanetId}
                    label="Select Planet"
                    onChange={(e) => setSelectedPlanetId(e.target.value)}
                    disabled={userPlanetsForDropdown.length === 0 && !isFetchingFioData}
                  >
                    {isFetchingFioData ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} /> Loading planets...
                      </MenuItem>
                    ) : userPlanetsForDropdown.length > 0 ? (
                      userPlanetsForDropdown.map((planet) => (
                        <MenuItem key={planet.id} value={planet.id}>{planet.name}</MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No planets found. Ensure valid API key.</MenuItem>
                    )}
                  </Select>
                </FormControl>
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                disabled={optimizationLoading || expansionLoading || isFetchingFioData || !userName || !fioApiKey}
              >
                {optimizationLoading || isFetchingFioData ? <CircularProgress size={24} /> : "Analyze Company State"}
              </Button>
              {optimizationError && <Alert severity="error" sx={{ mt: 2 }}>{optimizationError}</Alert>}
            </form>

            {optimizationSummary && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6">Overall Summary:</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{optimizationSummary}</Typography>
                {optimizationInsights && optimizationInsights.length > 0 && (
                  <>
                    <Typography variant="h6">Detailed Insights:</Typography>
                    {optimizationInsights.map((insight, index) => (
                      <Box key={index} sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
                        <Typography variant="body1">
                          **Type:** {insight.type.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          **Description:** {insight.description}
                        </Typography>
                        {insight.recommendation && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            **Recommendation:** {insight.recommendation}
                          </Typography>
                        )}
                        {insight.planetName && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            **Planet:** {insight.planetName}
                          </Typography>
                        )}
                        {insight.materialTicker && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            **Material:** {insight.materialTicker}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}