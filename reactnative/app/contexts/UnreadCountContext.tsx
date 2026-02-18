import React, { createContext, useContext, useEffect, ReactNode, useMemo } from 'react';
import { NativeModules, Platform } from 'react-native';
import { api } from '../../lib/api';
import { useUnreadCount, type RealtimeConfig } from '@inkedin/shared/hooks';
import { useAuth } from './AuthContext';
import { getEcho } from '../utils/echo';

interface UnreadCountContextType {
  unreadCount: number;
  refresh: () => Promise<void>;
}

const UnreadCountContext = createContext<UnreadCountContextType>({
  unreadCount: 0,
  refresh: async () => {},
});

export const UnreadCountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const realtime: RealtimeConfig | undefined = useMemo(
    () => user?.id ? { getEcho, userId: user.id } : undefined,
    [user?.id],
  );
  const { unreadCount, refresh } = useUnreadCount(api, realtime);

  // Sync iOS badge count whenever unreadCount changes
  useEffect(() => {
    if (Platform.OS === 'ios' && NativeModules.BadgeModule) {
      NativeModules.BadgeModule.setBadgeCount(unreadCount);
    }
  }, [unreadCount]);

  return (
    <UnreadCountContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </UnreadCountContext.Provider>
  );
};

export function useUnreadMessageCount() {
  return useContext(UnreadCountContext);
}
