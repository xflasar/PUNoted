import { createTheme, type PaletteMode } from '@mui/material';

export const getAppTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      primary: {
        main: 'rgba(123, 104, 238, 1)',
      },
      text: {
        primary: 'rgba(200,200,200,0.9)',
      },
      background: {
        paper: 'linear-gradient(135deg, rgba(20, 20, 50, 0.8), rgba(10, 10, 30, 0.8))'
      },
      mode,
    },
    components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Apply scrollbar styles for Firefox
        body: {
          scrollbarColor: "rgba(123, 104, 238, 1) rgba(43, 43, 43, 0.2)",
          scrollbarWidth: 'thin',
        },
        "&::-webkit-scrollbar": {
          width: '5px',
          height: '5px',
        },
        "&::-webkit-scrollbar-track": {
          background: 'rgba(43, 43, 43, 0.2)',
          borderRadius: '10px',
        },
        "&::-webkit-scrollbar-thumb": {
          background: 'rgba(123, 104, 238, 1)',
          borderRadius: '10px',
        },
        "&::-webkit-scrollbar-thumb:hover": {
          background: 'rgba(123, 104, 238, 0.8)',
        },
      },
    },
  },
  });
