import { api } from '../utils/api';
import { StudioType, IStudio } from '../models/studio.interface';
import { getToken } from '../utils/auth';

export const studioService = {
  // Get all studios (public access)
  getAll: async (): Promise<StudioType[]> => {
    return api.get<StudioType[]>('/studios');
  },

  // Get studio by ID or slug (public access)
  getById: async (idOrSlug: number | string): Promise<{ studio: StudioType }> => {
    return api.get<{ studio: StudioType }>(`/studios/${idOrSlug}`);
  },

  // Search studios (public access)
  search: async (params?: Record<string, any>): Promise<StudioType[]> => {
    const hasAuthToken = !!getToken();
    return api.post<StudioType[]>('/studios', params || {}, {
      headers: { 'X-Account-Type': 'studio' },
      requiresAuth: hasAuthToken,
      useCache: true,
      cacheTTL: 5 * 60 * 1000 // 5 minute cache
    });
  },

  // Get studio's artists (public access)
  getArtists: async (studioIdOrSlug: number | string): Promise<any[]> => {
    const response = await api.get<any[] | { artists: any[] }>(`/studios/${studioIdOrSlug}/artists`);
    return (response as any).artists || response || [];
  },

  // Get studio's gallery/tattoos (public access)
  getGallery: async (studioIdOrSlug: number | string): Promise<any[]> => {
    // The page filters styles client side, so it needs the whole gallery
    // rather than the first page. Walk the pages until the server says there
    // are no more, with a ceiling so a large studio cannot stall the page.
    const perPage = 100;
    const maxPages = 5;
    const gallery: any[] = [];

    for (let page = 1; page <= maxPages; page++) {
      const response = await api.get<{ gallery: any[]; meta?: { has_more?: boolean } }>(
        `/studios/${studioIdOrSlug}/gallery?limit=${perPage}&page=${page}`
      );

      gallery.push(...(response.gallery || []));

      if (!response.meta?.has_more) break;
    }

    return gallery;
  },

  // Get studio's reviews (public access)
  getReviews: async (studioIdOrSlug: number | string): Promise<any> => {
    return api.get<any>(`/studios/${studioIdOrSlug}/reviews`);
  },

  // Get studio's opportunities (public access)
  getOpportunities: async (studioIdOrSlug: number | string): Promise<any[]> => {
    return api.get<any[]>(`/studios/${studioIdOrSlug}/opportunities`);
  },

  // Get studio's working hours (public access)
  getHours: async (studioIdOrSlug: number | string): Promise<any[]> => {
    return api.get<any[]>(`/studios/${studioIdOrSlug}/working-hours`);
  },

  // Create a new studio (requires auth)
  create: async (data: Partial<StudioType>): Promise<StudioType> => {
    return api.post<StudioType>('/studios', data, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Update a studio (requires auth)
  update: async (idOrSlug: number | string, data: Partial<StudioType>): Promise<StudioType> => {
    return api.put<StudioType>(`/studios/${idOrSlug}`, data, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Update studio business hours (requires auth)
  updateHours: async (idOrSlug: number | string, data: any): Promise<any> => {
    return api.put<any>(`/studios/${idOrSlug}/hours`, data, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Create/update opportunity (requires auth)
  createOpportunity: async (studioIdOrSlug: number | string, data: any): Promise<any> => {
    return api.post<any>(`/studios/${studioIdOrSlug}/opportunities`, data, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Delete opportunity (requires auth)
  deleteOpportunity: async (studioIdOrSlug: number | string, opportunityId: number): Promise<void> => {
    return api.delete<void>(`/studios/${studioIdOrSlug}/opportunities/${opportunityId}`, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Delete a studio (requires auth)
  delete: async (idOrSlug: number | string): Promise<void> => {
    return api.delete<void>(`/studios/${idOrSlug}`, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Claim an existing studio (requires auth)
  claim: async (studioId: number, data: Record<string, any>): Promise<any> => {
    return api.post(`/studios/${studioId}/claim`, data, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Update studio details via /studios/studio endpoint (requires auth)
  updateDetails: async (studioId: number, data: Record<string, any>): Promise<any> => {
    return api.put(`/studios/studio/${studioId}`, data, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Set studio working hours (requires auth)
  setWorkingHours: async (studioId: number, workingHours: any[]): Promise<any> => {
    return api.post(`/studios/${studioId}/working-hours`, { availability: workingHours }, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Remove artist from studio (requires auth)
  removeArtist: async (studioId: number, artistId: number): Promise<void> => {
    return api.delete(`/studios/${studioId}/artists/${artistId}`, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Verify an artist at a studio (requires auth)
  verifyArtist: async (studioId: number, artistId: number): Promise<any> => {
    return api.post(`/studios/${studioId}/artists/${artistId}/verify`, {}, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Unverify an artist at a studio (requires auth)
  unverifyArtist: async (studioId: number, artistId: number): Promise<any> => {
    return api.post(`/studios/${studioId}/artists/${artistId}/unverify`, {}, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Delete studio announcement (requires auth)
  deleteAnnouncement: async (studioId: number, announcementId: number): Promise<void> => {
    return api.delete(`/studios/${studioId}/announcements/${announcementId}`, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Upload studio image by image ID (requires auth)
  uploadImage: async (studioId: number, imageId: number): Promise<any> => {
    return api.post(`/studios/${studioId}/image`, { image_id: imageId }, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Upload studio image file directly (requires auth)
  uploadImageFile: async (studioId: number, formData: FormData): Promise<any> => {
    return api.post(`/studios/${studioId}/image`, formData, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Invite artist to studio (requires auth)
  inviteArtist: async (studioId: number, data: { email?: string; artist_id?: number }): Promise<any> => {
    return api.post(`/studios/${studioId}/artists/invite`, data, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Add artist to studio by username (requires auth)
  addArtist: async (studioId: number, username: string): Promise<any> => {
    return api.post(`/studios/${studioId}/artists`, { username }, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Create studio announcement (requires auth)
  createAnnouncement: async (studioId: number, data: { title: string; content: string }): Promise<any> => {
    return api.post(`/studios/${studioId}/announcements`, data, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Get studio announcements (public access)
  getAnnouncements: async (studioIdOrSlug: number | string): Promise<any[]> => {
    const response = await api.get<any[] | { announcements: any[] }>(`/studios/${studioIdOrSlug}/announcements`);
    return (response as any).announcements || response || [];
  },

  // Get studio dashboard stats (requires auth)
  getDashboardStats: async (studioId: number): Promise<any> => {
    return api.get(`/studios/${studioId}/dashboard-stats`, { requiresAuth: true, useCache: false });
  },

  // Invite studio owner to claim an unclaimed studio (requires auth)
  inviteStudioOwner: async (studioId: number, email: string): Promise<{ success: boolean; message: string }> => {
    return api.post(`/studios/${studioId}/invite`, { email }, {
      requiresAuth: true,
    });
  },

  // Get studio spotlights (public access)
  getSpotlights: async (studioIdOrSlug: number | string): Promise<any[]> => {
    const response = await api.get<any[] | { spotlights: any[] }>(`/studios/${studioIdOrSlug}/spotlights`);
    return (response as any).spotlights || response || [];
  },

  // Pin an artist or tattoo to the studio page (requires auth)
  addSpotlight: async (
    studioId: number,
    data: { type: 'artist' | 'tattoo'; item_id: number; display_order?: number },
  ): Promise<any> => {
    return api.post(`/studios/${studioId}/spotlights`, data, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Unpin a spotlight (requires auth)
  removeSpotlight: async (studioId: number, spotlightId: number): Promise<void> => {
    return api.delete(`/studios/${studioId}/spotlights/${spotlightId}`, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Guides a studio has published, such as aftercare (public access)
  getGuides: async (studioIdOrSlug: number | string): Promise<any[]> => {
    const response = await api.get<any[] | { guides: any[] }>(`/studios/${studioIdOrSlug}/guides`);
    return (response as any).guides || response || [];
  },

  // Publish a whole studio page edit in one transactional request (requires auth)
  publishPage: async (studioId: number, payload: Record<string, any>): Promise<any> => {
    return api.put(`/studios/${studioId}/page`, payload, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Set the studio page banner from an already-uploaded image (requires auth)
  uploadBanner: async (studioId: number, imageId: number): Promise<any> => {
    return api.post(`/studios/${studioId}/banner`, { image_id: imageId }, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Set the studio page banner by uploading a file (requires auth)
  uploadBannerFile: async (studioId: number, formData: FormData): Promise<any> => {
    return api.post(`/studios/${studioId}/banner`, formData, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Remove the studio page banner (requires auth)
  removeBanner: async (studioId: number): Promise<any> => {
    return api.delete(`/studios/${studioId}/banner`, {
      requiresAuth: true,
      headers: { 'X-Account-Type': 'studio' }
    });
  },

  // Get all studio dashboard data in one request (requires auth)
  // Returns: studio, artists, announcements, stats, working_hours
  getDashboard: async (studioId: number): Promise<{
    studio: any;
    artists: any[];
    announcements: any[];
    stats: any;
    working_hours: any[];
  }> => {
    return api.get(`/studios/${studioId}/dashboard`, { requiresAuth: true, useCache: false });
  },
};
