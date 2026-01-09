/**
 * Shared Calendar Hook
 *
 * Platform-agnostic calendar state management
 * Used by both Next.js and React Native
 */

import { useState, useMemo, useCallback } from 'react';
import {
  WorkingHour,
  ExternalCalendarEvent,
  Appointment,
  BookingType,
  CalendarDayInfo,
  formatLocalDate,
  isDateInPast,
  BOOKING_CONFIG,
} from '../types/calendar';

interface UseCalendarProps {
  workingHours: WorkingHour[];
  appointments?: Appointment[];
  externalEvents?: ExternalCalendarEvent[];
  initialDate?: Date;
}

interface UseCalendarReturn {
  // Current state
  currentDate: Date;
  month: number;
  year: number;
  monthName: string;

  // Navigation
  goToNextMonth: () => void;
  goToPreviousMonth: () => void;
  goToMonth: (month: number, year: number) => void;
  goToToday: () => void;

  // Calendar data
  daysInMonth: number;
  firstDayOfMonth: number;
  calendarDays: CalendarDayInfo[];

  // Availability
  closedDays: number[];
  availableDaysCount: number;
  nextAvailableDate: string | null;

  // Selection
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;

  // Booking
  bookingType: BookingType;
  setBookingType: (type: BookingType) => void;
  bookingConfig: typeof BOOKING_CONFIG[BookingType];

  // Helpers
  getAppointmentsForDate: (date: string) => Appointment[];
  getExternalEventsForDate: (date: string) => ExternalCalendarEvent[];
  isDateAvailable: (date: string) => boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function useCalendar({
  workingHours,
  appointments = [],
  externalEvents = [],
  initialDate = new Date(),
}: UseCalendarProps): UseCalendarReturn {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<BookingType>('consultation');

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const monthName = MONTH_NAMES[month];

  // Get closed days from working hours
  const closedDays = useMemo(() => {
    return workingHours
      .filter(wh => wh.is_day_off === true || wh.is_day_off === 1)
      .map(wh => wh.day_of_week);
  }, [workingHours]);

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Navigation
  const goToNextMonth = useCallback(() => {
    setCurrentDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const goToMonth = useCallback((newMonth: number, newYear: number) => {
    setCurrentDate(new Date(newYear, newMonth, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Get appointments for a specific date
  const getAppointmentsForDate = useCallback((dateStr: string): Appointment[] => {
    return appointments.filter(apt => apt.date === dateStr);
  }, [appointments]);

  // Get external events for a specific date
  const getExternalEventsForDate = useCallback((dateStr: string): ExternalCalendarEvent[] => {
    return externalEvents.filter(event => {
      const eventDate = event.starts_at.split('T')[0];
      return eventDate === dateStr;
    });
  }, [externalEvents]);

  // Check if a date is available for booking
  const isDateAvailable = useCallback((dateStr: string): boolean => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();

    // Check if day is closed
    if (closedDays.includes(dayOfWeek)) return false;

    // Check if date is in the past
    if (isDateInPast(date)) return false;

    // Could add more availability logic here (e.g., check for conflicts)
    return true;
  }, [closedDays]);

  // Build calendar day info for all days in the month
  const calendarDays = useMemo((): CalendarDayInfo[] => {
    const today = formatLocalDate(new Date());
    const days: CalendarDayInfo[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatLocalDate(date);
      const dayOfWeek = date.getDay();
      const isClosed = closedDays.includes(dayOfWeek);
      const isPast = dateStr < today;
      const dayAppointments = getAppointmentsForDate(dateStr);
      const dayExternalEvents = getExternalEventsForDate(dateStr);

      days.push({
        date: dateStr,
        dayOfMonth: day,
        dayOfWeek,
        isToday: dateStr === today,
        isPast,
        isCurrentMonth: true,
        isClosed,
        isAvailable: !isClosed && !isPast,
        hasAppointments: dayAppointments.length > 0,
        hasExternalEvents: dayExternalEvents.length > 0,
        appointments: dayAppointments,
        externalEvents: dayExternalEvents,
      });
    }

    return days;
  }, [year, month, daysInMonth, closedDays, getAppointmentsForDate, getExternalEventsForDate]);

  // Count available days
  const availableDaysCount = useMemo(() => {
    return calendarDays.filter(day => day.isAvailable).length;
  }, [calendarDays]);

  // Find next available date
  const nextAvailableDate = useMemo((): string | null => {
    const availableDay = calendarDays.find(day => day.isAvailable);
    if (availableDay) {
      const date = new Date(availableDay.date + 'T00:00:00');
      return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    }
    return null;
  }, [calendarDays]);

  return {
    currentDate,
    month,
    year,
    monthName,

    goToNextMonth,
    goToPreviousMonth,
    goToMonth,
    goToToday,

    daysInMonth,
    firstDayOfMonth,
    calendarDays,

    closedDays,
    availableDaysCount,
    nextAvailableDate,

    selectedDate,
    setSelectedDate,

    bookingType,
    setBookingType,
    bookingConfig: BOOKING_CONFIG[bookingType],

    getAppointmentsForDate,
    getExternalEventsForDate,
    isDateAvailable,
  };
}
