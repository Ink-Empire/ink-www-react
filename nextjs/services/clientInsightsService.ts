import { api } from '../utils/api';

export interface ClientListItem {
  id: number;
  name: string;
  email: string;
  sessions: number;
  next_appointment: string | null;
  tag_count: number;
  last_seen: string | null;
}

export const clientInsightsService = {
  getClients: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.get<{ clients: ClientListItem[] }>(`/clients${query}`, {
      requiresAuth: true,
      useCache: false,
    });
  },

  getProfile: (clientId: number) =>
    api.get<{ profile: any }>(`/clients/${clientId}/profile`, {
      requiresAuth: true,
      useCache: false,
    }),

  getTagCategories: () =>
    api.get<{ categories: any[] }>('/tag-categories', { requiresAuth: true }),

  addTag: (clientId: number, tagCategoryId: number, label: string) =>
    api.post<{ tag: any }>(`/clients/${clientId}/tags`, {
      tag_category_id: tagCategoryId,
      label,
    }, { requiresAuth: true }),

  removeTag: (clientId: number, tagId: number) =>
    api.delete(`/clients/${clientId}/tags/${tagId}`, { requiresAuth: true }),

  getTagSuggestions: (clientId: number, categoryId: number, q: string) => {
    const params = `?category_id=${categoryId}&q=${encodeURIComponent(q)}`;
    return api.get<string[]>(`/clients/${clientId}/tags/suggestions${params}`, {
      requiresAuth: true,
    });
  },

  addNote: (clientId: number, body: string) =>
    api.post<{ note: any }>(`/clients/${clientId}/notes`, { body }, { requiresAuth: true }),

  updateNote: (clientId: number, noteId: number, body: string) =>
    api.put<{ note: any }>(`/clients/${clientId}/notes/${noteId}`, { body }, { requiresAuth: true }),
};
