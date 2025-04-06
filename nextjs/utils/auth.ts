import { api } from './api';
import { clearCache } from './apiCache';

// Token management
export const getToken = (source: string = 'unknown'): string | null => {
  if (typeof window === 'undefined') {
    console.log(`getToken called during SSR from ${source} - no token available`);
    return null;
  }
  
  try {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.log(`No auth token found in localStorage (requested by ${source})`);
    } else {
      // Only log the first few characters of the token for security
      const tokenPreview = token.substring(0, 10) + '...';
      console.log(`Auth token retrieved from localStorage (requested by ${source}): ${tokenPreview}`);
    }
    
    return token;
  } catch (error) {
    console.error(`Error reading token from localStorage (requested by ${source}):`, error);
    return null;
  }
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') {
    console.warn('setToken called during SSR - token will not be saved');
    return;
  }
  
  try {
    console.log('Setting auth token in localStorage');
    localStorage.setItem('auth_token', token);
    
    // Verify immediately
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken !== token) {
      console.error('Token verification failed - stored token does not match the token being set');
    }
  } catch (error) {
    console.error('Error setting token in localStorage:', error);
  }
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

// User authentication
interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token?: string;
  access_token?: string; // Some APIs use access_token instead of token
  bearerToken?: string;  // Some APIs use bearerToken
  authToken?: string;    // Some APIs use authToken
  user?: any;
  data?: {
    token?: string;
    access_token?: string;
    user?: any;
  };
}

interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  password_confirmation: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/login', credentials);
    
    console.log('Login response received:', JSON.stringify(response, null, 2));
    
    // Extract token from various possible response formats
    let token: string | undefined;
    
    if (response.token) {
      token = response.token;
    } else if (response.access_token) {
      token = response.access_token;
    } else if (response.bearerToken) {
      token = response.bearerToken;
    } else if (response.authToken) {
      token = response.authToken;
    } else if (response.data?.token) {
      token = response.data.token;
    } else if (response.data?.access_token) {
      token = response.data.access_token;
    }
    
    if (token) {
      console.log('Token found in response, saving to localStorage');
      setToken(token);
      
      // Verify the token was set properly
      setTimeout(() => {
        const storedToken = getToken();
        console.log('Token in localStorage after login:', storedToken ? 'present' : 'missing');
      }, 100);
    } else {
      console.warn('No token found in login response. Response structure:', Object.keys(response));
      
      // If we receive an object with a single property that could be a token, try using that
      if (typeof response === 'object' && response !== null) {
        const keys = Object.keys(response);
        if (keys.length === 1 && typeof response[keys[0]] === 'string') {
          const possibleToken = response[keys[0]];
          console.log(`Using ${keys[0]} as token:`, possibleToken);
          setToken(possibleToken);
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (data: RegisterData): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/register', data);
    
    console.log('Register response received:', JSON.stringify(response, null, 2));
    
    // Extract token from various possible response formats
    let token: string | undefined;
    
    if (response.token) {
      token = response.token;
    } else if (response.access_token) {
      token = response.access_token;
    } else if (response.bearerToken) {
      token = response.bearerToken;
    } else if (response.authToken) {
      token = response.authToken;
    } else if (response.data?.token) {
      token = response.data.token;
    } else if (response.data?.access_token) {
      token = response.data.access_token;
    }
    
    if (token) {
      console.log('Token found in response, saving to localStorage');
      setToken(token);
      
      // Verify the token was set properly
      setTimeout(() => {
        const storedToken = getToken();
        console.log('Token in localStorage after registration:', storedToken ? 'present' : 'missing');
      }, 100);
    } else {
      console.warn('No token found in registration response. Response structure:', Object.keys(response));
      
      // If we receive an object with a single property that could be a token, try using that
      if (typeof response === 'object' && response !== null) {
        const keys = Object.keys(response);
        if (keys.length === 1 && typeof response[keys[0]] === 'string') {
          const possibleToken = response[keys[0]];
          console.log(`Using ${keys[0]} as token:`, possibleToken);
          setToken(possibleToken);
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/users/logout', {}, { requiresAuth: true });
    
    // Remove auth token
    removeToken();
    
    // Clear all user data from localStorage
    console.log('Clearing all user data from localStorage during logout');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_id');
      
      // Clear any additional user-related cache items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('user') || key.includes('token') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      
      // Remove identified keys
      keysToRemove.forEach(key => {
        console.log(`Removing localStorage item: ${key}`);
        localStorage.removeItem(key);
      });
      
      // Clear API cache for user-related endpoints
      try {
        // Clear common user-related endpoints directly
        clearCache('/users/me');
        clearCache('/users/');
        clearCache('/user');
        clearCache('user');
        clearCache('profile');
        console.log('AuthUtils: Cleared user-related API cache during logout');
      } catch (cacheErr) {
        console.error('AuthUtils: Failed to clear user API cache:', cacheErr);
      }
    }
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still remove all user data even if the API call fails
    removeToken();
    
    // Clear user data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_id');
      
      // Also try to clear API cache even if API call failed
      try {
        // Clear common user-related endpoints directly
        clearCache('/users/me');
        clearCache('/users/');
        clearCache('/user');
        clearCache('user');
        clearCache('profile');
        console.log('AuthUtils: Cleared user-related API cache during logout (after API error)');
      } catch (cacheErr) {
        console.error('AuthUtils: Failed to clear user API cache:', cacheErr);
      }
    }
  }
};

export const checkAuth = async (): Promise<boolean> => {
  try {
    const token = getToken();
    if (!token) return false;
    
    await api.get('/users/me', { requiresAuth: true });
    return true;
  } catch (error) {
    removeToken();
    return false;
  }
};