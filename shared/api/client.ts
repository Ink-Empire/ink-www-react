// Platform-agnostic API client for InkedIn
// Works with both Next.js (web) and React Native (mobile)

import type { ApiResponse, AuthResponse, User } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface ApiConfig {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  setToken: (token: string) => Promise<void>;
  removeToken: () => Promise<void>;
  onUnauthorized?: () => void;
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

// =============================================================================
// API Client Factory
// =============================================================================

export function createApiClient(config: ApiConfig) {
  const { baseUrl, getToken, setToken, removeToken, onUnauthorized, defaultHeaders = {} } = config;

  async function request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      requiresAuth = false,
    } = options;

    const url = `${baseUrl}${endpoint}`;

    const requestHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...defaultHeaders,
      ...headers,
    };

    // Add auth token if available
    const token = await getToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    } else if (requiresAuth) {
      console.warn(`Auth required for ${endpoint} but no token available`);
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };

    try {
      const response = await fetch(url, requestOptions);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401) {
          await removeToken();
          onUnauthorized?.();
        }

        throw new ApiError(
          data?.message || `Request failed with status ${response.status}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network request failed',
        0
      );
    }
  }

  // Convenience methods
  const api = {
    get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>) =>
      request<T>(endpoint, { ...options, method: 'POST', body }),

    put: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>) =>
      request<T>(endpoint, { ...options, method: 'PUT', body }),

    patch: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>) =>
      request<T>(endpoint, { ...options, method: 'PATCH', body }),

    delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'DELETE' }),

    // Auth-specific methods
    setToken,
    getToken,
    removeToken,
  };

  return api;
}

// =============================================================================
// Error Class
// =============================================================================

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// =============================================================================
// Auth API Functions (use with any api client instance)
// =============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  username: string;
  slug: string;
  about?: string;
  phone?: string;
  location?: string;
  location_lat_long?: string;
  type?: string;
  selected_styles?: number[];
  preferred_styles?: number[];
  experience_level?: string;
  studio_id?: number;
}

export function createAuthApi(api: ReturnType<typeof createApiClient>) {
  return {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response = await api.post<AuthResponse>('/login', credentials);
      if (response.token) {
        await api.setToken(response.token);
      }
      return response;
    },

    register: async (data: RegisterData): Promise<AuthResponse> => {
      const response = await api.post<AuthResponse>('/register', data);
      if (response.token) {
        await api.setToken(response.token);
      }
      return response;
    },

    logout: async (): Promise<void> => {
      try {
        await api.post('/logout', {}, { requiresAuth: true });
      } catch (error) {
        console.error('Logout API error:', error);
      }
      await api.removeToken();
    },

    getMe: async (): Promise<User> => {
      return api.get<User>('/users/me', { requiresAuth: true });
    },

    forgotPassword: async (email: string): Promise<{ status: string }> => {
      return api.post('/forgot-password', { email });
    },

    resetPassword: async (data: {
      token: string;
      email: string;
      password: string;
      password_confirmation: string;
    }): Promise<{ status: string }> => {
      return api.post('/reset-password', data);
    },

    resendVerification: async (email: string): Promise<{ message: string }> => {
      return api.post('/email/verification-notification', { email });
    },
  };
}

// =============================================================================
// Export types
// =============================================================================

export type ApiClient = ReturnType<typeof createApiClient>;
export type AuthApi = ReturnType<typeof createAuthApi>;
