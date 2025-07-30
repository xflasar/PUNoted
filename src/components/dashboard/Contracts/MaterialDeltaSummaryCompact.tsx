import React from 'react';
import { Box, Typography, Grid, Chip, styled } from '@mui/material';
import { keyframes } from '@emotion/react';

// Keyframes for a subtle pulse animation for value changes
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

// Styled Chip component for custom colors, animation, and selection state
const StyledChip = styled(Chip)(({ theme, amount, isSelected, negativeAmount, positiveAmount }: { theme?: any; amount: number; isSelected: boolean; negativeAmount: number; positiveAmount: number }) => ({
  fontWeight: 'bold',
  minWidth: '150px',
  minHeight: '60px',
  height: 'auto',
  padding: '0',
  borderRadius: '16px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  transition: 'background-color 0.3s ease-in-out, transform 0.1s ease-out, border 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  cursor: 'pointer',
  '&:active': {
    transform: 'scale(0.98)',
  },
  background: 'transparent',
  color: theme.palette.common.white,

  border: isSelected ? '2px solid #64b5f6' : '2px solid #4e4e4eff',
  boxShadow: isSelected ? '0px 0px 10px rgba(100, 181, 246, 0.7)' : 'none',

  // Override default Chip label styling to allow custom content
  '& .MuiChip-label': {
    width: '100%',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

interface MaterialDeltaSummaryCompactProps {
  materialSummary: { [ticker: string]: number };
  selectedMaterials: Set<string>;
  onMaterialToggle: (ticker: string) => void;
}

const MaterialDeltaSummaryCompact: React.FC<MaterialDeltaSummaryCompactProps> = ({ materialSummary, selectedMaterials, onMaterialToggle }) => {
  const materialEntries = Object.entries(materialSummary).map(([ticker, amount]) => {
    let positiveAmount = 0;
    let negativeAmount = 0;

    if (amount > 0) {
      positiveAmount = amount;
    } else if (amount < 0) {
      negativeAmount = amount;
    }
    // If we have separate raw gain/loss data:
    // positiveAmount = yourRawGainsForTicker;
    // negativeAmount = yourRawLossesForTicker;

    return { ticker, amount, positiveAmount, negativeAmount };
  });


  return (
    <Box sx={{ p: 2, boxShadow: '0px 2px 4px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.light', mb: 2 }}>
        Material Delta (Fulfilled Contracts)
      </Typography>
      {materialEntries.length > 0 ? (
        <Grid container spacing={1} sx={{
          justifyContent: 'center'
        }}>
          {materialEntries.map(({ ticker, amount, positiveAmount, negativeAmount }) => (
            <Grid
              item
              xs={4}
              sm={2}
              md={2}
              lg={1}
              key={ticker}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <StyledChip
                amount={amount}
                negativeAmount={negativeAmount}
                positiveAmount={positiveAmount}
                isSelected={selectedMaterials.has(ticker)}
                onClick={() => onMaterialToggle(ticker)}
                label={
                  <Box sx={{
                    width: '100%',
                    height: '50%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white' }}>
                      {ticker}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', color: 'white' }}>
                      {Math.abs(amount).toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '80%' }}>
                      <Typography variant="caption" sx={{ color: 'red', fontSize: '0.65rem' }}>
                        {negativeAmount < 0 ? negativeAmount.toLocaleString() : ''}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'green', fontSize: '0.65rem' }}>
                        {positiveAmount > 0 ? `+${positiveAmount.toLocaleString()}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography color="text.secondary">No material transactions from fulfilled contracts.</Typography>
      )}
    </Box>
  );
};

export default MaterialDeltaSummaryCompact;
