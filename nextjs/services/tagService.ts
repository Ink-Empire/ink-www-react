import { api } from '../utils/api';

export interface AiTagSuggestion {
  id: number | null;
  name: string;
  slug?: string;
  is_ai_suggested?: boolean;
  is_new_suggestion?: boolean;
}

export const tagService = {
  // Get AI tag suggestions for images
  suggestTags: async (imageUrls: string[]): Promise<{ success: boolean; data: AiTagSuggestion[] }> => {
    return api.post('/tags/suggest', { image_urls: imageUrls }, { requiresAuth: true });
  },

  // Create a tag from an AI suggestion (user accepted it)
  createFromAi: async (name: string): Promise<{ success: boolean; data: { id: number; name: string } }> => {
    return api.post('/tags/create-from-ai', { name }, { requiresAuth: true });
  },

  // Create a user-submitted tag (pending approval)
  create: async (name: string): Promise<{ success: boolean; data: { id: number; name: string } }> => {
    return api.post('/tags', { name }, { requiresAuth: true });
  },
};
