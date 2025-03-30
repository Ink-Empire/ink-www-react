import { api } from '../utils/api';
import { ITattoo } from '../models/tattoo.interface';

export const tattooService = {
  // Get all tattoos
  getAll: async (): Promise<ITattoo[]> => {
    return api.get<ITattoo[]>('/tattoos');
  },

  // Get tattoo by ID
  getById: async (id: number | string): Promise<ITattoo> => {
    return api.get<ITattoo>(`/tattoos/${id}`);
  },

  // Search tattoos
  search: async (params: Record<string, any>): Promise<ITattoo[]> => {
    // Convert params object to URL query string
    const queryString = new URLSearchParams(params).toString();
    return api.get<ITattoo[]>(`/tattoos/search?${queryString}`);
  },

  // Create a new tattoo (requires auth)
  create: async (data: Partial<ITattoo>): Promise<ITattoo> => {
    return api.post<ITattoo>('/tattoos', data, { requiresAuth: true });
  },

  // Update an existing tattoo (requires auth)
  update: async (id: number | string, data: Partial<ITattoo>): Promise<ITattoo> => {
    return api.put<ITattoo>(`/tattoos/${id}`, data, { requiresAuth: true });
  },

  // Delete a tattoo (requires auth)
  delete: async (id: number | string): Promise<void> => {
    return api.delete<void>(`/tattoos/${id}`, { requiresAuth: true });
  }
};