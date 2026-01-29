/**
 * Google Places Service using Google Maps JavaScript SDK
 *
 * Fetches API key from backend, loads Google Maps script,
 * and provides autocomplete functionality with session tokens for optimized billing.
 */

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
}

// Singleton state
let googleMapsLoaded = false;
let googleMapsLoading = false;
let loadPromise: Promise<void> | null = null;
let autocompleteService: google.maps.places.AutocompleteService | null = null;
let placesService: google.maps.places.PlacesService | null = null;
let sessionToken: google.maps.places.AutocompleteSessionToken | null = null;

// Cache for API key
let cachedApiKey: string | null = null;

/**
 * Fetch the Google Places API key from the backend
 */
const fetchApiKey = async (): Promise<string | null> => {
  if (cachedApiKey) return cachedApiKey;

  try {
    const response = await fetch('/api/places/config');
    if (!response.ok) {
      console.error('Failed to fetch Places API config');
      return null;
    }
    const data = await response.json();
    cachedApiKey = data.api_key;
    return cachedApiKey;
  } catch (error) {
    console.error('Error fetching Places API key:', error);
    return null;
  }
};

/**
 * Load the Google Maps JavaScript SDK
 */
const loadGoogleMapsScript = async (): Promise<void> => {
  if (googleMapsLoaded) return;
  if (loadPromise) return loadPromise;

  googleMapsLoading = true;

  loadPromise = new Promise(async (resolve, reject) => {
    const apiKey = await fetchApiKey();

    if (!apiKey) {
      googleMapsLoading = false;
      reject(new Error('Google Places API key not available'));
      return;
    }

    // Check if already loaded (e.g., by another script)
    if (window.google?.maps?.places) {
      googleMapsLoaded = true;
      googleMapsLoading = false;
      initializeServices();
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleMapsLoaded = true;
      googleMapsLoading = false;
      initializeServices();
      resolve();
    };

    script.onerror = () => {
      googleMapsLoading = false;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

/**
 * Initialize the Places services
 */
const initializeServices = () => {
  if (!window.google?.maps?.places) return;

  autocompleteService = new google.maps.places.AutocompleteService();

  // PlacesService requires a map or div element
  const dummyDiv = document.createElement('div');
  placesService = new google.maps.places.PlacesService(dummyDiv);

  // Create initial session token
  refreshSessionToken();
};

/**
 * Refresh the session token (should be done after each place selection)
 */
const refreshSessionToken = () => {
  if (window.google?.maps?.places) {
    sessionToken = new google.maps.places.AutocompleteSessionToken();
  }
};

/**
 * Ensure Google Maps is loaded before using services
 */
const ensureLoaded = async (): Promise<boolean> => {
  try {
    await loadGoogleMapsScript();
    return true;
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
    return false;
  }
};

/**
 * Search for place predictions using Google Places Autocomplete
 */
export const searchPlaces = async (
  query: string,
  options?: {
    types?: string[];
  }
): Promise<PlacePrediction[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  const loaded = await ensureLoaded();
  if (!loaded || !autocompleteService) {
    return [];
  }

  return new Promise((resolve) => {
    const request: google.maps.places.AutocompletionRequest = {
      input: query,
      sessionToken: sessionToken || undefined,
      types: options?.types || ['(cities)'],
    };

    autocompleteService!.getPlacePredictions(request, (predictions, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
        resolve([]);
        return;
      }

      const results: PlacePrediction[] = predictions.map((p) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || p.description.split(',')[0],
        secondaryText: p.structured_formatting?.secondary_text || '',
        types: p.types || [],
      }));

      resolve(results);
    });
  });
};

/**
 * Get place details including coordinates
 */
export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  if (!placeId) return null;

  const loaded = await ensureLoaded();
  if (!loaded || !placesService) {
    return null;
  }

  return new Promise((resolve) => {
    const request: google.maps.places.PlaceDetailsRequest = {
      placeId,
      sessionToken: sessionToken || undefined,
      fields: ['place_id', 'formatted_address', 'geometry', 'address_components'],
    };

    placesService!.getDetails(request, (place, status) => {
      // Refresh session token after getting details (ends the session)
      refreshSessionToken();

      if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
        resolve(null);
        return;
      }

      const components = place.address_components || [];

      const getComponent = (types: string[]): string => {
        const component = components.find((c) =>
          types.some((t) => c.types.includes(t))
        );
        return component?.long_name || '';
      };

      const getComponentShort = (types: string[]): string => {
        const component = components.find((c) =>
          types.some((t) => c.types.includes(t))
        );
        return component?.short_name || '';
      };

      const details: PlaceDetails = {
        placeId: place.place_id || placeId,
        formattedAddress: place.formatted_address || '',
        city: getComponent(['locality', 'sublocality', 'postal_town', 'administrative_area_level_3']),
        state: getComponent(['administrative_area_level_1']),
        country: getComponent(['country']),
        countryCode: getComponentShort(['country']),
        lat: place.geometry?.location?.lat() || 0,
        lng: place.geometry?.location?.lng() || 0,
      };

      resolve(details);
    });
  });
};

/**
 * Preload the Google Maps SDK (call early to reduce latency on first search)
 */
export const preloadGoogleMaps = (): void => {
  ensureLoaded().catch(() => {
    // Silently fail - will retry on actual use
  });
};

/**
 * Search for tattoo studios/parlors using Google Places Nearby Search
 * This provides better location-based filtering than Autocomplete
 * @param query - Search query
 * @param location - Optional location to search near (lat,lng format or {lat, lng} object)
 * @param radiusMeters - Radius in meters for search (default 80467 = ~50 miles)
 *
 * TODO: Optimize by searching our studios database first before hitting Google API.
 * - Add a /api/studios/search endpoint that searches our studios table by name
 * - Search our DB first, show those results
 * - Only call Google Places API if we need more results or user explicitly requests it
 * - This will reduce Google API costs and improve results for studios already in our system
 * - The backend already has `lookupOrCreate` which caches Google results - we should leverage this cache
 */
export const searchEstablishments = async (
  query: string,
  location?: string | { lat: number; lng: number } | null,
  radiusMeters: number = 80467, // ~50 miles
): Promise<PlacePrediction[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  const loaded = await ensureLoaded();
  if (!loaded || !placesService) {
    return [];
  }

  // Parse location coordinates
  let lat: number | undefined;
  let lng: number | undefined;

  if (location) {
    if (typeof location === 'string') {
      const [latStr, lngStr] = location.split(',');
      lat = parseFloat(latStr);
      lng = parseFloat(lngStr);
    } else {
      lat = location.lat;
      lng = location.lng;
    }

    if (isNaN(lat!) || isNaN(lng!)) {
      lat = undefined;
      lng = undefined;
    }
  }


  // If we have a location, use Nearby Search for better location filtering
  if (lat !== undefined && lng !== undefined) {
    return new Promise((resolve) => {
      const searchLocation = new google.maps.LatLng(lat!, lng!);

      // Use Text Search with location bias for better results
      const request: google.maps.places.TextSearchRequest = {
        query: `tattoo ${query}`,
        location: searchLocation,
        radius: radiusMeters,
      };

      placesService!.textSearch(request, (results, status) => {
        console.log('[StudioSearch] Text search status:', status, 'results:', results?.length || 0);

        if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
          resolve([]);
          return;
        }

        const predictions: PlacePrediction[] = results.slice(0, 5).map((place) => ({
          placeId: place.place_id || '',
          description: place.formatted_address || place.name || '',
          mainText: place.name || '',
          secondaryText: place.formatted_address || '',
          types: place.types || [],
        }));

        resolve(predictions);
      });
    });
  }

  // Fallback to Autocomplete if no location provided
  return new Promise((resolve) => {
    const tattooQuery = query.toLowerCase().includes('tattoo')
      ? query
      : `tattoo ${query}`;

    const request: google.maps.places.AutocompletionRequest = {
      input: tattooQuery,
      sessionToken: sessionToken || undefined,
      types: ['establishment'],
    };

    autocompleteService!.getPlacePredictions(request, (predictions, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
        resolve([]);
        return;
      }

      const results: PlacePrediction[] = predictions.map((p) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || p.description.split(',')[0],
        secondaryText: p.structured_formatting?.secondary_text || '',
        types: p.types || [],
      }));

      resolve(results);
    });
  });
};

export interface EstablishmentDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  rating?: number;
}

/**
 * Get establishment details including name, address, phone, website
 */
export const getEstablishmentDetails = async (placeId: string): Promise<EstablishmentDetails | null> => {
  if (!placeId) return null;

  const loaded = await ensureLoaded();
  if (!loaded || !placesService) {
    return null;
  }

  return new Promise((resolve) => {
    const request: google.maps.places.PlaceDetailsRequest = {
      placeId,
      sessionToken: sessionToken || undefined,
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'formatted_phone_number', 'website', 'rating'],
    };

    placesService!.getDetails(request, (place, status) => {
      // Refresh session token after getting details (ends the session)
      refreshSessionToken();

      if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
        resolve(null);
        return;
      }

      const details: EstablishmentDetails = {
        placeId: place.place_id || placeId,
        name: place.name || '',
        formattedAddress: place.formatted_address || '',
        lat: place.geometry?.location?.lat() || 0,
        lng: place.geometry?.location?.lng() || 0,
        phone: place.formatted_phone_number,
        website: place.website,
        rating: place.rating,
      };

      resolve(details);
    });
  });
};
