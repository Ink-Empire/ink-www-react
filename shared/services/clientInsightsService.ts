import type { ApiClient } from '../api/client';
import type {
  ClientProfile,
  UserTagCategory,
  UserTag,
  ClientNote,
} from '../types';

export function createClientInsightsService(api: ApiClient) {
  return {
    getProfile: (clientId: number) =>
      api.get<{ profile: ClientProfile }>(`/clients/${clientId}/profile`, { requiresAuth: true, useCache: false }),

    getTagCategories: () =>
      api.get<{ categories: UserTagCategory[] }>('/tag-categories', { requiresAuth: true }),

    createTagCategory: (name: string, color: string) =>
      api.post<{ category: UserTagCategory }>('/tag-categories', { name, color }, { requiresAuth: true }),

    addTag: (clientId: number, tagCategoryId: number, label: string) =>
      api.post<{ tag: UserTag }>(`/clients/${clientId}/tags`, { tag_category_id: tagCategoryId, label }, { requiresAuth: true }),

    removeTag: (clientId: number, tagId: number) =>
      api.delete(`/clients/${clientId}/tags/${tagId}`, { requiresAuth: true }),

    getTagSuggestions: (clientId: number, categoryId: number, q: string) =>
      api.get<string[]>(`/clients/${clientId}/tags/suggestions`, {
        params: { category_id: categoryId, q },
        requiresAuth: true,
      }),

    addNote: (clientId: number, body: string) =>
      api.post<{ note: ClientNote }>(`/clients/${clientId}/notes`, { body }, { requiresAuth: true }),

    updateNote: (clientId: number, noteId: number, body: string) =>
      api.put<{ note: ClientNote }>(`/clients/${clientId}/notes/${noteId}`, { body }, { requiresAuth: true }),
  };
}

export type ClientInsightsService = ReturnType<typeof createClientInsightsService>;
