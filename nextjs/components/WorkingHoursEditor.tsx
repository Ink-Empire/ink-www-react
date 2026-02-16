import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { colors } from '@/styles/colors';
import { WorkingHour, isDayOff } from '@inkedin/shared/types';
import { DayScheduleRow } from './DayScheduleRow';
import type { DaySchedule } from './DayScheduleRow';

// Re-export for backwards compatibility
export type { WorkingHour } from '@inkedin/shared/types';

// Time options with AM/PM labels
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

type Schedule = {
  [key: string]: DaySchedule;
};

interface WorkingHoursEditorProps {
  initialHours?: WorkingHour[];
  onChange: (hours: WorkingHour[]) => void;
  entityId?: number;
  entityType?: 'artist' | 'studio';
  infoText?: string;
}

// Helper to convert HH:MM:SS to HH:MM
const formatTimeForSelect = (time: string): string => {
  if (!time) return '09:00';
  const parts = time.split(':');
  return `${parts[0]}:${parts[1]}`;
};

const WorkingHoursEditor: React.FC<WorkingHoursEditorProps> = ({
  initialHours,
  onChange,
  entityId,
  entityType = 'artist',
  infoText = "These are your default weekly hours. You can still block specific dates on your calendar."
}) => {
  const [schedule, setSchedule] = useState<Schedule>({
    sunday: { active: false, start: '10:00', end: '17:00', consultationStart: null, consultationEnd: null },
    monday: { active: true, start: '09:00', end: '17:00', consultationStart: null, consultationEnd: null },
    tuesday: { active: true, start: '09:00', end: '17:00', consultationStart: null, consultationEnd: null },
    wednesday: { active: true, start: '09:00', end: '17:00', consultationStart: null, consultationEnd: null },
    thursday: { active: true, start: '09:00', end: '17:00', consultationStart: null, consultationEnd: null },
    friday: { active: true, start: '10:00', end: '18:00', consultationStart: null, consultationEnd: null },
    saturday: { active: false, start: '10:00', end: '17:00', consultationStart: null, consultationEnd: null },
  });

  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);
  const [activePresets, setActivePresets] = useState<Set<string>>(new Set());

  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Initialize from initial hours
  useEffect(() => {
    if (initialHours && initialHours.length > 0) {
      const newSchedule: Schedule = {};
      dayKeys.forEach((day, index) => {
        const hourData = initialHours.find(h => h.day_of_week === index);
        if (hourData) {
          const isDayOff = hourData.is_day_off ||
            (hourData.start_time === '00:00:00' && hourData.end_time === '00:00:00');
          newSchedule[day] = {
            active: !isDayOff,
            start: formatTimeForSelect(hourData.start_time),
            end: formatTimeForSelect(hourData.end_time),
            consultationStart: hourData.consultation_start_time
              ? formatTimeForSelect(hourData.consultation_start_time)
              : null,
            consultationEnd: hourData.consultation_end_time
              ? formatTimeForSelect(hourData.consultation_end_time)
              : null,
          };
        } else {
          const isWeekend = day === 'sunday' || day === 'saturday';
          newSchedule[day] = {
            active: !isWeekend,
            start: '09:00',
            end: '17:00',
            consultationStart: null,
            consultationEnd: null,
          };
        }
      });
      setSchedule(newSchedule);
      setActivePresets(detectPresets(newSchedule));
    }
  }, [initialHours]);

  // Detect which presets match the current schedule
  const detectPresets = useCallback((s: Schedule): Set<string> => {
    const matched = new Set<string>();
    const activeDays = dayKeys.filter(d => s[d].active);
    const allActiveMatch = (start: string, end: string) =>
      activeDays.length > 0 && activeDays.every(d => s[d].start === start && s[d].end === end);

    if (allActiveMatch('09:00', '17:00')) matched.add('9to5');
    if (allActiveMatch('10:00', '18:00')) matched.add('10to6');
    if (allActiveMatch('11:00', '19:00')) matched.add('11to7');

    const weekdaysOnly = dayKeys.every(d => {
      const isWeekend = d === 'sunday' || d === 'saturday';
      return s[d].active === !isWeekend;
    });
    if (weekdaysOnly) matched.add('weekdays');
    if (dayKeys.every(d => s[d].active)) matched.add('alldays');

    return matched;
  }, []);

  // Convert schedule to WorkingHour format and notify parent
  const notifyChange = useCallback((newSchedule: Schedule) => {
    const hours: WorkingHour[] = dayKeys.map((day, index) => {
      const dayData = newSchedule[day];
      const idKey = entityType === 'artist' ? 'artist_id' : 'studio_id';
      return {
        day_of_week: index,
        start_time: dayData.active ? `${dayData.start}:00` : '00:00:00',
        end_time: dayData.active ? `${dayData.end}:00` : '00:00:00',
        consultation_start_time: dayData.consultationStart ? `${dayData.consultationStart}:00` : null,
        consultation_end_time: dayData.consultationEnd ? `${dayData.consultationEnd}:00` : null,
        is_day_off: !dayData.active,
        [idKey]: entityId,
      } as WorkingHour;
    });
    onChange(hours);
    setActivePresets(detectPresets(newSchedule));
  }, [onChange, entityId, entityType, detectPresets]);

  const toggleDay = (day: string) => {
    const newSchedule = {
      ...schedule,
      [day]: { ...schedule[day], active: !schedule[day].active }
    };
    setSchedule(newSchedule);
    notifyChange(newSchedule);
  };

  const updateTime = (day: string, type: 'start' | 'end', value: string) => {
    const newSchedule = {
      ...schedule,
      [day]: { ...schedule[day], [type]: value }
    };
    setSchedule(newSchedule);
    notifyChange(newSchedule);
  };

  const toggleConsultation = (day: string) => {
    const dayData = schedule[day];
    const hasWindow = dayData.consultationStart !== null;
    const newSchedule = {
      ...schedule,
      [day]: {
        ...dayData,
        consultationStart: hasWindow ? null : dayData.start,
        consultationEnd: hasWindow ? null : (() => {
          // Default: 2 hours after start, capped at end
          const [h] = dayData.start.split(':').map(Number);
          const defaultEnd = `${String(Math.min(h + 2, parseInt(dayData.end))).padStart(2, '0')}:00`;
          return defaultEnd <= dayData.end ? defaultEnd : dayData.end;
        })(),
      },
    };
    setSchedule(newSchedule);
    notifyChange(newSchedule);
  };

  const updateConsultationTime = (day: string, type: 'consultationStart' | 'consultationEnd', value: string) => {
    const newSchedule = {
      ...schedule,
      [day]: { ...schedule[day], [type]: value }
    };
    setSchedule(newSchedule);
    notifyChange(newSchedule);
  };

  const copyToAll = (sourceDay: string) => {
    const source = schedule[sourceDay];
    const newSchedule = { ...schedule };
    dayKeys.forEach(day => {
      if (newSchedule[day].active) {
        newSchedule[day] = {
          ...newSchedule[day],
          start: source.start,
          end: source.end,
          consultationStart: source.consultationStart,
          consultationEnd: source.consultationEnd,
        };
      }
    });
    setSchedule(newSchedule);
    notifyChange(newSchedule);

    setAppliedFeedback(sourceDay);
    setTimeout(() => setAppliedFeedback(null), 1500);
  };

  // Preset schedules
  const setPreset = (preset: string) => {
    const newSchedule = { ...schedule };

    switch (preset) {
      case '9to5':
        dayKeys.forEach(day => {
          if (newSchedule[day].active) {
            newSchedule[day].start = '09:00';
            newSchedule[day].end = '17:00';
          }
        });
        break;
      case '10to6':
        dayKeys.forEach(day => {
          if (newSchedule[day].active) {
            newSchedule[day].start = '10:00';
            newSchedule[day].end = '18:00';
          }
        });
        break;
      case '11to7':
        dayKeys.forEach(day => {
          if (newSchedule[day].active) {
            newSchedule[day].start = '11:00';
            newSchedule[day].end = '19:00';
          }
        });
        break;
      case 'weekdays':
        dayKeys.forEach(day => {
          const isWeekend = day === 'sunday' || day === 'saturday';
          newSchedule[day].active = !isWeekend;
        });
        break;
      case 'alldays':
        dayKeys.forEach(day => {
          newSchedule[day].active = true;
        });
        break;
    }

    setSchedule(newSchedule);
    notifyChange(newSchedule);
  };

  const selectStyles = {
    bgcolor: colors.surface,
    color: colors.textPrimary,
    fontSize: '0.85rem',
    minWidth: '105px',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: colors.borderLight,
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: colors.accent,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: colors.accent,
    },
    '& .MuiSelect-icon': {
      color: colors.textSecondary,
    },
  };

  const menuProps = {
    PaperProps: {
      sx: {
        bgcolor: colors.surface,
        border: `1px solid ${colors.border}`,
        maxHeight: 300,
        '& .MuiMenuItem-root': {
          fontSize: '0.85rem',
          color: colors.textPrimary,
          '&:hover': { bgcolor: colors.background },
          '&.Mui-selected': {
            bgcolor: `${colors.accent}26`,
            '&:hover': { bgcolor: `${colors.accent}33` }
          },
        },
      },
    },
  };

  return (
    <Box>
      {/* Quick Set Presets */}
      <Typography sx={{
        fontSize: '0.8rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: colors.textSecondary,
        mb: '1rem'
      }}>
        Quick Set
      </Typography>

      <Box sx={{ display: 'flex', gap: '0.5rem', mb: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: '9to5', label: '9 AM \u2013 5 PM' },
          { id: '10to6', label: '10 AM \u2013 6 PM' },
          { id: '11to7', label: '11 AM \u2013 7 PM' },
          { id: 'weekdays', label: 'Weekdays Only' },
          { id: 'alldays', label: 'Every Day' },
        ].map(preset => (
          <Box
            key={preset.id}
            component="button"
            onClick={() => setPreset(preset.id)}
            sx={{
              px: '1rem',
              py: '0.5rem',
              bgcolor: activePresets.has(preset.id) ? `${colors.accent}1A` : colors.surfaceElevated,
              border: `1px solid ${activePresets.has(preset.id) ? colors.accent : colors.borderLight}`,
              borderRadius: '100px',
              fontSize: '0.8rem',
              color: activePresets.has(preset.id) ? colors.accent : colors.textSecondary,
              fontWeight: activePresets.has(preset.id) ? 600 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: colors.accent,
                color: colors.accent,
              }
            }}
          >
            {preset.label}
          </Box>
        ))}
      </Box>

      {/* Weekly Schedule */}
      <Typography sx={{
        fontSize: '0.8rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: colors.textSecondary,
        mb: '1rem'
      }}>
        Weekly Schedule
      </Typography>

      {/* Day Rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {dayKeys.map((day, index) => (
          <DayScheduleRow
            key={day}
            day={day}
            dayName={DAY_NAMES[index]}
            dayData={schedule[day]}
            timeOptions={TIME_OPTIONS}
            selectStyles={selectStyles}
            menuProps={menuProps}
            appliedFeedback={appliedFeedback}
            onToggleDay={toggleDay}
            onUpdateTime={updateTime}
            onToggleConsultation={toggleConsultation}
            onUpdateConsultationTime={updateConsultationTime}
            onCopyToAll={copyToAll}
          />
        ))}
      </Box>

      {/* Info Note */}
      {infoText && (
        <Box sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          p: '1rem',
          mt: '1rem',
          bgcolor: `${colors.accent}26`,
          border: `1px solid ${colors.accent}33`,
          borderRadius: '8px'
        }}>
          <Box sx={{ color: colors.accent, flexShrink: 0, mt: '2px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </Box>
          <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, lineHeight: 1.5 }}>
            {infoText}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default WorkingHoursEditor;
