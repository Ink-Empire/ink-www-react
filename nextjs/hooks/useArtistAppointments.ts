import { useState, useEffect, useCallback } from 'react';
import { artistService } from '@/services/artistService';
import { appointmentService } from '@/services/appointmentService';

export interface AppointmentType {
  id: number | string;
  title: string;
  start: string;
  end: string;
  date?: string;
  time?: string;
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
  enabled?: boolean;
}

export function useArtistAppointments(
  artistId: number | string | null,
  options: UseArtistAppointmentsOptions = {}
) {
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const { enabled = true } = options;

  const fetchAppointments = useCallback(async () => {
    if (!artistId || !enabled) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await artistService.getUpcomingSchedule(artistId);
      const rawData = (response as any)?.data ?? response ?? [];
      const data = Array.isArray(rawData) ? rawData : [];

      const normalizedAppointments: AppointmentType[] = data.map((apt: any) => ({
        id: apt.id,
        title: apt.title || 'Appointment',
        start: apt.date ? `${apt.date}T00:00:00` : '',
        end: apt.date ? `${apt.date}T00:00:00` : '',
        date: apt.date,
        time: apt.time,
        allDay: false,
        status: apt.status || 'booked',
        clientName: apt.clientName,
        clientId: apt.client_id ?? null,
        extendedProps: {
          status: apt.status || 'booked',
          clientName: apt.clientName,
        },
      }));

      setAppointments(normalizedAppointments);
      setError(null);
    } catch (err) {
      console.error('Error fetching artist appointments:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch artist appointments'));
    } finally {
      setLoading(false);
    }
  }, [artistId, enabled]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const deleteAppointment = useCallback(async (appointmentId: number | string) => {
    try {
      await appointmentService.delete(appointmentId);
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
