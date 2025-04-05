import React from 'react';
import { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from '../contexts/AuthContext';
import { UserProvider } from '../contexts/UserContext';
import { StyleProvider } from '../contexts/StyleContext';
import theme from '../styles/theme';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <UserProvider>
          <StyleProvider>
            <Component {...pageProps} />
          </StyleProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;
