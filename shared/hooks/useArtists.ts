// Artist hooks - shared between Next.js and React Native

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiClient } from '../api';
import type { Artist, SearchFilters } from '../types';

export interface UseArtistsOptions {
  skip?: boolean;
}

export interface UseArtistsResult {
  artists: Artist[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Hook for fetching artists list with search/filter
export function useArtists(
  api: ApiClient,
  searchParams?: SearchFilters,
  options: UseArtistsOptions = {}
): UseArtistsResult {
  const { skip = false } = options;

  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  // Stringify params for dependency comparison
  const searchParamsKey = JSON.stringify(searchParams || {});

  const fetchArtists = useCallback(async () => {
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

      const response = await api.post<any>('/artists', requestBody, {
        headers: { 'X-Account-Type': 'artist' },
      });

      if (mountedRef.current) {
        // API returns { response: [...], total, has_more } or a plain array
        const data = response?.response ?? response;
        setArtists(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch artists'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [api, searchParamsKey, skip]);

  useEffect(() => {
    mountedRef.current = true;
    fetchArtists();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchArtists]);

  return { artists, loading, error, refetch: fetchArtists };
}

// Hook for fetching a single artist
export function useArtist(
  api: ApiClient,
  idOrSlug: string | number | null
): { artist: Artist | null; loading: boolean; error: Error | null } {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(!!idOrSlug);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!idOrSlug) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;

    const fetchArtist = async () => {
      setLoading(true);
      setError(null);

      try {
        const param = typeof idOrSlug === 'number' ? { id: idOrSlug } : { slug: String(idOrSlug) };
        const response = await api.post<any>('/artists', param);
        if (mountedRef.current) {
          setArtist(response?.artist as Artist);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(`Failed to fetch artist ${idOrSlug}`));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchArtist();

    return () => {
      mountedRef.current = false;
    };
  }, [api, idOrSlug]);

  return { artist, loading, error };
}

// Hook for fetching artist portfolio (tattoos)
// Pass initialData to skip the first fetch (e.g., when tattoos come from artist detail response)
export function useArtistPortfolio(
  api: ApiClient,
  artistIdOrSlug: string | number | null,
  initialData?: any[]
): { portfolio: any[]; loading: boolean; error: Error | null; hasMore: boolean; loadMore: () => void } {
  const [portfolio, setPortfolio] = useState<any[]>(initialData || []);
  const [loading, setLoading] = useState(initialData ? false : !!artistIdOrSlug);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const mountedRef = useRef(true);
  const initialDataUsedRef = useRef(!!initialData);

  // Seed portfolio when initialData arrives
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setPortfolio(initialData);
      setLoading(false);
      initialDataUsedRef.current = true;
      setHasMore(initialData.length >= 25);
    }
  }, [initialData]);

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    if (!artistIdOrSlug) return;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await api.get<any>(`/artists/${artistIdOrSlug}/portfolio?page=${pageNum}&per_page=25`);
      if (mountedRef.current) {
        const data = response?.response ?? response;
        const items = Array.isArray(data) ? data : [];
        setPortfolio(prev => append ? [...prev, ...items] : items);
        setHasMore(response?.has_more ?? false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch portfolio for artist ${artistIdOrSlug}`));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [api, artistIdOrSlug]);

  // Only fetch page 1 if no initialData was provided
  useEffect(() => {
    mountedRef.current = true;

    if (initialDataUsedRef.current) {
      return;
    }

    setPage(1);
    setPortfolio([]);

    if (artistIdOrSlug) {
      fetchPage(1, false);
    } else {
      setLoading(false);
    }

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

  return { portfolio, loading, error, hasMore, loadMore };
}
