// Google Places REST API service
// Portable across React Native and web — uses fetch() directly

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
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

const AUTOCOMPLETE_URL =
  'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const TEXT_SEARCH_URL =
  'https://maps.googleapis.com/maps/api/place/textsearch/json';
const DETAILS_URL =
  'https://maps.googleapis.com/maps/api/place/details/json';

let cachedApiKey: string | null = null;

type ApiFetcher = {
  get: <T>(url: string, opts?: any) => Promise<T>;
};

export async function fetchPlacesApiKey(api: ApiFetcher): Promise<string | null> {
  if (cachedApiKey) return cachedApiKey;

  try {
    const response = await api.get<any>('/places/config');
    const key = response?.api_key || response?.data?.api_key;
    if (key) {
      cachedApiKey = key;
    }
    return cachedApiKey;
  } catch (error) {
    console.error('Error fetching Places API key:', error);
    return null;
  }
}

export async function searchPlaces(
  query: string,
  apiKey: string,
): Promise<PlacePrediction[]> {
  if (!query || query.length < 2 || !apiKey) return [];

  try {
    const params = new URLSearchParams({
      input: query,
      key: apiKey,
      types: '(cities)',
    });

    const response = await fetch(`${AUTOCOMPLETE_URL}?${params}`);
    const data = await response.json();

    if (data.status !== 'OK' || !data.predictions) return [];

    return data.predictions.map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description.split(',')[0],
      secondaryText: p.structured_formatting?.secondary_text || '',
    }));
  } catch (error) {
    console.error('Places autocomplete error:', error);
    return [];
  }
}

export async function getPlaceDetails(
  placeId: string,
  apiKey: string,
): Promise<PlaceDetails | null> {
  if (!placeId || !apiKey) return null;

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: apiKey,
      fields: 'place_id,formatted_address,geometry,address_components',
    });

    const response = await fetch(`${DETAILS_URL}?${params}`);
    const data = await response.json();

    if (data.status !== 'OK' || !data.result) return null;

    const result = data.result;
    const components: any[] = result.address_components || [];

    const getComponent = (types: string[]): string => {
      const c = components.find((comp: any) =>
        types.some((t) => comp.types.includes(t)),
      );
      return c?.long_name || '';
    };

    const getComponentShort = (types: string[]): string => {
      const c = components.find((comp: any) =>
        types.some((t) => comp.types.includes(t)),
      );
      return c?.short_name || '';
    };

    return {
      placeId: result.place_id || placeId,
      formattedAddress: result.formatted_address || '',
      city: getComponent(['locality', 'sublocality', 'postal_town', 'administrative_area_level_3']),
      state: getComponent(['administrative_area_level_1']),
      country: getComponent(['country']),
      countryCode: getComponentShort(['country']),
      lat: result.geometry?.location?.lat || 0,
      lng: result.geometry?.location?.lng || 0,
    };
  } catch (error) {
    console.error('Place details error:', error);
    return null;
  }
}

export async function searchEstablishments(
  query: string,
  apiKey: string,
  location?: string | null,
  radiusMeters: number = 80467, // ~50 miles
): Promise<PlacePrediction[]> {
  if (!query || query.length < 2 || !apiKey) return [];

  let lat: number | undefined;
  let lng: number | undefined;

  if (location) {
    const [latStr, lngStr] = location.split(',');
    lat = parseFloat(latStr);
    lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) {
      lat = undefined;
      lng = undefined;
    }
  }

  try {
    // If we have a location, use Text Search with location bias
    if (lat !== undefined && lng !== undefined) {
      const params = new URLSearchParams({
        query: `tattoo ${query}`,
        location: `${lat},${lng}`,
        radius: String(radiusMeters),
        key: apiKey,
      });

      const response = await fetch(`${TEXT_SEARCH_URL}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK' || !data.results) return [];

      return data.results.slice(0, 5).map((place: any) => ({
        placeId: place.place_id || '',
        description: place.formatted_address || place.name || '',
        mainText: place.name || '',
        secondaryText: place.formatted_address || '',
      }));
    }

    // Fallback to Autocomplete for establishments if no location
    const tattooQuery = query.toLowerCase().includes('tattoo')
      ? query
      : `tattoo ${query}`;

    const params = new URLSearchParams({
      input: tattooQuery,
      key: apiKey,
      types: 'establishment',
    });

    const response = await fetch(`${AUTOCOMPLETE_URL}?${params}`);
    const data = await response.json();

    if (data.status !== 'OK' || !data.predictions) return [];

    return data.predictions.map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description.split(',')[0],
      secondaryText: p.structured_formatting?.secondary_text || '',
    }));
  } catch (error) {
    console.error('Establishment search error:', error);
    return [];
  }
}
