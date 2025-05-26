import { api, fetchCsrfToken } from './api';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  slug: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  username: string;
  slug: string;
  password: string;
  password_confirmation: string;
  type?: string;
  phone?: string;
  location?: string;
  location_lat_long?: string;
}

interface AuthResponse {
  user: User;
  message: string;
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // Ensure we have a CSRF token before login
  await fetchCsrfToken();
  
  const response = await api.post<AuthResponse>('/login', credentials);
  
  if (response.user) {
    // Store minimal user data for UI purposes only
    localStorage.setItem('user_id', response.user.id.toString());
    localStorage.setItem('user_data', JSON.stringify(response.user));
  }
  
  return response;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  // Ensure we have a CSRF token before registration
  await fetchCsrfToken();
  
  const response = await api.post<AuthResponse>('/register', data);
  
  if (response.user) {
    // Store minimal user data for UI purposes only
    localStorage.setItem('user_id', response.user.id.toString());
    localStorage.setItem('user_data', JSON.stringify(response.user));
  }
  
  return response;
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear all user data regardless of API call success
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_id');
      localStorage.removeItem('csrf_token');
    }
  }
};

export const checkAuth = async (): Promise<{ isAuthenticated: boolean; user?: User }> => {
  try {
    const response = await api.get<{ user: User }>('/users/me');
    
    // Update stored user data
    if (response.user && typeof window !== 'undefined') {
      localStorage.setItem('user_id', response.user.id.toString());
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }
    
    return { 
      isAuthenticated: true, 
      user: response.user 
    };
  } catch (error) {
    // Clear stored data on auth failure
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_id');
    }
    
    return { isAuthenticated: false };
  }
};

// Helper to get cached user data (for UI only, not for auth decisions)
export const getCachedUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};