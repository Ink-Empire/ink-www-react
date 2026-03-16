import { api } from '../utils/api';

export interface Style {
  id: number;
  name: string;
  description?: string;
}

export interface AiStyleSuggestion {
  id: number;
  name: string;
  is_ai_suggested?: boolean;
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

  // Get AI style suggestions for images
  suggestStyles: async (imageUrls: string[]): Promise<{ success: boolean; data: AiStyleSuggestion[] }> => {
    return api.post('/styles/suggest', { image_urls: imageUrls }, { requiresAuth: true });
  },
};
