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
};
