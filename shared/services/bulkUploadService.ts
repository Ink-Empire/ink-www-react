import type { ApiClient } from '../api';

export interface BulkUpload {
  id: number;
  source: 'instagram' | 'manual' | 'album';
  status: 'scanning' | 'cataloged' | 'processing' | 'ready' | 'completed' | 'failed' | 'deleting' | 'incomplete';
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
  zip_path: string | null;
  filename: string | null;
  title: string | null;
  description: string | null;
  placement_id: number | null;
  placement: { id: number; name: string; slug: string } | null;
  primary_style_id: number | null;
  primary_style: { id: number; name: string; slug: string } | null;
  additional_style_ids: number[];
  ai_suggested_tags: Array<{ id?: number; name: string; is_new_suggestion?: boolean }>;
  ai_suggested_styles: Array<{ id: number; name: string }>;
  approved_tag_ids: number[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BulkUploadItemsResponse {
  data: BulkUploadItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export function createBulkUploadService(api: ApiClient) {
  return {
    list: () =>
      api.get<{ data: BulkUpload[] }>('/bulk-uploads', {
        requiresAuth: true,
      }),

    getById: (id: number) =>
      api.get<{ data: BulkUpload }>(`/bulk-uploads/${id}`, {
        requiresAuth: true,
      }),

    delete: (id: number) =>
      api.delete(`/bulk-uploads/${id}`, { requiresAuth: true }),

    getItems: (
      uploadId: number,
      options: {
        filter?: 'all' | 'unprocessed' | 'processed' | 'ready' | 'published' | 'skipped';
        page?: number;
        perPage?: number;
        primaryOnly?: boolean;
      } = {}
    ) => {
      const params = new URLSearchParams();
      if (options.filter) params.append('filter', options.filter);
      if (options.page) params.append('page', options.page.toString());
      if (options.perPage) params.append('per_page', options.perPage.toString());
      if (options.primaryOnly !== undefined) params.append('primary_only', options.primaryOnly ? '1' : '0');

      return api.get<BulkUploadItemsResponse>(
        `/bulk-uploads/${uploadId}/items?${params.toString()}`,
        { requiresAuth: true },
      );
    },

    updateItem: (
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
    ) =>
      api.put<{ data: BulkUploadItem }>(
        `/bulk-uploads/${uploadId}/items/${itemId}`,
        data,
        { requiresAuth: true },
      ),

    batchUpdateItems: (
      uploadId: number,
      itemIds: number[],
      updates: {
        placement_id?: number | null;
        primary_style_id?: number | null;
        is_skipped?: boolean;
      }
    ) =>
      api.put<{ count: number }>(
        `/bulk-uploads/${uploadId}/items`,
        { item_ids: itemIds, updates },
        { requiresAuth: true },
      ),

    publish: (uploadId: number) =>
      api.post<{ message: string; count: number }>(
        `/bulk-uploads/${uploadId}/publish`,
        {},
        { requiresAuth: true },
      ),

    publishAll: (uploadId: number) =>
      api.post<{ message: string; count: number }>(
        `/bulk-uploads/${uploadId}/publish-all`,
        {},
        { requiresAuth: true },
      ),

    getPublishStatus: (uploadId: number) =>
      api.get<{
        status: string;
        total_images: number;
        cataloged_images: number;
        processed_images: number;
        published_images: number;
        ready_to_publish: number;
      }>(`/bulk-uploads/${uploadId}/publish-status`, {
        requiresAuth: true,
      }),

    uploadAlbum: (imageIds: number[], aiTag: boolean = false) =>
      api.post<{ data: BulkUpload; message: string }>(
        '/bulk-uploads/album',
        { image_ids: imageIds, ai_tag: aiTag },
        { requiresAuth: true },
      ),

    getDraftCount: () =>
      api.get<{ draft_count: number }>('/bulk-uploads/draft-count', {
        requiresAuth: true,
      }),
  };
}
