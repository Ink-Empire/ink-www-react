import { api } from '../utils/api';
import { TattooType } from '../models/tattoo.interface';
import { getToken } from '../utils/auth';

export const tattooService = {
  // Get all tattoos
  getAll: async (): Promise<TattooType[]> => {
    const hasAuthToken = !!getToken();
    return api.post<TattooType[]>('/tattoos', {}, {
      headers: { 'X-Account-Type': 'user' },
      requiresAuth: hasAuthToken // Only include token if user is logged in
    });
  },

  // Get tattoo by ID
  getById: async (id: number | string): Promise<TattooType> => {
    const hasAuthToken = !!getToken();
    const response = await api.get<{ tattoo: TattooType }>(`/tattoos/${id}`, {
      headers: { 'X-Account-Type': 'user' },
      requiresAuth: hasAuthToken // Only include token if user is logged in
    });
    return response.tattoo;
  },

  // Search tattoos
  search: async (params: Record<string, any>): Promise<TattooType[]> => {
    const hasAuthToken = !!getToken();
    // Use POST with params in request body
    return api.post<TattooType[]>('/tattoos', params, {
      headers: { 'X-Account-Type': 'user' },
      requiresAuth: hasAuthToken // Only include token if user is logged in
    });
  },

  // Get tattoos by artist ID
  getByArtist: async (artistId: number | string): Promise<TattooType[]> => {
    const hasAuthToken = !!getToken();
    return api.post<TattooType[]>('/tattoos', { artist_id: artistId }, {
      headers: { 'X-Account-Type': 'user' },
      requiresAuth: hasAuthToken // Only include token if user is logged in
    });
  },

  // Create a new tattoo (requires auth)
  create: async (data: Partial<TattooType>): Promise<TattooType> => {
    return api.post<TattooType>('/tattoos', data, { 
      requiresAuth: true, // Always require auth for creates
      headers: { 'X-Account-Type': 'user' }
    });
  },

  // Update an existing tattoo (requires auth)
  update: async (id: number | string, data: Partial<TattooType>): Promise<TattooType> => {
    return api.put<TattooType>(`/tattoos/${id}`, data, { 
      requiresAuth: true, // Always require auth for updates
      headers: { 'X-Account-Type': 'user' }
    });
  },

  // Delete a tattoo (requires auth)
  delete: async (id: number | string): Promise<void> => {
    return api.delete<void>(`/tattoos/${id}`, {
      requiresAuth: true, // Always require auth for deletes
      headers: { 'X-Account-Type': 'user' }
    });
  },

  // Toggle featured status for a tattoo (requires auth)
  toggleFeatured: async (id: number | string): Promise<any> => {
    return api.put(`/tattoos/${id}/featured`, {}, { requiresAuth: true });
  },

  // Add tags to a tattoo (requires auth)
  addTags: async (id: number | string, tags: string[]): Promise<any> => {
    return api.post(`/tattoos/${id}/tags/add`, { tags }, { requiresAuth: true });
  },

  // Remove tags from a tattoo (requires auth)
  removeTags: async (id: number | string, tagIds: number[]): Promise<any> => {
    return api.post(`/tattoos/${id}/tags/remove`, { tag_ids: tagIds }, { requiresAuth: true });
  },

  // Get tattoo with full details including tags (public access)
  getWithTags: async (id: number | string): Promise<TattooType & { tags: any[] }> => {
    const hasAuthToken = !!getToken();
    const response = await api.get<{ tattoo: TattooType & { tags: any[] } }>(`/tattoos/${id}`, {
      headers: { 'X-Account-Type': 'user' },
      requiresAuth: hasAuthToken
    });
    return response.tattoo;
  },
};