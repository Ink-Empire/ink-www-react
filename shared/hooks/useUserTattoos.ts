import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiClient } from '../api';
import type { Tattoo } from '../types';

export interface UseUserTattoosResult {
  tattoos: Tattoo[];
  loading: boolean;
  error: Error | null;
  total: number;
  page: number;
  lastPage: number;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  removeTattoo: (id: number) => void;
}

export function useUserTattoos(
  api: ApiClient,
  slug: string | null,
  perPage: number = 20
): UseUserTattoosResult {
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [loading, setLoading] = useState(!!slug);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const mountedRef = useRef(true);

  const fetchTattoos = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<any>(`/users/${slug}/tattoos`, {
        params: { page: pageNum, per_page: perPage },
      });

      if (mountedRef.current) {
        const data = response.tattoos ?? response.data ?? [];
        setTattoos(prev => append ? [...prev, ...data] : data);
        setTotal(response.total ?? 0);
        setPage(response.page ?? pageNum);
        setLastPage(response.last_page ?? 1);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user tattoos'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [api, slug, perPage]);

  useEffect(() => {
    mountedRef.current = true;
    fetchTattoos(1);

    return () => {
      mountedRef.current = false;
    };
  }, [fetchTattoos]);

  const loadMore = useCallback(async () => {
    if (page < lastPage) {
      await fetchTattoos(page + 1, true);
    }
  }, [fetchTattoos, page, lastPage]);

  const refetch = useCallback(async () => {
    await fetchTattoos(1);
  }, [fetchTattoos]);

  const removeTattoo = useCallback((id: number) => {
    setTattoos(prev => prev.filter(t => t.id !== id));
    setTotal(prev => Math.max(0, prev - 1));
  }, []);

  return { tattoos, loading, error, total, page, lastPage, refetch, loadMore, removeTattoo };
}
