// Next.js (Web) API client configuration
// Sets up the shared API client with browser-specific storage

import { createApiClient, createAuthApi, type StorageAdapter } from '@inkedin/shared';

// Browser localStorage adapter
const webStorage: StorageAdapter = {
  getItem: async (key: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

// Token storage helpers
const TOKEN_KEY = 'auth_token';

const getToken = async (): Promise<string | null> => {
  return webStorage.getItem(TOKEN_KEY);
};

const setToken = async (token: string): Promise<void> => {
  return webStorage.setItem(TOKEN_KEY, token);
};

const removeToken = async (): Promise<void> => {
  return webStorage.removeItem(TOKEN_KEY);
};

// Get API base URL
const getApiBaseUrl = (): string => {
  // In Next.js, we use the rewrite proxy at /api
  if (typeof window !== 'undefined') {
    return '/api';
  }
  // Server-side, use the actual API URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
};

// Create and export the API client instance
export const api = createApiClient({
  baseUrl: getApiBaseUrl(),
  getToken,
  setToken,
  removeToken,
  onUnauthorized: () => {
    // Redirect to login on 401
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },
});

// Create and export the auth API
export const authApi = createAuthApi(api);

// Export storage for direct access if needed
export { webStorage, getToken, setToken, removeToken };
