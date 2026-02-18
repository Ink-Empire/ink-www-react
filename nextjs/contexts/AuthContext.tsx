import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { api } from '../utils/api';
import { setToken, removeToken } from '../utils/auth';
import { disconnectEcho } from '../utils/echo';

// User interface - complete user data
interface User {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  username?: string;
  slug?: string;
  type?: string;
  type_id?: number;
  bio?: string;
  location?: string;
  image?: any;
  styles?: number[];
  phone?: string;
  favorites?: {
    artists?: number[];
    tattoos?: number[];
    studios?: number[];
  };
  // Studio fields
  studio_id?: number;
  // Primary studio (for backwards compatibility)
  studio?: {
    id: number;
    name: string;
    slug: string;
    image?: { id: number; uri: string } | null;
  } | null;
  // All verified studio affiliations
  studios_affiliated?: {
    id: number;
    name: string;
    slug: string;
    image?: { id: number; uri: string } | null;
    is_primary: boolean;
  }[];
  owned_studio?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  [key: string]: any; // Allow additional properties from API
}

interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginCredentials & {
    setErrors?: (errors: any) => void;
    setIsLoading?: (loading: boolean) => void;
    onSuccess?: () => void;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateStyles: (styles: number[]) => Promise<void>;
  toggleFavorite: (type: 'artist' | 'tattoo' | 'studio', id: number) => Promise<void>;
  refreshUser: () => Promise<User | null>;
  setUserDirectly: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {},
  updateStyles: async () => {},
  toggleFavorite: async () => {},
  refreshUser: async () => null,
  setUserDirectly: () => {},
});

// Single localStorage key for user data
const USER_KEY = 'user';

// Helper to get user from localStorage
const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.id) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading user from localStorage:', e);
  }
  return null;
};

// Helper to save user to localStorage
const saveUser = (user: User | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (e) {
    console.error('Error saving user to localStorage:', e);
  }
};

// Clear auth-related storage
const clearStorage = (): void => {
  if (typeof window === 'undefined') return;
  try {
    // Clear auth-specific keys only
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_id');
    localStorage.removeItem('csrf_token');
    localStorage.removeItem('auth_token');

    // Clear API caches
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('api_cache:') || key.startsWith('studios_cache:'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('Auth storage cleared');
  } catch (e) {
    console.error('Error clearing storage:', e);
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();

  // Initialize as null to avoid hydration mismatch (server vs client)
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load stored user after hydration (client-side only)
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsHydrated(true);
  }, []);

  // Fetch CSRF cookie
  const csrf = useCallback(async () => {
    try {
      await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'include'
      });
    } catch (e) {
      console.error('Failed to fetch CSRF cookie:', e);
    }
  }, []);

  // Fetch user from API
  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await api.get<any>('/users/me', { useCache: false });
      const userData = response.data || response;

      if (userData && userData.id) {
        setUser(userData);
        saveUser(userData);
        setError(null);
        return userData;
      }
      return null;
    } catch (err: any) {
      console.log('fetchUser error:', err?.message || err);
      if (err?.status === 401 || err?.message?.includes('Unauthenticated')) {
        setUser(null);
        saveUser(null);
      }
      return null;
    }
  }, []);

  // Validate session after hydration
  useEffect(() => {
    if (!isHydrated) return;

    let mounted = true;

    const validateSession = async () => {
      // Skip validation on verify-email page - it handles its own auth flow
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      if (pathname.startsWith('/verify-email')) {
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      const storedUser = getStoredUser();
      if (storedUser) {
        // Validate with server
        const serverUser = await fetchUser();
        if (mounted && !serverUser) {
          console.log('Session expired, clearing stored user');
          setUser(null);
          saveUser(null);
        }
      } else {
        // Only try to fetch if there's a token (avoid 401 errors on public pages)
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
          await fetchUser();
        }
      }

      if (mounted) {
        setIsLoading(false);
      }
    };

    validateSession();

    return () => {
      mounted = false;
    };
  }, [isHydrated, fetchUser]);

  // Login
  const login = useCallback(async ({
    setErrors,
    setIsLoading: setLoginLoading,
    onSuccess,
    ...credentials
  }: LoginCredentials & {
    setErrors?: (errors: any) => void;
    setIsLoading?: (loading: boolean) => void;
    onSuccess?: () => void;
  }) => {
    setLoginLoading?.(true);
    setErrors?.([]);

    // Clear ALL auth data before login to prevent any stale data from previous user
    // This is critical to avoid using wrong user's token or session
    removeToken();
    clearStorage();
    api.clearCache?.();

    try {
      await csrf();
      const loginResponse = await api.post<any>('/login', credentials);

      // Store the token from the login response
      if (loginResponse.token) {
        setToken(loginResponse.token);
        console.log('Auth token stored for user:', loginResponse.user?.email || loginResponse.user?.id);
      } else {
        console.error('WARNING: No token returned from login API!');
      }

      // Get user data from the login response or fetch separately
      let userData = loginResponse.user;

      if (!userData || !userData.id) {
        // Fallback: fetch user data if not included in login response
        const userResponse = await api.get<any>('/users/me', { useCache: false });
        userData = userResponse.data || userResponse;
      }

      if (userData && userData.id) {
        setUser(userData);
        saveUser(userData);
        setError(null);
        console.log('Login successful:', userData.email);
        onSuccess?.();
      } else {
        throw new Error('Login succeeded but failed to get user data');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setUser(null);
      saveUser(null);

      // Check for email verification required (403 with requires_verification)
      // Handle both err.response.data and err.data patterns
      const errorData = err.response?.data || err.data || err;
      const errorStatus = err.response?.status || err.status;

      if (errorStatus === 403 && errorData?.requires_verification) {
        const verificationError = new Error(errorData.message) as any;
        verificationError.requires_verification = true;
        verificationError.email = errorData.email;
        throw verificationError;
      }

      // Also check if the error itself has requires_verification (direct API response)
      if (err.requires_verification) {
        throw err;
      }

      if (errorStatus === 422) {
        setErrors?.(errorData.errors);
      } else {
        setErrors?.({ email: [err.message || 'Login failed. Please try again.'] });
      }
      throw err;
    } finally {
      setLoginLoading?.(false);
    }
  }, [csrf]);

  // Logout
  const logout = useCallback(async () => {
    // First call the logout API to clear server session
    try {
      await api.post('/logout', {});
    } catch (err) {
      console.error('Logout API error:', err);
    }

    // Disconnect WebSocket before clearing auth
    disconnectEcho();

    // Remove the auth token
    removeToken();

    // Clear React state
    setUser(null);

    // Clear auth storage
    clearStorage();

    // Clear API cache
    api.clearCache?.();
    api.clearUserCache?.();

    // Don't redirect if already on login or register pages
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        router.push('/login');
      }
    }
  }, [router]);

  // Update user data
  const updateUser = useCallback(async (data: Partial<User>): Promise<void> => {
    if (!user?.id) {
      setError('User is not logged in');
      throw new Error('User is not logged in');
    }

    try {
      const response = await api.put<any>(`/users/${user.id}`, data, {
        requiresAuth: true
      });

      const updatedUser = response.user || response.data || response;
      if (updatedUser) {
        const mergedUser = { ...user, ...updatedUser };
        setUser(mergedUser);
        saveUser(mergedUser);
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
      throw err;
    }
  }, [user]);

  // Update styles shorthand
  const updateStyles = useCallback(async (styles: number[]): Promise<void> => {
    return updateUser({ styles });
  }, [updateUser]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (type: 'artist' | 'tattoo' | 'studio', id: number): Promise<void> => {
    if (!user?.id) {
      setError('User is not logged in');
      throw new Error('User is not logged in');
    }

    const typeKey = `${type}s` as 'artists' | 'tattoos' | 'studios';
    const currentFavorites = user.favorites || {};
    const currentList = currentFavorites[typeKey] || [];
    const isAlreadyFavorite = currentList.includes(id);

    const updatedList = isAlreadyFavorite
      ? currentList.filter(itemId => itemId !== id)
      : [...currentList, id];

    const updatedFavorites = { ...currentFavorites, [typeKey]: updatedList };

    try {
      await api.post(`/users/favorites/${type}`, {
        ids: id,
        action: isAlreadyFavorite ? 'remove' : 'add'
      }, { requiresAuth: true });

      const updatedUser = { ...user, favorites: updatedFavorites };
      setUser(updatedUser);
      saveUser(updatedUser);
    } catch (err) {
      console.error('Error updating favorites:', err);
      throw err;
    }
  }, [user]);

  // Refresh user data
  const refreshUser = useCallback(async (): Promise<User | null> => {
    return fetchUser();
  }, [fetchUser]);

  // Set user directly without API call (used after registration)
  const setUserDirectly = useCallback((userData: User): void => {
    if (userData && userData.id) {
      setUser(userData);
      saveUser(userData);
      setError(null);
      console.log('User set directly:', userData.email);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        error,
        login,
        logout,
        updateUser,
        updateStyles,
        toggleFavorite,
        refreshUser,
        setUserDirectly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Define the return type for useUser
type UseUserReturn = {
  userData: Partial<User>;
  loading: boolean;
  error: string | null;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateStyles: (styles: number[]) => Promise<void>;
  toggleFavorite: (type: 'artist' | 'tattoo' | 'studio', id: number) => Promise<void>;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
};

// Alias for backwards compatibility with UserContext usage
export const useUser = (): UseUserReturn => {
  const auth = useContext(AuthContext);
  return {
    userData: auth.user || {},
    loading: auth.isLoading,
    error: auth.error,
    updateUser: auth.updateUser,
    updateStyles: auth.updateStyles,
    toggleFavorite: auth.toggleFavorite,
    refreshUser: auth.refreshUser,
    logout: auth.logout,
  };
};

// Define the return type for useUserData
type UserDataReturn = Partial<User> & {
  updateUser: (data: Partial<User>) => Promise<void>;
  updateStyles: (styles: number[]) => Promise<void>;
  toggleFavorite: (type: 'artist' | 'tattoo' | 'studio', id: number) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
};

// Returns user data directly with methods attached (for legacy useUserData compatibility)
export const useUserData = (): UserDataReturn => {
  const auth = useContext(AuthContext);
  const userData = auth.user || {};

  return {
    ...userData,
    updateUser: auth.updateUser,
    updateStyles: auth.updateStyles,
    toggleFavorite: auth.toggleFavorite,
    logout: auth.logout,
    loading: auth.isLoading,
    error: auth.error,
  };
};
