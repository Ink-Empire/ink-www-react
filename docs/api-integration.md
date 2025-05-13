# Inked In API Integration Guide

This document outlines how to integrate with the ink-api backend from the frontend applications. It serves as a reference for developers working on the web and mobile clients.

## API Communication Layer

The frontend applications communicate with ink-api through a structured service layer built on modern fetch APIs with type safety through TypeScript.

### Base API Utilities (`utils/api.ts`)

The base API utility provides common functionality for all API requests:

- Authentication token management
- Request/response handling
- Error processing
- Typed responses using interfaces
- Cache management for performance

Example Base API:

```typescript
// Basic API request with authentication and error handling
async function apiRequest<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await getAuthToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options?.headers || {})
    }
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw await handleApiError(response);
    }
    
    return await response.json();
  } catch (error) {
    // Error handling and logging
    console.error('API request failed:', error);
    throw error;
  }
}
```

## Core API Services

### Artist Service (`services/artistService.ts`)

Handles all artist-related API operations:

- `getArtists(params)`: List artists with optional filtering
- `getArtistBySlug(slug)`: Get a specific artist by their slug
- `getArtistPortfolio(id)`: Get an artist's tattoo portfolio
- `getArtistAvailability(id, params)`: Get artist's availability calendar
- `searchArtists(params)`: Search for artists with complex filters

Example Artist Service:

```typescript
export async function searchArtists(searchParams: ArtistSearchParams): Promise<ArtistSearchResult> {
  const queryParams = new URLSearchParams();
  
  // Add all search parameters to the query
  if (searchParams.searchText) queryParams.append('search_text', searchParams.searchText);
  if (searchParams.styles?.length) queryParams.append('styles', searchParams.styles.join(','));
  if (searchParams.studioId) queryParams.append('studio_id', searchParams.studioId.toString());
  
  // Location parameters
  if (searchParams.useMyLocation) queryParams.append('useMyLocation', 'true');
  if (searchParams.locationCoords) {
    queryParams.append('locationCoords[lat]', searchParams.locationCoords.lat.toString());
    queryParams.append('locationCoords[lng]', searchParams.locationCoords.lng.toString());
  }
  if (searchParams.distance) queryParams.append('distance', searchParams.distance.toString());
  
  return apiRequest<ArtistSearchResult>(`/artists/search?${queryParams.toString()}`);
}
```

### Tattoo Service (`services/tattooService.ts`)

Manages tattoo-related API interactions:

- `getTattoos(params)`: List tattoos with optional filtering
- `getTattooById(id)`: Get a specific tattoo
- `createTattoo(data)`: Create a new tattoo
- `updateTattoo(id, data)`: Update an existing tattoo
- `searchTattoos(params)`: Search for tattoos with complex filters
- `uploadTattooImage(file)`: Upload a tattoo image

### Studio Service (`services/studioService.ts`)

Handles studio-related API operations:

- `getStudios(params)`: List studios with optional filtering
- `getStudioById(id)`: Get a specific studio
- `getStudioArtists(id)`: Get artists affiliated with a studio

## Authentication Integration

### Auth Flow

Authentication is managed through the AuthContext and API service:

1. `register(data)`: Register a new user
2. `login(credentials)`: Log in an existing user
3. `logout()`: Log out the current user
4. `checkAuth()`: Verify authentication status
5. `updateProfile(data)`: Update user profile information

Example Auth Integration:

```typescript
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  
  // Store authentication token
  await storeAuthToken(response.token);
  
  return response;
}
```

## Search Parameters

When utilizing the search endpoints, the following parameters can be used:

### Common Parameters

- `search_text`: Text to search across names, descriptions, and other fields
- `styles`: Array of style IDs or comma-separated list of style IDs
- `useMyLocation`: Boolean to use the authenticated user's location
- `locationCoords`: Object with lat/lng for custom location
- `distance`: Number representing search radius
- `distanceUnit`: Unit for distance (mi, km)

### Artist Search Parameters

- `studio_id`: Filter artists by studio
- `saved_artists`: Only show artists saved by the user
- `artist_near_me`: Find artists near the user's location
- `studio_near_me`: Find studios near the user's location

### Tattoo Search Parameters

- `studio_id`: Filter tattoos by studio
- `artist_id`: Filter tattoos by artist
- `saved_tattoos`: Only show tattoos saved by the user
- `saved_artists`: Only show tattoos by artists saved by the user

## Handling API Responses

API responses follow a consistent structure:

```typescript
interface ApiResponse<T> {
  data: T;          // The main response data
  meta?: {          // Optional metadata
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
  links?: {         // Optional pagination links
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}
```

### Pagination

For paginated results, use the meta and links properties:

```typescript
async function fetchPaginatedResults<T>(
  endpoint: string, 
  page: number = 1
): Promise<ApiResponse<T[]>> {
  return apiRequest<ApiResponse<T[]>>(`${endpoint}?page=${page}`);
}
```

## Error Handling

API errors are handled consistently across the application:

```typescript
interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

async function handleApiError(response: Response): Promise<ApiError> {
  try {
    const errorData = await response.json();
    return {
      message: errorData.message || 'An unknown error occurred',
      errors: errorData.errors,
      status: response.status
    };
  } catch (e) {
    return {
      message: 'Unable to process response',
      status: response.status
    };
  }
}
```

## Uploading Files

For file uploads (images, etc.), use multipart form data:

```typescript
async function uploadImage(file: File): Promise<ImageResponse> {
  const formData = new FormData();
  formData.append('image', file);
  
  return apiRequest<ImageResponse>('/images', {
    method: 'POST',
    body: formData,
    headers: {
      // Remove content-type to let the browser set it with boundary
      'Content-Type': undefined
    }
  });
}
```

## Appointment Scheduling

Integrating with the appointment scheduling API:

```typescript
async function bookAppointment(appointmentData: AppointmentCreate): Promise<AppointmentResponse> {
  return apiRequest<AppointmentResponse>('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData)
  });
}

async function getArtistAvailability(
  artistId: number, 
  startDate: string, 
  endDate: string
): Promise<AvailabilityResponse> {
  return apiRequest<AvailabilityResponse>(
    `/artists/${artistId}/availability?start_date=${startDate}&end_date=${endDate}`
  );
}
```

## Request Caching

To improve performance, some responses can be cached:

```typescript
async function getStyles(): Promise<Style[]> {
  const cacheKey = 'styles_data';
  const cachedData = getFromCache(cacheKey);
  
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  
  const styles = await apiRequest<Style[]>('/styles');
  saveToCache(cacheKey, JSON.stringify(styles), 24 * 60 * 60); // Cache for 24 hours
  
  return styles;
}
```

## API Health Check

For monitoring API health status:

```typescript
async function checkApiHealth(): Promise<boolean> {
  try {
    await apiRequest('/health');
    return true;
  } catch (error) {
    return false;
  }
}
```