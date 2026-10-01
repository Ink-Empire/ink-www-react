import type { ApiClient } from '@inkedin/shared';

// The upload is a signed POST rather than a PUT. S3 checks the file against
// the policy in `fields` before storing it, which is what bounds the size, so
// the fields have to be posted alongside the file exactly as they arrive.
interface PresignedUpload {
  upload_url: string;
  fields: Record<string, string>;
  filename: string;
  public_url: string;
}

interface PresignedUrlsResponse {
  success: boolean;
  data: {
    uploads: PresignedUpload[];
    max_bytes: number;
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
  // Byte count from the picker, when it gave one. Used to fail an oversized
  // image with a readable message before it is sent. S3 enforces the real
  // limit either way, so this being missing is not a hole.
  size?: number;
}

export type UploadProgress = {
  total: number;
  completed: number;
  current: string;
  status: 'idle' | 'getting-urls' | 'uploading' | 'confirming' | 'complete' | 'error';
  error?: string;
};

function formatBytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

// S3 answers a policy violation with an XML body naming the condition that
// failed. EntityTooLarge means the file was over content-length-range, which
// is the only check the picker cannot always make for us.
async function uploadErrorMessage(
  response: Response,
  filename: string,
  maxBytes: number,
): Promise<string> {
  let body = '';

  try {
    body = await response.text();
  } catch {
    // Body already consumed or unreadable; fall through to the generic message
  }

  if (body.includes('EntityTooLarge')) {
    const limit = maxBytes > 0 ? ` (${formatBytes(maxBytes)} limit)` : '';
    return `${filename} is too large to upload${limit}.`;
  }

  return `Failed to upload ${filename}: ${response.statusText}`;
}

// The presign endpoint only accepts image/jpeg, image/png, image/webp and
// image/gif, so anything else has to be mapped to one of them or the request
// is rejected outright.
//
// This relabels the header, it does not transcode. A HEIC file sent through
// here would reach S3 with bytes that do not match its declared type, which
// breaks anything downstream that trusts the header — OpenAI's vision API
// among them. Conversion happens at the picker instead: every openPicker,
// openCamera and openCropper call passes forceJpg, which makes iOS hand back
// a real JPEG. This mapping is the last resort for an unexpected type, not
// the HEIC strategy.
function normalizeContentType(type: string): string {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(type)) return type;
  if (type === 'image/jpg') return 'image/jpeg';
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
    // Step 1: Get signed upload forms (batched in groups of 10 to respect API limit)
    updateProgress({ status: 'getting-urls', current: 'Getting upload URLs...' });

    const PRESIGN_BATCH_SIZE = 10;
    const uploads: PresignedUpload[] = [];
    let maxBytes = 0;

    for (let i = 0; i < files.length; i += PRESIGN_BATCH_SIZE) {
      const batch = files.slice(i, i + PRESIGN_BATCH_SIZE);
      const filesData = batch.map(file => ({
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

      uploads.push(...presignedResponse.data.uploads);
      maxBytes = presignedResponse.data.max_bytes ?? maxBytes;
    }

    // Step 2: Check sizes against the server's limit before sending anything.
    // S3 enforces the same number from the signed policy, so this is only here
    // to name the file and the limit instead of showing a bare S3 rejection.
    if (maxBytes > 0) {
      const oversized = files.filter(file => file.size !== undefined && file.size > maxBytes);

      if (oversized.length > 0) {
        const names = oversized.map(file => file.name).join(', ');
        throw new Error(
          `${names} is larger than the ${formatBytes(maxBytes)} limit. Try a smaller image.`,
        );
      }
    }

    // Step 3: Upload each file directly to S3 in parallel
    updateProgress({ status: 'uploading', completed: 0, current: 'Uploading images...' });

    const uploadPromises = files.map(async (file, index) => {
      const { upload_url, fields, filename } = uploads[index];
      const contentType = normalizeContentType(file.type || 'image/jpeg');

      // The policy fields have to come before the file in the form, and the
      // file has to be last, or S3 rejects the POST. Passing the file by uri
      // lets React Native stream it rather than hold it all in memory.
      const form = new FormData();
      Object.entries(fields).forEach(([key, value]) => form.append(key, value));
      form.append('file', {
        uri: file.uri,
        type: contentType,
        name: file.name,
      } as unknown as Blob);

      const response = await fetch(upload_url, { method: 'POST', body: form });

      if (!response.ok) {
        throw new Error(await uploadErrorMessage(response, file.name, maxBytes));
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
    updateProgress({ status: 'confirming', current: 'Saving...' });

    const allImages: ConfirmUploadsResponse['data']['images'] = [];

    for (let i = 0; i < filenames.length; i += PRESIGN_BATCH_SIZE) {
      const batch = filenames.slice(i, i + PRESIGN_BATCH_SIZE);

      const confirmResponse = await api.post<ConfirmUploadsResponse>(
        '/uploads/confirm',
        { filenames: batch },
        { requiresAuth: true },
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
