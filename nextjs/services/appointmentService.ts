import { api } from '../utils/api';

export interface CreateAppointmentData {
  artist_id: number;
  date: string;
  time: string;
  duration?: number;
  notes?: string;
  type?: string;
  reference_images?: number[];
}

export interface AppointmentInviteData {
  artist_id: number;
  user_id?: number;
  email?: string;
  date: string;
  time: string;
  duration?: number;
  notes?: string;
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

export interface AppointmentResponse {
  action: 'accept' | 'decline' | 'reschedule';
  reason?: string;
  proposed_date?: string;
  proposed_time?: string;
}

export const appointmentService = {
  // Create a new appointment request (requires auth)
  create: async (data: CreateAppointmentData): Promise<any> => {
    return api.post('/appointments/create', data, { requiresAuth: true });
  },

  // Get appointments for an artist (requires auth)
  getByArtist: async (artistIdOrSlug: number | string): Promise<any[]> => {
    const response = await api.get<any>(`/artists/${artistIdOrSlug}/appointments`, {
      requiresAuth: true,
    });
    return response.appointments || response || [];
  },

  // Get appointments for a studio's artists (requires auth)
  getByStudio: async (studioId: number): Promise<any[]> => {
    const response = await api.get<any>(`/studios/${studioId}/appointments`, {
      requiresAuth: true,
    });
    return response.appointments || response || [];
  },

  // Invite someone to an appointment (artist inviting client) (requires auth)
  invite: async (data: AppointmentInviteData): Promise<any> => {
    return api.post('/appointments/invite', data, { requiresAuth: true });
  },

  // Create a calendar event/blocked time (requires auth)
  createEvent: async (data: CalendarEventData): Promise<any> => {
    return api.post('/appointments/event', data, { requiresAuth: true });
  },

  // Respond to an appointment request (accept/decline/reschedule) (requires auth)
  respond: async (appointmentId: number, response: AppointmentResponse): Promise<any> => {
    return api.post(`/appointments/${appointmentId}/respond`, response, {
      requiresAuth: true,
    });
  },

  // Get a single appointment by ID (requires auth)
  getById: async (appointmentId: number): Promise<any> => {
    return api.get(`/appointments/${appointmentId}`, { requiresAuth: true });
  },

  // Update an appointment (requires auth)
  update: async (appointmentId: number, data: Partial<CreateAppointmentData>): Promise<any> => {
    return api.put(`/appointments/${appointmentId}`, data, { requiresAuth: true });
  },

  // Cancel an appointment (requires auth)
  cancel: async (appointmentId: number, reason?: string): Promise<any> => {
    return api.post(`/appointments/${appointmentId}/cancel`, { reason }, {
      requiresAuth: true,
    });
  },

  // Get upcoming appointments for current user (requires auth)
  getUpcoming: async (): Promise<any[]> => {
    const response = await api.get<any>('/appointments/upcoming', {
      requiresAuth: true,
    });
    return response.appointments || response || [];
  },

  // Get inbox (pending appointments) for a user (requires auth)
  getInbox: async (userId: number): Promise<{ data: any[] }> => {
    return api.post('/appointments/inbox', {
      user_id: userId,
      status: 'pending'
    }, { requiresAuth: true });
  },

  // Get appointment history for a user (requires auth)
  getHistory: async (userId: number, page: number = 1): Promise<{
    data: any[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    };
  }> => {
    return api.post('/appointments/history', {
      user_id: userId,
      page
    }, { requiresAuth: true });
  },

  // Update appointment status (requires auth)
  updateStatus: async (appointmentId: number, status: string): Promise<any> => {
    return api.put(`/appointments/${appointmentId}`, { status }, { requiresAuth: true });
  },

  // Get artist appointments with filters (public)
  getArtistAppointments: async (params: {
    artist_id: number | string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> => {
    const response = await api.post<{ data: any[] } | any[]>('/artists/appointments', params, {
      requiresAuth: false,
      useCache: false,
    });
    return Array.isArray(response) ? response : (response as any).data || [];
  },

  // Delete an appointment (requires auth)
  delete: async (appointmentId: number | string): Promise<void> => {
    return api.delete(`/appointments/${appointmentId}`, { requiresAuth: true });
  },
};
