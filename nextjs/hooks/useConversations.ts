import { useState, useEffect, useCallback, useRef } from 'react';
import { messageService, ConversationType } from '../services/messageService';
import { useAuth } from '../contexts/AuthContext';
import { getEcho } from '../utils/echo';

const CONVERSATION_LIST_POLL_INTERVAL = 15000; // 15s for sidebar
const CONVERSATION_LIST_POLL_INTERVAL_WITH_ECHO = 60000; // 60s fallback when Echo connected
const MESSAGE_POLL_INTERVAL = 5000; // 5s for active conversation
const MESSAGE_POLL_INTERVAL_WITH_ECHO = 30000; // 30s fallback when Echo connected

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
    reason?: string;
    proposed_date?: string;
    proposed_start_time?: string;
    proposed_end_time?: string;
    status?: 'pending' | 'accepted' | 'declined';
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
  sendCancellation: (appointmentId: number, reason?: string) => Promise<ApiMessage | null>;
  sendReschedule: (appointmentId: number, proposedDate: string, proposedStartTime: string, proposedEndTime: string, reason?: string) => Promise<ApiMessage | null>;
  respondToMessage: (messageId: number, action: 'accept' | 'decline') => Promise<ApiMessage | null>;
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
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ConversationsResponse['meta'] | null>(null);
  const lastParamsRef = useRef<any>(undefined);
  const echoConnectedRef = useRef(false);

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

  // Subscribe to Echo for real-time conversation updates
  useEffect(() => {
    if (!user?.id) return;

    let channelName: string | null = null;
    try {
      const echo = getEcho();
      if (!echo) return;

      channelName = `user.${user.id}.conversations`;
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
          updated.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          return updated;
        });
      });
    } catch (err) {
      console.error('Echo subscription failed (conversations):', err);
      return;
    }

    return () => {
      try {
        const echo = getEcho();
        if (echo && channelName) echo.leave(channelName);
      } catch { /* ignore */ }
      echoConnectedRef.current = false;
    };
  }, [user?.id, fetchConversations]);

  // Poll for conversation list updates (slower when Echo is connected)
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
        // Silent fail on poll
      }
    }, echoConnectedRef.current ? CONVERSATION_LIST_POLL_INTERVAL_WITH_ECHO : CONVERSATION_LIST_POLL_INTERVAL);

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
  const echoConnectedRef = useRef(false);

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

  const sendCancellation = useCallback(async (
    appointmentId: number,
    reason?: string
  ): Promise<ApiMessage | null> => {
    if (!conversationId) return null;

    try {
      const response = await messageService.sendCancellation(conversationId, appointmentId, reason);
      const newMessage = response.message;
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      console.error('Error sending cancellation:', err);
      return null;
    }
  }, [conversationId]);

  const sendReschedule = useCallback(async (
    appointmentId: number,
    proposedDate: string,
    proposedStartTime: string,
    proposedEndTime: string,
    reason?: string
  ): Promise<ApiMessage | null> => {
    if (!conversationId) return null;

    try {
      const response = await messageService.sendReschedule(
        conversationId, appointmentId, proposedDate, proposedStartTime, proposedEndTime, reason
      );
      const newMessage = response.message;
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      console.error('Error sending reschedule request:', err);
      return null;
    }
  }, [conversationId]);

  const respondToMessage = useCallback(async (
    messageId: number,
    action: 'accept' | 'decline'
  ): Promise<ApiMessage | null> => {
    if (!conversationId) return null;

    try {
      const response = await messageService.respondToMessage(conversationId, messageId, action);
      const updatedMessage = response.message;
      // Update the message in place
      setMessages((prev) => prev.map((m) => m.id === messageId ? updatedMessage : m));
      return updatedMessage;
    } catch (err) {
      console.error('Error responding to message:', err);
      return null;
    }
  }, [conversationId]);

  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      await messageService.markConversationRead(conversationId);
      setConversation((prev) => prev ? { ...prev, unread_count: 0 } : prev);
      window.dispatchEvent(new Event('conversations:read'));
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

  // Subscribe to Echo for real-time messages in the active conversation
  useEffect(() => {
    if (!conversationId) return;

    let channelName: string | null = null;
    try {
      const echo = getEcho();
      if (!echo) return;

      channelName = `conversation.${conversationId}`;
      echoConnectedRef.current = true;

      echo.private(channelName).listen('.message.sent', (event: any) => {
        const newMessage: ApiMessage = event.message;
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
        const echo = getEcho();
        if (echo && channelName) echo.leave(channelName);
      } catch { /* ignore */ }
      echoConnectedRef.current = false;
    };
  }, [conversationId]);

  // Poll for new messages in the active conversation (slower when Echo connected)
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
          // Deduplicate by message ID
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMessages = response.messages.filter((m: ApiMessage) => !existingIds.has(m.id));
            return newMessages.length > 0 ? [...prev, ...newMessages] : prev;
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
    fetchConversation,
    fetchMoreMessages,
    sendMessage,
    sendBookingCard,
    sendDepositRequest,
    sendCancellation,
    sendReschedule,
    respondToMessage,
    markAsRead,
    updateAppointmentStatus,
  };
}

export function useUnreadConversationCount(): UseUnreadCountReturn {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const echoConnectedRef = useRef(false);

  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await messageService.getUnreadConversationCount();

      setUnreadCount(response.unread_count || 0);
    } catch (err) {
      // Silent fail for auth errors (user not logged in)
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

  // Subscribe to Echo for real-time unread count updates
  useEffect(() => {
    if (!user?.id) return;

    let channelName: string | null = null;
    try {
      const echo = getEcho();
      if (!echo) return;

      channelName = `user.${user.id}.conversations`;
      echoConnectedRef.current = true;

      echo.private(channelName).listen('.conversation.updated', () => {
        fetchCount();
      });
    } catch (err) {
      console.error('Echo subscription failed (unread count):', err);
      return;
    }

    return () => {
      try {
        const echo = getEcho();
        if (echo && channelName) echo.leave(channelName);
      } catch { /* ignore */ }
      echoConnectedRef.current = false;
    };
  }, [user?.id, fetchCount]);

  // Poll unread count (slower when Echo connected)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await messageService.getUnreadConversationCount();
        setUnreadCount(response.unread_count || 0);
      } catch {
        // Silent fail on poll
      }
    }, echoConnectedRef.current ? CONVERSATION_LIST_POLL_INTERVAL_WITH_ECHO : CONVERSATION_LIST_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Listen for mark-as-read events from the inbox to refresh immediately
  useEffect(() => {
    const handler = () => { fetchCount(); };
    window.addEventListener('conversations:read', handler);
    return () => window.removeEventListener('conversations:read', handler);
  }, [fetchCount]);

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
