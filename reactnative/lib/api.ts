// React Native API client configuration
// Sets up the shared API client with AsyncStorage for token persistence

import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { createApiClient, createAuthApi, type StorageAdapter } from '@inkedin/shared';

// AsyncStorage adapter for React Native
const mobileStorage: StorageAdapter = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to AsyncStorage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from AsyncStorage:', error);
    }
  },
  clear: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  },
};

// Token storage helpers
const TOKEN_KEY = 'auth_token';

const getToken = async (): Promise<string | null> => {
  return mobileStorage.getItem(TOKEN_KEY);
};

const setToken = async (token: string): Promise<void> => {
  return mobileStorage.setItem(TOKEN_KEY, token);
};

const removeToken = async (): Promise<void> => {
  return mobileStorage.removeItem(TOKEN_KEY);
};

const API_BASE_URL = __DEV__
  ? 'http://localhost/api'
  : 'https://api.getinked.in/api';

// Create the base API client instance
const baseApi = createApiClient({
  baseUrl: API_BASE_URL,
  getToken,
  setToken,
  removeToken,
  defaultHeaders: {
    'X-App-Token': __DEV__
      ? '46d4bd6b9e874f125a1d16fa76110705b66b4a2a045c5ac8f26cdff581acbdfb'
      : '8c07eab3b9d0a757f0d9208e94831fb9a04d1fa7d96f5540495020082cb7c013',
  },
  onUnauthorized: () => {
    console.log('Unauthorized - user needs to log in');
  },
});

// Demo mode support — when enabled, is_demo=1 is appended to all requests
let _demoMode = false;

export function setDemoMode(enabled: boolean) {
  _demoMode = enabled;
}

export function isDemoMode(): boolean {
  return _demoMode;
}

function injectDemo<T>(body?: any): any {
  if (!_demoMode) return body;
  if (body && typeof body === 'object') return { ...body, is_demo: 1 };
  return { is_demo: 1 };
}

function injectDemoGet(endpoint: string): string {
  if (!_demoMode) return endpoint;
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}is_demo=1`;
}

// Wrap the base api to auto-inject is_demo
export const api = {
  ...baseApi,
  get: <T>(endpoint: string, options?: any) =>
    baseApi.get<T>(injectDemoGet(endpoint), options),
  post: <T>(endpoint: string, body?: any, options?: any) =>
    baseApi.post<T>(endpoint, injectDemo(body), options),
  put: <T>(endpoint: string, body?: any, options?: any) =>
    baseApi.put<T>(endpoint, injectDemo(body), options),
  patch: <T>(endpoint: string, body?: any, options?: any) =>
    baseApi.patch<T>(endpoint, injectDemo(body), options),
};

// Create and export the auth API (uses base api — auth calls should not inject is_demo)
export const authApi = createAuthApi(baseApi);

// Export storage for direct access if needed
export { mobileStorage, getToken, setToken, removeToken, API_BASE_URL };
