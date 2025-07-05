'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { PaletteMode } from '@mui/material';

interface PaletteModeContextType {
  mode: PaletteMode;
  togglePaletteMode: () => void;
}

const PaletteModeContext = createContext<PaletteModeContextType | undefined>(undefined);

export const PaletteModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pu-theme-mode') as PaletteMode) || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('pu-theme-mode', mode);
  }, [mode]);

  const togglePaletteMode = useCallback(() => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      return newMode;
    });
  }, []);

  const value = useMemo(() => ({ mode, togglePaletteMode }), [mode, togglePaletteMode]);

  return (
    <PaletteModeContext.Provider value={value}>
      {children}
    </PaletteModeContext.Provider>
  );
};

export const usePaletteMode = () => {
  const context = useContext(PaletteModeContext);
  if (context === undefined) {
    throw new Error('usePaletteMode must be used within a PaletteModeProvider');
  }
  return context;
};