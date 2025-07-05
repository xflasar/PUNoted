// src/components/common/ThemeWrapper.tsx
'use client';

import React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { usePaletteMode } from '@/lib/context/PaletteModeContext';
import { getAppTheme } from '@/lib/theme';
import AppShell from '@/components/common/AppShell';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { mode } = usePaletteMode();
  const theme = getAppTheme(mode);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell>
        {children}
      </AppShell>
    </MuiThemeProvider>
  );
}