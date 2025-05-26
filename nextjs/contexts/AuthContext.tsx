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

  // Function to fetch the current user from /users/me
  const fetchCurrentUser = async (): Promise<User | null> => {
    try {
      // All API calls are prepended with /api automatically
      const response = await api.get<{data: User}>('/users/me', { 
        requiresAuth: true,
        forceRefresh: true // Don't use cached data for user info
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
      // Check if it's a network error vs auth error
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status === 401 || status === 403) {
          console.log('Auth error detected, user needs to re-login');
          return null;
        } else {
          console.log('Network error detected, keeping existing auth state');
          // Return existing user data if available
          return user;
        }
      }
      return null;
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
        const hasToken = typeof window !== 'undefined' && localStorage.getItem('auth_token');
        console.log('Auth token present:', hasToken ? 'yes' : 'no');
        
        if (hasToken) {
          // Set authenticated state immediately if token exists
          setIsAuthenticated(true);
          
          try {
            // Try to fetch user data first (faster than auth check)
            const userData = await fetchCurrentUser();
            
            if (userData) {
              console.log('User data fetched successfully on init');
              // Clear any previous auth failures since we're successful
              if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_failures');
              }
            } else {
              // If we can't fetch user data, validate the token
              console.log('User data fetch failed, checking auth validity...');
              const isAuthValid = await checkAuth();
              console.log('Auth check result:', isAuthValid ? 'valid' : 'invalid');
              
              if (!isAuthValid) {
                // Clear invalid auth state
                setUser(null);
                setIsAuthenticated(false);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('user_data');
                  localStorage.removeItem('user_id');
                  localStorage.removeItem('auth_token');
                }
              }
            }
          } catch (authError) {
            console.error('Error during auth validation:', authError);
            // Don't immediately log out on network errors
            console.log('Keeping user logged in despite network error');
          }
        } else {
          // No token found
          setIsAuthenticated(false);
          setUser(null);
          // Clear any stale user data
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user_data');
            localStorage.removeItem('user_id');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Don't clear auth state on initialization errors unless there's no token
        const hasToken = typeof window !== 'undefined' && localStorage.getItem('auth_token');
        if (!hasToken) {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

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