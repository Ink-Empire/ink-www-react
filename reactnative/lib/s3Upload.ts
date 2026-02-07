import type { ApiClient } from '@inkedin/shared';

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
}

export interface ImageFile {
  uri: string;
  type: string;
  name: string;
}

export type UploadProgress = {
  total: number;
  completed: number;
  current: string;
  status: 'idle' | 'getting-urls' | 'uploading' | 'confirming' | 'complete' | 'error';
  error?: string;
};

function normalizeContentType(type: string): string {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(type)) return type;
  if (type === 'image/jpg') return 'image/jpeg';
  // iOS HEIC/HEIF photos default to jpeg
  return 'image/jpeg';
}

export async function uploadImagesToS3(
  api: ApiClient,
  files: ImageFile[],
  purpose: 'tattoo' | 'profile' | 'studio' | 'message' = 'tattoo',
  onProgress?: (progress: UploadProgress) => void,
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
    // Step 1: Get presigned URLs
    updateProgress({ status: 'getting-urls', current: 'Getting upload URLs...' });

    const filesData = files.map(file => ({
      content_type: normalizeContentType(file.type || 'image/jpeg'),
    }));

    const presignedResponse = await api.post<PresignedUrlsResponse>(
      '/uploads/presign-batch',
      { files: filesData, purpose },
      { requiresAuth: true },
    );

    if (!presignedResponse.success || !presignedResponse.data?.uploads) {
      throw new Error('Failed to get upload URLs');
    }

    const uploads = presignedResponse.data.uploads;

    // Step 2: Upload each file directly to S3 in parallel
    updateProgress({ status: 'uploading', completed: 0, current: 'Uploading images...' });

    const uploadPromises = files.map(async (file, index) => {
      const { upload_url, filename } = uploads[index];
      const contentType = normalizeContentType(file.type || 'image/jpeg');

      // React Native fetch supports file URIs natively
      const response = await fetch(upload_url, {
        method: 'PUT',
        body: {
          uri: file.uri,
          type: contentType,
          name: file.name || filename,
        } as any,
        headers: {
          'Content-Type': contentType,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to upload image ${index + 1}: ${response.statusText}`);
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
    updateProgress({ status: 'confirming', current: 'Saving...' });

    const confirmResponse = await api.post<ConfirmUploadsResponse>(
      '/uploads/confirm',
      { filenames },
      { requiresAuth: true },
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
