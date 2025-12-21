// Style hooks - shared between Next.js and React Native

import { useState, useEffect, useRef } from 'react';
import type { ApiClient } from '../api';
import type { Style } from '../types';

// Hook for fetching all styles
export function useStyles(
  api: ApiClient
): { styles: Style[]; loading: boolean; error: Error | null } {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchStyles = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<Style[]>('/styles');
        if (mountedRef.current) {
          setStyles(Array.isArray(response) ? response : []);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Failed to fetch styles'));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchStyles();

    return () => {
      mountedRef.current = false;
    };
  }, [api]);

  return { styles, loading, error };
}

// Hook for fetching tags
export function useTags(
  api: ApiClient
): { tags: { id: number; name: string }[]; loading: boolean; error: Error | null } {
  const [tags, setTags] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchTags = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<{ id: number; name: string }[]>('/tags');
        if (mountedRef.current) {
          setTags(Array.isArray(response) ? response : []);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Failed to fetch tags'));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchTags();

    return () => {
      mountedRef.current = false;
    };
  }, [api]);

  return { tags, loading, error };
}
