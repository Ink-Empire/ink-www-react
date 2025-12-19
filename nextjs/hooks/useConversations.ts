import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

// Types that match the API response
export type ConversationType = 'booking' | 'consultation' | 'guest-spot' | 'design';

export interface Participant {
  id: number;
  name: string | null;
  username: string;
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

      const queryParams = new URLSearchParams();
      if (params?.type) queryParams.append('type', params.type);
      if (params?.unread) queryParams.append('unread', '1');
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const endpoint = `/conversations${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<ConversationsResponse>(endpoint, {
        requiresAuth: true,
        useCache: false,
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

  useEffect(() => {
    fetchConversations();
  }, []);

  return {
    conversations,
    loading,
    error,
    meta,
    refreshConversations,
    fetchConversations,
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

      const response = await api.get<ConversationDetailResponse>(`/conversations/${id}`, {
        requiresAuth: true,
        useCache: false,
      });

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
      const endpoint = before
        ? `/conversations/${conversationId}/messages?before=${before}`
        : `/conversations/${conversationId}/messages`;

      const response = await api.get<MessagesResponse>(endpoint, {
        requiresAuth: true,
        useCache: false,
      });

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
      const response = await api.post<{ message: ApiMessage }>(
        `/conversations/${conversationId}/messages`,
        {
          content,
          type,
          metadata,
          attachment_ids: attachmentIds,
        },
        { requiresAuth: true }
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
      const response = await api.post<{ message: ApiMessage }>(
        `/conversations/${conversationId}/messages/booking-card`,
        {
          date,
          time,
          duration,
          deposit_amount: depositAmount,
        },
        { requiresAuth: true }
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
      const response = await api.post<{ message: ApiMessage }>(
        `/conversations/${conversationId}/messages/deposit-request`,
        {
          amount,
          appointment_id: appointmentId,
        },
        { requiresAuth: true }
      );

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
      await api.put(`/conversations/${conversationId}/read`, {}, { requiresAuth: true });
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId);
    }
  }, [conversationId, fetchConversation]);

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

      const response = await api.get<{ unread_count: number }>('/conversations/unread-count', {
        requiresAuth: true,
        useCache: false,
      });

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
    const response = await api.post<{ conversation: ApiConversation }>(
      '/conversations',
      {
        participant_id: participantId,
        type,
        initial_message: initialMessage,
        appointment_id: appointmentId,
      },
      { requiresAuth: true }
    );

    return response.conversation;
  } catch (err) {
    console.error('Error creating conversation:', err);
    return null;
  }
}
