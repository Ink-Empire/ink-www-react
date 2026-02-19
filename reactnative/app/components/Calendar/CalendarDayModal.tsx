/**
 * CalendarDayModal - Bottom sheet modal for day details
 *
 * Shows day contents for the artist or booking options for clients
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import {
  Appointment,
  ExternalCalendarEvent,
  BookingConfig,
  formatDateForDisplay,
} from '@inkedin/shared/types';
import type { UpcomingAppointment } from '@inkedin/shared/services';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';

interface CalendarDayModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string | null;
  bookingConfig: BookingConfig;
  artistName: string;
  appointments: Appointment[];
  externalEvents: ExternalCalendarEvent[];
  isOwnProfile?: boolean;
  ownerAppointments?: UpcomingAppointment[];
  onRequestBooking?: () => void;
  onCancelAppointment?: (apt: UpcomingAppointment) => void;
  onRescheduleAppointment?: (apt: UpcomingAppointment) => void;
  onDeleteAppointment?: (apt: UpcomingAppointment) => void;
  onContactClient?: (apt: UpcomingAppointment) => void;
}

export function CalendarDayModal({
  visible,
  onClose,
  selectedDate,
  bookingConfig,
  artistName,
  appointments,
  externalEvents,
  isOwnProfile = false,
  ownerAppointments = [],
  onRequestBooking,
  onCancelAppointment,
  onRescheduleAppointment,
  onDeleteAppointment,
  onContactClient,
}: CalendarDayModalProps) {
  if (!selectedDate) return null;

  const handleBooking = () => {
    onClose();
    onRequestBooking?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Drag Handle */}
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.dateTitle}>
                    {formatDateForDisplay(selectedDate)}
                  </Text>
                  {!isOwnProfile && (
                    <View style={styles.bookingTypeBadge}>
                      <Text style={styles.bookingTypeBadgeText}>
                        {bookingConfig.title}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>x</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollContent}>
                {/* Owner Appointments (from upcoming schedule) */}
                {isOwnProfile && ownerAppointments.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Appointments</Text>
                    {ownerAppointments.map((apt) => (
                      <View key={apt.id} style={styles.ownerEventCard}>
                        <View style={styles.ownerEventCardInner}>
                          <View style={styles.eventCardHeader}>
                            <Text style={styles.eventTitle}>{apt.title}</Text>
                            <View style={[styles.statusBadge, styles.statusBadgeBooked]}>
                              <Text style={styles.statusBadgeText}>{apt.type}</Text>
                            </View>
                          </View>
                          <Text style={styles.eventTime}>{apt.time}</Text>
                          <Text style={styles.eventClient}>{apt.clientName}</Text>
                        </View>
                        <View style={styles.eventActions}>
                          {apt.client_id && (
                            <>
                              <TouchableOpacity
                                style={styles.eventActionButton}
                                onPress={() => onContactClient?.(apt)}
                              >
                                <MaterialIcons name="chat-bubble-outline" size={14} color={colors.accent} />
                                <Text style={styles.eventActionText}>Contact</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.eventActionButton}
                                onPress={() => onRescheduleAppointment?.(apt)}
                              >
                                <MaterialIcons name="update" size={14} color={colors.accent} />
                                <Text style={styles.eventActionText}>Reschedule</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.eventActionButton}
                                onPress={() => onCancelAppointment?.(apt)}
                              >
                                <MaterialIcons name="event-busy" size={14} color={colors.error} />
                                <Text style={[styles.eventActionText, { color: colors.error }]}>Cancel</Text>
                              </TouchableOpacity>
                            </>
                          )}
                          {!apt.client_id && (
                            <TouchableOpacity
                              style={styles.eventActionButton}
                              onPress={() => onDeleteAppointment?.(apt)}
                            >
                              <MaterialIcons name="delete-outline" size={14} color={colors.error} />
                              <Text style={[styles.eventActionText, { color: colors.error }]}>Delete</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Appointments Section (from calendar hook - client view) */}
                {!isOwnProfile && appointments.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>InkedIn Appointments</Text>
                    {appointments.map((apt) => (
                      <View key={apt.id} style={styles.eventCard}>
                        <View style={styles.eventCardHeader}>
                          <Text style={styles.eventTitle}>
                            {apt.title || 'Appointment'}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              apt.status === 'booked' && styles.statusBadgeBooked,
                            ]}
                          >
                            <Text style={styles.statusBadgeText}>
                              {apt.status}
                            </Text>
                          </View>
                        </View>
                        {apt.start_time && (
                          <Text style={styles.eventTime}>{apt.start_time}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* External Events Section */}
                {externalEvents.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                      <View style={styles.googleDot} />
                      <Text style={styles.sectionTitle}>Google Calendar</Text>
                    </View>
                    {externalEvents.map((event) => (
                      <View key={event.id} style={styles.externalEventCard}>
                        <Text style={styles.eventTitle}>
                          {event.title || 'Busy'}
                        </Text>
                        <Text style={styles.eventTime}>
                          {event.all_day
                            ? 'All day'
                            : `${new Date(event.starts_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })} - ${new Date(event.ends_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}`}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* No Events Message */}
                {(isOwnProfile ? ownerAppointments.length === 0 : appointments.length === 0) && externalEvents.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      No events scheduled for this day
                    </Text>
                  </View>
                )}

                {/* Booking Info - only for clients */}
                {!isOwnProfile && (
                  <>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingDescription}>
                        {bookingConfig.modalDescription(artistName)}
                      </Text>
                      <View style={styles.bookingDetails}>
                        <View style={styles.bookingDetailItem}>
                          <Text style={styles.bookingDetailLabel}>Duration</Text>
                          <Text style={styles.bookingDetailValue}>
                            {bookingConfig.modalDuration}
                          </Text>
                        </View>
                        <View style={styles.bookingDetailItem}>
                          <Text style={styles.bookingDetailLabel}>Cost</Text>
                          <Text style={[styles.bookingDetailValue, styles.accentText]}>
                            {bookingConfig.modalCost}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Buttons - only for clients */}
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.bookButton}
                        onPress={handleBooking}
                      >
                        <Text style={styles.bookButtonText}>Request Booking</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Close button for own profile */}
                {isOwnProfile && (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                      <Text style={styles.cancelButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  dateTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  bookingTypeBadge: {
    backgroundColor: colors.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  bookingTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    textTransform: 'uppercase',
  },
  closeButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  googleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.info,
  },
  ownerEventCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  ownerEventCardInner: {
    padding: 12,
  },
  eventActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  eventActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  eventActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
  eventCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  externalEventCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: `${colors.info}33`,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
    marginBottom: 8,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  eventTime: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  eventClient: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: colors.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeBooked: {
    backgroundColor: colors.successDim,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    textTransform: 'uppercase',
  },
  emptyState: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bookingInfo: {
    marginBottom: 16,
  },
  bookingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  bookingDetails: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
  },
  bookingDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  bookingDetailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bookingDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  accentText: {
    color: colors.accent,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bookButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textOnLight,
  },
});
