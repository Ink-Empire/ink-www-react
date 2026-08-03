import { api } from '../utils/api';
import { clearCache } from '../utils/apiCache';

export interface DashboardAppointment {
  id: number;
  title: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  type: string;
  description: string | null;
  artist: {
    id: number;
    name: string | null;
    username: string;
    image: { id: number; uri: string } | null;
  };
  studio: {
    id: number;
    name: string;
  } | null;
}

export interface SuggestedArtist {
  id: number;
  name: string | null;
  username: string;
  image: { id: number; uri: string } | null;
  studio: { id: number; name: string } | null;
  styles: { id: number; name: string }[];
  books_open: boolean;
  is_demo?: boolean;
}

export interface WishlistArtist extends SuggestedArtist {
  notify_booking_open: boolean;
  notified_at: string | null;
  added_at: string;
}

export interface ClientDashboardResponse {
  appointments: DashboardAppointment[];
  conversations: any[];
  wishlist_count: number;
  suggested_artists: SuggestedArtist[];
}

export const clientService = {
  // Get client dashboard data (requires auth)
  getDashboard: async (): Promise<ClientDashboardResponse> => {
    return api.get('/client/dashboard', {
      requiresAuth: true,
      useCache: false,
    });
  },

  // Get client's favorite artists (requires auth)
  getFavorites: async (): Promise<{ favorites: WishlistArtist[] }> => {
    return api.get('/client/favorites', {
      requiresAuth: true,
      useCache: false,
    });
  },

  // Get client's saved tattoos (requires auth)
  getSavedTattoos: async (): Promise<{ tattoos: any[] }> => {
    return api.get('/client/saved-tattoos', {
      requiresAuth: true,
    });
  },

  // Get client's saved studios (requires auth)
  getSavedStudios: async (): Promise<{ studios: any[] }> => {
    return api.get('/client/saved-studios', {
      requiresAuth: true,
    });
  },

  // Get suggested artists for client (requires auth)
  getSuggestedArtists: async (limit: number = 6): Promise<{ artists: SuggestedArtist[] }> => {
    return api.get(`/client/suggested-artists?limit=${limit}`, {
      requiresAuth: true,
      useCache: false,
    });
  },

  // Add artist to favorites (requires auth)
  addFavorite: async (artistId: number): Promise<void> => {
    const result = await api.post('/users/favorites/artist', {
      ids: artistId,
      action: 'add'
    }, { requiresAuth: true });
    clearCache('/client/saved-');
    clearCache('/client/favorites');
    return result;
  },

  // Remove artist from favorites (requires auth)
  removeFavorite: async (artistId: number): Promise<void> => {
    const result = await api.post('/users/favorites/artist', {
      ids: artistId,
      action: 'remove'
    }, { requiresAuth: true });
    clearCache('/client/saved-');
    clearCache('/client/favorites');
    return result;
  },

  // Update wishlist notification preference (requires auth)
  updateWishlistNotification: async (artistId: number, notifyBookingOpen: boolean): Promise<void> => {
    return api.put(`/client/wishlist/${artistId}`, {
      notify_booking_open: notifyBookingOpen,
    }, { requiresAuth: true });
  },
};
