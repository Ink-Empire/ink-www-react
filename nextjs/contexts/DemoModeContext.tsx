import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';

const DEMO_SLUGS = ['demo-user', 'demo-artist', 'demo-shop'];
const STORAGE_KEY = 'inkedin_demo_mode';

interface DemoModeContextType {
  isDemoMode: boolean;
  /** True when demo mode comes from a demo account (cannot be toggled off). */
  isDemoAccount: boolean;
  /** Manual visitor toggle; no-op for demo accounts. */
  setDemoMode: (enabled: boolean) => void;
}

const DemoModeContext = createContext<DemoModeContextType>({
  isDemoMode: false,
  isDemoAccount: false,
  setDemoMode: () => {},
});

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isDemoAccount = !!user?.slug && DEMO_SLUGS.includes(user.slug);

  // Manual override for regular visitors; hydrated from localStorage after
  // mount so server and first client render agree.
  const [manualDemo, setManualDemo] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setManualDemo(localStorage.getItem(STORAGE_KEY) === 'true');
    setHydrated(true);
  }, []);

  const isDemoMode = isDemoAccount || manualDemo;

  // Sync to localStorage so api.ts can read it synchronously.
  // Never write before hydration: the first render's default (false) must
  // not stomp a stored manual toggle.
  useEffect(() => {
    if (typeof window !== 'undefined' && hydrated) {
      const prev = localStorage.getItem(STORAGE_KEY) === 'true';
      if (prev !== isDemoMode) {
        localStorage.setItem(STORAGE_KEY, String(isDemoMode));
        api.clearCache();
      }
    }
  }, [isDemoMode, hydrated]);

  const setDemoMode = (enabled: boolean) => {
    if (isDemoAccount) return;
    setManualDemo(enabled);
  };

  return (
    <DemoModeContext.Provider value={{ isDemoMode, isDemoAccount, setDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}

export default DemoModeContext;
