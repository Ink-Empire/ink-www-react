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
          const data = response?.gallery ?? response?.data ?? response?.response ?? response;
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

/**
 * Artists and tattoos a studio has pinned to the top of its page.
 *
 * Returns an empty list when nothing is pinned, so callers render no section
 * at all rather than an empty one.
 */
export function useStudioSpotlights(
  api: ApiClient,
  studioIdOrSlug: string | number | null
): { spotlights: any[]; loading: boolean; error: Error | null } {
  const [spotlights, setSpotlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(!!studioIdOrSlug);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!studioIdOrSlug) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;

    const fetchSpotlights = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<any>(`/studios/${studioIdOrSlug}/spotlights`);
        if (mountedRef.current) {
          const data = response?.spotlights ?? response?.data ?? response;
          setSpotlights(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(`Failed to fetch spotlights for studio ${studioIdOrSlug}`));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchSpotlights();

    return () => {
      mountedRef.current = false;
    };
  }, [api, studioIdOrSlug]);

  return { spotlights, loading, error };
}

/**
 * The guides a studio has published: aftercare, preparation, or anything else
 * it wrote once and kept.
 *
 * Returns an empty list when a studio has written none, so callers render no
 * section at all rather than an empty one. Each guide carries its own `url`
 * when it has a page - a draft has no slug yet and so has none.
 */
export function useStudioGuides(
  api: ApiClient,
  studioIdOrSlug: string | number | null
): { guides: any[]; loading: boolean; error: Error | null } {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(!!studioIdOrSlug);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!studioIdOrSlug) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;

    const fetchGuides = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<any>(`/studios/${studioIdOrSlug}/guides`);
        if (mountedRef.current) {
          const data = response?.guides ?? response?.data ?? response;
          setGuides(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(`Failed to fetch guides for studio ${studioIdOrSlug}`));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchGuides();

    return () => {
      mountedRef.current = false;
    };
  }, [api, studioIdOrSlug]);

  return { guides, loading, error };
}

/**
 * A single guide or announcement at its own address.
 *
 * `kind` picks the route the way the post's own `url` does: guides live under
 * `/guides`, announcements under `/news`. Only types that carry a public page
 * resolve at all - an ephemeral notice deliberately has none - so a null post
 * with no error simply means there is nothing to show.
 */
export function useStudioPost(
  api: ApiClient,
  studioIdOrSlug: string | number | null,
  kind: 'guides' | 'news',
  postSlug: string | null
): { post: any | null; loading: boolean; error: Error | null } {
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(!!(studioIdOrSlug && postSlug));
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!studioIdOrSlug || !postSlug) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;

    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<any>(`/studios/${studioIdOrSlug}/${kind}/${postSlug}`);
        if (mountedRef.current) {
          // The API names it for what it is: a guide, or a post.
          setPost(response?.guide ?? response?.post ?? response?.data ?? null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(`Failed to fetch ${postSlug}`));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchPost();

    return () => {
      mountedRef.current = false;
    };
  }, [api, studioIdOrSlug, kind, postSlug]);

  return { post, loading, error };
}
