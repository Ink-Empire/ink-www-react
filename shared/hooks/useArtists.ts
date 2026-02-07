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
        const response = await api.get<{ artist: Artist }>(`/artists/${idOrSlug}`);
        if (mountedRef.current) {
          setArtist(response.artist || response as any);
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
export function useArtistPortfolio(
  api: ApiClient,
  artistIdOrSlug: string | number | null
): { portfolio: any[]; loading: boolean; error: Error | null } {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(!!artistIdOrSlug);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!artistIdOrSlug) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;

    const fetchPortfolio = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<any[]>(`/artists/${artistIdOrSlug}/portfolio`);
        if (mountedRef.current) {
          setPortfolio(Array.isArray(response) ? response : []);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(`Failed to fetch portfolio for artist ${artistIdOrSlug}`));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchPortfolio();

    return () => {
      mountedRef.current = false;
    };
  }, [api, artistIdOrSlug]);

  return { portfolio, loading, error };
}
