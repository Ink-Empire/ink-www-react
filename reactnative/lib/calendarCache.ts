import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UpcomingAppointment } from '@inkedin/shared/services';
import type { WorkingHour } from '@inkedin/shared/types';
import { artistService } from './services';

const CACHE_KEY = 'calendar_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CalendarCacheData {
  workingHours: WorkingHour[];
  upcomingAppointments: UpcomingAppointment[];
  artistId: number;
  timestamp: number;
}

// In-memory cache for instant access within the same session
let memoryCache: CalendarCacheData | null = null;

export async function getCachedCalendarData(artistId: number): Promise<CalendarCacheData | null> {
  // Check memory first
  if (memoryCache && memoryCache.artistId === artistId) {
    return memoryCache;
  }

  // Fall back to AsyncStorage
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: CalendarCacheData = JSON.parse(raw);
    if (data.artistId !== artistId) return null;
    memoryCache = data;
    return data;
  } catch {
    return null;
  }
}

export function isCacheStale(data: CalendarCacheData): boolean {
  return Date.now() - data.timestamp > CACHE_TTL;
}

function saveToCache(data: CalendarCacheData) {
  memoryCache = data;
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
}

export async function prefetchCalendarData(artistId: number, artistSlug?: string): Promise<void> {
  // Skip if we have fresh data already
  const existing = await getCachedCalendarData(artistId);
  if (existing && !isCacheStale(existing)) return;

  try {
    const idOrSlug = artistSlug || artistId;
    const [whResponse, scheduleResponse] = await Promise.all([
      artistService.getWorkingHours(idOrSlug),
      artistService.getUpcomingSchedule(artistId),
    ]);

    const whData = (whResponse as any)?.data ?? whResponse ?? [];
    const scheduleData = (scheduleResponse as any)?.data ?? [];

    saveToCache({
      workingHours: Array.isArray(whData) ? whData : [],
      upcomingAppointments: scheduleData.slice(0, 5),
      artistId,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('Calendar prefetch failed:', err);
  }
}

export async function fetchAndCacheCalendarData(
  artistId: number,
  artistSlug?: string,
): Promise<CalendarCacheData> {
  const idOrSlug = artistSlug || artistId;
  const [whResponse, scheduleResponse] = await Promise.all([
    artistService.getWorkingHours(idOrSlug),
    artistService.getUpcomingSchedule(artistId),
  ]);

  const whData = (whResponse as any)?.data ?? whResponse ?? [];
  const scheduleData = (scheduleResponse as any)?.data ?? [];

  const data: CalendarCacheData = {
    workingHours: Array.isArray(whData) ? whData : [],
    upcomingAppointments: scheduleData.slice(0, 5),
    artistId,
    timestamp: Date.now(),
  };

  saveToCache(data);
  return data;
}

export function clearCalendarCache() {
  memoryCache = null;
  AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
}
