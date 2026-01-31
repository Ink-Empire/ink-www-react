import { useState, useEffect, useCallback } from 'react';
import { calendarService } from '@/services/calendarService';

interface CalendarStatus {
  connected: boolean;
  email?: string;
  last_synced_at?: string;
  sync_enabled?: boolean;
  requires_reauth?: boolean;
}

interface UseGoogleCalendarReturn {
  status: CalendarStatus | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sync: () => Promise<void>;
  toggleSync: () => Promise<void>;
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch calendar status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await calendarService.getGoogleCalendarStatus();
      setStatus(response);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch calendar status:', err);
      setStatus({ connected: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Connect to Google Calendar
  const connect = useCallback(async () => {
    try {
      setError(null);
      const response = await calendarService.getGoogleCalendarAuthUrl();

      if (response.url) {
        // Redirect to Google OAuth
        window.location.href = response.url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Google Calendar');
      console.error('Failed to get auth URL:', err);
    }
  }, []);

  // Disconnect from Google Calendar
  const disconnect = useCallback(async () => {
    try {
      setError(null);
      await calendarService.disconnectGoogleCalendar();
      setStatus({ connected: false });
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect from Google Calendar');
      console.error('Failed to disconnect:', err);
    }
  }, []);

  // Trigger manual sync
  const sync = useCallback(async () => {
    if (!status?.connected || isSyncing) return;

    try {
      setIsSyncing(true);
      setError(null);
      await calendarService.syncGoogleCalendar();
      // Refresh status after sync
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to sync calendar');
      console.error('Failed to sync:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [status?.connected, isSyncing, fetchStatus]);

  // Toggle sync enabled/disabled
  const toggleSync = useCallback(async () => {
    if (!status?.connected) return;

    try {
      setError(null);
      const response = await calendarService.toggleGoogleCalendarSync();
      setStatus(prev => prev ? { ...prev, sync_enabled: response.sync_enabled } : null);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle sync');
      console.error('Failed to toggle sync:', err);
    }
  }, [status?.connected]);

  return {
    status,
    isLoading,
    isSyncing,
    error,
    connect,
    disconnect,
    sync,
    toggleSync,
  };
}
