import { api } from '../utils/api';

export interface UpdateProfileData {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  location?: string;
  about?: string;
}

export interface ChangePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export const userService = {
  // Get current user profile (requires auth)
  getMe: async (): Promise<any> => {
    return api.get('/users/me', { useCache: false, requiresAuth: true });
  },

  // Update user profile (requires auth)
  update: async (userId: number, data: UpdateProfileData): Promise<any> => {
    return api.put(`/users/${userId}`, data, { requiresAuth: true });
  },

  // Change password (requires auth)
  changePassword: async (data: ChangePasswordData): Promise<any> => {
    return api.put('/users/password', data, { requiresAuth: true });
  },

  // Upload profile photo (requires auth)
  uploadProfilePhoto: async (data: { image_id: number } | FormData): Promise<any> => {
    return api.post('/users/profile-photo', data, { requiresAuth: true });
  },

  // Block a user (requires auth)
  block: async (userId: number): Promise<any> => {
    return api.post('/users/block', { user_id: userId }, { requiresAuth: true });
  },

  // Unblock a user (requires auth)
  unblock: async (userId: number): Promise<any> => {
    return api.post('/users/unblock', { user_id: userId }, { requiresAuth: true });
  },

  // Toggle favorite (requires auth)
  toggleFavorite: async (type: 'artist' | 'tattoo' | 'studio', id: number, action: 'add' | 'remove'): Promise<any> => {
    return api.post(`/users/favorites/${type}`, { id, action }, { requiresAuth: true });
  },

  // Get user's favorites (requires auth)
  getFavorites: async (type?: 'artist' | 'tattoo' | 'studio'): Promise<any> => {
    const endpoint = type ? `/users/favorites/${type}` : '/users/favorites';
    return api.get(endpoint, { requiresAuth: true });
  },

  // Get user by ID (public for artists, requires auth for full profile)
  getById: async (userId: number): Promise<any> => {
    return api.get(`/users/${userId}`);
  },
};
