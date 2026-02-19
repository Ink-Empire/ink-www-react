import type { ApiClient } from '../api';
import type { Tag } from '../types';

export interface AiTagSuggestion {
  id: number | null;
  name: string;
  slug?: string;
  is_ai_suggested?: boolean;
  is_new_suggestion?: boolean;
}

export function createTagService(api: ApiClient) {
  return {
    suggest: (imageUrls: string[]) =>
      api.post<{ success: boolean; data: AiTagSuggestion[] }>(
        '/tags/suggest',
        { image_urls: imageUrls },
        { requiresAuth: true },
      ),

    createFromAi: (name: string) =>
      api.post<{ success: boolean; data: Tag }>(
        '/tags/create-from-ai',
        { name },
        { requiresAuth: true },
      ),

    create: (name: string) =>
      api.post<{ success: boolean; data: Tag }>(
        '/tags',
        { name },
        { requiresAuth: true },
      ),
  };
}
