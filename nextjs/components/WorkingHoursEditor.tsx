import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { colors } from '@/styles/colors';

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

// Internal schedule format
interface DaySchedule {
  active: boolean;
  start: string;
  end: string;
}

type Schedule = {
  [key: string]: DaySchedule;
};

// External format (API compatible)
export interface WorkingHour {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_day_off: boolean;
  artist_id?: number;
  studio_id?: number;
}

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

// Helper to get time label from value
const getTimeLabel = (value: string): string => {
  const option = TIME_OPTIONS.find(t => t.value === value);
  return option?.label || value;
};

const WorkingHoursEditor: React.FC<WorkingHoursEditorProps> = ({
  initialHours,
  onChange,
  entityId,
  entityType = 'artist',
  infoText = "These are your default weekly hours. You can still block specific dates on your calendar."
}) => {
  // Internal schedule state
  const [schedule, setSchedule] = useState<Schedule>({
    sunday: { active: false, start: '10:00', end: '17:00' },
    monday: { active: true, start: '09:00', end: '17:00' },
    tuesday: { active: true, start: '09:00', end: '17:00' },
    wednesday: { active: true, start: '09:00', end: '17:00' },
    thursday: { active: true, start: '09:00', end: '17:00' },
    friday: { active: true, start: '10:00', end: '18:00' },
    saturday: { active: false, start: '10:00', end: '17:00' },
  });

  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  // Day keys in order
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Initialize from initial hours
  useEffect(() => {
    if (initialHours && initialHours.length > 0) {
      const newSchedule: Schedule = {};
      dayKeys.forEach((day, index) => {
        // API uses 0-6 (0 = Sunday)
        const hourData = initialHours.find(h => h.day_of_week === index);
        if (hourData) {
          const isDayOff = hourData.is_day_off ||
            (hourData.start_time === '00:00:00' && hourData.end_time === '00:00:00');
          newSchedule[day] = {
            active: !isDayOff,
            start: formatTimeForSelect(hourData.start_time),
            end: formatTimeForSelect(hourData.end_time),
          };
        } else {
          // Default values
          const isWeekend = day === 'sunday' || day === 'saturday';
          newSchedule[day] = {
            active: !isWeekend,
            start: '09:00',
            end: '17:00',
          };
        }
      });
      setSchedule(newSchedule);
    }
  }, [initialHours]);

  // Convert schedule to WorkingHour format and notify parent
  const notifyChange = useCallback((newSchedule: Schedule) => {
    const hours: WorkingHour[] = dayKeys.map((day, index) => {
      const dayData = newSchedule[day];
      const idKey = entityType === 'artist' ? 'artist_id' : 'studio_id';
      return {
        day_of_week: index,
        start_time: dayData.active ? `${dayData.start}:00` : '00:00:00',
        end_time: dayData.active ? `${dayData.end}:00` : '00:00:00',
        is_day_off: !dayData.active,
        [idKey]: entityId,
      } as WorkingHour;
    });
    onChange(hours);
  }, [onChange, entityId, entityType]);

  // Toggle a day on/off
  const toggleDay = (day: string) => {
    const newSchedule = {
      ...schedule,
      [day]: { ...schedule[day], active: !schedule[day].active }
    };
    setSchedule(newSchedule);
    notifyChange(newSchedule);
  };

  // Update time
  const updateTime = (day: string, type: 'start' | 'end', value: string) => {
    const newSchedule = {
      ...schedule,
      [day]: { ...schedule[day], [type]: value }
    };
    setSchedule(newSchedule);
    notifyChange(newSchedule);
  };

  // Copy hours from one day to all active days
  const copyToAll = (sourceDay: string) => {
    const source = schedule[sourceDay];
    const newSchedule = { ...schedule };
    dayKeys.forEach(day => {
      if (newSchedule[day].active) {
        newSchedule[day] = { ...newSchedule[day], start: source.start, end: source.end };
      }
    });
    setSchedule(newSchedule);
    notifyChange(newSchedule);

    // Show feedback
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

  // Select styles for time dropdowns
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
          { id: '9to5', label: '9 AM – 5 PM' },
          { id: '10to6', label: '10 AM – 6 PM' },
          { id: '11to7', label: '11 AM – 7 PM' },
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
              bgcolor: '#242424',
              border: `1px solid ${colors.borderLight}`,
              borderRadius: '100px',
              fontSize: '0.8rem',
              color: colors.textSecondary,
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
        {dayKeys.map((day, index) => {
          const dayData = schedule[day];
          const isActive = dayData.active;

          return (
            <Box
              key={day}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                p: '1rem',
                bgcolor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                transition: 'border-color 0.2s ease',
                opacity: isActive ? 1 : 0.5,
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                '&:hover': { borderColor: colors.borderLight }
              }}
            >
              {/* Toggle Switch */}
              <Box
                onClick={() => toggleDay(day)}
                sx={{
                  width: 44,
                  height: 24,
                  bgcolor: isActive ? colors.accent : '#242424',
                  borderRadius: '12px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: 18,
                    height: 18,
                    bgcolor: isActive ? colors.background : colors.textPrimary,
                    borderRadius: '50%',
                    top: 3,
                    left: 3,
                    transition: 'transform 0.2s ease',
                    transform: isActive ? 'translateX(20px)' : 'translateX(0)',
                  }
                }}
              />

              {/* Day Name */}
              <Typography sx={{
                width: '90px',
                fontWeight: 500,
                color: isActive ? colors.textPrimary : colors.textSecondary,
                flexShrink: 0
              }}>
                {DAY_NAMES[index]}
              </Typography>

              {isActive ? (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flex: 1,
                  justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                  flexWrap: 'wrap',
                  width: { xs: '100%', sm: 'auto' },
                  pl: { xs: '56px', sm: 0 }
                }}>
                  {/* Start Time */}
                  <Select
                    value={dayData.start}
                    onChange={(e: SelectChangeEvent) => updateTime(day, 'start', e.target.value)}
                    size="small"
                    sx={selectStyles}
                    MenuProps={menuProps}
                  >
                    {TIME_OPTIONS.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>

                  <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
                    to
                  </Typography>

                  {/* End Time */}
                  <Select
                    value={dayData.end}
                    onChange={(e: SelectChangeEvent) => updateTime(day, 'end', e.target.value)}
                    size="small"
                    sx={selectStyles}
                    MenuProps={menuProps}
                  >
                    {TIME_OPTIONS.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>

                  {/* Apply to All Button */}
                  <Box
                    component="button"
                    onClick={() => copyToAll(day)}
                    sx={{
                      background: 'none',
                      border: 'none',
                      color: colors.accent,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      p: '0.25rem 0.5rem',
                      ml: '0.25rem',
                      whiteSpace: 'nowrap',
                      opacity: { xs: 1, sm: 0 },
                      transition: 'opacity 0.2s ease',
                      '.MuiBox-root:hover &': { opacity: 1 },
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {appliedFeedback === day ? 'Applied!' : 'Apply to all'}
                  </Box>
                </Box>
              ) : (
                <Typography sx={{
                  color: colors.textSecondary,
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  flex: 1,
                  textAlign: { xs: 'left', sm: 'right' },
                  pl: { xs: '56px', sm: 0 },
                  width: { xs: '100%', sm: 'auto' }
                }}>
                  Day Off
                </Typography>
              )}
            </Box>
          );
        })}
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
