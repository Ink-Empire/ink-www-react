/**
 * CalendarScreen - Artist Calendar View for React Native
 *
 * Uses shared types and hooks from @inkedin/shared
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useCalendar } from '@inkedin/shared/hooks';
import { WorkingHour, Appointment, ExternalCalendarEvent } from '@inkedin/shared/types';
import type { UpcomingAppointment } from '@inkedin/shared/services';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { artistService } from '../../lib/services';
import { useAuth } from '../contexts/AuthContext';
import { CalendarGrid } from '../components/Calendar/CalendarGrid';
import { CalendarDayModal } from '../components/Calendar/CalendarDayModal';
import { BookingFormModal } from '../components/Calendar/BookingFormModal';

interface CalendarScreenProps {
  route: {
    params: {
      artistId: number;
      artistName?: string;
      artistSlug?: string;
    };
  };
  navigation: any;
}

export default function CalendarScreen({ route, navigation }: CalendarScreenProps) {
  const { artistId, artistName = 'Artist', artistSlug } = route.params;
  const { user } = useAuth();
  const isOwnProfile = user?.id === artistId;

  // State
  const [loading, setLoading] = useState(true);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [externalEvents, setExternalEvents] = useState<ExternalCalendarEvent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [bookingFormVisible, setBookingFormVisible] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);

  // Use the shared calendar hook
  const calendar = useCalendar({
    workingHours,
    appointments,
    externalEvents,
  });

  // Fetch data on mount
  useEffect(() => {
    fetchCalendarData();
  }, [artistId]);

  // Fetch upcoming appointments once we know it's the artist's own calendar
  useEffect(() => {
    if (isOwnProfile) {
      fetchUpcomingAppointments();
    }
  }, [isOwnProfile, artistId]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const idOrSlug = artistSlug || artistId;
      const response = await artistService.getWorkingHours(idOrSlug);
      const data = (response as any)?.data ?? response ?? [];
      setWorkingHours(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await artistService.getUpcomingSchedule(artistId);
      const data = (response as any)?.data ?? [];
      const upcoming = data.slice(0, 5);
      setUpcomingAppointments(upcoming);

      // Convert to Appointment[] so the calendar hook knows which days have appointments
      setAppointments(upcoming.map((ua: UpcomingAppointment) => ({
        id: ua.id,
        title: ua.title,
        date: ua.date,
        start_time: ua.time.split(' \u2013 ')[0] || '',
        end_time: ua.time.split(' \u2013 ')[1] || '',
        type: (ua.type || 'appointment') as 'consultation' | 'appointment' | 'other',
        status: 'booked' as const,
        artist_id: artistId,
      })));
    } catch (err) {
      console.error('Failed to fetch upcoming appointments:', err);
    }
  };

  const handleDayPress = (date: string) => {
    calendar.setSelectedDate(date);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    calendar.setSelectedDate(null);
  };

  const handleRequestBooking = () => {
    setBookingFormVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.monthTitle}>
              {calendar.monthName} {calendar.year}
            </Text>
            <Text style={styles.availabilityText}>
              <Text style={styles.accentText}>{calendar.availableDaysCount}</Text> days available
              {calendar.nextAvailableDate && (
                <>
                  {' · Next: '}
                  <Text style={styles.accentText}>{calendar.nextAvailableDate}</Text>
                </>
              )}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={calendar.goToPreviousMonth}
            >
              <Text style={styles.navButtonText}>{'<'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={calendar.goToNextMonth}
            >
              <Text style={styles.navButtonText}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Booking Type Toggle - hidden for own profile */}
        {!isOwnProfile && (
          <View style={styles.bookingTypeContainer}>
            <TouchableOpacity
              style={[
                styles.bookingTypeButton,
                calendar.bookingType === 'consultation' && styles.bookingTypeButtonActive,
              ]}
              onPress={() => calendar.setBookingType('consultation')}
            >
              <Text
                style={[
                  styles.bookingTypeText,
                  calendar.bookingType === 'consultation' && styles.bookingTypeTextActive,
                ]}
              >
                Consultation
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.bookingTypeButton,
                calendar.bookingType === 'appointment' && styles.bookingTypeButtonActive,
              ]}
              onPress={() => calendar.setBookingType('appointment')}
            >
              <Text
                style={[
                  styles.bookingTypeText,
                  calendar.bookingType === 'appointment' && styles.bookingTypeTextActive,
                ]}
              >
                Appointment
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Calendar Grid */}
        <CalendarGrid
          calendarDays={calendar.calendarDays}
          firstDayOfMonth={calendar.firstDayOfMonth}
          closedDays={calendar.closedDays}
          onDayPress={handleDayPress}
          isOwnProfile={isOwnProfile}
        />

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.available }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]} />
            <Text style={styles.legendText}>Unavailable</Text>
          </View>
        </View>

        {/* Upcoming Appointments - own profile only */}
        {isOwnProfile && upcomingAppointments.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={styles.upcomingSectionTitle}>Upcoming Appointments</Text>
            {upcomingAppointments.map((apt) => (
              <TouchableOpacity key={apt.id} style={styles.appointmentCard} onPress={() => handleDayPress(apt.date)}>
                <View style={styles.appointmentDate}>
                  <Text style={styles.appointmentDay}>{apt.day}</Text>
                  <Text style={styles.appointmentMonth}>{apt.month}</Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentTitle}>{apt.title}</Text>
                  <Text style={styles.appointmentTime}>
                    <MaterialIcons name="schedule" size={12} color={colors.textMuted} />
                    {'  '}{apt.time}
                  </Text>
                  <Text style={styles.appointmentClient}>{apt.clientName}</Text>
                </View>
                <View style={styles.appointmentTypeBadge}>
                  <Text style={styles.appointmentTypeText}>{apt.type}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Day Detail Modal */}
      <CalendarDayModal
        visible={modalVisible}
        onClose={handleCloseModal}
        selectedDate={calendar.selectedDate}
        bookingConfig={calendar.bookingConfig}
        artistName={artistName}
        appointments={calendar.selectedDate ? calendar.getAppointmentsForDate(calendar.selectedDate) : []}
        externalEvents={calendar.selectedDate ? calendar.getExternalEventsForDate(calendar.selectedDate) : []}
        isOwnProfile={isOwnProfile}
        ownerAppointments={calendar.selectedDate ? upcomingAppointments.filter(a => {
          if (a.date) return a.date === calendar.selectedDate;
          const d = new Date(calendar.selectedDate + 'T00:00:00');
          const monthShort = d.toLocaleString('en-US', { month: 'short' });
          return a.day === d.getDate() && a.month === monthShort;
        }) : []}
        onRequestBooking={handleRequestBooking}
      />

      {/* Booking Form Modal */}
      {!isOwnProfile && (
        <BookingFormModal
          visible={bookingFormVisible}
          onClose={() => setBookingFormVisible(false)}
          artistId={artistId}
          artistName={artistName}
          selectedDate={calendar.selectedDate}
          bookingType={calendar.bookingType}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.textPrimary,
    fontFamily: 'System',
  },
  availabilityText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  accentText: {
    color: colors.accent,
    fontWeight: '600',
  },
  navButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  bookingTypeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  bookingTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  bookingTypeButtonActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  bookingTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  bookingTypeTextActive: {
    color: colors.accent,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Upcoming Appointments
  upcomingSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  upcomingSectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  appointmentDate: {
    width: 44,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 6,
  },
  appointmentDay: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  appointmentMonth: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  appointmentInfo: {
    flex: 1,
    gap: 2,
  },
  appointmentTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentTime: {
    color: colors.textMuted,
    fontSize: 12,
  },
  appointmentClient: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  appointmentTypeBadge: {
    backgroundColor: colors.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  appointmentTypeText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
