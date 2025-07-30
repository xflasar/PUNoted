import React from 'react';
import { Box, Typography, Grid, Chip, styled } from '@mui/material';
import { keyframes } from '@emotion/react';


const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

// Styled Chip component for custom colors, animation, and selection state
const StyledChip = styled(Chip)(({ amount, bgColorActive = false}: {amount: number; bgColorActive?: boolean }) => ({
  fontWeight: 'bold',
  fontSize: '0.8rem',
  minWidth: '100px',
  minHeight: '40px',
  height: 'auto',
  padding: '6px 10px',
  borderRadius: '16px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  transition: 'background-color 0.3s ease-in-out, transform 0.1s ease-out, border 0.2s ease-in-out',
  margin: '1rem',
  // Conditional background and text color based on amount
  backgroundColor: amount > 0 && bgColorActive ? '#4CAF50' : (amount < 0 ? '#F44336' : '#616161'),
  animation: 'none',
}));

interface MaterialDeltaSummaryCompactProps {
  financialSummary: { revenue: number, expenses: number, profit: number };
}

const FinancialDeltaSummaryCompact: React.FC<MaterialDeltaSummaryCompactProps> = ({ financialSummary }) => {
  return (
    <Box sx={{ p: 1, boxShadow: '0px 2px 4px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.light' }}>
        Financial Delta (Fulfilled Contracts)
      </Typography>
      <Grid container spacing={2}>
          <Grid
              item
              xs={6}
              sm={4}
              md={3}
              lg={2}
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
              }}
            >
              <StyledChip
                label={`Revenue: ${financialSummary.revenue.toLocaleString()}`}
                amount={financialSummary.revenue}
              />
              <StyledChip
                label={`Expenses: ${financialSummary.expenses.toLocaleString()}`}
                amount={financialSummary.expenses}
              />
              <StyledChip
                label={`Profit: ${financialSummary.profit.toLocaleString()}`}
                amount={financialSummary.profit}
                bgColorActive={true}
              />
            </Grid>
        </Grid>
    </Box>
  );
};

export default FinancialDeltaSummaryCompact;
