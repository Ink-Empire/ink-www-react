import React from 'react';
import { Box, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { colors } from '@/styles/colors';
import { WorkingHour } from './WorkingHoursModal';

// Time options for converting 24h to 12h format
const TIME_OPTIONS: { [key: string]: string } = {
  '06:00': '6:00 AM',
  '06:30': '6:30 AM',
  '07:00': '7:00 AM',
  '07:30': '7:30 AM',
  '08:00': '8:00 AM',
  '08:30': '8:30 AM',
  '09:00': '9:00 AM',
  '09:30': '9:30 AM',
  '10:00': '10:00 AM',
  '10:30': '10:30 AM',
  '11:00': '11:00 AM',
  '11:30': '11:30 AM',
  '12:00': '12:00 PM',
  '12:30': '12:30 PM',
  '13:00': '1:00 PM',
  '13:30': '1:30 PM',
  '14:00': '2:00 PM',
  '14:30': '2:30 PM',
  '15:00': '3:00 PM',
  '15:30': '3:30 PM',
  '16:00': '4:00 PM',
  '16:30': '4:30 PM',
  '17:00': '5:00 PM',
  '17:30': '5:30 PM',
  '18:00': '6:00 PM',
  '18:30': '6:30 PM',
  '19:00': '7:00 PM',
  '19:30': '7:30 PM',
  '20:00': '8:00 PM',
  '20:30': '8:30 PM',
  '21:00': '9:00 PM',
  '21:30': '9:30 PM',
  '22:00': '10:00 PM',
  '22:30': '10:30 PM',
  '23:00': '11:00 PM',
};

interface WorkingHoursDisplayProps {
  workingHours: WorkingHour[];
  className?: string;
  showEmptyState?: boolean;
}

// Day names for display
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to format time to 12h format
const formatTime = (time: string): string => {
  if (!time) return '';
  const shortTime = time.substring(0, 5);
  return TIME_OPTIONS[shortTime] || shortTime;
};

const WorkingHoursDisplay: React.FC<WorkingHoursDisplayProps> = ({
  workingHours,
  className = '',
  showEmptyState = true
}) => {
  // Check if there are any hours set
  const hasHours = Array.isArray(workingHours) && workingHours.length > 0;

  if (!hasHours && showEmptyState) {
    return (
      <Box sx={{
        textAlign: 'center',
        p: '2rem',
        bgcolor: colors.background,
        borderRadius: '8px',
        border: `1px solid ${colors.border}`
      }}>
        <AccessTimeIcon sx={{ fontSize: 32, color: colors.textSecondary, mb: '0.5rem' }} />
        <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary }}>
          No working hours set yet
        </Typography>
      </Box>
    );
  }

  if (!hasHours) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} className={className}>
      {workingHours.map((day, index) => {
        const isDayOff = day.is_day_off ||
          (day.start_time === '00:00:00' && day.end_time === '00:00:00');

        return (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: '0.875rem 1rem',
              bgcolor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              opacity: isDayOff ? 0.6 : 1,
              transition: 'border-color 0.2s ease',
              '&:hover': { borderColor: colors.borderLight }
            }}
          >
            {/* Status indicator and day name */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Status dot */}
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: isDayOff ? colors.textSecondary : colors.success,
                flexShrink: 0
              }} />
              <Typography sx={{
                fontSize: '0.9rem',
                fontWeight: 500,
                color: isDayOff ? colors.textSecondary : colors.textPrimary
              }}>
                {DAY_NAMES[index % 7]}
              </Typography>
            </Box>

            {/* Hours or Day Off */}
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{
                fontSize: '0.9rem',
                color: colors.textSecondary,
                fontStyle: isDayOff ? 'italic' : 'normal'
              }}>
                {isDayOff ? (
                  'Day Off'
                ) : (
                  `${formatTime(day.start_time)} – ${formatTime(day.end_time)}`
                )}
              </Typography>
              {!isDayOff && day.consultation_start_time && day.consultation_end_time && (
                <Typography sx={{ fontSize: '0.75rem', color: colors.accent, mt: '0.125rem' }}>
                  Consults: {formatTime(day.consultation_start_time)} – {formatTime(day.consultation_end_time)}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default WorkingHoursDisplay;
