import { api } from './api';
import { clearCache } from './apiCache';

// Token management
export const getToken = (source: string = 'unknown'): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return localStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error reading token from localStorage:', error);
    return null;
  }
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error setting token in localStorage:', error);
  }
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

// Cleaned up auth utilities - complex auth logic moved to AuthContext