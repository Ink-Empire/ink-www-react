import React, { useEffect, useState } from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Analytics } from '@vercel/analytics/next';
import { AuthProvider } from '../contexts/AuthContext';
import { StyleProvider } from '../contexts/StyleContext';
import { TagProvider } from '../contexts/TagContext';
import { DialogProvider } from '../contexts/DialogContext';
import { ImageCacheProvider } from '../contexts/ImageCacheContext';
import { DemoModeProvider } from '../contexts/DemoModeContext';
import { preloadGoogleMaps } from '../services/googlePlacesService';
import FeedbackFAB from '../components/FeedbackFAB';
import theme from '../styles/theme';
import '../styles/globals.css';

// Initialize MSW for browser-side mocking in tests
async function initMSW() {
  if (process.env.NEXT_PUBLIC_MSW_ENABLED === 'true' && typeof window !== 'undefined') {
    const { worker } = await import('../mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: true,
    });
  }
}

// Start MSW before app renders (only in test mode)
if (process.env.NEXT_PUBLIC_MSW_ENABLED === 'true') {
  initMSW();
}

function MyApp({ Component, pageProps }: AppProps) {
  const [mswReady, setMswReady] = useState(
    process.env.NEXT_PUBLIC_MSW_ENABLED !== 'true'
  );

  // Preload Google Maps SDK for faster location autocomplete
  useEffect(() => {
    preloadGoogleMaps();
  }, []);

  // Wait for MSW to be ready before rendering in test mode
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MSW_ENABLED === 'true') {
      initMSW().then(() => setMswReady(true));
    }
  }, []);

  // Don't render until MSW is ready (only affects test mode)
  if (!mswReady) {
    return null;
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
      <AuthProvider>
        <DemoModeProvider>
          <ImageCacheProvider>
            <StyleProvider>
              <TagProvider>
                <DialogProvider>
                  <Component {...pageProps} />
                  <FeedbackFAB />
                </DialogProvider>
              </TagProvider>
            </StyleProvider>
          </ImageCacheProvider>
        </DemoModeProvider>
      </AuthProvider>
    </ThemeProvider>
      <Analytics />
    </>
  );
}

export default MyApp;
