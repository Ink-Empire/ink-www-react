import { api } from '../utils/api';
import { createAppointmentService } from '@inkedin/shared/services';

// Re-export shared types for backwards compatibility
export type {
  CreateAppointmentData,
  AvailableSlotsResponse,
  CalendarEventData,
  AppointmentInviteData,
} from '@inkedin/shared/services';

// Legacy types kept for existing imports
export interface AppointmentResponse {
  action: 'accept' | 'decline' | 'reschedule';
  reason?: string;
  proposed_date?: string;
  proposed_time?: string;
}

const sharedService = createAppointmentService(api);

export const appointmentService = {
  ...sharedService,

  // NextJS-specific methods not in shared service

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

  // Get a single appointment by ID (requires auth)
  getById: async (appointmentId: number): Promise<any> => {
    return api.get(`/appointments/${appointmentId}`, { requiresAuth: true });
  },

  // Get upcoming appointments for current user (requires auth)
  getUpcoming: async (): Promise<any[]> => {
    const response = await api.get<any>('/appointments/upcoming', {
      requiresAuth: true,
    });
    return response.appointments || response || [];
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
};
