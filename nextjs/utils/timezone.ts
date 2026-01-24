/**
 * Timezone utilities for displaying times across different timezones.
 * Used primarily in the booking flow to show artist's time with client's local time.
 */

/**
 * Get the client's local timezone from the browser.
 */
export function getClientTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get a short timezone abbreviation (e.g., "EST", "PST").
 */
export function getTimezoneAbbreviation(timezone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(part => part.type === 'timeZoneName');
    return tzPart?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Format a time slot (e.g., "14:00") for display in a specific timezone.
 * Returns formatted time like "2:00 PM".
 */
export function formatTimeSlot(
  timeSlot: string,
  date: Date,
  timezone: string
): string {
  const [hours, minutes] = timeSlot.split(':').map(Number);

  // Create a date object for the given date and time in the target timezone
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = `${hours.toString().padStart(2, '0')}:${(minutes || 0).toString().padStart(2, '0')}:00`;

  // Parse as if in the target timezone
  const datetime = new Date(`${dateStr}T${timeStr}`);

  return datetime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
}

/**
 * Convert a time from one timezone to another and format it.
 *
 * @param timeSlot - Time in HH:MM format (e.g., "14:00")
 * @param date - The date for the appointment
 * @param fromTimezone - Source timezone (e.g., artist's timezone)
 * @param toTimezone - Target timezone (e.g., client's timezone)
 * @returns Formatted time in the target timezone
 */
export function convertTimezone(
  timeSlot: string,
  date: Date,
  fromTimezone: string,
  toTimezone: string
): string {
  const [hours, minutes] = timeSlot.split(':').map(Number);

  // Create a date string for the selected date
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const timeStr = `${hours.toString().padStart(2, '0')}:${(minutes || 0).toString().padStart(2, '0')}:00`;

  // Create the datetime in the source timezone
  // We use a trick: format as ISO in the source timezone, then parse
  const dateTimeStr = `${year}-${month}-${day}T${timeStr}`;

  // Get the UTC offset for the source timezone at this datetime
  const sourceDate = new Date(dateTimeStr);

  // Format in the source timezone to get the correct interpretation
  const sourceFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: fromTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Now format the same instant in the target timezone
  // First, we need to figure out what UTC time corresponds to this local time in fromTimezone
  // This is tricky because JS Date doesn't support arbitrary timezone construction

  // Alternative approach: use the offset difference
  const testDate = new Date(`${year}-${month}-${day}T12:00:00Z`);

  const sourceOffset = getTimezoneOffset(testDate, fromTimezone);
  const targetOffset = getTimezoneOffset(testDate, toTimezone);

  // Create UTC time from the source timezone time
  const utcMs = sourceDate.getTime() + sourceOffset * 60 * 1000;
  const utcDate = new Date(utcMs);

  // Format in the target timezone
  return utcDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: toTimezone,
  });
}

/**
 * Get the UTC offset in minutes for a given timezone at a specific date.
 */
function getTimezoneOffset(date: Date, timezone: string): number {
  // Get the time in the target timezone
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  // Get the time in UTC
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  // Return the difference in minutes
  return (utcDate.getTime() - tzDate.getTime()) / (1000 * 60);
}

/**
 * Format a time slot for display in the booking modal.
 * Shows the time in the artist's timezone with the client's local time in parentheses.
 *
 * @param timeSlot - Time in HH:MM format (e.g., "14:00")
 * @param date - The date for the appointment
 * @param artistTimezone - The artist's timezone (e.g., "America/New_York")
 * @param clientTimezone - The client's timezone (defaults to browser timezone)
 * @returns Formatted string like "2:00 PM (11:00 AM your time)" or just "2:00 PM" if same timezone
 */
export function formatTimeSlotWithClientTime(
  timeSlot: string,
  date: Date,
  artistTimezone?: string,
  clientTimezone?: string
): string {
  const clientTz = clientTimezone || getClientTimezone();
  const artistTz = artistTimezone || clientTz;

  // Format the time in artist's timezone
  const artistTime = formatTimeInTimezone(timeSlot, date, artistTz);

  // If timezones are the same, just return the artist time
  if (artistTz === clientTz) {
    return artistTime;
  }

  // Convert and format in client's timezone
  const clientTime = convertTimezone(timeSlot, date, artistTz, clientTz);

  return `${artistTime} (${clientTime} your time)`;
}

/**
 * Format a time slot in a specific timezone.
 */
function formatTimeInTimezone(timeSlot: string, date: Date, timezone: string): string {
  const [hours, minutes] = timeSlot.split(':').map(Number);

  // Create a date for formatting purposes
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const h = hours.toString().padStart(2, '0');
  const m = (minutes || 0).toString().padStart(2, '0');

  // Create a date object - note this will be interpreted in local timezone
  // but we'll format it specifying the target timezone
  const dateObj = new Date(`${year}-${month}-${day}T${h}:${m}:00`);

  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
}

/**
 * Check if two timezones are different.
 */
export function areTimezonesEqual(tz1?: string, tz2?: string): boolean {
  const timezone1 = tz1 || getClientTimezone();
  const timezone2 = tz2 || getClientTimezone();

  // Simple string comparison first
  if (timezone1 === timezone2) return true;

  // Check if they have the same offset at a reference date
  const refDate = new Date();
  const offset1 = getTimezoneOffset(refDate, timezone1);
  const offset2 = getTimezoneOffset(refDate, timezone2);

  return offset1 === offset2;
}

/**
 * Get a human-readable timezone label.
 */
export function getTimezoneLabel(timezone: string): string {
  const abbr = getTimezoneAbbreviation(timezone);

  // Extract city name from timezone ID (e.g., "America/New_York" -> "New York")
  const parts = timezone.split('/');
  const city = parts[parts.length - 1].replace(/_/g, ' ');

  return `${city} (${abbr})`;
}
