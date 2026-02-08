import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';

const DEMO_SLUGS = ['demo-user', 'demo-artist', 'demo-shop'];
const STORAGE_KEY = 'inkedin_demo_mode';

interface DemoModeContextType {
  isDemoMode: boolean;
}

const DemoModeContext = createContext<DemoModeContextType>({
  isDemoMode: false,
});

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isDemoMode = !!user?.slug && DEMO_SLUGS.includes(user.slug);

  // Sync to localStorage so api.ts can read it synchronously
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prev = localStorage.getItem(STORAGE_KEY) === 'true';
      if (prev !== isDemoMode) {
        localStorage.setItem(STORAGE_KEY, String(isDemoMode));
        api.clearCache();
      }
    }
  }, [isDemoMode]);

  return (
    <DemoModeContext.Provider value={{ isDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}

export default DemoModeContext;
