import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiClient } from '../api';
import { createNotificationService } from '../services/notificationService';
import type { AppNotification } from '../types';

const UNREAD_POLL_INTERVAL = 30000;

export function useNotifications(api: ApiClient) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const serviceRef = useRef(createNotificationService(api));

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    try {
      if (append) {
        setLoading(true);
      }
      setError(null);
      const response = await serviceRef.current.getNotifications(pageNum);
      const items = response.data || [];
      if (append) {
        setNotifications((prev) => [...prev, ...items]);
      } else {
        setNotifications(items);
      }
      setHasMore(response.current_page < response.last_page);
      setPage(response.current_page);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(1, false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchPage(page + 1, true);
  }, [hasMore, loading, page, fetchPage]);

  const markAllRead = useCallback(async () => {
    try {
      await serviceRef.current.markNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
      );
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  }, []);

  return { notifications, loading, refreshing, error, hasMore, refresh, loadMore, markAllRead };
}

export function useUnreadNotificationCount(api: ApiClient) {
  const [unreadCount, setUnreadCount] = useState(0);
  const serviceRef = useRef(createNotificationService(api));

  const refresh = useCallback(async () => {
    try {
      const response = await serviceRef.current.getUnreadNotificationCount();
      setUnreadCount(response.unread_count || 0);
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, UNREAD_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { unreadCount, refresh };
}
