import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Typography,
} from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DigitalClock } from '@mui/x-date-pickers/DigitalClock';
import dayjs, { Dayjs } from 'dayjs';
import { colors } from '@/styles/colors';

interface RescheduleAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (proposedDate: string, proposedStartTime: string, proposedEndTime: string, reason?: string) => Promise<void>;
  clientName?: string;
  recipientLabel?: string;
  currentDate?: string;
  currentStartTime?: string;
  currentEndTime?: string;
}

type ActivePicker = 'date' | 'startTime' | 'endTime' | null;

const calendarSx = {
  bgcolor: colors.background,
  '& .MuiPickersCalendarHeader-label': { color: colors.textPrimary, fontWeight: 600 },
  '& .MuiPickersCalendarHeader-switchViewButton': { color: colors.textSecondary },
  '& .MuiPickersArrowSwitcher-button': { color: colors.textSecondary },
  '& .MuiDayCalendar-weekDayLabel': { color: colors.textMuted },
  '& .MuiPickersDay-root': {
    color: colors.textPrimary,
    '&:hover': { bgcolor: `${colors.accent}25` },
    '&.Mui-selected': {
      bgcolor: colors.accent,
      color: colors.background,
      fontWeight: 600,
      '&:hover': { bgcolor: colors.accentHover },
    },
    '&.MuiPickersDay-today': {
      border: `1px solid ${colors.accent}`,
    },
    '&.Mui-disabled': { color: colors.textMuted },
  },
  '& .MuiPickersYear-yearButton': {
    color: colors.textPrimary,
    '&.Mui-selected': { bgcolor: colors.accent, color: colors.background },
  },
};

const digitalClockSx = {
  maxHeight: 200,
  '& .MuiDigitalClock-item': {
    color: colors.textPrimary,
    '&:hover': { bgcolor: `${colors.accent}25` },
    '&.Mui-selected': {
      bgcolor: colors.accent,
      color: colors.background,
      fontWeight: 600,
      '&:hover': { bgcolor: colors.accentHover },
    },
  },
  '&::-webkit-scrollbar': { width: 6 },
  '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
  '&::-webkit-scrollbar-thumb': { bgcolor: colors.border, borderRadius: 3 },
};

function formatDisplayDate(d: Dayjs): string {
  return d.format('ddd, MMMM D, YYYY');
}

function formatDisplayTime(d: Dayjs): string {
  return d.format('h:mm A');
}

export function RescheduleAppointmentModal({
  open,
  onClose,
  onSubmit,
  clientName,
  recipientLabel = 'client',
  currentDate,
  currentStartTime,
  currentEndTime,
}: RescheduleAppointmentModalProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs().add(1, 'day'));
  const [startTime, setStartTime] = useState<Dayjs>(dayjs().hour(14).minute(0));
  const [endTime, setEndTime] = useState<Dayjs>(dayjs().hour(16).minute(0));
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  useEffect(() => {
    if (open) {
      setSelectedDate(currentDate ? dayjs(currentDate.substring(0, 10)) : dayjs().add(1, 'day'));
      if (currentStartTime) {
        const [h, m] = currentStartTime.split(':').map(Number);
        setStartTime(dayjs().hour(h).minute(m));
      } else {
        setStartTime(dayjs().hour(14).minute(0));
      }
      if (currentEndTime) {
        const [h, m] = currentEndTime.split(':').map(Number);
        setEndTime(dayjs().hour(h).minute(m));
      } else {
        setEndTime(dayjs().hour(16).minute(0));
      }
      setReason('');
      setActivePicker(null);
    }
  }, [open, currentDate, currentStartTime, currentEndTime]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(
        selectedDate.format('YYYY-MM-DD'),
        startTime.format('HH:mm'),
        endTime.format('HH:mm'),
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

  const pickerButtonSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    bgcolor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    p: 1.5,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    '&:hover': { borderColor: colors.accent },
  };

  const activePickerButtonSx = {
    ...pickerButtonSx,
    borderColor: colors.accent,
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            backgroundImage: 'none',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, pt: 2.5, pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UpdateIcon sx={{ color: colors.accent }} />
            <Typography sx={{ fontSize: '1.15rem', fontWeight: 600, color: colors.textPrimary }}>
              Reschedule Appointment
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            disabled={submitting}
            sx={{
              color: colors.textSecondary,
              bgcolor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              width: 36,
              height: 36,
              '&:hover': { color: colors.textPrimary },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 2.5, py: 1 }}>
          <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', mb: 2, lineHeight: 1.5 }}>
            Propose a new date and time{clientName ? ` for ${clientName}` : ''}. They can accept or decline.
          </Typography>

          {/* Date Picker Button */}
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 }}>
            New Date
          </Typography>
          <Box
            onClick={() => setActivePicker(activePicker === 'date' ? null : 'date')}
            sx={activePicker === 'date' ? activePickerButtonSx : pickerButtonSx}
          >
            <EventIcon sx={{ fontSize: 18, color: colors.accent }} />
            <Typography sx={{ fontSize: '0.95rem', color: colors.textPrimary }}>
              {formatDisplayDate(selectedDate)}
            </Typography>
          </Box>

          {/* Inline Date Calendar */}
          {activePicker === 'date' && (
            <Box sx={{
              mt: 1,
              mb: 0.5,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
            }}>
              <DateCalendar
                value={selectedDate}
                onChange={(val) => {
                  if (val) {
                    setSelectedDate(val);
                    setActivePicker(null);
                  }
                }}
                minDate={dayjs()}
                disablePast
                sx={{ ...calendarSx, width: '100%', maxHeight: 300 }}
              />
            </Box>
          )}

          {/* Time Pickers */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 }}>
                Start Time
              </Typography>
              <Box
                onClick={() => setActivePicker(activePicker === 'startTime' ? null : 'startTime')}
                sx={activePicker === 'startTime' ? activePickerButtonSx : pickerButtonSx}
              >
                <ScheduleIcon sx={{ fontSize: 18, color: colors.accent }} />
                <Typography sx={{ fontSize: '0.95rem', color: colors.textPrimary }}>
                  {formatDisplayTime(startTime)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 }}>
                End Time
              </Typography>
              <Box
                onClick={() => setActivePicker(activePicker === 'endTime' ? null : 'endTime')}
                sx={activePicker === 'endTime' ? activePickerButtonSx : pickerButtonSx}
              >
                <ScheduleIcon sx={{ fontSize: 18, color: colors.accent }} />
                <Typography sx={{ fontSize: '0.95rem', color: colors.textPrimary }}>
                  {formatDisplayTime(endTime)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Inline Time Picker */}
          {(activePicker === 'startTime' || activePicker === 'endTime') && (
            <Box sx={{
              mt: 1,
              mb: 0.5,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
              bgcolor: colors.background,
            }}>
              <DigitalClock
                value={activePicker === 'startTime' ? startTime : endTime}
                onChange={(val) => {
                  if (val) {
                    if (activePicker === 'startTime') setStartTime(val);
                    else setEndTime(val);
                    setActivePicker(null);
                  }
                }}
                timeStep={15}
                skipDisabled
                sx={digitalClockSx}
              />
            </Box>
          )}

          {/* Reason */}
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75, mt: 1.5 }}>
            Reason (optional)
          </Typography>
          <TextField
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Let the ${recipientLabel} know why...`}
            fullWidth
            multiline
            rows={2}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: colors.background,
                borderRadius: '8px',
                '& fieldset': { borderColor: colors.border },
                '&:hover fieldset': { borderColor: colors.accent },
                '&.Mui-focused fieldset': { borderColor: colors.accent },
              },
              '& .MuiInputBase-input': { color: colors.textPrimary, fontSize: '0.9rem' },
              '& .MuiInputBase-input::placeholder': { color: colors.textMuted, opacity: 1 },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1.5, gap: 1.5, borderTop: `1px solid ${colors.border}` }}>
          <Button
            onClick={handleClose}
            disabled={submitting}
            sx={{
              flex: 1,
              py: 1.5,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              '&:hover': { borderColor: colors.textSecondary },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              flex: 1,
              py: 1.5,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              bgcolor: colors.accent,
              color: colors.background,
              '&:hover': { bgcolor: colors.accentHover },
              '&.Mui-disabled': { bgcolor: colors.accent, opacity: 0.7, color: colors.background },
            }}
          >
            {submitting ? (
              <CircularProgress size={20} sx={{ color: colors.background }} />
            ) : (
              'Send Reschedule'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default RescheduleAppointmentModal;
