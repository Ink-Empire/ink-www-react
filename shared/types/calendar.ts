/**
 * Shared Calendar Types
 *
 * These types are designed to be used by both:
 * - NextJS web app (nextjs/)
 * - Future React Native mobile app
 *
 * Keep platform-agnostic - no React/MUI specific types here
 */

export interface WorkingHour {
  id?: number;
  artist_id?: number;
  studio_id?: number;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  day_name?: string;
  start_time: string; // HH:MM:SS format
  end_time: string;
  is_day_off: boolean | number; // API may return 0/1, normalize with isDayOff()
}

/**
 * Normalize is_day_off value from API (handles boolean or 0/1)
 */
export function isDayOff(value: boolean | number | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return false;
}

export interface ExternalCalendarEvent {
  id: number;
  title: string;
  starts_at: string; // ISO date string
  ends_at: string;
  all_day: boolean;
  source: 'google' | 'apple' | 'outlook' | string;
}

export interface Appointment {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
  type: 'consultation' | 'appointment' | 'other';
  status: AppointmentStatus;
  description?: string;
  client_id?: number | null;
  artist_id: number;
  google_event_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type AppointmentStatus = 'pending' | 'booked' | 'completed' | 'cancelled';

export type BookingType = 'consultation' | 'appointment';

export type EventType = 'appointment' | 'consultation' | 'other';

export interface BookingConfig {
  title: string;
  description: string;
  duration: string;
  cost: string;
  modalDescription: (artistName: string) => string;
  modalDuration: string;
  modalCost: string;
}

export const BOOKING_CONFIG: Record<BookingType, BookingConfig> = {
  consultation: {
    title: 'Consultation',
    description: 'Set aside time to discuss your tattoo idea, placement, sizing, and get a quote before committing.',
    duration: '15 minutes',
    cost: 'Free',
    modalDescription: (artistName: string) => `You're requesting a consultation with ${artistName} to discuss your tattoo idea.`,
    modalDuration: '15 min',
    modalCost: 'Free'
  },
  appointment: {
    title: 'Appointment',
    description: 'An in-studio tattoo session. A deposit is required to confirm your booking and will be deducted from your final total.',
    duration: '2+ hours',
    cost: '$180/hr',
    modalDescription: (artistName: string) => `You're requesting an in-studio appointment with ${artistName}. A deposit is required to confirm.`,
    modalDuration: '2+ hrs',
    modalCost: 'Deposit req.'
  }
};

export interface BookingSettings {
  hourly_rate: string;
  deposit_amount: string;
  consultation_fee: string;
  minimum_session: string;
}

export interface CalendarDayInfo {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  dayOfWeek: number;
  isToday: boolean;
  isPast: boolean;
  isCurrentMonth: boolean;
  isClosed: boolean;
  isAvailable: boolean;
  hasAppointments: boolean;
  hasExternalEvents: boolean;
  appointments: Appointment[];
  externalEvents: ExternalCalendarEvent[];
}

/**
 * Calendar utility functions
 * Platform-agnostic helpers that can be used in both web and mobile
 */

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

export function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Add padding days from previous month
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }

  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Add padding days for next month to complete the grid
  const endPadding = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
}
