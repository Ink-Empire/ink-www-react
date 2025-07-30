import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, checkAuth } from '../utils/auth';
import { api } from '../utils/api';
import { clearCache } from '../utils/apiCache';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  slug: string;
  type_id: number;
  // Add more user properties as needed
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  slug: string;
  password: string;
  password_confirmation: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  fetchCurrentUser: async () => null,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Add periodic refresh to keep user data current
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    
    // Refresh user data every 5 minutes when user is active
    const refreshInterval = setInterval(async () => {
      try {
        console.log('Periodic user data refresh');
        const userData = await fetchCurrentUser();
        if (!userData) {
          console.log('Periodic refresh failed - but keeping user authenticated');
        }
      } catch (error) {
        console.error('Error during periodic user refresh:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, isLoading]); // Dependencies are fine - fetchCurrentUser is defined above

  // Add visibility change listener to refresh when user returns to tab
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = async () => {
      if (!document.hidden && isAuthenticated) {
        console.log('User returned to tab - refreshing user data');
        try {
          await fetchCurrentUser();
        } catch (error) {
          console.error('Error refreshing user data on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated]);

  // Function to fetch the current user from /users/me
  const fetchCurrentUser = async (): Promise<User | null> => {
    try {
      // All API calls are prepended with /api automatically
      const response = await api.get<{data: User}>('/users/me', { 
        requiresAuth: true,
        useCache: false,
        invalidateCache: true
      });
      
      console.log('AuthContext: Raw response from /users/me:', response);
      
      // Handle different response formats - check if it's wrapped or direct
      let userData: User | null = null;
      
      if (response.data && typeof response.data === 'object') {
        userData = response.data as User;
      } else if (response && typeof response === 'object' && 'id' in response) {
        userData = response as User;
      }
      
      console.log('AuthContext: Processed user data:', userData);
      
      if (userData && userData.id) {
        // Store user data in localStorage for persistence
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('user_data', JSON.stringify(userData));
            localStorage.setItem('user_id', userData.id.toString());
          } catch (storageErr) {
            console.error('Failed to save user data to localStorage:', storageErr);
          }
        }
        
        setUser(userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching current user:', error);
      
      // Check if it's an auth error (401/403) vs network error
      const isAuthError = error && typeof error === 'object' && 
                        ('status' in error && [401, 403].includes((error as any).status));
                        
      if (isAuthError) {
        console.log('Auth error detected in fetchCurrentUser - token is invalid');
        // Clear localStorage data since token is invalid
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user_data');
          localStorage.removeItem('user_id');
          localStorage.removeItem('auth_token');
        }
        setUser(null);
        return null;
      } else {
        console.log('Network error in fetchCurrentUser - keeping existing auth state');
        // For network errors, keep the user authenticated and return existing user data
        return user; // Return current user data instead of null
      }
    }
  };

  // Load stored user data on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Try to load user from localStorage first
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          const parsedUser = JSON.parse(storedUserData);
          setUser(parsedUser);
          console.log('Loaded user data from localStorage:', parsedUser);
        }
      } catch (e) {
        console.error('Error loading user data from localStorage:', e);
      }
    }
  }, []);

  // Check authentication status when component mounts
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      try {
        // Check if token is present
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        console.log('Auth initialization - token present:', token ? 'yes' : 'no');
        
        if (!token) {
          // No token found - user is not authenticated
          console.log('No auth token found - setting unauthenticated state');
          setIsAuthenticated(false);
          setUser(null);
          // Clear any stale user data
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user_data');
            localStorage.removeItem('user_id');
          }
          return;
        }

        // Token exists - assume authenticated until proven otherwise
        setIsAuthenticated(true);
        
        // Try to fetch current user data to validate the token
        try {
          const userData = await fetchCurrentUser();
          
          if (userData) {
            console.log('Auth initialization successful - user data loaded');
            // Clear any previous auth failures since we're successful
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth_failures');
            }
          } else {
            // fetchCurrentUser returned null - could be network issue, don't clear token immediately
            console.log('Failed to load user data - keeping token, may be network issue');
            // Keep user authenticated if we have a token, just don't have current user data
            setIsAuthenticated(true);
            // Try to load cached user data if available
            if (typeof window !== 'undefined') {
              try {
                const cachedUser = localStorage.getItem('user_data');
                if (cachedUser) {
                  setUser(JSON.parse(cachedUser));
                  console.log('Using cached user data while API is unavailable');
                }
              } catch (e) {
                console.error('Error loading cached user data:', e);
              }
            }
          }
        } catch (apiError) {
          console.error('Error fetching user data during auth init:', apiError);
          
          // Check if it's an auth error (401/403) vs network error
          const isAuthError = apiError && typeof apiError === 'object' && 
                            ('status' in apiError && [401, 403].includes((apiError as any).status));
          
          if (isAuthError) {
            console.log('Auth error detected - clearing auth state');
            setUser(null);
            setIsAuthenticated(false);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('user_data');
              localStorage.removeItem('user_id');
              localStorage.removeItem('auth_token');
            }
          } else {
            console.log('Network error during auth init - keeping auth state (will retry later)');
            // Keep the user logged in but don't have user data yet
            // The stored user data from localStorage will be used if available
          }
        }
      } catch (initError) {
        console.error('Auth initialization error:', initError);
        // On initialization errors, fall back to safe state
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Refresh auth state when user returns to the tab
  useEffect(() => {
    if (typeof window === 'undefined' || !isAuthenticated) return;
    
    const handleVisibilityChange = async () => {
      if (!document.hidden && isAuthenticated) {
        console.log('Tab became visible - refreshing user data');
        try {
          await fetchCurrentUser();
        } catch (error) {
          console.error('Error refreshing user data on tab focus:', error);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await apiLogin(credentials);
      setIsAuthenticated(true);
      
      // Fetch the full user data from /users/me after login
      await fetchCurrentUser();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await apiRegister(data);
      setIsAuthenticated(true);
      
      // Fetch the full user data from /users/me after registration
      await fetchCurrentUser();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear state and localStorage regardless of API call success
      setUser(null);
      setIsAuthenticated(false);
      
      // Ensure localStorage is cleared even if apiLogout failed
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_id');
        localStorage.removeItem('auth_failures');
        
        // Clear any other user-related cache items
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('user') || key.includes('token') || key.includes('auth'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('AuthContext: Cleared all user data from localStorage');
      }
      
      // Clear all API cache to prevent stale data
      try {
        clearCache();
        console.log('AuthContext: Cleared all API cache');
      } catch (cacheError) {
        console.error('AuthContext: Failed to clear API cache:', cacheError);
      }
      
      // Force reload the page to ensure complete cleanup
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
      
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);