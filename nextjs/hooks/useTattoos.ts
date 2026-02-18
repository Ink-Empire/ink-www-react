import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TattooType } from '@/models/tattoo.interface';
import { tattooService } from '@/services/tattooService';
import { clearCache } from '@/utils/apiCache';
import { useDemoMode } from '@/contexts/DemoModeContext';

// Unclaimed studio type (same as in useArtists)
export interface UnclaimedStudio {
  id: number;
  name: string;
  location?: string;
  rating?: number;
  weekly_impressions?: number;
  is_claimed: boolean;
}

// Function to delete a tattoo
export async function deleteTattoo(id: number | string): Promise<{ success: boolean; message: string; images_deleted: number }> {
  const response = await tattooService.delete(id);

  // Clear all caches that might contain this tattoo
  clearCache('portfolio');
  clearCache('tattoo');
  clearCache('artist');

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`tattoo_cache:${id}`);
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('artist_tattoos_cache:') || key.startsWith('tattoos_cache:')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Error clearing tattoo cache', e);
    }
  }

  return response;
}

// Hook for fetching tattoos list with infinite scroll support
export function useTattoos(searchParams?: Record<string, any>, blockedUserIds?: number[]) {
  const [tattoos, setTattoos] = useState<TattooType[]>([]);
  const [unclaimedStudios, setUnclaimedStudios] = useState<UnclaimedStudio[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const { isDemoMode } = useDemoMode();

  // Track the current search params to detect changes
  const searchParamsKey = JSON.stringify({ ...(searchParams || {}), _demoMode: isDemoMode });
  const prevSearchParamsKey = useRef<string>(searchParamsKey);

  // Reset pagination when search params change
  useEffect(() => {
    if (prevSearchParamsKey.current !== searchParamsKey) {
      setPage(1);
      setTattoos([]);
      setHasMore(true);
      prevSearchParamsKey.current = searchParamsKey;
    }
  }, [searchParamsKey]);

  // Build request body from search params
  const buildRequestBody = useCallback((pageNum: number) => {
    const requestBody: Record<string, any> = { ...searchParams, page: pageNum, per_page: 25 };
    if (requestBody.locationCoordsString) {
      requestBody.locationCoords = requestBody.locationCoordsString;
      delete requestBody.locationCoordsString;
    } else if (requestBody.locationCoords && typeof requestBody.locationCoords === 'object') {
      requestBody.locationCoords = `${requestBody.locationCoords.lat},${requestBody.locationCoords.lng}`;
    }
    return requestBody;
  }, [searchParams]);

  // Fetch tattoos for a specific page
  const fetchTattoos = useCallback(async (pageNum: number, append: boolean = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const requestBody = buildRequestBody(pageNum);
      console.log(`Fetching tattoos page ${pageNum}:`, requestBody);

      const response = await tattooService.search(requestBody);

      let tattoosData: TattooType[] = [];
      let totalCount = 0;
      let hasMorePages = false;

      if (response) {
        if ('response' in response && Array.isArray(response.response)) {
          tattoosData = response.response;
          totalCount = response.total ?? 0;
          hasMorePages = response.has_more ?? false;
        } else if (Array.isArray(response)) {
          tattoosData = response as unknown as TattooType[];
          totalCount = tattoosData.length;
        }
        console.log(`Tattoos page ${pageNum} fetched:`, tattoosData.length, 'of', totalCount, 'total, hasMore:', hasMorePages);
      }

      if (append) {
        setTattoos(prev => [...prev, ...tattoosData]);
      } else {
        setTattoos(tattoosData);
      }
      setTotal(totalCount);
      setHasMore(hasMorePages);
      setError(null);
    } catch (err) {
      console.error('Error fetching tattoos:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch tattoos'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildRequestBody]);

  // Fetch unclaimed studios asynchronously (only on first page)
  useEffect(() => {
    const requestBody = buildRequestBody(1);
    const locationCoords = requestBody.locationCoords;
    const useAnyLocation = requestBody.useAnyLocation;
    const isDemoData = requestBody.include_demo;

    if (!locationCoords || useAnyLocation || isDemoData) {
      setUnclaimedStudios([]);
      return;
    }

    tattooService.fetchUnclaimedStudios(requestBody)
      .then((res) => {
        if (res?.unclaimed_studios && Array.isArray(res.unclaimed_studios)) {
          setUnclaimedStudios(res.unclaimed_studios);
        } else {
          setUnclaimedStudios([]);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch unclaimed studios:', err);
        setUnclaimedStudios([]);
      });
  }, [searchParamsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial fetch when search params change
  useEffect(() => {
    fetchTattoos(1, false);
  }, [searchParamsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTattoos(nextPage, true);
    }
  }, [loadingMore, hasMore, page, fetchTattoos]);

  // Client-side blocked user filtering
  const filteredTattoos = useMemo(() => {
    if (!blockedUserIds || blockedUserIds.length === 0) return tattoos;
    return tattoos.filter(tattoo => {
      const artistId = tattoo.artist_id ?? tattoo.artist?.id;
      return !artistId || !blockedUserIds.includes(artistId);
    });
  }, [tattoos, blockedUserIds]);

  return {
    tattoos: filteredTattoos,
    unclaimedStudios,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore
  };
}

// Hook for fetching a single tattoo by ID
export function useTattoo(id: string | null) {
  const [tattoo, setTattoo] = useState<TattooType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const TATTOO_CACHE_KEY = `tattoo_cache:${id}`;

    // Try to load from cache first
    const tryLoadFromCache = () => {
      if (typeof window !== 'undefined') {
        try {
          const cachedData = localStorage.getItem(TATTOO_CACHE_KEY);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            const cacheFreshness = 5 * 60 * 1000; // 5 minutes
            if (parsedData.timestamp && Date.now() - parsedData.timestamp < cacheFreshness) {
              if (parsedData.tattoo) {
                console.log(`Using cached data for tattoo ${id}`);
                setTattoo(parsedData.tattoo);
                return true;
              }
            }
          }
        } catch (e) {
          console.warn(`Error reading tattoo ${id} from cache`, e);
        }
      }
      return false;
    };

    // Save to cache
    const saveToCache = (tattooData: TattooType) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(TATTOO_CACHE_KEY, JSON.stringify({
            tattoo: tattooData,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn(`Error saving tattoo ${id} to cache`, e);
        }
      }
    };

    const fetchTattoo = async () => {
      const loadedFromCache = tryLoadFromCache();
      if (loadedFromCache) {
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        // Get tattoo by ID
        const data = await tattooService.getById(id);

        if (!isMounted) return;

        setTattoo(data);
        saveToCache(data);
        setError(null);
      } catch (err) {
        if (!isMounted) return;

        if (!loadedFromCache) {
          setError(err instanceof Error ? err : new Error(`Failed to fetch tattoo with ID ${id}`));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTattoo();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { tattoo, loading, error };
}

// Hook for fetching tattoos by artist
export function useTattoosByArtist(artistId: string | null) {
  const [tattoos, setTattoos] = useState<TattooType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!artistId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const CACHE_KEY = `artist_tattoos_cache:${artistId}`;

    // Try to load from cache first
    const tryLoadFromCache = () => {
      if (typeof window !== 'undefined') {
        try {
          const cachedData = localStorage.getItem(CACHE_KEY);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            const cacheFreshness = 5 * 60 * 1000; // 5 minutes
            if (parsedData.timestamp && Date.now() - parsedData.timestamp < cacheFreshness) {
              if (parsedData.tattoos && Array.isArray(parsedData.tattoos)) {
                console.log(`Using cached tattoos data for artist ${artistId}`);
                setTattoos(parsedData.tattoos);
                return true;
              }
            }
          }
        } catch (e) {
          console.warn(`Error reading artist tattoos from cache`, e);
        }
      }
      return false;
    };

    // Save to cache
    const saveToCache = (tattoosData: TattooType[]) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            tattoos: tattoosData,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn(`Error saving artist tattoos to cache`, e);
        }
      }
    };

    const fetchArtistTattoos = async () => {
      const loadedFromCache = tryLoadFromCache();
      if (loadedFromCache) {
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        // Fetch tattoos for the artist
        const data = await tattooService.getByArtist(artistId);

        if (!isMounted) return;

        setTattoos(data);
        saveToCache(data);
        setError(null);
      } catch (err) {
        if (!isMounted) return;

        if (!loadedFromCache) {
          setError(err instanceof Error ? err : new Error(`Failed to fetch tattoos for artist ${artistId}`));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchArtistTattoos();

    return () => {
      isMounted = false;
    };
  }, [artistId]);

  return { tattoos, loading, error };
}
