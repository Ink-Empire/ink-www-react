// API Cache Utility
// This utility provides a way to cache API responses and reduce duplicate API calls

// Cache storage with TTL (time to live)
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// In-memory cache
const cache: Record<string, CacheItem<any>> = {};

// Default cache duration: 5 minutes
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Generate a cache key based on endpoint and parameters
 */
export const generateCacheKey = (
  endpoint: string, 
  method: string = 'GET', 
  params?: any
): string => {
  // For GET requests, the key is simply the endpoint
  // For other methods, include the params in the key to differentiate between different payloads
  const paramsString = params ? JSON.stringify(params) : '';
  return `${method}:${endpoint}${paramsString ? `:${paramsString}` : ''}`;
};

/**
 * Store data in the cache
 */
export const setCacheItem = <T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_CACHE_DURATION
): void => {
  cache[key] = {
    data,
    timestamp: Date.now(),
    ttl
  };
};

/**
 * Get data from the cache if it exists and hasn't expired
 */
export const getCacheItem = <T>(key: string): T | null => {
  const item = cache[key];
  
  // If item doesn't exist, return null
  if (!item) {
    return null;
  }
  
  // Check if item has expired
  const now = Date.now();
  if (now - item.timestamp > item.ttl) {
    // Remove expired item
    delete cache[key];
    return null;
  }
  
  return item.data;
};

/**
 * Clear a specific cache item
 */
export const clearCacheItem = (key: string): void => {
  delete cache[key];
};

/**
 * Clear all cache items or those matching a pattern
 */
export const clearCache = (pattern?: string): void => {
  if (!pattern) {
    // Clear all cache
    Object.keys(cache).forEach(key => delete cache[key]);
  } else {
    // Clear cache items matching the pattern
    Object.keys(cache).forEach(key => {
      if (key.includes(pattern)) {
        delete cache[key];
      }
    });
  }
};

/**
 * Get time remaining before cache expiration (in milliseconds)
 */
export const getCacheTimeRemaining = (key: string): number => {
  const item = cache[key];
  
  if (!item) {
    return 0;
  }
  
  const now = Date.now();
  const elapsed = now - item.timestamp;
  const remaining = item.ttl - elapsed;
  
  return Math.max(0, remaining);
};

/**
 * Check if a cache item exists and is valid
 */
export const hasCacheItem = (key: string): boolean => {
  return getCacheItem(key) !== null;
};

// Debug function to view cache contents
export const debugCache = (): Record<string, any> => {
  const debugInfo: Record<string, any> = {};
  
  Object.keys(cache).forEach(key => {
    const item = cache[key];
    debugInfo[key] = {
      hasData: !!item.data,
      dataType: typeof item.data,
      isArray: Array.isArray(item.data),
      timestamp: new Date(item.timestamp).toISOString(),
      ttl: item.ttl,
      timeRemaining: getCacheTimeRemaining(key),
    };
  });
  
  return debugInfo;
};