import { uploadImageToS3, UploadedImage } from '@/utils/s3Upload';
import { userService } from './userService';
import { studioService } from './studioService';
import { artistService } from './artistService';

export type ImagePurpose = 'tattoo' | 'profile' | 'studio' | 'message';

/**
 * Centralized service for image uploads.
 *
 * Use these methods instead of calling uploadImageToS3 directly to ensure
 * consistent handling of upload + association patterns.
 */
export const imageService = {
  /**
   * Upload an image to S3 without associating it with any entity.
   * Use this when you need to upload now but associate later (e.g., pending studio data).
   *
   * @returns The uploaded image with id, filename, and uri
   */
  upload: async (file: File, purpose: ImagePurpose): Promise<UploadedImage> => {
    return uploadImageToS3(file, purpose);
  },

  /**
   * Upload a profile photo and associate it with the current user.
   * Handles the full flow: S3 upload -> API association.
   *
   * @returns The uploaded image with id, filename, and uri
   */
  uploadProfilePhoto: async (file: File): Promise<UploadedImage> => {
    const uploaded = await uploadImageToS3(file, 'profile');
    await userService.uploadProfilePhoto({ image_id: uploaded.id });
    return uploaded;
  },

  /**
   * Upload a studio image and associate it with the specified studio.
   * Handles the full flow: S3 upload -> API association.
   *
   * @param file - The image file to upload
   * @param studioId - The studio ID to associate the image with
   * @returns The uploaded image with id, filename, and uri
   */
  uploadStudioImage: async (file: File, studioId: number): Promise<UploadedImage> => {
    const uploaded = await uploadImageToS3(file, 'studio');
    await studioService.uploadImage(studioId, uploaded.id);
    return uploaded;
  },

  /**
   * Upload a watermark image and associate it with the artist's settings.
   * Handles the full flow: S3 upload -> API association via artist settings.
   *
   * @param file - The watermark image file
   * @param artistId - The artist ID to associate the watermark with
   * @returns The uploaded image with id, filename, and uri
   */
  uploadWatermark: async (file: File, artistId: number): Promise<UploadedImage> => {
    const uploaded = await uploadImageToS3(file, 'profile');
    await artistService.updateSettings(artistId, { watermark_image_id: uploaded.id });
    return uploaded;
  },
};
