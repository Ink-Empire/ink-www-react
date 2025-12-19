import React from 'react';
import { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from '../contexts/AuthContext';
import { StyleProvider } from '../contexts/StyleContext';
import { TagProvider } from '../contexts/TagContext';
import { DialogProvider } from '../contexts/DialogContext';
import theme from '../styles/theme';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <StyleProvider>
          <TagProvider>
            <DialogProvider>
              <Component {...pageProps} />
            </DialogProvider>
          </TagProvider>
        </StyleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;
