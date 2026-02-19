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
} from '@inkedin/shared/services';

export const artistService = createArtistService(api);
export const tattooService = createTattooService(api);
export const studioService = createStudioService(api);
export const styleService = createStyleService(api);
export const userService = createUserService(api);
export const messageService = createMessageService(api);
export const appointmentService = createAppointmentService(api);
export const tagService = createTagService(api);
