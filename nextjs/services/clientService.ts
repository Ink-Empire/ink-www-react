import { api } from '../utils/api';

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

  // Get suggested artists for client (requires auth)
  getSuggestedArtists: async (limit: number = 6): Promise<{ artists: SuggestedArtist[] }> => {
    return api.get(`/client/suggested-artists?limit=${limit}`, {
      requiresAuth: true,
      useCache: false,
    });
  },

  // Add artist to favorites (requires auth)
  addFavorite: async (artistId: number): Promise<void> => {
    return api.post('/users/favorites/artist', {
      ids: artistId,
      action: 'add'
    }, { requiresAuth: true });
  },

  // Remove artist from favorites (requires auth)
  removeFavorite: async (artistId: number): Promise<void> => {
    return api.post('/users/favorites/artist', {
      ids: artistId,
      action: 'remove'
    }, { requiresAuth: true });
  },

  // Update wishlist notification preference (requires auth)
  updateWishlistNotification: async (artistId: number, notifyBookingOpen: boolean): Promise<void> => {
    return api.put(`/client/wishlist/${artistId}`, {
      notify_booking_open: notifyBookingOpen,
    }, { requiresAuth: true });
  },
};
