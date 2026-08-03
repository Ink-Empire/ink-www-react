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
import { colors } from '../../../lib/colors';

const { width } = Dimensions.get('window');
const CELL_SIZE = Math.floor((width - 32 - 12) / 7); // Account for padding and gaps

const WEEKDAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface CalendarGridProps {
  calendarDays: CalendarDayInfo[];
  firstDayOfMonth: number;
  closedDays: number[];
  onDayPress: (date: string) => void;
  isOwnProfile?: boolean;
}

export function CalendarGrid({
  calendarDays,
  firstDayOfMonth,
  closedDays,
  onDayPress,
  isOwnProfile = false,
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
            isOwnProfile={isOwnProfile}
            onPress={() => {
              if (isOwnProfile || day.isAvailable) {
                onDayPress(day.date);
              }
            }}
          />
        ))}
      </View>
    </View>
  );
}

interface CalendarDayProps {
  day: CalendarDayInfo;
  onPress: () => void;
  isOwnProfile?: boolean;
}

function CalendarDay({ day, onPress, isOwnProfile = false }: CalendarDayProps) {
  const canPress = isOwnProfile || day.isAvailable || day.hasAppointments || day.hasExternalEvents;

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
    backgroundColor: `${colors.available}15`,
    borderWidth: 1.5,
    borderColor: colors.available,
  },
  dayCellUnavailable: {
    backgroundColor: colors.surface,
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
    backgroundColor: colors.info,
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
