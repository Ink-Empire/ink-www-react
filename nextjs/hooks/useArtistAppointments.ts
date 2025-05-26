import { useState, useEffect } from 'react';
import { api } from '@/utils/api';

export interface AppointmentType {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  status: 'available' | 'booked' | 'tentative' | 'unavailable';
  description?: string;
  clientName?: string;
  clientId?: string | number;
  tattooId?: string | number;
}

interface UseArtistAppointmentsOptions {
  status?: 'available' | 'booked' | 'tentative' | 'unavailable' | 'all';
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

  useEffect(() => {
    if (!artistId) {
      setLoading(false);
      return;
    }

    const fetchAppointments = async () => {
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

        // Call the API endpoint
        const response = await api.post<AppointmentType[]>(
          '/artists/appointments', 
          requestBody,
          {
            requiresAuth: false, // Allow viewing appointments without authentication
            useCache: true, // Enable caching for this request
            cacheTTL: 5 * 60 * 1000 // 5 minute cache
          }
        );

        // Normalize the response data
        const normalizedAppointments = Array.isArray(response) 
          ? response 
          : [];

        setAppointments(normalizedAppointments);
        setError(null);
      } catch (err) {
        console.error('Error fetching artist appointments:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch artist appointments'));
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [artistId, status, startDate, endDate]);

  return { appointments, loading, error };
}