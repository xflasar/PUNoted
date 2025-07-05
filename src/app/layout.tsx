// src/app/layout.tsx
import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';

import { PaletteModeProvider } from '@/lib/context/PaletteModeContext';
import ThemeWrapper from '@/components/common/ThemeWrapper';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'PUNoted',
  description: 'AI-powered assistant for Prosperous Universe game management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <PaletteModeProvider>
            <ThemeWrapper>
              {children}
            </ThemeWrapper>
          </PaletteModeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}