import { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface UseInboxCountReturn {
  count: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useInboxCount(userId: number | undefined): UseInboxCountReturn {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = async () => {
    if (!userId) {
      setCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post<{ data: any[] }>('/appointments/inbox', {
        user_id: userId,
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
    if (userId) {
      fetchCount();
    }
  }, [userId]);

  return {
    count,
    loading,
    error,
    refresh
  };
}