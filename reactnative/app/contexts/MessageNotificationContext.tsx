import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { api } from '../../lib/api';
import { useConversations, type RealtimeConfig } from '@inkedin/shared/hooks';
import { useAuth } from './AuthContext';
import { getEcho } from '../utils/echo';
import type { Conversation } from '@inkedin/shared/types';

const NOTIFICATION_POLL_INTERVAL = 10000;
const AUTO_DISMISS_MS = 5000;

export interface MessageNotification {
  conversationId: number;
  senderName: string;
  preview: string;
}

interface MessageNotificationContextType {
  currentNotification: MessageNotification | null;
  dismiss: () => void;
  setActiveConversationId: (id: number) => void;
  clearActiveConversationId: () => void;
}

const MessageNotificationContext = createContext<MessageNotificationContextType>({
  currentNotification: null,
  dismiss: () => {},
  setActiveConversationId: () => {},
  clearActiveConversationId: () => {},
});

export const MessageNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const realtime: RealtimeConfig | undefined = useMemo(
    () => user?.id ? { getEcho, userId: user.id } : undefined,
    [user?.id],
  );

  const { conversations, fetchConversations } = useConversations(api, realtime);

  const [currentNotification, setCurrentNotification] = useState<MessageNotification | null>(null);
  const activeConversationIdRef = useRef<number | null>(null);
  const lastSeenRef = useRef<Record<number, number>>({});
  const initializedRef = useRef(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setCurrentNotification(null);
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const setActiveConversationId = useCallback((id: number) => {
    activeConversationIdRef.current = id;
    // If showing a notification for this conversation, dismiss it
    setCurrentNotification((prev) =>
      prev && prev.conversationId === id ? null : prev,
    );
  }, []);

  const clearActiveConversationId = useCallback(() => {
    activeConversationIdRef.current = null;
  }, []);

  // Seed lastSeenRef on first load so we don't fire banners for existing messages
  useEffect(() => {
    if (initializedRef.current || conversations.length === 0) return;
    initializedRef.current = true;

    const seen: Record<number, number> = {};
    for (const conv of conversations) {
      if (conv.last_message?.id) {
        seen[conv.id] = conv.last_message.id;
      }
    }
    lastSeenRef.current = seen;
  }, [conversations]);

  // Detect new messages from conversation list changes
  useEffect(() => {
    if (!initializedRef.current) return;

    for (const conv of conversations) {
      const lastMsgId = conv.last_message?.id;
      if (!lastMsgId) continue;

      const previousId = lastSeenRef.current[conv.id];
      lastSeenRef.current[conv.id] = lastMsgId;

      if (
        previousId &&
        lastMsgId > previousId &&
        conv.unread_count > 0 &&
        conv.id !== activeConversationIdRef.current &&
        conv.last_message.sender_id !== user?.id
      ) {
        const senderName = conv.participant?.name || conv.participant?.username || 'Someone';
        const msgType = conv.last_message.type;
        let preview = conv.last_message.content || 'New message';
        if (msgType === 'image') {
          preview = 'Sent an image';
        } else if (msgType === 'system') {
          preview = conv.last_message.content || 'Booking update';
        } else if (msgType === 'cancellation') {
          preview = 'Appointment cancelled';
        } else if (msgType === 'reschedule') {
          preview = 'Reschedule requested';
        } else if (msgType === 'booking_card') {
          preview = 'New booking request';
        }

        if (dismissTimerRef.current) {
          clearTimeout(dismissTimerRef.current);
        }

        setCurrentNotification({
          conversationId: conv.id,
          senderName,
          preview,
        });

        dismissTimerRef.current = setTimeout(() => {
          setCurrentNotification(null);
          dismissTimerRef.current = null;
        }, AUTO_DISMISS_MS);

        break;
      }
    }
  }, [conversations, user?.id]);

  // Poll conversation list for updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
    }, NOTIFICATION_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Refetch when app returns to foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        fetchConversations();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [fetchConversations]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      currentNotification,
      dismiss,
      setActiveConversationId,
      clearActiveConversationId,
    }),
    [currentNotification, dismiss, setActiveConversationId, clearActiveConversationId],
  );

  return (
    <MessageNotificationContext.Provider value={value}>
      {children}
    </MessageNotificationContext.Provider>
  );
};

export function useMessageNotification() {
  return useContext(MessageNotificationContext);
}
