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

  // Search artists (public access, but sends auth if available for block filtering)
  search: async (params: Record<string, any>): Promise<IArtist[]> => {
    // Use POST with params in request body
    return api.post<IArtist[]>('/artists', params, {
      headers: { 'X-Account-Type': 'artist' },
      requiresAuth: true, // Send token if available to filter blocked artists
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
    return api.put<IArtist>(`/artist/${idOrSlug}`, data, { requiresAuth: true });
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
};