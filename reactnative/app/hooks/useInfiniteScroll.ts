import { useState, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number) => Promise<T[]>;
  pageSize?: number;
}

interface UseInfiniteScrollResult<T> {
  data: T[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => void;
  onEndReached: () => void;
}

export default function useInfiniteScroll<T>({
  fetchFn,
  pageSize = 20,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const fetchingRef = useRef(false);

  const fetchPage = useCallback(async (page: number, isRefresh: boolean) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (isRefresh) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const results = await fetchFn(page);
      const items = Array.isArray(results) ? results : [];

      if (isRefresh) {
        setData(items);
      } else {
        setData(prev => [...prev, ...items]);
      }

      setHasMore(items.length >= pageSize);
      pageRef.current = page;
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [fetchFn, pageSize]);

  const refresh = useCallback(() => {
    pageRef.current = 1;
    setHasMore(true);
    fetchPage(1, true);
  }, [fetchPage]);

  const onEndReached = useCallback(() => {
    if (!hasMore || fetchingRef.current) return;
    fetchPage(pageRef.current + 1, false);
  }, [hasMore, fetchPage]);

  // Initial load
  const initialLoadRef = useRef(false);
  if (!initialLoadRef.current) {
    initialLoadRef.current = true;
    fetchPage(1, true);
  }

  return { data, loading, loadingMore, error, hasMore, refresh, onEndReached };
}
