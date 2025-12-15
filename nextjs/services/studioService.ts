import { api } from '../utils/api';
import { StudioType, IStudio } from '../models/studio.interface';
import { getToken } from '../utils/auth';

export const studioService = {
  // Get all studios (public access)
  getAll: async (): Promise<StudioType[]> => {
    return api.get<StudioType[]>('/studios');
  },

  // Get studio by ID or slug (public access)
  getById: async (idOrSlug: number | string): Promise<{ studio: StudioType }> => {
    return api.get<{ studio: StudioType }>(`/studios/${idOrSlug}`);
  },

  // Search studios (public access)
  search: async (params?: Record<string, any>): Promise<StudioType[]> => {
    const hasAuthToken = !!getToken();
    return api.post<StudioType[]>('/studios', params || {}, {
      headers: { 'X-Account-Type': 'studio' },
      requiresAuth: hasAuthToken,
      useCache: true,
      cacheTTL: 5 * 60 * 1000 // 5 minute cache
    });
  },

  // Get studio's artists (public access)
  getArtists: async (studioIdOrSlug: number | string): Promise<any[]> => {
    return api.get<any[]>(`/studios/${studioIdOrSlug}/artists`);
  },

  // Get studio's gallery/tattoos (public access)
  getGallery: async (studioIdOrSlug: number | string): Promise<any[]> => {
    return api.get<any[]>(`/studios/${studioIdOrSlug}/gallery`);
  },

  // Get studio's reviews (public access)
  getReviews: async (studioIdOrSlug: number | string): Promise<any> => {
    return api.get<any>(`/studios/${studioIdOrSlug}/reviews`);
  },

  // Get studio's opportunities (public access)
  getOpportunities: async (studioIdOrSlug: number | string): Promise<any[]> => {
    return api.get<any[]>(`/studios/${studioIdOrSlug}/opportunities`);
  },

  // Get studio's hours (public access)
  getHours: async (studioIdOrSlug: number | string): Promise<any[]> => {
    return api.get<any[]>(`/studios/${studioIdOrSlug}/hours`);
  },

  // Create a new studio (requires auth)
  create: async (data: Partial<StudioType>): Promise<StudioType> => {
    return api.post<StudioType>('/studios', data, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Update a studio (requires auth)
  update: async (idOrSlug: number | string, data: Partial<StudioType>): Promise<StudioType> => {
    return api.put<StudioType>(`/studios/${idOrSlug}`, data, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Update studio business hours (requires auth)
  updateHours: async (idOrSlug: number | string, data: any): Promise<any> => {
    return api.put<any>(`/studios/${idOrSlug}/hours`, data, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Create/update opportunity (requires auth)
  createOpportunity: async (studioIdOrSlug: number | string, data: any): Promise<any> => {
    return api.post<any>(`/studios/${studioIdOrSlug}/opportunities`, data, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Delete opportunity (requires auth)
  deleteOpportunity: async (studioIdOrSlug: number | string, opportunityId: number): Promise<void> => {
    return api.delete<void>(`/studios/${studioIdOrSlug}/opportunities/${opportunityId}`, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Delete a studio (requires auth)
  delete: async (idOrSlug: number | string): Promise<void> => {
    return api.delete<void>(`/studios/${idOrSlug}`, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  }
};
