import { useState, useEffect, useRef } from 'react';
import type { ApiClient } from '../api';

export function usePlacements(
  api: ApiClient
): { placements: { id: number; name: string }[]; loading: boolean; error: Error | null } {
  const [placements, setPlacements] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchPlacements = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<any>('/placements');
        if (mountedRef.current) {
          const data = response?.data ?? response;
          setPlacements(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Failed to fetch placements'));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchPlacements();

    return () => {
      mountedRef.current = false;
    };
  }, [api]);

  return { placements, loading, error };
}
