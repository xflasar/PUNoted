import { Box, Typography, useTheme } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { DrawerRow, FlexCard } from './SharedUi';
import { formatCurrency } from '../utils/financeUtils';

interface LedgerStatsProps {
  stats: { totalReceived: number; totalPaid: number; net: number } | null;
}

export const LedgerStats = ({ stats }: LedgerStatsProps) => {
  const theme = useTheme();

  if (!stats) return null;

  return (
    <FlexCard>
      <Box px={2} py={1} display="flex" alignItems="center" borderBottom={`1px solid ${theme.palette.divider}`}>
        <SwapHorizIcon fontSize="small" sx={{ color: theme.palette.warning.main, mr: 1 }} />
        <Typography fontWeight={700} fontSize="0.85rem" textTransform="uppercase">30-Day Ledger</Typography>
      </Box>
      <Box display="flex" flexDirection="column">
        <DrawerRow label="Total Received" value={`+${formatCurrency(stats.totalReceived)}`} valueColor="success.main" isMonospace />
        <DrawerRow label="Total Paid" value={`-${formatCurrency(stats.totalPaid)}`} valueColor="error.main" isMonospace />
        <DrawerRow 
          label="Net Volume" 
          value={`${stats.net > 0 ? '+' : ''}${formatCurrency(stats.net)}`} 
          valueColor={stats.net >= 0 ? 'success.main' : 'error.main'} 
          isMonospace 
          noBorder
        />
      </Box>
    </FlexCard>
  );
};