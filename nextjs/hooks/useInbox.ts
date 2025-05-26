import { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface Appointment {
  id: number;
  title: string;
  description: string;
  client_id: number;
  artist_id: number;
  studio_id: number | null;
  tattoo_id: number | null;
  date: string;
  status: string;
  type: 'tattoo' | 'consultation';
  all_day: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: number;
    username: string;
    email: string;
    name: string;
  };
  artist?: {
    id: number;
    username: string;
    email: string;
    name: string;
  };
  messages?: any[];
  has_unread_messages?: boolean;
}

interface UseInboxReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refreshInbox: () => Promise<void>;
  updateAppointmentStatus: (appointmentId: number, status: string) => Promise<boolean>;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface InboxResponse {
  data: Appointment[];
}

interface HistoryResponse {
  data: Appointment[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: any[];
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

interface UseHistoryReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta | null;
  loadPage: (page: number) => Promise<void>;
  refreshHistory: () => Promise<void>;
}

export function useHistory(userId: number | undefined): UseHistoryReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchHistory = async (page: number = 1) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post<HistoryResponse>('/appointments/history', {
        user_id: userId,
        page
      }, {
        requiresAuth: true
      });

      console.log('History response:', response);

      if (response && response.data) {
        setAppointments(response.data);
        // Convert Laravel pagination meta to our simplified format
        setPagination({
          current_page: response.meta.current_page,
          last_page: response.meta.last_page,
          per_page: response.meta.per_page,
          total: response.meta.total,
          from: response.meta.from,
          to: response.meta.to,
        });
        setCurrentPage(page);
      } else {
        setAppointments([]);
        setPagination(null);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
      setAppointments([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const loadPage = async (page: number) => {
    await fetchHistory(page);
  };

  const refreshHistory = async () => {
    await fetchHistory(currentPage);
  };

  useEffect(() => {
    fetchHistory(1);
  }, [userId]);

  return {
    appointments,
    loading,
    error,
    pagination,
    loadPage,
    refreshHistory
  };
}

export function useInbox(userId: number | undefined): UseInboxReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Make POST request to get pending appointments for the user using the new endpoint
      const response = await api.post<InboxResponse>('/appointments/inbox', {
        user_id: userId,
        status: 'pending'
      }, {
        requiresAuth: true
      });

      console.log('Inbox response:', response);

      setAppointments(response?.data || []);
    } catch (err) {
      console.error('Error fetching inbox:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inbox');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshInbox = async () => {
    await fetchInbox();
  };

  const updateAppointmentStatus = async (appointmentId: number, status: string): Promise<boolean> => {
    try {
      await api.put(`/appointments/${appointmentId}`, {
        status
      }, {
        requiresAuth: true
      });

      // Refresh inbox after status update
      await refreshInbox();
      return true;
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update appointment');
      return false;
    }
  };

  useEffect(() => {
    fetchInbox();
  }, [userId]);

  return {
    appointments,
    loading,
    error,
    refreshInbox,
    updateAppointmentStatus
  };
}

// Legacy export for backward compatibility
export const useArtistInbox = useInbox;
export const useArtistHistory = useHistory;