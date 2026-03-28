import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { appointmentService } from '../../lib/services';
import { clearCalendarCache } from '../../lib/calendarCache';

function parseDate(dateStr: string): Date {
  const datePart = dateStr.substring(0, 10);
  const [y, m, d] = datePart.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplayDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(isoTime?: string | null): string {
  if (!isoTime) return '';
  // Handle both HH:MM:SS and ISO datetime (2026-03-28T14:00)
  const timePart = isoTime.includes('T') ? isoTime.split('T')[1] : isoTime;
  try {
    const d = new Date(`2000-01-01T${timePart}`);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return timePart;
  }
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: colors.warningDim, text: colors.warning, label: 'Pending' },
  booked: { bg: colors.successDim, text: colors.success, label: 'Confirmed' },
  completed: { bg: colors.accentDim, text: colors.accent, label: 'Completed' },
  cancelled: { bg: colors.tagDim, text: colors.error, label: 'Cancelled' },
};

export default function EditAppointmentScreen({ route, navigation }: any) {
  const { appointmentId, appointment } = route.params;

  const [price, setPrice] = useState(
    appointment?.price != null ? String(Number(appointment.price)) : ''
  );
  const [durationMinutes, setDurationMinutes] = useState(
    appointment?.duration_minutes != null ? String(appointment.duration_minutes) : ''
  );
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [saving, setSaving] = useState(false);
  const isDerived = appointment?.is_derived === true;

  const status = STATUS_STYLES[appointment?.status] || STATUS_STYLES.pending;
  const clientName = appointment?.extendedProps?.clientName || '';
  const dateStr = typeof appointment?.date === 'string' ? appointment.date : '';
  const startTime = appointment?.start || appointment?.start_time;
  const endTime = appointment?.end || appointment?.end_time;

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Record<string, any> = {};
      if (price !== '') {
        data.price = parseFloat(price);
      } else {
        data.price = null;
      }
      if (durationMinutes !== '') {
        data.duration_minutes = parseInt(durationMinutes, 10);
      } else {
        data.duration_minutes = null;
      }
      data.notes = notes || null;

      await appointmentService.update(appointmentId, data);
      clearCalendarCache();
      Alert.alert('Saved', 'Appointment details updated.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Appointment header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={2}>{appointment?.title || 'Appointment'}</Text>
          {dateStr ? (
            <Text style={styles.headerDate}>{formatDisplayDate(dateStr)}</Text>
          ) : null}
          {(startTime || endTime) && (
            <View style={styles.headerTimeRow}>
              <MaterialIcons name="schedule" size={14} color={colors.textMuted} />
              <Text style={styles.headerTime}>
                {formatTime(startTime)}{endTime ? ` - ${formatTime(endTime)}` : ''}
              </Text>
            </View>
          )}
          {clientName ? (
            <View style={styles.headerTimeRow}>
              <MaterialIcons name="person-outline" size={14} color={colors.textMuted} />
              <Text style={styles.headerClient}>{clientName}</Text>
            </View>
          ) : null}
          <View style={[styles.statusBadge, { backgroundColor: status.bg, alignSelf: 'flex-start', marginTop: 8 }]}>
            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>

        {/* Editable fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>

          <Text style={styles.label}>Total Price ($){isDerived ? ' *' : ''}</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Duration (minutes){isDerived ? ' *' : ''}</Text>
          <TextInput
            style={styles.input}
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
          />

          {isDerived && (
            <Text style={styles.derivedHint}>* Estimated from calendar time and your hourly rate. </Text>
          )}

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add private notes about this appointment..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.noteHint}>Only visible to you</Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerDate: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  headerTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  headerTime: {
    color: colors.textMuted,
    fontSize: 13,
  },
  headerClient: {
    color: colors.textSecondary,
    fontSize: 13,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 10,
  },
  noteHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  derivedHint: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
});
