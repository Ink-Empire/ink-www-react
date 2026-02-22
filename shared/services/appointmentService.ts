import type { ApiClient } from '../api';

export interface CreateAppointmentData {
  artist_id: number;
  title: string;
  start_time: string;
  end_time?: string | null;
  date: string | Date;
  all_day?: boolean;
  description?: string;
  type: 'tattoo' | 'consultation';
  client_id: number;
}

export interface AvailableSlotsResponse {
  date: string;
  working_hours: { start: string; end: string } | null;
  consultation_window: { start: string; end: string } | null;
  consultation_duration: number;
  deposit_amount: number | null;
  consultation_fee: number | null;
  slots: string[];
}

export interface AppointmentResponse {
  action: 'accept' | 'decline';
  reason?: string;
}

export interface CalendarEventData {
  artist_id: number;
  title?: string;
  start: string;
  end: string;
  description?: string;
  type: 'consultation' | 'appointment' | 'other';
  sync_to_google?: boolean;
}

export interface AppointmentInviteData {
  artist_id: number;
  date: string;
  type: 'consultation' | 'appointment';
  guest_email: string;
  guest_name?: string;
  note?: string;
}

export function createAppointmentService(api: ApiClient) {
  return {
    create: (data: CreateAppointmentData) =>
      api.post('/appointments/create', data, { requiresAuth: true }),

    getAvailableSlots: (artistId: number | string, date: string, type: 'consultation' | 'appointment') =>
      api.get<AvailableSlotsResponse>(
        `/artists/${artistId}/available-slots?date=${date}&type=${type}`
      ),

    respond: (id: number, response: AppointmentResponse) =>
      api.post(`/appointments/${id}/respond`, response, { requiresAuth: true }),

    cancel: (id: number, reason?: string) =>
      api.post(`/appointments/${id}/cancel`, { reason }, { requiresAuth: true }),

    update: (id: number, data: Record<string, any>) =>
      api.put(`/appointments/${id}`, data, { requiresAuth: true }),

    delete: (id: number | string) =>
      api.delete(`/appointments/${id}`, { requiresAuth: true }),

    getInbox: (userId: number) =>
      api.post('/appointments/inbox', { user_id: userId, status: 'pending' }, { requiresAuth: true }),

    getHistory: (userId: number, page: number = 1) =>
      api.post('/appointments/history', { user_id: userId, page }, { requiresAuth: true }),

    invite: (data: AppointmentInviteData) =>
      api.post('/appointments/invite', data, { requiresAuth: true }),

    createEvent: (data: CalendarEventData) =>
      api.post('/appointments/event', data, { requiresAuth: true }),
  };
}
