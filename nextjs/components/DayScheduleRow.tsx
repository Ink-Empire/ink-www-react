import React from 'react';
import { Box, Typography, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { colors } from '@/styles/colors';

interface TimeOption {
  value: string;
  label: string;
}

export interface DaySchedule {
  active: boolean;
  start: string;
  end: string;
  consultationStart: string | null;
  consultationEnd: string | null;
}

interface DayScheduleRowProps {
  day: string;
  dayName: string;
  dayData: DaySchedule;
  timeOptions: TimeOption[];
  selectStyles: Record<string, any>;
  menuProps: Record<string, any>;
  appliedFeedback: string | null;
  onToggleDay: (day: string) => void;
  onUpdateTime: (day: string, type: 'start' | 'end', value: string) => void;
  onToggleConsultation: (day: string) => void;
  onUpdateConsultationTime: (day: string, type: 'consultationStart' | 'consultationEnd', value: string) => void;
  onCopyToAll: (day: string) => void;
}

export function DayScheduleRow({
  day,
  dayName,
  dayData,
  timeOptions,
  selectStyles,
  menuProps,
  appliedFeedback,
  onToggleDay,
  onUpdateTime,
  onToggleConsultation,
  onUpdateConsultationTime,
  onCopyToAll,
}: DayScheduleRowProps) {
  const isActive = dayData.active;
  const hasConsultWindow = dayData.consultationStart !== null && dayData.consultationEnd !== null;

  // Filter consultation time options to be within working hours
  const consultTimeOptions = timeOptions.filter((opt) => {
    return opt.value >= dayData.start && opt.value <= dayData.end;
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        p: '1rem',
        bgcolor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        transition: 'border-color 0.2s ease',
        opacity: isActive ? 1 : 0.5,
        '&:hover': { borderColor: colors.borderLight },
      }}
    >
      {/* Main row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
        }}
      >
        {/* Toggle Switch */}
        <Box
          onClick={() => onToggleDay(day)}
          sx={{
            width: 44,
            height: 24,
            bgcolor: isActive ? colors.accent : colors.surfaceElevated,
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
            },
          }}
        />

        {/* Day Name */}
        <Typography
          sx={{
            width: '90px',
            fontWeight: 500,
            color: isActive ? colors.textPrimary : colors.textSecondary,
            flexShrink: 0,
          }}
        >
          {dayName}
        </Typography>

        {isActive ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flex: 1,
              justifyContent: { xs: 'flex-start', sm: 'flex-end' },
              flexWrap: 'wrap',
              width: { xs: '100%', sm: 'auto' },
              pl: { xs: '56px', sm: 0 },
            }}
          >
            <Select
              value={dayData.start}
              onChange={(e: SelectChangeEvent) => onUpdateTime(day, 'start', e.target.value)}
              size="small"
              sx={selectStyles}
              MenuProps={menuProps}
            >
              {timeOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>

            <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem' }}>to</Typography>

            <Select
              value={dayData.end}
              onChange={(e: SelectChangeEvent) => onUpdateTime(day, 'end', e.target.value)}
              size="small"
              sx={selectStyles}
              MenuProps={menuProps}
            >
              {timeOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>

            <Box
              component="button"
              onClick={() => onCopyToAll(day)}
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
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {appliedFeedback === day ? 'Applied!' : 'Apply to all'}
            </Box>
          </Box>
        ) : (
          <Typography
            sx={{
              color: colors.textSecondary,
              fontSize: '0.9rem',
              fontStyle: 'italic',
              flex: 1,
              textAlign: { xs: 'left', sm: 'right' },
              pl: { xs: '56px', sm: 0 },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            Day Off
          </Typography>
        )}
      </Box>

      {/* Consultation window row */}
      {isActive && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            pl: { xs: '0', sm: '56px' },
            flexWrap: 'wrap',
          }}
        >
          {/* Consultation toggle */}
          <Box
            onClick={() => onToggleConsultation(day)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 },
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 18,
                bgcolor: hasConsultWindow ? colors.accent : colors.surfaceElevated,
                borderRadius: '9px',
                position: 'relative',
                transition: 'background 0.2s ease',
                flexShrink: 0,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: 14,
                  height: 14,
                  bgcolor: hasConsultWindow ? colors.background : colors.textSecondary,
                  borderRadius: '50%',
                  top: 2,
                  left: 2,
                  transition: 'transform 0.2s ease',
                  transform: hasConsultWindow ? 'translateX(14px)' : 'translateX(0)',
                },
              }}
            />
            <Typography
              sx={{
                fontSize: '0.8rem',
                color: hasConsultWindow ? colors.accent : colors.textSecondary,
                whiteSpace: 'nowrap',
              }}
            >
              Consultation window
            </Typography>
          </Box>

          {/* Consultation time selectors */}
          {hasConsultWindow && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Select
                value={dayData.consultationStart || dayData.start}
                onChange={(e: SelectChangeEvent) =>
                  onUpdateConsultationTime(day, 'consultationStart', e.target.value)
                }
                size="small"
                sx={{ ...selectStyles, minWidth: '95px' }}
                MenuProps={menuProps}
              >
                {consultTimeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>

              <Typography sx={{ color: colors.textSecondary, fontSize: '0.8rem' }}>to</Typography>

              <Select
                value={dayData.consultationEnd || dayData.end}
                onChange={(e: SelectChangeEvent) =>
                  onUpdateConsultationTime(day, 'consultationEnd', e.target.value)
                }
                size="small"
                sx={{ ...selectStyles, minWidth: '95px' }}
                MenuProps={menuProps}
              >
                {consultTimeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
