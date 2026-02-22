import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';

interface RescheduleAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    proposedDate: string,
    proposedStartTime: string,
    proposedEndTime: string,
    reason?: string,
  ) => Promise<void>;
  clientName?: string;
  recipientLabel?: string;
  currentDate?: string;
  currentStartTime?: string;
  currentEndTime?: string;
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function parseTime(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTimeStr(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDisplayTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

type ActivePicker = 'date' | 'startTime' | 'endTime' | null;

export function RescheduleAppointmentModal({
  visible,
  onClose,
  onSubmit,
  clientName,
  recipientLabel = 'client',
  currentDate,
  currentStartTime,
  currentEndTime,
}: RescheduleAppointmentModalProps) {
  const initialDate = currentDate ? parseDate(currentDate) : new Date();
  const initialStart = currentStartTime ? parseTime(currentStartTime) : parseTime('14:00');
  const initialEnd = currentEndTime ? parseTime(currentEndTime) : parseTime('16:00');

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  useEffect(() => {
    if (visible) {
      setSelectedDate(currentDate ? parseDate(currentDate) : new Date());
      setStartTime(currentStartTime ? parseTime(currentStartTime) : parseTime('14:00'));
      setEndTime(currentEndTime ? parseTime(currentEndTime) : parseTime('16:00'));
      setReason('');
      setActivePicker(null);
    }
  }, [visible, currentDate, currentStartTime, currentEndTime]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(
        formatDateStr(selectedDate),
        formatTimeStr(startTime),
        formatTimeStr(endTime),
        reason.trim() || undefined,
      );
      setReason('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setReason('');
    setActivePicker(null);
    onClose();
  };

  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (date) setSelectedDate(date);
  };

  const onStartChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (date) setStartTime(date);
  };

  const onEndChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (date) setEndTime(date);
  };

  // On iOS, show the picker inline at the bottom of the modal
  // On Android, the picker opens as a native dialog automatically
  const renderInlinePicker = () => {
    if (!activePicker) return null;

    if (Platform.OS === 'android') {
      const props = {
        date: { value: selectedDate, mode: 'date' as const, onChange: onDateChange, minimumDate: new Date() },
        startTime: { value: startTime, mode: 'time' as const, onChange: onStartChange, minuteInterval: 15 },
        endTime: { value: endTime, mode: 'time' as const, onChange: onEndChange, minuteInterval: 15 },
      }[activePicker];

      return (
        <DateTimePicker
          {...props}
          display="default"
        />
      );
    }

    // iOS: show spinner picker in a bottom tray
    const pickerConfig = {
      date: { value: selectedDate, mode: 'date' as const, onChange: onDateChange, minimumDate: new Date() },
      startTime: { value: startTime, mode: 'time' as const, onChange: onStartChange, minuteInterval: 15 },
      endTime: { value: endTime, mode: 'time' as const, onChange: onEndChange, minuteInterval: 15 },
    }[activePicker];

    return (
      <View style={styles.iosPickerTray}>
        <View style={styles.iosPickerHeader}>
          <Text style={styles.iosPickerTitle}>
            {activePicker === 'date' ? 'Select Date' : activePicker === 'startTime' ? 'Start Time' : 'End Time'}
          </Text>
          <TouchableOpacity onPress={() => setActivePicker(null)}>
            <Text style={styles.iosPickerDone}>Done</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          {...pickerConfig}
          display="spinner"
          themeVariant="dark"
          textColor={colors.textPrimary}
          style={styles.iosPicker}
        />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
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
                <View style={styles.header}>
                  <Text style={styles.title}>Reschedule Appointment</Text>
                  <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <Text style={styles.closeButtonText}>x</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContentInner} keyboardShouldPersistTaps="handled">
                  <Text style={styles.description}>
                    Propose a new date and time{clientName ? ` for ${clientName}` : ''}. They can accept or decline.
                  </Text>

                  <Text style={styles.fieldLabel}>New Date</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setActivePicker('date')}
                  >
                    <MaterialIcons name="event" size={18} color={colors.accent} />
                    <Text style={styles.pickerButtonText}>
                      {formatDisplayDate(selectedDate)}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.timeRow}>
                    <View style={styles.timeField}>
                      <Text style={styles.fieldLabel}>Start Time</Text>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setActivePicker('startTime')}
                      >
                        <MaterialIcons name="schedule" size={18} color={colors.accent} />
                        <Text style={styles.pickerButtonText}>
                          {formatDisplayTime(startTime)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.timeField}>
                      <Text style={styles.fieldLabel}>End Time</Text>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setActivePicker('endTime')}
                      >
                        <MaterialIcons name="schedule" size={18} color={colors.accent} />
                        <Text style={styles.pickerButtonText}>
                          {formatDisplayTime(endTime)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Reason (optional)</Text>
                  <TextInput
                    style={[styles.fieldInput, styles.reasonInput]}
                    value={reason}
                    onChangeText={setReason}
                    placeholder={`Let the ${recipientLabel} know why...`}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </ScrollView>

                {/* iOS spinner picker tray */}
                {Platform.OS === 'ios' && renderInlinePicker()}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={handleClose}
                    disabled={submitting}
                  >
                    <Text style={styles.dismissButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                      <Text style={styles.submitButtonText}>Send Reschedule</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    maxHeight: '90%',
    width: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  scrollContentInner: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 12,
  },
  pickerButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
  },

  // iOS spinner picker tray
  iosPickerTray: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iosPickerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  iosPickerDone: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
  iosPicker: {
    height: 180,
  },

  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  reasonInput: {
    minHeight: 60,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.background,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
