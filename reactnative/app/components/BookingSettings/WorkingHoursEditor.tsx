import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';
import type { WorkingHour } from '@inkedin/shared/types';

const TIME_OPTIONS = [
  { value: '06:00', label: '6:00 AM' },
  { value: '06:30', label: '6:30 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '07:30', label: '7:30 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '08:30', label: '8:30 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '09:30', label: '9:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '13:30', label: '1:30 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '14:30', label: '2:30 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '15:30', label: '3:30 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '16:30', label: '4:30 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '17:30', label: '5:30 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '18:30', label: '6:30 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '19:30', label: '7:30 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '20:30', label: '8:30 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '21:30', label: '9:30 PM' },
  { value: '22:00', label: '10:00 PM' },
  { value: '22:30', label: '10:30 PM' },
  { value: '23:00', label: '11:00 PM' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

interface DaySchedule {
  active: boolean;
  start: string;
  end: string;
  consultationStart: string | null;
  consultationEnd: string | null;
}

type Schedule = Record<string, DaySchedule>;

interface WorkingHoursEditorProps {
  initialHours?: WorkingHour[];
  onSave: (hours: WorkingHour[]) => Promise<void>;
  saving: boolean;
  artistId: number;
}

const formatTimeForSelect = (time: string): string => {
  if (!time) return '09:00';
  const parts = time.split(':');
  return `${parts[0]}:${parts[1]}`;
};

const getTimeLabel = (value: string): string => {
  const opt = TIME_OPTIONS.find(t => t.value === value);
  return opt?.label || value;
};

const DEFAULT_SCHEDULE: Schedule = {
  sunday: { active: false, start: '10:00', end: '17:00', consultationStart: null, consultationEnd: null },
  monday: { active: true, start: '09:00', end: '17:00', consultationStart: null, consultationEnd: null },
  tuesday: { active: true, start: '09:00', end: '17:00', consultationStart: null, consultationEnd: null },
  wednesday: { active: true, start: '09:00', end: '17:00', consultationStart: null, consultationEnd: null },
  thursday: { active: true, start: '09:00', end: '17:00', consultationStart: null, consultationEnd: null },
  friday: { active: true, start: '10:00', end: '18:00', consultationStart: null, consultationEnd: null },
  saturday: { active: false, start: '10:00', end: '17:00', consultationStart: null, consultationEnd: null },
};

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function TimePickerModal({ visible, title, selectedValue, onSelect, onClose }: TimePickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={TIME_OPTIONS}
            keyExtractor={item => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.timeOption, item.value === selectedValue && styles.timeOptionSelected]}
                onPress={() => { onSelect(item.value); onClose(); }}
              >
                <Text style={[styles.timeOptionText, item.value === selectedValue && styles.timeOptionTextSelected]}>
                  {item.label}
                </Text>
                {item.value === selectedValue && (
                  <MaterialIcons name="check" size={20} color={colors.accent} />
                )}
              </TouchableOpacity>
            )}
            initialScrollIndex={Math.max(0, TIME_OPTIONS.findIndex(t => t.value === selectedValue) - 2)}
            getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const TIME_PRESETS = [
  { id: '9to5', label: '9 AM - 5 PM' },
  { id: '10to6', label: '10 AM - 6 PM' },
  { id: '11to7', label: '11 AM - 7 PM' },
];

const DAY_PRESETS = [
  { id: 'weekdays', label: 'Weekdays Only' },
  { id: 'alldays', label: 'Every Day' },
];

const detectActivePresets = (s: Schedule): Set<string> => {
  const matched = new Set<string>();
  const activeDays = DAY_KEYS.filter(d => s[d].active);
  const allActiveMatch = (start: string, end: string) =>
    activeDays.length > 0 && activeDays.every(d => s[d].start === start && s[d].end === end);

  if (allActiveMatch('09:00', '17:00')) matched.add('9to5');
  if (allActiveMatch('10:00', '18:00')) matched.add('10to6');
  if (allActiveMatch('11:00', '19:00')) matched.add('11to7');

  const weekdaysOnly = DAY_KEYS.every(d => {
    const isWeekend = d === 'sunday' || d === 'saturday';
    return s[d].active === !isWeekend;
  });
  if (weekdaysOnly) matched.add('weekdays');
  if (DAY_KEYS.every(d => s[d].active)) matched.add('alldays');

  return matched;
};

export default function WorkingHoursEditor({ initialHours, onSave, saving, artistId }: WorkingHoursEditorProps) {
  const [schedule, setSchedule] = useState<Schedule>({ ...DEFAULT_SCHEDULE });
  const [activePresets, setActivePresets] = useState<Set<string>>(() => detectActivePresets(DEFAULT_SCHEDULE));
  const [pickerState, setPickerState] = useState<{ visible: boolean; day: string; field: string; title: string }>({
    visible: false, day: '', field: '', title: '',
  });

  useEffect(() => {
    if (initialHours && initialHours.length > 0) {
      const newSchedule: Schedule = {};
      DAY_KEYS.forEach((day, index) => {
        const hourData = initialHours.find(h => h.day_of_week === index);
        if (hourData) {
          const off = hourData.is_day_off ||
            (hourData.start_time === '00:00:00' && hourData.end_time === '00:00:00');
          newSchedule[day] = {
            active: !off,
            start: formatTimeForSelect(hourData.start_time),
            end: formatTimeForSelect(hourData.end_time),
            consultationStart: hourData.consultation_start_time
              ? formatTimeForSelect(hourData.consultation_start_time) : null,
            consultationEnd: hourData.consultation_end_time
              ? formatTimeForSelect(hourData.consultation_end_time) : null,
          };
        } else {
          const isWeekend = day === 'sunday' || day === 'saturday';
          newSchedule[day] = {
            active: !isWeekend,
            start: '09:00', end: '17:00',
            consultationStart: null, consultationEnd: null,
          };
        }
      });
      setSchedule(newSchedule);
      setActivePresets(detectActivePresets(newSchedule));
    }
  }, [initialHours]);

  const updateSchedule = (newSchedule: Schedule) => {
    setSchedule(newSchedule);
    setActivePresets(detectActivePresets(newSchedule));
  };

  const toggleDay = (day: string) => {
    setSchedule(prev => {
      const next = { ...prev, [day]: { ...prev[day], active: !prev[day].active } };
      setActivePresets(detectActivePresets(next));
      return next;
    });
  };

  const updateTime = (day: string, field: string, value: string) => {
    setSchedule(prev => {
      const next = { ...prev, [day]: { ...prev[day], [field]: value } };
      setActivePresets(detectActivePresets(next));
      return next;
    });
  };

  const toggleConsultation = (day: string) => {
    setSchedule(prev => {
      const dayData = prev[day];
      const hasWindow = dayData.consultationStart !== null;
      if (hasWindow) {
        return { ...prev, [day]: { ...dayData, consultationStart: null, consultationEnd: null } };
      }
      const [h] = dayData.start.split(':').map(Number);
      const defaultEnd = `${String(Math.min(h + 2, parseInt(dayData.end))).padStart(2, '0')}:00`;
      return {
        ...prev,
        [day]: {
          ...dayData,
          consultationStart: dayData.start,
          consultationEnd: defaultEnd <= dayData.end ? defaultEnd : dayData.end,
        },
      };
    });
  };

  const applyPreset = (preset: string) => {
    setSchedule(prev => {
      const next = { ...prev };
      const hasActiveDays = DAY_KEYS.some(d => next[d].active);

      switch (preset) {
        case '9to5':
          if (!hasActiveDays) DAY_KEYS.forEach(d => { next[d] = { ...next[d], active: true }; });
          DAY_KEYS.forEach(d => { if (next[d].active) { next[d] = { ...next[d], start: '09:00', end: '17:00' }; } });
          break;
        case '10to6':
          if (!hasActiveDays) DAY_KEYS.forEach(d => { next[d] = { ...next[d], active: true }; });
          DAY_KEYS.forEach(d => { if (next[d].active) { next[d] = { ...next[d], start: '10:00', end: '18:00' }; } });
          break;
        case '11to7':
          if (!hasActiveDays) DAY_KEYS.forEach(d => { next[d] = { ...next[d], active: true }; });
          DAY_KEYS.forEach(d => { if (next[d].active) { next[d] = { ...next[d], start: '11:00', end: '19:00' }; } });
          break;
        case 'weekdays':
          DAY_KEYS.forEach(d => {
            const isWeekend = d === 'sunday' || d === 'saturday';
            next[d] = { ...next[d], active: !isWeekend };
          });
          break;
        case 'alldays':
          DAY_KEYS.forEach(d => { next[d] = { ...next[d], active: true }; });
          break;
      }

      setActivePresets(detectActivePresets(next));
      return next;
    });
  };

  const openPicker = (day: string, field: string, title: string) => {
    setPickerState({ visible: true, day, field, title });
  };

  const handlePickerSelect = (value: string) => {
    updateTime(pickerState.day, pickerState.field, value);
  };

  const buildWorkingHours = useCallback((): WorkingHour[] => {
    return DAY_KEYS.map((day, index) => {
      const d = schedule[day];
      return {
        day_of_week: index,
        start_time: d.active ? `${d.start}:00` : '00:00:00',
        end_time: d.active ? `${d.end}:00` : '00:00:00',
        consultation_start_time: d.consultationStart ? `${d.consultationStart}:00` : null,
        consultation_end_time: d.consultationEnd ? `${d.consultationEnd}:00` : null,
        is_day_off: !d.active,
        artist_id: artistId,
      } as WorkingHour;
    });
  }, [schedule, artistId]);

  const handleSave = () => {
    onSave(buildWorkingHours());
  };

  const currentPickerValue = pickerState.day && pickerState.field
    ? (schedule[pickerState.day] as any)[pickerState.field] || '09:00'
    : '09:00';

  return (
    <View>
      {/* Quick Set Presets */}
      <Text style={styles.presetsLabel}>Quick Set</Text>
      <View style={styles.presetsRow}>
        {TIME_PRESETS.map(preset => {
          const isActive = activePresets.has(preset.id);
          return (
            <TouchableOpacity
              key={preset.id}
              style={[styles.presetChip, isActive && styles.presetChipActive]}
              onPress={() => applyPreset(preset.id)}
            >
              <Text style={[styles.presetChipText, isActive && styles.presetChipTextActive]}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        {DAY_PRESETS.map(preset => {
          const isActive = activePresets.has(preset.id);
          const hasTimePreset = activePresets.has('9to5') || activePresets.has('10to6') || activePresets.has('11to7');
          const disabled = !hasTimePreset && !isActive;
          return (
            <TouchableOpacity
              key={preset.id}
              style={[styles.presetChip, isActive && styles.presetChipActive, disabled && styles.presetChipDisabled]}
              onPress={() => !disabled && applyPreset(preset.id)}
              disabled={disabled}
            >
              <Text style={[styles.presetChipText, isActive && styles.presetChipTextActive, disabled && styles.presetChipTextDisabled]}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Weekly Schedule */}
      <Text style={styles.weeklyLabel}>Weekly Schedule</Text>
      {DAY_KEYS.map((day, index) => {
        const dayData = schedule[day];
        const hasConsult = dayData.consultationStart !== null;

        return (
          <View key={day} style={[styles.dayRow, !dayData.active && styles.dayRowInactive]}>
            <View style={styles.dayHeader}>
              <Switch
                value={dayData.active}
                onValueChange={() => toggleDay(day)}
                trackColor={{ false: colors.border, true: colors.accentDark }}
                thumbColor={dayData.active ? colors.accent : colors.textMuted}
              />
              <Text style={[styles.dayName, !dayData.active && styles.dayNameInactive]}>
                {DAY_NAMES[index]}
              </Text>
              {!dayData.active && <Text style={styles.dayOffLabel}>Day Off</Text>}
            </View>

            {dayData.active && (
              <View style={styles.timesContainer}>
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Hours</Text>
                  <View style={styles.timeSelectors}>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => openPicker(day, 'start', `${DAY_NAMES[index]} - Start`)}
                    >
                      <Text style={styles.timeButtonText}>{getTimeLabel(dayData.start)}</Text>
                      <MaterialIcons name="arrow-drop-down" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                    <Text style={styles.timeSeparator}>to</Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => openPicker(day, 'end', `${DAY_NAMES[index]} - End`)}
                    >
                      <Text style={styles.timeButtonText}>{getTimeLabel(dayData.end)}</Text>
                      <MaterialIcons name="arrow-drop-down" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.consultToggle} onPress={() => toggleConsultation(day)}>
                  <MaterialIcons
                    name={hasConsult ? 'check-box' : 'check-box-outline-blank'}
                    size={20}
                    color={hasConsult ? colors.accent : colors.textMuted}
                  />
                  <Text style={styles.consultToggleText}>Consultation window</Text>
                </TouchableOpacity>

                {hasConsult && (
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>Consults</Text>
                    <View style={styles.timeSelectors}>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => openPicker(day, 'consultationStart', `${DAY_NAMES[index]} - Consult Start`)}
                      >
                        <Text style={styles.timeButtonText}>{getTimeLabel(dayData.consultationStart!)}</Text>
                        <MaterialIcons name="arrow-drop-down" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                      <Text style={styles.timeSeparator}>to</Text>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => openPicker(day, 'consultationEnd', `${DAY_NAMES[index]} - Consult End`)}
                      >
                        <Text style={styles.timeButtonText}>{getTimeLabel(dayData.consultationEnd!)}</Text>
                        <MaterialIcons name="arrow-drop-down" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.background} />
        ) : (
          <Text style={styles.saveButtonText}>Save Hours</Text>
        )}
      </TouchableOpacity>

      <TimePickerModal
        visible={pickerState.visible}
        title={pickerState.title}
        selectedValue={currentPickerValue}
        onSelect={handlePickerSelect}
        onClose={() => setPickerState(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  presetsLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  presetChipActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  presetChipDisabled: {
    opacity: 0.4,
  },
  presetChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
  },
  presetChipTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  presetChipTextDisabled: {
    color: colors.textMuted,
  },
  weeklyLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  dayRow: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayRowInactive: {
    opacity: 0.6,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  dayNameInactive: {
    color: colors.textMuted,
  },
  dayOffLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  timesContainer: {
    marginTop: 10,
    paddingLeft: 50,
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeLabel: {
    color: colors.textMuted,
    fontSize: 13,
    width: 55,
  },
  timeSelectors: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flex: 1,
  },
  timeButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
    flex: 1,
  },
  timeSeparator: {
    color: colors.textMuted,
    fontSize: 13,
  },
  consultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  consultToggleText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  timeOptionSelected: {
    backgroundColor: colors.accentDim,
  },
  timeOptionText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  timeOptionTextSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
});
