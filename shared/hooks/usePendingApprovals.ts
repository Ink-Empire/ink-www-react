import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiClient } from '../api';
import type { PendingTattoo } from '../types';

export interface UsePendingApprovalsResult {
  pendingTattoos: PendingTattoo[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  removeTattoo: (id: number) => void;
}

export function usePendingApprovals(
  api: ApiClient,
  options: { skip?: boolean } = {}
): UsePendingApprovalsResult {
  const { skip = false } = options;
  const [pendingTattoos, setPendingTattoos] = useState<PendingTattoo[]>([]);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchPending = useCallback(async () => {
    if (skip) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<{ tattoos: PendingTattoo[] }>('/tattoos/pending-approvals', {
        requiresAuth: true,
      });

      if (mountedRef.current) {
        setPendingTattoos(response.tattoos ?? []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch pending approvals'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [api, skip]);

  useEffect(() => {
    mountedRef.current = true;
    fetchPending();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchPending]);

  const removeTattoo = useCallback((id: number) => {
    setPendingTattoos(prev => prev.filter(t => t.id !== id));
  }, []);

  return { pendingTattoos, loading, error, refetch: fetchPending, removeTattoo };
}
