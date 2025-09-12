import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type { PaletteMode } from '@mui/material';

interface PaletteModeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

const PaletteModeContext = createContext<PaletteModeContextType | undefined>(undefined);

export function PaletteModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>('dark');

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [mode],
  );

  return (
    <PaletteModeContext.Provider value={colorMode}>
      {children}
    </PaletteModeContext.Provider>
  );
}

export function usePaletteMode() {
  const context = useContext(PaletteModeContext);
  if (context === undefined) {
    throw new Error('usePaletteMode must be used within a PaletteModeProvider');
  }
  return context;
}