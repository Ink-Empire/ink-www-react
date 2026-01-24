import { useState, useCallback } from 'react';
import { api } from '@/utils/api';
import { getToken } from '@/utils/auth';

export interface BulkUpload {
  id: number;
  source: 'instagram' | 'manual';
  status: 'scanning' | 'cataloged' | 'processing' | 'ready' | 'completed' | 'failed';
  original_filename: string | null;
  total_images: number;
  cataloged_images: number;
  processed_images: number;
  published_images: number;
  unprocessed_count: number;
  ready_count: number;
  zip_size_bytes: number | null;
  zip_expires_at: string | null;
  is_expired: boolean;
  can_process: boolean;
  can_publish: boolean;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface BulkUploadItem {
  id: number;
  bulk_upload_id: number;
  post_group_id: string | null;
  is_primary_in_group: boolean;
  group_count: number;
  group_items?: Array<{
    id: number;
    thumbnail_url: string | null;
    is_primary: boolean;
  }>;
  is_cataloged: boolean;
  is_processed: boolean;
  is_published: boolean;
  is_skipped: boolean;
  is_edited: boolean;
  is_ready_for_publish: boolean;
  image_id: number | null;
  thumbnail_url: string | null;
  tattoo_id: number | null;
  zip_path: string;
  filename: string;
  file_size_bytes: number | null;
  original_caption: string | null;
  original_timestamp: string | null;
  title: string | null;
  description: string | null;
  placement_id: number | null;
  placement?: {
    id: number;
    name: string;
    slug: string;
  };
  primary_style_id: number | null;
  primary_style?: {
    id: number;
    name: string;
    slug: string;
  };
  additional_style_ids: number[];
  ai_suggested_tags: Array<{ id: number; name: string; slug: string }>;
  approved_tag_ids: number[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ItemsResponse {
  data: BulkUploadItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export function useBulkUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // List all bulk uploads for the current user
  const listUploads = useCallback(async (): Promise<BulkUpload[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: BulkUpload[] }>('/bulk-uploads', {
        requiresAuth: true,
        useCache: false,
      });
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to list uploads');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get a single bulk upload
  const getUpload = useCallback(async (id: number): Promise<BulkUpload> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: BulkUpload }>(`/bulk-uploads/${id}`, {
        requiresAuth: true,
        useCache: false, // Always fetch fresh data for status updates
      });
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get upload');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload a ZIP file with progress tracking
  const uploadZip = useCallback(async (
    file: File,
    source: 'instagram' | 'manual' = 'manual',
    onProgress?: (progress: number) => void
  ): Promise<BulkUpload> => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', source);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        setLoading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.data);
          } catch {
            const error = new Error('Invalid response from server');
            setError(error);
            reject(error);
          }
        } else {
          let errorMessage = 'Failed to upload ZIP';
          try {
            const response = JSON.parse(xhr.responseText);
            errorMessage = response.message || errorMessage;
          } catch {
            // Use default error message
          }
          const error = new Error(errorMessage);
          setError(error);
          reject(error);
        }
      };

      xhr.onerror = () => {
        setLoading(false);
        const error = new Error('Network error during upload');
        setError(error);
        reject(error);
      };

      // Call API directly to bypass Next.js proxy body size limit
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
      xhr.open('POST', `${apiUrl}/api/bulk-uploads`);
      // Don't send cookies when using Bearer token to avoid session/token conflicts
      xhr.withCredentials = false;

      // Add auth token
      const token = getToken('upload-zip');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send(formData);
    });
  }, []);

  // Delete a bulk upload
  const deleteUpload = useCallback(async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/bulk-uploads/${id}`, { requiresAuth: true });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete upload');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get items for a bulk upload
  const getItems = useCallback(async (
    uploadId: number,
    options: {
      filter?: 'all' | 'unprocessed' | 'processed' | 'ready' | 'published' | 'skipped';
      page?: number;
      perPage?: number;
      primaryOnly?: boolean;
    } = {}
  ): Promise<ItemsResponse> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options.filter) params.append('filter', options.filter);
      if (options.page) params.append('page', options.page.toString());
      if (options.perPage) params.append('per_page', options.perPage.toString());
      if (options.primaryOnly !== undefined) params.append('primary_only', options.primaryOnly ? '1' : '0');

      const response = await api.get<ItemsResponse>(
        `/bulk-uploads/${uploadId}/items?${params.toString()}`,
        { requiresAuth: true, useCache: false }
      );
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get items');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a single item
  const updateItem = useCallback(async (
    uploadId: number,
    itemId: number,
    data: {
      title?: string | null;
      description?: string | null;
      placement_id?: number | null;
      primary_style_id?: number | null;
      additional_style_ids?: number[];
      approved_tag_ids?: number[];
      is_skipped?: boolean;
      apply_to_group?: boolean;
    }
  ): Promise<BulkUploadItem> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put<{ data: BulkUploadItem }>(
        `/bulk-uploads/${uploadId}/items/${itemId}`,
        data,
        { requiresAuth: true }
      );
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update item');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Batch update items
  const batchUpdateItems = useCallback(async (
    uploadId: number,
    itemIds: number[],
    updates: {
      placement_id?: number | null;
      primary_style_id?: number | null;
      is_skipped?: boolean;
    }
  ): Promise<{ count: number }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put<{ count: number }>(
        `/bulk-uploads/${uploadId}/items`,
        { item_ids: itemIds, updates },
        { requiresAuth: true }
      );
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to batch update items');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Process next batch
  const processBatch = useCallback(async (
    uploadId: number,
    batchSize: number = 200
  ): Promise<{ message: string; remaining: number }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<{ message: string; remaining: number }>(
        `/bulk-uploads/${uploadId}/process-batch`,
        { batch_size: batchSize },
        { requiresAuth: true }
      );
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process batch');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Process specific range
  const processRange = useCallback(async (
    uploadId: number,
    from: number,
    to: number
  ): Promise<{ message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<{ message: string }>(
        `/bulk-uploads/${uploadId}/process-range`,
        { from, to },
        { requiresAuth: true }
      );
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process range');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Publish ready items
  const publish = useCallback(async (
    uploadId: number
  ): Promise<{ message: string; count: number }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<{ message: string; count: number }>(
        `/bulk-uploads/${uploadId}/publish`,
        {},
        { requiresAuth: true }
      );
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to publish');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get publish status
  const getPublishStatus = useCallback(async (uploadId: number): Promise<{
    status: string;
    total_images: number;
    cataloged_images: number;
    processed_images: number;
    published_images: number;
    ready_to_publish: number;
  }> => {
    try {
      const response = await api.get(`/bulk-uploads/${uploadId}/publish-status`, {
        requiresAuth: true,
        useCache: false,
      });
      return response as any;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get status');
      setError(error);
      throw error;
    }
  }, []);

  return {
    loading,
    error,
    listUploads,
    getUpload,
    uploadZip,
    deleteUpload,
    getItems,
    updateItem,
    batchUpdateItems,
    processBatch,
    processRange,
    publish,
    getPublishStatus,
  };
}
