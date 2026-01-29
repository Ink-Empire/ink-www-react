import { useState, useEffect } from 'react';
import { studioService } from '../services/studioService';
import { StudioType } from '../models/studio.interface';
import { api } from '../utils/api';

// Hook for fetching studios list with caching
export function useStudios(searchParams?: Record<string, any>) {
  const [studios, setStudios] = useState<StudioType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Use JSON.stringify to compare searchParams objects
  const searchParamsKey = JSON.stringify(searchParams || {});

  useEffect(() => {
    let isMounted = true;

    // Use localStorage caching for studio lists to reduce initial loading time
    const STUDIOS_CACHE_KEY = `studios_cache:${searchParamsKey}`;

    // Try to load from localStorage first
    const tryLoadFromCache = () => {
      if (typeof window !== 'undefined') {
        try {
          const cachedData = localStorage.getItem(STUDIOS_CACHE_KEY);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);

            // Check if cache is fresh (less than 5 minutes old)
            const cacheFreshness = 5 * 60 * 1000; // 5 minutes
            if (parsedData.timestamp && Date.now() - parsedData.timestamp < cacheFreshness) {
              if (parsedData.studios && Array.isArray(parsedData.studios)) {
                console.log('Using cached studios data:', parsedData.studios.length, 'studios');
                setStudios(parsedData.studios);
                return true;
              }
            }
          }
        } catch (e) {
          console.warn('Error reading studios from cache', e);
        }
      }
      return false;
    };

    // Save to localStorage
    const saveToCache = (studiosData: StudioType[]) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STUDIOS_CACHE_KEY, JSON.stringify({
            studios: studiosData,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Error saving studios to cache', e);
        }
      }
    };

    const fetchStudios = async () => {
      // If we successfully loaded from cache, don't show loading state
      // but still fetch fresh data in the background
      const loadedFromCache = tryLoadFromCache();
      if (!loadedFromCache) {
        setLoading(true);
      }

      try {
        console.log('Fetching studios with search params:', searchParams);

        const response = await studioService.search(searchParams);

        if (!isMounted) return;

        // Process the response
        let studiosData: StudioType[] = [];

        if (response) {
          console.log('Studios fetched successfully:', response.length);
          studiosData = response;
        }
        setStudios(studiosData);
        saveToCache(studiosData);
        setError(null);
      } catch (err) {
        if (!isMounted) return;

        // Only set error if we didn't load from cache
        if (!loadedFromCache) {
          console.error('Error fetching studios:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch studios'));
        }
      } finally {
        if (isMounted && !loadedFromCache) {
          setLoading(false);
        }
      }
    };

    fetchStudios();

    return () => {
      isMounted = false;
    };
  }, [searchParamsKey]);

  return { studios, loading, error };
}

// Hook for fetching a single studio by ID or slug
export function useStudio(idOrSlug: string | null) {
  const [studio, setStudio] = useState<StudioType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!idOrSlug) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchStudio = async () => {
      try {
        setLoading(true);
        const data = await studioService.getById(idOrSlug);

        if (!isMounted) return;

        setStudio(data.studio);
        setError(null);
      } catch (err) {
        if (!isMounted) return;

        setError(err instanceof Error ? err : new Error(`Failed to fetch studio with ID/slug ${idOrSlug}`));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudio();

    return () => {
      isMounted = false;
    };
  }, [idOrSlug]);

  return { studio, loading, error };
}

// Hook for fetching studio artists
export function useStudioArtists(studioIdOrSlug: string | null) {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!studioIdOrSlug) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchStudioArtists = async () => {
      try {
        setLoading(true);
        const data = await studioService.getArtists(studioIdOrSlug);

        if (!isMounted) return;

        setArtists(data);
        setError(null);
      } catch (err) {
        if (!isMounted) return;

        setError(err instanceof Error ? err : new Error(`Failed to fetch artists for studio ${studioIdOrSlug}`));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudioArtists();

    return () => {
      isMounted = false;
    };
  }, [studioIdOrSlug]);

  return { artists, loading, error };
}

// Hook for fetching studio gallery/tattoos
export function useStudioGallery(studioIdOrSlug: string | null) {
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!studioIdOrSlug) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchStudioGallery = async () => {
      try {
        setLoading(true);
        const data = await studioService.getGallery(studioIdOrSlug);

        if (!isMounted) return;

        setGallery(data);
        setError(null);
      } catch (err) {
        if (!isMounted) return;

        setError(err instanceof Error ? err : new Error(`Failed to fetch gallery for studio ${studioIdOrSlug}`));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudioGallery();

    return () => {
      isMounted = false;
    };
  }, [studioIdOrSlug]);

  return { gallery, loading, error };
}

// Hook for fetching studio reviews
export function useStudioReviews(studioIdOrSlug: string | null) {
  const [reviews, setReviews] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!studioIdOrSlug) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchStudioReviews = async () => {
      try {
        setLoading(true);
        const data = await studioService.getReviews(studioIdOrSlug);

        if (!isMounted) return;

        setReviews(data);
        setError(null);
      } catch (err) {
        if (!isMounted) return;

        setError(err instanceof Error ? err : new Error(`Failed to fetch reviews for studio ${studioIdOrSlug}`));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudioReviews();

    return () => {
      isMounted = false;
    };
  }, [studioIdOrSlug]);

  return { reviews, loading, error };
}

// Hook for fetching studio opportunities
export function useStudioOpportunities(studioIdOrSlug: string | null) {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!studioIdOrSlug) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        const data = await studioService.getOpportunities(studioIdOrSlug);

        if (!isMounted) return;

        setOpportunities(data);
        setError(null);
      } catch (err) {
        if (!isMounted) return;

        setError(err instanceof Error ? err : new Error(`Failed to fetch opportunities for studio ${studioIdOrSlug}`));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOpportunities();

    return () => {
      isMounted = false;
    };
  }, [studioIdOrSlug]);

  return { opportunities, loading, error };
}

// Hook for fetching studio hours
export function useStudioHours(studioIdOrSlug: string | null) {
  const [hours, setHours] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!studioIdOrSlug) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchHours = async () => {
      try {
        setLoading(true);
        const response = await studioService.getHours(studioIdOrSlug);

        if (!isMounted) return;

        // Handle Laravel Resource collection wrapper
        const hoursData = Array.isArray(response) ? response : (response as any)?.data || [];
        setHours(hoursData);
        setError(null);
      } catch (err) {
        if (!isMounted) return;

        setError(err instanceof Error ? err : new Error(`Failed to fetch hours for studio ${studioIdOrSlug}`));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHours();

    return () => {
      isMounted = false;
    };
  }, [studioIdOrSlug]);

  return { hours, loading, error };
}
