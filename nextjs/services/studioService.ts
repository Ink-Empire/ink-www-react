import { api } from '../utils/api';
import { IStudio } from '../models/studio.interface';

export const studioService = {
  // Get all studios
  getAll: async (): Promise<IStudio[]> => {
    return api.get<IStudio[]>('/shops');
  },

  // Get studio by ID
  getById: async (id: number | string): Promise<IStudio> => {
    return api.get<IStudio>(`/shops/${id}`);
  },

  // Search studios
  search: async (params: Record<string, any>): Promise<IStudio[]> => {
    // Convert params object to URL query string
    const queryString = new URLSearchParams(params).toString();
    return api.get<IStudio[]>(`/shops/search?${queryString}`);
  },

  // Get studio's artists
  getArtists: async (studioId: number | string): Promise<any[]> => {
    return api.get<any[]>(`/shops/${studioId}/artists`);
  },

  // Create a new studio (requires auth)
  create: async (data: Partial<IStudio>): Promise<IStudio> => {
    return api.post<IStudio>('/shops', data, { requiresAuth: true });
  },

  // Update a studio (requires auth)
  update: async (id: number | string, data: Partial<IStudio>): Promise<IStudio> => {
    return api.put<IStudio>(`/shops/${id}`, data, { requiresAuth: true });
  },

  // Delete a studio (requires auth)
  delete: async (id: number | string): Promise<void> => {
    return api.delete<void>(`/shops/${id}`, { requiresAuth: true });
  }
};