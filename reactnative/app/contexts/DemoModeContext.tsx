import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { setDemoMode } from '../../lib/api';

const DEMO_SLUGS = ['demo-user', 'demo-artist', 'demo-shop'];

interface DemoModeContextType {
  isDemoMode: boolean;
}

const DemoModeContext = createContext<DemoModeContextType>({
  isDemoMode: false,
});

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isDemoMode = !!user?.slug && DEMO_SLUGS.includes(user.slug);

  useEffect(() => {
    setDemoMode(isDemoMode);
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
