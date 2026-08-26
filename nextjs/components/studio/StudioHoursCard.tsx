import React from 'react';
import { Box, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { colors } from '@/styles/colors';

interface StudioHoursCardProps {
  studio?: any;
  workingHours?: any;
}

/**
 * Section of the public studio page, extracted so the page and the studio
 * editor render the same markup.
 */
const StudioHoursCard: React.FC<StudioHoursCardProps> = ({
  studio,
  workingHours,
}) => (
  <>
            {/* Hours */}
            <Box sx={{
              bgcolor: colors.surface,
              borderRadius: '12px',
              p: 3,
              border: `1px solid ${colors.border}`
            }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.5rem',
                fontWeight: 500,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <AccessTimeIcon sx={{ color: colors.accent }} />
                Hours
              </Typography>
              {workingHours && workingHours.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, dayIndex) => {
                    const dayHours = workingHours.find((h: any) => h.day_of_week === dayIndex);
                    const isClosed = !dayHours || dayHours.is_day_off;
                    const isToday = new Date().getDay() === dayIndex;
                    const formatTime = (time: string) => {
                      const [hours, minutes] = time.split(':');
                      const h = parseInt(hours);
                      const ampm = h >= 12 ? 'PM' : 'AM';
                      const displayHour = h % 12 || 12;
                      return `${displayHour}:${minutes} ${ampm}`;
                    };
                    const hoursDisplay = isClosed ? 'Closed' : `${formatTime(dayHours.start_time)} - ${formatTime(dayHours.end_time)}`;
                    return (
                      <Box key={dayName} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <Typography sx={{
                          color: isToday ? colors.accent : colors.textSecondary,
                          fontWeight: isToday ? 500 : 400
                        }}>
                          {dayName}
                        </Typography>
                        <Typography sx={{
                          color: isToday ? colors.accent : (isClosed ? colors.textMuted : colors.textPrimary),
                          fontWeight: isToday ? 500 : 400
                        }}>
                          {hoursDisplay}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem' }}>
                  Hours not available. Contact the studio for availability.
                </Typography>
              )}
            </Box>
  </>
);

export default StudioHoursCard;
