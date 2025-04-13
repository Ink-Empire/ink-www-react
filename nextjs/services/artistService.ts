import { api } from '../utils/api';
import { ArtistType as IArtist } from '../models/artist.interface';

export const artistService = {
  // Get all artists
  getAll: async (): Promise<IArtist[]> => {
    return api.post<IArtist[]>('/artists', {}, {
      headers: { 'X-Account-Type': 'artist' } 
    });
  },

  // Get artist by ID or slug
  getById: async (idOrSlug: number | string): Promise<IArtist> => {
    return api.get<IArtist>(`/artists/${idOrSlug}`);
  },

  // Search artists
  search: async (params: Record<string, any>): Promise<IArtist[]> => {
    // Use POST with params in request body
    return api.post<IArtist[]>('/artists', params, {
      headers: { 'X-Account-Type': 'artist' }
    });
  },

  // Get artist's portfolio (tattoos)
  getPortfolio: async (artistIdOrSlug: number | string): Promise<any[]> => {
    return api.get<any[]>(`/artists/${artistIdOrSlug}/tattoos`);
  },

  // Update artist profile (requires auth)
  updateProfile: async (idOrSlug: number | string, data: Partial<IArtist>): Promise<IArtist> => {
    return api.put<IArtist>(`/artists/${idOrSlug}`, data, { requiresAuth: true });
  }
};