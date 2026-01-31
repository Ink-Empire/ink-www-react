import { api } from '../utils/api';

export interface CreateLeadData {
  budget_min?: number;
  budget_max?: number;
  timing?: string;
  size?: string;
  placement?: string;
  style_ids?: number[];
  description?: string;
  allow_artist_contact?: boolean;
  tag_ids?: number[];
  custom_themes?: string[];
}

export interface WishlistItem {
  id: number;
  artist_id?: number;
  studio_id?: number;
  notify_booking_open?: boolean;
}

export const leadService = {
  // Get lead status for current client (requires auth)
  getStatus: async (): Promise<{ has_lead: boolean; is_active: boolean; artists_notified: number }> => {
    return api.get('/leads/status', { requiresAuth: true });
  },

  // Create a new lead (requires auth)
  create: async (data: CreateLeadData): Promise<any> => {
    return api.post('/leads', data, { requiresAuth: true });
  },

  // Update lead (requires auth)
  update: async (data: Partial<CreateLeadData> & { is_active?: boolean }): Promise<any> => {
    return api.put('/leads', data, { requiresAuth: true });
  },

  // Deactivate lead (requires auth)
  deactivate: async (): Promise<any> => {
    return api.put('/leads', { is_active: false }, { requiresAuth: true });
  },

  // Get leads for artists (requires auth - artist only)
  getForArtists: async (): Promise<{ leads: any[] }> => {
    return api.get('/leads/for-artists', { requiresAuth: true });
  },

  // Get client's wishlist (requires auth)
  getWishlist: async (): Promise<{ wishlist: WishlistItem[] }> => {
    return api.get('/client/wishlist', { requiresAuth: true, useCache: false });
  },

  // Add to wishlist (requires auth)
  addToWishlist: async (data: { artist_id?: number; studio_id?: number; notify_booking_open?: boolean }): Promise<any> => {
    return api.post('/client/wishlist', data, { requiresAuth: true });
  },

  // Remove from wishlist (requires auth)
  removeFromWishlist: async (artistId: number): Promise<any> => {
    return api.delete(`/client/wishlist/${artistId}`, { requiresAuth: true });
  },
};
