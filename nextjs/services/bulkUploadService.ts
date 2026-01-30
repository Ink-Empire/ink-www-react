import { api } from '../utils/api';

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
  title: string | null;
  description: string | null;
  placement_id: number | null;
  primary_style_id: number | null;
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

export const bulkUploadService = {
  // List all bulk uploads for the current user (requires auth)
  list: async (): Promise<BulkUpload[]> => {
    const response = await api.get<{ data: BulkUpload[] }>('/bulk-uploads', {
      requiresAuth: true,
      useCache: false,
    });
    return response.data;
  },

  // Get a single bulk upload (requires auth)
  getById: async (id: number): Promise<BulkUpload> => {
    const response = await api.get<{ data: BulkUpload }>(`/bulk-uploads/${id}`, {
      requiresAuth: true,
      useCache: false,
    });
    return response.data;
  },

  // Delete a bulk upload (requires auth)
  delete: async (id: number): Promise<void> => {
    return api.delete(`/bulk-uploads/${id}`, { requiresAuth: true });
  },

  // Get items for a bulk upload (requires auth)
  getItems: async (
    uploadId: number,
    options: {
      filter?: 'all' | 'unprocessed' | 'processed' | 'ready' | 'published' | 'skipped';
      page?: number;
      perPage?: number;
      primaryOnly?: boolean;
    } = {}
  ): Promise<ItemsResponse> => {
    const params = new URLSearchParams();
    if (options.filter) params.append('filter', options.filter);
    if (options.page) params.append('page', options.page.toString());
    if (options.perPage) params.append('per_page', options.perPage.toString());
    if (options.primaryOnly !== undefined) params.append('primary_only', options.primaryOnly ? '1' : '0');

    return api.get(`/bulk-uploads/${uploadId}/items?${params.toString()}`, {
      requiresAuth: true,
      useCache: false,
    });
  },

  // Update a single item (requires auth)
  updateItem: async (
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
    const response = await api.put<{ data: BulkUploadItem }>(
      `/bulk-uploads/${uploadId}/items/${itemId}`,
      data,
      { requiresAuth: true }
    );
    return response.data;
  },

  // Batch update items (requires auth)
  batchUpdateItems: async (
    uploadId: number,
    itemIds: number[],
    updates: {
      placement_id?: number | null;
      primary_style_id?: number | null;
      is_skipped?: boolean;
    }
  ): Promise<{ count: number }> => {
    return api.put(
      `/bulk-uploads/${uploadId}/items`,
      { item_ids: itemIds, updates },
      { requiresAuth: true }
    );
  },

  // Process next batch (requires auth)
  processBatch: async (uploadId: number, batchSize: number = 200): Promise<{ message: string; remaining: number }> => {
    return api.post(
      `/bulk-uploads/${uploadId}/process-batch`,
      { batch_size: batchSize },
      { requiresAuth: true }
    );
  },

  // Process specific range (requires auth)
  processRange: async (uploadId: number, from: number, to: number): Promise<{ message: string }> => {
    return api.post(
      `/bulk-uploads/${uploadId}/process-range`,
      { from, to },
      { requiresAuth: true }
    );
  },

  // Publish ready items (requires auth)
  publish: async (uploadId: number): Promise<{ message: string; count: number }> => {
    return api.post(`/bulk-uploads/${uploadId}/publish`, {}, { requiresAuth: true });
  },

  // Get publish status (requires auth)
  getPublishStatus: async (uploadId: number): Promise<{
    status: string;
    total_images: number;
    cataloged_images: number;
    processed_images: number;
    published_images: number;
    ready_to_publish: number;
  }> => {
    return api.get(`/bulk-uploads/${uploadId}/publish-status`, {
      requiresAuth: true,
      useCache: false,
    });
  },
};
