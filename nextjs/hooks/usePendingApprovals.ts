import { useState, useEffect, useCallback } from 'react';
import { tattooService } from '@/services/tattooService';

export function usePendingApprovals(skip: boolean = false) {
  const [pendingTattoos, setPendingTattoos] = useState<any[]>([]);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    if (skip) return;

    setLoading(true);
    setError(null);

    try {
      const response = await tattooService.getPendingApprovals();
      setPendingTattoos(response.tattoos ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  }, [skip]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const removeTattoo = useCallback((id: number) => {
    setPendingTattoos(prev => prev.filter(t => t.id !== id));
  }, []);

  return { pendingTattoos, loading, error, refetch: fetchPending, removeTattoo };
}
