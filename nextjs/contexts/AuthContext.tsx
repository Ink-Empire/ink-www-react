import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, checkAuth } from '../utils/auth';
import { api } from '../utils/api';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
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
      const response = await api.get<{data: User}>('/users/me', { requiresAuth: true });
      
      console.log('AuthContext: Raw response from /users/me:', response);
      
      // Unwrap the user data from the nested 'data' object
      const userData = response.data || response;
      
      console.log('AuthContext: Unwrapped user data:', userData);
      
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const isAuthValid = await checkAuth();
        setIsAuthenticated(isAuthValid);
        
        if (isAuthValid) {
          // Fetch user data from /users/me endpoint
          await fetchCurrentUser();
        }
      } catch (error) {
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