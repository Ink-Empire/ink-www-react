import { useState, useEffect, useCallback } from 'react';
import { artistService } from '@/services/artistService';
import { ArtistType } from '@/models/artist.interface';
import { api } from '@/utils/api';
import { useDemoMode } from '@/contexts/DemoModeContext';

// Hook for fetching artists list
export function useArtists(searchParams?: Record<string, any>) {
  const [artists, setArtists] = useState<ArtistType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { isDemoMode } = useDemoMode();

  // Use JSON.stringify to compare searchParams objects, include demo mode in key
  const searchParamsKey = JSON.stringify({ ...(searchParams || {}), _demoMode: isDemoMode });

  useEffect(() => {
    let isMounted = true;
    
    // Use localStorage caching for artist lists to reduce initial loading time
    const ARTISTS_CACHE_KEY = `artists_cache:${searchParamsKey}`;
    
    // Try to load from localStorage first
    const tryLoadFromCache = () => {
      if (typeof window !== 'undefined') {
        try {
          const cachedData = localStorage.getItem(ARTISTS_CACHE_KEY);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            
            // Check if cache is fresh (less than 5 minutes old)
            const cacheFreshness = 5 * 60 * 1000; // 5 minutes
            if (parsedData.timestamp && Date.now() - parsedData.timestamp < cacheFreshness) {
              if (parsedData.artists && Array.isArray(parsedData.artists)) {
                console.log('Using cached artists data:', parsedData.artists.length, 'artists');
                setArtists(parsedData.artists);
                return true;
              }
            }
          }
        } catch (e) {
          console.warn('Error reading artists from cache', e);
        }
      }
      return false;
    };
    
    // Save to localStorage
    const saveToCache = (artistsData: ArtistType[]) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(ARTISTS_CACHE_KEY, JSON.stringify({
            artists: artistsData,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Error saving artists to cache', e);
        }
      }
    };
    
    const fetchArtists = async () => {
      // If we successfully loaded from cache, don't show loading state
      // but still fetch fresh data in the background
      const loadedFromCache = tryLoadFromCache();
      if (loadedFromCache) {
        setLoading(false); // Dismiss loading immediately when using cached data
      } else {
        setLoading(true);
      }

      try {
        // Construct the request body from searchParams if provided
        // Convert locationCoords object to string format for API
        const requestBody = { ...searchParams };
        if (requestBody.locationCoordsString) {
          requestBody.locationCoords = requestBody.locationCoordsString;
          delete requestBody.locationCoordsString;
        } else if (requestBody.locationCoords && typeof requestBody.locationCoords === 'object') {
          // Fallback: convert object to string if locationCoordsString wasn't set
          requestBody.locationCoords = `${requestBody.locationCoords.lat},${requestBody.locationCoords.lng}`;
        }

        console.log('Fetching artists with search params:', requestBody);
        
        // Explicitly use POST method, passing searchParams in the request body
        // Enable caching for search results
        // Response could be array directly or wrapped in { data: [...] }
        type ArtistsResponse = ArtistType[] | { data: ArtistType[] };
        const response = await api.post<ArtistsResponse>('/artists', requestBody, {
          headers: { 'X-Account-Type': 'artist' },
          useCache: true, // Enable caching for this POST request as it's idempotent
          cacheTTL: 5 * 60 * 1000 // 5 minute cache for artist searches
        });

        if (!isMounted) return;

        // Process the response - handle array, { data: [...] }, and { response: [...] } formats
        let artistsData: ArtistType[] = [];

        if (response) {
          if (Array.isArray(response)) {
            artistsData = response;
          } else if ('response' in response && Array.isArray((response as any).response)) {
            artistsData = (response as any).response;
          } else if ('data' in response && Array.isArray((response as any).data)) {
            artistsData = (response as any).data;
          }
          console.log('Artists fetched successfully via POST:', artistsData.length);
        }
        setArtists(artistsData);
        saveToCache(artistsData);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        
        // Only set error if we didn't load from cache
        if (!loadedFromCache) {
          console.error('Error fetching artists:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch artists'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchArtists();
    
    return () => {
      isMounted = false;
    };
  }, [searchParamsKey]); // Use the stringified version for dependency tracking

  return { artists, loading, error };
}

// Hook for fetching a single artist by ID or slug
export function useArtist(idOrSlug: string | null) {
  const [artist, setArtist] = useState<ArtistType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const fetchArtist = useCallback(async () => {
    if (!idOrSlug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await artistService.getById(idOrSlug, { useCache: false });
      setArtist(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(`Failed to fetch artist with ID/slug ${idOrSlug}`));
    } finally {
      setLoading(false);
    }
  }, [idOrSlug]);

  useEffect(() => {
    fetchArtist();
  }, [fetchArtist, refreshCounter]);

  const refetch = useCallback(() => {
    setRefreshCounter(c => c + 1);
  }, []);

  return { artist, loading, error, refetch };
}

// Hook for fetching artist portfolio (tattoos by artist)
export function useArtistPortfolio(artistIdOrSlug: string | null) {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!artistIdOrSlug) {
      setLoading(false);
      return;
    }

    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const data = await artistService.getPortfolio(artistIdOrSlug);

        console.log(data);
        setPortfolio(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch portfolio for artist ${artistIdOrSlug}`));
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [artistIdOrSlug]);

  return { portfolio, loading, error };
}