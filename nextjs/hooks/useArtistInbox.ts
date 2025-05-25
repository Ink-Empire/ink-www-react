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
    first_name: string;
    last_name: string;
    username: string;
    email: string;
  };
}

interface UseArtistInboxReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refreshInbox: () => Promise<void>;
  updateAppointmentStatus: (appointmentId: number, status: string) => Promise<boolean>;
}

export function useArtistInbox(artistId: number | undefined): UseArtistInboxReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = async () => {
    if (!artistId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Make POST request to get pending appointments for the artist using the inbox endpoint
      const response = await api.post<Appointment[]>('/artists/appointments/inbox', {
        artist_id: artistId,
        status: 'pending'
      }, {
        requiresAuth: true
      });

      console.log('Artist inbox response:', response);

      setAppointments(response || []);
    } catch (err) {
      console.error('Error fetching artist inbox:', err);
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
      await api.put(`/artists/appointments/${appointmentId}`, {
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
  }, [artistId]);

  return {
    appointments,
    loading,
    error,
    refreshInbox,
    updateAppointmentStatus
  };
}