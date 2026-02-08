import { useState, useEffect, useCallback, useRef } from 'react';
import { artistService } from '@/services/artistService';
import { ArtistType } from '@/models/artist.interface';
import { useDemoMode } from '@/contexts/DemoModeContext';

// Unclaimed studio type
export interface UnclaimedStudio {
  id: number;
  name: string;
  location?: string;
  rating?: number;
  weekly_impressions?: number;
  is_claimed: boolean;
}

// Hook for fetching artists list with infinite scroll support
export function useArtists(searchParams?: Record<string, any>) {
  const [artists, setArtists] = useState<ArtistType[]>([]);
  const [unclaimedStudios, setUnclaimedStudios] = useState<UnclaimedStudio[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const { isDemoMode } = useDemoMode();

  // Track the current search params to detect changes
  const searchParamsKey = JSON.stringify({ ...(searchParams || {}), _demoMode: isDemoMode });
  const prevSearchParamsKey = useRef<string>(searchParamsKey);

  // Reset pagination when search params change
  useEffect(() => {
    if (prevSearchParamsKey.current !== searchParamsKey) {
      setPage(1);
      setArtists([]);
      setHasMore(true);
      prevSearchParamsKey.current = searchParamsKey;
    }
  }, [searchParamsKey]);

  // Fetch artists for a specific page
  const fetchArtists = useCallback(async (pageNum: number, append: boolean = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // Construct the request body from searchParams if provided
      const requestBody: Record<string, any> = { ...searchParams, page: pageNum, per_page: 25 };
      if (requestBody.locationCoordsString) {
        requestBody.locationCoords = requestBody.locationCoordsString;
        delete requestBody.locationCoordsString;
      } else if (requestBody.locationCoords && typeof requestBody.locationCoords === 'object') {
        requestBody.locationCoords = `${requestBody.locationCoords.lat},${requestBody.locationCoords.lng}`;
      }

      console.log(`Fetching artists page ${pageNum}:`, requestBody);

      const response = await artistService.search(requestBody);

      // Process the response
      let artistsData: ArtistType[] = [];
      let unclaimedStudiosData: UnclaimedStudio[] = [];
      let totalCount = 0;
      let hasMorePages = false;

      if (response) {
        if ('response' in response && Array.isArray(response.response)) {
          artistsData = response.response;
          totalCount = response.total ?? 0;
          hasMorePages = response.has_more ?? false;
          if (response.unclaimed_studios && Array.isArray(response.unclaimed_studios)) {
            unclaimedStudiosData = response.unclaimed_studios;
          }
        } else if (Array.isArray(response)) {
          artistsData = response as unknown as ArtistType[];
          totalCount = artistsData.length;
        }
        console.log(`Artists page ${pageNum} fetched:`, artistsData.length, 'of', totalCount, 'total, hasMore:', hasMorePages);
      }

      if (append) {
        setArtists(prev => [...prev, ...artistsData]);
      } else {
        setArtists(artistsData);
        setUnclaimedStudios(unclaimedStudiosData);
      }
      setTotal(totalCount);
      setHasMore(hasMorePages);
      setError(null);
    } catch (err) {
      console.error('Error fetching artists:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch artists'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchParams]);

  // Initial fetch when search params change
  useEffect(() => {
    fetchArtists(1, false);
  }, [searchParamsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchArtists(nextPage, true);
    }
  }, [loadingMore, hasMore, page, fetchArtists]);

  return {
    artists,
    unclaimedStudios,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore
  };
}

// Hook for fetching a single artist by ID or slug
export function useArtist(idOrSlug: string | null) {
  const [artist, setArtist] = useState<ArtistType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const fetchArtist = useCallback(async () => {
    if (!idOrSlug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await artistService.getById(idOrSlug, { useCache: false });
      setArtist(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(`Failed to fetch artist with ID/slug ${idOrSlug}`));
    } finally {
      setLoading(false);
    }
  }, [idOrSlug]);

  useEffect(() => {
    fetchArtist();
  }, [fetchArtist, refreshCounter]);

  const refetch = useCallback(() => {
    setRefreshCounter(c => c + 1);
  }, []);

  return { artist, loading, error, refetch };
}

// Hook for fetching artist portfolio (tattoos by artist) with pagination
export function useArtistPortfolio(artistIdOrSlug: string | null) {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(!!artistIdOrSlug);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const mountedRef = useRef(true);

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    if (!artistIdOrSlug) return;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await artistService.getPortfolio(artistIdOrSlug, pageNum);
      if (mountedRef.current) {
        const data = response?.response ?? response;
        const items = Array.isArray(data) ? data : [];
        setPortfolio(prev => append ? [...prev, ...items] : items);
        setHasMore(response?.has_more ?? false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch portfolio for artist ${artistIdOrSlug}`));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [artistIdOrSlug]);

  useEffect(() => {
    mountedRef.current = true;
    setPage(1);
    setPortfolio([]);

    if (artistIdOrSlug) {
      fetchPage(1, false);
    } else {
      setLoading(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPage(nextPage, true);
    }
  }, [loadingMore, hasMore, page, fetchPage]);

  const refetch = useCallback(() => {
    setPage(1);
    setPortfolio([]);
    fetchPage(1, false);
  }, [fetchPage]);

  return { portfolio, loading, error, hasMore, loadMore, refetch };
}
