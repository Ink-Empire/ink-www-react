import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiClient } from '../api';
import type { UserProfile } from '../types';

export function useUserProfile(
  api: ApiClient,
  slug: string | null
): { profile: UserProfile | null; loading: boolean; error: Error | null; refetch: () => Promise<void> } {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(!!slug);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<{ user: UserProfile }>(`/users/${slug}/profile`);
      if (mountedRef.current) {
        setProfile(response.user || (response as any));
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user profile'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [api, slug]);

  useEffect(() => {
    mountedRef.current = true;
    fetchProfile();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}
