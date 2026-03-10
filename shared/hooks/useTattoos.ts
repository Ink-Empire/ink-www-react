// Tattoo hooks - shared between Next.js and React Native

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiClient } from '../api';
import type { Tattoo, SearchFilters } from '../types';

export interface UseTattoosOptions {
  skip?: boolean;
}

export interface UseTattoosResult {
  tattoos: Tattoo[];
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => Promise<void>;
  removeTattoo: (id: number) => void;
}

// Hook for fetching tattoos list with search/filter and pagination
export function useTattoos(
  api: ApiClient,
  searchParams?: SearchFilters,
  options: UseTattoosOptions = {}
): UseTattoosResult {
  const { skip = false } = options;

  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [loading, setLoading] = useState(!skip);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  // Stringify params for dependency comparison
  const searchParamsKey = JSON.stringify(searchParams || {});
  const prevSearchParamsKey = useRef(searchParamsKey);

  // Reset pagination when search params change
  useEffect(() => {
    if (prevSearchParamsKey.current !== searchParamsKey) {
      setPage(1);
      setTattoos([]);
      setHasMore(false);
      prevSearchParamsKey.current = searchParamsKey;
    }
  }, [searchParamsKey]);

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    if (skip) return;
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Convert locationCoords if needed
      const requestBody: Record<string, any> = { ...searchParams, page: pageNum, per_page: 50 };
      if (requestBody.locationCoords && typeof requestBody.locationCoords === 'object') {
        const coords = requestBody.locationCoords as any;
        requestBody.locationCoords = `${coords.lat || coords.latitude},${coords.lng || coords.longitude}`;
      }

      const response = await api.post<any>('/tattoos', requestBody, {
        headers: { 'X-Account-Type': 'user' },
      });

      if (mountedRef.current) {
        const data = response?.response ?? response;
        const items = Array.isArray(data) ? data : [];
        setTattoos((prev: Tattoo[]) => append ? [...prev, ...items] : items);
        setHasMore(response?.has_more ?? items.length >= 50);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tattoos'));
      }
    } finally {
      fetchingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [api, searchParamsKey, skip]);

  // Fetch page 1 on mount or when params change
  useEffect(() => {
    mountedRef.current = true;
    setPage(1);
    fetchPage(1, false);

    return () => {
      mountedRef.current = false;
    };
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPage(nextPage, true);
    }
  }, [loadingMore, hasMore, page, fetchPage]);

  const refetch = useCallback(async () => {
    setPage(1);
    setTattoos([]);
    await fetchPage(1, false);
  }, [fetchPage]);

  const removeTattoo = useCallback((id: number) => {
    setTattoos((prev: Tattoo[]) => prev.filter((t: Tattoo) => t.id !== id));
  }, []);

  return { tattoos, loading, loadingMore, error, hasMore, loadMore, refetch, removeTattoo };
}

// Hook for fetching a single tattoo
export function useTattoo(
  api: ApiClient,
  id: string | number | null
): { tattoo: Tattoo | null; loading: boolean; error: Error | null; refetch: () => Promise<void> } {
  const [tattoo, setTattoo] = useState<Tattoo | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchTattoo = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<{ tattoo: Tattoo }>(`/tattoos/${id}`);
      if (mountedRef.current) {
        setTattoo(response.tattoo || response as any);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch tattoo ${id}`));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [api, id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchTattoo();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchTattoo]);

  return { tattoo, loading, error, refetch: fetchTattoo };
}
