import { api } from '../utils/api';

export interface WorkingHour {
  day: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:MM format
  end_time: string;
  is_available: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface CalendarDay {
  date: string;
  slots: TimeSlot[];
  is_blocked: boolean;
}

export const calendarService = {
  // Get artist's working hours/availability (public access)
  getArtistWorkingHours: async (artistIdOrSlug: number | string): Promise<WorkingHour[]> => {
    const response = await api.get<any>(`/artists/${artistIdOrSlug}/working-hours`);
    return response.working_hours || response || [];
  },

  // Set artist's working hours (requires auth)
  setArtistWorkingHours: async (artistId: number | string, workingHours: WorkingHour[]): Promise<any> => {
    return api.post(`/artists/${artistId}/working-hours`, { availability: workingHours }, {
      requiresAuth: true,
    });
  },

  // Get studio's working hours (public access)
  getStudioWorkingHours: async (studioIdOrSlug: number | string): Promise<WorkingHour[]> => {
    const response = await api.get<any>(`/studios/${studioIdOrSlug}/working-hours`);
    return response.working_hours || response || [];
  },

  // Set studio's working hours (requires auth)
  setStudioWorkingHours: async (studioId: number | string, workingHours: WorkingHour[]): Promise<any> => {
    return api.post(`/studios/${studioId}/working-hours`, { availability: workingHours }, {
      requiresAuth: true,
    });
  },

  // Get available time slots for a specific date (public access)
  getAvailableSlots: async (artistIdOrSlug: number | string, date: string): Promise<TimeSlot[]> => {
    const response = await api.get<any>(`/artists/${artistIdOrSlug}/availability`, {
      params: { date },
    });
    return response.slots || response || [];
  },

  // Get calendar view data for a date range (public access)
  getCalendarView: async (artistIdOrSlug: number | string, startDate: string, endDate: string): Promise<CalendarDay[]> => {
    const response = await api.get<any>(`/artists/${artistIdOrSlug}/calendar`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.days || response || [];
  },

  // Block specific dates/times (requires auth)
  blockTime: async (artistId: number | string, data: { date: string; start_time?: string; end_time?: string; reason?: string }): Promise<any> => {
    return api.post(`/artists/${artistId}/calendar/block`, data, {
      requiresAuth: true,
    });
  },

  // Unblock specific dates/times (requires auth)
  unblockTime: async (artistId: number | string, blockId: number): Promise<void> => {
    return api.delete(`/artists/${artistId}/calendar/block/${blockId}`, {
      requiresAuth: true,
    });
  },

  // Get artist's appointments for calendar view (requires auth)
  getArtistAppointments: async (artistIdOrSlug: number | string): Promise<any[]> => {
    const response = await api.get<any>(`/artists/${artistIdOrSlug}/appointments`, {
      requiresAuth: true,
    });
    return response.appointments || response || [];
  },

  // Get studio's appointments for calendar view (requires auth)
  getStudioAppointments: async (studioId: number): Promise<any[]> => {
    const response = await api.get<any>(`/studios/${studioId}/appointments`, {
      requiresAuth: true,
    });
    return response.appointments || response || [];
  },
};
