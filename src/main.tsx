// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { PaletteModeProvider } from './lib/context/PaletteModeContext.tsx';
import ThemeWrapper from './components/common/ThemeWrapper.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PaletteModeProvider>
        <ThemeWrapper>
          <App />
        </ThemeWrapper>
      </PaletteModeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);