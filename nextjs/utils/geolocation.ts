import React, { useState } from 'react';
import { useGeolocation, useBrowserGeolocation } from '@/hooks/useGeolocation';

// Helper function to determine if running in Capacitor environment
const isCapacitorEnvironment = (): boolean => {
  return typeof window !== 'undefined' && 
    window.hasOwnProperty('Capacitor') && 
    window.Capacitor?.isPluginAvailable('Geolocation');
};

// Helper function to determine if running in React Native environment
const isReactNativeEnvironment = (): boolean => {
  return typeof navigator !== 'undefined' && 
    navigator.product === 'ReactNative';
};

// Real geocoding functions using OpenStreetMap Nominatim (free, no API key required)
const reverseGeocode = async (latitude: number, longitude: number) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'InkedIn-App/1.0', // Required by Nominatim
      },
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Nominatim reverse geocoding response:', data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Extract location data from Nominatim response
    const address = data.address || {};
    const city = address.city || address.town || address.village || address.hamlet || address.suburb || 'Unknown City';
    const state = address.state || address.province || address.region || '';
    const country = address.country || address.country_code?.toUpperCase() || '';
    
    return {
      city,
      state,
      country,
      countryCode: address.country_code?.toUpperCase() || '',
      label: data.display_name || `${city}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`
    };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return {
      city: 'Current Location',
      state: '',
      country: '',
      countryCode: '',
      label: 'Current Location'
    };
  }
};

const forwardGeocode = async (locationQuery: string) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'InkedIn-App/1.0', // Required by Nominatim
      },
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Nominatim forward geocoding response:', data);
    
    if (data.length === 0) {
      throw new Error('No results found');
    }
    
    const result = data[0];
    const address = result.address || {};
    const city = address.city || address.town || address.village || address.hamlet || address.suburb || 'Unknown City';
    const state = address.state || address.province || address.region || '';
    const country = address.country || address.country_code?.toUpperCase() || '';
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      city,
      state,
      country,
      countryCode: address.country_code?.toUpperCase() || '',
      label: result.display_name || `${city}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`
    };
  } catch (error) {
    console.error('Forward geocoding failed:', error);
    return {
      lat: 0,
      lng: 0,
      city: locationQuery.charAt(0).toUpperCase() + locationQuery.slice(1),
      state: '',
      country: '',
      countryCode: '',
      label: locationQuery
    };
  }
};

// Helper function to get user-friendly error messages
const getGeolocationErrorMessage = (code: number): string => {
  switch (code) {
    case 1:
      return 'Location access denied. Please enable location permissions in your device settings.';
    case 2:
      return 'Location unavailable. Please check your device\'s location services.';
    case 3:
      return 'Location request timed out. Please try again.';
    default:
      return 'An unknown location error occurred. Please try again.';
  }
};

// Export appropriate hook based on environment
export const useAppGeolocation = () => {
  // Check if we're running on the server
  if (typeof window === 'undefined') {
    // Return a mock implementation for server-side rendering
    return {
      position: null,
      loading: false,
      error: null,
      getCurrentPosition: async () => { 
        throw new Error('Geolocation not available during server-side rendering');
      },
      getLocation: async () => ({ items: [] }),
      getLatLong: async () => ({ items: [] })
    };
  }
  
  // Client-side code
  if (isCapacitorEnvironment()) {
    return useGeolocation();
  }
  
  // React Native environment
  if (isReactNativeEnvironment()) {
    return useReactNativeGeolocation();
  }
  
  // Use browser fallback with geocoding service mock
  const browserGeo = useBrowserGeolocation();
  
  
  return {
    ...browserGeo,
    getLocation: async (latitude: number, longitude: number) => {
      console.log('Running in browser environment, using real geocoding service');
      console.log(`Looking for city near coordinates: ${latitude}, ${longitude}`);
      
      const locationData = await reverseGeocode(latitude, longitude);
      
      return {
        items: [{
          position: {
            lat: latitude,
            lng: longitude
          },
          address: {
            label: locationData.label,
            city: locationData.city,
            state: locationData.state,
            countryCode: locationData.countryCode,
            countryName: locationData.country
          }
        }]
      };
    },
    getLatLong: async (location: string) => {
      console.log('Running in browser environment, using real geocoding service');
      
      const locationData = await forwardGeocode(location);
      
      return {
        items: [{
          position: {
            lat: locationData.lat,
            lng: locationData.lng
          },
          address: {
            label: locationData.label,
            city: locationData.city,
            state: locationData.state,
            countryCode: locationData.countryCode,
            countryName: locationData.country
          }
        }]
      };
    }
  };
};

// React Native geolocation hook using react-native-geolocation-service
const useReactNativeGeolocation = () => {
  const [position, setPosition] = useState<{latitude: number; longitude: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = async (): Promise<{latitude: number; longitude: number}> => {
    return new Promise(async (resolve, reject) => {
      setLoading(true);
      setError(null);

      try {
        // Dynamically import the React Native geolocation service only when needed
        const Geolocation = await import('react-native-geolocation-service').then(module => module.default);

        Geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            setPosition(coords);
            setLoading(false);
            resolve(coords);
          },
          (error) => {
            console.error('Geolocation error:', error);
            const errorMessage = getGeolocationErrorMessage(error.code);
            setError(errorMessage);
            setLoading(false);
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      } catch (importError) {
        console.error('Failed to import react-native-geolocation-service:', importError);
        setError('Geolocation service not available');
        setLoading(false);
        reject(new Error('Geolocation service not available'));
      }
    });
  };

  const getLocation = async (latitude: number, longitude: number) => {
    console.log('Using real geocoding service in React Native environment');
    
    const locationData = await reverseGeocode(latitude, longitude);
    
    return {
      items: [{
        position: {
          lat: latitude,
          lng: longitude
        },
        address: {
          label: locationData.label,
          city: locationData.city,
          state: locationData.state,
          countryCode: locationData.countryCode,
          countryName: locationData.country
        }
      }]
    };
  };

  const getLatLong = async (location: string) => {
    console.log('Using real geocoding service in React Native environment');
    
    const locationData = await forwardGeocode(location);
    
    return {
      items: [{
        position: {
          lat: locationData.lat,
          lng: locationData.lng
        },
        address: {
          label: locationData.label,
          city: locationData.city,
          state: locationData.state,
          countryCode: locationData.countryCode,
          countryName: locationData.country
        }
      }]
    };
  };

  return {
    position,
    loading,
    error,
    getCurrentPosition,
    getLocation,
    getLatLong
  };
};

