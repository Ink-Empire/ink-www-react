import { useState, useEffect, useCallback, useRef } from 'react';
import { messageService, ConversationType } from '../services/messageService';

const CONVERSATION_LIST_POLL_INTERVAL = 15000; // 15s for sidebar
const MESSAGE_POLL_INTERVAL = 5000; // 5s for active conversation

// Re-export ConversationType for external use
export type { ConversationType } from '../services/messageService';

export interface Participant {
  id: number;
  name: string | null;
  username: string;
  slug: string | null;
  initials: string;
  image: {
    id: number;
    uri: string;
  } | null;
  is_online: boolean;
  last_seen_at: string | null;
}

export interface LastMessage {
  id: number;
  content: string;
  type: string;
  sender_id: number;
  created_at: string;
}

export interface Appointment {
  id: number;
  status: string;
  date: string;
  start_time: string;
  end_time: string;
  title: string | null;
  description: string | null;
  placement: string | null;
  timezone: string | null;
}

export interface ApiConversation {
  id: number;
  type: ConversationType;
  participant: Participant | null;
  last_message: LastMessage | null;
  unread_count: number;
  appointment: Appointment | null;
  created_at: string;
  updated_at: string;
}

export interface MessageAttachment {
  id: number;
  image: {
    id: number;
    uri: string;
  } | null;
}

export interface MessageSender {
  id: number;
  name: string | null;
  username: string;
  initials: string;
  image: {
    id: number;
    uri: string;
  } | null;
}

export interface ApiMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender: MessageSender;
  content: string;
  type: string;
  metadata: {
    date?: string;
    time?: string;
    duration?: string;
    deposit?: string;
    amount?: string;
    appointment_id?: number;
    tattoo_id?: number;
    notes?: string;
    items?: { description: string; amount: string }[];
    total?: string;
    valid_until?: string;
  } | null;
  attachments: MessageAttachment[];
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversationsResponse {
  conversations: ApiConversation[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface ConversationDetailResponse {
  conversation: ApiConversation;
  messages: ApiMessage[];
}

interface MessagesResponse {
  messages: ApiMessage[];
  has_more: boolean;
}

interface UseConversationsReturn {
  conversations: ApiConversation[];
  loading: boolean;
  error: string | null;
  meta: ConversationsResponse['meta'] | null;
  refreshConversations: () => Promise<void>;
  fetchConversations: (params?: {
    type?: ConversationType;
    unread?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  markConversationRead: (conversationId: number) => void;
}

interface UseConversationReturn {
  conversation: ApiConversation | null;
  messages: ApiMessage[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  fetchConversation: (id: number) => Promise<void>;
  fetchMoreMessages: (before?: number) => Promise<void>;
  sendMessage: (content: string, type?: string, metadata?: any, attachmentIds?: number[]) => Promise<ApiMessage | null>;
  sendBookingCard: (date: string, time: string, duration: string, depositAmount: string) => Promise<ApiMessage | null>;
  sendDepositRequest: (amount: string, appointmentId?: number) => Promise<ApiMessage | null>;
  markAsRead: () => Promise<void>;
  updateAppointmentStatus: (status: string) => void;
}

interface UseUnreadCountReturn {
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ConversationsResponse['meta'] | null>(null);
  const lastParamsRef = useRef<any>(undefined);

  const fetchConversations = useCallback(async (params?: {
    type?: ConversationType;
    unread?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      lastParamsRef.current = params;

      const response = await messageService.getConversations({
        type: params?.type,
        unread: params?.unread,
        search: params?.search,
        page: params?.page,
        limit: params?.limit,
      });

      setConversations(response.conversations || []);
      setMeta(response.meta || null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    await fetchConversations();
  }, [fetchConversations]);

  const markConversationRead = useCallback((conversationId: number) => {
    setConversations((prev) =>
      prev.map((c) => c.id === conversationId ? { ...c, unread_count: 0 } : c)
    );
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Poll for conversation list updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const params = lastParamsRef.current;
        const response = await messageService.getConversations({
          type: params?.type,
          unread: params?.unread,
          search: params?.search,
          page: params?.page,
          limit: params?.limit,
        });
        setConversations(response.conversations || []);
        setMeta(response.meta || null);
      } catch {
        // Silent fail on poll — don't overwrite existing data
      }
    }, CONVERSATION_LIST_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return {
    conversations,
    loading,
    error,
    meta,
    refreshConversations,
    fetchConversations,
    markConversationRead,
  };
}

export function useConversation(conversationId?: number): UseConversationReturn {
  const [conversation, setConversation] = useState<ApiConversation | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const fetchConversation = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await messageService.getConversation(id);

      setConversation(response.conversation);
      setMessages(response.messages || []);
      setHasMore(response.messages?.length === 50);
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
      const response = await messageService.getConversationMessages(conversationId, before);

      if (before) {
        // Prepend older messages
        setMessages((prev) => [...(response.messages || []), ...prev]);
      } else {
        setMessages(response.messages || []);
      }
      setHasMore(response.has_more);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [conversationId]);

  const sendMessage = useCallback(async (
    content: string,
    type: string = 'text',
    metadata?: any,
    attachmentIds?: number[]
  ): Promise<ApiMessage | null> => {
    if (!conversationId) return null;

    try {
      const response = await messageService.sendConversationMessage(
        conversationId,
        content,
        type,
        metadata,
        attachmentIds
      );

      const newMessage = response.message;
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      return null;
    }
  }, [conversationId]);

  const sendBookingCard = useCallback(async (
    date: string,
    time: string,
    duration: string,
    depositAmount: string
  ): Promise<ApiMessage | null> => {
    if (!conversationId) return null;

    try {
      const response = await messageService.sendBookingCard(
        conversationId,
        date,
        time,
        duration,
        depositAmount
      );

      const newMessage = response.message;
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      console.error('Error sending booking card:', err);
      return null;
    }
  }, [conversationId]);

  const sendDepositRequest = useCallback(async (
    amount: string,
    appointmentId?: number
  ): Promise<ApiMessage | null> => {
    if (!conversationId) return null;

    try {
      const response = await messageService.sendDepositRequest(conversationId, amount, appointmentId);

      const newMessage = response.message;
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      console.error('Error sending deposit request:', err);
      return null;
    }
  }, [conversationId]);

  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      await messageService.markConversationRead(conversationId);
      setConversation((prev) => prev ? { ...prev, unread_count: 0 } : prev);
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  }, [conversationId]);

  const updateAppointmentStatus = useCallback((status: string) => {
    setConversation((prev) => {
      if (!prev || !prev.appointment) return prev;
      return {
        ...prev,
        appointment: {
          ...prev.appointment,
          status,
        },
      };
    });
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId);
    }
  }, [conversationId, fetchConversation]);

  // Poll for new messages in the active conversation
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(async () => {
      try {
        const currentMessages = messagesRef.current;
        const latestId = currentMessages.length > 0 ? currentMessages[currentMessages.length - 1].id : undefined;
        if (!latestId) return;

        const response = await messageService.getConversationMessages(conversationId, undefined, latestId);
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
    fetchConversation,
    fetchMoreMessages,
    sendMessage,
    sendBookingCard,
    sendDepositRequest,
    markAsRead,
    updateAppointmentStatus,
  };
}

export function useUnreadConversationCount(): UseUnreadCountReturn {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await messageService.getUnreadConversationCount();

      setUnreadCount(response.unread_count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch unread count');
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    fetchCount();
  }, []);

  // Poll unread count
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await messageService.getUnreadConversationCount();
        setUnreadCount(response.unread_count || 0);
      } catch {
        // Silent fail on poll
      }
    }, CONVERSATION_LIST_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return {
    unreadCount,
    loading,
    error,
    refresh,
  };
}

// Create a new conversation
export async function createConversation(
  participantId: number,
  type?: ConversationType,
  initialMessage?: string,
  appointmentId?: number
): Promise<ApiConversation | null> {
  try {
    const response = await messageService.createConversation(
      participantId,
      type,
      initialMessage,
      appointmentId
    );

    return response.conversation;
  } catch (err) {
    console.error('Error creating conversation:', err);
    return null;
  }
}
