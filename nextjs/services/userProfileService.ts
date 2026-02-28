import { api } from '../utils/api';

export interface UserProfile {
  id: number;
  name: string;
  slug: string;
  username?: string;
  about?: string;
  location?: string;
  image?: { id: number; uri: string } | null;
  uploaded_tattoo_count: number;
  social_media_links?: { platform: string; username: string; url: string }[];
  created_at?: string;
}

export const userProfileService = {
  getProfile: async (slug: string): Promise<{ user: UserProfile }> => {
    return api.get(`/users/${slug}/profile`);
  },

  getTattoos: async (slug: string, params?: { page?: number; per_page?: number }): Promise<{
    tattoos: any[];
    total: number;
    page: number;
    per_page: number;
    last_page: number;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.per_page) queryParams.set('per_page', String(params.per_page));
    const query = queryParams.toString();
    return api.get(`/users/${slug}/tattoos${query ? `?${query}` : ''}`);
  },
};
