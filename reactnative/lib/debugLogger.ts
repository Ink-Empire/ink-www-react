import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_KEY = 'debug_api_errors';
const MAX_ENTRIES = 200;

export interface LogEntry {
  ts: string;
  tag: string;
  status?: number;
  message?: string;
  data?: any;
}

export async function logApiError(tag: string, err: any): Promise<void> {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    tag,
    status: err?.status,
    message: err?.message,
    data: err?.data,
  };

  // Always surface to Metro bundler / adb logcat
  console.error(`[API ERROR] ${tag}`, JSON.stringify(entry, null, 2));

  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const entries: LogEntry[] = raw ? JSON.parse(raw) : [];
    entries.push(entry);
    // Keep only the most recent MAX_ENTRIES
    if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(entries));
  } catch (storageErr) {
    console.error('[debugLogger] Failed to write to storage:', storageErr);
  }
}

export async function dumpApiErrors(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const entries: LogEntry[] = raw ? JSON.parse(raw) : [];
    console.log(`[API ERROR LOG] ${entries.length} entries:\n${JSON.stringify(entries, null, 2)}`);
  } catch (err) {
    console.error('[debugLogger] Failed to read log:', err);
  }
}

export async function clearApiErrorLog(): Promise<void> {
  await AsyncStorage.removeItem(LOG_KEY);
}
