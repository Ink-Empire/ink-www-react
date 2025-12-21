// Platform-agnostic storage interface
// Implementations provided by each platform (web uses localStorage, mobile uses AsyncStorage)

export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear?: () => Promise<void>;
}

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  CSRF_TOKEN: 'csrf_token',
} as const;

// Create auth token helpers with a storage adapter
export function createTokenStorage(storage: StorageAdapter) {
  return {
    getToken: async (): Promise<string | null> => {
      try {
        return await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      } catch (error) {
        console.error('Error reading token:', error);
        return null;
      }
    },

    setToken: async (token: string): Promise<void> => {
      try {
        await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      } catch (error) {
        console.error('Error setting token:', error);
      }
    },

    removeToken: async (): Promise<void> => {
      try {
        await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      } catch (error) {
        console.error('Error removing token:', error);
      }
    },
  };
}

// Create user storage helpers
export function createUserStorage(storage: StorageAdapter) {
  return {
    getUser: async <T>(): Promise<T | null> => {
      try {
        const data = await storage.getItem(STORAGE_KEYS.USER);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Error reading user:', error);
        return null;
      }
    },

    setUser: async <T>(user: T): Promise<void> => {
      try {
        await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } catch (error) {
        console.error('Error setting user:', error);
      }
    },

    removeUser: async (): Promise<void> => {
      try {
        await storage.removeItem(STORAGE_KEYS.USER);
      } catch (error) {
        console.error('Error removing user:', error);
      }
    },
  };
}

// Clear all auth-related storage
export async function clearAuthStorage(storage: StorageAdapter): Promise<void> {
  try {
    await Promise.all([
      storage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
      storage.removeItem(STORAGE_KEYS.USER),
      storage.removeItem(STORAGE_KEYS.CSRF_TOKEN),
    ]);
  } catch (error) {
    console.error('Error clearing auth storage:', error);
  }
}
