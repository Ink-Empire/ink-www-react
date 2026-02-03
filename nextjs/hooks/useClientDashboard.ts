import { useState, useEffect, useCallback } from 'react';
import { clientService } from '@/services/clientService';
import { ApiConversation } from './useConversations';

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
  slug: string;
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

interface ClientDashboardResponse {
  appointments: DashboardAppointment[];
  conversations: ApiConversation[];
  favorites: WishlistArtist[];
  wishlist_count: number;
  suggested_artists: SuggestedArtist[];
}

interface UseClientDashboardReturn {
  appointments: DashboardAppointment[];
  conversations: ApiConversation[];
  favorites: WishlistArtist[];
  wishlistCount: number;
  suggestedArtists: SuggestedArtist[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useClientDashboard(): UseClientDashboardReturn {
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [favorites, setFavorites] = useState<WishlistArtist[]>([]);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [suggestedArtists, setSuggestedArtists] = useState<SuggestedArtist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await clientService.getDashboard();

      setAppointments(response.appointments || []);
      setConversations(response.conversations || []);
      setFavorites(response.favorites || []);
      setWishlistCount(response.wishlist_count || 0);
      setSuggestedArtists(response.suggested_artists || []);
    } catch (err) {
      console.error('Error fetching client dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  return {
    appointments,
    conversations,
    favorites,
    wishlistCount,
    suggestedArtists,
    loading,
    error,
    refresh,
  };
}

interface UseWishlistReturn {
  wishlist: WishlistArtist[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addToWishlist: (artistId: number, notifyBookingOpen?: boolean) => Promise<boolean>;
  removeFromWishlist: (artistId: number) => Promise<boolean>;
  updateNotification: (artistId: number, notifyBookingOpen: boolean) => Promise<boolean>;
}

export function useWishlist(): UseWishlistReturn {
  const [wishlist, setWishlist] = useState<WishlistArtist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Call /client/favorites which queries users_artists table (bookmarked artists)
      const response = await clientService.getFavorites();

      setWishlist(response.favorites || []);
    } catch (err) {
      console.error('[useWishlist] Error fetching favorites:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = useCallback(async (artistId: number, notifyBookingOpen: boolean = true): Promise<boolean> => {
    try {
      await clientService.addFavorite(artistId);

      await fetchWishlist();
      return true;
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      return false;
    }
  }, [fetchWishlist]);

  const removeFromWishlist = useCallback(async (artistId: number): Promise<boolean> => {
    try {
      await clientService.removeFavorite(artistId);

      setWishlist((prev) => prev.filter((artist) => artist.id !== artistId));
      return true;
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      return false;
    }
  }, []);

  const updateNotification = useCallback(async (artistId: number, notifyBookingOpen: boolean): Promise<boolean> => {
    try {
      await clientService.updateWishlistNotification(artistId, notifyBookingOpen);

      setWishlist((prev) =>
        prev.map((artist) =>
          artist.id === artistId
            ? { ...artist, notify_booking_open: notifyBookingOpen }
            : artist
        )
      );
      return true;
    } catch (err) {
      console.error('Error updating wishlist notification:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, []);

  return {
    wishlist,
    loading,
    error,
    refresh,
    addToWishlist,
    removeFromWishlist,
    updateNotification,
  };
}

interface UseSuggestedArtistsReturn {
  artists: SuggestedArtist[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSuggestedArtists(limit: number = 6): UseSuggestedArtistsReturn {
  const [artists, setArtists] = useState<SuggestedArtist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await clientService.getSuggestedArtists(limit);

      setArtists(response.artists || []);
    } catch (err) {
      console.error('Error fetching suggested artists:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch suggested artists');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const refresh = useCallback(async () => {
    await fetchArtists();
  }, [fetchArtists]);

  useEffect(() => {
    fetchArtists();
  }, []);

  return {
    artists,
    loading,
    error,
    refresh,
  };
}
