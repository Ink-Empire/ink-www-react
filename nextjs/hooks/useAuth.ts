import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import useSWR from 'swr';

import { api } from '../utils/api';
import { clearAuthCache, clearUserSpecificCache } from '../utils/clearAuthCache';

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
  try {
    const response = await api.get(url);
    return response.data || response;
  } catch (error: any) {
    throw error;
  }
};

export const useAuth = ({
  middleware,
  redirectIfAuthenticated,
  redirectIfUnauthenticated = '/login',
}: UseAuthOptions = {}) => {
  const router = useRouter();
  const isLoggingIn = useRef(false);

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
      keepPreviousData: false, // Don't keep previous data to avoid showing stale user info
      onErrorRetry: (error) => {
        // Never retry on 401, user is unauthenticated
        if (error.status === 401) return;
      },
      // Disable error retry to prevent error state flashing during login
      errorRetryCount: 0,
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
    isLoggingIn.current = true;
    await csrf();

    setIsLoading?.(true);
    setErrors?.([]);

    try {
      await api.post('/login', credentials);
      
      // Clear any previous error state before refreshing user data
      // This prevents the brief "unable to authenticate" flash
      await mutate(undefined, { revalidate: true });
      onSuccess?.();
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Clear all cached data on login failure
      await mutate(null, { revalidate: false });
      
      // Clear all authentication-related cached data
      clearUserSpecificCache();
      
      // Clear API cache
      api.clearUserCache?.();
      
      if (error.response?.status === 422) {
        setErrors?.(error.response.data.errors);
      } else {
        throw error;
      }
    } finally {
      setIsLoading?.(false);
      isLoggingIn.current = false;
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
    
    // Clear all authentication and user-related cached data
    clearAuthCache();
    
    // Clear API cache
    api.clearUserCache?.();
    
    // Redirect to login
    if (typeof window !== 'undefined' && window.location.pathname !== redirectIfUnauthenticated) {
      router.push(redirectIfUnauthenticated);
    }
  };

  // Handle middleware redirects and clear stale data
  useEffect(() => {
    if (middleware === 'guest' && redirectIfAuthenticated && user) {
      router.push(redirectIfAuthenticated);
    }

    // Only force logout for auth middleware if we're not currently loading or logging in
    // and we had a user but now have a 401 error (session expired)
    if (middleware === 'auth' && error && !isLoading && !isLoggingIn.current) {
      if (error?.response?.status === 401 && user === null) {
        // Only logout if we previously had a user (session expired scenario)
        // Don't logout on initial 401 errors when user was never authenticated
        const hadUser = typeof window !== 'undefined' && localStorage.getItem('user_data');
        if (hadUser) {
          console.log('User session expired, forcing logout');
          logout();
        }
      }
    }
    
    // Clear localStorage when there's an authentication error, but not during loading or login
    // to prevent flashing during login process
    if (error && !isLoading && !isLoggingIn.current && typeof window !== 'undefined') {
      console.log('Authentication error detected, clearing stale cached data');
      clearUserSpecificCache();
    }
  }, [user, error, isLoading, router, middleware, redirectIfAuthenticated, isLoggingIn]);

  return {
    user,
    isLoading,
    // More resilient authentication check - consider authenticated if we have user data
    // even if there's a stale error (prevents flashing during login transitions)
    isAuthenticated: Boolean(user),
    login,
    logout,
    mutate,
  };
};