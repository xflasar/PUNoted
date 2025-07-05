// src/lib/theme.ts
import { createTheme, PaletteMode } from '@mui/material';

// Define common theme settings regardless of mode
const baseThemeSettings = {
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }: any) => ({
          backgroundColor: theme.palette.mode === 'dark' ? '#1a202c' : '#2196f3',
          color: '#ffffff',
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }: any) => ({
          backgroundColor: theme.palette.mode === 'dark' ? '#1a202c' : '#f0f2f5',
          boxShadow: 'none',
          borderRight: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }: any) => ({
          borderRadius: 8,
          boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.05)',
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: ({ theme }: any) => ({
          color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
        }),
      },
    },
  },
};

// This function creates a theme based on the given mode
export const getAppTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode: mode,
      primary: {
        main: mode === 'dark' ? '#90caf9' : '#2196f3',
      },
      secondary: {
        main: mode === 'dark' ? '#ce93d8' : '#9c27b0',
      },
      success: {
        main: mode === 'dark' ? '#a5d6a7' : '#4caf50',
      },
      error: {
        main: mode === 'dark' ? '#ef9a9a' : '#f44336',
      },
      background: {
        default: mode === 'dark' ? '#0d1117' : '#f8fafc',
        paper: mode === 'dark' ? '#161b22' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#e6edf3' : '#333333',
        secondary: mode === 'dark' ? '#a0a0a0' : '#666666',
      },
    },
    ...baseThemeSettings,
  });