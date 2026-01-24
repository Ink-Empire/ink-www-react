import React, { useEffect } from 'react';
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

function MyApp({ Component, pageProps }: AppProps) {
  // Preload Google Maps SDK for faster location autocomplete
  useEffect(() => {
    preloadGoogleMaps();
  }, []);

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
