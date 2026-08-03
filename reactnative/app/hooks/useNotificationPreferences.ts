import { useState, useEffect, useCallback } from 'react';
import {
  createNotificationService,
  type NotificationType,
  type NotificationPreference,
} from '@inkedin/shared/services';
import { api } from '../../lib/api';

const notificationService = createNotificationService(api);

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationService.getPreferences();
      setPreferences((response as any).preferences || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const togglePreference = useCallback(async (type: NotificationType, enabled: boolean) => {
    // Optimistic update
    setPreferences(prev =>
      prev.map(p => (p.type === type ? { ...p, push_enabled: enabled } : p)),
    );

    try {
      const response = await notificationService.updatePreferences({ [type]: enabled });
      setPreferences((response as any).preferences || []);
    } catch (err: any) {
      // Revert on failure
      setPreferences(prev =>
        prev.map(p => (p.type === type ? { ...p, push_enabled: !enabled } : p)),
      );
      setError(err.message || 'Failed to update preference');
    }
  }, []);

  return { preferences, loading, error, togglePreference, refetch: fetchPreferences };
}
