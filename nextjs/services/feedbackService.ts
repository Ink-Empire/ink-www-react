import { api } from '../utils/api';

export interface FeedbackData {
  email?: string;
  feedback: string;
  type?: 'bug' | 'feature' | 'general';
  page_url?: string;
  user_agent?: string;
}

export interface ReviewData {
  artist_id?: number;
  studio_id?: number;
  appointment_id?: number;
  rating: number;
  comment?: string;
}

export const feedbackService = {
  // Submit general feedback (public access, but can include email)
  submit: async (data: FeedbackData): Promise<{ success: boolean; message: string }> => {
    return api.post('/feedback', data);
  },

  // Submit a review for an artist (requires auth)
  submitArtistReview: async (artistId: number, data: Omit<ReviewData, 'artist_id'>): Promise<any> => {
    return api.post(`/artists/${artistId}/reviews`, data, { requiresAuth: true });
  },

  // Submit a review for a studio (requires auth)
  submitStudioReview: async (studioId: number, data: Omit<ReviewData, 'studio_id'>): Promise<any> => {
    return api.post(`/studios/${studioId}/reviews`, data, { requiresAuth: true });
  },

  // Get reviews for an artist (public access)
  getArtistReviews: async (artistIdOrSlug: number | string): Promise<any[]> => {
    const response = await api.get<any>(`/artists/${artistIdOrSlug}/reviews`);
    return response.reviews || response || [];
  },

  // Get reviews for a studio (public access)
  getStudioReviews: async (studioIdOrSlug: number | string): Promise<any> => {
    return api.get(`/studios/${studioIdOrSlug}/reviews`);
  },

  // Update a review (requires auth)
  updateReview: async (reviewId: number, data: Partial<ReviewData>): Promise<any> => {
    return api.put(`/reviews/${reviewId}`, data, { requiresAuth: true });
  },

  // Delete a review (requires auth)
  deleteReview: async (reviewId: number): Promise<void> => {
    return api.delete(`/reviews/${reviewId}`, { requiresAuth: true });
  },

  // Report a review (requires auth)
  reportReview: async (reviewId: number, reason: string): Promise<any> => {
    return api.post(`/reviews/${reviewId}/report`, { reason }, { requiresAuth: true });
  },
};
