import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { TattooType } from '@/models/tattoo.interface';
import { tattooService } from '@/services/tattooService';
import { getToken } from '@/utils/auth';

// Hook for fetching tattoos list
export function useTattoos(searchParams?: Record<string, any>) {
  const [tattoos, setTattoos] = useState<TattooType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use JSON.stringify to compare searchParams objects
  const searchParamsKey = JSON.stringify(searchParams || {});

  useEffect(() => {
    let isMounted = true;
    
    // Use localStorage caching for tattoo lists to reduce initial loading time
    const TATTOOS_CACHE_KEY = `tattoos_cache:${searchParamsKey}`;
    
    // Try to load from localStorage first
    const tryLoadFromCache = () => {
      if (typeof window !== 'undefined') {
        try {
          const cachedData = localStorage.getItem(TATTOOS_CACHE_KEY);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            
            // Check if cache is fresh (less than 5 minutes old)
            const cacheFreshness = 5 * 60 * 1000; // 5 minutes
            if (parsedData.timestamp && Date.now() - parsedData.timestamp < cacheFreshness) {
              if (parsedData.tattoos && Array.isArray(parsedData.tattoos)) {
                console.log('Using cached tattoos data:', parsedData.tattoos.length, 'tattoos');
                setTattoos(parsedData.tattoos);
                return true;
              }
            }
          }
        } catch (e) {
          console.warn('Error reading tattoos from cache', e);
        }
      }
      return false;
    };
    
    // Save to localStorage
    const saveToCache = (tattoosData: TattooType[]) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(TATTOOS_CACHE_KEY, JSON.stringify({
            tattoos: tattoosData,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Error saving tattoos to cache', e);
        }
      }
    };
    
    const fetchTattoos = async () => {
      // If we successfully loaded from cache, don't show loading state
      // but still fetch fresh data in the background
      const loadedFromCache = tryLoadFromCache();
      if (!loadedFromCache) {
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

        console.log('Fetching tattoos with search params:', requestBody);
        
        // Check if user is logged in by looking for auth token
        const hasAuthToken = !!getToken();
        console.log('Auth token available:', hasAuthToken);
        
        // Explicitly use POST method, passing searchParams in the request body
        // Enable caching for search results
        const response = await api.post<{ data: TattooType[] }>('/tattoos', requestBody, {
          headers: { 'X-Account-Type': 'user' },
          useCache: true, // Enable caching for this POST request as it's idempotent
          cacheTTL: 5 * 60 * 1000, // 5 minute cache for tattoo searches
          requiresAuth: false // Don't require auth, but token will be sent if available
        });
        
        if (!isMounted) return;
        
        // Process the response
        let tattoosData: TattooType[] = [];
        
        if (response) {
          console.log('Tattoos fetched successfully via POST:', response.length);
           console.log('Tattoos fetched successfully via POST:', response.length);
          tattoosData = response;
        }
        setTattoos(tattoosData);
        saveToCache(tattoosData);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        
        // Only set error if we didn't load from cache
        if (!loadedFromCache) {
          console.error('Error fetching tattoos:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch tattoos'));
        }
      } finally {
        if (isMounted && !loadedFromCache) {
          setLoading(false);
        }
      }
    };

    fetchTattoos();
    
    return () => {
      isMounted = false;
    };
  }, [searchParamsKey]); // Use the stringified version for dependency tracking

  return { tattoos, loading, error };
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
      if (!loadedFromCache) {
        setLoading(true);
      }
      
      try {
        // Check if user is logged in
        const hasAuthToken = !!getToken();
        
        // Get tattoo by ID using the service, which will now be updated to conditionally include auth
        const data = await api.get<TattooType>(`/tattoos/${id}`, {
          headers: { 'X-Account-Type': 'user' },
          requiresAuth: hasAuthToken, // Only include auth token if user is logged in
          useCache: true
        });
        
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
        if (isMounted && !loadedFromCache) {
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
      if (!loadedFromCache) {
        setLoading(true);
      }
      
      try {
        // Check if user is logged in
        const hasAuthToken = !!getToken();
        
        // Use a POST request to fetch an artist's tattoos
        const data = await api.post<TattooType[]>(`/tattoos`, 
          { artist_id: artistId },
          { 
            headers: { 'X-Account-Type': 'user' },
            useCache: true,
            requiresAuth: hasAuthToken // Only include auth token if user is logged in
          }
        );
        
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
        if (isMounted && !loadedFromCache) {
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