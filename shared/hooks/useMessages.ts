import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiClient } from '../api';
import { createMessageService, type ConversationFilters } from '../services/messageService';
import type { Conversation, Message } from '../types';

const CONVERSATION_LIST_POLL_INTERVAL = 15000;
const MESSAGE_POLL_INTERVAL = 5000;

export function useConversations(api: ApiClient) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastParamsRef = useRef<ConversationFilters | undefined>(undefined);
  const serviceRef = useRef(createMessageService(api));

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

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await serviceRef.current.getConversations(lastParamsRef.current);
        setConversations(response.conversations || []);
      } catch {
        // Silent fail on poll
      }
    }, CONVERSATION_LIST_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return { conversations, loading, error, fetchConversations };
}

export function useConversation(api: ApiClient, conversationId?: number) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const serviceRef = useRef(createMessageService(api));
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

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

  const sendMessage = useCallback(async (content: string): Promise<Message | null> => {
    if (!conversationId) return null;

    try {
      const response = await serviceRef.current.sendMessage(conversationId, content);
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

  // Poll for new messages
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
          setMessages((prev) => [...prev, ...response.messages]);
        }
      } catch {
        // Silent fail on poll
      }
    }, MESSAGE_POLL_INTERVAL);

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

export function useUnreadCount(api: ApiClient) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef(createMessageService(api));

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

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await serviceRef.current.getUnreadCount();
        setUnreadCount(response.unread_count || 0);
      } catch {
        // Silent fail on poll
      }
    }, CONVERSATION_LIST_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return { unreadCount, loading, error, refresh };
}
