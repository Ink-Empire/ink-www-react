import { api } from '../utils/api';
import { IStudio } from '../models/studio.interface';
import { getToken } from '../utils/auth';

export const studioService = {
  // Get all studios (public access)
  getAll: async (): Promise<IStudio[]> => {
    return api.get<IStudio[]>('/studios');
  },

  // Get studio by ID (public access)
  getById: async (id: number | string): Promise<IStudio> => {
    return api.get<IStudio>(`/studios/studio/${id}`);
  },

  // Search studios (public access)
  search: async (params: Record<string, any>): Promise<IStudio[]> => {
    const hasAuthToken = !!getToken();
    // Use POST request with body params to match other services
    return api.post<IStudio[]>('/studios', params, {
      headers: { 'X-Account-Type': 'studio' },
      requiresAuth: hasAuthToken // Only include token if user is logged in
    });
  },

  // Get studio's artists (public access)
  getArtists: async (studioId: number | string): Promise<any[]> => {
    return api.get<any[]>(`/studios/${studioId}`);
  },

  // Create a new studio (requires auth)
  create: async (data: Partial<IStudio>): Promise<IStudio> => {
    return api.post<IStudio>('/studios', data, { 
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Update a studio (requires auth)
  update: async (id: number | string, data: Partial<IStudio>): Promise<IStudio> => {
    return api.put<IStudio>(`/studios/studio/${id}`, data, { 
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },
  
  // Update studio business hours (requires auth)
  updateBusinessHours: async (id: number | string, data: any): Promise<any> => {
    return api.put<any>(`/studios/studio-hours/${id}`, data, { 
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Delete a studio (requires auth)
  delete: async (id: number | string): Promise<void> => {
    return api.delete<void>(`/studios/studio/${id}`, { 
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  }
};