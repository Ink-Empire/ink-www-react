// Service factories - create services with an API client instance
// Services provide a cleaner interface for common API operations

import type { ApiClient } from '../api';
import type { Artist, Tattoo, Studio, Style, SearchFilters, User } from '../types';

// =============================================================================
// Artist Service
// =============================================================================

export function createArtistService(api: ApiClient) {
  return {
    search: (params?: SearchFilters) =>
      api.post<Artist[]>('/artists', params || {}, {
        headers: { 'X-Account-Type': 'artist' },
      }),

    getById: (idOrSlug: string | number) =>
      api.get<{ artist: Artist }>(`/artists/${idOrSlug}`),

    getPortfolio: (idOrSlug: string | number) =>
      api.get<Tattoo[]>(`/artists/${idOrSlug}/portfolio`),

    update: (id: number, data: Partial<Artist>) =>
      api.put<{ artist: Artist }>(`/artists/${id}`, data, { requiresAuth: true }),

    updateSettings: (artistId: number, settings: Partial<Artist['settings']>) =>
      api.put(`/artists/${artistId}/settings`, settings, { requiresAuth: true }),
  };
}

// =============================================================================
// Tattoo Service
// =============================================================================

export function createTattooService(api: ApiClient) {
  return {
    search: (params?: SearchFilters) =>
      api.post<Tattoo[]>('/tattoos', params || {}),

    getById: (id: string | number) =>
      api.get<{ tattoo: Tattoo }>(`/tattoos/${id}`),

    create: (data: Partial<Tattoo>) =>
      api.post<{ tattoo: Tattoo }>('/tattoos', data, { requiresAuth: true }),

    update: (id: number, data: Partial<Tattoo>) =>
      api.put<{ tattoo: Tattoo }>(`/tattoos/${id}`, data, { requiresAuth: true }),

    delete: (id: number) =>
      api.delete(`/tattoos/${id}`, { requiresAuth: true }),
  };
}

// =============================================================================
// Studio Service
// =============================================================================

export function createStudioService(api: ApiClient) {
  return {
    search: (params?: SearchFilters) =>
      api.post<Studio[]>('/studios', params || {}),

    getById: (idOrSlug: string | number) =>
      api.get<{ studio: Studio }>(`/studios/${idOrSlug}`),

    create: (data: Partial<Studio>) =>
      api.post<{ studio: Studio }>('/studios', data, { requiresAuth: true }),

    update: (id: number, data: Partial<Studio>) =>
      api.put<{ studio: Studio }>(`/studios/${id}`, data, { requiresAuth: true }),

    getArtists: (idOrSlug: string | number) =>
      api.get<Artist[]>(`/studios/${idOrSlug}/artists`),

    getGallery: (idOrSlug: string | number) =>
      api.get<Tattoo[]>(`/studios/${idOrSlug}/gallery`),
  };
}

// =============================================================================
// Style Service
// =============================================================================

export function createStyleService(api: ApiClient) {
  return {
    getAll: () => api.get<Style[]>('/styles'),
  };
}

// =============================================================================
// User Service
// =============================================================================

export function createUserService(api: ApiClient) {
  return {
    getMe: () =>
      api.get<User>('/users/me', { requiresAuth: true }),

    update: (id: number, data: Partial<User>) =>
      api.put<{ user: User }>(`/users/${id}`, data, { requiresAuth: true }),

    updateStyles: (userId: number, styleIds: number[]) =>
      api.put(`/users/${userId}/styles`, { styles: styleIds }, { requiresAuth: true }),

    toggleFavorite: (type: 'artist' | 'tattoo' | 'studio', id: number, action: 'add' | 'remove') =>
      api.post(`/users/favorites/${type}`, { ids: id, action }, { requiresAuth: true }),
  };
}

// =============================================================================
// Export types
// =============================================================================

export type ArtistService = ReturnType<typeof createArtistService>;
export type TattooService = ReturnType<typeof createTattooService>;
export type StudioService = ReturnType<typeof createStudioService>;
export type StyleService = ReturnType<typeof createStyleService>;
export type UserService = ReturnType<typeof createUserService>;
