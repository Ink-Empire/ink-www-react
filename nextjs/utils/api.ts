import { getToken } from './auth';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: HeadersInit;
  requiresAuth?: boolean;
}

// Function to get CSRF token from cookies
export const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null; // SSR check
  
  // Get the XSRF-TOKEN cookie
  const cookies = document.cookie.split(';');
  const xsrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
  
  if (!xsrfCookie) {
    console.log('No XSRF-TOKEN cookie found');
    return null;
  }
  
  // Extract and decode the token
  const token = xsrfCookie.split('=')[1];
  const decodedToken = token ? decodeURIComponent(token) : null;
  
  if (decodedToken) {
    console.log('XSRF-TOKEN found in cookies');
  }
  
  return decodedToken;
};

// Function to fetch CSRF token from the server
export const fetchCsrfToken = async (): Promise<void> => {
  if (typeof window === 'undefined') return; // SSR check
  
  try {
    // The Laravel Sanctum endpoint for getting a CSRF cookie
    const response = await fetch('/sanctum/csrf-cookie', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error('Failed to fetch CSRF token:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
  }
};

export async function fetchApi<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    requiresAuth = false,
  } = options;

  // For all non-GET requests, ensure we have a CSRF token
  if (method !== 'GET' && typeof window !== 'undefined') {
    // Try to get existing token first
    let csrfToken = getCsrfToken();
    
    // If no token is found, fetch a new one
    if (!csrfToken) {
      await fetchCsrfToken();
      csrfToken = getCsrfToken();
    }
  }

  // Debug any GET requests to /artists
  if (endpoint === '/artists' && method === 'GET') {
    console.warn('❌ GET request to /artists detected - This should be a POST request');
    console.trace('Stack trace for GET request to /artists:');
    // Log the stack trace to help identify where this is coming from
    const error = new Error('GET request to /artists');
    console.error(error.stack);
  }
  
  // Log all API requests in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${method} ${endpoint} request`, { 
      headers: JSON.stringify(headers),
      body: body ? '(has body)' : '(no body)'
    });
  }

  // Use the API URL with /api prefix for all endpoints
  const url = `/api${endpoint}`;

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add CSRF token header for non-GET requests
  if (method !== 'GET' && typeof document !== 'undefined') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      requestHeaders['X-XSRF-TOKEN'] = csrfToken;
    }
  }

  if (requiresAuth) {
    const token = getToken(`api-${method}-${endpoint}`);
    
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn(`No auth token available for ${method} ${endpoint} request`);
    }
  }

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include', // Include cookies for cross-origin requests
    mode: 'cors', // Explicitly set CORS mode
  };

  try {
    const response = await fetch(url, requestOptions);
    
    // Handle non-JSON responses (like file downloads)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') !== -1) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data as T;
    } else {
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      return await response.text() as unknown as T;
    }
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Convenience methods for common API operations
export const api = {
  get: <T>(endpoint: string, options: Omit<ApiOptions, 'method' | 'body'> = {}) => 
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, data: any, options: Omit<ApiOptions, 'method'> = {}) => 
    fetchApi<T>(endpoint, { ...options, method: 'POST', body: data }),
  
  put: <T>(endpoint: string, data: any, options: Omit<ApiOptions, 'method'> = {}) => 
    fetchApi<T>(endpoint, { ...options, method: 'PUT', body: data }),
  
  delete: <T>(endpoint: string, options: Omit<ApiOptions, 'method'> = {}) => 
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' })
};