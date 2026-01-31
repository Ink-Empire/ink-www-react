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
  // NOTE: For working hours, use artistService.getWorkingHours/setWorkingHours
  // or studioService.getHours/setWorkingHours instead.

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

  // NOTE: For appointments, use appointmentService.getByArtist or getByStudio instead.

  // ============ Google Calendar Integration ============

  // Get Google Calendar connection status (requires auth)
  getGoogleCalendarStatus: async (): Promise<{
    connected: boolean;
    email?: string;
    last_synced_at?: string;
    sync_enabled?: boolean;
    requires_reauth?: boolean;
  }> => {
    return api.get('/calendar/status', { requiresAuth: true, useCache: false });
  },

  // Get Google Calendar OAuth URL (requires auth)
  getGoogleCalendarAuthUrl: async (): Promise<{ url: string }> => {
    return api.get('/calendar/auth-url', { requiresAuth: true });
  },

  // Disconnect Google Calendar (requires auth)
  disconnectGoogleCalendar: async (): Promise<void> => {
    return api.post('/calendar/disconnect', {}, { requiresAuth: true });
  },

  // Trigger manual Google Calendar sync (requires auth)
  syncGoogleCalendar: async (): Promise<void> => {
    return api.post('/calendar/sync', {}, { requiresAuth: true });
  },

  // Toggle Google Calendar sync on/off (requires auth)
  toggleGoogleCalendarSync: async (): Promise<{ sync_enabled: boolean }> => {
    return api.post('/calendar/toggle-sync', {}, { requiresAuth: true });
  },
};
