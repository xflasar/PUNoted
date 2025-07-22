import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardHeader,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Divider,
  Switch, FormControlLabel,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { DashboardData, ContractEntry, ContractConditionSummary } from '../../app/dashboard/page';
import ContractCalendarView from './ContractCalendarView';

export interface ContractEntryWithDisplayDate extends ContractEntry {
  dueDate_timestamp?: number | null;
}

interface ContractsHistoryProps {
  backendData: DashboardData | null;
}

const ContractsHistory: React.FC<ContractsHistoryProps> = ({ backendData }) => {
  const [selectedContractHistory, setSelectedContractHistory] = useState<ContractEntry[] | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);

  // Helper function to determine row color based on contract status
  const getStatusColor = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'FULFILLED':
        return '#367c38ff';
      case 'PARTIALLY_FULFILLED':
        return '#b18504ff';
      case 'CLOSED':
        return '#751d85ff';
      case 'CANCELLED':
        return '#6d197cff'
      case 'TERMINATED':
        return '#992a23ff';
      case 'OPEN':
        return '#0c0396ff'
      default:
        return 'transparent';
    }
  };

  const getConditionStatusColor = (status: string | null, dependenciesMet: boolean | null) => {
    switch(status?.toUpperCase()) {
      case 'FULFILLED':
        return '#367c38ff'
      case 'PENDING':
        if(dependenciesMet){
          return '#0c0396ff'
        } else {
          return 'transparent'
        }
      default:
        return 'transparent';
    }
  }

  // Helper function to format milliseconds into days, hours, minutes, seconds
  const formatDuration = (millis: number | undefined | null): string => {
    if (millis === null || millis === undefined) return 'N/A';
    const totalSeconds = Math.floor(millis / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
  };

  // Helper function for countdown
  const formatCountdown = (targetTimestamp: number | null): string => {
    if (!targetTimestamp) return 'N/A';
    const now = Date.now();
    const remainingMillis = targetTimestamp - now;

    if (remainingMillis <= 0) return 'Expired';

    const totalSeconds = Math.floor(remainingMillis / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
  };

  // Helper function to check if a condition's dependencies are fulfilled
  const isDependencyFulfilled = (
    condition: ContractConditionSummary,
    allConditionsInEntry: ContractConditionSummary[]
  ): boolean => {
    if (!condition.dependencies || condition.dependencies.length === 0) {
      return true; // No dependencies, so it's fulfilled by default
    }

    return condition.dependencies.every(depId => {
      const dependentCondition = allConditionsInEntry.find(c => (c as any).id === depId);
      // A dependency is considered fulfilled if it exists and its status is 'FULFILLED'
      return dependentCondition && dependentCondition.status?.toUpperCase() === 'FULFILLED';
    });
  };

  // Function to get status priority for sorting
  const getStatusPriority = (status: string | null): number => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 1;
      case 'CLOSED':
        return 2;
      case 'PARTIALLY_FULFILLED':
        return 3;
      case 'FULFILLED':
        return 4;
      default:
        return 99; // Low priority for unknown statuses
    }
  };

  // Process contracts to group them by localId and get the latest status for the main table
  const processedContracts = useMemo(() => {
    const contractsMap = new Map<string, ContractEntry[]>();

    if (backendData?.history_data?.contracts) {
      // Iterate through all contract entries
      Object.values(backendData.history_data.contracts).forEach(contractEntries => {
        contractEntries.forEach(contract => {
          console.log(contract)
          if (contract.localId) {
            if (!contractsMap.has(contract.localId)) {
              contractsMap.set(contract.localId, []);
            }
            contractsMap.get(contract.localId)?.push(contract);
          }
        });
      });
    }

    // For each grouped contract, sort by fulfillment and then timestamp to get the "most latest and most fulfilled" state
    const latestContracts: ContractEntryWithDisplayDate[] = [];
    contractsMap.forEach(history => {
      history.forEach(contract => {
        let fulfilledConditionsCount = 0;
        if (contract.conditions_summary && contract.conditions_summary.length > 0) {
          contract.conditions_summary.forEach(condition => {
            if (condition.status?.toUpperCase() === 'FULFILLED') {
              fulfilledConditionsCount++;
            }
          });
          (contract as ContractEntryWithDisplayDate).fulfillmentPercentage = (fulfilledConditionsCount / contract.conditions_summary.length) * 100;
        } else {
          (contract as ContractEntryWithDisplayDate).fulfillmentPercentage = 0;
        }
      });

      // Sort the history:
      // 1. By fulfillment percentage (descending)
      // 2. By overall_timestamp (descending)
      // 3. By status priority (ascending, as defined by getStatusPriority)
      history.sort((a, b) => {
        const fulfillmentA = (a as ContractEntryWithDisplayDate).fulfillmentPercentage || 0;
        const fulfillmentB = (b as ContractEntryWithDisplayDate).fulfillmentPercentage || 0;

        if (fulfillmentA !== fulfillmentB) {
          return fulfillmentB - fulfillmentA;
        }

        const timestampA = a.overall_timestamp ? new Date(a.overall_timestamp).getTime() : 0;
        const timestampB = b.overall_timestamp ? new Date(b.overall_timestamp).getTime() : 0;

        if (timestampA !== timestampB) {
          return timestampB - timestampA;
        }

        const statusPriorityA = getStatusPriority(a.status);
        const statusPriorityB = getStatusPriority(b.status);
        return statusPriorityA - statusPriorityB;
      });

      history.forEach(h => {
        console.log(h)
      })

      const latestContract = history[0];

      let earliestBreachTimestamp: number | null = null;

      if (latestContract.conditions_summary && latestContract.overall_timestamp) {
        const contractBaseTimestamp = new Date(latestContract.overall_timestamp).getTime();
        
        latestContract.conditions_summary.forEach(condition => {
          // only consider 'OPEN' or 'PENDING' conditions with fulfilled dependencies for the main effective due date
          const isConditionActive = ['OPEN', 'PENDING'].includes(condition.status?.toUpperCase() || '');
          const hasFulfilledDependencies = isDependencyFulfilled(condition, latestContract.conditions_summary);

          if (isConditionActive && hasFulfilledDependencies) {
            const deadlineOffset = (condition as any).deadlineDuration?.millis;

            if (deadlineOffset !== null && deadlineOffset !== undefined && deadlineOffset > 0) {
              const breachTimestamp = contractBaseTimestamp + deadlineOffset;
              if (earliestBreachTimestamp === null || breachTimestamp < earliestBreachTimestamp) {
                earliestBreachTimestamp = breachTimestamp;
              }
            }
          }
        });
      }

      // Assign the calculated effective due date to displayDueDateTimestamp
      // If no relevant conditions, fall back to the contract's original dueDate_timestamp
      latestContract.dueDate_timestamp = earliestBreachTimestamp !== null ? earliestBreachTimestamp : (latestContract.dueDate_timestamp || null);
      
      latestContracts.push(latestContract);
    });

    // Sort the final list of latest contracts for the main table display by status and then by overall_timestamp
    return {
      latestContracts: latestContracts.sort((a, b) => {
        const statusPriorityA = getStatusPriority(a.status);
        const statusPriorityB = getStatusPriority(b.status);

        if (statusPriorityA !== statusPriorityB) {
          return statusPriorityA - statusPriorityB; // Sort by status priority
        }

        // If statuses are the same, sort by overall_timestamp in descending order (latest first)
        const timestampA = a.overall_timestamp ? new Date(a.overall_timestamp).getTime() : 0;
        const timestampB = b.overall_timestamp ? new Date(b.overall_timestamp).getTime() : 0;
        return timestampB - timestampA;
      }),
      fullHistoryMap: contractsMap // Keep the full history for modal display
    };
  }, [backendData]);

  const handleOpenModal = (localId: string) => {
    // Retrieve the full history for the selected localId 
    // We might better just sort it in the processedContracts function
    const history = processedContracts.fullHistoryMap.get(localId);
    if (history) {
      // Sort the history for the modal to ensure chronological order (oldest to newest)
      const sortedHistory = [...history].sort((a, b) => {
        const statusPriorityA = getStatusPriority(a.status);
        const statusPriorityB = getStatusPriority(b.status);

        if (statusPriorityA !== statusPriorityB) {
          return statusPriorityA - statusPriorityB; // Sort by status priority
        }

        const timestampA = a.overall_timestamp ? new Date(a.overall_timestamp).getTime() : 0;
        const timestampB = b.overall_timestamp ? new Date(b.overall_timestamp).getTime() : 0;
        return timestampA - timestampB; // Ascending order for history
      });
      setSelectedContractHistory(sortedHistory);
      setOpenModal(true);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedContractHistory(null);
  };

  // Get the latest contract entry from the history for general info in modal
  const latestContractInModal = selectedContractHistory ? selectedContractHistory[selectedContractHistory.length - 1] : null;

  // State for live countdown in modal
  const [countdown, setCountdown] = useState<string>('N/A');

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (openModal && latestContractInModal?.dueDate_timestamp) {
      intervalId = setInterval(() => {
        setCountdown(formatCountdown(latestContractInModal.dueDate_timestamp!));
      }, 1000);
    } else {
      setCountdown('N/A');
    }
    return () => clearInterval(intervalId);
  }, [openModal, latestContractInModal?.dueDate_timestamp]);

  return (
    <Grid item xs={12} sx={{ mb: 3 }}>
      <Card elevation={3} sx={{ borderRadius: '12px', bgcolor: 'background.paper', color: 'text.primary' }}>
        <CardHeader
          title={
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Recent Contracts (PUCExt Data)
            </Typography>
          }
          action={
            <FormControlLabel
              control={
                <Switch
                  checked={showCalendarView}
                  onChange={(event) => setShowCalendarView(event.target.checked)}
                  name="calendarViewToggle"
                  color="primary"
                />
              }
              label={showCalendarView ? "Calendar View" : "Table View"}
              sx={{ color: 'text.primary' }}
            />
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0, maxHeight: '500px', overflowY: 'auto' }}> {/* Scrollable content */}
          {showCalendarView ? (
            <ContractCalendarView
              contracts={processedContracts.latestContracts}
              onContractClick={handleOpenModal}
            />
          ) : (
            processedContracts.latestContracts.length > 0 ? (
              <TableContainer component={Paper} elevation={1} sx={{ borderRadius: '8px', overflowX: 'auto', bgcolor: 'background.paper' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'primary.dark' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Local ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Partner</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Effective Due Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {processedContracts.latestContracts.map((contract: ContractEntryWithDisplayDate, index: number) => (
                      <TableRow
                        key={`${contract.localId}-${index}`}
                        hover
                        onClick={() => handleOpenModal(contract.localId!)}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          cursor: 'pointer',
                          backgroundColor: getStatusColor(contract.status),
                          '&:hover': {
                            filter: 'brightness(1.2)',
                          }
                        }}
                      >
                        <TableCell><Typography variant="body2" color="text.secondary">{contract.localId || 'N/A'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{contract.name || 'N/A'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{contract.partner_name || 'N/A'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{contract.status || 'N/A'}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {contract.dueDate_timestamp ? new Date(contract.dueDate_timestamp).toLocaleString() : 'N/A'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary" sx={{ mt: 2 }}>No contract data found from PUCExt Data.</Typography>
            )
          )}
        </CardContent>
      </Card>

      {/* Contract Details Modal */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderRadius: '12px',
            boxShadow: '0px 8px 24px rgba(0,0,0,0.5)',
            border: '1px solid #424242',
          }
        }}
      >
        <DialogTitle sx={{
          m: 0, p: 2,
          bgcolor: 'primary.dark',
          color: 'text.primary',
          borderBottom: '1px solid #424242',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 'bold',
        }}>
          Contract Details: {latestContractInModal?.name || 'N/A'} (ID: {latestContractInModal?.localId || 'N/A'})
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{ color: 'text.primary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, maxHeight: '60vh', overflowY: 'auto', bgcolor: 'background.default' }}>
          {latestContractInModal && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.light' }}>Latest Information</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Party:</strong> {latestContractInModal.party || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Partner:</strong> {latestContractInModal.partner_name || 'N/A'} ({latestContractInModal.partner_code || 'N/A'})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Status:</strong> {latestContractInModal.status || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Original Due Date:</strong> {latestContractInModal.dueDate_timestamp ? new Date(latestContractInModal.dueDate_timestamp).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Calculated Effective Due Date:</strong> {latestContractInModal.dueDate_timestamp ? new Date(latestContractInModal.dueDate_timestamp).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Countdown:</strong> {countdown}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Date Created:</strong> {latestContractInModal.date_timestamp ? new Date(latestContractInModal.date_timestamp).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Preamble:</strong> {latestContractInModal.preamble || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3, borderColor: 'divider' }} />

              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.light' }}>Contract History</Typography>
              {selectedContractHistory && selectedContractHistory.length > 0 ? (
                <Box>
                  {selectedContractHistory.map((contractEntry, i) => (
                    <Accordion
                      key={i}
                      sx={{
                        mb: 1.5,
                        borderRadius: '10px',
                        bgcolor: 'background.paper',
                        borderColor: 'divider',
                        boxShadow: '0px 2px 8px rgba(0,0,0,0.3)',
                        '&:before': { display: 'none' },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
                        aria-controls={`panel${i}-content`}
                        id={`panel${i}-header`}
                        sx={{
                          bgcolor: '#2a2a2a',
                          borderRadius: '10px 10px 0 0',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          minHeight: '48px',
                          '&.Mui-expanded': {
                            minHeight: '48px',
                          },
                          '& .MuiAccordionSummary-content': {
                            margin: '12px 0',
                            '&.Mui-expanded': {
                              margin: '12px 0',
                            },
                          },
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          Update at: {contractEntry.overall_timestamp ? new Date(contractEntry.overall_timestamp).toLocaleString() : 'N/A'}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: '0 0 10px 10px' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <strong>Status:</strong> {contractEntry.status || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <strong>Due Date:</strong> {contractEntry.dueDate_timestamp ? new Date(contractEntry.dueDate_timestamp).toLocaleString() : 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Preamble:</strong> {contractEntry.preamble || 'N/A'}
                        </Typography>

                        {contractEntry.conditions_summary.length > 0 && (
                          <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 0.5 }}>Conditions:</Typography>
                            <Box sx={{ pr: 1 }}>
                              {contractEntry.conditions_summary.map((condition, j) => {
                                // Calculate individual condition countdown
                                const conditionTargetTimestamp = (contractEntry.overall_timestamp && (condition as any).deadlineDuration?.millis)
                                  ? new Date(contractEntry.overall_timestamp).getTime() + (condition as any).deadlineDuration.millis
                                  : null;
                                
                                const dependenciesFulfilled = isDependencyFulfilled(condition, contractEntry.conditions_summary);

                                return (
                                  <Box key={j} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: getConditionStatusColor(condition.status, dependenciesFulfilled), borderRadius: '4px', backgroundColor: getConditionStatusColor(condition.status, dependenciesFulfilled) }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                      <strong>Type:</strong> {condition.type || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                      <strong>Status:</strong> {condition.status || 'N/A'}
                                    </Typography>
                                    {(condition as any).quantity && (condition as any).quantity.material && (
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        <strong>Material:</strong> {(condition as any).quantity.material.ticker || (condition as any).quantity.material.name} ({(condition as any).quantity.amount?.toLocaleString() || 'N/A'})
                                      </Typography>
                                    )}
                                    {((condition as any).amount && (condition as any).amount.amount) ? (
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        <strong>Amount:</strong> {(condition as any).amount.amount.toLocaleString() || 'N/A'} {(condition as any).amount.currency || ''}
                                      </Typography>
                                    ) : (condition.amount && (
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        <strong>Amount:</strong> {condition.amount.toLocaleString() || 'N/A'} {condition.currency || ''}
                                      </Typography>
                                    ))}
                                    {(condition.address_system_name || condition.address_planet_station_name) && (
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        <strong>Address:</strong> {condition.address_planet_station_name || 'N/A'} ({condition.address_system_name || 'N/A'})
                                      </Typography>
                                    )}
                                    {condition.price_amount && (
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        <strong>Price:</strong> {condition.price_amount?.toLocaleString() || 'N/A'} {condition.price_currency || ''}
                                      </Typography>
                                    )}
                                    {condition.reputationChange && (
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        <strong>Reputation Change:</strong> {condition.reputationChange?.toLocaleString() || 'N/A'}
                                      </Typography>
                                    )}
                                    {(condition as any).deadlineDuration?.millis && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            <strong>Deadline Duration:</strong> {formatDuration((condition as any).deadlineDuration.millis)}
                                        </Typography>
                                    )}
                                    {['OPEN', 'PENDING'].includes(condition.status?.toUpperCase() || '') && dependenciesFulfilled ? (
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        <strong>Time to Breach:</strong> {formatCountdown(conditionTargetTimestamp)}
                                      </Typography>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        <strong>Time to Breach:</strong> {dependenciesFulfilled ? 'N/A (Not Active)' : 'Dependency not met'}
                                      </Typography>
                                    )}
                                    {(condition as any).address?.lines && (condition as any).address.lines.length > 0 && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            <strong>Address Lines:</strong> {
                                                (condition as any).address.lines.map((line: any) => 
                                                    `${line.entity?.name || 'N/A'} (${line.type || 'N/A'})`
                                                ).join(', ')
                                            }
                                        </Typography>
                                    )}
                                    {(condition as any).autoProvisionStoreId && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            <strong>Auto Provision Store ID:</strong> {(condition as any).autoProvisionStoreId}
                                        </Typography>
                                    )}
                                    {(condition as any).blockId && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            <strong>Block ID:</strong> {(condition as any).blockId}
                                        </Typography>
                                    )}
                                    {(condition as any).id && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            <strong>Condition ID:</strong> {(condition as any).id}
                                        </Typography>
                                    )}
                                    {(condition as any).party && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            <strong>Party:</strong> {(condition as any).party} <strong>({condition.party === 'CUSTOMER' ? latestContractInModal.partner_code : 'Myself'})</strong>
                                        </Typography>
                                    )}
                                    {(condition as any).volume && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            <strong>Volume:</strong> {(condition as any).volume.toLocaleString()}
                                        </Typography>
                                    )}
                                    {(condition as any).weight && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            <strong>Weight:</strong> {(condition as any).weight.toLocaleString()}
                                        </Typography>
                                    )}
                                    {(condition as any).dependencies && (condition as any).dependencies.length > 0 && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            <strong>Dependencies:</strong> {(condition as any).dependencies.join(', ')}
                                        </Typography>
                                    )}
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">No historical data found for this contract.</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2, borderTop: '1px solid #424242' }}>
          <Button onClick={handleCloseModal} variant="contained" color="primary" sx={{ borderRadius: '8px' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default ContractsHistory;
