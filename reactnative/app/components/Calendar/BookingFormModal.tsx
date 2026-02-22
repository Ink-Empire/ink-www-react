import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  formatDateForDisplay,
  formatTimeForDisplay,
} from '@inkedin/shared/types';
import type { AvailableSlotsResponse } from '@inkedin/shared/services';
import { colors } from '../../../lib/colors';
import { appointmentService } from '../../../lib/services';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';

interface BookingFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (conversationId: number) => void;
  artistId: number;
  artistName: string;
  selectedDate: string | null;
  bookingType: 'consultation' | 'appointment';
}

export function BookingFormModal({
  visible,
  onClose,
  onSuccess,
  artistId,
  artistName,
  selectedDate,
  bookingType,
}: BookingFormModalProps) {
  const { user, isAuthenticated } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsResponse, setSlotsResponse] = useState<AvailableSlotsResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible || !selectedDate || !artistId) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSlots([]);
      setSelectedSlot(null);
      try {
        const response = await appointmentService.getAvailableSlots(
          artistId,
          selectedDate,
          bookingType,
        );
        const data = (response as any)?.data ?? response;
        setSlotsResponse(data);
        setSlots(data.slots || []);
      } catch (error) {
        console.error('Failed to fetch available slots:', error);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [visible, selectedDate, artistId, bookingType]);

  const handleSubmit = async () => {
    if (!selectedSlot || !selectedDate || !user) return;

    setSubmitting(true);
    try {
      const finalType = bookingType === 'consultation' ? 'consultation' : 'tattoo';

      // Compute end_time: consultation uses consultation_duration, tattoo defaults to 3 hours
      const [h, m] = selectedSlot.split(':').map(Number);
      let endTime: string;
      if (finalType === 'consultation' && slotsResponse?.consultation_duration) {
        const total = h * 60 + m + slotsResponse.consultation_duration;
        endTime = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
      } else {
        const total = h * 60 + m + 180;
        endTime = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
      }

      const data: any = {
        artist_id: artistId,
        title: `Tattoo ${finalType === 'consultation' ? 'Consultation' : 'Appointment'}`,
        start_time: selectedSlot,
        end_time: endTime,
        date: selectedDate,
        all_day: false,
        description: notes || '',
        type: finalType,
        client_id: user.id,
      };

      const rawResponse = await appointmentService.create(data) as any;
      const response = rawResponse?.data ?? rawResponse;
      const conversationId = response?.conversation_id;
      if (conversationId && onSuccess) {
        onClose();
        setTimeout(() => onSuccess(conversationId), 100);
      } else {
        onClose();
        showSnackbar(`Your ${bookingType} request has been sent!`, 'success');
      }
    } catch (error) {
      console.error('Failed to create appointment:', error);
      showSnackbar('Failed to send booking request. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSlots([]);
    setSlotsResponse(null);
    setSelectedSlot(null);
    setNotes('');
    onClose();
  };

  if (!selectedDate) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.dateTitle}>
                    {formatDateForDisplay(selectedDate)}
                  </Text>
                  <View style={styles.bookingTypeBadge}>
                    <Text style={styles.bookingTypeBadgeText}>
                      {bookingType}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <Text style={styles.closeButtonText}>x</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentInner} keyboardShouldPersistTaps="handled">
                {!isAuthenticated ? (
                  <View style={styles.loginPrompt}>
                    <Text style={styles.loginPromptTitle}>Account Required</Text>
                    <Text style={styles.loginPromptText}>
                      Please log in or create an account to book with this artist.
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Consultation window info */}
                    {slotsResponse?.consultation_window && bookingType === 'consultation' && (
                      <View style={styles.windowInfo}>
                        <Text style={styles.windowInfoText}>
                          Consultation window: {slotsResponse.consultation_window.start} - {slotsResponse.consultation_window.end}
                        </Text>
                      </View>
                    )}

                    {/* Deposit info */}
                    {bookingType === 'appointment' && slotsResponse?.deposit_amount && (
                      <View style={styles.depositInfo}>
                        <Text style={styles.depositInfoLabel}>Deposit Required</Text>
                        <Text style={styles.depositInfoAmount}>
                          ${slotsResponse.deposit_amount}
                        </Text>
                        <Text style={styles.depositInfoNote}>
                          Applied toward your final total
                        </Text>
                      </View>
                    )}

                    {/* Consultation fee */}
                    {bookingType === 'consultation' && slotsResponse?.consultation_fee && (
                      <View style={styles.depositInfo}>
                        <Text style={styles.depositInfoLabel}>Consultation Fee</Text>
                        <Text style={styles.depositInfoAmount}>
                          ${slotsResponse.consultation_fee}
                        </Text>
                      </View>
                    )}

                    {/* Time Slots */}
                    <Text style={styles.sectionTitle}>Select a Time</Text>

                    {loadingSlots ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={colors.accent} />
                      </View>
                    ) : slots.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                          No available times for this date
                        </Text>
                      </View>
                    ) : (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.slotsContainer}
                        contentContainerStyle={styles.slotsContent}
                      >
                        {slots.map((slot) => (
                          <TouchableOpacity
                            key={slot}
                            style={[
                              styles.slotPill,
                              selectedSlot === slot && styles.slotPillActive,
                            ]}
                            onPress={() => setSelectedSlot(slot)}
                          >
                            <Text
                              style={[
                                styles.slotPillText,
                                selectedSlot === slot && styles.slotPillTextActive,
                              ]}
                            >
                              {formatTimeForDisplay(slot)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    {/* Notes */}
                    {slots.length > 0 && (
                      <>
                        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                          Notes for the artist
                        </Text>
                        <TextInput
                          style={styles.notesInput}
                          placeholder="Describe what you're interested in..."
                          placeholderTextColor={colors.textMuted}
                          value={notes}
                          onChangeText={setNotes}
                          multiline
                          numberOfLines={3}
                          textAlignVertical="top"
                        />
                      </>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      {slots.length > 0 && (
                        <TouchableOpacity
                          style={[
                            styles.submitButton,
                            (!selectedSlot || submitting) && styles.submitButtonDisabled,
                          ]}
                          onPress={handleSubmit}
                          disabled={!selectedSlot || submitting}
                        >
                          <Text style={styles.submitButtonText}>
                            {submitting ? 'Sending...' : 'Request Booking'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoid: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    maxHeight: '80%',
    width: '90%',
    overflow: 'hidden',
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
    paddingTop: 20,
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
  },
  scrollContentInner: {
    paddingBottom: 20,
  },
  loginPrompt: {
    padding: 20,
    alignItems: 'center',
  },
  loginPromptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  depositInfo: {
    backgroundColor: colors.accentDim,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  depositInfoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  depositInfoAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.accent,
  },
  depositInfoNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  windowInfo: {
    backgroundColor: colors.accentDim,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  windowInfoText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
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
  slotsContainer: {
    marginBottom: 4,
  },
  slotsContent: {
    gap: 8,
    paddingBottom: 4,
  },
  slotPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  slotPillActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  slotPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  slotPillTextActive: {
    color: colors.accent,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 80,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    marginTop: 8,
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
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textOnLight,
  },
});
