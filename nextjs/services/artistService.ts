import { api } from '../utils/api';
import { ArtistType as IArtist } from '../models/artist.interface';

export const artistService = {
  // Get all artists (public access)
  getAll: async (): Promise<IArtist[]> => {
    return api.post<IArtist[]>('/artists', {}, {
      headers: { 'X-Account-Type': 'artist' } 
    });
  },

  // Get artist by ID or slug (public access)
  getById: async (idOrSlug: number | string): Promise<IArtist> => {
    return api.get<IArtist>(`/artists/${idOrSlug}`);
  },

  // Search artists (public access)
  search: async (params: Record<string, any>): Promise<IArtist[]> => {
    // Use POST with params in request body
    return api.post<IArtist[]>('/artists', params, {
      headers: { 'X-Account-Type': 'artist' }
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
  }
};