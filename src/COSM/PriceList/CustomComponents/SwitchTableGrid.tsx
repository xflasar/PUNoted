import React from 'react';
import { styled } from '@mui/system';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

// Styled ToggleButton with custom colors and effects
const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  color: theme.palette.common.white,
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 'bold',
  letterSpacing: '0.05em',
  borderRadius: '24px',
  padding: '8px 20px',
  border: `1px solid ${theme.palette.divider}`,
  '&.Mui-selected': {
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
    color: '#7b68ee',
    '&:hover': {
      backgroundColor: 'rgba(123, 104, 238, 0.3)',
    },
  },
  '&.MuiToggleButton-root:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Custom highlight for selected button
  '&.Mui-selected, &.Mui-selected:hover': {
    color: '#7b68ee',
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
  },
  // Ensure the border is consistent
  '&.Mui-selected + &.Mui-selected': {
    borderLeft: `1px solid ${theme.palette.divider}`,
  },
}));

interface MaterialViewSwitchProps {
  view: 'table' | 'grid';
  onChange: (event: React.MouseEvent<HTMLElement>, newView: 'table' | 'grid' | null) => void;
}

const MaterialViewSwitch: React.FC<MaterialViewSwitchProps> = ({ view, onChange }) => {
  return (
    <ToggleButtonGroup
      value={view}
      exclusive
      onChange={onChange}
      aria-label="view toggle"
      sx={{
        borderRadius: '24px',
        border: `1px solid rgba(255, 255, 255, 0.1)`,
      }}
    >
      <StyledToggleButton value="table">
        Table
      </StyledToggleButton>
      <StyledToggleButton value="grid">
        Grid
      </StyledToggleButton>
    </ToggleButtonGroup>
  );
};

export default MaterialViewSwitch;