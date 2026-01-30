import { api } from '../utils/api';

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  token?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    [key: string]: any;
  };
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  type?: 'artist' | 'user';
}

export interface ResetPasswordData {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    return api.post('/login', credentials);
  },

  // Logout user
  logout: async (): Promise<void> => {
    return api.post('/logout', {});
  },

  // Register new user
  register: async (data: RegisterData): Promise<LoginResponse> => {
    return api.post('/register', data);
  },

  // Get current user
  getCurrentUser: async (): Promise<any> => {
    return api.get('/users/me', { useCache: false });
  },

  // Request password reset email
  forgotPassword: async (email: string): Promise<void> => {
    return api.post('/forgot-password', { email });
  },

  // Reset password with token
  resetPassword: async (data: ResetPasswordData): Promise<void> => {
    return api.post('/reset-password', data);
  },

  // Resend email verification
  resendVerification: async (email: string): Promise<void> => {
    return api.post('/email/resend', { email });
  },
};
