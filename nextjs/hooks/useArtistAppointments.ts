import { useState, useEffect, useCallback } from 'react';
import { appointmentService } from '@/services/appointmentService';

export interface AppointmentType {
  id: number | string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  status: 'pending' | 'booked' | 'completed' | 'cancelled';
  description?: string;
  clientName?: string | null;
  artistName?: string | null;
  clientId?: string | number | null;
  tattooId?: string | number | null;
  extendedProps?: {
    status: string;
    description?: string;
    clientName?: string | null;
    artistName?: string | null;
    studioName?: string;
  };
}

interface UseArtistAppointmentsOptions {
  status?: 'pending' | 'booked' | 'completed' | 'cancelled' | 'all';
  startDate?: Date;
  endDate?: Date;
}

export function useArtistAppointments(
  artistId: number | string | null,
  options: UseArtistAppointmentsOptions = {}
) {
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const { status = 'all', startDate, endDate } = options;

  const fetchAppointments = useCallback(async () => {
    if (!artistId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Build request body
      const requestBody: Record<string, any> = {
        artist_id: artistId
      };

      // Add filters if specified
      if (status && status !== 'all') {
        requestBody.status = status;
      }

      if (startDate) {
        requestBody.start_date = startDate.toISOString().split('T')[0];
      }

      if (endDate) {
        requestBody.end_date = endDate.toISOString().split('T')[0];
      }

      console.log('Fetching artist appointments:', requestBody);

      // Call the service
      const normalizedAppointments = await appointmentService.getArtistAppointments(requestBody);

      setAppointments(normalizedAppointments);
      setError(null);
    } catch (err) {
      console.error('Error fetching artist appointments:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch artist appointments'));
    } finally {
      setLoading(false);
    }
  }, [artistId, status, startDate, endDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Function to delete an appointment
  const deleteAppointment = useCallback(async (appointmentId: number | string) => {
    try {
      await appointmentService.delete(appointmentId);
      // Refresh the list after deletion
      await fetchAppointments();
      return true;
    } catch (err) {
      console.error('Error deleting appointment:', err);
      throw err;
    }
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    refresh: fetchAppointments,
    deleteAppointment
  };
}