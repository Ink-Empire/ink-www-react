import { useGeolocation, useBrowserGeolocation } from '@/hooks/useGeolocation';

// Helper function to determine if running in Capacitor environment
const isCapacitorEnvironment = (): boolean => {
  return typeof window !== 'undefined' && 
    window.hasOwnProperty('Capacitor') && 
    window.Capacitor?.isPluginAvailable('Geolocation');
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
  
  // Use browser fallback with geocoding service mock
  const browserGeo = useBrowserGeolocation();
  
  // Mock geocoding implementation for browser environments
  // This provides realistic-looking results for common locations
  const mockGeocodingData = {
    // Some major cities with realistic coordinates
    "new york": { lat: 40.7128, lng: -74.0060, city: "New York", state: "NY", country: "US" },
    "los angeles": { lat: 34.0522, lng: -118.2437, city: "Los Angeles", state: "CA", country: "US" },
    "chicago": { lat: 41.8781, lng: -87.6298, city: "Chicago", state: "IL", country: "US" },
    "london": { lat: 51.5074, lng: -0.1278, city: "London", state: "", country: "UK" },
    "paris": { lat: 48.8566, lng: 2.3522, city: "Paris", state: "", country: "FR" },
    "tokyo": { lat: 35.6762, lng: 139.6503, city: "Tokyo", state: "", country: "JP" },
    "sydney": { lat: -33.8688, lng: 151.2093, city: "Sydney", state: "NSW", country: "AU" },
    "toronto": { lat: 43.6532, lng: -79.3832, city: "Toronto", state: "ON", country: "CA" },
    // Add more cities as needed
  };
  
  // Helper to search through our mock data
  const findLocationMatch = (query: string) => {
    query = query.toLowerCase();
    
    // Check for exact matches
    if (mockGeocodingData[query]) {
      return mockGeocodingData[query];
    }
    
    // Check for partial matches
    for (const [key, data] of Object.entries(mockGeocodingData)) {
      if (query.includes(key) || key.includes(query)) {
        return data;
      }
      
      // Check city match
      if (query.includes(data.city.toLowerCase())) {
        return data;
      }
      
      // Check state match if available
      if (data.state && query.includes(data.state.toLowerCase())) {
        return data;
      }
      
      // Check country match
      if (query.includes(data.country.toLowerCase())) {
        return data;
      }
    }
    
    // Return default data if no match found
    return {
      lat: 0, 
      lng: 0, 
      city: query.charAt(0).toUpperCase() + query.slice(1), 
      state: "", 
      country: ""
    };
  };
  
  return {
    ...browserGeo,
    getLocation: async (latitude: number, longitude: number) => {
      console.warn('Running in browser environment, using mock geocoding service');
      
      // Use a simple reverse geocoding approach - find the closest city in our mock data
      let closestCity = null;
      let minDistance = Number.MAX_VALUE;
      
      for (const [key, data] of Object.entries(mockGeocodingData)) {
        // Calculate distance using simple Euclidean distance (not perfect but good enough for mocks)
        const distance = Math.sqrt(
          Math.pow(latitude - data.lat, 2) + 
          Math.pow(longitude - data.lng, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestCity = data;
        }
      }
      
      // If we're within a reasonable distance of a known city (approx 100km in degree units)
      const isNearKnownLocation = minDistance < 1.0;
      
      // Use the closest city data if we're near one, otherwise use generic location
      const locationData = isNearKnownLocation ? closestCity : {
        lat: latitude,
        lng: longitude,
        city: "Unknown City",
        state: "",
        country: "Unknown"
      };
      
      return {
        items: [{
          position: {
            lat: latitude,
            lng: longitude
          },
          address: {
            label: `${locationData.city}${locationData.state ? ', ' + locationData.state : ''}${locationData.country ? ', ' + locationData.country : ''}`,
            city: locationData.city,
            state: locationData.state,
            countryCode: locationData.country,
            countryName: locationData.country
          }
        }]
      };
    },
    getLatLong: async (location: string) => {
      console.warn('Running in browser environment, using mock geocoding service');
      
      // Find matching location data
      const matchData = findLocationMatch(location);
      
      // Build a realistic geocoding response
      return {
        items: [{
          position: {
            lat: matchData.lat,
            lng: matchData.lng
          },
          address: {
            label: `${matchData.city}${matchData.state ? ', ' + matchData.state : ''}${matchData.country ? ', ' + matchData.country : ''}`,
            city: matchData.city,
            state: matchData.state,
            countryCode: matchData.country,
            countryName: {
              'US': 'United States',
              'UK': 'United Kingdom',
              'CA': 'Canada',
              'AU': 'Australia',
              'FR': 'France',
              'JP': 'Japan'
            }[matchData.country] || matchData.country
          }
        }]
      };
    }
  };
};