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
import { CalendarGrid } from '../components/Calendar/CalendarGrid';
import { CalendarDayModal } from '../components/Calendar/CalendarDayModal';

// Color palette matching the web app
const colors = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  border: '#2A2A2A',
  textPrimary: '#E8E8E8',
  textSecondary: '#888888',
  accent: '#C9A962',
  success: '#4CAF50',
  error: '#FF5252',
};

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

  // State
  const [loading, setLoading] = useState(true);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [externalEvents, setExternalEvents] = useState<ExternalCalendarEvent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

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

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      // const response = await api.get(`/artists/${artistSlug}/working-hours`);
      // setWorkingHours(response.data);

      // Mock data for now
      setWorkingHours([
        { artist_id: artistId, day_of_week: 0, start_time: '09:00', end_time: '17:00', is_day_off: true },
        { artist_id: artistId, day_of_week: 1, start_time: '09:00', end_time: '17:00', is_day_off: false },
        { artist_id: artistId, day_of_week: 2, start_time: '09:00', end_time: '17:00', is_day_off: false },
        { artist_id: artistId, day_of_week: 3, start_time: '09:00', end_time: '17:00', is_day_off: false },
        { artist_id: artistId, day_of_week: 4, start_time: '09:00', end_time: '17:00', is_day_off: false },
        { artist_id: artistId, day_of_week: 5, start_time: '09:00', end_time: '17:00', is_day_off: false },
        { artist_id: artistId, day_of_week: 6, start_time: '09:00', end_time: '17:00', is_day_off: true },
      ]);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
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

        {/* Booking Type Toggle */}
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

        {/* Calendar Grid */}
        <CalendarGrid
          calendarDays={calendar.calendarDays}
          firstDayOfMonth={calendar.firstDayOfMonth}
          closedDays={calendar.closedDays}
          onDayPress={handleDayPress}
        />

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]} />
            <Text style={styles.legendText}>Unavailable</Text>
          </View>
        </View>
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
      />
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
    backgroundColor: `${colors.accent}20`,
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
});
