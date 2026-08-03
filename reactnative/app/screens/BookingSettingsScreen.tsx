import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { artistService } from '../../lib/services';
import { useAuth } from '../contexts/AuthContext';
import WorkingHoursEditor from '../components/BookingSettings/WorkingHoursEditor';
import type { WorkingHour } from '@inkedin/shared/types';

interface ArtistSettings {
  books_open: boolean;
  accepts_appointments: boolean;
  accepts_consultations: boolean;
  accepts_walk_ins: boolean;
  accepts_deposits: boolean;
  deposit_amount: number | string;
  consultation_duration: number | string;
  consultation_fee: number | string;
  hourly_rate: number | string;
  minimum_session: number | string;
}

const DURATION_OPTIONS = [15, 30, 45, 60];

const TIME_FORMAT: Record<string, string> = {
  '06:00': '6:00 AM', '06:30': '6:30 AM', '07:00': '7:00 AM', '07:30': '7:30 AM',
  '08:00': '8:00 AM', '08:30': '8:30 AM', '09:00': '9:00 AM', '09:30': '9:30 AM',
  '10:00': '10:00 AM', '10:30': '10:30 AM', '11:00': '11:00 AM', '11:30': '11:30 AM',
  '12:00': '12:00 PM', '12:30': '12:30 PM', '13:00': '1:00 PM', '13:30': '1:30 PM',
  '14:00': '2:00 PM', '14:30': '2:30 PM', '15:00': '3:00 PM', '15:30': '3:30 PM',
  '16:00': '4:00 PM', '16:30': '4:30 PM', '17:00': '5:00 PM', '17:30': '5:30 PM',
  '18:00': '6:00 PM', '18:30': '6:30 PM', '19:00': '7:00 PM', '19:30': '7:30 PM',
  '20:00': '8:00 PM', '20:30': '8:30 PM', '21:00': '9:00 PM', '21:30': '9:30 PM',
  '22:00': '10:00 PM', '22:30': '10:30 PM', '23:00': '11:00 PM',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatTime = (time: string): string => {
  if (!time) return '';
  const short = time.substring(0, 5);
  return TIME_FORMAT[short] || short;
};

export default function BookingSettingsScreen() {
  const { user } = useAuth();
  const artistId = (user as any)?.id;

  const [settings, setSettings] = useState<ArtistSettings>({
    books_open: false,
    accepts_appointments: false,
    accepts_consultations: false,
    accepts_walk_ins: false,
    accepts_deposits: false,
    deposit_amount: '',
    consultation_duration: '30',
    consultation_fee: '',
    hourly_rate: '',
    minimum_session: '',
  });
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoursEditorVisible, setHoursEditorVisible] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [depositText, setDepositText] = useState('');
  const [consultFeeText, setConsultFeeText] = useState('');
  const [hourlyRateText, setHourlyRateText] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!artistId) return;
    try {
      setLoading(true);
      setError(null);
      const [settingsRes, hoursRes] = await Promise.all([
        artistService.getSettings(artistId),
        artistService.getWorkingHours(artistId),
      ]);

      const data = settingsRes?.data || settingsRes;
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
        setDepositText(String(data.deposit_amount || ''));
        setConsultFeeText(String(data.consultation_fee || ''));
        setHourlyRateText(String(data.hourly_rate || ''));
        setSelectedDuration(Number(data.consultation_duration) || 30);
      }

      const hours = Array.isArray(hoursRes) ? hoursRes : (hoursRes as any)?.data || [];
      setWorkingHours(hours);
    } catch (err: any) {
      console.error('Error fetching booking settings:', err);
      setError('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, [artistId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSetting = async (key: string, value: any) => {
    const prev = { ...settings };

    // When disabling books, also turn off appointments and consultations
    const payload: Record<string, any> = { [key]: value };
    if (key === 'books_open' && !value) {
      payload.accepts_appointments = false;
      payload.accepts_consultations = false;
    }

    setSettings(s => ({ ...s, ...payload }));

    try {
      const response = await artistService.updateSettings(artistId, payload);
      const updated = response?.data || response;
      if (updated) {
        setSettings(s => ({ ...s, ...updated }));
      }
    } catch (err: any) {
      setSettings(prev);
      if (err?.status === 422 && err?.data?.requires_availability) {
        Alert.alert(
          'Working Hours Required',
          'Please set your working hours before opening your books.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Set Hours', onPress: () => setHoursEditorVisible(true) },
          ],
        );
      } else {
        Alert.alert('Error', 'Failed to update setting. Please try again.');
      }
    }
  };

  const showSavedFlash = (label: string) => {
    setSavedFlash(label);
    setTimeout(() => setSavedFlash(null), 1500);
  };

  const saveRateField = async (key: string, rawValue: string) => {
    const val = parseFloat(rawValue) || 0;
    try {
      const response = await artistService.updateSettings(artistId, { [key]: val });
      const updated = response?.data || response;
      if (updated) setSettings(s => ({ ...s, ...updated }));
      showSavedFlash(key);
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  };

  const handleDurationSelect = async (minutes: number) => {
    setSelectedDuration(minutes);
    try {
      const response = await artistService.updateSettings(artistId, { consultation_duration: minutes });
      const updated = response?.data || response;
      if (updated) setSettings(s => ({ ...s, ...updated }));
      showSavedFlash('consultation_duration');
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  };

  const handleSaveHours = async (hours: WorkingHour[]) => {
    setSavingHours(true);
    try {
      await artistService.setWorkingHours(artistId, hours);
      const hoursRes = await artistService.getWorkingHours(artistId);
      const updatedHours = Array.isArray(hoursRes) ? hoursRes : (hoursRes as any)?.data || [];
      setWorkingHours(updatedHours);
      setHoursEditorVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to save working hours. Please try again.');
    } finally {
      setSavingHours(false);
    }
  };

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
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasHours = Array.isArray(workingHours) && workingHours.length > 0;
  return (
    <>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Booking Preferences */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Booking Preferences</Text>
          <Text style={styles.sectionSubtitle}>Configure what types of bookings you offer</Text>
        </View>

        <ToggleRow
          title="Books Open"
          description="Accept new tattoo appointments and bookings"
          value={!!settings.books_open}
          onToggle={(val) => updateSetting('books_open', val)}
        />
        <ToggleRow
          title="Scheduled Appointments"
          description="Allow clients to book scheduled appointments"
          value={!!settings.accepts_appointments}
          onToggle={(val) => updateSetting('accepts_appointments', val)}
        />
        <ToggleRow
          title="Consultations"
          description="Offer consultation sessions for tattoo planning"
          value={!!settings.accepts_consultations}
          onToggle={(val) => updateSetting('accepts_consultations', val)}
        />
        <ToggleRow
          title="Walk-ins"
          description="Accept walk-in clients without appointments"
          value={!!settings.accepts_walk_ins}
          onToggle={(val) => updateSetting('accepts_walk_ins', val)}
        />

        {/* Rates & Duration */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rates & Duration</Text>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputLabel}>
            <Text style={styles.inputTitle}>Deposit Amount</Text>
            <Text style={styles.inputDescription}>Required deposit for bookings (USD)</Text>
          </View>
          <View style={styles.inputRight}>
            {savedFlash === 'deposit_amount' && <Text style={styles.savedFlash}>Saved</Text>}
            <View style={styles.currencyInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.textInput}
                value={depositText}
                onChangeText={setDepositText}
                onBlur={() => saveRateField('deposit_amount', depositText)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputLabel}>
            <Text style={styles.inputTitle}>Consultation Fee</Text>
            <Text style={styles.inputDescription}>Fee per consultation session (USD)</Text>
          </View>
          <View style={styles.inputRight}>
            {savedFlash === 'consultation_fee' && <Text style={styles.savedFlash}>Saved</Text>}
            <View style={styles.currencyInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.textInput}
                value={consultFeeText}
                onChangeText={setConsultFeeText}
                onBlur={() => saveRateField('consultation_fee', consultFeeText)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputLabel}>
            <Text style={styles.inputTitle}>Hourly Rate</Text>
            <Text style={styles.inputDescription}>Your rate per hour (USD)</Text>
          </View>
          <View style={styles.inputRight}>
            {savedFlash === 'hourly_rate' && <Text style={styles.savedFlash}>Saved</Text>}
            <View style={styles.currencyInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.textInput}
                value={hourlyRateText}
                onChangeText={setHourlyRateText}
                onBlur={() => saveRateField('hourly_rate', hourlyRateText)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        <View style={styles.durationRow}>
          <View style={styles.durationHeader}>
            <View style={styles.inputLabel}>
              <Text style={styles.inputTitle}>Consultation Duration</Text>
              <Text style={styles.inputDescription}>Default length of consultations</Text>
            </View>
            {savedFlash === 'consultation_duration' && <Text style={styles.savedFlash}>Saved</Text>}
          </View>
          <View style={styles.durationOptions}>
            {DURATION_OPTIONS.map(min => (
              <TouchableOpacity
                key={min}
                style={[styles.durationChip, selectedDuration === min && styles.durationChipActive]}
                onPress={() => handleDurationSelect(min)}
              >
                <Text style={[styles.durationChipText, selectedDuration === min && styles.durationChipTextActive]}>
                  {min} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Working Hours */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Working Hours</Text>
          <Text style={styles.sectionSubtitle}>Your default weekly availability</Text>
        </View>

        {hasHours ? (
          <View style={styles.hoursDisplay}>
            {workingHours.map((day, index) => {
              const isDayOff = day.is_day_off ||
                (day.start_time === '00:00:00' && day.end_time === '00:00:00');

              return (
                <View key={index} style={[styles.hoursDayRow, isDayOff && styles.hoursDayRowOff]}>
                  <View style={styles.hoursDayLeft}>
                    <View style={[styles.statusDot, isDayOff ? styles.statusDotOff : styles.statusDotOn]} />
                    <Text style={[styles.hoursDayName, isDayOff && styles.hoursDayNameOff]}>
                      {DAY_NAMES[day.day_of_week ?? index]}
                    </Text>
                  </View>
                  <View style={styles.hoursDayRight}>
                    {isDayOff ? (
                      <Text style={styles.dayOffText}>Day Off</Text>
                    ) : (
                      <>
                        <Text style={styles.hoursTimeText}>
                          {formatTime(day.start_time)} - {formatTime(day.end_time)}
                        </Text>
                        {day.consultation_start_time && day.consultation_end_time && (
                          <Text style={styles.consultTimeText}>
                            Consults: {formatTime(day.consultation_start_time)} - {formatTime(day.consultation_end_time)}
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyHours}>
            <MaterialIcons name="schedule" size={32} color={colors.textMuted} />
            <Text style={styles.emptyHoursText}>No working hours set yet</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.editHoursButton}
          onPress={() => setHoursEditorVisible(true)}
        >
          <MaterialIcons name="edit" size={18} color={colors.accent} />
          <Text style={styles.editHoursText}>
            {hasHours ? 'Edit Hours' : 'Set Working Hours'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Working Hours Editor Modal */}
      <Modal
        visible={hoursEditorVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHoursEditorVisible(false)}
      >
        <View style={styles.editorModal}>
          <View style={styles.editorHeader}>
            <Text style={styles.editorTitle}>Working Hours</Text>
            <TouchableOpacity onPress={() => setHoursEditorVisible(false)}>
              <MaterialIcons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.editorSubtitle}>
            Set your default weekly hours. You can still block specific dates on your calendar.
          </Text>
          <ScrollView style={styles.editorScroll} showsVerticalScrollIndicator={false}>
            <WorkingHoursEditor
              initialHours={workingHours}
              onSave={handleSaveHours}
              saving={savingHours}
              artistId={artistId}
            />
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

interface ToggleRowProps {
  title: string;
  description: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}

function ToggleRow({ title, description, value, onToggle }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.labelContainer}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.accentDark }}
        thumbColor={value ? colors.accent : colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },

  // Section headers
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },

  // Toggle rows
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

  // Input rows
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  inputLabel: {
    flex: 1,
    marginRight: 12,
  },
  inputTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  inputDescription: {
    color: colors.textMuted,
    fontSize: 13,
  },
  inputRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  savedFlash: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    width: 100,
  },
  currencySymbol: {
    color: colors.textMuted,
    fontSize: 15,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 8,
  },

  // Duration
  durationRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  durationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  durationChipActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  durationChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  durationChipTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },

  // Working hours display
  hoursDisplay: {
    paddingHorizontal: 16,
    gap: 6,
  },
  hoursDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hoursDayRowOff: {
    opacity: 0.6,
  },
  hoursDayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOn: {
    backgroundColor: colors.success,
  },
  statusDotOff: {
    backgroundColor: colors.textMuted,
  },
  hoursDayName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  hoursDayNameOff: {
    color: colors.textMuted,
  },
  hoursDayRight: {
    alignItems: 'flex-end',
  },
  hoursTimeText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  consultTimeText: {
    color: colors.accent,
    fontSize: 12,
    marginTop: 2,
  },
  dayOffText: {
    color: colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyHours: {
    alignItems: 'center',
    paddingVertical: 24,
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  emptyHoursText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  editHoursButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  editHoursText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },

  // Editor modal
  editorModal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  editorTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  editorSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  editorScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },

  bottomSpacer: {
    height: 120,
  },
});
