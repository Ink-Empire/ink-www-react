import { api } from '../utils/api';

export interface Style {
  id: number;
  name: string;
  description?: string;
}

export const stylesService = {
  // Get all tattoo styles (public, cached)
  getAll: async (): Promise<{ styles: Style[] }> => {
    return api.get('/styles', {
      useCache: true,
      cacheTTL: 24 * 60 * 60 * 1000 // 24 hours TTL (styles rarely change)
    });
  },

  // Get a single style by ID
  getById: async (id: number): Promise<Style> => {
    return api.get(`/styles/${id}`);
  },
};
