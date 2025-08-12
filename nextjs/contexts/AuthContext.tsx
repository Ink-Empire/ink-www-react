import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth as useAuthHook } from '../hooks/useAuth';

interface User {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  username: string;
  slug: string;
  type_id: number;
  bio?: string;
  location?: string;
  image?: string;
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
  login: (credentials: LoginCredentials & {
    setErrors?: (errors: any) => void;
    setIsLoading?: (loading: boolean) => void;
    onSuccess?: () => void;
  }) => Promise<void>;
  logout: () => Promise<void>;
  mutate: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  mutate: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthHook();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);