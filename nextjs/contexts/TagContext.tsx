import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';

// Define interface for tag data
interface Tag {
  id: number;
  name: string;
  slug: string;
  tattoos_count?: number;
}

interface TagContextType {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  getTagName: (id: number) => string;
  getTagBySlug: (slug: string) => Tag | undefined;
  searchTags: (query: string) => Promise<Tag[]>;
}

const TagContext = createContext<TagContextType>({
  tags: [],
  loading: false,
  error: null,
  getTagName: () => '',
  getTagBySlug: () => undefined,
  searchTags: async () => [],
});

// Provider component
export const TagProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Cache key for tags in localStorage
    const TAGS_CACHE_KEY = 'tags_cache';

    // Try to load tags from localStorage first for instant display
    const tryLoadFromCache = () => {
      if (typeof window !== 'undefined') {
        try {
          const cachedTags = localStorage.getItem(TAGS_CACHE_KEY);
          if (cachedTags) {
            const tagsData = JSON.parse(cachedTags);
            // Check if cache is still valid (less than 24 hours old)
            const cacheTime = tagsData.timestamp || 0;
            const currentTime = Date.now();
            const cacheAge = currentTime - cacheTime;
            const cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

            if (cacheAge < cacheTTL && tagsData.tags && tagsData.tags.length > 0) {
              setTags(tagsData.tags);
              // Still fetch fresh data in the background, but no need to show loading
              return true;
            }
          }
        } catch (err) {
          console.warn('Error reading tags from cache', err);
        }
      }
      return false;
    };

    // Save tags to localStorage
    const saveToCache = (tagsData: Tag[]) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(TAGS_CACHE_KEY, JSON.stringify({
            tags: tagsData,
            timestamp: Date.now()
          }));
        } catch (err) {
          console.warn('Error saving tags to cache', err);
        }
      }
    };

    const fetchTags = async () => {
      // If we loaded from cache, don't show loading state
      if (!tryLoadFromCache()) {
        setLoading(true);
      }

      try {
        // Get tags with caching enabled
        const response = await api.get<{ success: boolean; data: Tag[] }>('/tags', {
          useCache: true,
          cacheTTL: 24 * 60 * 60 * 1000 // 24 hours TTL (tags rarely change)
        });

        if (!isMounted) return;

        if (response.data) {
          setTags(response.data);
          saveToCache(response.data);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching tags', err);
        setError('Failed to load tags');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTags();

    return () => {
      isMounted = false;
    };
  }, []);

  // Function to get tag name by ID
  const getTagName = (id: number): string => {
    const tag = tags.find(t => t.id === id);
    return tag ? tag.name : 'Unknown Tag';
  };

  // Function to get tag by slug
  const getTagBySlug = (slug: string): Tag | undefined => {
    return tags.find(t => t.slug === slug);
  };

  // Function to search tags (for autocomplete)
  const searchTags = async (query: string): Promise<Tag[]> => {
    if (!query || query.length < 1) {
      return [];
    }

    try {
      const response = await api.get<{ success: boolean; data: Tag[] }>(`/tags/search?q=${encodeURIComponent(query)}`);
      return response.data || [];
    } catch (err) {
      console.error('Error searching tags', err);
      return [];
    }
  };

  return (
    <TagContext.Provider
      value={{
        tags,
        loading,
        error,
        getTagName,
        getTagBySlug,
        searchTags,
      }}
    >
      {children}
    </TagContext.Provider>
  );
};

// Hook to use the tag context
export const useTags = () => useContext(TagContext);
