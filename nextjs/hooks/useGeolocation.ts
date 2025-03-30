import { useState, useCallback } from 'react';

// Dynamic imports for Capacitor to avoid SSR issues
let Geolocation: any;
let Position: any;

// Only import Capacitor modules on the client side
if (typeof window !== 'undefined') {
  try {
    // Use dynamic import to get the Capacitor modules
    const capacitorImport = require('@capacitor/geolocation');
    Geolocation = capacitorImport.Geolocation;
  } catch (e) {
    console.warn('Capacitor geolocation module not available');
    // Provide fallback implementation
    Geolocation = {
      checkPermissions: async () => ({ location: 'denied' }),
      requestPermissions: async () => ({ location: 'denied' }),
      getCurrentPosition: async () => { throw new Error('Capacitor geolocation not available'); }
    };
  }
}

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface GeocodingResult {
  items: Array<{
    position: {
      lat: number;
      lng: number;
    };
    address: {
      label: string;
      city?: string;
      state?: string;
      countryCode?: string;
      countryName?: string;
    };
  }>;
}

interface UseGeolocationReturn {
  position: Position | null;
  loading: boolean;
  error: string | null;
  getCurrentPosition: () => Promise<Position>;
  getLocation: (latitude: number, longitude: number) => Promise<GeocodingResult>;
  getLatLong: (location: string) => Promise<GeocodingResult>;
}

export function useGeolocation(): UseGeolocationReturn {
  // Handle SSR case first
  if (typeof window === 'undefined') {
    return {
      position: null,
      loading: false,
      error: null,
      getCurrentPosition: async () => { throw new Error('Geolocation not available during SSR'); },
      getLocation: async () => ({ items: [] }),
      getLatLong: async () => ({ items: [] })
    };
  }
  
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to get the current position
  const getCurrentPosition = useCallback(async (): Promise<Position> => {
    try {
      setLoading(true);
      setError(null);
      
      // Only run this in browser environment
      if (typeof window === 'undefined') {
        throw new Error('Geolocation is not available during server-side rendering');
      }
      
      // Request permission first
      const permissionStatus = await Geolocation.checkPermissions();
      
      if (permissionStatus.location !== 'granted') {
        const requestResult = await Geolocation.requestPermissions();
        
        if (requestResult.location !== 'granted') {
          const error = new Error('Location permission denied');
          (error as any).code = 1; // Custom code for permission denied
          throw error;
        }
      }
      
      // Get current position with appropriate options
      const currentPosition = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000, // Extended timeout
        maximumAge: 10000 // Allow slightly cached results
      });
      
      setPosition(currentPosition);
      return currentPosition;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // If the error isn't already typed with a code, try to determine the type
      if (!(err as any).code && err instanceof Error) {
        // Map error messages to standard geolocation error codes
        if (err.message.includes('permission')) {
          (err as any).code = 1; // Permission denied
        } else if (err.message.includes('unavailable') || err.message.includes('available')) {
          (err as any).code = 2; // Position unavailable
        } else if (err.message.includes('timeout')) {
          (err as any).code = 3; // Timeout
        }
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to reverse geocode coordinates to address
  const getLocation = useCallback(async (latitude: number, longitude: number): Promise<GeocodingResult> => {
    try {
      setLoading(true);
      
      // Using Here Maps API for geocoding (you'll need an API key)
      // In a real app, you should use environment variables for the API key
      const apiKey = process.env.NEXT_PUBLIC_HERE_API_KEY || 'YOUR_HERE_API_KEY';
      const response = await fetch(
        `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${latitude},${longitude}&lang=en-US&apiKey=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding API failed');
      }
      
      const data = await response.json();
      
      // Format the response to match the expected structure
      const result: GeocodingResult = {
        items: data.items.map((item: any) => ({
          position: {
            lat: item.position.lat,
            lng: item.position.lng
          },
          address: {
            label: item.address.label,
            city: item.address.city,
            state: item.address.state,
            countryCode: item.address.countryCode,
            countryName: item.address.countryName
          }
        }))
      };
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown geocoding error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to geocode address to coordinates
  const getLatLong = useCallback(async (location: string): Promise<GeocodingResult> => {
    try {
      setLoading(true);
      
      // Using Here Maps API for geocoding
      const apiKey = process.env.NEXT_PUBLIC_HERE_API_KEY || 'YOUR_HERE_API_KEY';
      const response = await fetch(
        `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(location)}&apiKey=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding API failed');
      }
      
      const data = await response.json();
      
      // Format the response to match the expected structure
      const result: GeocodingResult = {
        items: data.items.map((item: any) => ({
          position: {
            lat: item.position.lat,
            lng: item.position.lng
          },
          address: {
            label: item.address.label,
            city: item.address.city,
            state: item.address.state,
            countryCode: item.address.countryCode,
            countryName: item.address.countryName
          }
        }))
      };
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown geocoding error';
      setError(errorMessage);
      
      // Return an empty result on error
      return { items: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    position,
    loading,
    error,
    getCurrentPosition,
    getLocation,
    getLatLong
  };
}

// Fallback implementation using browser's geolocation API 
// (useful when not running in a Capacitor context)
export function useBrowserGeolocation(): Omit<UseGeolocationReturn, 'getLocation' | 'getLatLong'> & {
  watchPosition: () => () => void;
} {
  // Handle SSR case first
  if (typeof window === 'undefined') {
    return {
      position: null,
      loading: false,
      error: null,
      getCurrentPosition: async () => { throw new Error('Geolocation not available during SSR'); },
      watchPosition: () => () => {} // Empty cleanup function
    };
  }
  
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = useCallback(async (): Promise<Position> => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);
      
      // Double-check that we're in browser environment
      if (typeof window === 'undefined') {
        const error = new Error('Geolocation is not available during server-side rendering');
        setError(error.message);
        setLoading(false);
        reject(error);
        return;
      }
      
      if (!navigator?.geolocation) {
        const error = new Error('Geolocation is not supported by your browser');
        setError(error.message);
        setLoading(false);
        reject(error);
        return;
      }
      
      // First check if we have a cached position that's recent enough
      if (position && Date.now() - position.timestamp < 60000) {
        // If we have a position that's less than 1 minute old, use it
        setLoading(false);
        resolve(position);
        return;
      }
      
      // Create a timeout in case geolocation hangs
      const timeoutId = setTimeout(() => {
        setError('Location request timed out');
        setLoading(false);
        const timeoutError = new Error('Location request timed out');
        (timeoutError as any).code = 3; // Timeout code
        reject(timeoutError);
      }, 15000);
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeoutId);
          
          const position: Position = {
            coords: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitudeAccuracy: pos.coords.altitudeAccuracy,
              altitude: pos.coords.altitude,
              speed: pos.coords.speed,
              heading: pos.coords.heading
            },
            timestamp: pos.timestamp
          };
          
          setPosition(position);
          setLoading(false);
          resolve(position);
        },
        (err) => {
          clearTimeout(timeoutId);
          setError(err.message);
          setLoading(false);
          
          // Add more detailed error messages
          let enhancedError: Error;
          
          if (err.code === 1) {
            enhancedError = new Error('Location permission denied by user');
          } else if (err.code === 2) {
            enhancedError = new Error('Location service unavailable - check device settings');
          } else if (err.code === 3) {
            enhancedError = new Error('Location request timed out');
          } else {
            enhancedError = new Error(err.message || 'Unknown geolocation error');
          }
          
          // Pass along the original error code
          (enhancedError as any).code = err.code;
          
          reject(enhancedError);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 12000,
          maximumAge: 10000 // Allow cached position up to 10 seconds old
        }
      );
    });
  }, [position]);

  const watchPosition = useCallback(() => {
    // Handle SSR case
    if (typeof window === 'undefined') {
      return () => {};
    }
    
    if (!navigator?.geolocation) {
      setError('Geolocation is not supported by your browser');
      return () => {};
    }
    
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const position: Position = {
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            heading: pos.coords.heading
          },
          timestamp: pos.timestamp
        };
        
        setPosition(position);
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    
    // Return a cleanup function
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return {
    position,
    loading,
    error,
    getCurrentPosition,
    watchPosition
  };
}