import type { ApiClient } from '../api';

export type NotificationType =
  | 'new_message'
  | 'booking_request'
  | 'booking_accepted'
  | 'booking_declined'
  | 'books_open'
  | 'beacon_request';

export interface NotificationPreference {
  type: NotificationType;
  push_enabled: boolean;
}

export interface NotificationPreferencesResponse {
  preferences: NotificationPreference[];
}

export function createNotificationService(api: ApiClient) {
  return {
    registerDeviceToken: (token: string, platform: string, deviceId?: string) =>
      api.post('/device-tokens', { token, platform, device_id: deviceId }, { requiresAuth: true }),

    unregisterDeviceToken: (token: string) =>
      api.post('/device-tokens/unregister', { token }, { requiresAuth: true }),

    getPreferences: () =>
      api.get<NotificationPreferencesResponse>('/notification-preferences', { requiresAuth: true }),

    updatePreferences: (prefs: Partial<Record<NotificationType, boolean>>) =>
      api.put<NotificationPreferencesResponse>('/notification-preferences', { preferences: prefs }, { requiresAuth: true }),
  };
}
