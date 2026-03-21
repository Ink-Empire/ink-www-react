import { api } from './api';
import {
  createArtistService,
  createTattooService,
  createStudioService,
  createStyleService,
  createUserService,
  createMessageService,
  createAppointmentService,
  createTagService,
  createClientService,
  createUserProfileService,
  createBulkUploadService,
  createClientInsightsService,
} from '@inkedin/shared/services';
import type { ImageEditParams } from '@inkedin/shared/types';

export const artistService = createArtistService(api);
export const tattooService = createTattooService(api);
export const studioService = createStudioService(api);
export const styleService = createStyleService(api);
export const userService = createUserService(api);
export const messageService = createMessageService(api);
export const appointmentService = createAppointmentService(api);
export const tagService = createTagService(api);
export const clientService = createClientService(api);
export const userProfileService = createUserProfileService(api);
export const bulkUploadService = createBulkUploadService(api);
export const clientInsightsService = createClientInsightsService(api);

export const imageService = {
  updateEditParams: async (imageId: number, editParams: ImageEditParams) => {
    const result = await api.put(`/images/${imageId}/edit-params`, editParams, { requiresAuth: true });
    // Clear all cached GET responses so tattoo detail/list pages fetch fresh data
    api.clearCache();
    return result;
  },
};
