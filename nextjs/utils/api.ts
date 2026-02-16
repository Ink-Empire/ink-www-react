import { getToken } from './auth';
import { 
  generateCacheKey, 
  getCacheItem, 
  setCacheItem, 
  clearCacheItem,
  clearCache
} from './apiCache';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: HeadersInit;
  requiresAuth?: boolean;
  // Cache options
  useCache?: boolean;        // Whether to use cache at all
  cacheTTL?: number;         // Cache time-to-live in milliseconds
  invalidateCache?: boolean; // Force a fresh request even if cache exists
  // Demo mode - if not specified, uses global demo mode setting
  skipDemoMode?: boolean;    // Set to true to skip adding include_demo parameter
}

// Check if demo mode is enabled (reads from localStorage)
const isDemoModeEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('inkedin_demo_mode') === 'true';
  } catch {
    return false;
  }
};

// Sanitize error messages to never expose technical details to users
const sanitizeErrorMessage = (message: string | undefined): string => {
  if (!message) return 'Something went wrong. Please try again.';

  const technicalIndicators = [
    'SQLSTATE',
    'Connection',
    'Exception',
    'Stack trace',
    'vendor/',
    'at line',
    'Column not found',
    'Duplicate entry',
    'foreign key constraint',
    'Query:',
  ];

  const isTechnicalError = technicalIndicators.some(indicator =>
    message.toLowerCase().includes(indicator.toLowerCase())
  );

  return isTechnicalError ? 'Something went wrong. Please try again.' : message;
};

// Function to get CSRF token from cookies or localStorage
export const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null; // SSR check
  
  // First try to get from localStorage
  if (typeof window !== 'undefined') {
    try {
      const storedToken = localStorage.getItem('csrf_token');
      if (storedToken) {
        console.log('Using CSRF token from localStorage');
        return storedToken;
      }
    } catch (e) {
      console.error('Error reading CSRF token from localStorage:', e);
    }
  }
  
  // If not in localStorage, try cookies
  const cookies = document.cookie.split(';');
  const xsrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
  
  if (!xsrfCookie) {
    console.log('No XSRF-TOKEN cookie found');
    return null;
  }
  
  // Extract and decode the token
  const token = xsrfCookie.split('=')[1];
  const decodedToken = token ? decodeURIComponent(token) : null;
  
  // Store token in localStorage for persistence
  if (decodedToken && typeof window !== 'undefined') {
    try {
      localStorage.setItem('csrf_token', decodedToken);
      console.log('Saved CSRF token to localStorage');
    } catch (e) {
      console.error('Error saving CSRF token to localStorage:', e);
    }
  }
  
  if (decodedToken) {
    console.log('XSRF-TOKEN found in cookies');
  }
  
  return decodedToken;
};

// Function to fetch CSRF token from the server
export const fetchCsrfToken = async (): Promise<void> => {
  if (typeof window === 'undefined') return; // SSR check
  
  try {
    // The Laravel Sanctum endpoint for getting a CSRF cookie - use relative URL to leverage rewrites
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
    body: initialBody,
    headers = {},
    requiresAuth = false,
    // Cache options with defaults
    useCache = method === 'GET', // Only cache GET requests by default
    cacheTTL = 5 * 60 * 1000,    // 5 minutes default TTL
    invalidateCache = false,      // Don't invalidate by default
    skipDemoMode = false,         // Whether to skip demo mode parameter
  } = options;

  // Use a mutable variable for the body so we can modify it
  let body = initialBody;

  // Append include_demo parameter if demo mode is enabled (show all data including demo)
  let finalEndpoint = endpoint;
  const demoModeEnabled = !skipDemoMode && isDemoModeEnabled();

  if (demoModeEnabled) {
    if (method === 'GET') {
      const separator = endpoint.includes('?') ? '&' : '?';
      finalEndpoint = `${endpoint}${separator}include_demo=1`;
    } else if (body && typeof body === 'object' && !(body instanceof FormData)) {
      body = { ...body, include_demo: 1 };
    } else if (!body) {
      body = { include_demo: 1 };
    }
  }
  
  // Generate a cache key for this request (include demo mode in key so cached demo data doesn't mix with live data)
  const cacheKey = generateCacheKey(finalEndpoint, method, body);
  
  // Check if we should try to use the cache
  if (useCache && !invalidateCache && method === 'GET') {
    const cachedData = getCacheItem<T>(cacheKey);
    if (cachedData !== null) {
      console.log(`Using cached data for ${method} ${finalEndpoint}`);
      return cachedData;
    }
  }
  
  // If we're invalidating the cache, clear the item now
  if (invalidateCache) {
    clearCacheItem(cacheKey);
  }

  // For all non-GET requests, ensure we have a CSRF token
  if (method !== 'GET' && typeof window !== 'undefined') {
    // Try to get existing token first
    let csrfToken = getCsrfToken();
    
    // If no token is found, fetch a new one
    if (!csrfToken) {
      await fetchCsrfToken();
      
      // Wait a bit for the cookie to be set by the browser, then retry
      let retries = 3;
      while (!csrfToken && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
        csrfToken = getCsrfToken();
        retries--;
      }
      
      if (!csrfToken) {
        console.warn('Failed to obtain CSRF token after retries');
      }
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
    console.log(`[API] ${method} ${endpoint} request`, {
      headers: JSON.stringify(headers),
      body: body ? JSON.stringify(body) : '(no body)',
      demoModeEnabled
    });
  }

  // Use the API URL with /api prefix for all endpoints
  const url = `/api${finalEndpoint}`;

  const requestHeaders: HeadersInit = {
    'Accept': 'application/json', // Always request JSON responses
    ...headers,
  };

  // Add app token for API access control
  const appToken = process.env.NEXT_PUBLIC_API_APP_TOKEN;
  if (appToken) {
    requestHeaders['X-App-Token'] = appToken;
  }

  // Only set Content-Type to application/json if body is not FormData
  if (!(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // Check for bearer token (if using token-based auth)
  const token = getToken(`api-${method}-${endpoint}`);

  // Only add CSRF token header for non-GET requests when NOT using Bearer token
  // Bearer token auth doesn't need CSRF protection
  if (method !== 'GET' && typeof document !== 'undefined' && !token) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      requestHeaders['X-XSRF-TOKEN'] = csrfToken;
    }
  }

  // Determine credentials mode:
  // - When we have a Bearer token: omit cookies to prevent session cookie from overriding token auth
  // - When no token: include cookies for session-based auth
  let credentialsMode: RequestCredentials = 'include';

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
    // ALWAYS omit cookies when using Bearer token to prevent session cookie conflicts
    // This ensures the token determines the authenticated user, not a stale session cookie
    credentialsMode = 'omit';
    console.log(`Using Bearer token for ${method} ${endpoint} (not sending cookies)`);
  } else if (requiresAuth) {
    // No token and auth required — reject immediately to avoid wasted network calls
    const error = new Error('Authentication required') as any;
    error.status = 401;
    error.data = { message: 'Not authenticated' };
    throw error;
  }

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    credentials: credentialsMode,
    mode: 'cors',
  };

  try {
    const response = await fetch(url, requestOptions);
    
    // Handle non-JSON responses (like file downloads)
    const contentType = response.headers.get('content-type');
    let responseData: any;
    
    if (contentType && contentType.indexOf('application/json') !== -1) {
      responseData = await response.json();

      if (!response.ok) {
        // Create error with sanitized message - never expose technical details
        const error = new Error(sanitizeErrorMessage(responseData.message)) as any;
        error.status = response.status;
        error.data = responseData;
        // Keep original message for logging but don't expose to UI
        error.originalMessage = responseData.message;
        throw error;
      }
    } else {
      if (!response.ok) {
        const error = new Error('API request failed') as any;
        error.status = response.status;
        throw error;
      }
      
      responseData = await response.text();
    }
    
    // Cache the successful response if caching is enabled
    if (useCache && method === 'GET' && response.ok) {
      console.log(`Caching response for ${method} ${finalEndpoint}`);
      setCacheItem(cacheKey, responseData, cacheTTL);
    }
    
    return responseData as T;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Convenience methods for common API operations
export const api = {
  // GET requests with caching enabled by default
  get: <T>(endpoint: string, options: Omit<ApiOptions, 'method' | 'body'> = {}) => 
    fetchApi<T>(endpoint, { 
      ...options, 
      method: 'GET',
      useCache: options.useCache !== undefined ? options.useCache : true
    }),
  
  // POST requests with caching disabled by default
  post: <T>(endpoint: string, data: any, options: Omit<ApiOptions, 'method'> = {}) => {
    // For idempotent POST requests that act like GET (e.g. search with complex params),
    // we can optionally enable caching
    const useCache = options.useCache === true;
    
    return fetchApi<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: data,
      useCache 
    });
  },
  
  // PUT requests with cache invalidation
  put: <T>(endpoint: string, data: any, options: Omit<ApiOptions, 'method'> = {}) => {
    // When we update a resource, invalidate related GET caches
    const relatedGetEndpoint = endpoint.split('/').slice(0, -1).join('/');
    clearCacheItem(generateCacheKey(relatedGetEndpoint, 'GET'));
    
    return fetchApi<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: data,
      useCache: false 
    });
  },
  
  // DELETE requests with cache invalidation
  delete: <T>(endpoint: string, options: Omit<ApiOptions, 'method'> = {}) => {
    // When we delete a resource, invalidate related GET caches
    const relatedGetEndpoint = endpoint.split('/').slice(0, -1).join('/');
    clearCacheItem(generateCacheKey(relatedGetEndpoint, 'GET'));
    
    return fetchApi<T>(endpoint, { 
      ...options, 
      method: 'DELETE',
      useCache: false 
    });
  },
  
  // Clear all API cache or based on a pattern
  clearCache: (pattern?: string): void => {
    console.log(`Clearing API cache${pattern ? ` for pattern: ${pattern}` : ' (all items)'}`);
    
    // Use the imported clearCache function
    clearCache(pattern);
  },
  
  // Clear cache specifically for user-related endpoints
  clearUserCache: (): void => {
    console.log('Clearing all user-related API cache');
    
    // Clear cache for common user-related endpoints
    clearCache('/users/me');
    clearCache('/users/');
    clearCache('/user');
    clearCache('user');
    clearCache('profile');
  }
};