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
  error: Error | null;
  refetch: () => Promise<void>;
}

// Hook for fetching tattoos list with search/filter
export function useTattoos(
  api: ApiClient,
  searchParams?: SearchFilters,
  options: UseTattoosOptions = {}
): UseTattoosResult {
  const { skip = false } = options;

  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  // Stringify params for dependency comparison
  const searchParamsKey = JSON.stringify(searchParams || {});

  const fetchTattoos = useCallback(async () => {
    if (skip) return;

    setLoading(true);
    setError(null);

    try {
      // Convert locationCoords if needed
      const requestBody = { ...searchParams };
      if (requestBody.locationCoords && typeof requestBody.locationCoords === 'object') {
        const coords = requestBody.locationCoords as any;
        requestBody.locationCoords = `${coords.lat || coords.latitude},${coords.lng || coords.longitude}`;
      }

      const response = await api.post<any>('/tattoos', requestBody);

      if (mountedRef.current) {
        // API returns { response: [...], total, has_more } or a plain array
        const data = response?.response ?? response;
        setTattoos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tattoos'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [api, searchParamsKey, skip]);

  useEffect(() => {
    mountedRef.current = true;
    fetchTattoos();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchTattoos]);

  return { tattoos, loading, error, refetch: fetchTattoos };
}

// Hook for fetching a single tattoo
export function useTattoo(
  api: ApiClient,
  id: string | number | null
): { tattoo: Tattoo | null; loading: boolean; error: Error | null } {
  const [tattoo, setTattoo] = useState<Tattoo | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;

    const fetchTattoo = async () => {
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
    };

    fetchTattoo();

    return () => {
      mountedRef.current = false;
    };
  }, [api, id]);

  return { tattoo, loading, error };
}
