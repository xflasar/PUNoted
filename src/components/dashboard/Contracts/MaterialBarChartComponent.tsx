import React, { useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { BarChart, BarPlot } from '@mui/x-charts';
import { ChartsLegend } from '@mui/x-charts/ChartsLegend';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';

// Data structure for the graph
interface GraphDataPoint {
  date: string;
  [materialTicker: string]: number | string;
}

interface MaterialBarChartProps {
  data: GraphDataPoint[];
  selectedMaterials: Set<string>;
  getGraphColors: { [key: string]: string };
  showLogScale: boolean; // remove this feature
}

// Custom Bar Label Component
const CustomBarLabel = ({ x, y, width, height, value }: { x: number; y: number; width: number; height: number; value: number }) => {
  const theme = useTheme();
  const isPositive = value >= 0;
  const textColor = theme.palette.common.white;
  const displayValue = value.toLocaleString();

  // Basic check if label fits
  const estimatedTextWidth = displayValue.length * 6;
  const estimatedTextHeight = 12;

  // Only render label if it fits within the bar's width and a reasonable height
  if (width < estimatedTextWidth || Math.abs(height) < estimatedTextHeight) {
    return null; // Don't render if it doesn't fit
  }

  return (
    <text
      x={x + width / 2}
      y={y + (isPositive ? (height > 0 ? 15 : -5) : (height < 0 ? -5 : 15))}
      fill={textColor}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="0.75rem"
      fontWeight="bold"
    >
      {displayValue}
    </text>
  );
};


const MaterialBarChart: React.FC<MaterialBarChartProps> = ({ data, selectedMaterials, getGraphColors, showLogScale }) => {
  const theme = useTheme();

  // Prepare chart series
  const series = useMemo(() => {
    return Array.from(selectedMaterials).flatMap(ticker => [
      {
        dataKey: `${ticker}_positive`, // Key for positive values
        label: `${ticker} (Gains)`,
        color: getGraphColors[ticker], // Use the material's specific color for gains
        type: 'bar',
        stackId: ticker, // Stack positive and negative for the same ticker
        // Use renderCell to apply CustomBarLabel
        renderCell: (props: any) => (
          <React.Fragment>
            <BarPlot {...props} />
            {/* Only render label if value is positive and non-zero */}
            { (props.data[props.dataKey] as number) > 0 &&
              <CustomBarLabel
                x={props.x}
                y={props.y}
                width={props.width}
                height={props.height}
                value={props.data[props.dataKey] as number}
              />
            }
          </React.Fragment>
        ),
      },
      {
        dataKey: `${ticker}_negative`, // Key for negative values
        label: `${ticker} (Losses)`,
        color: theme.palette.error.main, // Red for losses (consistent across all materials)
        type: 'bar',
        stackId: ticker, // Stack positive and negative for the same ticker
        // Use renderCell to apply CustomBarLabel
        renderCell: (props: any) => (
          <React.Fragment>
            <BarPlot {...props} />
            {/* Only render label if value is negative and non-zero */}
            { (props.data[props.dataKey] as number) < 0 &&
              <CustomBarLabel
                x={props.x}
                y={props.y}
                width={props.width}
                height={props.height}
                value={props.data[props.dataKey] as number}
              />
            }
          </React.Fragment>
        ),
      },
    ]);
  }, [selectedMaterials, getGraphColors, theme.palette.error.main]);


  // Custom value formatter for the tooltip to show combined positive/negative
  const customTooltipValueFormatter = (value: number | null, { dataKey, label }: { dataKey: string; label: string; }) => {
    if (value === null) return 'N/A';
    return `${label}: ${value.toLocaleString()}`;
  };

  // Custom Tooltip Content
  const CustomTooltipContent = ({ payload, label }: { payload?: any[]; label?: string }) => {
    if (!payload || payload.length === 0) return null;

    const dateData = data.find(item => item.date === label);

    return (
      <Box sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        p: 1.5,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[3],
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>{label}</Typography>
        <Grid container spacing={0.5}>
          {Array.from(selectedMaterials).map(ticker => {
            const positiveValue = (dateData?.[`${ticker}_positive`] as number) || 0;
            const negativeValue = (dateData?.[`${ticker}_negative`] as number) || 0;
            const netValue = positiveValue + negativeValue; // Net value for this ticker on this date

            if (positiveValue === 0 && negativeValue === 0) return null; // Don't show if no activity

            return (
              <Grid item xs={12} key={ticker}>
                <Typography variant="body2" sx={{ color: getGraphColors[ticker], fontWeight: 'bold' }}>
                  {ticker}:
                </Typography>
                <Box sx={{ ml: 1 }}>
                  {positiveValue > 0 && (
                    <Typography variant="caption" sx={{ color: theme.palette.success.light }}>
                      Gains: +{positiveValue.toLocaleString()}
                    </Typography>
                  )}
                  {negativeValue < 0 && (
                    <Typography variant="caption" sx={{ color: theme.palette.error.light, ml: positiveValue > 0 ? 1 : 0 }}>
                      Losses: {negativeValue.toLocaleString()}
                    </Typography>
                  )}
                  {netValue !== 0 && (
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, ml: (positiveValue !== 0 || negativeValue !== 0) ? 1 : 0 }}>
                      Net: {netValue.toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };


  // --- Debugging Logs ---
  console.log("MaterialBarChart - Incoming Data (dataset):", data);
  console.log("MaterialBarChart - Generated Series:", series);
  console.log("MaterialBarChart - Selected Materials:", selectedMaterials);
  console.log("MaterialBarChart - Show Log Scale:", showLogScale);
  // --- End Debugging Logs ---


  if (data.length === 0 || selectedMaterials.size === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography color="text.secondary">Select materials to view their transaction trends.</Typography>
      </Box>
    );
  }

  return (
    <BarChart
      dataset={data}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      series={series}
      xAxis={[{
        scaleType: 'band',
        dataKey: 'date',
        label: 'Date',
        tickLabelStyle: { fill: theme.palette.text.secondary },
        axisLine: { stroke: theme.palette.divider },
        tickLine: { stroke: theme.palette.divider },
      }]}
      yAxis={[{
        scaleType: showLogScale ? 'log' : 'linear',
        label: 'Material Change',
        tickLabelStyle: { fill: theme.palette.text.secondary },
        axisLine: { stroke: theme.palette.divider },
        tickLine: { stroke: theme.palette.divider },
      }]}
    >
      {/* Tooltip for showing details on hover */}
      <ChartsTooltip
        trigger="item"
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              color: theme.palette.text.primary,
            }
          },
        }}
        content={CustomTooltipContent}
      />
      {/* Legend for series identification */}
      <ChartsLegend
        direction="row"
        position={{ vertical: 'top', horizontal: 'right' }}
        itemMarkWidth={10}
        itemMarkHeight={10}
        labelStyle={{ fill: theme.palette.text.secondary }}
      />
      <ChartsReferenceLine y={0} lineStyle={{ stroke: theme.palette.divider, strokeDasharray: '3 3' }} />
    </BarChart>
  );
};

export default MaterialBarChart;
