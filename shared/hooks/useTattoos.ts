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
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  const searchParamsKey = JSON.stringify(searchParams || {});
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const fetchTattoos = useCallback(async (pageNum: number, append: boolean) => {
    if (skip || loadingRef.current) return;
    loadingRef.current = true;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const currentParams = searchParamsRef.current;
      const requestBody: Record<string, any> = { ...currentParams, page: pageNum, per_page: 50 };
      if (requestBody.locationCoords && typeof requestBody.locationCoords === 'object') {
        const coords = requestBody.locationCoords as any;
        requestBody.locationCoords = `${coords.lat || coords.latitude},${coords.lng || coords.longitude}`;
      }

      console.log('[useTattoos] fetching page', pageNum, 'append:', append);
      const response = await api.post<any>('/tattoos', requestBody, {
        headers: { 'X-Account-Type': 'user' },
      });

      let items: Tattoo[] = [];
      let hasMorePages = false;

      if (response) {
        if ('response' in response && Array.isArray(response.response)) {
          items = response.response;
          hasMorePages = response.has_more === true || (response.has_more === undefined && items.length >= 50);
        } else if (Array.isArray(response)) {
          items = response;
          hasMorePages = items.length >= 50;
        }
      }

      if (append) {
        setTattoos((prev: Tattoo[]) => [...prev, ...items]);
      } else {
        setTattoos(items);
      }
      setHasMore(hasMorePages);
      pageRef.current = pageNum;
    } catch (err: any) {
      console.error('[DEBUG] useTattoos error:', err?.status, err?.message, JSON.stringify(err?.data)); // DEBUG: remove before commit
      setError(err instanceof Error ? err : new Error('Failed to fetch tattoos'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [api, searchParamsKey, skip]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch page 1 on mount and when search params change
  useEffect(() => {
    if (skip) return;
    pageRef.current = 1;
    setTattoos([]);
    setHasMore(true);
    fetchTattoos(1, false);
  }, [searchParamsKey, skip]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    console.log('[useTattoos] loadMore called, loadingRef:', loadingRef.current, 'hasMore:', hasMore);
    if (!loadingRef.current && hasMore) {
      fetchTattoos(pageRef.current + 1, true);
    }
  }, [hasMore, fetchTattoos]);

  const refetch = useCallback(async () => {
    pageRef.current = 1;
    setTattoos([]);
    setHasMore(true);
    await fetchTattoos(1, false);
  }, [fetchTattoos]);

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
      const response = await api.get<{ tattoo: Tattoo }>(`/tattoos/${id}`, { useCache: false });
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
