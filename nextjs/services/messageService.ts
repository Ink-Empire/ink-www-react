import { api } from '../utils/api';

export interface SendMessageData {
  appointment_id: number;
  content: string;
  attachments?: number[];
}

export interface Conversation {
  id: number;
  appointment_id: number;
  participant: {
    id: number;
    name: string;
    username: string;
    image?: { uri: string };
  };
  last_message?: {
    content: string;
    created_at: string;
    is_read: boolean;
  };
  unread_count: number;
}

export interface Message {
  id: number;
  content: string;
  sender_id: number;
  created_at: string;
  is_read: boolean;
  attachments?: { id: number; uri: string }[];
}

export type ConversationType = 'booking' | 'consultation' | 'guest-spot' | 'design';

export interface ConversationFilters {
  type?: ConversationType;
  unread?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ConversationsResponse {
  conversations: any[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ConversationDetailResponse {
  conversation: any;
  messages: any[];
}

export interface MessagesResponse {
  messages: any[];
  has_more: boolean;
}

export const messageService = {
  // Get inbox/conversations list (requires auth)
  getInbox: async (): Promise<Conversation[]> => {
    const response = await api.get<any>('/messages/inbox', { requiresAuth: true });
    return response.conversations || response || [];
  },

  // Get messages for a specific appointment/conversation (requires auth)
  getByAppointment: async (appointmentId: number): Promise<Message[]> => {
    const response = await api.get<any>(`/messages/appointment/${appointmentId}`, {
      requiresAuth: true,
    });
    return response.messages || response || [];
  },

  // Send a message (requires auth)
  send: async (data: SendMessageData): Promise<Message> => {
    return api.post('/messages/send', data, { requiresAuth: true });
  },

  // Mark a message as read (requires auth)
  markAsRead: async (messageId: number): Promise<void> => {
    return api.put(`/messages/${messageId}/read`, {}, { requiresAuth: true });
  },

  // Mark all messages in a conversation as read (requires auth)
  markConversationAsRead: async (appointmentId: number): Promise<void> => {
    return api.put(`/messages/appointment/${appointmentId}/read`, {}, {
      requiresAuth: true,
    });
  },

  // Get unread message count (requires auth)
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ count: number }>('/messages/unread-count', {
      requiresAuth: true,
    });
    return response.count || 0;
  },

  // Delete a message (requires auth)
  delete: async (messageId: number): Promise<void> => {
    return api.delete(`/messages/${messageId}`, { requiresAuth: true });
  },

  // ============ Conversation endpoints ============

  // Get conversations list with optional filters (requires auth)
  getConversations: async (filters?: ConversationFilters): Promise<ConversationsResponse> => {
    const queryParams = new URLSearchParams();
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.unread) queryParams.append('unread', '1');
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/conversations${queryString ? `?${queryString}` : ''}`;

    return api.get(endpoint, { requiresAuth: true, useCache: false });
  },

  // Get a single conversation with messages (requires auth)
  getConversation: async (conversationId: number): Promise<ConversationDetailResponse> => {
    return api.get(`/conversations/${conversationId}`, { requiresAuth: true, useCache: false });
  },

  // Get more messages for a conversation (requires auth)
  getConversationMessages: async (conversationId: number, before?: number): Promise<MessagesResponse> => {
    const endpoint = before
      ? `/conversations/${conversationId}/messages?before=${before}`
      : `/conversations/${conversationId}/messages`;
    return api.get(endpoint, { requiresAuth: true, useCache: false });
  },

  // Send a message in a conversation (requires auth)
  sendConversationMessage: async (
    conversationId: number,
    content: string,
    type: string = 'text',
    metadata?: any,
    attachmentIds?: number[]
  ): Promise<{ message: any }> => {
    return api.post(`/conversations/${conversationId}/messages`, {
      content,
      type,
      metadata,
      attachment_ids: attachmentIds,
    }, { requiresAuth: true });
  },

  // Send a booking card message (requires auth)
  sendBookingCard: async (
    conversationId: number,
    date: string,
    time: string,
    duration: string,
    depositAmount: string
  ): Promise<{ message: any }> => {
    return api.post(`/conversations/${conversationId}/messages/booking-card`, {
      date,
      time,
      duration,
      deposit_amount: depositAmount,
    }, { requiresAuth: true });
  },

  // Send a deposit request message (requires auth)
  sendDepositRequest: async (
    conversationId: number,
    amount: string,
    appointmentId?: number
  ): Promise<{ message: any }> => {
    return api.post(`/conversations/${conversationId}/messages/deposit-request`, {
      amount,
      appointment_id: appointmentId,
    }, { requiresAuth: true });
  },

  // Mark conversation as read (requires auth)
  markConversationRead: async (conversationId: number): Promise<void> => {
    return api.put(`/conversations/${conversationId}/read`, {}, { requiresAuth: true });
  },

  // Get unread conversation count (requires auth)
  getUnreadConversationCount: async (): Promise<{ unread_count: number }> => {
    return api.get('/conversations/unread-count', { requiresAuth: true, useCache: false });
  },

  // Create a new conversation (requires auth)
  createConversation: async (
    participantId: number,
    type?: ConversationType,
    initialMessage?: string,
    appointmentId?: number
  ): Promise<{ conversation: any }> => {
    return api.post('/conversations', {
      participant_id: participantId,
      type,
      initial_message: initialMessage,
      appointment_id: appointmentId,
    }, { requiresAuth: true });
  },
};
