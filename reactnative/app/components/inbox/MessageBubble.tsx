import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';
import type { Message } from '@inkedin/shared/types';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  status?: 'sending' | 'failed';
  onViewCalendar?: (date?: string) => void;
  onRespondToBooking?: (appointmentId: number, action: 'accept' | 'decline') => void;
  respondingToBooking?: number | null;
  onRespondToReschedule?: (messageId: number, action: 'accept' | 'decline') => void;
  respondingToReschedule?: number | null;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function MessageBubble({ message, isSent, status, onViewCalendar, onRespondToBooking, respondingToBooking, onRespondToReschedule, respondingToReschedule }: MessageBubbleProps) {
  if (message.type === 'system') {
    const calendarLink = message.metadata?.calendar_link;
    const isArtist = isSent;
    const displayContent = isArtist && message.metadata?.artist_content
      ? message.metadata.artist_content
      : message.content;
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{displayContent}</Text>
        {isArtist && calendarLink && onViewCalendar && (
          <Text style={styles.calendarLink} onPress={onViewCalendar}>
            View calendar
          </Text>
        )}
      </View>
    );
  }

  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasText = !!message.content;
  const hasBookingCard = message.type === 'booking_card' && message.metadata;
  const hasCancellation = message.type === 'cancellation' && message.metadata;
  const hasReschedule = message.type === 'reschedule' && message.metadata;

  return (
    <View style={[styles.container, isSent ? styles.containerSent : styles.containerReceived]}>
      {/* Text bubble - hide for booking_card, cancellation, reschedule */}
      {hasText && !hasBookingCard && !hasCancellation && !hasReschedule && (
        <View style={[
          styles.bubble,
          isSent ? styles.bubbleSent : styles.bubbleReceived,
          status === 'sending' && styles.bubbleSending,
        ]}>
          <Text style={[styles.text, isSent ? styles.textSent : styles.textReceived]}>
            {message.content}
          </Text>
        </View>
      )}

      {/* Image attachments */}
      {hasAttachments && (
        <View style={[
          styles.bubble,
          isSent ? styles.bubbleSent : styles.bubbleReceived,
          status === 'sending' && styles.bubbleSending,
        ]}>
          <View style={styles.attachmentsContainer}>
            {message.attachments.map((attachment) =>
              attachment.image ? (
                <Image
                  key={attachment.id}
                  source={{ uri: attachment.image.uri }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              ) : null
            )}
          </View>
        </View>
      )}

      {/* Booking card */}
      {hasBookingCard && message.metadata && (
        <View style={styles.bookingCard}>
          <View style={styles.bookingCardHeader}>
            <Text style={styles.bookingCardTitle}>Booking Request</Text>
            {message.metadata.status === 'pending' && (
              <View style={[styles.statusBadge, styles.pendingBadge]}>
                <Text style={[styles.statusBadgeText, styles.pendingBadgeText]}>PENDING</Text>
              </View>
            )}
            {message.metadata.status === 'accepted' && (
              <View style={[styles.statusBadge, styles.acceptedBadge]}>
                <Text style={[styles.statusBadgeText, styles.acceptedBadgeText]}>CONFIRMED</Text>
              </View>
            )}
            {message.metadata.status === 'declined' && (
              <View style={[styles.statusBadge, styles.declinedBadge]}>
                <Text style={[styles.statusBadgeText, styles.declinedBadgeText]}>DECLINED</Text>
              </View>
            )}
          </View>
          {[
            { label: 'Date', value: message.metadata.date },
            { label: 'Time', value: message.metadata.time },
            { label: 'Duration', value: message.metadata.duration },
            { label: 'Deposit', value: message.metadata.deposit },
          ].map(({ label, value }) =>
            value ? (
              <View key={label} style={styles.bookingCardRow}>
                <Text style={styles.bookingCardLabel}>{label}</Text>
                <Text style={styles.bookingCardValue}>{value}</Text>
              </View>
            ) : null
          )}
          {message.content ? (
            <View style={styles.bookingCardMessageContainer}>
              <Text style={styles.bookingCardMessage}>{message.content}</Text>
            </View>
          ) : null}
          {message.metadata.status === 'accepted' && onViewCalendar && (
            <TouchableOpacity style={styles.viewCalendarRow} onPress={() => onViewCalendar(extractDateFromBooking(message.metadata!.date))}>
              <MaterialIcons name="event" size={16} color={colors.accent} />
              <Text style={styles.viewCalendarText}>View in Calendar</Text>
            </TouchableOpacity>
          )}
          {/* Accept/Decline for artist on pending booking */}
          {message.metadata.status === 'pending' && !isSent && onRespondToBooking && message.metadata.appointment_id && (
            <View style={styles.bookingCardActions}>
              <TouchableOpacity
                style={styles.bookingDeclineButton}
                onPress={() => onRespondToBooking(message.metadata!.appointment_id, 'decline')}
                disabled={respondingToBooking === message.metadata.appointment_id}
              >
                {respondingToBooking === message.metadata.appointment_id ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <Text style={styles.bookingDeclineText}>Decline</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bookingAcceptButton, respondingToBooking === message.metadata.appointment_id && styles.buttonDisabled]}
                onPress={() => onRespondToBooking(message.metadata!.appointment_id, 'accept')}
                disabled={respondingToBooking === message.metadata.appointment_id}
              >
                {respondingToBooking === message.metadata.appointment_id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.bookingAcceptText}>Accept</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Cancellation card */}
      {hasCancellation && message.metadata && (
        <View style={styles.cancellationCard}>
          <View style={styles.bookingCardHeader}>
            <Text style={styles.cancellationTitle}>Appointment Cancelled</Text>
            <View style={styles.cancellationBadge}>
              <Text style={styles.cancellationBadgeText}>CANCELLED</Text>
            </View>
          </View>
          {message.metadata.date && (
            <View style={styles.rescheduleDetailColumn}>
              <Text style={styles.bookingCardLabel}>Date</Text>
              <Text style={styles.bookingCardValue}>
                {formatProposedDate(message.metadata.date)}
              </Text>
            </View>
          )}
          {(message.metadata.start_time || message.metadata.end_time) && (
            <View style={styles.rescheduleDetailColumn}>
              <Text style={styles.bookingCardLabel}>Time</Text>
              <Text style={styles.bookingCardValue}>
                {formatProposedTime(message.metadata.start_time, message.metadata.end_time)}
              </Text>
            </View>
          )}
          {message.metadata.title ? (
            <View style={styles.rescheduleDetailColumn}>
              <Text style={styles.bookingCardLabel}>Type</Text>
              <Text style={styles.bookingCardValue}>{message.metadata.title}</Text>
            </View>
          ) : null}
          {message.metadata.reason ? (
            <Text style={styles.cancellationReason}>{message.metadata.reason}</Text>
          ) : null}
        </View>
      )}

      {/* Reschedule card */}
      {hasReschedule && message.metadata && (
        <View style={[
          styles.rescheduleCard,
          message.metadata.status === 'accepted' && styles.rescheduleAccepted,
          message.metadata.status === 'declined' && styles.rescheduleDeclined,
        ]}>
          <View style={styles.bookingCardHeader}>
            <Text style={styles.rescheduleTitle}>Reschedule Request</Text>
            {message.metadata.status === 'accepted' && (
              <View style={[styles.statusBadge, styles.acceptedBadge]}>
                <Text style={[styles.statusBadgeText, styles.acceptedBadgeText]}>ACCEPTED</Text>
              </View>
            )}
            {message.metadata.status === 'declined' && (
              <View style={[styles.statusBadge, styles.declinedBadge]}>
                <Text style={[styles.statusBadgeText, styles.declinedBadgeText]}>DECLINED</Text>
              </View>
            )}
            {message.metadata.status === 'pending' && (
              <View style={[styles.statusBadge, styles.pendingBadge]}>
                <Text style={[styles.statusBadgeText, styles.pendingBadgeText]}>PENDING</Text>
              </View>
            )}
          </View>
          {message.metadata.proposed_date && (
            <View style={styles.rescheduleDetailColumn}>
              <Text style={styles.bookingCardLabel}>Proposed Date</Text>
              <Text style={styles.bookingCardValue}>
                {formatProposedDate(message.metadata.proposed_date)}
              </Text>
            </View>
          )}
          {(message.metadata.proposed_start_time || message.metadata.proposed_end_time) && (
            <View style={styles.rescheduleDetailColumn}>
              <Text style={styles.bookingCardLabel}>Proposed Time</Text>
              <Text style={styles.bookingCardValue}>
                {formatProposedTime(message.metadata.proposed_start_time, message.metadata.proposed_end_time)}
              </Text>
            </View>
          )}
          {message.metadata.reason ? (
            <Text style={styles.rescheduleReason}>{message.metadata.reason}</Text>
          ) : null}
          {message.metadata.status === 'accepted' && onViewCalendar && (
            <TouchableOpacity style={styles.viewCalendarRow} onPress={() => onViewCalendar(message.metadata!.proposed_date)}>
              <MaterialIcons name="event" size={16} color={colors.accent} />
              <Text style={styles.viewCalendarText}>View in Calendar</Text>
            </TouchableOpacity>
          )}
          {message.metadata.status === 'pending' && !isSent && onRespondToReschedule && (
            <View style={styles.bookingCardActions}>
              <TouchableOpacity
                style={styles.bookingDeclineButton}
                onPress={() => onRespondToReschedule(message.id, 'decline')}
                disabled={respondingToReschedule === message.id}
              >
                {respondingToReschedule === message.id ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <Text style={styles.bookingDeclineText}>Decline</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bookingAcceptButton, respondingToReschedule === message.id && styles.buttonDisabled]}
                onPress={() => onRespondToReschedule(message.id, 'accept')}
                disabled={respondingToReschedule === message.id}
              >
                {respondingToReschedule === message.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.bookingAcceptText}>Accept</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {status === 'sending' && (
        <Text style={[styles.statusText, styles.timestampSent]}>Sending...</Text>
      )}
      {status === 'failed' && (
        <Text style={[styles.statusText, styles.statusFailed, styles.timestampSent]}>
          Failed to send
        </Text>
      )}
      {!status && (
        <Text style={[styles.timestamp, isSent ? styles.timestampSent : styles.timestampReceived]}>
          {formatTime(message.created_at)}
        </Text>
      )}
    </View>
  );
}

function extractDateFromBooking(displayDate?: string): string | undefined {
  if (!displayDate) return undefined;
  try {
    const d = new Date(displayDate);
    if (isNaN(d.getTime())) return undefined;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return undefined;
  }
}

function formatProposedDate(date?: string): string {
  if (!date) return '';
  try {
    const dateObj = new Date(`${date}T00:00`);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch {
    return date;
  }
}

function formatProposedTime(startTime?: string, endTime?: string): string {
  if (!startTime) return '';
  try {
    const today = new Date().toISOString().split('T')[0];
    const start = new Date(`${today}T${startTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (endTime) {
      const end = new Date(`${today}T${endTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${start} - ${end}`;
    }
    return start;
  } catch {
    return startTime;
  }
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 16,
    maxWidth: '80%',
  },
  containerSent: {
    alignSelf: 'flex-end',
  },
  containerReceived: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  bubbleSent: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: colors.surfaceElevated,
    borderBottomLeftRadius: 4,
  },
  attachmentsContainer: {
    gap: 2,
  },
  attachmentImage: {
    width: 240,
    height: 180,
    borderRadius: 0,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textSent: {
    color: colors.background,
  },
  textReceived: {
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
    marginBottom: 4,
  },
  timestampSent: {
    textAlign: 'right',
    marginRight: 4,
  },
  timestampReceived: {
    textAlign: 'left',
    marginLeft: 4,
  },
  bubbleSending: {
    opacity: 0.7,
  },
  statusText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  statusFailed: {
    color: colors.error,
    fontStyle: 'normal',
  },
  systemContainer: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  systemText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  calendarLink: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  // Booking card
  bookingCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    minWidth: 260,
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bookingCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingCardLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bookingCardValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'right',
    flexShrink: 1,
  },
  bookingCardMessageContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
    paddingTop: 8,
  },
  bookingCardMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  bookingCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bookingDeclineButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  bookingDeclineText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bookingAcceptButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignItems: 'center',
  },
  bookingAcceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Cancellation card
  cancellationCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    minWidth: 260,
  },
  cancellationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 8,
  },
  cancellationReason: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  cancellationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 6,
  },
  cancellationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.error,
  },
  // Reschedule card
  rescheduleCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    minWidth: 260,
  },
  rescheduleAccepted: {
    borderColor: 'rgba(74, 155, 127, 0.3)',
  },
  rescheduleDeclined: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  rescheduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rescheduleDetailColumn: {
    marginBottom: 8,
  },
  rescheduleReason: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  acceptedBadge: {
    backgroundColor: 'rgba(74, 155, 127, 0.12)',
  },
  acceptedBadgeText: {
    color: colors.success,
  },
  declinedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  declinedBadgeText: {
    color: colors.error,
  },
  pendingBadge: {
    backgroundColor: `${colors.accent}18`,
  },
  pendingBadgeText: {
    color: colors.accent,
  },
  viewCalendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewCalendarText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
});
