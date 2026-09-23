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
  has_accepted_toc: boolean;
  has_accepted_privacy_policy: boolean;
}

export interface ResetPasswordData {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface CorrectEmailData {
  email: string;
  password: string;
  new_email: string;
}

export interface CorrectEmailResponse {
  message: string;
  verification: {
    email: string;
    requires_verification: boolean;
  };
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

  // Send verification notification (for re-sending verification email)
  sendVerificationNotification: async (email: string): Promise<void> => {
    return api.post('/email/verification-notification', { email });
  },

  // Fix an address mistyped at registration and get a fresh verification link.
  // Unauthenticated: an unverified account cannot reach anything behind auth,
  // so the old address and password are the credential.
  correctEmail: async (data: CorrectEmailData): Promise<CorrectEmailResponse> => {
    return api.post('/email/correct', data);
  },
};
