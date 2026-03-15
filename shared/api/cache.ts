// Platform-agnostic in-memory API cache
// Works in both Next.js (web) and React Native (mobile)

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const cache: Record<string, CacheItem<any>> = {};

export function getCacheItem<T>(key: string): T | null {
  const item = cache[key];
  if (!item) return null;

  if (Date.now() - item.timestamp > item.ttl) {
    delete cache[key];
    return null;
  }

  return item.data;
}

export function setCacheItem<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  cache[key] = { data, timestamp: Date.now(), ttl };
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    Object.keys(cache).forEach(key => delete cache[key]);
    return;
  }
  Object.keys(cache).forEach(key => {
    if (key.includes(pattern)) {
      delete cache[key];
    }
  });
}

export function generateCacheKey(
  endpoint: string,
  method: string = 'GET',
  body?: any
): string {
  const bodyStr = body ? JSON.stringify(body) : '';
  return `${method}:${endpoint}${bodyStr ? `:${bodyStr}` : ''}`;
}
