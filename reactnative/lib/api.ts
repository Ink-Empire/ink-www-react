// React Native API client configuration
// Sets up the shared API client with AsyncStorage for token persistence

import AsyncStorage from '@react-native-async-storage/async-storage';
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

// API base URL - configure this for your environment
// In development, this might be your local machine's IP
// In production, this will be your API server URL
const API_BASE_URL = __DEV__
  ? 'http://localhost:8000/api' // Change to your machine's IP for device testing
  : 'https://api.inkedin.com/api'; // Production URL

// Create and export the API client instance
export const api = createApiClient({
  baseUrl: API_BASE_URL,
  getToken,
  setToken,
  removeToken,
  onUnauthorized: () => {
    // Handle unauthorized - navigation will be handled by the app
    console.log('Unauthorized - user needs to log in');
    // You can emit an event or call a navigation function here
  },
});

// Create and export the auth API
export const authApi = createAuthApi(api);

// Export storage for direct access if needed
export { mobileStorage, getToken, setToken, removeToken, API_BASE_URL };
