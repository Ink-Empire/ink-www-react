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

// Initialize MSW for browser-side mocking in tests.
// The start promise is memoized: module scope, useEffect, and StrictMode
// re-runs all share one worker.start() (msw v2 throws if started twice).
let mswStartPromise: Promise<void> | null = null;
function initMSW(): Promise<void> {
  if (process.env.NEXT_PUBLIC_MSW_ENABLED !== 'true' || typeof window === 'undefined') {
    return Promise.resolve();
  }
  if (!mswStartPromise) {
    mswStartPromise = import('../mocks/browser')
      .then(({ worker }) =>
        worker.start({
          onUnhandledRequest: 'bypass',
          quiet: true,
        })
      )
      .then(() => undefined);
  }
  return mswStartPromise;
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
