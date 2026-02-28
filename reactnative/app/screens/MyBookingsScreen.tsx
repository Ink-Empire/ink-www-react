import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { clientService, messageService, appointmentService } from '../../lib/services';
import type { ClientDashboardAppointment } from '@inkedin/shared/services';
import { RescheduleAppointmentModal } from '../components/Calendar/RescheduleAppointmentModal';
import { CancelAppointmentModal } from '../components/Calendar/CancelAppointmentModal';

function parseDate(dateStr: string): Date {
  // Always extract just the YYYY-MM-DD part to avoid timezone shifts
  const datePart = dateStr.substring(0, 10);
  const [y, m, d] = datePart.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDay(dateStr: string): number {
  return parseDate(dateStr).getDate();
}

function formatMonth(dateStr: string): string {
  return parseDate(dateStr).toLocaleString('en-US', { month: 'short' });
}

function formatTime(startTime?: string, endTime?: string): string {
  if (!startTime) return '';
  try {
    const today = '2000-01-01';
    const start = new Date(`${today}T${startTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
    if (endTime) {
      const end = new Date(`${today}T${endTime}`).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
      return `${start} - ${end}`;
    }
    return start;
  } catch {
    return startTime;
  }
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: colors.warningDim, text: colors.warning, label: 'Pending' },
  booked: { bg: colors.successDim, text: colors.success, label: 'Confirmed' },
  completed: { bg: colors.accentDim, text: colors.accent, label: 'Completed' },
  cancelled: { bg: 'rgba(199, 93, 93, 0.15)', text: colors.error, label: 'Cancelled' },
};

export default function MyBookingsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<ClientDashboardAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<ClientDashboardAppointment | null>(null);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    clientService.getBookings()
      .then((data: any) => {
        setBookings(data?.appointments || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const handleReschedulePress = (apt: ClientDashboardAppointment) => {
    setSelectedAppointment(apt);
    setRescheduleModalVisible(true);
  };

  const handleCancelPress = (apt: ClientDashboardAppointment) => {
    setSelectedAppointment(apt);
    setCancelModalVisible(true);
  };

  const handleCancelSubmit = async (reason?: string) => {
    if (!selectedAppointment) return;
    if (selectedAppointment.conversation_id) {
      await messageService.sendCancellation(
        selectedAppointment.conversation_id,
        selectedAppointment.id,
        reason,
      );
    } else {
      await appointmentService.cancel(selectedAppointment.id, reason);
    }
    fetchBookings();
    Alert.alert('Cancelled', 'The appointment has been cancelled.');
  };

  const handleRescheduleSubmit = async (
    proposedDate: string,
    proposedStartTime: string,
    proposedEndTime: string,
    reason?: string,
  ) => {
    if (!selectedAppointment) return;
    if (selectedAppointment.conversation_id) {
      await messageService.sendReschedule(
        selectedAppointment.conversation_id,
        selectedAppointment.id,
        proposedDate,
        proposedStartTime,
        proposedEndTime,
        reason,
      );
    } else {
      await appointmentService.update(selectedAppointment.id, {
        date: proposedDate,
        start_time: proposedStartTime,
        end_time: proposedEndTime,
      });
    }
    fetchBookings();
    Alert.alert('Rescheduled', 'The reschedule request has been sent.');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="event-available" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No Bookings</Text>
        <Text style={styles.emptySubtitle}>
          When you book an appointment with an artist, it will appear here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {bookings.map((apt) => {
        const status = STATUS_STYLES[apt.status] || STATUS_STYLES.pending;
        const isCancelled = apt.status === 'cancelled';
        const isCompleted = apt.status === 'completed';
        const showActions = !isCancelled && !isCompleted;

        return (
          <View key={apt.id} style={[styles.card, isCancelled && styles.cardMuted]}>
            <TouchableOpacity
              style={styles.cardContent}
              onPress={() => {
                if (apt.artist?.slug) {
                  navigation.push('ArtistDetail', { slug: apt.artist.slug, name: apt.artist.name });
                }
              }}
              activeOpacity={apt.artist?.slug ? 0.7 : 1}
            >
              <View style={styles.dateBadge}>
                <Text style={[styles.dateDay, isCancelled && styles.textMuted]}>{formatDay(apt.date)}</Text>
                <Text style={styles.dateMonth}>{formatMonth(apt.date)}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.title, isCancelled && styles.textMuted]}>{apt.title}</Text>
                <Text style={styles.time}>
                  <MaterialIcons name="schedule" size={12} color={colors.textMuted} />
                  {'  '}{formatTime(apt.start_time, apt.end_time)}
                </Text>
                {apt.artist?.name && (
                  <Text style={styles.artist}>{apt.artist.name}</Text>
                )}
              </View>
              <View style={styles.badges}>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                </View>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{apt.type}</Text>
                </View>
              </View>
            </TouchableOpacity>
            {showActions && (
              <View style={styles.actions}>
                {apt.artist && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      navigation.navigate('InboxStack', {
                        screen: 'Conversation',
                        params: { clientId: apt.artist!.id, participantName: apt.artist!.name },
                      });
                    }}
                  >
                    <MaterialIcons name="chat-bubble-outline" size={16} color={colors.accent} />
                    <Text style={styles.actionText}>Message</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionBorder]}
                  onPress={() => handleReschedulePress(apt)}
                >
                  <MaterialIcons name="update" size={16} color={colors.accent} />
                  <Text style={styles.actionText}>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionBorder]}
                  onPress={() => handleCancelPress(apt)}
                >
                  <MaterialIcons name="event-busy" size={16} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      <RescheduleAppointmentModal
        visible={rescheduleModalVisible}
        onClose={() => setRescheduleModalVisible(false)}
        onSubmit={handleRescheduleSubmit}
        clientName={selectedAppointment?.artist?.name}
        recipientLabel="artist"
        currentDate={selectedAppointment?.date}
        currentStartTime={selectedAppointment?.start_time}
        currentEndTime={selectedAppointment?.end_time}
      />

      <CancelAppointmentModal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        onSubmit={handleCancelSubmit}
        clientName={selectedAppointment?.artist?.name}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardMuted: {
    opacity: 0.6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  dateBadge: {
    width: 44,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 6,
  },
  dateDay: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  dateMonth: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  textMuted: {
    color: colors.textMuted,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    color: colors.textMuted,
    fontSize: 12,
  },
  artist: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  typeBadge: {
    backgroundColor: colors.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  actionBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
});
