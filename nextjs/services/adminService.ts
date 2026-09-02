import { api } from '../utils/api';

/**
 * Endpoints behind the admin gate, used only by the panels under admin/pages.
 *
 * These are grouped by caller rather than by domain, unlike the other services.
 * That is deliberate. Putting onboardArtist on artistService would make an
 * admin-only call reachable from any component in the public app, where it
 * would compile, run, and 403. Keeping them here means the privilege boundary
 * is visible in the import.
 */

export interface CommandOption {
  name: string;
  description: string;
  accepts_value: boolean;
  default: string | boolean | null;
}

export interface CommandArgument {
  name: string;
  description: string;
  required: boolean;
  default: string | null;
}

export interface Command {
  name: string;
  description: string;
  arguments: CommandArgument[];
  options: CommandOption[];
  destructive: boolean;
}

export interface RunResult {
  output: string;
  exit_code: number;
  duration_ms: number;
}

export interface DocFile {
  id: string;
  filename: string;
  title: string;
  size: number;
  modified: number;
}

export interface DocFolder {
  name: string;
  title: string;
  files: DocFile[];
}

export interface DocContent extends DocFile {
  content: string;
}

export interface RebuildResult {
  message?: string;
  indexed?: number;
  missing_ids?: number[];
}

export interface OrphanScanResult {
  es_total: number;
  db_total: number;
  orphan_count: number;
  orphan_ids: number[];
  warnings?: string[];
}

export interface DeleteOrphansResult {
  deleted: number;
  skipped?: number[];
  message?: string;
}

export interface AdminStudioOption {
  id: number;
  name: string;
  location?: string;
}

export interface CreateStudioData {
  name: string;
  location?: string | null;
  location_lat_long?: string | null;
}

export interface OnboardArtistImage {
  content: string;
  mime: string;
  filename: string;
  size: number;
}

export interface OnboardArtistData {
  email: string;
  name: string;
  images: OnboardArtistImage[];
  studio_id?: number | null;
  location?: string | null;
  location_lat_long?: string | null;
}

export interface OnboardArtistResult {
  artist: { id: number; name: string; email: string; username: string };
  bulk_upload_id: number;
  images_saved: number;
  images_submitted: number;
  is_new_account: boolean;
  studio: { id: number; name: string } | null;
}

export const adminService = {
  // Commands
  getCommands: async (): Promise<{ commands: Command[] }> => {
    return api.get<{ commands: Command[] }>('/admin/commands', { useCache: false });
  },

  runCommand: async (command: string, options: Record<string, any>): Promise<RunResult> => {
    return api.post<RunResult>('/admin/commands/run', { command, options });
  },

  // Docs
  getDocs: async (): Promise<{ files: DocFile[]; folders: DocFolder[] }> => {
    return api.get<{ files: DocFile[]; folders: DocFolder[] }>('/admin/docs');
  },

  getDoc: async (docId: string): Promise<DocContent> => {
    return api.get<DocContent>(`/admin/docs/${docId}`);
  },

  // Elasticsearch
  rebuildByIds: async (model: string, ids: string[], bypass: boolean): Promise<RebuildResult> => {
    const endpoint = bypass ? '/admin/elastic/rebuild-bypass' : '/admin/elastic/rebuild';
    return api.post<RebuildResult>(endpoint, { model, ids });
  },

  reindex: async (model: string): Promise<void> => {
    await api.post('/elastic/reindex', { model });
  },

  findOrphans: async (model: string): Promise<OrphanScanResult> => {
    return api.post<OrphanScanResult>('/admin/elastic/find-orphans', { model });
  },

  // force is only sent when true. The server answers 409 on a sweep large
  // enough to gut the index, and the caller re-asks with its reasoning.
  deleteOrphans: async (model: string, ids: number[], force = false): Promise<DeleteOrphansResult> => {
    return api.post<DeleteOrphansResult>('/admin/elastic/delete-orphans', {
      model,
      ids,
      ...(force ? { force: true } : {}),
    });
  },

  migrateAlias: async (alias: string): Promise<void> => {
    await api.post('/admin/elastic/migrate', { alias });
  },

  // Email
  sendTestEmail: async (type: string, email: string): Promise<{ success: boolean; message: string }> => {
    return api.post<{ success: boolean; message: string }>('/admin/email-test/send', { type, email });
  },

  // Artist onboarding
  searchStudios: async (query: string): Promise<AdminStudioOption[]> => {
    const filter = encodeURIComponent(JSON.stringify({ q: query }));
    const response = await api.get<{ data: AdminStudioOption[] }>(
      `/admin/studios?page=1&per_page=20&sort=name&order=asc&filter=${filter}`,
      { requiresAuth: true, useCache: false }
    );
    return response.data || [];
  },

  // Creates a stub studio so an artist can be attached to one that is not on
  // the platform yet. Only the name is required; the studio stays unverified
  // and ownerless until somebody claims it.
  createStudio: async (data: CreateStudioData): Promise<AdminStudioOption> => {
    const response = await api.post<{ data: AdminStudioOption }>('/admin/studios', data, {
      requiresAuth: true,
    });
    return response.data;
  },

  onboardArtist: async (data: OnboardArtistData): Promise<OnboardArtistResult> => {
    return api.post<OnboardArtistResult>('/admin/artists/onboard', data, { requiresAuth: true });
  },
};
