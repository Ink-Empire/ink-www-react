import { useRouter } from 'next/router';
import { useEffect } from 'react';
import useSWR from 'swr';

import { api } from '../utils/api';

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

interface UseAuthOptions {
  middleware?: 'guest' | 'auth';
  redirectIfAuthenticated?: string;
  redirectIfUnauthenticated?: string;
}

const fetcher = async (url: string) => {
  const response = await api.get(url);
  return response.data || response;
};

export const useAuth = ({
  middleware,
  redirectIfAuthenticated,
  redirectIfUnauthenticated = '/login',
}: UseAuthOptions = {}) => {
  const router = useRouter();

  const {
    data: user,
    error,
    mutate,
    isLoading,
  } = useSWR<User>(
    '/users/me',
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
      onErrorRetry: (error) => {
        // Never retry on 401, user is unauthenticated
        if (error.status === 401) return;
      },
    }
  );

  const csrf = () => fetch('/sanctum/csrf-cookie', { 
    method: 'GET', 
    credentials: 'include' 
  });

  const login = async ({ 
    setErrors, 
    setIsLoading, 
    onSuccess, 
    ...credentials 
  }: LoginCredentials & {
    setErrors?: (errors: any) => void;
    setIsLoading?: (loading: boolean) => void;
    onSuccess?: () => void;
  }) => {
    await csrf();

    setIsLoading?.(true);
    setErrors?.([]);

    try {
      await api.post('/login', credentials);
      
      // Immediately refresh user data after successful login
      await mutate();
      onSuccess?.();
    } catch (error: any) {
      if (error.response?.status === 422) {
        setErrors?.(error.response.data.errors);
      } else {
        throw error;
      }
    } finally {
      setIsLoading?.(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout API error (continuing with cleanup):', error);
    }
    
    // Optimistically update user to null and don't revalidate
    await mutate(null, { revalidate: false });
    
    // Clear API cache
    api.clearUserCache?.();
    
    // Redirect to login
    if (typeof window !== 'undefined' && window.location.pathname !== redirectIfUnauthenticated) {
      router.push(redirectIfUnauthenticated);
    }
  };

  // Handle middleware redirects
  useEffect(() => {
    if (middleware === 'guest' && redirectIfAuthenticated && user) {
      router.push(redirectIfAuthenticated);
    }

    if (middleware === 'auth' && error) {
      if (error?.response?.status === 401) {
        console.log('User is no longer authorized, forcing logout');
        logout();
      }
    }
  }, [user, error, isLoading, router, middleware, redirectIfAuthenticated]);

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user && !error),
    login,
    logout,
    mutate,
  };
};