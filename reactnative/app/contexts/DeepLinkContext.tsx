import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Linking } from 'react-native';
import { useAuth } from './AuthContext';

interface DeepLinkContextType {
  pendingUrl: string | null;
  consumePendingUrl: () => string | null;
}

const DeepLinkContext = createContext<DeepLinkContextType>({
  pendingUrl: null,
  consumePendingUrl: () => null,
});

export function DeepLinkProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  useEffect(() => {
    // Only capture URLs when the user is NOT authenticated
    if (isLoading || isAuthenticated) return;

    // Check for a URL that launched the app (cold start while logged out)
    Linking.getInitialURL().then((url) => {
      if (url) setPendingUrl(url);
    });

    // Listen for URLs arriving while the app is open but user is logged out
    const subscription = Linking.addEventListener('url', ({ url }) => {
      setPendingUrl(url);
    });

    return () => subscription.remove();
  }, [isLoading, isAuthenticated]);

  const consumePendingUrl = useCallback(() => {
    const url = pendingUrl;
    setPendingUrl(null);
    return url;
  }, [pendingUrl]);

  return (
    <DeepLinkContext.Provider value={{ pendingUrl, consumePendingUrl }}>
      {children}
    </DeepLinkContext.Provider>
  );
}

export const useDeepLink = () => useContext(DeepLinkContext);
