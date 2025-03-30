import { useState, useEffect } from 'react';
import { tattooService } from '../services/tattooService';

// Hook for fetching tattoos list
export function useTattoos(searchParams?: Record<string, any>) {
  const [tattoos, setTattoos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTattoos = async () => {
      try {
        setLoading(true);
        const data = await tattooService.search(searchParams);
        setTattoos(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tattoos'));
      } finally {
        setLoading(false);
      }
    };

    fetchTattoos();
  }, [searchParams]);

  return { tattoos, loading, error };
}

// Hook for fetching a single tattoo by ID
export function useTattoo(id: string | null) {
  const [tattoo, setTattoo] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchTattoo = async () => {
      try {
        setLoading(true);
        const data = await tattooService.getById(id);
        setTattoo(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch tattoo with ID ${id}`));
      } finally {
        setLoading(false);
      }
    };

    fetchTattoo();
  }, [id]);

  return { tattoo, loading, error };
}