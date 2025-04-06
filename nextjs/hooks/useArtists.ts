import { useState, useEffect } from 'react';
import { artistService } from '@/services/artistService';
import { ArtistType } from '@/models/artist.interface';
import { api } from '@/utils/api';

// Hook for fetching artists list
export function useArtists(searchParams?: Record<string, any>) {
  const [artists, setArtists] = useState<ArtistType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use JSON.stringify to compare searchParams objects
  const searchParamsKey = JSON.stringify(searchParams || {});

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
      if (!loadedFromCache) {
        setLoading(true);
      }
      
      try {
        // Construct the request body from searchParams if provided
        const requestBody = searchParams || {};
        
        console.log('Fetching artists with search params:', requestBody);
        
        // Explicitly use POST method, passing searchParams in the request body
        // Enable caching for search results
        const response = await api.post<{ data: ArtistType[] }>('/artists', requestBody, {
          headers: { 'X-Account-Type': 'artist' },
          useCache: true, // Enable caching for this POST request as it's idempotent
          cacheTTL: 5 * 60 * 1000 // 5 minute cache for artist searches
        });
        
        if (!isMounted) return;
        
        // Process the response
        let artistsData: ArtistType[] = [];
        
        if (response) {
          console.log('Artists fetched successfully via POST:', response.length);
          artistsData = response;
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
        if (isMounted && !loadedFromCache) {
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

// Hook for fetching a single artist by ID
export function useArtist(id: string | null) {
  const [artist, setArtist] = useState<ArtistType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchArtist = async () => {
      try {
        setLoading(true);
        const data = await artistService.getById(id);
        setArtist(data.artist);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch artist with ID ${id}`));
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [id]);

  return { artist, loading, error };
}

// Hook for fetching artist portfolio (tattoos by artist)
export function useArtistPortfolio(artistId: string | null) {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!artistId) {
      setLoading(false);
      return;
    }

    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const data = await artistService.getPortfolio(artistId);

        console.log(data);
        setPortfolio(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch portfolio for artist ${artistId}`));
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [artistId]);

  return { portfolio, loading, error };
}