// Generic API hook for data fetching
// Works with both Next.js and React Native

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiClient } from '../api';

export interface UseApiOptions<T> {
  initialData?: T;
  skip?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseApiResult<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Generic hook for GET requests
export function useApiGet<T>(
  api: ApiClient,
  endpoint: string,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { initialData, skip = false, onSuccess, onError } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (skip) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.get<T>(endpoint);
      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error('Request failed');
        setError(error);
        onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [api, endpoint, skip, onSuccess, onError]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Generic hook for POST requests (like search)
export function useApiPost<T, B = any>(
  api: ApiClient,
  endpoint: string,
  body: B,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { initialData, skip = false, onSuccess, onError } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  // Stringify body for dependency comparison
  const bodyKey = JSON.stringify(body);

  const fetchData = useCallback(async () => {
    if (skip) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.post<T>(endpoint, body);
      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error('Request failed');
        setError(error);
        onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [api, endpoint, bodyKey, skip, onSuccess, onError]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Mutation hook for POST/PUT/DELETE
export function useApiMutation<T, B = any>(
  api: ApiClient,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post'
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | undefined>();

  const mutate = useCallback(
    async (endpoint: string, body?: B): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        let result: T;
        if (method === 'delete') {
          result = await api.delete<T>(endpoint);
        } else {
          result = await api[method]<T>(endpoint, body);
        }
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Request failed');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [api, method]
  );

  return { mutate, loading, error, data };
}
