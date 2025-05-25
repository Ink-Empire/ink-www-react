import { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface UseInboxCountReturn {
  count: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useInboxCount(artistId: number | undefined): UseInboxCountReturn {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = async () => {
    if (!artistId) {
      setCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post<{ data: any[] }>('/artists/appointments/inbox', {
        artist_id: artistId,
        status: 'pending'
      }, {
        requiresAuth: true
      });

      setCount(response?.data?.length || 0);
    } catch (err) {
      console.error('Error fetching inbox count:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inbox count');
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchCount();
  };

  useEffect(() => {
    if (artistId) {
      fetchCount();
    }
  }, [artistId]);

  return {
    count,
    loading,
    error,
    refresh
  };
}