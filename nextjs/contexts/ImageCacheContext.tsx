import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ImageCacheContextType {
  // Check if an image is already loaded/cached
  isImageCached: (url: string) => boolean;
  // Preload an image (returns a promise that resolves when loaded)
  preloadImage: (url: string) => Promise<void>;
  // Preload multiple images
  preloadImages: (urls: string[]) => Promise<void>;
  // Get a cache-busted URL for an image (adds version param)
  getCacheBustedUrl: (url: string, entityType: string, entityId: string | number) => string;
  // Invalidate cache for a specific entity (e.g., after updating a tattoo)
  invalidateEntity: (entityType: string, entityId: string | number) => void;
  // Get loading state for an image
  isImageLoading: (url: string) => boolean;
}

const ImageCacheContext = createContext<ImageCacheContextType | null>(null);

// Store for cache versions - persisted in localStorage
const CACHE_VERSIONS_KEY = 'image_cache_versions';

const getCacheVersions = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(CACHE_VERSIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const setCacheVersions = (versions: Record<string, number>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_VERSIONS_KEY, JSON.stringify(versions));
  } catch {
    // Ignore storage errors
  }
};

export const ImageCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Set of URLs that have been successfully loaded
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  // Set of URLs currently being loaded
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  // Cache versions for entities (for cache busting)
  const cacheVersionsRef = useRef<Record<string, number>>(getCacheVersions());
  // Promises for in-flight image loads to avoid duplicate requests
  const loadingPromisesRef = useRef<Map<string, Promise<void>>>(new Map());

  const isImageCached = useCallback((url: string): boolean => {
    return loadedImages.has(url);
  }, [loadedImages]);

  const isImageLoading = useCallback((url: string): boolean => {
    return loadingImages.has(url);
  }, [loadingImages]);

  const preloadImage = useCallback((url: string): Promise<void> => {
    if (!url) return Promise.resolve();

    // Already loaded
    if (loadedImages.has(url)) {
      return Promise.resolve();
    }

    // Already loading - return existing promise
    const existingPromise = loadingPromisesRef.current.get(url);
    if (existingPromise) {
      return existingPromise;
    }

    // Start loading
    const promise = new Promise<void>((resolve, reject) => {
      setLoadingImages(prev => new Set(prev).add(url));

      const img = new Image();

      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(url));
        setLoadingImages(prev => {
          const next = new Set(prev);
          next.delete(url);
          return next;
        });
        loadingPromisesRef.current.delete(url);
        resolve();
      };

      img.onerror = () => {
        setLoadingImages(prev => {
          const next = new Set(prev);
          next.delete(url);
          return next;
        });
        loadingPromisesRef.current.delete(url);
        // Resolve anyway - we don't want to block on failed images
        resolve();
      };

      img.src = url;
    });

    loadingPromisesRef.current.set(url, promise);
    return promise;
  }, [loadedImages]);

  const preloadImages = useCallback(async (urls: string[]): Promise<void> => {
    const validUrls = urls.filter(Boolean);
    await Promise.all(validUrls.map(url => preloadImage(url)));
  }, [preloadImage]);

  const getCacheBustedUrl = useCallback((url: string, entityType: string, entityId: string | number): string => {
    if (!url) return url;

    const key = `${entityType}:${entityId}`;
    const version = cacheVersionsRef.current[key];

    if (!version) return url;

    // Add version as query param
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${version}`;
  }, []);

  const invalidateEntity = useCallback((entityType: string, entityId: string | number) => {
    const key = `${entityType}:${entityId}`;
    const newVersion = Date.now();

    cacheVersionsRef.current = {
      ...cacheVersionsRef.current,
      [key]: newVersion
    };

    // Persist to localStorage
    setCacheVersions(cacheVersionsRef.current);

    // Clear in-memory image cache - this ensures any cached images for this entity
    // will be re-fetched. We clear all images since we don't track entity-to-URL mapping.
    // This is acceptable because images will re-preload on hover.
    setLoadedImages(new Set());
    setLoadingImages(new Set());
    loadingPromisesRef.current.clear();

    // Also clear the data cache for this entity (used by useTattoo, useArtist hooks)
    if (typeof window !== 'undefined') {
      try {
        // Clear specific entity cache
        localStorage.removeItem(`${entityType}_cache:${entityId}`);

        // Also clear list caches that might contain this entity
        // This is a bit aggressive but ensures consistency
        const keysToCheck = Object.keys(localStorage);
        keysToCheck.forEach(storageKey => {
          if (storageKey.startsWith(`${entityType}s_cache:`) ||
              storageKey.startsWith(`artist_${entityType}s_cache:`)) {
            localStorage.removeItem(storageKey);
          }
        });
      } catch (e) {
        // Ignore storage errors
      }
    }
  }, []);

  const value: ImageCacheContextType = {
    isImageCached,
    preloadImage,
    preloadImages,
    getCacheBustedUrl,
    invalidateEntity,
    isImageLoading
  };

  return (
    <ImageCacheContext.Provider value={value}>
      {children}
    </ImageCacheContext.Provider>
  );
};

export const useImageCache = (): ImageCacheContextType => {
  const context = useContext(ImageCacheContext);
  if (!context) {
    throw new Error('useImageCache must be used within an ImageCacheProvider');
  }
  return context;
};

// Hook for preloading tattoo images on hover
export const useTattooImagePreload = () => {
  const { preloadImage, preloadImages, getCacheBustedUrl } = useImageCache();

  const preloadTattooImages = useCallback((tattoo: any) => {
    if (!tattoo) return;

    const urls: string[] = [];
    const tattooId = tattoo.id;

    // Primary image
    const primaryUri = tattoo.primary_image?.uri || tattoo.image?.uri;
    if (primaryUri) {
      urls.push(getCacheBustedUrl(primaryUri, 'tattoo', tattooId));
    }

    // All images array
    if (tattoo.images && Array.isArray(tattoo.images)) {
      tattoo.images.forEach((img: any) => {
        const uri = typeof img === 'string' ? img : img?.uri;
        if (uri) {
          urls.push(getCacheBustedUrl(uri, 'tattoo', tattooId));
        }
      });
    }

    // Artist avatar
    if (tattoo.artist_image_uri) {
      urls.push(tattoo.artist_image_uri);
    }

    preloadImages(urls);
  }, [preloadImages, getCacheBustedUrl]);

  return { preloadTattooImages };
};
