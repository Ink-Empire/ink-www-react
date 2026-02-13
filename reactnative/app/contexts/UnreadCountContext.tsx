import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { NativeModules, Platform } from 'react-native';
import { api } from '../../lib/api';
import { createMessageService } from '@inkedin/shared/services';

const POLL_INTERVAL = 15000;

interface UnreadCountContextType {
  unreadCount: number;
  refresh: () => Promise<void>;
}

const UnreadCountContext = createContext<UnreadCountContextType>({
  unreadCount: 0,
  refresh: async () => {},
});

const messageService = createMessageService(api);

export const UnreadCountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const response = await messageService.getUnreadCount();
      if (mountedRef.current) {
        const count = response.unread_count || 0;
        setUnreadCount(count);
        if (Platform.OS === 'ios' && NativeModules.BadgeModule) {
          NativeModules.BadgeModule.setBadgeCount(count);
        }
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();

    const interval = setInterval(refresh, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [refresh]);

  return (
    <UnreadCountContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </UnreadCountContext.Provider>
  );
};

export function useUnreadMessageCount() {
  return useContext(UnreadCountContext);
}
