import { api } from './api';
import { compressImage } from './compressImage';

// Matches the presign endpoint's validation. Exported so file inputs can use
// the same list for their accept attribute rather than image/*, which lets a
// browser offer HEIC that the upload will then refuse.
export const ACCEPTED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const ACCEPTED_UPLOAD_ACCEPT_ATTR =
  'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif';

interface PresignedUrlResponse {
  success: boolean;
  data: {
    upload_url: string;
    filename: string;
    public_url: string;
    expires_in: number;
  };
}

interface PresignedUrlsResponse {
  success: boolean;
  data: {
    uploads: Array<{
      upload_url: string;
      filename: string;
      public_url: string;
    }>;
    expires_in: number;
  };
}

interface ConfirmUploadsResponse {
  success: boolean;
  data: {
    images: Array<{
      id: number;
      filename: string;
      uri: string;
    }>;
    count: number;
  };
}

export interface UploadedImage {
  id: number;
  filename: string;
  uri: string;
  localPreview?: string; // For UI display before upload completes
}

export type UploadProgress = {
  total: number;
  completed: number;
  current: string;
  status: 'idle' | 'getting-urls' | 'uploading' | 'confirming' | 'complete' | 'error';
  error?: string;
};

/**
 * Upload multiple images directly to S3 using presigned URLs.
 * This bypasses the server for much faster uploads.
 */
export async function uploadImagesToS3(
  files: File[],
  purpose: 'tattoo' | 'profile' | 'studio' | 'message' = 'tattoo',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedImage[]> {
  if (files.length === 0) {
    throw new Error('No files to upload');
  }

  const updateProgress = (update: Partial<UploadProgress>) => {
    if (onProgress) {
      onProgress({
        total: files.length,
        completed: 0,
        current: '',
        status: 'idle',
        ...update,
      });
    }
  };

  try {
    // Step 1: Compress images before requesting presigned URLs
    updateProgress({ status: 'getting-urls', current: 'Preparing images...' });

    const maxDimension = purpose === 'profile' ? 512 : 2048;
    const compressedFiles = await Promise.all(
      files.map(file => compressImage(file, {
        maxWidth: maxDimension,
        maxHeight: maxDimension,
        quality: 0.85,
      }))
    );

    // The presign endpoint only accepts these four, and answers anything else
    // with a validation error that does not say which file was at fault.
    // Checked here so the person is told the filename and what to do about it.
    //
    // HEIC is the case this exists for: an iPhone photo arrives at a file
    // input as image/heic, and compressImage cannot re-encode it because most
    // browsers will not decode HEIC at all.
    const unsupported = compressedFiles.filter(
      file => !ACCEPTED_UPLOAD_TYPES.includes(file.type)
    );

    if (unsupported.length > 0) {
      const names = unsupported.map(file => file.name).join(', ');
      const isHeic = unsupported.some(file => /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name));

      throw new Error(
        isHeic
          ? `${names} is in HEIC format, which cannot be uploaded. On iPhone, set Camera > Formats to "Most Compatible", or save the photo as JPEG first.`
          : `${names} is not a supported image. Use a JPEG, PNG, WebP or GIF.`
      );
    }

    // Step 2: Get presigned URLs (batched in groups of 10 to respect API limit)
    const PRESIGN_BATCH_SIZE = 10;
    const uploads: PresignedUrlsResponse['data']['uploads'] = [];

    for (let i = 0; i < compressedFiles.length; i += PRESIGN_BATCH_SIZE) {
      const batch = compressedFiles.slice(i, i + PRESIGN_BATCH_SIZE);
      const filesData = batch.map(file => ({
        content_type: file.type || 'image/jpeg',
      }));

      const presignedResponse = await api.post<PresignedUrlsResponse>(
        '/uploads/presign-batch',
        { files: filesData, purpose },
        { requiresAuth: true }
      );

      if (!presignedResponse.success || !presignedResponse.data?.uploads) {
        throw new Error('Failed to get upload URLs');
      }

      uploads.push(...presignedResponse.data.uploads);
    }

    // Step 3: Upload each file directly to S3 in parallel
    updateProgress({ status: 'uploading', completed: 0, current: 'Uploading images...' });

    const uploadPromises = compressedFiles.map(async (file, index) => {
      const { upload_url, filename } = uploads[index];

      const response = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'image/jpeg',
          'Cache-Control': 'max-age=31536000',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}: ${response.statusText}`);
      }

      updateProgress({
        status: 'uploading',
        completed: index + 1,
        current: `Uploaded ${index + 1} of ${files.length}`,
      });

      return filename;
    });

    const filenames = await Promise.all(uploadPromises);

    // Step 4: Confirm uploads and create Image records (batched in groups of 10)
    updateProgress({ status: 'confirming', current: 'Confirming uploads...' });

    const allImages: ConfirmUploadsResponse['data']['images'] = [];

    for (let i = 0; i < filenames.length; i += PRESIGN_BATCH_SIZE) {
      const batch = filenames.slice(i, i + PRESIGN_BATCH_SIZE);

      const confirmResponse = await api.post<ConfirmUploadsResponse>(
        '/uploads/confirm',
        { filenames: batch },
        { requiresAuth: true }
      );

      if (!confirmResponse.success || !confirmResponse.data?.images) {
        throw new Error('Failed to confirm uploads');
      }

      allImages.push(...confirmResponse.data.images);
    }

    updateProgress({ status: 'complete', completed: files.length, current: 'Upload complete!' });

    return allImages;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    updateProgress({ status: 'error', error: errorMessage });
    throw error;
  }
}

/**
 * Upload a single image to S3 using a presigned URL.
 */
export async function uploadImageToS3(
  file: File,
  purpose: 'tattoo' | 'profile' | 'studio' | 'message' = 'tattoo',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedImage> {
  const images = await uploadImagesToS3([file], purpose, onProgress);
  return images[0];
}
