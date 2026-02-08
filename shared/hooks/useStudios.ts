// Studio hooks - shared between Next.js and React Native

import { useState, useEffect, useRef } from 'react';
import type { ApiClient } from '../api';
import type { Studio, Artist } from '../types';

// Hook for fetching a single studio
export function useStudio(
  api: ApiClient,
  idOrSlug: string | number | null
): { studio: Studio | null; loading: boolean; error: Error | null } {
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(!!idOrSlug);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!idOrSlug) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;

    const fetchStudio = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<{ studio: Studio }>(`/studios/${idOrSlug}`);
        if (mountedRef.current) {
          setStudio(response.studio || response as any);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(`Failed to fetch studio ${idOrSlug}`));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchStudio();

    return () => {
      mountedRef.current = false;
    };
  }, [api, idOrSlug]);

  return { studio, loading, error };
}

// Hook for fetching a studio's tattoo gallery
export function useStudioGallery(
  api: ApiClient,
  studioIdOrSlug: string | number | null
): { gallery: any[]; loading: boolean; error: Error | null } {
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(!!studioIdOrSlug);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!studioIdOrSlug) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;

    const fetchGallery = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<any>(`/studios/${studioIdOrSlug}/gallery`);
        if (mountedRef.current) {
          const data = response?.data ?? response?.response ?? response;
          setGallery(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(`Failed to fetch gallery for studio ${studioIdOrSlug}`));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchGallery();

    return () => {
      mountedRef.current = false;
    };
  }, [api, studioIdOrSlug]);

  return { gallery, loading, error };
}

// Hook for fetching a studio's affiliated artists
export function useStudioArtists(
  api: ApiClient,
  studioIdOrSlug: string | number | null
): { artists: Artist[]; loading: boolean; error: Error | null } {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(!!studioIdOrSlug);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!studioIdOrSlug) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;

    const fetchArtists = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<any>(`/studios/${studioIdOrSlug}/artists`);
        if (mountedRef.current) {
          const data = response?.artists ?? response?.data ?? response;
          setArtists(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(`Failed to fetch artists for studio ${studioIdOrSlug}`));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchArtists();

    return () => {
      mountedRef.current = false;
    };
  }, [api, studioIdOrSlug]);

  return { artists, loading, error };
}
