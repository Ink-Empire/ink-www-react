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
  title: string;
  date: string;
  time: string;
  duration?: number;
  notes?: string;
  type?: 'blocked' | 'personal' | 'other';
}

export interface AppointmentResponse {
  status: 'accepted' | 'declined' | 'rescheduled';
  message?: string;
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
};
