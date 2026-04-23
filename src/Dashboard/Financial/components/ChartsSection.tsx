import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, compactFormatter, SEMANTIC_COLORS } from '../utils/financeUtils';
import { FlexCard } from './SharedUi';

export const LiquidityTrendChart = ({ historyData, currency }: any) => {
  const theme = useTheme();
  return (
    <FlexCard sx={{ flex: { xs: 'none', lg: 0.8 }, height: { xs: 250, lg: 'auto' }, minHeight: { lg: 0 } }}>
      <Box px={2} py={1} display="flex" alignItems="center" borderBottom={`1px solid ${theme.palette.divider}`}>
        <Typography fontWeight={700} fontSize="0.85rem">30-Day Liquidity Trend ({currency})</Typography>
      </Box>
      <Box sx={{ flex: 1, px: 1, pb: 1, pt: 1, minHeight: 0 }}>
        {historyData && historyData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke={theme.palette.divider} />
              <XAxis dataKey="Date" tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false} dy={5} />
              <YAxis tickFormatter={compactFormatter} tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false} />
              <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: theme.palette.background.default, borderColor: theme.palette.divider, color: theme.palette.text.primary, borderRadius: '8px', padding: '4px 8px', fontSize: '0.85rem' }} />
              <Area type="monotone" dataKey="Balance" stroke={theme.palette.primary.main} strokeWidth={2} fill="url(#colorBalance)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%" color="text.secondary" fontSize="0.8rem">Insufficient historical data</Box>
        )}
      </Box>
    </FlexCard>
  );
};

export const IncomeSourcesChart = ({ pieChartData }: any) => {
  const theme = useTheme();
  return (
    <FlexCard sx={{ gridColumn: { xs: '1', md: '1', lg: 'span 2' }, height: { xs: 300, lg: 'auto' }, minHeight: { lg: 0 } }}>
      <Box px={2} py={1} display="flex" alignItems="center" borderBottom={`1px solid ${theme.palette.divider}`}>
        <Typography fontWeight={700} fontSize="0.85rem">30-Day Income Sources</Typography>
      </Box>
      <Box sx={{ flex: 1, p: 1, minHeight: 0 }}>
        {pieChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieChartData} cx="50%" cy="45%" innerRadius="55%" outerRadius="80%" paddingAngle={2} dataKey="value" stroke="none">
                {pieChartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={SEMANTIC_COLORS.chartPalette[index % SEMANTIC_COLORS.chartPalette.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: theme.palette.background.default, borderColor: theme.palette.divider, color: theme.palette.text.primary, borderRadius: '8px', padding: '4px 8px', fontSize: '0.85rem' }} />
              <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', color: theme.palette.text.secondary }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%" color="text.secondary" fontSize="0.8rem">No income generated</Box>
        )}
      </Box>
    </FlexCard>
  );
};

export const VelocityBarChart = ({ incomeExpense30D }: any) => {
  const theme = useTheme();
  return (
    <FlexCard sx={{ gridColumn: { xs: '1', md: '2', lg: 'span 2' }, height: { xs: 300, lg: 'auto' }, minHeight: { lg: 0 } }}>
      <Box px={2} py={1} display="flex" alignItems="center" borderBottom={`1px solid ${theme.palette.divider}`}>
        <Typography fontWeight={700} fontSize="0.85rem">30-Day Velocity</Typography>
      </Box>
      <Box sx={{ flex: 1, px: 1, pt: 2, pb: 1, minHeight: 0 }}>
        {incomeExpense30D.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeExpense30D} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke={theme.palette.divider} />
              <XAxis dataKey="name" tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false} dy={5} />
              <YAxis tickFormatter={compactFormatter} tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{ fill: alpha(theme.palette.text.primary, 0.05) }} formatter={(value: number) => formatCurrency(Math.abs(value))} contentStyle={{ backgroundColor: theme.palette.background.default, borderColor: theme.palette.divider, color: theme.palette.text.primary, borderRadius: '8px', padding: '4px 8px', fontSize: '0.85rem' }} />
              <Legend wrapperStyle={{ paddingTop: 0, fontSize: '10px', color: theme.palette.text.secondary }} iconType="circle" />
              <ReferenceLine y={0} stroke={theme.palette.divider} strokeWidth={1} />
              <Bar dataKey="Income" fill={theme.palette.success.main} radius={[2, 2, 0, 0]} maxBarSize={20} />
              <Bar dataKey="Expense" fill={theme.palette.error.main} radius={[0, 0, 2, 2]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%" color="text.secondary" fontSize="0.8rem">No operational data</Box>
        )}
      </Box>
    </FlexCard>
  );
};

export const VelocityLedgerTable = ({ cashFlows }: any) => {
  const theme = useTheme();
  return (
    <FlexCard sx={{ gridColumn: { xs: '1', md: '1 / -1', lg: 'span 3' }, height: { xs: 350, lg: 'auto' }, minHeight: { lg: 0 } }}>
      <Box px={2} py={1} display="flex" alignItems="center" borderBottom={`1px solid ${theme.palette.divider}`}>
        <Typography fontWeight={700} fontSize="0.85rem">Velocity Ledger</Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'auto', p: 0, '&::-webkit-scrollbar': { width: '6px', height: '6px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.divider, borderRadius: '4px' } }}>
        <table style={{ width: '100%', minWidth: '350px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ backgroundColor: alpha(theme.palette.background.default, 0.95), color: theme.palette.text.secondary, fontSize: '0.65rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '8px 12px', fontWeight: 800, borderBottom: `1px solid ${theme.palette.divider}` }}>Category</th>
              <th style={{ padding: '8px 12px', fontWeight: 800, textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>7-Day Net</th>
              <th style={{ padding: '8px 12px', fontWeight: 800, textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>30-Day Net</th>
            </tr>
          </thead>
          <tbody>
            {cashFlows && cashFlows.length > 0 ? (
              cashFlows.map((flow: any) => {
                const isCorp = flow.Category.includes('CORP');
                return (
                  <tr key={flow.Category} style={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: isCorp ? SEMANTIC_COLORS.neonBlue : theme.palette.text.primary, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {flow.Category.replace('_', ' ')}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: flow['7D'].Net >= 0 ? theme.palette.success.main : theme.palette.error.main }}>
                      {flow['7D'].Net > 0 ? '+' : ''}{formatCurrency(flow['7D'].Net)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: flow['30D'].Net >= 0 ? theme.palette.success.main : theme.palette.error.main }}>
                      {flow['30D'].Net > 0 ? '+' : ''}{formatCurrency(flow['30D'].Net)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: theme.palette.text.secondary, fontSize: '0.8rem' }}>
                  No ledger entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Box>
    </FlexCard>
  );
};