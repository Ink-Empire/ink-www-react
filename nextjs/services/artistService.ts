import { api } from '../utils/api';
import { ArtistType as IArtist } from '../models/artist.interface';

export const artistService = {
  // Get all artists
  getAll: async (): Promise<IArtist[]> => {
    return api.post<IArtist[]>('/artists', {}, {
      headers: { 'X-Account-Type': 'artist' } 
    });
  },

  // Get artist by ID
  getById: async (id: number | string): Promise<IArtist> => {
    return api.get<IArtist>(`/artists/${id}`);
  },

  // Search artists
  search: async (params: Record<string, any>): Promise<IArtist[]> => {
    // Convert params object to URL query string
    const queryString = new URLSearchParams(params).toString();
    return api.get<IArtist[]>(`/artists/search?${queryString}`, {
      headers: { 'X-Account-Type': 'artist' }
    });
  },

  // Get artist's portfolio (tattoos)
  getPortfolio: async (artistId: number | string): Promise<any[]> => {
    return api.get<any[]>(`/artists/${artistId}/tattoos`);
  },

  // Update artist profile (requires auth)
  updateProfile: async (id: number | string, data: Partial<IArtist>): Promise<IArtist> => {
    return api.put<IArtist>(`/artists/${id}`, data, { requiresAuth: true });
  }
};