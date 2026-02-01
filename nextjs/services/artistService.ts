import { api } from '../utils/api';
import { ArtistType as IArtist } from '../models/artist.interface';

export const artistService = {
  // Get all artists (public access)
  getAll: async (): Promise<IArtist[]> => {
    return api.post<IArtist[]>('/artists', {}, {
      headers: { 'X-Account-Type': 'artist' } 
    });
  },

  // Get artist by ID or slug (public access, but sends auth if available for block filtering)
  getById: async (idOrSlug: number | string, options?: { useCache?: boolean }): Promise<IArtist> => {
    const response = await api.get<{ artist: IArtist }>(`/artists/${idOrSlug}`, {
      useCache: options?.useCache ?? true,
      requiresAuth: true, // Send token if available to filter blocked artists
    });
    return response.artist;
  },

  // Lookup artist by username or email (validates they exist)
  lookupByIdentifier: async (identifier: string): Promise<{ artist: { id: number; name: string; username: string; slug?: string; image?: any } }> => {
    return api.post('/artists/lookup', { username: identifier }, {
      requiresAuth: true,
    });
  },

  // Search artists with pagination (public access, but sends auth if available for block filtering)
  search: async (params: Record<string, any>): Promise<{
    response: IArtist[];
    unclaimed_studios?: any[];
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
  }> => {
    // Use POST with params in request body
    return api.post('/artists', params, {
      headers: { 'X-Account-Type': 'artist' },
      useCache: false, // Don't cache paginated requests
      requiresAuth: false,
    });
  },

  // Get artist's portfolio (public access)
  getPortfolio: async (artistIdOrSlug: number | string): Promise<any[]> => {
    return api.get<any[]>(`/artists/${artistIdOrSlug}/portfolio`);
  },
  
  // Get artist's working hours/availability (public access)
  getWorkingHours: async (artistIdOrSlug: number | string): Promise<any[]> => {
    return api.get<any[]>(`/artists/${artistIdOrSlug}/working-hours`);
  },

  // Update artist profile (requires auth)
  updateProfile: async (idOrSlug: number | string, data: Partial<IArtist>): Promise<IArtist> => {
    return api.put<IArtist>(`/artists/${idOrSlug}`, data, { requiresAuth: true });
  },
  
  // Set artist working hours (requires auth)
  setWorkingHours: async (artistId: number | string, workingHours: any[]): Promise<any> => {
    return api.post<any>(`/artists/${artistId}/working-hours`, { availability: workingHours }, {
      requiresAuth: true
    });
  },

  // Get pending studio invitations for the current artist (requires auth)
  getStudioInvitations: async (): Promise<any[]> => {
    const response = await api.get<{ invitations: any[] }>('/artists/me/studio-invitations', {
      requiresAuth: true,
    });
    return response.invitations || [];
  },

  // Accept a studio invitation (requires auth)
  acceptStudioInvitation: async (studioId: number): Promise<{ success: boolean; message: string }> => {
    return api.post<{ success: boolean; message: string }>(
      `/artists/me/studio-invitations/${studioId}/accept`,
      {},
      { requiresAuth: true }
    );
  },

  // Decline a studio invitation (requires auth)
  declineStudioInvitation: async (studioId: number): Promise<{ success: boolean; message: string }> => {
    return api.post<{ success: boolean; message: string }>(
      `/artists/me/studio-invitations/${studioId}/decline`,
      {},
      { requiresAuth: true }
    );
  },

  // Leave/remove studio affiliation (requires auth)
  leaveStudio: async (studioId: number): Promise<{ success: boolean; message: string }> => {
    return api.delete<{ success: boolean; message: string }>(
      `/artists/me/studio/${studioId}`,
      { requiresAuth: true }
    );
  },

  // Set a studio as primary (requires auth)
  setPrimaryStudio: async (studioId: number): Promise<{ success: boolean; message: string }> => {
    return api.post<{ success: boolean; message: string }>(
      `/artists/me/studio/${studioId}/primary`,
      {},
      { requiresAuth: true }
    );
  },

  // Get artist settings (public - for booking info display)
  getSettings: async (artistId: number | string): Promise<{ data: any }> => {
    return api.get(`/artists/${artistId}/settings`, { useCache: false });
  },

  // Update artist settings (requires auth)
  updateSettings: async (artistId: number | string, settings: Record<string, any>): Promise<any> => {
    return api.put(`/artists/${artistId}/settings`, settings, { requiresAuth: true });
  },

  // Get artist by slug with full data including tattoos (public)
  getBySlug: async (slug: string): Promise<{ artist: IArtist & { tattoos?: any[] } }> => {
    return api.get(`/artists/${slug}`, { useCache: false });
  },

  // Get dashboard stats for an artist (requires auth)
  getDashboardStats: async (artistId: number | string): Promise<any> => {
    return api.get(`/artists/${artistId}/dashboard-stats`, { requiresAuth: true });
  },

  // Get upcoming schedule for an artist (requires auth)
  getUpcomingSchedule: async (artistId: number | string): Promise<any[]> => {
    return api.get(`/artists/${artistId}/upcoming-schedule`, { requiresAuth: true });
  },
};