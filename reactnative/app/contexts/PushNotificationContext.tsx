import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface PushNotificationContextType {
  currentNotification: PushNotification | null;
  show: (notification: PushNotification) => void;
  dismiss: () => void;
}

const PushNotificationContext = createContext<PushNotificationContextType>({
  currentNotification: null,
  show: () => {},
  dismiss: () => {},
});

const AUTO_DISMISS_MS = 5000;

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const [currentNotification, setCurrentNotification] = useState<PushNotification | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setCurrentNotification(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback((notification: PushNotification) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentNotification(notification);
    timerRef.current = setTimeout(() => {
      setCurrentNotification(null);
      timerRef.current = null;
    }, AUTO_DISMISS_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <PushNotificationContext.Provider value={{ currentNotification, show, dismiss }}>
      {children}
    </PushNotificationContext.Provider>
  );
}

export function usePushNotificationBanner() {
  return useContext(PushNotificationContext);
}
