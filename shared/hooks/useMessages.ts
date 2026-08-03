import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiClient } from '../api';
import { createMessageService, type ConversationFilters } from '../services/messageService';
import type { Conversation, Message } from '../types';

const CONVERSATION_LIST_POLL_INTERVAL = 15000;
const CONVERSATION_LIST_POLL_INTERVAL_WITH_ECHO = 60000;
const MESSAGE_POLL_INTERVAL = 5000;
const MESSAGE_POLL_INTERVAL_WITH_ECHO = 30000;

export interface RealtimeConfig {
  getEcho: () => any;
  userId?: number;
}

export function useConversations(api: ApiClient, realtime?: RealtimeConfig) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastParamsRef = useRef<ConversationFilters | undefined>(undefined);
  const serviceRef = useRef(createMessageService(api));
  const echoConnectedRef = useRef(false);

  const fetchConversations = useCallback(async (params?: ConversationFilters) => {
    try {
      setLoading(true);
      setError(null);
      lastParamsRef.current = params;

      const response = await serviceRef.current.getConversations(params);
      setConversations(response.conversations || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to Echo for real-time conversation updates
  useEffect(() => {
    if (!realtime?.getEcho || !realtime?.userId) return;

    let channelName: string | null = null;
    try {
      const echo = realtime.getEcho();
      if (!echo) return;

      channelName = `user.${realtime.userId}.conversations`;
      echoConnectedRef.current = true;

      echo.private(channelName).listen('.conversation.updated', (event: any) => {
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === event.conversation_id);
          if (idx === -1) {
            fetchConversations(lastParamsRef.current);
            return prev;
          }
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            last_message: event.last_message,
            unread_count: event.unread_count,
            updated_at: event.last_message.created_at,
          };
          updated.sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
          );
          return updated;
        });
      });
    } catch (err) {
      console.error('Echo subscription failed (conversations):', err);
      return;
    }

    return () => {
      try {
        const echo = realtime.getEcho();
        if (echo && channelName) echo.leave(channelName);
      } catch { /* ignore */ }
      echoConnectedRef.current = false;
    };
  }, [realtime?.getEcho, realtime?.userId, fetchConversations]);

  // Poll for conversation list updates (slower when Echo is connected)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await serviceRef.current.getConversations(lastParamsRef.current);
        setConversations(response.conversations || []);
      } catch {
        // Silent fail on poll
      }
    }, echoConnectedRef.current ? CONVERSATION_LIST_POLL_INTERVAL_WITH_ECHO : CONVERSATION_LIST_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return { conversations, loading, error, fetchConversations };
}

export function useConversation(api: ApiClient, conversationId?: number, realtime?: RealtimeConfig) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const serviceRef = useRef(createMessageService(api));
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const echoConnectedRef = useRef(false);

  const fetchConversation = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await serviceRef.current.getConversation(id);
      setConversation(response.conversation);
      setMessages(response.messages || []);
      setHasMore((response.messages?.length || 0) === 50);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversation');
      setConversation(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMoreMessages = useCallback(async (before?: number) => {
    if (!conversationId) return;

    try {
      const response = await serviceRef.current.getMessages(conversationId, before);

      if (before) {
        setMessages((prev) => [...(response.messages || []), ...prev]);
      } else {
        setMessages(response.messages || []);
      }
      setHasMore(response.has_more);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string, type?: string, metadata?: any, attachmentIds?: number[]): Promise<Message | null> => {
    if (!conversationId) return null;

    try {
      const response = await serviceRef.current.sendMessage(conversationId, content, type, metadata, attachmentIds);
      const newMessage = response.message;
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      return null;
    }
  }, [conversationId]);

  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      await serviceRef.current.markAsRead(conversationId);
      setConversation((prev) => prev ? { ...prev, unread_count: 0 } : prev);
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId);
    }
  }, [conversationId, fetchConversation]);

  // Subscribe to Echo for real-time messages in the active conversation
  useEffect(() => {
    if (!conversationId || !realtime?.getEcho) return;

    let channelName: string | null = null;
    try {
      const echo = realtime.getEcho();
      if (!echo) return;

      channelName = `conversation.${conversationId}`;
      echoConnectedRef.current = true;

      echo.private(channelName).listen('.message.sent', (event: any) => {
        const newMessage: Message = event.message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      });
    } catch (err) {
      console.error('Echo subscription failed (messages):', err);
      return;
    }

    return () => {
      try {
        const echo = realtime.getEcho();
        if (echo && channelName) echo.leave(channelName);
      } catch { /* ignore */ }
      echoConnectedRef.current = false;
    };
  }, [conversationId, realtime?.getEcho]);

  // Poll for new messages (slower when Echo is connected)
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(async () => {
      try {
        const currentMessages = messagesRef.current;
        const latestId = currentMessages.length > 0
          ? currentMessages[currentMessages.length - 1].id
          : undefined;
        if (!latestId) return;

        const response = await serviceRef.current.getMessages(conversationId, undefined, latestId);
        if (response.messages && response.messages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMsgs = response.messages.filter((m: Message) => !existingIds.has(m.id));
            return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
          });
        }
      } catch {
        // Silent fail on poll
      }
    }, echoConnectedRef.current ? MESSAGE_POLL_INTERVAL_WITH_ECHO : MESSAGE_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [conversationId]);

  return {
    conversation,
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    markAsRead,
    fetchMoreMessages,
  };
}

export function useUnreadCount(api: ApiClient, realtime?: RealtimeConfig) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef(createMessageService(api));
  const echoConnectedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await serviceRef.current.getUnreadCount();
      setUnreadCount(response.unread_count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch unread count');
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to Echo for real-time unread count updates
  useEffect(() => {
    if (!realtime?.getEcho || !realtime?.userId) return;

    let channelName: string | null = null;
    try {
      const echo = realtime.getEcho();
      if (!echo) return;

      channelName = `user.${realtime.userId}.conversations`;
      echoConnectedRef.current = true;

      echo.private(channelName).listen('.conversation.updated', () => {
        refresh();
      });
    } catch (err) {
      console.error('Echo subscription failed (unread count):', err);
      return;
    }

    return () => {
      try {
        const echo = realtime.getEcho();
        if (echo && channelName) echo.leave(channelName);
      } catch { /* ignore */ }
      echoConnectedRef.current = false;
    };
  }, [realtime?.getEcho, realtime?.userId, refresh]);

  // Poll unread count (slower when Echo is connected)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await serviceRef.current.getUnreadCount();
        setUnreadCount(response.unread_count || 0);
      } catch {
        // Silent fail on poll
      }
    }, echoConnectedRef.current ? CONVERSATION_LIST_POLL_INTERVAL_WITH_ECHO : CONVERSATION_LIST_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return { unreadCount, loading, error, refresh };
}
