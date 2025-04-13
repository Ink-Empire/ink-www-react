import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, checkAuth } from '../utils/auth';
import { api } from '../utils/api';

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
      
      // Unwrap the user data from the nested 'data' object
      const userData = response.data || response;
      
      console.log('AuthContext: Unwrapped user data:', userData);
      
      if (userData) {
        // Store user data in localStorage for persistence
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('user_data', JSON.stringify(userData));
            if (userData.id) {
              localStorage.setItem('user_id', userData.id.toString());
            }
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
          try {
            // Validate the token by checking auth
            const isAuthValid = await checkAuth();
            console.log('Auth check result:', isAuthValid ? 'valid' : 'invalid');
            setIsAuthenticated(isAuthValid);
            
            if (isAuthValid) {
              // Fetch fresh user data
              await fetchCurrentUser();
            } else {
              // Clear invalid auth state
              setUser(null);
              if (typeof window !== 'undefined') {
                localStorage.removeItem('user_data');
                localStorage.removeItem('user_id');
              }
            }
          } catch (authError) {
            console.error('Error during auth validation:', authError);
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          // No token found
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsAuthenticated(false);
        setUser(null);
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
      setUser(null);
      setIsAuthenticated(false);
    } finally {
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