import React from 'react';
import { styled } from '@mui/system';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

/**
 * A customized Material UI ToggleButton featuring a specialized color palette
 * and hover/selection effects tailored for the dark theme.
 */
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
  '&.Mui-selected, &.Mui-selected:hover': {
    color: '#7b68ee',
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
  },
  '&.Mui-selected + &.Mui-selected': {
    borderLeft: `1px solid ${theme.palette.divider}`,
  },
}));

/**
 * Properties for the MaterialViewSwitch component.
 */
interface MaterialViewSwitchProps {
  /**
   * The currently active view mode.
   */
  view: 'table' | 'grid';
  /**
   * Callback invoked when the user selects a different view mode.
   *
   * @param event - The mouse event triggered by the selection.
   * @param newView - The newly selected view mode, or null if unselected.
   */
  onChange: (event: React.MouseEvent<HTMLElement>, newView: 'table' | 'grid' | null) => void;
}

/**
 * Provides a toggle control for switching between 'table' and 'grid' layouts.
 * Utilizes exclusive selection to ensure only one view mode is active at a time.
 */
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
