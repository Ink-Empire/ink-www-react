import { useState, useEffect, useCallback } from 'react';
import { userProfileService, UserProfile } from '@/services/userProfileService';

export function useUserProfile(slug: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(!!slug);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await userProfileService.getProfile(slug);
      setProfile(response.user);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

export function useUserTattoos(slug: string | null, perPage: number = 20) {
  const [tattoos, setTattoos] = useState<any[]>([]);
  const [loading, setLoading] = useState(!!slug);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTattoos = useCallback(async (pageNum: number = 1) => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await userProfileService.getTattoos(slug, { page: pageNum, per_page: perPage });
      setTattoos(prev => pageNum === 1 ? response.tattoos : [...prev, ...response.tattoos]);
      setTotal(response.total);
      setPage(response.page);
      setLastPage(response.last_page);
    } catch (err: any) {
      setError(err.message || 'Failed to load tattoos');
    } finally {
      setLoading(false);
    }
  }, [slug, perPage]);

  useEffect(() => {
    fetchTattoos(1);
  }, [fetchTattoos]);

  const loadMore = useCallback(() => {
    if (page < lastPage) {
      fetchTattoos(page + 1);
    }
  }, [fetchTattoos, page, lastPage]);

  return { tattoos, loading, error, total, page, lastPage, loadMore, refetch: () => fetchTattoos(1) };
}
