import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Tattoo } from '@inkedin/shared/types';

const CACHE_KEY = 'tattoo_feed_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface TattooCacheData {
  tattoos: Tattoo[];
  timestamp: number;
}

// In-memory cache for instant access within the same session
let memoryCache: TattooCacheData | null = null;

export async function getCachedTattoos(): Promise<Tattoo[] | null> {
  // Check memory first (instant)
  if (memoryCache && !isCacheStale(memoryCache)) {
    return memoryCache.tattoos;
  }

  // Fall back to AsyncStorage
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: TattooCacheData = JSON.parse(raw);
    if (isCacheStale(data)) return null;
    memoryCache = data;
    return data.tattoos;
  } catch {
    return null;
  }
}

function isCacheStale(data: TattooCacheData): boolean {
  return Date.now() - data.timestamp > CACHE_TTL;
}

export function saveTattoosToCache(tattoos: Tattoo[]) {
  const data: TattooCacheData = { tattoos, timestamp: Date.now() };
  memoryCache = data;
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
}

export function clearTattooCache() {
  memoryCache = null;
  AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
}
