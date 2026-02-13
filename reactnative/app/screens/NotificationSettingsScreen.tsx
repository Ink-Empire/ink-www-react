import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../lib/colors';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import type { NotificationType } from '@inkedin/shared/services';

const NOTIFICATION_LABELS: Record<NotificationType, { title: string; description: string }> = {
  new_message: {
    title: 'New Messages',
    description: 'When someone sends you a message',
  },
  booking_request: {
    title: 'Booking Requests',
    description: 'When a client requests an appointment',
  },
  booking_accepted: {
    title: 'Booking Accepted',
    description: 'When your booking is confirmed',
  },
  booking_declined: {
    title: 'Booking Declined',
    description: 'When your booking request is declined',
  },
  books_open: {
    title: 'Books Open',
    description: 'When a wishlisted artist opens their books',
  },
  beacon_request: {
    title: 'Tattoo Beacon',
    description: 'When someone nearby is looking for a tattoo',
  },
};

export default function NotificationSettingsScreen() {
  const { preferences, loading, error, togglePreference } = useNotificationPreferences();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Push Notifications</Text>
        <Text style={styles.headerSubtitle}>
          Choose which notifications you receive on your device.
        </Text>
      </View>

      {preferences.map(pref => {
        const label = NOTIFICATION_LABELS[pref.type];
        if (!label) return null;

        return (
          <View key={pref.type} style={styles.row}>
            <View style={styles.labelContainer}>
              <Text style={styles.rowTitle}>{label.title}</Text>
              <Text style={styles.rowDescription}>{label.description}</Text>
            </View>
            <Switch
              value={pref.push_enabled}
              onValueChange={(val) => togglePreference(pref.type, val)}
              trackColor={{ false: colors.border, true: colors.accentDark }}
              thumbColor={pref.push_enabled ? colors.accent : colors.textMuted}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 15,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  labelContainer: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
