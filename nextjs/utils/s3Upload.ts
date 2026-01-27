import { api } from './api';

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
    // Step 1: Get presigned URLs for all files
    updateProgress({ status: 'getting-urls', current: 'Getting upload URLs...' });

    const filesData = files.map(file => ({
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

    const uploads = presignedResponse.data.uploads;

    // Step 2: Upload each file directly to S3 in parallel
    updateProgress({ status: 'uploading', completed: 0, current: 'Uploading images...' });

    const uploadPromises = files.map(async (file, index) => {
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

    // Step 3: Confirm uploads and create Image records
    updateProgress({ status: 'confirming', current: 'Confirming uploads...' });

    const confirmResponse = await api.post<ConfirmUploadsResponse>(
      '/uploads/confirm',
      { filenames },
      { requiresAuth: true }
    );

    if (!confirmResponse.success || !confirmResponse.data?.images) {
      throw new Error('Failed to confirm uploads');
    }

    updateProgress({ status: 'complete', completed: files.length, current: 'Upload complete!' });

    return confirmResponse.data.images;

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
