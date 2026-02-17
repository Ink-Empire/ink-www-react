import type { ApiClient } from '../api';

export type ConversationType = 'booking' | 'consultation' | 'guest-spot' | 'design';

export interface ConversationFilters {
  type?: ConversationType;
  unread?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export function createMessageService(api: ApiClient) {
  return {
    getConversations: (filters?: ConversationFilters) => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.unread) params.append('unread', '1');
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const query = params.toString();
      const endpoint = `/conversations${query ? `?${query}` : ''}`;

      return api.get<any>(endpoint, { requiresAuth: true, useCache: false });
    },

    getConversation: (id: number) =>
      api.get<any>(`/conversations/${id}`, { requiresAuth: true, useCache: false }),

    getMessages: (conversationId: number, before?: number, after?: number) => {
      const params = new URLSearchParams();
      if (before) params.set('before', String(before));
      if (after) params.set('after', String(after));
      const query = params.toString();
      const endpoint = `/conversations/${conversationId}/messages${query ? `?${query}` : ''}`;
      return api.get<any>(endpoint, { requiresAuth: true, useCache: false });
    },

    sendMessage: (conversationId: number, content: string, type: string = 'text', metadata?: any, attachmentIds?: number[]) =>
      api.post<any>(`/conversations/${conversationId}/messages`, {
        content,
        type,
        metadata,
        attachment_ids: attachmentIds,
      }, { requiresAuth: true }),

    markAsRead: (conversationId: number) =>
      api.put(`/conversations/${conversationId}/read`, {}, { requiresAuth: true }),

    getUnreadCount: () =>
      api.get<any>('/conversations/unread-count', { requiresAuth: true, useCache: false }),

    createConversation: (
      participantId: number,
      type?: ConversationType,
      initialMessage?: string,
      appointmentId?: number
    ) =>
      api.post<any>('/conversations', {
        participant_id: participantId,
        type,
        initial_message: initialMessage,
        appointment_id: appointmentId,
      }, { requiresAuth: true }),

    searchUsers: (query: string) =>
      api.get<{ users: Array<{ id: number; name: string; username: string; slug?: string; image?: { id: number; uri: string } | null }> }>(
        `/conversations/search-users?q=${encodeURIComponent(query)}`,
        { requiresAuth: true, useCache: false, skipDemoMode: true },
      ),

    sendCancellation: (conversationId: number, appointmentId: number, reason?: string) =>
      api.post<any>(`/conversations/${conversationId}/messages/cancellation`, {
        appointment_id: appointmentId,
        reason,
      }, { requiresAuth: true }),

    sendReschedule: (
      conversationId: number,
      appointmentId: number,
      proposedDate: string,
      proposedStartTime: string,
      proposedEndTime: string,
      reason?: string
    ) =>
      api.post<any>(`/conversations/${conversationId}/messages/reschedule`, {
        appointment_id: appointmentId,
        proposed_date: proposedDate,
        proposed_start_time: proposedStartTime,
        proposed_end_time: proposedEndTime,
        reason,
      }, { requiresAuth: true }),

    respondToMessage: (conversationId: number, messageId: number, action: 'accept' | 'decline') =>
      api.put(`/conversations/${conversationId}/messages/${messageId}/respond`, {
        action,
      }, { requiresAuth: true }),

    getSupportContact: () =>
      api.get<{ user_id: number | null }>('/support/contact', { requiresAuth: true }),
  };
}
