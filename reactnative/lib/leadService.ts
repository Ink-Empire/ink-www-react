import { api } from './api';

interface LeadData {
  timing: string;
  style_ids?: number[];
  tag_ids?: number[];
  custom_themes?: string[];
  description?: string;
  allow_artist_contact?: boolean;
}

export const leadService = {
  create: (data: LeadData) =>
    api.post('/leads', data, { requiresAuth: true }),
};
