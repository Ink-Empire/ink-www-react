/**
 * CalendarGrid - Calendar grid component for React Native
 *
 * Displays the month calendar with proper touch targets
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { CalendarDayInfo } from '@inkedin/shared/types';

const { width } = Dimensions.get('window');
const CELL_SIZE = Math.floor((width - 32 - 12) / 7); // Account for padding and gaps

// Color palette matching the web app
const colors = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  border: '#2A2A2A',
  textPrimary: '#E8E8E8',
  textSecondary: '#888888',
  accent: '#C9A962',
  success: '#4CAF50',
  googleBlue: '#4285F4',
};

const WEEKDAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface CalendarGridProps {
  calendarDays: CalendarDayInfo[];
  firstDayOfMonth: number;
  closedDays: number[];
  onDayPress: (date: string) => void;
}

export function CalendarGrid({
  calendarDays,
  firstDayOfMonth,
  closedDays,
  onDayPress,
}: CalendarGridProps) {
  // Create padding days for the start of the month
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => ({
    isPadding: true,
    key: `padding-${i}`,
  }));

  return (
    <View style={styles.container}>
      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_NAMES.map((day, index) => (
          <View key={day + index} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                closedDays.includes(index) && styles.weekdayTextClosed,
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {/* Padding days */}
        {paddingDays.map((day) => (
          <View key={day.key} style={styles.dayCell}>
            <View style={styles.dayCellInner} />
          </View>
        ))}

        {/* Actual days */}
        {calendarDays.map((day) => (
          <CalendarDay
            key={day.date}
            day={day}
            onPress={() => day.isAvailable && onDayPress(day.date)}
          />
        ))}
      </View>
    </View>
  );
}

interface CalendarDayProps {
  day: CalendarDayInfo;
  onPress: () => void;
}

function CalendarDay({ day, onPress }: CalendarDayProps) {
  const canPress = day.isAvailable || day.hasAppointments || day.hasExternalEvents;

  const getCellStyle = () => {
    if (day.isClosed) {
      return styles.dayCellClosed;
    }
    if (day.isAvailable) {
      return styles.dayCellAvailable;
    }
    return styles.dayCellUnavailable;
  };

  return (
    <View style={styles.dayCell}>
      <TouchableOpacity
        style={[
          styles.dayCellInner,
          getCellStyle(),
          day.isToday && styles.dayCellToday,
        ]}
        onPress={onPress}
        disabled={!canPress}
        activeOpacity={canPress ? 0.7 : 1}
      >
        <Text
          style={[
            styles.dayText,
            day.isClosed && styles.dayTextClosed,
            day.isAvailable && styles.dayTextAvailable,
            day.isPast && styles.dayTextPast,
          ]}
        >
          {day.dayOfMonth}
        </Text>

        {/* Today indicator */}
        {day.isToday && <View style={styles.todayDot} />}

        {/* External event indicator */}
        {day.hasExternalEvents && !day.isClosed && (
          <View style={styles.externalEventDot} />
        )}

        {/* Appointment indicator */}
        {day.hasAppointments && !day.isClosed && (
          <View style={styles.appointmentDot} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  weekdayTextClosed: {
    color: colors.textSecondary,
    opacity: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  dayCellInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  dayCellAvailable: {
    backgroundColor: `${colors.accent}15`,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  dayCellUnavailable: {
    backgroundColor: colors.background,
  },
  dayCellClosed: {
    backgroundColor: colors.background,
    opacity: 0.5,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dayTextAvailable: {
    color: colors.textPrimary,
  },
  dayTextClosed: {
    color: colors.textSecondary,
    opacity: 0.5,
  },
  dayTextPast: {
    color: colors.textSecondary,
    opacity: 0.5,
  },
  todayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textSecondary,
  },
  externalEventDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.googleBlue,
  },
  appointmentDot: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
});
