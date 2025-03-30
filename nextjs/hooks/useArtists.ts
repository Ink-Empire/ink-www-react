import { useState, useEffect } from 'react';
import { artistService } from '@/services/artistService';
import { ArtistType } from '@/models/artist.interface';
import { api } from '../utils/api';

// Hook for fetching artists list
export function useArtists(searchParams?: Record<string, any>) {
  const [artists, setArtists] = useState<ArtistType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        
        // Explicitly use POST method, bypassing any cached references to artistService
        const data = await api.post<ArtistType[]>('/artists', {}, {
          headers: { 'X-Account-Type': 'artist' }
        });
        
        console.log('Artists fetched successfully via POST:', data.length);
        setArtists(data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching artists:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch artists'));
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [searchParams]);

  return { artists, loading, error };
}

// Hook for fetching a single artist by ID
export function useArtist(id: string | null) {
  const [artist, setArtist] = useState<ArtistType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchArtist = async () => {
      try {
        setLoading(true);
        const data = await artistService.getById(id);
        setArtist(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch artist with ID ${id}`));
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [id]);

  return { artist, loading, error };
}

// Hook for fetching artist portfolio (tattoos by artist)
export function useArtistPortfolio(artistId: string | null) {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!artistId) {
      setLoading(false);
      return;
    }

    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const data = await artistService.getPortfolio(artistId);
        setPortfolio(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch portfolio for artist ${artistId}`));
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [artistId]);

  return { portfolio, loading, error };
}