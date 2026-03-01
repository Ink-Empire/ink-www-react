import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { api } from '../../lib/api';
import { useUnreadNotificationCount } from '@inkedin/shared/hooks';
import { setOnPushReceivedCallback } from '../hooks/usePushNotifications';

interface UnreadNotificationContextType {
  unreadCount: number;
  refresh: () => Promise<void>;
}

const UnreadNotificationContext = createContext<UnreadNotificationContextType>({
  unreadCount: 0,
  refresh: async () => {},
});

export const UnreadNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { unreadCount, refresh } = useUnreadNotificationCount(api);

  useEffect(() => {
    setOnPushReceivedCallback(() => refresh());
    return () => setOnPushReceivedCallback(null);
  }, [refresh]);

  return (
    <UnreadNotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </UnreadNotificationContext.Provider>
  );
};

export function useUnreadNotifications() {
  return useContext(UnreadNotificationContext);
}
