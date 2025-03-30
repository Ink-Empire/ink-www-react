import React from 'react';
import { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { UserProvider } from '../contexts/UserContext';
import { StyleProvider } from '../contexts/StyleContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <UserProvider>
        <StyleProvider>
          <Component {...pageProps} />
        </StyleProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default MyApp;
