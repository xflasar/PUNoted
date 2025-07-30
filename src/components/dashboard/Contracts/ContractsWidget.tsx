import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails, Grid, Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
import { DashboardData, ContractEntry, ContractConditionSummary } from '../../../app/dashboard/page';
import ContractsHistory from './ContractsHistory';
import MaterialDeltaSummaryCompact from './MaterialDeltaSummaryCompact';
import FinancialDeltaSummaryCompact from './FinancialDeltaSummaryCompact';
import MaterialBarChart from './MaterialBarChartComponent';

interface ContractsWidgetProps {
  backendData: DashboardData | null;
}

// Helper to determine if a condition is a financial transaction
const isFinancialCondition = (condition: ContractConditionSummary): boolean => {
  const type = condition.type?.toUpperCase();
  return type === 'PAYMENT' || type === 'FINANCIAL';
};

// Helper to determine if a condition is a material transaction
const isMaterialCondition = (condition: ContractConditionSummary): boolean => {
  const type = condition.type?.toUpperCase();
  return ['PROVISION_SHIPMENT', 'PICKUP_SHIPMENT', 'DELIVERY_SHIPMENT', 'DELIVERY', 'PROVISION', 'COMEX_PURCHASE_PICKUP'].includes(type || '');
};

// Data structure for the graph
interface GraphDataPoint {
  date: string;
  [materialTicker: string]: number | string;
}

const ContractsWidget: React.FC<ContractsWidgetProps> = ({ backendData }) => {
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [showLogScale, setShowLogScale] = useState<boolean>(false);

  // State for date range filtering
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  // Determine the min and max dates available in the backend data
  const dateRangeLimits = useMemo(() => {
    let minDate: Dayjs | null = null;
    let maxDate: Dayjs | null = null;

    if (backendData?.history_data?.contracts) {
      Object.values(backendData.history_data.contracts).forEach(contractEntries => {
        // We doing bad bad stuff -> we will need to branch it and make a separate sorting for fulfilled contracts or it will break
        contractEntries.forEach(contract => {
          const contractDate = contract.overall_timestamp ? dayjs(contract.overall_timestamp) : null;
          if (contractDate && contractDate.isValid()) {
            if (!minDate || contractDate.isBefore(minDate)) {
              minDate = contractDate;
            }
            if (!maxDate || contractDate.isAfter(maxDate)) {
              maxDate = contractDate;
            }
          }
        });
      });
    }
    return { minDate, maxDate };
  }, [backendData]);

  // Set initial date range to cover all available data on first load
  useEffect(() => {
    if (dateRangeLimits.minDate && dateRangeLimits.maxDate && !startDate && !endDate) {
      setStartDate(dateRangeLimits.minDate.startOf('day'));
      setEndDate(dateRangeLimits.maxDate.endOf('day'));
    }
  }, [dateRangeLimits, startDate, endDate]);


  const processedContractData = useMemo(() => {
    const financialSummary = {
      revenue: 0,
      expenses: 0,
      profit: 0,
    };
    const materialSummary: { [ticker: string]: number } = {};
    const materialGraphRawData: { [date: string]: { [ticker: string]: { positive: number; negative: number; } } } = {};
    const uniqueMaterialTickers: Set<string> = new Set();

    // Summary statistics
    let totalContracts = 0;
    let fulfilledContracts = 0;
    let openContracts = 0;
    let partiallyFulfilledContracts = 0;

    let contractsLast7Days = 0;
    let contractsPrevious7Days = 0;

    if (!backendData?.history_data?.contracts) {
      return {
        financialSummary,
        materialSummary,
        materialGraphData: [],
        uniqueMaterialTickers: [],
        summaryStatistics: {
          totalContracts: 0,
          contractsLast7Days: 0,
          contractsPrevious7Days: 0,
          fulfilledContracts: 0,
          openContracts: 0,
          partiallyFulfilledContracts: 0,
          changeLast7Days: 0,
        }
      };
    }

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
          return 99;
      }
    };

    const allContractEntries: ContractEntry[] = [];
    Object.values(backendData.history_data.contracts).forEach(contractEntries => {
      const sortedHistory = [...contractEntries].sort((a, b) => {
        const getFulfillment = (contract: ContractEntry) => {
          let fulfilledCount = 0;
          if (contract.conditions_summary && contract.conditions_summary.length > 0) {
            contract.conditions_summary.forEach(cond => {
              if (cond.status?.toUpperCase() === 'FULFILLED') {
                fulfilledCount++;
              }
            });
            return (fulfilledCount / contract.conditions_summary.length) * 100;
          }
          return 0;
        };

        const fulfillmentA = getFulfillment(a);
        const fulfillmentB = getFulfillment(b);

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

      const latestAndMostFulfilled = sortedHistory[0];

      if (latestAndMostFulfilled && !allContractEntries.some(c => c.localId === latestAndMostFulfilled.localId)) {
        allContractEntries.push(latestAndMostFulfilled);
      }
    });

    // Filter contracts based on the selected date range for detailed processing
    const filteredContractEntries = allContractEntries.filter(contract => {
      const contractDate = contract.overall_timestamp ? dayjs(contract.overall_timestamp) : null;
      if (!contractDate || !contractDate.isValid()) return false;

      const start = startDate ? startDate.startOf('day') : null;
      const end = endDate ? endDate.endOf('day') : null;

      if (start && end) {
        return contractDate.isBetween(start, end, null, '[]'); // Inclusive range
      } else if (start) {
        return contractDate.isSameOrAfter(start);
      } else if (end) {
        return contractDate.isSameOrBefore(end);
      }
      return true; // If no dates selected, include all
    });


    // Calculate overall summary statistics (before date filtering for graph/summary)
    const now = dayjs();
    const last7DaysStart = now.subtract(7, 'day').startOf('day');
    const previous7DaysStart = now.subtract(14, 'day').startOf('day');
    const previous7DaysEnd = now.subtract(7, 'day').endOf('day');

    Object.values(allContractEntries).forEach(contractEntries => {
      const latestContract = contractEntries;
      if (latestContract) {
        totalContracts++;
        switch (latestContract.status?.toUpperCase()) {
          case 'FULFILLED':
            fulfilledContracts++;
            break;
          case 'CLOSED':
            openContracts++;
            break;
          case 'OPEN':
            openContracts++;
            break;
          case 'PARTIALLY_FULFILLED':
            partiallyFulfilledContracts++;
            break;
        }

        const contractDate = latestContract.overall_timestamp ? dayjs(latestContract.overall_timestamp) : null;
        if (contractDate && contractDate.isValid()) {
          if (contractDate.isSameOrAfter(last7DaysStart)) {
            contractsLast7Days++;
          }
          if (contractDate.isBetween(previous7DaysStart, previous7DaysEnd, null, '[]')) {
            contractsPrevious7Days++;
          }
        }
      }
    });

    const changeLast7Days = contractsLast7Days - contractsPrevious7Days;


    // Now process the filtered contracts for financial and material deltas
    filteredContractEntries.forEach(contract => {
      if(contract.status !== 'FULFILLED') return;
      const ourRoleInContract = contract.party?.toUpperCase();

      // Infer contract type based on conditions_summary
      let contractType: 'BUY' | 'SELL' | 'SHIP' | 'UNKNOWN' = 'UNKNOWN';
      const conditionTypes = new Set(contract.conditions_summary.map(c => c.type?.toUpperCase()).filter(Boolean));

      //const hasDelivery = conditionTypes.has('DELIVERY');
      const hasProvision = conditionTypes.has('PROVISION');
      //const hasProvisionShipment = conditionTypes.has('PROVISION_SHIPMENT');
      const hasPickupShipment = conditionTypes.has('PICKUP_SHIPMENT');
      const hasPickupComex = conditionTypes.has('COMEX_PURCHASE_PICKUP')
      const hasDeliveryShipment = conditionTypes.has('DELIVERY_SHIPMENT');

      // Primary check for SHIP contracts
      if (hasPickupShipment && hasDeliveryShipment) {
        contractType = 'SHIP';
      } else if (ourRoleInContract === 'CUSTOMER') {
        // If we are the CUSTOMER, we are buying
        if (hasPickupComex) { // We receive material
          contractType = 'BUY';
        } else {
          contractType = 'SELL'
        }
      } else if (ourRoleInContract === 'PROVIDER') {
        // If we are the PROVIDER, we are selling
        if (hasProvision) { // We provide material
          contractType = 'SELL';
        } else {
          contractType = 'BUY'
        }
      }

      console.log(contract.localId + ': ' + contractType)

      contract.conditions_summary.forEach(condition => {
          const conditionTimestamp = contract.overall_timestamp || Date.now();
          const date = new Date(conditionTimestamp);
          const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

          if (!materialGraphRawData[dateString]) {
              materialGraphRawData[dateString] = {};
          }

          // Financials
          if (isFinancialCondition(condition)) {
              const amount = condition.amount?.amount;
              const currency = condition.amount?.currency;
              const conditionParty = condition.party?.toUpperCase();

              if (amount && currency === 'ICA') {
                  if (ourRoleInContract === 'PROVIDER') {
                      if (conditionParty === 'CUSTOMER') {
                          financialSummary.revenue += amount;
                      } else if (conditionParty === 'PROVIDER') {
                          financialSummary.expenses += amount;
                      }
                  } else if (ourRoleInContract === 'CUSTOMER') {
                      if (conditionParty === 'CUSTOMER') {
                          financialSummary.expenses += amount;
                      } else if (conditionParty === 'PROVIDER') {
                          financialSummary.revenue += amount;
                      }
                  }
              }
          }

          // Materials
          if (isMaterialCondition(condition)) {
              if (contractType === "SHIP" || contractType === "UNKNOWN" || contract.status === "CANCELLED") return

              let ticker;
              let amount;

              if(!condition.quantity || !condition.quantity.material) {
                console.log(contract.localId + ': fail' + condition)
              }

              if (condition.type === "DELIVERY_SHIPMENT") {
                ticker = contract.conditions_summary[condition.index - 1].quantity?.material.ticker
                amount = contract.conditions_summary[condition.index - 1].quantity?.amount
              } else {
                ticker = condition.quantity.material.ticker;
                amount = condition.quantity.amount || 0;
              }

              if (ticker && amount !== null) {
                  uniqueMaterialTickers.add(ticker);
                  if (!materialGraphRawData[dateString][ticker]) {
                      materialGraphRawData[dateString][ticker] = { positive: 0, negative: 0 };
                  }

                  if (contractType === 'BUY') {
                      materialGraphRawData[dateString][ticker].positive += amount;
                      materialSummary[ticker] = (materialSummary[ticker] || 0) + amount;
                  } else if (contractType === 'SELL' && condition.type !== 'COMEX_PURCHASE_PICKUP') {
                      materialGraphRawData[dateString][ticker].negative += (-amount);
                      materialSummary[ticker] = (materialSummary[ticker] || 0) - amount;
                  }
                  // Ship contracts are excluded from this graph
              }
          }
      });
    });

    financialSummary.profit = financialSummary.revenue - financialSummary.expenses;

    const sortedDates = Object.keys(materialGraphRawData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const finalGraphData: GraphDataPoint[] = sortedDates.map(date => {
      const dataPoint: GraphDataPoint = { date: date };
      uniqueMaterialTickers.forEach(ticker => {
        dataPoint[`${ticker}_positive`] = materialGraphRawData[date]?.[ticker]?.positive || 0;
        dataPoint[`${ticker}_negative`] = materialGraphRawData[date]?.[ticker]?.negative || 0;
      });
      return dataPoint;
    });

    return {
      financialSummary,
      materialSummary,
      materialGraphData: finalGraphData,
      uniqueMaterialTickers: Array.from(uniqueMaterialTickers).sort(),
      summaryStatistics: {
        totalContracts,
        contractsLast7Days,
        contractsPrevious7Days,
        fulfilledContracts,
        openContracts,
        partiallyFulfilledContracts,
        changeLast7Days,
      }
    };
  }, [backendData, startDate, endDate]);


  const handleMaterialToggle = (ticker: string) => {
    setSelectedMaterials(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(ticker)) {
        newSelected.delete(ticker);
      } else {
        newSelected.add(ticker);
      }
      return newSelected;
    });
  };

  const handleLogScaleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowLogScale(event.target.checked);
  };

  const getGraphColors = useMemo(() => {
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
      '#A28DFF', '#8DFFC9', '#FFD88D', '#FF9F42', '#4287f5', '#42f5bf', '#f54278', '#f5b042'
    ];
    const colorMap: { [key: string]: string } = {};
    processedContractData.uniqueMaterialTickers.forEach((ticker, index) => {
      colorMap[ticker] = colors[index % colors.length];
    });
    return colorMap;
  }, [processedContractData.uniqueMaterialTickers]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Contracts Summary */}
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'text.primary',textAlign: 'center', mb: 2 }}>
            Overall Contract Summary
          </Typography>
          <Grid container spacing={2} sx={{ alignSelf: 'center'}}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper elevation={3} sx={{ p: 2, bgcolor: '#424242', borderRadius: '8px' }}>
                <Typography variant="subtitle1" color="primary.light" sx={{ fontWeight: 'bold' }}>Total Contracts</Typography>
                <Typography variant="h5" color="text.primary">{processedContractData.summaryStatistics.totalContracts}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper elevation={3} sx={{ p: 2, bgcolor: '#424242', borderRadius: '8px' }}>
                <Typography variant="subtitle1" color="primary.light" sx={{ fontWeight: 'bold' }}>Contracts (Last 7 Days)</Typography>
                <Typography variant="h5" color="text.primary">
                  {processedContractData.summaryStatistics.contractsLast7Days}
                  <Box component="span" sx={{ ml: 1, color: processedContractData.summaryStatistics.changeLast7Days >= 0 ? 'success.main' : 'error.main' }}>
                    ({processedContractData.summaryStatistics.changeLast7Days >= 0 ? '+' : ''}{processedContractData.summaryStatistics.changeLast7Days})
                  </Box>
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper elevation={3} sx={{ p: 2, bgcolor: '#424242', borderRadius: '8px' }}>
                <Typography variant="subtitle1" color="primary.light" sx={{ fontWeight: 'bold' }}>Fulfilled Contracts</Typography>
                <Typography variant="h5" color="text.primary">{processedContractData.summaryStatistics.fulfilledContracts}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper elevation={3} sx={{ p: 2, bgcolor: '#424242', borderRadius: '8px' }}>
                <Typography variant="subtitle1" color="primary.light" sx={{ fontWeight: 'bold' }}>Open Contracts</Typography>
                <Typography variant="h5" color="text.primary">{processedContractData.summaryStatistics.openContracts}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper elevation={3} sx={{ p: 2, bgcolor: '#424242', borderRadius: '8px' }}>
                <Typography variant="subtitle1" color="primary.light" sx={{ fontWeight: 'bold' }}>Partially Fulfilled</Typography>
                <Typography variant="h5" color="text.primary">{processedContractData.summaryStatistics.partiallyFulfilledContracts}</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Accordion for Contracts Overview (Financial/Material Delta & Graph) */}
        <Accordion
          sx={{
            mt: 2,
            mb: 2
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
            aria-controls={'contracts-summary-content'}
            id={'contracts-summary-header'}
            sx={{
              bgcolor: '#333333',
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
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Contracts Overview (Filtered)
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 2, bgcolor: '#333333', borderRadius: '0 0 10px 10px' }}>
            {/* Date Range Selectors */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <DatePicker
                label="Date From"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                minDate={dateRangeLimits.minDate}
                maxDate={endDate || dateRangeLimits.maxDate} // Max date is endDate or overall max
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: {
                      '& .MuiInputBase-root': {
                        color: 'text.primary',
                        bgcolor: '#424242',
                        borderRadius: '8px',
                      },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.light' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                      '& .MuiSvgIcon-root': { color: 'text.secondary' },
                    }
                  }
                }}
              />
              <DatePicker
                label="Date To"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                minDate={startDate || dateRangeLimits.minDate} // Min date is startDate or overall min
                maxDate={dateRangeLimits.maxDate}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: {
                      '& .MuiInputBase-root': {
                        color: 'text.primary',
                        bgcolor: '#424242',
                        borderRadius: '8px',
                      },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.light' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                      '& .MuiSvgIcon-root': { color: 'text.secondary' },
                    }
                  }
                }}
              />
            </Box>

            {/* Financial Delta Summary */}
            <FinancialDeltaSummaryCompact financialSummary={processedContractData.financialSummary}  />

            {/* Materials Delta Summary */}
            <MaterialDeltaSummaryCompact
              materialSummary={processedContractData.materialSummary}
              selectedMaterials={selectedMaterials}
              onMaterialToggle={handleMaterialToggle}
            />

            {/* Material Delta Graph */}
            <Box sx={{ p: 2, boxShadow: '0px 2px 4px rgba(0,0,0,0.2)', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.light', mb: 2 }}>
                Material Transaction Trends
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'column' }, gap: 2 }}>
                {/* Graph */}
                <Box sx={{ flexGrow: 1, height: 400, minWidth: 0 }}>
                  <MaterialBarChart
                    data={processedContractData.materialGraphData}
                    selectedMaterials={selectedMaterials}
                    getGraphColors={getGraphColors}
                    showLogScale={showLogScale}
                  />
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Accordion for Contracts History */}
        <Accordion
          sx={{
            mb: 1.5,
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
            aria-controls={'contracts-history-content'}
            id={'contracts-history-header'}
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
            }
          }
        >
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Contracts History
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, bgcolor: '#333333', borderRadius: '0 0 10px 10px' }}>
          <ContractsHistory backendData={backendData} />
        </AccordionDetails>
      </Accordion>
    </Box>
    </LocalizationProvider>
  );
};

export default ContractsWidget;
