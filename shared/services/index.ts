// Service factories - create services with an API client instance
// Services provide a cleaner interface for common API operations

import type { ApiClient } from '../api';
import type { Artist, Tattoo, Studio, Style, SearchFilters, User } from '../types';

export interface UpcomingAppointment {
  id: number;
  date: string; // YYYY-MM-DD
  day: number;
  month: string;
  time: string;
  title: string;
  clientName: string;
  clientInitials: string;
  type: 'consultation' | 'appointment' | string;
}

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

    getWorkingHours: (idOrSlug: string | number) =>
      api.get(`/artists/${idOrSlug}/working-hours`),

    update: (id: number, data: Partial<Artist>) =>
      api.put<{ artist: Artist }>(`/artists/${id}`, data, { requiresAuth: true }),

    updateSettings: (artistId: number, settings: Partial<Artist['settings']>) =>
      api.put(`/artists/${artistId}/settings`, settings, { requiresAuth: true }),

    lookupByIdentifier: (identifier: string) =>
      api.post<{ artist: { id: number; name: string; username: string; slug?: string; image?: any } }>(
        '/artists/lookup',
        { username: identifier },
        { requiresAuth: true },
      ),

    getDashboardStats: (id: number) =>
      api.get<{ data: { profile_views: number; saves_this_week: number; upcoming_appointments: number; unread_messages: number } }>(
        `/artists/${id}/dashboard-stats`,
        { requiresAuth: true },
      ),

    getUpcomingSchedule: (id: number) =>
      api.get<{ data: UpcomingAppointment[] }>(
        `/artists/${id}/upcoming-schedule`,
        { requiresAuth: true },
      ),
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

    claim: (id: number, data: Record<string, any>) =>
      api.post<{ studio: Studio }>(`/studios/${id}/claim`, data, { requiresAuth: true }),

    lookupOrCreate: (data: Record<string, any>) =>
      api.post<any>('/studios/lookup-or-create', data, { requiresAuth: true }),

    uploadImage: (studioId: number, imageId: number) =>
      api.post<any>(`/studios/${studioId}/image`, { image_id: imageId }, { requiresAuth: true }),
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

    uploadProfilePhoto: (imageId: number) =>
      api.post('/users/profile-photo', { image_id: imageId }, { requiresAuth: true }),

    deleteProfilePhoto: () =>
      api.delete('/users/profile-photo', { requiresAuth: true }),
  };
}

// =============================================================================
// Message Service
// =============================================================================

export { createMessageService } from './messageService';
export type { ConversationType, ConversationFilters } from './messageService';

// =============================================================================
// Notification Service
// =============================================================================

export { createNotificationService } from './notificationService';
export type { NotificationType, NotificationPreference, NotificationPreferencesResponse } from './notificationService';

// =============================================================================
// Google Places Service (REST API)
// =============================================================================

export { fetchPlacesApiKey, searchPlaces, getPlaceDetails } from './googlePlacesService';
export type { PlacePrediction, PlaceDetails } from './googlePlacesService';

// =============================================================================
// Export types
// =============================================================================

export type ArtistService = ReturnType<typeof createArtistService>;
export type TattooService = ReturnType<typeof createTattooService>;
export type StudioService = ReturnType<typeof createStudioService>;
export type StyleService = ReturnType<typeof createStyleService>;
export type UserService = ReturnType<typeof createUserService>;
export type MessageService = ReturnType<typeof createMessageService>;
export type NotificationService = ReturnType<typeof createNotificationService>;
