import { useState, useEffect } from 'react';
import { studioService } from '../services/studioService';

// Hook for fetching studios list
export function useStudios(searchParams?: Record<string, any>) {
  const [studios, setStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStudios = async () => {
      try {
        setLoading(true);
        const data = await studioService.search(searchParams);
        setStudios(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch studios'));
      } finally {
        setLoading(false);
      }
    };

    fetchStudios();
  }, [searchParams]);

  return { studios, loading, error };
}

// Hook for fetching a single studio by ID
export function useStudio(id: string | null) {
  const [studio, setStudio] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchStudio = async () => {
      try {
        setLoading(true);
        const data = await studioService.getById(id);
        setStudio(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch studio with ID ${id}`));
      } finally {
        setLoading(false);
      }
    };

    fetchStudio();
  }, [id]);

  return { studio, loading, error };
}

// Hook for fetching studio artists
export function useStudioArtists(studioId: string | null) {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!studioId) {
      setLoading(false);
      return;
    }

    const fetchStudioArtists = async () => {
      try {
        setLoading(true);
        const data = await studioService.getArtists(studioId);
        setArtists(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch artists for studio ${studioId}`));
      } finally {
        setLoading(false);
      }
    };

    fetchStudioArtists();
  }, [studioId]);

  return { artists, loading, error };
}